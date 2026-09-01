/**
 * scripts/test-digivault-phase6b.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Phase 6B Automated Verification Suite
 * Tests:
 * 1. Migration 20260909_v4.2_database_integrity_and_triggers.sql schema definitions
 * 2. Automatic updated_at trigger function & trigger bindings
 * 3. CHECK constraints on payment_status, delivery_status, order_stage, stock_status
 * 4. digivault-cron.js pruneAbandonedBotSessions implementation & return format
 * 5. digistore.js POST /cron/prune-sessions maintenance endpoint
 * ─────────────────────────────────────────────────────────────────────────────
 */

process.env.USE_POLLING = 'false';
process.env.NODE_ENV = 'production';

const fs = require('fs');
const path = require('path');

async function runPhase6BTests() {
  console.log('🧪 Starting DigiVault Phase 6B Verification Suite...\n');
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
  const migPath = path.join(__dirname, '../supabase/migrations/20260909_v4.2_database_integrity_and_triggers.sql');
  assert(fs.existsSync(migPath), 'Migration file 20260909_v4.2_database_integrity_and_triggers.sql exists');

  if (fs.existsSync(migPath)) {
    const migContent = fs.readFileSync(migPath, 'utf8');
    assert(migContent.includes('set_current_timestamp_updated_at()'), 'Migration defines set_current_timestamp_updated_at function');
    assert(migContent.includes('trigger_orders_updated_at'), 'Migration creates trigger on digi_orders');
    assert(migContent.includes('trigger_products_updated_at'), 'Migration creates trigger on digi_products');
    assert(migContent.includes('trigger_vendors_updated_at'), 'Migration creates trigger on digi_vendors');
    assert(migContent.includes('trigger_bot_sessions_updated_at'), 'Migration creates trigger on digi_bot_sessions');
    assert(migContent.includes('chk_digi_orders_payment_status'), 'Migration creates chk_digi_orders_payment_status constraint');
    assert(migContent.includes('chk_digi_orders_delivery_status'), 'Migration creates chk_digi_orders_delivery_status constraint');
    assert(migContent.includes('chk_digi_orders_order_stage'), 'Migration creates chk_digi_orders_order_stage constraint');
    assert(migContent.includes('chk_digi_products_stock_status'), 'Migration creates chk_digi_products_stock_status constraint');
    assert(migContent.includes('idx_digi_orders_parent_order_id'), 'Migration creates index on parent_order_id');
    assert(migContent.includes('idx_digi_bot_sessions_updated_at'), 'Migration creates index on digi_bot_sessions(updated_at)');
  }

  // 2. Cron Service Check
  const cronPath = path.join(__dirname, '../src/services/digivault-cron.js');
  assert(fs.existsSync(cronPath), 'src/services/digivault-cron.js exists');

  if (fs.existsSync(cronPath)) {
    const { pruneAbandonedBotSessions, runDigiVaultRenewalCheck } = require('../src/services/digivault-cron');
    assert(typeof pruneAbandonedBotSessions === 'function', 'digivault-cron exports pruneAbandonedBotSessions');
    assert(typeof runDigiVaultRenewalCheck === 'function', 'digivault-cron exports runDigiVaultRenewalCheck');

    const pruneRes = await pruneAbandonedBotSessions(7);
    assert(pruneRes.success === true, 'pruneAbandonedBotSessions executes cleanly');
    assert(typeof pruneRes.deleted === 'number', 'pruneAbandonedBotSessions returns numeric deleted count');
  }

  // 3. API Route Check
  const routesPath = path.join(__dirname, '../src/routes/digistore.js');
  assert(fs.existsSync(routesPath), 'src/routes/digistore.js exists');

  if (fs.existsSync(routesPath)) {
    const routesContent = fs.readFileSync(routesPath, 'utf8');
    assert(routesContent.includes('/cron/prune-sessions'), 'Router defines POST /cron/prune-sessions endpoint');
    assert(routesContent.includes('pruneAbandonedBotSessions'), 'Endpoint calls pruneAbandonedBotSessions');
  }

  console.log('\n========================================');
  console.log(`Phase 6B Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('========================================\n');

  if (failed > 0) process.exit(1);
}

runPhase6BTests().catch(err => {
  console.error('Phase 6B Test Suite Error:', err);
  process.exit(1);
});
