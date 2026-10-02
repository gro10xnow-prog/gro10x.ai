/**
 * tests/subphase_1_3_digivault_hardening.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Sub-Phase 1.3: DigiVault Storefront Hardening & Multi-Rail Local Checkout
 * 
 * Tests:
 * 1. GET /digivault serves valid customer storefront HTML
 * 2. GET /api/digistore/config returns unified payment rails (bKash & Nagad)
 * 3. POST /api/digistore/orders creates order with DIGI-XXXXXX reference
 * 4. POST /api/digistore/orders/:id/payment-proof accepts proof via internal UUID
 * 5. POST /api/digistore/orders/:id/payment-proof accepts proof via order_number
 * 6. GET /api/digistore/track/:orderNumber returns safe customer-facing telemetry
 * 7. public/digivault/store.js includes hydrateConfig & DIGIVAULT_CONFIG
 * 8. public/digivault/product.html includes dynamic receiver number logic
 * 9. extension/gro10x-qa-runner/suites/registry.js registers digivaultStore
 * 10. extension/gro10x-qa-runner/suites/portal-audits.js includes public_digivault suite
 * ─────────────────────────────────────────────────────────────────────────────
 */

const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../server');

describe('Sub-Phase 1.3: DigiVault Storefront Hardening & Multi-Rail Local Checkout', () => {

  test('1. GET /digivault serves valid customer storefront HTML', async () => {
    const res = await request(app).get('/digivault');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toContain('id="btnLangToggle"');
  });

  test('2. GET /api/digistore/config returns unified payment rails (bKash & Nagad)', async () => {
    const res = await request(app).get('/api/digistore/config');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.bkashNumber).toBeDefined();
    expect(res.body.data.nagadNumber).toBeDefined();
    expect(res.body.data.whatsappNumber).toBeDefined();
    expect(res.body.data.telegramBot).toBeDefined();
    expect(res.body.data.bkashNumber).toMatch(/^01\d{9}$/);
  });

  test('3. POST /api/digistore/orders creates order with DIGI-XXXXXX reference', async () => {
    const res = await request(app)
      .post('/api/digistore/orders')
      .send({
        customerName: 'Tanvir Ahmed',
        customerContact: '01811223344',
        customerWhatsapp: '01811223344',
        contactChannel: 'whatsapp',
        productName: 'Gemini Pro 18 Months Admin Account + VEO 3 Pro',
        duration: '18 Months',
        salePrice: 2000,
        vendorPrice: 1200,
        paymentMethod: 'bkash',
        sourceChannel: 'web_store'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.orderNumber).toMatch(/^DIGI-\d{6}$/);
    expect(res.body.data.salePrice).toBe(2000);
    expect(res.body.data.paymentStatus).toBe('pending');
  });

  test('4. POST /api/digistore/orders/:id/payment-proof accepts proof via internal order ID', async () => {
    // 1. Create order
    const orderRes = await request(app)
      .post('/api/digistore/orders')
      .send({
        customerName: 'Proof Test User',
        customerContact: '01911223344',
        productName: 'ChatGPT Plus Shared',
        salePrice: 500,
        paymentMethod: 'bkash'
      });
    const order = orderRes.body.data;
    const orderId = order.id || order.orderId || order.orderNumber;

    // 2. Upload proof screenshot buffer
    const dummyImage = Buffer.from('fake-png-screenshot-bytes');
    const proofRes = await request(app)
      .post(`/api/digistore/orders/${orderId}/payment-proof`)
      .field('trxId', 'TRX99281729')
      .field('method', 'bkash')
      .attach('screenshot', dummyImage, 'payment-screenshot.png');

    expect(proofRes.status).toBe(200);
    expect(proofRes.body.success).toBe(true);
    expect(proofRes.body.data?.proofUrl || proofRes.body.proofUrl).toBeDefined();
  });

  test('5. POST /api/digistore/orders/:id/payment-proof accepts proof via public order_number', async () => {
    // 1. Create order
    const orderRes = await request(app)
      .post('/api/digistore/orders')
      .send({
        customerName: 'Public Ref User',
        customerContact: '01799887766',
        productName: 'Canva Pro 1 Year',
        salePrice: 350,
        paymentMethod: 'nagad'
      });
    const orderNumber = orderRes.body.data.orderNumber;

    // 2. Upload proof using DIGI-XXXXXX order number
    const dummyImage = Buffer.from('fake-nagad-proof-bytes');
    const proofRes = await request(app)
      .post(`/api/digistore/orders/${orderNumber}/payment-proof`)
      .field('trxId', 'NAGAD88123')
      .field('method', 'nagad')
      .attach('screenshot', dummyImage, 'nagad-proof.png');

    expect(proofRes.status).toBe(200);
    expect(proofRes.body.success).toBe(true);
    expect(proofRes.body.data?.proofUrl || proofRes.body.proofUrl).toBeDefined();
  });

  test('6. GET /api/digistore/track/:orderNumber returns safe customer-facing telemetry', async () => {
    // 1. Create order
    const orderRes = await request(app)
      .post('/api/digistore/orders')
      .send({
        customerName: 'Track Audit Customer',
        customerContact: '01611223344',
        productName: 'Netflix Premium 1 Month',
        salePrice: 280,
        vendorPrice: 190,
        vendorId: 'v-munir-01'
      });
    const orderNumber = orderRes.body.data.orderNumber;

    // 2. Track public endpoint
    const trackRes = await request(app).get(`/api/digistore/track/${orderNumber}`);
    expect(trackRes.status).toBe(200);
    expect(trackRes.body.success).toBe(true);

    const tracked = trackRes.body.data;
    expect(tracked.order_number).toBe(orderNumber);
    expect(tracked.product_name).toContain('Netflix');
    expect(tracked.payment_status).toBe('pending');

    // IDOR & Privacy check: Ensure vendor details and cost margins are NOT exposed
    expect(tracked.vendor_price).toBeUndefined();
    expect(tracked.vendorPrice).toBeUndefined();
    expect(tracked.vendor_id).toBeUndefined();
    expect(tracked.vendorId).toBeUndefined();
    expect(tracked.profit).toBeUndefined();
  });

  test('7. public/digivault/store.js includes hydrateConfig & DIGIVAULT_CONFIG', () => {
    const storeJsPath = path.join(__dirname, '../public/digivault/store.js');
    expect(fs.existsSync(storeJsPath)).toBe(true);
    const content = fs.readFileSync(storeJsPath, 'utf8');
    expect(content).toContain('DIGIVAULT_CONFIG');
    expect(content).toContain('hydrateConfig()');
    expect(content).toContain('digivault_config_loaded');
  });

  test('8. public/digivault/product.html includes dynamic receiver number logic', () => {
    const prodHtmlPath = path.join(__dirname, '../public/digivault/product.html');
    expect(fs.existsSync(prodHtmlPath)).toBe(true);
    const content = fs.readFileSync(prodHtmlPath, 'utf8');
    expect(content).toContain('updateReceiverNumber');
    expect(content).toContain('DIGIVAULT_CONFIG.nagadNumber');
    expect(content).toContain('DIGIVAULT_CONFIG.bkashNumber');
    expect(content).toContain('btnCopySendNo');
  });

  test('9. extension/gro10x-qa-runner/suites/registry.js registers digivaultStore', () => {
    const regPath = path.join(__dirname, '../extension/gro10x-qa-runner/suites/registry.js');
    expect(fs.existsSync(regPath)).toBe(true);
    const content = fs.readFileSync(regPath, 'utf8');
    expect(content).toContain("'digivaultStore'");
    expect(content).toContain("'/digivault'");
    expect(content).toContain("'public_digivault'");
  });

  test('10. extension/gro10x-qa-runner/suites/portal-audits.js includes public_digivault suite', () => {
    const auditsPath = path.join(__dirname, '../extension/gro10x-qa-runner/suites/portal-audits.js');
    expect(fs.existsSync(auditsPath)).toBe(true);
    const content = fs.readFileSync(auditsPath, 'utf8');
    expect(content).toContain('"public_digivault"');
    expect(content).toContain('"dv-pub-1"');
    expect(content).toContain('#btnLangToggle');
  });

});
