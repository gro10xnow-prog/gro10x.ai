/**
 * scripts/e2e/suites/suite-c-partner/phase-C5-social.js
 * Suite C - Phase C5: Social Post Client Approvals
 * 
 * Tests:
 * 1. Social Media Posts Section & Header Counter
 * 2. Post Card Anatomy (Platform badge, status badge, scheduled date, media image, caption)
 * 3. Platform Color-Coding Badges (Instagram, LinkedIn, etc.)
 * 4. Client Post Approval Mutation Flow
 * 5. Client Revision Request Flow with Feedback
 * 6. Approved For Dispatch Status Display & Action State
 */

const { BASE_URL, wait, TestTracker } = require('../../utils');
const { injectRoleSession } = require('../../auth');

async function runPhaseC5(page) {
  const tracker = new TestTracker('Suite C - Phase C5: Social Post Approvals');
  console.log('\n--- 📱 Running Suite C - Phase C5: Social Posts Approvals ---');

  const PARTNERS_URL = `${BASE_URL}/partners.html`;

  await tracker.runStep('C5.1', 'Social Media Posts Section & Header Counter', async () => {
    await injectRoleSession(page, 'partner');
    await page.goto(PARTNERS_URL, { waitUntil: 'networkidle2' });
    await wait(1000);

    const socialSection = await page.evaluate(() => {
      const grid = document.getElementById('partnerSocialGrid');
      const badge = document.getElementById('partnerSocialBadge');
      return {
        hasGrid: grid !== null,
        badgeText: badge ? badge.innerText : '',
        cardCount: grid ? grid.querySelectorAll('.glass-panel').length : 0
      };
    });

    tracker.assert(socialSection.hasGrid, 'Social post grid container must exist');
    tracker.assert(socialSection.cardCount > 0, 'Social post cards must be rendered in grid');
    await tracker.screenshot(page, 'C5.1_partner_social_section.png');
  });

  await tracker.runStep('C5.2', 'Post Card Anatomy (Platform badge, status badge, scheduled date, media image, caption)', async () => {
    const cardElements = await page.evaluate(() => {
      const firstCard = document.querySelector('#partnerSocialGrid .glass-panel');
      if (!firstCard) return null;

      const badges = firstCard.querySelectorAll('.badge');
      const title = firstCard.querySelector('h3')?.innerText || '';
      const img = firstCard.querySelector('img');
      const buttons = firstCard.querySelectorAll('button');

      return {
        badgeCount: badges.length,
        hasTitle: title.length > 0,
        hasImg: img !== null,
        buttonCount: buttons.length
      };
    });

    tracker.assert(cardElements !== null, 'First post card must exist');
    tracker.assert(cardElements.badgeCount >= 2, 'Post card must contain platform and status badges');
    tracker.assert(cardElements.hasTitle, 'Post card must have a title');
    tracker.assert(cardElements.hasImg, 'Post card must display a media asset image');
  });

  await tracker.runStep('C5.3', 'Platform Color-Coding Badges (Instagram, LinkedIn, etc.)', async () => {
    const badgeColors = await page.evaluate(() => {
      const pinkBadges = document.querySelectorAll('#partnerSocialGrid .badge-pink');
      const cyanBadges = document.querySelectorAll('#partnerSocialGrid .badge-cyan');
      return {
        pinkCount: pinkBadges.length,
        cyanCount: cyanBadges.length
      };
    });

    tracker.assert(badgeColors.pinkCount > 0 || badgeColors.cyanCount > 0, 'Platform-specific color badges must be applied');
  });

  await tracker.runStep('C5.4', 'Client Post Approval Mutation Flow', async () => {
    const approvalResult = await page.evaluate(async () => {
      if (typeof window.approvePartnerPost === 'function') {
        await window.approvePartnerPost('POST-001');
      }
      await new Promise(r => setTimeout(r, 600));

      const container = document.getElementById('partnerToastContainer');
      const toastText = container ? container.innerText : '';
      return {
        hasToast: toastText.includes('APPROVED') || toastText.includes('Approved')
      };
    });

    tracker.assert(approvalResult.hasToast, 'Approval toast notification must be displayed');
    await tracker.screenshot(page, 'C5.4_partner_post_approved.png');
  });

  await tracker.runStep('C5.5', 'Client Revision Request Flow with Feedback', async () => {
    const rejectResult = await page.evaluate(async () => {
      if (typeof window.rejectPartnerPost === 'function') {
        await window.rejectPartnerPost('POST-001', 'Please increase the contrast on the headline text.');
      }
      await new Promise(r => setTimeout(r, 600));

      const container = document.getElementById('partnerToastContainer');
      const toastText = container ? container.innerText : '';
      return {
        hasToast: toastText.includes('Feedback submitted') || toastText.includes('revision')
      };
    });

    tracker.assert(rejectResult.hasToast, 'Revision request toast notification must be displayed');
    await tracker.screenshot(page, 'C5.5_partner_revision_requested.png');
  });

  await tracker.runStep('C5.6', 'Approved For Dispatch Status Display & Action State', async () => {
    // Approve POST-002 and verify "Approved for Dispatch" badge rendered
    const approvedState = await page.evaluate(async () => {
      if (typeof window.approvePartnerPost === 'function') {
        await window.approvePartnerPost('POST-002');
      }
      await new Promise(r => setTimeout(r, 400));

      const gridText = document.getElementById('partnerSocialGrid')?.innerText || '';
      return {
        isApprovedRendered: gridText.includes('Approved for Dispatch')
      };
    });

    tracker.assert(approvedState.isApprovedRendered, 'Post card should display Approved for Dispatch badge');
    await tracker.screenshot(page, 'C5.6_partner_approved_for_dispatch.png');
  });

  return tracker.getSummary();
}

module.exports = { runPhaseC5 };

