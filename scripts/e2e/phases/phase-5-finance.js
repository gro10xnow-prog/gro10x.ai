/**
 * scripts/e2e/phases/phase-5-finance.js
 * Phase 5: Finance & Expenses Command Center
 */
const { wait, TestTracker } = require('../utils');

async function runPhase5(page) {
  const tracker = new TestTracker('Phase 5: Finance & Expenses Command Center');
  console.log('\n--- 🚀 Running Phase 5: Finance & Expenses ---');

  // 5.1 Load Finance Hub & Verify KPIs
  await tracker.runStep('5.1.1', 'Load Finance Hub & Verify KPI Summary Cards', async () => {
    await page.evaluate(() => { window.location.hash = '#finance'; });
    await wait(1500);
    const content = await page.$eval('#app-view', el => el.textContent);
    tracker.assert(content.includes('Financials') || content.includes('Invoiced') || content.includes('Revenue'), 'Finance module should load');
    tracker.assert(content.includes('৳'), 'Finance KPIs should render BDT ৳ currency symbols');
    await tracker.screenshot(page, '5.1.1.4_finance_kpis.png');
  });

  // 5.1.3 Subtab Navigation
  await tracker.runStep('5.1.3', 'Test Subtab Navigation (Invoices / Verifications / Expenses / Quotes)', async () => {
    // Invoices Subtab
    await page.evaluate(() => {
      if (window.FINANCE_MODULE && window.FINANCE_MODULE.switchSubtab) {
        window.FINANCE_MODULE.switchSubtab('invoices');
      }
    });
    await wait(500);

    // Expense Queue Subtab
    await page.evaluate(() => {
      if (window.FINANCE_MODULE && window.FINANCE_MODULE.switchSubtab) {
        window.FINANCE_MODULE.switchSubtab('expenses');
      }
    });
    await wait(500);
    await tracker.screenshot(page, '5.1.6.5_expense_queue.png');

    // Price Quotes Subtab
    await page.evaluate(() => {
      if (window.FINANCE_MODULE && window.FINANCE_MODULE.switchSubtab) {
        window.FINANCE_MODULE.switchSubtab('quotes');
      }
    });
    await wait(500);
    await tracker.screenshot(page, '5.1.9.6_price_quotes.png');

    // Return to Invoices
    await page.evaluate(() => {
      if (window.FINANCE_MODULE && window.FINANCE_MODULE.switchSubtab) {
        window.FINANCE_MODULE.switchSubtab('invoices');
      }
    });
    await wait(500);
  });

  // 5.1.4 Invoices Filter Chips
  await tracker.runStep('5.1.4', 'Test Invoice Status Filter Chips (All/Overdue/Pending/Paid)', async () => {
    await page.evaluate(() => {
      if (window.FINANCE_MODULE && window.FINANCE_MODULE.setInvoiceFilter) {
        window.FINANCE_MODULE.setInvoiceFilter('overdue');
      }
    });
    await wait(400);

    await page.evaluate(() => {
      if (window.FINANCE_MODULE && window.FINANCE_MODULE.setInvoiceFilter) {
        window.FINANCE_MODULE.setInvoiceFilter('paid');
      }
    });
    await wait(400);

    await page.evaluate(() => {
      if (window.FINANCE_MODULE && window.FINANCE_MODULE.setInvoiceFilter) {
        window.FINANCE_MODULE.setInvoiceFilter('all');
      }
    });
    await wait(400);
    await tracker.screenshot(page, '5.1.4.10_invoices_table.png');
  });

  // 5.1.5 Create Invoice Modal
  await tracker.runStep('5.1.5', 'Open & Verify Create Invoice Modal', async () => {
    await page.evaluate(() => {
      if (window.FINANCE_MODULE && window.FINANCE_MODULE.openInvoiceModal) {
        window.FINANCE_MODULE.openInvoiceModal();
      }
    });
    await wait(600);
    const modalOpen = await page.$eval('#createInvoiceModal, .modal-overlay', el => el.style.display !== 'none');
    tracker.assert(modalOpen, 'Create Invoice modal should open');
    await tracker.screenshot(page, '5.1.5.6_create_invoice_modal.png');

    await page.evaluate(() => {
      if (window.FINANCE_MODULE && window.FINANCE_MODULE.closeInvoiceModal) {
        window.FINANCE_MODULE.closeInvoiceModal();
      }
    });
    await wait(300);
  });

  // 5.1.7 Log Expense Claim Modal
  await tracker.runStep('5.1.7', 'Open & Verify Log Expense Claim Modal', async () => {
    await page.evaluate(() => {
      if (window.FINANCE_MODULE && window.FINANCE_MODULE.openExpenseModal) {
        window.FINANCE_MODULE.openExpenseModal();
      }
    });
    await wait(600);
    const modalOpen = await page.$eval('#logExpenseModal, .modal-overlay', el => el.style.display !== 'none');
    tracker.assert(modalOpen, 'Log Expense modal should open');
    await tracker.screenshot(page, '5.1.7.5_log_expense_modal.png');

    await page.evaluate(() => {
      if (window.FINANCE_MODULE && window.FINANCE_MODULE.closeExpenseModal) {
        window.FINANCE_MODULE.closeExpenseModal();
      }
    });
    await wait(300);
  });

  return tracker.getSummary();
}

module.exports = { runPhase5 };
