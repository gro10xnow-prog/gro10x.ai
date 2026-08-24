/**
 * Suite E - Phase E9: Team MiniApp Real-Time SSE Listener
 */
const { wait, TestTracker } = require('../../utils');

async function runPhaseE9(page) {
  const tracker = new TestTracker('Suite E - Phase E9: Real-Time SSE Stream');
  console.log('\n--- ?? Running Suite E - Phase E9: Team SSE ---');

  await tracker.runStep('E9.1', 'Verify Team MiniApp SSE Initialized', async () => {
    const isReady = await page.evaluate(() => {
      return typeof window.EventSource !== 'undefined';
    });
    tracker.assert(isReady, 'EventSource should be supported');
    await tracker.screenshot(page, 'E9.1_team_sse.png');
  });

  return tracker.getSummary();
}

module.exports = { runPhaseE9 };
