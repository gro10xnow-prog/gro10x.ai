/**
 * scripts/e2e/runner.js
 * GRO10X Master Multi-Stakeholder Browser E2E Automation Orchestrator
 * 
 * Usage:
 *   node scripts/e2e/runner.js                     (Runs all 8 stakeholder suites)
 *   node scripts/e2e/runner.js --suite admin       (Runs Suite A: Admin OS)
 *   node scripts/e2e/runner.js --suite manager     (Runs Suite B: Manager Portal)
 *   node scripts/e2e/runner.js --suite partner     (Runs Suite C: Partner Portal)
 *   node scripts/e2e/runner.js --suite client      (Runs Suite D: Client MiniApp)
 *   node scripts/e2e/runner.js --suite team        (Runs Suite E: Team MiniApp)
 *   node scripts/e2e/runner.js --suite investors   (Runs Suite F: Investors)
 *   node scripts/e2e/runner.js --suite public      (Runs Suite G: Marketing Site)
 *   node scripts/e2e/runner.js --suite cross       (Runs Suite X: Cross-Portal)
 *   node scripts/e2e/runner.js --suite admin --phase A1
 */
require('dotenv').config();
const { startServerIfNeeded, launchBrowser, wait, REPORTS_DIR, SCREENSHOTS_DIR } = require('./utils');
const { generateReport } = require('./report');


// Import Suite A Modules (Admin OS)
const { runPhaseA1 } = require('./suites/suite-a-admin/phase-A1-shell-auth');
const { runPhaseA2 } = require('./suites/suite-a-admin/phase-A2-dashboard');
const { runPhaseA3 } = require('./suites/suite-a-admin/phase-A3-intelligence');
const { runPhaseA4 } = require('./suites/suite-a-admin/phase-A4-production');
const { runPhaseA5 } = require('./suites/suite-a-admin/phase-A5-finance');
const { runPhaseA6 } = require('./suites/suite-a-admin/phase-A6-hr');
const { runPhaseA7 } = require('./suites/suite-a-admin/phase-A7-tickets');
const { runPhaseA8 } = require('./suites/suite-a-admin/phase-A8-automation');
const { runPhaseA9 } = require('./suites/suite-a-admin/phase-A9-settings');
const { runPhaseA10 } = require('./suites/suite-a-admin/phase-A10-ecommerce');

// Import Suite B Modules (Manager)
const { runPhaseB1 } = require('./suites/suite-b-manager/phase-B1-auth');
const { runPhaseB2 } = require('./suites/suite-b-manager/phase-B2-dashboard');
const { runPhaseB3 } = require('./suites/suite-b-manager/phase-B3-tasks');
const { runPhaseB4 } = require('./suites/suite-b-manager/phase-B4-team');
const { runPhaseB5 } = require('./suites/suite-b-manager/phase-B5-finance');
const { runPhaseB6 } = require('./suites/suite-b-manager/phase-B6-tickets');
const { runPhaseB7 } = require('./suites/suite-b-manager/phase-B7-realtime');

// Import Suite C Modules (Partner)
const { runPhaseC1 } = require('./suites/suite-c-partner/phase-C1-auth');
const { runPhaseC2 } = require('./suites/suite-c-partner/phase-C2-dashboard');
const { runPhaseC3 } = require('./suites/suite-c-partner/phase-C3-reviews');
const { runPhaseC4 } = require('./suites/suite-c-partner/phase-C4-invoices');
const { runPhaseC5 } = require('./suites/suite-c-partner/phase-C5-social');
const { runPhaseC6 } = require('./suites/suite-c-partner/phase-C6-briefs');
const { runPhaseC7 } = require('./suites/suite-c-partner/phase-C7-sse');

// Import Suite D Modules (Client MiniApp)
const { runPhaseD1 } = require('./suites/suite-d-client-miniapp/phase-D1-auth');
const { runPhaseD2 } = require('./suites/suite-d-client-miniapp/phase-D2-home');
const { runPhaseD3 } = require('./suites/suite-d-client-miniapp/phase-D3-campaigns');
const { runPhaseD4 } = require('./suites/suite-d-client-miniapp/phase-D4-reviews');
const { runPhaseD5 } = require('./suites/suite-d-client-miniapp/phase-D5-payments');
const { runPhaseD6 } = require('./suites/suite-d-client-miniapp/phase-D6-briefs');
const { runPhaseD7 } = require('./suites/suite-d-client-miniapp/phase-D7-tickets');
const { runPhaseD8 } = require('./suites/suite-d-client-miniapp/phase-D8-contact');
const { runPhaseD9 } = require('./suites/suite-d-client-miniapp/phase-D9-sse');

