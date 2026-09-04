/**
 * scripts/e2e/suites/suite-d-client-miniapp/phase-D1-auth.js
 * Suite D - Phase D1: Client MiniApp Bootstrap & URL Token Auth
 * 
 * Tests:
 * 1. Load Client MiniApp with URL JWT Token
 * 2. Verify Stored Session Credentials in Web Storage
 * 3. Telegram WebApp SDK Mock Detection & Readiness
 * 4. Client Header Banner & Workspace Identity Hydration
 * 5. Bottom Navigation Bar Tabs Rendering
 * 6. Mobile Responsive Viewport Emulation (375x812)
 */

const { BASE_URL, wait, TestTracker } = require('../../utils');
const { generateTokenForRole, clearSession } = require('../../auth');

async function runPhaseD1(page) {
  const tracker = new TestTracker('Suite D - Phase D1: Client MiniApp Auth');
  console.log('\n--- 📱 Running Suite D - Phase D1: Client MiniApp Auth & Bootstrap ---');

  const token = generateTokenForRole('client');
  const MINIAPP_URL = `${BASE_URL}/client-miniapp.html?token=${token}`;

  await tracker.runStep('D1.1', 'Load Client MiniApp with URL JWT Token', async () => {
    await clearSession(page);
    await page.goto(MINIAPP_URL, { waitUntil: 'networkidle2' });
    await wait(1200);

    const title = await page.title();
    tracker.assert(title.includes('GRO10X') || title.includes('Client'), 'Page title must reflect GRO10X Client portal');
    await tracker.screenshot(page, 'D1.1_miniapp_boot.png');
  });

  await tracker.runStep('D1.2', 'Verify Stored Session Credentials in Web Storage', async () => {
    const authState = await page.evaluate(() => {
      const jwtSession = sessionStorage.getItem('jwt_token');
      const jwtLocal = localStorage.getItem('gro10x_token');
      return { hasSession: !!jwtSession, hasLocal: !!jwtLocal };
    });

    tracker.assert(authState.hasSession || authState.hasLocal, 'JWT token from URL must be persisted in storage');
  });

  await tracker.runStep('D1.3', 'Telegram WebApp SDK Mock Detection & Readiness', async () => {
    const tgReady = await page.evaluate(() => {
      return typeof window.triggerHaptic === 'function';
    });

    tracker.assert(tgReady, 'Telegram haptic and WebApp handler helper must exist');
  });

  await tracker.runStep('D1.4', 'Client Header Banner & Workspace Identity Hydration', async () => {
    const headerInfo = await page.evaluate(() => {
      const hero = document.querySelector('.hero');
      const title = document.getElementById('homeCampaignTitle');
      return { hasHero: hero !== null, hasTitle: title !== null };
    });

    tracker.assert(headerInfo.hasHero, 'Hero gradient header banner must render');
    tracker.assert(headerInfo.hasTitle, 'Campaign title placeholder must be rendered');
    await tracker.screenshot(page, 'D1.4_miniapp_header.png');
  });

  await tracker.runStep('D1.5', 'Bottom Navigation Bar Tabs Rendering', async () => {
    const navBar = await page.evaluate(() => {
      const nav = document.querySelector('.bottom-nav');
      const buttons = nav ? nav.querySelectorAll('.nav-btn') : [];
      return {
        hasNav: nav !== null,
        btnCount: buttons.length
      };
    });

    tracker.assert(navBar.hasNav, 'Bottom navigation container must be visible');
    tracker.assert(navBar.btnCount === 5, 'Bottom navigation must contain exactly 5 stakeholder tabs');
  });

  await tracker.runStep('D1.6', 'Mobile Responsive Viewport Emulation (375x812)', async () => {
    await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });
    await wait(400);

    const isLayoutValid = await page.evaluate(() => {
      const bodyWidth = document.body.getBoundingClientRect().width;
      const nav = document.querySelector('.bottom-nav');
      return bodyWidth <= 380 && nav !== null && getComputedStyle(nav).position === 'fixed';
    });

    tracker.assert(isLayoutValid, 'Mobile layout must adapt gracefully without overflow');
    await tracker.screenshot(page, 'D1.6_miniapp_mobile_viewport.png');

    // Reset viewport to desktop standard
    await page.setViewport({ width: 1280, height: 800 });
  });

  return tracker.getSummary();
}

module.exports = { runPhaseD1 };

