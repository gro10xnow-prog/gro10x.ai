const request = require('supertest');
const express = require('express');
const expenseRoutes = require('../src/routes/expenses');
const errorHandler = require('../src/middleware/errorHandler');
const { signToken } = require('../src/services/jwt');

const app = express();
app.use(express.json());
app.use('/api/expenses', expenseRoutes);
app.use(errorHandler);

describe('Finance Expenses API Integration Tests', () => {
  const managerToken = signToken({
    userId: 'EMP-001',
    name: 'Ayman Rahman',
    role: 'Operations Director',
    accessLevel: 'Owner / Admin',
    department: 'Management',
    linkedType: 'team'
  });

  const crewToken = signToken({
    userId: 'EMP-020',
    name: 'Props Crew',
    role: 'Specialist',
    accessLevel: 'Specialist / Crew',
    department: 'Production',
    linkedType: 'team'
  });

  test('GET /api/expenses without token and x-disable-dev-auth returns 401', async () => {
    const res = await request(app)
      .get('/api/expenses')
      .set('x-disable-dev-auth', 'true');
    expect(res.statusCode).toBe(401);
  });

  test('GET /api/expenses with valid auth returns expense list', async () => {
    const res = await request(app)
      .get('/api/expenses')
      .set('Authorization', `Bearer ${managerToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body.length > 0) {
      expect(res.body[0]).toHaveProperty('id');
      expect(res.body[0]).toHaveProperty('amount');
    }
  });

  test('POST /api/expenses creates new expense claim', async () => {
    const res = await request(app)
      .post('/api/expenses')
      .set('Authorization', `Bearer ${crewToken}`)
      .send({
        title: 'Color Gel Filters for Studio Lights',
        category: 'Shoot Props',
        amount: 3500,
        description: 'Set of 12 color gels for music video shoot'
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.expense).toBeDefined();
    expect(res.body.expense.amount).toBe(3500);
  });

  test('PUT /api/expenses/:id/approve with crew token returns 403 Forbidden', async () => {
    const res = await request(app)
      .put('/api/expenses/EXP-001/approve')
      .set('Authorization', `Bearer ${crewToken}`);
    expect(res.statusCode).toBe(403);
  });

  test('PUT /api/expenses/:id/approve with manager token approves expense', async () => {
    const res = await request(app)
      .put('/api/expenses/EXP-001/approve')
      .set('Authorization', `Bearer ${managerToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.expense.tier1.approved).toBe(true);
  });
});
