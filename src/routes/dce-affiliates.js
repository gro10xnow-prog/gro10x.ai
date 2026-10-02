/**
 * src/routes/dce-affiliates.js
 * ─────────────────────────────────────────────────────────────────────────────
 * GRO10X Digital Commerce Engine — Affiliates & Referral Network REST API
 * 
 * Endpoints:
 * - GET  /api/dce/affiliates                (List partners with link statistics)
 * - POST /api/dce/affiliates                (Onboard new partner)
 * - POST /api/dce/affiliates/:id/links      (Generate trackable short referral link)
 * - GET  /api/dce/affiliates/conversions    (List chronological conversion ledger)
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const { supabase, isSupabaseConfigured } = require('../services/supabase');
const { ok, fail, paginated, getPaginationParams, asyncHandler } = require('../utils/response');
const {
  getAffiliates,
  createAffiliate,
  createReferralLink,
  recordClickAndResolve,
  getConversions
} = require('../services/dce-affiliates');
const { requireDCEAdmin, requireAffiliateJWT } = require('../middleware/dce-auth');
const { signToken } = require('../services/jwt');
const { affiliateLoginLimiter, validateSchema, isValidUUID, EMAIL_REGEX } = require('../middleware/dce-validate');

/**
 * 1. List Affiliates (ADMIN ONLY)
 */
router.get('/', requireDCEAdmin, asyncHandler(async (req, res) => {
  const { limit, offset, page } = getPaginationParams(req, 25);
  const list = await getAffiliates();
  const total = list.length;
  const paginatedList = list.slice(offset, offset + limit);
  return paginated(res, paginatedList, { limit, offset, page, total });
}));

/**
 * 2. Onboard New Affiliate (ADMIN ONLY)
 */
router.post('/', requireDCEAdmin, validateSchema({
  name: { type: 'string', required: true, minLength: 2 },
  email: { type: 'string', required: true, pattern: EMAIL_REGEX },
  phone: { type: 'string', required: false },
  default_rate: { type: 'number', required: false, min: 0.01, max: 1.0 }
}), asyncHandler(async (req, res) => {
  try {
    const created = await createAffiliate(req.body);
    return ok(res, created);
  } catch (err) {
    return fail(res, err.message, 400);
  }
}));

/**
 * Referral Conversions & Attributed Commissions Ledger (ADMIN ONLY)
 */
router.get('/conversions', requireDCEAdmin, asyncHandler(async (req, res) => {
  const { limit, offset, page } = getPaginationParams(req, 25);
  const conversions = await getConversions();
  const total = conversions.length;
  const paginatedConversions = conversions.slice(offset, offset + limit);
  return paginated(res, paginatedConversions, { limit, offset, page, total });
}));

/**
 * 4. Record Click and Resolve Destination URL (Public / Redirect Handler)
 */
router.all(['/click/:shortCode', '/r/:shortCode'], asyncHandler(async (req, res) => {
  const shortCode = req.params.shortCode || req.body?.shortCode || req.query?.shortCode;
  if (!shortCode) return fail(res, 'shortCode is required', 400);

  const resolved = await recordClickAndResolve(shortCode);
  if (!resolved) return fail(res, 'Referral link not found', 404);

  // Set 30-day attribution cookie
  res.cookie('dce_ref', resolved.shortCode, {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    httpOnly: false,
    sameSite: 'lax',
    path: '/'
  });

  if (req.query.redirect === 'true' && resolved.destinationUrl) {
    return res.redirect(resolved.destinationUrl);
  }

  return ok(res, resolved);
}));

router.post('/click', asyncHandler(async (req, res) => {
  const shortCode = req.body?.shortCode || req.query?.shortCode;
  if (!shortCode) return fail(res, 'shortCode is required', 400);

  const resolved = await recordClickAndResolve(shortCode);
  if (!resolved) return fail(res, 'Referral link not found', 404);

  res.cookie('dce_ref', resolved.shortCode, {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    httpOnly: false,
    sameSite: 'lax',
    path: '/'
  });

  return ok(res, resolved);
}));

// ─────────────────────────────────────────────────────────────────────────────
// 5. AFFILIATE SELF-SERVICE PORTAL API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 5a. Affiliate Portal Login & Dashboard Telemetry (PUBLIC LOGIN)
 */
