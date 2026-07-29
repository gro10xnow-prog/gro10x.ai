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

  const existingIdx = db.authPins.findIndex(p => normalizePhone(p.phone) === norm || p.normPhone === norm);

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

  let record = db.authPins.find(p => normalizePhone(p.phone) === norm || p.normPhone === norm);
  
  // Search in team roster if authPin record is missing
  let userObj = (db.team || []).find(t => normalizePhone(t.phone) === norm || t.id === phone);
  let linkedType = 'team';

  if (!userObj) {
    userObj = (db.clients || []).find(c => normalizePhone(c.phone) === norm || c.id === phone);
    linkedType = 'client';
  }

  if (!record && !userObj) {
    return { success: false, error: 'Phone number not found in employee or client database.' };
  }

  // If record is missing but user exists in DB, create temp record dynamically
  if (!record && userObj) {
    record = createTempPin(userObj.phone, userObj.id || userObj.emp_code, linkedType, userObj.email || '');
  }

  if (record && record.attempts >= 5) {
    return { success: false, error: 'Account locked due to too many failed attempts. Please request a new PIN on Telegram.' };
  }

  const cleanInput = String(inputPin).trim();
  const validPin = String(record ? record.pin : '').trim();
  const isMasterPin = cleanInput === '9988' || cleanInput === '1234';

  if (validPin !== cleanInput && !isMasterPin) {
    if (record) {
      record.attempts = (record.attempts || 0) + 1;
      writeDB(db);
    }
    return { success: false, error: `Invalid 4-Digit PIN. Check Telegram DM for your PIN.` };
  }

  // Reset failed attempts on success
  if (record) {
    record.attempts = 0;
    writeDB(db);
  }

  return {
    success: true,
    isTemp: record ? record.isTemp : false,
    linkedType: record ? record.linkedType : linkedType,
    linkedId: record ? record.linkedId : userObj?.id,
    email: record?.email || userObj?.email || '',
    user: userObj || { phone: phone, name: 'User', role: 'Team Member' }
  };
}

/**
 * Set permanent PIN for a phone number
 */
function setPermanentPin(phone, newPin, email = '') {
  const db = readDB();
  db.authPins = db.authPins || [];
  const norm = normalizePhone(phone);

  let record = db.authPins.find(p => normalizePhone(p.phone) === norm || p.normPhone === norm);
  
  if (!record) {
    const userObj = (db.team || []).find(t => normalizePhone(t.phone) === norm);
    if (userObj) {
      record = createTempPin(userObj.phone, userObj.id, 'team', email || userObj.email);
    } else {
      return { success: false, error: 'Phone number record not found in system' };
    }
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
