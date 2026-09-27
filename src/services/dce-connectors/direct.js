/**
 * src/services/dce-connectors/direct.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Direct Platform Connector for GRO10X Digital Commerce Engine
 * Normalizes direct web store checkouts (Next.js / Supabase / bKash / Stripe)
 * ─────────────────────────────────────────────────────────────────────────────
 */

const CHANNEL_CODE = 'DIRECT';

/**
 * Calculates payment processing gateway fee (Stripe ~2.9% + $0.30 or bKash 1.5%)
 * @param {number} totalAmount 
 * @param {string} [gateway='stripe']
 * @returns {number}
 */
function calculateFees(totalAmount, gateway = 'stripe') {
  const price = Number(totalAmount) || 0;
  if (price <= 0) return 0;
  let fee = 0;
  if (gateway.toLowerCase() === 'bkash') {
    fee = price * 0.015; // 1.5% merchant bKash fee
  } else {
    fee = (price * 0.029) + 0.30; // Stripe card fee
  }
  return Math.min(price, Math.round(fee * 100) / 100);
}

/**
 * Normalizes Direct Store Checkout into canonical DCE Order structure
 * @param {Object} order - Direct checkout order payload
 * @returns {Object} canonical order
 */
function normalize(order) {
  if (!order || (!order.order_id && !order.external_order_id && !order.id)) {
    throw new Error('Invalid Direct order: missing order identifier');
  }

  const orderId = String(order.order_id || order.external_order_id || order.id);
  const totalAmount = Number(order.total_amount || order.amount || order.price || 0);
  const currency = (order.currency || 'USD').toUpperCase();
  const gateway = order.payment_gateway || (currency === 'BDT' ? 'bkash' : 'stripe');
  const channelFee = calculateFees(totalAmount, gateway);
  const netAmount = Math.max(0, Math.round((totalAmount - channelFee) * 100) / 100);

  const customer = {
    email: (order.customer_email || order.email || '').toLowerCase().trim(),
    phone: order.customer_phone || order.phone || '',
    full_name: order.customer_name || order.name || 'Direct Customer',
    country_code: order.country_code || (currency === 'BDT' ? 'BD' : 'US'),
    channel_identity: {
      channel: CHANNEL_CODE,
      identifier: orderId,
      email: order.customer_email || order.email
    }
  };

  const lineItems = (order.items || []).map(item => ({
    sku_id: item.sku_id || null,
    external_sku_ref: item.sku || item.product_code || item.item_id || 'DIRECT-SKU',
    title: item.title || item.name || 'Store Item',
    quantity: Number(item.quantity) || 1,
    unit_price: Number(item.price || item.unit_price || totalAmount),
    line_total: Number(item.line_total || (Number(item.price || totalAmount) * (Number(item.quantity) || 1)))
  }));

  if (lineItems.length === 0) {
    lineItems.push({
      external_sku_ref: orderId,
      title: order.title || 'Direct Platform Item',
      quantity: 1,
      unit_price: totalAmount,
      line_total: totalAmount
    });
  }

  return {
    channel_code: CHANNEL_CODE,
    external_order_id: orderId,
    customer,
    brand_id: order.brand_id || null,
    total_amount: totalAmount,
    currency,
    channel_fee: channelFee,
    net_amount: netAmount,
    status: order.payment_status === 'paid' ? 'COMPLETED' : (order.status || 'CONFIRMED'),
    fulfillment_type: order.fulfillment_type || 'HYBRID',
    placed_at: order.placed_at ? new Date(order.placed_at).toISOString() : new Date().toISOString(),
    items: lineItems,
    raw_payload: order
  };
}

module.exports = {
  channelCode: CHANNEL_CODE,
  calculateFees,
  normalize
};
