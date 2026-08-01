const { readDB, writeDB } = require('./db');
const { supabase, isSupabaseConfigured } = require('./supabase');

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function normalizePhone(p) {
  if (!p) return '';
  const digits = String(p).replace(/[^0-9]/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

function getDeterministicPin(phone) {
  const norm = normalizePhone(phone);
  if (!norm) return '1234';
  const todayStr = new Date().toISOString().split('T')[0];
  let hash = 0;
  const str = norm + '_' + todayStr + '_purple_secret_key';
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const code = (Math.abs(hash) % 9000) + 1000;
  return String(code);
}

function generate4DigitPin(phone = '') {
  if (phone) return getDeterministicPin(phone);
  return String(Math.floor(1000 + Math.random() * 9000));
}

// ─────────────────────────────────────────────────────────────
// Supabase persistence layer (primary on Vercel / production)
// Falls back to db.json for local dev / when Supabase is not set
// ─────────────────────────────────────────────────────────────

async function findPinRecordSupabase(norm) {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase
      .from('auth_pins')
      .select('*')
      .eq('norm_phone', norm)
      .maybeSingle();
    return (error || !data) ? null : data;
  } catch (e) {
    return null;
  }
}

async function upsertPinRecordSupabase(record) {
  if (!isSupabaseConfigured()) return false;
  try {
    const payload = {
      phone: record.phone,
      norm_phone: record.normPhone,
      pin: record.pin,
      is_temp: record.isTemp,
      linked_id: record.linkedId,
      linked_type: record.linkedType,
      email: record.email || '',
      attempts: record.attempts || 0,
      locked_at: record.lockedAt || record.locked_at || null
    };
    const { error } = await supabase
      .from('auth_pins')
      .upsert(payload, { onConflict: 'norm_phone' });
    return !error;
  } catch (e) {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────
// createTempPin — Generate or update PIN for a phone number
// ─────────────────────────────────────────────────────────────

async function createTempPin(phone, linkedId = null, linkedType = 'team', email = '') {
  const rawPhone = (phone || '').trim();
  const norm = normalizePhone(rawPhone);
  const pinCode = getDeterministicPin(rawPhone);

  const pinRecord = {
    phone: rawPhone,
    normPhone: norm,
    pin: pinCode,
    isTemp: true,
    linkedId,
    linkedType,
    email: email || '',
    createdAt: new Date().toISOString(),
    attempts: 0
  };

  // Persist to Supabase (survives Vercel cold starts)
  const saved = await upsertPinRecordSupabase(pinRecord);

  // Always also write to local db.json as fallback
  try {
    const db = readDB();
    db.authPins = db.authPins || [];
    const existingIdx = db.authPins.findIndex(p =>
      normalizePhone(p.phone) === norm || p.normPhone === norm
    );
    if (existingIdx >= 0) {
      db.authPins[existingIdx] = { ...db.authPins[existingIdx], ...pinRecord };
    } else {
      db.authPins.push(pinRecord);
    }
    writeDB(db);
  } catch (e) { /* local fallback best-effort */ }

  return pinRecord;
}

// ─────────────────────────────────────────────────────────────
// verifyPin — Verify phone + PIN, returns user info on success
// ─────────────────────────────────────────────────────────────

async function verifyPin(phone, inputPin) {
  const norm = normalizePhone(phone);
  const db = readDB();

  // Find user in team or client roster
  let userObj = (db.team || []).find(t =>
    normalizePhone(t.phone) === norm || t.id === phone
  );
  let linkedType = 'team';

  if (!userObj) {
    userObj = (db.clients || []).find(c =>
      normalizePhone(c.phone) === norm || c.id === phone
    );
    linkedType = 'client';
  }

  // ── Try Supabase first (persistent across cold starts) ──
  let record = await findPinRecordSupabase(norm);

  // ── Fall back to local db.json ──
  if (!record) {
    const localRecord = (db.authPins || []).find(p =>
      normalizePhone(p.phone) === norm || p.normPhone === norm
    );
    if (localRecord) record = localRecord;
  }

  if (!record && !userObj) {
    return { success: false, error: 'Phone number not found in employee or client database.' };
  }

  // If record is missing but user exists, create PIN dynamically
  if (!record && userObj) {
    record = await createTempPin(
      userObj.phone,
      userObj.id || userObj.emp_code,
      linkedType,
      userObj.email || ''
    );
  }

  // ── Brute Force Lockout Guard (5 attempts -> 15 min lock) ──
  const MAX_ATTEMPTS = 5;
  const LOCKOUT_MINUTES = 15;

  if (record && (record.attempts || 0) >= MAX_ATTEMPTS) {
    const lockTimeStr = record.lockedAt || record.locked_at || record.updatedAt || record.createdAt;
    const lockedAt = lockTimeStr ? new Date(lockTimeStr) : new Date();
    const minutesPassed = (Date.now() - lockedAt.getTime()) / 60000;

    if (minutesPassed < LOCKOUT_MINUTES) {
      const remainingMin = Math.ceil(LOCKOUT_MINUTES - minutesPassed);
      return {
        success: false,
        locked: true,
        error: `Account temporarily locked due to multiple failed attempts. Please try again in ${remainingMin} minute(s).`
      };
    } else {
      // Auto-unlock after 15 minutes
      record.attempts = 0;
      record.lockedAt = null;
      record.locked_at = null;
    }
  }

  const cleanInput = String(inputPin).trim();
  const validPin = String(record ? record.pin || record.pin : '').trim();
  const deterministicPin = getDeterministicPin(phone);
  const permPin = userObj
    ? String(userObj.permanentPin || userObj.pin || '').trim()
    : '';

  // Emergency master override — ONLY active when explicitly set via server env var
  // Must be 6+ digits. Leave MASTER_OVERRIDE_PIN unset to disable entirely.
  const masterOverride = process.env.MASTER_OVERRIDE_PIN;
  const isMasterPin =
    masterOverride && masterOverride.length >= 6 && cleanInput === masterOverride;

  const isValid =
    cleanInput === validPin ||
    cleanInput === deterministicPin ||
    (permPin && cleanInput === permPin) ||
    isMasterPin;

  if (!isValid) {
    // Increment failed attempts
    const newAttempts = (record?.attempts || 0) + 1;
    let lockedAt = record?.lockedAt || record?.locked_at;
    if (newAttempts >= MAX_ATTEMPTS && !lockedAt) {
      lockedAt = new Date().toISOString();
    }

    if (record) {
      record.attempts = newAttempts;
      record.lockedAt = lockedAt;
      record.locked_at = lockedAt;
      await upsertPinRecordSupabase(record);
      try {
        const db2 = readDB();
        const localIdx = (db2.authPins || []).findIndex(p =>
          normalizePhone(p.phone) === norm || p.normPhone === norm
        );
        if (localIdx >= 0) {
          db2.authPins[localIdx].attempts = newAttempts;
          db2.authPins[localIdx].lockedAt = lockedAt;
          writeDB(db2);
        }
      } catch (e) {}
    }
    return { success: false, error: 'Invalid 4-Digit PIN. Check Telegram DM for your PIN.' };
  }

  // Reset failed attempts on success
  if (record) {
    record.attempts = 0;
    record.lockedAt = null;
    record.locked_at = null;
    await upsertPinRecordSupabase(record);
  }

  return {
    success: true,
    isTemp: record ? (record.isTemp ?? record.is_temp ?? false) : false,
    linkedType: record ? (record.linkedType || record.linked_type || linkedType) : linkedType,
    linkedId: record ? (record.linkedId || record.linked_id || userObj?.id) : userObj?.id,
    email: record?.email || userObj?.email || '',
    user: userObj || { phone, name: 'User', role: 'Team Member' }
  };
}

// ─────────────────────────────────────────────────────────────
// setPermanentPin — Set or upgrade to a permanent PIN
// ─────────────────────────────────────────────────────────────

async function setPermanentPin(phone, newPin, email = '') {
  const norm = normalizePhone(phone);
  const db = readDB();

  // Find existing record (Supabase first, then local)
  let record = await findPinRecordSupabase(norm);
  if (!record) {
    record = (db.authPins || []).find(p =>
      normalizePhone(p.phone) === norm || p.normPhone === norm
    );
  }

  if (!record) {
    // Try to auto-create from team roster
    const userObj = (db.team || []).find(t => normalizePhone(t.phone) === norm);
    if (userObj) {
      record = await createTempPin(
        userObj.phone,
        userObj.id,
        'team',
        email || userObj.email
      );
    } else {
      return { success: false, error: 'Phone number record not found in system' };
    }
  }

  const updatedRecord = {
    phone: record.phone || phone,
    normPhone: record.normPhone || record.norm_phone || norm,
    pin: String(newPin).trim(),
    isTemp: false,
    linkedId: record.linkedId || record.linked_id,
    linkedType: record.linkedType || record.linked_type || 'team',
    email: email || record.email || '',
    attempts: 0
  };

  // Persist to Supabase
  await upsertPinRecordSupabase(updatedRecord);

  // Update local db.json
  try {
    const db2 = readDB();
    const localIdx = (db2.authPins || []).findIndex(p =>
      normalizePhone(p.phone) === norm || p.normPhone === norm
    );
    if (localIdx >= 0) {
      db2.authPins[localIdx] = { ...db2.authPins[localIdx], ...updatedRecord };
    } else {
      db2.authPins = db2.authPins || [];
      db2.authPins.push(updatedRecord);
    }

    // Also update email + permanentPinSet in team/client records
    const linkedType = updatedRecord.linkedType;
    if (linkedType === 'team') {
      const member = (db2.team || []).find(t =>
        t.id === updatedRecord.linkedId ||
        t.emp_code === updatedRecord.linkedId ||
        normalizePhone(t.phone) === norm
      );
      if (member) {
        if (email) member.email = email.trim();
        member.permanentPinSet = true;
      }
    } else {
      const client = (db2.clients || []).find(c =>
        c.id === updatedRecord.linkedId ||
        normalizePhone(c.phone) === norm
      );
      if (client) {
        if (email) client.email = email.trim();
        client.permanentPinSet = true;
      }
    }

    writeDB(db2);
  } catch (e) {}

  return { success: true, message: 'Permanent PIN updated successfully!' };
}

module.exports = {
  createTempPin,
  verifyPin,
  setPermanentPin,
  normalizePhone,
  getDeterministicPin
};
