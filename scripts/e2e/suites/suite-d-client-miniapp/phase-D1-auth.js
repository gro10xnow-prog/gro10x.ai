/**
 * Suite D - Phase D1: Client MiniApp Bootstrap & URL Token Auth
 */
const { BASE_URL, wait, TestTracker } = require('../../utils');
const { generateTokenForRole, clearSession } = require('../../auth');

async function runPhaseD1(page) {
  const tracker = new TestTracker('Suite D - Phase D1: Client MiniApp Auth');
  console.log('\n--- ?? Running Suite D - Phase D1: Client MiniApp Auth ---');

  const token = generateTokenForRole('client');
  const MINIAPP_URL = `${BASE_URL}/client-miniapp.html?token=${token}`;

  await tracker.runStep('D1.1', 'Load Client MiniApp with URL JWT Token', async () => {
    await clearSession(page);
    await page.goto(MINIAPP_URL, { waitUntil: 'networkidle2' });
    await wait(1500);
    const content = await page.$eval('body', el => el.textContent);
    tracker.assert(content.length > 50, 'Client MiniApp should load successfully');
    await tracker.screenshot(page, 'D1.1_miniapp_home.png');
  });

  return tracker.getSummary();
}

module.exports = { runPhaseD1 };
