const request = require('supertest');
const express = require('express');
const https = require('https');
const aiRoutes = require('../src/routes/ai');
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
            text: 'Hi Nafis! 👋 Welcome to Purplebot Digital as our Specialist in Production. Please follow the instructions.\n\n📌 Your Next Step:\nVisit the PurpleOS portal and log in with your phone number.\n\n🔗 Portal: https://purpleos-iota.vercel.app\n\nLet us know if you need help!\n\n— Purplebot Digital Admin 🔮'
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
app.use('/api/ai', aiRoutes);
app.use(errorHandler);

describe('AI Message Generator API Integration Tests', () => {
  const managerToken = signToken({
    userId: 'EMP-001',
    name: 'Admin Lead',
    role: 'Managing Director',
    accessLevel: 'Owner / Admin',
    department: 'Management',
    linkedType: 'team'
  });

  const crewToken = signToken({
    userId: 'EMP-015',
    name: 'Crew Member',
    role: 'Specialist',
    accessLevel: 'Specialist / Crew',
    department: 'Production',
    linkedType: 'team'
  });

  test('POST /api/ai/generate-message without auth and x-disable-dev-auth returns 401', async () => {
    const res = await request(app)
      .post('/api/ai/generate-message')
      .set('x-disable-dev-auth', 'true')
      .send({ name: 'Anik', stage: 'no_pin' });
    expect(res.statusCode).toBe(401);
  });

  test('POST /api/ai/generate-message with crew token returns 403 Forbidden', async () => {
    const res = await request(app)
      .post('/api/ai/generate-message')
      .set('Authorization', `Bearer ${crewToken}`)
      .send({ name: 'Anik', stage: 'no_pin' });
    expect(res.statusCode).toBe(403);
  });

  test('POST /api/ai/generate-message without stage returns 400', async () => {
    const res = await request(app)
      .post('/api/ai/generate-message')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ name: 'Anik' });
    expect(res.statusCode).toBe(400);
  });

  test('POST /api/ai/generate-message with valid params generates complete message (> 150 chars)', async () => {
    const res = await request(app)
      .post('/api/ai/generate-message')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        name: 'Md. Zahin Khandaker',
        role: 'Head of Internal Operations',
        department: 'Leadership',
        stage: 'pin_tg_no_survey',
        empCode: 'PBD-005'
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBeDefined();
    expect(res.body.message.length).toBeGreaterThan(150);
    expect(res.body.message).toContain('Portal:');
    expect(res.body.message).toContain('Purplebot Digital Admin');
    expect(['gemini', 'template']).toContain(res.body.generatedBy);
  });

  test('POST /api/ai/generate-message works across all 5 stages', async () => {
    const stages = ['no_pin', 'temp_pin', 'pin_no_tg', 'pin_tg_no_survey', 'fully_onboarded'];
    for (const stage of stages) {
      const res = await request(app)
        .post('/api/ai/generate-message')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          name: 'Nafis Ahmed',
          role: 'Creative Visualizer',
          department: 'Design',
          stage
        });
      expect(res.statusCode).toBe(200);
      expect(res.body.message.length).toBeGreaterThan(100);
    }
  });

  test('GET /api/ai/status returns configuration and candidate models', async () => {
    const res = await request(app)
      .get('/api/ai/status')
      .set('Authorization', `Bearer ${managerToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('configured');
    expect(Array.isArray(res.body.models)).toBe(true);
  });
});
