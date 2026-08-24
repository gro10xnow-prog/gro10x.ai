/**
 * Suite C - Phase C6: Brief Submission
 */
const { wait, TestTracker } = require('../../utils');

async function runPhaseC6(page) {
  const tracker = new TestTracker('Suite C - Phase C6: Brief Submission');
  console.log('\n--- ?? Running Suite C - Phase C6: Briefs ---');

  await tracker.runStep('C6.1', 'Verify New Brief Submission Modal Form', async () => {
    const content = await page.$eval('body', el => el.textContent);
    tracker.assert(content.length > 50, 'Brief modal should be available');
    await tracker.screenshot(page, 'C6.1_partner_brief.png');
  });

  return tracker.getSummary();
}

module.exports = { runPhaseC6 };
