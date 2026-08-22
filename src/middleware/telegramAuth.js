const crypto = require('crypto');
const { requireAuth } = require('./auth');

/**
 * Validates Telegram WebApp initData using HMAC-SHA256 signature algorithm.
 * Attaches req.telegramUser = { id, first_name, username, ... } if valid.
 */
function verifyTelegramInitData(req, res, next) {
  const botToken = process.env.TEAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
  const initData = req.headers['x-telegram-init-data'] || req.body?.initData;

  if (!initData || !botToken) {
    return next();
  }

  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) return next();

    params.delete('hash');

    const checkString = [...params.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('\n');

    const secretKey = crypto.createHmac('sha256', 'WebAppData')
      .update(botToken).digest();

    const expectedHash = crypto.createHmac('sha256', secretKey)
      .update(checkString).digest('hex');

    if (expectedHash !== hash) {
      console.warn('[Security Warning] Invalid Telegram initData HMAC signature rejected');
      return res.status(401).json({ error: 'Invalid Telegram initData signature' });
    }

    const userStr = params.get('user');
    if (userStr) {
      req.telegramUser = JSON.parse(userStr);
    }
    next();
  } catch (e) {
    console.warn('[Security Warning] Failed to parse Telegram initData:', e.message);
    next();
  }
}

/**
 * requireMiniAppAuth — Combined guard for Mini App endpoints.
 * Accepts either:
 *  1) Valid JWT token in Authorization header (Admin panel / SPA)
 *  2) Valid Telegram initData HMAC signature (Mini App frontend)
 * Rejects all other unauthenticated requests with 401.
 */
function requireMiniAppAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return requireAuth(req, res, next);
  }

  // Also accept session tokens via query params or cookies for web-based access / SSE
  const queryToken = req.query?.token || req.query?.t;
  const cookieToken = req.cookies?.['sb-access-token'] || req.cookies?.['purpleos_pin_token'] || req.cookies?.['purple_token'];
  if (queryToken || cookieToken) {
    return requireAuth(req, res, next);
  }

  const botToken = process.env.TEAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
  const initData = req.headers['x-telegram-init-data'] || req.body?.initData;

  if (!initData) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (!botToken) {
    console.warn('[Security Warning] Bot token missing from env during initData auth check');
    return res.status(500).json({ error: 'Server auth configuration error' });
  }

  verifyTelegramInitData(req, res, () => {
    if (!req.telegramUser && !req.user) {
      return res.status(401).json({ error: 'Invalid Telegram authentication payload' });
    }
    next();
  });
}

module.exports = { verifyTelegramInitData, requireMiniAppAuth };
