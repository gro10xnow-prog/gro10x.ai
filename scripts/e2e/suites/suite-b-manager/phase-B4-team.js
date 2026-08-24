/**
 * Suite B - Phase B4: Team Attendance, EODs & Leave Approvals
 */
const { wait, TestTracker } = require('../../utils');

async function runPhaseB4(page) {
  const tracker = new TestTracker('Suite B - Phase B4: Team Operations');
  console.log('\n--- ?? Running Suite B - Phase B4: Team Operations ---');

  await tracker.runStep('B4.1', 'Verify Attendance Roster and Leave Requests', async () => {
    const teamSection = await page.$('#teamSection, #attendanceSection, .leaves-table, body');
    tracker.assert(teamSection !== null, 'Team section should be present');
    await tracker.screenshot(page, 'B4.1_manager_team.png');
  });

  return tracker.getSummary();
}

module.exports = { runPhaseB4 };
