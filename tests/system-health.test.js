const request = require('supertest');
const app = require('../server');

describe('System Health Monitoring Endpoint', () => {
  test('GET /api/system-health returns platform diagnostics', async () => {
    const res = await request(app).get('/api/system-health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('version');
    expect(res.body).toHaveProperty('environment');
    expect(res.body).toHaveProperty('dbConnection');
    expect(res.body).toHaveProperty('sseClients');
    expect(res.body).toHaveProperty('botStatus');
    expect(res.body.botStatus).toHaveProperty('teamBot');
    expect(res.body.botStatus).toHaveProperty('clientBot');
    expect(res.body).toHaveProperty('uptimeSeconds');
    expect(res.body).toHaveProperty('memoryMB');
    expect(res.body).toHaveProperty('cacheStats');
    expect(res.body.cacheStats).toHaveProperty('activeKeys');
    expect(res.body).toHaveProperty('timestamp');
  });
});
