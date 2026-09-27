/**
 * tests/engine2_phase3_admin_panel.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Phase 3 Test Suite: Engine 2 Admin Panel, Kanban & Finance Integration
 * 
 * Verifies all 6 functional tracks:
 * 1. Engine 2 Flash Report Compilation & Executive Dispatch API
 * 2. Autonomous Delivery Pods & Resource Capacity Tracking APIs
 * 3. Direct Compute & AI Token COGS Ledger and Gross Margin Calculation
 * 4. Retainer Hours Bank Engineering Logs & Capacity Alerts
 * 5. Subcontractor Scoped Gateway & Financial Confidentiality Masking
 * 6. Delivery Pod Assignment & Velocity Governance
 * ─────────────────────────────────────────────────────────────────────────────
 */

process.env.NODE_ENV = 'test';
process.env.TELEGRAM_OWNER_CHAT_ID = '7754769807';
process.env.TELEGRAM_ADMIN_CHAT_ID = '7754769807';

const request = require('supertest');
const app = require('../server');
const { signToken } = require('../src/services/jwt');
const { saveMemoryProject } = require('../src/services/post-delivery');
const { initializeRetainerBank, getRetainerBank } = require('../src/services/retainer-bank');
const { assignPodToProject, logProjectCOGS, getProjectCOGS, POD_TYPES } = require('../src/services/delivery-pods');

