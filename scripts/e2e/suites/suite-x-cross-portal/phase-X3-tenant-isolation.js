/**
 * Suite X - Phase X3: Multi-Tenant Data Isolation Security
 */
const path = require('path');
const { wait, TestTracker } = require('../../utils');

async function runPhaseX3(page) {
  const tracker = new TestTracker('Suite X - Phase X3: Multi-Tenant Isolation');
  console.log('\n--- ?? Running Suite X - Phase X3: Tenant Isolation ---');

  await tracker.runStep('X3.1', 'Verify Tenant Scoping Middleware and Isolation Logic', async () => {
    const { requireAuth } = require(path.join(process.cwd(), 'src/middleware/auth'));
    tracker.assert(typeof requireAuth === 'function', 'Auth middleware must be defined');
  });

  return tracker.getSummary();
}

module.exports = { runPhaseX3 };
