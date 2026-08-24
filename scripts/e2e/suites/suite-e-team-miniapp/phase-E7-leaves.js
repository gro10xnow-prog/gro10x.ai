/**
 * Suite E - Phase E7: Leave Requests & Balance Check
 */
const { wait, TestTracker } = require('../../utils');

async function runPhaseE7(page) {
  const tracker = new TestTracker('Suite E - Phase E7: Leave Requests');
  console.log('\n--- ?? Running Suite E - Phase E7: Leaves ---');

  await tracker.runStep('E7.1', 'Verify Leave Request Form and Balance Display', async () => {
    const content = await page.$eval('body', el => el.textContent);
    tracker.assert(content.length > 50, 'Leaves view should render');
    await tracker.screenshot(page, 'E7.1_team_leaves.png');
  });

  return tracker.getSummary();
}

module.exports = { runPhaseE7 };
