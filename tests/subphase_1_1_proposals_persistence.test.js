/**
 * tests/subphase_1_1_proposals_persistence.test.js
 * Sub-Phase 1.1 Verification: Proposals Persistence & Dual-Write Storage
 */

const request = require('supertest');
const fs = require('fs');
const path = require('path');
const { signToken } = require('../src/services/jwt');

const DB_JSON_PATH = path.join(__dirname, '../data/db.json');

let app;
beforeAll(() => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_purple_os_2026';
  process.env.NODE_ENV = 'test';
  app = require('../server');
});

describe('Sub-Phase 1.1: Proposals DB Persistence & Dual-Store', () => {
  let adminToken;
  let createdPropId;
  let createdShareToken;

  beforeAll(() => {
    adminToken = signToken({
      id: 'GRO-001',
      emp_code: 'GRO-001',
      name: 'Firoz Uddin Ahmed',
      role: 'owner',
      accessLevel: 'Owner / Admin'
    });
  });

  test('1. POST /api/proposals should create a proposal and persist to data/db.json', async () => {
    const newProposalPayload = {
      clientName: 'Alpha Fintech Ltd',
      clientCompany: 'Alpha Fintech',
      clientEmail: 'billing@alphafintech.io',
      projectTitle: 'AI Fraud Screening Engine',
      projectSummary: 'Automated KYC and real-time transaction monitoring.',
      oneTimeTotal: 150000,
      recurringTotal: 25000,
      currency: 'BDT',
      timeline: '3 Weeks'
    };

    const res = await request(app)
      .post('/api/proposals')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(newProposalPayload)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.proposal).toHaveProperty('id');
    expect(res.body.proposal).toHaveProperty('shareToken');
    createdPropId = res.body.proposal.id;
    createdShareToken = res.body.proposal.shareToken;

    // Verify written to data/db.json
    expect(fs.existsSync(DB_JSON_PATH)).toBe(true);
    const dbContent = JSON.parse(fs.readFileSync(DB_JSON_PATH, 'utf8'));
    const stored = (dbContent.proposals || []).find(p => p.id === createdPropId);
    expect(stored).toBeDefined();
    expect(stored.client_name).toBe('Alpha Fintech Ltd');
  });

  test('2. GET /api/proposals should list the persisted proposal', async () => {
    const res = await request(app)
      .get('/api/proposals')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    const found = res.body.find(p => p.id === createdPropId);
    expect(found).toBeDefined();
    expect(found.projectTitle).toBe('AI Fraud Screening Engine');
  });

  test('3. Public access via GET /api/public/proposals/:token', async () => {
    const res = await request(app)
      .get(`/api/public/proposals/${createdShareToken}`)
      .expect(200);

    expect(res.body.id).toBe(createdPropId);
    expect(res.body.clientName).toBe('Alpha Fintech Ltd');
  });

  test('4. POST /api/proposals/:id/convert-to-project persists project to data/db.json projects', async () => {
    const res = await request(app)
      .post(`/api/proposals/${createdPropId}/convert-to-project`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.projectId).toMatch(/^PRJ-/);
    expect(res.body.proposal.status).toBe('Converted');

    // Verify project exists in data/db.json
    const dbContent = JSON.parse(fs.readFileSync(DB_JSON_PATH, 'utf8'));
    const project = (dbContent.projects || []).find(p => p.id === res.body.projectId);
    expect(project).toBeDefined();
    expect(project.name).toBe('AI Fraud Screening Engine');
  });

  test('5. PATCH /api/proposals/:id updates persisted proposal', async () => {
    const res = await request(app)
      .patch(`/api/proposals/${createdPropId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ clientCompany: 'Alpha Fintech Global Corp' })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.proposal.clientCompany).toBe('Alpha Fintech Global Corp');

    // Verify update in data/db.json
    const dbContent = JSON.parse(fs.readFileSync(DB_JSON_PATH, 'utf8'));
    const stored = (dbContent.proposals || []).find(p => p.id === createdPropId);
    expect(stored.client_company).toBe('Alpha Fintech Global Corp');
  });

  test('6. DELETE /api/proposals/:id removes from persistent storage', async () => {
    const res = await request(app)
      .delete(`/api/proposals/${createdPropId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);

    // Verify removal from data/db.json
    const dbContent = JSON.parse(fs.readFileSync(DB_JSON_PATH, 'utf8'));
    const stored = (dbContent.proposals || []).find(p => p.id === createdPropId);
    expect(stored).toBeUndefined();
  });
});
