/**
 * tests/subphase_2_1_enterprise_proposal_studio.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Sub-Phase 2.1: Enterprise SOW Proposal Studio & High-Value Pitch Engine
 * Validates:
 * 1. GET /api/proposals/presets returns NATIONAL_HOUSING_FINANCE_AI_OS & UCB presets
 * 2. GET /api/proposals/presets/:key returns exact enterprise specifications
 * 3. GET /api/public/proposals/nhf-enterprise-ai-2026 resolves pre-seeded institutional proposal
 * 4. POST /api/proposals/ai-draft intelligently crafts enterprise mortgage AI OS draft for NHF
 * 5. POST /api/proposals creates new proposal with full calculations & sanitized metadata
 * 6. Static Zero-Leakage Audit: public/proposal.html contains 0 instances of legacy phone (1708)
 * 7. Static UI Verification: public/app/modules/proposals.js contains #btnPresetNHF and applyEnterprisePreset
 * 8. Static QA Suite Coverage: extension/gro10x-qa-runner/suites/proposals-qa.js has contiguous steps 1-24
 * 9. Content Script Assertion: extension/gro10x-qa-runner/content-script.js contains assert_proposals_enterprise_preset
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

describe('🏛️ Sub-Phase 2.1: Enterprise SOW Proposal Studio & High-Value Pitch Engine', () => {
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
  // 1. Enterprise Presets API
  // ───────────────────────────────────────────────────────────────────────────

  test('1. GET /api/proposals/presets returns NATIONAL_HOUSING_FINANCE_AI_OS preset', async () => {
    const res = await request(app)
      .get('/api/proposals/presets')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.presets)).toBe(true);
    
    const nhf = res.body.presets.find(p => p.presetKey === 'NATIONAL_HOUSING_FINANCE_AI_OS' || p.id === 'nhf-enterprise-ai-os');
    expect(nhf).toBeDefined();
    expect(nhf.clientName).toBe('National Housing Finance PLC');
    expect(nhf.currency).toBe('BDT');
    expect(nhf.oneTimeTotal).toBe(320000);
    expect(nhf.recurringTotal).toBe(40000);
    expect(nhf.canonicalServiceCode).toBe('SPRINT-01');
    expect(nhf.scopeItems.length).toBe(5);
    expect(nhf.oneTimeItems.length).toBe(4);
    expect(nhf.recurringItems.length).toBe(2);
  });

  test('2. GET /api/proposals/presets/NATIONAL_HOUSING_FINANCE_AI_OS returns specific preset detail', async () => {
    const res = await request(app)
      .get('/api/proposals/presets/NATIONAL_HOUSING_FINANCE_AI_OS')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.preset).toBeDefined();
    expect(res.body.preset.projectTitle).toContain('Dedicated Enterprise AI Operating System');
    expect(res.body.preset.terms).toContain('30-day post-delivery bug-fix warranty shield');
    expect(res.body.preset.timeline).toBe('3–4 Weeks from Kickoff');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2. Pre-Seeded Public Proposal View
  // ───────────────────────────────────────────────────────────────────────────

  test('3. GET /api/public/proposals/nhf-enterprise-ai-2026 retrieves public institutional SOW', async () => {
    const res = await request(app)
      .get('/api/public/proposals/nhf-enterprise-ai-2026')
      .expect(200);

    expect(res.body.id).toBe('PROP-2026-002');
    expect(res.body.shareToken).toBe('nhf-enterprise-ai-2026');
    expect(res.body.clientName).toBe('National Housing Finance PLC');
    expect(res.body.oneTimeTotal).toBe(320000);
    expect(res.body.recurringTotal).toBe(40000);
    expect(res.body.currency).toBe('BDT');
    expect(res.body.scopeItems.length).toBe(5);
    // Ensure internal notes are sanitized from public client response
    expect(res.body).not.toHaveProperty('notes');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3. AI Proposal Drafting Engine (NHF & Banking Context Detection)
  // ───────────────────────────────────────────────────────────────────────────

  test('4. POST /api/proposals/ai-draft generates NHF Enterprise Mortgage OS draft', async () => {
    const res = await request(app)
      .post('/api/proposals/ai-draft')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        notes: 'National Housing Finance Limited wants an autonomous AI mortgage sales officer for home loans and REHAB project search.',
        clientName: 'National Housing Finance PLC',
        currency: 'BDT'
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.draft).toBeDefined();
    expect(res.body.draft.projectTitle).toContain('Enterprise AI Operating System');
    expect(res.body.draft.currency).toBe('BDT');
    expect(res.body.draft.oneTimeTotal).toBe(320000);
    expect(res.body.draft.recurringTotal).toBe(40000);
    expect(Array.isArray(res.body.draft.scopeItems)).toBe(true);
    expect(res.body.draft.scopeItems.some(s => s.title.includes('Mortgage'))).toBe(true);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4. Proposal Creation & Calculation Lifecycle
  // ───────────────────────────────────────────────────────────────────────────

  test('5. POST /api/proposals persists new enterprise proposal and computes totals', async () => {
    const newProp = {
      clientName: 'City Bank Capital PLC',
      clientCompany: 'City Bank Capital',
      clientEmail: 'corporate@citybankcapital.com',
      clientPhone: '+880 1711-998877',
      projectTitle: 'Private Equity AI Deal Screener & Portfolio Copilot',
      currency: 'BDT',
      timeline: '4 Weeks',
      oneTimeItems: [
        { name: 'Financial Model Parser Engine', description: 'Audited DCF / LBO extraction', amount: 150000 },
        { name: 'Private Cloud On-Premise Vector Store', description: 'Zero telemetry leakage vault', amount: 100000 }
      ],
      recurringItems: [
        { name: 'Dedicated High-Compute GPU Cluster & Retainer', description: 'Monthly dedicated inference & SLA', amount: 35000, frequency: 'Monthly' }
      ],
      terms: '50% advance upon kickoff; 50% upon UAT sign-off.'
    };

    const res = await request(app)
      .post('/api/proposals')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(newProp)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.proposal).toBeDefined();
    expect(res.body.proposal.id).toMatch(/^PROP-2026-/);
    expect(res.body.proposal.shareToken).toBeDefined();
    expect(res.body.proposal.oneTimeTotal).toBe(250000);
    expect(res.body.proposal.recurringTotal).toBe(35000);
    expect(res.body.proposal.status).toBe('Draft');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 5. Zero Phone Leakage & Prohibited Phone Rule Check
  // ───────────────────────────────────────────────────────────────────────────

  test('6. public/proposal.html contains zero occurrences of legacy prohibited phone 1708', () => {
    const htmlPath = path.join(__dirname, '../public/proposal.html');
    const content = fs.readFileSync(htmlPath, 'utf8');

    expect(content.includes('1708-459008')).toBe(false);
    expect(content.includes('1708459008')).toBe(false);
    expect(content.includes('+880 1711-019550')).toBe(true);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 6. UI Preset Buttons & Module Wiring Check
  // ───────────────────────────────────────────────────────────────────────────

  test('7. public/app/modules/proposals.js contains #btnPresetNHF and applyEnterprisePreset', () => {
    const jsPath = path.join(__dirname, '../public/app/modules/proposals.js');
    const content = fs.readFileSync(jsPath, 'utf8');

    expect(content.includes('id="btnPresetNHF"')).toBe(true);
    expect(content.includes('id="btnPresetUCB"')).toBe(true);
    expect(content.includes('id="enterprisePresetsBar"')).toBe(true);
    expect(content.includes('applyEnterprisePreset(presetKey)')).toBe(true);
    expect(content.includes("applyEnterprisePreset('NATIONAL_HOUSING_FINANCE_AI_OS')")).toBe(true);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 7. QA Suite & Contiguous Steps Audit
  // ───────────────────────────────────────────────────────────────────────────

  test('8. extension/gro10x-qa-runner/suites/proposals-qa.js has contiguous steps 1 through 24', () => {
    const suitePath = path.join(__dirname, '../extension/gro10x-qa-runner/suites/proposals-qa.js');
    const suiteContent = fs.readFileSync(suitePath, 'utf8');
    const { PROPOSALS_QA_SUITE } = require(suitePath);

    expect(PROPOSALS_QA_SUITE).toBeDefined();
    expect(PROPOSALS_QA_SUITE.steps.length).toBe(24);

    for (let i = 1; i <= 24; i++) {
      const stepId = `step-${i}`;
      const found = PROPOSALS_QA_SUITE.steps.find(s => s.id === stepId);
      expect(found).toBeDefined();
    }

    const step18 = PROPOSALS_QA_SUITE.steps.find(s => s.id === 'step-18');
    expect(step18).toBeDefined();
    expect(step18.assertion.check).toBe('assert_proposals_enterprise_preset');
  });

  test('9. extension/gro10x-qa-runner/content-script.js contains assert_proposals_enterprise_preset', () => {
    const csPath = path.join(__dirname, '../extension/gro10x-qa-runner/content-script.js');
    const content = fs.readFileSync(csPath, 'utf8');

    expect(content.includes("assertion.check === 'assert_proposals_enterprise_preset'")).toBe(true);
    expect(content.includes('btnPresetNHF')).toBe(true);
    expect(content.includes('enterprisePresetsBar')).toBe(true);
  });
});
