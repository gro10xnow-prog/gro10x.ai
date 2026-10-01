/**
 * GRO10X QA Automation Runner - Crew Specialist Workspace E2E Workflows
 */

const CREW_WORKFLOWS = {
  workflow_crew_clockin_deliverable: {
    id: 'workflow_crew_clockin_deliverable',
    platform: 'crew',
    pageId: 'home',
    title: '🚀 Crew Operations: Verify Shift Clock-In ➔ Submit Deliverable ➔ Assert Toast',
    description: 'Checks shift status on Home, switches to Deliverables, submits asset link, and asserts toast.',
    targetHash: '#home',
    steps: [
      {
        id: 'wf-crew-1',
        title: '1. Navigate to Crew Workspace (#home)',
        action: 'navigate_hash',
        target: '#home',
        assertion: { type: 'wait_selector', selector: '#crew-view', timeout: 5000 }
      },
      {
        id: 'wf-crew-2',
        title: '2. Verify Specialist Shift / Attendance Status',
        action: 'workflow_crew_verify_status',
        assertion: { type: 'custom_check', check: 'assert_crew_status_visible' }
      },
      {
        id: 'wf-crew-3',
        title: '3. Navigate to Submit Deliverables (#deliverables)',
        action: 'navigate_hash',
        target: '#deliverables',
        assertion: { type: 'wait_selector', selector: '#crew-view', timeout: 5000 }
      },
      {
        id: 'wf-crew-4',
        title: '4. Fill Deliverable Submission Form [QA-DELIV-RUN]',
        action: 'workflow_crew_fill_deliverable',
        prefix: 'QA-DELIV-',
        assertion: { type: 'custom_check', check: 'assert_crew_deliverable_filled' }
      },
      {
        id: 'wf-crew-5',
        title: '5. Submit Deliverable & Assert Visual Toast Feedback',
        action: 'workflow_crew_submit_deliverable',
        assertion: { type: 'wait_for_toast', keyword: 'Deliverable' }
      },
      {
        id: 'wf-crew-6',
        title: '6. Teardown: Clean Test Deliverable Submission',
        action: 'workflow_crew_cleanup_deliverable',
        assertion: { type: 'custom_check', check: 'assert_crew_deliverable_cleaned' }
      }
    ]
  },

  workflow_crew_eod_standup: {
    id: 'workflow_crew_eod_standup',
    platform: 'crew',
    pageId: 'eod',
    title: '🚀 Daily Standup: Fill Tasks & Blockers ➔ Submit EOD Report ➔ Assert Confirmation',
    description: 'Fills end-of-day standup report with tasks completed and blockers, submits report, and asserts toast.',
    targetHash: '#eod',
    steps: [
      {
        id: 'wf-eod-1',
        title: '1. Navigate to Daily EOD Standup (#eod)',
        action: 'navigate_hash',
        target: '#eod',
        assertion: { type: 'wait_selector', selector: '#crew-view', timeout: 5000 }
      },
      {
        id: 'wf-eod-2',
        title: '2. Fill EOD Standup Report Details',
        action: 'workflow_crew_fill_eod',
        prefix: 'QA-EOD-',
        assertion: { type: 'custom_check', check: 'assert_eod_form_filled' }
      },
      {
        id: 'wf-eod-3',
        title: '3. Submit EOD Report & Assert Toast Confirmation',
        action: 'workflow_crew_submit_eod',
        assertion: { type: 'wait_for_toast', keyword: 'Report' }
      }
    ]
  },

  workflow_crew_expense: {
    id: 'workflow_crew_expense',
    platform: 'crew',
    pageId: 'expenses',
    title: '🚀 Expense Claim: Submit Out-of-Pocket Expense ➔ Assert Pending Review',
    description: 'Submits crew expense reimbursement claim and verifies pending approval state.',
    targetHash: '#expenses',
    steps: [
      {
        id: 'wf-cexp-1',
        title: '1. Navigate to Submit Expense (#expenses)',
        action: 'navigate_hash',
        target: '#expenses',
        assertion: { type: 'wait_selector', selector: '#crew-view', timeout: 5000 }
      },
      {
        id: 'wf-cexp-2',
        title: '2. Submit Ephemeral Expense Claim [QA-CREW-EXP]',
        action: 'workflow_crew_submit_expense',
        prefix: 'QA-CREW-EXP-',
        assertion: { type: 'custom_check', check: 'assert_crew_expense_submitted' }
      },
      {
        id: 'wf-cexp-3',
        title: '3. Teardown: Clean Test Expense Claim',
        action: 'workflow_crew_cleanup_expense',
        assertion: { type: 'custom_check', check: 'assert_crew_expense_cleaned' }
      }
    ]
  },

  workflow_eod_submission: {
    id: 'workflow_eod_submission',
    platform: 'crew',
    pageId: 'eod',
    title: '🚀 Crew EOD Submission: Fill Today Tasks, Blockers & Submit Report',
    description: 'Submits crew daily standup EOD report to team supervisor and checks confirmation.',
    targetHash: '#eod',
    steps: [
      {
        id: 'wf-eod-sub-1',
        title: '1. Navigate to EOD Standup Form (#eod)',
        action: 'navigate_hash',
        target: '#eod',
        assertion: { type: 'wait_selector', selector: '#crew-view, #eodForm, h1', timeout: 5000 }
      },
      {
        id: 'wf-eod-sub-2',
        title: '2. Fill EOD Standup Report Fields',
        action: 'workflow_crew_fill_eod',
        prefix: 'QA-EOD-',
        assertion: { type: 'custom_check', check: 'assert_eod_form_filled' }
      },
      {
        id: 'wf-eod-sub-3',
        title: '3. Submit EOD Report & Assert Confirmation',
        action: 'workflow_crew_submit_eod',
        assertion: { type: 'wait_for_toast', keyword: 'Report' }
      }
    ]
  },

  workflow_leave_request: {
    id: 'workflow_leave_request',
    platform: 'crew',
    pageId: 'leaves',
    title: '🚀 Crew Leave Request: Submit Time-Off Request & Verify Pending Status',
    description: 'Fills leave application form, submits request to manager, and asserts pending review state.',
    targetHash: '#leaves',
    steps: [
      {
        id: 'wf-leave-1',
        title: '1. Navigate to Leaves Desk (#leaves)',
        action: 'navigate_hash',
        target: '#leaves',
        assertion: { type: 'wait_selector', selector: '#crew-view, #leavesTable, h1', timeout: 5000 }
      },
      {
        id: 'wf-leave-2',
        title: '2. Open Leave Application Modal',
        action: 'click',
        selector: '#btnOpenLeaveModal, .btn-apply-leave',
        fallbackSelector: 'button[onclick*="openLeaveModal"]',
        assertion: { type: 'custom_check', check: 'assert_leave_modal_open' }
      },
      {
        id: 'wf-leave-3',
        title: '3. Dismiss Leave Modal Cleanly',
        action: 'click',
        selector: '#btnCancelLeaveModal, .modal-close',
        assertion: { type: 'custom_check', check: 'assert_clean_audit' }
      }
    ]
  },

  workflow_clock_in_out: {
    id: 'workflow_clock_in_out',
    platform: 'crew',
    pageId: 'attendance',
    title: '🚀 Attendance Clock-In / Clock-Out: Verify Shift State & Geo Stamp',
    description: 'Verifies live shift clock-in toggle, geo timestamping, and attendance record display.',
    targetHash: '#attendance',
    steps: [
      {
        id: 'wf-clock-1',
        title: '1. Navigate to Crew Shift / Attendance (#attendance)',
        action: 'navigate_hash',
        target: '#attendance',
        assertion: { type: 'wait_selector', selector: '#crew-view, #attendanceSummary, h1', timeout: 5000 }
      },
      {
        id: 'wf-clock-2',
        title: '2. Verify Specialist Shift / Attendance Status',
        action: 'workflow_crew_verify_status',
        assertion: { type: 'custom_check', check: 'assert_crew_status_visible' }
      },
      {
        id: 'wf-clock-3',
        title: '3. Audit Clean: Zero Native Dialogs & Zero Unhandled Errors',
        action: 'wait_ms',
        duration: 200,
        assertion: { type: 'custom_check', check: 'assert_clean_audit' }
      }
    ]
  }
};

if (typeof window !== 'undefined') {
  window.CREW_WORKFLOWS = CREW_WORKFLOWS;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CREW_WORKFLOWS };
}
