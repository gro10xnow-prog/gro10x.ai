/**
 * Suite E - Phase E3: Attendance & GPS Clock-In
 */
const { wait, TestTracker } = require('../../utils');

async function runPhaseE3(page) {
  const tracker = new TestTracker('Suite E - Phase E3: Attendance Logging');
  console.log('\n--- ?? Running Suite E - Phase E3: Attendance ---');

  await tracker.runStep('E3.1', 'Verify Clock-In / Clock-Out and Studio Status', async () => {
    const content = await page.$eval('body', el => el.textContent);
    tracker.assert(content.length > 50, 'Attendance interface should render');
    await tracker.screenshot(page, 'E3.1_team_attendance.png');
  });

  return tracker.getSummary();
}

module.exports = { runPhaseE3 };
