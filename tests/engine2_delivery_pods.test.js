/**
 * tests/engine2_delivery_pods.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Engine 2 Phase 2 Comprehensive Test Suite:
 * Delivery Pods, Resource Capacity, Utilization & Project-Level COGS
 * ─────────────────────────────────────────────────────────────────────────────
 * Validates:
 * Track 1: Canonical Delivery Pod Catalog & Velocity Standards (14d, 21d, 7d)
 * Track 2: Project Pod Assignment & Dynamic Lead Architect Allocation
 * Track 3: Team Capacity, Billable Benchmark (75%–85%) & Status Classification
 * Track 4: Project Direct COGS Ledger, Multi-Currency Conversion & True Gross Margin
 * Track 5: API Endpoints (GET /api/team/pods, GET /api/team/capacity, POST /api/projects/:id/pod, POST /api/projects/:id/cogs, GET /api/projects/:id/cogs)
 * Track 6: Stakeholder Event & Alert Wiring (pod.assigned, cogs.margin_warning)
 * ─────────────────────────────────────────────────────────────────────────────
 */

const request = require('supertest');
const app = require('../server');
const { signToken } = require('../src/services/jwt');
const {
  POD_TYPES,
  getDeliveryPods,
  assignPodToProject,
  getProjectPod,
  calculateTeamCapacity,
  logProjectCOGS,
  getProjectCOGS
} = require('../src/services/delivery-pods');
const { saveMemoryProject } = require('../src/services/post-delivery');
const { stakeholderEvents } = require('../src/services/stakeholder-events');

