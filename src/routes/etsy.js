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
const multer = require('multer');
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
  uploadListingImage,
  uploadListingFile,
  uploadListingVideo,
  updateListing,
  renewListing,
  deactivateListing,
  reactivateListing,
  getActiveListings,
  fetchFileBuffer,
  ETSY_KEYSTRING,
  ETSY_SHARED_SECRET,
  ETSY_REDIRECT_URI
} = require('../services/etsy');

// Memory storage for direct image/file/video proxy uploads (up to 100MB for video)
const etsyUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }
});

// Helper to fetch brand and catalog from persisted brands state
async function getBrandData(brandId) {
  const brandKey = parseInt(brandId, 10);
  const { loadBrandsState } = require('./brands');
  const state = await loadBrandsState();
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
  const { productCodes, autoActivate = true, dryRun = false } = req.body;
  const { state: brandState, brand, catalog } = await getBrandData(brandId);

  const conn = await getConnection(brandId);
  const isSimulated = !conn || !conn.shop_id || conn.status !== 'active';

  // If not in dry-run mode and the shop is not properly connected, reject immediately.
  // We never silently fake a "Live" listing — that hides a broken Etsy connection from the operator.
  if (!dryRun && isSimulated) {
    const reason = !conn
      ? 'No Etsy connection found. Connect via OAuth in Brand Settings.'
      : !conn.shop_id
        ? 'Etsy shop ID is missing. Re-connect your Etsy account via Brand Settings to complete the OAuth flow.'
        : 'Etsy connection is inactive. Re-authenticate in Brand Settings.';
    return fail(res, reason, 503);
  }

  const targetProducts = productCodes && productCodes.length > 0
    ? catalog.filter(p => productCodes.includes(p.code || p.productCode))
    : catalog.filter(p => ['Pending Review', 'QA Approved', 'SEO Ready', 'Staged', 'Live'].includes(p.status) || !p.status);

  if (targetProducts.length === 0) {
    return fail(res, 'No products found ready for Etsy listing. Complete Studio Engine steps first.', 400);
  }

  // Pre-flight cost check
  if (dryRun) {
    const feePerListing = 0.20;
    const totalEstimatedFee = Number((targetProducts.length * feePerListing).toFixed(2));
    return ok(res, {
      dryRun: true,
      brandId: String(brandId),
      targetCount: targetProducts.length,
      feePerListing,
      totalEstimatedFee,
      isSimulated,
      products: targetProducts.map(p => ({
        code: p.code || p.productCode,
        name: p.name,
        price: p.price || 4.99,
        status: p.status
      }))
    });
  }

  const published = [];
  const errors = [];
  const now = Date.now();
  const listedIso = new Date(now).toISOString();
  const expiresIso = new Date(now + 120 * 86400000).toISOString(); // 120 days = 4 months

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
        // Real Live Etsy v3 API Call
        const priceCents = Math.round((prod.price || 4.99) * 100);
        const tags = (prod.seoTags || ['planner', 'printable']).slice(0, 13).map(t => t.slice(0, 20));

        const taxonomyId = prod.taxonomyId || prod.taxonomy_id || ((prod.type || prod.format || prod.category || '').toLowerCase().includes('print') ? 2078 : 12476);

        // Etsy title rules: & can only appear ONCE, no | pipes, no leading special chars, max 140 chars
        const rawTitle = (prod.seoTitle || prod.seo?.title || prod.name || '').trim();
        const etsyTitle = rawTitle
          .replace(/&/g, 'and')       // Replace all & with 'and' (& allowed max once, safest to replace all)
          .replace(/\|/g, '-')         // Pipes not allowed
          .replace(/[#@]/g, '')        // # and @ not allowed
          .replace(/—|–/g, '-')        // Em/en dashes → hyphen
          .replace(/\s+/g, ' ')        // Normalize whitespace
          .trim()
          .slice(0, 140);

        const listingPayload = {
          quantity: 999,
          title: etsyTitle,
          description: prod.seoDescription || prod.seo?.description || `Instant digital download printable template. High-resolution vector PDF layout ready for print or GoodNotes.`,
          price: priceCents / 100,
          who_made: 'i_did',
          when_made: '2020_2026',
          taxonomy_id: taxonomyId,
          is_supply: false,
          type: 'download',
          tags: tags
        };

        const createRes = await etsyApiCall(brandId, `/shops/${conn.shop_id}/listings`, {
          method: 'POST',
          body: JSON.stringify(listingPayload)
        });

        const listingId = createRes.listing_id;

        // 1. Stream Mockup Images to Etsy Listing if available
        const mockupsToUpload = Array.isArray(prod.mockups) ? prod.mockups : (Array.isArray(prod.mockupUrls) ? prod.mockupUrls.map((u, idx) => ({ url: u, rank: idx + 1 })) : []);
        if (mockupsToUpload.length > 0 && listingId) {
          for (let mIdx = 0; mIdx < Math.min(10, mockupsToUpload.length); mIdx++) {
            const m = mockupsToUpload[mIdx];
            try {
              const imgBuf = await fetchFileBuffer(m.storagePath || m.url || m);
              if (imgBuf) {
                await uploadListingImage(
                  brandId,
                  conn.shop_id,
                  listingId,
                  imgBuf,
                  m.fileName || `mockup_${mIdx + 1}.jpg`,
                  mIdx + 1,
                  prod.seoTitle || prod.name
                );
              }
            } catch (imgErr) {
              console.warn(`[Etsy Mockup Stream Note (${code} - #${mIdx + 1})]:`, imgErr.message);
            }
          }
        }

        // 2. Stream Digital Deliverable PDF to Etsy Listing if available
        if ((prod.vault?.storagePath || prod.vault?.downloadUrl) && listingId) {
          try {
            const fileBuf = await fetchFileBuffer(prod.vault.storagePath || prod.vault.downloadUrl);
            if (fileBuf) {
              await uploadListingFile(
                brandId,
                conn.shop_id,
                listingId,
                fileBuf,
                prod.vault.fileName || `${code}_deliverable.pdf`,
                1
              );
            }
          } catch (fileErr) {
            console.warn(`[Etsy Vault File Stream Note (${code})]:`, fileErr.message);
          }
        }

        // 3. Stream Video to Etsy Listing if available
        const videoSource = prod.video?.storagePath || prod.video?.downloadUrl || prod.video?.url || (typeof prod.video === 'string' ? prod.video : null);
        if (videoSource && listingId) {
          try {
            const videoBuf = await fetchFileBuffer(videoSource);
            if (videoBuf) {
              await uploadListingVideo(
                brandId,
                conn.shop_id,
                listingId,
                videoBuf,
                prod.video?.fileName || `${code}_video.mp4`
              );
            }
          } catch (vidErr) {
            console.warn(`[Etsy Video Stream Note (${code})]:`, vidErr.message);
          }
        }

        // 4. Activate listing
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
        prod.listedAt = listedIso;
        prod.expiresAt = expiresIso;
        prod.listingFeeCharged = 0.20;

        published.push({
          code,
          name: prod.name,
          etsyListingId: listingId,
          etsyUrl: prod.etsyUrl,
          listedAt: listedIso,
          expiresAt: expiresIso,
          listingFeeCharged: 0.20,
          mode: 'Live on Etsy'
        });

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
    brand.totalListingFeesCharged = Number(((brand.totalListingFeesCharged || 0) + (published.length * 0.20)).toFixed(2));
    const { persistBrandsState, saveProductAssets } = require('./brands');
    if (typeof saveProductAssets === 'function') {
      for (const pub of published) {
        await saveProductAssets(brandId, pub.code, {
          status: 'Live',
          etsyListingId: pub.etsyListingId,
          etsyUrl: pub.etsyUrl,
          listedAt: pub.listedAt,
          expiresAt: pub.expiresAt,
          listingFeeCharged: pub.listingFeeCharged
        });
      }
    }
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

/**
 * 13. POST /api/etsy/brands/:brandId/listings/:listingId/upload-images
 * Accepts multipart files (up to 10) OR JSON payload with mockup URLs / storagePaths,
 * and uploads them sequentially to the Etsy listing images API.
 */
router.post('/brands/:brandId/listings/:listingId/upload-images', requireAuth, etsyUpload.array('mockups', 10), asyncHandler(async (req, res) => {
  const { brandId, listingId } = req.params;
  const files = req.files || [];
  const { mockups, mockupUrls } = req.body;
  const conn = await getConnection(brandId);

  if (!conn || !conn.shop_id || conn.status !== 'active') {
    return fail(res, `Etsy store for Brand ${brandId} is not connected. Connect via OAuth first.`, 400);
  }

  const results = [];
  const errors = [];

  // Case A: Direct multipart file buffers
  if (files && files.length > 0) {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const uploadRes = await uploadListingImage(
          brandId,
          conn.shop_id,
          listingId,
          file.buffer,
          file.originalname,
          i + 1
        );
        results.push({ rank: i + 1, fileName: file.originalname, listingImageId: uploadRes.listing_image_id, url: uploadRes.url_570xN || uploadRes.url_fullxfull });
      } catch (err) {
        errors.push({ rank: i + 1, fileName: file.originalname, error: err.message });
      }
    }
  }
  // Case B: Cloud Vault URLs or StoragePaths
  else {
    let rawList = [];
    if (Array.isArray(mockups)) rawList = mockups;
    else if (Array.isArray(mockupUrls)) rawList = mockupUrls;
    else if (typeof mockupUrls === 'string') {
      try { rawList = JSON.parse(mockupUrls); } catch (e) { rawList = [mockupUrls]; }
    } else if (typeof mockups === 'string') {
      try { rawList = JSON.parse(mockups); } catch (e) { rawList = [mockups]; }
    }

    for (let i = 0; i < rawList.length; i++) {
      const item = rawList[i];
      const pathOrUrl = typeof item === 'string' ? item : (item.storagePath || item.url);
      const name = (typeof item === 'object' && item.fileName) ? item.fileName : `mockup_${i + 1}.jpg`;
      try {
        const imgBuf = await fetchFileBuffer(pathOrUrl);
        if (imgBuf) {
          const uploadRes = await uploadListingImage(
            brandId,
            conn.shop_id,
            listingId,
            imgBuf,
            name,
            i + 1
          );
          results.push({ rank: i + 1, fileName: name, listingImageId: uploadRes.listing_image_id, url: uploadRes.url_570xN || uploadRes.url_fullxfull });
        }
      } catch (err) {
        errors.push({ rank: i + 1, path: pathOrUrl, error: err.message });
      }
    }
  }

  return ok(res, {
    brandId,
    listingId,
    uploadedCount: results.length,
    failedCount: errors.length,
    results,
    errors
  });
}));

/**
 * 14. POST /api/etsy/brands/:brandId/listings/:listingId/upload-file
 * Accepts single file (multipart) OR storagePath / downloadUrl (JSON),
 * and streams it directly to Etsy listing digital files API.
 */
router.post('/brands/:brandId/listings/:listingId/upload-file', requireAuth, etsyUpload.single('file'), asyncHandler(async (req, res) => {
  const { brandId, listingId } = req.params;
  const file = req.file;
  const { storagePath, downloadUrl, fileName } = req.body;
  const conn = await getConnection(brandId);

  if (!conn || !conn.shop_id || conn.status !== 'active') {
    return fail(res, `Etsy store for Brand ${brandId} is not connected. Connect via OAuth first.`, 400);
  }

  let fileBuffer = null;
  let name = fileName || 'deliverable.pdf';

  if (file) {
    fileBuffer = file.buffer;
    name = file.originalname;
  } else if (storagePath || downloadUrl) {
    fileBuffer = await fetchFileBuffer(storagePath || downloadUrl);
  }

  if (!fileBuffer) {
    return fail(res, 'No deliverable file provided. Upload a PDF/ZIP or provide storagePath/downloadUrl.', 400);
  }

  try {
    const uploadRes = await uploadListingFile(
      brandId,
      conn.shop_id,
      listingId,
      fileBuffer,
      name,
      1
    );

    return ok(res, {
      brandId,
      listingId,
      file: uploadRes,
      message: 'Deliverable attached to Etsy listing successfully'
    });
  } catch (err) {
    return fail(res, `Etsy digital file upload failed: ${err.message}`, 500);
  }
}));

/**
 * 15. POST /api/etsy/brands/:brandId/listings/:listingId/upload-video
 * Accepts video file (multipart, up to 100MB) OR storagePath / downloadUrl (JSON)
 * and streams it directly to the Etsy listing videos API.
 */
router.post('/brands/:brandId/listings/:listingId/upload-video', requireAuth, etsyUpload.single('video'), asyncHandler(async (req, res) => {
  const { brandId, listingId } = req.params;
  const file = req.file;
  const { storagePath, downloadUrl, fileName, productCode } = req.body;
  const conn = await getConnection(brandId);

  if (!conn || !conn.shop_id || conn.status !== 'active') {
    return fail(res, `Etsy store for Brand ${brandId} is not connected. Connect via OAuth first.`, 400);
  }

  let videoBuffer = null;
  let name = fileName || 'listing_video.mp4';

  if (file) {
    videoBuffer = file.buffer;
    name = file.originalname;
  } else if (storagePath || downloadUrl) {
    videoBuffer = await fetchFileBuffer(storagePath || downloadUrl);
  }

  if (!videoBuffer) {
    return fail(res, 'No video file provided. Upload an MP4/MOV or provide storagePath/downloadUrl.', 400);
  }

  try {
    const uploadRes = await uploadListingVideo(
      brandId,
      conn.shop_id,
      listingId,
      videoBuffer,
      name
    );

    // If productCode provided, record video metadata in brand catalog state
    if (productCode) {
      const { state: brandState, catalog } = await getBrandData(brandId);
      const prod = catalog?.find(p => p.code === productCode || p.productCode === productCode);
      if (prod && brandState) {
        prod.video = {
          fileName: name,
          videoId: uploadRes.video_id || null,
          url: uploadRes.thumbnail_url || null,
          uploadedAt: new Date().toISOString()
        };
        const { persistBrandsState } = require('./brands');
        await persistBrandsState(brandState);
      }
    }

    return ok(res, {
      brandId,
      listingId,
      video: uploadRes,
      message: 'Video uploaded and attached to Etsy listing successfully'
    });
  } catch (err) {
    return fail(res, `Etsy video upload failed: ${err.message}`, 500);
  }
}));

/**
 * 16. PATCH /api/etsy/brands/:brandId/listings/:listingId
 * Update live Etsy listing title, price, description, tags, state
 */
router.patch('/brands/:brandId/listings/:listingId', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const { brandId, listingId } = req.params;
  const { title, description, price, tags, state: listingState, productCode } = req.body;
  const conn = await getConnection(brandId);

  if (!conn || !conn.shop_id || conn.status !== 'active') {
    return fail(res, `Etsy store for Brand ${brandId} is not connected. Connect via OAuth first.`, 400);
  }

  try {
    const result = await updateListing(brandId, conn.shop_id, listingId, {
      title,
      description,
      price,
      tags,
      state: listingState
    });

    // Also sync updates to local product catalog state
    if (productCode) {
      const { state: brandState, catalog } = await getBrandData(brandId);
      const prod = catalog?.find(p => p.code === productCode || p.productCode === productCode);
      if (prod && brandState) {
        const patch = {};
        if (title) { prod.seoTitle = title; patch.seoTitle = title; }
        if (description) { prod.seoDescription = description; patch.seoDescription = description; }
        if (price !== undefined) { prod.price = Number(price); patch.price = Number(price); }
        if (tags) { prod.seoTags = tags; patch.seoTags = tags; }
        if (listingState) { prod.status = listingState === 'active' ? 'Live' : 'Inactive'; patch.status = prod.status; }
        const { persistBrandsState, saveProductAssets } = require('./brands');
        if (typeof saveProductAssets === 'function') await saveProductAssets(brandId, productCode, patch);
        await persistBrandsState(brandState);
      }
    }

    return ok(res, {
      success: true,
      listingId,
      listing: result,
      message: 'Live Etsy listing updated successfully'
    });
  } catch (err) {
    return fail(res, `Etsy listing update failed: ${err.message}`, 500);
  }
}));

