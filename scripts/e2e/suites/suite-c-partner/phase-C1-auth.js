/**
 * Suite C - Phase C1: Partner Portal Authentication
 */
const { BASE_URL, wait, TestTracker } = require('../../utils');
const { injectRoleSession, clearSession } = require('../../auth');

async function runPhaseC1(page) {
  const tracker = new TestTracker('Suite C - Phase C1: Partner Portal Auth');
  console.log('\n--- ?? Running Suite C - Phase C1: Partner Auth ---');

  const PARTNERS_URL = `${BASE_URL}/partners.html`;

  await tracker.runStep('C1.1', 'Unauthenticated visitor redirects to /auth', async () => {
    await clearSession(page);
    await page.goto(PARTNERS_URL, { waitUntil: 'domcontentloaded' });
    await wait(800);
    const url = page.url();
    tracker.assert(url.includes('/auth'), 'Expected redirect to auth, got ' + url);
  });

  await tracker.runStep('C1.2', 'Inject Partner JWT and Load Partners Portal', async () => {
    await injectRoleSession(page, 'partner');
    await page.goto(PARTNERS_URL, { waitUntil: 'networkidle2' });
    await wait(1500);
    const url = page.url();
    tracker.assert(url.includes('/partners'), 'Partner portal should load, got ' + url);
    await tracker.screenshot(page, 'C1.2_partner_loaded.png');
  });

  return tracker.getSummary();
}

module.exports = { runPhaseC1 };
