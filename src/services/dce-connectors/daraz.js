/**
 * src/services/dce-connectors/daraz.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Daraz Open Platform Connector Scaffold for GRO10X Digital Commerce Engine
 * Normalizes South Asian marketplace orders, COD settlements, and commission
 * ─────────────────────────────────────────────────────────────────────────────
 */

const CHANNEL_CODE = 'DARAZ';

/**
 * Calculates standard Daraz marketplace fees (~8% commission + payment fee)
 * @param {number} totalAmount 
 * @returns {number}
 */
function calculateFees(totalAmount) {
  const price = Number(totalAmount) || 0;
  if (price <= 0) return 0;
  const fee = price * 0.085;
  return Math.min(price, Math.round(fee * 100) / 100);
}

/**
 * Normalizes Daraz Open Platform Order into canonical DCE Order structure
 * @param {Object} order - Daraz Open Platform order object
 * @returns {Object} canonical order
 */
function normalize(order) {
  if (!order || !order.order_id) {
    throw new Error('Invalid Daraz order: missing order_id');
  }

  const totalAmount = Number(order.price || order.total_amount || 0);
  const currency = (order.currency || 'BDT').toUpperCase();
  const channelFee = calculateFees(totalAmount);
  const netAmount = Math.max(0, Math.round((totalAmount - channelFee) * 100) / 100);

  const customer = {
    email: order.customer_email || '',
    phone: order.customer_phone || order.shipping_address?.phone || '',
    full_name: `${order.customer_first_name || ''} ${order.customer_last_name || ''}`.trim() || 'Daraz Buyer',
    country_code: 'BD',
    channel_identity: {
      channel: CHANNEL_CODE,
      identifier: String(order.order_id)
    }
  };

  const statusMap = {
    'pending': 'PENDING',
    'ready_to_ship': 'PROCESSING',
    'shipped': 'DISPATCHED',
    'delivered': 'DELIVERED',
    'canceled': 'CANCELLED',
    'returned': 'REFUNDED'
  };

  const status = statusMap[order.statuses?.[0] || order.status] || 'CONFIRMED';

  const items = (order.order_items || []).map(item => ({
    external_sku_ref: String(item.sku || item.item_id || 'DARAZ-SKU'),
    title: item.name || 'Daraz Retail Item',
    quantity: 1,
    unit_price: Number(item.item_price || totalAmount),
    line_total: Number(item.item_price || totalAmount)
  }));

  if (items.length === 0) {
    items.push({
      external_sku_ref: String(order.order_id),
      title: 'Daraz Marketplace Items',
      quantity: Number(order.items_count || 1),
      unit_price: totalAmount,
      line_total: totalAmount
    });
  }

  return {
    channel_code: CHANNEL_CODE,
    external_order_id: String(order.order_id),
    customer,
    total_amount: totalAmount,
    currency,
    channel_fee: channelFee,
    net_amount: netAmount,
    status,
    fulfillment_type: 'PHYSICAL',
    placed_at: order.created_at ? new Date(order.created_at).toISOString() : new Date().toISOString(),
    items,
    raw_payload: order
  };
}

module.exports = {
  channelCode: CHANNEL_CODE,
  calculateFees,
  normalize
};
