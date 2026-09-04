/**
 * scripts/e2e/suites/suite-c-partner/phase-C3-reviews.js
 * Suite C - Phase C3: Partner Review Room Proofing & Cut Approvals
 * 
 * Tests:
 * 1. Partner Review Room Video Player & Deliverable Details
 * 2. Project Select Dropdown & Cut Switching
 * 3. Threaded Timestamped Feedback Notes Section
 * 4. Submit Timestamped Feedback Note Mutation
 * 5. Deliverable Cut Approval Double-Confirmation Flow
 * 6. Version Badge & Deliverable Status Indicators
 */

const { BASE_URL, wait, TestTracker } = require('../../utils');
const { injectRoleSession } = require('../../auth');

async function runPhaseC3(page) {
  const tracker = new TestTracker('Suite C - Phase C3: Partner Review Room');
  console.log('\n--- 🎬 Running Suite C - Phase C3: Review Room Deliverables & Proofing ---');

  const PARTNERS_URL = `${BASE_URL}/partners.html`;

  await tracker.runStep('C3.1', 'Partner Review Room Video Player & Deliverable Details', async () => {
    await injectRoleSession(page, 'partner');
    await page.goto(PARTNERS_URL, { waitUntil: 'networkidle2' });
    await wait(1200);

    const hasPlayer = await page.evaluate(() => {
      const video = document.getElementById('partnerVideo');
      const projName = document.getElementById('partnerProjName');
      return video !== null && projName !== null;
    });
    tracker.assert(hasPlayer, 'Video player and project title element must exist');

    await tracker.screenshot(page, 'C3.1_partner_video_player.png');
  });

  await tracker.runStep('C3.2', 'Project Select Dropdown & Cut Switching', async () => {
    const debug = await page.evaluate(() => {
      const sel = document.getElementById('partnerProjectSelect');
      return {
        hasSel: sel !== null,
        fnWin: typeof window.switchPartnerProject,
        fnGlobal: typeof switchPartnerProject,
        url: window.location.href,
        bodyLen: document.body.innerHTML.length
      };
    });
    console.log('DEBUG C3.2:', debug);

    tracker.assert(debug.hasSel, 'Project select dropdown must exist');
    tracker.assert(debug.fnWin === 'function' || debug.fnGlobal === 'function', 'switchPartnerProject must exist');
  });

  await tracker.runStep('C3.3', 'Threaded Timestamped Feedback Notes Section', async () => {
    const feedbackUi = await page.evaluate(() => {
      const list = document.getElementById('partnerCommentsList');
      const count = document.getElementById('partnerCommentCount');
      const input = document.getElementById('partnerNewComment');
      return { hasList: list !== null, countText: count ? count.textContent : '', hasInput: input !== null };
    });

    tracker.assert(feedbackUi.hasList && feedbackUi.hasInput, 'Feedback list and input field must be present');
    tracker.assert(feedbackUi.countText.includes('Notes') || feedbackUi.countText.length > 0, 'Comment count badge must be rendered');
  });

  await tracker.runStep('C3.4', 'Submit Timestamped Feedback Note Mutation', async () => {
    await page.evaluate(() => {
      const input = document.getElementById('partnerNewComment');
      if (input) {
        input.value = 'Great color grading on this cut. Approved for delivery!';
      }
    });
    await wait(200);

    // Call submitPartnerComment
    await page.evaluate(async () => {
      if (typeof window.submitPartnerComment === 'function') {
        await window.submitPartnerComment();
      }
    });
    await wait(600);

    await tracker.screenshot(page, 'C3.4_partner_comment_added.png');
  });

  await tracker.runStep('C3.5', 'Deliverable Cut Approval Double-Confirmation Flow', async () => {
    const btnTextBefore = await page.evaluate(() => {
      const btn = document.querySelector('button[onclick*="approvePartnerCut"]');
      return btn ? btn.textContent.trim() : '';
    });

    // First click triggers confirmation state
    await page.evaluate(() => {
      const btn = document.querySelector('button[onclick*="approvePartnerCut"]');
      if (btn) btn.click();
    });
    await wait(300);

    const isConfirming = await page.evaluate(() => {
      const btn = document.querySelector('button[onclick*="approvePartnerCut"]');
      return btn && (btn.textContent.includes('Confirm') || btn.dataset.confirming === 'true');
    });
    tracker.assert(isConfirming, 'Approve button must transition to confirmation state on first click');

    await tracker.screenshot(page, 'C3.5_partner_approval_confirm.png');
  });

  await tracker.runStep('C3.6', 'Version Badge & Deliverable Status Indicators', async () => {
    const verText = await page.evaluate(() => {
      return document.getElementById('partnerVerBadge')?.textContent || '';
    });
    tracker.assert(verText.length > 0, 'Active version badge must be rendered');
  });

  return tracker.getSummary();
}

module.exports = { runPhaseC3 };
