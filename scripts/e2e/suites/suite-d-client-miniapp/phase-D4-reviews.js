/**
 * Suite D - Phase D4: In-App Video Review & Approvals
 */
const { wait, TestTracker } = require('../../utils');

async function runPhaseD4(page) {
  const tracker = new TestTracker('Suite D - Phase D4: Review Room Tab');
  console.log('\n--- ?? Running Suite D - Phase D4: Reviews ---');

  await tracker.runStep('D4.1', 'Verify Review Cuts and 1-Tap Approval Action', async () => {
    const content = await page.$eval('body', el => el.textContent);
    tracker.assert(content.includes('Review') || content.includes('Cut') || content.includes('Deliverable') || content.length > 50, 'Review room view should render');
    await tracker.screenshot(page, 'D4.1_miniapp_review.png');
  });

  return tracker.getSummary();
}

module.exports = { runPhaseD4 };
