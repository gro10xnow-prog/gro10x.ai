/**
 * src/routes/dce-webhooks.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Inbound Webhook Dispatcher for GRO10X Digital Commerce Engine
 * 
 * Endpoints:
 * - POST /api/dce/webhooks/gumroad  (Gumroad Ping Webhook)
 * - POST /api/dce/webhooks/direct   (Direct Store Checkout)
 * - POST /api/dce/webhooks/daraz    (Daraz Webhook Callback)
 * - GET  /api/dce/webhooks/health   (Webhook Status Health Check)
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const { ok, fail, asyncHandler } = require('../utils/response');
const { getConnector, ingestCanonicalOrder } = require('../services/dce-connectors');
const { broadcast } = require('../services/sse');
const { requireWebhookSignature } = require('../middleware/dce-auth');
const { webhookLimiter } = require('../middleware/dce-validate');

// Inbound webhook rate limiter
router.use(webhookLimiter);

/**
 * Structured audit logging for inbound webhooks
 */
function auditWebhook(channel, req, externalOrderId = 'N/A') {
  console.log(`[DCE Webhook Audit] Channel: ${channel} | Order: ${externalOrderId} | IP: ${req.ip || req.socket?.remoteAddress || 'unknown'} | Timestamp: ${new Date().toISOString()}`);
}

// Webhook Health Check (PUBLIC LIVENESS PROBE)
router.get('/health', (req, res) => {
  return ok(res, {
    status: 'healthy',
    engine: 'GRO10X Digital Commerce Engine Webhook Dispatcher',
    activeConnectors: ['GUMROAD', 'ETSY', 'AMAZON', 'DARAZ', 'DIRECT'],
    timestamp: new Date().toISOString()
  });
});

/**
 * 1. Gumroad Ping Webhook Receiver
 */
router.post('/gumroad', requireWebhookSignature('GUMROAD'), asyncHandler(async (req, res) => {
  const connector = getConnector('GUMROAD');
  if (!connector) return fail(res, 'Gumroad connector unavailable', 503);

  try {
    const payload = req.body;
    const normalized = connector.normalize(payload);
    auditWebhook('GUMROAD', req, normalized.external_order_id);
    const result = await ingestCanonicalOrder(normalized, payload);

    // Notify connected SSE dashboards of new live order
    if (typeof broadcast === 'function') {
      broadcast({
        type: 'DCE_ORDER_RECEIVED',
        channel: 'GUMROAD',
        orderId: result.orderId,
        amount: normalized.total_amount
      });
    }

    return ok(res, {
      received: true,
      orderId: result.orderId,
      idempotent: result.idempotent || false
    });
  } catch (err) {
    console.error('❌ [DCE Gumroad Webhook Error]:', err.message);
    return fail(res, err.message, 400);
  }
}));

/**
 * 2. Direct Platform Checkout Receiver
 */
router.post('/direct', requireWebhookSignature('DIRECT'), asyncHandler(async (req, res) => {
  const connector = getConnector('DIRECT');
  if (!connector) return fail(res, 'Direct connector unavailable', 503);

  try {
    const payload = req.body;
    const normalized = connector.normalize(payload);
    auditWebhook('DIRECT', req, normalized.external_order_id);
    const result = await ingestCanonicalOrder(normalized, payload);

    if (typeof broadcast === 'function') {
      broadcast({
        type: 'DCE_ORDER_RECEIVED',
        channel: 'DIRECT',
        orderId: result.orderId,
        amount: normalized.total_amount
      });
    }

    return ok(res, {
      received: true,
      orderId: result.orderId,
      idempotent: result.idempotent || false
    });
  } catch (err) {
    console.error('❌ [DCE Direct Webhook Error]:', err.message);
    return fail(res, err.message, 400);
  }
}));

/**
 * 3. Daraz Callback Receiver
 */
router.post('/daraz', requireWebhookSignature('DARAZ'), asyncHandler(async (req, res) => {
  const connector = getConnector('DARAZ');
  if (!connector) return fail(res, 'Daraz connector unavailable', 503);

  try {
    const payload = req.body;
    const normalized = connector.normalize(payload);
    auditWebhook('DARAZ', req, normalized.external_order_id);
    const result = await ingestCanonicalOrder(normalized, payload);

    if (typeof broadcast === 'function') {
      broadcast({
        type: 'DCE_ORDER_RECEIVED',
        channel: 'DARAZ',
        orderId: result.orderId,
        amount: normalized.total_amount
      });
    }

    return ok(res, {
      received: true,
      orderId: result.orderId,
      idempotent: result.idempotent || false
    });
  } catch (err) {
    return fail(res, err.message, 400);
  }
}));

module.exports = router;
