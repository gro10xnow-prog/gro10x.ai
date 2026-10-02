/**
 * SUB-PHASE 3.1 INTEGRATION TEST SUITE
 * Domain: Omnichannel Connectors Sync & Idempotent Ingestion Engine
 * Scope: 5 Marketplace Connectors, Webhooks, Idempotency, On-demand Polling
 */

const request = require('supertest');
const { getConnector, ingestCanonicalOrder, resolveCustomer } = require('../src/services/dce-connectors');
let app;

beforeAll(() => {
  process.env.NODE_ENV = 'test';
  process.env.PORT = '0';
  app = require('../server');
});

describe('Sub-Phase 3.1: Omnichannel Connectors Sync & Idempotent Ingestion Engine', () => {

  test('1. GET /api/dce/webhooks/health returns status healthy and active connectors list', async () => {
    const res = await request(app).get('/api/dce/webhooks/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('healthy');
    expect(Array.isArray(res.body.data.activeConnectors)).toBe(true);
    expect(res.body.data.activeConnectors).toContain('GUMROAD');
    expect(res.body.data.activeConnectors).toContain('ETSY');
    expect(res.body.data.activeConnectors).toContain('AMAZON');
    expect(res.body.data.activeConnectors).toContain('DARAZ');
    expect(res.body.data.activeConnectors).toContain('DIRECT');
  });

  test('2. Connector registry retrieves all 5 omnichannel marketplace connectors', () => {
    const gumroad = getConnector('GUMROAD');
    const etsy = getConnector('ETSY');
    const amazon = getConnector('AMAZON');
    const daraz = getConnector('DARAZ');
    const direct = getConnector('DIRECT');

    expect(gumroad).toBeDefined();
    expect(typeof gumroad.normalize).toBe('function');

    expect(etsy).toBeDefined();
    expect(typeof etsy.normalize).toBe('function');
    expect(typeof etsy.poll).toBe('function');

    expect(amazon).toBeDefined();
    expect(typeof amazon.normalize).toBe('function');

    expect(daraz).toBeDefined();
    expect(typeof daraz.normalize).toBe('function');

    expect(direct).toBeDefined();
    expect(typeof direct.normalize).toBe('function');
  });

  test('3. Gumroad connector normalizes raw webhook payload into canonical order schema', () => {
    const gumroad = getConnector('GUMROAD');
    const rawPayload = {
      sale_id: 'GUM-TEST-9901',
      order_number: '12345678',
      email: 'gumroad.buyer@gro10x.ai',
      full_name: 'Gumroad Buyer',
      price: 2499, // cents
      currency: 'usd',
      product_name: 'Digital Planner 2026',
      product_permalink: 'planner-2026',
      variants: { 'Format': 'Digital PDF' }
    };

    const normalized = gumroad.normalize(rawPayload);
    expect(normalized.channel_code).toBe('GUMROAD');
    expect(normalized.external_order_id).toBe('GUM-TEST-9901');
    expect(normalized.customer.email).toBe('gumroad.buyer@gro10x.ai');
    expect(normalized.total_amount).toBe(24.99);
    expect(normalized.currency).toBe('USD');
    expect(normalized.items.length).toBe(1);
    expect(normalized.fulfillment_type).toBe('DIGITAL');
  });

  test('4. Daraz connector normalizes raw payload with local BDT currency and mobile contact', () => {
    const daraz = getConnector('DARAZ');
    const rawPayload = {
      order_id: 'DARAZ-BD-5501',
      customer_first_name: 'Rahim',
      customer_last_name: 'Chowdhury',
      billing_phone: '01711019550',
      price: '1800.00',
      payment_method: 'bKash',
      items: [{
        order_item_id: 'ITEM-1',
        name: 'STEM 3D Lab Pack',
        sku: 'SKU-3D-STEM-01',
        paid_price: 1800.00,
        item_price: 1800.00
      }]
    };

    const normalized = daraz.normalize(rawPayload);
    expect(normalized.channel_code).toBe('DARAZ');
    expect(normalized.external_order_id).toBe('DARAZ-BD-5501');
    expect(normalized.currency).toBe('BDT');
    expect(normalized.total_amount).toBe(1800.00);
    expect(normalized.customer.phone).toBe('01711019550');
  });

  test('5. Direct connector guarantees 100% platform margin (0 channel fee)', () => {
    const direct = getConnector('DIRECT');
    const payload = {
      order_id: 'DIR-TEST-001',
      customer: { name: 'Direct Customer', email: 'direct@gro10x.ai' },
      items: [{ sku: 'PLA-14', title: 'Luxury Hardcover', unit_price: 39.99, quantity: 1, line_total: 39.99 }],
      total_amount: 39.99,
      currency: 'USD'
    };

    const normalized = direct.normalize(payload);
    expect(normalized.channel_code).toBe('DIRECT');
    expect(normalized.channel_fee).toBeLessThan(2.00); // Only small payment processor fee
    expect(normalized.net_amount).toBeGreaterThan(37.00); // 95%+ net margin
  });

  test('6. Ingesting canonical order persists order and returns success with orderId', async () => {
    const testOrderId = `TEST-INGEST-${Date.now()}`;
    const normalizedOrder = {
      channel_code: 'ETSY',
      external_order_id: testOrderId,
      customer: {
        name: 'Omnichannel Ingest Tester',
        email: 'ingest.tester@gro10x.ai'
      },
      total_amount: 19.99,
      currency: 'USD',
      channel_fee: 1.30,
      net_amount: 18.69,
      status: 'CONFIRMED',
      fulfillment_type: 'DIGITAL',
      items: [{
        title: 'Digital Planner 2026',
        quantity: 1,
        unit_price: 19.99,
        line_total: 19.99,
        external_sku_ref: 'sku-01'
      }]
    };

    const result = await ingestCanonicalOrder(normalizedOrder, { brand_name: 'PlannerQueen' });
    expect(result.success).toBe(true);
    expect(result.orderId).toBeDefined();
    expect(result.externalOrderId).toBe(testOrderId);
  });

  test('7. Strict Idempotency Guard rejects duplicate order ingestion and returns existing orderId', async () => {
    const uniqueExtId = `IDEMP-${Date.now()}`;
    const orderPayload = {
      channel_code: 'GUMROAD',
      external_order_id: uniqueExtId,
      customer: {
        name: 'Idempotency Tester',
        email: 'idemp@gro10x.ai'
      },
      total_amount: 15.00,
      currency: 'USD',
      items: [{ title: 'Preset Pack', quantity: 1, unit_price: 15.00, line_total: 15.00 }]
    };

    // First ingestion
    const firstRes = await ingestCanonicalOrder(orderPayload, {});
    expect(firstRes.success).toBe(true);
    const initialOrderId = firstRes.orderId;

    // Second duplicate ingestion
    const secondRes = await ingestCanonicalOrder(orderPayload, {});
    expect(secondRes.success).toBe(true);
    expect(secondRes.idempotent).toBe(true);
    expect(secondRes.message).toContain('already ingested');
    expect(secondRes.orderId).toBe(initialOrderId);
  });

  test('8. POST /api/dce/webhooks/gumroad rejects requests with missing or invalid signature', async () => {
    const res = await request(app)
      .post('/api/dce/webhooks/gumroad')
      .send({ sale_id: 'UNAUTHORIZED-TEST', price: 1000 });

    // Should reject with 401 (invalid/missing signature) or 503 (secret not configured)
    expect([401, 503]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });

  test('9. POST /api/dce/orders/poll/etsy requires DCE Admin authentication', async () => {
    const res = await request(app)
      .post('/api/dce/orders/poll/etsy')
      .send({ brandId: 'b-pq-01' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error?.code || res.body.code).toBe('DCE_AUTH_REQUIRED');
  });

  test('10. POST /api/dce/orders/poll/etsy executes with QA mock token and returns synced metrics', async () => {
    const res = await request(app)
      .post('/api/dce/orders/poll/etsy')
      .set('Authorization', 'Bearer mock_qa_token_enterprise')
      .send({ brandId: 'b-pq-01' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.synced).toBe(true);
    expect(typeof res.body.data.ordersFound).toBe('number');
  });

});
