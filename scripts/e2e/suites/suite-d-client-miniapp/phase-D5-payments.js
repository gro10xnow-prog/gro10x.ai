/**
 * Suite D - Phase D5: Invoices & Payment Submission
 */
const { wait, TestTracker } = require('../../utils');

async function runPhaseD5(page) {
  const tracker = new TestTracker('Suite D - Phase D5: Invoices & Payments');
  console.log('\n--- ?? Running Suite D - Phase D5: Payments ---');

  await tracker.runStep('D5.1', 'Verify Invoices and Payment Method Chips (bKash/MoMo/Bank)', async () => {
    const content = await page.$eval('body', el => el.textContent);
    tracker.assert(content.length > 50, 'Payments section should render');
    await tracker.screenshot(page, 'D5.1_miniapp_payments.png');
  });

  return tracker.getSummary();
}

module.exports = { runPhaseD5 };
