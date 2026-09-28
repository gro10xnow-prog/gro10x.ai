/**
 * GRO10X QA Automation Runner - DCE, Partners & Public Micro-Apps E2E Workflows
 */

const DCE_WORKFLOWS = {
  workflow_dce_order_tracking: {
    id: 'workflow_dce_order_tracking',
    platform: 'dce',
    pageId: 'track',
    title: '🚀 Order Operations: Query Order ID ➔ Assert Fulfillment & Digital Download State',
    description: 'Queries customer order status and verifies digital download / license status in DOM.',
    targetPath: '/dce/track',
    steps: [
      {
        id: 'wf-dot-1',
        title: '1. Verify Order Tracking Page Loaded (/dce/track)',
        action: 'wait_selector',
        selector: '#orderSearchInput, input[type="text"]',
        timeout: 5000
      },
      {
        id: 'wf-dot-2',
        title: '2. Search Order ID & Assert Fulfillment Details',
        action: 'workflow_dce_query_order',
        orderId: 'ORD-98421',
        assertion: { type: 'custom_check', check: 'assert_order_tracking_results' }
      }
    ]
  },

  workflow_dce_affiliate_attribution: {
    id: 'workflow_dce_affiliate_attribution',
    platform: 'dce',
    pageId: 'affiliate',
    title: '🚀 Affiliate Growth: Generate Shortcode ➔ Simulate Referral Attribution',
    description: 'Generates affiliate short link, verifies click tracking counter and 15% commission tier.',
    targetPath: '/dce/affiliate',
    steps: [
      {
        id: 'wf-daa-1',
        title: '1. Verify Affiliate Portal Loaded (/dce/affiliate)',
        action: 'wait_selector',
        selector: '#affiliateLinkInput, h1, .affiliate-card',
        timeout: 5000
      },
      {
        id: 'wf-daa-2',
        title: '2. Verify Referral Link Generator & Commission Rates',
        action: 'workflow_dce_verify_affiliate_stats',
        assertion: { type: 'custom_check', check: 'assert_affiliate_portal_ready' }
      }
    ]
  },

  workflow_partner_cut_approval: {
    id: 'workflow_partner_cut_approval',
    platform: 'partners',
    pageId: 'deliverables',
    title: '🚀 Partner Approvals: Stream Video Cut ➔ Leave Timecoded Note ➔ Sign Off',
    description: 'Streams video cut in Review Room, leaves timecoded feedback, and clicks Approve Cut.',
    targetPath: '/partners.html',
    steps: [
      {
        id: 'wf-pca-1',
        title: '1. Verify Video Review Room Loaded (/partners.html)',
        action: 'wait_selector',
        selector: '#partnerVideo, video, #partnerDeliverablesView',
        timeout: 5000
      },
      {
        id: 'wf-pca-2',
        title: '2. Post Timecoded Feedback Note on Cut',
        action: 'workflow_partner_post_note',
        assertion: { type: 'custom_check', check: 'assert_partner_note_posted' }
      },
      {
        id: 'wf-pca-3',
        title: '3. Click Approve Cut for Production & Assert Badge',
        action: 'workflow_partner_approve_cut',
        assertion: { type: 'custom_check', check: 'assert_partner_cut_approved' }
      }
    ]
  },

  workflow_partner_payout_attribution: {
    id: 'workflow_partner_payout_attribution',
    platform: 'partners',
    pageId: 'affiliate',
    title: '🤝 Partner Growth: Verify Attribution Links ➔ Inspect Ledger ➔ Submit Payout',
    description: 'Validates partner attribution link, white-label portal URL, commission ledger, and minimum ৳5,000 payout modal.',
    targetPath: '/partners.html',
    steps: [
      {
        id: 'wf-ppa-1',
        title: '1. Switch to Partner Growth Cockpit (#tabBtnAffiliate)',
        action: 'click',
        selector: '#tabBtnAffiliate',
        assertion: { type: 'wait_selector', selector: '#affiliateCockpitView', timeout: 5000 }
      },
      {
        id: 'wf-ppa-2',
        title: '2. Verify Live Attribution Link and White-Label Portal Route',
        action: 'wait_selector',
        selector: '#affiliateLinkInput, #whiteLabelLinkInput',
        timeout: 4000
      },
      {
        id: 'wf-ppa-3',
        title: '3. Open Payout Modal and Verify Threshold Validation Controls',
        action: 'click',
        selector: 'button[onclick*="openAffiliatePayoutModal"]',
        assertion: { type: 'wait_selector', selector: '#affiliatePayoutModal, #btnSubmitPayout', timeout: 4000 }
      }
    ]
  },

  workflow_public_ai_audit_score: {
    id: 'workflow_public_ai_audit_score',
    platform: 'public',
    pageId: 'aiAudit',
    title: '🚀 Inbound Lead Engine: Complete AI Diagnostic Scorecard ➔ Assert Score & Report',
    description: 'Fills inbound AI readiness questionnaire and validates computed readiness score and agency pitch.',
    targetPath: '/ai-audit.html',
    steps: [
      {
        id: 'wf-pas-1',
        title: '1. Verify AI Diagnostic Questionnaire Loaded (/ai-audit.html)',
        action: 'wait_selector',
        selector: '#diagnosticForm, .question-card, h1',
        timeout: 5000
      },
      {
        id: 'wf-pas-2',
        title: '2. Complete 5-Pillar AI Readiness Questions',
        action: 'workflow_complete_ai_diagnostic',
        assertion: { type: 'custom_check', check: 'assert_ai_score_calculated' }
      }
    ]
  },

  workflow_contractor_defect_sla: {
    id: 'workflow_contractor_defect_sla',
    platform: 'public',
    pageId: 'contractor',
    title: '🚀 Subcontractor Gateway: Validate 24h SLA Defect Countdown & Masked Scope',
    description: 'Ensures external subcontractor view is strictly masked and displays the 24h SLA defect timer.',
    targetPath: '/contractor-view.html',
    steps: [
      {
        id: 'wf-cds-1',
        title: '1. Verify Subcontractor Scoped Gateway Loaded (/contractor-view.html)',
        action: 'wait_selector',
        selector: '#contractorView, h1, .contractor-header',
        timeout: 5000
      },
      {
        id: 'wf-cds-2',
        title: '2. Assert 24h SLA Defect Timer & Masked Financial Scope',
        action: 'workflow_assert_contractor_sla',
        assertion: { type: 'custom_check', check: 'assert_contractor_sla_active' }
      }
    ]
  }
};

if (typeof window !== 'undefined') {
  window.DCE_WORKFLOWS = DCE_WORKFLOWS;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DCE_WORKFLOWS };
}
