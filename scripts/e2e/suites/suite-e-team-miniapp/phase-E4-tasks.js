/**
 * scripts/e2e/suites/suite-e-team-miniapp/phase-E4-tasks.js
 * Suite E - Phase E4: Tasks Management & Kanban
 * 
 * Tests:
 * 1. Navigate to Tasks Tab (showPage('pageTasks')) & Active Tab State
 * 2. Tasks Filter Pills Navigation (All, Urgent, Due Today, Overdue, Mine Only)
 * 3. Tasks Container & Dynamic List Hydration (userTaskList)
 * 4. Open New Task Creation Modal (openCreateTaskModal) & Form Structure
 * 5. Populate Task Fields (Title, Client, Workflow, Priority, Stage)
 * 6. Close Task Creation Modal Teardown Flow (closeCreateTaskModal)
 */

const { BASE_URL, wait, TestTracker } = require('../../utils');
const { injectRoleSession } = require('../../auth');

async function runPhaseE4(page) {
  const tracker = new TestTracker('Suite E - Phase E4: Tasks Management');
  console.log('\n--- 📋 Running Suite E - Phase E4: Tasks & Kanban ---');

  const TEAM_URL = `${BASE_URL}/team-miniapp.html`;

  await tracker.runStep('E4.1', 'Navigate to Tasks Tab (showPage) & Active Tab State', async () => {
    await injectRoleSession(page, 'specialist');
    await page.goto(TEAM_URL, { waitUntil: 'networkidle2' });
    await wait(1000);

    const navRes = await page.evaluate(async () => {
      window.alert = () => {};
      if (typeof window.showPage === 'function') {
        window.showPage('pageTasks');
      }
      await new Promise(r => setTimeout(r, 200));

      const pageEl = document.getElementById('pageTasks');
      return {
        isActive: pageEl ? pageEl.classList.contains('active') : false
      };
    });

    tracker.assert(navRes.isActive, 'Tasks page container must be active');
    await tracker.screenshot(page, 'E4.1_team_tasks_page.png');
  });

  await tracker.runStep('E4.2', 'Tasks Filter Pills Navigation (All, Urgent, Due Today, Overdue, Mine Only)', async () => {
    const filterInfo = await page.evaluate(() => {
      const container = document.getElementById('taskFilterPills');
      const pills = container ? Array.from(container.querySelectorAll('.fpill')) : [];
      return {
        hasContainer: container !== null,
        count: pills.length,
        labels: pills.map(p => (p.textContent || '').trim())
      };
    });

    tracker.assert(filterInfo.hasContainer, 'Task filter pills bar must be rendered');
    tracker.assert(filterInfo.count >= 4, 'At least 4 filter pills should be available');
    await tracker.screenshot(page, 'E4.2_team_task_filters.png');
  });

  await tracker.runStep('E4.3', 'Tasks Container & Dynamic List Hydration (userTaskList)', async () => {
    const listState = await page.evaluate(() => {
      const list = document.getElementById('userTaskList');
      return {
        hasList: list !== null,
        text: list ? (list.textContent || '').trim() : ''
      };
    });

    tracker.assert(listState.hasList, 'Task list container userTaskList must exist');
    await tracker.screenshot(page, 'E4.3_team_task_list.png');
  });

  await tracker.runStep('E4.4', 'Open New Task Creation Modal (openCreateTaskModal) & Form Structure', async () => {
    const modalState = await page.evaluate(async () => {
      if (typeof window.openCreateTaskModal === 'function') {
        window.openCreateTaskModal();
      }
      await new Promise(r => setTimeout(r, 200));

      const modal = document.getElementById('createTaskModal');
      const title = document.getElementById('newTaskTitle');
      const client = document.getElementById('newTaskClient');
      const workflow = document.getElementById('newTaskWorkflow');
      const stage = document.getElementById('newTaskStage');

      return {
        isModalVisible: modal ? window.getComputedStyle(modal).display !== 'none' : false,
        hasTitle: title !== null,
        hasClient: client !== null,
        hasWorkflow: workflow !== null,
        hasStage: stage !== null
      };
    });

    tracker.assert(modalState.isModalVisible, 'Create task modal must open on trigger');
    tracker.assert(modalState.hasTitle && modalState.hasClient, 'Task title and client fields must exist');
    tracker.assert(modalState.hasWorkflow && modalState.hasStage, 'Workflow and stage selectors must exist');
    await tracker.screenshot(page, 'E4.4_team_create_task_modal.png');
  });

  await tracker.runStep('E4.5', 'Populate Task Fields (Title, Client, Workflow, Priority, Stage)', async () => {
    const popResult = await page.evaluate(() => {
      const title = document.getElementById('newTaskTitle');
      const client = document.getElementById('newTaskClient');
      const stage = document.getElementById('newTaskStage');
      const prio = document.getElementById('newTaskPriority');

      if (title) title.value = 'Apex Ramadan Video Master Cut';
      if (client) client.value = 'Apex Footwear Ltd';
      if (stage) stage.value = 'Editing';
      if (prio) prio.value = 'High';

      return {
        titleVal: title ? title.value : '',
        clientVal: client ? client.value : '',
        stageVal: stage ? stage.value : ''
      };
    });

    tracker.assert(popResult.titleVal.includes('Apex'), 'Task title should be populated');
    tracker.assert(popResult.stageVal === 'Editing', 'Stage selector should reflect Editing');
    await tracker.screenshot(page, 'E4.5_team_task_populated.png');
  });

  await tracker.runStep('E4.6', 'Close Task Creation Modal Teardown Flow (closeCreateTaskModal)', async () => {
    const closeResult = await page.evaluate(async () => {
      if (typeof window.closeCreateTaskModal === 'function') {
        window.closeCreateTaskModal();
      }
      await new Promise(r => setTimeout(r, 200));

      const modal = document.getElementById('createTaskModal');
      return {
        isClosed: modal ? window.getComputedStyle(modal).display === 'none' : true
      };
    });

    tracker.assert(closeResult.isClosed, 'Task modal must be hidden after close');
    await tracker.screenshot(page, 'E4.6_team_task_modal_closed.png');
  });

  return tracker.getSummary();
}

module.exports = { runPhaseE4 };

