/**
 * tests/toffeecon_bridge.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Verifies the Mother OS to ToffeeCon 2026 (Engine 4 Foundry) Bridge Service,
 * In-Memory Caching, Resilient Offline Fallback, and Express Endpoint Integration.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const http = require('http');
const request = require('supertest');
const toffeeconBridge = require('../src/services/toffeecon-bridge');
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
  toffeeconBridge._clearCache();
});

describe('🎪 ToffeeCon 2026 (Engine 4 Foundry) Satellite Bridge Service', () => {

  test('TOFFEECON_URL defaults to localhost:5000 or env configuration', () => {
    expect(toffeeconBridge.TOFFEECON_URL).toMatch(/http:\/\/(localhost|127\.0\.0\.1):5000|https?:\/\//);
  });

  test('getToffeeconSummary returns valid fallback object when satellite is offline', async () => {
    const summary = await toffeeconBridge.getToffeeconSummary({
      forceFresh: true,
      url: 'http://127.0.0.1:49152'
    });

    expect(summary).toBeDefined();
    expect(typeof summary).toBe('object');
    expect(summary.status).toBe('STANDALONE_OFFLINE');
    expect(summary.venture).toBe('TOFFEECON_2026');
    expect(summary.engine).toBe(4);
    expect(summary.client).toBe('Toffee / Banglalink');
    expect(summary.health).toBe('OFFLINE');
    expect(summary.connectedClients).toBe(0);
    expect(summary.uptimeSeconds).toBe(0);
    expect(summary.note).toMatch(/offline/i);
  });

  test('getToffeeconSummary parses real-time diagnostics response when satellite is live', async () => {
    // Spin up an ephemeral HTTP server simulating ToffeeCon Port 5000
    const mockTelemetryPayload = {
      uptimeSeconds: 3600,
      memoryUsage: { heapUsed: 45000000 },
      connectedClients: 42,
      autoLoopActive: true,
      eventState: { currentMode: 'MAIN_STAGE_LIVE' }
    };

    const mockServer = http.createServer((req, res) => {
      if (req.url === '/api/system/diagnostics') {
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
      const summary = await toffeeconBridge.getToffeeconSummary({
        forceFresh: true,
        url: testUrl
      });

      expect(summary.status).toBe('CONNECTED');
      expect(summary.venture).toBe('TOFFEECON_2026');
      expect(summary.engine).toBe(4);
      expect(summary.client).toBe('Toffee / Banglalink');
      expect(summary.uptimeSeconds).toBe(3600);
      expect(summary.connectedClients).toBe(42);
      expect(summary.autoLoopActive).toBe(true);
      expect(summary.currentStageMode).toBe('MAIN_STAGE_LIVE');
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
        uptimeSeconds: 120,
        connectedClients: 10,
        eventState: { currentMode: 'STAGE_A' }
      }));
    });

    await new Promise((resolve) => mockServer.listen(0, '127.0.0.1', resolve));
    const port = mockServer.address().port;
    const testUrl = `http://127.0.0.1:${port}`;

    try {
      // 1st call -> Hits server
      const first = await toffeeconBridge.getToffeeconSummary({ forceFresh: true, url: testUrl });
      expect(callCount).toBe(1);
      expect(first.connectedClients).toBe(10);

      // 2nd call -> Uses cache
      const second = await toffeeconBridge.getToffeeconSummary({ forceFresh: false, url: testUrl });
      expect(callCount).toBe(1);
      expect(second.connectedClients).toBe(10);

      // 3rd call with forceFresh -> Bypasses cache
      const third = await toffeeconBridge.getToffeeconSummary({ forceFresh: true, url: testUrl });
      expect(callCount).toBe(2);
      expect(third.connectedClients).toBe(10);
    } finally {
      await new Promise((resolve) => mockServer.close(resolve));
    }
  });
});

describe('🎪 ToffeeCon Bridge Express Routes Integration', () => {

  test('GET /api/engines/toffeecon/bridge requires authentication (401)', async () => {
    const res = await request(app)
      .get('/api/engines/toffeecon/bridge')
      .set('x-disable-dev-auth', 'true');
    expect(res.status).toBe(401);
  });

  test('GET /api/engines/toffeecon/bridge returns satellite status with valid token', async () => {
    const res = await request(app)
      .get('/api/engines/toffeecon/bridge')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.engineId).toBe('engine4');
    expect(res.body.venture).toBe('TOFFEECON_2026');
    expect(res.body.data).toBeDefined();
    expect(['CONNECTED', 'STANDALONE_OFFLINE']).toContain(res.body.data.status);
    expect(res.body.data.client).toBe('Toffee / Banglalink');
  });

  test('GET /api/engines/summary enriches engine4 with Foundry 10X live metrics', async () => {
    const res = await request(app)
      .get('/api/engines/summary')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.engines.engine4).toBeDefined();
    expect(res.body.engines.engine4.status).toBe('ACTIVE_FOUNDRY');
    expect(res.body.engines.engine4.ventureCount).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(res.body.engines.engine4.products)).toBe(true);
    expect(res.body.engines.engine4.products.length).toBeGreaterThanOrEqual(1);

    const product = res.body.engines.engine4.products[0];
    expect(product.slug).toBe('toffeecon');
    expect(product.client).toBe('Toffee / Banglalink');
    expect(product.satellite).toBeDefined();
    expect(product.liveMetrics).toBeDefined();
    expect(typeof product.liveMetrics.connectedClients).toBe('number');
  });
});
