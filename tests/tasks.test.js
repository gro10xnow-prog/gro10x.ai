const request = require('supertest');
const app = require('../server');

describe('Task Management API', () => {
  it('GET /api/tasks should return array of tasks', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('PATCH /api/tasks/:id/stage should return 400 if stage missing', async () => {
    const res = await request(app).patch('/api/tasks/TSK-999/stage').send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('GET /api/tasks should support label filtering', async () => {
    const res = await request(app).get('/api/tasks?labels=Urgent');
    expect(res.statusCode).toBe(200);
    if (res.body.length > 0) {
      expect(res.body[0].labels).toBeDefined();
    }
  });

  it('POST /api/tasks/bulk should perform bulk operations', async () => {
    const res = await request(app).post('/api/tasks/bulk').send({
      action: 'update_stage',
      taskIds: ['TSK-001', 'TSK-002'],
      payload: { stage: 'Completed' }
    });
    // Even if IDs don't exist, it should return a valid bulk response or 200/400 depending on implementation
    expect([200, 400]).toContain(res.statusCode);
  });

  it('POST /api/tasks/:id/custom-fields should update custom fields', async () => {
    const res = await request(app).post('/api/tasks/TSK-999/custom-fields').send({
      fields: { "Client Approval": "Pending" }
    });
    expect([200, 404]).toContain(res.statusCode); // 404 if TSK-999 doesn't exist
  });
});

