/**
 * src/routes/pitch.js
 * ─────────────────────────────────────────────────────────────────────────────
 * PitchOS Commercial Intake & Telegram Ingress API
 * Handles lead capture for executive deck conversions (Surface A + Surface B).
 * Persists atomically to data/pitch_intakes.json and notifies Founder via Telegram.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { sendTelegramNotification } = require('../services/bot');
const { normalizePhone } = require('../utils/phone');

const INTAKES_FILE = path.join(__dirname, '../../data/pitch_intakes.json');

/**
 * Helper: Read all intakes atomically
 */
async function readIntakes() {
  try {
    if (!fs.existsSync(INTAKES_FILE)) {
      return [];
    }
    const data = await fs.promises.readFile(INTAKES_FILE, 'utf-8');
    const parsed = JSON.parse(data || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('[PitchOS] Error reading intakes ledger:', err.message);
    return [];
  }
}

/**
 * Helper: Write intakes atomically with temporary swap
 */
async function writeIntakes(intakes) {
  const dir = path.dirname(INTAKES_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const tempFile = `${INTAKES_FILE}.${Date.now()}.tmp`;
  await fs.promises.writeFile(tempFile, JSON.stringify(intakes, null, 2), 'utf-8');
  await fs.promises.rename(tempFile, INTAKES_FILE);
}

/**
 * Helper: Generate unique PitchOS Tracking ID
 */
function generateTrackingId() {
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PITCH-2026-${rand}`;
}

/**
 * POST /api/pitch/intake
 * Commercial Inbound Lead Submission for PitchOS Deck Conversions
 */
router.post('/intake', async (req, res) => {
  try {
    const {
      companyName,
      contactName,
      phone,
      email,
      tier,
      targetAudience,
      presentationTarget,
      deckUrl,
      presentationDate,
      urgency,
      notes
    } = req.body;

    // 1. Validate required fields
    if (!companyName || !String(companyName).trim()) {
      return res.status(400).json({ ok: false, error: 'companyName is required' });
    }
    if (!contactName || !String(contactName).trim()) {
      return res.status(400).json({ ok: false, error: 'contactName is required' });
    }
    if (!phone || !String(phone).trim()) {
      return res.status(400).json({ ok: false, error: 'phone is required' });
    }
    if (!tier || !String(tier).trim()) {
      return res.status(400).json({ ok: false, error: 'tier is required' });
    }

    const digits = String(phone).replace(/[^0-9]/g, '');
    const cleanPhone = digits.length >= 10 ? `+880${digits.slice(-10)}` : String(phone).trim();
    const trackingId = generateTrackingId();
    const targetAudienceClean = (presentationTarget || targetAudience || 'Investor / B2B Keynote').trim();
    const targetTier = String(tier).trim();

    // 2. Build lead record
    const record = {
      trackingId,
      companyName: String(companyName).trim(),
      contactName: String(contactName).trim(),
      phone: cleanPhone,
      email: (email ? String(email).trim() : ''),
      tier: targetTier,
      presentationTarget: targetAudienceClean,
      deckUrl: (deckUrl ? String(deckUrl).trim() : ''),
      presentationDate: (presentationDate || urgency ? String(presentationDate || urgency).trim() : ''),
      notes: (notes ? String(notes).trim() : ''),
      status: 'NEW_LEAD',
      source: 'web_portal',
      createdAt: new Date().toISOString()
    };

    // 3. Persist atomically to data/pitch_intakes.json
    const existing = await readIntakes();
    existing.unshift(record);
    await writeIntakes(existing);

    // 4. Dispatch Telegram Notification to Founder
    const ownerChatId = process.env.OWNER_TELEGRAM_ID ||
                        process.env.ADMIN_TELEGRAM_CHAT_ID ||
                        process.env.TELEGRAM_CHAT_ID ||
                        '7754769807';

    const tgMessage = 
      `⚡ *NEW PITCHOS LEAD RECEIVED* ⚡\n` +
      `───────────────────────────────\n` +
      `📌 *Order Ref:* \`${record.trackingId}\`\n` +
      `🏢 *Company:* *${record.companyName}*\n` +
      `👤 *Presenter:* *${record.contactName}*\n` +
      `📞 *Phone/WA:* [${record.phone}](tel:${record.phone.replace(/[^0-9+]/g, '')})\n` +
      (record.email ? `📧 *Email:* \`${record.email}\`\n` : '') +
      `🎯 *Audience:* ${record.presentationTarget}\n` +
      `💎 *Tier:* *${record.tier}*\n` +
      (record.presentationDate ? `📅 *Target Date:* ${record.presentationDate}\n` : '') +
      (record.deckUrl ? `🔗 *Raw Deck:* ${record.deckUrl}\n` : '') +
      (record.notes ? `📝 *Notes:* _${record.notes}_\n` : '') +
      `───────────────────────────────\n` +
      `*Status:* 🟡 NEW_LEAD · 24h Studio SLA Initiated`;

    const inlineKeyboard = [
      [
        {
          text: `💬 WhatsApp Contact`,
          url: `https://wa.me/${cleanPhone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(record.contactName)},%20this%20is%20GRO10X%20PitchOS%20Studio%20regarding%20your%20deck%20order%20${record.trackingId}`
        }
      ]
    ];

    try {
      sendTelegramNotification(ownerChatId, tgMessage, inlineKeyboard, true);
    } catch (botErr) {
      console.warn('[PitchOS] Telegram alert dispatch warning:', botErr.message);
    }

    // 5. Return HTTP 201 Success
    return res.status(201).json({
      ok: true,
      trackingId: record.trackingId,
      tier: record.tier,
      message: 'Deck received. Chief of Staff will dispatch your conversion preview within 24 hours.',
      lead: record
    });
  } catch (err) {
    console.error('[PitchOS] Failed to process pitch intake:', err);
    return res.status(500).json({ ok: false, error: 'Internal server error processing pitch intake' });
  }
});

/**
 * GET /api/pitch/intakes
 * Retrieve stored pitch intakes (convenience & testing)
 */
router.get('/intakes', async (req, res) => {
  try {
    const list = await readIntakes();
    return res.json({ ok: true, count: list.length, intakes: list });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
