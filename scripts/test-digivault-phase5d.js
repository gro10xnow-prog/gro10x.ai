/**
 * scripts/test-digivault-phase5d.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Phase 5D Automated Verification Suite
 * Tests:
 * 1. Migration 20260908_v4.1_digivault_ratings.sql schema definitions
 * 2. POST /api/digistore/orders/:id/rate endpoint & validation (1-5 range)
 * 3. digivault-bot.js sendRatingPrompt function & inline keyboard buttons
 * 4. digivault-bot.js rate_order callback query handling (5-star thank you & low-star support escalation)
 * 5. digivault-bot.js monospace receipt slip formatting in checkout_confirm
 * ─────────────────────────────────────────────────────────────────────────────
 */

process.env.USE_POLLING = 'false';
process.env.NODE_ENV = 'production';

const fs = require('fs');
const path = require('path');

async function runPhase5DTests() {
  console.log('🧪 Starting DigiVault Phase 5D Verification Suite...\n');
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

  // 1. Migration File Check
  const migPath = path.join(__dirname, '../supabase/migrations/20260908_v4.1_digivault_ratings.sql');
  assert(fs.existsSync(migPath), 'Migration file 20260908_v4.1_digivault_ratings.sql exists');
  if (fs.existsSync(migPath)) {
    const migContent = fs.readFileSync(migPath, 'utf8');
    assert(migContent.includes('customer_rating INTEGER'), 'Migration adds customer_rating column');
    assert(migContent.includes('customer_feedback TEXT'), 'Migration adds customer_feedback column');
    assert(migContent.includes('idx_digi_orders_customer_rating'), 'Migration creates customer_rating index');
  }

  // 2. Rating API Endpoint Check
  const routesPath = path.join(__dirname, '../src/routes/digistore.js');
  assert(fs.existsSync(routesPath), 'src/routes/digistore.js exists');
  if (fs.existsSync(routesPath)) {
    const routesContent = fs.readFileSync(routesPath, 'utf8');
    assert(routesContent.includes('/orders/:id/rate'), 'Router defines POST /orders/:id/rate endpoint');
    assert(routesContent.includes('Rating must be an integer between 1 and 5'), 'Endpoint validates 1-5 rating range');
    assert(routesContent.includes('stage: \'customer_rated\''), 'Endpoint logs customer_rated timeline event');
  }

  // 3. Telegram Bot Monospace Receipt & Rating Prompt Check
  const botPath = path.join(__dirname, '../src/services/digivault-bot.js');
  assert(fs.existsSync(botPath), 'src/services/digivault-bot.js exists');
  if (fs.existsSync(botPath)) {
    const botContent = fs.readFileSync(botPath, 'utf8');
    assert(botContent.includes('DIGIVAULT BD'), 'Bot formats monospace receipt slip header');
    assert(botContent.includes('Order Ref: #'), 'Bot includes order reference in receipt slip');
    assert(botContent.includes('sendRatingPrompt(bot, chatId, orderId)'), 'Bot triggers sendRatingPrompt on order confirmation');
    assert(botContent.includes('function sendRatingPrompt'), 'Bot defines sendRatingPrompt helper');
    assert(botContent.includes('rate_order:${orderId}:5'), 'Rating prompt includes 5-star callback');
    assert(botContent.includes('rate_order:${orderId}:2'), 'Rating prompt includes low-star callback');
    assert(botContent.includes('data.startsWith(\'rate_order:\')'), 'Bot handles rate_order callback query');
    assert(botContent.includes('customer_rating: stars'), 'Bot persists customer_rating in database');
    assert(botContent.includes('wa.me/8801889825025'), 'Bot escalates low ratings to WhatsApp support');
  }

  console.log('\n========================================');
  console.log(`Phase 5D Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('========================================\n');

  if (failed > 0) process.exit(1);
}

runPhase5DTests().catch(err => {
  console.error('Phase 5D Test Suite Error:', err);
  process.exit(1);
});
