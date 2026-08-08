const crypto = require('crypto');

/**
 * Validates Telegram WebApp initData using HMAC-SHA256 signature algorithm.
 * Attaches req.telegramUser = { id, first_name, username, ... } if valid.
 * 
 * Non-blocking behavior:
 * - If x-telegram-init-data header is missing, passes through to next middleware (allowing JWT / API key fallback).
 * - Rejects HTTP 401 ONLY IF initData is provided but signature hash is invalid.
 */
function verifyTelegramInitData(req, res, next) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
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

module.exports = { verifyTelegramInitData };
