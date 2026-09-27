/**
 * src/utils/csv-exporter.js
 * ─────────────────────────────────────────────────────────────────────────────
 * RFC-4180 Compliant CSV Stringifier for DCE Financial & Order Ledgers
 * ─────────────────────────────────────────────────────────────────────────────
 */

function escapeCSV(val) {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Converts array of order objects into CSV formatted string
 * @param {Array<Object>} orders 
 * @returns {string}
 */
function ordersToCSV(orders = []) {
  const headers = [
    'Order ID',
    'Channel',
    'Brand',
    'Buyer Name',
    'Buyer Email',
    'Gross GMV',
    'Marketplace Fee',
    'Net Yield',
    'Currency',
    'Status',
    'Fulfillment Type',
    'Placed At'
  ];

  const rows = orders.map(o => [
    escapeCSV(o.external_order_id || o.id),
    escapeCSV(o.channel_code),
    escapeCSV(o.brand_name),
    escapeCSV(o.customer_name),
    escapeCSV(o.customer_email),
    escapeCSV(Number(o.total_amount || 0).toFixed(2)),
    escapeCSV(Number(o.channel_fee || 0).toFixed(2)),
    escapeCSV(Number(o.net_amount || 0).toFixed(2)),
    escapeCSV(o.currency || 'USD'),
    escapeCSV(o.status),
    escapeCSV(o.fulfillment_type || 'DIGITAL'),
    escapeCSV(o.placed_at)
  ].join(','));

  return [headers.join(','), ...rows].join('\r\n');
}

/**
 * Converts settlement batch line items into disbursement CSV
 * @param {Object} batch 
 * @returns {string}
 */
function settlementBatchToCSV(batch) {
  const headers = [
    'Batch Ref',
    'Recipient Name',
    'Recipient Type',
    'Recipient ID',
    'Brand',
    'Order Count',
    'Gross Sales',
    'Channel Fees',
    'Royalty Rate',
    'Net Payable',
    'GRO10X Margin',
    'Currency',
    'Payment Status',
    'Payment Reference'
  ];

  const items = batch.items || [];
  const rows = items.map(it => [
    escapeCSV(batch.batch_ref),
    escapeCSV(it.recipient_name),
    escapeCSV(it.recipient_type),
    escapeCSV(it.recipient_id),
    escapeCSV(it.brand_name || 'Brand'),
    escapeCSV(it.order_count),
    escapeCSV(Number(it.gross_revenue || 0).toFixed(2)),
    escapeCSV(Number(it.channel_fees || 0).toFixed(2)),
    escapeCSV(`${(Number(it.royalty_rate || 0) * 100).toFixed(1)}%`),
    escapeCSV(Number(it.net_payable || 0).toFixed(2)),
    escapeCSV(Number(it.gro10x_margin || 0).toFixed(2)),
    escapeCSV(it.currency || 'USD'),
    escapeCSV(it.status),
    escapeCSV(it.payment_ref || '')
  ].join(','));

  return [headers.join(','), ...rows].join('\r\n');
}

module.exports = {
  escapeCSV,
  ordersToCSV,
  settlementBatchToCSV
};
