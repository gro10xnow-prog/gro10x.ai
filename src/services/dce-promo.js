/**
 * src/services/dce-promo.js
 * ─────────────────────────────────────────────────────────────────────────────
 * GRO10X Digital Commerce Engine — Promotion & Coupon Engine
 * Handles coupon validation, spend threshold evaluation, and discount computation
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { supabase, isSupabaseConfigured } = require('./supabase');

// In-Memory Fallback Coupons
let memCoupons = [
  {
    id: 'coup-01',
    code: 'PQWELCOME10',
    brand_id: 'b-pq-01',
    brand_name: 'PlannerQueen',
    discount_type: 'PERCENTAGE',
    discount_value: 10.00,
    min_order_usd: 5.00,
    max_discount_usd: 15.00,
    max_uses: 1000,
    used_count: 24,
    is_active: true,
    expires_at: new Date(Date.now() + 90 * 86400000).toISOString()
  },
  {
    id: 'coup-02',
    code: 'SAVE5NOW',
    brand_id: 'b-pq-01',
    brand_name: 'PlannerQueen',
    discount_type: 'FIXED_AMOUNT',
    discount_value: 5.00,
    min_order_usd: 15.00,
    max_discount_usd: null,
    max_uses: 500,
    used_count: 12,
    is_active: true,
    expires_at: new Date(Date.now() + 60 * 86400000).toISOString()
  },
  {
    id: 'coup-03',
    code: 'GROGLOBAL15',
    brand_id: null,
    brand_name: 'Global (All Brands)',
    discount_type: 'PERCENTAGE',
    discount_value: 15.00,
    min_order_usd: 10.00,
    max_discount_usd: 25.00,
    max_uses: null,
    used_count: 65,
    is_active: true,
    expires_at: null
  },
  {
    id: 'coup-04',
    code: 'VIP50',
    brand_id: null,
    brand_name: 'VIP Direct Sale',
    discount_type: 'PERCENTAGE',
    discount_value: 50.00,
    min_order_usd: 0,
    max_discount_usd: 100.00,
    max_uses: null,
    used_count: 5,
    is_active: true,
    expires_at: null
  },
  {
    id: 'coup-05',
    code: 'SUMMER20',
    brand_id: null,
    brand_name: 'Summer Campaign',
    discount_type: 'PERCENTAGE',
    discount_value: 20.00,
    min_order_usd: 0,
    max_discount_usd: 50.00,
    max_uses: null,
    used_count: 10,
    is_active: true,
    expires_at: null
  }
];

/**
 * Validates a coupon code and calculates discount against an order payload
 * Supports evaluateCoupon({ code, orderTotal, ... }) or evaluateCoupon(code, { orderTotal, ... })
 */
async function evaluateCoupon(arg1, arg2) {
  let code = '';
  let orderTotal = 0;
  let brandId = null;
  let skuIds = [];

  if (typeof arg1 === 'string') {
    code = arg1;
    const opts = arg2 || {};
    orderTotal = opts.orderTotal || opts.orderAmount || 0;
    brandId = opts.brandId;
    skuIds = opts.skuIds || (opts.skuId ? [opts.skuId] : []);
  } else if (arg1 && typeof arg1 === 'object') {
    code = arg1.code;
    orderTotal = arg1.orderTotal || arg1.orderAmount || 0;
    brandId = arg1.brandId;
    skuIds = arg1.skuIds || (arg1.skuId ? [arg1.skuId] : []);
  }

  if (!code) throw new Error('Coupon code is required');
  const normalizedCode = code.trim().toUpperCase();
  const total = Number(orderTotal) || 0;

  let coupon = null;

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('dce_coupons')
        .select('*, dce_brands(name)')
        .eq('code', normalizedCode)
        .maybeSingle();

      if (!error && data) {
        coupon = {
          ...data,
          brand_name: data.dce_brands?.name || 'Global'
        };
      }
    } catch (e) {
      console.warn('[DCE Promo DB Lookup Note]:', e.message);
    }
  }

  if (!coupon) {
    coupon = memCoupons.find(c => c.code === normalizedCode);
  }

  if (!coupon) {
    return {
      valid: false,
      reason: 'COUPON_NOT_FOUND',
      message: `Coupon code '${normalizedCode}' does not exist.`
    };
  }

  if (!coupon.is_active) {
    return {
      valid: false,
      reason: 'COUPON_INACTIVE',
      message: `Coupon code '${normalizedCode}' is currently inactive.`
    };
  }

  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return {
      valid: false,
      reason: 'COUPON_EXPIRED',
      message: `Coupon code '${normalizedCode}' expired on ${new Date(coupon.expires_at).toLocaleDateString()}.`
    };
  }

  if (coupon.max_uses && (coupon.used_count || 0) >= coupon.max_uses) {
    return {
      valid: false,
      reason: 'MAX_USES_REACHED',
      message: `Coupon code '${normalizedCode}' has reached its maximum redemption limit.`
    };
  }

  if (coupon.brand_id && brandId && coupon.brand_id !== brandId) {
    return {
      valid: false,
      reason: 'BRAND_MISMATCH',
      message: `Coupon code '${normalizedCode}' is only valid for brand: ${coupon.brand_name}.`
    };
  }

  if (coupon.min_order_usd && total < Number(coupon.min_order_usd)) {
    return {
      valid: false,
      reason: 'MIN_SPEND_NOT_MET',
      message: `Minimum order amount of $${Number(coupon.min_order_usd).toFixed(2)} required to use this code.`,
      minOrderRequired: Number(coupon.min_order_usd)
    };
  }

  // Calculate discount
  let discountAmount = 0;
  if (coupon.discount_type === 'PERCENTAGE') {
    discountAmount = (total * (Number(coupon.discount_value) / 100));
    if (coupon.max_discount_usd && discountAmount > Number(coupon.max_discount_usd)) {
      discountAmount = Number(coupon.max_discount_usd);
    }
  } else {
    // Fixed amount discount
    discountAmount = Math.min(total, Number(coupon.discount_value));
  }

  discountAmount = Math.round(discountAmount * 100) / 100;
  const finalAmount = Math.max(0, Math.round((total - discountAmount) * 100) / 100);

  return {
    valid: true,
    code: coupon.code,
    couponId: coupon.id,
    brandId: coupon.brand_id,
    brandName: coupon.brand_name,
    discountType: coupon.discount_type,
    discountValue: Number(coupon.discount_value),
    originalTotal: total,
    discountAmount,
    discount_amount: discountAmount,
    finalAmount,
    coupon
  };
}

