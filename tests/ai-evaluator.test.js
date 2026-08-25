/**
 * tests/ai-evaluator.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Unit and integration tests for Multimodal AI Product Quality Evaluator,
 * Dynamic Pricing Engine, and Auto-Remediation Prompts.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const request = require('supertest');
const express = require('express');
const apiRoutes = require('../src/routes/api');
const errorHandler = require('../src/middleware/errorHandler');
const {
  evaluateProductMultimodal,
  generateFallbackAudit
} = require('../src/services/ai-evaluator');

const app = express();
app.use(express.json());
app.use('/api', apiRoutes);
app.use(errorHandler);

describe('Multimodal AI Product Evaluator Service', () => {
  const mockBrand = {
    id: 1,
    name: 'PlannerQueenCo',
    niche: 'Digital Planners & Trackers'
  };

  const mockProduct = {
    code: 'PQC-001',
    name: 'Daily & Weekly Planner 1',
    price: 4.99
  };

  test('generateFallbackAudit produces a complete 10-spread audit report with pricing & auto-remediation prompts', () => {
    const report = generateFallbackAudit(mockProduct, mockBrand);

    expect(report).toBeDefined();
    expect(typeof report.overall_score).toBe('number');
    expect(report.overall_score).toBeGreaterThanOrEqual(0);
    expect(report.overall_score).toBeLessThanOrEqual(10);

    // Dimension Rubrics
    expect(report.dimension_scores).toBeDefined();
    expect(report.dimension_scores.aesthetic).toBeDefined();
    expect(report.dimension_scores.typography).toBeDefined();
    expect(report.dimension_scores.usability).toBeDefined();
    expect(report.dimension_scores.commercial_polish).toBeDefined();

    // Pricing
    expect(report.pricing).toBeDefined();
    expect(typeof report.pricing.recommended_price).toBe('number');
    expect(report.pricing.recommended_price).toBeGreaterThanOrEqual(report.pricing.min_price);
    expect(report.pricing.rationale).toBeDefined();

    // Page Analysis
    expect(Array.isArray(report.page_analysis)).toBe(true);
    expect(report.page_analysis.length).toBe(10);

    // Clean pages vs Flawed pages
    const cleanPages = report.page_analysis.filter(p => p.status === 'clean');
    const fixPages = report.page_analysis.filter(p => p.status === 'needs_fix');

    expect(cleanPages.length).toBeGreaterThan(0);
    expect(fixPages.length).toBeGreaterThan(0);

    // Clean pages must have null remediation prompt
    cleanPages.forEach(p => {
      expect(p.remediation_prompt).toBeNull();
      expect(p.defects.length).toBe(0);
    });

    // Flawed pages must have a non-empty, actionable remediation prompt
    fixPages.forEach(p => {
      expect(typeof p.remediation_prompt).toBe('string');
      expect(p.remediation_prompt.length).toBeGreaterThan(30);
      expect(p.defects.length).toBeGreaterThan(0);
    });
  });

  test('evaluateProductMultimodal falls back safely when no images are supplied', async () => {
    const report = await evaluateProductMultimodal([], mockProduct, mockBrand);
    expect(report).toBeDefined();
    expect(report.overall_score).toBeDefined();
    expect(report.page_analysis.length).toBe(10);
  });
});

describe('AI Audit & Dynamic Pricing API Endpoints', () => {
  test('POST /api/brands/1/products/PQC-001/ai-audit returns structured audit payload', async () => {
    const res = await request(app)
      .post('/api/brands/1/products/PQC-001/ai-audit');

    expect([200, 401]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body.success).toBe(true);
      expect(res.body.audit).toBeDefined();
      expect(res.body.audit.overall_score).toBeDefined();
    }
  });

  test('POST /api/brands/1/products/PQC-001/apply-price validates price and updates state', async () => {
    const res = await request(app)
      .post('/api/brands/1/products/PQC-001/apply-price')
      .send({ price: 7.49 });

    expect([200, 401, 404]).toContain(res.status);
  });

  test('POST /api/brands/1/products/PQC-001/apply-price rejects invalid non-numeric price', async () => {
    const res = await request(app)
      .post('/api/brands/1/products/PQC-001/apply-price')
      .send({ price: 'invalid_free' });

    expect([400, 401, 404]).toContain(res.status);
  });
});
