/**
 * scripts/e2e/suites/suite-b-manager/phase-B2-dashboard.js
 * Suite B - Phase B2: Manager Executive Dashboard & Live Department Metrics
 * 
 * Tests:
 * 1. Manager Dashboard Boot & 4 KPI Summary Tiles
 * 2. Department Production Status Panel
 * 3. Team Today Attendance Roster Widget
 * 4. Universal Command Center Modal Trigger (Ctrl + K)
 * 5. Live Telemetry & KPI Refresh via loadManagerOverviewKPIs()
 * 6. Responsive Dashboard Grid Layout
 */

const { BASE_URL, wait, TestTracker } = require('../../utils');
const { injectRoleSession } = require('../../auth');

async function runPhaseB2(page) {
  const tracker = new TestTracker('Suite B - Phase B2: Manager Dashboard');
  console.log('\n--- 📊 Running Suite B - Phase B2: Dashboard & Metrics ---');

  const MANAGER_URL = `${BASE_URL}/manager.html`;

  await tracker.runStep('B2.1', 'Manager Dashboard Boot & 4 KPI Summary Tiles', async () => {
    await injectRoleSession(page, 'manager');
    await page.goto(MANAGER_URL, { waitUntil: 'networkidle2' });
    await wait(1200);

    // Switch to dashboard tab if not active
    await page.evaluate(() => {
      if (typeof window.switchTab === 'function') window.switchTab('dashboard');
    });
    await wait(500);

    const isDashboardActive = await page.evaluate(() => {
      const pane = document.getElementById('tab-dashboard');
      return pane && (pane.classList.contains('active') || pane.style.display !== 'none');
    });
    tracker.assert(isDashboardActive, '#tab-dashboard must be active');

    // Verify 4 KPI Summary tiles
    const kpis = await page.evaluate(() => {
      return {
        activeTasks: document.getElementById('kpiActiveTasks')?.textContent || '',
        teamActive: document.getElementById('kpiTeamActive')?.textContent || '',
        pendingApprovals: document.getElementById('kpiPendingApprovals')?.textContent || '',
        reviewCuts: document.getElementById('kpiReviewCuts')?.textContent || ''
      };
    });

    tracker.assert(kpis.activeTasks.length > 0, 'Active Tasks KPI must be rendered');
    tracker.assert(kpis.teamActive.length > 0, 'Team Active KPI must be rendered');
    tracker.assert(kpis.pendingApprovals.length > 0, 'Pending Approvals KPI must be rendered');
    tracker.assert(kpis.reviewCuts.length > 0, 'Review Cuts KPI must be rendered');

    await tracker.screenshot(page, 'B2.1_manager_dashboard_kpis.png');
  });

  await tracker.runStep('B2.2', 'Department Production Status Panel', async () => {
    const statusContent = await page.evaluate(() => {
      const pane = document.getElementById('tab-dashboard');
      return pane ? pane.textContent : '';
    });

    tracker.assert(
      statusContent.includes('Department Production Status') || statusContent.includes('Manager Command'),
      'Department Production Status panel must be visible'
    );
  });

  await tracker.runStep('B2.3', 'Team Today Attendance Roster Widget', async () => {
    const rosterCount = await page.evaluate(() => {
      const roster = document.getElementById('managerTeamRoster');
      if (!roster) return 0;
      return roster.children.length;
    });

    tracker.assert(rosterCount >= 1, `Team Today roster widget must display active members (found: ${rosterCount})`);
    await tracker.screenshot(page, 'B2.3_manager_team_roster.png');
  });

  await tracker.runStep('B2.4', 'Universal Command Center Modal Trigger', async () => {
    // Open Command Center
    await page.evaluate(() => {
      if (typeof window.toggleCommandCenter === 'function') {
        window.toggleCommandCenter();
      }
    });
    await wait(400);

    const isCommandOpen = await page.evaluate(() => {
      const modal = document.getElementById('managerCmdModal') || document.getElementById('cmdCenterModal');
      return modal && (modal.style.display !== 'none' || modal.classList.contains('active'));
    });
    tracker.assert(isCommandOpen, 'Command Center modal must open on toggleCommandCenter()');

    await tracker.screenshot(page, 'B2.4_manager_command_center.png');

    // Close Command Center
    await page.evaluate(() => {
      if (typeof window.closeManagerCmdModal === 'function') {
        window.closeManagerCmdModal();
      } else if (typeof window.toggleCommandCenter === 'function') {
        window.toggleCommandCenter();
      }
    });
    await wait(200);
  });

  await tracker.runStep('B2.5', 'Live Telemetry & KPI Refresh via loadManagerOverviewKPIs()', async () => {
    await page.evaluate(async () => {
      if (typeof window.loadManagerOverviewKPIs === 'function') {
        await window.loadManagerOverviewKPIs();
      }
    });
    await wait(400);

    const activeTasks = await page.$eval('#kpiActiveTasks', el => el.textContent);
    tracker.assert(activeTasks.length > 0, 'Active Tasks KPI must be populated after API reload');
  });

  await tracker.runStep('B2.6', 'Dashboard Responsive Grid Layout', async () => {
    const isGridRendered = await page.evaluate(() => {
      const grid = document.querySelector('#tab-dashboard .kpi-grid');
      return grid && window.getComputedStyle(grid).display === 'grid';
    });
    tracker.assert(isGridRendered, 'KPI grid must use CSS grid display layout');
  });

  return tracker.getSummary();
}

module.exports = { runPhaseB2 };
