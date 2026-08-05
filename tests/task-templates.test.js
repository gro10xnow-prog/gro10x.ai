/**
 * tests/task-templates.test.js
 * Verification test for Version 0.6.6 - 0.6.9 Task Templates & Automations
 */

const request = require('supertest');
const app = require('../server');

describe('Version 0.6.6 - 0.6.9 — Task Templates API Test Suite', () => {
  let createdTemplateId = null;

  test('GET /api/task-templates should return default or existing blueprints', async () => {
    const res = await request(app).get('/api/task-templates');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('name');
    expect(res.body[0]).toHaveProperty('subtasks');
  });

  test('POST /api/task-templates should create a new workflow blueprint', async () => {
    const res = await request(app)
      .post('/api/task-templates')
      .send({
        name: 'Test Web App Blueprint',
        department: 'Software',
        subtasks: ['Figma Design', 'Database Schema', 'Frontend Build', 'QA Testing'],
        estimatedHours: 16.0,
        priority: 'High'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.template).toHaveProperty('id');
    expect(res.body.template.name).toBe('Test Web App Blueprint');

    createdTemplateId = res.body.template.id;
  });

  test('POST /api/task-templates/:id/instantiate should spawn task and subtasks', async () => {
    if (!createdTemplateId) return;

    const res = await request(app)
      .post(`/api/task-templates/${createdTemplateId}/instantiate`)
      .send({
        client: 'Chillox Fast Food Chain',
        assignee: 'Lead Specialist'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('taskId');
    expect(res.body.subtasksCreated).toBe(4);
  });

  test('DELETE /api/task-templates/:id should remove the blueprint', async () => {
    if (!createdTemplateId) return;

    const res = await request(app).delete(`/api/task-templates/${createdTemplateId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
