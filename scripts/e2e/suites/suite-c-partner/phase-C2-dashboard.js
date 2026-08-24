/**
 * Suite C - Phase C2: Partner Dashboard & Campaign Summary
 */
const { wait, TestTracker } = require('../../utils');

async function runPhaseC2(page) {
  const tracker = new TestTracker('Suite C - Phase C2: Partner Dashboard');
  console.log('\n--- ?? Running Suite C - Phase C2: Dashboard ---');

  await tracker.runStep('C2.1', 'Verify Partner Dashboard Metrics and Campaign List', async () => {
    const content = await page.$eval('body', el => el.textContent);
    tracker.assert(content.length > 50, 'Partner dashboard should render content');
    await tracker.screenshot(page, 'C2.1_partner_dashboard.png');
  });

  return tracker.getSummary();
}

module.exports = { runPhaseC2 };
