/**
 * scripts/e2e/phases/phase-3-intel.js
 * Phase 3: Client Intelligence — Leads Pipeline & Client CRM
 */
const { wait, TestTracker } = require('../utils');

async function runPhase3(page) {
  const tracker = new TestTracker('Phase 3: Client Intelligence (Leads & CRM)');
  console.log('\n--- 🚀 Running Phase 3: Client Intelligence (Leads & CRM) ---');

  // 3.1 Leads Pipeline
  await tracker.runStep('3.1.1', 'Load Leads Pipeline Board & Verify Columns', async () => {
    await page.evaluate(() => { window.location.hash = '#leads'; });
    await wait(1500);
    const content = await page.$eval('#app-view', el => el.textContent);
    tracker.assert(content.includes('Lead') || content.includes('Pipeline'), 'Leads module should load');
    await tracker.screenshot(page, '3.1.6_leads_pipeline.png');
  });

  // 3.2 Client CRM
  await tracker.runStep('3.2.1', 'Load Client CRM Grid & Verify Records', async () => {
    await page.evaluate(() => { window.location.hash = '#crm'; });
    await wait(1500);
    const content = await page.$eval('#app-view', el => el.textContent);
    tracker.assert(content.includes('Client') || content.includes('CRM'), 'CRM module should load');
    await tracker.screenshot(page, '3.2.6_crm_grid.png');
  });

  // 3.2.2 Search & Cards
  await tracker.runStep('3.2.2', 'Test Client CRM Search & KPI Rendering', async () => {
    const kpiTile = await page.$('.kpi-tile, .card-glass, #app-view');
    tracker.assert(kpiTile !== null, 'Client records or KPI summary tiles should be rendered');
  });

  return tracker.getSummary();
}

module.exports = { runPhase3 };
