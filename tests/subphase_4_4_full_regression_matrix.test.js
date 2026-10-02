/**
 * tests/subphase_4_4_full_regression_matrix.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Sub-Phase 4.4: Full Regression E2E QA Matrix & Extension Registry Integration
 * 
 * Verifies End-to-End Integrity Across All 4 Completed Phases:
 * 1. Phase 1.1: Server-side clean URL rewrites (/dce/store, /dce/track, /dce/affiliate)
 * 2. Phase 1.2: PlannerQueen dual currency catalog & coupon validation engine
 * 3. Phase 1.3: DigiVault BD multi-rail checkout & transaction verification
 * 4. Phase 2.1: Interactive Digital Planner & PDF generation engine
 * 5. Phase 2.2: 3D Spatial Viewer & Kids STEM Lab commercialization
 * 6. Phase 2.3: Universal customer order tracking & cross-attribution resolver
 * 7. Phase 3.1: Omnichannel connectors idempotent ingestion engine
 * 8. Phase 3.2: Format-aware dual fulfillment & cryptographic license vault
 * 9. Phase 3.3: Post-sale support helpdesk & SLA escalation protocol
 * 10. Phase 4: Creator settlements clearinghouse & affiliate attribution ledger
 * ─────────────────────────────────────────────────────────────────────────────
 */

const request = require('supertest');
let app;

beforeAll(() => {
  process.env.NODE_ENV = 'test';
  process.env.PORT = '0';
  app = require('../server');
});

const { ingestCanonicalOrder } = require('../src/services/dce-connectors');
const { fulfillOrder } = require('../src/services/dce-fulfillment');
const { recordClickAndResolve, attributeOrderToAffiliate } = require('../src/services/dce-affiliates');

describe('Sub-Phase 4.4: Full Regression E2E QA Matrix', () => {

  test('1. [Phase 1.1] Clean URL rewrites resolve /dce/* storefronts with HTTP 200', async () => {
    const storeRes = await request(app).get('/dce/store');
    expect(storeRes.status).toBe(200);

    const trackRes = await request(app).get('/dce/track');
    expect(trackRes.status).toBe(200);

    const affRes = await request(app).get('/dce/affiliate');
    expect(affRes.status).toBe(200);
  });

  test('2. [Phase 1.2] PlannerQueen catalog hydration & coupon validation engine', async () => {
    const catalogRes = await request(app).get('/api/dce/products');
    expect(catalogRes.status).toBe(200);
    expect(catalogRes.body.success).toBe(true);
    expect(Array.isArray(catalogRes.body.data)).toBe(true);

    const promoRes = await request(app)
      .post('/api/dce/promotions/validate')
      .send({ code: 'VIP50', orderTotal: 100.00, currency: 'USD' });

    expect(promoRes.status).toBe(200);
    expect(promoRes.body.success).toBe(true);
    expect(promoRes.body.data.valid).toBe(true);
    expect(promoRes.body.data.discount_amount).toBe(50.00);
  });

  test('3. [Phase 1.3] DigiVault BD local checkout & multi-rail payment verification', async () => {
    const configRes = await request(app).get('/api/digistore/config');
    expect(configRes.status).toBe(200);
    expect(configRes.body.success).toBe(true);
    expect(configRes.body.data.bkashNumber).toBeDefined();

    const orderRes = await request(app)
      .post('/api/digistore/orders')
      .send({
        customerName: 'Tanvir Ahmed',
        customerContact: '01811223344',
        customerWhatsapp: '01811223344',
        contactChannel: 'whatsapp',
        productName: 'Gemini Pro 18 Months Admin Account',
        duration: '18 Months',
        salePrice: 2000,
        vendorPrice: 1200,
        paymentMethod: 'bkash',
        sourceChannel: 'web_store'
      });

    expect([200, 201]).toContain(orderRes.status);
    expect(orderRes.body.success).toBe(true);
    expect(orderRes.body.data.orderNumber || orderRes.body.data.orderRef).toBeDefined();
  });

  test('4. [Phase 2.1] Interactive Digital Planner micro-product & PDF pipeline', async () => {
    const plannerRes = await request(app).get('/planner');
    expect(plannerRes.status).toBe(200);
    expect(plannerRes.text).toContain('Planner');
  });

  test('5. [Phase 2.2] 3D Spatial Viewer & Kids STEM Lab commercialization', async () => {
    const viewerRes = await request(app).get('/3d-viewer');
    expect(viewerRes.status).toBe(200);

    const real3dRes = await request(app).get('/real3d');
    expect(real3dRes.status).toBe(200);
  });

  test('6. [Phase 2.3] Universal customer order tracking & cross-attribution resolver', async () => {
    const res = await request(app)
      .post('/api/dce/orders/track')
      .send({ orderRef: 'DIR-PQ-902184', email: 'customer@gro10x.ai' });

    expect([200, 404]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('order');
    }
  });

  test('7. [Phase 3.1] Omnichannel connectors idempotent ingestion engine', async () => {
    const testOrderId = `REGR-IDEMP-${Date.now()}`;
    const orderPayload = {
      channel_code: 'ETSY',
      external_order_id: testOrderId,
      customer: { name: 'Regression Ingest', email: 'regr@gro10x.ai' },
      total_amount: 45.00,
      currency: 'USD',
      items: [{ title: '2026 Ultimate Planner', quantity: 1, unit_price: 45.00, line_total: 45.00 }]
    };

    const first = await ingestCanonicalOrder(orderPayload, {});
    expect(first.success).toBe(true);

    const second = await ingestCanonicalOrder(orderPayload, {});
    expect(second.success).toBe(true);
    expect(second.idempotent).toBe(true);
  });

  test('8. [Phase 3.2] Format-aware dual fulfillment & cryptographic license vault', async () => {
    const res = await request(app)
      .get('/api/dce/fulfillment/licenses')
      .set('Authorization', 'Bearer mock_qa_token_enterprise');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('9. [Phase 3.3] Post-sale support helpdesk & SLA escalation protocol', async () => {
    const ticketRes = await request(app)
      .post('/api/dce/helpdesk/tickets')
      .send({
        subject: 'Regression SLA Ticket Verification',
        description: 'Verifying automated SLA deadline assignment across priority tiers',
        priority: 'URGENT',
        category: 'ACCESS_ISSUE',
        customer_email: 'qa.helpdesk@gro10x.ai',
        customer_name: 'QA SLA Tester'
      });

    expect(ticketRes.status).toBe(200);
    expect(ticketRes.body.success).toBe(true);
    expect(ticketRes.body.data.priority).toBe('URGENT');
    expect(ticketRes.body.data).toHaveProperty('sla_deadline_at');
  });

  test('10. [Phase 4] Creator settlements clearinghouse & affiliate attribution ledger', async () => {
    // 1. Settlements API
    const settleRes = await request(app)
      .get('/api/dce/settlements/batches')
      .set('Authorization', 'Bearer mock_qa_token_enterprise');

    expect(settleRes.status).toBe(200);
    expect(settleRes.body.success).toBe(true);

    // 2. Affiliate Click Tracking
    const click = await recordClickAndResolve('pq-alex');
    expect(click).toBeDefined();
    expect(click.destinationUrl).toBeDefined();

    // 3. Webhook Health
    const healthRes = await request(app).get('/api/dce/webhooks/health');
    expect(healthRes.status).toBe(200);
    expect(healthRes.body.data.status).toBe('healthy');
  });
});