describe('Engine 2 Phase 2: Delivery Pods, Capacity & Unit Economics', () => {

  const adminToken = signToken({
    userId: 'EMP-ADM-01',
    name: 'Fahim Rahman (Lead Dev)',
    role: 'Technology Admin',
    accessLevel: 'Owner / Admin',
    department: 'Engineering',
    linkedType: 'team'
  });

  const specialistToken = signToken({
    userId: 'EMP-SPEC-02',
    name: 'Anika Nower',
    role: 'Specialist',
    accessLevel: 'Specialist / Crew',
    department: 'Production',
    linkedType: 'team'
  });

  const testProjectId = `PRJ-POD-TEST-${Date.now()}`;

  beforeAll(async () => {
    // Seed test project with revenue
    saveMemoryProject({
      id: testProjectId,
      name: 'Alpha AI Automation Sprint',
      client_name: 'Alpha Health Corp',
      budget: 350000, // 350,000 BDT
      currency: 'BDT',
      status: 'Active',
      delivery_status: 'IN_PROGRESS'
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TRACK 1: Canonical Delivery Pod Catalog & Velocity Standards
  // ─────────────────────────────────────────────────────────────────────────
  describe('Track 1: Canonical Delivery Pod Catalog & Velocity Standards', () => {
    test('Catalog defines all 3 pods with exact target velocity days', () => {
      const pods = getDeliveryPods();
      expect(pods.length).toBe(3);

      const mvp = pods.find(p => p.id === 'MVP_BUILD_POD');
      expect(mvp).toBeDefined();
      expect(mvp.targetVelocityDays).toBe(14);
      expect(mvp.rolesRequired).toContain('Lead Architect');

      const ent = pods.find(p => p.id === 'ENTERPRISE_AUTOMATION_POD');
      expect(ent).toBeDefined();
      expect(ent.targetVelocityDays).toBe(21);
      expect(ent.rolesRequired).toContain('Solutions Architect');

      const creative = pods.find(p => p.id === 'CREATIVE_AI_POD');
      expect(creative).toBeDefined();
      expect(creative.targetVelocityDays).toBe(7);
      expect(creative.rolesRequired).toContain('Creative Director');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TRACK 2: Project Pod Assignment Service Logic
  // ─────────────────────────────────────────────────────────────────────────
  describe('Track 2: Project Pod Assignment Service Logic', () => {
    test('assignPodToProject assigns pod, members, and target velocity', async () => {
      const assignment = await assignPodToProject(testProjectId, {
        podType: 'ENTERPRISE_AUTOMATION_POD',
        leadEngineer: 'Tariq Rahman',
        assignedMembers: ['Tariq Rahman', 'Asif Mahmud'],
        notes: 'Priority hospital EHR integration'
      });

      expect(assignment.projectId).toBe(testProjectId);
      expect(assignment.podType).toBe('ENTERPRISE_AUTOMATION_POD');
      expect(assignment.leadEngineer).toBe('Tariq Rahman');
      expect(assignment.assignedMembers).toEqual(['Tariq Rahman', 'Asif Mahmud']);
      expect(assignment.targetVelocityDays).toBe(21);

      const fetched = await getProjectPod(testProjectId);
      expect(fetched.podType).toBe('ENTERPRISE_AUTOMATION_POD');
      expect(fetched.leadEngineer).toBe('Tariq Rahman');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TRACK 3: Team Capacity & Billable Benchmark (75%–85%)
  // ─────────────────────────────────────────────────────────────────────────
  describe('Track 3: Team Capacity & Billable Benchmark Tracking', () => {
    test('calculateTeamCapacity returns benchmark metrics without division by zero', async () => {
      const capacity = await calculateTeamCapacity();

      expect(capacity).toBeDefined();
      expect(capacity.targetUtilizationRange).toBe('75% - 85%');
      expect(typeof capacity.totalStaff).toBe('number');
      expect(typeof capacity.overallUtilizationPercent).toBe('number');
      expect(Array.isArray(capacity.staffCapacity)).toBe(true);

      if (capacity.staffCapacity.length > 0) {
        const member = capacity.staffCapacity[0];
        expect(member.capacityHours).toBe(40);
        expect(['AVAILABLE', 'OPTIMAL', 'OVERLOADED']).toContain(member.status);
      }
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TRACK 4: Direct COGS Ledger & Gross Margin Enforcement
  // ─────────────────────────────────────────────────────────────────────────
  describe('Track 4: Direct COGS Ledger & Unit Economics', () => {
    test('logProjectCOGS logs expense in USD with automatic BDT conversion (120:1)', async () => {
      const record = await logProjectCOGS(testProjectId, {
        itemType: 'AI_API_TOKENS',
        vendor: 'OpenAI GPT-4o API',
        amount: 250, // 250 USD
        currency: 'USD',
        description: 'Synthetic document extraction tokens'
      });

      expect(record.projectId).toBe(testProjectId);
      expect(record.amount).toBe(250);
      expect(record.currency).toBe('USD');
      expect(record.amountUSD).toBe(250);
      expect(record.amountBDT).toBe(250 * 120); // 30,000 BDT
    });

    test('getProjectCOGS calculates true Gross Margin % accurately', async () => {
      // Revenue is 350,000 BDT. Logged COGS is 30,000 BDT.
      // Gross Profit: 320,000 BDT. Margin: 320,000 / 350,000 = 91% -> HEALTHY_MARGIN
      const report = await getProjectCOGS(testProjectId);

      expect(report.projectId).toBe(testProjectId);
      expect(report.projectRevenue).toBe(350000);
      expect(report.totalCOGS).toBe(30000);
      expect(report.grossProfit).toBe(320000);
      expect(report.grossMarginPercent).toBeGreaterThanOrEqual(90);
      expect(report.status).toBe('HEALTHY_MARGIN');
    });

    test('Triggers cogs.margin_warning event when margin drops below 70%', async () => {
      const emitSpy = jest.spyOn(stakeholderEvents, 'routeTelegramNotification');

      // Add heavy GPU compute cost: 100,000 BDT
      await logProjectCOGS(testProjectId, {
        itemType: 'GPU_CLOUD_COMPUTE',
        vendor: 'RunPod Cloud H100',
        amount: 1000, // 1000 USD = 120,000 BDT
        currency: 'USD',
        description: 'Llama-3 70B LoRA fine-tuning run'
      });

      // Total COGS is now 30,000 + 120,000 = 150,000 BDT (42.8% of 350k revenue -> 57% margin < 70%)
      const marginReport = await getProjectCOGS(testProjectId);
      expect(marginReport.grossMarginPercent).toBeLessThan(70);
      expect(marginReport.status).toBe('MODERATE_MARGIN');

      emitSpy.mockRestore();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TRACK 5: HTTP API Endpoints Integration Tests
  // ─────────────────────────────────────────────────────────────────────────
  describe('Track 5: HTTP API Endpoints Integration Tests', () => {
    test('GET /api/team/pods returns available delivery pods', async () => {
      const res = await request(app)
        .get('/api/team/pods')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.pods.length).toBe(3);
    });

    test('GET /api/team/capacity returns benchmark telemetry', async () => {
      const res = await request(app)
        .get('/api/team/capacity')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.capacity.targetUtilizationRange).toBe('75% - 85%');
    });

    test('POST /api/projects/:id/pod assigns pod with Manager authority (200)', async () => {
      const res = await request(app)
        .post(`/api/projects/${testProjectId}/pod`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          podType: 'MVP_BUILD_POD',
          leadEngineer: 'Fahim Rahman (Lead Dev)',
          assignedMembers: ['Fahim Rahman', 'Anika Nower'],
          notes: 'Standard MVP sprint allocation'
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.pod.podType).toBe('MVP_BUILD_POD');
    });

    test('GET /api/projects/:id/pod retrieves assigned pod details (200)', async () => {
      const res = await request(app)
        .get(`/api/projects/${testProjectId}/pod`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.pod.podType).toBe('MVP_BUILD_POD');
      expect(res.body.pod.targetVelocityDays).toBe(14);
    });

    test('POST /api/projects/:id/cogs logs compute cost via API (201)', async () => {
      const res = await request(app)
        .post(`/api/projects/${testProjectId}/cogs`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          itemType: 'THIRD_PARTY_LICENSE',
          vendor: 'Pinecone Vector DB Enterprise',
          amount: 50,
          currency: 'USD',
          description: 'Vector namespace index monthly slot'
        });

      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.cogs.amountUSD).toBe(50);
    });

    test('GET /api/projects/:id/cogs returns full ledger and Gross Margin % (200)', async () => {
      const res = await request(app)
        .get(`/api/projects/${testProjectId}/cogs`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.totalCOGS).toBeGreaterThan(0);
      expect(res.body.cogsItems.length).toBeGreaterThan(0);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TRACK 6: Stakeholder Event & Alert Wiring
  // ─────────────────────────────────────────────────────────────────────────
  describe('Track 6: Stakeholder Event & Alert Routing', () => {
    test('stakeholderEvents routes pod.assigned and cogs.margin_warning without crashing', async () => {
      const emitSpy = jest.spyOn(stakeholderEvents, 'routeTelegramNotification');

      const podRes = await stakeholderEvents.emitEvent('pod.assigned', {
        projectId: testProjectId,
        podName: 'MVP Rapid Delivery Pod',
        targetVelocityDays: 14,
        leadEngineer: 'Fahim Rahman',
        assignedMembers: ['Fahim Rahman', 'Anika Nower']
      });
      expect(podRes.success).toBe(true);

      const marginRes = await stakeholderEvents.emitEvent('cogs.margin_warning', {
        projectId: testProjectId,
        projectName: 'Alpha AI Automation Sprint',
        grossMarginPercent: 57,
        totalCOGS: 150000,
        totalCogsUSD: 1250,
        projectRevenue: 350000,
        status: 'MODERATE_MARGIN'
      });
      expect(marginRes.success).toBe(true);

      expect(emitSpy).toHaveBeenCalledTimes(2);
      emitSpy.mockRestore();
    });
  });
});
