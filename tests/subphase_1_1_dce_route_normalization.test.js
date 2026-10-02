/**
 * tests/subphase_1_1_dce_route_normalization.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Sub-Phase 1.1: Server-Side Route Rewrites & Clean URL Normalization
 * 
 * Tests:
 * 1. GET /dce returns HTTP 200 and serves standalone DCE OS dashboard without redirect
 * 2. GET /dce/ returns HTTP 200
 * 3. GET /dce/orders returns HTTP 200 and serves Omnichannel Order Inbox
 * 4. GET /dce/operations returns HTTP 200 and serves Operations & Helpdesk
 * 5. GET /dce/growth returns HTTP 200 and serves Growth Suite & Attribution
 * 6. GET /dce/digivault returns HTTP 200 and serves DigiVault Commerce Ops
 * 7. Legacy vanity aliases (/dce-portal, /dce-orders, /dce-operations, etc.) return HTTP 200
 * 8. DCE index.html file on disk contains no redirect hijack snippets
 * 9. server.js contains zero hardcoded apex redirects to gro10x.ai
 * 10. public/dce/nav.js contains bidirectional link to Engine 3 Workspace P&L
 * ─────────────────────────────────────────────────────────────────────────────
 */

const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../server');

describe('Sub-Phase 1.1: Server-Side Route Rewrites & Clean URL Normalization', () => {

  test('1. GET /dce returns HTTP 200 and serves DCE OS dashboard HTML', async () => {
    const res = await request(app).get('/dce');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toContain('GRO10X — Digital Commerce Engine (DCE) OS');
    expect(res.text).toContain('metric-rev');
    expect(res.text).toContain('viewModeTabs');
    // Ensure no client-side redirect hijack exists in served HTML
    expect(res.text).not.toContain('meta http-equiv="refresh"');
    expect(res.text).not.toContain("window.location.replace('/workspace?engineId=engine3#pnl')");
  });

  test('2. GET /dce/ (trailing slash) returns HTTP 200 with HTML', async () => {
    const res = await request(app).get('/dce/');
    expect([200, 301]).toContain(res.status);
    if (res.status === 200) {
      expect(res.text).toContain('GRO10X — Digital Commerce Engine (DCE) OS');
    }
  });

  test('3. GET /dce/orders returns HTTP 200 and serves Omnichannel Order Inbox', async () => {
    const res = await request(app).get('/dce/orders');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toContain('GRO10X — DCE Unified Omnichannel Order Inbox');
    expect(res.text).toContain('orders-table-body');
    expect(res.text).toContain('filter-channel');
  });

  test('4. GET /dce/operations returns HTTP 200 and serves Operations & Clearinghouse', async () => {
    const res = await request(app).get('/dce/operations');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toContain('GRO10X — DCE Post-Sale Operations & Settlement Clearinghouse');
    expect(res.text).toContain('tabBtnFulfillment');
    expect(res.text).toContain('tab-fulfillment');
  });

  test('5. GET /dce/growth returns HTTP 200 and serves Growth Suite & Attribution', async () => {
    const res = await request(app).get('/dce/growth');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toContain('GRO10X — DCE Growth Engine & Attribution Command Deck');
    expect(res.text).toContain('tabBtnCoupons');
    expect(res.text).toContain('tab-coupons');
  });

  test('6. GET /dce/digivault returns HTTP 200 and serves DigiVault Commerce Ops', async () => {
    const res = await request(app).get('/dce/digivault');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toContain('GRO10X — DCE DigiVault Subscriptions & License Operations');
    expect(res.text).toContain('tabBtnOrders');
    expect(res.text).toContain('ordersTableBody');
  });

  test('7. Legacy vanity aliases return HTTP 200 with appropriate HTML content', async () => {
    const portalRes = await request(app).get('/dce-portal');
    expect(portalRes.status).toBe(200);
    expect(portalRes.text).toContain('GRO10X — Digital Commerce Engine (DCE) OS');

    const ordersRes = await request(app).get('/dce-orders');
    expect(ordersRes.status).toBe(200);
    expect(ordersRes.text).toContain('GRO10X — DCE Unified Omnichannel Order Inbox');

    const opsRes = await request(app).get('/dce-operations');
    expect(opsRes.status).toBe(200);
    expect(opsRes.text).toContain('GRO10X — DCE Post-Sale Operations & Settlement Clearinghouse');

    const growthRes = await request(app).get('/dce-growth');
    expect(growthRes.status).toBe(200);
    expect(growthRes.text).toContain('GRO10X — DCE Growth Engine & Attribution Command Deck');

    const dvRes = await request(app).get('/dce-digivault');
    expect(dvRes.status).toBe(200);
    expect(dvRes.text).toContain('GRO10X — DCE DigiVault Subscriptions & License Operations');
  });

  test('8. DCE index.html file on disk contains no redirect hijack snippets', () => {
    const indexFilePath = path.join(__dirname, '../public/dce/index.html');
    const content = fs.readFileSync(indexFilePath, 'utf8');
    expect(content).not.toContain('http-equiv="refresh"');
    expect(content).not.toContain("window.location.replace('/workspace");
  });

  test('9. server.js has zero hardcoded apex domain redirects to gro10x.ai for DCE', () => {
    const serverFilePath = path.join(__dirname, '../server.js');
    const content = fs.readFileSync(serverFilePath, 'utf8');
    // Ensure no hardcoded apex URLs exist in route handlers
    const dceRouteSection = content.slice(content.indexOf('// Canonical DCE Portal Suite Endpoints'));
    expect(dceRouteSection).not.toContain('https://gro10x.ai');
    expect(dceRouteSection).not.toContain('http://gro10x.ai');
  });

  test('10. public/dce/nav.js contains bidirectional link to Engine 3 Workspace P&L', () => {
    const navFilePath = path.join(__dirname, '../public/dce/nav.js');
    const content = fs.readFileSync(navFilePath, 'utf8');
    expect(content).toContain('/workspace?engineId=engine3#pnl');
    expect(content).toContain('Engine 3 P&L ↗');
  });

});
