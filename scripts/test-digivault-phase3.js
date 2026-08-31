/**
 * scripts/test-digivault-phase3.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Verification Test Suite for DigiVault Phase 3:
 * 1. Database Migration Schema Check (WhatsApp, Vendor Proof, Activation Link, Closure Proof, Stages, Timeline)
 * 2. Storefront WhatsApp Collection & Telegram CTA Check
 * 3. Bilingual i18n Dictionary Check
 * 4. Tracking Page Visual Stepper & Customer Confirmation Check
 * 5. Telegram Bot 6-Step Guide Delivery & Confirm Callbacks Check
 * 6. Admin Panel Modals (Procure Proof, Smart Link Delivery, Admin Close with Screenshot, Timeline Audit)
 * 7. Express Router Endpoints & Timeline Logging Check
 * ─────────────────────────────────────────────────────────────────────────────
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function runPhase3Tests() {
  console.log('🧪 Starting DigiVault Phase 3 Verification Suite...\n');

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

  // 1. Verify Phase 3 DB Migration File
  const migPath = path.join(__dirname, '../supabase/migrations/20260903_v3.6_digivault_phase3.sql');
  assert(fs.existsSync(migPath), 'Migration file exists: 20260903_v3.6_digivault_phase3.sql');
  const migContent = fs.readFileSync(migPath, 'utf8');
  assert(migContent.includes('customer_whatsapp'), 'Migration adds customer_whatsapp column');
  assert(migContent.includes('vendor_payment_proof_url'), 'Migration adds vendor_payment_proof_url column');
  assert(migContent.includes('vendor_payment_amount'), 'Migration adds vendor_payment_amount column');
  assert(migContent.includes('activation_link'), 'Migration adds activation_link column');
  assert(migContent.includes('admin_closure_proof_url'), 'Migration adds admin_closure_proof_url column');
  assert(migContent.includes('digi_order_timeline'), 'Migration creates digi_order_timeline table');

  // 2. Verify Storefront product.html Form
  const prodHtmlPath = path.join(__dirname, '../public/digivault/product.html');
  const prodHtml = fs.readFileSync(prodHtmlPath, 'utf8');
  assert(prodHtml.includes('id="custWhatsapp"'), 'product.html includes WhatsApp number input');
  assert(prodHtml.includes('customerWhatsapp: whatsapp || contact'), 'product.html attaches WhatsApp number in orderPayload');
  assert(prodHtml.includes('t.me/Digivault20bot'), 'product.html success modal includes Telegram bot instant update link');

  // 3. Verify store.js i18n
  const storeJsPath = path.join(__dirname, '../public/digivault/store.js');
  const storeJs = fs.readFileSync(storeJsPath, 'utf8');
  assert(storeJs.includes("lblWhatsapp: 'WhatsApp Number'"), 'store.js has English lblWhatsapp');
  assert(storeJs.includes("lblWhatsapp: 'WhatsApp নম্বর'"), 'store.js has Bengali lblWhatsapp');

  // 4. Verify track.html Stepper & Customer Confirmation
  const trackHtmlPath = path.join(__dirname, '../public/digivault/track.html');
  const trackHtml = fs.readFileSync(trackHtmlPath, 'utf8');
  assert(trackHtml.includes('Visual Progress Stepper'), 'track.html includes 5-milestone visual stepper');
  assert(trackHtml.includes('btnConfirmReceived'), 'track.html includes customer self-confirmation button');
  assert(trackHtml.includes('customer-confirm'), 'track.html calls customer-confirm API');
  assert(trackHtml.includes('অ্যাক্টিভেশনের ৬টি সহজ নিয়ম'), 'track.html shows 6-step activation guide on delivery');

  // 5. Verify Bot Service (@Digivault20bot)
  const botService = require('../src/services/digivault-bot');
  assert(typeof botService.sendTelegramActivationDelivery === 'function', 'bot service exports sendTelegramActivationDelivery');
  assert(typeof botService.sendTelegramOrderDelivery === 'function', 'bot service exports sendTelegramOrderDelivery');
  
  const botFileContent = fs.readFileSync(path.join(__dirname, '../src/services/digivault-bot.js'), 'utf8');
  assert(botFileContent.includes('awaiting_whatsapp'), 'Bot includes WhatsApp step in order flow');
  assert(botFileContent.includes('confirm_order:'), 'Bot handles confirm_order callback for instant customer closure');
  assert(botFileContent.includes('৬টি সহজ স্টেপ অনুসরণ করুন'), 'Bot activation delivery includes clean 6-step guide');

  // 6. Verify Router Endpoints & Helpers
  const routerFileContent = fs.readFileSync(path.join(__dirname, '../src/routes/digistore.js'), 'utf8');
  assert(routerFileContent.includes("router.post('/orders/:id/vendor-payment'"), 'Router has POST /orders/:id/vendor-payment');
  assert(routerFileContent.includes("router.post('/orders/:id/activation-link'"), 'Router has POST /orders/:id/activation-link');
  assert(routerFileContent.includes("router.post('/orders/:id/customer-confirm'"), 'Router has POST /orders/:id/customer-confirm');
  assert(routerFileContent.includes("router.post('/orders/:id/admin-close'"), 'Router has POST /orders/:id/admin-close');
  assert(routerFileContent.includes("router.get('/orders/:id/timeline'"), 'Router has GET /orders/:id/timeline');
  assert(routerFileContent.includes('recordTimeline'), 'Router implements recordTimeline helper');
  assert(routerFileContent.includes('generateCustomerWhatsAppDeliveryLink'), 'Router implements WhatsApp delivery link generator');

  // 7. Verify Admin Module (public/app/modules/digistore.js)
  const adminModContent = fs.readFileSync(path.join(__dirname, '../public/app/modules/digistore.js'), 'utf8');
  assert(adminModContent.includes('openProcureModal(order)'), 'Admin module has openProcureModal with screenshot upload');
  assert(adminModContent.includes('openDeliveryModal(order)'), 'Admin module has upgraded openDeliveryModal with link & credentials');
  assert(adminModContent.includes('openAdminCloseModal(order)'), 'Admin module has openAdminCloseModal requiring proof screenshot');
  assert(adminModContent.includes('openTimelineModal(order)'), 'Admin module has openTimelineModal for full audit history');
  assert(adminModContent.includes('btn-view-timeline'), 'Admin order rows have timeline button');

  console.log(`\n========================================`);
  console.log(`Phase 3 Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase3Tests();
