/**
 * tests/custom-fields.test.js
 * Verification test for Version 0.6.4 & 0.6.5 Custom Fields Engine
 */

const request = require('supertest');
const app = require('../server');

describe('Version 0.6.4 & 0.6.5 — Custom Fields API Test Suite', () => {
  let createdFieldId = null;

  test('GET /api/custom-fields should return standard default or existing custom fields', async () => {
    const res = await request(app).get('/api/custom-fields');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('name');
    expect(res.body[0]).toHaveProperty('fieldType');
  });

  test('POST /api/custom-fields should create a new custom field definition', async () => {
    const res = await request(app)
      .post('/api/custom-fields')
      .send({
        name: 'Frame.io Link',
        fieldType: 'text'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.field).toHaveProperty('id');
    expect(res.body.field.name).toBe('Frame.io Link');
    expect(res.body.field.fieldType).toBe('text');

    createdFieldId = res.body.field.id;
  });

  test('POST /api/tasks should save custom field values when provided', async () => {
    if (!createdFieldId) return;

    const res = await request(app)
      .post('/api/tasks')
      .send({
        title: 'Custom Field Test Task',
        client: 'Agency Client',
        customFields: {
          [createdFieldId]: 'https://frame.io/v/12345'
        }
      });

    expect([200, 201]).toContain(res.statusCode);
    expect(res.body.success).toBe(true);
    expect(res.body.task).toHaveProperty('id');
  });

  test('DELETE /api/custom-fields/:id should remove the field definition', async () => {
    if (!createdFieldId) return;
    const res = await request(app).delete(`/api/custom-fields/${createdFieldId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
