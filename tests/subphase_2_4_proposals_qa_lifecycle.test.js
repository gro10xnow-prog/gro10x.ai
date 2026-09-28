/**
 * tests/subphase_2_4_proposals_qa_lifecycle.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Sub-Phase 2.4: Chrome Extension QA Suite: Proposals Lifecycle & Client Conversion
 * Validates:
 * 1. Public Proposal View increments view_count and sanitizes internal notes
 * 2. POST /api/proposals/:id/convert-to-project creates active project and updates status
 * 3. PROPOSALS_QA_SUITE contains contiguous steps 1-24 with full filter & modal coverage
 * 4. PUBLIC_WORKFLOWS contains workflow_public_proposal_lifecycle with view sync & acceptance gate
 * 5. PORTAL_AUDITS contains public_proposal health audit suite
 * 6. GRO10X_REGISTRY registers proposal page under public platform and links workflows
 * 7. Content Script handles assert_public_proposal_rendered and assert_proposal_view_increment
 * 8. Static Zero-Leakage: src/routes/proposals.js contains zero instances of banned phone (1708)
 * ─────────────────────────────────────────────────────────────────────────────
 */

const request = require('supertest');
const fs = require('fs');
const path = require('path');
const { signToken } = require('../src/services/jwt');

let app;
beforeAll(() => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_purple_os_2026';
  process.env.NODE_ENV = 'test';
  app = require('../server');
});

