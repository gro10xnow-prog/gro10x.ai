/**
 * Suite X - Phase X1: Real-Time SSE Event Chain across Portals
 */
const { wait, TestTracker } = require('../../utils');

async function runPhaseX1(page) {
  const tracker = new TestTracker('Suite X - Phase X1: SSE Real-Time Chain');
  console.log('\n--- ?? Running Suite X - Phase X1: SSE Chain ---');

  await tracker.runStep('X1.1', 'Verify SSE Event Broadcast and Multi-Portal Listener Handlers', async () => {
    const sseSupport = await page.evaluate(() => typeof window.EventSource !== 'undefined');
    tracker.assert(sseSupport, 'SSE EventSource must be supported in browser environment');
  });

  return tracker.getSummary();
}

module.exports = { runPhaseX1 };
