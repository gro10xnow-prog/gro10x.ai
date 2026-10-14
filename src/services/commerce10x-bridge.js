/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Engine 3 Bridge (Commerce 10X Standalone Telemetry & GMV Proxy)
 * ─────────────────────────────────────────────────────────────────────────────
 * Connects GRO10X Mother OS to the standalone Commerce 10X platform (D:\commerce10x.ai).
 * Fetches high-level executive telemetry (catalog counts, orders, GMV, ARR)
 * and falls back gracefully with zero downtime if the satellite is offline.
 */

const COMMERCE_10X_URL = process.env.COMMERCE_10X_API_URL || 'http://localhost:4000';

// In-memory 60-second TTL cache for resilience
let cachedSummary = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 60 * 1000;

/**
 * Returns top-level aggregated telemetry from Commerce 10X.
 * @param {Object} [options] Optional controls (e.g. forceFresh for testing, custom url)
 * @returns {Promise<Object>} High-level telemetry summary
 */
async function getCommerce10xSummary(options = {}) {
  const now = Date.now();
  if (!options.forceFresh && cachedSummary && (now - lastFetchTime) < CACHE_TTL_MS) {
    return cachedSummary;
  }

  const targetUrl = options.url || process.env.COMMERCE_10X_API_URL || COMMERCE_10X_URL;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(`${targetUrl}/api/telemetry/summary`, {
      signal: controller.signal,
      headers: { 'User-Agent': 'GRO10X-Mother-OS/2.1.0' }
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && (data.venture === 'COMMERCE_10X' || data.engine === 3 || data.catalog || data.sales)) {
        const grossGmv = Number(data.sales?.gross_gmv_usd ?? data.financials?.gross_gmv_usd ?? 0);
        const netProfit = Number(data.sales?.net_profit_usd ?? data.financials?.net_profit_usd ?? 0);
        const products = Number(data.catalog?.total_products || 0);
        const brands = Number(data.catalog?.total_brands || 0);
        const orders = Number(data.sales?.total_orders || 0);

        cachedSummary = {
          status: 'CONNECTED',
          venture: 'COMMERCE_10X',
          engine: 3,
          satelliteUrl: targetUrl,
          health: data.health || 'OPTIMAL',
          productsCount: products,
          brandsCount: brands,
          ordersCount: orders,
          gmvUSD: grossGmv,
          netProfitUSD: netProfit,
          arrRunRateUSD: Math.round(grossGmv * 12),
          catalog: data.catalog || {
            total_verticals: 0,
            total_brands: brands,
            total_categories: 0,
            total_products: products,
            total_skus: 0
          },
          sales: data.sales || {
            total_orders: orders,
            gross_gmv_usd: grossGmv,
            net_profit_usd: netProfit
          },
          financials: data.financials || {
            gross_gmv_usd: grossGmv,
            net_profit_usd: netProfit
          },
          licenses: data.licenses || {
            total_issued: 0,
            active_licenses: 0
          },
          lastSyncedAt: new Date().toISOString()
        };
        lastFetchTime = now;
        return cachedSummary;
      }
    }
  } catch (err) {
    // Graceful fallback when standalone engine is offline or during cold start
    // Avoids 500 errors in Mother OS
  }

  // Fallback cached representation
  return {
    status: 'STANDALONE_OFFLINE',
    venture: 'COMMERCE_10X',
    engine: 3,
    satelliteUrl: targetUrl,
    health: 'OFFLINE',
    productsCount: 44, // Baseline seeded catalog (13 brands + 44 digital products/subscriptions)
    brandsCount: 13,
    ordersCount: 0,
    gmvUSD: 0,
    netProfitUSD: 0,
    arrRunRateUSD: 0,
    catalog: {
      total_verticals: 4,
      total_brands: 13,
      total_categories: 12,
      total_products: 44,
      total_skus: 65
    },
    sales: {
      total_orders: 0,
      gross_gmv_usd: 0,
      net_profit_usd: 0
    },
    financials: {
      gross_gmv_usd: 0,
      net_profit_usd: 0
    },
    note: 'Standalone Commerce 10X platform offline. Displaying cached telemetry baseline.',
    lastSyncedAt: cachedSummary ? cachedSummary.lastSyncedAt : null
  };
}

function _clearCache() {
  cachedSummary = null;
  lastFetchTime = 0;
}

function _setCache(summary) {
  cachedSummary = summary;
  lastFetchTime = Date.now();
}

module.exports = {
  getCommerce10xSummary,
  COMMERCE_10X_URL,
  _clearCache,
  _setCache
};
