/**
 * tests/subphase_2_3_unified_order_tracking.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Sub-Phase 2.3: Unified Order Tracking (/dce/track & /digivault/track) Cross-Attribution
 * 
 * Tests:
 * 1. GET /dce/track serves valid HTML with search form and tracking containers
 * 2. GET /dce/track contains action buttons (#resLaunchPlannerBtn, #resVaultBtn, #resDownloadBtn, #resCanvaBtn, #resCertBtn)
 * 3. GET /dce/track contains #btnResendDelivery and Help Desk support ticket modal (#helpModal)
 * 4. POST /api/dce/orders/track enforces input validation (returns 400 on missing fields)
 * 5. POST /api/dce/orders/track resolves DCE Direct/Etsy orders with license and timeline
 * 6. POST /api/dce/orders/track cross-resolves DigiVault BD orders (DIGI-XXXXXX) into unified schema
 * 7. POST /api/dce/orders/track protects privacy (returns 403 on email mismatch)
 * 8. POST /api/dce/orders/resend triggers self-service re-delivery email for valid order
 * 9. GET /delivery serves valid HTML with #certOrderRef, #certCryptoHash, #certActivationCode
 * 10. QA runner suite (portal-audits.js) defines dce_track and public_delivery suites
 * ─────────────────────────────────────────────────────────────────────────────
 */

const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../server');

