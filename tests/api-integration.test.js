/**
 * tests/api-integration.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Master API Integration Test Suite for PurpleOS v0.8.
 * Tests core endpoints for response format, status codes, and security headers.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const request = require('supertest');
const express = require('express');
const apiRoutes = require('../src/routes/api');

const app = express();
app.use(express.json());
app.use('/api', apiRoutes);

describe('PurpleOS API Integration Test Suite', () => {
  
  test('GET /api/version returns 200 with success status and version number', async () => {
    const res = await request(app).get('/api/version');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('version');
  });

  test('GET /api/public/client-check without phone returns success: true and found: false', async () => {
    const res = await request(app).get('/api/public/client-check');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toEqual({ found: false });
  });

  test('GET /api/services returns services array with 200 OK', async () => {
    const res = await request(app).get('/api/services');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('success', true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('POST /api/chat/send with team mode returns bot response', async () => {
    const res = await request(app)
      .post('/api/chat/send')
      .send({ command: '/help', mode: 'team' });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('reply');
    expect(res.body.data.reply).toContain('PurpleOS Team Bot Commands');
  });

  test('POST /api/admin/import/clients without auth returns 401 Unauthorized', async () => {
    const res = await request(app)
      .post('/api/admin/import/clients')
      .send({ rows: [{ name: 'Test Client' }] });
    expect(res.statusCode).toEqual(401);
  });
});
