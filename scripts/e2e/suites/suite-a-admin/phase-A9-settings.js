/**
 * Suite A - Phase A9: Settings & Telemetry
 */
const { wait, TestTracker } = require('../../utils');

async function runPhaseA9(page) {
  const tracker = new TestTracker('Suite A - Phase A9: Settings & Telemetry');
  console.log('\n--- ?? Running Suite A - Phase A9: Settings ---');

  await tracker.runStep('A9.1.1', 'Load Settings Configuration & Telemetry', async () => {
    await page.evaluate(() => { window.location.hash = '#settings'; });
    await wait(1500);
    const content = await page.$eval('#app-view', el => el.textContent);
    tracker.assert(content.includes('Setting') || content.includes('Configuration') || content.includes('Telemetry'), 'Settings module should render');
    await tracker.screenshot(page, 'A9.1_settings.png');
  });

  return tracker.getSummary();
}

module.exports = { runPhaseA9 };
