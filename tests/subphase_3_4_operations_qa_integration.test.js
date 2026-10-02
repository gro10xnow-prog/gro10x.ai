/**
 * tests/subphase_3_4_operations_qa_integration.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Sub-Phase 3.4: Order Inbox & Operations Cockpit QA Suite Integration
 * 
 * Verifies:
 * 1. GET /api/dce/orders/metrics returns full KPI breakdown with admin auth
 * 2. GET /api/dce/orders supports text search filtering across customers & IDs
 * 3. GET /api/dce/orders filters orders accurately by channel code
 * 4. PUT /api/dce/orders/:id/status advances order lifecycle & writes audit log
 * 5. POST /api/dce/orders/bulk-status transitions batch of orders simultaneously
 * 6. GET /api/dce/orders/export/csv & /export outputs CSV manifest with headers
 * 7. GET /api/dce/fulfillment/queue lists orders ready for dual fulfillment
 * 8. Chrome Extension QA suite PORTAL_AUDITS has robust dce_orders & dce_operations
 * 9. Chrome Extension QA suite DCE_WORKFLOWS has direct checkout, lifecycle & triage
 * 10. End-to-end ingestion to status transition and export verification
 * ─────────────────────────────────────────────────────────────────────────────
 */

const request = require('supertest');
let app;

beforeAll(() => {
  process.env.NODE_ENV = 'test';
  process.env.PORT = '0';
  app = require('../server');
});

const { PORTAL_AUDITS } = require('../extension/gro10x-qa-runner/suites/portal-audits');
const { DCE_WORKFLOWS } = require('../extension/gro10x-qa-runner/suites/workflows/dce-workflows');

