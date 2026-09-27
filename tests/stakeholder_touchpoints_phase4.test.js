/**
 * tests/stakeholder_touchpoints_phase4.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Stakeholder Touchpoints Phase 4 Test Suite:
 * Institutional Scale, Automated Quality Assurance & Predictive Governance
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
const { memoryChangeOrders } = require('../src/routes/projects');
const { inMemoryInvoices } = require('../src/routes/invoices');
const { runWeeklyExecutiveCheck } = require('../src/services/weekly-executive-cron');

describe('Stakeholder Touchpoints Phase 4 Suite', () => {

  const adminToken = signToken({
    userId: 'EMP-ADM-001',
    name: 'Tanvir Ahmed',
    role: 'Managing Director',
    accessLevel: 'Owner / Admin',
    department: 'Executive',
    linkedType: 'team'
  });

  const clientUser = {
    userId: 'CLI-P4-001',
    name: 'Sarah Connor',
    email: 'sarah@skynet.ai',
    role: 'Client',
    accessLevel: 'Client',
    linkedType: 'client',
    linkedId: 'CLI-P4-001',
    company: 'SkyNet Global'
  };

  const clientToken = signToken(clientUser);

  const testProjId = 'PRJ-P4-SKYT-01';
  const testReviewId = 'REV-P4-DELIV-01';
  const testGoldAffiliateId = 'AFF-P4-GOLD-01';
  let testChangeOrderId = 'CO-2026-P4TEST';

  beforeAll(async () => {
    // 1. Seed Active Project
    saveMemoryProject({
      id: testProjId,
      name: 'SkyNet Multi-Modal Engine',
      client: 'SkyNet Global',
      client_name: 'SkyNet Global',
      client_id: clientUser.linkedId,
      clientId: clientUser.linkedId,
      budget: 200000,
      price: 200000,
      cogs: 20000,
      totalCOGS: 20000,
      cogsItems: [{ id: 'COGS-001', itemType: 'Initial GPU compute', amountBDT: 20000 }],
      delivery_pod: 'MVP_BUILD_POD',
      deliveryPod: 'MVP_BUILD_POD',
      target_sla_days: 14,
      targetSlaDays: 14,
      status: 'Active',
      affiliateId: testGoldAffiliateId,
      warranty_until: new Date(Date.now() + 28 * 86400000).toISOString()
    });

    // 2. Seed Review Deliverable with multi-cut versions
    memoryDeliverables.push({
      id: testReviewId,
      project_id: testProjId,
      projectId: testProjId,
      project_name: 'SkyNet Multi-Modal Engine - Cut v2',
      client: 'SkyNet Global',
      client_id: clientUser.linkedId,
      clientId: clientUser.linkedId,
      status: 'In Review',
      active_version: 'v2',
      versions: ['v1', 'v2'],
      revision_round: 2,
      media_url: 'https://assets.mixkit.co/videos/preview/mixkit-set-of-plateaus-seen-from-the-sky-in-a-sunset-26070-large.mp4',
      resolved_count: 3,
      total_count: 4
    });

    // 3. Seed Gold Partner Affiliate (>= 200k earnings)
    memoryAffiliates.set(testGoldAffiliateId, {
      id: testGoldAffiliateId,
      refCode: testGoldAffiliateId,
      name: 'Venture Capital Partner',
      email: 'vc@venturepartner.com',
      totalEarnedBDT: 250000,
      pendingBalanceBDT: 60000,
      paidOutBDT: 190000,
      dealsClosed: 8,
      settlementAccount: {
        type: 'BRAC Bank Limited',
        bankName: 'BRAC Bank Limited',
        accountName: 'Venture Capital Partners Ltd',
        accountNumber: '2081636480001',
        branch: 'Corporate Mohakhali'
      }
    });

    // 4. Seed Pending Change Order
    memoryChangeOrders.set(testProjId, [
      {
        id: testChangeOrderId,
        projectId: testProjId,
        title: 'Add Distributed ComfyUI Render Nodes',
        description: 'Scale worker pool to 4x RTX 4090 clusters',
        estimatedDays: 4,
        feeBDT: 20000,
        status: 'PENDING_APPROVAL',
        requestedBy: 'Sarah Connor',
        createdAt: new Date().toISOString()
      }
    ]);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TRACK 1: Client Experience & Deliverable Governance
  // ───────────────────────────────────────────────────────────────────────────
  describe('Track 1: Client Experience & Governance', () => {
    test('GET /api/reviews/:id/compare returns side-by-side synchronized version details', async () => {
      const res = await request(app)
        .get('/api/reviews/' + testReviewId + '/compare')
        .set('Authorization', 'Bearer ' + clientToken);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.reviewId).toBe(testReviewId);
      expect(res.body.activeVersion).toBe('v2');
      expect(res.body.previousVersion).toBe('v1');
      expect(res.body.comparisonMode).toBe('side_by_side_synchronized');
    });

    test('POST /api/reviews/:id/feedback captures post-acceptance NPS score & features 10/10 reviews', async () => {
      const res = await request(app)
        .post('/api/reviews/' + testReviewId + '/feedback')
        .set('Authorization', 'Bearer ' + clientToken)
        .send({
          csatRating: 5,
          npsScore: 10,
          reviewText: 'Flawless 14-day delivery sprint. Engineering velocity exceeded all benchmarks.',
          consentShowcase: true
        });

      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.isFeaturedTestimonial).toBe(true);
      expect(res.body.testimonial.npsScore).toBe(10);
      expect(res.body.testimonial.csatRating).toBe(5);
    });

    test('GET /api/reviews/testimonials/showcase retrieves public consented testimonials', async () => {
      const res = await request(app)
        .get('/api/reviews/testimonials/showcase');

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.count).toBeGreaterThanOrEqual(1);
      expect(res.body.testimonials.some(t => t.npsScore === 10)).toBe(true);
    });

    test('GET /api/projects/:id/ip-certificate returns cryptographically signed Master IP Certificate', async () => {
      const res = await request(app)
        .get('/api/projects/' + testProjId + '/ip-certificate')
        .set('Authorization', 'Bearer ' + clientToken);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.certificate).toBeDefined();
      expect(res.body.certificate.ipTransferStatus).toBe('IRREVOCABLE_ASSIGNMENT');
      expect(res.body.certificate.digitalVerificationHash).toMatch(/^GRO10X-SEC-/);
      expect(res.body.certificate.settlementRail).toContain('2081636480001');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TRACK 2: Partners & Affiliates (Co-Branding & Retainer Compounding)
  // ───────────────────────────────────────────────────────────────────────────
  describe('Track 2: Partner Scale & Retainer Compounding', () => {
    test('GET /api/affiliates/portal/:refCode delivers co-branded intake configuration for Gold Partner', async () => {
      const res = await request(app)
        .get('/api/affiliates/portal/' + testGoldAffiliateId);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.tier).toBe('Gold');
      expect(res.body.isGoldWhiteLabelEligible).toBe(true);
      expect(res.body.branding.coBrandedTitle).toContain('GRO10X');
      expect(res.body.branding.partnerCommissionRatePercent).toBe(15);
    });

    test('Paying retainer renewal invoice automatically compounds recurring partner commission', async () => {
      const partnerBefore = memoryAffiliates.get(testGoldAffiliateId);
      const balanceBefore = partnerBefore.pendingBalanceBDT;

      const invoicePayload = {
        id: 'INV-P4-RET-01',
        client_name: 'SkyNet Global',
        project_name: 'SkyNet Multi-Modal Engine - Monthly Retainer',
        project_ref: testProjId,
        projectRef: testProjId,
        amount: 60000,
        invoice_type: 'retainer_renewal',
        invoiceType: 'retainer_renewal',
        status: 'Pending',
        currency: 'BDT'
      };
      inMemoryInvoices.unshift(invoicePayload);

      const res = await request(app)
        .put('/api/invoices/INV-P4-RET-01')
        .set('Authorization', 'Bearer ' + adminToken)
        .send({ status: 'Paid' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Partner should receive 20% on retainer renewal (Gold Tier: 60000 * 0.20 = 12000 BDT)
      const partnerAfter = memoryAffiliates.get(testGoldAffiliateId);
      expect(partnerAfter.pendingBalanceBDT).toBe(balanceBefore + 12000);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TRACK 3: Specialist Performance Index (SPI) & Compute COGS Claims
  // ───────────────────────────────────────────────────────────────────────────
  describe('Track 3: Specialist SPI & Compute COGS Verification', () => {
    test('GET /api/team/specialist/:id/spi computes Specialist Performance Index (0-100)', async () => {
      const res = await request(app)
        .get('/api/team/specialist/GRO-000/spi')
        .set('Authorization', 'Bearer ' + adminToken);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.spiScore).toBeGreaterThanOrEqual(70);
      expect(res.body.tierBadge).toBeDefined();
      expect(res.body.metrics.onTimeDeliveryRate).toBeDefined();
    });

    test('POST /api/projects/:id/cogs-claim logs compute expense and recalculates gross margin', async () => {
      const res = await request(app)
        .post('/api/projects/' + testProjId + '/cogs-claim')
        .set('Authorization', 'Bearer ' + adminToken)
        .send({
          itemType: 'RunPod GPU Cluster',
          description: 'H100 GPU fine-tuning inference batch',
          amountBDT: 15000,
          receiptUrl: 'https://runpod.io/receipts/inv-8821.pdf'
        });

      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.claim).toBeDefined();
      expect(res.body.totalCOGS).toBe(35000); // 20000 + 15000
      expect(res.body.grossProfit).toBe(165000); // 200000 - 35000
      expect(res.body.marginValue).toBe(82.5); // 165000 / 200000 * 100
      expect(res.body.isHealthy).toBe(true);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TRACK 4: Manager Triage, Counter-Proposal, Retro & Defect Holdback
  // ───────────────────────────────────────────────────────────────────────────
  describe('Track 4: Manager Governance & Retrospective Engine', () => {
    test('GET /api/projects/change-orders/pending lists unapproved change orders across pods', async () => {
      const res = await request(app)
        .get('/api/projects/change-orders/pending')
        .set('Authorization', 'Bearer ' + adminToken);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.count).toBeGreaterThanOrEqual(1);
      expect(res.body.pendingChangeOrders.some(co => co.id === testChangeOrderId)).toBe(true);
    });

    test('PUT /api/projects/:id/change-order/:coId/adjust counter-proposes timeline & fee', async () => {
      const res = await request(app)
        .put('/api/projects/' + testProjId + '/change-order/' + testChangeOrderId + '/adjust')
        .set('Authorization', 'Bearer ' + adminToken)
        .send({
          proposedFeeBDT: 28000,
          estimatedDays: 6,
          notes: 'Adjusted for additional WebRTC latency optimization.'
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.changeOrder.feeBDT).toBe(28000);
      expect(res.body.changeOrder.estimatedDays).toBe(6);
    });

    test('POST /api/projects/:id/retro generates comprehensive AI Sprint Retrospective', async () => {
      const res = await request(app)
        .post('/api/projects/' + testProjId + '/retro')
        .set('Authorization', 'Bearer ' + adminToken);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.retrospective).toBeDefined();
      expect(res.body.retrospective.velocityTargetDays).toBe(14);
      expect(res.body.retrospective.onTimeDelivery).toBe(true);
      expect(res.body.retrospective.keyHighlights.length).toBeGreaterThan(0);
    });

    test('POST /api/tickets/:id/sla-holdback applies 15% escrow holdback on contractor SLA breach', async () => {
      const res = await request(app)
        .post('/api/tickets/TCK-P4-DEFECT/sla-holdback')
        .set('Authorization', 'Bearer ' + adminToken)
        .send({
          holdbackPercent: 15,
          reason: 'Unresolved P0 Database Connection Pool Blocker > 4h',
          contractorId: 'Contractor Specialist Alpha'
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.holdback).toBeDefined();
      expect(res.body.holdback.holdbackPercent).toBe(15);
      expect(res.body.holdback.status).toBe('HELD_IN_ESCROW');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TRACK 5: Leadership Consolidated P&L Waterfall & Weekly Executive Dispatch
  // ───────────────────────────────────────────────────────────────────────────
  describe('Track 5: Leadership P&L Waterfall & Weekly Audit', () => {
    test('GET /api/engines/pnl-waterfall computes 5-Engine revenue, COGS, and cash runway', async () => {
      const res = await request(app)
        .get('/api/engines/pnl-waterfall')
        .set('Authorization', 'Bearer ' + adminToken);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.waterfall).toBeDefined();
      expect(res.body.waterfall.grossInflowUSD).toBeGreaterThan(0);
      expect(res.body.waterfall.cogs.totalCOGS_USD).toBeGreaterThan(0);
      expect(res.body.waterfall.marginValue).toBeGreaterThanOrEqual(70);
      expect(res.body.waterfall.runwayMonths).toBeGreaterThanOrEqual(12);
    });

    test('runWeeklyExecutiveCheck executes cleanly and dispatches audit summary', async () => {
      const result = await runWeeklyExecutiveCheck();
      expect(result.ok).toBe(true);
      expect(result.report).toBeDefined();
      expect(result.report.arrMasterTargetUSD).toBe(100000);
      expect(result.report.settlementRail).toContain('2081636480001');
    });
  });

});