/**
 * tests/subphase_1_1_catalog_unification.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Sub-Phase 1.1 Integration Tests:
 * 1. GET /api/catalog/config exposes dynamic agency parameters & production URL.
 * 2. GET /api/catalog/products returns normalized catalog with caching.
 * 3. GET /api/services returns canonical public services array.
 * 4. GET /api/services/:id resolves by canonical ID (SVC-001) and slug (ai-mobile-apps).
 * 5. Error handling: 404 for non-existent service ID.
 * 6. Security & hygiene: Zero responses leak legacy 'https://gro10x.ai'.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const request = require('supertest');
const app = require('../server');

describe('Sub-Phase 1.1: Canonical Catalog Unification & Static Hardcoding Eradication', () => {

  it('1. GET /api/catalog/config should return dynamic agency configuration and production base URL', async () => {
    const res = await request(app).get('/api/catalog/config');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.baseUrl).toBe('https://gro10x-ai.vercel.app');
    expect(res.body.agencyPhone).toBeDefined();
    expect(res.body.agencyWhatsApp).toBeDefined();
    expect(res.body.agencyEmail).toBe('gro10xnow@gmail.com');
    expect(res.body.defaultCurrency).toBe('USD');
    expect(res.body.supportedCurrencies).toContain('USD');
    expect(res.body.supportedCurrencies).toContain('BDT');
    expect(res.body.baseUrl).not.toBe('https://gro10x.ai');
  });

  it('2. GET /api/catalog/products should return cached products list with canonical services', async () => {
    const res = await request(app).get('/api/catalog/products');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.count).toBeGreaterThanOrEqual(26);
    expect(Array.isArray(res.body.data)).toBe(true);

    const codes = res.body.data.map(p => p.product_code || p.id);
    expect(codes).toContain('SVC-001');
    expect(codes).toContain('SPRINT-01');
  });

  it('3. GET /api/services should return all public agency services with pricing and deliverables', async () => {
    const res = await request(app).get('/api/services');
    expect(res.status).toBe(200);
    const services = res.body.data || res.body;
    expect(Array.isArray(services)).toBe(true);
    expect(services.length).toBeGreaterThanOrEqual(26);

    const svc1 = services.find(s => s.id === 'SVC-001');
    expect(svc1).toBeDefined();
    expect(svc1.title).toBe('AI Mobile Apps');
    expect(svc1.priceUSD).toBe('$3,500');
    expect(svc1.priceBDT).toBe('৳410,000');
    expect(Array.isArray(svc1.features)).toBe(true);
    expect(svc1.features.length).toBeGreaterThan(0);
  });

  it('4. GET /api/services/:id should resolve by canonical ID (SVC-001)', async () => {
    const res = await request(app).get('/api/services/SVC-001');
    expect(res.status).toBe(200);
    const svc = res.body.data || res.body;
    expect(svc.id).toBe('SVC-001');
    expect(svc.title).toBe('AI Mobile Apps');
    expect(svc.category).toBe('mobile-web');
    expect(svc.priceUSD).toBe('$3,500');
    expect(svc.videoUrl).toBeDefined();
  });

  it('5. GET /api/services/:id should resolve by slug (ai-mobile-apps)', async () => {
    const res = await request(app).get('/api/services/ai-mobile-apps');
    expect(res.status).toBe(200);
    const svc = res.body.data || res.body;
    expect(svc.id).toBe('SVC-001');
    expect(svc.title).toBe('AI Mobile Apps');
    expect(svc.slug).toBe('ai-mobile-apps');
  });

  it('6. GET /api/services/:id should return 404 for unknown service', async () => {
    const res = await request(app).get('/api/services/NON_EXISTENT_SVC_999');
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('SERVICE_NOT_FOUND');
  });

  it('7. Verify no responses contain the legacy hardcoded apex domain (https://gro10x.ai)', async () => {
    const configRes = await request(app).get('/api/catalog/config');
    const configStr = JSON.stringify(configRes.body);
    expect(configStr).not.toContain('https://gro10x.ai');

    const svcRes = await request(app).get('/api/services/SVC-001');
    const svcStr = JSON.stringify(svcRes.body);
    expect(svcStr).not.toContain('https://gro10x.ai');
  });

});
