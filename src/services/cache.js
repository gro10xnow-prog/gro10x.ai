/**
 * src/services/cache.js
 * In-memory TTL Cache with prefix invalidation.
 * Fast, lightweight key-value store for reducing database round-trips.
 */

const store = new Map();
let hits = 0;
let misses = 0;

function get(key) {
  const item = store.get(key);
  if (!item) {
    misses++;
    return null;
  }
  if (Date.now() > item.expiry) {
    store.delete(key);
    misses++;
    return null;
  }
  hits++;
  return item.value;
}

function set(key, value, ttlMs = 60000) {
  store.set(key, {
    value,
    expiry: Date.now() + ttlMs
  });
}

function del(key) {
  store.delete(key);
}

function delByPrefix(prefix) {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) {
      store.delete(key);
    }
  }
}

function clear() {
  store.clear();
  hits = 0;
  misses = 0;
}

function size() {
  let count = 0;
  const now = Date.now();
  for (const [k, v] of store.entries()) {
    if (now <= v.expiry) count++;
    else store.delete(k);
  }
  return count;
}

function stats() {
  const total = hits + misses;
  const hitRate = total > 0 ? Math.round((hits / total) * 100) : 100;
  return {
    activeKeys: size(),
    hits,
    misses,
    hitRatePercent: hitRate
  };
}

module.exports = {
  get,
  set,
  del,
  delByPrefix,
  clear,
  size,
  stats
};
