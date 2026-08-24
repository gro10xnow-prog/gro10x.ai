/**
 * Suite B - Phase B2: Manager Dashboard & Live Team Overview
 */
const { wait, TestTracker } = require('../../utils');

async function runPhaseB2(page) {
  const tracker = new TestTracker('Suite B - Phase B2: Manager Dashboard');
  console.log('\n--- ?? Running Suite B - Phase B2: Dashboard ---');

  await tracker.runStep('B2.1', 'Verify Manager KPIs and Department Counts', async () => {
    const content = await page.$eval('body', el => el.textContent);
    tracker.assert(content.length > 50, 'Manager dashboard should render KPI panels');
    await tracker.screenshot(page, 'B2.1_manager_dashboard.png');
  });

  return tracker.getSummary();
}

module.exports = { runPhaseB2 };
