/**
 * tests/engine2_full_lifecycle_ops.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * End-to-End Operational Lifecycle & Multi-Pillar Test Suite for Engine 2:
 * 1. Delivery Pods & Team Billable Capacity
 * 2. Project Direct COGS Ledger & Gross Margin % Calculation
 * 3. Subcontractor Scoped Gateway with 100% Financial Masking
 * 4. Unified Project Lifecycle Timeline Aggregation
 * 5. Inbound AI Readiness Audit Scorecard & Lead Capture
 * 6. Master Service Agreement (MSA) & NDA Generator
 * 7. Monthly Retainer Hours Bank & Burn-Down Ledger
 * 8. Executive Flash Report & Telegram KPI Briefing
 * ─────────────────────────────────────────────────────────────────────────────
 */

const request = require('supertest');
const app = require('../server');
const { signToken } = require('../src/services/jwt');

describe('Engine 2 Full Operational Lifecycle & Multi-Pillar Systems', () => {

  const adminToken = signToken({
    userId: 'EMP-MD-001',
    name: 'Tanvir Ahmed',
    role: 'Managing Director',
    accessLevel: 'Owner / Admin',
    department: 'Executive',
    linkedType: 'team'
  });

  const specialistToken = signToken({
    userId: 'EMP-SPEC-007',
    name: 'Subcontractor Dev',
    role: 'AI Engineer',
    accessLevel: 'Specialist / Crew',
    department: 'Engineering',
    linkedType: 'team'
  });

  const testProjectCode = `PRJ-OPS-${Date.now().toString().slice(-6)}`;

  beforeAll(async () => {
    const { saveMemoryProject } = require('../src/services/post-delivery');

    saveMemoryProject({
      id: testProjectCode,
      name: 'Enterprise Agentic Workflow Automation',
      client: 'Apex Fintech Solutions',
      clientName: 'Apex Fintech Solutions',
      clientId: 'CLI-APEX-001',
      budget: 150000, // 150,000 BDT
      hourlyRate: 50,
      retainerHours: 30,
      department: 'Production',
      workflowType: 'composite_bundle',
      status: 'In Progress',
      stage: 'development',
      createdAt: '2026-09-01T10:00:00.000Z',
      warranty_start_date: '2026-09-10T12:00:00.000Z',
      warranty_until: new Date(Date.now() + 20 * 24 * 3600000).toISOString(),
      handover_manifest: {
        manifestId: 'MAN-2026-TEST',
        signedAt: '2026-09-10T12:00:00.000Z',
        signedBy: 'Apex CTO',
        status: 'SIGNED_AND_TRANSFERRED'
      }
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Pillar 1: Team & Delivery Pods Capacity
  // ───────────────────────────────────────────────────────────────────────────
  describe('Pillar 1: Delivery Pods & Capacity', () => {
    it('GET /api/team/capacity returns crew headcount, utilization and billable benchmark', async () => {
      const res = await request(app)
        .get('/api/team/capacity')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.capacity).toBeDefined();
      expect(res.body.capacity.totalMembers).toBeGreaterThan(0);
      expect(res.body.capacity.utilizationBenchmark).toBe('75% - 85%');
      expect(res.body.capacity.utilizationRate).toBeDefined();
    });

    it('GET /api/team/pods lists the 3 standard delivery pods', async () => {
      const res = await request(app)
        .get('/api/team/pods')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(Array.isArray(res.body.pods)).toBe(true);
      const podTypes = res.body.pods.map(p => p.type);
      expect(podTypes).toContain('MVP_BUILD_POD');
      expect(podTypes).toContain('ENTERPRISE_AUTOMATION_POD');
      expect(podTypes).toContain('CREATIVE_AI_POD');
    });

    it('POST /api/projects/:id/pod assigns a delivery pod to project', async () => {
      const res = await request(app)
        .post(`/api/projects/${testProjectCode}/pod`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          podType: 'ENTERPRISE_AUTOMATION_POD',
          leadId: 'EMP-SPEC-007'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.pod.podType).toBe('ENTERPRISE_AUTOMATION_POD');
      expect(res.body.pod.podName).toBe('Enterprise Automation & Integration Pod');
    });

    it('POST /api/projects/:id/cogs logs compute and token expenses and returns gross margin', async () => {
      // 1. Log AI API Tokens expense
      const cogsRes = await request(app)
        .post(`/api/projects/${testProjectCode}/cogs`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          category: 'ai_api_tokens',
          costUsd: 50,
          description: 'Gemini 1.5 Pro & Claude 3.5 Sonnet extraction tokens'
        });

      expect(cogsRes.statusCode).toBe(201);
      expect(cogsRes.body.ok).toBe(true);
      expect(cogsRes.body.cogs.costUsd).toBe(50);
      expect(cogsRes.body.cogs.costBdt).toBe(6000); // 50 * 120

      // 2. Query Project COGS & Gross Margin
      const getRes = await request(app)
        .get(`/api/projects/${testProjectCode}/cogs`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(getRes.statusCode).toBe(200);
      expect(getRes.body.ok).toBe(true);
      expect(getRes.body.totalCogsUsd).toBeGreaterThanOrEqual(50);
      expect(getRes.body.totalCogsBdt).toBeGreaterThanOrEqual(6000);
      expect(getRes.body.grossMarginPercent).toBeDefined();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Pillar 2: Access & Interactions (Contractor Scoped Gateway & Timeline)
  // ───────────────────────────────────────────────────────────────────────────
  describe('Pillar 2: Subcontractor Gateway & Unified Timeline', () => {
    it('GET /api/projects/:id/contractor-view strictly masks commercial financials', async () => {
      const res = await request(app)
        .get(`/api/projects/${testProjectCode}/contractor-view`)
        .set('Authorization', `Bearer ${specialistToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.financialsMasked).toBe(true);
      expect(res.body.viewMode).toBe('subcontractor_scoped');

      // CRITICAL: Financials MUST be completely undefined / stripped
      expect(res.body.budget).toBeUndefined();
      expect(res.body.price).toBeUndefined();
      expect(res.body.hourlyRate).toBeUndefined();
      expect(res.body.hourly_rate).toBeUndefined();
      expect(res.body.cogs).toBeUndefined();
      expect(res.body.invoices).toBeUndefined();

      // Technical & scope details MUST be available
      expect(res.body.projectName).toBe('Enterprise Agentic Workflow Automation');
      expect(res.body.technicalGuidelines).toBeDefined();
      expect(res.body.technicalGuidelines.repositoryStandard).toBeDefined();
      expect(res.body.client.companyName).toBe('Apex Fintech Solutions');
    });

    it('GET /api/projects/:id/timeline returns chronological project lifecycle events', async () => {
      const res = await request(app)
        .get(`/api/projects/${testProjectCode}/timeline`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(Array.isArray(res.body.timeline)).toBe(true);
      expect(res.body.count).toBeGreaterThan(0);

      const categories = res.body.timeline.map(e => e.category);
      expect(categories).toContain('onboarding');
      expect(categories).toContain('handover');
      expect(categories).toContain('warranty');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Pillar 3: Sales Channels & MSA Legal Shield
  // ───────────────────────────────────────────────────────────────────────────
  describe('Pillar 3: Sales Channels & MSA Legal Generator', () => {
    it('POST /api/leads/ai-audit calculates AI readiness score and captures lead tagged engine2', async () => {
      const res = await request(app)
        .post('/api/leads/ai-audit')
        .send({
          companyName: 'Fintech Nexus International',
          contactName: 'Sarah Jenkins',
          email: 'sarah@nexusfin.io',
          phone: '+1 415 555 2671',
          currentTechStack: ['PostgreSQL', 'Python', 'FastAPI', 'AWS Bedrock'],
          dataReadiness: 'clean_relational_db',
          automationPriority: 'internal_ops',
          monthlyBudgetUsd: 4500,
          timelineUrgency: 'immediate_1_2_weeks'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.leadId).toBeDefined();
      expect(res.body.scorecard).toBeDefined();

      // High readiness criteria
      expect(res.body.scorecard.score).toBeGreaterThanOrEqual(80);
      expect(res.body.scorecard.readinessTier).toBe('Enterprise AI Pioneer');
      expect(res.body.scorecard.recommendedPod).toBe('MVP_BUILD_POD');
    });

    it('GET /api/projects/:id/msa generates formal legal agreement with IP assignment & NDA', async () => {
      const res = await request(app)
        .get(`/api/projects/${testProjectCode}/msa`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.msa).toBeDefined();
      expect(res.body.msa.msaId).toMatch(/^MSA-2026-/);
      expect(res.body.msa.verificationHash).toMatch(/^GRO10X-SEC-/);
      expect(res.body.msa.parties.provider.legalName).toBe('GRO10X Business Limited');
      expect(res.body.msa.parties.client.companyName).toBe('Apex Fintech Solutions');

      // Verify essential legal protections
      const ipClause = res.body.msa.clauses.find(c => c.section.includes('2.'));
      expect(ipClause.title).toContain('Intellectual Property');
      expect(ipClause.content).toContain('irrevocably transfers and assigns 100%');

      const ndaClause = res.body.msa.clauses.find(c => c.section.includes('3.'));
      expect(ndaClause.title).toContain('Non-Disclosure');
      expect(ndaClause.content).toContain('five (5) consecutive years');

      const warrantyClause = res.body.msa.clauses.find(c => c.section.includes('4.'));
      expect(warrantyClause.content).toContain('30-calendar-day warranty');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Pillar 4: Retainer Hours Banking & Executive Reporting
  // ───────────────────────────────────────────────────────────────────────────
  describe('Pillar 4: Retainer Banking & Executive Reporting', () => {
    it('GET /api/projects/:id/retainer-bank retrieves initial retainer hours balance', async () => {
      const res = await request(app)
        .get(`/api/projects/${testProjectCode}/retainer-bank`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.totalPurchasedHours).toBe(30);
      expect(res.body.remainingHours).toBe(30);
      expect(res.body.burnRatePercent).toBe(0);
      expect(res.body.status).toBe('healthy');
    });

    it('POST /api/projects/:id/retainer-bank/log records hours and transitions status', async () => {
      // Log 25 hours out of 30 (83% burn rate -> nearing_capacity)
      const res = await request(app)
        .post(`/api/projects/${testProjectCode}/retainer-bank/log`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          hours: 25,
          taskDescription: 'Custom LangGraph agent orchestration & Supabase pgvector setup',
          category: 'ai_development'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.summary.usedHours).toBe(25);
      expect(res.body.summary.remainingHours).toBe(5);
      expect(res.body.summary.burnRatePercent).toBe(83);
      expect(res.body.summary.status).toBe('nearing_capacity');
      expect(res.body.summary.alert).toContain('consumed 83% of monthly hours');
    });

    it('GET & POST /api/engines/engine2/flash-report compiles target ARR, utilization and briefing', async () => {
      const getRes = await request(app)
        .get('/api/engines/engine2/flash-report')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(getRes.statusCode).toBe(200);
      expect(getRes.body.ok).toBe(true);
      expect(getRes.body.report).toBeDefined();
      expect(getRes.body.report.financialTargets.annualTargetUsd).toBe(25000);
      expect(getRes.body.report.financialTargets.quotaAchievementRate).toBeDefined();
      expect(getRes.body.report.operationsAndCapacity.deliveryPods.length).toBe(3);
      expect(getRes.body.report.postDeliveryGovernance.slaComplianceRate).toBe('100%');

      // POST to dispatch
      const postRes = await request(app)
        .post('/api/engines/engine2/flash-report')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ dispatchTelegram: false }); // dry run

      expect(postRes.statusCode).toBe(200);
      expect(postRes.body.ok).toBe(true);
      expect(postRes.body.report.executiveBriefing.length).toBeGreaterThan(0);
    });
  });
});
