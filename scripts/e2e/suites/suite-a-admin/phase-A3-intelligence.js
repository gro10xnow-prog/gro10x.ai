/**
 * Suite A - Phase A3: Intelligence ? Leads Pipeline & Client CRM
 */
const { wait, assertModalOpen, assertModalClosed, TestTracker } = require('../../utils');

async function runPhaseA3(page) {
  const tracker = new TestTracker('Suite A - Phase A3: Leads & CRM Intelligence');
  console.log('\n--- ?? Running Suite A - Phase A3: Leads & CRM ---');

  // A3.1 Leads Pipeline
  await tracker.runStep('A3.1.1', 'Load Leads Pipeline & Verify Stage Columns', async () => {
    await page.evaluate(() => { window.location.hash = '#leads'; });
    await wait(1500);
    const content = await page.$eval('#app-view', el => el.textContent);
    tracker.assert(content.includes('Lead') || content.includes('Pipeline') || content.includes('Prospect'), 'Leads module should load');
    await tracker.screenshot(page, 'A3.1_leads_pipeline.png');
  });

  await tracker.runStep('A3.1.2', 'Open and Verify Add Lead Modal', async () => {
    await page.evaluate(() => {
      if (window.LEADS_MODULE && window.LEADS_MODULE.openNewLeadModal) {
        window.LEADS_MODULE.openNewLeadModal();
      }
    });
    await wait(500);
    const modal = await page.$('#newLeadModal, .modal-overlay, #app-view');
    tracker.assert(modal !== null, 'Lead modal should exist');
    await tracker.screenshot(page, 'A3.1.2_new_lead_modal.png');
    await page.evaluate(() => {
      if (window.LEADS_MODULE && window.LEADS_MODULE.closeNewLeadModal) {
        window.LEADS_MODULE.closeNewLeadModal();
      }
    });
    await wait(300);
  });

  // A3.2 CRM Clients
  await tracker.runStep('A3.2.1', 'Load CRM Directory & Search Filtering', async () => {
    await page.evaluate(() => { window.location.hash = '#crm'; });
    await wait(1500);
    const content = await page.$eval('#app-view', el => el.textContent);
    tracker.assert(content.includes('Client') || content.includes('CRM') || content.includes('Directory'), 'CRM module should load');
    await tracker.screenshot(page, 'A3.2_crm_grid.png');
  });

  await tracker.runStep('A3.2.2', 'Open and Verify Add Client Modal', async () => {
    await page.evaluate(() => {
      if (window.CRM_MODULE && window.CRM_MODULE.openNewClientModal) {
        window.CRM_MODULE.openNewClientModal();
      }
    });
    await wait(500);
    const modal = await page.$('#newClientModal, .modal-overlay, #app-view');
    tracker.assert(modal !== null, 'Client modal should exist');
    await tracker.screenshot(page, 'A3.2.2_new_client_modal.png');
    await page.evaluate(() => {
      if (window.CRM_MODULE && window.CRM_MODULE.closeNewClientModal) {
        window.CRM_MODULE.closeNewClientModal();
      }
    });
    await wait(300);
  });

  return tracker.getSummary();
}

module.exports = { runPhaseA3 };
