/**
 * scripts/e2e/phases/phase-6-hr.js
 * Phase 6: HR, Payroll & Hardware Assets
 */
const { wait, TestTracker } = require('../utils');

async function runPhase6(page) {
  const tracker = new TestTracker('Phase 6: HR Ops & Hardware Assets');
  console.log('\n--- 🚀 Running Phase 6: HR Ops & Hardware Assets ---');

  // 6.1 HR Roster Loading
  await tracker.runStep('6.1.2', 'Load HR Roster & Verify Staff Directory', async () => {
    await page.evaluate(() => { window.location.hash = '#hr'; });
    await wait(1500);
    const content = await page.$eval('#app-view', el => el.textContent);
    tracker.assert(content.includes('Roster') || content.includes('Staff') || content.includes('HR'), 'HR module should load');
    await tracker.screenshot(page, '6.1.2.5_hr_roster.png');
  });

  // 6.1.3 Staff Profile Drawer & PIN Reset Button
  await tracker.runStep('6.1.3', 'Open Staff Profile Drawer & Verify 1-Tap PIN Reset Action', async () => {
    await page.evaluate(() => {
      if (window.HR_MODULE && window.HR_MODULE.viewProfile) {
        window.HR_MODULE.viewProfile('PBD-003');
      }
    });
    await wait(800);
    const drawerOpen = await page.$eval('#staffProfileDrawer, .profile-drawer, .modal-overlay', el => el.style.display !== 'none' || el.classList.contains('open'));
    tracker.assert(drawerOpen, 'Staff profile drawer should open');

    const drawerText = await page.$eval('#staffProfileDrawer, .profile-drawer, #app-view', el => el.textContent);
    tracker.assert(drawerText.includes('PBD-003') || drawerText.includes('Jayed'), 'Profile should display correct staff details');
    tracker.assert(drawerText.includes('Reset 6-Digit PIN'), 'Profile should display Reset 6-Digit PIN action');
    await tracker.screenshot(page, '6.1.3.7_staff_profile_drawer.png');

    // Close drawer
    await page.evaluate(() => {
      if (window.HR_MODULE && window.HR_MODULE.closeProfileDrawer) {
        window.HR_MODULE.closeProfileDrawer();
      }
    });
    await wait(300);
  });

  // 6.2 Hardware Assets
  await tracker.runStep('6.2.1', 'Load Hardware Assets Catalog', async () => {
    await page.evaluate(() => { window.location.hash = '#assets'; });
    await wait(1500);
    const content = await page.$eval('#app-view', el => el.textContent);
    tracker.assert(content.length > 50, 'Assets module should load');
    await tracker.screenshot(page, '6.2.5_hardware_assets.png');
  });

  return tracker.getSummary();
}

module.exports = { runPhase6 };
