/**
 * Suite B - Phase B1: Manager Portal Authentication & Role Gating
 */
const { BASE_URL, wait, TestTracker } = require('../../utils');
const { injectRoleSession, clearSession } = require('../../auth');

async function runPhaseB1(page) {
  const tracker = new TestTracker('Suite B - Phase B1: Manager Auth & Role Access');
  console.log('\n--- ?? Running Suite B - Phase B1: Manager Auth ---');

  const MANAGER_URL = `${BASE_URL}/manager.html`;

  await tracker.runStep('B1.1', 'Unauthenticated visitor redirects to /auth', async () => {
    await clearSession(page);
    await page.goto(MANAGER_URL, { waitUntil: 'domcontentloaded' });
    await wait(800);
    const url = page.url();
    tracker.assert(url.includes('/auth') || url.includes('expired'), 'Expected redirect to auth, got ' + url);
  });

  await tracker.runStep('B1.2', 'Inject Manager JWT Session and Load Portal', async () => {
    await injectRoleSession(page, 'manager');
    await page.goto(MANAGER_URL, { waitUntil: 'networkidle2' });
    await wait(1500);
    const url = page.url();
    tracker.assert(url.includes('/manager') || url.includes('manager.html'), 'Manager portal should load, got ' + url);
    await tracker.screenshot(page, 'B1.2_manager_loaded.png');
  });

  return tracker.getSummary();
}

module.exports = { runPhaseB1 };
