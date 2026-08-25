/**
 * src/routes/etsy.js
 * ─────────────────────────────────────────────────────────────────────────────
 * GRO10X Etsy Operating System Router (v3 Open API)
 * Complete Shop Operating Layer:
 * - PKCE OAuth2 Connect / Callback / Status
 * - Shop Profile & Sections CRUD
 * - AI Pre-Listing 10-Rule Health Check
 * - Bulk Catalog Publisher (100 products with Vault asset streaming)
 * - Orders & Revenue Sync + Telegram Bot Alerts
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/rbac');
const { ok, fail, asyncHandler } = require('../utils/response');
const { supabase, isSupabaseConfigured } = require('../services/supabase');
const { getTeamBot } = require('../services/bot');
const {
  getAuthorizationUrl,
  exchangeCodeForTokens,
  saveConnectionTokens,
  getConnection,
  getValidAccessToken,
  etsyApiCall,
  runProductHealthCheck,
  ETSY_KEYSTRING,
  ETSY_SHARED_SECRET,
  ETSY_REDIRECT_URI
} = require('../services/etsy');

// Helper to fetch brand and catalog from app_settings
async function getBrandData(brandId) {
  const brandKey = parseInt(brandId, 10);
  let state = null;
  if (isSupabaseConfigured()) {
    try {
      const { data } = await supabase.from('app_settings').select('value').eq('key', 'brands_empire_state').maybeSingle();
      if (data?.value && Array.isArray(data.value.brands)) state = data.value;
    } catch (e) {}
  }
  if (!state || !Array.isArray(state.brands)) {
    const brandsMod = require('./brands');
    state = brandsMod.SEED_BRANDS_DATA || brandsMod.router?.SEED_BRANDS_DATA || { brands: [], productsCatalog: {} };
  }

  const brand = state.brands?.find(b => b.id === brandKey) || null;
  const catalog = (state.productsCatalog && state.productsCatalog[brandKey]) || [];
  return { state, brand, catalog, brandKey };
}

/**
 * 1. GET /api/etsy/brands/:brandId/status
 * Public/Authed status check for a brand's Etsy connection
 */
router.get('/brands/:brandId/status', asyncHandler(async (req, res) => {
  const { brandId } = req.params;
  const conn = await getConnection(brandId);

  if (!conn || !conn.access_token || conn.status === 'disconnected') {
    return ok(res, {
      connected: false,
      brandId: String(brandId),
      message: 'No active Etsy store connected for this brand.'
    });
  }

  return ok(res, {
    connected: true,
    brandId: String(brandId),
    shopId: conn.shop_id || conn.shopId,
    shopName: conn.shop_name || conn.shopName || 'Connected Store',
    shopUrl: conn.shop_url || conn.shopUrl || (conn.shop_name ? `https://www.etsy.com/shop/${conn.shop_name}` : ''),
    connectedAt: conn.connected_at || conn.connectedAt,
    expiresAt: conn.token_expires_at || conn.expiresAt,
    scopes: conn.scopes || '',
    status: conn.status || 'active'
  });
}));

/**
 * 2. GET /api/etsy/brands/:brandId/connect
 * Initiate OAuth PKCE Authorization Flow (Admin Only)
 */
router.get('/brands/:brandId/connect', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const { brandId } = req.params;
  const hostOverride = req.query.host || (req.get('x-forwarded-proto') ? `${req.get('x-forwarded-proto')}://${req.get('host')}` : null);
  
  const { authUrl, state } = getAuthorizationUrl(brandId, hostOverride);
  return ok(res, {
    brandId: String(brandId),
    authUrl,
    state
  });
}));

/**
 * 3. GET /api/etsy/callback
 * Public OAuth redirect target from Etsy
 */
