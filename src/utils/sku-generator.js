/**
 * src/utils/sku-generator.js
 * ─────────────────────────────────────────────────────────────────────────────
 * DCE Canonical SKU Construction & Parsing Utility
 * 
 * Rule: {ProductCode}-{Format}-{Channel}-{Currency}{Price}
 * Example: PLNRQN-PDF-ETSY-USD9.99
 * ─────────────────────────────────────────────────────────────────────────────
 */

const VALID_CHANNELS = ['ETSY', 'AMAZON', 'GUMROAD', 'DARAZ', 'DIRECT', 'OTHER'];
const VALID_FORMATS = ['PDF', 'PRINT', 'BUNDLE', 'SPREADSHEET', 'VIDEO', 'SAAS', 'PHYSICAL', 'GLB_USDZ'];

/**
 * Generate a canonical DCE SKU string
 * @param {Object} params
 * @param {string} params.productCode - e.g. "PLNRQN" or "PLNRQN-01"
 * @param {string} params.format - e.g. "PDF", "PRINT", "BUNDLE"
 * @param {string} params.channelCode - e.g. "ETSY", "AMAZON", "GUMROAD"
 * @param {string} [params.currency='USD'] - e.g. "USD", "BDT", "EUR"
 * @param {number|string} params.price - e.g. 9.99 or "14.99"
 * @returns {string} canonical SKU
 */
function generateSKU({ productCode, format, channelCode, currency = 'USD', price }) {
  if (!productCode) throw new Error('productCode is required for SKU generation');
  if (!format) throw new Error('format is required for SKU generation');
  if (!channelCode) throw new Error('channelCode is required for SKU generation');
  if (price === undefined || price === null || isNaN(Number(price))) {
    throw new Error('Valid price is required for SKU generation');
  }

  const cleanCode = String(productCode).toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 12);
  const cleanFormat = String(format).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
  const cleanChannel = String(channelCode).toUpperCase().replace(/[^A-Z0-9]/g, '');
  const cleanCurrency = String(currency).toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3) || 'USD';
  
  const numPrice = Number(price);
  const formattedPrice = numPrice % 1 === 0 ? numPrice.toString() : numPrice.toFixed(2);

  return `${cleanCode}-${cleanFormat}-${cleanChannel}-${cleanCurrency}${formattedPrice}`;
}

/**
 * Parse an existing DCE SKU string into constituent parts
 * @param {string} skuString 
 * @returns {Object|null}
 */
function parseSKU(skuString) {
  if (!skuString || typeof skuString !== 'string') return null;
  const parts = skuString.split('-');
  if (parts.length < 4) return null;

  // The last part is Currency + Price (e.g. "USD9.99" or "BDT1499")
  const priceToken = parts[parts.length - 1];
  const channelCode = parts[parts.length - 2];
  const format = parts[parts.length - 3];
  const productCode = parts.slice(0, parts.length - 3).join('-');

  const match = priceToken.match(/^([A-Z]{3})([\d.]+)$/);
  const currency = match ? match[1] : 'USD';
  const price = match ? parseFloat(match[2]) : 0;

  return {
    rawSKU: skuString,
    productCode,
    format,
    channelCode,
    currency,
    price
  };
}

/**
 * Validates whether a SKU string adheres to the canonical pattern
 * @param {string} skuString
 * @returns {boolean}
 */
function isValidSKU(skuString) {
  if (!skuString || typeof skuString !== 'string') return false;
  return /^[A-Z0-9-]+-[A-Z0-9]+-[A-Z0-9]+-[A-Z]{3}\d+(\.\d{1,2})?$/.test(skuString);
}

module.exports = {
  generateSKU,
  parseSKU,
  isValidSKU,
  VALID_CHANNELS,
  VALID_FORMATS
};
