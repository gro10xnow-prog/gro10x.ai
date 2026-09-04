/**
 * scripts/e2e/suites/suite-g-public/phase-G2-lead-form.js
 * Suite G - Phase G2: Proposal Request & Lead Capture Form Automations
 * 
 * Tests:
 * G2.1: Verify Landing Page Strategy Audit Form Presence
 * G2.2: Populate Lead Information Form Fields
 * G2.3: Intercept and Validate /api/leads API POST on Form Submission
 * G2.4: Verify Success Feedback Banner & WhatsApp Fast-Track CTA Rendering
 * G2.5: Interactive Strategy Consultation Popup Modal Open & Pre-fill
 * G2.6: Modal Form Input Submission with Feedback Confirmation
 */

const { BASE_URL, wait, TestTracker } = require('../../utils');

async function runPhaseG2(page) {
  const tracker = new TestTracker('Suite G - Phase G2: Lead Capture Forms');
  console.log('\n--- 📝 Running Suite G - Phase G2: Lead Capture Forms ---');

  await tracker.runStep('G2.1', 'Verify Landing Page Strategy Audit Form Presence', async () => {
    const form = await page.$('#landingLeadForm');
    tracker.assert(form !== null, 'Landing lead form (#landingLeadForm) should exist');

    const hasName = await page.$('#leadName');
    const hasEmail = await page.$('#leadEmail');
    const hasPhone = await page.$('#leadPhone');
    const hasService = await page.$('#leadService');
    const hasNotes = await page.$('#leadNotes');
    const hasSubmit = await page.$('#btnSubmitLead');

    tracker.assert(!!hasName, 'Name input #leadName missing');
    tracker.assert(!!hasEmail, 'Email input #leadEmail missing');
    tracker.assert(!!hasPhone, 'Phone input #leadPhone missing');
    tracker.assert(!!hasService, 'Service select #leadService missing');
    tracker.assert(!!hasNotes, 'Notes textarea #leadNotes missing');
    tracker.assert(!!hasSubmit, 'Submit button #btnSubmitLead missing');

    await tracker.screenshot(page, 'G2.1_landing_lead_form.png');
  });

  await tracker.runStep('G2.2', 'Populate Lead Information Form Fields', async () => {
    // Scroll form into view
    await page.evaluate(() => {
      document.getElementById('landingLeadForm').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    await wait(400);

    await page.type('#leadName', 'Automated E2E Evaluator');
    await page.type('#leadEmail', 'e2e-evaluator@gro10x.ai');
    await page.type('#leadPhone', '+8801708459008');
    await page.select('#leadService', 'Transactional Setup');
    await page.type('#leadNotes', 'End-to-end automated verification request for agency retainer workflows.');

    const nameVal = await page.$eval('#leadName', el => el.value);
    tracker.assertEqual(nameVal, 'Automated E2E Evaluator', 'Name input value mismatch');
  });

  await tracker.runStep('G2.3', 'Intercept and Validate /api/leads API POST on Form Submission', async () => {
    let capturedReq = null;
    let capturedRes = null;

    const reqPromise = page.waitForRequest(req => req.url().includes('/api/leads') && req.method() === 'POST', { timeout: 8000 }).catch(() => null);
    const resPromise = page.waitForResponse(res => res.url().includes('/api/leads') && res.request().method() === 'POST', { timeout: 8000 }).catch(() => null);

    await page.click('#btnSubmitLead');

    capturedReq = await reqPromise;
    capturedRes = await resPromise;

    tracker.assert(capturedReq !== null, 'Should have sent POST /api/leads request');
    const postData = JSON.parse(capturedReq.postData());
    tracker.assertEqual(postData.name, 'Automated E2E Evaluator', 'POST payload name mismatch');
    tracker.assert(postData.email.includes('e2e-evaluator'), 'POST payload email mismatch');

    if (capturedRes) {
      tracker.assert(capturedRes.status() < 400, `POST /api/leads responded with error ${capturedRes.status()}`);
    }
  });

  await tracker.runStep('G2.4', 'Verify Success Feedback Banner & WhatsApp Fast-Track CTA Rendering', async () => {
    await wait(600);
    const feedbackText = await page.$eval('#leadFormFeedback', el => el.textContent.trim());
    tracker.assert(feedbackText.includes('Request Received') || feedbackText.includes('Saved') || feedbackText.includes('WhatsApp'), 'Feedback banner should display confirmation message, got: ' + feedbackText);

    const waLink = await page.$('#leadFormFeedback a[href*="wa.me"]');
    tracker.assert(!!waLink, 'WhatsApp fast-track link should be rendered in feedback banner');

    await tracker.screenshot(page, 'G2.4_lead_submitted_feedback.png');
  });

  await tracker.runStep('G2.5', 'Interactive Strategy Consultation Popup Modal Open & Pre-fill', async () => {
    // Open modal with specific service interest
    await page.evaluate(() => window.openLeadModal('AI Mobile Apps'));
    await wait(400);

    const isOverlayOpen = await page.$eval('#leadModalOverlay', el => el.style.display !== 'none');
    tracker.assert(isOverlayOpen, 'Lead modal overlay should be open');

    const modalTitle = await page.$eval('#leadModalTitle', el => el.textContent.trim());
    tracker.assert(modalTitle.includes('AI Mobile Apps') || modalTitle.includes('Book Your AI Setup'), 'Modal title should reflect service interest');

    await tracker.screenshot(page, 'G2.5_modal_open.png');
  });

  await tracker.runStep('G2.6', 'Modal Form Input Submission with Feedback Confirmation', async () => {
    await page.type('#modalLeadName', 'Modal Test Client');
    await page.type('#modalLeadEmail', 'modal-client@gro10x.ai');
    await page.type('#modalLeadPhone', '+8801900000000');
    await page.type('#modalLeadNotes', 'Mobile App automated booking inquiry.');

    // Submit modal form
    await page.click('#modalLeadForm button[type="submit"]');
    await page.waitForFunction(() => {
      const el = document.getElementById('modalLeadFeedback');
      return el && el.style.display !== 'none' && el.textContent.trim().length > 0;
    }, { timeout: 8000 });

    const modalFeedback = await page.$eval('#modalLeadFeedback', el => el.textContent.trim());
    tracker.assert(modalFeedback.includes('Booked') || modalFeedback.includes('WhatsApp') || modalFeedback.includes('Saved'), 'Modal feedback should display confirmation message');

    // Dismiss modal
    await page.click('.pb-modal-close');
    await wait(300);

    const isClosed = await page.$eval('#leadModalOverlay', el => el.style.display === 'none');
    tracker.assert(isClosed, 'Modal should close cleanly');
  });

  return tracker.getSummary();
}

module.exports = { runPhaseG2 };