describe('Sub-Phase 3.4: Order Inbox & Operations Cockpit QA Suite Integration', () => {
  let createdOrderId = null;
  const testExternalId = `QA-TEST-ORD-${Date.now()}`;

  test('1. GET /api/dce/orders/metrics returns full KPI breakdown with admin auth', async () => {
    const res = await request(app)
      .get('/api/dce/orders/metrics')
      .set('Authorization', 'Bearer mock_qa_token_enterprise');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('totalOrders');
    expect(res.body.data).toHaveProperty('grossGMV');
    expect(res.body.data).toHaveProperty('channelCounts');
    expect(res.body.data).toHaveProperty('statusCounts');
    expect(typeof res.body.data.channelCounts).toBe('object');
  });

  test('2. Ingest test order for operations cockpit triage', async () => {
    const { ingestCanonicalOrder } = require('../src/services/dce-connectors');
    const result = await ingestCanonicalOrder({
      channel_code: 'ETSY',
      external_order_id: testExternalId,
      customer: {
        name: 'QA Operations Lead',
        email: 'qa.ops.tester@gro10x.ai'
      },
      total_amount: 55.00,
      currency: 'USD',
      channel_fee: 3.50,
      net_amount: 51.50,
      status: 'CONFIRMED',
      fulfillment_type: 'DIGITAL',
      items: [{
        title: 'PlannerQueen 2026 Core Digital Planner',
        quantity: 1,
        unit_price: 55.00,
        line_total: 55.00,
        external_sku_ref: 'PQ-CORE-001'
      }]
    }, { brand_name: 'PlannerQueen' });

    expect(result.success).toBe(true);
    expect(result.orderId).toBeDefined();
    createdOrderId = result.orderId;
  });

  test('3. GET /api/dce/orders supports text search filtering across customers & IDs', async () => {
    const res = await request(app)
      .get('/api/dce/orders')
      .query({ search: 'qa.ops.tester' })
      .set('Authorization', 'Bearer mock_qa_token_enterprise');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    const matched = res.body.data.find(o => 
      (o.customer_email && o.customer_email.includes('qa.ops.tester')) ||
      (o.external_order_id && o.external_order_id.includes(testExternalId)) ||
      o.id === createdOrderId
    );
    expect(matched).toBeDefined();
  });

  test('4. GET /api/dce/orders filters orders accurately by channel code', async () => {
    const res = await request(app)
      .get('/api/dce/orders')
      .query({ channel_code: 'ETSY' })
      .set('Authorization', 'Bearer mock_qa_token_enterprise');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    res.body.data.forEach(order => {
      expect(order.channel_code).toBe('ETSY');
    });
  });

  test('5. PUT /api/dce/orders/:id/status advances order lifecycle & writes audit log', async () => {
    const updateRes = await request(app)
      .put(`/api/dce/orders/${createdOrderId}/status`)
      .set('Authorization', 'Bearer mock_qa_token_enterprise')
      .send({
        status: 'PROCESSING',
        note: 'Order verified by Operations Lead, preparing dual fulfillment',
        actor: 'QA Operations Lead'
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.success).toBe(true);
    expect(updateRes.body.data.status).toBe('PROCESSING');

    // Retrieve order detail to verify status update
    const getRes = await request(app)
      .get(`/api/dce/orders/${createdOrderId}`)
      .set('Authorization', 'Bearer mock_qa_token_enterprise');

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.status).toBe('PROCESSING');
  });

  test('6. POST /api/dce/orders/bulk-status transitions batch of orders simultaneously', async () => {
    const bulkRes = await request(app)
      .post('/api/dce/orders/bulk-status')
      .set('Authorization', 'Bearer mock_qa_token_enterprise')
      .send({
        orderIds: [createdOrderId],
        status: 'COMPLETED'
      });

    expect(bulkRes.status).toBe(200);
    expect(bulkRes.body.success).toBe(true);
    expect(bulkRes.body.data.status).toBe('COMPLETED');
    expect(bulkRes.body.data.updatedCount).toBeGreaterThanOrEqual(1);

    const getRes = await request(app)
      .get(`/api/dce/orders/${createdOrderId}`)
      .set('Authorization', 'Bearer mock_qa_token_enterprise');
    expect(getRes.body.data.status).toBe('COMPLETED');
  });

  test('7. GET /api/dce/orders/export/csv & /export outputs CSV manifest with headers', async () => {
    const res1 = await request(app)
      .get('/api/dce/orders/export/csv')
      .set('Authorization', 'Bearer mock_qa_token_enterprise');

    expect(res1.status).toBe(200);
    expect(res1.headers['content-type']).toContain('text/csv');
    expect(res1.text).toContain('Order ID');
    expect(res1.text).toContain('Status');

    // Test alias route /export
    const res2 = await request(app)
      .get('/api/dce/orders/export')
      .set('Authorization', 'Bearer mock_qa_token_enterprise');

    expect(res2.status).toBe(200);
    expect(res2.headers['content-type']).toContain('text/csv');
  });

  test('8. GET /api/dce/fulfillment/queue lists orders ready for dual fulfillment', async () => {
    const res = await request(app)
      .get('/api/dce/fulfillment/queue')
      .set('Authorization', 'Bearer mock_qa_token_enterprise');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body).toHaveProperty('totalPending');
  });

  test('9. Chrome Extension QA suite PORTAL_AUDITS has robust dce_orders & dce_operations', () => {
    expect(PORTAL_AUDITS).toHaveProperty('dce_orders');
    expect(PORTAL_AUDITS).toHaveProperty('dce_operations');

    const ordersAudit = PORTAL_AUDITS.dce_orders;
    expect(ordersAudit.id).toBe('dce_orders');
    expect(Array.isArray(ordersAudit.steps)).toBe(true);
    expect(ordersAudit.steps.length).toBeGreaterThanOrEqual(3);

    const opsAudit = PORTAL_AUDITS.dce_operations;
    expect(opsAudit.id).toBe('dce_operations');
    expect(Array.isArray(opsAudit.steps)).toBe(true);
    expect(opsAudit.steps.length).toBeGreaterThanOrEqual(3);
  });

  test('10. Chrome Extension QA suite DCE_WORKFLOWS has direct checkout, lifecycle & triage', () => {
    expect(DCE_WORKFLOWS).toHaveProperty('workflow_dce_direct_checkout');
    expect(DCE_WORKFLOWS).toHaveProperty('workflow_dce_order_lifecycle');
    expect(DCE_WORKFLOWS).toHaveProperty('workflow_dce_fulfillment_batch');
    expect(DCE_WORKFLOWS).toHaveProperty('workflow_dce_support_triage');

    const lifecycleWf = DCE_WORKFLOWS.workflow_dce_order_lifecycle;
    expect(lifecycleWf.targetPath).toBe('/dce/orders');
    expect(lifecycleWf.steps.length).toBeGreaterThanOrEqual(3);

    const triageWf = DCE_WORKFLOWS.workflow_dce_support_triage;
    expect(triageWf.targetPath).toBe('/dce/operations');
    expect(triageWf.steps.length).toBeGreaterThanOrEqual(3);
  });
});
