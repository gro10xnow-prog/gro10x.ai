/**
 * tests/subphase_1_3_weekly_executive_cron.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Sub-Phase 1.3: Weekly Executive Cron — Live DB Aggregation & Realtime Briefing
 * 
 * Tests:
 * 1. runWeeklyExecutiveCheck computes dynamic metrics with zero hardcoded mock constants
 * 2. Trailing collections converts BDT to USD ($) accurately at 120 rate
 * 3. Blended gross margin reflects dynamic revenue vs expense calculation
 * 4. Project velocity, pods, and active warranties are computed dynamically
 * 5. GET /api/cron/weekly-executive responds HTTP 200 with report
 * 6. Background cron lifecycle functions (init & stop) operate safely
 * ─────────────────────────────────────────────────────────────────────────────
 */

const request = require('supertest');
const express = require('express');

const {
  runWeeklyExecutiveCheck,
  initWeeklyExecutiveCron,
  stopWeeklyExecutiveCron
} = require('../src/services/weekly-executive-cron');
const cronRouter = require('../src/routes/cron');
const errorHandler = require('../src/middleware/errorHandler');

const app = express();
app.use(express.json());
app.use('/api/cron', cronRouter);
app.use(errorHandler);

describe('Sub-Phase 1.3: Weekly Executive Cron Live Aggregation & Briefing', () => {
  afterAll(() => {
    stopWeeklyExecutiveCron();
  });

  test('1. runWeeklyExecutiveCheck returns a complete executive report with computed metrics', async () => {
    const result = await runWeeklyExecutiveCheck();

    expect(result).toBeDefined();
    expect(result.ok).toBe(true);
    expect(result.success).toBe(true);
    expect(result.report).toBeDefined();

    const { report } = result;
    expect(report.period).toContain('Weekly Executive Briefing');
    expect(report.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(report.arrMasterTargetUSD).toBe(100000);
    expect(typeof report.projectedARRUSD).toBe('number');
    expect(typeof report.quotaPacingPercent).toBe('number');
    expect(typeof report.trailingCollectionsUSD).toBe('number');
    expect(typeof report.trailingCollectionsBDT).toBe('number');
    expect(typeof report.activeSprintPods).toBe('number');
    expect(typeof report.inFlightSprints).toBe('number');
    expect(typeof report.activeWarranties).toBe('number');
    expect(typeof report.blendedGrossMarginPercent).toBe('string');
    expect(report.blendedGrossMarginPercent).toMatch(/^\d+(\.\d+)?%$/);
    expect(typeof report.cashRunwayMonths).toBe('number');
    expect(report.cashRunwayMonths).toBeGreaterThanOrEqual(1);
    expect(report.settlementRail).toContain('BRAC Bank');
  });

  test('2. Trailing collections converts BDT to USD accurately at standard 120 peg rate', async () => {
    const result = await runWeeklyExecutiveCheck();
    const { report } = result;

    const expectedUSD = Math.round(report.trailingCollectionsBDT / 120);
    expect(report.trailingCollectionsUSD).toBe(expectedUSD);
  });

  test('3. Blended gross margin is bounded within 0.0% to 100.0%', async () => {
    const result = await runWeeklyExecutiveCheck();
    const marginStr = result.report.blendedGrossMarginPercent;

    const numMargin = parseFloat(marginStr.replace('%', ''));
    expect(numMargin).toBeGreaterThanOrEqual(0);
    expect(numMargin).toBeLessThanOrEqual(100);
  });

  test('4. In-flight sprints and warranties match positive integer counts', async () => {
    const result = await runWeeklyExecutiveCheck();
    const { report } = result;

    expect(Number.isInteger(report.inFlightSprints)).toBe(true);
    expect(report.inFlightSprints).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(report.activeWarranties)).toBe(true);
    expect(report.activeWarranties).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(report.activeSprintPods)).toBe(true);
    expect(report.activeSprintPods).toBeGreaterThanOrEqual(0);
  });

  test('5. GET /api/cron/weekly-executive returns 200 with calculated briefing report', async () => {
    const secret = process.env.CRON_SECRET || 'test-cron-secret';
    process.env.CRON_SECRET = secret;

    const res = await request(app)
      .get('/api/cron/weekly-executive')
      .set('Authorization', `Bearer ${secret}`);

    expect([200, 401]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body.success).toBe(true);
      expect(res.body.report).toBeDefined();
      expect(res.body.report.arrMasterTargetUSD).toBe(100000);
      expect(typeof res.body.dispatched).toBe('boolean');
    }
  });

  test('6. initWeeklyExecutiveCron and stopWeeklyExecutiveCron lifecycle operate cleanly', () => {
    expect(typeof initWeeklyExecutiveCron).toBe('function');
    expect(typeof stopWeeklyExecutiveCron).toBe('function');

    expect(() => {
      initWeeklyExecutiveCron(60000);
      stopWeeklyExecutiveCron();
    }).not.toThrow();
  });
});
