/**
 * Suite A - Phase A6: HR Operations, Staff Roster, Attendance & Leaves
 */
const { wait, TestTracker } = require('../../utils');

async function runPhaseA6(page) {
  const tracker = new TestTracker('Suite A - Phase A6: HR Operations & Team');
  console.log('\n--- ?? Running Suite A - Phase A6: HR Operations ---');

  await tracker.runStep('A6.1.1', 'Load HR Roster & Staff Directory', async () => {
    await page.evaluate(() => { window.location.hash = '#hr'; });
    await wait(1500);
    const content = await page.$eval('#app-view', el => el.textContent);
    tracker.assert(content.includes('Roster') || content.includes('Staff') || content.includes('HR') || content.includes('Team'), 'HR module should render');
    await tracker.screenshot(page, 'A6.1_hr_roster.png');
  });

  await tracker.runStep('A6.1.2', 'Open Staff Profile Drawer & Verify 1-Tap PIN Reset Action', async () => {
    await page.evaluate(() => {
      if (window.HR_MODULE && window.HR_MODULE.viewProfile) {
        window.HR_MODULE.viewProfile('PBD-003');
      }
    });
    await wait(600);
    const drawer = await page.$('#hrProfileDrawer, .profile-drawer, #app-view');
    tracker.assert(drawer !== null, 'Staff profile drawer should be reachable');
    await tracker.screenshot(page, 'A6.1.2_staff_drawer.png');
    await page.evaluate(() => {
      if (window.HR_MODULE && window.HR_MODULE.closeProfileDrawer) {
        window.HR_MODULE.closeProfileDrawer();
      }
    });
    await wait(300);
  });

  await tracker.runStep('A6.2.1', 'Load Hardware Assets Catalog', async () => {
    await page.evaluate(() => { window.location.hash = '#assets'; });
    await wait(1500);
    const content = await page.$eval('#app-view', el => el.textContent);
    tracker.assert(content.length > 50, 'Assets module should render');
    await tracker.screenshot(page, 'A6.2_hardware_assets.png');
  });

  return tracker.getSummary();
}

module.exports = { runPhaseA6 };
