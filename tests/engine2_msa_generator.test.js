/**
 * tests/engine2_msa_generator.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Engine 2 Sub-Phase 1.2: Enterprise MSA & NDA Legal Protection Test Suite
 * 
 * Verifies all 5 tracks:
 * 1. Public Route Serving (/msa-view.html)
 * 2. Core Service Generation & Cryptographic SHA-256 Fingerprint
 * 3. Complete 7-Clause Legal Enforcement (IP, NDA, Warranty, Bank Wire, Liability, Arbitration)
 * 4. API Endpoint Integration (/api/projects/:id/msa with token and query overrides)
 * 5. Resilient Preview Generation for Unregistered / Proposal Projects
 * ─────────────────────────────────────────────────────────────────────────────
 */

process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../server');
const { signToken } = require('../src/services/jwt');
const { generateProjectMSA, getProjectMSA } = require('../src/services/msa-generator');
const { saveMemoryProject } = require('../src/services/post-delivery');

describe('Engine 2 Sub-Phase 1.2: Enterprise MSA & NDA Legal Generator', () => {
  let authToken = null;
  const testProjectId = 'PRJ-MSA-TEST-001';

  beforeAll(() => {
    // Mint test JWT token for authorized requests
    authToken = signToken({
      userId: 'USR-ADMIN-01',
      id: 'USR-ADMIN-01',
      email: 'admin@gro10x.ai',
      role: 'Owner / Admin',
      accessLevel: 'Owner / Admin'
    });

    // Seed test project in memory
    saveMemoryProject({
      id: testProjectId,
      name: 'Apex AI Trading Terminal Sprint',
      clientName: 'Apex Capital Bangladesh',
      client: 'Apex Capital Bangladesh',
      company: 'Apex Capital Bangladesh',
      description: 'High-frequency algorithmic execution infrastructure and custom LLM trading agent.',
      status: 'Active'
    });
  });

  // TRACK 1: Public Route Serving
  describe('Track 1: Public Route Serving (/msa-view.html)', () => {
    test('GET /msa-view.html returns 200 with complete A4 document DOM structure', async () => {
      const res = await request(app).get('/msa-view.html');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/html/);
      expect(res.text).toContain('Master Service Agreement (MSA) & NDA');
      expect(res.text).toContain('id="msaSheet"');
      expect(res.text).toContain('id="tbTitle"');
      expect(res.text).toContain('id="docMsaId"');
      expect(res.text).toContain('id="docVerificationHash"');
      expect(res.text).toContain('id="docClausesContainer"');
      expect(res.text).toContain('downloadMsaPdf');
    });
  });

  // TRACK 2: Core Service Generation & Cryptographic Fingerprinting
  describe('Track 2: Core Service Generation & Cryptographic Fingerprinting', () => {
    test('generateProjectMSA produces valid MSA with SHA-256 seal tag', async () => {
      const msa = await generateProjectMSA(testProjectId);
      expect(msa).toBeDefined();
      expect(msa.msaId).toMatch(/^MSA-2026-[A-Z0-9]+$/);
      expect(msa.status).toBe('ACTIVE_EXECUTED');
      expect(msa.effectiveDate).toBeDefined();
      expect(msa.verificationHash).toMatch(/^GRO10X-SEC-[A-F0-9]{32}$/);
      expect(msa.parties.provider.legalName).toBe('GRO10X Business Limited');
      expect(msa.parties.client.companyName).toBe('Apex Capital Bangladesh');
    });

    test('getProjectMSA returns cached instance on subsequent invocations', async () => {
      const msa1 = await getProjectMSA(testProjectId);
      const msa2 = await getProjectMSA(testProjectId);
      expect(msa1.verificationHash).toBe(msa2.verificationHash);
      expect(msa1.msaId).toBe(msa2.msaId);
    });
  });

  // TRACK 3: Complete 7-Clause Legal Protection
  describe('Track 3: Complete 7-Clause Legal Protection', () => {
    test('Contains exactly 7 enterprise clauses with mandatory protective language', async () => {
      const msa = await generateProjectMSA(testProjectId);
      expect(msa.clauses).toHaveLength(7);

      // 1. SOW Scope
      const c1 = msa.clauses.find(c => c.section.startsWith('1.'));
      expect(c1).toBeDefined();
      expect(c1.title).toContain('Scope of AI Engineering');
      expect(c1.content).toContain('Definition of Done (DoD)');

      // 2. Irrevocable IP Transfer
      const c2 = msa.clauses.find(c => c.section.startsWith('2.'));
      expect(c2).toBeDefined();
      expect(c2.title).toContain('Intellectual Property Assignment');
      expect(c2.content).toContain('irrevocably transfers and assigns 100%');

      // 3. 5-Year Strict NDA
      const c3 = msa.clauses.find(c => c.section.startsWith('3.'));
      expect(c3).toBeDefined();
      expect(c3.title).toContain('Mutual Non-Disclosure');
      expect(c3.content).toContain('five (5) consecutive years');

      // 4. 30-Day Zero-Cost Warranty
      const c4 = msa.clauses.find(c => c.section.startsWith('4.'));
      expect(c4).toBeDefined();
      expect(c4.title).toContain('30-Day Bug-Fix Warranty');
      expect(c4.content).toContain('30-calendar-day warranty');
      expect(c4.content).toContain('zero additional cost');

      // 5. Multi-Rail Settlement & 5% VAT
      const c5 = msa.clauses.find(c => c.section.startsWith('5.'));
      expect(c5).toBeDefined();
      expect(c5.title).toContain('Multi-Rail Settlement');
      expect(c5.content).toContain('BRAC Bank PLC');
      expect(c5.content).toContain('5% VAT withholding');

      // 6. Enterprise Liability Cap
      const c6 = msa.clauses.find(c => c.section.startsWith('6.'));
      expect(c6).toBeDefined();
      expect(c6.title).toContain('Limitation of Liability');
      expect(c6.content).toContain('total fees paid under the applicable SOW');

      // 7. Governing Law & Arbitration
      const c7 = msa.clauses.find(c => c.section.startsWith('7.'));
      expect(c7).toBeDefined();
      expect(c7.title).toContain('Governing Law & Dispute Escalation');
      expect(c7.content).toContain('Arbitration Act 2001 of Bangladesh');
      expect(c7.content).toContain('warranty pause protection');
    });
  });

  // TRACK 4: API Endpoint Integration & Query Customization
  describe('Track 4: API Endpoint Integration & Query Customization', () => {
    test('GET /api/projects/:id/msa with Bearer auth returns 200 and complete document', async () => {
      const res = await request(app)
        .get(`/api/projects/${testProjectId}/msa`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.msa).toBeDefined();
      expect(res.body.msa.projectId).toBe(testProjectId);
      expect(res.body.msa.metadata.viewUrl).toContain(`/msa-view.html?projectId=${testProjectId}`);
    });

    test('GET /api/projects/:id/msa accepts query token authentication', async () => {
      const res = await request(app)
        .get(`/api/projects/${testProjectId}/msa?token=${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.msa).toBeDefined();
    });

    test('GET /api/projects/:id/msa supports dynamic query overrides for custom proposals', async () => {
      const res = await request(app)
        .get(`/api/projects/${testProjectId}/msa?clientName=CustomCorp&signatoryName=Zubair%20Hasan&signatoryRole=CTO`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      const msa = res.body.msa;
      expect(msa.parties.client.companyName).toBe('CustomCorp');
      expect(msa.parties.client.authorizedSignatory).toBe('Zubair Hasan');
      expect(msa.parties.client.designation).toBe('CTO');
    });
  });

  // TRACK 5: Resilient Fallback Generation
  describe('Track 5: Resilient Fallback Generation', () => {
    test('generateProjectMSA resolves arbitrary / unseeded project IDs without crashing', async () => {
      const arbitraryId = 'PRJ-PROPOSAL-NEW-999';
      const msa = await generateProjectMSA(arbitraryId, {
        companyName: 'Unseeded Partner Global',
        signatoryName: 'Farhan Kabir'
      });

      expect(msa).toBeDefined();
      expect(msa.projectId).toBe(arbitraryId);
      expect(msa.parties.client.companyName).toBe('Unseeded Partner Global');
      expect(msa.verificationHash).toMatch(/^GRO10X-SEC-[A-F0-9]{32}$/);
      expect(msa.clauses).toHaveLength(7);
    });
  });
});
