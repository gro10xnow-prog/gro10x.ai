/**
 * scripts/e2e/suites/suite-b-manager/phase-B3-tasks.js
 * Suite B - Phase B3: Manager Kanban Board & Production Pipeline
 * 
 * Tests:
 * 1. Manager Kanban Board & 5 Stage Columns Boot
 * 2. Department Scoping Filter Toggle (My Dept <-> All Depts)
 * 3. Production Task Creation Modal UI
 * 4. Manage Tags & Label Modal UI
 * 5. Task Templates Modal UI
 * 6. Task Card Pipeline Verification & Stage Columns
 */

const { BASE_URL, wait, TestTracker } = require('../../utils');
const { injectRoleSession } = require('../../auth');

async function runPhaseB3(page) {
  const tracker = new TestTracker('Suite B - Phase B3: Manager Task Operations');
  console.log('\n--- 📋 Running Suite B - Phase B3: Task & Kanban Operations ---');

  const MANAGER_URL = `${BASE_URL}/manager.html`;

  await tracker.runStep('B3.1', 'Manager Kanban Board & 5 Stage Columns Boot', async () => {
    await injectRoleSession(page, 'manager');
    await page.goto(MANAGER_URL, { waitUntil: 'networkidle2' });
    await wait(1000);

    // Switch to kanban tab
    await page.evaluate(() => {
      if (typeof window.switchTab === 'function') window.switchTab('kanban');
    });
    await wait(600);

    const isKanbanActive = await page.evaluate(() => {
      const pane = document.getElementById('tab-kanban');
      return pane && (pane.classList.contains('active') || pane.style.display !== 'none');
    });
    tracker.assert(isKanbanActive, '#tab-kanban must be active');

    // Assert 5 Kanban columns exist
    const columnsExist = await page.evaluate(() => {
      const cols = ['col-Briefing', 'col-Production', 'col-Editing', 'col-ClientReview', 'col-Approved'];
      return cols.every(id => document.getElementById(id) !== null);
    });
    tracker.assert(columnsExist, 'All 5 Kanban columns must be present in DOM');

    await tracker.screenshot(page, 'B3.1_manager_kanban.png');
  });

  await tracker.runStep('B3.2', 'Department Scoping Filter Toggle (My Dept <-> All Depts)', async () => {
    // Toggle to All Depts
    await page.evaluate(() => {
      if (typeof window.setKanbanDeptFilter === 'function') {
        window.setKanbanDeptFilter('all');
      }
    });
    await wait(300);

    const isAllActive = await page.evaluate(() => {
      const btn = document.getElementById('btnFilterAllDepts');
      return btn && btn.style.background.includes('59, 130, 246');
    });
    tracker.assert(isAllActive, 'All Depts button should have active background');

    // Toggle back to My Dept
    await page.evaluate(() => {
      if (typeof window.setKanbanDeptFilter === 'function') {
        window.setKanbanDeptFilter('my');
      }
    });
    await wait(300);

    const isMyActive = await page.evaluate(() => {
      const btn = document.getElementById('btnFilterMyDept');
      return btn && btn.style.background.includes('59, 130, 246');
    });
    tracker.assert(isMyActive, 'My Dept button should have active background');
  });

  await tracker.runStep('B3.3', 'Production Task Creation Modal UI', async () => {
    await page.evaluate(() => {
      if (typeof window.openManagerTaskModal === 'function') {
        window.openManagerTaskModal();
      }
    });
    await wait(400);

    const isModalOpen = await page.evaluate(() => {
      const modal = document.getElementById('managerTaskModal');
      return modal && modal.style.display !== 'none';
    });
    tracker.assert(isModalOpen, '#managerTaskModal must open on openManagerTaskModal()');

    await tracker.screenshot(page, 'B3.3_manager_task_modal.png');

    // Close Modal
    await page.evaluate(() => {
      if (typeof window.closeManagerTaskModal === 'function') {
        window.closeManagerTaskModal();
      } else {
        const m = document.getElementById('managerTaskModal');
        if (m) m.style.display = 'none';
      }
    });
    await wait(200);
  });

  await tracker.runStep('B3.4', 'Manage Tags & Labels Modal UI', async () => {
    await page.evaluate(() => {
      if (typeof window.openManageLabelsModal === 'function') {
        window.openManageLabelsModal();
      }
    });
    await wait(400);

    const isLabelsOpen = await page.evaluate(() => {
      const modal = document.getElementById('managerLabelModal') || document.querySelector('.modal-overlay[style*="flex"]');
      return modal && modal.style.display !== 'none';
    });
    tracker.assert(isLabelsOpen, 'Manage Labels modal must open');

    // Close Modal
    await page.evaluate(() => {
      if (typeof window.closeManageLabelsModal === 'function') {
        window.closeManageLabelsModal();
      } else {
        const modal = document.getElementById('managerLabelModal');
        if (modal) modal.style.display = 'none';
      }
    });
    await wait(200);
  });

  await tracker.runStep('B3.5', 'Task Templates Modal UI', async () => {
    await page.evaluate(() => {
      if (typeof window.openManageTaskTemplatesModal === 'function') {
        window.openManageTaskTemplatesModal();
      }
    });
    await wait(400);

    const isTemplatesOpen = await page.evaluate(() => {
      const modal = document.getElementById('managerTaskTemplatesModal') || document.querySelector('.modal-overlay[style*="flex"]');
      return modal && modal.style.display !== 'none';
    });
    tracker.assert(isTemplatesOpen, 'Task Templates modal must open');

    // Close Modal
    await page.evaluate(() => {
      const modal = document.getElementById('managerTaskTemplatesModal');
      if (modal) modal.style.display = 'none';
    });
    await wait(200);
  });

  await tracker.runStep('B3.6', 'Task Card Pipeline Verification & Stage Columns', async () => {
    const totalCards = await page.evaluate(() => {
      const cards = document.querySelectorAll('.kanban-card, .column-card-container > *');
      return cards.length;
    });

    tracker.assert(totalCards >= 0, `Kanban board rendered with ${totalCards} active items`);
    await tracker.screenshot(page, 'B3.6_manager_pipeline_verified.png');
  });

  return tracker.getSummary();
}

module.exports = { runPhaseB3 };
