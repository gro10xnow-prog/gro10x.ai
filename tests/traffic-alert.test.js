/**
 * tests/traffic-alert.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Automated Test Suite for GRO10X Traffic Sentinel
 * Validates:
 * 1. Health check endpoint (/api/traffic/status)
 * 2. Header authentication guard (x-api-key)
 * 3. Payload validation (minimum text length)
 * 4. Gemini AI traffic filtering and classification
 * ─────────────────────────────────────────────────────────────────────────────
 */

const request = require('supertest');
const app = require('../server');

describe('GRO10X Traffic Sentinel Pipeline', () => {
  const originalSecret = process.env.API_SECRET_KEY;

  afterAll(() => {
    process.env.API_SECRET_KEY = originalSecret;
  });

  test('1. GET /api/traffic/status returns operational diagnostics', async () => {
    const res = await request(app).get('/api/traffic/status');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'online');
    expect(res.body).toHaveProperty('service', 'GRO10X Traffic Sentinel API');
    expect(res.body).toHaveProperty('hasGeminiKey');
  });

  test('2. POST /api/traffic rejects request with missing/invalid API key', async () => {
    process.env.API_SECRET_KEY = 'test_secret_traffic_key_999';

    const res = await request(app)
      .post('/api/traffic')
      .set('x-api-key', 'wrong_key')
      .send({
        postId: 'test_1',
        text: 'Severe gridlock on Mohakhali flyover towards Banani',
        postUrl: 'https://facebook.com/groups/traffic/posts/1'
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('3. POST /api/traffic rejects payload with insufficient text', async () => {
    process.env.API_SECRET_KEY = 'test_secret_traffic_key_999';

    const res = await request(app)
      .post('/api/traffic')
      .set('x-api-key', 'test_secret_traffic_key_999')
      .send({
        postId: 'test_2',
        text: 'Hi',
        postUrl: 'https://facebook.com/groups/traffic/posts/2'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('4. POST /api/traffic accepts and classifies valid traffic report', async () => {
    process.env.API_SECRET_KEY = 'test_secret_traffic_key_999';

    const res = await request(app)
      .post('/api/traffic')
      .set('x-api-key', 'test_secret_traffic_key_999')
      .send({
        postId: 'test_real_alert_101',
        text: 'Major accident on Mohakhali Flyover towards Banani. A bus broke down blocking 2 lanes, traffic is completely stuck. Avoid this route!',
        postUrl: 'https://facebook.com/groups/traffic/posts/101',
        author: 'Traffic Watcher'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.filtered).toBe(false);
    expect(res.body).toHaveProperty('analysis');
    expect(res.body.analysis).toHaveProperty('isTrafficReport', true);
  }, 15000);

  test('5. POST /api/traffic filters out non-traffic chatter', async () => {
    process.env.API_SECRET_KEY = 'test_secret_traffic_key_999';

    const res = await request(app)
      .post('/api/traffic')
      .set('x-api-key', 'test_secret_traffic_key_999')
      .send({
        postId: 'test_spam_102',
        text: 'Hello brothers, can anyone suggest a good car AC repair shop near Dhanmondi? Budget is around 5000 tk.',
        postUrl: 'https://facebook.com/groups/traffic/posts/102',
        author: 'Car Enthusiast'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // Gemini should filter this as non-actionable traffic report
    expect(res.body.filtered).toBe(true);
  }, 15000);
});
