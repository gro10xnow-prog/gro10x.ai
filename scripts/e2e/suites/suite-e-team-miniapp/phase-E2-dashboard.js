/**
 * scripts/e2e/suites/suite-e-team-miniapp/phase-E2-dashboard.js
 * Suite E - Phase E2: Team MiniApp Home & Shift Status
 * 
 * Tests:
 * 1. Staff Shift Status Pill & Visual Feedback on Hero Card
 * 2. Quick Actions Grid Rendering & Action Button Callbacks
 * 3. Studio Status Snapshot Tiles Rendering (In Studio, On Shoot, On Leave, Offline)
 * 4. Monthly Performance Card Metrics (statTasksDone, statDaysPresent, statEODCount)
 * 5. Interactive Page Transition to Tasks Workspace (showPage('pageTasks'))
 * 6. Seamless Return to Home Dashboard (showPage('pageHome'))
 */

const { BASE_URL, wait, TestTracker } = require('../../utils');
const { injectRoleSession } = require('../../auth');

async function runPhaseE2(page) {
  const tracker = new TestTracker('Suite E - Phase E2: Staff Shift Status & Dashboard');
  console.log('\n--- 🏠 Running Suite E - Phase E2: Shift Status & Dashboard ---');

  await tracker.runStep('E2.1', 'Staff Shift Status Pill & Visual Feedback on Hero Card', async () => {
    const token = await injectRoleSession(page, 'specialist');
    const targetUrl = `${BASE_URL}/team-miniapp.html?token=${token}`;
    await page.goto(targetUrl, { waitUntil: 'networkidle2' });
    await wait(1200);

    const pillInfo = await page.evaluate(() => {
      const pill = document.getElementById('heroStatus') || document.getElementById('statusPill');
      return {
        hasPill: pill !== null,
        text: pill ? (pill.textContent || '').trim() : '',
        className: pill ? pill.className : ''
      };
    });

    tracker.assert(pillInfo.hasPill, 'Hero status pill element must exist');
    tracker.assert(pillInfo.text.length > 0, 'Status pill should display active status text');
    await tracker.screenshot(page, 'E2.1_team_status_pill.png');
  });

  await tracker.runStep('E2.2', 'Quick Actions Grid Rendering & Action Buttons', async () => {
    const qaButtons = await page.evaluate(() => {
      const grid = document.getElementById('quickActionsGrid');
      const btns = grid ? Array.from(grid.querySelectorAll('.qa-btn, button')) : [];
      return {
        hasGrid: grid !== null,
        count: btns.length,
        labels: btns.map(b => (b.textContent || '').trim())
      };
    });

    tracker.assert(qaButtons.hasGrid, 'Quick actions grid must be present on home');
    tracker.assert(qaButtons.count >= 2, 'Quick actions grid should contain role action buttons');
    await tracker.screenshot(page, 'E2.2_team_quick_actions.png');
  });

  await tracker.runStep('E2.3', 'Studio Status Snapshot Tiles Rendering (In Studio, On Shoot, On Leave, Offline)', async () => {
    const tiles = await page.evaluate(() => {
      const row = document.getElementById('statusRow');
      const inStudio = document.getElementById('statClockedIn');
      const onShoot = document.getElementById('statOnShoot');
      const onLeave = document.getElementById('statOnLeave');
      const offline = document.getElementById('statOffline');
      return {
        hasRow: row !== null,
        hasInStudio: inStudio !== null,
        hasOnShoot: onShoot !== null,
        hasOnLeave: onLeave !== null,
        hasOffline: offline !== null
      };
    });

    tracker.assert(tiles.hasRow, 'Status snapshot container must exist');
    tracker.assert(tiles.hasInStudio && tiles.hasOffline, 'Core status counters must be present');
    await tracker.screenshot(page, 'E2.3_team_status_snapshot.png');
  });

  await tracker.runStep('E2.4', 'Monthly Performance Card Metrics (Tasks Done, Days Present, EOD Reports)', async () => {
    const stats = await page.evaluate(() => {
      const card = document.getElementById('myStatsCard');
      const tasks = document.getElementById('statTasksDone');
      const days = document.getElementById('statDaysPresent');
      const eod = document.getElementById('statEODCount');
      return {
        hasCard: card !== null,
        hasTasks: tasks !== null,
        hasDays: days !== null,
        hasEod: eod !== null
      };
    });

    tracker.assert(stats.hasCard, 'Performance metrics card must exist');
    tracker.assert(stats.hasTasks && stats.hasDays && stats.hasEod, 'All 3 performance metric tiles must exist');
    await tracker.screenshot(page, 'E2.4_team_performance_card.png');
  });

  await tracker.runStep('E2.5', 'Interactive Page Transition to Tasks Workspace (showPage)', async () => {
    const transition = await page.evaluate(async () => {
      if (typeof window.showPage === 'function') {
        window.showPage('pageTasks');
      }
      await new Promise(r => setTimeout(r, 200));

      const home = document.getElementById('pageHome');
      const tasks = document.getElementById('pageTasks');
      return {
        isTasksActive: tasks ? tasks.classList.contains('active') : false,
        isHomeHidden: home ? !home.classList.contains('active') : false
      };
    });

    tracker.assert(transition.isTasksActive, 'Tasks workspace should become active');
    tracker.assert(transition.isHomeHidden, 'Home page should become inactive');
    await tracker.screenshot(page, 'E2.5_team_transition_tasks.png');
  });

  await tracker.runStep('E2.6', 'Seamless Return to Home Dashboard (showPage)', async () => {
    const returnHome = await page.evaluate(async () => {
      if (typeof window.showPage === 'function') {
        window.showPage('pageHome');
      }
      await new Promise(r => setTimeout(r, 200));

      const home = document.getElementById('pageHome');
      const tasks = document.getElementById('pageTasks');
      return {
        isHomeActive: home ? home.classList.contains('active') : false,
        isTasksHidden: tasks ? !tasks.classList.contains('active') : false
      };
    });

    tracker.assert(returnHome.isHomeActive, 'Home dashboard should become active again');
    tracker.assert(returnHome.isTasksHidden, 'Tasks workspace should be inactive');
    await tracker.screenshot(page, 'E2.6_team_return_home.png');
  });

  return tracker.getSummary();
}

module.exports = { runPhaseE2 };

