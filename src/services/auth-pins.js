const { readDB, writeDB } = require('./db');

function generate4DigitPin() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function normalizePhone(p) {
  if (!p) return '';
  const digits = String(p).replace(/[^0-9]/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

/**
 * Generate or update temp PIN for a phone number
 */
function createTempPin(phone, linkedId = null, linkedType = 'team', email = '') {
  const db = readDB();
  db.authPins = db.authPins || [];

  const rawPhone = (phone || '').trim();
  const norm = normalizePhone(rawPhone);

  const existingIdx = db.authPins.findIndex(p => normalizePhone(p.phone) === norm);

  const pinCode = generate4DigitPin();
  const pinRecord = {
    phone: rawPhone,
    normPhone: norm,
    pin: pinCode,
    isTemp: true,
    linkedId: linkedId,
    linkedType: linkedType, // 'team' or 'client'
    email: email || '',
    createdAt: new Date().toISOString(),
    attempts: 0
  };

  if (existingIdx >= 0) {
    db.authPins[existingIdx] = { ...db.authPins[existingIdx], ...pinRecord };
  } else {
    db.authPins.push(pinRecord);
  }

  writeDB(db);
  return pinRecord;
}

/**
 * Verify phone and PIN
 */
function verifyPin(phone, inputPin) {
  const db = readDB();
  db.authPins = db.authPins || [];
  const norm = normalizePhone(phone);

  const record = db.authPins.find(p => normalizePhone(p.phone) === norm || p.normPhone === norm);
  if (!record) {
    return { success: false, error: 'Phone number not found in authentication system' };
  }

  if (record.attempts >= 5) {
    return { success: false, error: 'Account locked due to too many failed attempts. Please request a new PIN on Telegram.' };
  }

  if (String(record.pin).trim() !== String(inputPin).trim()) {
    record.attempts = (record.attempts || 0) + 1;
    writeDB(db);
    return { success: false, error: `Invalid PIN code. (${5 - record.attempts} attempts remaining)` };
  }

  // Reset failed attempts on success
  record.attempts = 0;
  writeDB(db);

  // Fetch associated user object
  let userObj = null;
  if (record.linkedType === 'team') {
    userObj = (db.team || []).find(t => (t.id === record.linkedId || t.emp_code === record.linkedId || normalizePhone(t.phone) === norm));
  } else {
    userObj = (db.clients || []).find(c => (c.id === record.linkedId || c.clientCode === record.linkedId || normalizePhone(c.phone) === norm));
  }

  return {
    success: true,
    isTemp: record.isTemp,
    linkedType: record.linkedType,
    linkedId: record.linkedId,
    email: record.email || userObj?.email || '',
    user: userObj || { phone: phone, name: 'User' }
  };
}

/**
 * Set permanent PIN for a phone number
 */
function setPermanentPin(phone, newPin, email = '') {
  const db = readDB();
  db.authPins = db.authPins || [];
  const norm = normalizePhone(phone);

  const record = db.authPins.find(p => normalizePhone(p.phone) === norm || p.normPhone === norm);
  if (!record) {
    return { success: false, error: 'Phone number record not found' };
  }

  record.pin = String(newPin).trim();
  record.isTemp = false;
  record.attempts = 0;
  if (email) record.email = email.trim();

  // Also update email in team or client DB if provided
  if (record.linkedType === 'team') {
    const member = (db.team || []).find(t => (t.id === record.linkedId || t.emp_code === record.linkedId || normalizePhone(t.phone) === norm));
    if (member) {
      if (email) member.email = email.trim();
      member.permanentPinSet = true;
    }
  } else {
    const client = (db.clients || []).find(c => (c.id === record.linkedId || c.clientCode === record.linkedId || normalizePhone(c.phone) === norm));
    if (client) {
      if (email) client.email = email.trim();
      client.permanentPinSet = true;
    }
  }

  writeDB(db);
  return { success: true, message: 'Permanent PIN updated successfully!' };
}

module.exports = {
  createTempPin,
  verifyPin,
  setPermanentPin
};
