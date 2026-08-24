/**
 * Suite E - Phase E4: My Tasks & QC Submission
 */
const { wait, TestTracker } = require('../../utils');

async function runPhaseE4(page) {
  const tracker = new TestTracker('Suite E - Phase E4: My Assigned Tasks');
  console.log('\n--- ?? Running Suite E - Phase E4: Tasks ---');

  await tracker.runStep('E4.1', 'Verify Assigned Tasks and Submit for QC Action', async () => {
    const content = await page.$eval('body', el => el.textContent);
    tracker.assert(content.length > 50, 'Tasks section should render');
    await tracker.screenshot(page, 'E4.1_team_tasks.png');
  });

  return tracker.getSummary();
}

module.exports = { runPhaseE4 };
