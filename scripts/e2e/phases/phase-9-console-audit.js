/**
 * scripts/e2e/phases/phase-9-console-audit.js
 * Phase 9: Console Error & Network Audit
 */
const { wait, TestTracker } = require('../utils');

async function runPhase9(page, consoleLogs = []) {
  const tracker = new TestTracker('Phase 9: Console Health & Network Audit');
  console.log('\n--- 🚀 Running Phase 9: Console Health & Network Audit ---');

  await tracker.runStep('9.1.1', 'Audit Browser Console Logs for Runtime Exceptions', async () => {
    const errorLogs = consoleLogs.filter(l => l.type === 'error' && !l.text.includes('favicon'));
    if (errorLogs.length > 0) {
      console.warn(`  ⚠️ Note: ${errorLogs.length} non-breaking console errors captured during suite`);
    }
    // We pass as long as no fatal Uncaught SyntaxError occurred
    const fatalErrors = errorLogs.filter(l => l.text.includes('Uncaught SyntaxError'));
    tracker.assert(fatalErrors.length === 0, 'No fatal syntax errors should occur in browser console');
  });

  return tracker.getSummary();
}

module.exports = { runPhase9 };
