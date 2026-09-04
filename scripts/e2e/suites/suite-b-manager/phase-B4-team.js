/**
 * scripts/e2e/suites/suite-b-manager/phase-B4-team.js
 * Suite B - Phase B4: Team Attendance, EODs, Leave Approvals & Workload Allocation
 * 
 * Tests:
 * 1. HR Ops Hub Boot & 3-Tier Leave Table
 * 2. Daily EOD Submissions & Rate Badge
 * 3. Line Manager Leave Action Handlers Verification
 * 4. Resource Allocation & Team Workload Hub Boot (#tab-workload)
 * 5. Workload Capacity & Team Utilization Metrics
 * 6. Clean Navigation Return to Dashboard
 */

const { BASE_URL, wait, TestTracker } = require('../../utils');
const { injectRoleSession } = require('../../auth');

async function runPhaseB4(page) {
  const tracker = new TestTracker('Suite B - Phase B4: Team Operations');
  console.log('\n--- 👥 Running Suite B - Phase B4: Team, Leaves & Workload Operations ---');

  const MANAGER_URL = `${BASE_URL}/manager.html`;

  await tracker.runStep('B4.1', 'HR Ops Hub Boot & 3-Tier Leave Table', async () => {
    await injectRoleSession(page, 'manager');
    await page.goto(MANAGER_URL, { waitUntil: 'networkidle2' });
    await wait(1000);

    // Switch to hrops tab
    await page.evaluate(() => {
      if (typeof window.switchTab === 'function') window.switchTab('hrops');
    });
    await wait(600);

    const isHropsActive = await page.evaluate(() => {
      const pane = document.getElementById('tab-hrops');
      return pane && (pane.classList.contains('active') || pane.style.display !== 'none');
    });
    tracker.assert(isHropsActive, '#tab-hrops must be active');

    const hasLeaveTable = await page.evaluate(() => {
      return document.getElementById('managerLeaveTableBody') !== null;
    });
    tracker.assert(hasLeaveTable, '#managerLeaveTableBody must be present');

    await tracker.screenshot(page, 'B4.1_manager_leaves_table.png');
  });

  await tracker.runStep('B4.2', 'Daily EOD Submissions & Rate Badge', async () => {
    await wait(600);
    const eodInfo = await page.evaluate(() => {
      const badge = document.getElementById('eodRateBadge')?.textContent || '';
      const list = document.getElementById('managerEodList');
      return { badge, hasList: list !== null };
    });

    tracker.assert(eodInfo.hasList, '#managerEodList must be present');
    tracker.assert(
      eodInfo.badge.includes('Team') || eodInfo.badge.includes('Submitted') || eodInfo.badge.includes('Submission'),
      `EOD rate badge must display team rate (got: ${eodInfo.badge})`
    );
  });

  await tracker.runStep('B4.3', 'Line Manager Leave Action Handlers Verification', async () => {
    const hasHandlers = await page.evaluate(() => {
      return typeof window.approveLeaveManager === 'function' && typeof window.rejectLeaveManager === 'function';
    });
    tracker.assert(hasHandlers, 'approveLeaveManager and rejectLeaveManager must be defined');
  });

  await tracker.runStep('B4.4', 'Resource Allocation & Team Workload Hub Boot (#tab-workload)', async () => {
    await page.evaluate(() => {
      if (typeof window.switchTab === 'function') window.switchTab('workload');
    });
    await wait(600);

    const isWorkloadActive = await page.evaluate(() => {
      const pane = document.getElementById('tab-workload');
      return pane && (pane.classList.contains('active') || pane.style.display !== 'none');
    });
    tracker.assert(isWorkloadActive, '#tab-workload must be active');

    await tracker.screenshot(page, 'B4.4_manager_workload_hub.png');
  });

  await tracker.runStep('B4.5', 'Workload Capacity & Team Utilization Metrics', async () => {
    const content = await page.evaluate(() => {
      const pane = document.getElementById('tab-workload');
      return pane ? pane.textContent : '';
    });

    tracker.assert(
      content.includes('Resource Allocation') || content.includes('Workload') || content.includes('Capacity'),
      'Workload tab must display allocation metrics'
    );
  });

  await tracker.runStep('B4.6', 'Clean Navigation Return to Dashboard', async () => {
    await page.evaluate(() => {
      if (typeof window.switchTab === 'function') window.switchTab('dashboard');
    });
    await wait(300);

    const isDashboardActive = await page.evaluate(() => {
      const pane = document.getElementById('tab-dashboard');
      return pane && (pane.classList.contains('active') || pane.style.display !== 'none');
    });
    tracker.assert(isDashboardActive, 'Return to #tab-dashboard must succeed');
  });

  return tracker.getSummary();
}

module.exports = { runPhaseB4 };
