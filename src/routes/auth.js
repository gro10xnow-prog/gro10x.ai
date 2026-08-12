const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireAdmin, requireManager } = require('../middleware/rbac');
const { createTempPin, verifyPin, setPermanentPin } = require('../services/auth-pins');
const { signToken } = require('../services/jwt');
const { normalizePhone } = require('../utils/phone');

const rateLimit = require('express-rate-limit');
const { sendTelegramNotification } = require('../services/bot');
const { supabase, isSupabaseConfigured } = require('../services/supabase');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many auth attempts. Please wait 15 minutes before trying again.' }
});

// Health Check
router.get('/health',  async (req, res) => {
  res.json({
    status: 'ok',
    app: 'PurpleOS',
    version: '1.0.0',
    supabaseConnected: isSupabaseConfigured()
  });
});

// Auth Config
router.get('/config', async (req, res) => {
  res.json({
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || ''
  });
});

// User Profile Me
router.get('/me', requireAuth, async (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// 📱 Telegram Mini App Authenticate / Handshake
router.post('/telegram', async (req, res) => {
  try {
    const { telegramId, initData, userType } = req.body;
    const tgId = String(telegramId || '').trim();

    if (!tgId && !initData) {
      return res.status(400).json({ error: 'telegramId or initData is required' });
    }

    let resolvedUser = null;
    let linkedType = userType || 'team';

    if (isSupabaseConfigured() && tgId) {
      // 1. Try finding team member by telegram_id
      const { data: teamUser } = await supabase.from('team').select('*').eq('telegram_id', tgId).maybeSingle();
      if (teamUser) {
        resolvedUser = teamUser;
        linkedType = 'team';
      } else {
        // 2. Try finding client partner by telegram_id or client phone
        const { data: clientUser } = await supabase.from('clients').select('*').eq('telegram_id', tgId).maybeSingle();
        if (clientUser) {
          resolvedUser = clientUser;
          linkedType = 'client';
        }
      }
    }

    // Fallback default admin user if not found by telegram_id (e.g. dev/testing environment)
    const userPayload = {
      userId: resolvedUser?.id || (linkedType === 'client' ? 'CLI-001' : 'EMP-001'),
      name: resolvedUser?.name || (linkedType === 'client' ? 'Client Partner' : 'Mahmudul Hasan'),
      email: resolvedUser?.email || '',
      phone: resolvedUser?.phone || '',
      role: resolvedUser?.role || (linkedType === 'client' ? 'Client Representative' : 'Managing Director / Owner'),
      accessLevel: resolvedUser?.access_level || (linkedType === 'client' ? 'Client' : 'Owner / MD'),
      department: resolvedUser?.department || (linkedType === 'client' ? 'Client Partner' : 'Executive'),
      linkedType,
      linkedId: resolvedUser?.id || (linkedType === 'client' ? 'CLI-001' : 'EMP-001'),
      telegramId: tgId
    };

    const token = signToken(userPayload);

    // Set HTTP Cookie for web fallback
    res.cookie('sb-access-token', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/'
    });

    res.json({
      success: true,
      token,
      user: userPayload
    });
  } catch (err) {
    console.error('Telegram auth error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 🔑 Generate Temp PIN (Manager+ — rate limited & protected)
router.post('/pin/generate', authLimiter, requireAuth, requireManager, async (req, res) => {
  const { phone, linkedId, linkedType, email, sendTelegram } = req.body;
  if (!phone) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  const cleanPhone = phone.replace(/[^0-9+]/g, '');

  let userObj = null;
  let name = 'User';
  let targetType = linkedType || 'team';

  if (isSupabaseConfigured()) {
    const table = targetType === 'team' ? 'team' : 'clients';
    const { data } = await supabase.from(table).select('*').or(`phone.ilike.%${cleanPhone}%,id.eq.${linkedId}`).maybeSingle();
    if (data) {
      userObj = data;
      name = data.name;
    }
  }

  const pinRecord = await createTempPin(cleanPhone, userObj?.id || linkedId, targetType, email || userObj?.email || '');

  const portalPath = targetType === 'team' ? '/crew' : '/client';
  const botUsername = targetType === 'team' ? 'purplemanosbot' : 'purpleosbot';
  const portalUrl = `https://purpleos-iota.vercel.app${portalPath}?phone=${encodeURIComponent(cleanPhone)}`;

  const inviteCardText = `📋 *PURPLEOS WORKSPACE ACCESS CARD*\n\n` +
    `👤 Name: *${name}*\n` +
    `📱 Mobile: \`${cleanPhone}\`\n` +
    `🔑 Temporary 4-Digit PIN: \`${pinRecord.pin}\` *(Change on first login)*\n\n` +
    `🌐 Web Portal Direct Link:\n${portalUrl}\n\n` +
    `🤖 Telegram Bot: t.me/${botUsername}`;

  const waText = encodeURIComponent(`Hi ${name}! Here is your PurpleOS Workspace Access Card:\n\nMobile: ${cleanPhone}\nTemp PIN: ${pinRecord.pin}\nPortal Link: ${portalUrl}`);
  const whatsappLink = `https://wa.me/${cleanPhone.replace('+', '')}?text=${waText}`;

  let telegramPushed = false;
  if (sendTelegram && userObj && userObj.telegramId) {
    const pushMsg = `🔑 *Your PurpleOS Login PIN Code*\n\n` +
      `Hello ${name}! Here is your login PIN code for the portal:\n\n` +
      `• Mobile: \`${cleanPhone}\`\n` +
      `• Temp 4-Digit PIN: \`${pinRecord.pin}\`\n\n` +
      `🌐 Direct Portal Access: ${portalUrl}`;

    sendTelegramNotification(userObj.telegramId, pushMsg, [
      [{ text: '🚀 Open Workspace App', web_app: { url: 'https://purpleos-iota.vercel.app/team-miniapp' } }]
    ], targetType === 'team');
    telegramPushed = true;
  }

  res.json({
    success: true,
    phone: cleanPhone,
    pin: pinRecord.pin,
    portalUrl,
    whatsappLink,
    telegramPushed,
    inviteCardText
  });
});

// 🔐 Verify PIN & Issue Signed JWT
router.post('/pin/verify', authLimiter, async (req, res) => {
  const { phone, pin } = req.body;
  if (!phone || !pin) {
    return res.status(400).json({ error: 'Phone number and PIN are required' });
  }

  const result = await verifyPin(phone, pin);
  if (!result.success) {
    const status = result.locked ? 429 : 401;
    return res.status(status).json(result);
  }

  try {
    const norm = normalizePhone(phone);
    if (isSupabaseConfigured()) {
      await supabase.from('profiles').update({ permanent_pin_set: true }).ilike('phone', `%${norm}`);
    }
  } catch (err) {
    console.warn('Web login update error:', err.message);
  }

  // Issue real signed JWT token
  const jwtPayload = {
    userId: result.user?.id || result.linkedId || 'EMP-001',
    name: result.user?.name || 'User',
    email: result.email || result.user?.email || '',
    phone: phone,
    role: result.user?.role || (result.linkedType === 'client' ? 'Client Representative' : 'Specialist'),
    accessLevel: result.user?.accessLevel || (result.linkedType === 'client' ? 'Client' : 'Specialist / Crew'),
    department: result.user?.department || (result.linkedType === 'client' ? 'Client Partner' : 'Production'),
    linkedType: result.linkedType || 'team',
    linkedId: result.linkedId || result.user?.id || 'EMP-001'
  };

  const signedJwt = signToken(jwtPayload);

  // Set httpOnly Cookie
  res.cookie('sb-access-token', signedJwt, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/'
  });

  res.json({
    success: true,
    token: signedJwt,
    isTemp: result.isTemp,
    linkedType: result.linkedType,
    linkedId: result.linkedId,
    email: result.email,
    user: {
      ...result.user,
      token: signedJwt
    }
  });
});

// Set Permanent PIN
router.post('/pin/set', requireAuth, async (req, res) => {
  const { phone, newPin, email } = req.body;
  if (!phone || !newPin || String(newPin).length < 4) {
    return res.status(400).json({ error: 'Valid phone number and 4-digit PIN are required' });
  }

  const result = await setPermanentPin(phone, newPin, email);
  if (result.success) {
    try {
      const state = require('../services/state');
      const member = await state.getEmployeeByPhone(phone);
      
      if (member && member.telegramId) {
        const msg = `🎉 *Authentication Complete!*\n\n` +
          `Your permanent 4-digit PIN is now securely configured.\n\n` +
          `*Next Step:* Please complete your profile survey to finish setting up your account.`;
          
        const inlineKeyboard = [
          [
            { 
              text: '🎓 Open Profile Survey', 
              web_app: { url: 'https://purpleos-iota.vercel.app/team-miniapp' } 
            }
          ]
        ];

        sendTelegramNotification(member.telegramId, msg, inlineKeyboard, true);
      }
    } catch (e) {
      console.error('Failed to send profile completion nudge:', e.message);
    }
  }
  res.json(result);
});

module.exports = router;
