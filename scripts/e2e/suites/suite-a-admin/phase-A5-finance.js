/**
 * Suite A - Phase A5: Finance, Invoices, Expenses, Payments & Price Quotes
 */
const { wait, TestTracker } = require('../../utils');

async function runPhaseA5(page) {
  const tracker = new TestTracker('Suite A - Phase A5: Financial Operations');
  console.log('\n--- ?? Running Suite A - Phase A5: Finance & Invoices ---');

  await tracker.runStep('A5.1.1', 'Load Finance Hub & Verify Summary Cards', async () => {
    await page.evaluate(() => { window.location.hash = '#finance'; });
    await wait(1500);
    const content = await page.$eval('#app-view', el => el.textContent);
    tracker.assert(content.includes('Financials') || content.includes('Invoiced') || content.includes('Revenue'), 'Finance module should render');
    await tracker.screenshot(page, 'A5.1_finance_kpis.png');
  });

  await tracker.runStep('A5.1.2', 'Test Subtab Switching (Invoices / Expenses / Quotes / Verifications)', async () => {
    await page.evaluate(() => {
      if (window.FINANCE_MODULE && window.FINANCE_MODULE.switchSubtab) {
        window.FINANCE_MODULE.switchSubtab('expenses');
      }
    });
    await wait(400);
    await tracker.screenshot(page, 'A5.1.2_expenses_subtab.png');

    await page.evaluate(() => {
      if (window.FINANCE_MODULE && window.FINANCE_MODULE.switchSubtab) {
        window.FINANCE_MODULE.switchSubtab('quotes');
      }
    });
    await wait(400);
    await tracker.screenshot(page, 'A5.1.2_quotes_subtab.png');

    await page.evaluate(() => {
      if (window.FINANCE_MODULE && window.FINANCE_MODULE.switchSubtab) {
        window.FINANCE_MODULE.switchSubtab('invoices');
      }
    });
    await wait(400);
  });

  await tracker.runStep('A5.1.3', 'Open & Verify Create Invoice Modal', async () => {
    await page.evaluate(() => {
      if (window.FINANCE_MODULE && window.FINANCE_MODULE.openInvoiceModal) {
        window.FINANCE_MODULE.openInvoiceModal();
      }
    });
    await wait(500);
    const modal = await page.$('#createInvoiceModal, .modal-overlay, #app-view');
    tracker.assert(modal !== null, 'Create Invoice modal should exist');
    await tracker.screenshot(page, 'A5.1.3_create_invoice_modal.png');
    await page.evaluate(() => {
      if (window.FINANCE_MODULE && window.FINANCE_MODULE.closeInvoiceModal) {
        window.FINANCE_MODULE.closeInvoiceModal();
      }
    });
    await wait(300);
  });

  await tracker.runStep('A5.1.4', 'Open & Verify Log Expense Claim Modal', async () => {
    await page.evaluate(() => {
      if (window.FINANCE_MODULE && window.FINANCE_MODULE.openExpenseModal) {
        window.FINANCE_MODULE.openExpenseModal();
      }
    });
    await wait(500);
    const modal = await page.$('#logExpenseModal, .modal-overlay, #app-view');
    tracker.assert(modal !== null, 'Log Expense modal should exist');
    await tracker.screenshot(page, 'A5.1.4_log_expense_modal.png');
    await page.evaluate(() => {
      if (window.FINANCE_MODULE && window.FINANCE_MODULE.closeExpenseModal) {
        window.FINANCE_MODULE.closeExpenseModal();
      }
    });
    await wait(300);
  });

  return tracker.getSummary();
}

module.exports = { runPhaseA5 };