router.get('/callback', asyncHandler(async (req, res) => {
  const { code, state, error, error_description } = req.query;

  if (error) {
    return res.redirect(`/app/#brands?etsy_error=${encodeURIComponent(error_description || error)}`);
  }

  if (!code || !state) {
    return res.status(400).send('Missing authorization code or state parameter.');
  }

  let stateObj = {};
  try {
    const decoded = Buffer.from(state, 'base64url').toString('utf8');
    stateObj = JSON.parse(decoded);
  } catch (e) {
    return res.status(400).send('Invalid state payload.');
  }

  const { brandId, verifier, redirectUri } = stateObj;
  if (!brandId || !verifier) {
    return res.status(400).send('State payload is incomplete.');
  }

  try {
    // 1. Exchange code for access & refresh tokens
    const tokens = await exchangeCodeForTokens(code, verifier, redirectUri);

    // 2. Discover Shop Details using the newly minted access token
    let shopId = null;
    let shopName = `Brand ${brandId} Store`;
    let shopUrl = '';

    try {
      // Find Etsy user ID from token prefix or /users/me
      const meRes = await fetch('https://api.etsy.com/v3/application/users/me', {
        headers: {
          'x-api-key': `${ETSY_KEYSTRING}:${ETSY_SHARED_SECRET}`,
          'Authorization': `Bearer ${tokens.accessToken}`
        }
      });
      const meData = await meRes.json();
      const userId = meData.user_id;

      if (userId) {
        const shopsRes = await fetch(`https://api.etsy.com/v3/application/users/${userId}/shops`, {
          headers: {
            'x-api-key': `${ETSY_KEYSTRING}:${ETSY_SHARED_SECRET}`,
            'Authorization': `Bearer ${tokens.accessToken}`
          }
        });
        const shopsData = await shopsRes.json();
        if (shopsData && shopsData.shop_id) {
          shopId = shopsData.shop_id;
          shopName = shopsData.shop_name || shopName;
          shopUrl = shopsData.url || `https://www.etsy.com/shop/${shopName}`;
        }
      }
    } catch (discoveryErr) {
      console.warn('[Etsy Callback] Shop discovery warning:', discoveryErr.message);
    }

    // 3. Save connection
    await saveConnectionTokens(brandId, {
      ...tokens,
      shopId,
      shopName,
      shopUrl,
      connectedBy: 'GRO-000'
    });

    // 4. Update brand status in memory & Supabase
    const { state: brandState, brand } = await getBrandData(brandId);
    if (brand) {
      brand.etsyStatus = 'Active';
      brand.etsyUrl = shopUrl || brand.etsyUrl;
      if (brandState) {
        const { persistBrandsState } = require('./brands');
        await persistBrandsState(brandState);
      }
    }

    // 5. Notify Team Bot
    try {
      const bot = getTeamBot();
      if (bot && process.env.TELEGRAM_TEAM_CHAT_ID) {
        bot.sendMessage(
          process.env.TELEGRAM_TEAM_CHAT_ID,
          `🏪 *Etsy Store Connected!*\n\n• *Brand:* Brand ${brandId} (${brand?.name || 'Store'})\n• *Shop Name:* ${shopName}\n• *Shop ID:* \`${shopId || 'Auto-linked'}\`\n• *Status:* 🟢 Ready for AI Health Check & Bulk Listing`,
          { parse_mode: 'Markdown' }
        ).catch(() => {});
      }
    } catch (e) {}

    // Redirect to SPA Brand Command Center with success toast
    return res.redirect(`/app/#brands?etsy_connected=success&brand=${brandId}&shop=${encodeURIComponent(shopName)}`);
  } catch (err) {
    console.error('[Etsy Callback Error]:', err.message);
    return res.redirect(`/app/#brands?etsy_error=${encodeURIComponent(err.message)}`);
  }
}));

/**
 * 4. POST /api/etsy/brands/:brandId/disconnect
 * Disconnects store (Admin only)
 */
router.post('/brands/:brandId/disconnect', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const { brandId } = req.params;
  await saveConnectionTokens(brandId, {
    accessToken: null,
    refreshToken: null,
    status: 'disconnected'
  });
  return ok(res, { success: true, message: `Brand ${brandId} Etsy store disconnected.` });
}));

/**
 * 5. GET /api/etsy/brands/:brandId/shop
 * Get live Etsy shop profile & settings
 */
router.get('/brands/:brandId/shop', requireAuth, asyncHandler(async (req, res) => {
  const { brandId } = req.params;
  const conn = await getConnection(brandId);
  if (!conn || !conn.shop_id) {
    return fail(res, 'No connected Etsy shop found for this brand.', 404);
  }

  try {
    const shopData = await etsyApiCall(brandId, `/shops/${conn.shop_id}`);
    return ok(res, shopData);
  } catch (err) {
    return fail(res, err.message, 500);
  }
}));

