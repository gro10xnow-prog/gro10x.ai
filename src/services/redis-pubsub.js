/**
 * src/services/redis-pubsub.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Optional Redis Pub/Sub adapter for PM2 multi-process & multi-pod clusters.
 * If REDIS_URL is configured, this provides zero-latency cross-worker event
 * propagation. If absent, system transparently defaults to Supabase Realtime pub/sub.
 * ─────────────────────────────────────────────────────────────────────────────
 */

let pubClient = null;
let subClient = null;
let isConnected = false;

function initRedisPubSub(onMessageCallback) {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    return false;
  }

  try {
    // Lazy-load to avoid hard dependency if running on standard single-pod Vercel
    let Redis;
    try {
      Redis = require('ioredis');
    } catch (_) {
      console.warn('ℹ️ [Redis PubSub] REDIS_URL is present but ioredis package is not installed. Defaulting to Supabase Realtime.');
      return false;
    }

    pubClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        return Math.min(times * 100, 3000);
      }
    });

    subClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        return Math.min(times * 100, 3000);
      }
    });

    subClient.subscribe('gro10x_sse_events', (err) => {
      if (!err) {
        isConnected = true;
        console.log('📡 [Redis PubSub] Cluster Realtime Bus connected via Redis.');
      }
    });

    subClient.on('message', (channel, message) => {
      if (channel === 'gro10x_sse_events' && typeof onMessageCallback === 'function') {
        try {
          const payload = JSON.parse(message);
          onMessageCallback(payload);
        } catch (_) {}
      }
    });

    pubClient.on('error', (err) => {
      console.warn('⚠️ [Redis PubSub] Publisher error:', err.message);
    });

    subClient.on('error', (err) => {
      console.warn('⚠️ [Redis PubSub] Subscriber error:', err.message);
    });

    return true;
  } catch (err) {
    console.warn('⚠️ [Redis PubSub] Init failed:', err.message);
    return false;
  }
}

function publishClusterEvent(eventData) {
  if (pubClient && isConnected) {
    try {
      pubClient.publish('gro10x_sse_events', JSON.stringify(eventData)).catch?.(() => {});
    } catch (_) {}
  }
}

function isRedisConnected() {
  return isConnected;
}

module.exports = {
  initRedisPubSub,
  publishClusterEvent,
  isRedisConnected
};
