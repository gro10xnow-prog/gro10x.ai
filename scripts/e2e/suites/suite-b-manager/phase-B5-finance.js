/**
 * Suite B - Phase B5: Manager Tier-1 Expense Approvals
 */
const { wait, TestTracker } = require('../../utils');

async function runPhaseB5(page) {
  const tracker = new TestTracker('Suite B - Phase B5: Finance & Expenses');
  console.log('\n--- ?? Running Suite B - Phase B5: Finance & Expenses ---');

  await tracker.runStep('B5.1', 'Verify Expense Approval Queue', async () => {
    const content = await page.$eval('body', el => el.textContent);
    tracker.assert(content.length > 50, 'Finance & expense view should render');
    await tracker.screenshot(page, 'B5.1_manager_finance.png');
  });

  return tracker.getSummary();
}

module.exports = { runPhaseB5 };
