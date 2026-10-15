/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Engine 4 Bridge (Sahanabag City Township OS Satellite Proxy)
 * ─────────────────────────────────────────────────────────────────────────────
 * Connects GRO10X Mother OS to the standalone Sahanabag City platform (D:\Sahanabag).
 * Fetches real-time diagnostics (uptime, plots, deeds, audit logs, bot mesh status)
 * from Port 7000 (/api/system/health) and falls back gracefully if offline.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const SAHANABAG_URL = process.env.SAHANABAG_API_URL || 'http://localhost:7000';

// In-memory 60-second TTL cache for resilience
let cachedSummary = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 60 * 1000;

/**
 * Returns top-level aggregated telemetry from Sahanabag City Township OS.
 * @param {Object} [options] Optional controls (e.g. forceFresh for testing, custom url)
 * @returns {Promise<Object>} High-level diagnostics and telemetry summary
 */
async function getSahanabagSummary(options = {}) {
  const now = Date.now();
  if (!options.forceFresh && cachedSummary && (now - lastFetchTime) < CACHE_TTL_MS) {
    return cachedSummary;
  }

  const targetUrl = options.url || process.env.SAHANABAG_API_URL || SAHANABAG_URL;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(`${targetUrl}/api/system/health`, {
      signal: controller.signal,
      headers: { 'User-Agent': 'GRO10X-Mother-OS/2.1.0' }
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data) {
        cachedSummary = {
          status: 'CONNECTED',
          venture: 'SAHANABAG_CITY_TOWNSHIP_OS',
          engine: 4,
          satelliteUrl: targetUrl,
          client: 'সাহানাবাগ সিটি (Sahanabag City)',
          location: 'দুবলহাটি রাজবাড়ী রোড, নওগাঁ',
          health: data.status || 'operational',
          uptimeSeconds: Number(data.uptime_seconds || 0),
          botMesh: {
            username: data.bot_mesh?.bot_username || '@NishatSharminBot',
            pollingActive: Boolean(data.bot_mesh?.polling_active)
          },
          telemetry: {
            totalPlots: Number(data.telemetry?.plots?.total || 0),
            totalDeeds: Number(data.telemetry?.deeds?.total || 0),
            totalCustomers: Number(data.telemetry?.customers?.total || 0),
            totalAuditLogs: Number(data.telemetry?.audit_logs?.total || 0)
          },
          lastSyncedAt: new Date().toISOString()
        };
        lastFetchTime = now;
        return cachedSummary;
      }
    }
  } catch (err) {
    // Graceful fallback when standalone engine is offline or during cold start
  }

  // Fallback representation
  return {
    status: 'STANDALONE_OFFLINE',
    venture: 'SAHANABAG_CITY_TOWNSHIP_OS',
    engine: 4,
    satelliteUrl: targetUrl,
    client: 'সাহানাবাগ সিটি (Sahanabag City)',
    location: 'দুবলহাটি রাজবাড়ী রোড, নওগাঁ',
    health: 'OFFLINE',
    uptimeSeconds: 0,
    botMesh: {
      username: '@NishatSharminBot',
      pollingActive: false
    },
    telemetry: {
      totalPlots: 0,
      totalDeeds: 0,
      totalCustomers: 0,
      totalAuditLogs: 0
    },
    note: 'Sahanabag City Township OS daemon is currently offline or unreachable on Port 7000. Displaying fallback values.',
    lastSyncedAt: cachedSummary?.lastSyncedAt || null
  };
}

/**
 * Test helper to reset internal cache between test runs
 */
function _clearCache() {
  cachedSummary = null;
  lastFetchTime = 0;
}

module.exports = {
  SAHANABAG_URL,
  getSahanabagSummary,
  _clearCache
};
