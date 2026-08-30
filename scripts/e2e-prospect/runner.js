/**
 * scripts/e2e-prospect/runner.js
 * Master Orchestrator for Comprehensive Prospect E2E Browser & Pipeline QA Suite
 * 
 * Usage:
 *   node scripts/e2e-prospect/runner.js
 */
const fs = require('fs');
const path = require('path');
const { startServerIfNeeded, launchBrowser, REPORTS_DIR, SCREENSHOTS_DIR } = require('./utils');

const { runPhase1 } = require('./phases/phase-1-landing');
const { runPhase2 } = require('./phases/phase-2-service-detail');
const { runPhase3 } = require('./phases/phase-3-auth');
const { runPhase4 } = require('./phases/phase-4-reviewroom');
const { runPhase5 } = require('./phases/phase-5-partners');
const { runPhase6 } = require('./phases/phase-6-chat-widget');
const { runPhase7 } = require('./phases/phase-7-cross-cutting');
const { runPhase8 } = require('./phases/phase-8-bot-wiring');

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════════════════╗');
  console.log('║ 🧪 GRO10X PROSPECTIVE CLIENT / PUBLIC AUDIENCE MASTER E2E QA SUITE       ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════╝\n');

  const serverInstance = await startServerIfNeeded();
  const { browser, page } = await launchBrowser();

  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push({ type: msg.type(), text: msg.text() });
  });

  const phaseResults = [];

  try {
    phaseResults.push(await runPhase1(page));
    phaseResults.push(await runPhase2(page));
    phaseResults.push(await runPhase3(page));
    phaseResults.push(await runPhase4(page));
    phaseResults.push(await runPhase5(page));
    phaseResults.push(await runPhase6(page));
    phaseResults.push(await runPhase7(page));
    phaseResults.push(await runPhase8());

  } catch (err) {
    console.error('Fatal Test Orchestrator Error:', err);
  } finally {
    await browser.close();
    if (serverInstance) {
      serverInstance.close();
    }
  }

  // Aggregate Results
  let totalPassed = 0;
  let totalFailed = 0;
  let totalTests = 0;

  console.log('\n══════════════════════════════════════════════════════════════════════════');
  console.log('📊 MASTER E2E VERIFICATION SUMMARY:');
  console.log('══════════════════════════════════════════════════════════════════════════');

  phaseResults.forEach((phase, idx) => {
    const phaseTotal = phase.passed + phase.failed;
    totalPassed += phase.passed;
    totalFailed += phase.failed;
    totalTests += phaseTotal;

    const icon = phase.failed === 0 ? '✅' : '❌';
    console.log(`${icon} Phase ${idx + 1}: ${phase.name} (${phase.passed}/${phaseTotal} Passed)`);
  });

  console.log('──────────────────────────────────────────────────────────────────────────');
  console.log(`🎯 OVERALL STATUS: ${totalFailed === 0 ? '✅ 100% PASSED' : '❌ SOME TESTS FAILED'}`);
  console.log(`📈 TOTAL METRICS:  ${totalPassed}/${totalTests} Tests Passed (${totalFailed} Failed)`);
  console.log(`🖼️  SCREENSHOTS:   Saved to ${SCREENSHOTS_DIR}`);
  console.log('══════════════════════════════════════════════════════════════════════════\n');

  // Generate JSON Report
  const reportPayload = {
    timestamp: new Date().toISOString(),
    totalTests,
    totalPassed,
    totalFailed,
    status: totalFailed === 0 ? 'PASSED' : 'FAILED',
    phases: phaseResults
  };

  fs.writeFileSync(
    path.join(REPORTS_DIR, 'prospect-e2e-report.json'),
    JSON.stringify(reportPayload, null, 2)
  );

  if (totalFailed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Unhandled fatal error in E2E runner:', err);
  process.exit(1);
});
