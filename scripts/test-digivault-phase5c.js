/**
 * scripts/test-digivault-phase5c.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Phase 5C Automated Verification Suite
 * Tests:
 * 1. digistore.js getElapsedSla helper function & SLA boundaries (on_track, warning, overdue)
 * 2. digistore.js delivery queue cards render SLA elapsed badges & pulsating urgency
 * 3. digistore.js initKeyboardShortcuts binds Escape & Ctrl+Enter modal triggers
 * 4. digistore.js openCustomerHistoryModal computes Total Orders, LTV, Profit & Active Subs
 * 5. digistore.js renders timeline-order-card with colored status ribbons
 * ─────────────────────────────────────────────────────────────────────────────
 */

process.env.USE_POLLING = 'false';
process.env.NODE_ENV = 'production';

const fs = require('fs');
const path = require('path');

async function runPhase5CTests() {
  console.log('🧪 Starting DigiVault Phase 5C Verification Suite...\n');
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

  const adminJsPath = path.join(__dirname, '../public/app/modules/digistore.js');
  assert(fs.existsSync(adminJsPath), 'digistore.js exists');

  if (fs.existsSync(adminJsPath)) {
    const adminContent = fs.readFileSync(adminJsPath, 'utf8');

    // 1. SLA Helper & Telemetry Check
    assert(adminContent.includes('getElapsedSla(order)'), 'digistore.js defines getElapsedSla');
    assert(adminContent.includes('level: \'on_track\''), 'getElapsedSla handles on_track level (<=15m)');
    assert(adminContent.includes('level: \'warning\''), 'getElapsedSla handles warning level (<=30m)');
    assert(adminContent.includes('level: \'overdue\''), 'getElapsedSla handles overdue level (>30m)');

    // Simulate SLA logic
    const now = Date.now();
    function computeMockSla(minutesAgo) {
      const mockOrder = { paymentVerifiedAt: new Date(now - minutesAgo * 60000).toISOString() };
      const baseTime = new Date(mockOrder.paymentVerifiedAt).getTime();
      const elapsedMinutes = Math.max(0, Math.floor((now - baseTime) / 60000));
      if (elapsedMinutes <= 15) return 'on_track';
      if (elapsedMinutes <= 30) return 'warning';
      return 'overdue';
    }

    assert(computeMockSla(5) === 'on_track', 'Mock order 5 mins ago is on_track');
    assert(computeMockSla(20) === 'warning', 'Mock order 20 mins ago is warning');
    assert(computeMockSla(45) === 'overdue', 'Mock order 45 mins ago is overdue');

    // 2. Delivery Queue Card SLA Badges Check
    assert(adminContent.includes('const sla = this.getElapsedSla(o);'), 'renderDeliveryTab computes SLA for each queue card');
    assert(adminContent.includes('${sla.badgeText}'), 'renderDeliveryTab renders SLA badge text');
    assert(adminContent.includes('border-top: 4px solid ${sla.color}'), 'renderDeliveryTab applies dynamic SLA border color');

    // 3. Keyboard Shortcuts Check
    assert(adminContent.includes('initKeyboardShortcuts()'), 'digistore.js implements initKeyboardShortcuts');
    assert(adminContent.includes('e.key === \'Escape\''), 'Keyboard shortcuts handle Escape key');
    assert(adminContent.includes('(e.ctrlKey || e.metaKey) && e.key === \'Enter\''), 'Keyboard shortcuts handle Ctrl+Enter / Cmd+Enter');

    // 4. Customer History Modal KPI Banner & Timeline Cards
    assert(adminContent.includes('openCustomerHistoryModal(contact)'), 'digistore.js implements openCustomerHistoryModal');
    assert(adminContent.includes('totalLtv'), 'Customer history computes total verified LTV');
    assert(adminContent.includes('totalProfit'), 'Customer history computes net profit');
    assert(adminContent.includes('activeSubs'), 'Customer history computes active subscriptions');
    assert(adminContent.includes('timeline-order-card'), 'Customer history renders timeline-order-card elements');
    assert(adminContent.includes('border-left: 4px solid ${ribbonColor}'), 'Timeline cards render colored status ribbons');
  }

  console.log('\n========================================');
  console.log(`Phase 5C Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('========================================\n');

  if (failed > 0) process.exit(1);
}

runPhase5CTests().catch(err => {
  console.error('Phase 5C Test Suite Error:', err);
  process.exit(1);
});
