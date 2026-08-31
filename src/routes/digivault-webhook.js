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
