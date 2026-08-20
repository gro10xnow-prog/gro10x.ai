const request = require('supertest');
const express = require('express');
const teamRoutes = require('../src/routes/team');
const errorHandler = require('../src/middleware/errorHandler');
const { signToken } = require('../src/services/jwt');

const app = express();
app.use(express.json());
app.use('/api/team', teamRoutes);
app.use(errorHandler);

describe('HR Team API Integration Tests', () => {
  const managerToken = signToken({
    userId: 'EMP-001',
    name: 'HR Director',
    role: 'HR Manager',
    accessLevel: 'Owner / Admin',
    department: 'HR',
    linkedType: 'team'
  });

  test('GET /api/team/invitation-status without token and x-disable-dev-auth returns 401', async () => {
    const res = await request(app)
      .get('/api/team/invitation-status')
      .set('x-disable-dev-auth', 'true');
    expect(res.statusCode).toBe(401);
  });

  test('GET /api/team/invitation-status with manager token returns members and stats', async () => {
    const res = await request(app)
      .get('/api/team/invitation-status')
      .set('Authorization', `Bearer ${managerToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.stats).toBeDefined();
    expect(Array.isArray(res.body.members)).toBe(true);
  });

  test('GET /api/team/invitation-status members have boolean status fields', async () => {
    const res = await request(app)
      .get('/api/team/invitation-status')
      .set('Authorization', `Bearer ${managerToken}`);
    expect(res.statusCode).toBe(200);
    if (res.body.members.length > 0) {
      const m = res.body.members[0];
      expect(typeof m.hasPIN).toBe('boolean');
      expect(typeof m.telegramLinked).toBe('boolean');
      expect(typeof m.surveyComplete).toBe('boolean');
      expect(typeof m.onboardingComplete).toBe('boolean');
    }
  });

  test('GET /api/team without token and x-disable-dev-auth returns 401', async () => {
    const res = await request(app)
      .get('/api/team')
      .set('x-disable-dev-auth', 'true');
    expect(res.statusCode).toBe(401);
  });

  test('GET /api/team with auth returns team array', async () => {
    const res = await request(app)
      .get('/api/team')
      .set('Authorization', `Bearer ${managerToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
