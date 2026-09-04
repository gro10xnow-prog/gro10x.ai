/**
 * scripts/e2e/suites/suite-d-client-miniapp/phase-D4-reviews.js
 * Suite D - Phase D4: Review Room & Deliverable Video Proofing
 * 
 * Tests:
 * 1. Navigate to Review Room Page & Active Tab Highlight
 * 2. Deliverable Video Player & 4K Quality Overlay
 * 3. Deliverable Video Title & Metadata Display
 * 4. Timestamped Feedback Input & Textarea Entry
 * 5. Send Revision Feedback Mutation
 * 6. Deliverable Cut Approval Double-Confirmation Flow
 */

const { BASE_URL, wait, TestTracker } = require('../../utils');
const { injectRoleSession } = require('../../auth');

async function runPhaseD4(page) {
  const tracker = new TestTracker('Suite D - Phase D4: Review Room Proofing');
  console.log('\n--- 🎬 Running Suite D - Phase D4: Deliverable Review Room ---');

  const MINIAPP_URL = `${BASE_URL}/client-miniapp.html`;

  await tracker.runStep('D4.1', 'Navigate to Review Room Page & Active Tab Highlight', async () => {
    await injectRoleSession(page, 'client');
    await page.goto(MINIAPP_URL, { waitUntil: 'networkidle2' });
    await wait(1000);

    const navSuccess = await page.evaluate(() => {
      if (typeof window.showPage === 'function') {
        window.showPage('pageReview');
      }
      const pageEl = document.getElementById('pageReview');
      const navBtn = document.getElementById('navReview');
      return {
        isPageActive: pageEl && pageEl.classList.contains('active'),
        isNavActive: navBtn && navBtn.classList.contains('active')
      };
    });

    tracker.assert(navSuccess.isPageActive, 'Review page should become active');
    tracker.assert(navSuccess.isNavActive, 'Review nav button should be highlighted active');
    await tracker.screenshot(page, 'D4.1_miniapp_review_page.png');
  });

  await tracker.runStep('D4.2', 'Deliverable Video Player & 4K Quality Overlay', async () => {
    const videoInfo = await page.evaluate(() => {
      const video = document.getElementById('revVideoPlayer');
      const overlay = document.querySelector('.video-overlay-label');
      return { hasVideo: video !== null, hasOverlay: overlay !== null && overlay.innerText.includes('4K') };
    });

    tracker.assert(videoInfo.hasVideo, 'Review video player element must exist');
    tracker.assert(videoInfo.hasOverlay, '4K Preview overlay badge must be displayed');
    await tracker.screenshot(page, 'D4.2_miniapp_video_player.png');
  });

  await tracker.runStep('D4.3', 'Deliverable Video Title & Metadata Display', async () => {
    const titleText = await page.evaluate(() => {
      return document.getElementById('reviewVideoTitle')?.innerText || '';
    });

    tracker.assert(titleText.length > 0, 'Review video title must be populated');
  });

  await tracker.runStep('D4.4', 'Timestamped Feedback Input & Textarea Entry', async () => {
    const feedbackInput = await page.evaluate(() => {
      const input = document.getElementById('fbInput');
      if (input) input.value = '00:15 – Please soften the background music audio ducking.';
      return { hasInput: input !== null, value: input ? input.value : '' };
    });

    tracker.assert(feedbackInput.hasInput, 'Feedback textarea must exist');
    tracker.assert(feedbackInput.value.includes('00:15'), 'Feedback textarea should accept typed timestamped notes');
  });

  await tracker.runStep('D4.5', 'Send Revision Feedback Mutation', async () => {
    const sent = await page.evaluate(async () => {
      if (typeof window.handleSendFeedback === 'function') {
        await window.handleSendFeedback();
      }
      const overlay = document.getElementById('successOverlay');
      const isOverlayActive = overlay && (overlay.classList.contains('active') || overlay.style.display !== 'none');
      const sub = document.getElementById('successSub')?.innerText || '';
      return { isOverlayActive, sub };
    });

    tracker.assert(sent.isOverlayActive || sent.sub.length > 0, 'Success feedback overlay must be triggered upon sending revision notes');
    await tracker.screenshot(page, 'D4.5_miniapp_feedback_sent.png');
    await wait(600);
  });

  await tracker.runStep('D4.6', 'Deliverable Cut Approval Double-Confirmation Flow', async () => {
    // 1st click: prompts confirmation
    const firstClick = await page.evaluate(() => {
      const btn = document.querySelector('#revApproveSection .btn-approve');
      if (btn && typeof window.handleApproveCut === 'function') {
        window.handleApproveCut(btn);
      }
      return { text: btn ? btn.innerText : '', isConfirming: btn ? btn.dataset.confirming === 'true' : false };
    });

    tracker.assert(firstClick.isConfirming, 'First click on approve button must activate confirmation mode');

    // 2nd click: executes cut approval
    const secondClick = await page.evaluate(async () => {
      const btn = document.querySelector('#revApproveSection .btn-approve');
      if (btn && typeof window.handleApproveCut === 'function') {
        await window.handleApproveCut(btn);
      }
      await new Promise(r => setTimeout(r, 600));

      const sectionText = document.getElementById('revApproveSection')?.innerText || '';
      return { isApproved: sectionText.includes('Cut Approved') };
    });

    tracker.assert(secondClick.isApproved, 'Double-confirmation should approve the cut and update section status');
    await tracker.screenshot(page, 'D4.6_miniapp_cut_approved.png');
  });

  return tracker.getSummary();
}

module.exports = { runPhaseD4 };
