/**
 * src/routes/dce-fulfillment.js
 * ─────────────────────────────────────────────────────────────────────────────
 * GRO10X Digital Commerce Engine — Fulfillment Operations API
 * 
 * Routes:
 * - POST /api/dce/fulfillment/trigger/:orderId
 * - POST /api/dce/fulfillment/trigger-batch
 * - GET  /api/dce/fulfillment
 * - PUT  /api/dce/fulfillment/:id/tracking
 * - POST /api/dce/fulfillment/:id/resend
 * - GET  /api/dce/fulfillment/licenses
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const { supabase, isSupabaseConfigured } = require('../services/supabase');
const { ok, fail, asyncHandler } = require('../utils/response');
const {
  fulfillOrder,
  getFulfillmentJobs,
  updatePhysicalTracking,
  resendDeliveryEmail,
  getDigitalLicenses
} = require('../services/dce-fulfillment');
const { broadcast } = require('../services/sse');
const { requireDCEAdmin } = require('../middleware/dce-auth');

// Protect all fulfillment operations with DCE Admin Auth
router.use(requireDCEAdmin);

/**
 * 1. Trigger Fulfillment for a Single Order
 */
router.post('/trigger/:orderId', asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  try {
    const result = await fulfillOrder(orderId);

    if (typeof broadcast === 'function') {
      broadcast({
        type: 'DCE_FULFILLMENT_COMPLETED',
        orderId,
        allDelivered: result.allDelivered
      });
    }

    return ok(res, result);
  } catch (err) {
    return fail(res, err.message, 500);
  }
}));

/**
 * 2. Bulk Trigger Fulfillment for all Confirmed Orders (Concurrent Batch)
 */
router.post('/trigger-batch', asyncHandler(async (req, res) => {
  const batchLimit = parseInt(process.env.FULFILLMENT_BATCH_SIZE, 10) || 20;
  let confirmedOrders = [];

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('dce_orders')
        .select('id')
        .in('status', ['CONFIRMED', 'PENDING'])
        .limit(batchLimit);
      if (!error && data) confirmedOrders = data;
    } catch (e) {
      console.warn('[DCE Fulfillment DB Warning]:', e.message);
    }
  }

  const settled = await Promise.allSettled(
    confirmedOrders.map(o => fulfillOrder(o.id))
  );

  const results = settled.map((s, idx) => {
    if (s.status === 'fulfilled') return s.value;
    return { orderId: confirmedOrders[idx].id, success: false, error: s.reason?.message || 'Fulfillment error' };
  });

  return ok(res, {
    totalAttempted: confirmedOrders.length,
    results
  });
}));

/**
 * 3. List Fulfillment Jobs
 */
router.get('/', asyncHandler(async (req, res) => {
  const { status, fulfillment_type, limit } = req.query;
  const jobs = await getFulfillmentJobs({ status, fulfillment_type, limit });
  return ok(res, jobs);
}));

/**
 * 4. Update Tracking info for Physical Fulfillment
 */
router.put('/:id/tracking', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { trackingNumber, carrier } = req.body;

  if (!trackingNumber) return fail(res, 'trackingNumber is required', 400);

  try {
    const updated = await updatePhysicalTracking(id, { trackingNumber, carrier });
    return ok(res, updated);
  } catch (err) {
    return fail(res, err.message, 500);
  }
}));

/**
 * 5. Re-send Delivery Email
 */
router.post('/:id/resend', asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    const result = await resendDeliveryEmail(id);
    return ok(res, result);
  } catch (err) {
    return fail(res, err.message, 500);
  }
}));

/**
 * 6. List Digital Licenses with Optional Filtering
 */
router.get('/licenses', asyncHandler(async (req, res) => {
  const { orderId, customer_email, license_key } = req.query;
  const licenses = await getDigitalLicenses({ order_id: orderId, customer_email, license_key });
  return ok(res, licenses);
}));

module.exports = router;
