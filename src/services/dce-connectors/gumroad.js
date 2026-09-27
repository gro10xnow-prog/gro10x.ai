/**
 * src/services/dce-connectors/gumroad.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Gumroad Connector for GRO10X Digital Commerce Engine
 * Handles Gumroad Ping Webhook validation, fee calculation, and order normalization
 * ─────────────────────────────────────────────────────────────────────────────
 */

const crypto = require('crypto');

const CHANNEL_CODE = 'GUMROAD';

/**
 * Validates Gumroad webhook signature if secret configured
 * @param {string|Buffer} rawBody 
 * @param {string} signature 
 * @param {string} secret 
 * @returns {boolean}
 */
function verifySignature(rawBody, signature, secret) {
  if (!secret) return true; // dev bypass if no secret set
  if (!signature) return false;

  try {
    const hmac = crypto.createHmac('sha256', secret);
    const digest = hmac.update(rawBody).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
  } catch (err) {
    return false;
  }
}

/**
 * Calculates standard Gumroad fees (10% flat fee + payment processing)
 * @param {number} totalAmount 
 * @returns {number}
 */
function calculateFees(totalAmount) {
  const price = Number(totalAmount) || 0;
  if (price <= 0) return 0;
  // Gumroad standard fee: 10% + $0.30 payment processing fee
  const fee = (price * 0.10) + 0.30;
  return Math.min(price, Math.round(fee * 100) / 100);
}

/**
 * Normalizes Gumroad webhook payload into DCE Canonical Order shape
 * @param {Object} payload - Gumroad ping webhook body
 * @returns {Object} canonical order structure
 */
function normalize(payload) {
  if (!payload || !payload.sale_id) {
    throw new Error('Invalid Gumroad payload: missing sale_id');
  }

  // Handle prices: Gumroad may send cents or float
  let rawPrice = payload.price;
  if (typeof rawPrice === 'number' && rawPrice > 100 && !String(rawPrice).includes('.')) {
    rawPrice = rawPrice / 100;
  }
  const totalAmount = Number(rawPrice) || 0;
  const channelFee = calculateFees(totalAmount);
  const netAmount = Math.max(0, Math.round((totalAmount - channelFee) * 100) / 100);

  const customer = {
    email: (payload.email || payload.buyer_email || '').toLowerCase().trim(),
    full_name: payload.full_name || payload.buyer_name || 'Gumroad Buyer',
    country_code: payload.ip_country || payload.country || 'US',
    channel_identity: {
      channel: CHANNEL_CODE,
      identifier: payload.sale_id,
      email: payload.email
    }
  };

  const lineItems = [{
    external_sku_ref: payload.product_id || payload.product_permalink || 'GUM-PROD',
    title: payload.product_name || 'Gumroad Digital Product',
    quantity: Number(payload.quantity) || 1,
    unit_price: totalAmount,
    line_total: totalAmount
  }];

  return {
    channel_code: CHANNEL_CODE,
    external_order_id: String(payload.sale_id),
    customer,
    total_amount: totalAmount,
    currency: (payload.currency || 'USD').toUpperCase(),
    channel_fee: channelFee,
    net_amount: netAmount,
    status: 'COMPLETED', // Digital sales via Gumroad are instantly settled
    fulfillment_type: 'DIGITAL',
    placed_at: payload.created_at ? new Date(payload.created_at).toISOString() : new Date().toISOString(),
    items: lineItems,
    raw_payload: payload
  };
}

module.exports = {
  channelCode: CHANNEL_CODE,
  verifySignature,
  calculateFees,
  normalize
};
