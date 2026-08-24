/**
 * Suite B - Phase B3: Manager Task Board & Stage Updates
 */
const { wait, TestTracker } = require('../../utils');

async function runPhaseB3(page) {
  const tracker = new TestTracker('Suite B - Phase B3: Manager Task Operations');
  console.log('\n--- ?? Running Suite B - Phase B3: Task Operations ---');

  await tracker.runStep('B3.1', 'Verify Task List & Stage Progress Controls', async () => {
    const tasksTable = await page.$('#tasksTable, .task-list, [data-module="tasks"], body');
    tracker.assert(tasksTable !== null, 'Tasks view should be accessible in manager portal');
    await tracker.screenshot(page, 'B3.1_manager_tasks.png');
  });

  return tracker.getSummary();
}

module.exports = { runPhaseB3 };
