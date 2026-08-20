/**
 * src/services/cache.js
 * In-memory TTL Cache with prefix invalidation.
 * Fast, lightweight key-value store for reducing database round-trips.
 */

const store = new Map();

function get(key) {
  const item = store.get(key);
  if (!item) return null;
  if (Date.now() > item.expiry) {
    store.delete(key);
    return null;
  }
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

module.exports = {
  get,
  set,
  del,
  delByPrefix,
  clear,
  size
};
