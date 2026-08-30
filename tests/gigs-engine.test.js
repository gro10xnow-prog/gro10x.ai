/**
 * tests/gigs-engine.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * GRO10X OS Freelance & Marketplace Gig Engine Unit & Integration Test Suite.
 * Validates 10-point health scoring, data persistence, REST endpoints, and AI generator.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const request = require('supertest');
const express = require('express');
const gigsRouter = require('../src/routes/gigs');
const {
  validateGigHealth,
  generateTemplateGig
} = require('../src/services/gig-generator');
const {
  getAllGigs,
  getGigById,
  updateGig
} = require('../src/services/gig-store');
const { DEFAULT_SERVICES } = require('../src/constants/services');

const app = express();
app.use(express.json());
app.use('/api/gigs', gigsRouter);

jest.setTimeout(25000);

describe('Marketplace Freelance Gig Engine Test Suite', () => {

  describe('1. 10-Point Gig Health Check Engine', () => {
    test('Seeded GIG-TECH-001 achieves 10/10 health score', () => {
      const gig = getGigById('GIG-TECH-001');
      expect(gig).toBeDefined();
      const health = validateGigHealth(gig);
      expect(health.score).toBe(10);
      expect(health.passed).toBe(true);
      expect(health.checks.every(c => c.passed)).toBe(true);
    });

    test('All 7 Technology Development Gigs achieve 10/10 health score', () => {
      const gigs = getAllGigs();
      expect(gigs.length).toBeGreaterThanOrEqual(7);

      gigs.forEach(g => {
        const health = validateGigHealth(g);
        expect(health.score).toBe(10);
        expect(health.passed).toBe(true);
      });
    });

    test('Flags title that does not start with "I will"', () => {
      const badGig = {
        title: 'Build your web app fast',
        tags: ['a', 'b', 'c', 'd', 'e'],
        description: 'a'.repeat(950),
        faq: [{ q: '1234567890', a: '123456789012345678901234567890' }, { q: '1234567890', a: '123456789012345678901234567890' }, { q: '1234567890', a: '123456789012345678901234567890' }, { q: '1234567890', a: '123456789012345678901234567890' }],
        pricing: { basic: { deliveryDays: 2 } },
        buyerRequirements: ['Requirement 1...', 'Requirement 2...', 'Requirement 3...']
      };
      const health = validateGigHealth(badGig);
      const titleCheck = health.checks.find(c => c.rule.includes('I will'));
      expect(titleCheck.passed).toBe(false);
    });

    test('Flags explicit dollar pricing in description body', () => {
      const gig = getGigById('GIG-TECH-001');
      const badGig = { ...gig, description: gig.description + ' We only charge $500 for this service.' };
      const health = validateGigHealth(badGig);
      const priceCheck = health.checks.find(c => c.rule.includes('No pricing amounts'));
      expect(priceCheck.passed).toBe(false);
    });

    test('Flags competitor platform mentions', () => {
      const gig = getGigById('GIG-TECH-001');
      const badGig = { ...gig, description: gig.description + ' Check our top profile on Upwork!' };
      const health = validateGigHealth(badGig);
      const competitorCheck = health.checks.find(c => c.rule.includes('No competitor'));
      expect(competitorCheck.passed).toBe(false);
    });
  });

  describe('2. Gig Generator & Services Catalog Synergy', () => {
    test('Template generator produces valid gig from SVC-025 (PWA)', () => {
      const svc = DEFAULT_SERVICES.find(s => s.id === 'SVC-025');
      expect(svc).toBeDefined();

      const generated = generateTemplateGig({ service: svc, gigIndex: 1 });
      expect(generated.id).toBe('GIG-TECH-001');
      expect(generated.title).toContain('I will');
      expect(generated.tags.length).toBe(5);
      expect(generated.healthCheck.passed).toBe(true);
    });

    test('Template generator produces valid gig from SVC-026 (ERP)', () => {
      const svc = DEFAULT_SERVICES.find(s => s.id === 'SVC-026');
      expect(svc).toBeDefined();

      const generated = generateTemplateGig({ service: svc, gigIndex: 3 });
      expect(generated.id).toBe('GIG-TECH-003');
      expect(generated.title).toContain('I will');
      expect(generated.healthCheck.passed).toBe(true);
    });
  });

  describe('3. REST API Endpoints', () => {
    test('GET /api/gigs returns array of 7 gigs', async () => {
      const res = await request(app).get('/api/gigs');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(7);
    });

    test('GET /api/gigs/accounts returns technology account', async () => {
      const res = await request(app).get('/api/gigs/accounts');
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0].id).toBe('ACC-TECH-001');
    });

    test('GET /api/gigs/:id returns gig with verified health check', async () => {
      const res = await request(app).get('/api/gigs/GIG-TECH-001');
      expect(res.statusCode).toBe(200);
      expect(res.body.data.id).toBe('GIG-TECH-001');
      expect(res.body.data.healthCheck.score).toBe(10);
    });

    test('PUT /api/gigs/:id updates liveUrl and status', async () => {
      const testUrl = 'https://www.fiverr.com/farhan/build-your-pwa-mvp-48h';
      const res = await request(app)
        .put('/api/gigs/GIG-TECH-001')
        .send({ liveUrl: testUrl, status: 'Live' });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.liveUrl).toBe(testUrl);
      expect(res.body.data.status).toBe('Live');

      // Verify persistence
      const fetched = getGigById('GIG-TECH-001');
      expect(fetched.liveUrl).toBe(testUrl);
      expect(fetched.status).toBe('Live');
    });

    test('POST /api/gigs/generate produces and persists new gig', async () => {
      const res = await request(app)
        .post('/api/gigs/generate')
        .send({ serviceId: 'SVC-002', gigIndex: 2 });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe('GIG-TECH-002');
      expect(res.body.data.healthCheck.passed).toBe(true);
    });
  });

});