/**
 * src/routes/dce-promotions.js
 * ─────────────────────────────────────────────────────────────────────────────
 * GRO10X Digital Commerce Engine — Promotions & Coupons REST API
 * 
 * Endpoints:
 * - POST /api/dce/promotions/validate        (Validate & compute cart discount)
 * - GET  /api/dce/promotions/coupons         (List coupons)
 * - POST /api/dce/promotions/coupons         (Create coupon)
 * - PUT  /api/dce/promotions/coupons/:id/toggle (Toggle active status)
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const { ok, fail, asyncHandler } = require('../utils/response');
const { evaluateCoupon, getCoupons, createCoupon } = require('../services/dce-promo');
const { supabase, isSupabaseConfigured } = require('../services/supabase');
const { requireDCEAdmin } = require('../middleware/dce-auth');
const { promoLimiter, validateSchema, whitelist, isValidUUID } = require('../middleware/dce-validate');

/**
 * 1. Validate & Compute Discount for Checkout / Simulator (PUBLIC)
 */
router.post('/validate', promoLimiter, validateSchema({
  code: { type: 'string', required: true, minLength: 1 },
  orderTotal: { type: 'number', required: true, min: 0 }
}), asyncHandler(async (req, res) => {
  const { code, orderTotal, brandId, skuIds } = req.body;

  try {
    const result = await evaluateCoupon({ code, orderTotal: Number(orderTotal), brandId, skuIds });
    return ok(res, result);
  } catch (err) {
    return fail(res, err.message, 400);
  }
}));

/**
 * 2. List Coupons (ADMIN ONLY)
 */
router.get('/coupons', requireDCEAdmin, asyncHandler(async (req, res) => {
  const { brandId } = req.query;
  const coupons = await getCoupons({ brandId });
  return ok(res, coupons);
}));

/**
 * 3. Create Coupon (ADMIN ONLY)
 */
router.post('/coupons', requireDCEAdmin, whitelist(['code', 'discount_type', 'discount_value', 'min_order_usd', 'max_discount_usd', 'max_uses', 'expires_at', 'brand_id', 'is_active']), validateSchema({
  code: { type: 'string', required: true, minLength: 2 },
  discount_type: { type: 'string', enum: ['PERCENT', 'FIXED'], required: true },
  discount_value: { type: 'number', required: true, min: 0.01 }
}), asyncHandler(async (req, res) => {
  try {
    const created = await createCoupon(req.body);
    return ok(res, created);
  } catch (err) {
    return fail(res, err.message, 400);
  }
}));

/**
 * 4. Toggle Active Status (ADMIN ONLY)
 */
router.put('/coupons/:id/toggle', requireDCEAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;

  if (isSupabaseConfigured() && isValidUUID(id)) {
    try {
      const { data, error } = await supabase
        .from('dce_coupons')
        .update({ is_active: Boolean(is_active), updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (!error && data) return ok(res, data);
      if (error) console.warn('[DCE Promo DB Warning]:', error.message);
    } catch (e) {
      console.warn('[DCE Promo DB Warning]:', e.message);
    }
  }

  const coupons = await getCoupons({});
  const c = coupons.find(item => item.id === id);
  if (!c) return fail(res, 'Coupon not found', 404);
  c.is_active = is_active !== undefined ? Boolean(is_active) : !c.is_active;

  return ok(res, c);
}));

module.exports = router;
