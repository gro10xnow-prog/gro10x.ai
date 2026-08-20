const request = require('supertest');
const express = require('express');
const paymentRoutes = require('../src/routes/payments');
const errorHandler = require('../src/middleware/errorHandler');
const { signToken } = require('../src/services/jwt');

const app = express();
app.use(express.json());
app.use('/api/payments', paymentRoutes);
app.use(errorHandler);

describe('Finance Payments API Integration Tests', () => {
  const managerToken = signToken({
    userId: 'EMP-001',
    name: 'Finance Lead',
    role: 'Finance Manager',
    accessLevel: 'Owner / Admin',
    department: 'Finance',
    linkedType: 'team'
  });

  const clientToken = signToken({
    userId: 'CLI-0008',
    name: 'Tasin Traders Rep',
    role: 'Client Representative',
    accessLevel: 'Client Partner',
    department: 'Client Partner',
    linkedType: 'client',
    linkedId: 'CLI-0008'
  });

  test('GET /api/payments without auth and x-disable-dev-auth returns 401', async () => {
    const res = await request(app)
      .get('/api/payments')
      .set('x-disable-dev-auth', 'true');
    expect(res.statusCode).toBe(401);
  });

  test('GET /api/payments with manager token returns payment records array', async () => {
    const res = await request(app)
      .get('/api/payments')
      .set('Authorization', `Bearer ${managerToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data || res.body)).toBe(true);
  });

  test('POST /api/payments without trxId returns 400', async () => {
    const res = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ amount: 50000 });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/trxId/i);
  });

  test('POST /api/payments with valid payload records payment proof', async () => {
    const res = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        trxId: `TRX_${Date.now()}`,
        clientId: 'CLI-0008',
        amount: 45000,
        paymentMethod: 'bKash',
        clientName: 'Tasin Traders'
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.payment).toBeDefined();
    expect(res.body.payment.trx_id).toMatch(/TRX_/);
  });
});
