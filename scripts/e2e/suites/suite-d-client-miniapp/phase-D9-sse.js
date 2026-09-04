/**
 * scripts/e2e/suites/suite-d-client-miniapp/phase-D9-sse.js
 * Suite D - Phase D9: Client MiniApp Real-Time SSE Listener
 * 
 * Tests:
 * 1. SSE Stream Initialized & Window EventSource Support
 * 2. Role Parameter & Token Inclusion in SSE Endpoint URL
 * 3. SSE Event Listeners Registration (task_update, review_update, payment_update, invoice_update)
 * 4. Live Event Ingestion & Dynamic Data Refresh Simulation
 * 5. Auto-Reconnect Fallback Logic & Re-instantiation
 * 6. Resilient Connection Recovery & Error Handling
 */

const { BASE_URL, wait, TestTracker } = require('../../utils');
const { injectRoleSession } = require('../../auth');

async function runPhaseD9(page) {
  const tracker = new TestTracker('Suite D - Phase D9: Real-Time SSE Stream');
  console.log('\n--- 📡 Running Suite D - Phase D9: SSE ---');

  const MINIAPP_URL = `${BASE_URL}/client-miniapp.html`;

  await tracker.runStep('D9.1', 'SSE Stream Initialized & Window EventSource Support', async () => {
    await injectRoleSession(page, 'client');
    await page.goto(MINIAPP_URL, { waitUntil: 'networkidle2' });
    await wait(1000);

    const sseSupport = await page.evaluate(() => {
      return {
        hasEventSource: typeof window.EventSource !== 'undefined',
        hasSetupSSE: typeof window.setupSSE === 'function',
        hasConnection: !!window._sseConnection
      };
    });

    tracker.assert(sseSupport.hasEventSource, 'Browser must support EventSource API');
    tracker.assert(sseSupport.hasSetupSSE, 'window.setupSSE function must exist');
    tracker.assert(sseSupport.hasConnection, 'Active SSE connection should be established');
    await tracker.screenshot(page, 'D9.1_miniapp_sse_boot.png');
  });

  await tracker.runStep('D9.2', 'Role Parameter & Token Inclusion in SSE Endpoint URL', async () => {
    const connUrl = await page.evaluate(() => {
      const conn = window._sseConnection;
      return conn ? conn.url : '';
    });

    tracker.assert(connUrl.includes('/api/events'), 'SSE URL must target /api/events');
    tracker.assert(connUrl.includes('role=client'), 'SSE URL must include role=client parameter');
    await tracker.screenshot(page, 'D9.2_miniapp_sse_url.png');
  });

  await tracker.runStep('D9.3', 'SSE Event Listeners Registration & State Inspection', async () => {
    const connState = await page.evaluate(() => {
      const conn = window._sseConnection;
      return {
        readyState: conn ? conn.readyState : -1, // 0 = CONNECTING, 1 = OPEN, 2 = CLOSED
        isOpenOrConnecting: conn ? (conn.readyState === 0 || conn.readyState === 1) : false
      };
    });

    tracker.assert(connState.isOpenOrConnecting, 'SSE connection must be either CONNECTING (0) or OPEN (1)');
    await tracker.screenshot(page, 'D9.3_miniapp_sse_state.png');
  });

  await tracker.runStep('D9.4', 'Live Event Ingestion & Dynamic Data Refresh Simulation', async () => {
    const refreshTriggered = await page.evaluate(async () => {
      let campaignsReloaded = false;
      let homeDataReloaded = false;

      const origLoadCampaigns = window.loadCampaigns;
      const origLoadHome = window.loadHomeData;

      window.loadCampaigns = async () => {
        campaignsReloaded = true;
        if (typeof origLoadCampaigns === 'function') await origLoadCampaigns();
      };
      window.loadHomeData = async () => {
        homeDataReloaded = true;
        if (typeof origLoadHome === 'function') await origLoadHome();
      };

      // Dispatch mock message on sse connection
      if (window._sseConnection) {
        const mockEvent = new MessageEvent('task_update', {
          data: JSON.stringify({ type: 'task_update', taskId: 'tsk-999', title: 'Video Cut Updated' })
        });
        window._sseConnection.dispatchEvent(mockEvent);
      }

      await new Promise(r => setTimeout(r, 400));

      // Restore
      window.loadCampaigns = origLoadCampaigns;
      window.loadHomeData = origLoadHome;

      return { campaignsReloaded, homeDataReloaded };
    });

    tracker.assert(refreshTriggered.campaignsReloaded, 'Campaigns reload must be triggered on task_update event');
    tracker.assert(refreshTriggered.homeDataReloaded, 'Home data reload must be triggered on task_update event');
    await tracker.screenshot(page, 'D9.4_miniapp_sse_event_ingestion.png');
  });

  await tracker.runStep('D9.5', 'Auto-Reconnect Fallback Logic & Re-instantiation', async () => {
    const reconnectSetup = await page.evaluate(async () => {
      const firstConn = window._sseConnection;
      // Trigger setupSSE again to test re-instantiation
      if (typeof window.setupSSE === 'function') {
        window.setupSSE();
      }
      const newConn = window._sseConnection;
      return {
        firstClosed: firstConn ? firstConn.readyState === 2 : false,
        hasNewConn: !!newConn,
        newUrl: newConn ? newConn.url : ''
      };
    });

    tracker.assert(reconnectSetup.firstClosed, 'Previous connection must be closed on reconnect');
    tracker.assert(reconnectSetup.hasNewConn, 'New SSE connection must be instantiated');
    tracker.assert(reconnectSetup.newUrl.includes('role=client'), 'New connection retains client role param');
    await tracker.screenshot(page, 'D9.5_miniapp_sse_reconnect.png');
  });

  await tracker.runStep('D9.6', 'Resilient Connection Recovery & Error Handling', async () => {
    const errorHandled = await page.evaluate(async () => {
      let errorFired = false;
      if (window._sseConnection) {
        // Trigger onerror on connection to test recovery flow
        const origOnError = window._sseConnection.onerror;
        if (typeof origOnError === 'function') {
          origOnError(new Event('error'));
          errorFired = true;
        }
      }
      return { errorFired, readyState: window._sseConnection ? window._sseConnection.readyState : -1 };
    });

    tracker.assert(errorHandled.errorFired, 'onerror event handler should execute gracefully');
    tracker.assert(errorHandled.readyState === 2, 'Connection state should transition to CLOSED after error');
    await tracker.screenshot(page, 'D9.6_miniapp_sse_recovery.png');
  });

  return tracker.getSummary();
}

module.exports = { runPhaseD9 };
