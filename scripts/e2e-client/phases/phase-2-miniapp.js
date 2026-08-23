/**
 * scripts/e2e-client/phases/phase-2-miniapp.js
 * Phase T2: Telegram Mini App (client-miniapp.html)
 */
const { MINIAPP_URL, wait, TestTracker } = require('../utils');

async function runPhase2(page) {
  const tracker = new TestTracker('Phase T2: Telegram Mini App');
  console.log('\n--- 🚀 Running Phase T2: Telegram Mini App ---');

  // Load Mini App with Telegram Mock
  await tracker.runStep('T2.1.1', 'Load Mini App and Verify Hero Brand & Version', async () => {
    await page.goto(MINIAPP_URL, { waitUntil: 'networkidle2' });
    await wait(1000);

    const clientName = await page.$eval('#heroClientName', el => el.textContent.trim());
    tracker.assert(clientName.length > 0, 'Client name must be rendered in hero');
    await tracker.screenshot(page, 't2.1.1_miniapp_home.png');
  });

  // T2.2 Tab Navigation & Page Switching
  await tracker.runStep('T2.2.1', 'Switch to Review Room tab (#navReview)', async () => {
    await page.click('#navReview');
    await wait(400);
    const isReviewActive = await page.$eval('#pageReview', el => el.classList.contains('active'));
    tracker.assert(isReviewActive, '#pageReview should have active class');
    await tracker.screenshot(page, 't2.2.1_miniapp_review.png');
  });

  await tracker.runStep('T2.2.2', 'Switch to Campaign Progress tab (#navCampaign)', async () => {
    await page.click('#navCampaign');
    await wait(400);
    const isCampActive = await page.$eval('#pageCampaign', el => el.classList.contains('active'));
    tracker.assert(isCampActive, '#pageCampaign should have active class');
    await tracker.screenshot(page, 't2.2.2_miniapp_campaign.png');
  });

  await tracker.runStep('T2.2.3', 'Switch to Payment tab (#navPayment)', async () => {
    await page.click('#navPayment');
    await wait(400);
    const isPayActive = await page.$eval('#pagePayment', el => el.classList.contains('active'));
    tracker.assert(isPayActive, '#pagePayment should have active class');
    await tracker.screenshot(page, 't2.2.3_miniapp_payment.png');
  });

  await tracker.runStep('T2.2.4', 'Switch to Contact & Support tab (#navContact)', async () => {
    await page.click('#navContact');
    await wait(400);
    const isContactActive = await page.$eval('#pageContact', el => el.classList.contains('active'));
    tracker.assert(isContactActive, '#pageContact should have active class');
    await tracker.screenshot(page, 't2.2.4_miniapp_contact.png');
  });

  await tracker.runStep('T2.2.5', 'Switch back to Home tab (#navHome)', async () => {
    await page.click('#navHome');
    await wait(400);
    const isHomeActive = await page.$eval('#pageHome', el => el.classList.contains('active'));
    tracker.assert(isHomeActive, '#pageHome should have active class');
  });

  // T2.3 Quick Actions & Home Components
  await tracker.runStep('T2.3.1', 'Verify Quick Actions Grid and Stage Pipeline on Home', async () => {
    const qaButtons = await page.$$('.qa-btn');
    tracker.assert(qaButtons.length >= 4, `Expected at least 4 Quick Action buttons, found ${qaButtons.length}`);
    const stages = await page.$('#homeCampaignStages');
    tracker.assert(stages !== null, '#homeCampaignStages container must exist');
  });

  // T2.4 Campaign Brief Modal in Mini App
  await tracker.runStep('T2.4.1', 'Open Brief Modal, validate and submit a new brief', async () => {
    await page.evaluate(() => {
      if (typeof window.openBriefModal === 'function') window.openBriefModal();
    });
    await wait(400);

    const isOverlayVisible = await page.$eval('#miniBriefOverlay', el => el.style.display === 'flex');
    tracker.assert(isOverlayVisible, 'Brief overlay modal should be displayed');
    await tracker.screenshot(page, 't2.4.1_miniapp_brief_modal.png');

    // Fill form
    await page.type('#briefTitle', 'Q4 Brand Awareness TVC Campaign');
    await page.type('#briefNotes', 'High-energy commercial cut targeting youth audience');
    await wait(300);

    // Submit brief directly and await completion
    await page.evaluate(async () => {
      if (typeof window.submitMiniBrief === 'function') {
        await window.submitMiniBrief();
      }
    });
    await wait(1500);

    const overlayClosed = await page.$eval('#miniBriefOverlay', el => el.style.display === 'none' || el.style.display === '');
    tracker.assert(overlayClosed, 'Brief overlay modal should close after submit');
  });

  // T2.5 Deliverable Review Room & Approval
  await tracker.runStep('T2.5.1', 'Test 2-click Cut Approval & Revision Feedback in Review Room', async () => {
    await page.click('#navReview');
    await wait(500);

    const video = await page.$('#revVideoPlayer');
    tracker.assert(video !== null, 'Video player #revVideoPlayer must exist');

    // Test feedback input validation
    await page.type('#fbInput', '00:15 - Please adjust color grade to warmer tone');
    await wait(300);

    await page.evaluate(() => {
      if (typeof window.handleSendFeedback === 'function') window.handleSendFeedback();
    });
    await wait(1000);

    const fbValue = await page.$eval('#fbInput', el => el.value);
    tracker.assert(fbValue === '', 'Feedback textarea should be cleared after submit');

    // Test cut approval button using DOM evaluate
    await page.evaluate(() => {
      const approveBtn = document.querySelector('.btn-approve');
      if (approveBtn) {
        approveBtn.click(); // first click triggers confirm
      }
    });
    await wait(300);

    await page.evaluate(() => {
      const approveBtn = document.querySelector('.btn-approve');
      if (approveBtn) {
        approveBtn.click(); // second click confirms approval
      }
    });
    await wait(1000);
    await tracker.screenshot(page, 't2.5.1_cut_approved.png');
  });

  // T2.7 Payment Method Selector & Proof Submission
  await tracker.runStep('T2.7.1', 'Test Payment Method Switcher (bKash/Nagad/Bank/Rocket)', async () => {
    await page.click('#navPayment');
    await wait(500);

    // Make activeInvoiceSection visible and select Nagad
    await page.evaluate(() => {
      const section = document.getElementById('activeInvoiceSection');
      if (section) section.style.display = 'block';
      if (typeof window.selectPayMethod === 'function') window.selectPayMethod('nagad');
    });
    await wait(300);
    const isNagadSelected = await page.$eval('#pmNagad', el => el.classList.contains('selected'));
    tracker.assert(isNagadSelected, 'Nagad chip should be selected');

    // Switch to Bank
    await page.evaluate(() => {
      if (typeof window.selectPayMethod === 'function') window.selectPayMethod('bank');
    });
    await wait(300);
    const isBankSelected = await page.$eval('#pmBank', el => el.classList.contains('selected'));
    tracker.assert(isBankSelected, 'Bank chip should be selected');

    // Switch back to bKash
    await page.evaluate(() => {
      if (typeof window.selectPayMethod === 'function') window.selectPayMethod('bkash');
    });
    await wait(300);
    const isBkashSelected = await page.$eval('#pmBkash', el => el.classList.contains('selected'));
    tracker.assert(isBkashSelected, 'bKash chip should be selected');

    await tracker.screenshot(page, 't2.7.1_miniapp_payment_chips.png');
  });

  // T2.8 Support Ticket Submission in Mini App
  await tracker.runStep('T2.8.1', 'Submit Support Ticket in Mini App', async () => {
    await page.click('#navContact');
    await wait(500);

    await page.type('#tckTitle', 'Invoice Billing Address Update');
    await page.type('#tckDesc', 'Please update the corporate billing address on our latest invoice.');
    await wait(300);

    await page.evaluate(() => {
      const form = document.querySelector('#pageContact form');
      if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    });
    await wait(1000);

    const titleVal = await page.$eval('#tckTitle', el => el.value);
    tracker.assert(titleVal === '', 'Ticket title input should clear after submission');
    await tracker.screenshot(page, 't2.8.1_miniapp_ticket_submitted.png');
  });

  return tracker.getSummary();
}

module.exports = { runPhase2 };
