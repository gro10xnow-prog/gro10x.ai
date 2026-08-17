const { supabase, isSupabaseConfigured } = require('./supabase');
const { normalizePhone } = require('../utils/phone');

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

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
// Supabase persistence layer
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

  await upsertPinRecordSupabase(pinRecord);
  return pinRecord;
}

// ─────────────────────────────────────────────────────────────
// Multi-POC Client Resolver: searches clients.phone AND clients.pocs[]
// ─────────────────────────────────────────────────────────────

async function findClientAndPocByPhone(phone) {
  if (!isSupabaseConfigured() || !phone) return null;
  const norm = normalizePhone(phone);
  if (!norm) return null;
  const last10 = norm.slice(-10);

  try {
    // 1. Direct query on top-level client phone/whatsapp
    const { data: directClients } = await supabase
      .from('clients')
      .select('id,name,phone,email,contact_person,pocs,category,status')
      .or(`phone.ilike.%${last10},whatsapp.ilike.%${last10}`);

    if (directClients && directClients.length > 0) {
      for (const client of directClients) {
        const pocs = Array.isArray(client.pocs) ? client.pocs : [];
        const matchedPoc = pocs.find(p => p.phone && normalizePhone(p.phone).slice(-10) === last10);
        return {
          client,
          poc: matchedPoc || {
            id: 'poc_primary',
            name: client.contact_person || client.name,
            role: 'Primary POC',
            phone: client.phone,
            email: client.email
          },
          isPrimary: !matchedPoc || Boolean(matchedPoc.isPrimary)
        };
      }
    }

    // 2. Full scan of clients.pocs array across all clients
    const { data: allClients } = await supabase
      .from('clients')
      .select('id,name,phone,email,contact_person,pocs,category,status');

    if (allClients && allClients.length > 0) {
      for (const client of allClients) {
        const pocs = Array.isArray(client.pocs) ? client.pocs : [];
        const matchedPoc = pocs.find(p => p.phone && normalizePhone(p.phone).slice(-10) === last10);
        if (matchedPoc) {
          return {
            client,
            poc: matchedPoc,
            isPrimary: Boolean(matchedPoc.isPrimary)
          };
        }
      }
    }
  } catch (err) {
    console.warn('findClientAndPocByPhone error:', err.message);
  }
  return null;
}

// ─────────────────────────────────────────────────────────────
// verifyPin — Verify phone + PIN, returns user info on success
// ─────────────────────────────────────────────────────────────

async function verifyPin(phone, inputPin, requestedPortal = null) {
  const norm = normalizePhone(phone);

  let record = await findPinRecordSupabase(norm);
  let userObj = null;
  let linkedType = requestedPortal === 'client' ? 'client' : (record ? (record.linked_type || record.linkedType || 'team') : 'team');
  const targetId = record ? (record.linked_id || record.linkedId) : null;

  if (isSupabaseConfigured()) {
    try {
      if (linkedType === 'client' || requestedPortal === 'client' || (targetId && String(targetId).startsWith('CLI-'))) {
        const clientMatch = await findClientAndPocByPhone(norm);

        if (clientMatch) {
          const { client, poc } = clientMatch;
          userObj = {
            id: client.id,
            pocId: poc.id || 'poc_1',
            name: poc.name || client.name,
            pocRole: poc.role || 'Authorized POC',
            company: client.name,
            phone: poc.phone || client.phone,
            email: poc.email || client.email || '',
            role: 'Client Representative',
            accessLevel: 'Client Partner',
            department: client.category || 'Client Partner'
          };
          linkedType = 'client';
        }
      } else {
        let pQuery = supabase.from('profiles').select('emp_code,name,role,phone,email,access_level,onboarding_complete,telegram_id');
        if (targetId) pQuery = pQuery.eq('emp_code', targetId);
        else pQuery = pQuery.ilike('phone', `%${norm}`);
        const { data: profile } = await pQuery.maybeSingle();

        if (profile) {
          userObj = {
            id: profile.emp_code,
            emp_code: profile.emp_code,
            name: profile.name,
            role: profile.role,
            phone: profile.phone,
            email: profile.email,
            accessLevel: profile.access_level
          };
          linkedType = 'team';
        }
      }

      // Fallback if not found under initial linkedType assumption
      if (!userObj) {
        if (requestedPortal !== 'client') {
          const { data: profile } = await supabase.from('profiles').select('emp_code,name,role,phone,email,access_level').ilike('phone', `%${norm}`).maybeSingle();
          if (profile) {
            userObj = { id: profile.emp_code, emp_code: profile.emp_code, name: profile.name, role: profile.role, phone: profile.phone, email: profile.email, accessLevel: profile.access_level };
            linkedType = 'team';
          }
        }
        
        if (!userObj) {
          const clientMatch = await findClientAndPocByPhone(norm);
          if (clientMatch) {
            const { client, poc } = clientMatch;
            userObj = {
              id: client.id,
              pocId: poc.id || 'poc_1',
              name: poc.name || client.name,
              pocRole: poc.role || 'Authorized POC',
              company: client.name,
              phone: poc.phone || client.phone,
              email: poc.email || client.email || '',
              role: 'Client Representative',
              accessLevel: 'Client Partner',
              department: client.category || 'Client Partner'
            };
            linkedType = 'client';
          }
        }
      }
    } catch (e) {
      console.warn('verifyPin lookup error:', e.message);
    }
  }

  if (!record && !userObj) {
    return { success: false, error: 'Phone number not found in employee or client database.' };
  }

  if (!record && userObj) {
    record = await createTempPin(
      userObj.phone,
      userObj.id || userObj.emp_code,
      linkedType,
      userObj.email || ''
    );
  }

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

  const masterOverride = process.env.MASTER_OVERRIDE_PIN;
  const isMasterPin =
    masterOverride && masterOverride.length >= 6 && cleanInput === masterOverride;

  const isValid =
    cleanInput === validPin ||
    cleanInput === deterministicPin ||
    (permPin && cleanInput === permPin) ||
    isMasterPin;

  if (!isValid) {
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
    }
    return { success: false, error: 'Invalid 4-Digit PIN. Check Telegram DM for your PIN.' };
  }

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

  let record = await findPinRecordSupabase(norm);

  if (!record) {
    const state = require('./state');
    const userObj = await state.getEmployeeByPhone(phone);
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

  await upsertPinRecordSupabase(updatedRecord);

  if (email && isSupabaseConfigured()) {
    try {
      await supabase.from('profiles').update({ email: email.trim() }).eq('phone', phone);
    } catch (e) {}
  }

  return { success: true, message: 'Permanent PIN updated successfully!' };
}

module.exports = {
  createTempPin,
  verifyPin,
  setPermanentPin,
  normalizePhone,
  getDeterministicPin,
  findClientAndPocByPhone
};
