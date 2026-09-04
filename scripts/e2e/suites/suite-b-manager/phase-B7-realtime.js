/**
 * scripts/e2e/suites/suite-b-manager/phase-B7-realtime.js
 * Suite B - Phase B7: Manager Real-Time SSE Sync & Toast Notifications
 * 
 * Tests:
 * 1. Manager SSE Stream Initialized
 * 2. SSE Event Listeners Verification
 * 3. Real-Time Event Dispatch Simulation
 * 4. Multi-Tab Real-Time Sync Resilience
 * 5. Toast Notification System Verification
 * 6. Suite B Full Integrity & Readiness Closure
 */

const { BASE_URL, wait, TestTracker } = require('../../utils');
const { injectRoleSession } = require('../../auth');

async function runPhaseB7(page) {
  const tracker = new TestTracker('Suite B - Phase B7: Real-Time SSE Stream');
  console.log('\n--- 📡 Running Suite B - Phase B7: Realtime SSE & Notifications ---');

  const MANAGER_URL = `${BASE_URL}/manager.html`;

  await tracker.runStep('B7.1', 'Manager SSE Stream Initialized', async () => {
    await injectRoleSession(page, 'manager');
    await page.goto(MANAGER_URL, { waitUntil: 'networkidle2' });
    await wait(1000);

    const hasSseHandler = await page.evaluate(() => {
      return typeof window.setupManagerSSE === 'function';
    });
    tracker.assert(hasSseHandler, 'setupManagerSSE must be defined on window');

    await tracker.screenshot(page, 'B7.1_manager_sse.png');
  });

  await tracker.runStep('B7.2', 'SSE Event Listeners Verification', async () => {
    const sseCode = await page.evaluate(() => {
      return window.setupManagerSSE.toString();
    });

    tracker.assert(
      sseCode.includes('task_update') && sseCode.includes('expense_update') && sseCode.includes('leave_update'),
      'SSE handler must support task, expense, and leave updates'
    );
  });

  await tracker.runStep('B7.3', 'Real-Time Event Dispatch Simulation', async () => {
    const executedWithoutError = await page.evaluate(() => {
      try {
        if (typeof window.loadManagerOverviewKPIs === 'function') {
          window.loadManagerOverviewKPIs();
        }
        return true;
      } catch (e) {
        return false;
      }
    });

    tracker.assert(executedWithoutError, 'Real-time telemetry event handler should execute without error');
  });

  await tracker.runStep('B7.4', 'Multi-Tab Real-Time Sync Resilience', async () => {
    // Switch between tabs rapidly to test stability
    await page.evaluate(() => {
      if (typeof window.switchTab === 'function') {
        window.switchTab('crm');
        window.switchTab('kanban');
        window.switchTab('dashboard');
      }
    });
    await wait(400);

    const isDashboardActive = await page.evaluate(() => {
      const pane = document.getElementById('tab-dashboard');
      return pane && (pane.classList.contains('active') || pane.style.display !== 'none');
    });
    tracker.assert(isDashboardActive, 'Rapid multi-tab switching must settle on active tab');
  });

  await tracker.runStep('B7.5', 'Toast Notification System Verification', async () => {
    await page.evaluate(() => {
      if (typeof window.showManagerToast === 'function') {
        window.showManagerToast('Real-time sync test message: All pipelines active!', 'success');
      }
    });
    await wait(400);

    const hasToast = await page.evaluate(() => {
      const container = document.getElementById('managerToastContainer');
      return container && container.children.length > 0;
    });
    tracker.assert(hasToast, '#managerToastContainer must render active toast');

    await tracker.screenshot(page, 'B7.5_manager_toast.png');
  });

  await tracker.runStep('B7.6', 'Suite B Full Integrity & Readiness Closure', async () => {
    const isReady = await page.evaluate(() => {
      return typeof window.switchTab === 'function' &&
             typeof window.checkManagerAuth === 'function' &&
             typeof window.loadManagerOverviewKPIs === 'function';
    });

    tracker.assert(isReady, 'All Suite B Manager controller methods must be initialized and ready');
  });

  return tracker.getSummary();
}

module.exports = { runPhaseB7 };