/**
 * 17. POST /api/etsy/brands/:brandId/listings/:listingId/renew
 * Renews an expired / expiring Etsy listing ($0.20 fee)
 */
router.post('/brands/:brandId/listings/:listingId/renew', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const { brandId, listingId } = req.params;
  const { productCode } = req.body;
  const conn = await getConnection(brandId);

  if (!conn || !conn.shop_id || conn.status !== 'active') {
    return fail(res, `Etsy store for Brand ${brandId} is not connected.`, 400);
  }

  try {
    const renewResult = await renewListing(brandId, listingId);
    const now = Date.now();
    const listedIso = new Date(now).toISOString();
    const expiresIso = new Date(now + 120 * 86400000).toISOString();

    // Update catalog state & track $0.20 renewal fee
    const { state: brandState, brand, catalog } = await getBrandData(brandId);
    if (brandState) {
      if (brand) {
        brand.totalListingFeesCharged = Number(((brand.totalListingFeesCharged || 0) + 0.20).toFixed(2));
      }
      const prod = catalog?.find(p => p.code === productCode || p.etsyListingId === Number(listingId) || p.etsyListingId === String(listingId));
      if (prod) {
        prod.status = 'Live';
        prod.listedAt = listedIso;
        prod.expiresAt = expiresIso;
        prod.renewalCount = (prod.renewalCount || 0) + 1;
        const { persistBrandsState, saveProductAssets } = require('./brands');
        if (typeof saveProductAssets === 'function') {
          await saveProductAssets(brandId, prod.code, {
            status: 'Live',
            listedAt: listedIso,
            expiresAt: expiresIso,
            renewalCount: prod.renewalCount
          });
        }
      }
      const { persistBrandsState } = require('./brands');
      await persistBrandsState(brandState);
    }

    return ok(res, {
      success: true,
      listingId,
      renewalFee: 0.20,
      expiresAt: expiresIso,
      result: renewResult,
      message: 'Listing renewed for 4 months ($0.20 fee logged)'
    });
  } catch (err) {
    return fail(res, `Etsy listing renewal failed: ${err.message}`, 500);
  }
}));

