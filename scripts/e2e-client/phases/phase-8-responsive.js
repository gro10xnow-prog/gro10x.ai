/**
 * scripts/e2e-client/phases/phase-8-responsive.js
 * Phase T8: Responsive Viewports & Visual Layout Checks
 */
const { CLIENT_SPA_URL, PARTNERS_URL, wait, TestTracker } = require('../utils');
const { injectClientSession } = require('../auth');

async function runPhase8(page) {
  const tracker = new TestTracker('Phase T8: Responsiveness & Viewports');
  console.log('\n--- 🚀 Running Phase T8: Responsive Viewport Checks ---');

  // T8.1 Desktop Viewport (1440x900)
  await tracker.runStep('T8.1.1', 'Verify Desktop Viewport (1440x900) Sidebar Layout', async () => {
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });
    await injectClientSession(page);
    await page.goto(CLIENT_SPA_URL + '#home', { waitUntil: 'networkidle2' });
    await wait(800);

    const isSidebarVisible = await page.$eval('.client-desktop-sidebar', el => {
      const style = window.getComputedStyle(el);
      return style.display !== 'none';
    });
    tracker.assert(isSidebarVisible, 'Desktop sidebar must be visible at 1440px width');
    await tracker.screenshot(page, 't8.1.1_desktop_1440.png');
  });

  // T8.2 Tablet Viewport (768x1024)
  await tracker.runStep('T8.2.1', 'Verify Tablet Viewport (768x1024) Responsive Collapse', async () => {
    await page.setViewport({ width: 768, height: 1024 });
    await page.reload({ waitUntil: 'networkidle2' });
    await wait(800);

    const isSidebarHidden = await page.$eval('.client-desktop-sidebar', el => {
      const style = window.getComputedStyle(el);
      return style.display === 'none';
    });
    tracker.assert(isSidebarHidden, 'Desktop sidebar should be hidden at 768px tablet width');

    const isBottomBarVisible = await page.$eval('.client-nav-bar', el => {
      const style = window.getComputedStyle(el);
      return style.display !== 'none';
    });
    tracker.assert(isBottomBarVisible, 'Mobile bottom bar must be visible at 768px tablet width');
    await tracker.screenshot(page, 't8.2.1_tablet_768.png');
  });

  // T8.3 Mobile Viewport (390x844)
  await tracker.runStep('T8.3.1', 'Verify Mobile Viewport (390x844) Touch Navigation', async () => {
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await page.reload({ waitUntil: 'networkidle2' });
    await wait(800);

    const bottomNavItems = await page.$$('.bottom-nav-item');
    tracker.assert(bottomNavItems.length >= 4, `Expected at least 4 bottom nav items, got ${bottomNavItems.length}`);
    await tracker.screenshot(page, 't8.3.1_mobile_390.png');
  });

  // Reset to desktop
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });

  return tracker.getSummary();
}

module.exports = { runPhase8 };
