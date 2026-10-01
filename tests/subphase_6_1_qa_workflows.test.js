/**
 * Sub-Phase 6.1 Integration Test Suite: Wire Empty QA Workflow Arrays in Registry
 * ─────────────────────────────────────────────────────────────────────────────
 * Validates:
 * 1. GRO10X_REGISTRY admin modules (crm, reviews, social, brands, digistore, hr, platforms, settings, assets) have wired workflows (no empty arrays).
 * 2. ADMIN_WORKFLOWS contains valid implementations for all 9 wired workflows with well-formed steps, targets, and assertions.
 * 3. CREW_WORKFLOWS contains workflow_eod_submission, workflow_leave_request, and workflow_clock_in_out.
 * 4. HR_QA_SUITE contains onboarding, agreement, and payslip validation steps.
 */

const { GRO10X_REGISTRY } = require('../extension/gro10x-qa-runner/suites/registry');
const { ADMIN_WORKFLOWS } = require('../extension/gro10x-qa-runner/suites/workflows/admin-workflows');
const { CREW_WORKFLOWS } = require('../extension/gro10x-qa-runner/suites/workflows/crew-workflows');
const { HR_QA_SUITE } = require('../extension/gro10x-qa-runner/suites/hr-qa');

describe('Sub-Phase 6.1: QA Workflow Arrays & Registry Coverage', () => {
  const targetedAdminModules = [
    'platforms',
    'crm',
    'reviews',
    'social',
    'brands',
    'digistore',
    'hr',
    'assets',
    'settings'
  ];

  test('GRO10X_REGISTRY admin pages have non-empty workflow arrays for all 9 targeted modules', () => {
    expect(GRO10X_REGISTRY).toBeDefined();
    expect(GRO10X_REGISTRY.admin).toBeDefined();
    expect(Array.isArray(GRO10X_REGISTRY.admin.pages)).toBe(true);

    const adminPages = GRO10X_REGISTRY.admin.pages;

    targetedAdminModules.forEach(moduleId => {
      const page = adminPages.find(p => p.id === moduleId);
      expect(page).toBeDefined();
      expect(Array.isArray(page.workflows)).toBe(true);
      expect(page.workflows.length).toBeGreaterThan(0);
    });
  });

  test('All newly wired admin workflows exist in ADMIN_WORKFLOWS and conform to workflow schema', () => {
    const adminPages = GRO10X_REGISTRY.admin.pages;

    targetedAdminModules.forEach(moduleId => {
      const page = adminPages.find(p => p.id === moduleId);
      page.workflows.forEach(workflowId => {
        const wf = ADMIN_WORKFLOWS[workflowId];
        expect(wf).toBeDefined();
        expect(wf.id).toBe(workflowId);
        expect(wf.platform).toBe('admin');
        expect(wf.pageId).toBe(moduleId);
        expect(wf.targetHash).toMatch(/^#[a-z0-9-]+$/);
        expect(Array.isArray(wf.steps)).toBe(true);
        expect(wf.steps.length).toBeGreaterThan(0);

        wf.steps.forEach(step => {
          expect(step.id).toBeDefined();
          expect(step.title).toBeDefined();
          expect(step.action).toBeDefined();
          expect(step.assertion).toBeDefined();
        });
      });
    });
  });

  test('CREW_WORKFLOWS contains workflow_eod_submission, workflow_leave_request, and workflow_clock_in_out', () => {
    const expectedCrewWorkflows = [
      'workflow_eod_submission',
      'workflow_leave_request',
      'workflow_clock_in_out'
    ];

    expectedCrewWorkflows.forEach(wfId => {
      const wf = CREW_WORKFLOWS[wfId];
      expect(wf).toBeDefined();
      expect(wf.id).toBe(wfId);
      expect(wf.platform).toBe('crew');
      expect(Array.isArray(wf.steps)).toBe(true);
      expect(wf.steps.length).toBeGreaterThan(0);

      wf.steps.forEach(step => {
        expect(step.id).toBeDefined();
        expect(step.title).toBeDefined();
        expect(step.action).toBeDefined();
        expect(step.assertion).toBeDefined();
      });
    });
  });

  test('HR_QA_SUITE includes onboarding, agreement, and payslip validation steps', () => {
    expect(HR_QA_SUITE).toBeDefined();
    expect(Array.isArray(HR_QA_SUITE.steps)).toBe(true);

    const checkTypes = HR_QA_SUITE.steps.map(s => s.assertion && s.assertion.check).filter(Boolean);

    expect(checkTypes).toContain('assert_agreement_callbacks');
    expect(checkTypes).toContain('assert_payslip_generation');
    expect(checkTypes).toContain('assert_onboarding_progress');
    expect(checkTypes).toContain('assert_disbursement_expense_link');

    const payslipStep = HR_QA_SUITE.steps.find(s => s.assertion && s.assertion.check === 'assert_payslip_generation');
    expect(payslipStep.title).toMatch(/payslip/i);

    const onboardingStep = HR_QA_SUITE.steps.find(s => s.assertion && s.assertion.check === 'assert_onboarding_progress');
    expect(onboardingStep.title).toMatch(/onboarding/i);

    const expenseStep = HR_QA_SUITE.steps.find(s => s.assertion && s.assertion.check === 'assert_disbursement_expense_link');
    expect(expenseStep.title).toMatch(/disbursement/i);
  });
});
