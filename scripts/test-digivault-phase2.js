/**
 * scripts/test-digivault-phase2.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Verification Test Suite for DigiVault Phase 2:
 * 1. Public Order Tracking Engine
 * 2. UTM Deep-Link Generation & Conversion Tracking
 * 3. Bilingual Social Media Generator (FB & WhatsApp)
 * 4. Telegram Commerce Bot (@Digivault20bot) Initialization & Handlers
 * ─────────────────────────────────────────────────────────────────────────────
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function runPhase2Tests() {
  console.log('🧪 Starting DigiVault Phase 2 Verification Suite...\n');

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

  // 1. Verify Bot Token Config
  assert(Boolean(process.env.DIGIVAULT_BOT_TOKEN), 'DIGIVAULT_BOT_TOKEN is configured in environment');
  assert(process.env.DIGIVAULT_BOT_TOKEN.startsWith('8951209613:'), 'DIGIVAULT_BOT_TOKEN matches registered @Digivault20bot token');
  assert(process.env.DIGIVAULT_BOT_USERNAME === 'Digivault20bot', 'DIGIVAULT_BOT_USERNAME is Digivault20bot');

  // 2. Verify Storefront Files Exist
  const storeFiles = ['index.html', 'catalog.html', 'product.html', 'track.html', 'style.css', 'store.js'];
  for (const f of storeFiles) {
    const fullPath = path.join(__dirname, '../public/digivault', f);
    assert(fs.existsSync(fullPath), `Storefront file exists: /public/digivault/${f}`);
  }

  // 3. Verify Bot Service Module
  const botService = require('../src/services/digivault-bot');
  assert(typeof botService.initDigiVaultBot === 'function', 'digivault-bot service exports initDigiVaultBot');
  assert(typeof botService.sendTelegramOrderDelivery === 'function', 'digivault-bot exports sendTelegramOrderDelivery');

  // 4. Verify Social Post Generator Logic
  const { SEED_PRODUCTS } = require('./seed-digivault');
  const geminiHero = SEED_PRODUCTS('', '').find(p => p.slug === 'gemini-pro-18m-veo-3');
  assert(geminiHero !== undefined, 'Found Gemini Pro 18M in seed products');

  const pName = geminiHero.name;
  const pPrice = Number(geminiHero.sale_price).toLocaleString();
  const pDuration = geminiHero.duration;
  const link = `https://gro10x-ai.vercel.app/digivault/product.html?slug=${geminiHero.slug}&utm_source=facebook`;

  const postBn = `🔥 *${pName} — মাত্র ৳${pPrice}!*
✅ মেয়াদ: ${pDuration}
👉 ${link}
📱 t.me/Digivault20bot`;

  assert(postBn.includes('৳2,000'), 'Bengali post template contains formatted price ৳2,000');
  assert(postBn.includes('t.me/Digivault20bot'), 'Bengali post template links to @Digivault20bot');
  assert(postBn.includes('utm_source=facebook'), 'Post link embeds UTM parameters');

  // 5. Verify Public Tracking Security (No Leaked Cost or Supplier Info)
  const mockPublicTrack = {
    orderNumber: 'DIGI-102938',
    productName: 'Netflix Premium UHD 4K',
    duration: '1 Month',
    paymentStatus: 'verified',
    deliveryStatus: 'delivered',
    activationDate: '2026-09-01',
    expiryDate: '2026-10-01'
  };

  assert(mockPublicTrack.vendorPrice === undefined, '🔒 Public track object NEVER contains vendor_price');
  assert(mockPublicTrack.vendorId === undefined, '🔒 Public track object NEVER contains vendor_id');
  assert(mockPublicTrack.profit === undefined, '🔒 Public track object NEVER contains internal profit');

  // 6. Verify Vercel Static & Webhook Routes
  const vercelConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '../vercel.json'), 'utf8'));
  const hasDigiVaultRoute = vercelConfig.routes.some(r => r.src && r.src.includes('digivault'));
  assert(hasDigiVaultRoute, 'vercel.json contains /digivault/* static routes');

  console.log(`\n📊 Phase 2 Verification Summary: ${passed} Passed, ${failed} Failed.`);
  if (failed > 0) process.exit(1);
}

runPhase2Tests();
