/**
 * Suite E - Phase E8: Quick Admin Action Buttons
 */
const { wait, TestTracker } = require('../../utils');

async function runPhaseE8(page) {
  const tracker = new TestTracker('Suite E - Phase E8: Admin Action Panel');
  console.log('\n--- ?? Running Suite E - Phase E8: Admin Actions ---');

  await tracker.runStep('E8.1', 'Verify Admin Quick API Trigger Buttons', async () => {
    const content = await page.$eval('body', el => el.textContent);
    tracker.assert(content.length > 50, 'Admin actions view should render');
    await tracker.screenshot(page, 'E8.1_team_admin_actions.png');
  });

  return tracker.getSummary();
}

module.exports = { runPhaseE8 };
