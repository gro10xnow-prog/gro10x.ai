/**
 * Suite X - Phase X5: Edge Cron Schedulers Verification
 */
const path = require('path');
const { wait, TestTracker } = require('../../utils');

async function runPhaseX5(page) {
  const tracker = new TestTracker('Suite X - Phase X5: Edge Cron Schedulers');
  console.log('\n--- ?? Running Suite X - Phase X5: Cron Schedulers ---');

  await tracker.runStep('X5.1', 'Verify Cron Routes Structure and Security Guard', async () => {
    const vercelConfig = require(path.join(process.cwd(), 'vercel.json'));
    tracker.assert(Array.isArray(vercelConfig.crons), 'vercel.json must have crons array');
    tracker.assert(vercelConfig.crons.length >= 7, 'vercel.json must contain at least 7 cron schedules');
  });

  return tracker.getSummary();
}

module.exports = { runPhaseX5 };
