/**
 * tests/engine1_bridge.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Verifies the Mother OS to Agent 10X Telemetry Bridge Service & Endpoints
 * ─────────────────────────────────────────────────────────────────────────────
 */

const engine1Bridge = require('../src/services/engine1-bridge');

describe('Engine 1 Telemetry Bridge Service', () => {
  test('getEngine1Summary returns valid fallback object when satellite is offline', async () => {
    const summary = await engine1Bridge.getEngine1Summary();
    
    expect(summary).toBeDefined();
    expect(typeof summary).toBe('object');
    expect(['CONNECTED', 'STANDALONE_OFFLINE']).toContain(summary.status);
    expect(typeof summary.benchCount).toBe('number');
    expect(typeof summary.activePersonas).toBe('number');
    expect(summary.satelliteUrl).toBeDefined();
  });

  test('satelliteUrl defaults to localhost:3000 or env variable', () => {
    expect(engine1Bridge.ENGINE_1_URL).toMatch(/http:\/\/(localhost|127\.0\.0\.1):3000|https?:\/\//);
  });
});
