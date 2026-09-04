/**
 * scripts/e2e/suites/suite-c-partner/phase-C1-auth.js
 * Suite C - Phase C1: Partner Portal Authentication & Role Gating
 * 
 * Tests:
 * 1. Unauthenticated visitor redirects to /auth
 * 2. Expired JWT token handling
 * 3. Inject Partner JWT and Load Partners Portal
 * 4. Partner Header & Verified Client Workspace Badge Hydration
 * 5. Main Website Navigation & Sign Out Triggers
 * 6. Mobile Viewport Layout Verification (375x812)
 */

const { BASE_URL, wait, TestTracker } = require('../../utils');
const { injectRoleSession, clearSession, generateExpiredToken, USERS } = require('../../auth');

async function runPhaseC1(page) {
  const tracker = new TestTracker('Suite C - Phase C1: Partner Portal Auth');
  console.log('\n--- 🤝 Running Suite C - Phase C1: Partner Auth & Role Access ---');

  const PARTNERS_URL = `${BASE_URL}/partners.html`;

  await tracker.runStep('C1.1', 'Unauthenticated visitor redirects to /auth', async () => {
    await clearSession(page);
    await page.goto(PARTNERS_URL, { waitUntil: 'domcontentloaded' });
    await wait(1000);
    const url = page.url();
    tracker.assert(url.includes('/auth'), 'Expected redirect to auth, got ' + url);
  });

  await tracker.runStep('C1.2', 'Expired JWT Session Handling', async () => {
    await clearSession(page);
    const expiredToken = generateExpiredToken('partner');
    const user = USERS.partner;
    await page.evaluate(({ token, user }) => {
      localStorage.setItem('gro10x_token', token);
      localStorage.setItem('gro10x_user', JSON.stringify(user));
      localStorage.setItem('jwt_token', token);
      sessionStorage.setItem('gro10x_token', token);
    }, { token: expiredToken, user });

    await page.goto(PARTNERS_URL, { waitUntil: 'networkidle2' });
    await page.waitForFunction(() => window.location.href.includes('/auth'), { timeout: 5000 }).catch(() => {});
    await wait(500);

    const url = page.url();
    tracker.assert(url.includes('/auth'), 'Expired token should trigger redirect to auth, got ' + url);
  });

  await tracker.runStep('C1.3', 'Inject Partner JWT and Load Partners Portal', async () => {
    await injectRoleSession(page, 'partner');
    await page.goto(PARTNERS_URL, { waitUntil: 'networkidle2' });
    await wait(1500);

    const url = page.url();
    tracker.assert(url.includes('/partners'), 'Partner portal should load, got ' + url);
    await tracker.screenshot(page, 'C1.3_partner_loaded.png');
  });

  await tracker.runStep('C1.4', 'Partner Header & Verified Client Workspace Badge Hydration', async () => {
    const headerTitle = await page.evaluate(() => {
      const h1 = document.querySelector('header h1');
      const badge = document.getElementById('partnerHeaderName');
      return {
        title: h1 ? h1.textContent : '',
        badge: badge ? badge.textContent : ''
      };
    });

    tracker.assert(headerTitle.title.includes('PARTNER PORTAL') || headerTitle.title.includes('CLIENT'), 'Header title must indicate partner portal');
    tracker.assert(headerTitle.badge.includes('Workspace') || headerTitle.badge.includes('Client'), 'Partner badge must be visible');
  });

  await tracker.runStep('C1.5', 'Main Website Navigation & Sign Out Triggers', async () => {
    const hasButtons = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('header a, header button'));
      return links.some(el => el.textContent.includes('Main Website')) &&
             links.some(el => el.textContent.includes('Sign Out'));
    });
    tracker.assert(hasButtons, 'Header must have Main Website and Sign Out options');
  });

  await tracker.runStep('C1.6', 'Mobile Viewport Layout Verification (375x812)', async () => {
    await page.setViewport({ width: 375, height: 812 });
    await wait(400);

    const isHeaderRendered = await page.evaluate(() => {
      const header = document.querySelector('header');
      return header !== null && header.offsetHeight > 0;
    });
    tracker.assert(isHeaderRendered, 'Header must remain visible on mobile');

    await tracker.screenshot(page, 'C1.6_partner_mobile.png');

    await page.setViewport({ width: 1440, height: 900 });
    await wait(200);
  });

  return tracker.getSummary();
}

module.exports = { runPhaseC1 };
