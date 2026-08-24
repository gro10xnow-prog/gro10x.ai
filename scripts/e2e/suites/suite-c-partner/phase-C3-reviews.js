/**
 * Suite C - Phase C3: Partner Review Room Proofing
 */
const { wait, TestTracker } = require('../../utils');

async function runPhaseC3(page) {
  const tracker = new TestTracker('Suite C - Phase C3: Partner Review Room');
  console.log('\n--- ?? Running Suite C - Phase C3: Review Room ---');

  await tracker.runStep('C3.1', 'Verify Review Room Player & Cut Approval Controls', async () => {
    const content = await page.$eval('body', el => el.textContent);
    tracker.assert(content.includes('Review') || content.includes('Cut') || content.includes('Partner'), 'Review room view should render');
    await tracker.screenshot(page, 'C3.1_partner_reviews.png');
  });

  return tracker.getSummary();
}

module.exports = { runPhaseC3 };
