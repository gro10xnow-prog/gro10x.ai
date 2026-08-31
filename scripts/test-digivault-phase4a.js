/**
 * scripts/test-digivault-phase4a.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Verification Test Suite for DigiVault Phase 4A:
 * 1. Customer Storefront Payment Amount & 1-Click Copy Number in Success Modal
 * 2. Sender Account (custPayFrom) Field in Storefront & Backend Mapping
 * 3. Bilingual Dictionary Keys for Sender Account
 * 4. Admin Panel Payment Rejection Flow & Modal
 * 5. Admin Panel Manual Order WhatsApp Field Capture
 * 6. Backend Rejection Endpoint with Timeline Audit & WhatsApp Rejection URL
 * 7. Telegram Bot Customer Rejection Dispatch & Exports
 * ─────────────────────────────────────────────────────────────────────────────
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function runPhase4ATests() {
  console.log('🧪 Starting DigiVault Phase 4A Verification Suite...\n');

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

  // 1. Storefront product.html Checks
  const prodHtmlPath = path.join(__dirname, '../public/digivault/product.html');
  const prodHtml = fs.readFileSync(prodHtmlPath, 'utf8');
  assert(prodHtml.includes('id="custPayFrom"'), 'product.html includes sender account (custPayFrom) input');
  assert(prodHtml.includes('senderAccount: payFrom'), 'product.html attaches senderAccount to orderPayload');
  assert(prodHtml.includes('id="inpModalSendNo"'), 'product.html success modal includes Send Money number field');
  assert(prodHtml.includes('01312415757'), 'product.html success modal displays Send Money number 01312415757');
  assert(prodHtml.includes('btnCopyPayNo'), 'product.html success modal includes 1-click copy number button');
  assert(prodHtml.includes('প্রদেয় পরিমাণ:'), 'product.html success modal highlights payable amount');

  // 2. store.js Translations
  const storeJsPath = path.join(__dirname, '../public/digivault/store.js');
  const storeJs = fs.readFileSync(storeJsPath, 'utf8');
  assert(storeJs.includes("lblPayFrom: 'Sender Account No. (Optional)'"), 'store.js has English lblPayFrom');
  assert(storeJs.includes("lblPayFrom: 'আপনার সেন্ডার নম্বর (ঐচ্ছিক)'"), 'store.js has Bengali lblPayFrom');

  // 3. Backend digistore.js Routes & Helpers
  const routerPath = path.join(__dirname, '../src/routes/digistore.js');
  const routerContent = fs.readFileSync(routerPath, 'utf8');
  assert(routerContent.includes('generateCustomerWhatsAppRejectionLink'), 'Router implements generateCustomerWhatsAppRejectionLink helper');
  assert(routerContent.includes("stage === 'payment_rejected'") || routerContent.includes("'payment_rejected'"), 'Router maps payment_rejected stage');
  assert(routerContent.includes('sender_account: senderAccount || null'), 'POST /orders stores sender_account in database');
  assert(routerContent.includes('rejectionWhatsAppUrl'), 'PATCH /reject-payment returns rejectionWhatsAppUrl');
  assert(routerContent.includes('sendTelegramPaymentRejection'), 'PATCH /reject-payment invokes bot rejection dispatch');

  // 4. Telegram Bot Service
  const botService = require('../src/services/digivault-bot');
  assert(typeof botService.sendTelegramPaymentRejection === 'function', 'digivault-bot exports sendTelegramPaymentRejection');
  
  const botPath = path.join(__dirname, '../src/services/digivault-bot.js');
  const botContent = fs.readFileSync(botPath, 'utf8');
  assert(botContent.includes('❌ *আপনার পেমেন্ট ভেরিফাই করা সম্ভব হয়নি*'), 'Bot has Bengali rejection notification text');
  assert(botContent.includes('DIGIVAULT_ADMIN_CHAT_ID'), 'Bot supports direct admin chat alerts');

  // 5. Admin Panel SPA Module
  const adminModPath = path.join(__dirname, '../public/app/modules/digistore.js');
  const adminMod = fs.readFileSync(adminModPath, 'utf8');
  assert(adminMod.includes('btn-reject-pay'), 'Admin order rows include ❌ Reject button');
  assert(adminMod.includes('openRejectPaymentModal(order)'), 'Admin module implements openRejectPaymentModal');
  assert(adminMod.includes('modalRejectReasonSelect'), 'Reject modal provides predefined rejection reason dropdown');
  assert(adminMod.includes('modalOrderCustWhatsapp'), 'Manual order creation modal includes required WhatsApp field');
  assert(adminMod.includes('customerWhatsapp: document.getElementById(\'modalOrderCustWhatsapp\')'), 'Manual order saves customerWhatsapp');

  console.log(`\n========================================`);
  console.log(`Phase 4A Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase4ATests();
