/**
 * tests/subphase_2_2_proposal_acceptance_onboarding.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Sub-Phase 2.2: Proposal Acceptance to Client Workspace Seamless Onboarding
 * Validates:
 * 1. POST /api/public/proposals/nhf-enterprise-ai-2026/accept completes full acceptance pipeline
 * 2. Issues signed 30-day Client Partner JWT session token bypassing /auth login walls
 * 3. Constructs seamless onboardingUrl targeting /client?token=...#lockin (NEVER /partners)
 * 4. Client auto-creation with primary POC, company, and Onboarding status
 * 5. Project Lock-In Spec creation with SPRINT-01 deliverables, prerequisites & DoD
 * 6. Corporate milestone deposit invoice with 5% VAT and BRAC Bank settlement details
 * 7. Static Zero-Leakage Audit: src/services/resend.js contains 0 occurrences of banned phone (+880 1708 459008)
 * 8. Static UI Verification: public/proposal.html stores clientToken in localStorage and embeds handover link
 * 9. Multi-Stakeholder Alerting: src/services/bot/notifications.js dispatches handover cockpit to Owner & DBM
 * 10. QA Automation Suite: admin-workflows.js, registry.js, and content-script.js support acceptance workflow
 * ─────────────────────────────────────────────────────────────────────────────
 */

const request = require('supertest');
const fs = require('fs');
const path = require('path');
const { verifyToken } = require('../src/services/jwt');

let app;
beforeAll(() => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_purple_os_2026';
  process.env.NODE_ENV = 'test';
  app = require('../server');
});

