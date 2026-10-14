/**
 * tests/commerce10x_bridge.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Verifies the Mother OS to Commerce 10X (Engine 3) Telemetry Bridge Service,
 * In-Memory Caching, Resilient Offline Fallback, and Express Endpoint Integration.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const http = require('http');
const request = require('supertest');
const commerce10xBridge = require('../src/services/commerce10x-bridge');
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
  commerce10xBridge._clearCache();
});

describe('🛒 Commerce 10X (Engine 3) Satellite Bridge Service', () => {

  test('COMMERCE_10X_URL defaults to localhost:4000 or env configuration', () => {
    expect(commerce10xBridge.COMMERCE_10X_URL).toMatch(/http:\/\/(localhost|127\.0\.0\.1):4000|https?:\/\//);
  });

  test('getCommerce10xSummary returns valid fallback object when satellite is offline', async () => {
    // Point to non-existent port to guarantee offline trigger
    const summary = await commerce10xBridge.getCommerce10xSummary({
      forceFresh: true,
      url: 'http://127.0.0.1:49151'
    });

    expect(summary).toBeDefined();
    expect(typeof summary).toBe('object');
    expect(summary.status).toBe('STANDALONE_OFFLINE');
    expect(summary.venture).toBe('COMMERCE_10X');
    expect(summary.engine).toBe(3);
    expect(summary.health).toBe('OFFLINE');
    expect(summary.productsCount).toBe(44);
    expect(summary.brandsCount).toBe(13);
    expect(summary.ordersCount).toBe(0);
    expect(summary.gmvUSD).toBe(0);
    expect(summary.catalog.total_brands).toBe(13);
    expect(summary.catalog.total_products).toBe(44);
    expect(summary.note).toMatch(/offline/i);
  });

  test('getCommerce10xSummary successfully parses live satellite telemetry payload', async () => {
    // Spin up an ephemeral HTTP server simulating Commerce 10X Port 4000
    const mockTelemetry = {
      venture: 'COMMERCE_10X',
      engine: 3,
      status: 'ONLINE',
      health: 'OPTIMAL',
      catalog: {
        total_verticals: 4,
        total_brands: 13,
        total_categories: 12,
        total_products: 44,
        total_skus: 65
      },
      sales: {
        total_orders: 28,
        gross_gmv_usd: 1580.50,
        net_profit_usd: 1137.96
      },
      financials: {
        gross_gmv_usd: 1580.50,
        net_profit_usd: 1137.96
      },
      licenses: {
        total_issued: 20,
        active_licenses: 20
      }
    };

    const server = http.createServer((req, res) => {
      if (req.url === '/api/telemetry/summary') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(mockTelemetry));
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;
    const testUrl = `http://127.0.0.1:${port}`;

    try {
      const summary = await commerce10xBridge.getCommerce10xSummary({
        forceFresh: true,
        url: testUrl
      });

      expect(summary.status).toBe('CONNECTED');
      expect(summary.venture).toBe('COMMERCE_10X');
      expect(summary.engine).toBe(3);
      expect(summary.health).toBe('OPTIMAL');
      expect(summary.productsCount).toBe(44);
      expect(summary.brandsCount).toBe(13);
      expect(summary.ordersCount).toBe(28);
      expect(summary.gmvUSD).toBe(1580.50);
      expect(summary.netProfitUSD).toBe(1137.96);
      expect(summary.arrRunRateUSD).toBe(Math.round(1580.50 * 12));
      expect(summary.satelliteUrl).toBe(testUrl);
      expect(summary.lastSyncedAt).toBeDefined();
    } finally {
      await new Promise(resolve => server.close(resolve));
    }
  });

  test('in-memory cache returns cached payload within 60-second TTL without refetching', async () => {
    let callCount = 0;
    const server = http.createServer((req, res) => {
      callCount++;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        venture: 'COMMERCE_10X',
        engine: 3,
        catalog: { total_products: 44, total_brands: 13 },
        sales: { gross_gmv_usd: 2000, total_orders: 10 }
      }));
    });

    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;
    const testUrl = `http://127.0.0.1:${port}`;

    try {
      // First call - should hit server
      const first = await commerce10xBridge.getCommerce10xSummary({ url: testUrl });
      expect(first.status).toBe('CONNECTED');
      expect(callCount).toBe(1);

      // Second call - should return cached value without hitting server
      const second = await commerce10xBridge.getCommerce10xSummary({ url: testUrl });
      expect(second.status).toBe('CONNECTED');
      expect(callCount).toBe(1);

      // Third call with forceFresh = true - should bypass cache and hit server
      const third = await commerce10xBridge.getCommerce10xSummary({ url: testUrl, forceFresh: true });
      expect(third.status).toBe('CONNECTED');
      expect(callCount).toBe(2);
    } finally {
      await new Promise(resolve => server.close(resolve));
    }
  });

  describe('Integration with Mother OS Engine Routes', () => {

    test('GET /api/engines/commerce10x/bridge requires authentication', async () => {
      await request(app)
        .get('/api/engines/commerce10x/bridge')
        .set('x-disable-dev-auth', 'true')
        .expect(401);
    });

    test('GET /api/engines/commerce10x/bridge returns 200 with telemetry data for authenticated admin', async () => {
      const res = await request(app)
        .get('/api/engines/commerce10x/bridge')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.engineId).toBe('engine3');
      expect(res.body.venture).toBe('COMMERCE_10X');
      expect(res.body.data).toBeDefined();
      expect(['CONNECTED', 'STANDALONE_OFFLINE']).toContain(res.body.data.status);
      expect(typeof res.body.data.productsCount).toBe('number');
      expect(typeof res.body.data.brandsCount).toBe('number');
      expect(typeof res.body.data.gmvUSD).toBe('number');
    });

    test('GET /api/engines/summary enriches Engine 3 with satellite metrics alongside Engine 1', async () => {
      const res = await request(app)
        .get('/api/engines/summary')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.engines).toBeDefined();

      // Engine 1 satellite verification
      expect(res.body.engines.engine1).toBeDefined();
      expect(res.body.engines.engine1.satellite).toBeDefined();

      // Engine 3 satellite & liveMetrics verification
      expect(res.body.engines.engine3).toBeDefined();
      expect(res.body.engines.engine3.satellite).toBeDefined();
      expect(res.body.engines.engine3.liveMetrics).toBeDefined();
      expect(typeof res.body.engines.engine3.liveMetrics.products).toBe('number');
      expect(typeof res.body.engines.engine3.liveMetrics.brands).toBe('number');
      expect(typeof res.body.engines.engine3.liveMetrics.gmvUSD).toBe('number');
      expect(typeof res.body.engines.engine3.liveMetrics.arrUSD).toBe('number');
      expect(['CONNECTED', 'STANDALONE_OFFLINE']).toContain(res.body.engines.engine3.liveMetrics.status);
    });

  });

});