// Import Suite E Modules (Team MiniApp)
const { runPhaseE1 } = require('./suites/suite-e-team-miniapp/phase-E1-auth');
const { runPhaseE2 } = require('./suites/suite-e-team-miniapp/phase-E2-dashboard');
const { runPhaseE3 } = require('./suites/suite-e-team-miniapp/phase-E3-attendance');
const { runPhaseE4 } = require('./suites/suite-e-team-miniapp/phase-E4-tasks');
const { runPhaseE5 } = require('./suites/suite-e-team-miniapp/phase-E5-eod');
const { runPhaseE6 } = require('./suites/suite-e-team-miniapp/phase-E6-expenses');
const { runPhaseE7 } = require('./suites/suite-e-team-miniapp/phase-E7-leaves');
const { runPhaseE8 } = require('./suites/suite-e-team-miniapp/phase-E8-admin-actions');
const { runPhaseE9 } = require('./suites/suite-e-team-miniapp/phase-E9-sse');

// Import Suite F Modules (Investors)
const { runPhaseF1 } = require('./suites/suite-f-investors/phase-F1-load');
const { runPhaseF2 } = require('./suites/suite-f-investors/phase-F2-financials');
const { runPhaseF3 } = require('./suites/suite-f-investors/phase-F3-content');

// Import Suite G Modules (Public Marketing)
const { runPhaseG1 } = require('./suites/suite-g-public/phase-G1-navigation');
const { runPhaseG2 } = require('./suites/suite-g-public/phase-G2-lead-form');
const { runPhaseG3 } = require('./suites/suite-g-public/phase-G3-services');

// Import Suite X Modules (Cross-Portal Integration)
const { runPhaseX1 } = require('./suites/suite-x-cross-portal/phase-X1-sse-chain');
const { runPhaseX2 } = require('./suites/suite-x-cross-portal/phase-X2-notifications');
const { runPhaseX3 } = require('./suites/suite-x-cross-portal/phase-X3-tenant-isolation');
const { runPhaseX4 } = require('./suites/suite-x-cross-portal/phase-X4-auth-expiry');
const { runPhaseX5 } = require('./suites/suite-x-cross-portal/phase-X5-cron-routes');

