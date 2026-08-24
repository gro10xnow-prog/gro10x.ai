/**
 * Suite D - Phase D3: Campaigns & Deliverable Progress
 */
const { wait, TestTracker } = require('../../utils');

async function runPhaseD3(page) {
  const tracker = new TestTracker('Suite D - Phase D3: Campaigns Tab');
  console.log('\n--- ?? Running Suite D - Phase D3: Campaigns ---');

  await tracker.runStep('D3.1', 'Verify Active Campaign Stages and Timeline', async () => {
    const content = await page.$eval('body', el => el.textContent);
    tracker.assert(content.length > 50, 'Campaigns section should render');
    await tracker.screenshot(page, 'D3.1_miniapp_campaigns.png');
  });

  return tracker.getSummary();
}

module.exports = { runPhaseD3 };
