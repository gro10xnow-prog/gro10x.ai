const request = require('supertest');
const express = require('express');
const authRoutes = require('../src/routes/auth');
const errorHandler = require('../src/middleware/errorHandler');
const { signToken } = require('../src/services/jwt');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use(errorHandler);

describe('Auth API Integration Tests', () => {
  const managerToken = signToken({
    userId: 'EMP-001',
    name: 'Admin Test',
    role: 'Managing Director',
    accessLevel: 'Owner / Admin',
    department: 'Management',
    linkedType: 'team'
  });

  const memberToken = signToken({
    userId: 'EMP-005',
    name: 'Crew Member',
    role: 'Video Editor',
    accessLevel: 'Specialist / Crew',
    department: 'Production',
    linkedType: 'team'
  });

  test('GET /api/auth/health returns 200 and status ok', async () => {
    const res = await request(app).get('/api/auth/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('app', 'GRO10X');
  });

  test('GET /api/auth/config returns 200 with config properties', async () => {
    const res = await request(app).get('/api/auth/config');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('supabaseUrl');
    expect(res.body).toHaveProperty('supabaseAnonKey');
  });

  test('GET /api/auth/me with valid JWT returns profile', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${managerToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.role).toBe('Managing Director');
  });

  test('GET /api/auth/me with no token and x-disable-dev-auth returns 401', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('x-disable-dev-auth', 'true');
    expect(res.statusCode).toBe(401);
  });

  test('POST /api/auth/pin/generate without phone returns 400', async () => {
    const res = await request(app)
      .post('/api/auth/pin/generate')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/Phone/i);
  });

  test('POST /api/auth/pin/generate with valid phone generates temporary PIN', async () => {
    const res = await request(app)
      .post('/api/auth/pin/generate')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ phone: '01700000001', linkedType: 'team' });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.pin).toBeDefined();
    expect(res.body.phone).toBe('01700000001');
  });

  test('POST /api/auth/pin/verify without phone or pin returns 400', async () => {
    const res = await request(app)
      .post('/api/auth/pin/verify')
      .send({ phone: '01700000001' });
    expect(res.statusCode).toBe(400);
  });

  test('POST /api/auth/pin/set without required params returns 400', async () => {
    const res = await request(app)
      .post('/api/auth/pin/set')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ phone: '01700000001', newPin: '12' });
    expect(res.statusCode).toBe(400);
  });
});
