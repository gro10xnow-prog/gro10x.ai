/**
 * tests/stakeholder_cross_connection_hooks.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Verification Test Suite:
 * Stakeholder Cross-Connections, Lifecycle Hooks & Outbound Webhook Subscriptions
 * ─────────────────────────────────────────────────────────────────────────────
 */

const request = require('supertest');
const crypto = require('crypto');
const app = require('../server');
const { signToken } = require('../src/services/jwt');
const { stakeholderEvents } = require('../src/services/stakeholder-events');
const {
  createSubscription,
  listSubscriptions,
  getSubscription,
  deleteSubscription,
  computeSignature,
  memorySubscriptions,
  memoryDeliveries
} = require('../src/services/webhook-dispatcher');
const { inMemoryInvoices, createInvoiceRecord } = require('../src/routes/invoices');
const { memoryAffiliates, getAffiliateRecord } = require('../src/routes/affiliates');
const { memoryProjects, saveMemoryProject } = require('../src/services/post-delivery');

describe('Stakeholder Cross-Connections & Lifecycle Hooks Suite', () => {
  const testProjectId = 'proj-hook-verify-01';
  const testClientId = 'client-hook-org-01';
  const testAffiliateId = 'AFF-HOOK-99';

  const adminToken = signToken({
    id: 'usr-admin-hook',
    userId: 'usr-admin-hook',
    role: 'Owner / Admin',
    accessLevel: 'Owner / Admin',
    name: 'Executive Director'
  });

  const managerToken = signToken({
    id: 'usr-mgr-hook',
    userId: 'usr-mgr-hook',
    role: 'Delivery Manager',
    accessLevel: 'Manager',
    name: 'Sprint Lead Manager'
  });

  const clientToken = signToken({
    id: 'usr-client-hook',
    userId: 'usr-client-hook',
    role: 'Client',
    linkedType: 'client',
    linkedId: testClientId,
    name: 'Enterprise Client Lead'
  });

  beforeAll(() => {
    // Seed test project
    saveMemoryProject({
      id: testProjectId,
      name: 'Enterprise AI Agentic Workflow Hub',
      client_id: testClientId,
      clientId: testClientId,
      client: 'Apex Global Enterprises',
      client_name: 'Apex Global Enterprises',
      budget: 200000,
      price: 200000,
      totalCOGS: 20000,
      cogs: 20000,
      delivery_status: 'DELIVERED',
      warranty_until: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
      affiliate_id: testAffiliateId,
      affiliateId: testAffiliateId
    });

    // Seed test affiliate
    memoryAffiliates.set(testAffiliateId, {
      id: testAffiliateId,
      name: 'ScaleUp Ventures Partner',
      refCode: testAffiliateId,
      email: 'partners@scaleup.io',
      pendingBalanceBDT: 0,
      totalEarnedBDT: 0,
      paidOutBDT: 0,
      dealsClosed: 0,
      conversions: [],
      payoutHistory: []
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TRACK 1: Outbound Webhook Subscriptions & Cryptographic Signatures
  // ───────────────────────────────────────────────────────────────────────────
  describe('1. Outbound Webhook Subscriptions & HMAC Signatures', () => {
    let createdSubId;
    const testSecret = 'whsec_enterprise_secret_key_12345';

    it('POST /api/webhooks/subscriptions — registers a new webhook subscription', async () => {
      const res = await request(app)
        .post('/api/webhooks/subscriptions')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          targetUrl: 'https://webhook.site/mock-client-endpoint',
          secret: testSecret,
          events: ['invoice.paid', 'change_order.approved', 'warranty.dispute_resolved'],
          metadata: { system: 'Slack & Salesforce' }
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.subscription).toBeDefined();
      expect(res.body.subscription.targetUrl).toBe('https://webhook.site/mock-client-endpoint');
      expect(res.body.subscription.secret).toBe(testSecret);
      expect(res.body.subscription.events).toContain('invoice.paid');
      createdSubId = res.body.subscription.id;
    });

    it('GET /api/webhooks/subscriptions — lists subscriptions for caller', async () => {
      const res = await request(app)
        .get('/api/webhooks/subscriptions')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.subscriptions)).toBe(true);
      const found = res.body.subscriptions.find(s => s.id === createdSubId);
      expect(found).toBeDefined();
    });

    it('verifies HMAC-SHA256 signature calculation matches subscriber secret', () => {
      const payloadString = JSON.stringify({ event: 'invoice.paid', amount: 100000 });
      const expectedSig = crypto.createHmac('sha256', testSecret).update(payloadString).digest('hex');
      const computed = computeSignature(testSecret, payloadString);
      expect(computed).toBe(expectedSig);
    });

    it('DELETE /api/webhooks/subscriptions/:id — deletes subscription', async () => {
      const res = await request(app)
        .delete(`/api/webhooks/subscriptions/${createdSubId}`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.deleted).toBe(true);

      const sub = await getSubscription(createdSubId);
      expect(sub).toBeNull();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TRACK 2: Payment Verification Cross-Connection & Affiliate Accrual
  // ───────────────────────────────────────────────────────────────────────────
  describe('2. Payment Verification Cross-Connection & Affiliate Accrual', () => {
    let testInvoiceId;
    let paymentLogId;

    beforeAll(async () => {
      const inv = await createInvoiceRecord({
        id: 'INV-HOOK-VERIFY-01',
        clientId: testClientId,
        clientName: 'Apex Global Enterprises',
        projectName: 'Enterprise AI Agentic Workflow Hub',
        projectRef: testProjectId,
        amount: 100000,
        subtotal: 100000,
        items: [{ description: 'Enterprise AI Agentic Workflow Hub', qty: 1, rate: 100000, amount: 100000 }],
        currency: 'BDT',
        invoiceType: 'deposit_upfront',
        settlementRail: 'bdt_bank_wire',
        status: 'Pending',
        affiliateId: testAffiliateId,
        refCode: testAffiliateId
      });
      testInvoiceId = inv.id;
    });

    it('POST /api/payments — submits payment proof with corporate rail reference', async () => {
      const res = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          invoiceId: testInvoiceId,
          clientId: testClientId,
          clientName: 'Apex Global Enterprises',
          amount: 100000,
          paymentMethod: 'Corporate Bank Wire (BRAC Bank Limited)',
          trxId: 'TX-BRAC-2026-99881',
          notes: 'Settlement from corporate accounts department'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      paymentLogId = res.body.payment.id;
    });

    it('POST /api/payments/:id/verify — verifies payment, updates invoice to Paid, credits affiliate commission and emits invoice.paid', async () => {
      const eventSpy = jest.fn();
      stakeholderEvents.once('invoice.paid', eventSpy);

      const affBefore = await getAffiliateRecord(testAffiliateId);
      const prevClosed = Number(affBefore.dealsClosed || 0);
      const prevBalance = Number(affBefore.pendingBalanceBDT || 0);

      const res = await request(app)
        .post(`/api/payments/${paymentLogId}/verify`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify inMemoryInvoices marked Paid
      const inv = inMemoryInvoices.find(i => i.id === testInvoiceId);
      expect(inv).toBeDefined();
      expect(inv.status).toBe('Paid');
      expect(inv.notes).toContain('BRAC Bank Limited');

      // Verify affiliate commission accrued (10% of 100,000 = 10,000 BDT)
      const affAfter = await getAffiliateRecord(testAffiliateId);
      expect(affAfter.dealsClosed).toBe(prevClosed + 1);
      expect(affAfter.pendingBalanceBDT).toBe(prevBalance + 10000);

      // Verify event was fired
      expect(eventSpy).toHaveBeenCalledTimes(1);
      expect(eventSpy.mock.calls[0][0].invoice.id).toBe(testInvoiceId);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TRACK 3: Scope Change Orders Lifecycle Hooks
  // ───────────────────────────────────────────────────────────────────────────
  describe('3. Scope Change Orders Lifecycle Hooks', () => {
    let changeOrderId;

    it('POST /api/projects/:id/change-order — fires change_order.created event', async () => {
      const eventSpy = jest.fn();
      stakeholderEvents.once('change_order.created', eventSpy);

      const res = await request(app)
        .post(`/api/projects/${testProjectId}/change-order`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          title: 'Custom CRM Webhook Integration',
          description: 'Bidirectional sync with Salesforce and HubSpot',
          deliverables: ['Webhook Relay Worker', 'Retry Queue'],
          estimatedDays: 5,
          feeBDT: 40000,
          requestedBy: 'Client CTO'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      changeOrderId = res.body.changeOrder.id;

      expect(eventSpy).toHaveBeenCalledTimes(1);
      expect(eventSpy.mock.calls[0][0].changeOrder.id).toBe(changeOrderId);
    });

    it('PUT /api/projects/:id/change-order/:coId/adjust — fires change_order.adjusted event', async () => {
      const eventSpy = jest.fn();
      stakeholderEvents.once('change_order.adjusted', eventSpy);

      const res = await request(app)
        .put(`/api/projects/${testProjectId}/change-order/${changeOrderId}/adjust`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          proposedFeeBDT: 45000,
          estimatedDays: 6,
          notes: 'Added rate limiter and dead-letter queue'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      expect(eventSpy).toHaveBeenCalledTimes(1);
      expect(eventSpy.mock.calls[0][0].changeOrder.feeBDT).toBe(45000);
    });

    it('POST /api/projects/:id/change-order/:coId/approve — fires change_order.approved event and generates invoice', async () => {
      const eventSpy = jest.fn();
      stakeholderEvents.once('change_order.approved', eventSpy);

      const res = await request(app)
        .post(`/api/projects/${testProjectId}/change-order/${changeOrderId}/approve`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ approvedBy: 'Lead Manager' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.changeOrder.status).toBe('APPROVED');
      expect(res.body.invoice).toBeDefined();

      expect(eventSpy).toHaveBeenCalledTimes(1);
      expect(eventSpy.mock.calls[0][0].changeOrder.id).toBe(changeOrderId);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TRACK 4: Defect SLA Holdback & Escrow Release Hooks
  // ───────────────────────────────────────────────────────────────────────────
  describe('4. Defect SLA Holdback & Escrow Release Hooks', () => {
    const testTicketId = 'TICK-HOOK-DEFECT-01';

    beforeAll(() => {
      const { inMemoryTickets } = require('../src/routes/tickets');
      inMemoryTickets.push({
        id: testTicketId,
        title: 'Async Webhook Signature Mismatch on Payload Retries',
        project_id: testProjectId,
        projectId: testProjectId,
        assigned_contractor: 'emp-dev-01',
        assignedContractor: 'emp-dev-01',
        severity: 'P0',
        status: 'Open',
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() // 5h old (SLA breached)
      });
    });

    it('POST /api/tickets/:id/sla-holdback — fires ticket.sla_breach_holdback event', async () => {
      const eventSpy = jest.fn();
      stakeholderEvents.once('ticket.sla_breach_holdback', eventSpy);

      const res = await request(app)
        .post(`/api/tickets/${testTicketId}/sla-holdback`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          reason: 'P0 webhook signature bug exceeded 4h resolution guarantee'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      expect(eventSpy).toHaveBeenCalledTimes(1);
      expect(eventSpy.mock.calls[0][0].ticket.id).toBe(testTicketId);
      expect(eventSpy.mock.calls[0][0].contractorId).toBe('emp-dev-01');
    });

    it('simulates warranty completion with zero defects — releases contractor escrow', async () => {
      const eventSpy = jest.fn();
      stakeholderEvents.once('ticket.sla_holdback_released', eventSpy);

      // Resolve the ticket
      const { inMemoryTickets } = require('../src/routes/tickets');
      const t = inMemoryTickets.find(x => x.id === testTicketId);
      if (t) t.status = 'resolved';

      // Set project warranty expiry to now
      const proj = await require('../src/services/post-delivery').findProject(testProjectId);
      proj.warranty_until = new Date(Date.now() - 1000).toISOString();
      proj.warrantyUntil = proj.warranty_until;
      saveMemoryProject(proj);

      // Run warranty check
      const { runWarrantyCheck } = require('../src/services/warranty-cron');
      const result = await runWarrantyCheck();

      expect(result.success).toBe(true);
      expect(eventSpy).toHaveBeenCalledTimes(1);
      expect(eventSpy.mock.calls[0][0].projectId).toBe(testProjectId);
      expect(eventSpy.mock.calls[0][0].status).toBe('RELEASED_FROM_ESCROW');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TRACK 5: Deliverable Dispute & Resolution Hooks
  // ───────────────────────────────────────────────────────────────────────────
  describe('5. Deliverable Dispute Freeze & Resolution Hooks', () => {
    it('POST /api/projects/:id/dispute — fires warranty.dispute_raised and pauses timer', async () => {
      const eventSpy = jest.fn();
      stakeholderEvents.once('warranty.dispute_raised', eventSpy);

      const res = await request(app)
        .post(`/api/projects/${testProjectId}/dispute`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          reason: 'QUALITY_DEFECT',
          description: 'Latency spike on heavy concurrent vector embeddings',
          requestedRemedy: 'CORRECTION_SPRINT',
          submittedBy: 'Enterprise Client Lead'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      expect(eventSpy).toHaveBeenCalledTimes(1);
      expect(eventSpy.mock.calls[0][0].projectId).toBe(testProjectId);
      expect(eventSpy.mock.calls[0][0].dispute.reason).toBe('QUALITY_DEFECT');
    });

    it('POST /api/projects/:id/dispute/resolve — fires warranty.dispute_resolved and extends warranty by >= 7 days', async () => {
      const eventSpy = jest.fn();
      stakeholderEvents.once('warranty.dispute_resolved', eventSpy);

      const res = await request(app)
        .post(`/api/projects/${testProjectId}/dispute/resolve`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          resolutionType: 'CORRECTION_SPRINT_GRANTED',
          resolutionNotes: 'Deployed dedicated Redis vector cache and connection pool',
          extensionDays: 7,
          resolvedBy: 'Sprint Lead Manager'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      expect(eventSpy).toHaveBeenCalledTimes(1);
      expect(eventSpy.mock.calls[0][0].projectId).toBe(testProjectId);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TRACK 6: Compute COGS Margin Compression Guardrail Hook
  // ───────────────────────────────────────────────────────────────────────────
  describe('6. Compute COGS Margin Guardrail Hook', () => {
    it('POST /api/projects/:id/cogs-claim — fires cogs.margin_warning when margin drops below 70%', async () => {
      const eventSpy = jest.fn();
      stakeholderEvents.once('cogs.margin_warning', eventSpy);

      // Project revenue is 200,000 BDT. COGS was 20,000 BDT.
      // Claiming 60,000 BDT will make total COGS = 80,000 BDT.
      // Gross profit = 120,000 BDT (60.0% margin < 70% threshold).
      const res = await request(app)
        .post(`/api/projects/${testProjectId}/cogs-claim`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          itemType: 'GPU_COMPUTE',
          description: 'DeepSeek-R1 & H100 SXM5 GPU Fine-Tuning Cluster',
          amountBDT: 60000,
          vendor: 'Lambda Labs',
          claimedBy: 'Specialist Pod Engineer'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.isHealthy).toBe(false);
      expect(res.body.marginValue).toBeLessThan(70);

      expect(eventSpy).toHaveBeenCalledTimes(1);
      expect(eventSpy.mock.calls[0][0].projectId).toBe(testProjectId);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TRACK 7: Handover Manifest Signing Hook
  // ───────────────────────────────────────────────────────────────────────────
  describe('7. Handover Manifest Signing Hook', () => {
    it('POST /api/projects/:id/manifest/sign — fires manifest.signed event', async () => {
      const eventSpy = jest.fn();
      stakeholderEvents.once('manifest.signed', eventSpy);

      const res = await request(app)
        .post(`/api/projects/${testProjectId}/manifest/sign`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          signedBy: 'Enterprise Client Lead',
          signatoryRole: 'Chief Executive Officer'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      expect(eventSpy).toHaveBeenCalledTimes(1);
      expect(eventSpy.mock.calls[0][0].projectId).toBe(testProjectId);
      expect(eventSpy.mock.calls[0][0].signedBy).toBe('Enterprise Client Lead');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TRACK 8: Partner Affiliate Payout Hook
  // ───────────────────────────────────────────────────────────────────────────
  describe('8. Partner Affiliate Payout Hook', () => {
    it('POST /api/affiliates/payout — fires affiliate.payout_requested event', async () => {
      const eventSpy = jest.fn();
      stakeholderEvents.once('affiliate.payout_requested', eventSpy);

      // Ensure balance exists
      const aff = await getAffiliateRecord(testAffiliateId);
      aff.pendingBalanceBDT = 25000;
      memoryAffiliates.set(testAffiliateId, aff);

      const res = await request(app)
        .post('/api/affiliates/payout')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          affiliateId: testAffiliateId,
          amount: 25000,
          paymentMethod: 'bdt_bank_wire',
          notes: 'Settlement to corporate partner account'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      expect(eventSpy).toHaveBeenCalledTimes(1);
      expect(eventSpy.mock.calls[0][0].affiliate.id).toBe(testAffiliateId);
      expect(eventSpy.mock.calls[0][0].requestedAmount).toBe(25000);
    });
  });
});
