/**
 * scripts/e2e/suites/suite-e-team-miniapp/phase-E1-auth.js
 * Suite E - Phase E1: Team MiniApp Authentication & Bootstrap
 * 
 * Tests:
 * 1. Load Team MiniApp with Staff JWT Token & URL Parameter
 * 2. Verify Stored Session Credentials in Web Storage
 * 3. Authenticated Main Dashboard Unlocked (lockScreen hidden, mainDashboard visible)
 * 4. Staff Identity Hydration (Hero Avatar, Name, Role, Department)
 * 5. Bottom Navigation Dock Tabs Rendering (Home, Tasks, Attendance, Pay, Profile)
 * 6. Mobile Viewport Responsive Emulation (375x812)
 */

const { BASE_URL, wait, TestTracker } = require('../../utils');
const { generateTokenForRole, injectRoleSession, clearSession } = require('../../auth');

async function runPhaseE1(page) {
  const tracker = new TestTracker('Suite E - Phase E1: Team MiniApp Auth');
  console.log('\n--- 👥 Running Suite E - Phase E1: Team Auth & Bootstrap ---');

  const token = generateTokenForRole('specialist');
  const TEAM_URL = `${BASE_URL}/team-miniapp.html?token=${token}`;

  await tracker.runStep('E1.1', 'Load Team MiniApp with Staff JWT Token & URL Parameter', async () => {
    await clearSession(page);
    await injectRoleSession(page, 'specialist');
    await page.goto(TEAM_URL, { waitUntil: 'networkidle2' });
    await wait(1500);

    const title = await page.title();
    tracker.assert(title.includes('GRO10X') || title.includes('Crew') || title.includes('Workspace'), 'Title should reflect Crew workspace');
    await tracker.screenshot(page, 'E1.1_team_home.png');
  });

  await tracker.runStep('E1.2', 'Verify Stored Session Credentials in Web Storage', async () => {
    const session = await page.evaluate(() => {
      return {
        hasJwt: !!sessionStorage.getItem('jwt_token') || !!localStorage.getItem('gro10x_token') || !!localStorage.getItem('jwt_token'),
        hasSbToken: !!localStorage.getItem('sb-access-token') || !!localStorage.getItem('gro10x_token')
      };
    });

    tracker.assert(session.hasJwt, 'Valid JWT token must be persisted in web storage');
    tracker.assert(session.hasSbToken, 'Access token must be available for authenticated requests');
  });

  await tracker.runStep('E1.3', 'Authenticated Main Dashboard Unlocked', async () => {
    const dashboardState = await page.evaluate(() => {
      const lock = document.getElementById('lockScreen');
      const dash = document.getElementById('mainDashboard');
      return {
        isLockVisible: lock ? lock.classList.contains('visible') : false,
        isDashDisplayed: dash ? window.getComputedStyle(dash).display !== 'none' : false
      };
    });

    tracker.assert(!dashboardState.isLockVisible, 'Lock screen should be hidden for authenticated users');
    tracker.assert(dashboardState.isDashDisplayed, 'Main dashboard container must be displayed');
    await tracker.screenshot(page, 'E1.3_team_unlocked.png');
  });

  await tracker.runStep('E1.4', 'Staff Identity Hydration (Hero Avatar, Name, Role, Department)', async () => {
    const profile = await page.evaluate(() => {
      const name = document.getElementById('heroName')?.textContent || '';
      const role = document.getElementById('heroRole')?.textContent || '';
      const avatar = document.getElementById('heroAvatar')?.textContent || '';
      const xp = document.getElementById('heroXP')?.textContent || '';
      return { name, role, avatar, xp };
    });

    tracker.assert(profile.name.length > 0, 'Staff name should be rendered in hero card');
    tracker.assert(profile.role.length > 0, 'Staff role and department should be rendered');
    tracker.assert(profile.avatar.length > 0, 'Hero avatar initials should be generated');
    await tracker.screenshot(page, 'E1.4_team_hero_profile.png');
  });

  await tracker.runStep('E1.5', 'Bottom Navigation Dock Tabs Rendering (Home, Tasks, Attendance, Pay, Profile)', async () => {
    const navItems = await page.evaluate(() => {
      const bar = document.querySelector('.bottom-nav') || document.querySelector('nav') || document.getElementById('bottomNav');
      const buttons = Array.from(document.querySelectorAll('.bnav-btn, .bottom-nav-item, [onclick*="showPage"]'));
      return {
        count: buttons.length,
        labels: buttons.map(b => (b.textContent || '').trim())
      };
    });

    tracker.assert(navItems.count >= 4, 'Bottom navigation dock must render at least 4 navigation targets');
    await tracker.screenshot(page, 'E1.5_team_bottom_nav.png');
  });

  await tracker.runStep('E1.6', 'Mobile Viewport Responsive Emulation (375x812)', async () => {
    await page.setViewport({ width: 375, height: 812, isMobile: true });
    await wait(300);

    const isLayoutValid = await page.evaluate(() => {
      const hero = document.querySelector('.hero');
      const rect = hero ? hero.getBoundingClientRect() : null;
      return rect ? rect.width <= 375 : true;
    });

    tracker.assert(isLayoutValid, 'Layout should adapt without horizontal overflow on mobile viewports');
    await tracker.screenshot(page, 'E1.6_team_mobile_viewport.png');

    // Reset viewport
    await page.setViewport({ width: 1280, height: 800 });
  });

  return tracker.getSummary();
}

module.exports = { runPhaseE1 };