/**
 * 18. POST /api/etsy/brands/:brandId/listings/:listingId/deactivate
 * Deactivates a live listing
 */
router.post('/brands/:brandId/listings/:listingId/deactivate', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const { brandId, listingId } = req.params;
  const { productCode } = req.body;
  const conn = await getConnection(brandId);

  if (!conn || !conn.shop_id || conn.status !== 'active') {
    return fail(res, `Etsy store for Brand ${brandId} is not connected.`, 400);
  }

  try {
    const result = await deactivateListing(brandId, conn.shop_id, listingId);
    
    // Update local state
    const { state: brandState, brand, catalog } = await getBrandData(brandId);
    if (brandState) {
      const prod = catalog?.find(p => p.code === productCode || p.etsyListingId === Number(listingId) || p.etsyListingId === String(listingId));
      if (prod) {
        prod.status = 'Inactive';
        const { persistBrandsState, saveProductAssets } = require('./brands');
        if (typeof saveProductAssets === 'function') {
          await saveProductAssets(brandId, prod.code, { status: 'Inactive' });
        }
      }
      if (brand) {
        brand.productsLive = (catalog || []).filter(p => p.status === 'Live').length;
      }
      const { persistBrandsState } = require('./brands');
      await persistBrandsState(brandState);
    }

    return ok(res, {
      success: true,
      listingId,
      result,
      message: 'Listing deactivated on Etsy'
    });
  } catch (err) {
    return fail(res, `Etsy deactivate failed: ${err.message}`, 500);
  }
}));

