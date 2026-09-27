/**
 * tests/stakeholder_touchpoints_phase3.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Stakeholder Touchpoints Phase 3 Test Suite:
 * Institutional Touchpoints, Autonomous Co-Pilots & Cross-Engine Velocity
 * ─────────────────────────────────────────────────────────────────────────────
 */

process.env.NODE_ENV = 'test';
process.env.TELEGRAM_OWNER_CHAT_ID = '7754769807';
process.env.TELEGRAM_ADMIN_CHAT_ID = '7754769807';

const request = require('supertest');
const app = require('../server');
const { signToken } = require('../src/services/jwt');
const { saveMemoryProject } = require('../src/services/post-delivery');
const { memoryDeliverables } = require('../src/services/delivery-review');
const { memoryAffiliates } = require('../src/routes/affiliates');
const { inMemoryInvoices } = require('../src/routes/invoices');
const { runDefectEscalationCheck } = require('../src/services/defect-escalation-cron');

describe('Stakeholder Touchpoints Phase 3 Suite', () => {

  const adminToken = signToken({
    userId: 'EMP-ADM-001',
    name: 'Tanvir Ahmed',
    role: 'Managing Director',
    accessLevel: 'Owner / Admin',
    department: 'Executive',
    linkedType: 'team'
  });

  const clientUser = {
    userId: 'CLI-P3-001',
    name: 'Sarah Connor',
    email: 'sarah@skynet.ai',
    role: 'Client',
    accessLevel: 'Client',
    linkedType: 'client',
    linkedId: 'CLI-P3-001',
    company: 'SkyNet Global'
  };

  const clientToken = signToken(clientUser);
  const testProjId = 'PRJ-P3-SKYT-01';
  const testReviewId = 'REV-P3-DELIV-01';
  const testAffiliateId = 'AFF-P3-VIP-01';

  beforeAll(async () => {
    // 1. Seed Active Client Project
    saveMemoryProject({
      id: testProjId,
      name: 'SkyNet Neural Core MVP',
      client: 'SkyNet Global',
      client_name: 'SkyNet Global',
      client_id: clientUser.linkedId,
      clientId: clientUser.linkedId,
      budget: 150000,
      price: 150000,
      cogs: 25000,
      totalCOGS: 25000,
      delivery_pod: 'MVP_BUILD_POD',
      deliveryPod: 'MVP_BUILD_POD',
      target_sla_days: 14,
      targetSlaDays: 14,
      stage: 'Engineering',
      delivery_status: 'ENGINEERING',
      status: 'Active',
      warranty_until: new Date(Date.now() + 25 * 86400000).toISOString()
    });

    // 2. Seed Review Deliverable for Milestone Approval
    memoryDeliverables.push({
      id: testReviewId,
      project_id: testProjId,
      projectId: testProjId,
      project_name: 'SkyNet Neural Core MVP - Sprint Deliverable',
      client: 'SkyNet Global',
      client_id: clientUser.linkedId,
      clientId: clientUser.linkedId,
      status: 'In Review',
      versions: ['v1.0']
    });

    // 3. Seed Affiliate for Tiering and BRAC Bank Export
    memoryAffiliates.set(testAffiliateId, {
      id: testAffiliateId,
      refCode: testAffiliateId,
      name: 'Venture Studio Partner',
      email: 'partner@venturestudio.io',
      totalEarnedBDT: 75000,
      paidOutBDT: 20000,
      pendingBalanceBDT: 55000,
      dealsClosed: 3,
      settlementAccount: {
        type: 'BRAC Bank Limited',
        bankName: 'BRAC Bank Limited',
        accountName: 'Venture Studio Inc',
        accountNumber: '2081636480001',
        branch: 'Corporate Mohakhali'
      },
      payoutHistory: [
        {
          id: 'PAY-P3-001',
          affiliateId: testAffiliateId,
          affiliateName: 'Venture Studio Partner',
          amountBDT: 15000,
          status: 'Pending Verification',
          requestedAt: new Date().toISOString(),
          settlementAccount: {
            bankName: 'BRAC Bank Limited',
            accountName: 'Venture Studio Inc',
            accountNumber: '2081636480001',
            branch: 'Corporate Mohakhali'
          }
        }
      ]
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TRACK 1: Client Context-Aware AI Sprint Co-Pilot (POST /api/chat/send)
  // ───────────────────────────────────────────────────────────────────────────
  describe('Track 1: Client AI Sprint Co-Pilot', () => {
    test('Identifies authenticated client and activates AI Co-Pilot mode with sprint context', async () => {
      const res = await request(app)
        .post('/api/chat/send')
        .set('Authorization', 'Bearer ' + clientToken)
        .send({
          command: 'What is my sprint status?',
          mode: 'client'
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.isAiCoPilot).toBe(true);
      expect(res.body.reply).toBeDefined();
      expect(res.body.reply).toMatch(/SkyNet Neural Core MVP|Sprint/i);
    });

    test('Answers client warranty SLA inquiry with zero-cost guarantee and SLA windows', async () => {
      const res = await request(app)
        .post('/api/chat/send')
        .set('Authorization', 'Bearer ' + clientToken)
        .send({
          command: 'Tell me about the warranty and SLA for my project',
          mode: 'client'
        });

      expect(res.status).toBe(200);
      expect(res.body.isAiCoPilot).toBe(true);
      expect(res.body.reply).toMatch(/30-Day Zero-Cost Warranty Shield/i);
      expect(res.body.reply).toMatch(/4-Hour Response/i);
    });

    test('Answers client billing inquiry with BRAC Bank corporate settlement rail', async () => {
      const res = await request(app)
        .post('/api/chat/send')
        .set('Authorization', 'Bearer ' + clientToken)
        .send({
          command: 'How do I wire invoice payments to the bank?',
          mode: 'client'
        });

      expect(res.status).toBe(200);
      expect(res.body.isAiCoPilot).toBe(true);
      expect(res.body.reply).toMatch(/BRAC Bank PLC/i);
      expect(res.body.reply).toMatch(/2081636480001/);
      expect(res.body.reply).toMatch(/Neoncore Tech Solution/i);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TRACK 2: Milestone 2 Completion Invoicing on Deliverable Acceptance
  // ───────────────────────────────────────────────────────────────────────────
  describe('Track 2: Milestone 2 Invoicing on Sign-Off', () => {
    test('Approving deliverable automatically generates Milestone 2 completion invoice with 5% VAT', async () => {
      const res = await request(app)
        .post('/api/reviews/approve')
        .set('Authorization', 'Bearer ' + clientToken)
        .send({
          reviewId: testReviewId
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.milestoneInvoiceReleased).toBe(true);
      expect(res.body.invoiceId).toBeDefined();
      expect(res.body.milestoneInvoice).toBeDefined();
      expect(res.body.milestoneInvoice.invoiceType).toBe('milestone_completion');
      expect(res.body.milestoneInvoice.settlementRail).toBe('bdt_bank_wire');
      expect(res.body.milestoneInvoice.taxRate).toBe(5);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TRACK 3: Scope Change Order Engine & Pod Workload Guardrail
  // ───────────────────────────────────────────────────────────────────────────
  describe('Track 3: Scope Change Order Addendum & Pod Capacity', () => {
    let createdCoId = null;

    test('Creates formal Scope Change Order with BDT pricing and delivery delta', async () => {
      const res = await request(app)
        .post('/api/projects/' + testProjId + '/change-order')
        .set('Authorization', 'Bearer ' + clientToken)
        .send({
          title: 'Add Realtime Voice Agent Integration',
          description: 'Deploy Twilio + Gemini Live API voice pipeline',
          deliverables: ['WebRTC Audio Streamer', 'Twilio Webhook Connector'],
          estimatedDays: 5,
          proposedFeeBDT: 25000
        });

      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.changeOrder).toBeDefined();
      expect(res.body.changeOrder.id).toMatch(/^CO-2026-/);
      expect(res.body.changeOrder.feeBDT).toBe(25000);
      expect(res.body.changeOrder.estimatedDays).toBe(5);
      expect(res.body.changeOrder.status).toBe('PENDING_APPROVAL');

      createdCoId = res.body.changeOrder.id;
    });

    test('Lists all change orders for a specific project', async () => {
      const res = await request(app)
        .get('/api/projects/' + testProjId + '/change-orders')
        .set('Authorization', 'Bearer ' + clientToken);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.count).toBeGreaterThanOrEqual(1);
      expect(res.body.changeOrders.some(co => co.id === createdCoId)).toBe(true);
    });

    test('Approving change order updates status to APPROVED and auto-issues addendum invoice', async () => {
      const res = await request(app)
        .put('/api/projects/' + testProjId + '/change-order/' + createdCoId + '/approve')
        .set('Authorization', 'Bearer ' + adminToken)
        .send({ approvedBy: 'Lead Technical Architect' });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.changeOrder.status).toBe('APPROVED');
      expect(res.body.invoice).toBeDefined();
      expect(res.body.invoice.invoiceType).toBe('change_order');
      expect(res.body.invoice.amount).toBe(25000);
    });

    test('Pod capacity guardrail detects >= 2 in-flight sprints and raises HIGH_CAPACITY warning', async () => {
      saveMemoryProject({
        id: 'PRJ-POD-TEST-A',
        name: 'Creative Sprint Alpha',
        delivery_pod: 'CREATIVE_AI_POD',
        deliveryPod: 'CREATIVE_AI_POD',
        status: 'Active'
      });
      saveMemoryProject({
        id: 'PRJ-POD-TEST-B',
        name: 'Creative Sprint Beta',
        delivery_pod: 'CREATIVE_AI_POD',
        deliveryPod: 'CREATIVE_AI_POD',
        status: 'Active'
      });

      const res = await request(app)
        .post('/api/projects/intake')
        .set('Authorization', 'Bearer ' + adminToken)
        .send({
          title: 'Viral UGC Video Avatar Campaign',
          category: 'Creative AI Video',
          budget: 50000
        });

      expect(res.status).toBe(201);
      expect(res.body.project.deliveryPod).toBe('CREATIVE_AI_POD');
      expect(res.body.project.podLoadWarning).toBe('HIGH_CAPACITY');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TRACK 4: Partner Tiering, BRAC Bank CSV Export & Cross-Engine Attribution
  // ───────────────────────────────────────────────────────────────────────────
  describe('Track 4: Partner Tiering, BRAC Bank Payouts & Cross-Engine Commerce', () => {
    test('Returns Silver Growth Partner badge and 12.5% rate for partner with ৳75,000 volume', async () => {
      const partnerToken = signToken({
        userId: testAffiliateId,
        refCode: testAffiliateId,
        name: 'Venture Studio Partner',
        role: 'Partner',
        accessLevel: 'Partner'
      });

      const res = await request(app)
        .get('/api/affiliates/me')
        .set('Authorization', 'Bearer ' + partnerToken);

      expect(res.status).toBe(200);
      expect(res.body.affiliate).toBeDefined();
      expect(res.body.affiliate.tier).toBe('Silver');
      expect(res.body.affiliate.tierBadge).toMatch(/Silver Growth Partner/);
      expect(res.body.affiliate.commissionRatePercent).toBe(12.5);
    });

    test('Disburses affiliate payout record with BRAC Bank transaction reference', async () => {
      const res = await request(app)
        .post('/api/affiliates/payouts/PAY-P3-001/disburse')
        .set('Authorization', 'Bearer ' + adminToken)
        .send({
          txRef: 'BRAC-EFT-99281',
          paymentRail: 'BRAC Corporate EFT'
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.payout.status).toBe('Disbursed');
      expect(res.body.payout.txRef).toBe('BRAC-EFT-99281');
    });

    test('Generates structured BRAC Bank batch payout disbursement CSV', async () => {
      const res = await request(app)
        .get('/api/affiliates/payouts/export-brac')
        .set('Authorization', 'Bearer ' + adminToken);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/csv/);
      expect(res.text).toContain('Beneficiary Name,Account Number,Bank Name,Branch,Amount BDT,Payment Reference,Status');
      expect(res.text).toContain('BRAC Bank Limited');
      expect(res.text).toContain('2081636480001');
    });

    test('Attributes cross-engine commerce order and calculates tiered partner commission', async () => {
      const res = await request(app)
        .post('/api/affiliates/attribute-order')
        .send({
          refCode: testAffiliateId,
          orderId: 'DV-ORD-8821',
          orderType: 'engine3_digivault',
          orderAmountBDT: 20000,
          customerName: 'Fintech Startup Ltd'
        });

      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.attributed).toBe(true);
      expect(res.body.tier).toBe('Silver');
      expect(res.body.commissionRate).toBe(0.125);
      expect(res.body.commissionEarnedBDT).toBe(2500);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TRACK 5: Specialist Commission Disbursement & Defect SLA Escalation
  // ───────────────────────────────────────────────────────────────────────────
  describe('Track 5: Specialist Commission & 24h Defect SLA Escalation', () => {
    test('Marking invoice as Paid settles commercial transaction and creates official tax receipt', async () => {
      const invoicePayload = {
        id: 'INV-P3-SPEC-01',
        client_name: 'SkyNet Global',
        project_name: 'Neural Pipeline',
        amount: 80000,
        status: 'Pending',
        currency: 'BDT'
      };
      inMemoryInvoices.unshift(invoicePayload);

      const res = await request(app)
        .put('/api/invoices/INV-P3-SPEC-01')
        .set('Authorization', 'Bearer ' + adminToken)
        .send({ status: 'Paid' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.invoice.status).toBe('Paid');
      expect(res.body.invoice.paidDate).toBeDefined();

      const receiptRes = await request(app)
        .get('/api/invoices/INV-P3-SPEC-01/receipt');

      expect(receiptRes.status).toBe(200);
      expect(receiptRes.body.receipt.status).toBe('CLEARED');
      expect(receiptRes.body.receipt.ipTransferStatus).toBe('CERTIFIED_AND_RELEASED');
      expect(receiptRes.body.receipt.accountNumber).toBe('2081636480001');
    });

    test('Defect SLA Escalation Cron evaluates without errors and handles ticket checks', async () => {
      const results = await runDefectEscalationCheck();
      expect(Array.isArray(results)).toBe(true);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TRACK 6: Consolidated 5-Engine Forecast & Executive Flash Briefing
  // ───────────────────────────────────────────────────────────────────────────
  describe('Track 6: 5-Engine Forecast & Executive Briefing', () => {
    test('GET /api/engines/forecast returns 30-day projection, gross margin and net cash flow', async () => {
      const res = await request(app)
        .get('/api/engines/forecast')
        .set('Authorization', 'Bearer ' + adminToken);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.projectedAnnualARR).toBeGreaterThan(0);
      expect(res.body.arrMasterTargetUSD).toBe(100000);
      expect(res.body.cashFlow).toBeDefined();
      expect(res.body.cashFlow.monthlyInflowUSD).toBeGreaterThan(0);
      expect(res.body.cashFlow.runwayMonths).toBeGreaterThanOrEqual(12);
      expect(res.body.engineProjections.engine2_sprints).toBeDefined();
    });

    test('POST /api/engines/flash-dispatch issues executive pulse briefing', async () => {
      const res = await request(app)
        .post('/api/engines/flash-dispatch')
        .set('Authorization', 'Bearer ' + adminToken);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.dispatchedAt).toBeDefined();
    });
  });

});