/**
 * 6. PUT /api/etsy/brands/:brandId/shop
 * Update shop announcement, title, sale message (Admin only)
 */
router.put('/brands/:brandId/shop', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const { brandId } = req.params;
  const { title, announcement, sale_message, digital_listing_surcharge_status } = req.body;
  const conn = await getConnection(brandId);
  if (!conn || !conn.shop_id) {
    return fail(res, 'No connected Etsy shop found for this brand.', 404);
  }

  const payload = {};
  if (title !== undefined) payload.title = title;
  if (announcement !== undefined) payload.announcement = announcement;
  if (sale_message !== undefined) payload.sale_message = sale_message;
  if (digital_listing_surcharge_status !== undefined) payload.digital_listing_surcharge_status = digital_listing_surcharge_status;

  try {
    const result = await etsyApiCall(brandId, `/shops/${conn.shop_id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    return ok(res, { success: true, shop: result });
  } catch (err) {
    return fail(res, err.message, 500);
  }
}));

/**
 * 7. GET /api/etsy/brands/:brandId/sections
 * Get shop sections
 */
router.get('/brands/:brandId/sections', requireAuth, asyncHandler(async (req, res) => {
  const { brandId } = req.params;
  const conn = await getConnection(brandId);
  if (!conn || !conn.shop_id) {
    // Return brand template categories as fallback sections
    const { brand } = await getBrandData(brandId);
    const mockSections = (brand?.categories || []).map((cat, idx) => ({
      shop_section_id: 1000 + idx,
      title: cat,
      rank: idx,
      active_listing_count: 0
    }));
    return ok(res, { results: mockSections, isFallback: true });
  }

  try {
    const sections = await etsyApiCall(brandId, `/shops/${conn.shop_id}/sections`);
    return ok(res, sections);
  } catch (err) {
    const { brand } = await getBrandData(brandId);
    return ok(res, {
      results: (brand?.categories || []).map((cat, idx) => ({
        shop_section_id: 1000 + idx,
        title: cat,
        rank: idx,
        active_listing_count: 0
      })),
      isFallback: true,
      error: err.message
    });
  }
}));

/**
 * 8. POST /api/etsy/brands/:brandId/sections
 * Create shop section (Admin only)
 */
router.post('/brands/:brandId/sections', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const { brandId } = req.params;
  const { title } = req.body;
  if (!title) return fail(res, 'Section title is required.', 400);

  const conn = await getConnection(brandId);
  if (!conn || !conn.shop_id) {
    return fail(res, 'Connect Etsy store first to create live sections.', 400);
  }

  try {
    const newSection = await etsyApiCall(brandId, `/shops/${conn.shop_id}/sections`, {
      method: 'POST',
      body: JSON.stringify({ title })
    });
    return ok(res, newSection);
  } catch (err) {
    return fail(res, err.message, 500);
  }
}));

/**
 * 9. POST /api/etsy/brands/:brandId/health-check-all
 * Runs AI Pre-Listing 10-Rule Health Check across all products of the brand
 */
router.post('/brands/:brandId/health-check-all', requireAuth, asyncHandler(async (req, res) => {
  const { brandId } = req.params;
  const { brand, catalog } = await getBrandData(brandId);

  if (!catalog || catalog.length === 0) {
    // Generate simulated 100 products from brand metadata if empty
    const { brandKey } = await getBrandData(brandId);
    const mockCatalog = Array.from({ length: 100 }, (_, i) => {
      const code = `PROD-${String(i + 1).padStart(3, '0')}`;
      const catIdx = i % (brand?.categories?.length || 1);
      const catName = brand?.categories?.[catIdx] || 'Planner';
      return {
        code,
        name: `${catName} Edition #${i + 1}`,
        price: 4.99,
        category: catName,
        status: i < 8 ? 'SEO Ready' : 'Planning',
        seoTitle: `${catName} | Minimalist Printable Template & Digital Tracker (PDF)`,
        seoDescription: `Comprehensive ${catName} instant digital download. Includes structured templates, guidelines, and habit systems. Print at home or use on tablet. 100% digital download.`,
        seoTags: ['digital planner', 'printable template', 'budget tracker', 'daily checklist', 'instant download', 'goodnotes', 'minimalist', 'organizer', 'pdf download', 'habit tracker', 'productivity', 'editable pdf', 'clean layout'],
        isDigitalReady: i < 8
      };
    });

    const results = mockCatalog.map(p => runProductHealthCheck(p, brand));
    const passedCount = results.filter(r => r.passed).length;
    const failedCount = results.length - passedCount;
    const avgScore = Math.round((results.reduce((acc, r) => acc + r.score, 0) / results.length) * 10) / 10;

    return ok(res, {
      brandId: String(brandId),
      brandName: brand?.name || `Brand ${brandId}`,
      total: results.length,
      passedCount,
      failedCount,
      avgScore,
      passRate: `${Math.round((passedCount / results.length) * 100)}%`,
      results
    });
  }

  const results = catalog.map(p => runProductHealthCheck(p, brand));
  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.length - passedCount;
  const avgScore = Math.round((results.reduce((acc, r) => acc + r.score, 0) / Math.max(1, results.length)) * 10) / 10;

  return ok(res, {
    brandId: String(brandId),
    brandName: brand?.name || `Brand ${brandId}`,
    total: results.length,
    passedCount,
    failedCount,
    avgScore,
    passRate: `${Math.round((passedCount / results.length) * 100)}%`,
    results
  });
}));

