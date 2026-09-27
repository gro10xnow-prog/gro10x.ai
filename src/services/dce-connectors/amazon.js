/**
 * src/services/dce-connectors/amazon.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Amazon SP-API Connector Scaffold for GRO10X Digital Commerce Engine
 * Normalizes Amazon Selling Partner API order feeds and calculates FBA/FBM fees
 * ─────────────────────────────────────────────────────────────────────────────
 */

const CHANNEL_CODE = 'AMAZON';

/**
 * Calculates standard Amazon referral fees (~15% category average)
 * @param {number} totalAmount 
 * @returns {number}
 */
function calculateFees(totalAmount) {
  const price = Number(totalAmount) || 0;
  if (price <= 0) return 0;
  const fee = price * 0.15;
  return Math.min(price, Math.round(fee * 100) / 100);
}

/**
 * Normalizes an Amazon SP-API Order payload into DCE canonical shape
 * @param {Object} order - Amazon SP-API Order object
 * @returns {Object} canonical order
 */
function normalize(order) {
  if (!order || !order.AmazonOrderId) {
    throw new Error('Invalid Amazon order: missing AmazonOrderId');
  }

  const totalAmount = Number(order.OrderTotal?.Amount || order.total_amount || 0);
  const currency = (order.OrderTotal?.CurrencyCode || order.currency || 'USD').toUpperCase();
  const channelFee = calculateFees(totalAmount);
  const netAmount = Math.max(0, Math.round((totalAmount - channelFee) * 100) / 100);

  const customer = {
    email: order.BuyerInfo?.BuyerEmail || order.buyer_email || '',
    full_name: order.BuyerInfo?.BuyerName || order.buyer_name || 'Amazon Customer',
    country_code: order.ShippingAddress?.CountryCode || 'US',
    channel_identity: {
      channel: CHANNEL_CODE,
      identifier: order.AmazonOrderId
    }
  };

  const statusMap = {
    'Pending': 'PENDING',
    'Unshipped': 'CONFIRMED',
    'PartiallyShipped': 'PROCESSING',
    'Shipped': 'DISPATCHED',
    'InvoiceUnconfirmed': 'PROCESSING',
    'Canceled': 'CANCELLED',
    'Completed': 'COMPLETED'
  };

  const status = statusMap[order.OrderStatus] || 'CONFIRMED';
  const fulfillmentType = order.FulfillmentChannel === 'AFN' ? 'PHYSICAL' : 'PHYSICAL'; // AFN = FBA, MFN = FBM

  const items = (order.OrderItems || []).map(item => ({
    external_sku_ref: item.ASIN || item.SellerSKU || 'AMZ-ASIN',
    title: item.Title || 'Amazon Catalog Item',
    quantity: Number(item.QuantityOrdered) || 1,
    unit_price: Number(item.ItemPrice?.Amount || (totalAmount / (item.QuantityOrdered || 1))),
    line_total: Number(item.ItemPrice?.Amount || totalAmount)
  }));

  if (items.length === 0) {
    items.push({
      external_sku_ref: order.AmazonOrderId,
      title: 'Amazon Order Items',
      quantity: Number(order.NumberOfItemsShipped || order.NumberOfItemsUnshipped || 1),
      unit_price: totalAmount,
      line_total: totalAmount
    });
  }

  return {
    channel_code: CHANNEL_CODE,
    external_order_id: String(order.AmazonOrderId),
    customer,
    total_amount: totalAmount,
    currency,
    channel_fee: channelFee,
    net_amount: netAmount,
    status,
    fulfillment_type: fulfillmentType,
    placed_at: order.PurchaseDate ? new Date(order.PurchaseDate).toISOString() : new Date().toISOString(),
    items,
    raw_payload: order
  };
}

module.exports = {
  channelCode: CHANNEL_CODE,
  calculateFees,
  normalize
};
