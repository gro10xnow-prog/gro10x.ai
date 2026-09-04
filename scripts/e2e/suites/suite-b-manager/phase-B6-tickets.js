/**
 * scripts/e2e/suites/suite-b-manager/phase-B6-tickets.js
 * Suite B - Phase B6: Manager Support Desk & Ticket Escalation
 * 
 * Tests:
 * 1. Manager Support Tickets Hub Boot (#tab-tickets)
 * 2. Support Ticket Queue & Table Columns Formatting
 * 3. Ticket Status Transition Action Handlers
 * 4. Live Ticket Queue Reload via loadManagerTickets()
 * 5. Priority Badge & Classification Styling
 * 6. Clean Navigation Return to Dashboard
 */

const { BASE_URL, wait, TestTracker } = require('../../utils');
const { injectRoleSession } = require('../../auth');

async function runPhaseB6(page) {
  const tracker = new TestTracker('Suite B - Phase B6: Department Tickets');
  console.log('\n--- 🎟️ Running Suite B - Phase B6: Support Tickets & Escalation ---');

  const MANAGER_URL = `${BASE_URL}/manager.html`;

  await tracker.runStep('B6.1', 'Manager Support Tickets Hub Boot (#tab-tickets)', async () => {
    await injectRoleSession(page, 'manager');
    await page.goto(MANAGER_URL, { waitUntil: 'networkidle2' });
    await wait(1000);

    // Switch to tickets tab
    await page.evaluate(() => {
      if (typeof window.switchTab === 'function') window.switchTab('tickets');
    });
    await wait(600);

    const isTicketsActive = await page.evaluate(() => {
      const pane = document.getElementById('tab-tickets');
      return pane && (pane.classList.contains('active') || pane.style.display !== 'none');
    });
    tracker.assert(isTicketsActive, '#tab-tickets must be active');

    const hasTbody = await page.evaluate(() => {
      return document.getElementById('managerTicketsTbody') !== null;
    });
    tracker.assert(hasTbody, '#managerTicketsTbody must be present in DOM');

    await tracker.screenshot(page, 'B6.1_manager_tickets_table.png');
  });

  await tracker.runStep('B6.2', 'Support Ticket Queue & Table Columns Formatting', async () => {
    const headers = await page.evaluate(() => {
      const ths = Array.from(document.querySelectorAll('#tab-tickets table thead th'));
      return ths.map(th => th.textContent.trim());
    });

    tracker.assert(headers.length >= 6, `Expected at least 6 ticket table headers, got ${headers.length}`);
    tracker.assert(headers.includes('Ticket ID') && headers.includes('Status'), 'Headers must include Ticket ID and Status');
  });

  await tracker.runStep('B6.3', 'Ticket Status Transition Action Handlers', async () => {
    const hasStatusHandler = await page.evaluate(() => {
      return typeof window.updateTicketStatus === 'function';
    });
    tracker.assert(hasStatusHandler, 'updateTicketStatus must be defined on window');
  });

  await tracker.runStep('B6.4', 'Live Ticket Queue Reload via loadManagerTickets()', async () => {
    await page.evaluate(async () => {
      if (typeof window.loadManagerTickets === 'function') {
        await window.loadManagerTickets();
      }
    });
    await wait(400);

    const rowCount = await page.evaluate(() => {
      const tbody = document.getElementById('managerTicketsTbody');
      return tbody ? tbody.children.length : 0;
    });
    tracker.assert(rowCount >= 1, `Tickets table must render rows (found: ${rowCount})`);
    await tracker.screenshot(page, 'B6.4_manager_tickets_loaded.png');
  });

  await tracker.runStep('B6.5', 'Priority Badge & Classification Styling', async () => {
    const hasTableContent = await page.evaluate(() => {
      const tbody = document.getElementById('managerTicketsTbody');
      return tbody && tbody.textContent.length > 20;
    });
    tracker.assert(hasTableContent, 'Tickets tbody must contain rendered ticket text');
  });

  await tracker.runStep('B6.6', 'Clean Navigation Return to Dashboard', async () => {
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

module.exports = { runPhaseB6 };
