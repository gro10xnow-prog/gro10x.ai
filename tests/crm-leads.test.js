const request = require('supertest');
const express = require('express');
const leadRoutes = require('../src/routes/leads');
const errorHandler = require('../src/middleware/errorHandler');
const { signToken } = require('../src/services/jwt');

const app = express();
app.use(express.json());
app.use('/api/leads', leadRoutes);
app.use(errorHandler);

describe('CRM Leads API Integration Tests', () => {
  const adminToken = signToken({
    userId: 'EMP-001',
    name: 'Admin Lead',
    role: 'Technology Admin',
    accessLevel: 'Owner / Admin',
    department: 'Management',
    linkedType: 'team'
  });

  test('GET /api/leads without token and x-disable-dev-auth returns 401', async () => {
    const res = await request(app)
      .get('/api/leads')
      .set('x-disable-dev-auth', 'true');
    expect(res.statusCode).toBe(401);
  });

  test('GET /api/leads with admin token returns array of leads with score', async () => {
    const res = await request(app)
      .get('/api/leads')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('POST /api/leads (public lead capture) creates lead without auth', async () => {
    const res = await request(app)
      .post('/api/leads')
      .send({
        clientName: 'Unilever Bangladesh',
        contactPerson: 'Marketing Head',
        email: `unilever_${Date.now()}@agencytest.com`,
        phone: '01899001122',
        service: 'Digital Marketing & Growth',
        source: 'Website Widget'
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.lead).toBeDefined();
    expect(res.body.lead.company).toBe('Unilever Bangladesh');
    expect(res.body.lead.score).toBeDefined();
  });

  test('POST /api/leads/:id/onboard generates magic link for lead', async () => {
    const res = await request(app)
      .post('/api/leads/LED-001/onboard')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.magicLink).toBeDefined();
  });
});
