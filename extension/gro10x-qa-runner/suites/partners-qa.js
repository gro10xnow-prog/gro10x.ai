/**
 * Production Enterprise Partner & Affiliate Growth Cockpit QA Automation Suite (10 Steps)
 * Covers deliverable review, affiliate cockpit tabs, attribution links, and payout modal (/partners.html)
 */

const PARTNERS_QA_SUITE = {
  id: 'partners',
  platform: 'partners',
  title: 'Enterprise Partner & Affiliate Growth Cockpit QA Suite',
  targetPath: '/partners.html',
  steps: [
    {
      id: 'step-1',
      title: '1. Navigate to Partner Workspace (/partners.html)',
      action: 'navigate_url',
      target: '/partners.html',
      assertion: { type: 'wait_selector', selector: '#partnerDeliverablesView, #tabBtnAffiliate', timeout: 5000 }
    },
    {
      id: 'step-2',
      title: '2. Verify Client Deliverables & Review Room Shell Rendered',
      action: 'wait_ms',
      duration: 500,
      assertion: { type: 'wait_selector', selector: '#tabBtnDeliverables', timeout: 3000 }
    },
    {
      id: 'step-3',
      title: '3. Switch to Partner & Affiliate Growth Cockpit Tab',
      action: 'click',
      selector: '#tabBtnAffiliate',
      assertion: { type: 'wait_selector', selector: '#affiliateCockpitView', timeout: 3000 }
    },
    {
      id: 'step-4',
      title: '4. Verify Affiliate Partner Identity & Unique Attribution Link',
      action: 'wait_ms',
      duration: 400,
      assertion: { type: 'wait_selector', selector: '#affiliateLinkInput', timeout: 3000 }
    },
    {
      id: 'step-5',
      title: '5. Verify Co-Branded White-Label Portal Route Link',
      action: 'wait_ms',
      duration: 300,
      assertion: { type: 'wait_selector', selector: '#whiteLabelLinkInput', timeout: 3000 }
    },
    {
      id: 'step-6',
      title: '6. Verify Funnel Performance Metric Tiles Strip',
      action: 'wait_ms',
      duration: 300,
      assertion: { type: 'wait_selector', selector: '#affMetricClicks, #affMetricLeads, #affMetricPending', timeout: 3000 }
    },
    {
      id: 'step-7',
      title: '7. Open Commission Payout Request Modal',
      action: 'click',
      selector: 'button[onclick*="openAffiliatePayoutModal"]',
      assertion: { type: 'wait_selector', selector: '#affiliatePayoutModal', timeout: 3000 }
    },
    {
      id: 'step-8',
      title: '8. Assert Minimum ৳5,000 Payout Threshold Input & Modal Controls',
      action: 'wait_ms',
      duration: 300,
      assertion: { type: 'wait_selector', selector: '#payoutAmountInput, #btnSubmitPayout', timeout: 3000 }
    },
    {
      id: 'step-9',
      title: '9. Close Payout Modal & Open Co-Branded Portal Live Preview',
      action: 'click',
      selector: '#affiliatePayoutModal button[onclick*="closeAffiliatePayoutModal"]',
      assertion: { type: 'wait_ms', duration: 200 }
    },
    {
      id: 'step-10',
      title: '10. Open White-Label Preview Modal & Verify Attribution Live Link',
      action: 'click',
      selector: 'button[onclick*="openWhiteLabelPreview"]',
      assertion: { type: 'wait_selector', selector: '#whiteLabelPreviewModal, #wlPreviewLiveBtn', timeout: 3000 }
    }
  ]
};

if (typeof window !== 'undefined') {
  window.PARTNERS_QA_SUITE = PARTNERS_QA_SUITE;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PARTNERS_QA_SUITE };
}