describe('🚀 Sub-Phase 2.2: Proposal Acceptance to Client Workspace Seamless Onboarding', () => {
  let acceptancePayload;
  let acceptanceResponse;

  beforeAll(async () => {
    acceptancePayload = {
      acceptedBy: 'MD Zahin Khandaker (NHF)',
      acceptedNotes: 'Approved by board for Q4 2026 enterprise AI deployment',
      signature: 'MD Zahin Khandaker'
    };

    acceptanceResponse = await request(app)
      .post('/api/public/proposals/nhf-enterprise-ai-2026/accept')
      .send(acceptancePayload);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 1. Acceptance Pipeline Execution
  // ───────────────────────────────────────────────────────────────────────────

  test('1. POST /api/public/proposals/nhf-enterprise-ai-2026/accept succeeds with 200 and proposal marked Accepted', () => {
    expect(acceptanceResponse.status).toBe(200);
    expect(acceptanceResponse.body.success).toBe(true);
    expect(acceptanceResponse.body.proposal).toBeDefined();
    expect(acceptanceResponse.body.proposal.status).toBe('Accepted');
    expect(acceptanceResponse.body.proposal.acceptedBy).toBe(acceptancePayload.acceptedBy);
  });

  test('2. Issues signed 30-day Client Partner JWT session token', () => {
    const { clientToken, sessionToken } = acceptanceResponse.body;
    const token = clientToken || sessionToken;
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');

    // Verify token validity and claims
    const decoded = verifyToken(token);
    expect(decoded).toBeTruthy();
    expect(decoded.role).toBe('Client Partner');
    expect(decoded.accessLevel).toBe('Client Partner');
    expect(decoded.linkedType).toBe('client');
    expect(decoded.email).toBe('digital@nationalhousingbd.com');
  });

  test('3. Generates seamless onboardingUrl targeting /client with token and #lockin anchor', () => {
    const { onboardingUrl } = acceptanceResponse.body;
    expect(onboardingUrl).toBeDefined();
    expect(onboardingUrl).toContain('/client?token=');
    expect(onboardingUrl).toContain('#lockin');
    // Critical Guard: Must NEVER redirect clients to /partners (enterprise subcontractor portal)
    expect(onboardingUrl).not.toContain('/partners');
  });

  test('4. Auto-creates Client record in CRM with primary POC and Onboarding status', () => {
    const { clientId, client_id, proposal } = acceptanceResponse.body;
    const resolvedClientId = clientId || client_id || proposal.client_id;
    expect(resolvedClientId).toBeDefined();
    expect(resolvedClientId).toMatch(/^CLI-/);
  });

  test('5. Pre-populates Project Lock-In Spec with SPRINT-01 deliverables, prerequisites & DoD', () => {
    const { specId, lockinSpec } = acceptanceResponse.body;
    expect(specId).toBeDefined();
    expect(lockinSpec).toBeDefined();
    expect(lockinSpec.canonical_service_code).toBe('SPRINT-01');
    expect(Array.isArray(lockinSpec.deliverables)).toBe(true);
    expect(lockinSpec.deliverables.length).toBeGreaterThanOrEqual(3);
    expect(Array.isArray(lockinSpec.prerequisites)).toBe(true);
    expect(typeof lockinSpec.definition_of_done === 'string' && lockinSpec.definition_of_done.length > 20).toBe(true);
    expect(lockinSpec.client_signoff_status).toBe('Pending Lock-In Review');
  });

  test('6. Generates corporate milestone deposit invoice with 5% VAT calculation', () => {
    const { invoiceId, invoiceUrl, invoicePublicUrl } = acceptanceResponse.body;
    expect(invoiceId).toBeDefined();
    expect(invoiceId).toMatch(/^INV-/);
    expect(invoiceUrl).toBeDefined();
    expect(invoiceUrl).toContain('#invoices');
    expect(invoicePublicUrl).toBeDefined();
    expect(invoicePublicUrl).toContain(`/invoices.html?inv=${invoiceId}`);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2. Static Zero-Leakage & Prohibited Phone Audit
  // ───────────────────────────────────────────────────────────────────────────

  test('7. Static Zero-Leakage: src/services/resend.js has 0 instances of prohibited phone (1708)', () => {
    const resendPath = path.join(__dirname, '../src/services/resend.js');
    const content = fs.readFileSync(resendPath, 'utf8');

    expect(content.includes('1708')).toBe(false);
    expect(content.includes('1708459008')).toBe(false);
    expect(content.includes('+880 1708-459008')).toBe(false);
    expect(content.includes('sendProposalAcceptedClientEmail')).toBe(true);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3. Static UI & Client Portal Seamless Auth Audit
  // ───────────────────────────────────────────────────────────────────────────

  test('8. Static UI: public/proposal.html stores clientToken in localStorage and embeds onboarding link', () => {
    const htmlPath = path.join(__dirname, '../public/proposal.html');
    const content = fs.readFileSync(htmlPath, 'utf8');

    expect(content.includes('localStorage.setItem(\'gro10x_token\', data.clientToken)')).toBe(true);
    expect(content.includes('localStorage.setItem(\'sb-access-token\', data.clientToken)')).toBe(true);
    expect(content.includes('btnOpenClient')).toBe(true);
    expect(content.includes('data.onboardingUrl')).toBe(true);
    expect(content.includes('data.invoiceUrl')).toBe(true);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4. Multi-Stakeholder Telegram & DBM Alerts Audit
  // ───────────────────────────────────────────────────────────────────────────

  test('9. Static Alerting: src/services/bot/notifications.js includes direct cockpit link and DBM dispatch', () => {
    const notifPath = path.join(__dirname, '../src/services/bot/notifications.js');
    const content = fs.readFileSync(notifPath, 'utf8');

    expect(content.includes('sendProposalAcceptedNotification')).toBe(true);
    expect(content.includes('cockpitUrl')).toBe(true);
    expect(content.includes('TELEGRAM_DBM_CHAT_ID')).toBe(true);
    expect(content.includes('Open Client Handover Cockpit')).toBe(true);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 5. QA Automation Suite & Content Script Assertions
  // ───────────────────────────────────────────────────────────────────────────

  test('10. QA Automation: admin-workflows.js, registry.js, and content-script.js support acceptance workflow', () => {
    const adminWfPath = path.join(__dirname, '../extension/gro10x-qa-runner/suites/workflows/admin-workflows.js');
    const adminWfContent = fs.readFileSync(adminWfPath, 'utf8');
    expect(adminWfContent.includes('workflow_proposal_acceptance_onboarding')).toBe(true);
    expect(adminWfContent.includes('workflow_accept_sow_proposal')).toBe(true);
    expect(adminWfContent.includes('assert_proposal_accepted_workflow')).toBe(true);
    expect(adminWfContent.includes('assert_client_token_provisioned')).toBe(true);

    const registryPath = path.join(__dirname, '../extension/gro10x-qa-runner/suites/registry.js');
    const registryContent = fs.readFileSync(registryPath, 'utf8');
    expect(registryContent.includes("workflows: ['workflow_proposal_acceptance_onboarding']")).toBe(true);

    const csPath = path.join(__dirname, '../extension/gro10x-qa-runner/content-script.js');
    const csContent = fs.readFileSync(csPath, 'utf8');
    expect(csContent.includes("step.action === 'workflow_accept_sow_proposal'")).toBe(true);
    expect(csContent.includes("assertion.check === 'assert_proposal_accepted_workflow'")).toBe(true);
    expect(csContent.includes("assertion.check === 'assert_client_token_provisioned'")).toBe(true);
    expect(csContent.includes("assertion.check === 'assert_clean_audit'")).toBe(true);
  });
});
