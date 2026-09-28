/**
 * tests/subphase_2_3_magic_link_auth_sync.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Sub-Phase 2.3: Magic Link Onboarding Target Normalization & Token Auth Sync
 * Validates:
 * 1. POST /api/leads/:id/onboard returns success: true with signed 30-day Client Partner JWT
 * 2. magicLink strictly targets /client?token=...#home and NEVER /partners
 * 3. Client Partner token decoded claims verify role: 'Client Partner', linkedType: 'client'
 * 4. In-memory / local DB fallback properly resolves lead without requiring live Supabase
 * 5. Rejects unauthenticated requests with 401
 * 6. Static Route Audit: src/routes/leads.js contains 0 instances of /partners?client=
 * 7. Static Portal Sync: public/client/index.html auto-hydrates purple_user & gro10x_user from token
 * 8. Static Zero-Leakage Audit: src/services/resend.js contains 0 instances of banned phone (1708)
 * ─────────────────────────────────────────────────────────────────────────────
 */

const request = require('supertest');
const fs = require('fs');
const path = require('path');
const { signToken, verifyToken } = require('../src/services/jwt');

let app;
beforeAll(() => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_purple_os_2026';
  process.env.NODE_ENV = 'test';
  app = require('../server');
});

describe('⚡ Sub-Phase 2.3: Magic Link Onboarding Target Normalization & Token Auth Sync', () => {
  let adminToken;
  let testLeadId;

  beforeAll(async () => {
    adminToken = signToken({
      id: 'GRO-001',
      emp_code: 'GRO-001',
      name: 'Firoz Uddin Ahmed',
      role: 'owner',
      accessLevel: 'Owner / Admin'
    });

    // Create a temporary test lead to onboard
    const createRes = await request(app)
      .post('/api/leads')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        company: 'Prime Horizon Real Estate Ltd',
        contactPerson: 'Kazi Farhan',
        email: 'farhan@primehorizon.com.bd',
        phone: '+880 1711-223344',
        service: 'Dedicated Enterprise AI Operating System',
        budget: '350000',
        stage: 'Proposal Sent'
      });

    testLeadId = createRes.body?.lead?.id || 'LED-TEST-ONBOARD';
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 1. Onboarding Endpoint Execution & Magic Link Target Normalization
  // ───────────────────────────────────────────────────────────────────────────

  test('1. POST /api/leads/:id/onboard succeeds with 200 and issues client token', async () => {
    const res = await request(app)
      .post(`/api/leads/${testLeadId}/onboard`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.clientName).toContain('Prime Horizon');
    expect(res.body.email).toBe('farhan@primehorizon.com.bd');
    expect(res.body.clientToken || res.body.token).toBeDefined();
    expect(res.body.magicLink).toBeDefined();
  });

  test('2. magicLink strictly targets /client?token=...#home and NEVER /partners', async () => {
    const res = await request(app)
      .post(`/api/leads/${testLeadId}/onboard`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const { magicLink, onboardingUrl } = res.body;
    const url = magicLink || onboardingUrl;

    expect(url).toContain('/client?token=');
    expect(url).toContain('#home');
    // Architectural Critical Guard: Subcontractor partner portal must never be linked to clients
    expect(url).not.toContain('/partners');
    expect(url).not.toContain('client=');
  });

  test('3. Client Partner token decoded claims verify role: "Client Partner" and linkedType: "client"', async () => {
    const res = await request(app)
      .post(`/api/leads/${testLeadId}/onboard`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const token = res.body.clientToken || res.body.token;
    expect(typeof token).toBe('string');

    const decoded = verifyToken(token);
    expect(decoded).toBeTruthy();
    expect(decoded.role).toBe('Client Partner');
    expect(decoded.accessLevel).toBe('Client Partner');
    expect(decoded.linkedType).toBe('client');
    expect(decoded.email).toBe('farhan@primehorizon.com.bd');
  });

  test('4. In-memory / local fallback: /api/leads/:id/onboard handles synthetic ID properly', async () => {
    const res = await request(app)
      .post('/api/leads/CLI-SYNTHETIC-FALLBACK/onboard')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.clientToken).toBeDefined();
    expect(res.body.magicLink).toContain('/client?token=');
    expect(res.body.magicLink).not.toContain('/partners');
  });

  test('5. Rejects unauthenticated onboard requests with 401', async () => {
    await request(app)
      .post(`/api/leads/${testLeadId}/onboard`)
      .set('x-disable-dev-auth', 'true')
      .expect(401);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2. Static Route Audit
  // ───────────────────────────────────────────────────────────────────────────

  test('6. Static Route Audit: src/routes/leads.js contains 0 instances of /partners?client=', () => {
    const leadsPath = path.join(__dirname, '../src/routes/leads.js');
    const content = fs.readFileSync(leadsPath, 'utf8');

    expect(content.includes('/partners?client=')).toBe(false);
    expect(content.includes('/client?token=')).toBe(true);
    expect(content.includes('clientSessionToken')).toBe(true);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3. Static Client Portal Session Sync
  // ───────────────────────────────────────────────────────────────────────────

  test('7. Static Portal Sync: public/client/index.html auto-hydrates purple_user & gro10x_user from JWT', () => {
    const indexPath = path.join(__dirname, '../public/client/index.html');
    const content = fs.readFileSync(indexPath, 'utf8');

    expect(content.includes('localStorage.setItem(\'gro10x_token\', qToken)')).toBe(true);
    expect(content.includes('localStorage.setItem(\'sb-access-token\', qToken)')).toBe(true);
    expect(content.includes('localStorage.setItem(\'purple_user\'')).toBe(true);
    expect(content.includes('localStorage.setItem(\'gro10x_user\'')).toBe(true);
    expect(content.includes('payload.role || \'Client Partner\'')).toBe(true);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4. Static Zero-Leakage & Email Template Audit
  // ───────────────────────────────────────────────────────────────────────────

  test('8. Static Zero-Leakage: src/services/resend.js contains 0 instances of banned phone (1708)', () => {
    const resendPath = path.join(__dirname, '../src/services/resend.js');
    const content = fs.readFileSync(resendPath, 'utf8');

    expect(content.includes('1708')).toBe(false);
    expect(content.includes('sendClientOnboardingEmail')).toBe(true);
    expect(content.includes('AGENCY_WHATSAPP')).toBe(true);
  });
});
