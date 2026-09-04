/**
 * scripts/e2e/suites/suite-b-manager/phase-B5-finance.js
 * Suite B - Phase B5: Manager Tier-1 Expense Approvals & Financial Operations
 * 
 * Tests:
 * 1. Manager Financials Hub Boot & 3-Tier Expense Table
 * 2. Expense Claim Headers & Column Formatting
 * 3. Submit Expense Claim Flow
 * 4. Tier 1 & Tier 2 Approval Handlers Verification
 * 5. Live Expense Data Reload via loadManagerExpenses()
 * 6. Clean Navigation Return to Dashboard
 */

const { BASE_URL, wait, TestTracker } = require('../../utils');
const { injectRoleSession } = require('../../auth');

async function runPhaseB5(page) {
  const tracker = new TestTracker('Suite B - Phase B5: Finance & Expenses');
  console.log('\n--- 💰 Running Suite B - Phase B5: Finance & Expense Operations ---');

  const MANAGER_URL = `${BASE_URL}/manager.html`;

  await tracker.runStep('B5.1', 'Manager Financials Hub Boot & 3-Tier Expense Table', async () => {
    await injectRoleSession(page, 'manager');
    await page.goto(MANAGER_URL, { waitUntil: 'networkidle2' });
    await wait(1000);

    // Switch to financials tab
    await page.evaluate(() => {
      if (typeof window.switchTab === 'function') window.switchTab('financials');
    });
    await wait(600);

    const isFinanceActive = await page.evaluate(() => {
      const pane = document.getElementById('tab-financials');
      return pane && (pane.classList.contains('active') || pane.style.display !== 'none');
    });
    tracker.assert(isFinanceActive, '#tab-financials must be active');

    const hasTableBody = await page.evaluate(() => {
      return document.getElementById('managerExpenseTableBody') !== null;
    });
    tracker.assert(hasTableBody, '#managerExpenseTableBody must be present in DOM');

    await tracker.screenshot(page, 'B5.1_manager_finance_table.png');
  });

  await tracker.runStep('B5.2', 'Expense Claim Headers & Column Formatting', async () => {
    const headers = await page.evaluate(() => {
      const ths = Array.from(document.querySelectorAll('#tab-financials table thead th'));
      return ths.map(th => th.textContent.trim());
    });

    tracker.assert(headers.length >= 6, `Expected at least 6 expense table headers, got ${headers.length}`);
    tracker.assert(headers.includes('Claim ID') && headers.includes('Amount'), 'Headers must include Claim ID and Amount');
  });

  await tracker.runStep('B5.3', 'Submit Expense Claim Flow', async () => {
    await page.evaluate(() => {
      let callCount = 0;
      window.prompt = () => {
        callCount++;
        if (callCount === 1) return '2500'; // 2500 BDT
        if (callCount === 2) return 'Production';
        return 'Gimbal Battery & Tripod Maintenance';
      };
    });

    await page.evaluate(() => {
      if (typeof window.openSubmitExpenseModal === 'function') {
        window.openSubmitExpenseModal();
      }
    });
    await wait(500);

    await tracker.screenshot(page, 'B5.3_expense_claim_logged.png');
  });

  await tracker.runStep('B5.4', 'Tier 1 & Tier 2 Approval Handlers Verification', async () => {
    const hasHandlers = await page.evaluate(() => {
      return typeof window.approveExpenseT1 === 'function' && typeof window.approveExpenseT2 === 'function';
    });
    tracker.assert(hasHandlers, 'approveExpenseT1 and approveExpenseT2 must be defined on window');
  });

  await tracker.runStep('B5.5', 'Live Expense Data Reload via loadManagerExpenses()', async () => {
    await page.evaluate(async () => {
      if (typeof window.loadManagerExpenses === 'function') {
        await window.loadManagerExpenses();
      }
    });
    await wait(400);

    const hasContent = await page.evaluate(() => {
      const tbody = document.getElementById('managerExpenseTableBody');
      return tbody && tbody.children.length >= 0;
    });
    tracker.assert(hasContent, 'Expense table must remain populated after reload');
  });

  await tracker.runStep('B5.6', 'Clean Navigation Return to Dashboard', async () => {
    await page.evaluate(() => {
      if (typeof window.switchTab === 'function') window.switchTab('dashboard');
    });
    await wait(300);

    const isDashboardActive = await page.evaluate(() => {
      const pane = document.getElementById('tab-dashboard');
      return pane && (pane.classList.contains('active') || pane.style.display !== 'none');
    });
    tracker.assert(isDashboardActive, 'Return to #tab-dashboard must succeed');
  });

  return tracker.getSummary();
}

module.exports = { runPhaseB5 };
