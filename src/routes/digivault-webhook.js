/**
 * src/routes/digivault-webhook.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Telegram Webhook Handler for DigiVault Customer Bot (@Digivault20bot)
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const { processDigiVaultWebhook } = require('../services/digivault-bot');

router.post('/', async (req, res) => {
  const secretHeader = req.headers['x-telegram-bot-api-secret-token'] || req.headers['x-digivault-secret'];
  const expectedSecret = process.env.DIGIVAULT_WEBHOOK_SECRET || process.env.WEBHOOK_SECRET_DIGIVAULT || process.env.WEBHOOK_SECRET_TOKEN || process.env.WEBHOOK_SECRET;
  const isProd = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL) || Boolean(process.env.RENDER);

  if (isProd || expectedSecret) {
    if (!expectedSecret) {
      console.warn('⚠️ DigiVault Webhook rejected: Webhook secret not configured in production');
      return res.status(403).json({ error: 'Forbidden: Webhook secret not configured' });
    }
    if (secretHeader !== expectedSecret) {
      console.warn('⚠️ DigiVault Webhook rejected: Invalid secret token');
      return res.status(403).json({ error: 'Forbidden: Invalid secret token' });
    }
  }

  try {
    if (req.body && req.body.update_id) {
      await processDigiVaultWebhook(req.body);
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('❌ [DigiVault Webhook Error]:', err.message);
    return res.status(200).json({ ok: true }); // Always acknowledge to Telegram to prevent retry storms
  }
});

router.get('/health', (req, res) => {
  return res.json({
    status: 'healthy',
    bot: 'Digivault20bot',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