describe('Sub-Phase 2.3: Unified Order Tracking Cross-Attribution', () => {

  test('1. GET /dce/track serves valid HTML with search form and tracking containers', async () => {
    const res = await request(app).get('/dce/track');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toContain('id="orderRefInput"');
    expect(res.text).toContain('id="emailInput"');
    expect(res.text).toContain('id="submitBtn"');
    expect(res.text).toContain('id="orderResult"');
  });

  test('2. GET /dce/track contains action buttons (#resLaunchPlannerBtn, #resVaultBtn, #resDownloadBtn, #resCanvaBtn, #resCertBtn)', async () => {
    const res = await request(app).get('/dce/track');
    expect(res.status).toBe(200);
    expect(res.text).toContain('id="resLaunchPlannerBtn"');
    expect(res.text).toContain('id="resVaultBtn"');
    expect(res.text).toContain('id="resDownloadBtn"');
    expect(res.text).toContain('id="resCanvaBtn"');
    expect(res.text).toContain('id="resCertBtn"');
  });

  test('3. GET /dce/track contains #btnResendDelivery and Help Desk support ticket modal (#helpModal)', async () => {
    const res = await request(app).get('/dce/track');
    expect(res.status).toBe(200);
    expect(res.text).toContain('id="btnResendDelivery"');
    expect(res.text).toContain('id="helpModal"');
    expect(res.text).toContain('id="ticketForm"');
    expect(res.text).toContain('id="tktSubject"');
  });

  test('4. POST /api/dce/orders/track enforces input validation (returns 400 on missing fields)', async () => {
    const res = await request(app)
      .post('/api/dce/orders/track')
      .send({ orderRef: '' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    const errMsg = res.body.error?.message || res.body.message || '';
    expect(errMsg).toContain('required');
  });

  test('5. POST /api/dce/orders/track resolves DCE Direct/Etsy orders with license and timeline', async () => {
    // First place a direct order
    const checkoutRes = await request(app)
      .post('/api/dce/orders/checkout')
      .send({
        brandSlug: 'plannerqueen',
        skuId: 'sku-04',
        customer: {
          name: 'Track Tester',
          email: 'track.tester@gro10x.ai',
          address: { street: '101 Innovation Way', city: 'Dhaka', country: 'BD' }
        },
        quantity: 1,
        paymentMethod: 'CARD',
        currency: 'USD'
      });

    expect([200, 201]).toContain(checkoutRes.status);
    const orderRef = checkoutRes.body.data.orderRef;

    // Now track the order
    const trackRes = await request(app)
      .post('/api/dce/orders/track')
      .send({
        orderRef,
        email: 'track.tester@gro10x.ai'
      });

    expect(trackRes.status).toBe(200);
    expect(trackRes.body.success).toBe(true);
    expect(trackRes.body.data.orderRef).toBe(orderRef);
    expect(trackRes.body.data.status).toBeDefined();
    expect(Array.isArray(trackRes.body.data.items)).toBe(true);
    expect(Array.isArray(trackRes.body.data.licenses)).toBe(true);
  });

  test('6. POST /api/dce/orders/track cross-resolves DigiVault BD orders (DIGI-XXXXXX) into unified schema', async () => {
    // Submit a digistore order
    const digiRes = await request(app)
      .post('/api/digistore/orders')
      .send({
        customerName: 'Digi Tracker',
        customerContact: 'digi.tracker@gro10x.ai',
        customerWhatsapp: '01711019550',
        productName: 'Claude Pro (Monthly Access)',
        productSlug: 'claude-pro',
        duration: '1 Month',
        salePrice: 1200,
        paymentMethod: 'bkash',
        paymentRef: 'TRX-TRACK-999',
        senderAccount: '01711019550'
      });

    expect(digiRes.status).toBe(201);
    const returnedNum = digiRes.body.data?.orderNumber || digiRes.body.data?.order_number;
    expect(returnedNum).toBeDefined();

    // Track via DCE track endpoint
    const trackRes = await request(app)
      .post('/api/dce/orders/track')
      .send({
        orderRef: returnedNum,
        email: 'digi.tracker@gro10x.ai'
      });

    expect(trackRes.status).toBe(200);
    expect(trackRes.body.success).toBe(true);
    expect(trackRes.body.data.channelCode).toBe('DIGIVAULT');
    expect(trackRes.body.data.brandName).toBe('DigiVault BD');
    expect(trackRes.body.data.currency).toBe('BDT');
    expect(trackRes.body.data.orderRef).toBe(returnedNum);
  });

  test('7. POST /api/dce/orders/track protects privacy (returns 403 on email mismatch)', async () => {
    // Checkout an order
    const checkoutRes = await request(app)
      .post('/api/dce/orders/checkout')
      .send({
        brandSlug: 'plannerqueen',
        skuId: 'sku-04',
        customer: {
          name: 'Private User',
          email: 'private.user@gro10x.ai'
        },
        quantity: 1,
        paymentMethod: 'CARD',
        currency: 'USD'
      });

    expect([200, 201]).toContain(checkoutRes.status);
    const orderRef = checkoutRes.body.data.orderRef;

    // Track with WRONG email
    const trackRes = await request(app)
      .post('/api/dce/orders/track')
      .send({
        orderRef,
        email: 'attacker@evil.com'
      });

    expect(trackRes.status).toBe(403);
    expect(trackRes.body.success).toBe(false);
    const errMsg = trackRes.body.error?.message || trackRes.body.message || '';
    expect(errMsg).toContain('does not match');
  });

  test('8. POST /api/dce/orders/resend triggers self-service re-delivery email for valid order', async () => {
    // Checkout an order
    const checkoutRes = await request(app)
      .post('/api/dce/orders/checkout')
      .send({
        brandSlug: 'plannerqueen',
        skuId: 'sku-01',
        customer: {
          name: 'Resend User',
          email: 'resend.user@gro10x.ai'
        },
        quantity: 1,
        paymentMethod: 'CARD',
        currency: 'USD'
      });

    expect([200, 201]).toContain(checkoutRes.status);
    const orderRef = checkoutRes.body.data.orderRef;

    // Request resend
    const resendRes = await request(app)
      .post('/api/dce/orders/resend')
      .send({
        orderRef,
        email: 'resend.user@gro10x.ai'
      });

    expect(resendRes.status).toBe(200);
    expect(resendRes.body.success).toBe(true);
    expect(resendRes.body.data.message).toContain('resent');
  });

  test('9. GET /delivery serves valid HTML with #certOrderRef, #certCryptoHash, #certActivationCode', async () => {
    const res = await request(app).get('/delivery');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toContain('id="certOrderRef"');
    expect(res.text).toContain('id="certStatus"');
    expect(res.text).toContain('id="certCryptoHash"');
    expect(res.text).toContain('id="certActivationCode"');
  });

  test('10. QA runner suite (portal-audits.js) defines dce_track and public_delivery suites', () => {
    const auditsPath = path.join(__dirname, '../extension/gro10x-qa-runner/suites/portal-audits.js');
    const content = fs.readFileSync(auditsPath, 'utf8');

    expect(content).toContain('"dce_track": {');
    expect(content).toContain('#orderRefInput');
    expect(content).toContain('#helpModal');

    expect(content).toContain('"public_delivery": {');
    expect(content).toContain('.delivery-certificate');
    expect(content).toContain('#certCryptoHash');
    expect(content).toContain('#certActivationCode');
  });

});
