/**
 * tests/stakeholder_database_wiring.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Cross-Stakeholder Database Persistence & Wiring Integrity Verification Suite
 * ─────────────────────────────────────────────────────────────────────────────
 * Validates end-to-end data durability and attribution across all 5 stakeholders:
 * 1. Scope Change Orders: Addendum creation, counter-proposal triage & invoice generation
 * 2. Specialist Compute COGS: GPU claims persistence, total COGS rollup & 70% margin guardrail
 * 3. Retainer Hours Banking: Task time rollup with parameter normalization (taskName/engineer)
 * 4. Defect Ticket SLA Holdback: 15% escrow freeze propagation to Contractor Gateway
 * 5. Proposal Acceptance & Invoice Settlement: Partner affiliate attribution chain & commission accrual
 * 6. Post-Delivery Governance: Handover manifest signing, dispute warranty freeze/extension
 * 7. Client Showcase Testimonials: CSAT/NPS submission & public showcase consent filtering
 * 8. AI Sprint Retrospectives: Multi-metric velocity generation, persistence & retrieval
 * ─────────────────────────────────────────────────────────────────────────────
 */

process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../server');
const { signToken } = require('../src/services/jwt');
const {
  saveMemoryProject,
  getOrCreateHandoverManifest,
  signHandoverManifest,
  raiseProjectDispute,
  resolveProjectDispute,
  submitProjectTestimonial,
  getPublicTestimonials
} = require('../src/services/post-delivery');
const {
  initializeRetainerBank,
  getRetainerBank,
  logRetainerHours
} = require('../src/services/retainer-bank');
const { getContractorProjectView } = require('../src/services/project-access');
const { getAffiliateRecord, memoryAffiliates } = require('../src/routes/affiliates');
const { inMemoryProposals } = require('../src/routes/proposals');

