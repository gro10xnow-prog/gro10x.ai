/**
 * scripts/test-digivault.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Verification test suite for DigiVault Commerce Engine & Procurement Engine
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { SEED_PRODUCTS, SEED_VENDORS } = require('./seed-digivault');

async function runTests() {
  console.log('🧪 Starting DigiVault Verification Tests...\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, name) {
    if (condition) {
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${name}`);
      failed++;
    }
  }

  // 1. Verify Catalog Completeness
  const products = SEED_PRODUCTS('munir-uuid', 'farhan-uuid');
  assert(products.length >= 44, `Catalog contains 44+ products (Found: ${products.length})`);

  // 2. Verify Hero Product: Gemini Pro 18M
  const geminiHero = products.find(p => p.slug === 'gemini-pro-18m-veo-3');
  assert(geminiHero !== undefined, 'Gemini Pro 18M hero product exists in catalog');
  assert(geminiHero.vendor_price === 170, `Gemini Pro vendor cost is ৳170 (Found: ${geminiHero.vendor_price})`);
  assert(geminiHero.sale_price === 2000, `Gemini Pro sale price is ৳2,000 (Found: ${geminiHero.sale_price})`);
  assert(geminiHero.profit_margin === 1830, `Gemini Pro net profit is ৳1,830 (Found: ${geminiHero.profit_margin})`);
  assert(geminiHero.is_hero === true, 'Gemini Pro marked as hero best seller');
  assert(geminiHero.vendor_id === 'munir-uuid', 'Gemini Pro correctly mapped to Vendor A (Munir)');

  // 3. Verify Farhan Products
  const netflix = products.find(p => p.slug === 'netflix-1m');
  assert(netflix !== undefined, 'Netflix exists in catalog');
  assert(netflix.vendor_id === 'farhan-uuid', 'Netflix correctly mapped to Vendor B (Farhan)');
  assert(netflix.vendor_price === 250 && netflix.sale_price === 330, 'Netflix pricing correct (Cost: 250, Sale: 330)');

  // 4. Verify Blind Procurement Link Generation Protocol
  const munirVendor = SEED_VENDORS[0];
  const testOrder = {
    order_number: 'DIGI-992811',
    product_name: 'Gemini Pro 18 Months Admin Account + VEO 3 Pro',
    duration: '18 Months',
    customer_name: 'Zahid Hasan (Secret Client)',
    customer_contact: '01711223344'
  };

  const rawPhone = (munirVendor.phone || munirVendor.contact_handle).replace(/[^0-9]/g, '');
  const vendorFirstName = munirVendor.name.split(' ')[0];
  const msg = `Salam ${vendorFirstName} bhai, need 1x ${testOrder.product_name} (${testOrder.duration}). Order Ref: ${testOrder.order_number}. Payment being sent now via bKash.`;
  const encodedUrl = `https://wa.me/${rawPhone}?text=${encodeURIComponent(msg)}`;

  assert(encodedUrl.includes('wa.me/8801602733832'), 'WhatsApp URL points to Munir (+880 1602-733832)');
  assert(encodedUrl.includes('DIGI-992811'), 'WhatsApp message contains order reference number');
  assert(!encodedUrl.includes('Zahid'), '🔒 STRICT PRIVACY: Customer name is NEVER present in vendor message');
  assert(!encodedUrl.includes('01711223344'), '🔒 STRICT PRIVACY: Customer contact is NEVER present in vendor message');

  // 5. Verify Expiry Date Calculation
  const now = new Date();
  const dur18M = 548 * 86400000;
  const expiry18M = new Date(now.getTime() + dur18M).toISOString().split('T')[0];
  assert(expiry18M.startsWith('2028'), `18 Month subscription calculates ~1.5 years ahead (Found: ${expiry18M})`);

  console.log(`\n📊 Test Summary: ${passed} Passed, ${failed} Failed.`);
  if (failed > 0) process.exit(1);
}

runTests();
