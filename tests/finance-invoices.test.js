const request = require('supertest');
const express = require('express');
const invoiceRoutes = require('../src/routes/invoices');
const errorHandler = require('../src/middleware/errorHandler');
const { signToken } = require('../src/services/jwt');

const app = express();
app.use(express.json());
app.use('/api/invoices', invoiceRoutes);
app.use(errorHandler);

describe('Finance Invoices API Integration Tests', () => {
  const managerToken = signToken({
    userId: 'EMP-001',
    name: 'Finance Admin',
    role: 'Managing Director',
    accessLevel: 'Owner / Admin',
    department: 'Management',
    linkedType: 'team'
  });

  const crewToken = signToken({
    userId: 'EMP-010',
    name: 'Junior Crew',
    role: 'Specialist',
    accessLevel: 'Specialist / Crew',
    department: 'Production',
    linkedType: 'team'
  });

  test('GET /api/invoices without token and x-disable-dev-auth returns 401', async () => {
    const res = await request(app)
      .get('/api/invoices')
      .set('x-disable-dev-auth', 'true');
    expect(res.statusCode).toBe(401);
  });

  test('GET /api/invoices with manager token returns array of invoices', async () => {
    const res = await request(app)
      .get('/api/invoices')
      .set('Authorization', `Bearer ${managerToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body.length > 0) {
      expect(res.body[0]).toHaveProperty('id');
      expect(res.body[0]).toHaveProperty('amount');
    }
  });

  test('POST /api/invoices with crew token returns 403 Forbidden', async () => {
    const res = await request(app)
      .post('/api/invoices')
      .set('Authorization', `Bearer ${crewToken}`)
      .send({ clientName: 'Test Client', amount: 50000 });
    expect(res.statusCode).toBe(403);
  });

  test('POST /api/invoices with manager token creates new invoice', async () => {
    const res = await request(app)
      .post('/api/invoices')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        clientName: 'Acme Corp',
        clientId: 'CLI-001',
        amount: 75000,
        taxRate: 15,
        status: 'Pending'
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.invoice).toBeDefined();
    expect(res.body.invoice.clientName).toBe('Acme Corp');
    expect(res.body.invoice.amount).toBe(75000);
  });

  test('PUT /api/invoices/:id updates invoice status', async () => {
    const res = await request(app)
      .put('/api/invoices/INV-2026-001')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ status: 'Paid', amount: 80000 });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.invoice.status).toBe('Paid');
  });

  test('GET /api/invoices/quotes returns list of quotations', async () => {
    const res = await request(app)
      .get('/api/invoices/quotes')
      .set('Authorization', `Bearer ${managerToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  afterAll(async () => {
    const { supabase, isSupabaseConfigured } = require('../src/services/supabase');
    if (isSupabaseConfigured()) {
      await supabase.from('invoices').delete().ilike('client_name', '%Acme Corp%');
    }
  });
});