/**
 * 10. POST /api/etsy/brands/:brandId/listings/:code/health-check
 * Single product health check
 */
router.post('/brands/:brandId/listings/:code/health-check', requireAuth, asyncHandler(async (req, res) => {
  const { brandId, code } = req.params;
  const { brand, catalog } = await getBrandData(brandId);
  const product = catalog.find(p => p.code === code || p.productCode === code) || req.body.product;

  if (!product) {
    return fail(res, `Product ${code} not found.`, 404);
  }

  const report = runProductHealthCheck(product, brand);
  return ok(res, report);
}));

/**
 * 11. POST /api/etsy/brands/:brandId/publish-all
 * Master Bulk Catalog Publisher (Admin Only)
 * Loops through approved products with throttling, creates draft listings,
 * attaches deliverables from Cloud Vault, and sets them to Active.
 */
router.post('/brands/:brandId/publish-all', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const { brandId } = req.params;
  const { productCodes, autoActivate = true } = req.body;
  const { state: brandState, brand, catalog } = await getBrandData(brandId);

  const conn = await getConnection(brandId);
  const isSimulated = !conn || !conn.shop_id || conn.status !== 'active';

  const targetProducts = productCodes && productCodes.length > 0
    ? catalog.filter(p => productCodes.includes(p.code || p.productCode))
    : catalog.filter(p => ['SEO Ready', 'QA Approved', 'Staged', 'Live'].includes(p.status) || !p.status);

  if (targetProducts.length === 0) {
    return fail(res, 'No products found ready for Etsy listing. Complete Studio Engine steps first.', 400);
  }

  const published = [];
  const errors = [];

  for (let i = 0; i < targetProducts.length; i++) {
    const prod = targetProducts[i];
    const code = prod.code || prod.productCode || `PROD-${i + 1}`;
    const health = runProductHealthCheck(prod, brand);

    if (!health.passed) {
      errors.push({
        code,
        name: prod.name,
        reason: `Failed AI Pre-Listing Health Check (${health.failures.map(f => f.message).join('; ')})`
      });
      continue;
    }

    try {
      if (isSimulated) {
        // Simulated execution (when running staging / dry-run)
        const mockListingId = 980000000 + i + 1;
        prod.status = 'Live';
        prod.etsyListingId = mockListingId;
        prod.etsyUrl = `https://www.etsy.com/listing/${mockListingId}/${encodeURIComponent((prod.seoTitle || prod.name).slice(0, 30))}`;
        prod.listedAt = new Date().toISOString();
        published.push({
          code,
          name: prod.name,
          etsyListingId: mockListingId,
          etsyUrl: prod.etsyUrl,
          mode: 'Staged / Simulated'
        });
      } else {
        // Real Live Etsy v3 API Call
        const priceCents = Math.round((prod.price || 4.99) * 100);
        const tags = (prod.seoTags || ['planner', 'printable']).slice(0, 13).map(t => t.slice(0, 20));

        const listingPayload = {
          quantity: 999,
          title: (prod.seoTitle || prod.name).slice(0, 140),
          description: prod.seoDescription || `Instant digital download printable template.`,
          price: priceCents / 100,
          who_made: 'i_did',
          when_made: '2020_2026',
          is_supply: false,
          type: 'download',
          tags: tags
        };

        const createRes = await etsyApiCall(brandId, `/shops/${conn.shop_id}/listings`, {
          method: 'POST',
          body: JSON.stringify(listingPayload)
        });

        const listingId = createRes.listing_id;

        // Activate listing
        if (autoActivate && listingId) {
          try {
            await etsyApiCall(brandId, `/shops/${conn.shop_id}/listings/${listingId}`, {
              method: 'PATCH',
              body: JSON.stringify({ state: 'active' })
            });
          } catch (actErr) {
            console.warn(`[Etsy Listing Activation Note]:`, actErr.message);
          }
        }

        prod.status = 'Live';
        prod.etsyListingId = listingId;
        prod.etsyUrl = createRes.url || `https://www.etsy.com/listing/${listingId}`;
        prod.listedAt = new Date().toISOString();

        published.push({
          code,
          name: prod.name,
          etsyListingId: listingId,
          etsyUrl: prod.etsyUrl,
          mode: 'Live on Etsy'
        });
      }
    } catch (err) {
      errors.push({
        code,
        name: prod.name,
        reason: err.message
      });
    }
  }

  // Update brand catalog state & persist
  if (brandState) {
    brand.productsLive = catalog.filter(p => p.status === 'Live').length;
    const { persistBrandsState } = require('./brands');
    await persistBrandsState(brandState);
  }

  // Broadcast Telegram Alert
  try {
    const bot = getTeamBot();
    if (bot && process.env.TELEGRAM_TEAM_CHAT_ID) {
      bot.sendMessage(
        process.env.TELEGRAM_TEAM_CHAT_ID,
        `🚀 *Bulk Etsy Publish Report — ${brand?.name || `Brand ${brandId}`}*\n\n` +
        `• *Successfully Listed:* ${published.length} Products\n` +
        `• *Skipped / Errors:* ${errors.length} Products\n` +
        `• *Total Live Catalog:* ${brand?.productsLive || published.length} / ${brand?.productsTarget || 100}\n` +
        `• *Published By:* ${req.user.profile?.name || req.user.id || 'Admin'}`,
        { parse_mode: 'Markdown' }
      ).catch(() => {});
    }
  } catch (e) {}

  return ok(res, {
    brandId: String(brandId),
    brandName: brand?.name,
    totalAttempted: targetProducts.length,
    publishedCount: published.length,
    failedCount: errors.length,
    published,
    errors
  });
}));

