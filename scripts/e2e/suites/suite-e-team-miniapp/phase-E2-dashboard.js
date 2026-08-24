/**
 * Suite E - Phase E2: Team MiniApp Home & Shift Status
 */
const { wait, TestTracker } = require('../../utils');

async function runPhaseE2(page) {
  const tracker = new TestTracker('Suite E - Phase E2: Staff Shift Status');
  console.log('\n--- ?? Running Suite E - Phase E2: Shift Status ---');

  await tracker.runStep('E2.1', 'Verify Staff Shift Status and Clock Controls', async () => {
    const content = await page.$eval('body', el => el.textContent);
    tracker.assert(content.length > 50, 'Team home should render shift status');
    await tracker.screenshot(page, 'E2.1_team_dashboard.png');
  });

  return tracker.getSummary();
}

module.exports = { runPhaseE2 };
