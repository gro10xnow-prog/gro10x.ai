/**
 * tests/subphase_1_2_dce_orders_persistence.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Sub-Phase 1.2: DCE Orders DB Persistence & Omnichannel Sync Verification
 * 
 * Tests:
 * 1. Metrics retrieval with financial rollups
 * 2. Order list filtering and pagination
 * 3. Direct checkout order creation, license generation & dual-persistence to data/db.json
 * 4. Single order detail retrieval
 * 5. Public customer order tracking & email validation guard
 * 6. Order status progression & audit trail
 * 7. Store helper functions (getDCEOrdersStore, persistDCEOrder, deleteDCEOrder)
 * ─────────────────────────────────────────────────────────────────────────────
 */

const request = require('supertest');
const express = require('express');
const fs = require('fs');
const path = require('path');

const dceOrdersRouter = require('../src/routes/dce-orders');
const errorHandler = require('../src/middleware/errorHandler');

const app = express();
app.use(express.json());
app.use('/api/dce/orders', dceOrdersRouter);
app.use(errorHandler);

const DB_JSON_PATH = path.join(__dirname, '../data/db.json');
const ADMIN_AUTH_HEADER = 'Bearer mock_qa_token_enterprise';

describe('Sub-Phase 1.2: DCE Orders Dual-Store Persistence & Sync', () => {
  let createdOrderId = null;
  let createdExternalRef = null;
  const testCustomerEmail = `qa-test-${Date.now()}@example.com`;

  test('1. GET /api/dce/orders/metrics returns calculated KPIs from persistent store', async () => {
    const res = await request(app)
      .get('/api/dce/orders/metrics')
      .set('Authorization', ADMIN_AUTH_HEADER);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(typeof res.body.data.totalOrders).toBe('number');
    expect(typeof res.body.data.grossGMV).toBe('number');
    expect(typeof res.body.data.netRevenue).toBe('number');
    expect(res.body.data.channelCounts).toBeDefined();
  });

  test('2. GET /api/dce/orders lists persisted orders with pagination structure', async () => {
    const res = await request(app)
      .get('/api/dce/orders?limit=10&page=1')
      .set('Authorization', ADMIN_AUTH_HEADER);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.limit).toBe(10);
    expect(res.body.pagination.page).toBe(1);
  });

  test('3. POST /api/dce/orders/checkout creates and persists direct order to data/db.json', async () => {
    const orderPayload = {
      brandSlug: 'plannerqueen',
      customer: {
        name: 'QA Test Shopper',
        email: testCustomerEmail,
        phone: '+8801700998877'
      },
      quantity: 1,
      paymentMethod: 'CARD'
    };

    const res = await request(app)
      .post('/api/dce/orders/checkout')
      .send(orderPayload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.orderId).toBeDefined();
    expect(res.body.data.externalOrderId).toBeDefined();
    expect(res.body.data.licenseKey).toBeDefined();
    expect(res.body.data.status).toBe('COMPLETED');
    expect(res.body.data.total).toBeGreaterThan(0);

    createdOrderId = res.body.data.orderId;
    createdExternalRef = res.body.data.externalOrderId;

    // Verify dual-persistence to data/db.json
    expect(fs.existsSync(DB_JSON_PATH)).toBe(true);
    const dbContent = JSON.parse(fs.readFileSync(DB_JSON_PATH, 'utf8'));
    expect(Array.isArray(dbContent.dce_orders)).toBe(true);
    const foundInDb = dbContent.dce_orders.find(o => o.id === createdOrderId || o.external_order_id === createdExternalRef);
    expect(foundInDb).toBeDefined();
    expect(foundInDb.customer_email).toBe(testCustomerEmail);
  });

  test('4. GET /api/dce/orders/:id retrieves created order detail from store', async () => {
    expect(createdOrderId).toBeDefined();

    const res = await request(app)
      .get(`/api/dce/orders/${createdOrderId}`)
      .set('Authorization', ADMIN_AUTH_HEADER);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(createdOrderId);
    expect(res.body.data.customer_email).toBe(testCustomerEmail);
  });

  test('5. POST /api/dce/orders/track customer tracking validates matching email', async () => {
    expect(createdExternalRef).toBeDefined();

    // Positive case: matching email
    const resSuccess = await request(app)
      .post('/api/dce/orders/track')
      .send({ orderRef: createdExternalRef, email: testCustomerEmail });

    expect(resSuccess.status).toBe(200);
    expect(resSuccess.body.success).toBe(true);
    expect(resSuccess.body.data.orderRef).toBe(createdExternalRef);
    expect(resSuccess.body.data.customerEmail).toBe(testCustomerEmail);

    // Negative case: mismatched email (403 forbidden)
    const resForbidden = await request(app)
      .post('/api/dce/orders/track')
      .send({ orderRef: createdExternalRef, email: 'wrong.intruder@example.com' });

    expect(resForbidden.status).toBe(403);
    expect(resForbidden.body.success).toBe(false);
  });

  test('6. PUT /api/dce/orders/:id/status updates status and syncs to store', async () => {
    expect(createdOrderId).toBeDefined();

    const res = await request(app)
      .put(`/api/dce/orders/${createdOrderId}/status`)
      .set('Authorization', ADMIN_AUTH_HEADER)
      .send({ status: 'PROCESSING', note: 'QA audit test status shift' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('PROCESSING');

    // Confirm local persistence updated
    const dbContent = JSON.parse(fs.readFileSync(DB_JSON_PATH, 'utf8'));
    const foundInDb = dbContent.dce_orders.find(o => o.id === createdOrderId || o.external_order_id === createdExternalRef);
    expect(foundInDb).toBeDefined();
    expect(foundInDb.status).toBe('PROCESSING');
  });

  test('7. deleteDCEOrder cleanly removes temporary test order from persistent store', async () => {
    expect(createdOrderId).toBeDefined();

    await dceOrdersRouter.deleteDCEOrder(createdOrderId);

    const dbContent = JSON.parse(fs.readFileSync(DB_JSON_PATH, 'utf8'));
    const found = dbContent.dce_orders.find(o => o.id === createdOrderId || o.external_order_id === createdExternalRef);
    expect(found).toBeUndefined();
  });
});
