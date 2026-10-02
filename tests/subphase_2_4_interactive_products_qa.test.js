/**
 * SUB-PHASE 2.4 INTEGRATION TEST SUITE
 * Domain: Interactive Digital Products & Delivery QA Suite Hardening
 * Scope: /planner, /3d-viewer, /3d-viewer/real3d.html, /delivery, QA runner registry, suite loader, and portal audits
 */

const request = require('supertest');
const fs = require('fs');
const path = require('path');
let app;

beforeAll(() => {
  process.env.NODE_ENV = 'test';
  process.env.PORT = '0';
  app = require('../server');
});

describe('Sub-Phase 2.4: Interactive Products & Delivery QA Suite Hardening', () => {

  test('1. GET /planner serves valid HTML with upsell ribbon and purchase CTA', async () => {
    const res = await request(app).get('/planner');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toContain('id="plannerUpsellRibbon"');
    expect(res.text).toContain('id="btnUpgradeHardcover"');
    expect(res.text).toContain('id="ownerLicenseKeyDisplay"');
    expect(res.text).toContain('id="btnClaimCertificate"');
  });

  test('2. GET /3d-viewer serves valid HTML with lighting controls and commercial licensing modal/drawer', async () => {
    const res = await request(app).get('/3d-viewer');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toContain('id="btnOpenLicenseModal"');
    expect(res.text).toContain('id="selectLighting"');
    expect(res.text).toContain('id="commercialLicenseDrawer"');
    expect(res.text).toContain('id="btnLicenseCheckout"');
  });

  test('3. GET /3d-viewer/real3d.html serves valid HTML with STEM pack upsell CTA and Etsy card buy button', async () => {
    const res = await request(app).get('/3d-viewer/real3d.html');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toContain('id="btnBuyStemPack"');
    expect(res.text).toContain('id="btnEtsyCardBuy"');
    expect(res.text).toContain('STEM');
  });

  test('4. GET /delivery serves valid HTML with luxury seal, order pill, cryptographic hash, activation code', async () => {
    const res = await request(app).get('/delivery');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toContain('delivery-certificate');
    expect(res.text).toContain('crown-seal');
    expect(res.text).toContain('id="certOrderRef"');
    expect(res.text).toContain('id="certCryptoHash"');
    expect(res.text).toContain('id="certActivationCode"');
  });

  test('5. Viewport and responsive meta tag validation across interactive product portals', async () => {
    const routes = ['/planner', '/3d-viewer', '/3d-viewer/real3d.html', '/delivery'];
    for (const r of routes) {
      const res = await request(app).get(r);
      expect(res.status).toBe(200);
      expect(res.text.toLowerCase()).toContain('<meta name="viewport"');
      expect(res.text.toLowerCase()).toContain('width=device-width');
    }
  });

  test('6. Central Platform & Page Registry (registry.js) registers all interactive micro-apps', () => {
    const registryPath = path.join(__dirname, '../extension/gro10x-qa-runner/suites/registry.js');
    expect(fs.existsSync(registryPath)).toBe(true);
    const content = fs.readFileSync(registryPath, 'utf8');

    expect(content).toContain("id: 'planner'");
    expect(content).toContain("id: 'viewer3d'");
    expect(content).toContain("id: 'real3d'");
    expect(content).toContain("id: 'delivery'");
    expect(content).toContain("auditSuiteId: 'public_planner'");
    expect(content).toContain("auditSuiteId: 'public_viewer3d'");
    expect(content).toContain("auditSuiteId: 'public_real3d'");
    expect(content).toContain("auditSuiteId: 'public_delivery'");
  });

  test('7. QA Suite Loader (suite-loader.js) defines tabs for interactive products under public platform', () => {
    const loaderPath = path.join(__dirname, '../extension/gro10x-qa-runner/suites/suite-loader.js');
    expect(fs.existsSync(loaderPath)).toBe(true);
    const content = fs.readFileSync(loaderPath, 'utf8');

    expect(content).toContain("id: 'planner'");
    expect(content).toContain("id: 'viewer3d'");
    expect(content).toContain("id: 'real3d'");
    expect(content).toContain("id: 'delivery'");
  });

  test('8. QA Portal Audits (portal-audits.js) exports complete health audit suites for interactive products', () => {
    const { PORTAL_AUDITS } = require('../extension/gro10x-qa-runner/suites/portal-audits');
    expect(PORTAL_AUDITS).toBeDefined();

    expect(PORTAL_AUDITS.public_planner).toBeDefined();
    expect(PORTAL_AUDITS.public_planner.steps.length).toBeGreaterThanOrEqual(5);

    expect(PORTAL_AUDITS.public_viewer3d).toBeDefined();
    expect(PORTAL_AUDITS.public_viewer3d.steps.length).toBeGreaterThanOrEqual(5);

    expect(PORTAL_AUDITS.public_real3d).toBeDefined();
    expect(PORTAL_AUDITS.public_real3d.steps.length).toBeGreaterThanOrEqual(5);

    expect(PORTAL_AUDITS.public_delivery).toBeDefined();
    expect(PORTAL_AUDITS.public_delivery.steps.length).toBeGreaterThanOrEqual(5);
  });

  test('9. DCE Catalog API returns 3D STEM Interactive Lab products with GLB_USDZ format', async () => {
    const res = await request(app).get('/api/dce/catalog');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const catalog = res.body.data || [];
    const stemSku = catalog.find(item => item.sku === 'SKU-3D-STEM-01');
    expect(stemSku).toBeDefined();
    expect(stemSku.format).toBe('GLB_USDZ');
    expect(stemSku.priceUsd).toBe(14.99);
    expect(stemSku.priceBdt).toBe(1800);
  });

  test('10. End-to-end commercial flow: 3D STEM purchase -> Order Tracking -> Cryptographic Delivery Certificate', async () => {
    // Step 1: Direct purchase of 3D STEM product
    const checkoutRes = await request(app)
      .post('/api/dce/orders/checkout')
      .send({
        brandSlug: 'stemlab',
        skuId: 'SKU-3D-STEM-01',
        customer: {
          name: 'STEM Interactive Learner',
          email: 'stem.learner@gro10x.ai'
        },
        quantity: 1,
        paymentMethod: 'CARD',
        currency: 'USD'
      });

    expect([200, 201]).toContain(checkoutRes.status);
    expect(checkoutRes.body.success).toBe(true);
    const orderRef = checkoutRes.body.data.orderRef || checkoutRes.body.data.externalOrderId;
    expect(orderRef).toBeDefined();

    // Step 2: Track order via unified tracking endpoint
    const trackRes = await request(app)
      .post('/api/dce/orders/track')
      .send({
        orderRef,
        email: 'stem.learner@gro10x.ai'
      });

    expect(trackRes.status).toBe(200);
    expect(trackRes.body.success).toBe(true);
    expect(trackRes.body.data.orderRef).toBe(orderRef);
    expect(trackRes.body.data.licenses.length).toBeGreaterThanOrEqual(1);
    const licenseKey = trackRes.body.data.licenses[0].licenseKey;
    expect(licenseKey).toBeDefined();

    // Step 3: Access delivery certificate page with orderRef query parameter
    const certRes = await request(app).get(`/delivery?ref=${encodeURIComponent(orderRef)}&hash=${encodeURIComponent(licenseKey)}`);
    expect(certRes.status).toBe(200);
    expect(certRes.text).toContain('delivery-certificate');
  });

});
