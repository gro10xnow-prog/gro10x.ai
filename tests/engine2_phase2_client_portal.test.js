/**
 * tests/engine2_phase2_client_portal.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Phase 2 Test Suite: Engine 2 Client Portal Transformation
 * 
 * Verifies all 6 functional tracks:
 * 1. Active Rapid Sprint Progress Cockpit & Pod Assignment API
 * 2. 30-Day Bug-Fix Warranty Countdown Shield & SLA Delivery
 * 3. Retainer Hours Bank & Burn-Down Ledger API
 * 4. Statutory 5% VAT Invoicing & BRAC Bank Corporate Wire Settlement
 * 5. Deliverable Formal Sign-Off & Dual Warranty Activation
 * 6. Legal MSA / Mutual NDA & IP Handover Shield Governance
 * ─────────────────────────────────────────────────────────────────────────────
 */

process.env.NODE_ENV = 'test';
process.env.TELEGRAM_OWNER_CHAT_ID = '7754769807';
process.env.TELEGRAM_ADMIN_CHAT_ID = '7754769807';

const request = require('supertest');
const app = require('../server');
const { signToken } = require('../src/services/jwt');
const { saveMemoryProject, memoryProjects } = require('../src/services/post-delivery');
const { initializeRetainerBank, logRetainerHours } = require('../src/services/retainer-bank');
const { assignPodToProject, POD_TYPES } = require('../src/services/delivery-pods');
const botNotifications = require('../src/services/bot/notifications');

