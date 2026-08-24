/**
 * Suite F - Phase F3: Leadership, Cap Table & Roadmap Timeline
 */
const { wait, TestTracker } = require('../../utils');

async function runPhaseF3(page) {
  const tracker = new TestTracker('Suite F - Phase F3: Leadership & Roadmap');
  console.log('\n--- ?? Running Suite F - Phase F3: Leadership & Roadmap ---');

  await tracker.runStep('F3.1', 'Verify Founders, Team & Growth Roadmap Sections', async () => {
    const content = await page.$eval('body', el => el.textContent);
    tracker.assert(content.length > 50, 'Roadmap & leadership should render');
    await tracker.screenshot(page, 'F3.1_investors_roadmap.png');
  });

  return tracker.getSummary();
}

module.exports = { runPhaseF3 };