async function main() {
  console.log('\n============================================================');
  console.log('?? GRO10X Master Stakeholder Comprehensive E2E Test Suite');
  console.log('============================================================\n');

  // Parse CLI args
  const args = process.argv.slice(2);
  const suiteIndex = args.indexOf('--suite');
  const targetSuite = suiteIndex !== -1 ? args[suiteIndex + 1].toLowerCase() : null;

  const phaseIndex = args.indexOf('--phase');
  const targetPhase = phaseIndex !== -1 ? args[phaseIndex + 1].toUpperCase() : null;

  const isHeadful = args.includes('--headful');

  const serverInstance = await startServerIfNeeded();
  const { browser, page } = await launchBrowser({ headless: !isHeadful });

  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push({ type: msg.type(), text: msg.text() });
  });

  page.on('dialog', async dialog => {
    await dialog.accept().catch(() => {});
  });

  const phaseResults = [];

  try {
    // SUITE A: ADMIN OS
    if (!targetSuite || targetSuite === 'admin' || targetSuite === 'a') {
      if (!targetPhase || targetPhase === 'A1') phaseResults.push(await runPhaseA1(page));
      if (!targetPhase || targetPhase === 'A2') phaseResults.push(await runPhaseA2(page));
      if (!targetPhase || targetPhase === 'A3') phaseResults.push(await runPhaseA3(page));
      if (!targetPhase || targetPhase === 'A4') phaseResults.push(await runPhaseA4(page));
      if (!targetPhase || targetPhase === 'A5') phaseResults.push(await runPhaseA5(page));
      if (!targetPhase || targetPhase === 'A6') phaseResults.push(await runPhaseA6(page));
      if (!targetPhase || targetPhase === 'A7') phaseResults.push(await runPhaseA7(page));
      if (!targetPhase || targetPhase === 'A8') phaseResults.push(await runPhaseA8(page));
      if (!targetPhase || targetPhase === 'A9') phaseResults.push(await runPhaseA9(page));
      if (!targetPhase || targetPhase === 'A10') phaseResults.push(await runPhaseA10(page));
    }

    // SUITE B: MANAGER PORTAL
    if (!targetSuite || targetSuite === 'manager' || targetSuite === 'b') {
      if (!targetPhase || targetPhase === 'B1') phaseResults.push(await runPhaseB1(page));
      if (!targetPhase || targetPhase === 'B2') phaseResults.push(await runPhaseB2(page));
      if (!targetPhase || targetPhase === 'B3') phaseResults.push(await runPhaseB3(page));
      if (!targetPhase || targetPhase === 'B4') phaseResults.push(await runPhaseB4(page));
      if (!targetPhase || targetPhase === 'B5') phaseResults.push(await runPhaseB5(page));
      if (!targetPhase || targetPhase === 'B6') phaseResults.push(await runPhaseB6(page));
      if (!targetPhase || targetPhase === 'B7') phaseResults.push(await runPhaseB7(page));
    }

    // SUITE C: PARTNER PORTAL
    if (!targetSuite || targetSuite === 'partner' || targetSuite === 'c') {
      if (!targetPhase || targetPhase === 'C1') phaseResults.push(await runPhaseC1(page));
      if (!targetPhase || targetPhase === 'C2') phaseResults.push(await runPhaseC2(page));
      if (!targetPhase || targetPhase === 'C3') phaseResults.push(await runPhaseC3(page));
      if (!targetPhase || targetPhase === 'C4') phaseResults.push(await runPhaseC4(page));
      if (!targetPhase || targetPhase === 'C5') phaseResults.push(await runPhaseC5(page));
      if (!targetPhase || targetPhase === 'C6') phaseResults.push(await runPhaseC6(page));
      if (!targetPhase || targetPhase === 'C7') phaseResults.push(await runPhaseC7(page));
    }

    // SUITE D: CLIENT MINIAPP
    if (!targetSuite || targetSuite === 'client' || targetSuite === 'd') {
      if (!targetPhase || targetPhase === 'D1') phaseResults.push(await runPhaseD1(page));
      if (!targetPhase || targetPhase === 'D2') phaseResults.push(await runPhaseD2(page));
      if (!targetPhase || targetPhase === 'D3') phaseResults.push(await runPhaseD3(page));
      if (!targetPhase || targetPhase === 'D4') phaseResults.push(await runPhaseD4(page));
      if (!targetPhase || targetPhase === 'D5') phaseResults.push(await runPhaseD5(page));
      if (!targetPhase || targetPhase === 'D6') phaseResults.push(await runPhaseD6(page));
      if (!targetPhase || targetPhase === 'D7') phaseResults.push(await runPhaseD7(page));
      if (!targetPhase || targetPhase === 'D8') phaseResults.push(await runPhaseD8(page));
      if (!targetPhase || targetPhase === 'D9') phaseResults.push(await runPhaseD9(page));
    }

    // SUITE E: TEAM MINIAPP
    if (!targetSuite || targetSuite === 'team' || targetSuite === 'e') {
      if (!targetPhase || targetPhase === 'E1') phaseResults.push(await runPhaseE1(page));
      if (!targetPhase || targetPhase === 'E2') phaseResults.push(await runPhaseE2(page));
      if (!targetPhase || targetPhase === 'E3') phaseResults.push(await runPhaseE3(page));
      if (!targetPhase || targetPhase === 'E4') phaseResults.push(await runPhaseE4(page));
      if (!targetPhase || targetPhase === 'E5') phaseResults.push(await runPhaseE5(page));
      if (!targetPhase || targetPhase === 'E6') phaseResults.push(await runPhaseE6(page));
      if (!targetPhase || targetPhase === 'E7') phaseResults.push(await runPhaseE7(page));
      if (!targetPhase || targetPhase === 'E8') phaseResults.push(await runPhaseE8(page));
      if (!targetPhase || targetPhase === 'E9') phaseResults.push(await runPhaseE9(page));
    }

    // SUITE F: INVESTORS PORTAL
    if (!targetSuite || targetSuite === 'investors' || targetSuite === 'f') {
      if (!targetPhase || targetPhase === 'F1') phaseResults.push(await runPhaseF1(page));
      if (!targetPhase || targetPhase === 'F2') phaseResults.push(await runPhaseF2(page));
      if (!targetPhase || targetPhase === 'F3') phaseResults.push(await runPhaseF3(page));
    }

    // SUITE G: PUBLIC MARKETING SITE
    if (!targetSuite || targetSuite === 'public' || targetSuite === 'g') {
      if (!targetPhase || targetPhase === 'G1') phaseResults.push(await runPhaseG1(page));
      if (!targetPhase || targetPhase === 'G2') phaseResults.push(await runPhaseG2(page));
      if (!targetPhase || targetPhase === 'G3') phaseResults.push(await runPhaseG3(page));
    }

    // SUITE X: CROSS-PORTAL INTEGRATION
    if (!targetSuite || targetSuite === 'cross' || targetSuite === 'x') {
      if (!targetPhase || targetPhase === 'X1') phaseResults.push(await runPhaseX1(page));
      if (!targetPhase || targetPhase === 'X2') phaseResults.push(await runPhaseX2(page));
      if (!targetPhase || targetPhase === 'X3') phaseResults.push(await runPhaseX3(page));
      if (!targetPhase || targetPhase === 'X4') phaseResults.push(await runPhaseX4(page));
      if (!targetPhase || targetPhase === 'X5') phaseResults.push(await runPhaseX5(page));
    }

    console.log('\n============================================================');
    console.log('?? Generating Comprehensive Master Test Report...');
    const { jsonSummary, reportPath } = generateReport(phaseResults, consoleLogs);
    console.log(`? Master Test Run Complete: ${jsonSummary.totalPassed}/${jsonSummary.totalTests} Passed (${jsonSummary.passRate}%)`);
    console.log(`?? View HTML Report at: ${reportPath}`);
    console.log('============================================================\n');

  } catch (err) {
    console.error('? Master E2E Runner Error:', err);
  } finally {
    await browser.close();
    if (serverInstance) {
      serverInstance.close();
    }
    process.exit(0);
  }
}

main();
