const request = require('supertest');
const express = require('express');
const ticketRoutes = require('../src/routes/tickets');
const errorHandler = require('../src/middleware/errorHandler');
const { signToken } = require('../src/services/jwt');

const app = express();
app.use(express.json());
app.use('/api/tickets', ticketRoutes);
app.use(errorHandler);

describe('Support Tickets API Integration Tests', () => {
  const userToken = signToken({
    userId: 'EMP-005',
    name: 'Support Agent',
    role: 'Specialist',
    accessLevel: 'Specialist / Crew',
    department: 'Production',
    linkedType: 'team'
  });

  test('GET /api/tickets without token and x-disable-dev-auth returns 401', async () => {
    const res = await request(app)
      .get('/api/tickets')
      .set('x-disable-dev-auth', 'true');
    expect(res.statusCode).toBe(401);
  });

  test('GET /api/tickets with token returns ticket array', async () => {
    const res = await request(app)
      .get('/api/tickets')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body.length > 0) {
      expect(res.body[0]).toHaveProperty('id');
      expect(res.body[0]).toHaveProperty('title');
      expect(res.body[0]).toHaveProperty('status');
    }
  });

  test('POST /api/tickets without title returns 400', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ description: 'Missing title' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/title/i);
  });

  test('POST /api/tickets with valid payload creates new ticket', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Update color palette on billboard asset',
        description: 'Client asked for PMS 2685 C matching.',
        category: 'Creative Adjustment',
        priority: 'High'
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.ticket).toBeDefined();
    expect(res.body.ticket.status).toBe('Open');
  });

  afterAll(async () => {
    const { supabase, isSupabaseConfigured } = require('../src/services/supabase');
    if (isSupabaseConfigured()) {
      await supabase.from('tickets').delete().ilike('title', 'Update color palette%');
    }
  });
});
