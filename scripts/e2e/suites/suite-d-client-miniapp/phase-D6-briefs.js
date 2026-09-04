/**
 * scripts/e2e/suites/suite-d-client-miniapp/phase-D6-briefs.js
 * Suite D - Phase D6: Campaign Brief Submissions
 * 
 * Tests:
 * 1. Quick Action "New Brief" CTA Button Presence on Home
 * 2. Open Campaign Brief Modal Flow (openBriefModal)
 * 3. Brief Modal Form Controls & Service Categories
 * 4. Populate Campaign Brief Details
 * 5. Submit Campaign Brief Mutation Flow (submitMiniBrief)
 * 6. Modal Dismissal & Teardown Flow (closeBriefModal)
 */

const { BASE_URL, wait, TestTracker } = require('../../utils');
const { injectRoleSession } = require('../../auth');

async function runPhaseD6(page) {
  const tracker = new TestTracker('Suite D - Phase D6: Campaign Brief Submissions');
  console.log('\n--- 📋 Running Suite D - Phase D6: Campaign Briefs ---');

  const MINIAPP_URL = `${BASE_URL}/client-miniapp.html`;

  await tracker.runStep('D6.1', 'Quick Action "New Brief" CTA Button Presence on Home', async () => {
    await injectRoleSession(page, 'client');
    await page.goto(MINIAPP_URL, { waitUntil: 'networkidle2' });
    await wait(1000);

    const hasCta = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('.qa-btn'));
      const briefBtn = btns.find(b => b.innerText.includes('New Brief'));
      return briefBtn !== undefined;
    });

    tracker.assert(hasCta, 'New Brief quick action button must be rendered on home page');
    await tracker.screenshot(page, 'D6.1_miniapp_brief_cta.png');
  });

  await tracker.runStep('D6.2', 'Open Campaign Brief Modal Flow (openBriefModal)', async () => {
    const isOpened = await page.evaluate(() => {
      if (typeof window.openBriefModal === 'function') {
        window.openBriefModal();
      }
      const overlay = document.getElementById('miniBriefOverlay');
      return overlay && overlay.style.display !== 'none';
    });

    tracker.assert(isOpened, 'Campaign brief modal overlay must be displayed');
    await tracker.screenshot(page, 'D6.2_miniapp_brief_modal_opened.png');
  });

  await tracker.runStep('D6.3', 'Brief Modal Form Controls & Service Categories', async () => {
    const controls = await page.evaluate(() => {
      const title = document.getElementById('briefTitle');
      const service = document.getElementById('briefService');
      const notes = document.getElementById('briefNotes');
      const opts = service ? Array.from(service.options).map(o => o.value) : [];
      return {
        hasTitle: title !== null,
        hasService: service !== null,
        hasNotes: notes !== null,
        optionCount: opts.length
      };
    });

    tracker.assert(controls.hasTitle, 'Brief title input must exist');
    tracker.assert(controls.hasService, 'Service category selector must exist');
    tracker.assert(controls.hasNotes, 'Notes textarea must exist');
    tracker.assert(controls.optionCount >= 4, 'Must offer multiple agency service categories');
  });

  await tracker.runStep('D6.4', 'Populate Campaign Brief Details', async () => {
    const populated = await page.evaluate(() => {
      const title = document.getElementById('briefTitle');
      const notes = document.getElementById('briefNotes');
      if (title) title.value = 'Q4 Festival Digital Video Ad Commercial';
      if (notes) notes.value = 'Focus on young urban creators. Target deliverable: 45s TVC cut + 3x 15s reels.';
      return {
        title: title ? title.value : '',
        notes: notes ? notes.value : ''
      };
    });

    tracker.assert(populated.title.includes('Q4 Festival'), 'Title field should be populated');
    tracker.assert(populated.notes.includes('TVC cut'), 'Notes field should be populated');
    await tracker.screenshot(page, 'D6.4_miniapp_brief_populated.png');
  });

  await tracker.runStep('D6.5', 'Submit Campaign Brief Mutation Flow (submitMiniBrief)', async () => {
    const submitDone = await page.evaluate(async () => {
      if (typeof window.submitMiniBrief === 'function') {
        await window.submitMiniBrief();
      }
      await new Promise(r => setTimeout(r, 600));

      const overlay = document.getElementById('miniBriefOverlay');
      const isClosed = overlay ? overlay.style.display === 'none' : false;
      const successToast = document.getElementById('successOverlay');
      const isToastActive = successToast && (successToast.classList.contains('visible') || successToast.classList.contains('active'));
      return { isClosed, isToastActive };
    });

    tracker.assert(submitDone.isClosed, 'Brief modal should close upon submission');
    tracker.assert(submitDone.isToastActive, 'Success notification overlay should be triggered');
    await tracker.screenshot(page, 'D6.5_miniapp_brief_submitted.png');
  });

  await tracker.runStep('D6.6', 'Modal Dismissal & Teardown Flow (closeBriefModal)', async () => {
    const modalDismissed = await page.evaluate(() => {
      if (typeof window.openBriefModal === 'function') window.openBriefModal();
      if (typeof window.closeBriefModal === 'function') window.closeBriefModal();

      const overlay = document.getElementById('miniBriefOverlay');
      return overlay && overlay.style.display === 'none';
    });

    tracker.assert(modalDismissed, 'closeBriefModal should dismiss brief overlay immediately');
    await tracker.screenshot(page, 'D6.6_miniapp_brief_dismissed.png');
  });

  return tracker.getSummary();
}

module.exports = { runPhaseD6 };
