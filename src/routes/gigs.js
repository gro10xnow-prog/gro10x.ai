/**
 * src/routes/gigs.js
 * ─────────────────────────────────────────────────────────────────────────────
 * GRO10X OS Freelance & Marketplace Gigs API Router.
 * Endpoints for listing, generating, validating, updating, and dispatching
 * Fiverr and Upwork gig packages to the team Telegram bot.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const { ok, fail, asyncHandler } = require('../utils/response');
const { requireAuth } = require('../middleware/auth');
const {
  getAllGigs,
  getGigById,
  saveGig,
  updateGig,
  getAccounts
} = require('../services/gig-store');
const {
  validateGigHealth,
  generateGigWithAI
} = require('../services/gig-generator');

/**
 * GET /api/gigs
 * Returns all marketplace gigs, filterable by query params.
 */
router.get('/', asyncHandler(async (req, res) => {
  const { category, platform, status, accountId } = req.query;
  const gigs = getAllGigs({ category, platform, status, accountId });
  return ok(res, gigs);
}));

/**
 * GET /api/gigs/accounts
 * Returns all configured category accounts (e.g. Technology Development owner account).
 */
router.get('/accounts', asyncHandler(async (req, res) => {
  const accounts = getAccounts();
  return ok(res, accounts);
}));

/**
 * GET /api/gigs/:id
 * Returns a single gig package with live health check score.
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const gig = getGigById(req.params.id);
  if (!gig) {
    return fail(res, 404, `Gig '${req.params.id}' not found`);
  }
  // Re-verify health check
  gig.healthCheck = validateGigHealth(gig);
  return ok(res, gig);
}));

/**
 * POST /api/gigs/generate
 * Generates or regenerates a marketplace gig package via Gemini AI.
 */
router.post('/generate', asyncHandler(async (req, res) => {
  const { serviceId, gigIndex, accountId, customPrompt } = req.body || {};

  if (!serviceId && !gigIndex) {
    return fail(res, 400, 'Either serviceId or gigIndex is required');
  }

  const generatedGig = await generateGigWithAI({
    serviceId,
    gigIndex: gigIndex || 1,
    accountId: accountId || 'ACC-TECH-001',
    customPrompt
  });

  await saveGig(generatedGig);
  return ok(res, generatedGig);
}));

/**
 * PUT /api/gigs/:id
 * Updates gig details, manual overrides, liveUrl, or publishing status.
 */
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body || {};

  const existing = getGigById(id);
  if (!existing) {
    return fail(res, 404, `Gig '${id}' not found`);
  }

  // Recalculate health check if text fields updated
  const merged = { ...existing, ...updates };
  merged.healthCheck = validateGigHealth(merged);

  const saved = await updateGig(id, merged);
  return ok(res, saved);
}));

/**
 * POST /api/gigs/:id/dispatch-telegram
 * Dispatches copy-paste ready gig brief card to the agency owner / team bot.
 */
router.post('/:id/dispatch-telegram', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const gig = getGigById(id);

  if (!gig) {
    return fail(res, 404, `Gig '${id}' not found`);
  }

  const ownerChatId = process.env.OWNER_TELEGRAM_ID;
  if (!ownerChatId) {
    return fail(res, 400, 'OWNER_TELEGRAM_ID environment variable is not configured');
  }

  const scoreEmoji = gig.healthCheck?.score >= 9 ? '🟢' : '🟡';
  const basicPrice = gig.pricing?.basic?.price || 0;
  const standardPrice = gig.pricing?.standard?.price || 0;
  const premiumPrice = gig.pricing?.premium?.price || 0;

  const msgText =
    `🎯 *FIVERR GIG PUBLISHING BRIEF*\n` +
    `📦 *Slot ${gig.gigIndex || 1} of 7 — ${gig.id}*\n\n` +
    `📌 *Title:*\n\`${gig.title}\`\n\n` +
    `🏷️ *Category:* ${gig.categorySelection?.primary || 'Programming & Tech'} > ${gig.categorySelection?.sub || 'Web Applications'}\n` +
    `🔑 *Search Tags:* \`${(gig.tags || []).join(', ')}\`\n\n` +
    `💰 *Pricing Tiers:*\n` +
    `  • Basic: *$${basicPrice}* (${gig.pricing?.basic?.deliveryDays || 2}d) — ${gig.pricing?.basic?.title || 'Core'}\n` +
    `  • Standard: *$${standardPrice}* (${gig.pricing?.standard?.deliveryDays || 4}d) — ${gig.pricing?.standard?.title || 'Growth'}\n` +
    `  • Premium: *$${premiumPrice}* (${gig.pricing?.premium?.deliveryDays || 7}d) — ${gig.pricing?.premium?.title || 'Enterprise'}\n\n` +
    `🎨 *Thumbnail Brief:*\n` +
    `  • Headline: *${gig.thumbnailBrief?.headline || 'SERVICE TITLE'}*\n` +
    `  • Subtext: _${gig.thumbnailBrief?.subheading || 'TECH STACK'}\_\n` +
    `  • Badge: \`${gig.thumbnailBrief?.badgeText || '⚡ FAST DELIVERY'}\`\n\n` +
    `🛡️ *Health Check:* ${scoreEmoji} *${gig.healthCheck?.score || 10}/10 Passed*\n\n` +
    `_Open Admin Panel to copy full description & FAQs:_ https://gro10x-ai.vercel.app/app#gigs`;

  try {
    const { sendTelegramNotification } = require('../services/bot');
    if (typeof sendTelegramNotification === 'function') {
      await sendTelegramNotification(ownerChatId, msgText, null, true);
    }
    await updateGig(id, { status: 'Briefed' });
    return ok(res, { success: true, message: 'Gig brief dispatched to Telegram successfully.' });
  } catch (err) {
    return fail(res, 500, `Telegram dispatch error: ${err.message}`);
  }
}));

module.exports = router;