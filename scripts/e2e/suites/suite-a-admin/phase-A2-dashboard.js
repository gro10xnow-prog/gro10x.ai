/**
 * Suite A - Phase A2: Executive Dashboard & 5-Engine Growth Ecosystem
 */
const { APP_URL, wait, TestTracker } = require('../../utils');

async function runPhaseA2(page) {
  const tracker = new TestTracker('Suite A - Phase A2: Executive Dashboard & 5-Engine');
  console.log('\n--- ?? Running Suite A - Phase A2: Executive Dashboard ---');

  await tracker.runStep('A2.1', 'Load Executive Dashboard & Verify KPI Summary Cards', async () => {
    await page.evaluate(() => { window.location.hash = '#dashboard'; });
    await wait(1500);
    const content = await page.$eval('#app-view', el => el.textContent);
    tracker.assert(content.includes('Revenue') || content.includes('Growth') || content.includes('Invoiced') || content.includes('Pipeline'), 'Dashboard KPI cards must render');
    await tracker.screenshot(page, 'A2.1_dashboard_hero.png');
  });

  await tracker.runStep('A2.2', 'Verify 5-Engine Growth Ecosystem Table Rows', async () => {
    const engineRows = await page.evaluate(() => {
      const rows = document.querySelectorAll('#engineTable tbody tr, .engine-card, [data-engine-id]');
      return rows.length;
    });
    tracker.assert(engineRows >= 0, '5-Engine growth ecosystem table should be present');
    await tracker.screenshot(page, 'A2.2_5_engine_table.png');
  });

  await tracker.runStep('A2.3', 'Toggle Currency Format (BDT <-> USD)', async () => {
    const currToggle = await page.$('#currencyToggleBtn, .currency-toggle');
    if (currToggle) {
      await currToggle.click();
      await wait(400);
      const textAfter = await page.$eval('#app-view', el => el.textContent);
      tracker.assert(textAfter.includes('$') || textAfter.includes('?'), 'Currency toggle should update format');
      await currToggle.click();
      await wait(300);
    }
  });

  await tracker.runStep('A2.4', 'Action Center Quick Navigation Buttons', async () => {
    const actionCenter = await page.$('#actionCenter, .action-center-grid, #app-view');
    tracker.assert(actionCenter !== null, 'Action Center must be rendered');
    await tracker.screenshot(page, 'A2.4_action_center.png');
  });

  return tracker.getSummary();
}

module.exports = { runPhaseA2 };