/**
 * 12. GET /api/etsy/brands/:brandId/orders
 * Orders / Receipts Dashboard
 */
router.get('/brands/:brandId/orders', requireAuth, asyncHandler(async (req, res) => {
  const { brandId } = req.params;
  const conn = await getConnection(brandId);

  if (!conn || !conn.shop_id || conn.status !== 'active') {
    // Return sample/mock orders for UI visualization
    const mockOrders = [
      { receipt_id: 301048291, buyer_email: 'sarah.m***@gmail.com', total_price: { amount: 499, divisor: 100, currency_code: 'USD' }, creation_timestamp: Math.floor(Date.now() / 1000) - 3600 * 2, status: 'Completed', listings: [{ title: 'Budget Planner 2026 Edition' }] },
      { receipt_id: 301048292, buyer_email: 'david.k***@outlook.com', total_price: { amount: 699, divisor: 100, currency_code: 'USD' }, creation_timestamp: Math.floor(Date.now() / 1000) - 3600 * 14, status: 'Completed', listings: [{ title: 'Weekly Habit & Goal Tracker' }] },
      { receipt_id: 301048293, buyer_email: 'emma.w***@yahoo.com', total_price: { amount: 599, divisor: 100, currency_code: 'USD' }, creation_timestamp: Math.floor(Date.now() / 1000) - 3600 * 36, status: 'Completed', listings: [{ title: 'ADHD Daily Focus Journal' }] }
    ];
    return ok(res, { results: mockOrders, isSimulated: true, count: mockOrders.length });
  }

  try {
    const receipts = await etsyApiCall(brandId, `/shops/${conn.shop_id}/receipts?limit=25`);
    return ok(res, receipts);
  } catch (err) {
    return fail(res, err.message, 500);
  }
}));

module.exports = router;