describe('💼 Sub-Phase 2.4: Chrome Extension QA Suite: Proposals Lifecycle & Client Conversion', () => {
  let adminToken;

  beforeAll(() => {
    adminToken = signToken({
      id: 'GRO-001',
      emp_code: 'GRO-001',
      name: 'Firoz Uddin Ahmed',
      role: 'owner',
      accessLevel: 'Owner / Admin'
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 1. Public Proposal View Tracking & SSE Broadcast
  // ───────────────────────────────────────────────────────────────────────────

  test('1. GET /api/public/proposals/nhf-enterprise-ai-2026 tracks view count and sanitizes internal notes', async () => {
    const res1 = await request(app)
      .get('/api/public/proposals/nhf-enterprise-ai-2026')
      .expect(200);

    const initialViews = Number(res1.body.viewCount || 0);
    expect(res1.body.clientName).toContain('National Housing Finance');
    expect(res1.body.notes).toBeUndefined(); // Internal notes must remain sanitized

    // Second visit should increment view count
    const res2 = await request(app)
      .get('/api/public/proposals/nhf-enterprise-ai-2026')
      .expect(200);

    expect(Number(res2.body.viewCount)).toBeGreaterThanOrEqual(initialViews + 1);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2. Proposal to Active Production Project Conversion
  // ───────────────────────────────────────────────────────────────────────────

  test('2. POST /api/proposals/:id/convert-to-project marks proposal Converted and creates production project', async () => {
    // Create an ephemeral proposal to convert
    const createRes = await request(app)
      .post('/api/proposals')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        clientName: 'Apex Fintech Solutions',
        projectTitle: 'Conversational Banking Copilot',
        currency: 'BDT',
        oneTimeTotal: 180000,
        recurringTotal: 25000,
        status: 'Accepted'
      });

    const propId = createRes.body?.proposal?.id || 'PROP-2026-CONV';

    const convertRes = await request(app)
      .post(`/api/proposals/${propId}/convert-to-project`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(convertRes.body.success).toBe(true);
    expect(convertRes.body.projectId).toMatch(/^PRJ-/);
    expect(convertRes.body.project).toBeDefined();
    expect(convertRes.body.project.workflow_type).toBe('ai_automation');
    expect(convertRes.body.project.status).toBe('Active');
    expect(convertRes.body.proposal.status).toBe('Converted');
    expect(convertRes.body.proposal.convertedProjectId).toBe(convertRes.body.projectId);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3. QA Automation Suite Coverage: proposals-qa.js
  // ───────────────────────────────────────────────────────────────────────────

  test('3. extension/gro10x-qa-runner/suites/proposals-qa.js has contiguous steps 1 through 24', () => {
    const suitePath = path.join(__dirname, '../extension/gro10x-qa-runner/suites/proposals-qa.js');
    const { PROPOSALS_QA_SUITE } = require(suitePath);

    expect(PROPOSALS_QA_SUITE).toBeDefined();
    expect(PROPOSALS_QA_SUITE.steps.length).toBe(24);

    for (let i = 1; i <= 24; i++) {
      const stepId = `step-${i}`;
      const found = PROPOSALS_QA_SUITE.steps.find(s => s.id === stepId);
      expect(found).toBeDefined();
    }

    const step18 = PROPOSALS_QA_SUITE.steps.find(s => s.id === 'step-18');
    expect(step18.assertion.check).toBe('assert_proposals_enterprise_preset');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4. Public Workflows Suite Coverage: public-workflows.js
  // ───────────────────────────────────────────────────────────────────────────

  test('4. PUBLIC_WORKFLOWS contains workflow_public_proposal_lifecycle with complete steps', () => {
    const wfPath = path.join(__dirname, '../extension/gro10x-qa-runner/suites/workflows/public-workflows.js');
    const { PUBLIC_WORKFLOWS } = require(wfPath);

    expect(PUBLIC_WORKFLOWS).toBeDefined();
    const wf = PUBLIC_WORKFLOWS.workflow_public_proposal_lifecycle;
    expect(wf).toBeDefined();
    expect(wf.platform).toBe('public');
    expect(wf.pageId).toBe('proposal');
    expect(wf.steps.length).toBe(6);

    const stepChecks = wf.steps.map(s => s.assertion?.check || s.assertion?.type);
    expect(stepChecks).toContain('assert_public_proposal_rendered');
    expect(stepChecks).toContain('assert_proposal_view_increment');
    expect(stepChecks).toContain('assert_clean_audit');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 5. Portal Audits Suite Coverage: portal-audits.js
  // ───────────────────────────────────────────────────────────────────────────

  test('5. PORTAL_AUDITS contains public_proposal health audit suite', () => {
    const auditsPath = path.join(__dirname, '../extension/gro10x-qa-runner/suites/portal-audits.js');
    const { PORTAL_AUDITS } = require(auditsPath);

    expect(PORTAL_AUDITS).toBeDefined();
    const suite = PORTAL_AUDITS.public_proposal;
    expect(suite).toBeDefined();
    expect(suite.id).toBe('public_proposal');
    expect(suite.steps.length).toBe(3);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 6. Central Registry Verification: registry.js
  // ───────────────────────────────────────────────────────────────────────────

  test('6. GRO10X_REGISTRY registers proposal page under public platform and links workflows', () => {
    const regPath = path.join(__dirname, '../extension/gro10x-qa-runner/suites/registry.js');
    const { GRO10X_REGISTRY } = require(regPath);

    expect(GRO10X_REGISTRY).toBeDefined();
    const publicPages = GRO10X_REGISTRY.public.pages;
    const proposalPage = publicPages.find(p => p.id === 'proposal');

    expect(proposalPage).toBeDefined();
    expect(proposalPage.auditSuiteId).toBe('public_proposal');
    expect(proposalPage.workflows).toContain('workflow_public_proposal_lifecycle');

    const adminProposals = GRO10X_REGISTRY.admin.pages.find(p => p.id === 'proposals');
    expect(adminProposals.workflows).toContain('workflow_proposal_acceptance_onboarding');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 7. Content Script Assertion Handlers
  // ───────────────────────────────────────────────────────────────────────────

  test('7. Content Script contains assert_public_proposal_rendered and assert_proposal_view_increment', () => {
    const csPath = path.join(__dirname, '../extension/gro10x-qa-runner/content-script.js');
    const content = fs.readFileSync(csPath, 'utf8');

    expect(content.includes("assertion.check === 'assert_public_proposal_rendered'")).toBe(true);
    expect(content.includes("assertion.check === 'assert_proposal_view_increment'")).toBe(true);
    expect(content.includes("assertion.check === 'assert_clean_audit'")).toBe(true);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 8. Static Zero-Leakage Audit
  // ───────────────────────────────────────────────────────────────────────────

  test('8. Static Zero-Leakage: src/routes/proposals.js contains zero instances of banned phone (1708)', () => {
    const propPath = path.join(__dirname, '../src/routes/proposals.js');
    const content = fs.readFileSync(propPath, 'utf8');

    expect(content.includes('1708')).toBe(false);
    expect(content.includes('1708459008')).toBe(false);
  });
});
