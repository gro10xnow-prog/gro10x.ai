/**
 * src/utils/cache.js
 * ─────────────────────────────────────────────────────────────────────────────
 * In-Memory TTL Cache Manager for PurpleOS.
 * Provides fast response caching for analytics, services catalog, and CMS.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const cacheStore = new Map();

/**
 * Set a key with TTL (in seconds)
 */
function setCache(key, value, ttlSeconds = 60) {
  const expiresAt = Date.now() + (ttlSeconds * 1000);
  cacheStore.set(key, { value, expiresAt });
}

/**
 * Get cached value if valid and not expired
 */
function getCache(key) {
  const entry = cacheStore.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    cacheStore.delete(key);
    return null;
  }

  return entry.value;
}

/**
 * Invalidate cache key or pattern
 */
function clearCache(pattern = null) {
  if (!pattern) {
    cacheStore.clear();
    return;
  }
  for (const key of cacheStore.keys()) {
    if (key.includes(pattern)) {
      cacheStore.delete(key);
    }
  }
}

module.exports = {
  setCache,
  getCache,
  clearCache
};
