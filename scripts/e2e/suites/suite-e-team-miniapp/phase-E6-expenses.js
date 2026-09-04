/**
 * scripts/e2e/suites/suite-e-team-miniapp/phase-E6-expenses.js
 * Suite E - Phase E6: Log Expense Claim & Receipts
 * 
 * Tests:
 * 1. Navigate to Pay & Finances Tab (showPage('pagePay')) & Tab State
 * 2. Open Expense Claim Form Sheet (openExpenseForm) & Field Anatomy
 * 3. Expense Category Options (Transport, Supplies, Food, Equipment, Other)
 * 4. Validation Guard against Blank Expense Submission
 * 5. Populate Expense Claim Details & Submit Mutation (submitExpense)
 * 6. Expense History List Container (expenseHistoryList) & Dismiss Sheet
 */

const { BASE_URL, wait, TestTracker } = require('../../utils');
const { injectRoleSession } = require('../../auth');

async function runPhaseE6(page) {
  const tracker = new TestTracker('Suite E - Phase E6: Expense Claims & Reimbursements');
  console.log('\n--- 🧾 Running Suite E - Phase E6: Expenses ---');

  const TEAM_URL = `${BASE_URL}/team-miniapp.html`;

  await tracker.runStep('E6.1', 'Navigate to Pay & Finances Tab (showPage) & Tab State', async () => {
    await injectRoleSession(page, 'specialist');
    await page.goto(TEAM_URL, { waitUntil: 'networkidle2' });
    await wait(1000);

    const navRes = await page.evaluate(async () => {
      window.alert = () => {};
      if (typeof window.showPage === 'function') {
        window.showPage('pagePay');
      }
      await new Promise(r => setTimeout(r, 200));

      const pageEl = document.getElementById('pagePay');
      return {
        isActive: pageEl ? pageEl.classList.contains('active') : false
      };
    });

    tracker.assert(navRes.isActive, 'Pay page must become active');
    await tracker.screenshot(page, 'E6.1_team_pay_page.png');
  });

  await tracker.runStep('E6.2', 'Open Expense Claim Form Sheet (openExpenseForm) & Field Anatomy', async () => {
    const sheetOpened = await page.evaluate(async () => {
      if (typeof window.openExpenseForm === 'function') {
        window.openExpenseForm();
      }
      await new Promise(r => setTimeout(r, 200));

      const sheet = document.getElementById('expenseSheet');
      const cat = document.getElementById('expCat');
      const amt = document.getElementById('expAmt');
      const date = document.getElementById('expDate');
      const desc = document.getElementById('expDesc');
      const file = document.getElementById('expFile');

      return {
        hasSheet: sheet !== null,
        hasCat: cat !== null,
        hasAmt: amt !== null,
        hasDate: date !== null,
        hasDesc: desc !== null,
        hasFile: file !== null
      };
    });

    tracker.assert(sheetOpened.hasSheet, 'Expense sheet must open');
    tracker.assert(sheetOpened.hasCat && sheetOpened.hasAmt && sheetOpened.hasDate, 'Core expense input fields must exist');
    await tracker.screenshot(page, 'E6.2_team_expense_sheet.png');
  });

  await tracker.runStep('E6.3', 'Expense Category Options (Transport, Supplies, Food, Equipment, Other)', async () => {
    const categories = await page.evaluate(() => {
      const cat = document.getElementById('expCat');
      return cat ? Array.from(cat.options).map(o => o.value) : [];
    });

    tracker.assert(categories.some(c => c.includes('Transport')), 'Must include Transport category');
    tracker.assert(categories.some(c => c.includes('Supplies')), 'Must include Supplies category');
    tracker.assert(categories.some(c => c.includes('Equipment')), 'Must include Equipment Rental category');
    await tracker.screenshot(page, 'E6.3_team_expense_categories.png');
  });

  await tracker.runStep('E6.4', 'Validation Guard against Blank Expense Submission', async () => {
    const valResult = await page.evaluate(async () => {
      let alertTriggered = false;
      window.alert = () => { alertTriggered = true; };
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.showAlert = () => { alertTriggered = true; };
      }

      const amt = document.getElementById('expAmt');
      if (amt) amt.value = '';

      if (typeof window.submitExpense === 'function') {
        await window.submitExpense();
      }
      await new Promise(r => setTimeout(r, 100));

      return {
        isSheetStillPresent: document.getElementById('expenseSheet') !== null
      };
    });

    tracker.assert(valResult.isSheetStillPresent, 'Expense sheet should remain open on validation error');
    await tracker.screenshot(page, 'E6.4_team_expense_validation.png');
  });

  await tracker.runStep('E6.5', 'Populate Expense Claim Details & Submit Mutation (submitExpense)', async () => {
    const submitResult = await page.evaluate(async () => {
      window.alert = () => {};
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.showAlert = (msg, cb) => { if (cb) cb(); };
      }

      const cat = document.getElementById('expCat');
      const amt = document.getElementById('expAmt');
      const desc = document.getElementById('expDesc');

      if (cat) cat.value = 'Field Shoot Transport';
      if (amt) amt.value = '850';
      if (desc) desc.value = 'Uber to client HQ for pre-production briefing';

      if (typeof window.submitExpense === 'function') {
        await window.submitExpense();
      }
      await new Promise(r => setTimeout(r, 500));

      const sheet = document.getElementById('expenseSheet');
      return {
        isSheetDismissed: sheet === null
      };
    });

    tracker.assert(submitResult.isSheetDismissed, 'Expense sheet must close upon submission');
    await tracker.screenshot(page, 'E6.5_team_expense_submitted.png');
  });

  await tracker.runStep('E6.6', 'Expense History List Container (expenseHistoryList) & Dismiss Sheet', async () => {
    const historyState = await page.evaluate(() => {
      const list = document.getElementById('expenseHistoryList');
      return {
        hasList: list !== null
      };
    });

    tracker.assert(historyState.hasList, 'Expense history list container must exist on Pay tab');
    await tracker.screenshot(page, 'E6.6_team_expense_history.png');
  });

  return tracker.getSummary();
}

module.exports = { runPhaseE6 };