/**
 * Increments the coupon redemption counter after an order is placed
 * @param {string} couponId 
 */
async function recordCouponRedemption(couponId) {
  if (!couponId) return;

  if (isSupabaseConfigured() && couponId.length === 36) {
    try {
      const { data } = await supabase.from('dce_coupons').select('used_count').eq('id', couponId).single();
      if (data) {
        await supabase.from('dce_coupons').update({
          used_count: (data.used_count || 0) + 1,
          updated_at: new Date().toISOString()
        }).eq('id', couponId);
      }
    } catch (e) {}
  } else {
    const c = memCoupons.find(item => item.id === couponId);
    if (c) c.used_count = (c.used_count || 0) + 1;
  }
}

/**
 * List all coupons
 */
async function getCoupons({ brandId } = {}) {
  if (isSupabaseConfigured()) {
    try {
      let query = supabase.from('dce_coupons').select('*, dce_brands(name)').order('created_at', { ascending: false });
      if (brandId && brandId !== 'ALL') query = query.eq('brand_id', brandId);
      const { data, error } = await query;
      if (!error && data) {
        return data.map(c => ({
          ...c,
          brand_name: c.dce_brands?.name || 'Global'
        }));
      }
    } catch (e) {}
  }

  let results = [...memCoupons];
  if (brandId && brandId !== 'ALL') results = results.filter(c => c.brand_id === brandId);
  return results;
}

/**
 * Create a new promotion coupon
 */
async function createCoupon(data) {
  const code = (data.code || '').trim().toUpperCase();
  if (!code) throw new Error('Coupon code is required');
  if (!data.discount_value) throw new Error('discount_value is required');

  const couponRecord = {
    code,
    brand_id: data.brand_id || null,
    discount_type: data.discount_type || 'PERCENTAGE',
    discount_value: Number(data.discount_value),
    min_order_usd: Number(data.min_order_usd || 0),
    max_discount_usd: data.max_discount_usd ? Number(data.max_discount_usd) : null,
    max_uses: data.max_uses ? Number(data.max_uses) : null,
    is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
    expires_at: data.expires_at || null
  };

  if (isSupabaseConfigured()) {
    try {
      const { data: created, error } = await supabase
        .from('dce_coupons')
        .insert([couponRecord])
        .select('*, dce_brands(name)')
        .single();
      if (!error && created) {
        return {
          ...created,
          brand_name: created.dce_brands?.name || 'Global'
        };
      }
    } catch (e) {}
  }

  const newCoupon = {
    id: `coup-${Date.now()}`,
    ...couponRecord,
    brand_name: data.brand_name || 'Brand',
    used_count: 0,
    created_at: new Date().toISOString()
  };
  memCoupons.unshift(newCoupon);
  return newCoupon;
}

module.exports = {
  evaluateCoupon,
  validateCoupon: evaluateCoupon,
  recordCouponRedemption,
  getCoupons,
  createCoupon
};
