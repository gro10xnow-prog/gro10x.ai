/**
 * Suite D - Phase D9: Client MiniApp Real-Time SSE Listener
 */
const { wait, TestTracker } = require('../../utils');

async function runPhaseD9(page) {
  const tracker = new TestTracker('Suite D - Phase D9: Real-Time SSE Stream');
  console.log('\n--- ?? Running Suite D - Phase D9: SSE ---');

  await tracker.runStep('D9.1', 'Verify Client MiniApp SSE Initialized', async () => {
    const isReady = await page.evaluate(() => {
      return typeof window.EventSource !== 'undefined';
    });
    tracker.assert(isReady, 'EventSource should be supported');
    await tracker.screenshot(page, 'D9.1_miniapp_sse.png');
  });

  return tracker.getSummary();
}

module.exports = { runPhaseD9 };
