/**
 * GRO10X QA Automation Runner - Client Portal E2E Workflows
 */

const CLIENT_WORKFLOWS = {
  workflow_client_brief: {
    id: 'workflow_client_brief',
    platform: 'client',
    pageId: 'brief',
    title: '🚀 Intake Brief: Submit Campaign Scope ➔ Assert Toast & Pending Badge',
    description: 'Fills client campaign brief, submits form, and asserts visual confirmation toast.',
    targetHash: '#brief',
    steps: [
      {
        id: 'wf-cb-1',
        title: '1. Navigate to Submit Brief (#brief)',
        action: 'navigate_hash',
        target: '#brief',
        assertion: { type: 'wait_selector', selector: '#client-view, h2', timeout: 5000 }
      },
      {
        id: 'wf-cb-2',
        title: '2. Fill Campaign Brief Details [QA-BRIEF-RUN]',
        action: 'workflow_client_fill_brief',
        prefix: 'QA-BRIEF-',
        assertion: { type: 'custom_check', check: 'assert_brief_form_filled' }
      },
      {
        id: 'wf-cb-3',
        title: '3. Submit Brief & Assert Visual Confirmation Toast',
        action: 'workflow_client_submit_brief',
        assertion: { type: 'wait_for_toast', keyword: 'Brief' }
      },
      {
        id: 'wf-cb-4',
        title: '4. Assert Canonical Redirection to Home (#home) & Nav Sync',
        action: 'workflow_assert_home_sync',
        target: '#home',
        assertion: { type: 'custom_check', check: 'assert_client_route_sync' }
      },
      {
        id: 'wf-cb-5',
        title: '5. Teardown: Clean Test Brief Submission',
        action: 'workflow_client_cleanup_brief',
        assertion: { type: 'custom_check', check: 'assert_brief_cleaned_up' }
      }
    ]
  },

  workflow_client_review_lockin: {
    id: 'workflow_client_review_lockin',
    platform: 'client',
    pageId: 'review',
    title: '🚀 Review & Handover: Add Video Note ➔ Approve Cut ➔ Assert 30-Day Warranty Shield',
    description: 'Leaves frame-accurate feedback, signs off on deliverable cut, and validates the 30-day warranty countdown.',
    targetHash: '#review',
    steps: [
      {
        id: 'wf-crl-1',
        title: '1. Navigate to Content Review Room (#review)',
        action: 'navigate_hash',
        target: '#review',
        assertion: { type: 'wait_selector', selector: '#client-view, video, .review-container', timeout: 5000 }
      },
      {
        id: 'wf-crl-2',
        title: '2. Post Timecoded Feedback Note [QA-FEEDBACK-RUN]',
        action: 'workflow_client_post_feedback',
        assertion: { type: 'custom_check', check: 'assert_feedback_posted' }
      },
      {
        id: 'wf-crl-3',
        title: '3. Click Approve Cut & Sign Off Deliverable',
        action: 'workflow_client_approve_cut',
        assertion: { type: 'wait_for_toast', keyword: 'Approved' }
      },
      {
        id: 'wf-crl-4',
        title: '4. Navigate to Sprint Lock-In (#lockin)',
        action: 'navigate_hash',
        target: '#lockin',
        assertion: { type: 'wait_selector', selector: '#client-view', timeout: 5000 }
      },
      {
        id: 'wf-crl-5',
        title: '5. Assert 30-Day Defect-Free Warranty Shield Countdown & SLA Banner',
        action: 'workflow_assert_warranty_shield',
        assertion: { type: 'custom_check', check: 'assert_warranty_shield_active' }
      }
    ]
  },

  workflow_client_ticket: {
    id: 'workflow_client_ticket',
    platform: 'client',
    pageId: 'tickets',
    title: '🚀 Client Support: File Priority Revision Request ➔ Assert in Queue',
    description: 'Submits client revision/bug request and asserts ticket appears in table.',
    targetHash: '#tickets',
    steps: [
      {
        id: 'wf-ct-1',
        title: '1. Navigate to Support Requests (#tickets)',
        action: 'navigate_hash',
        target: '#tickets',
        assertion: { type: 'wait_selector', selector: '#client-view, table, .ticket-list', timeout: 5000 }
      },
      {
        id: 'wf-ct-2',
        title: '2. File Priority Support Request [QA-CLIENT-TCK]',
        action: 'workflow_client_create_ticket',
        prefix: 'QA-CLIENT-TCK-',
        assertion: { type: 'custom_check', check: 'assert_client_ticket_created' }
      },
      {
        id: 'wf-ct-3',
        title: '3. Teardown: Clean Test Support Request',
        action: 'workflow_client_cleanup_ticket',
        assertion: { type: 'custom_check', check: 'assert_client_ticket_cleaned_up' }
      }
    ]
  }
};

if (typeof window !== 'undefined') {
  window.CLIENT_WORKFLOWS = CLIENT_WORKFLOWS;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CLIENT_WORKFLOWS };
}
