/**
 * tests/sahanabag_bridge.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Verifies the Mother OS to Sahanabag City Township OS (Engine 4 Foundry) Bridge,
 * In-Memory Caching, Resilient Offline Fallback, and Express Endpoint Integration.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const http = require('http');
const request = require('supertest');
const sahanabagBridge = require('../src/services/sahanabag-bridge');
const { signToken } = require('../src/services/jwt');

// Ensure test environment
process.env.NODE_ENV = 'test';

let app;
let adminToken;

beforeAll(() => {
  app = require('../server');
  adminToken = signToken({
    id: 'emp_admin_001',
    name: 'Firoz Ahmed',
    role: 'Managing Director',
    accessLevel: 'Owner / Admin',
    emp_code: 'GRO-001'
  });
});

beforeEach(() => {
  sahanabagBridge._clearCache();
});

describe('🏘️ Sahanabag City Township OS (Engine 4 Foundry) Satellite Bridge Service', () => {

  test('SAHANABAG_URL defaults to localhost:7000 or env configuration', () => {
    expect(sahanabagBridge.SAHANABAG_URL).toMatch(/http:\/\/(localhost|127\.0\.0\.1):7000|https?:\/\//);
  });

  test('getSahanabagSummary returns valid fallback object when satellite is offline', async () => {
    const summary = await sahanabagBridge.getSahanabagSummary({
      forceFresh: true,
      url: 'http://127.0.0.1:49154'
    });

    expect(summary).toBeDefined();
    expect(typeof summary).toBe('object');
    expect(summary.status).toBe('STANDALONE_OFFLINE');
    expect(summary.venture).toBe('SAHANABAG_CITY_TOWNSHIP_OS');
    expect(summary.engine).toBe(4);
    expect(summary.client).toContain('সাহানাবাগ সিটি');
    expect(summary.health).toBe('OFFLINE');
    expect(summary.uptimeSeconds).toBe(0);
    expect(summary.telemetry).toBeDefined();
    expect(summary.telemetry.totalPlots).toBe(0);
    expect(summary.note).toMatch(/offline/i);
  });

  test('getSahanabagSummary parses real-time diagnostics response when satellite is live', async () => {
    // Spin up an ephemeral HTTP server simulating Sahanabag Port 7000
    const mockTelemetryPayload = {
      status: 'operational',
      service: 'Sahanabag City Township OS',
      port: 7000,
      uptime_seconds: 450,
      bot_mesh: {
        bot_username: '@NishatSharminBot',
        polling_active: true
      },
      telemetry: {
        plots: { total: 42 },
        deeds: { total: 27 },
        customers: { total: 7 },
        audit_logs: { total: 161 }
      }
    };

    const mockServer = http.createServer((req, res) => {
      if (req.url === '/api/system/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(mockTelemetryPayload));
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    await new Promise((resolve) => mockServer.listen(0, '127.0.0.1', resolve));
    const port = mockServer.address().port;
    const testUrl = `http://127.0.0.1:${port}`;

    try {
      const summary = await sahanabagBridge.getSahanabagSummary({
        forceFresh: true,
        url: testUrl
      });

      expect(summary.status).toBe('CONNECTED');
      expect(summary.venture).toBe('SAHANABAG_CITY_TOWNSHIP_OS');
      expect(summary.engine).toBe(4);
      expect(summary.client).toContain('সাহানাবাগ সিটি');
      expect(summary.health).toBe('operational');
      expect(summary.uptimeSeconds).toBe(450);
      expect(summary.telemetry.totalPlots).toBe(42);
      expect(summary.telemetry.totalDeeds).toBe(27);
      expect(summary.telemetry.totalCustomers).toBe(7);
      expect(summary.telemetry.totalAuditLogs).toBe(161);
      expect(summary.lastSyncedAt).toBeDefined();
    } finally {
      await new Promise((resolve) => mockServer.close(resolve));
    }
  });

  test('In-memory caching respects TTL and caches response', async () => {
    let callCount = 0;
    const mockServer = http.createServer((req, res) => {
      callCount++;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'operational',
        uptime_seconds: 120,
        telemetry: { plots: { total: 42 }, deeds: { total: 27 } }
      }));
    });

    await new Promise((resolve) => mockServer.listen(0, '127.0.0.1', resolve));
    const port = mockServer.address().port;
    const testUrl = `http://127.0.0.1:${port}`;

    try {
      const first = await sahanabagBridge.getSahanabagSummary({ forceFresh: true, url: testUrl });
      const second = await sahanabagBridge.getSahanabagSummary({ url: testUrl });

      expect(callCount).toBe(1);
      expect(first).toEqual(second);
    } finally {
      await new Promise((resolve) => mockServer.close(resolve));
    }
  });
});

describe('🏘️ Sahanabag Bridge Express Routes Integration', () => {

  test('GET /api/engines/sahanabag/bridge requires authentication (401)', async () => {
    const res = await request(app)
      .get('/api/engines/sahanabag/bridge')
      .set('x-disable-dev-auth', 'true');
    expect(res.status).toBe(401);
  });

  test('GET /api/engines/sahanabag/bridge returns satellite status with valid token', async () => {
    const res = await request(app)
      .get('/api/engines/sahanabag/bridge')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.engineId).toBe('engine4');
    expect(res.body.venture).toBe('SAHANABAG_CITY_TOWNSHIP_OS');
    expect(res.body.data).toBeDefined();
    expect(['CONNECTED', 'STANDALONE_OFFLINE']).toContain(res.body.data.status);
    expect(res.body.data.client).toContain('সাহানাবাগ সিটি');
  });

  test('GET /api/engines/summary enriches engine4 with Sahanabag City live metrics', async () => {
    const res = await request(app)
      .get('/api/engines/summary')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.engines.engine4).toBeDefined();
    expect(res.body.engines.engine4.status).toBe('ACTIVE_FOUNDRY');
    expect(res.body.engines.engine4.ventureCount).toBe(3);
    expect(Array.isArray(res.body.engines.engine4.products)).toBe(true);
    expect(res.body.engines.engine4.products.length).toBe(3);

    const sahanabagProduct = res.body.engines.engine4.products.find(p => p.slug === 'sahanabag-city');
    expect(sahanabagProduct).toBeDefined();
    expect(sahanabagProduct.client).toContain('সাহানাবাগ সিটি');
    expect(sahanabagProduct.satellite).toBeDefined();
    expect(sahanabagProduct.liveMetrics).toBeDefined();
    expect(typeof sahanabagProduct.liveMetrics.totalPlots).toBe('number');
  });
});