router.post('/portal/login', affiliateLoginLimiter, asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) return fail(res, 'Email is required', 400);

  const cleanEmail = email.trim().toLowerCase();
  const all = await getAffiliates();
  const affiliate = all.find(a => a.email.toLowerCase() === cleanEmail);

  if (!affiliate) {
    return fail(res, 'No affiliate account registered with this email address.', 404);
  }

  // Get conversions for this affiliate
  const allConversions = await getConversions();
  const conversions = allConversions.filter(c => c.affiliate_id === affiliate.id);

  // Compute aggregate stats
  const links = affiliate.links || [];
  let totalClicks = 0;
  let totalConversions = 0;
  let grossReferredGMV = 0;
  let totalEarned = Number(affiliate.total_earned || 0);
  let totalPaid = Number(affiliate.total_paid || 0);

  links.forEach(l => {
    totalClicks += Number(l.click_count || 0);
    totalConversions += Number(l.conversion_count || 0);
  });

  conversions.forEach(c => {
    grossReferredGMV += Number(c.order_amount || 0);
  });

  const conversionRate = totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(1) : '0.0';
  const unpaidBalance = Math.max(0, Math.round((totalEarned - totalPaid) * 100) / 100);

  const token = signToken({
    affiliateId: affiliate.id,
    email: affiliate.email,
    name: affiliate.name,
    role: 'AFFILIATE'
  }, 4 * 3600);

  return ok(res, {
    token,
    expiresIn: 4 * 3600,
    affiliate: {
      id: affiliate.id,
      name: affiliate.name,
      email: affiliate.email,
      phone: affiliate.phone,
      payout_channel: affiliate.payout_channel || 'BKASH',
      payout_details: affiliate.payout_details || {},
      default_rate: affiliate.default_rate || 0.20,
      status: affiliate.status
    },
    metrics: {
      totalClicks,
      totalConversions,
      conversionRate: `${conversionRate}%`,
      grossReferredGMV: Math.round(grossReferredGMV * 100) / 100,
      totalEarned: Math.round(totalEarned * 100) / 100,
      totalPaid: Math.round(totalPaid * 100) / 100,
      unpaidBalance
    },
    links: links.map(l => ({
      id: l.id,
      shortCode: l.short_code,
      destinationUrl: l.destination_url,
      shortUrl: `https://gro10x-ai.vercel.app/r/${l.short_code}`,
      clickCount: l.click_count || 0,
      conversionCount: l.conversion_count || 0,
      commissionRate: l.commission_rate || affiliate.default_rate
    })),
    conversions: conversions.map(c => ({
      id: c.id,
      orderRef: c.order_ref || c.order_id,
      orderAmount: Number(c.order_amount || 0).toFixed(2),
      commissionRate: `${(Number(c.commission_rate || 0.20) * 100).toFixed(0)}%`,
      commissionEarned: Number(c.commission_earned || 0).toFixed(2),
      payoutStatus: c.payout_status || 'PENDING',
      createdAt: c.created_at
    }))
  });
}));

/**
 * 5b. Create Custom Referral Short Link via Portal (AFFILIATE ONLY)
 */
router.post('/portal/links', requireAffiliateJWT, asyncHandler(async (req, res) => {
  const { email, shortCode, destinationUrl, brandId } = req.body;
  if (!email || !shortCode) return fail(res, 'email and shortCode are required', 400);

  const cleanEmail = email.trim().toLowerCase();
  const all = await getAffiliates();
  const affiliate = all.find(a => a.email.toLowerCase() === cleanEmail);

  if (!affiliate) return fail(res, 'Affiliate not found', 404);

  try {
    const link = await createReferralLink({
      affiliateId: affiliate.id,
      brandId: brandId || null,
      shortCode,
      destinationUrl: destinationUrl || 'https://gro10x-ai.vercel.app/dce/store',
      commissionRate: affiliate.default_rate
    });

    return ok(res, {
      ...link,
      shortUrl: `https://gro10x-ai.vercel.app/r/${link.short_code}`
    });
  } catch (err) {
    return fail(res, err.message, 400);
  }
}));

/**
 * 5c. Update Payout Preferences (AFFILIATE ONLY)
 */
router.put('/portal/payout-settings', requireAffiliateJWT, asyncHandler(async (req, res) => {
  const { email, payoutChannel, payoutDetails } = req.body;
  if (!email || !payoutChannel) return fail(res, 'email and payoutChannel are required', 400);

  const cleanEmail = email.trim().toLowerCase();
  const all = await getAffiliates();
  const affiliate = all.find(a => a.email.toLowerCase() === cleanEmail);

  if (!affiliate) return fail(res, 'Affiliate not found', 404);

  affiliate.payout_channel = payoutChannel.toUpperCase();
  affiliate.payout_details = payoutDetails || {};

  if (isSupabaseConfigured() && isValidUUID(affiliate.id)) {
    try {
      await supabase.from('dce_affiliates').update({
        payout_channel: affiliate.payout_channel,
        payout_details: affiliate.payout_details,
        updated_at: new Date().toISOString()
      }).eq('id', affiliate.id);
    } catch (e) {
      console.warn('[DCE Affiliates DB Warning]:', e.message);
    }
  }

  return ok(res, {
    success: true,
    payout_channel: affiliate.payout_channel,
    payout_details: affiliate.payout_details
  });
}));

/**
 * Create Short Referral Link by Partner ID (ADMIN ONLY)
 */
router.post('/:id/links', requireDCEAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { brandId, skuId, shortCode, destinationUrl, commissionRate } = req.body;

  try {
    const link = await createReferralLink({
      affiliateId: id,
      brandId,
      skuId,
      shortCode,
      destinationUrl,
      commissionRate
    });
    return ok(res, link);
  } catch (err) {
    return fail(res, err.message, 400);
  }
}));

module.exports = router;
