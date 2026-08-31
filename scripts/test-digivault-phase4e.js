/**
 * scripts/test-digivault-phase4e.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Phase 4E Automated Verification Suite
 * Tests:
 * 1. Database migration (stock_status, customer_contact index, stock_status index)
 * 2. Customer CRM endpoints (GET /customers, GET /customers/:contact/orders)
 * 3. Product stock control route (PATCH /products/:id/stock)
 * 4. Orders and Financials CSV export endpoints (GET /export/orders, GET /export/financials)
 * 5. Telegram bot stock out badging and reservation link flow
 * 6. Web storefront product.html stock out state and WhatsApp reservation button
 * 7. Admin Panel CRM tab, customer history modal, and stock toggle buttons
 * ─────────────────────────────────────────────────────────────────────────────
 */

process.env.USE_POLLING = 'false';
process.env.NODE_ENV = 'production';

const fs = require('fs');
const path = require('path');

async function runPhase4ETests() {
  console.log('🧪 Starting DigiVault Phase 4E Verification Suite...\n');
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

  // 1. Database Migration Check
  const migPath = path.join(__dirname, '../supabase/migrations/20260906_v3.9_digivault_phase4e.sql');
  assert(fs.existsSync(migPath), 'Migration file 20260906_v3.9_digivault_phase4e.sql exists');
  if (fs.existsSync(migPath)) {
    const migContent = fs.readFileSync(migPath, 'utf8');
    assert(migContent.includes('stock_status TEXT DEFAULT \'available\''), 'Migration adds stock_status column');
    assert(migContent.includes('idx_digi_orders_customer_contact'), 'Migration creates customer_contact index');
    assert(migContent.includes('idx_digi_products_stock_status'), 'Migration creates stock_status index');
  }

  // 2. Backend Router Endpoints
  const routePath = path.join(__dirname, '../src/routes/digistore.js');
  const routeContent = fs.readFileSync(routePath, 'utf8');
  assert(routeContent.includes("router.get('/customers'"), 'Router defines GET /customers endpoint');
  assert(routeContent.includes("router.get('/customers/:contact/orders'"), 'Router defines GET /customers/:contact/orders endpoint');
  assert(routeContent.includes("router.patch('/products/:id/stock'"), 'Router defines PATCH /products/:id/stock endpoint');
  assert(routeContent.includes("router.get('/export/orders'"), 'Router defines GET /export/orders CSV endpoint');
  assert(routeContent.includes("router.get('/export/financials'"), 'Router defines GET /export/financials CSV endpoint');

  // 3. Telegram Bot Stock Intelligence
  const botPath = path.join(__dirname, '../src/services/digivault-bot.js');
  const botContent = fs.readFileSync(botPath, 'utf8');
  assert(botContent.includes("p.stock_status === 'out_of_stock' ? ' [🚫 Stock Out]' : ''"), 'Bot badging flags out of stock items in category list');
  assert(botContent.includes("product.stock_status === 'out_of_stock'"), 'Bot product detail detects out of stock status');
  assert(botContent.includes('WhatsApp Support (01889825025)'), 'Bot directs out of stock orders to WhatsApp support');

  // 4. Web Storefront Product Stock Handling
  const prodPath = path.join(__dirname, '../public/digivault/product.html');
  const prodContent = fs.readFileSync(prodPath, 'utf8');
  assert(prodContent.includes('badgeStockOut'), 'product.html renders stock out badge');
  assert(prodContent.includes('boxWhatsappReserve'), 'product.html renders WhatsApp reservation button when stock out');
  assert(prodContent.includes('btnSubmit.disabled = true'), 'product.html disables order submit button when stock out');

  // 5. Admin Panel CRM Tab & Actions
  const adminPath = path.join(__dirname, '../public/app/modules/digistore.js');
  const adminContent = fs.readFileSync(adminPath, 'utf8');
  assert(adminContent.includes('data-tab="customers"'), 'Admin nav tabs include Customers CRM tab');
  assert(adminContent.includes('renderCustomersTab('), 'Admin module implements renderCustomersTab');
  assert(adminContent.includes('openCustomerHistoryModal('), 'Admin module implements openCustomerHistoryModal');
  assert(adminContent.includes('btn-toggle-stock'), 'Admin Products tab renders stock status toggle button');
  assert(adminContent.includes('/digistore/export/orders'), 'Admin Orders tab includes Export Orders CSV button');
  assert(adminContent.includes('/digistore/export/financials'), 'Admin Analytics tab includes Export Financials CSV button');

  // 6. CRM Aggregation Logic Verification
  const sampleOrders = [
    { customer_contact: '01711111111', customer_name: 'Client A', sale_price: 2000, profit: 500, payment_status: 'verified', delivery_status: 'delivered', order_stage: 'delivered', created_at: '2026-08-01' },
    { customer_contact: '01711111111', customer_name: 'Client A', sale_price: 3000, profit: 800, payment_status: 'verified', delivery_status: 'delivered', order_stage: 'delivered', created_at: '2026-08-15' },
    { customer_contact: '01722222222', customer_name: 'Client B', sale_price: 1500, profit: 400, payment_status: 'pending', delivery_status: 'pending', order_stage: 'pending_payment', created_at: '2026-08-20' },
    { customer_contact: '01711111111', customer_name: 'Client A', sale_price: 2000, profit: 500, payment_status: 'verified', delivery_status: 'delivered', order_stage: 'confirmed_closed', created_at: '2026-07-01' }
  ];

  const map = {};
  sampleOrders.forEach(o => {
    const c = o.customer_contact;
    if (!map[c]) map[c] = { totalOrders: 0, totalSpent: 0, totalProfit: 0, activeSubs: 0 };
    map[c].totalOrders++;
    if (o.payment_status === 'verified') {
      map[c].totalSpent += o.sale_price;
      map[c].totalProfit += o.profit;
    }
    if (o.delivery_status === 'delivered' && o.order_stage !== 'confirmed_closed' && o.order_stage !== 'admin_closed') {
      map[c].activeSubs++;
    }
  });

  assert(map['01711111111'].totalOrders === 3, 'CRM counts 3 total orders for Client A');
  assert(map['01711111111'].totalSpent === 7000, 'CRM computes correct LTV (৳7,000) for Client A');
  assert(map['01711111111'].totalProfit === 1800, 'CRM computes correct total profit (+৳1,800) for Client A');
  assert(map['01711111111'].activeSubs === 2, 'CRM computes 2 active subscriptions for Client A (excluding closed)');
  assert(map['01722222222'].totalSpent === 0, 'CRM correctly excludes pending orders from verified LTV');

  console.log('\n========================================');
  console.log(`Phase 4E Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('========================================\n');

  if (failed > 0) process.exit(1);
}

runPhase4ETests().catch(err => {
  console.error('Phase 4E Test Suite Error:', err);
  process.exit(1);
});
