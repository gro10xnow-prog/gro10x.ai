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
});
