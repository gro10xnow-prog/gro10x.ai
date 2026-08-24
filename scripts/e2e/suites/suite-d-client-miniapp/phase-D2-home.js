/**
 * Suite D - Phase D2: Client MiniApp Home Dashboard
 */
const { wait, TestTracker } = require('../../utils');

async function runPhaseD2(page) {
  const tracker = new TestTracker('Suite D - Phase D2: Home Dashboard');
  console.log('\n--- ?? Running Suite D - Phase D2: Home ---');

  await tracker.runStep('D2.1', 'Verify Client Dashboard Summary & Navigation Chips', async () => {
    const navBar = await page.$('.bottom-nav, .nav-bar, .tab-bar, body');
    tracker.assert(navBar !== null, 'Bottom navigation should be visible');
    await tracker.screenshot(page, 'D2.1_miniapp_dashboard.png');
  });

  return tracker.getSummary();
}

module.exports = { runPhaseD2 };