describe('Engine 2 Phase 3: Admin Panel, Kanban & Finance Governance', () => {

  const adminToken = signToken({
    userId: 'EMP-MD-001',
    name: 'Tanvir Ahmed',
    role: 'Managing Director',
    accessLevel: 'Owner / Admin',
    department: 'Executive',
    linkedType: 'team'
  });

  const contractorToken = signToken({
    userId: 'CON-EXT-001',
    name: 'External AI Specialist',
    role: 'Subcontractor',
    accessLevel: 'Contractor',
    linkedType: 'contractor'
  });

  const testProjectId = `PRJ-P3-${Date.now()}`;

  beforeAll(async () => {
    // 1. Seed test project into memory
    saveMemoryProject({
      id: testProjectId,
      name: 'Purplebot Multi-Agent Enterprise Automations',
      client: 'Purplebot Digital Limited',
      clientName: 'Purplebot Digital Limited',
      clientId: 'cl-purplebot-01',
      budget: 150000,
      department: 'Production',
      workflowType: 'sprints',
      status: 'Active',
      deliveryStatus: 'IN_PROGRESS',
      createdAt: new Date().toISOString()
    });

    // 2. Initialize retainer bank (30 hours)
    initializeRetainerBank(testProjectId, {
      hoursBanked: 30,
      monthlyRetainerUsd: 1500,
      monthlyRetainerBdt: 180000,
      overageHourlyRateUsd: 50
    });

    // 3. Assign Enterprise Automation Pod
    await assignPodToProject(testProjectId, {
      podType: 'ENTERPRISE_AUTOMATION_POD',
      leadEngineer: 'Ariful Islam',
      assignedMembers: ['Ariful Islam', 'Samiul Alom'],
      notes: 'Phase 3 Verification Sprint'
    });
  });

  // TRACK 1: Engine 2 Executive Flash Report Compilation & Dispatch
  describe('Track 1: Engine 2 Flash Report Compilation & Dispatch', () => {
    test('GET /api/engines/engine2/flash-report returns comprehensive executive metrics', async () => {
      const res = await request(app)
        .get('/api/engines/engine2/flash-report')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.report).toBeDefined();

      const r = res.body.report;
      expect(r.engine).toBe('Engine 2: High-Intent AI Solutions & Rapid Sprints');
      expect(r.financialTargets).toBeDefined();
      expect(r.financialTargets.annualTargetUsd).toBe(25000);
      expect(r.operationsAndCapacity).toBeDefined();
      expect(r.operationsAndCapacity.activePods).toBe(3);
      expect(r.postDeliveryGovernance).toBeDefined();
      expect(r.unitEconomics).toBeDefined();
      expect(typeof r.unitEconomics.grossMargin).toBe('string');
    });

    test('POST /api/engines/engine2/flash-report dispatches alert', async () => {
      const res = await request(app)
        .post('/api/engines/engine2/flash-report')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ dispatchTelegram: true });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.report).toBeDefined();
      expect(res.body.dispatchedAt).toBeDefined();
    });

    test('POST /api/engines/engine2/flash-report rejects unauthorized requests without token', async () => {
      const res = await request(app)
        .post('/api/engines/engine2/flash-report')
        .set('x-disable-dev-auth', 'true')
        .send({});

      expect(res.status).toBe(401);
    });
  });

  // TRACK 2: Delivery Pods & Resource Capacity Tracking
  describe('Track 2: Autonomous Delivery Pods & Resource Capacity Tracking', () => {
    test('GET /api/team/pods returns all 3 canonical delivery pods', async () => {
      const res = await request(app)
        .get('/api/team/pods')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(Array.isArray(res.body.pods)).toBe(true);
      expect(res.body.pods.length).toBe(3);

      const podIds = res.body.pods.map(p => p.id || p.podType);
      expect(podIds).toContain('MVP_BUILD_POD');
      expect(podIds).toContain('ENTERPRISE_AUTOMATION_POD');
      expect(podIds).toContain('CREATIVE_AI_POD');
    });

    test('GET /api/team/capacity returns optimal agency utilization metrics', async () => {
      const res = await request(app)
        .get('/api/team/capacity')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.capacity).toBeDefined();
      expect(res.body.capacity.totalMembers).toBeGreaterThanOrEqual(1);
      expect(res.body.capacity.utilizationBenchmark).toBe('75% - 85%');
    });
  });

  // TRACK 3: Direct Compute & Token COGS Ledger and Gross Margin Calculation
  describe('Track 3: Direct Compute COGS Ledger & Gross Margin Benchmark', () => {
    test('POST /api/projects/:id/cogs logs token compute expense against project', async () => {
      const cogsPayload = {
        amount: 35.50,
        currency: 'USD',
        vendor: 'OpenAI',
        itemType: 'API Tokens',
        description: 'GPT-4o agent execution tokens',
        units: 'Tokens'
      };

      const res = await request(app)
        .post(`/api/projects/${testProjectId}/cogs`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(cogsPayload);

      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.cogs).toBeDefined();
      expect(res.body.cogs.vendor).toBe('OpenAI');
      expect(res.body.cogs.costUsd).toBe(35.50);
    });

    test('GET /api/projects/:id/cogs computes gross profit & checks >= 70% benchmark', async () => {
      const res = await request(app)
        .get(`/api/projects/${testProjectId}/cogs`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.totalCOGS).toBeGreaterThan(0);
      expect(res.body.totalCogsUSD).toBeGreaterThan(0);
      expect(res.body.grossMarginPercent).toBeDefined();
      expect(res.body.itemCount).toBeGreaterThanOrEqual(1);

      // Verify numeric gross margin satisfies the >= 70% direct margin target
      const marginNum = parseFloat(res.body.grossMarginPercent);
      expect(marginNum).toBeGreaterThanOrEqual(70);
    });
  });

  // TRACK 4: Retainer Hours Bank Engineering Logs & Capacity Alerts
  describe('Track 4: Retainer Hours Bank Engineering Logs & Alerts', () => {
    test('POST /api/projects/:id/retainer-bank/log records sprint hours and burns allocation', async () => {
      const logPayload = {
        hours: 4.5,
        taskDescription: 'LangGraph human-in-the-loop checkpoint handler',
        category: 'Architecture & System Design',
        loggedBy: 'Ariful Islam'
      };

      const res = await request(app)
        .post(`/api/projects/${testProjectId}/retainer-bank/log`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(logPayload);

      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.hoursRemaining).toBeLessThan(30);
      expect(res.body.hoursRemaining).toBe(25.5);
      expect(res.body.tasks.length).toBeGreaterThanOrEqual(1);
    });

    test('GET /api/projects/:id/retainer-bank returns burn rate and near capacity status', async () => {
      // Log additional hours to push past 75% capacity threshold
      await request(app)
        .post(`/api/projects/${testProjectId}/retainer-bank/log`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          hours: 19.0,
          taskDescription: 'Supabase pgvector RLS and semantic search router',
          category: 'Core AI/LLM Development'
        });

      const res = await request(app)
        .get(`/api/projects/${testProjectId}/retainer-bank`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.hoursLogged).toBe(23.5);
      expect(res.body.hoursRemaining).toBe(6.5);
      // 23.5 / 30 = 78.3% -> isNearCap should be true
      expect(res.body.isNearCap).toBe(true);
    });
  });

  // TRACK 5: Subcontractor Scoped Gateway & Financial Confidentiality Masking
  describe('Track 5: Subcontractor Scoped Gateway & Financial Masking', () => {
    test('GET /api/projects/:id/contractor-view strictly strips all financial metrics', async () => {
      const res = await request(app)
        .get(`/api/projects/${testProjectId}/contractor-view`)
        .set('Authorization', `Bearer ${contractorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);

      const scoped = res.body.data || res.body.project || res.body;

      // Ensure zero financial data leaks to subcontractors
      expect(scoped.budget).toBeUndefined();
      expect(scoped.price).toBeUndefined();
      expect(scoped.rates).toBeUndefined();
      expect(scoped.invoices).toBeUndefined();
      expect(scoped.cogs).toBeUndefined();
      expect(scoped.grossMargin).toBeUndefined();

      // Ensure technical project data remains accessible
      expect(scoped.id).toBe(testProjectId);
      expect(scoped.name).toBe('Purplebot Multi-Agent Enterprise Automations');
      expect(scoped.status).toBe('Active');
    });
  });

  // TRACK 6: Delivery Pod Assignment & Governance
  describe('Track 6: Delivery Pod Assignment & Governance', () => {
    test('GET /api/projects/:id/pod returns assigned pod governance details', async () => {
      const res = await request(app)
        .get(`/api/projects/${testProjectId}/pod`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.pod).toBeDefined();
      expect(res.body.pod.podType || res.body.pod.type).toBe('ENTERPRISE_AUTOMATION_POD');
      expect(res.body.pod.leadEngineer).toBe('Ariful Islam');
      expect(res.body.pod.targetVelocityDays).toBe(21);
    });
  });
});
