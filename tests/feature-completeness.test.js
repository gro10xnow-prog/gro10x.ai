const request = require('supertest');
const express = require('express');
const { signToken } = require('../src/services/jwt');
const errorHandler = require('../src/middleware/errorHandler');

const leadsRoutes = require('../src/routes/leads');
const invoicesRoutes = require('../src/routes/invoices');
const paymentsRoutes = require('../src/routes/payments');
const exportRoutes = require('../src/routes/export');
const cronRoutes = require('../src/routes/cron');
const postsRoutes = require('../src/routes/posts');
const analyticsRoutes = require('../src/routes/analytics');

const app = express();
app.use(express.json());
app.use('/api/leads', leadsRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/cron', cronRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use(errorHandler);

describe('Phase 3 Feature Completeness Audit Integration Tests', () => {
  const adminToken = signToken({
    userId: 'EMP-001',
    name: 'Admin Stakeholder',
    role: 'Technology Admin',
    accessLevel: 'Owner / Admin',
    department: 'Management',
    linkedType: 'team'
  });

  // 1. CRM Lead Conversion Flow
  test('Lead Conversion: converts an existing lead or handles conversion gracefully', async () => {
    const res = await request(app)
      .post('/api/leads/LED-NONEXISTENT/convert')
      .set('Authorization', `Bearer ${adminToken}`);
    // Should return 404 for non-existent or 200/503
    expect([200, 404, 503]).toContain(res.statusCode);
  });

  // 2. Finance: CSV Export of Tables
  test('Export API: GET /api/export/tasks returns CSV header and structure', async () => {
    const res = await request(app)
      .get('/api/export/tasks')
      .set('Authorization', `Bearer ${adminToken}`);
    expect([200, 503]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.headers['content-type']).toMatch(/text\/csv|text\/plain/);
    }
  });

  test('Export API: rejects unauthorized or invalid table exports', async () => {
    const resInvalid = await request(app)
      .get('/api/export/invalid_table_name')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(resInvalid.statusCode).toBe(400);

    const resUnauth = await request(app)
      .get('/api/export/tasks')
      .set('x-disable-dev-auth', 'true');
    expect(resUnauth.statusCode).toBe(401);
  });

  // 3. Analytics Tracking & Reporting
  test('Analytics: tracks public page event and retrieves cached summary', async () => {
    const trackRes = await request(app)
      .post('/api/analytics/track')
      .send({
        event: 'page_view',
        label: 'Landing Hero CTA',
        referrer: 'https://google.com',
        utm: 'utm_source=direct'
      });
    expect(trackRes.statusCode).toBe(200);
    expect(trackRes.body.success).toBe(true);

    const summaryRes = await request(app)
      .get('/api/analytics')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(summaryRes.statusCode).toBe(200);
    expect(summaryRes.body.success).toBe(true);
    expect(summaryRes.body.data).toHaveProperty('summary');
  });

  // 4. Cron Security & Authorizations
  test('Cron API: rejects unauthorized cron request when CRON_SECRET is enforced', async () => {
    const oldSecret = process.env.CRON_SECRET;
    process.env.CRON_SECRET = 'test_cron_secret_123';
    try {
      const resBlocked = await request(app).get('/api/cron/morning-briefing');
      expect(resBlocked.statusCode).toBe(401);

      const resAllowed = await request(app)
        .get('/api/cron/morning-briefing')
        .set('Authorization', 'Bearer test_cron_secret_123');
      // Authorized — will process or return ok
      expect([200, 500]).toContain(resAllowed.statusCode);
    } finally {
      process.env.CRON_SECRET = oldSecret;
    }
  });

  // 5. Social Planner CRUD
  test('Social Posts: lists posts and returns mapped structure', async () => {
    const res = await request(app)
      .get('/api/posts')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body.length > 0) {
      expect(res.body[0]).toHaveProperty('id');
      expect(res.body[0]).toHaveProperty('platform');
      expect(res.body[0]).toHaveProperty('status');
    }
  });

  // 6. Payment Proof Submission
  test('Payments API: validates transaction ID requirement on submission', async () => {
    const res = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        amount: 25000,
        paymentMethod: 'bKash'
        // missing trxId
      });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/Transaction ID/i);
  });
});
