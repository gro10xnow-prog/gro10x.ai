/**
 * Suite A - Phase A8: Automation Engine & Logs
 */
const { wait, TestTracker } = require('../../utils');

async function runPhaseA8(page) {
  const tracker = new TestTracker('Suite A - Phase A8: Automation Engine');
  console.log('\n--- ?? Running Suite A - Phase A8: Automation Engine ---');

  await tracker.runStep('A8.1.1', 'Load Automation Engine & Event Log Timeline', async () => {
    await page.evaluate(() => { window.location.hash = '#automation'; });
    await wait(1500);
    const content = await page.$eval('#app-view', el => el.textContent);
    tracker.assert(content.includes('Automation') || content.includes('Rule') || content.includes('Trigger') || content.includes('Log'), 'Automation module should render');
    await tracker.screenshot(page, 'A8.1_automation_logs.png');
  });

  return tracker.getSummary();
}

module.exports = { runPhaseA8 };
