/**
 * src/middleware/requestId.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Distributed Request ID Correlation Middleware for GRO10X Platform.
 * Attaches or propagates an X-Request-Id UUID header across request & response
 * lifecycles for unified APM and distributed log tracing.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { randomUUID } = require('crypto');

function requestIdMiddleware(req, res, next) {
  // Respect existing upstream request ID (e.g. Cloudflare, AWS ALB, Vercel) or generate new UUID
  const incomingId = req.headers['x-request-id'] || req.headers['x-correlation-id'];
  const requestId = (incomingId && typeof incomingId === 'string' && incomingId.length <= 128)
    ? incomingId
    : randomUUID();

  req.id = requestId;
  req.requestId = requestId;

  res.setHeader('X-Request-Id', requestId);
  next();
}

module.exports = requestIdMiddleware;
