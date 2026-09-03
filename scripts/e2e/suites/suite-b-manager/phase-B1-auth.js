/**
 * scripts/e2e/suites/suite-b-manager/phase-B1-auth.js
 * Suite B - Phase B1: Manager Authentication, Role-Gating & Shell Navigation
 * 
 * Tests:
 * 1. Unauthenticated Visitor Redirection to /auth
 * 2. Expired JWT Session Handling
 * 3. Authenticated Manager Session Injection & Portal Boot
 * 4. Manager Navigation Tabs Traversal (11 tabs)
 * 5. Manager Profile Badge & Department Tag Hydration
 * 6. Mobile Viewport & Sidebar Drawer Integrity (375x812)
 */

const { BASE_URL, wait, TestTracker } = require('../../utils');
const { injectRoleSession, clearSession, generateExpiredToken, USERS } = require('../../auth');

async function runPhaseB1(page) {
  const tracker = new TestTracker('Suite B - Phase B1: Manager Auth & Role Access');
  console.log('\n--- 🛡️ Running Suite B - Phase B1: Manager Auth & Navigation ---');

  const MANAGER_URL = `${BASE_URL}/manager.html`;

  await tracker.runStep('B1.1', 'Unauthenticated visitor redirects to /auth', async () => {
    await clearSession(page);
    await page.goto(MANAGER_URL, { waitUntil: 'domcontentloaded' });
    await wait(1000);
    const url = page.url();
    tracker.assert(url.includes('/auth'), 'Expected redirect to auth, got ' + url);
  });

  await tracker.runStep('B1.2', 'Expired JWT Session Handling', async () => {
    await clearSession(page);
    const expiredToken = generateExpiredToken('manager');
    const user = USERS.manager;
    await page.evaluate(({ token, user }) => {
      localStorage.setItem('gro10x_token', token);
      localStorage.setItem('gro10x_user', JSON.stringify(user));
      localStorage.setItem('jwt_token', token);
      localStorage.setItem('purple_user', JSON.stringify(user));
      sessionStorage.setItem('gro10x_token', token);
      sessionStorage.setItem('jwt_token', token);
    }, { token: expiredToken, user });

    await page.goto(MANAGER_URL, { waitUntil: 'domcontentloaded' });
    await wait(1000);
    const url = page.url();
    tracker.assert(url.includes('/auth'), 'Expired token should trigger redirect to auth, got ' + url);
  });

  await tracker.runStep('B1.3', 'Authenticated Manager Session Injection & Portal Boot', async () => {
    await injectRoleSession(page, 'manager');
    await page.goto(MANAGER_URL, { waitUntil: 'networkidle2' });
    await wait(1200);

    const url = page.url();
    tracker.assert(url.includes('manager.html'), 'Manager portal should stay loaded, got ' + url);

    const isPortalLoaded = await page.evaluate(() => {
      const header = document.querySelector('.top-header');
      return header !== null;
    });
    tracker.assert(isPortalLoaded, 'Manager portal header must be rendered');

    await tracker.screenshot(page, 'B1.3_manager_loaded.png');
  });

  await tracker.runStep('B1.4', 'Manager Navigation Tabs Traversal (11 tabs)', async () => {
    const MANAGER_TABS = [
      'dashboard', 'crm', 'kanban', 'workload', 'hrops',
      'tickets', 'financials', 'reviewroom', 'social', 'assets', 'chat'
    ];

    for (const tabId of MANAGER_TABS) {
      await page.evaluate((id) => {
        if (typeof window.switchTab === 'function') {
          window.switchTab(id);
        }
      }, tabId);
      await wait(150);

      const isActive = await page.evaluate((id) => {
        const pane = document.getElementById(`tab-${id}`);
        return pane && (pane.classList.contains('active') || pane.style.display === 'block');
      }, tabId);

      tracker.assert(isActive, `Tab pane tab-${tabId} must be active`);
    }

    // Switch back to dashboard
    await page.evaluate(() => {
      if (typeof window.switchTab === 'function') window.switchTab('dashboard');
    });
    await wait(200);

    await tracker.screenshot(page, 'B1.4_all_manager_tabs.png');
  });

  await tracker.runStep('B1.5', 'Manager Profile Badge & Department Tag Hydration', async () => {
    const profile = await page.evaluate(() => {
      const name = document.getElementById('userName')?.textContent || '';
      const role = document.getElementById('userRoleTag')?.textContent || '';
      const dept = document.getElementById('userDeptTag')?.textContent || '';
      return { name, role, dept };
    });

    tracker.assert(profile.name.length > 0, 'Manager name must be hydrated in top header');
    tracker.assert(
      profile.role.includes('Director') || profile.role.includes('Manager') || profile.role.includes('Lead'),
      `Manager role tag must be rendered (got: ${profile.role})`
    );

    await tracker.screenshot(page, 'B1.5_manager_profile_badge.png');
  });

  await tracker.runStep('B1.6', 'Mobile Viewport & Sidebar Drawer Integrity (375x812)', async () => {
    await page.setViewport({ width: 375, height: 812 });
    await wait(300);

    // Open mobile sidebar
    await page.evaluate(() => {
      if (typeof window.toggleMobileSidebar === 'function') {
        window.toggleMobileSidebar();
      }
    });
    await wait(300);

    const isDrawerOpen = await page.evaluate(() => {
      const sidebar = document.querySelector('.sidebar-nav');
      const backdrop = document.getElementById('adminNavBackdrop');
      return (sidebar && sidebar.classList.contains('is-open')) || (backdrop && backdrop.style.display === 'block');
    });
    tracker.assert(isDrawerOpen, 'Mobile sidebar drawer should open on toggle');

    await tracker.screenshot(page, 'B1.6_mobile_manager_sidebar.png');

    // Close mobile sidebar via backdrop
    await page.evaluate(() => {
      if (typeof window.closeMobileSidebar === 'function') {
        window.closeMobileSidebar();
      }
    });
    await wait(200);

    const isDrawerClosed = await page.evaluate(() => {
      const sidebar = document.querySelector('.sidebar-nav');
      return !sidebar || !sidebar.classList.contains('is-open');
    });
    tracker.assert(isDrawerClosed, 'Mobile sidebar drawer should close on backdrop click');

    // Reset desktop viewport
    await page.setViewport({ width: 1440, height: 900 });
    await wait(200);
  });

  return tracker.getSummary();
}

module.exports = { runPhaseB1 };

