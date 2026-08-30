const request = require('supertest');
const express = require('express');
const https = require('https');
const { getFirstName, getPreferredName, matchesAssignee } = require('../src/utils/name');
const aiRoutes = require('../src/routes/ai');
const errorHandler = require('../src/middleware/errorHandler');
const { signToken } = require('../src/services/jwt');

// Mock https.request to test AI message generator greeting deterministically
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
            text: 'Hi Zahin! 👋 Welcome to GRO10X! We are so excited to have you join us as our Visualizer in Creative & Content.\n\nYour GRO10X workspace is ready and waiting.\n\nPortal: https://gro10x-ai.vercel.app\n\n-- GRO10X Admin'
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

describe('Phase 3: Executive AI Message Engine & Identity Resolution Tests', () => {
  const managerToken = signToken({
    userId: 'EMP-001',
    name: 'Admin Stakeholder',
    role: 'Technology Admin',
    accessLevel: 'Owner / Admin',
    department: 'Executive',
    linkedType: 'team'
  });

  // 1. Honorific-Aware First Name Resolution Tests
  describe('Name Engine: getFirstName', () => {
    test('accurately extracts true preferred first name across Bangladeshi & international honorifics', () => {
      expect(getFirstName('Md. Zahin Khandaker')).toBe('Zahin');
      expect(getFirstName('md. zahin')).toBe('zahin');
      expect(getFirstName('MD. Borhan Uddin')).toBe('Borhan');
      expect(getFirstName('Mohammad Borhan Uddin')).toBe('Borhan');
      expect(getFirstName('Mohammed Nasir')).toBe('Nasir');
      expect(getFirstName('Muhammad Mahmudul Hasan')).toBe('Mahmudul');
      expect(getFirstName('Dr. Ayman Sadiq')).toBe('Ayman');
      expect(getFirstName('Engr. Mahmudul Hasan')).toBe('Mahmudul');
      expect(getFirstName('Mr. Mehedi Hasan')).toBe('Mehedi');
      expect(getFirstName('Mrs. Sharmin Sultana')).toBe('Sharmin');
      expect(getFirstName('Ms. Farhana')).toBe('Farhana');
      expect(getFirstName('Adv. Rafiq')).toBe('Rafiq');
      expect(getFirstName('Alhaj Md. Rafiq')).toBe('Rafiq');
      expect(getFirstName('Tasin Traders')).toBe('Tasin');
      expect(getFirstName('Mehedi')).toBe('Mehedi');
      expect(getFirstName('')).toBe('Team Member');
      expect(getFirstName(null)).toBe('Team Member');
      expect(getFirstName(undefined)).toBe('Team Member');
    });
  });

  // 2. Preferred Full Name Extraction Tests
  describe('Name Engine: getPreferredName', () => {
    test('strips honorific prefixes while preserving the rest of the name', () => {
      expect(getPreferredName('Md. Zahin Khandaker')).toBe('Zahin Khandaker');
      expect(getPreferredName('Dr. Ayman Sadiq')).toBe('Ayman Sadiq');
      expect(getPreferredName('Engr. Mahmudul Hasan')).toBe('Mahmudul Hasan');
      expect(getPreferredName('Mehedi Hasan')).toBe('Mehedi Hasan');
    });
  });

  // 3. Task Assignee Matching Tests
  describe('Name Engine: matchesAssignee', () => {
    test('matches employee by name, preferred name, and employee code without cross-contamination', () => {
      expect(matchesAssignee('Md. Zahin Khandaker', 'Md. Zahin Khandaker', 'PBD-002')).toBe(true);
      expect(matchesAssignee('Zahin Khandaker', 'Md. Zahin Khandaker', 'PBD-002')).toBe(true);
      expect(matchesAssignee('PBD-002 (Zahin)', 'Md. Zahin Khandaker', 'PBD-002')).toBe(true);

      // Crucial: Must NOT match another employee who also starts with "Md."
      expect(matchesAssignee('Md. Borhan Uddin', 'Md. Zahin Khandaker', 'PBD-002')).toBe(false);
    });
  });

  // 4. Executive AI Message Generator Greeting Integrity
  describe('AI Message Generator API', () => {
    test('POST /api/ai/generate-message outputs "Hi Zahin!" and NOT "Hi Md.!"', async () => {
      const res = await request(app)
        .post('/api/ai/generate-message')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          name: 'Md. Zahin Khandaker',
          role: 'Visualizer',
          department: 'Creative & Content',
          stage: 'fully_onboarded'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBeDefined();
      expect(res.body.message).toContain('Hi Zahin!');
      expect(res.body.message).not.toContain('Hi Md.!');
      expect(res.body.message).not.toContain('Hi Md !');
    });
  });
});
