/**
 * scripts/test-digivault-phase4d.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Phase 4D Automated Verification Suite
 * Tests:
 * 1. Database migration (last_renewal_reminder_at, renewal_reminder_count, index)
 * 2. Retention cron service (runDigiVaultRenewalCheck, initDigiVaultCron)
 * 3. Server boot integration
 * 4. Telegram bot renewal reminder push and renew_order callback handler
 * 5. Backend router cron trigger endpoint
 * 6. Admin Panel real-time SSE listener and toast alerts
 * ─────────────────────────────────────────────────────────────────────────────
 */

process.env.USE_POLLING = 'false';
process.env.NODE_ENV = 'production';

const fs = require('fs');
const path = require('path');
const { runDigiVaultRenewalCheck, initDigiVaultCron } = require('../src/services/digivault-cron');
const { sendRenewalReminder, getDigiVaultBot } = require('../src/services/digivault-bot');

async function runPhase4DTests() {
  console.log('🧪 Starting DigiVault Phase 4D Verification Suite...\n');
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
  const migPath = path.join(__dirname, '../supabase/migrations/20260905_v3.8_digivault_phase4d.sql');
  assert(fs.existsSync(migPath), 'Migration file 20260905_v3.8_digivault_phase4d.sql exists');
  if (fs.existsSync(migPath)) {
    const migContent = fs.readFileSync(migPath, 'utf8');
    assert(migContent.includes('last_renewal_reminder_at TIMESTAMPTZ'), 'Migration adds last_renewal_reminder_at column');
    assert(migContent.includes('renewal_reminder_count INT'), 'Migration adds renewal_reminder_count column');
    assert(migContent.includes('idx_digi_orders_renewal_telemetry'), 'Migration creates renewal telemetry index');
  }

  // 2. Cron Service Implementation
  assert(typeof runDigiVaultRenewalCheck === 'function', 'digivault-cron exports runDigiVaultRenewalCheck');
  assert(typeof initDigiVaultCron === 'function', 'digivault-cron exports initDigiVaultCron');

  const cronPath = path.join(__dirname, '../src/services/digivault-cron.js');
  const cronContent = fs.readFileSync(cronPath, 'utf8');
  assert(cronContent.includes('daysRemaining <= 3'), 'Cron targets subscriptions expiring in <= 3 days');
  assert(cronContent.includes('sendRenewalReminder'), 'Cron calls sendRenewalReminder for Telegram users');
  assert(cronContent.includes('hoursSinceLast < 40'), 'Cron enforces anti-spam 40h cooldown');

  // 3. Server Startup Integration
  const serverPath = path.join(__dirname, '../server.js');
  const serverContent = fs.readFileSync(serverPath, 'utf8');
  assert(serverContent.includes('initDigiVaultCron'), 'server.js initializes initDigiVaultCron on startup');

  // 4. Telegram Bot Renewal Push & 1-Click Callback
  assert(typeof sendRenewalReminder === 'function', 'digivault-bot exports sendRenewalReminder');
  const botPath = path.join(__dirname, '../src/services/digivault-bot.js');
  const botContent = fs.readFileSync(botPath, 'utf8');
  assert(botContent.includes("data.startsWith('renew_order:')"), 'digivault-bot handles renew_order callback');
  assert(botContent.includes('renewalReminder:'), 'digivault-bot STRINGS contains renewalReminder');
  assert(botContent.includes('btnRenewNow:'), 'digivault-bot STRINGS contains btnRenewNow');

  // 5. Backend Router Endpoint
  const routePath = path.join(__dirname, '../src/routes/digistore.js');
  const routeContent = fs.readFileSync(routePath, 'utf8');
  assert(routeContent.includes("router.post('/cron/trigger-renewals'"), 'Router defines POST /cron/trigger-renewals endpoint');
  assert(routeContent.includes('runDigiVaultRenewalCheck()'), 'Endpoint invokes runDigiVaultRenewalCheck');

  // 6. Admin Panel Real-Time SSE & Button
  const adminPath = path.join(__dirname, '../public/app/modules/digistore.js');
  const adminContent = fs.readFileSync(adminPath, 'utf8');
  assert(adminContent.includes('initRealtimeFeed()'), 'Admin module implements initRealtimeFeed');
  assert(adminContent.includes('handleRealtimeEvent('), 'Admin module implements handleRealtimeEvent');
  assert(adminContent.includes('showToast('), 'Admin module implements showToast');
  assert(adminContent.includes('btnTriggerRenewalCron'), 'Admin Renewals tab includes Run Retention Check button');
  assert(adminContent.includes('/digistore/cron/trigger-renewals'), 'Button triggers /cron/trigger-renewals endpoint');

  // 7. Live Execution Test of Cron Worker
  try {
    const cronResult = await runDigiVaultRenewalCheck();
    assert(cronResult && cronResult.success === true, 'runDigiVaultRenewalCheck executes cleanly and returns success');
    assert(typeof cronResult.processed === 'number', 'runDigiVaultRenewalCheck returns numeric processed count');
  } catch (err) {
    assert(false, 'runDigiVaultRenewalCheck threw error: ' + err.message);
  }

  console.log('\n========================================');
  console.log(`Phase 4D Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('========================================\n');

  if (failed > 0) process.exit(1);
}

runPhase4DTests().catch(err => {
  console.error('Test Suite Error:', err);
  process.exit(1);
});
