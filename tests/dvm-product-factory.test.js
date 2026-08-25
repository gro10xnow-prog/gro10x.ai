/**
 * tests/dvm-product-factory.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Unit and integration tests for DVM Product Factory, Studio Journey,
 * Admin Review Queue, and DBM Incentive Ledger
 * ─────────────────────────────────────────────────────────────────────────────
 */

const request = require('supertest');
const express = require('express');
const apiRoutes = require('../src/routes/api');
const errorHandler = require('../src/middleware/errorHandler');

const app = express();
app.use(express.json());
app.use('/api', apiRoutes);
app.use(errorHandler);

describe('DVM Product Factory & Review Queue Flow', () => {
  const brandId = 1;
  const prodCode = 'PLA-01';

  test('POST /api/brands/:id/product/:code/submit-review fails when deliverable is missing', async () => {
    const res = await request(app)
      .post(`/api/brands/${brandId}/product/${prodCode}/submit-review`)
      .send({
        title: 'Minimalist Daily Planner Printable PDF Template',
        mockups: ['m1.png', 'm2.png', 'm3.png', 'm4.png'],
        video: 'vid.mp4',
        vault: null
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Deliverable file');
  });

  test('POST /api/brands/:id/product/:code/submit-review fails when mockups count < 4', async () => {
    const res = await request(app)
      .post(`/api/brands/${brandId}/product/${prodCode}/submit-review`)
      .send({
        title: 'Minimalist Daily Planner Printable PDF Template',
        mockups: ['m1.png', 'm2.png'],
        video: 'vid.mp4',
        vault: { fileName: 'planner.pdf', storagePath: 'vault/planner.pdf' }
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('mockup');
  });

  test('POST /api/brands/:id/product/:code/submit-review fails when video is missing', async () => {
    const res = await request(app)
      .post(`/api/brands/${brandId}/product/${prodCode}/submit-review`)
      .send({
        title: 'Minimalist Daily Planner Printable PDF Template',
        mockups: ['m1.png', 'm2.png', 'm3.png', 'm4.png'],
        video: null,
        vault: { fileName: 'planner.pdf', storagePath: 'vault/planner.pdf' }
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('video');
  });

  test('POST /api/brands/:id/product/:code/submit-review succeeds with full deliverable, mockups, and video', async () => {
    const res = await request(app)
      .post(`/api/brands/${brandId}/product/${prodCode}/submit-review`)
      .send({
        title: '2026 Minimalist Master Planner Printable Template PDF',
        mockups: ['m1.png', 'm2.png', 'm3.png', 'm4.png', 'm5.png'],
        video: 'vid1.mp4',
        vault: { fileName: 'master_planner.pdf', storagePath: 'vault/master_planner.pdf' },
        aiAudit: { overall_score: 8.5, score: 8.5 }
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('Pending Review');
  });

  test('GET /api/brands/review-queue retrieves all submitted products across all brands', async () => {
    const res = await request(app)
      .get('/api/brands/review-queue');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.queue)).toBe(true);
    expect(typeof res.body.data.count).toBe('number');
  });

  test('POST /api/brands/:id/product/:code/review-action handles revision request', async () => {
    const res = await request(app)
      .post(`/api/brands/${brandId}/product/${prodCode}/review-action`)
      .send({
        action: 'request_revision',
        revisionNote: 'Please enhance the cover slide lighting.'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('Revision Requested');
  });

  test('POST /api/brands/:id/product/:code/review-action handles admin approval', async () => {
    const res = await request(app)
      .post(`/api/brands/${brandId}/product/${prodCode}/review-action`)
      .send({
        action: 'approve'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('Live');
  });
});

describe('DBM Incentive Ledger & Mid-Month Sprint Evaluation', () => {
  test('GET /api/brands/dbm-incentive-ledger calculates 15% distribution model', async () => {
    const res = await request(app)
      .get('/api/brands/dbm-incentive-ledger');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.ledger)).toBe(true);

    const firstDbm = res.body.data.ledger[0];
    expect(firstDbm).toBeDefined();
    expect(firstDbm.dbmId).toBeDefined();
    expect(typeof firstDbm.vaultBonusTotal).toBe('number');
    expect(typeof firstDbm.salesCommission).toBe('number');
    expect(typeof firstDbm.tierBonus).toBe('number');
    expect(typeof firstDbm.totalEarnings).toBe('number');
  });

  test('POST /api/brands/set-mid-month-incentive saves customized 20th sprint bonus', async () => {
    const res = await request(app)
      .post('/api/brands/set-mid-month-incentive')
      .send({
        dbmId: 1,
        targetPct: 70,
        bonusUsd: 75,
        note: 'Special 20th sprint bonus for PLA brand acceleration',
        approved: true
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.incentive.targetPct).toBe(70);
    expect(res.body.data.incentive.bonusUsd).toBe(75);
    expect(res.body.data.incentive.approved).toBe(true);
  });

  test('POST /api/brands/trigger-20th-telegram-evaluation generates mid-month brief', async () => {
    const res = await request(app)
      .post('/api/brands/trigger-20th-telegram-evaluation');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.summaryText).toContain('20th Mid-Month DBM Performance Brief');
  });
});
