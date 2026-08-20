/**
 * src/utils/cache.js
 * ─────────────────────────────────────────────────────────────────────────────
 * In-Memory TTL Cache Wrapper for PurpleOS.
 * Delegates to centralized src/services/cache.js for unified memory store.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const cacheService = require('../services/cache');

/**
 * Set a key with TTL (in seconds)
 */
function setCache(key, value, ttlSeconds = 60) {
  cacheService.set(key, value, ttlSeconds * 1000);
}

/**
 * Get cached value if valid and not expired
 */
function getCache(key) {
  return cacheService.get(key);
}

/**
 * Invalidate cache key or pattern
 */
function clearCache(pattern = null) {
  if (!pattern) {
    cacheService.clear();
    return;
  }
  cacheService.delByPrefix(pattern);
}

module.exports = {
  setCache,
  getCache,
  clearCache
};
