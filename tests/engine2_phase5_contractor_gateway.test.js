/**
 * tests/engine2_phase5_contractor_gateway.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Phase 5 Test Suite: Subcontractor Scoped Gateway & Masked Mini Portal
 * 
 * Verifies all 5 functional tracks:
 * 1. Public Gateway Route Serving (/contractor-view, /contractor, /contractor-view.html)
 * 2. Contractor Scoped Pass Generation API (POST /api/projects/:id/contractor-pass)
 * 3. Query Token Authentication & 100% Financial Confidentiality Masking
 * 4. Contractor Defect & Blocker Submission API (POST /api/projects/:id/contractor-ticket)
 * 5. Security Guards, RBAC & Invalid Token Rejections
 * ─────────────────────────────────────────────────────────────────────────────
 */

process.env.NODE_ENV = 'test';
process.env.TELEGRAM_OWNER_CHAT_ID = '7754769807';
process.env.TELEGRAM_ADMIN_CHAT_ID = '7754769807';

const request = require('supertest');
const app = require('../server');
const { signToken, verifyToken } = require('../src/services/jwt');
const { saveMemoryProject } = require('../src/services/post-delivery');
const { assignPodToProject } = require('../src/services/delivery-pods');

describe('Engine 2 Phase 5: Subcontractor Scoped Gateway & Financial Shield', () => {

  const adminToken = signToken({
    userId: 'EMP-MD-001',
    name: 'Tanvir Ahmed',
    role: 'Managing Director',
    accessLevel: 'Owner / Admin',
    department: 'Executive',
    linkedType: 'team'
  });

  const testProjectId = `PRJ-CONT-E2-${Date.now()}`;

  beforeAll(async () => {
    // Seed project with rich commercial financials to verify zero leakage
    saveMemoryProject({
      id: testProjectId,
      name: 'Agentic Workflow Enterprise Sprint',
      client: 'Purplebot Digital Limited',
      clientName: 'Purplebot Digital Limited',
      clientId: 'CLI-PURPLE-001',
      budget: 250000,
      price: 250000,
      hourlyRate: 65,
      rates: { seniorDev: 65, promptEngineer: 50 },
      cogs: 350.50,
      grossMargin: 76.4,
      invoices: [{ id: 'INV-E2-001', amount: 125000, status: 'Paid' }],
      department: 'Production',
      workflowType: 'composite_bundle',
      status: 'Active',
      delivery_status: 'IN_PROGRESS',
      createdAt: '2026-09-01T10:00:00.000Z'
    });

    // Seed delivery pod
    await assignPodToProject(testProjectId, {
      podType: 'ENTERPRISE_AUTOMATION_POD',
      leadEngineer: 'Amanullah (Tech Lead)',
      assignedMembers: ['Sabbir (Full Stack)', 'Rifat (AI Engineer)']
    });
  });

  // TRACK 1: Public Gateway Route Serving
  describe('Track 1: Public Gateway Route Serving', () => {
    test('GET /contractor-view returns 200 with HTML DOM and confidentiality markers', async () => {
      const res = await request(app).get('/contractor-view');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/html/);
      expect(res.text).toContain('Subcontractor Scoped Gateway');
      expect(res.text).toContain('100% Commercial Financial Confidentiality Active');
      expect(res.text).toContain('SENSITIVE FINANCIALS MASKED');
      expect(res.text).toContain('contractorTicketForm');
      expect(res.text).toContain('deliverablesContainer');
    });

    test('GET /contractor canonical alias returns 200', async () => {
      const res = await request(app).get('/contractor');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/html/);
      expect(res.text).toContain('Subcontractor Scoped Gateway');
    });

    test('GET /contractor-view.html returns 200 with HTML markup', async () => {
      const res = await request(app).get('/contractor-view.html');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/html/);
      expect(res.text).toContain('Subcontractor Scoped Gateway');
    });
  });

  // TRACK 2: Contractor Scoped Pass Generation API
  describe('Track 2: Contractor Scoped Pass Generation API', () => {
    test('POST /api/projects/:id/contractor-pass generates signed token and pass URL', async () => {
      const res = await request(app)
        .post(`/api/projects/${testProjectId}/contractor-pass`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          contractorName: 'Asif Mahmud (Prompt Engineer)',
          daysValid: 14
        });

      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.projectId).toBe(testProjectId);
      expect(res.body.contractorName).toBe('Asif Mahmud (Prompt Engineer)');
      expect(res.body.token).toBeDefined();
      expect(res.body.passUrl).toContain('/contractor-view.html?id=');
      expect(res.body.passUrl).toContain(`token=${encodeURIComponent(res.body.token)}`);
      expect(res.body.expiresAt).toBeDefined();
      expect(res.body.daysValid).toBe(14);

      // Verify cryptographic signature and payload
      const decoded = verifyToken(res.body.token);
      expect(decoded).toBeTruthy();
      expect(decoded.role).toBe('Subcontractor');
      expect(decoded.linkedType).toBe('contractor');
      expect(decoded.projectId).toBe(testProjectId);
    });

    test('POST /api/projects/:id/contractor-pass returns 400 for nonexistent project', async () => {
      const res = await request(app)
        .post('/api/projects/PRJ-NONEXISTENT-9999/contractor-pass')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ contractorName: 'External Dev' });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
      expect(res.body.error).toContain('not found');
    });
  });

  // TRACK 3: Query Token Authentication & 100% Financial Masking
  describe('Track 3: Query Token Authentication & 100% Financial Confidentiality Masking', () => {
    let contractorToken = null;

    beforeAll(async () => {
      const passRes = await request(app)
        .post(`/api/projects/${testProjectId}/contractor-pass`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ contractorName: 'Naimul Islam (ML Engineer)', daysValid: 7 });
      contractorToken = passRes.body.token;
    });

    test('GET /api/projects/:id/contractor-view?token=<token> authenticates via query parameter', async () => {
      const res = await request(app)
        .get(`/api/projects/${testProjectId}/contractor-view?token=${contractorToken}`)
        .set('x-disable-dev-auth', 'true');

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.projectId).toBe(testProjectId);
      expect(res.body.financialsMasked).toBe(true);
      expect(res.body.viewMode).toBe('subcontractor_scoped');
      expect(res.body.client).toBeDefined();
      expect(res.body.client.companyName).toBe('Purplebot Digital Limited');
      expect(res.body.pod).toBeDefined();
      expect(res.body.pod.podName).toBe('Enterprise Automation & Integration Pod');
      expect(res.body.technicalGuidelines).toBeDefined();
      expect(res.body.technicalGuidelines.qaChecklist).toContain('Definition of Done');
    });

    test('Strict Financial Confidentiality: budgets, rates, invoices, cogs & margins are strictly stripped', async () => {
      const res = await request(app)
        .get(`/api/projects/${testProjectId}/contractor-view?token=${contractorToken}`)
        .set('x-disable-dev-auth', 'true');

      expect(res.status).toBe(200);
      const data = res.body;

      // Assert strictly undefined for all commercial metrics
      expect(data.budget).toBeUndefined();
      expect(data.price).toBeUndefined();
      expect(data.hourlyRate).toBeUndefined();
      expect(data.rates).toBeUndefined();
      expect(data.cogs).toBeUndefined();
      expect(data.grossMargin).toBeUndefined();
      expect(data.invoices).toBeUndefined();
      expect(data.retainerBank).toBeUndefined();

      // Ensure JSON payload contains zero sensitive commercial terms
      const rawJson = JSON.stringify(data);
      expect(rawJson).not.toContain('250000');
      expect(rawJson).not.toContain('INV-E2-001');
      expect(rawJson).not.toContain('76.4');
    });
  });

  // TRACK 4: Contractor Defect / Blocker Submission API
  describe('Track 4: Contractor Defect / Blocker Submission API', () => {
    let contractorToken = null;

    beforeAll(async () => {
      const passRes = await request(app)
        .post(`/api/projects/${testProjectId}/contractor-pass`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ contractorName: 'Fahim Morshed', daysValid: 14 });
      contractorToken = passRes.body.token;
    });

    test('POST /api/projects/:id/contractor-ticket creates technical blocker ticket', async () => {
      const res = await request(app)
        .post(`/api/projects/${testProjectId}/contractor-ticket?token=${contractorToken}`)
        .set('x-disable-dev-auth', 'true')
        .send({
          title: 'Redis Lock Race Condition in Multi-Agent State Sync',
          severity: 'p0_blocker',
          description: 'Encountered 429 lock timeout during agent checkpoint step.',
          stagingUrl: 'https://staging.purplebot.gro10x.ai/agents'
        });

      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.ticket).toBeDefined();
      expect(res.body.ticket.id).toMatch(/^TKT-/);
      expect(res.body.ticket.title).toBe('Redis Lock Race Condition in Multi-Agent State Sync');
      expect(res.body.ticket.severity).toBe('p0_blocker');
      expect(res.body.ticket.priority).toBe('Critical');
      expect(res.body.ticket.category).toBe('contractor_defect');
      expect(res.body.ticket.is_contractor_ticket).toBe(true);
      expect(res.body.ticket.status).toBe('Open');
      expect(res.body.ticket.createdBy).toBe('Fahim Morshed');
    });

    test('POST /api/projects/:id/contractor-ticket rejects request without title', async () => {
      const res = await request(app)
        .post(`/api/projects/${testProjectId}/contractor-ticket?token=${contractorToken}`)
        .set('x-disable-dev-auth', 'true')
        .send({ severity: 'p1_defect' });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
      expect(res.body.error).toContain('Ticket title is required');
    });
  });

  // TRACK 5: Security Guards & Invalid Token Rejection
  describe('Track 5: Security Guards & Token Rejection', () => {
    test('Unauthenticated request with dev auth disabled returns 401', async () => {
      const res = await request(app)
        .get(`/api/projects/${testProjectId}/contractor-view`)
        .set('x-disable-dev-auth', 'true');

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Unauthorized');
    });

    test('Tampered or malformed JWT query token returns 401', async () => {
      const res = await request(app)
        .get(`/api/projects/${testProjectId}/contractor-view?token=invalid.tampered.token`)
        .set('x-disable-dev-auth', 'true');

      expect(res.status).toBe(401);
      expect(res.body.expired).toBe(true);
    });
  });

});
