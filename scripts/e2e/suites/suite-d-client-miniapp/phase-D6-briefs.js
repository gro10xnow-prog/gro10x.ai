/**
 * Suite D - Phase D6: Project Brief Submission
 */
const { wait, TestTracker } = require('../../utils');

async function runPhaseD6(page) {
  const tracker = new TestTracker('Suite D - Phase D6: Brief Submission');
  console.log('\n--- ?? Running Suite D - Phase D6: Briefs ---');

  await tracker.runStep('D6.1', 'Verify Project Brief Submission Form', async () => {
    const content = await page.$eval('body', el => el.textContent);
    tracker.assert(content.length > 50, 'Brief form should render');
    await tracker.screenshot(page, 'D6.1_miniapp_brief.png');
  });

  return tracker.getSummary();
}

module.exports = { runPhaseD6 };
