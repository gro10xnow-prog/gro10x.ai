const request = require('supertest');
const express = require('express');
const https = require('https');
const apiRoutes = require('../src/routes/api');
const errorHandler = require('../src/middleware/errorHandler');
const { signToken } = require('../src/services/jwt');

// Mock https.request to simulate fast Gemini API responses in tests
jest.spyOn(https, 'request').mockImplementation((options, callback) => {
  const { EventEmitter } = require('events');
  const req = new EventEmitter();
  req.write = jest.fn();
  req.end = jest.fn(() => {
    const res = new EventEmitter();
    callback(res);
    const mockReply = JSON.stringify({
      candidates: [{
        content: {
          parts: [{
            text: 'Hi Rashed! 👋 Welcome to Purplebot Digital as our Specialist in Production. Please follow the instructions.\n\n📌 Your Next Step:\nVisit the PurpleOS portal and log in with your phone number.\n\n🔗 Portal: https://purpleos-iota.vercel.app\n\nLet us know if you need help!\n\n— Purplebot Digital Admin 🔮'
          }]
        }
      }]
    });
    res.emit('data', mockReply);
    res.emit('end');
  });
  req.setTimeout = jest.fn();
  return req;
});

const app = express();
app.use(express.json());
app.use('/api', apiRoutes);
app.use(errorHandler);

describe('Security & RBAC Auth Guards Test Suite', () => {
  const crewToken = signToken({
    userId: 'EMP-099',
    name: 'Crew Member',
    role: 'Specialist',
    accessLevel: 'Specialist / Crew',
    department: 'Production',
    linkedType: 'team'
  });

  const managerToken = signToken({
    userId: 'EMP-012',
    name: 'Dept Manager',
    role: 'Department Head',
    accessLevel: 'Director / Manager',
    department: 'Creative',
    linkedType: 'team'
  });

  describe('Unauthenticated Rejections (401)', () => {
    const protectedGetEndpoints = [
      '/api/invoices',
      '/api/payments',
      '/api/team/invitation-status',
      '/api/expenses',
      '/api/leaves',
      '/api/clients',
      '/api/leads',
      '/api/tickets'
    ];

    test.each(protectedGetEndpoints)('GET %s without token returns 401', async (endpoint) => {
      const res = await request(app)
        .get(endpoint)
        .set('x-disable-dev-auth', 'true');
      expect(res.statusCode).toBe(401);
    });
  });

  describe('Crew Tier Restrictions (403)', () => {
    test('POST /api/invoices with crew token returns 403', async () => {
      const res = await request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${crewToken}`)
        .send({ amount: 1000 });
      expect(res.statusCode).toBe(403);
    });

    test('POST /api/clients with crew token returns 403', async () => {
      const res = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${crewToken}`)
        .send({ name: 'Client Corp' });
      expect(res.statusCode).toBe(403);
    });

    test('PUT /api/expenses/EXP-001/approve with crew token returns 403', async () => {
      const res = await request(app)
        .put('/api/expenses/EXP-001/approve')
        .set('Authorization', `Bearer ${crewToken}`);
      expect(res.statusCode).toBe(403);
    });

    test('POST /api/ai/generate-message with crew token returns 403', async () => {
      const res = await request(app)
        .post('/api/ai/generate-message')
        .set('Authorization', `Bearer ${crewToken}`)
        .send({ name: 'Test', stage: 'no_pin' });
      expect(res.statusCode).toBe(403);
    });
  });

  describe('Manager & Admin Permissions', () => {
    test('POST /api/ai/generate-message allowed for Manager', async () => {
      const res = await request(app)
        .post('/api/ai/generate-message')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ name: 'Rashed', stage: 'no_pin' });
      expect(res.statusCode).toBe(200);
    });

    test('POST /api/invoices allowed for Manager', async () => {
      const res = await request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ clientName: 'Approved Corp', amount: 30000 });
      expect(res.statusCode).toBe(201);
    });
  });

  describe('Server Root Protected Endpoints', () => {
    const mainApp = require('../server');

    test('GET /api/system-health without auth returns 401 when dev auth disabled', async () => {
      const res = await request(mainApp)
        .get('/api/system-health')
        .set('x-disable-dev-auth', 'true');
      expect(res.statusCode).toBe(401);
    });

    test('GET /api/sync without auth returns 401 when dev auth disabled', async () => {
      const res = await request(mainApp)
        .get('/api/sync')
        .set('x-disable-dev-auth', 'true');
      expect(res.statusCode).toBe(401);
    });
  });
});
