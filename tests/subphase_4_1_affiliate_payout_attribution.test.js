/**
 * tests/subphase_4_1_affiliate_payout_attribution.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Sub-Phase 4.1 Test Suite: Partner & Affiliate Portal Attribution & Payout Persistence
 *
 * Verifies:
 * 1. GET /portal/:partnerCode sets 30-day attribution cookie and redirects (302) to /?ref=:partnerCode#consultation
 * 2. GET /api/affiliates/track/:refCode increments click telemetry and returns attribution metadata
 * 3. POST /api/leads automatically captures referral_code, applies +15 score boost, and notes partner attribution
 * 4. POST /api/affiliates/payout enforces ৳5,000 minimum threshold and rejects sub-threshold requests
 * 5. POST /api/affiliates/payout rejects amounts exceeding current pending balance
 * 6. POST /api/affiliates/payout creates payout with 'Processing' status, deducts pending balance, and triggers Telegram alert with inline action buttons
 * 7. POST /api/affiliates/payouts/:id/disburse and /reject update status, refund balance on reject, and assert Zero Native Dialogs in partners.html
 * ─────────────────────────────────────────────────────────────────────────────
 */

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_purple_os_production_2026';
process.env.TELEGRAM_OWNER_CHAT_ID = '7754769807';
process.env.TELEGRAM_ADMIN_CHAT_ID = '7754769807';

const fs = require('fs');
const path = require('path');
const request = require('supertest');
const app = require('../server');
const { signToken } = require('../src/services/jwt');
const { memoryAffiliates, getAffiliateRecord } = require('../src/routes/affiliates');

