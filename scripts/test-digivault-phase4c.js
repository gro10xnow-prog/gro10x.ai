/**
 * scripts/test-digivault-phase4c.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Phase 4C Automated Verification Suite
 * Tests:
 * 1. Mobile CSS responsive rules (#checkoutLayout, input sizes)
 * 2. Track page input sanitization and WhatsApp error recovery UX
 * 3. Telegram Bot /help command, sendHelpMessage, and command directory
 * 4. Telegram Bot order review step (awaiting_confirmation) and callback handlers
 * 5. Storefront bilingual dictionary synchronization
 * ─────────────────────────────────────────────────────────────────────────────
 */

const fs = require('fs');
const path = require('path');
const { getSession, saveSession, clearSession } = require('../src/services/digivault-bot');

async function runPhase4CTests() {
  console.log('🧪 Starting DigiVault Phase 4C Verification Suite...\n');
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

  // 1. Mobile Responsive CSS Checks
  const cssPath = path.join(__dirname, '../public/digivault/style.css');
  assert(fs.existsSync(cssPath), 'style.css exists');
  const cssContent = fs.readFileSync(cssPath, 'utf8');
  assert(cssContent.includes('@media (max-width: 768px)'), 'style.css includes 768px mobile media query');
  assert(cssContent.includes('#checkoutLayout') && cssContent.includes('grid-template-columns: 1fr !important'), 'style.css overrides #checkoutLayout to single column on mobile');
  assert(cssContent.includes('font-size: 16px'), 'style.css sets 16px font size on inputs to prevent mobile auto-zoom');

  // 2. Track Page UX & Smart Search
  const trackPath = path.join(__dirname, '../public/digivault/track.html');
  assert(fs.existsSync(trackPath), 'track.html exists');
  const trackContent = fs.readFileSync(trackPath, 'utf8');
  assert(trackContent.includes('toUpperCase()'), 'track.html uppercases order reference search input');
  assert(trackContent.includes("cleanRef = 'DIGI-' + cleanRef"), 'track.html auto-prepends DIGI- prefix for numeric input');
  assert(trackContent.includes('wa.me/8801889825025'), 'track.html error state links directly to WhatsApp support');
  assert(trackContent.includes('WhatsApp সাপোর্টে যোগাযোগ করুন'), 'track.html renders WhatsApp support recovery button on error');

  // 3. Telegram Bot /help Command & Directory
  const botPath = path.join(__dirname, '../src/services/digivault-bot.js');
  assert(fs.existsSync(botPath), 'digivault-bot.js exists');
  const botContent = fs.readFileSync(botPath, 'utf8');
  assert(botContent.includes('bot.onText(/\\/help/'), 'digivault-bot.js registers /help command');
  assert(botContent.includes('function sendHelpMessage'), 'digivault-bot.js defines sendHelpMessage helper');
  assert(botContent.includes("data === 'menu_help'"), 'digivault-bot.js handles menu_help callback');
  assert(botContent.includes('helpText:'), 'digivault-bot.js contains helpText in STRINGS dictionary');
  assert(botContent.includes('/myorder <REF>'), 'digivault-bot.js help includes /myorder command guide');

  // 4. Telegram Bot Order Review & Confirmation Step
  assert(botContent.includes("'awaiting_confirmation'"), 'digivault-bot.js includes awaiting_confirmation step');
  assert(botContent.includes('function sendOrderConfirmationPrompt'), 'digivault-bot.js defines sendOrderConfirmationPrompt');
  assert(botContent.includes("data === 'checkout_confirm'"), 'digivault-bot.js handles checkout_confirm callback');
  assert(botContent.includes("data === 'checkout_restart'"), 'digivault-bot.js handles checkout_restart callback');
  assert(botContent.includes('orderReviewPrompt:'), 'digivault-bot.js contains orderReviewPrompt in STRINGS');
  assert(botContent.includes('btnConfirmCheckout:'), 'digivault-bot.js contains btnConfirmCheckout in STRINGS');
  assert(botContent.includes('btnEditCheckout:'), 'digivault-bot.js contains btnEditCheckout in STRINGS');

  // 5. Bot Session Step Verification for Confirmation
  const testChatId = 'test_p4c_' + Date.now();
  await saveSession(testChatId, {
    lang: 'bn',
    step: 'awaiting_confirmation',
    customerName: 'Test Buyer',
    customerContact: '01700000000',
    customerWhatsapp: '01889825025',
    selectedProduct: { name: 'Gemini Pro 18M', duration: '18 Months', sale_price: 2000, slug: 'gemini-pro-18m-veo-3' }
  });

  const session = await getSession(testChatId);
  assert(session.step === 'awaiting_confirmation', 'Session persists awaiting_confirmation step');
  assert(session.customerWhatsapp === '01889825025', 'Session preserves WhatsApp number for review');
  await clearSession(testChatId);

  // 6. Storefront Bilingual Polish Checks
  const storePath = path.join(__dirname, '../public/digivault/store.js');
  assert(fs.existsSync(storePath), 'store.js exists');
  const storeContent = fs.readFileSync(storePath, 'utf8');
  assert(storeContent.includes("orderReviewTitle: 'Order Review'"), 'store.js contains English orderReviewTitle');
  assert(storeContent.includes("orderReviewTitle: 'অর্ডার তথ্য যাচাই'"), 'store.js contains Bengali orderReviewTitle');
  assert(storeContent.includes("btnSupportWhatsApp: 'Contact WhatsApp Support'"), 'store.js contains English btnSupportWhatsApp');
  assert(storeContent.includes("btnSupportWhatsApp: 'WhatsApp সাপোর্টে যোগাযোগ করুন'"), 'store.js contains Bengali btnSupportWhatsApp');

  console.log('\n========================================');
  console.log(`Phase 4C Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('========================================\n');

  if (failed > 0) process.exit(1);
}

runPhase4CTests().catch(err => {
  console.error('Test Suite Error:', err);
  process.exit(1);
});
