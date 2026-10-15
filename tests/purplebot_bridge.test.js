/**
 * tests/purplebot_bridge.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Verifies the Mother OS to PurpleBot Digital Core OS (Engine 4 Foundry) Bridge,
 * In-Memory Caching, Resilient Offline Fallback, and Express Endpoint Integration.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const http = require('http');
const request = require('supertest');
const purplebotBridge = require('../src/services/purplebot-bridge');
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
  purplebotBridge._clearCache();
});

describe('🤖 PurpleBot Digital Core OS (Engine 4 Foundry) Satellite Bridge Service', () => {

  test('PURPLEBOT_URL defaults to localhost:6000 or env configuration', () => {
    expect(purplebotBridge.PURPLEBOT_URL).toMatch(/http:\/\/(localhost|127\.0\.0\.1):6000|https?:\/\//);
  });

  test('getPurplebotSummary returns valid fallback object when satellite is offline', async () => {
    const summary = await purplebotBridge.getPurplebotSummary({
      forceFresh: true,
      url: 'http://127.0.0.1:49153'
    });

    expect(summary).toBeDefined();
    expect(typeof summary).toBe('object');
    expect(summary.status).toBe('STANDALONE_OFFLINE');
    expect(summary.venture).toBe('PURPLEBOT_CORE');
    expect(summary.engine).toBe(4);
    expect(summary.client).toBe('Purplebot Digital Limited');
    expect(summary.health).toBe('OFFLINE');
    expect(summary.database).toBe('Disconnected');
    expect(summary.uptimeSeconds).toBe(0);
    expect(summary.agencyTelemetry).toBeDefined();
    expect(summary.agencyTelemetry.totalStaff).toBe(0);
    expect(summary.agencyTelemetry.openTasks).toBe(0);
    expect(summary.note).toMatch(/offline/i);
  });

  test('getPurplebotSummary parses real-time health and telemetry response when satellite is live', async () => {
    // Spin up an ephemeral HTTP server simulating PurpleBot Port 6000
    const mockTelemetryPayload = {
      status: 'healthy',
      version: '1.1.0',
      environment: 'development',
      dbConnection: 'Connected',
      dbLatencyMs: 12,
      uptimeSeconds: 7200,
      memoryMB: 84.5,
      agencyTelemetry: {
        totalStaff: 5,
        openTasks: 18,
        urgentTasks: 2,
        overdueTasks: 1
      },
      botStatus: {
        teamBot: 'active',
        clientBot: 'active'
      },
      timestamp: new Date().toISOString()
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
      const summary = await purplebotBridge.getPurplebotSummary({
        forceFresh: true,
        url: testUrl
      });

      expect(summary.status).toBe('CONNECTED');
      expect(summary.venture).toBe('PURPLEBOT_CORE');
      expect(summary.engine).toBe(4);
      expect(summary.client).toBe('Purplebot Digital Limited');
      expect(summary.health).toBe('healthy');
      expect(summary.database).toBe('Connected');
      expect(summary.uptimeSeconds).toBe(7200);
      expect(summary.agencyTelemetry.totalStaff).toBe(5);
      expect(summary.agencyTelemetry.openTasks).toBe(18);
      expect(summary.agencyTelemetry.urgentTasks).toBe(2);
      expect(summary.agencyTelemetry.overdueTasks).toBe(1);
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
        status: 'healthy',
        dbConnection: 'Connected',
        uptimeSeconds: 150,
        agencyTelemetry: { totalStaff: 4, openTasks: 12 }
      }));
    });

    await new Promise((resolve) => mockServer.listen(0, '127.0.0.1', resolve));
    const port = mockServer.address().port;
    const testUrl = `http://127.0.0.1:${port}`;

    try {
      // 1st call -> Hits server
      const first = await purplebotBridge.getPurplebotSummary({ forceFresh: true, url: testUrl });
      expect(callCount).toBe(1);
      expect(first.agencyTelemetry.totalStaff).toBe(4);

      // 2nd call -> Uses cache
      const second = await purplebotBridge.getPurplebotSummary({ forceFresh: false, url: testUrl });
      expect(callCount).toBe(1);
      expect(second.agencyTelemetry.totalStaff).toBe(4);

      // 3rd call with forceFresh -> Bypasses cache
      const third = await purplebotBridge.getPurplebotSummary({ forceFresh: true, url: testUrl });
      expect(callCount).toBe(2);
      expect(third.agencyTelemetry.totalStaff).toBe(4);
    } finally {
      await new Promise((resolve) => mockServer.close(resolve));
    }
  });
});

describe('🤖 PurpleBot Bridge Express Routes Integration', () => {

  test('GET /api/engines/purplebot/bridge requires authentication (401)', async () => {
    const res = await request(app)
      .get('/api/engines/purplebot/bridge')
      .set('x-disable-dev-auth', 'true');
    expect(res.status).toBe(401);
  });

  test('GET /api/engines/purplebot/bridge returns satellite status with valid token', async () => {
    const res = await request(app)
      .get('/api/engines/purplebot/bridge')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.engineId).toBe('engine4');
    expect(res.body.venture).toBe('PURPLEBOT_CORE');
    expect(res.body.data).toBeDefined();
    expect(['CONNECTED', 'STANDALONE_OFFLINE']).toContain(res.body.data.status);
    expect(res.body.data.client).toBe('Purplebot Digital Limited');
  });

  test('GET /api/engines/summary enriches engine4 with PurpleBot live metrics', async () => {
    const res = await request(app)
      .get('/api/engines/summary')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.engines.engine4).toBeDefined();
    expect(res.body.engines.engine4.status).toBe('ACTIVE_FOUNDRY');
    expect(res.body.engines.engine4.ventureCount).toBeGreaterThanOrEqual(2);
    expect(Array.isArray(res.body.engines.engine4.products)).toBe(true);
    expect(res.body.engines.engine4.products.length).toBeGreaterThanOrEqual(2);

    const purpleProduct = res.body.engines.engine4.products.find(p => p.slug === 'purplebot');
    expect(purpleProduct).toBeDefined();
    expect(purpleProduct.name).toBe('PurpleBot Digital Core OS');
    expect(purpleProduct.client).toBe('Purplebot Digital Limited');
    expect(purpleProduct.satellite).toBeDefined();
    expect(purpleProduct.liveMetrics).toBeDefined();
    expect(typeof purpleProduct.liveMetrics.uptimeSeconds).toBe('number');
  });
});
