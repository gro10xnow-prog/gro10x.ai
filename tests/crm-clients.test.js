const request = require('supertest');
const express = require('express');
const clientRoutes = require('../src/routes/clients');
const errorHandler = require('../src/middleware/errorHandler');
const { signToken } = require('../src/services/jwt');

const app = express();
app.use(express.json());
app.use('/api/clients', clientRoutes);
app.use(errorHandler);

describe('CRM Clients API Integration Tests', () => {
  const adminToken = signToken({
    userId: 'EMP-001',
    name: 'Admin Lead',
    role: 'Technology Admin',
    accessLevel: 'Owner / Admin',
    department: 'Management',
    linkedType: 'team'
  });

  const crewToken = signToken({
    userId: 'EMP-022',
    name: 'Crew Member',
    role: 'Specialist',
    accessLevel: 'Specialist / Crew',
    department: 'Production',
    linkedType: 'team'
  });

  test('GET /api/clients without token and x-disable-dev-auth returns 401', async () => {
    const res = await request(app)
      .get('/api/clients')
      .set('x-disable-dev-auth', 'true');
    expect(res.statusCode).toBe(401);
  });

  test('GET /api/clients with admin token returns array of clients', async () => {
    const res = await request(app)
      .get('/api/clients')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('GET /api/clients/me returns client profile object', async () => {
    const res = await request(app)
      .get('/api/clients/me')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('POST /api/clients with crew token returns 403 Forbidden', async () => {
    const res = await request(app)
      .post('/api/clients')
      .set('Authorization', `Bearer ${crewToken}`)
      .send({ name: 'New Client' });
    expect(res.statusCode).toBe(403);
  });

  test('POST /api/clients with admin token creates new client', async () => {
    const res = await request(app)
      .post('/api/clients')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Square Pharmaceuticals',
        category: 'Healthcare',
        contactPerson: 'Mr. Khan',
        email: 'khan@square.com',
        phone: '01711223344'
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.client.name).toBe('Square Pharmaceuticals');
  });

  afterAll(async () => {
    const { supabase, isSupabaseConfigured } = require('../src/services/supabase');
    if (isSupabaseConfigured()) {
      await supabase.from('clients').delete().ilike('name', '%Square Pharmaceuticals%');
    }
  });
});
