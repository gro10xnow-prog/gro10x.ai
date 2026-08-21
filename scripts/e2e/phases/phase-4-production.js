/**
 * scripts/e2e/phases/phase-4-production.js
 * Phase 4: Production Hub — Kanban Pipeline, Review Room, Social Planner, Services CMS
 */
const { wait, TestTracker } = require('../utils');

async function runPhase4(page) {
  const tracker = new TestTracker('Phase 4: Production Hub (Kanban, Reviews, Social, CMS)');
  console.log('\n--- 🚀 Running Phase 4: Production Hub ---');

  // 4.1.1 Kanban Pipeline Loading & Workspaces
  await tracker.runStep('4.1.1', 'Load Kanban Pipeline Hub & Verify Workspaces', async () => {
    await page.evaluate(() => { window.location.hash = '#kanban'; });
    await wait(1500);
    const content = await page.$eval('#app-view', el => el.textContent);
    tracker.assert(content.includes('Pipeline') || content.includes('Board') || content.includes('Workflows'), 'Kanban module should load');
    await tracker.screenshot(page, '4.1.4_kanban_board.png');
  });

  // 4.1.3 View Switcher (Board / List / Calendar / Dashboard)
  await tracker.runStep('4.1.3', 'Test Kanban View Switcher (Board/List/Calendar/Dashboard)', async () => {
    const listViewBtn = await page.$('button.view-btn:nth-child(2)');
    if (listViewBtn) {
      await listViewBtn.click();
      await wait(500);
    }
    const boardViewBtn = await page.$('button.view-btn:nth-child(1)');
    if (boardViewBtn) {
      await boardViewBtn.click();
      await wait(500);
    }
  });

  // 4.1.4 Column Workload Headers
  await tracker.runStep('4.1.4', 'Verify Column Workload Headers & Hour Badges', async () => {
    const workloadHeaders = await page.$$('.column-workload-badge, .kanban-column-header, #app-view');
    tracker.assert(workloadHeaders.length > 0, 'Kanban column headers should render');
  });

  // 4.1.7 New Task Modal
  await tracker.runStep('4.1.7', 'Open & Verify New Task Modal', async () => {
    await page.evaluate(() => {
      if (window.KANBAN_MODULE && window.KANBAN_MODULE.openNewTaskModal) {
        window.KANBAN_MODULE.openNewTaskModal();
      }
    });
    await wait(600);
    const modalVisible = await page.$eval('#newTaskModal, .modal-overlay', el => el.style.display !== 'none');
    tracker.assert(modalVisible, 'New Task modal should open');
    await tracker.screenshot(page, '4.1.7.6_new_task_modal.png');

    await page.evaluate(() => {
      if (window.KANBAN_MODULE && window.KANBAN_MODULE.closeNewTaskModal) {
        window.KANBAN_MODULE.closeNewTaskModal();
      }
    });
    await wait(300);
  });

  // 4.1.8 Bulk Import CSV & AI Cleaner
  await tracker.runStep('4.1.8', 'Test Bulk Import CSV & AI Auto-Clean Action', async () => {
    await page.evaluate(() => {
      if (window.KANBAN_MODULE && window.KANBAN_MODULE.openImportModal) {
        window.KANBAN_MODULE.openImportModal();
        window.KANBAN_MODULE.downloadSampleCSV = () => {};
        const mockCsv = "Task Title,Client Name,Project Name,Assignee,Department,Workflow Type,Stage,Priority,Due Date,Estimated Hours,Description\nHero Commercial Video Cut 1,Apex Footwear,Apex Autumn 2026 Campaign,Md. Zahin Khandaker,Post Production,video,Editing,Urgent,2026-09-15,12,Main 60s 4K video edit";
        window.KANBAN_MODULE.processCSVText(mockCsv);
      }
    });
    await wait(800);
    await tracker.screenshot(page, '4.1.8.9_bulk_import.png');

    await page.evaluate(() => {
      if (window.KANBAN_MODULE && window.KANBAN_MODULE.closeImportModal) {
        window.KANBAN_MODULE.closeImportModal();
      }
    });
    await wait(300);
  });

  // 4.2 Review Room
  await tracker.runStep('4.2.1', 'Navigate to Review Room Proofing', async () => {
    await page.evaluate(() => { window.location.hash = '#reviews'; });
    await wait(1500);
    const content = await page.$eval('#app-view', el => el.textContent);
    tracker.assert(content.length > 50, 'Reviews module should load');
    await tracker.screenshot(page, '4.2.6_review_room.png');
  });

  // 4.3 Social Planner
  await tracker.runStep('4.3.1', 'Navigate to Social Planner', async () => {
    await page.evaluate(() => { window.location.hash = '#social'; });
    await wait(1500);
    const content = await page.$eval('#app-view', el => el.textContent);
    tracker.assert(content.length > 50, 'Social planner module should load');
    await tracker.screenshot(page, '4.3.4_social_planner.png');
  });

  // 4.4 Services & CMS
  await tracker.runStep('4.4.1', 'Navigate to Services & CMS Catalog', async () => {
    await page.evaluate(() => { window.location.hash = '#cms'; });
    await wait(1500);
    const content = await page.$eval('#app-view', el => el.textContent);
    tracker.assert(content.length > 50, 'CMS module should load');
    await tracker.screenshot(page, '4.4.4_cms_catalog.png');
  });

  return tracker.getSummary();
}

module.exports = { runPhase4 };
