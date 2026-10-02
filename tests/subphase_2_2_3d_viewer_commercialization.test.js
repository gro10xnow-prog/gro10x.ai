/**
 * tests/subphase_2_2_3d_viewer_commercialization.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Sub-Phase 2.2: 3D Spatial Viewer & Kids STEM Lab (/3d-viewer, /real3d) Commercialization
 * 
 * Tests:
 * 1. GET /3d-viewer serves valid HTML with #stageContainer, #projectionPlane, #btnOpenLicenseModal
 * 2. GET /3d-viewer contains lighting mode selector #selectLighting and speed selector #selectSpeed
 * 3. GET /3d-viewer contains #commercialLicenseDrawer with SKU-3D-STEM-01, dual pricing, #btnLicenseCheckout
 * 4. GET /3d-viewer JavaScript wires open/close handlers and redirects to /dce/store?sku=SKU-3D-STEM-01
 * 5. GET /3d-viewer/real3d.html serves valid HTML with <model-viewer> and 4 catalog models
 * 6. GET /3d-viewer/real3d.html contains #btnBuyStemPack linking to /dce/store?sku=SKU-3D-STEM-01
 * 7. GET /3d-viewer/real3d.html contains #btnEtsyCardBuy commercial license CTA
 * 8. GET /api/dce/products returns the Kids STEM 3D Explorer product (p-stem-01)
 * 9. GET /api/dce/products includes SKU SKU-3D-STEM-01 with $14.99 USD and ৳1,800 BDT dual pricing
 * 10. QA runner suite (portal-audits.js) includes public_viewer3d commercial drawer assertions (10 steps)
 * ─────────────────────────────────────────────────────────────────────────────
 */

const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../server');

describe('Sub-Phase 2.2: 3D Spatial Viewer & Kids STEM Lab Commercialization', () => {

  test('1. GET /3d-viewer serves valid HTML with #stageContainer, #projectionPlane, #btnOpenLicenseModal', async () => {
    const res = await request(app).get('/3d-viewer');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toContain('id="stageContainer"');
    expect(res.text).toContain('id="projectionPlane"');
    expect(res.text).toContain('id="btnOpenLicenseModal"');
    expect(res.text).toContain('License 3D Pack ($14.99)');
  });

  test('2. GET /3d-viewer contains lighting mode selector #selectLighting and speed selector #selectSpeed', async () => {
    const res = await request(app).get('/3d-viewer');
    expect(res.status).toBe(200);
    expect(res.text).toContain('id="selectLighting"');
    expect(res.text).toContain('value="cyberpunk"');
    expect(res.text).toContain('value="studio"');
    expect(res.text).toContain('value="sunset"');
    expect(res.text).toContain('id="selectSpeed"');
  });

  test('3. GET /3d-viewer contains #commercialLicenseDrawer with SKU-3D-STEM-01, dual pricing, #btnLicenseCheckout', async () => {
    const res = await request(app).get('/3d-viewer');
    expect(res.status).toBe(200);
    expect(res.text).toContain('id="commercialLicenseDrawer"');
    expect(res.text).toContain('SKU-3D-STEM-01');
    expect(res.text).toContain('$14.99 USD');
    expect(res.text).toContain('৳1,800 BDT');
    expect(res.text).toContain('id="btnLicenseCheckout"');
    expect(res.text).toContain('id="btnCloseLicenseDrawer"');
  });

  test('4. GET /3d-viewer JavaScript wires open/close handlers and redirects to /dce/store?sku=SKU-3D-STEM-01', async () => {
    const res = await request(app).get('/3d-viewer');
    expect(res.status).toBe(200);
    expect(res.text).toContain('function openLicenseDrawer()');
    expect(res.text).toContain('function closeLicenseDrawer()');
    expect(res.text).toContain('/dce/store?sku=SKU-3D-STEM-01');
  });

  test('5. GET /3d-viewer/real3d.html serves valid HTML with <model-viewer> and 4 catalog models', async () => {
    const res = await request(app).get('/3d-viewer/real3d.html');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toContain('<model-viewer');
    expect(res.text).toContain('data-model="fox"');
    expect(res.text).toContain('data-model="horse"');
    expect(res.text).toContain('data-model="flamingo"');
    expect(res.text).toContain('data-model="astronaut"');
  });

  test('6. GET /3d-viewer/real3d.html contains #btnBuyStemPack linking to /dce/store?sku=SKU-3D-STEM-01', async () => {
    const res = await request(app).get('/3d-viewer/real3d.html');
    expect(res.status).toBe(200);
    expect(res.text).toContain('id="btnBuyStemPack"');
    expect(res.text).toContain('/dce/store?sku=SKU-3D-STEM-01');
    expect(res.text).toContain('Buy 4-Model STEM Pack ($14.99)');
  });

  test('7. GET /3d-viewer/real3d.html contains #btnEtsyCardBuy commercial license CTA', async () => {
    const res = await request(app).get('/3d-viewer/real3d.html');
    expect(res.status).toBe(200);
    expect(res.text).toContain('id="btnEtsyCardBuy"');
    expect(res.text).toContain('Order Commercial License ($14.99 / ৳1,800)');
  });

  test('8. GET /api/dce/products returns the Kids STEM 3D Explorer product (p-stem-01)', async () => {
    const res = await request(app).get('/api/dce/products');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const stemProduct = res.body.data.find(p => p.product_code === 'STEM-3D-01' || p.id === 'p-stem-01');
    expect(stemProduct).toBeDefined();
    expect(stemProduct.title).toContain('Kids STEM 3D Explorer');
    expect(stemProduct.product_type).toBe('DIGITAL');
  });

  test('9. GET /api/dce/products includes SKU SKU-3D-STEM-01 with $14.99 USD and ৳1,800 BDT dual pricing', async () => {
    const res = await request(app).get('/api/dce/products');
    expect(res.status).toBe(200);

    const allSkus = res.body.data.flatMap(p => p.skus || []);
    const stemSku = allSkus.find(s => s.sku === 'SKU-3D-STEM-01');
    expect(stemSku).toBeDefined();
    expect(stemSku.price).toBe(14.99);
    expect(stemSku.price_bdt).toBe(1800);
    expect(stemSku.channel_code).toBe('DIRECT');
  });

  test('10. QA runner suite (portal-audits.js) includes public_viewer3d commercial drawer assertions (10 steps)', () => {
    const auditsPath = path.join(__dirname, '../extension/gro10x-qa-runner/suites/portal-audits.js');
    const content = fs.readFileSync(auditsPath, 'utf8');

    expect(content).toContain('"public_viewer3d": {');
    expect(content).toContain('#btnOpenLicenseModal');
    expect(content).toContain('#commercialLicenseDrawer');
    expect(content).toContain('#btnLicenseCheckout');
    expect(content).toContain('#btnCloseLicenseDrawer');

    const match = content.match(/"public_viewer3d":\s*\{[\s\S]*?"steps":\s*\[([\s\S]*?)\]\s*\}/);
    expect(match).not.toBeNull();
    const stepsJson = `[${match[1]}]`;
    const parsed = JSON.parse(stepsJson);
    expect(parsed.length).toBe(10);
  });

});
