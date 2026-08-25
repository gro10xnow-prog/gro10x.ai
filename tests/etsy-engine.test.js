/**
 * tests/etsy-engine.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Unit and integration tests for Etsy OS Service & AI Health Check Engine
 * ─────────────────────────────────────────────────────────────────────────────
 */

const request = require('supertest');
const express = require('express');
const apiRoutes = require('../src/routes/api');
const errorHandler = require('../src/middleware/errorHandler');
const {
  generatePKCE,
  getAuthorizationUrl,
  runProductHealthCheck,
  ETSY_KEYSTRING
} = require('../src/services/etsy');

const app = express();
app.use(express.json());
app.use('/api', apiRoutes);
app.use(errorHandler);

describe('Etsy OS Service & PKCE Engine', () => {
  test('generatePKCE produces valid RFC 7636 verifier and S256 challenge', () => {
    const { codeVerifier, codeChallenge } = generatePKCE();
    expect(codeVerifier).toBeDefined();
    expect(codeChallenge).toBeDefined();
    expect(typeof codeVerifier).toBe('string');
    expect(typeof codeChallenge).toBe('string');
    expect(codeVerifier.length).toBeGreaterThanOrEqual(43);
    expect(codeChallenge.length).toBeGreaterThanOrEqual(43);
    // Ensure URL safe characters
    expect(/^[A-Za-z0-9_-]+$/.test(codeVerifier)).toBe(true);
    expect(/^[A-Za-z0-9_-]+$/.test(codeChallenge)).toBe(true);
  });

  test('getAuthorizationUrl returns complete OAuth URL with correct client_id & scopes', () => {
    const brandId = 1;
    const { authUrl, codeVerifier, state } = getAuthorizationUrl(brandId);
    expect(authUrl).toContain('https://www.etsy.com/oauth/connect');
    expect(authUrl).toContain(`client_id=${ETSY_KEYSTRING}`);
    expect(authUrl).toContain('response_type=code');
    expect(authUrl).toContain('code_challenge_method=S256');
    expect(authUrl).toContain('listings_w');
    expect(authUrl).toContain('shops_w');
    expect(codeVerifier).toBeDefined();
    expect(state).toBeDefined();
  });
});

describe('AI Pre-Listing 10-Rule Health Check Engine', () => {
  const brand = {
    id: 1,
    name: 'PlannerQueenCo',
    niche: 'Digital Planners & Printable Trackers'
  };

  test('passes a 100% compliant and complete product', () => {
    const validProduct = {
      code: 'PQC-001',
      name: '2026 Master Budget Planner',
      price: 4.99,
      type: 'Digital',
      seoTitle: '2026 Master Budget Planner Printable | Minimalist Monthly Finance Tracker Template (PDF)',
      seoDescription: 'Take control of your personal finances with this 2026 Master Budget Planner. Includes debt payoff trackers, monthly cash flow sheets, sinking funds, and bill calendars. 100% instant digital download PDF.',
      seoTags: ['budget planner', 'printable template', 'finance tracker', 'debt payoff', 'monthly budget', 'instant download', 'goodnotes', 'minimalist', 'organizer', 'pdf download', 'habit tracker', 'productivity', 'editable pdf'],
      vault: { storagePath: 'brands/1/PQC-001/v1/budget_planner.pdf', fileName: 'budget_planner.pdf' },
      mockups: Array(10).fill('mockup.png'),
      section: 'Budget Planners'
    };

    const report = runProductHealthCheck(validProduct, brand);
    expect(report.passed).toBe(true);
    expect(report.failures.length).toBe(0);
    expect(report.score).toBeGreaterThanOrEqual(9.0);
  });

  test('fails when title exceeds 140 chars or is missing', () => {
    const invalidTitleProduct = {
      code: 'PQC-002',
      name: 'Long Title Planner',
      price: 4.99,
      seoTitle: 'A'.repeat(145), // 145 chars exceeds 140 limit
      seoDescription: 'Valid description for printable digital download planner system. Great product for organization.'.repeat(3),
      seoTags: Array(13).fill('plannertag'),
      vault: { fileName: 'file.pdf' }
    };

    const report = runProductHealthCheck(invalidTitleProduct, brand);
    expect(report.passed).toBe(false);
    expect(report.failures.some(f => f.rule === 'title_length_max')).toBe(true);
  });

  test('fails when digital deliverable is not uploaded to vault', () => {
    const missingVaultProduct = {
      code: 'PQC-003',
      name: 'No File Planner',
      price: 4.99,
      seoTitle: 'Minimalist Daily Planner (PDF)',
      seoDescription: 'Instant digital download template for daily planning and task execution.'.repeat(4),
      seoTags: Array(13).fill('plannertag'),
      vault: null // missing
    };

    const report = runProductHealthCheck(missingVaultProduct, brand);
    expect(report.passed).toBe(false);
    expect(report.failures.some(f => f.rule === 'vault_file_missing')).toBe(true);
  });

  test('fails when price is missing or below minimum $0.20', () => {
    const invalidPriceProduct = {
      code: 'PQC-004',
      name: 'Zero Price Planner',
      price: 0,
      seoTitle: 'Minimalist Daily Planner (PDF)',
      seoDescription: 'Instant digital download template for daily planning and task execution.'.repeat(4),
      seoTags: Array(13).fill('plannertag'),
      vault: { fileName: 'file.pdf' }
    };

    const report = runProductHealthCheck(invalidPriceProduct, brand);
    expect(report.passed).toBe(false);
    expect(report.failures.some(f => f.rule === 'price_required')).toBe(true);
  });

  test('flags tags that exceed 20 characters', () => {
    const longTagProduct = {
      code: 'PQC-005',
      name: 'Long Tag Planner',
      price: 5.99,
      seoTitle: 'Minimalist Daily Planner (PDF)',
      seoDescription: 'Instant digital download template for daily planning and task execution.'.repeat(4),
      seoTags: ['a_tag_that_exceeds_twenty_characters_long', 'short tag 2', 'tag 3', 'tag 4', 'tag 5', 'tag 6', 'tag 7', 'tag 8', 'tag 9', 'tag 10', 'tag 11', 'tag 12', 'tag 13'],
      vault: { fileName: 'file.pdf' }
    };

    const report = runProductHealthCheck(longTagProduct, brand);
    expect(report.passed).toBe(false);
    expect(report.failures.some(f => f.rule === 'tags_length_exceeded')).toBe(true);
  });
});

describe('Etsy API Route Endpoints', () => {
  test('GET /api/etsy/brands/1/status returns status payload', async () => {
    const res = await request(app).get('/api/etsy/brands/1/status');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.brandId).toBe('1');
    expect(typeof res.body.data.connected).toBe('boolean');
  });

  test('POST /api/etsy/brands/1/health-check-all returns batch health report or requires auth', async () => {
    const res = await request(app)
      .post('/api/etsy/brands/1/health-check-all');
    
    expect([200, 401]).toContain(res.status);
  });
});
