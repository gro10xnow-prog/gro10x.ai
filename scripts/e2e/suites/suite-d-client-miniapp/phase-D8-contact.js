/**
 * scripts/e2e/suites/suite-d-client-miniapp/phase-D8-contact.js
 * Suite D - Phase D8: Agency Contact & Dedicated Account Manager POCs
 * 
 * Tests:
 * 1. Navigate to Contact Section & Verify Active Tab State
 * 2. Account Manager Profile Card Visibility & Details
 * 3. Telegram Direct Chat Action Handler Verification
 * 4. Telephone Call Action Protocol Verification
 * 5. Support Desk Info & Escalation Pathways
 * 6. Responsive Viewport Contact Card Rendering
 */

const { BASE_URL, wait, TestTracker } = require('../../utils');
const { injectRoleSession } = require('../../auth');

async function runPhaseD8(page) {
  const tracker = new TestTracker('Suite D - Phase D8: Agency Contact & POCs');
  console.log('\n--- 📞 Running Suite D - Phase D8: Contact & POCs ---');

  const MINIAPP_URL = `${BASE_URL}/client-miniapp.html`;

  await tracker.runStep('D8.1', 'Navigate to Contact Section & Verify Active Tab State', async () => {
    await injectRoleSession(page, 'client');
    await page.goto(MINIAPP_URL, { waitUntil: 'networkidle2' });
    await wait(800);

    const navRes = await page.evaluate(async () => {
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

    tracker.assert(navRes.isPageActive, 'pageContact should be active');
    tracker.assert(navRes.isNavActive, 'navContact button should have active class');
    await tracker.screenshot(page, 'D8.1_miniapp_contact_tab.png');
  });

  await tracker.runStep('D8.2', 'Account Manager Profile Card Visibility & Details', async () => {
    const amDetails = await page.evaluate(() => {
      const card = document.querySelector('.contact-card');
      const avatar = document.querySelector('.contact-avatar');
      const name = document.getElementById('amName');
      const role = document.querySelector('.contact-role');
      const phone = document.getElementById('amPhone');
      return {
        hasCard: card !== null,
        avatarText: avatar ? avatar.innerText.trim() : '',
        name: name ? name.innerText.trim() : '',
        role: role ? role.innerText.trim() : '',
        phone: phone ? phone.innerText.trim() : ''
      };
    });

    tracker.assert(amDetails.hasCard, 'Contact card must be present');
    tracker.assert(amDetails.avatarText === 'AM', 'Contact avatar should show AM badge');
    tracker.assert(amDetails.name.length > 0, 'Account manager name must be displayed');
    tracker.assert(amDetails.role.includes('Contact'), 'Role label should mention contact');
    tracker.assert(amDetails.phone.length > 0, 'Phone contact must be displayed');
    await tracker.screenshot(page, 'D8.2_miniapp_am_card.png');
  });

  await tracker.runStep('D8.3', 'Telegram Direct Chat Action Handler Verification', async () => {
    const tgCheck = await page.evaluate(() => {
      let openedUrl = null;
      const originalOpen = window.open;
      window.open = (url) => { openedUrl = url; };

      const tgBtn = Array.from(document.querySelectorAll('button')).find(b => (b.innerText || '').includes('Telegram'));
      if (tgBtn) {
        tgBtn.click();
      } else if (typeof window.openTelegramContact === 'function') {
        window.openTelegramContact();
      }
      window.open = originalOpen;
      return openedUrl;
    });

    tracker.assert(tgCheck && tgCheck.startsWith('https://t.me/'), 'Telegram button must trigger t.me URL target');
    await tracker.screenshot(page, 'D8.3_miniapp_telegram_cta.png');
  });

  await tracker.runStep('D8.4', 'Telephone Call Action Protocol Verification', async () => {
    const telCheck = await page.evaluate(() => {
      const callBtn = Array.from(document.querySelectorAll('button')).find(b => (b.innerText || '').includes('Call'));
      const hasCallBtn = !!callBtn;
      const hasCallFunc = typeof window.callAM === 'function';

      return { hasCallBtn, hasCallFunc };
    });

    tracker.assert(telCheck.hasCallBtn, 'Call Account Manager CTA button must exist');
    tracker.assert(telCheck.hasCallFunc, 'window.callAM handler must be defined');
    await tracker.screenshot(page, 'D8.4_miniapp_call_am_cta.png');
  });

  await tracker.runStep('D8.5', 'Support Desk Info & Escalation Pathways', async () => {
    const ticketSection = await page.evaluate(() => {
      const form = document.querySelector('#pageContact form');
      const titles = Array.from(document.querySelectorAll('#pageContact .card-title')).map(t => t.textContent || '');
      const hasSupportTitle = titles.some(t => t.includes('Support') || t.includes('Ticket'));
      return {
        hasForm: form !== null,
        hasTitle: hasSupportTitle
      };
    });

    tracker.assert(ticketSection.hasForm, 'Support ticket form must be rendered under contact');
    tracker.assert(ticketSection.hasTitle, 'Support section title must be visible');
    await tracker.screenshot(page, 'D8.5_miniapp_support_pathways.png');
  });

  await tracker.runStep('D8.6', 'Responsive Viewport Contact Card Rendering', async () => {
    await page.setViewport({ width: 375, height: 812, isMobile: true });
    await wait(300);

    const layout = await page.evaluate(() => {
      const pageEl = document.getElementById('pageContact');
      const rect = pageEl ? pageEl.getBoundingClientRect() : null;
      return {
        width: rect ? rect.width : 0
      };
    });

    tracker.assert(layout.width <= 375, 'Contact page layout should fit within mobile viewport');
    await tracker.screenshot(page, 'D8.6_miniapp_contact_mobile_view.png');

    // Reset viewport to default
    await page.setViewport({ width: 1280, height: 800 });
  });

  return tracker.getSummary();
}

module.exports = { runPhaseD8 };
