/**
 * GRO10X QA Automation Runner - Public Portals & Micro-Apps E2E Workflows
 * Covers:
 * 1. Public Marketing Landing Page: Modal Lead Capture & Verification
 * 2. Interactive ROI Calculator: Live Savings Computation & Blueprint Claim
 * 3. AI Diagnostic Audit Tool: 4-Step Wizard, Readiness Scorecard & Zero Native Dialogs
 * 4. Subcontractor Scoped Gateway: Security Masking & 24h Defect SLA Timer
 */

const PUBLIC_WORKFLOWS = {
  workflow_public_lead_capture: {
    id: 'workflow_public_lead_capture',
    platform: 'public',
    pageId: 'landing',
    title: '🚀 Public Inbound Lead: Fill Modal Form ➔ Submit Lead ➔ Verify CRM Pipeline Sync',
    description: 'Triggers consultation modal on landing, submits ephemeral lead [QA-LEAD-TEST], verifies in-DOM confirmation, and cleans up.',
    targetPath: '/',
    steps: [
      {
        id: 'wf-plc-1',
        title: '1. Navigate to Marketing Landing Page (/)',
        action: 'wait_ms',
        duration: 400,
        assertion: { type: 'wait_selector', selector: '#hero, #topNav, h1', timeout: 5000 }
      },
      {
        id: 'wf-plc-2',
        title: '2. Open Book Consultation Lead Modal',
        action: 'click',
        selector: '#topNav button.pb-btn-primary, button[onclick*="openLeadModal"]',
        assertion: { type: 'modal_open', selector: '#leadModalOverlay' }
      },
      {
        id: 'wf-plc-3',
        title: '3. Fill Ephemeral Lead Details [QA-LEAD-TEST]',
        action: 'workflow_public_fill_lead_modal',
        prefix: 'QA-LEAD-TEST-',
        assertion: { type: 'custom_check', check: 'assert_lead_modal_filled' }
      },
      {
        id: 'wf-plc-4',
        title: '4. Submit Consultation Lead Form & Assert Confirmation',
        action: 'workflow_public_submit_lead_modal',
        assertion: { type: 'custom_check', check: 'assert_lead_modal_submitted' }
      },
      {
        id: 'wf-plc-5',
        title: '5. Teardown: Clean Test Lead Record',
        action: 'workflow_public_cleanup_lead',
        assertion: { type: 'custom_check', check: 'assert_lead_cleaned_up' }
      }
    ]
  },

  workflow_public_roi_calculator: {
    id: 'workflow_public_roi_calculator',
    platform: 'public',
    pageId: 'landing',
    title: '🚀 Interactive ROI Calculator: Adjust Hours & Team Size ➔ Verify Projected Savings',
    description: 'Scrolls to interactive ROI calculator, adjusts inputs, validates live mathematical recalculation, and triggers claim CTA.',
    targetPath: '/',
    steps: [
      {
        id: 'wf-roi-1',
        title: '1. Navigate & Scroll to ROI Calculator (#calculator)',
        action: 'scroll_to',
        selector: '#calculator, #roiCalculator',
        assertion: { type: 'element_exists', selector: '#calcSavingsDisplay, #calcHoursDisplay, #calcSpeedDisplay' }
      },
      {
        id: 'wf-roi-2',
        title: '2. Adjust Team Size & Manual Hours Sliders',
        action: 'workflow_public_adjust_roi',
        teamSize: 15,
        hoursPerWeek: 25,
        assertion: { type: 'custom_check', check: 'assert_roi_calculation_dynamic' }
      },
      {
        id: 'wf-roi-3',
        title: '3. Click Claim Blueprint & Verify Modal Prefill',
        action: 'workflow_public_claim_roi',
        assertion: { type: 'modal_open', selector: '#leadModalOverlay' }
      },
      {
        id: 'wf-roi-4',
        title: '4. Dismiss Prefilled Modal & Restore Baseline',
        action: 'click',
        selector: '#leadModalOverlay .pb-modal-close, button[onclick*="closeLeadModal"]',
        assertion: { type: 'modal_closed', selector: '#leadModalOverlay' }
      }
    ]
  },

  workflow_public_ai_audit_score: {
    id: 'workflow_public_ai_audit_score',
    platform: 'public',
    pageId: 'aiAudit',
    title: '🚀 AI Diagnostic Scorecard: Complete 4-Step Wizard ➔ Compute Readiness Score ➔ Verify Catalog Mapping',
    description: 'Executes 4-step diagnostic wizard, verifies dynamic maturity calculation, asserts canonical catalog mapping, and ensures zero native dialogs.',
    targetPath: '/ai-audit.html',
    steps: [
      {
        id: 'wf-ai-1',
        title: '1. Navigate to AI Diagnostic Audit Canvas (/ai-audit.html)',
        action: 'wait_ms',
        duration: 400,
        assertion: { type: 'wait_selector', selector: '#wizardCard, #stepperNav, #stepPanel1', timeout: 5000 }
      },
      {
        id: 'wf-ai-2',
        title: '2. Complete Step 1: Corporate Profile [QA-AUDIT-TEST]',
        action: 'input_text',
        selector: '#auditCompanyName',
        value: 'Apex Finance Corp [QA-AUDIT]',
        assertion: { type: 'input_value', selector: '#auditCompanyName', expected: 'Apex Finance Corp [QA-AUDIT]' }
      },
      {
        id: 'wf-ai-3',
        title: '3. Input Corporate Email & Technical Contact',
        action: 'input_text',
        selector: '#auditEmail',
        value: 'qa-audit@test.gro10x.ai',
        assertion: { type: 'input_value', selector: '#auditEmail', expected: 'qa-audit@test.gro10x.ai' }
      },
      {
        id: 'wf-ai-4',
        title: '4. Advance Wizard through Architecture & Tech Stack Steps',
        action: 'workflow_complete_ai_diagnostic',
        assertion: { type: 'custom_check', check: 'assert_ai_wizard_completed' }
      },
      {
        id: 'wf-ai-5',
        title: '5. Submit Diagnostic & Compute Readiness Scorecard',
        action: 'click',
        selector: '#btnSubmitAudit, button[onclick*="submitDiagnosticAudit"]',
        assertion: { type: 'wait_selector', selector: '#scorecardResult, #resScoreNum', timeout: 6000 }
      },
      {
        id: 'wf-ai-6',
        title: '6. Assert Canonical Catalog Mapping & Consultation Button',
        action: 'wait_ms',
        duration: 400,
        assertion: { type: 'custom_check', check: 'assert_ai_scorecard_gauge_rendered' }
      },
      {
        id: 'wf-ai-7',
        title: '7. Integrity Audit: Zero Native Dialogs (Banner Enforcement)',
        action: 'wait_ms',
        duration: 200,
        assertion: { type: 'custom_check', check: 'assert_clean_audit' }
      },
      {
        id: 'wf-ai-8',
        title: '8. Teardown: Clean Ephemeral Diagnostic Fixture',
        action: 'workflow_public_cleanup_lead',
        assertion: { type: 'custom_check', check: 'assert_lead_cleaned_up' }
      }
    ]
  },

  workflow_contractor_defect_sla: {
    id: 'workflow_contractor_defect_sla',
    platform: 'public',
    pageId: 'contractor',
    title: '🚀 Subcontractor Gateway: Security Masking ➔ Verify 24h Defect SLA Timer',
    description: 'Verifies subcontractor confidential data isolation and 24h defect resolution SLA countdown timer.',
    targetPath: '/contractor-view.html',
    steps: [
      {
        id: 'wf-sla-1',
        title: '1. Navigate to Subcontractor Scoped Gateway (/contractor-view.html)',
        action: 'wait_ms',
        duration: 400,
        assertion: { type: 'wait_selector', selector: '.security-banner, .masking-pill, .contractor-badge, h1', timeout: 5000 }
      },
      {
        id: 'wf-sla-2',
        title: '2. Verify Financial Confidentiality Shield (Zero Leaks)',
        action: 'wait_ms',
        duration: 300,
        assertion: { type: 'custom_check', check: 'assert_contractor_masking' }
      },
      {
        id: 'wf-sla-3',
        title: '3. Verify 24h Defect Resolution SLA Timer Active',
        action: 'workflow_assert_contractor_sla',
        assertion: { type: 'custom_check', check: 'assert_contractor_sla_active' }
      },
      {
        id: 'wf-sla-4',
        title: '4. Integrity Audit: Clean Console & Zero Native Dialogs',
        action: 'wait_ms',
        duration: 200,
        assertion: { type: 'custom_check', check: 'assert_clean_audit' }
      }
    ]
  },

  workflow_public_proposal_lifecycle: {
    id: 'workflow_public_proposal_lifecycle',
    platform: 'public',
    pageId: 'proposal',
    title: '🚀 Public Proposal Lifecycle: Load Institutional SOW ➔ View Counter Sync ➔ Acceptance Gate',
    description: 'Validates public proposal rail for National Housing Finance SOW, asserts view counter increment, opens acceptance modal, and ensures zero native dialogs.',
    targetPath: '/proposal.html?token=nhf-enterprise-ai-2026',
    steps: [
      {
        id: 'wf-ppl-1',
        title: '1. Load Public Proposal Rail for National Housing Finance SOW',
        action: 'wait_ms',
        duration: 400,
        assertion: { type: 'wait_selector', selector: '#proposalStatusBadge, #btnAcceptProposal, h1', timeout: 5000 }
      },
      {
        id: 'wf-ppl-2',
        title: '2. Verify Institutional SOW Metadata & Scope Deliverables Rendered',
        action: 'wait_ms',
        duration: 300,
        assertion: { type: 'custom_check', check: 'assert_public_proposal_rendered' }
      },
      {
        id: 'wf-ppl-3',
        title: '3. Assert Proposal View Counter Increment & Realtime Sync',
        action: 'wait_ms',
        duration: 200,
        assertion: { type: 'custom_check', check: 'assert_proposal_view_increment' }
      },
      {
        id: 'wf-ppl-4',
        title: '4. Trigger Client Acceptance Modal & SOW Sign-Off Gate',
        action: 'click',
        selector: '#btnAcceptProposal',
        assertion: { type: 'modal_open', selector: '#acceptModal' }
      },
      {
        id: 'wf-ppl-5',
        title: '5. Dismiss Acceptance Modal via Escape Key',
        action: 'press_key',
        key: 'Escape',
        assertion: { type: 'modal_closed', selector: '#acceptModal' }
      },
      {
        id: 'wf-ppl-6',
        title: '6. Final Audit: Zero Native Dialogs & Zero Unhandled Rejections',
        action: 'wait_ms',
        duration: 200,
        assertion: { type: 'custom_check', check: 'assert_clean_audit' }
      }
    ]
  }
};

if (typeof window !== 'undefined') {
  window.PUBLIC_WORKFLOWS = PUBLIC_WORKFLOWS;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PUBLIC_WORKFLOWS };
}
