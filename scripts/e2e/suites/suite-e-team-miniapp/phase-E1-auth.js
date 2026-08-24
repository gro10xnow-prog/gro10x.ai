/**
 * Suite E - Phase E1: Team MiniApp Authentication
 */
const { BASE_URL, wait, TestTracker } = require('../../utils');
const { generateTokenForRole, clearSession } = require('../../auth');

async function runPhaseE1(page) {
  const tracker = new TestTracker('Suite E - Phase E1: Team MiniApp Auth');
  console.log('\n--- ?? Running Suite E - Phase E1: Team Auth ---');

  const token = generateTokenForRole('specialist');
  const TEAM_URL = `${BASE_URL}/team-miniapp.html?token=${token}`;

  await tracker.runStep('E1.1', 'Load Team MiniApp with Staff JWT Token', async () => {
    await clearSession(page);
    await page.goto(TEAM_URL, { waitUntil: 'networkidle2' });
    await wait(1500);
    const content = await page.$eval('body', el => el.textContent);
    tracker.assert(content.length > 50, 'Team MiniApp should load successfully');
    await tracker.screenshot(page, 'E1.1_team_home.png');
  });

  return tracker.getSummary();
}

module.exports = { runPhaseE1 };
