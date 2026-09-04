/**
 * scripts/e2e/suites/suite-d-client-miniapp/phase-D7-tickets.js
 * Suite D - Phase D7: Support Requests & Client Ticket Filing
 * 
 * Tests:
 * 1. Navigate to Support Ticket Section & Tab Highlight
 * 2. Support Ticket Form Fields Presence & Structure
 * 3. Support Category Options (Video Production, Social Media, Billing, General)
 * 4. Ticket Priority Options (Low, Medium, High, Urgent)
 * 5. Populate Support Ticket Fields
 * 6. Submit Support Ticket Mutation & Confirmation Feedback
 */

const { BASE_URL, wait, TestTracker } = require('../../utils');
const { injectRoleSession } = require('../../auth');

async function runPhaseD7(page) {
  const tracker = new TestTracker('Suite D - Phase D7: Client Support Tickets');
  console.log('\n--- 🎟️ Running Suite D - Phase D7: Support Requests ---');

  const MINIAPP_URL = `${BASE_URL}/client-miniapp.html`;

  await tracker.runStep('D7.1', 'Navigate to Support Ticket Section & Tab Highlight', async () => {
    await injectRoleSession(page, 'client');
    await page.goto(MINIAPP_URL, { waitUntil: 'networkidle2' });
    await wait(1000);

    const navSuccess = await page.evaluate(async () => {
      if (typeof window.showPage === 'function') {
        window.showPage('pageContact');
      }
      if (typeof window.loadContact === 'function') {
        await window.loadContact();
      }
      const pageEl = document.getElementById('pageContact');
      const navBtn = document.getElementById('navContact');
      return {
        isPageActive: pageEl && pageEl.classList.contains('active'),
        isNavActive: navBtn && navBtn.classList.contains('active')
      };
    });

    tracker.assert(navSuccess.isPageActive, 'Contact & Support page should become active');
    tracker.assert(navSuccess.isNavActive, 'Contact nav button should be highlighted active');
    await tracker.screenshot(page, 'D7.1_miniapp_contact_tickets_page.png');
  });

  await tracker.runStep('D7.2', 'Support Ticket Form Fields Presence & Structure', async () => {
    const formControls = await page.evaluate(() => {
      const title = document.getElementById('tckTitle');
      const cat = document.getElementById('tckCategory');
      const prio = document.getElementById('tckPriority');
      const desc = document.getElementById('tckDesc');
      return {
        hasTitle: title !== null,
        hasCategory: cat !== null,
        hasPriority: prio !== null,
        hasDesc: desc !== null
      };
    });

    tracker.assert(formControls.hasTitle, 'Ticket title field must exist');
    tracker.assert(formControls.hasCategory, 'Category selector must exist');
    tracker.assert(formControls.hasPriority, 'Priority selector must exist');
    tracker.assert(formControls.hasDesc, 'Details description textarea must exist');
  });

  await tracker.runStep('D7.3', 'Support Category Options (Creative Revision, Social Media, Billing, General)', async () => {
    const categories = await page.evaluate(() => {
      const cat = document.getElementById('tckCategory');
      return cat ? Array.from(cat.options).map(o => o.value) : [];
    });

    tracker.assert(categories.includes('Creative Revision'), 'Must support Creative Revision category');
    tracker.assert(categories.includes('Social Media Issue'), 'Must support Social Media Issue category');
    tracker.assert(categories.includes('Billing & Invoice'), 'Must support Billing category');
  });

  await tracker.runStep('D7.4', 'Ticket Priority Options (Low, Medium, High, Urgent)', async () => {
    const priorities = await page.evaluate(() => {
      const prio = document.getElementById('tckPriority');
      return prio ? Array.from(prio.options).map(o => o.value) : [];
    });

    tracker.assert(priorities.includes('High'), 'Must include High priority');
    tracker.assert(priorities.includes('Urgent'), 'Must include Urgent priority');
  });

  await tracker.runStep('D7.5', 'Populate Support Ticket Fields', async () => {
    const populated = await page.evaluate(() => {
      const title = document.getElementById('tckTitle');
      const prio = document.getElementById('tckPriority');
      const desc = document.getElementById('tckDesc');

      if (title) title.value = 'Urgent update needed for Q4 brand launch banner';
      if (prio) prio.value = 'Urgent';
      if (desc) desc.value = 'The logo size on the main thumbnail needs to be 20% larger before scheduled dispatch.';

      return {
        title: title ? title.value : '',
        prio: prio ? prio.value : '',
        desc: desc ? desc.value : ''
      };
    });

    tracker.assert(populated.title.includes('Urgent update'), 'Title should be populated');
    tracker.assert(populated.prio === 'Urgent', 'Priority should be set to Urgent');
    await tracker.screenshot(page, 'D7.5_miniapp_ticket_populated.png');
  });

  await tracker.runStep('D7.6', 'Submit Support Ticket Mutation & Confirmation Feedback', async () => {
    const submitResult = await page.evaluate(async () => {
      if (typeof window.submitClientTicket === 'function') {
        await window.submitClientTicket(new Event('submit', { cancelable: true }));
      } else {
        const form = document.querySelector('#pageContact form');
        if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
      await new Promise(r => setTimeout(r, 600));

      const overlay = document.getElementById('successOverlay');
      const isToastActive = overlay && (overlay.classList.contains('visible') || overlay.classList.contains('active'));
      const sub = document.getElementById('successSub')?.innerText || '';
      return { isToastActive, sub };
    });

    tracker.assert(submitResult.isToastActive || submitResult.sub.length > 0, 'Success overlay must display ticket confirmation');
    await tracker.screenshot(page, 'D7.6_miniapp_ticket_submitted.png');
  });

  return tracker.getSummary();
}

module.exports = { runPhaseD7 };
