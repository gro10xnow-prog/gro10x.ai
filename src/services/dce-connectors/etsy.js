/**
 * src/services/dce-connectors/etsy.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Etsy Connector for GRO10X Digital Commerce Engine
 * Bridges Etsy Open API v3 receipts into canonical DCE orders
 * ─────────────────────────────────────────────────────────────────────────────
 */

const CHANNEL_CODE = 'ETSY';

/**
 * Calculates standard Etsy fees (6.5% transaction + 3% payment processing + $0.25)
 * @param {number} totalAmount 
 * @returns {number}
 */
function calculateFees(totalAmount) {
  const price = Number(totalAmount) || 0;
  if (price <= 0) return 0;
  const fee = (price * 0.095) + 0.25;
  return Math.min(price, Math.round(fee * 100) / 100);
}

/**
 * Normalizes an Etsy Receipt into canonical DCE Order structure
 * @param {Object} receipt - Etsy Open API v3 receipt object
 * @returns {Object} canonical order
 */
function normalize(receipt) {
  if (!receipt || !receipt.receipt_id) {
    throw new Error('Invalid Etsy receipt: missing receipt_id');
  }

  // Grandtotal amount extraction
  let totalAmount = 0;
  let currency = 'USD';

  if (receipt.grandtotal) {
    const divisor = receipt.grandtotal.divisor || 100;
    totalAmount = Number(receipt.grandtotal.amount) / divisor;
    currency = (receipt.grandtotal.currency_code || 'USD').toUpperCase();
  } else if (receipt.total_price) {
    totalAmount = Number(receipt.total_price);
  }

  const channelFee = calculateFees(totalAmount);
  const netAmount = Math.max(0, Math.round((totalAmount - channelFee) * 100) / 100);

  const customer = {
    email: (receipt.buyer_email || '').toLowerCase().trim(),
    full_name: receipt.name || 'Etsy Buyer',
    country_code: receipt.country_iso || 'US',
    channel_identity: {
      channel: CHANNEL_CODE,
      identifier: String(receipt.buyer_user_id || receipt.receipt_id),
      email: receipt.buyer_email
    }
  };

  // Transactions / Line items
  const items = (receipt.transactions || []).map(t => {
    let unitPrice = 0;
    if (t.price) {
      unitPrice = Number(t.price.amount) / (t.price.divisor || 100);
    }
    const qty = Number(t.quantity) || 1;
    return {
      external_sku_ref: String(t.listing_id || t.sku || 'ETSY-LISTING'),
      title: t.title || 'Etsy Listing Item',
      quantity: qty,
      unit_price: unitPrice,
      line_total: Math.round(unitPrice * qty * 100) / 100
    };
  });

  // Fallback if transactions array wasn't nested
  if (items.length === 0) {
    items.push({
      external_sku_ref: String(receipt.receipt_id),
      title: 'Etsy Order Item',
      quantity: 1,
      unit_price: totalAmount,
      line_total: totalAmount
    });
  }

  const isShipped = receipt.is_shipped === true || receipt.status === 'Completed';

  return {
    channel_code: CHANNEL_CODE,
    external_order_id: String(receipt.receipt_id),
    customer,
    total_amount: totalAmount,
    currency,
    channel_fee: channelFee,
    net_amount: netAmount,
    status: isShipped ? 'COMPLETED' : 'CONFIRMED',
    fulfillment_type: receipt.is_download ? 'DIGITAL' : 'PHYSICAL',
    placed_at: receipt.create_timestamp ? new Date(receipt.create_timestamp * 1000).toISOString() : new Date().toISOString(),
    items,
    raw_payload: receipt
  };
}

/**
 * Polls receipts from Etsy Open API v3 for a specific brand
 * Reuses existing etsy service if available
 * @param {Object} options
 * @param {string|number} options.brandId
 * @param {number} [options.limit=25]
 * @returns {Promise<Array>}
 */
async function poll({ brandId, limit = 25 }) {
  try {
    const { getShopReceipts, getConnection } = require('../etsy');
    const conn = await getConnection(brandId);
    if (!conn || !conn.shop_id) {
      return { success: false, message: 'Brand does not have an active Etsy shop connected', orders: [] };
    }

    const receiptsResponse = await getShopReceipts(brandId, { limit });
    const receipts = receiptsResponse?.results || receiptsResponse?.data || [];
    const normalizedOrders = receipts.map(r => normalize(r));

    return {
      success: true,
      shop_id: conn.shop_id,
      count: normalizedOrders.length,
      orders: normalizedOrders
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
      orders: []
    };
  }
}

module.exports = {
  channelCode: CHANNEL_CODE,
  calculateFees,
  normalize,
  poll
};
