/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Engine 4 Bridge (ToffeeCon 2026 Experience OS Satellite Proxy)
 * ─────────────────────────────────────────────────────────────────────────────
 * Connects GRO10X Mother OS to the standalone ToffeeCon 2026 platform (D:\Toffeecon).
 * Fetches real-time diagnostics (uptime, connected WebSockets, active stage mode)
 * and falls back gracefully with zero downtime if the satellite is offline.
 */

const TOFFEECON_URL = process.env.TOFFEECON_API_URL || 'http://localhost:5000';

// In-memory 60-second TTL cache for resilience
let cachedSummary = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 60 * 1000;

/**
 * Returns top-level aggregated telemetry from ToffeeCon 2026.
 * @param {Object} [options] Optional controls (e.g. forceFresh for testing, custom url)
 * @returns {Promise<Object>} High-level diagnostics and telemetry summary
 */
async function getToffeeconSummary(options = {}) {
  const now = Date.now();
  if (!options.forceFresh && cachedSummary && (now - lastFetchTime) < CACHE_TTL_MS) {
    return cachedSummary;
  }

  const targetUrl = options.url || process.env.TOFFEECON_API_URL || TOFFEECON_URL;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(`${targetUrl}/api/system/diagnostics`, {
      signal: controller.signal,
      headers: { 'User-Agent': 'GRO10X-Mother-OS/2.1.0' }
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data) {
        cachedSummary = {
          status: 'CONNECTED',
          venture: 'TOFFEECON_2026',
          engine: 4,
          satelliteUrl: targetUrl,
          client: 'Toffee / Banglalink',
          uptimeSeconds: Number(data.uptimeSeconds || 0),
          connectedClients: Number(data.connectedClients || 0),
          autoLoopActive: Boolean(data.autoLoopActive),
          currentStageMode: data.eventState?.currentMode || 'STANDBY',
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

  // Fallback representation
  return {
    status: 'STANDALONE_OFFLINE',
    venture: 'TOFFEECON_2026',
    engine: 4,
    satelliteUrl: targetUrl,
    client: 'Toffee / Banglalink',
    health: 'OFFLINE',
    uptimeSeconds: 0,
    connectedClients: 0,
    autoLoopActive: false,
    currentStageMode: 'OFFLINE_MOCK',
    note: 'ToffeeCon Experience OS daemon is currently offline or unreachable. Displaying fallback values.',
    lastSyncedAt: cachedSummary?.lastSyncedAt || null
  };
}

let keepAliveTimer = null;

/**
 * Starts a periodic keep-alive heartbeat ping to prevent Render free-tier cold-start dormancy.
 * Pings /api/system/diagnostics every 10 minutes (default).
 */
function startKeepAliveHeartbeat(intervalMs = 10 * 60 * 1000) {
  if (keepAliveTimer) return;
  const targetUrl = process.env.TOFFEECON_API_URL || 'https://toffeecon-2026.onrender.com';

  keepAliveTimer = setInterval(async () => {
    try {
      await fetch(`${targetUrl}/api/system/diagnostics`, {
        headers: { 'User-Agent': 'GRO10X-Mother-OS-KeepAlive/1.0' }
      });
    } catch (_) {
      // Best-effort ping; failures are silently absorbed
    }
  }, intervalMs);

  if (keepAliveTimer.unref) {
    keepAliveTimer.unref();
  }
}

/**
 * Stops the keep-alive heartbeat timer (used during testing)
 */
function stopKeepAliveHeartbeat() {
  if (keepAliveTimer) {
    clearInterval(keepAliveTimer);
    keepAliveTimer = null;
  }
}

// Auto-activate heartbeat in runtime environments outside of unit tests
if (process.env.NODE_ENV !== 'test') {
  startKeepAliveHeartbeat();
}

/**
 * Test helper to reset internal cache between test runs
 */
function _clearCache() {
  cachedSummary = null;
  lastFetchTime = 0;
}

module.exports = {
  TOFFEECON_URL,
  getToffeeconSummary,
  startKeepAliveHeartbeat,
  stopKeepAliveHeartbeat,
  _clearCache
};

