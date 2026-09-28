/**
 * src/routes/catalog.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Gro10x Master Product Catalog & Taxonomy Router
 * Exposes the normalized 7-tier product hierarchy across Engines 1 through 5.
 * Mounted at: /api/catalog
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const cache = require('../services/cache');
const {
  getEngines,
  getVerticals,
  getBrandsByVertical,
  getEngineHierarchy,
  getFullCatalogTree,
  resolveSku
} = require('../services/taxonomy');

/**
 * 0. GET /api/catalog/config
 * Returns public dynamic agency contact configuration, eliminating frontend hardcoding
 */
router.get('/config', (req, res) => {
  res.json({
    ok: true,
    baseUrl: process.env.BASE_URL || 'https://gro10x-ai.vercel.app',
    agencyPhone: process.env.AGENCY_PHONE || '+880 1711-019550',
    agencyWhatsApp: process.env.AGENCY_WHATSAPP || '8801711019550',
    agencyEmail: process.env.AGENCY_EMAIL || 'gro10xnow@gmail.com',
    defaultCurrency: 'USD',
    supportedCurrencies: ['USD', 'BDT'],
    exchangeRateUsdToBdt: 118
  });
});

/**
 * 1. GET /api/catalog/engines
 * Lists all 5 core engines and their ARR targets
 */
