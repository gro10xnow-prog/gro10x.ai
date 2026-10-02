/**
 * tests/subphase_1_4_storefronts_qa_matrix.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Sub-Phase 1.4: Public Storefronts & Inbound Intake QA Suite Integration
 * 
 * Tests:
 * 1. GET /dce/store, /digivault, /digivault/catalog.html, /digivault/track.html return HTTP 200
 * 2. GET /dce/track and /dce/affiliate return HTTP 200
 * 3. GET /api/dce/products and /api/digistore/products return valid active catalog items
 * 4. GET /api/digistore/config returns unified payment configuration
 * 5. extension/gro10x-qa-runner/suites/registry.js maps all storefront pages
 * 6. extension/gro10x-qa-runner/suites/suite-loader.js exposes all storefronts in PLATFORM_TAB_MAP
 * 7. extension/gro10x-qa-runner/suites/portal-audits.js defines valid test steps for dce_store
 * 8. extension/gro10x-qa-runner/suites/portal-audits.js defines valid test steps for public_digivault
 * 9. extension/gro10x-qa-runner/suites/portal-audits.js defines valid test steps for dce_digivault
 * 10. End-to-end inbound intake lifecycle completes across both storefront channels
 * ─────────────────────────────────────────────────────────────────────────────
 */

const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../server');

describe('Sub-Phase 1.4: Public Storefronts & Inbound Intake QA Suite Integration', () => {

  test('1. GET public customer storefront pages return HTTP 200 without redirect loops', async () => {
    const urls = ['/dce/store', '/digivault', '/digivault/catalog.html', '/digivault/track.html'];
    for (const u of urls) {
      const res = await request(app).get(u);
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/html/);
    }
  });

  test('2. GET tracking and affiliate portals return HTTP 200', async () => {
    const resTrack = await request(app).get('/dce/track');
    expect(resTrack.status).toBe(200);
    expect(resTrack.text).toContain('Track');

    const resAff = await request(app).get('/dce/affiliate');
    expect(resAff.status).toBe(200);
    expect(resAff.text).toContain('Affiliate');
  });

  test('3. GET /api/dce/products and /api/digistore/products return active product catalogs', async () => {
    const dceRes = await request(app).get('/api/dce/products');
    expect(dceRes.status).toBe(200);
    expect(dceRes.body.success).toBe(true);
    expect(Array.isArray(dceRes.body.data)).toBe(true);
    expect(dceRes.body.data.length).toBeGreaterThanOrEqual(1);

    const digiRes = await request(app).get('/api/digistore/products');
    expect(digiRes.status).toBe(200);
    expect(digiRes.body.success).toBe(true);
    expect(Array.isArray(digiRes.body.data)).toBe(true);
  });

  test('4. GET /api/digistore/config returns unified payment configuration', async () => {
    const res = await request(app).get('/api/digistore/config');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.bkashNumber).toBeDefined();
    expect(res.body.data.nagadNumber).toBeDefined();
    expect(res.body.data.whatsappNumber).toBeDefined();
    expect(res.body.data.telegramBot).toBeDefined();
  });

  test('5. registry.js maps dceStore, digivaultStore, dceTrack, and dceAffiliate', () => {
    const regPath = path.join(__dirname, '../extension/gro10x-qa-runner/suites/registry.js');
    expect(fs.existsSync(regPath)).toBe(true);
    const content = fs.readFileSync(regPath, 'utf8');

    expect(content).toContain("'dceStore'");
    expect(content).toContain("'/dce/store'");
    expect(content).toContain("'digivaultStore'");
    expect(content).toContain("'/digivault'");
    expect(content).toContain("'dceTrack'");
    expect(content).toContain("'/dce/track'");
    expect(content).toContain("'dceAffiliate'");
    expect(content).toContain("'/dce/affiliate'");
  });

  test('6. suite-loader.js exposes all storefronts in PLATFORM_TAB_MAP.public', () => {
    const loaderPath = path.join(__dirname, '../extension/gro10x-qa-runner/suites/suite-loader.js');
    expect(fs.existsSync(loaderPath)).toBe(true);
    const { PLATFORM_TAB_MAP } = require('../extension/gro10x-qa-runner/suites/suite-loader');

    const publicTabs = PLATFORM_TAB_MAP.public.tabs;
    const tabIds = publicTabs.map(t => t.id);

    expect(tabIds).toContain('dceStore');
    expect(tabIds).toContain('digivaultStore');
    expect(tabIds).toContain('dceTrack');
    expect(tabIds).toContain('dceAffiliate');
  });

  test('7. portal-audits.js defines valid test steps for dce_store', () => {
    const auditsPath = path.join(__dirname, '../extension/gro10x-qa-runner/suites/portal-audits.js');
    const content = fs.readFileSync(auditsPath, 'utf8');
    expect(content).toContain('"dce_store"');
    expect(content).toContain('#storeCurrencyToggleBtn');
    expect(content).toContain('#btn-buy-digital');
    expect(content).toContain('#custName');
  });

  test('8. portal-audits.js defines valid test steps for public_digivault', () => {
    const auditsPath = path.join(__dirname, '../extension/gro10x-qa-runner/suites/portal-audits.js');
    const content = fs.readFileSync(auditsPath, 'utf8');
    expect(content).toContain('"public_digivault"');
    expect(content).toContain('#btnLangToggle');
    expect(content).toContain('DigiVault BD Public Customer Storefront Audit');
  });

  test('9. portal-audits.js defines valid test steps for dce_digivault', () => {
    const auditsPath = path.join(__dirname, '../extension/gro10x-qa-runner/suites/portal-audits.js');
    const content = fs.readFileSync(auditsPath, 'utf8');
    expect(content).toContain('"dce_digivault"');
    expect(content).toContain('#digivaultCurrencyToggleBtn');
  });

  test('10. End-to-end inbound intake lifecycle completes across both storefront channels', async () => {
    // Channel 1: PlannerQueen Direct Checkout
    const dceRes = await request(app)
      .post('/api/dce/orders/checkout')
      .send({
        brandSlug: 'plannerqueen',
        skuId: 'sku-pq-dir-01',
        customer: {
          name: 'E2E QA Planner User',
          email: 'qa.e2e.planner@gro10x.ai'
        },
        paymentMethod: 'BKASH',
        currency: 'BDT'
      });
    expect(dceRes.status).toBe(200);
    expect(dceRes.body.data.externalOrderId).toMatch(/^DIR-PQ-/);
    expect(dceRes.body.data.currency).toBe('BDT');

    // Channel 2: DigiVault BD Direct Intake
    const digiRes = await request(app)
      .post('/api/digistore/orders')
      .send({
        customerName: 'E2E QA DigiVault User',
        customerContact: '01711223399',
        productName: 'Perplexity Pro 1 Year',
        salePrice: 1500,
        paymentMethod: 'bkash'
      });
    expect(digiRes.status).toBe(201);
    expect(digiRes.body.data.orderNumber).toMatch(/^DIGI-\d{6}$/);

    // Track DigiVault intake
    const digiOrderNumber = digiRes.body.data.orderNumber;
    const trackRes = await request(app).get(`/api/digistore/track/${digiOrderNumber}`);
    expect(trackRes.status).toBe(200);
    expect(trackRes.body.data.orderNumber).toBe(digiOrderNumber);
  });

});
