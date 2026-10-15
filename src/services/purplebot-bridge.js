/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Engine 4 Bridge (PurpleBot Digital Core OS Satellite Proxy)
 * ─────────────────────────────────────────────────────────────────────────────
 * Connects GRO10X Mother OS to the standalone PurpleBot Digital Core OS platform (D:\Purple Bot).
 * Fetches real-time system health, database status, and agency telemetry
 * from Port 6000 (/api/system/health) and falls back gracefully if offline.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const PURPLEBOT_URL = process.env.PURPLEBOT_API_URL || 'http://localhost:6000';

// In-memory 60-second TTL cache for resilience
let cachedSummary = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 60 * 1000;

/**
 * Returns top-level aggregated telemetry from PurpleBot Digital Core OS.
 * @param {Object} [options] Optional controls (e.g. forceFresh for testing, custom url)
 * @returns {Promise<Object>} High-level diagnostics and telemetry summary
 */
async function getPurplebotSummary(options = {}) {
  const now = Date.now();
  if (!options.forceFresh && cachedSummary && (now - lastFetchTime) < CACHE_TTL_MS) {
    return cachedSummary;
  }

  const targetUrl = options.url || process.env.PURPLEBOT_API_URL || PURPLEBOT_URL;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    let res = null;
    let data = null;

    try {
      res = await fetch(`${targetUrl}/api/system/health`, {
        signal: controller.signal,
        headers: { 'User-Agent': 'GRO10X-Mother-OS/2.1.0' }
      });

      // Dual-endpoint check: if /api/system/health returns 404/HTML (Vercel cloud rewrite), fallback to /api/system-health
      if (!res.ok || !res.headers.get('content-type')?.includes('application/json')) {
        res = await fetch(`${targetUrl}/api/system-health`, {
          signal: controller.signal,
          headers: { 'User-Agent': 'GRO10X-Mother-OS/2.1.0' }
        });
      }

      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        data = await res.json();
      }
    } finally {
      clearTimeout(timeoutId);
    }
    if (data) {
      cachedSummary = {
        status: 'CONNECTED',
        venture: 'PURPLEBOT_CORE',
        engine: 4,
        satelliteUrl: targetUrl,
        client: 'Purplebot Digital Limited',
        health: data.status || 'healthy',
        version: data.version || '1.1.0',
        database: data.dbConnection || 'Connected',
        uptimeSeconds: Number(data.uptimeSeconds || 0),
        agencyTelemetry: {
          totalStaff: Number(data.agencyTelemetry?.totalStaff || 0),
          openTasks: Number(data.agencyTelemetry?.openTasks || 0),
          urgentTasks: Number(data.agencyTelemetry?.urgentTasks || 0),
          overdueTasks: Number(data.agencyTelemetry?.overdueTasks || 0)
        },
        botStatus: data.botStatus || {},
        lastSyncedAt: new Date().toISOString()
      };
      lastFetchTime = now;
      return cachedSummary;
    }
  } catch (err) {
    // Graceful fallback when standalone engine is offline or during cold start
    // Avoids 500 errors in Mother OS
  }

  // Fallback representation
  return {
    status: 'STANDALONE_OFFLINE',
    venture: 'PURPLEBOT_CORE',
    engine: 4,
    satelliteUrl: targetUrl,
    client: 'Purplebot Digital Limited',
    health: 'OFFLINE',
    database: 'Disconnected',
    uptimeSeconds: 0,
    agencyTelemetry: {
      totalStaff: 0,
      openTasks: 0,
      urgentTasks: 0,
      overdueTasks: 0
    },
    botStatus: {},
    note: 'PurpleBot Digital Core OS daemon is currently offline or unreachable on Port 6000. Displaying fallback values.',
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
  PURPLEBOT_URL,
  getPurplebotSummary,
  _clearCache
};
