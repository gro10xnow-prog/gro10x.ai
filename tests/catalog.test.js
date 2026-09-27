/**
 * tests/catalog.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Integration Tests for Gro10x Master Catalog API (/api/catalog)
 * Tests HTTP endpoints, JSON structure, and error handling.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const request = require('supertest');
const app = require('../server');

describe('Master Product Catalog API (/api/catalog)', () => {

  it('GET /api/catalog/engines should return 200 with all 5 growth engines', async () => {
    const res = await request(app).get('/api/catalog/engines');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.count).toBe(5);
    expect(Array.isArray(res.body.data)).toBe(true);

    const names = res.body.data.map(e => e.name);
    expect(names).toContain('AI Agent Ecosystem and Platform');
    expect(names).toContain('AI Service Agency');
    expect(names).toContain('Omnichannel Commerce & Asset Brands');
    expect(names).toContain('Managed Retainer Services');
    expect(names).toContain('Programmatic AI Video & Media Scale');
  });

  it('GET /api/catalog/engine/engine3 should return 200 with 5 commerce verticals and 13 brands', async () => {
    const res = await request(app).get('/api/catalog/engine/engine3');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.id).toBe('engine3');
    expect(res.body.data.verticals.length).toBe(5);

    const digVertical = res.body.data.verticals.find(v => v.code === 'DIG');
    expect(digVertical).toBeDefined();
    expect(digVertical.brands.length).toBeGreaterThanOrEqual(7);
  });

  it('GET /api/catalog/engine/engine4 should return 200 with managed retainer verticals', async () => {
    const res = await request(app).get('/api/catalog/engine/engine4');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.verticals.length).toBe(5);

    const sysVertical = res.body.data.verticals.find(v => v.code === 'SYS');
    expect(sysVertical).toBeDefined();
    expect(sysVertical.brands.some(b => b.code === 'SHM')).toBe(true);
    expect(sysVertical.brands.some(b => b.code === 'PRP')).toBe(true);
  });

  it('GET /api/catalog/engine/invalid-id should return 404', async () => {
    const res = await request(app).get('/api/catalog/engine/engine99');
    expect(res.status).toBe(404);
    expect(res.body.ok).toBe(false);
  });

  it('GET /api/catalog/verticals?engineId=engine2 should return the 4 client-tier verticals', async () => {
    const res = await request(app).get('/api/catalog/verticals?engineId=engine2');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.count).toBe(4);
  });

  it('GET /api/catalog/sku/GRO-E3-DIG-PLN-PLA14-ETSY should resolve Etsy digital product SKU', async () => {
    const res = await request(app).get('/api/catalog/sku/GRO-E3-DIG-PLN-PLA14-ETSY');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.sku_code).toBe('GRO-E3-DIG-PLN-PLA14-ETSY');
    expect(res.body.data.channel).toBe('ETSY');
    expect(res.body.data.price_usd).toBe(14.99);
  });

  it('GET /api/catalog/sku/GRO-E2-SME-GWT-SPRINT01-UPW should resolve Upwork sprint SKU', async () => {
    const res = await request(app).get('/api/catalog/sku/GRO-E2-SME-GWT-SPRINT01-UPW');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.sku_code).toBe('GRO-E2-SME-GWT-SPRINT01-UPW');
    expect(res.body.data.price_usd).toBe(3500);
  });

  it('GET /api/catalog/hierarchy should return the complete company-wide tree', async () => {
    const res = await request(app).get('/api/catalog/hierarchy');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.company).toBe('Gro10x');
    expect(res.body.enginesCount).toBe(5);
  });
});
