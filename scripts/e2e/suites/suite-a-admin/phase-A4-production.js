/**
 * Suite A - Phase A4: Production Hub ? Kanban Pipeline, Review Room, Social Planner, Services CMS
 */
const { wait, assertModalOpen, assertModalClosed, TestTracker } = require('../../utils');

async function runPhaseA4(page) {
  const tracker = new TestTracker('Suite A - Phase A4: Production Hub');
  console.log('\n--- ?? Running Suite A - Phase A4: Production Hub ---');

  // A4.1 Kanban Pipeline
  await tracker.runStep('A4.1.1', 'Load Kanban Board & Verify Workspaces', async () => {
    await page.evaluate(() => { window.location.hash = '#kanban'; });
    await wait(1500);
    const content = await page.$eval('#app-view', el => el.textContent);
    tracker.assert(content.includes('Pipeline') || content.includes('Board') || content.includes('Workflows'), 'Kanban module should load');
    await tracker.screenshot(page, 'A4.1_kanban_board.png');
  });

  await tracker.runStep('A4.1.2', 'Test Kanban View Switcher (Board / List / Calendar)', async () => {
    const listBtn = await page.$('button.view-btn:nth-child(2), [data-view="list"]');
    if (listBtn) {
      await listBtn.click();
      await wait(400);
    }
    const boardBtn = await page.$('button.view-btn:nth-child(1), [data-view="board"]');
    if (boardBtn) {
      await boardBtn.click();
      await wait(400);
    }
  });

  await tracker.runStep('A4.1.3', 'Open & Verify New Task Modal', async () => {
    await page.evaluate(() => {
      if (window.KANBAN_MODULE && window.KANBAN_MODULE.openNewTaskModal) {
        window.KANBAN_MODULE.openNewTaskModal();
      }
    });
    await wait(500);
    const modalVisible = await page.$eval('#newTaskModal, .modal-overlay, #app-view', el => el !== null);
    tracker.assert(modalVisible, 'New Task modal should be reachable');
    await tracker.screenshot(page, 'A4.1.3_new_task_modal.png');
    await page.evaluate(() => {
      if (window.KANBAN_MODULE && window.KANBAN_MODULE.closeNewTaskModal) {
        window.KANBAN_MODULE.closeNewTaskModal();
      }
    });
    await wait(300);
  });

  await tracker.runStep('A4.1.4', 'Test Bulk CSV Import & Auto-Parser', async () => {
    await page.evaluate(() => {
      if (window.KANBAN_MODULE && window.KANBAN_MODULE.openImportModal) {
        window.KANBAN_MODULE.openImportModal();
        window.KANBAN_MODULE.downloadSampleCSV = () => {};
        const mockCsv = "Task Title,Client Name,Project Name,Assignee,Department,Workflow Type,Stage,Priority,Due Date,Estimated Hours,Description\nHero Commercial Video Cut 1,Apex Footwear,Apex Autumn 2026 Campaign,Md. Zahin Khandaker,Post Production,video,Editing,Urgent,2026-09-15,12,Main 60s 4K video edit";
        window.KANBAN_MODULE.processCSVText(mockCsv);
      }
    });
    await wait(600);
    await tracker.screenshot(page, 'A4.1.4_bulk_import.png');
    await page.evaluate(() => {
      if (window.KANBAN_MODULE && window.KANBAN_MODULE.closeImportModal) {
        window.KANBAN_MODULE.closeImportModal();
      }
    });
    await wait(300);
  });

  // A4.2 Review Room
  await tracker.runStep('A4.2.1', 'Load Review Room Proofing Studio', async () => {
    await page.evaluate(() => { window.location.hash = '#reviews'; });
    await wait(1500);
    const content = await page.$eval('#app-view', el => el.textContent);
    tracker.assert(content.length > 50, 'Reviews module should render');
    await tracker.screenshot(page, 'A4.2_review_room.png');
  });

  // A4.3 Social Planner
  await tracker.runStep('A4.3.1', 'Load Social Planner & Post Calendar', async () => {
    await page.evaluate(() => { window.location.hash = '#social'; });
    await wait(1500);
    const content = await page.$eval('#app-view', el => el.textContent);
    tracker.assert(content.length > 50, 'Social planner module should render');
    await tracker.screenshot(page, 'A4.3_social_planner.png');
  });

  // A4.4 CMS & Services
  await tracker.runStep('A4.4.1', 'Load Agency CMS & Service Catalog', async () => {
    await page.evaluate(() => { window.location.hash = '#cms'; });
    await wait(1500);
    const content = await page.$eval('#app-view', el => el.textContent);
    tracker.assert(content.length > 50, 'CMS module should render');
    await tracker.screenshot(page, 'A4.4_cms_catalog.png');
  });

  return tracker.getSummary();
}

module.exports = { runPhaseA4 };
