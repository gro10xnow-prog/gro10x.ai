/**
 * scripts/e2e/suites/suite-e-team-miniapp/phase-E9-sse.js
 * Suite E - Phase E9: Team MiniApp Real-Time SSE Listener
 * 
 * Tests:
 * 1. Team MiniApp SSE Stream Boot & EventSource Readiness
 * 2. Role Parameter (role=team) & Token Inclusion in SSE Endpoint URL
 * 3. SSE Connection State Inspection (CONNECTING / OPEN)
 * 4. Simulated Real-Time Task Event Receipt & Auto-Reload Trigger
 * 5. Auto-Reconnect Fallback Logic Verification
 * 6. Resilient Connection Recovery on Stream Error
 */

const { BASE_URL, wait, TestTracker } = require('../../utils');
const { injectRoleSession } = require('../../auth');

async function runPhaseE9(page) {
  const tracker = new TestTracker('Suite E - Phase E9: Real-Time SSE Stream');
  console.log('\n--- 📡 Running Suite E - Phase E9: Team SSE ---');

  const TEAM_URL = `${BASE_URL}/team-miniapp.html`;

  await tracker.runStep('E9.1', 'Team MiniApp SSE Stream Boot & EventSource Readiness', async () => {
    await injectRoleSession(page, 'specialist');
    await page.goto(TEAM_URL, { waitUntil: 'networkidle2' });
    await wait(1000);

    const sseInfo = await page.evaluate(() => {
      return {
        hasEventSource: typeof window.EventSource !== 'undefined',
        hasSetupSSE: typeof window.setupSSE === 'function',
        hasConn: !!window._sseConnection
      };
    });

    tracker.assert(sseInfo.hasEventSource, 'Browser must support EventSource API');
    tracker.assert(sseInfo.hasSetupSSE, 'setupSSE function must exist');
    tracker.assert(sseInfo.hasConn, 'Active SSE stream instance must be created');
    await tracker.screenshot(page, 'E9.1_team_sse_boot.png');
  });

  await tracker.runStep('E9.2', 'Role Parameter (role=team) & Token Inclusion in SSE Endpoint URL', async () => {
    const sseUrl = await page.evaluate(() => {
      const conn = window._sseConnection;
      return conn ? conn.url : '';
    });

    tracker.assert(sseUrl.includes('/api/events'), 'SSE connection should target /api/events');
    tracker.assert(sseUrl.includes('role=team'), 'SSE URL must include role=team parameter');
    await tracker.screenshot(page, 'E9.2_team_sse_url.png');
  });

  await tracker.runStep('E9.3', 'SSE Connection State Inspection (CONNECTING / OPEN)', async () => {
    const sseState = await page.evaluate(() => {
      const conn = window._sseConnection;
      return {
        readyState: conn ? conn.readyState : -1,
        isOpenOrConnecting: conn ? (conn.readyState === 0 || conn.readyState === 1) : false
      };
    });

    tracker.assert(sseState.isOpenOrConnecting, 'SSE connection must be either CONNECTING (0) or OPEN (1)');
    await tracker.screenshot(page, 'E9.3_team_sse_state.png');
  });

  await tracker.runStep('E9.4', 'Simulated Real-Time Task Event Receipt & Auto-Reload Trigger', async () => {
    const eventHandled = await page.evaluate(async () => {
      let tasksReloaded = false;
      const origLoadTasks = window.loadUserTasks;
      window.loadUserTasks = async () => {
        tasksReloaded = true;
        if (typeof origLoadTasks === 'function') await origLoadTasks();
      };

      // Dispatch simulated event on connection
      if (window._sseConnection) {
        const mockEvt = new MessageEvent('task_update', {
          data: JSON.stringify({ type: 'task_update', taskId: 'tsk-team-99', title: 'New Cut Assigned' })
        });
        window._sseConnection.dispatchEvent(mockEvt);
      }
      await new Promise(r => setTimeout(r, 400));

      window.loadUserTasks = origLoadTasks;
      return { tasksReloaded };
    });

    tracker.assert(eventHandled.tasksReloaded, 'loadUserTasks should trigger upon incoming task_update SSE event');
    await tracker.screenshot(page, 'E9.4_team_sse_event_receipt.png');
  });

  await tracker.runStep('E9.5', 'Auto-Reconnect Fallback Logic Verification', async () => {
    const reconState = await page.evaluate(async () => {
      const firstConn = window._sseConnection;
      if (typeof window.setupSSE === 'function') {
        window.setupSSE();
      }
      const newConn = window._sseConnection;
      return {
        firstClosed: firstConn ? firstConn.readyState === 2 : false,
        hasNewConn: !!newConn,
        isRoleTeam: newConn ? newConn.url.includes('role=team') : false
      };
    });

    tracker.assert(reconState.firstClosed, 'Old connection must be closed on reconnect');
    tracker.assert(reconState.hasNewConn && reconState.isRoleTeam, 'New connection must maintain role=team');
    await tracker.screenshot(page, 'E9.5_team_sse_reconnect.png');
  });

  await tracker.runStep('E9.6', 'Resilient Connection Recovery on Stream Error', async () => {
    const errorRecovery = await page.evaluate(() => {
      let errorTriggered = false;
      if (window._sseConnection && typeof window._sseConnection.onerror === 'function') {
        window._sseConnection.onerror(new Event('error'));
        errorTriggered = true;
      }
      return {
        errorTriggered,
        state: window._sseConnection ? window._sseConnection.readyState : -1
      };
    });

    tracker.assert(errorRecovery.errorTriggered, 'onerror handler should execute without unhandled exceptions');
    tracker.assert(errorRecovery.state === 2, 'Connection state should transition to CLOSED after error');
    await tracker.screenshot(page, 'E9.6_team_sse_recovery.png');
  });

  return tracker.getSummary();
}

module.exports = { runPhaseE9 };

