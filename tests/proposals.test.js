/**
 * tests/proposals.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Unit & Integration Test Suite for GRO10X Proposals & Quotations Engine v1.0
 * ─────────────────────────────────────────────────────────────────────────────
 */

const request = require('supertest');
const { signToken } = require('../src/services/jwt');

// Mock server instance
let app;
beforeAll(() => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_purple_os_2026';
  process.env.NODE_ENV = 'test';
  app = require('../server');
});

describe('💼 GRO10X Proposals & Quotations Engine', () => {
  let adminToken;
  let crewToken;

  beforeAll(() => {
    adminToken = signToken({
      id: 'GRO-001',
      emp_code: 'GRO-001',
      name: 'Firoz Uddin Ahmed',
      role: 'owner',
      accessLevel: 'Owner / Admin'
    });

    crewToken = signToken({
      id: 'GRO-010',
      emp_code: 'GRO-010',
      name: 'Specialist Crew',
      role: 'specialist',
      accessLevel: 'Specialist / Crew'
    });
  });

  describe('🌐 Public Proposal Access (No Auth Required)', () => {
    it('should retrieve the pre-seeded UCB AI Chatbot proposal by share token', async () => {
      const res = await request(app)
        .get('/api/public/proposals/ucb-meta-ai-7x9q')
        .expect(200);

      expect(res.body).toHaveProperty('id', 'PROP-2026-001');
      expect(res.body).toHaveProperty('clientName', 'United Commercial Bank (UCB)');
      expect(res.body).toHaveProperty('currency', 'BDT');
      expect(res.body.oneTimeTotal).toBe(48000);
      expect(res.body.recurringTotal).toBe(9500);
      expect(Array.isArray(res.body.scopeItems)).toBe(true);
      expect(res.body.scopeItems.length).toBeGreaterThanOrEqual(4);
      expect(Array.isArray(res.body.oneTimeItems)).toBe(true);
      expect(Array.isArray(res.body.recurringItems)).toBe(true);
      expect(res.body).not.toHaveProperty('notes'); // Sanitized for public
    });

    it('should return 404 for an invalid or nonexistent token', async () => {
      const res = await request(app)
        .get('/api/public/proposals/invalid-token-xyz')
        .expect(404);

      expect(res.body).toHaveProperty('error');
    });

    it('should allow a client to request an alignment call via public endpoint', async () => {
      const res = await request(app)
        .post('/api/public/proposals/ucb-meta-ai-7x9q/schedule-call')
        .send({
          name: 'Zahin Head of Digital Banking',
          phone: '+8801708459008',
          note: 'Ready to align on kickoff timeline'
        })
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body.message).toContain('received');
    });

    it('should allow a client to accept a proposal via public endpoint', async () => {
      const res = await request(app)
        .post('/api/public/proposals/ucb-meta-ai-7x9q/accept')
        .send({
          acceptedBy: 'Zahin Head of Digital Banking',
          clientNote: 'Approved by UCB Management'
        })
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body.proposal.status).toBe('Accepted');
    });
  });

  describe('🛡️ Admin Proposal Management (RBAC Protected)', () => {
    it('should block non-admin crew members from viewing proposal list', async () => {
      await request(app)
        .get('/api/proposals')
        .set('Authorization', `Bearer ${crewToken}`)
        .expect(403);
    });

    it('should allow Admin / Owner to list all proposals', async () => {
      const res = await request(app)
        .get('/api/proposals')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('should allow Admin to create a new multi-currency proposal', async () => {
      const newProposalPayload = {
        clientName: 'Apex Footwear Ltd',
        clientCompany: 'Apex Group',
        projectTitle: 'AI Automated E-Commerce Support Engine',
        projectSummary: 'Automated 24/7 order inquiry and catalog assistant.',
        currency: 'USD',
        scopeItems: [
          { title: 'Shopify Webhook Sync', description: 'Real-time order lookup' },
          { title: 'Gemini Assistant', description: 'Multilingual conversational AI' }
        ],
        oneTimeItems: [
          { name: 'Architecture Setup', description: 'Core system provisioning', amount: 500 }
        ],
        recurringItems: [
          { name: 'Cloud Hosting & SLA', description: '24/7 compute & maintenance', amount: 100, frequency: 'Monthly' }
        ],
        timeline: '10 Days',
        terms: '50% advance, 50% upon completion.'
      };

      const res = await request(app)
        .post('/api/proposals')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newProposalPayload)
        .expect(201);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body.proposal).toHaveProperty('id');
      expect(res.body.proposal.clientName).toBe('Apex Footwear Ltd');
      expect(res.body.proposal.currency).toBe('USD');
      expect(res.body.proposal.oneTimeTotal).toBe(500);
      expect(res.body.proposal.recurringTotal).toBe(100);
    });

    it('should allow Admin to convert an accepted proposal to an active project', async () => {
      const res = await request(app)
        .post('/api/proposals/PROP-2026-001/convert-to-project')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('projectId');
      expect(res.body.project.status).toBe('Active');
      expect(res.body.proposal.status).toBe('Converted');
    });

    it('should handle AI proposal drafting endpoint fallback gracefully', async () => {
      const res = await request(app)
        .post('/api/proposals/ai-draft')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          notes: 'Client is Daraz Bangladesh. Need an automated returns triage system for Messenger.',
          clientName: 'Daraz BD',
          currency: 'BDT'
        })
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('draft');
      expect(res.body.draft).toHaveProperty('projectTitle');
      expect(res.body.draft).toHaveProperty('oneTimeItems');
      expect(res.body.draft).toHaveProperty('recurringItems');
    });
  });
});
