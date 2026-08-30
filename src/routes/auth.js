const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireAdmin, requireManager } = require('../middleware/rbac');
const { createTempPin, verifyPin, setPermanentPin, findClientAndPocByPhone } = require('../services/auth-pins');
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

const pinVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many PIN verification attempts. Please wait 15 minutes before trying again.' }
});

// Health Check
router.get('/health',  async (req, res) => {
  res.json({
    status: 'ok',
    app: 'GRO10X',
    version: '2.0.0',
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
  const u = req.user || {};
  const prof = u.profile || {};
  const empCode = u.emp_code || u.empCode || u.linkedId || prof.emp_code || prof.empCode || u.id;
  const name = u.name || prof.name || 'Crew Member';

  res.json({
    success: true,
    user: {
      ...u,
      id: u.id || empCode,
      emp_code: empCode,
      empCode: empCode,
      name: name,
      role: u.role || prof.role || 'Specialist',
      accessLevel: u.accessLevel || u.access_level || prof.accessLevel || prof.access_level || 'Specialist / Crew',
      department: u.department || prof.department || 'Production',
      profile: {
        ...prof,
        emp_code: empCode,
        name: name
      }
    }
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

    if (tgId) {
      if (isSupabaseConfigured()) {
        // 1. Try finding team member by telegram_id
        const { data: teamUser } = await supabase.from('profiles').select('*').eq('telegram_id', tgId).maybeSingle();
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

      // 3. Fallback to state service
      if (!resolvedUser) {
        try {
          const state = require('../services/state');
          const emp = await state.getEmployeeByTelegramId(tgId);
          if (emp) {
            resolvedUser = {
              id: emp.id || emp.emp_code,
              emp_code: emp.emp_code || emp.id,
              name: emp.name,
              role: emp.role,
              phone: emp.phone,
              email: emp.email,
              access_level: emp.accessLevel,
              department: emp.department
            };
            linkedType = 'team';
          }
        } catch (e) {}
      }
    }

    // Reject unlinked users in production or strict auth mode
    if (!resolvedUser) {
      if (process.env.NODE_ENV === 'production' || process.env.FORCE_SUPABASE === 'true' || req.headers['x-disable-dev-auth'] === 'true') {
        return res.status(404).json({ error: 'No account linked to this Telegram account. Please link your phone number first.' });
      }
    }

    // Fallback default user for local development only
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
  const { phone, linkedId, linkedType, email, sendTelegram, contactName, pocRole } = req.body;
  if (!phone) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  const cleanPhone = phone.replace(/[^0-9+]/g, '');

  let userObj = null;
  let name = contactName || 'User';
  let companyName = 'Client Partner';
  let roleTitle = pocRole || 'Authorized Representative';
  let targetType = linkedType || 'team';

  if (isSupabaseConfigured()) {
    if (targetType === 'client' || (linkedId && String(linkedId).startsWith('CLI-'))) {
      const clientMatch = await findClientAndPocByPhone(cleanPhone);
      if (clientMatch) {
        userObj = clientMatch.client;
        companyName = clientMatch.client.name;
        name = contactName || clientMatch.poc.name || clientMatch.client.contact_person || clientMatch.client.name;
        roleTitle = pocRole || clientMatch.poc.role || 'Authorized Representative';
        targetType = 'client';
      } else if (linkedId) {
        const { data: directClient } = await supabase.from('clients').select('*').eq('id', linkedId).maybeSingle();
        if (directClient) {
          userObj = directClient;
          companyName = directClient.name;
          name = contactName || directClient.contact_person || directClient.name;
          roleTitle = pocRole || 'Authorized Representative';
          targetType = 'client';
        }
      }
    } else {
      let pQuery = supabase.from('profiles').select('*');
      if (linkedId) pQuery = pQuery.eq('emp_code', linkedId);
      else pQuery = pQuery.ilike('phone', `%${cleanPhone}%`);
      const { data } = await pQuery.maybeSingle();
      if (data) {
        userObj = data;
        name = data.name;
        targetType = 'team';
      }
    }
  }

  const pinRecord = await createTempPin(cleanPhone, userObj?.id || linkedId, targetType, email || userObj?.email || '');

  const portalPath = targetType === 'team' ? '/crew' : '/client';
  const teamBotUser = process.env.TEAM_BOT_USERNAME || 'Aigeneral01bot';
  const clientBotUser = process.env.CLIENT_BOT_USERNAME || 'gro10xb2bot';
  const botUsername = targetType === 'team' ? teamBotUser : clientBotUser;
  const portalUrl = `https://gro10x-ai.vercel.app${portalPath}?phone=${encodeURIComponent(cleanPhone)}`;

  const inviteCardText = targetType === 'team'
    ? `⚡ *GRO10X — WORKSPACE ACTIVATION*\n\n` +
      `Hello *${name}*! You have been invited to join the GRO10X Workspace.\n\n` +
      `📌 *Step 1:* Open our official Telegram Assistant Bot:\n` +
      `👉 https://t.me/${botUsername}?start=join_crew\n\n` +
      `📌 *Step 2:* Tap *Start* (or send /start) and press *📱 Verify My Phone Number* to link your account.\n\n` +
      `The bot will instantly verify your number and deliver your secure 4-digit PIN for Web & Mini App access! 🔑`
    : `📋 *GRO10X CLIENT WORKSPACE ACCESS CARD*\n\n` +
      `👤 Representative: *${name}* (${roleTitle})\n` +
      `🏢 Client Account: *${companyName}*\n` +
      `📱 Login Mobile: \`${cleanPhone}\`\n` +
      `🔑 Temporary 4-Digit PIN: \`${pinRecord.pin}\` *(Change on first login)*\n\n` +
      `🌐 Web Portal Direct Link:\n${portalUrl}\n\n` +
      `🤖 Telegram Assistant Bot: t.me/${botUsername}`;

  const waText = encodeURIComponent(inviteCardText);
  const whatsappLink = `https://wa.me/${cleanPhone.replace('+', '')}?text=${waText}`;

  let telegramPushed = false;
  if (sendTelegram && userObj && userObj.telegramId) {
    const pushMsg = `🔑 *Your GRO10X Login PIN Code*\n\n` +
      `Hello ${name}! Here is your login PIN code for the portal:\n\n` +
      `• Mobile: \`${cleanPhone}\`\n` +
      `• Temp 4-Digit PIN: \`${pinRecord.pin}\`\n\n` +
      `🌐 Direct Portal Access: ${portalUrl}`;

    const btnText = targetType === 'team' ? '🚀 Open Crew Workspace' : '🌐 Launch Client Portal';
    const baseUrl = process.env.BASE_URL || 'https://purpleos-iota.vercel.app';
    const appUrl = targetType === 'team' ? `${baseUrl}/team-miniapp` : `${baseUrl}/client`;

    sendTelegramNotification(userObj.telegramId, pushMsg, [
      [{ text: btnText, web_app: { url: appUrl } }]
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
router.post('/pin/verify', pinVerifyLimiter, async (req, res) => {
  const { phone, pin, portal } = req.body;
  if (!phone || !pin) {
    return res.status(400).json({ error: 'Phone number and PIN are required' });
  }

  const result = await verifyPin(phone, pin, portal);
  if (!result.success) {
    const status = result.locked ? 429 : 401;
    return res.status(status).json(result);
  }

  // Issue real signed JWT token with individual POC identity
  const jwtPayload = {
    userId: result.user?.id || result.linkedId || 'EMP-001',
    pocId: result.user?.pocId || 'poc_1',
    name: result.user?.name || 'User',
    company: result.user?.company || result.user?.name || '',
    pocRole: result.user?.pocRole || '',
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

  const callerPhone = normalizePhone(req.user?.profile?.phone || req.user?.phone || '');
  const targetPhone = normalizePhone(phone);
  const userAccess = (req.user?.accessLevel || req.user?.profile?.accessLevel || '').toLowerCase();
  const userRole = (req.user?.role || req.user?.profile?.role || '').toLowerCase();
  const isAdmin = userAccess.includes('owner') || userAccess.includes('admin') || userRole.includes('owner') || userRole.includes('admin');

  if (!isAdmin && callerPhone && targetPhone && callerPhone !== targetPhone) {
    return res.status(403).json({ error: 'Forbidden: You can only set your own PIN' });
  }

  const result = await setPermanentPin(phone, newPin, email);
  if (result.success) {
    try {
      const state = require('../services/state');
      const member = await state.getEmployeeByPhone(phone);
      
      if (member && member.telegramId) {
        const baseUrl = process.env.BASE_URL || 'https://purpleos-iota.vercel.app';
        const msg = `🎉 *Authentication Complete!*\n\n` +
          `Your permanent 4-digit PIN is now securely configured.\n\n` +
          `*Next Step:* Please complete your profile survey to finish setting up your account.`;
          
        const inlineKeyboard = [
          [
            { 
              text: '🎓 Open Profile Survey', 
              web_app: { url: `${baseUrl}/team-miniapp` } 
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

// POST /api/auth/refresh — Refresh active session token
router.post('/refresh', requireAuth, (req, res) => {
  const { signToken, revokeToken } = require('../services/jwt');
  if (req.user?.jti) {
    revokeToken(req.user.jti);
  }
  const newToken = signToken({
    id: req.user.id,
    name: req.user.name,
    phone: req.user.phone,
    email: req.user.email,
    role: req.user.role,
    accessLevel: req.user.accessLevel,
    linkedId: req.user.linkedId,
    linkedType: req.user.linkedType
  });
  res.cookie('sb-access-token', newToken, { path: '/', sameSite: 'Lax', maxAge: 604800000 });
  return res.json({ success: true, token: newToken });
});

// POST /api/auth/logout — Invalidate current session token
router.post('/logout', requireAuth, (req, res) => {
  const { revokeToken } = require('../services/jwt');
  if (req.user?.jti) {
    revokeToken(req.user.jti);
  }
  res.clearCookie('sb-access-token', { path: '/' });
  return res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;