router.get('/engines', async (req, res) => {
  try {
    const engines = await getEngines();
    res.json({ ok: true, count: engines.length, data: engines });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * 2. GET /api/catalog/engine/:engineId
 * Returns complete vertical and brand hierarchy for a specific engine
 */
router.get('/engine/:engineId', async (req, res) => {
  try {
    const { engineId } = req.params;
    const hierarchy = await getEngineHierarchy(engineId);
    if (!hierarchy) {
      return res.status(404).json({ ok: false, error: `Engine '${engineId}' not found. Valid: engine1 to engine5.` });
    }
    res.json({ ok: true, data: hierarchy });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * 3. GET /api/catalog/verticals
 * Lists all verticals or filters by ?engineId=
 */
router.get('/verticals', async (req, res) => {
  try {
    const { engineId } = req.query;
    const verticals = await getVerticals(engineId);
    res.json({ ok: true, count: verticals.length, data: verticals });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * 4. GET /api/catalog/verticals/:verticalId/brands
 * Lists brands active under a given vertical
 */
router.get('/verticals/:verticalId/brands', async (req, res) => {
  try {
    const { verticalId } = req.params;
    const brands = await getBrandsByVertical(verticalId);
    res.json({ ok: true, count: brands.length, data: brands });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * 5. GET /api/catalog/hierarchy
 * Returns the entire company tree across all 5 engines
 */
router.get('/hierarchy', async (req, res) => {
  try {
    const tree = await getFullCatalogTree();
    res.json({ ok: true, company: 'Gro10x', enginesCount: tree.length, data: tree });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * 6. GET /api/catalog/products
 * Lists products, optionally filtered by ?brandId= or ?categoryId=
 */
router.get('/products', async (req, res) => {
  try {
    const { categoryId, brandId } = req.query;
    const cacheKey = `catalog:products:${categoryId || 'all'}:${brandId || 'all'}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }
    const { getProducts } = require('../services/taxonomy');
    const products = await getProducts({ categoryId, brandId });
    const responsePayload = { ok: true, count: products.length, data: products };
    cache.set(cacheKey, responsePayload, 60000);
    res.json(responsePayload);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * 7. GET /api/catalog/products/:productCode
 * Returns a single product/service specification with proof pack and associated SKUs
 */
router.get('/products/:productCode', async (req, res) => {
  try {
    const { productCode } = req.params;
    const { getServiceByCode } = require('../services/taxonomy');
    const product = await getServiceByCode(productCode);
    if (!product) {
      return res.status(404).json({ ok: false, error: `Product '${productCode}' not found.` });
    }
    res.json({ ok: true, data: product });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * 8. GET /api/catalog/sku/:skuCode and /api/catalog/skus/:skuCode
 * Resolves a canonical SKU and returns its product specifications and pricing
 */
const handleSkuResolve = async (req, res) => {
  try {
    const { skuCode } = req.params;
    const resolved = await resolveSku(skuCode);
    if (!resolved) {
      return res.status(404).json({ ok: false, error: `SKU '${skuCode}' could not be resolved.` });
    }
    res.json({ ok: true, data: resolved });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

router.get('/sku/:skuCode', handleSkuResolve);
router.get('/skus/:skuCode', handleSkuResolve);

/**
 * 9. POST /api/catalog/services/ingest
 * Ingests a new market opportunity or demand brief into Engine 2
 */
router.post('/services/ingest', async (req, res) => {
  try {
    const {
      ingestNewServiceOpportunity
    } = require('../services/service-ingestion');

    const result = await ingestNewServiceOpportunity(req.body || {});
    res.status(201).json({ ok: true, message: 'Service opportunity ingested successfully.', data: result });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

/**
 * 10. POST /api/catalog/services/productize-proposal/:proposalId
 * Converts an accepted bespoke client proposal into a canonical catalog service
 */
router.post('/services/productize-proposal/:proposalId', async (req, res) => {
  try {
    const { proposalId } = req.params;
    const {
      productizeProposal
    } = require('../services/service-ingestion');

    const result = await productizeProposal(proposalId);
    res.status(201).json({ ok: true, message: 'Proposal productized into canonical service.', data: result });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

/**
 * 11. POST /api/catalog/services/:productCode/generate-channel-skus
 * Regenerates or updates Fiverr Pro, Upwork, and Direct Wire SKUs for an existing service
 */
router.post('/services/:productCode/generate-channel-skus', async (req, res) => {
  try {
    const { productCode } = req.params;
    const {
      generateChannelSkusForService
    } = require('../services/service-ingestion');

    const result = await generateChannelSkusForService(productCode);
    res.json({ ok: true, message: 'Channel SKUs regenerated.', data: result });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

/**
 * 12. GET /api/catalog/services/:productCode/health-check
 * Evaluates the 10-point algorithmic health check score for a service
 */
router.get('/services/:productCode/health-check', async (req, res) => {
  try {
    const { productCode } = req.params;
    const { getServiceByCode } = require('../services/taxonomy');
    const { validateGigHealth, generateTemplateGig } = require('../services/gig-generator');

    const service = await getServiceByCode(productCode);
    if (!service) {
      return res.status(404).json({ ok: false, error: `Service '${productCode}' not found.` });
    }

    const tempSvc = {
      id: productCode,
      title: service.name,
      category: (service.category_id || '').replace('cat-e2-', ''),
      categoryName: service.category_id,
      description: service.metadata?.description || '',
      features: service.metadata?.engineering?.core_deliverables || [],
      priceUSD: `$${(service.metadata?.price_usd || 2500).toLocaleString()}`
    };

    const gig = generateTemplateGig({ service: tempSvc, gigIndex: 1 });
    const health = validateGigHealth(gig);

    res.json({ ok: true, productCode, health });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * 13. GET /api/catalog/services/:productCode/campaign-pack
 * Returns the ready-to-deploy multi-touch outbound marketing and campaign pack for a service
 */
router.get('/services/:productCode/campaign-pack', async (req, res) => {
  try {
    const { productCode } = req.params;
    const { generateServiceCampaignPack } = require('../services/campaign-generator');
    const pack = await generateServiceCampaignPack(productCode);
    res.json({ ok: true, data: pack });
  } catch (err) {
    res.status(404).json({ ok: false, error: err.message });
  }
});

/**
 * 14. GET /api/catalog/services/:productCode/scoping-questionnaire
 * Returns the interactive technical scoping questionnaire for an Engine 2 canonical service
 */
router.get('/services/:productCode/scoping-questionnaire', async (req, res) => {
  try {
    const { productCode } = req.params;
    const { generateScopingQuestionnaire } = require('../services/onboarding-spec');
    const questionnaire = await generateScopingQuestionnaire(productCode);
    res.json({ ok: true, data: questionnaire });
  } catch (err) {
    res.status(404).json({ ok: false, error: err.message });
  }
});

module.exports = router;