describe('Stakeholder Database Persistence & Wiring Integrity Suite', () => {

  const managerToken = signToken({
    userId: 'MGR-001',
    name: 'Delivery Operations Lead',
    role: 'Delivery Manager',
    accessLevel: 'Manager',
    emp_code: 'MGR-001'
  });

  const specialistToken = signToken({
    userId: 'SPEC-042',
    name: 'Farhan AI Specialist',
    role: 'Specialist',
    accessLevel: 'Specialist',
    emp_code: 'SPEC-042'
  });

  const testProjectId = 'PRJ-WIRE-TEST-2026';
  const testAffiliateId = 'AFF-TANVIR';

  beforeAll(() => {
    // Seed test project in post-delivery memory
    saveMemoryProject({
      id: testProjectId,
      name: 'Autonomous Agent Platform Sprint',
      client: 'Apex Fintech Solutions',
      client_name: 'Apex Fintech Solutions',
      client_id: 'CLI-APEX-001',
      budget: 250000,
      price: 250000,
      status: 'Active',
      stage: 'Delivery',
      target_sla_days: 14,
      contractorPayoutBDT: 50000,
      warranty_until: new Date(Date.now() + 30 * 86400000).toISOString(),
      affiliateId: testAffiliateId
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 1. SCOPE CHANGE ORDERS LIFECYCLE & PERSISTENCE
  // ───────────────────────────────────────────────────────────────────────────
  describe('1. Scope Change Orders Lifecycle & Persistence', () => {
    let changeOrderId = null;

    it('POST /api/projects/:id/change-order — creates a formal change order addendum', async () => {
      const res = await request(app)
        .post(`/api/projects/${testProjectId}/change-order`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          title: 'Fine-Tuning Llama 3 70B Quantized Pipeline',
          description: 'Client requested local quantized inference on-premise.',
          deliverables: ['GGUF Model Weights', 'vLLM Serving Script'],
          estimatedDays: 4,
          proposedFeeBDT: 25000,
          requestedBy: 'Apex Fintech Solutions'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.changeOrder).toBeDefined();
      expect(res.body.changeOrder.status).toBe('PENDING_APPROVAL');
      expect(res.body.changeOrder.feeBDT).toBe(25000);
      expect(res.body.changeOrder.estimatedDays).toBe(4);
      changeOrderId = res.body.changeOrder.id;
    });

    it('PUT /api/projects/:id/change-order/:coId/adjust — manager adjusts days and fee', async () => {
      const res = await request(app)
        .put(`/api/projects/${testProjectId}/change-order/${changeOrderId}/adjust`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          proposedFeeBDT: 30000,
          estimatedDays: 5,
          notes: 'Model weights require additional quantization verification'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.changeOrder.feeBDT).toBe(30000);
      expect(res.body.changeOrder.estimatedDays).toBe(5);
      expect(res.body.changeOrder.managerNotes).toContain('verification');
    });

    it('POST /api/projects/:id/change-order/:coId/approve — signs off and generates invoice', async () => {
      const res = await request(app)
        .post(`/api/projects/${testProjectId}/change-order/${changeOrderId}/approve`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ approvedBy: 'Delivery Lead' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.changeOrder.status).toBe('APPROVED');
      expect(res.body.changeOrder.approvedBy).toBe('Delivery Lead');
      expect(res.body.invoice).toBeDefined();
      expect(res.body.invoice.amount).toBe(30000);
    });

    it('GET /api/projects/:id/change-orders — lists all change orders for project', async () => {
      const res = await request(app)
        .get(`/api/projects/${testProjectId}/change-orders`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBeGreaterThanOrEqual(1);
      const found = res.body.changeOrders.find(co => co.id === changeOrderId);
      expect(found).toBeDefined();
      expect(found.status).toBe('APPROVED');
    });

    it('GET /api/projects/change-orders/pending — handles pending query', async () => {
      const res = await request(app)
        .get('/api/projects/change-orders/pending')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.pendingChangeOrders)).toBe(true);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2. SPECIALIST COMPUTE COGS CLAIMS & PROFIT MARGIN GUARDRAIL
  // ───────────────────────────────────────────────────────────────────────────
  describe('2. Compute COGS Claims & Margin Guardrails', () => {
    it('POST /api/projects/:id/cogs-claim — records GPU expense and updates margin', async () => {
      const res = await request(app)
        .post(`/api/projects/${testProjectId}/cogs-claim`)
        .set('Authorization', `Bearer ${specialistToken}`)
        .send({
          itemType: 'RunPod H100 GPU Cluster',
          description: 'Model fine-tuning 18 compute hours',
          amountBDT: 15000,
          receiptUrl: 'https://runpod.io/receipts/inv-88421.pdf'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.totalCOGS).toBe(15000);
      expect(res.body.marginValue).toBeGreaterThan(70.0);
      expect(res.body.isHealthy).toBe(true);
      expect(res.body.claim.itemType).toBe('RunPod H100 GPU Cluster');
    });

    it('POST /api/projects/:id/cogs-claim — rejects invalid zero or negative amounts', async () => {
      const res = await request(app)
        .post(`/api/projects/${testProjectId}/cogs-claim`)
        .set('Authorization', `Bearer ${specialistToken}`)
        .send({
          itemType: 'Invalid Claim',
          amountBDT: -500
        });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3. RETAINER HOURS BANKING & PARAMETER INTEROPERABILITY
  // ───────────────────────────────────────────────────────────────────────────
  describe('3. Retainer Hours Banking & Parameter Interoperability', () => {
    it('initializes retainer bank and logs hours using taskName and engineer aliases', async () => {
      initializeRetainerBank(testProjectId, {
        totalPurchasedHours: 50,
        hourlyRateUsd: 55
      });

      // Pass taskName and engineer as sent by tasks.js
      const logResult = await logRetainerHours(testProjectId, {
        hours: 12.5,
        engineer: 'Tanvir Ahmed',
        taskName: 'RAG Pipeline Indexing & Pinecone Upsert',
        notes: 'Sprint 2 Milestone implementation'
      });

      expect(logResult.ok).toBe(true);
      expect(logResult.log.taskDescription).toBe('RAG Pipeline Indexing & Pinecone Upsert');
      expect(logResult.log.loggedBy).toBe('Tanvir Ahmed');
      expect(logResult.hoursLogged).toBe(12.5);
      expect(logResult.hoursRemaining).toBe(37.5);
    });

    it('GET /api/projects/:id/retainer-bank — returns accurate consumption summary', async () => {
      const res = await request(app)
        .get(`/api/projects/${testProjectId}/retainer-bank`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.bank.totalPurchasedHours).toBe(50);
      expect(res.body.bank.usedHours).toBe(12.5);
      expect(res.body.bank.remainingHours).toBe(37.5);
      expect(res.body.bank.status).toBe('healthy');
      expect(res.body.bank.tasks.length).toBeGreaterThanOrEqual(1);
      expect(res.body.bank.tasks[0].taskDescription).toBe('RAG Pipeline Indexing & Pinecone Upsert');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4. DEFECT TICKET SLA HOLDBACK & CONTRACTOR ESCROW WIRING
  // ───────────────────────────────────────────────────────────────────────────
  describe('4. Defect Ticket SLA Holdback & Contractor Escrow Wiring', () => {
    const defectTicketId = 'TCK-SLA-DEFECT-001';

    it('POST /api/tickets/:id/sla-holdback — manager freezes 15% escrow on SLA breach', async () => {
      const res = await request(app)
        .post(`/api/tickets/${defectTicketId}/sla-holdback`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          holdbackPercent: 15,
          reason: 'P0 Critical Defect Resolution Exceeded 24h SLA',
          contractorId: 'SPEC-042'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.holdback.status).toBe('HELD_IN_ESCROW');
      expect(res.body.holdback.holdbackPercent).toBe(15);
    });

    it('getContractorProjectView — contractor gateway reflects 15% holdback warning notice', async () => {
      const contractorView = await getContractorProjectView(testProjectId, 'specialist');

      expect(contractorView).toBeDefined();
      expect(contractorView.escrow).toBeDefined();
      expect(contractorView.escrow.status).toBe('HELD_IN_ESCROW');
      expect(contractorView.escrow.statusLabel).toContain('15% Milestone Holdback Active');
      expect(contractorView.slaNotice).toBeDefined();
      expect(contractorView.slaNotice.type).toBe('holdback_active');
      expect(contractorView.slaNotice.holdbackPercent).toBe(15);
      expect(contractorView.slaNotice.holdbackBDT).toBe(7500); // 15% of 50,000 BDT
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 5. PROPOSAL ACCEPTANCE ATTRIBUTION & INVOICE SETTLEMENT COMMISSION
  // ───────────────────────────────────────────────────────────────────────────
  describe('5. Proposal Acceptance Attribution & Invoice Settlement Commission', () => {
    const shareToken = `PROP-WIRE-${Date.now().toString(36)}`;
    let generatedInvoiceId = null;

    beforeAll(() => {
      inMemoryProposals.push({
        id: `PROP-WIRE-ID`,
        share_token: shareToken,
        client_name: 'Summit Power AI',
        client_company: 'Summit Power AI',
        client_email: 'procurement@summitpower.com',
        project_title: 'Enterprise AI Operations Hub',
        one_time_total: 100000,
        currency: 'BDT',
        status: 'Sent',
        affiliate_id: testAffiliateId,
        ref_code: testAffiliateId
      });
    });

    it('POST /api/public/proposals/:token/accept — propagates affiliate attribution to client & invoice', async () => {
      const res = await request(app)
        .post(`/api/public/proposals/${shareToken}/accept`)
        .send({
          acceptedBy: 'Chief Technology Officer',
          clientNote: 'Approved for Q4 delivery sprint'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.invoice).toBeDefined();
      expect(res.body.invoice.affiliateId).toBe(testAffiliateId);
      expect(res.body.invoice.subtotal).toBe(100000);
      expect(res.body.invoice.amount).toBe(105000);
      generatedInvoiceId = res.body.invoice.id;
    });

    it('PUT /api/invoices/:id (Paid) — credits affiliate commission automatically', async () => {
      const initialAffiliate = await getAffiliateRecord(testAffiliateId);
      const prevPending = Number(initialAffiliate.pendingBalanceBDT || 0);
      const prevClosed = Number(initialAffiliate.dealsClosed || 0);

      const res = await request(app)
        .put(`/api/invoices/${generatedInvoiceId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ status: 'Paid' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const updatedAffiliate = await getAffiliateRecord(testAffiliateId);
      expect(updatedAffiliate.dealsClosed).toBe(prevClosed + 1);
      // Sprint rate is 10% on 100,000 BDT = 10,000 BDT
      expect(updatedAffiliate.pendingBalanceBDT).toBe(prevPending + 10000);

      const conv = (updatedAffiliate.conversions || []).find(c => c.invoiceId === generatedInvoiceId);
      expect(conv).toBeDefined();
      expect(conv.commissionEarnedBDT).toBe(10000);
      expect(conv.status).toBe('Accrued');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 6. POST-DELIVERY GOVERNANCE & HANDOVER MANIFEST
  // ───────────────────────────────────────────────────────────────────────────
  describe('6. Post-Delivery Governance, Disputes & Handover Manifest', () => {
    it('generates and retrieves formal handover manifest', async () => {
      const manifest = await getOrCreateHandoverManifest(testProjectId);

      expect(manifest).toBeDefined();
      expect(manifest.projectId).toBe(testProjectId);
      expect(manifest.ipTransferStatus).toBe('IRREVOCABLY_ASSIGNED');
      expect(manifest.ipAssignmentClause).toContain('Neoncore Tech Solution / Gro10x.ai irrevocably assigns');
      expect(manifest.signatories.agencyLead.status).toBe('VERIFIED_SIGNATURE');
    });

    it('raises deliverable dispute and freezes warranty timer', async () => {
      const result = await raiseProjectDispute(testProjectId, {
        reason: 'QUALITY_DEFECT',
        description: 'Output latency exceeds 500ms baseline in stress test.',
        submittedBy: 'Apex Fintech Lead',
        requestedRemedy: 'CORRECTION_SPRINT'
      });

      expect(result.success).toBe(true);
      expect(result.dispute.status).toBe('ACTIVE_DISPUTE');
      expect(result.dispute.reason).toBe('QUALITY_DEFECT');
    });

    it('resolves deliverable dispute and extends warranty window', async () => {
      const result = await resolveProjectDispute(testProjectId, {
        resolutionType: 'CORRECTION_SPRINT_GRANTED',
        resolutionNotes: 'Granted +7 days correction sprint with dedicated senior engineer',
        extensionDays: 7,
        resolvedBy: 'Managing Director'
      });

      expect(result.success).toBe(true);
      expect(result.resolutionType).toBe('CORRECTION_SPRINT_GRANTED');
      expect(result.deliveryStatus).toBe('REVISION_REQUESTED');
    });

    it('signs formal handover manifest digitally', async () => {
      const signed = await signHandoverManifest(testProjectId, {
        signedBy: 'Dr. Tariq Rahman',
        signatoryRole: 'Chief Executive Officer'
      });

      expect(signed).toBeDefined();
      expect(signed.isSigned).toBe(true);
      expect(signed.signatories.clientSignatory.name).toBe('Dr. Tariq Rahman');
      expect(signed.signatories.clientSignatory.status).toBe('DIGITALLY_SIGNED');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 7. CLIENT CSAT & NPS SHOWCASE TESTIMONIALS
  // ───────────────────────────────────────────────────────────────────────────
  describe('7. Client CSAT/NPS Testimonials & Showcase', () => {
    it('submits client testimonial with showcase consent', async () => {
      const testimonial = await submitProjectTestimonial(testProjectId, {
        csatRating: 5,
        npsScore: 10,
        reviewText: 'GRO10X transformed our entire AI workflow in 14 days with zero downtime.',
        clientDisplayName: 'Dr. Tariq Rahman',
        clientRole: 'Chief Executive Officer',
        clientCompany: 'Apex Fintech Solutions',
        consentShowcase: true
      });

      expect(testimonial).toBeDefined();
      expect(testimonial.csatRating).toBe(5);
      expect(testimonial.npsScore).toBe(10);
      expect(testimonial.consentShowcase).toBe(true);

      const publicList = await getPublicTestimonials();
      const found = publicList.find(t => t.id === testimonial.id);
      expect(found).toBeDefined();
      expect(found.reviewText).toContain('transformed our entire AI workflow');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 8. SPRINT RETROSPECTIVE GENERATION & RETRIEVAL
  // ───────────────────────────────────────────────────────────────────────────
  describe('8. AI Sprint Retrospective & Velocity Report', () => {
    it('POST /api/projects/:id/retro — generates velocity and financial report', async () => {
      const res = await request(app)
        .post(`/api/projects/${testProjectId}/retro`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.retrospective).toBeDefined();
      expect(res.body.retrospective.projectId).toBe(testProjectId);
      expect(res.body.retrospective.onTimeDelivery).toBe(true);
      expect(res.body.retrospective.grossRevenueBDT).toBe(250000);
      expect(res.body.retrospective.realizedGrossMarginPercent).toBeDefined();
    });

    it('GET /api/projects/:id/retro — retrieves persisted sprint retrospective', async () => {
      const res = await request(app)
        .get(`/api/projects/${testProjectId}/retro`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.retrospective).toBeDefined();
      expect(res.body.retrospective.projectId).toBe(testProjectId);
      expect(res.body.retrospective.onTimeDelivery).toBe(true);
    });

    it('GET /api/projects/unknown-proj/retro — returns 404 when retro not generated', async () => {
      const res = await request(app)
        .get('/api/projects/PRJ-NONEXISTENT/retro')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(404);
      expect(res.body.ok).toBe(false);
    });
  });

});
