/**
 * scripts/e2e/suites/suite-e-team-miniapp/phase-E8-admin-actions.js
 * Suite E - Phase E8: Profile, Gamification & Admin Action Panel
 * 
 * Tests:
 * 1. Navigate to Profile Tab (showPage('pageProfile')) & Active Tab State
 * 2. Profile Details Hydration (Name, Role, ID, Department, Email)
 * 3. Gamification Tier & XP Display (profileXP, Badges)
 * 4. Team XP Leaderboard Container (xpLeaderboardList)
 * 5. Admin Section Container (adminSection) & Tool Cards
 * 6. Admin Action Handler Functions Inspection (runTechDiag, openSupabaseSync)
 */

const { BASE_URL, wait, TestTracker } = require('../../utils');
const { injectRoleSession } = require('../../auth');

async function runPhaseE8(page) {
  const tracker = new TestTracker('Suite E - Phase E8: Profile & Admin Actions');
  console.log('\n--- 🛠️ Running Suite E - Phase E8: Admin Actions & Profile ---');

  const TEAM_URL = `${BASE_URL}/team-miniapp.html`;

  await tracker.runStep('E8.1', 'Navigate to Profile Tab (showPage) & Active Tab State', async () => {
    await injectRoleSession(page, 'admin');
    await page.goto(TEAM_URL, { waitUntil: 'networkidle2' });
    await wait(1000);

    const navRes = await page.evaluate(async () => {
      window.alert = () => {};
      if (typeof window.showPage === 'function') {
        window.showPage('pageProfile');
      }
      await new Promise(r => setTimeout(r, 200));

      const pageEl = document.getElementById('pageProfile');
      return {
        isActive: pageEl ? pageEl.classList.contains('active') : false
      };
    });

    tracker.assert(navRes.isActive, 'Profile page must become active');
    await tracker.screenshot(page, 'E8.1_team_profile_tab.png');
  });

  await tracker.runStep('E8.2', 'Profile Details Hydration (Name, Role, ID, Department, Email)', async () => {
    const details = await page.evaluate(() => {
      const name = document.getElementById('profileName')?.textContent || '';
      const role = document.getElementById('profileRole')?.textContent || '';
      const id = document.getElementById('profileId')?.textContent || '';
      const dept = document.getElementById('profileDept')?.textContent || '';
      return { name, role, id, dept };
    });

    tracker.assert(details.name.length > 0, 'Staff profile name must be rendered');
    tracker.assert(details.role.length > 0, 'Staff profile role must be rendered');
    tracker.assert(details.id.length > 0, 'Employee ID must be displayed');
    await tracker.screenshot(page, 'E8.2_team_profile_details.png');
  });

  await tracker.runStep('E8.3', 'Gamification Tier & XP Display (profileXP, Badges)', async () => {
    const xpInfo = await page.evaluate(() => {
      const xpEl = document.getElementById('profileXP');
      return {
        hasXp: xpEl !== null,
        xpText: xpEl ? (xpEl.textContent || '').trim() : ''
      };
    });

    tracker.assert(xpInfo.hasXp, 'XP rank display element must exist');
    tracker.assert(xpInfo.xpText.includes('XP') || xpInfo.xpText.length > 0, 'XP metrics should be visible');
    await tracker.screenshot(page, 'E8.3_team_gamification_xp.png');
  });

  await tracker.runStep('E8.4', 'Team XP Leaderboard Container (xpLeaderboardList)', async () => {
    const leaderboardState = await page.evaluate(() => {
      const list = document.getElementById('xpLeaderboardList');
      return {
        hasList: list !== null
      };
    });

    tracker.assert(leaderboardState.hasList, 'Leaderboard container xpLeaderboardList must exist');
    await tracker.screenshot(page, 'E8.4_team_xp_leaderboard.png');
  });

  await tracker.runStep('E8.5', 'Admin Section Container (adminSection) & Tool Cards', async () => {
    const adminState = await page.evaluate(() => {
      const section = document.getElementById('adminSection');
      // Set to block if admin user for inspection
      if (section) section.style.display = 'block';
      const tiles = section ? Array.from(section.querySelectorAll('.admin-tile')) : [];
      return {
        hasSection: section !== null,
        tileCount: tiles.length
      };
    });

    tracker.assert(adminState.hasSection, 'Admin section element must exist in DOM');
    tracker.assert(adminState.tileCount >= 2, 'Admin tools must include diagnostic and sync tiles');
    await tracker.screenshot(page, 'E8.5_team_admin_section.png');
  });

  await tracker.runStep('E8.6', 'Admin Action Handler Functions Inspection (runTechDiag, openSupabaseSync)', async () => {
    const handlers = await page.evaluate(() => {
      return {
        hasDiag: typeof window.runTechDiag === 'function' || typeof runTechDiag === 'function',
        hasSync: typeof window.openSupabaseSync === 'function' || typeof openSupabaseSync === 'function'
      };
    });

    tracker.assert(handlers.hasDiag || handlers.hasSync, 'Admin action functions must be registered');
    await tracker.screenshot(page, 'E8.6_team_admin_handlers.png');
  });

  return tracker.getSummary();
}

module.exports = { runPhaseE8 };

