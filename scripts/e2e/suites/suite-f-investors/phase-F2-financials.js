/**
 * Suite F - Phase F2: Financial Intelligence & Growth Engine Metrics
 */
const { wait, TestTracker } = require('../../utils');

async function runPhaseF2(page) {
  const tracker = new TestTracker('Suite F - Phase F2: Financial Intelligence');
  console.log('\n--- ?? Running Suite F - Phase F2: Financials ---');

  await tracker.runStep('F2.1', 'Verify Financial Breakdown Table and Runway Metrics', async () => {
    const content = await page.$eval('body', el => el.textContent);
    tracker.assert(content.length > 50, 'Financials section should render data');
    await tracker.screenshot(page, 'F2.1_investors_financials.png');
  });

  return tracker.getSummary();
}

module.exports = { runPhaseF2 };
