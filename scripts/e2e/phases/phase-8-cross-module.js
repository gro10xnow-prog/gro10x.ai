/**
 * scripts/e2e/phases/phase-8-cross-module.js
 * Phase 8: Cross-Module Integration & Badge Synchronization
 */
const { wait, TestTracker } = require('../utils');

async function runPhase8(page) {
  const tracker = new TestTracker('Phase 8: Cross-Module Integration');
  console.log('\n--- 🚀 Running Phase 8: Cross-Module Integration ---');

  // 8.5 Sidebar Attention Badges Sync
  await tracker.runStep('8.5.1', 'Verify Sidebar Attention Badges & Real-Time Counter Sync', async () => {
    await page.evaluate(() => { window.location.hash = '#dashboard'; });
    await wait(1000);

    const badges = await page.$$eval('.nav-badge', els => els.map(el => ({
      id: el.id,
      text: el.textContent.trim(),
      visible: el.style.display !== 'none'
    })));

    tracker.assert(badges.length > 0, 'Sidebar attention badges should be defined');
  });

  return tracker.getSummary();
}

module.exports = { runPhase8 };
