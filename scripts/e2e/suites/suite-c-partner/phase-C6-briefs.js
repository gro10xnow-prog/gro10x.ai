/**
 * scripts/e2e/suites/suite-c-partner/phase-C6-briefs.js
 * Suite C - Phase C6: Campaign Brief Submissions
 * 
 * Tests:
 * 1. Submit Campaign Brief Header CTA Button Presence
 * 2. Open Campaign Brief Modal Trigger Flow
 * 3. Brief Form Input Fields & Category Options
 * 4. Populate Campaign Brief Form Data
 * 5. Submit Campaign Brief Mutation & Task Creation
 * 6. Modal Dismissal & Notification Feedback
 */

const { BASE_URL, wait, TestTracker } = require('../../utils');
const { injectRoleSession } = require('../../auth');

async function runPhaseC6(page) {
  const tracker = new TestTracker('Suite C - Phase C6: Campaign Brief Submissions');
  console.log('\n--- 📋 Running Suite C - Phase C6: Campaign Briefs ---');

  const PARTNERS_URL = `${BASE_URL}/partners.html`;

  await tracker.runStep('C6.1', 'Submit Campaign Brief Header CTA Button Presence', async () => {
    await injectRoleSession(page, 'partner');
    await page.goto(PARTNERS_URL, { waitUntil: 'networkidle2' });
    await wait(1000);

    const hasCta = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const briefBtn = btns.find(b => b.innerText.includes('Submit Campaign Brief'));
      return briefBtn !== undefined;
    });

    tracker.assert(hasCta, '+ Submit Campaign Brief button must be rendered in header');
    await tracker.screenshot(page, 'C6.1_partner_brief_cta.png');
  });

  await tracker.runStep('C6.2', 'Open Campaign Brief Modal Trigger Flow', async () => {
    const modalOpened = await page.evaluate(() => {
      if (typeof window.openPartnerBriefModal === 'function') {
        window.openPartnerBriefModal();
      }
      const modal = document.getElementById('partnerBriefModal');
      return modal && modal.style.display !== 'none' && getComputedStyle(modal).display !== 'none';
    });

    tracker.assert(modalOpened, 'Campaign brief modal should be displayed when trigger is fired');
    await tracker.screenshot(page, 'C6.2_partner_brief_modal_opened.png');
  });

  await tracker.runStep('C6.3', 'Brief Form Input Fields & Category Options', async () => {
    const formFields = await page.evaluate(() => {
      const title = document.getElementById('briefTitleInput');
      const cat = document.getElementById('briefCategorySelect');
      const date = document.getElementById('briefDateInput');
      const budget = document.getElementById('briefBudgetInput');
      const desc = document.getElementById('briefDescInput');
      const options = cat ? Array.from(cat.options).map(o => o.value) : [];

      return {
        hasTitle: title !== null,
        hasCategory: cat !== null,
        hasDate: date !== null,
        hasBudget: budget !== null,
        hasDesc: desc !== null,
        optionCount: options.length
      };
    });

    tracker.assert(formFields.hasTitle, 'Brief title input must exist');
    tracker.assert(formFields.hasCategory, 'Service category select must exist');
    tracker.assert(formFields.hasDate, 'Target date input must exist');
    tracker.assert(formFields.hasBudget, 'Budget input must exist');
    tracker.assert(formFields.hasDesc, 'Description textarea must exist');
    tracker.assert(formFields.optionCount >= 4, 'Must offer multiple creative service categories');
  });

  await tracker.runStep('C6.4', 'Populate Campaign Brief Form Data', async () => {
    const populated = await page.evaluate(() => {
      const title = document.getElementById('briefTitleInput');
      const budget = document.getElementById('briefBudgetInput');
      const desc = document.getElementById('briefDescInput');

      if (title) title.value = 'Q4 Festive Brand Anthem & Digital Commercials';
      if (budget) budget.value = 'BDT 2,50,000';
      if (desc) desc.value = 'Comprehensive multi-channel brand launch targeting 2M+ impressions across Dhaka and regional hubs.';

      return {
        titleVal: title ? title.value : '',
        budgetVal: budget ? budget.value : ''
      };
    });

    tracker.assert(populated.titleVal.includes('Q4 Festive'), 'Title input should be populated');
    tracker.assert(populated.budgetVal.includes('2,50,000'), 'Budget input should be populated');
    await tracker.screenshot(page, 'C6.4_partner_brief_populated.png');
  });

  await tracker.runStep('C6.5', 'Submit Campaign Brief Mutation & Task Creation', async () => {
    const submitResult = await page.evaluate(async () => {
      if (typeof window.submitPartnerCampaignBrief === 'function') {
        await window.submitPartnerCampaignBrief(new Event('submit', { cancelable: true }));
      } else {
        const form = document.querySelector('#partnerBriefModal form');
        if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
      await new Promise(r => setTimeout(r, 600));

      const modal = document.getElementById('partnerBriefModal');
      const isClosed = modal ? (modal.style.display === 'none' || getComputedStyle(modal).display === 'none') : false;
      const toast = document.getElementById('partnerToastContainer')?.innerText || '';
      return { isClosed, hasToast: toast.includes('Campaign Brief') || toast.includes('submitted') || toast.includes('registered') };
    });

    tracker.assert(submitResult.isClosed, 'Brief modal should close upon successful submission');
    tracker.assert(submitResult.hasToast, 'Success toast notification should confirm brief submission');
    await tracker.screenshot(page, 'C6.5_partner_brief_submitted.png');
  });

  await tracker.runStep('C6.6', 'Modal Dismissal & Notification Feedback', async () => {
    const dismissCheck = await page.evaluate(() => {
      if (typeof window.openPartnerBriefModal === 'function') window.openPartnerBriefModal();
      if (typeof window.closePartnerBriefModal === 'function') window.closePartnerBriefModal();

      const modal = document.getElementById('partnerBriefModal');
      return modal && (modal.style.display === 'none' || getComputedStyle(modal).display === 'none');
    });

    tracker.assert(dismissCheck, 'Modal close button must dismiss modal');
    await tracker.screenshot(page, 'C6.6_partner_brief_dismissed.png');
  });

  return tracker.getSummary();
}

module.exports = { runPhaseC6 };

