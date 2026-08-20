const request = require('supertest');
const app = require('../server');
const { signToken } = require('../src/services/jwt');

describe('Phase 4 Security Lock-Down Test Suite', () => {
  const adminToken = signToken({
    userId: 'EMP-001',
    name: 'Admin User',
    role: 'Technology Admin',
    accessLevel: 'Owner / Admin',
    department: 'Management',
    linkedType: 'team'
  });

  const managerToken = signToken({
    userId: 'EMP-009',
    name: 'Department Manager',
    role: 'Studio Lead',
    accessLevel: 'Specialist / Crew', // Not Admin
    department: 'Video Production',
    linkedType: 'team'
  });

  // 1. Security Headers Verification
  test('Security Headers: verifies CSP, nosniff, Referrer-Policy, and XSS headers', async () => {
    const res = await request(app).get('/api/version');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(res.headers['x-xss-protection']).toBe('1; mode=block');
    expect(res.headers['content-security-policy']).toBeDefined();
    expect(res.headers['content-security-policy']).toContain("frame-ancestors 'self' https://web.telegram.org");
  });

  // 2. Telegram Webhook Secret Token Enforcement
  test('Telegram Webhook: rejects requests when secret token is required but missing or invalid', async () => {
    const originalSecret = process.env.WEBHOOK_SECRET_TOKEN;
    process.env.WEBHOOK_SECRET_TOKEN = 'secret_webhook_token_xyz_987';

    try {
      // Missing header
      const resMissing = await request(app)
        .post('/api/webhooks/telegram')
        .send({ update_id: 12345 });
      expect(resMissing.statusCode).toBe(403);

      // Wrong header
      const resWrong = await request(app)
        .post('/api/webhooks/telegram')
        .set('x-telegram-bot-api-secret-token', 'wrong_token')
        .send({ update_id: 12345 });
      expect(resWrong.statusCode).toBe(403);

      // Correct header
      const resValid = await request(app)
        .post('/api/webhooks/telegram')
        .set('x-telegram-bot-api-secret-token', 'secret_webhook_token_xyz_987')
        .send({ update_id: 12345 });
      expect(resValid.statusCode).toBe(200);
    } finally {
      process.env.WEBHOOK_SECRET_TOKEN = originalSecret;
    }
  });

  // 3. Telegram Auth Endpoint Hardening
  test('Telegram Auth: rejects unlinked Telegram ID in strict auth mode', async () => {
    const res = await request(app)
      .post('/api/auth/telegram')
      .set('x-disable-dev-auth', 'true')
      .send({ telegramId: '99999999999_UNLINKED_TG_USER' });
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toMatch(/No account linked/i);
  });

  // 4. Bulk Import RBAC: Admin Only
  test('Admin Import Clients: rejects non-admin with 403 Forbidden', async () => {
    const res = await request(app)
      .post('/api/admin/import/clients')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ rows: [{ name: 'Test Client' }] });
    expect(res.statusCode).toBe(403);
  });

  test('Admin Import Invoices: rejects non-admin with 403 Forbidden', async () => {
    const res = await request(app)
      .post('/api/admin/import/invoices')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ rows: [{ id: 'INV-TEST', client: 'Test', amount: 500 }] });
    expect(res.statusCode).toBe(403);
  });

  test('Admin Import Invoices: accepts Admin token and validates payload schema', async () => {
    const res = await request(app)
      .post('/api/admin/import/invoices')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ rows: [] }); // empty array -> 400 validation error
    expect(res.statusCode).toBe(400);
  });
});