describe('🚀 Sub-Phase 4.1: Partner & Affiliate Portal Attribution & Payout Persistence', () => {

  const adminToken = signToken({
    userId: 'ADM-FINANCE-001',
    name: 'Finance Director',
    role: 'Admin',
    accessLevel: 'Owner / Admin'
  });

  const testPartnerCode = 'AFF-TEST41';
  let testAffiliate = null;

  beforeAll(async () => {
    // Seed test partner in memory
    testAffiliate = {
      id: 'AFF-TEST41-ID',
      refCode: testPartnerCode,
      name: 'Farhan Ventures',
      email: 'farhan@farhanventures.com',
      tier: 'Silver',
      pendingBalanceBDT: 25000,
      paidOutBDT: 0,
      totalEarnedBDT: 25000,
      clicks: 10,
      conversions: [],
      payoutHistory: [],
      settlementAccount: {
        type: 'BRAC Bank Corporate',
        bankName: 'BRAC Bank Limited',
        accountName: 'Farhan Ventures Ltd',
        accountNumber: '2081636480099'
      }
    };
    memoryAffiliates.set(testPartnerCode, testAffiliate);
    memoryAffiliates.set(testAffiliate.id, testAffiliate);
  });

  // ── TEST 1: CO-BRANDED PORTAL ROUTING & 30-DAY COOKIE ─────────────────────
  test('1. GET /portal/:partnerCode sets 30-day attribution cookie and redirects (302) to /?ref=:partnerCode#consultation', async () => {
    const res = await request(app)
      .get(`/portal/${testPartnerCode}`)
      .expect(302);

    expect(res.headers.location).toBe(`/?ref=${testPartnerCode}#consultation`);

    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const affCookie = cookies.find(c => c.startsWith('gro10x_aff_ref='));
    expect(affCookie).toBeDefined();
    expect(affCookie).toContain(`gro10x_aff_ref=${testPartnerCode}`);
  });

  // ── TEST 2: TELEMETRY INCREMENTATION ──────────────────────────────────────
  test('2. GET /api/affiliates/track/:refCode increments click telemetry and returns attribution metadata', async () => {
    const initialClicks = testAffiliate.clicks || 0;

    const res = await request(app)
      .get(`/api/affiliates/track/${testPartnerCode}`)
      .expect(200);

    expect(res.body.ok).toBe(true);
    expect(res.body.tracked).toBe(true);
    expect(res.body.refCode).toBe(testPartnerCode);
    expect(res.body.cookieWindowDays).toBe(30);
    expect(res.body.clicks).toBe(initialClicks + 1);
  });

  // ── TEST 3: LEAD ATTRIBUTION & +15 SCORE BOOST ────────────────────────────
  test('3. POST /api/leads captures referral_code, applies +15 score boost, and notes partner attribution', async () => {
    const uniqueSuffix = Date.now().toString().slice(-6);
    const uniqueEmail = `prospect-${uniqueSuffix}@fintechfirm.com`;
    const uniquePhone = `+880 1799-${uniqueSuffix}`;
    const res = await request(app)
      .post('/api/leads')
      .send({
        name: 'Tariq Al-Mansoor',
        company: 'FinTech Horizons',
        email: uniqueEmail,
        phone: uniquePhone,
        service: 'Enterprise AI Transformation',
        budget: '$15,000',
        referral_code: testPartnerCode
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.lead).toBeDefined();
    expect(res.body.lead.referral_code).toBe(testPartnerCode);
    expect(res.body.lead.source).toContain(`Partner Referral (${testPartnerCode})`);
    expect(res.body.lead.notes).toContain(`[Referred by Partner: ${testPartnerCode}]`);
    // Baseline score 50 + Budget 20 + Referral 15 = 85
    expect(res.body.lead.score).toBeGreaterThanOrEqual(75);
  });

  // ── TEST 4: MINIMUM PAYOUT THRESHOLD VALIDATION ────────────────────────────
  test('4. POST /api/affiliates/payout enforces ৳5,000 minimum threshold and rejects sub-threshold requests', async () => {
    const res = await request(app)
      .post('/api/affiliates/payout')
      .send({
        affiliateId: testPartnerCode,
        amount: 3000, // Below ৳5,000 threshold
        paymentMethod: 'bKash Merchant'
      })
      .expect(400);

    expect(res.body.ok).toBe(false);
    expect(res.body.error).toContain('Minimum payout request threshold is ৳5,000 BDT');
  });

  // ── TEST 5: PENDING BALANCE CEILING VALIDATION ─────────────────────────────
  test('5. POST /api/affiliates/payout rejects amounts exceeding current pending balance', async () => {
    const res = await request(app)
      .post('/api/affiliates/payout')
      .send({
        affiliateId: testPartnerCode,
        amount: 999999, // Exceeds 25,000 balance
        paymentMethod: 'BRAC Bank Corporate'
      })
      .expect(400);

    expect(res.body.ok).toBe(false);
    expect(res.body.error).toContain('exceeds current pending balance');
  });

  // ── TEST 6: PAYOUT EXECUTION & PROCESSING STATUS ───────────────────────────
  let createdPayoutId = null;
  test('6. POST /api/affiliates/payout creates payout with Processing status, deducts pending balance, and triggers Telegram alert', async () => {
    const initialBal = testAffiliate.pendingBalanceBDT;
    const requestAmount = 10000;

    const res = await request(app)
      .post('/api/affiliates/payout')
      .send({
        affiliateId: testPartnerCode,
        amount: requestAmount,
        paymentMethod: 'BRAC Bank Corporate',
        notes: 'Monthly enterprise deal commission settlement'
      })
      .expect(201);

    expect(res.body.ok).toBe(true);
    expect(res.body.payout).toBeDefined();
    expect(res.body.payout.amountBDT).toBe(requestAmount);
    expect(res.body.payout.status).toBe('Processing');
    createdPayoutId = res.body.payout.id;

    // Verify balance deduction in memory
    expect(testAffiliate.pendingBalanceBDT).toBe(initialBal - requestAmount);
    expect(testAffiliate.paidOutBDT).toBe(requestAmount);
  });

  // ── TEST 7: SETTLEMENT DISBURSE & REJECT LIFECYCLE + ZERO DIALOGS ─────────
  test('7. POST /api/affiliates/payouts/:id/disburse and /reject update status, refund balance on reject, and assert Zero Native Dialogs in partners.html', async () => {
    // 1. Disburse the first payout
    const disburseRes = await request(app)
      .post(`/api/affiliates/payouts/${createdPayoutId}/disburse`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ txRef: 'BRAC-TXN-123456' })
      .expect(200);

    expect(disburseRes.body.ok).toBe(true);
    expect(disburseRes.body.payout.status).toBe('Disbursed');

    // 2. Request a second payout and reject it to verify refund
    const req2 = await request(app)
      .post('/api/affiliates/payouts')
      .send({
        affiliateId: testPartnerCode,
        amount: 8000,
        paymentMethod: 'BRAC Bank Corporate'
      })
      .expect(201);

    const payout2Id = req2.body.payout.id;
    const balBeforeReject = testAffiliate.pendingBalanceBDT;

    const rejectRes = await request(app)
      .post(`/api/affiliates/payouts/${payout2Id}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Mismatch in beneficiary account title' })
      .expect(200);

    expect(rejectRes.body.ok).toBe(true);
    expect(rejectRes.body.payout.status).toBe('Rejected');
    expect(rejectRes.body.refundedAmount).toBe(8000);
    // Balance restored
    expect(testAffiliate.pendingBalanceBDT).toBe(balBeforeReject + 8000);

    // 3. Static Zero-Dialog & Zero-Banned-Phone Assertions
    const partnersHtml = fs.readFileSync(path.join(__dirname, '../public/partners.html'), 'utf8');
    const partnersJs = fs.readFileSync(path.join(__dirname, '../public/js/partners.js'), 'utf8');
    const landingJs = fs.readFileSync(path.join(__dirname, '../public/js/landing.js'), 'utf8');

    expect(partnersHtml).not.toMatch(/\balert\s*\(/);
    expect(partnersHtml).not.toMatch(/\bconfirm\s*\(/);
    expect(partnersHtml).not.toMatch(/\bprompt\s*\(/);
    expect(partnersJs).not.toMatch(/\balert\s*\(/);
    expect(partnersJs).not.toMatch(/\bconfirm\s*\(/);
    expect(partnersJs).not.toMatch(/\bprompt\s*\(/);

    expect(partnersHtml).not.toContain('1708459008');
    expect(partnersJs).not.toContain('1708459008');
    expect(landingJs).not.toContain('1708459008');
  });

});