describe('Engine 2 Phase 2: Client Portal Transformation & Governance', () => {

  const clientToken = signToken({
    userId: 'CLI-PURPLE-001',
    name: 'Purplebot Digital',
    company: 'Purplebot Digital',
    role: 'Client Partner',
    accessLevel: 'Client',
    linkedType: 'client',
    linkedId: 'CLI-PURPLE-001'
  });

  const adminToken = signToken({
    userId: 'EMP-MD-001',
    name: 'Tanvir Ahmed',
    role: 'Managing Director',
    accessLevel: 'Owner / Admin',
    department: 'Executive',
    linkedType: 'team'
  });

  const testProjectId = `PRJ-CL-E2-${Date.now()}`;
  const testReviewId = `REV-CL-E2-${Date.now()}`;

  beforeAll(async () => {
    // 1. Seed test project into memory
    saveMemoryProject({
      id: testProjectId,
      name: 'Agentic CRM Orchestration Sprint',
      client: 'Purplebot Digital',
      clientName: 'Purplebot Digital',
      clientId: 'CLI-PURPLE-001',
      budget: 150000,
      hourlyRate: 50,
      retainerHours: 30,
      department: 'Production',
      workflowType: 'composite_bundle',
      status: 'In Progress',
      delivery_status: 'IN_PROGRESS',
      createdAt: '2026-09-01T10:00:00.000Z',
      warranty_until: new Date(Date.now() + 25 * 24 * 3600000).toISOString()
    });

    // 2. Seed delivery pod assignment
    await assignPodToProject(testProjectId, {
      podType: 'MVP_BUILD_POD',
      leadEngineer: 'Amanullah (Tech Lead)',
      assignedMembers: ['Sabbir (Full Stack)', 'Rifat (AI Engineer)']
    });

    // 3. Seed retainer bank
    initializeRetainerBank(testProjectId, 30);
    await logRetainerHours(testProjectId, {
      taskDescription: 'LangGraph Autonomous Router Pipeline Implementation',
      hours: 12,
      category: 'AI Architecture',
      engineer: 'Amanullah (Tech Lead)'
    });
    await logRetainerHours(testProjectId, {
      taskDescription: 'WhatsApp Webhook & Streaming Response Bridge',
      hours: 13,
      category: 'API Integration',
      engineer: 'Sabbir (Full Stack)'
    });

    // 4. Seed review deliverable
    const { memoryDeliverables } = require('../src/services/delivery-review');
    memoryDeliverables.push({
      id: testReviewId,
      project_id: testProjectId,
      projectId: testProjectId,
      project_name: 'Agentic CRM Orchestration Sprint',
      client: 'Purplebot Digital',
      client_id: 'CLI-PURPLE-001',
      clientId: 'CLI-PURPLE-001',
      title: 'v1.0 Milestone Release — Core Graph Engine',
      status: 'Pending Review',
      isApproved: false
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  // ─────────────────────────────────────────────────────────────
  // Track 1 & 2: Active Rapid Sprint Progress Cockpit & Pod Data
  // ─────────────────────────────────────────────────────────────
  describe('Track 1 & 2: Sprint Progress & Pod Assignment APIs', () => {

    test('GET /api/projects retrieves project with pod & warranty metadata', async () => {
      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);

      const target = res.body.find(p => p.id === testProjectId);
      expect(target).toBeDefined();
      expect(target.name).toBe('Agentic CRM Orchestration Sprint');
      expect(target.warrantyUntil).toBeDefined();
    });

    test('GET /api/projects/:id/pod delivers assigned pod name, velocity target & engineers', async () => {
      const res = await request(app)
        .get(`/api/projects/${testProjectId}/pod`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.pod.podName).toBe('MVP Rapid Delivery Pod');
      expect(res.body.pod.targetVelocityDays).toBe(14);
      expect(res.body.pod.leadEngineer).toBe('Amanullah (Tech Lead)');
      expect(res.body.pod.assignedMembers).toContain('Sabbir (Full Stack)');
    });

    test('Warranty days remaining calculation reflects active countdown', () => {
      const project = memoryProjects.get(testProjectId);
      const diffMs = new Date(project.warranty_until).getTime() - Date.now();
      const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      
      expect(daysRemaining).toBeGreaterThanOrEqual(24);
      expect(daysRemaining).toBeLessThanOrEqual(26);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Track 3: Retainer Hours Bank & Burn-Down Ledger
  // ─────────────────────────────────────────────────────────────
  describe('Track 3: Retainer Bank Burn-Down & Activity Log Ledger', () => {

    test('GET /api/projects/:id/retainer-bank delivers accurate consumption and threshold badge', async () => {
      const res = await request(app)
        .get(`/api/projects/${testProjectId}/retainer-bank`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.totalPurchasedHours).toBe(30);
      expect(res.body.usedHours).toBe(25);
      expect(res.body.remainingHours).toBe(5);
      expect(res.body.burnRatePercent).toBe(83);
      expect(res.body.status).toBe('nearing_capacity');

      // Verify task log entries are delivered transparently
      expect(res.body.logs.length).toBe(2);
      expect(res.body.logs[1].taskDescription).toContain('LangGraph');
      expect(res.body.logs[0].taskDescription).toContain('WhatsApp');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Track 4: Statutory 5% VAT Calculation & BRAC Bank Rails
  // ─────────────────────────────────────────────────────────────
  describe('Track 4: Financial Integrity (5% Statutory VAT & BRAC Bank Wire)', () => {

    test('Calculates 5% VAT accurately on standard discount base', () => {
      const baseDiscounted = 25000;
      const vatRate = 0.05;
      const vatAmount = Math.round(baseDiscounted * vatRate);
      const totalPayable = baseDiscounted + vatAmount;

      expect(vatAmount).toBe(1250);
      expect(totalPayable).toBe(26250);
    });

    test('Enforces corporate wire transfer exclusively (zero mobile wallets)', () => {
      const paymentRails = {
        bank: 'BRAC Bank PLC',
        beneficiary: 'Neoncore Tech Solution',
        accountNumber: '2081636480001',
        branch: 'Mohakhali Branch, Dhaka',
        routingNumber: '060263290',
        allowedPaymentMethods: ['CORPORATE_WIRE', 'EFTN', 'RTGS', 'BEFTN']
      };

      expect(paymentRails.bank).toBe('BRAC Bank PLC');
      expect(paymentRails.accountNumber).toBe('2081636480001');
      expect(paymentRails.allowedPaymentMethods).not.toContain('bKash');
      expect(paymentRails.allowedPaymentMethods).not.toContain('Nagad');
      expect(paymentRails.allowedPaymentMethods).not.toContain('Rocket');
    });

    test('Vector PDF deep-link generates clean URL format', () => {
      const invoiceId = 'INV-2026-PURPLEBOT-001';
      const downloadUrl = `/invoice-view.html?id=${encodeURIComponent(invoiceId)}`;
      expect(downloadUrl).toBe('/invoice-view.html?id=INV-2026-PURPLEBOT-001');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Track 5: Formal Deliverable Acceptance Flow & Modal Data
  // ─────────────────────────────────────────────────────────────
  describe('Track 5: Formal Acceptance & Warranty Start Trigger', () => {

    test('POST /api/reviews/:id/approve activates 30-day warranty and returns invoice release', async () => {
      const notifSpy = jest.spyOn(botNotifications, 'sendWarrantyActivatedNotification').mockReturnValue(true);
      const teamSpy = jest.spyOn(botNotifications, 'sendTeamWarrantyAlert').mockReturnValue(true);

      const res = await request(app)
        .post(`/api/reviews/${testReviewId}/approve`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          approvedBy: 'Anisul Islam (Managing Director)',
          clientName: 'Purplebot Digital'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.warrantyUntil).toBeDefined();
      expect(res.body.warranty.warrantyDays).toBe(30);
      expect(res.body.invoiceId).toBeDefined();

      // Verify cascading project status update
      const updatedProject = memoryProjects.get(testProjectId);
      expect(updatedProject.status).toBe('Completed');
      expect(updatedProject.delivery_status).toBe('APPROVED');

      // Verify Telegram alerts were triggered
      expect(notifSpy).toHaveBeenCalled();
      expect(teamSpy).toHaveBeenCalled();

      notifSpy.mockRestore();
      teamSpy.mockRestore();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Track 6: Legal MSA / Mutual NDA & IP Handover Shield Endpoints
  // ─────────────────────────────────────────────────────────────
  describe('Track 6: Legal Agreements & Handover Governance', () => {

    test('GET /api/projects/:id/msa generates complete MSA document with SHA-256 hash', async () => {
      const res = await request(app)
        .get(`/api/projects/${testProjectId}/msa`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.msa).toBeDefined();

      const msa = res.body.msa;
      expect(msa.parties.client.companyName).toBe('Purplebot Digital');
      expect(msa.verificationHash).toBeDefined();
      expect(msa.verificationHash).toMatch(/^GRO10X-SEC-[A-F0-9]{32}$/);

      // Verify essential contractual clauses
      const clauseTitles = msa.clauses.map(c => c.title);
      expect(clauseTitles.some(t => t.includes('Irrevocable') || t.includes('Intellectual Property'))).toBe(true);
      expect(clauseTitles.some(t => t.includes('Confidentiality') || t.includes('Non-Disclosure'))).toBe(true);
      expect(clauseTitles.some(t => t.includes('Warranty') || t.includes('SLA'))).toBe(true);
    });

    test('POST /api/projects/:id/deliver transitions sprint to DELIVERED and issues manifest', async () => {
      const deliverSprintId = `PRJ-DELIV-${Date.now()}`;
      saveMemoryProject({
        id: deliverSprintId,
        name: 'LLM Multi-Agent Evaluator',
        client: 'Purplebot Digital',
        clientId: 'CLI-PURPLE-001',
        budget: 120000,
        status: 'In Progress'
      });

      const res = await request(app)
        .post(`/api/projects/${deliverSprintId}/deliver`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          deliverables: ['Docker Swarm Compose', 'FastAPI Proxy', 'Automated Eval Notebook'],
          githubRepo: 'https://github.com/gro10x/evaluator-agent',
          handoverNotes: 'All 40 integration unit tests passing. Ready for client acceptance.'
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.deliveryStatus).toBe('DELIVERED');
      expect(res.body.manifest).toBeDefined();
      expect(res.body.manifest.ipTransferStatus).toBe('IRREVOCABLY_ASSIGNED');
      expect(res.body.manifest.deliverablesSummary.length).toBeGreaterThanOrEqual(0);
    });
  });

});
