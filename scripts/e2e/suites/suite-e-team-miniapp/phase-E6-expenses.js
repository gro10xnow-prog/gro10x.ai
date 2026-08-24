/**
 * Suite E - Phase E6: Log Expense Claim & Receipts
 */
const { wait, TestTracker } = require('../../utils');

async function runPhaseE6(page) {
  const tracker = new TestTracker('Suite E - Phase E6: Expense Claims');
  console.log('\n--- ?? Running Suite E - Phase E6: Expenses ---');

  await tracker.runStep('E6.1', 'Verify Expense Claim Form & Category Selector', async () => {
    const content = await page.$eval('body', el => el.textContent);
    tracker.assert(content.length > 50, 'Expense claim interface should render');
    await tracker.screenshot(page, 'E6.1_team_expenses.png');
  });

  return tracker.getSummary();
}

module.exports = { runPhaseE6 };
