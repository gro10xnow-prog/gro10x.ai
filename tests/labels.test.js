/**
 * tests/labels.test.js
 * Verification test for Version 0.6.1 Customized Labels Engine
 */

const request = require('supertest');
const app = require('../server');

describe('Version 0.6.1 — Customized Labels API Test Suite', () => {
  let createdLabelId = null;

  test('GET /api/labels should return standard seed or existing labels', async () => {
    const res = await request(app).get('/api/labels');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('name');
    expect(res.body[0]).toHaveProperty('color');
  });

  test('POST /api/labels should create a new custom label', async () => {
    const res = await request(app)
      .post('/api/labels')
      .send({ name: 'Test QA Tag', color: '#8b5cf6' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.label).toHaveProperty('id');
    expect(res.body.label.name).toBe('Test QA Tag');
    expect(res.body.label.color).toBe('#8b5cf6');

    createdLabelId = res.body.label.id;
  });

  test('DELETE /api/labels/:id should remove the created label', async () => {
    if (!createdLabelId) return;
    const res = await request(app).delete(`/api/labels/${createdLabelId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