/**
 * 19. POST /api/etsy/brands/:brandId/listings/:listingId/reactivate
 * Reactivates an inactive listing
 */
router.post('/brands/:brandId/listings/:listingId/reactivate', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const { brandId, listingId } = req.params;
  const { productCode } = req.body;
  const conn = await getConnection(brandId);

  if (!conn || !conn.shop_id || conn.status !== 'active') {
    return fail(res, `Etsy store for Brand ${brandId} is not connected.`, 400);
  }

  try {
    const result = await reactivateListing(brandId, conn.shop_id, listingId);

    // Update local state
    const { state: brandState, brand, catalog } = await getBrandData(brandId);
    if (brandState) {
      const prod = catalog?.find(p => p.code === productCode || p.etsyListingId === Number(listingId) || p.etsyListingId === String(listingId));
      if (prod) {
        prod.status = 'Live';
        const { persistBrandsState, saveProductAssets } = require('./brands');
        if (typeof saveProductAssets === 'function') {
          await saveProductAssets(brandId, prod.code, { status: 'Live' });
        }
      }
      if (brand) {
        brand.productsLive = (catalog || []).filter(p => p.status === 'Live').length;
      }
      const { persistBrandsState } = require('./brands');
      await persistBrandsState(brandState);
    }

    return ok(res, {
      success: true,
      listingId,
      result,
      message: 'Listing reactivated on Etsy'
    });
  } catch (err) {
    return fail(res, `Etsy reactivate failed: ${err.message}`, 500);
  }
}));

/**
 * 20. GET /api/etsy/brands/:brandId/listings
 * Fetch live active listings from Etsy for reconciliation
 */
router.get('/brands/:brandId/listings', requireAuth, asyncHandler(async (req, res) => {
  const { brandId } = req.params;
  const { limit = 100, offset = 0 } = req.query;
  const conn = await getConnection(brandId);

  if (!conn || !conn.shop_id || conn.status !== 'active') {
    return ok(res, { count: 0, results: [], isSimulated: true, message: 'Store not connected.' });
  }

  try {
    const listings = await getActiveListings(brandId, conn.shop_id, limit, offset);
    return ok(res, listings);
  } catch (err) {
    return fail(res, `Failed to fetch active listings: ${err.message}`, 500);
  }
}));

module.exports = router;

