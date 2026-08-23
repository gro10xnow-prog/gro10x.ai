/**
 * scripts/e2e/runner.js
 * PurpleOS Admin Stakeholder Master E2E Test Suite Orchestrator
 * 
 * Usage:
 *   node scripts/e2e/runner.js              (Runs all 9 phases)
 *   node scripts/e2e/runner.js --phase 4   (Runs specific phase)
 */
const { startServerIfNeeded, launchBrowser, wait, REPORTS_DIR, SCREENSHOTS_DIR } = require('./utils');
const { generateReport } = require('./report');

// Import Phase Modules
const { runPhase1 } = require('./phases/phase-1-shell');
const { runPhase2 } = require('./phases/phase-2-command');
const { runPhase3 } = require('./phases/phase-3-intel');
const { runPhase4 } = require('./phases/phase-4-production');
const { runPhase5 } = require('./phases/phase-5-finance');
const { runPhase6 } = require('./phases/phase-6-hr');
const { runPhase7 } = require('./phases/phase-7-system');
const { runPhase8 } = require('./phases/phase-8-cross-module');
const { runPhase9 } = require('./phases/phase-9-console-audit');

async function main() {
  console.log('\n============================================================');
  console.log('🧪 PurpleOS Admin Stakeholder Comprehensive E2E Test Suite');
  console.log('============================================================\n');

  // Parse CLI args
  const args = process.argv.slice(2);
  const phaseArgIndex = args.indexOf('--phase');
  const targetPhase = phaseArgIndex !== -1 ? parseInt(args[phaseArgIndex + 1], 10) : null;

  const serverInstance = await startServerIfNeeded();
  const { browser, page } = await launchBrowser();

  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push({ type: msg.type(), text: msg.text() });
  });

  const phaseResults = [];

  try {
    if (targetPhase && targetPhase > 1) {
      const { injectAdminSession } = require('./auth');
      const { APP_URL } = require('./utils');
      await page.goto(APP_URL, { waitUntil: 'domcontentloaded' });
      await injectAdminSession(page);
      await page.goto(APP_URL + '#dashboard', { waitUntil: 'networkidle2' });
      await wait(1500);
    }

    if (!targetPhase || targetPhase === 1) {
      phaseResults.push(await runPhase1(page));
    }
    if (!targetPhase || targetPhase === 2) {
      phaseResults.push(await runPhase2(page));
    }
    if (!targetPhase || targetPhase === 3) {
      phaseResults.push(await runPhase3(page));
    }
    if (!targetPhase || targetPhase === 4) {
      phaseResults.push(await runPhase4(page));
    }
    if (!targetPhase || targetPhase === 5) {
      phaseResults.push(await runPhase5(page));
    }
    if (!targetPhase || targetPhase === 6) {
      phaseResults.push(await runPhase6(page));
    }
    if (!targetPhase || targetPhase === 7) {
      phaseResults.push(await runPhase7(page));
    }
    if (!targetPhase || targetPhase === 8) {
      phaseResults.push(await runPhase8(page));
    }
    if (!targetPhase || targetPhase === 9) {
      phaseResults.push(await runPhase9(page, consoleLogs));
    }

    console.log('\n============================================================');
    console.log('📊 Generating Comprehensive Test Report...');
    const { jsonSummary, reportPath } = generateReport(phaseResults, consoleLogs);
    console.log(`✅ Test Run Complete: ${jsonSummary.totalPassed}/${jsonSummary.totalTests} Passed (${jsonSummary.passRate}%)`);
    console.log(`📄 View HTML Report at: ${reportPath}`);
    console.log('============================================================\n');

  } catch (err) {
    console.error('❌ E2E Runner Fatal Error:', err);
  } finally {
    await browser.close();
    if (serverInstance) {
      serverInstance.close();
    }
    process.exit(0);
  }
}

main();
