/**
 * scripts/e2e/suites/suite-c-partner/phase-C7-sse.js
 * Suite C - Phase C7: Partner Realtime SSE Sync & Notifications
 * 
 * Tests:
 * 1. Partner EventSource SSE Function & Connection Logic
 * 2. Role-Based SSE Endpoint Connection (/api/events?role=client)
 * 3. Multi-Event SSE Subscription Registration
 * 4. Partner Toast Notification Display System (success, error, info)
 * 5. Partner Workspace Account Switching
 * 6. Partner Session Logout & Credentials Teardown
 */

const { BASE_URL, wait, TestTracker } = require('../../utils');
const { injectRoleSession } = require('../../auth');

async function runPhaseC7(page) {
  const tracker = new TestTracker('Suite C - Phase C7: Real-Time SSE & Notifications');
  console.log('\n--- 📡 Running Suite C - Phase C7: Realtime SSE & Notifications ---');

  const PARTNERS_URL = `${BASE_URL}/partners.html`;

  await tracker.runStep('C7.1', 'Partner EventSource SSE Function & Connection Logic', async () => {
    await injectRoleSession(page, 'partner');
    await page.goto(PARTNERS_URL, { waitUntil: 'networkidle2' });
    await wait(1000);

    const sseConfigured = await page.evaluate(() => {
      return typeof window.setupPartnerSSE === 'function';
    });

    tracker.assert(sseConfigured, 'setupPartnerSSE function must be defined on window');
    await tracker.screenshot(page, 'C7.1_partner_sse_boot.png');
  });

  await tracker.runStep('C7.2', 'Role-Based SSE Endpoint Connection (/api/events?role=client)', async () => {
    const sseRole = await page.evaluate(() => {
      const codeStr = window.setupPartnerSSE ? window.setupPartnerSSE.toString() : '';
      const hasClientRole = codeStr.includes('role=client');
      const hasEventSource = codeStr.includes('EventSource');
      return { hasClientRole, hasEventSource };
    });

    tracker.assert(sseRole.hasEventSource, 'setupPartnerSSE must instantiate EventSource');
    tracker.assert(sseRole.hasClientRole, 'SSE endpoint URL must request role=client parameter');
  });

  await tracker.runStep('C7.3', 'Multi-Event SSE Subscription Registration', async () => {
    const eventsHandled = await page.evaluate(() => {
      const codeStr = window.setupPartnerSSE ? window.setupPartnerSSE.toString() : '';
      const events = ['review_update', 'comment_update', 'invoice_update', 'payment_update', 'post_update'];
      const allIncluded = events.every(evt => codeStr.includes(evt));
      return { allIncluded, count: events.length };
    });

    tracker.assert(eventsHandled.allIncluded, 'SSE listener must subscribe to review, invoice, and post updates');
  });

  await tracker.runStep('C7.4', 'Partner Toast Notification Display System (success, error, info)', async () => {
    const toastCheck = await page.evaluate(() => {
      if (typeof window.showPartnerToast === 'function') {
        window.showPartnerToast('Success verification toast test', 'success');
        window.showPartnerToast('Warning information toast test', 'info');
      }
      const container = document.getElementById('partnerToastContainer');
      const toasts = container ? container.querySelectorAll('.admin-toast') : [];
      return {
        hasContainer: container !== null,
        toastCount: toasts.length
      };
    });

    tracker.assert(toastCheck.hasContainer, 'partnerToastContainer must exist in DOM');
    tracker.assert(toastCheck.toastCount >= 2, 'Toasts should stack dynamically in container');
    await tracker.screenshot(page, 'C7.4_partner_stacked_toasts.png');
  });

  await tracker.runStep('C7.5', 'Partner Workspace Account Switching', async () => {
    const switched = await page.evaluate(() => {
      if (typeof window.switchPartnerAccount === 'function') {
        window.switchPartnerAccount('Acme Global Retailers');
      }
      const title = document.getElementById('partnerClientTitle')?.innerText || '';
      return { titleMatch: title.includes('Acme Global') };
    });

    tracker.assert(switched.titleMatch, 'Portal title should update when workspace account is switched');
    await tracker.screenshot(page, 'C7.5_partner_account_switched.png');
  });

  await tracker.runStep('C7.6', 'Partner Session Logout & Credentials Teardown', async () => {
    await page.evaluate(() => {
      localStorage.setItem('gro10x_token', 'mock_token_to_purge');
      localStorage.setItem('purple_user', JSON.stringify({ name: 'Partner User' }));
    });

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {}),
      page.evaluate(() => {
        if (typeof window.handlePartnerLogout === 'function') {
          window.handlePartnerLogout();
        }
      })
    ]);

    await wait(600);

    const state = await page.evaluate(() => {
      return {
        url: window.location.href,
        tokenPurged: localStorage.getItem('gro10x_token') === null,
        userPurged: localStorage.getItem('purple_user') === null
      };
    });

    tracker.assert(state.url.includes('/auth') || state.url.includes('/login'), 'Logout should redirect to /auth');
    tracker.assert(state.tokenPurged, 'JWT session token must be cleared upon logout');
    tracker.assert(state.userPurged, 'User metadata must be purged upon logout');
    await tracker.screenshot(page, 'C7.6_partner_session_logged_out.png');
  });

  return tracker.getSummary();
}

module.exports = { runPhaseC7 };

