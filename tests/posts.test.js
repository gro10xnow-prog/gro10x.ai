const request = require('supertest');
const app = require('../server');

describe('Social Posts API', () => {
  it('GET /api/posts should return array of posts', async () => {
    const res = await request(app).get('/api/posts');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
