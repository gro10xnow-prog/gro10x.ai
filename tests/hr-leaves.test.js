const request = require('supertest');
const express = require('express');
const leaveRoutes = require('../src/routes/leaves');
const errorHandler = require('../src/middleware/errorHandler');
const { signToken } = require('../src/services/jwt');

const app = express();
app.use(express.json());
app.use('/api/leaves', leaveRoutes);
app.use(errorHandler);

describe('HR Leaves API Integration Tests', () => {
  const managerToken = signToken({
    userId: 'EMP-001',
    name: 'Director Admin',
    role: 'Managing Director',
    accessLevel: 'Owner / Admin',
    department: 'Management',
    linkedType: 'team'
  });

  const crewToken = signToken({
    userId: 'PBD-005',
    name: 'Asif Crew',
    role: 'Specialist',
    accessLevel: 'Specialist / Crew',
    department: 'Production',
    linkedType: 'team'
  });

  test('GET /api/leaves without token and x-disable-dev-auth returns 401', async () => {
    const res = await request(app)
      .get('/api/leaves')
      .set('x-disable-dev-auth', 'true');
    expect(res.statusCode).toBe(401);
  });

  test('GET /api/leaves with valid auth returns leave list', async () => {
    const res = await request(app)
      .get('/api/leaves')
      .set('Authorization', `Bearer ${managerToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('POST /api/leaves submits new leave request', async () => {
    const res = await request(app)
      .post('/api/leaves')
      .set('Authorization', `Bearer ${crewToken}`)
      .send({
        staffId: 'PBD-005',
        staffName: 'Asif Crew',
        leaveType: 'Casual Leave',
        startDate: '2026-09-01',
        endDate: '2026-09-02',
        reason: 'Personal urgent matters'
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.leave).toBeDefined();
    expect(res.body.leave.status).toBe('Pending');
  });

  test('PUT /api/leaves/:id with crew token returns 403 Forbidden', async () => {
    const res = await request(app)
      .put('/api/leaves/LEV-001')
      .set('Authorization', `Bearer ${crewToken}`)
      .send({ status: 'Approved' });
    expect(res.statusCode).toBe(403);
  });

  test('GET /api/leaves filter by employeeId works', async () => {
    const res = await request(app)
      .get('/api/leaves?employeeId=PBD-005')
      .set('Authorization', `Bearer ${managerToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  afterAll(async () => {
    const { supabase, isSupabaseConfigured } = require('../src/services/supabase');
    if (isSupabaseConfigured()) {
      await supabase.from('leaves').delete().eq('employee_id', 'PBD-005');
    }
  });
});
