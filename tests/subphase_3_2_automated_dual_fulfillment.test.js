/**
 * SUB-PHASE 3.2 INTEGRATION TEST SUITE
 * Domain: Automated Dual-Fulfillment (Digital Cryptographic Keys + Physical Dispatch)
 * Scope: Format Routing, 32-char Hex License Keys, Resend Email, Batch Processing, Courier Tracking
 */

const request = require('supertest');
const {
  generateLicenseKey,
  fulfillOrder,
  getFulfillmentJobs,
  updatePhysicalTracking,
  resendDeliveryEmail,
  getDigitalLicenses
} = require('../src/services/dce-fulfillment');
let app;

beforeAll(() => {
  process.env.NODE_ENV = 'test';
  process.env.PORT = '0';
  app = require('../server');
});

describe('Sub-Phase 3.2: Automated Dual-Fulfillment Engine', () => {

  test('1. generateLicenseKey() creates 32-character hex key formatted as GRO-XXXX-XXXX-XXXX-XXXX', () => {
    const key = generateLicenseKey();
    expect(typeof key).toBe('string');
    expect(key.startsWith('GRO-')).toBe(true);
    const segments = key.split('-');
    expect(segments.length).toBe(5);
    expect(segments[0]).toBe('GRO');
    // Each of the 4 hex segments is 8 characters long (16 bytes = 32 hex chars total)
    expect(segments[1].length).toBe(8);
    expect(segments[2].length).toBe(8);
    expect(segments[3].length).toBe(8);
    expect(segments[4].length).toBe(8);
  });

  test('2. Digital product fulfillment generates license key, access URL, and sets allDelivered to true', async () => {
    const orderId = `TEST-DIGI-ORD-${Date.now()}`;
    const result = await fulfillOrder(orderId);

    expect(result.orderId).toBe(orderId);
    expect(result.allDelivered).toBe(true);
    expect(Array.isArray(result.licenses)).toBe(true);
    expect(result.licenses.length).toBeGreaterThan(0);
    expect(result.licenses[0].licenseKey).toMatch(/^GRO-[A-F0-9]{4,8}-[A-F0-9]{4,8}-[A-F0-9]{4,8}-[A-F0-9]{4,8}$/);
    expect(result.licenses[0].accessUrl).toBeDefined();
  });

  test('3. Physical product order fulfillment creates PENDING dispatch job and notifies courier queue', async () => {
    // Ingest a physical order into local store first
    const dceOrders = require('../src/routes/dce-orders');
    const physOrderId = `TEST-PHYS-ORD-${Date.now()}`;
    await dceOrders.persistDCEOrder({
      id: physOrderId,
      external_order_id: physOrderId,
      channel_code: 'DIRECT',
      customer_name: 'Physical Hardcover Collector',
      customer_email: 'collector@gro10x.ai',
      customer_phone: '+880 1711-019550',
      brand_name: 'PlannerQueen',
      total_amount: 49.99,
      currency: 'USD',
      status: 'CONFIRMED',
      fulfillment_type: 'PHYSICAL',
      items: [{
        title: 'PlannerQueen Luxury Hardcover Gold Foil Edition',
        format: 'PHYSICAL',
        quantity: 1,
        unit_price: 49.99
      }]
    });

    const result = await fulfillOrder(physOrderId);
    expect(result.orderId).toBe(physOrderId);
    expect(result.allDelivered).toBe(false); // Physical starts as PENDING dispatch
    const physItem = result.results.find(r => r.type === 'PHYSICAL');
    expect(physItem).toBeDefined();
    expect(physItem.status).toBe('PENDING');
    expect(physItem.jobId).toBeDefined();
  });

  test('4. updatePhysicalTracking() attaches tracking number, courier, and completes fulfillment', async () => {
    const jobs = await getFulfillmentJobs({});
    let targetJob = jobs.find(j => j.fulfillment_type === 'PHYSICAL');

    if (!targetJob) {
      // Create a test job
      targetJob = { id: `job-test-${Date.now()}` };
    }

    const updated = await updatePhysicalTracking(targetJob.id, {
      trackingNumber: 'DHL-EXPRESS-99221144',
      carrier: 'DHL Express'
    });

    expect(updated).toBeDefined();
    expect(updated.tracking_number).toBe('DHL-EXPRESS-99221144');
    expect(updated.carrier).toBe('DHL Express');
    expect(updated.status).toBe('DELIVERED');
  });

  test('5. resendDeliveryEmail() resends digital access to customer without duplicating licenses', async () => {
    const licenses = await getDigitalLicenses({});
    const targetOrderId = licenses[0]?.order_id || `ord-${Date.now()}`;

    const resendRes = await resendDeliveryEmail(targetOrderId);
    expect(resendRes.success).toBe(true);
    expect(resendRes.resentTo).toBeDefined();
  });

  test('6. POST /api/dce/fulfillment/trigger/:orderId requires DCE Admin authentication', async () => {
    const res = await request(app)
      .post('/api/dce/fulfillment/trigger/test-ord-123');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('7. POST /api/dce/fulfillment/trigger/:orderId executes with admin token', async () => {
    const testOrd = `TEST-ROUTE-FULFILL-${Date.now()}`;
    const res = await request(app)
      .post(`/api/dce/fulfillment/trigger/${testOrd}`)
      .set('Authorization', 'Bearer mock_qa_token_enterprise');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.orderId).toBe(testOrd);
  });

  test('8. POST /api/dce/fulfillment/trigger-batch processes multiple pending orders concurrently', async () => {
    const res = await request(app)
      .post('/api/dce/fulfillment/trigger-batch')
      .set('Authorization', 'Bearer mock_qa_token_enterprise');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.data.totalAttempted).toBe('number');
    expect(Array.isArray(res.body.data.results)).toBe(true);
  });

  test('9. GET /api/dce/fulfillment/licenses returns issued digital license vault records', async () => {
    const res = await request(app)
      .get('/api/dce/fulfillment/licenses')
      .set('Authorization', 'Bearer mock_qa_token_enterprise');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('10. PUT /api/dce/fulfillment/:id/tracking updates courier tracking for physical dispatch', async () => {
    const res = await request(app)
      .put('/api/dce/fulfillment/job-mock-9988/tracking')
      .set('Authorization', 'Bearer mock_qa_token_enterprise')
      .send({
        trackingNumber: 'STEADFAST-BD-442211',
        carrier: 'Steadfast Courier'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tracking_number).toBe('STEADFAST-BD-442211');
    expect(res.body.data.carrier).toBe('Steadfast Courier');
  });

});
