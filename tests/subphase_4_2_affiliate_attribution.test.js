/**
 * tests/subphase_4_2_affiliate_attribution.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Sub-Phase 4.2: Affiliate Partner Portal & Deterministic Conversion Attribution
 * 
 * Verifies:
 * 1. GET /api/dce/affiliates requires DCE Admin authorization
 * 2. GET /api/dce/affiliates returns list of registered affiliates
 * 3. POST /api/dce/affiliates onboards a new affiliate partner with default rate
 * 4. POST /api/dce/affiliates/:id/links creates short referral link
 * 5. POST /api/dce/affiliates/click increments click counter & sets dce_ref cookie
 * 6. GET /r/:shortCode redirects to destination and sets 30-day attribution cookie
 * 7. POST /api/dce/affiliates/portal/login generates affiliate JWT & aggregates stats
 * 8. POST /api/dce/affiliates/portal/links allows partner self-service link creation
 * 9. PUT /api/dce/affiliates/portal/payout-settings updates partner disbursement preference
 * 10. End-to-end attribution: Order ingestion attributes commission & records conversion
 * ─────────────────────────────────────────────────────────────────────────────
 */

const request = require('supertest');
let app;

beforeAll(() => {
  process.env.NODE_ENV = 'test';
  process.env.PORT = '0';
  app = require('../server');
});

describe('Sub-Phase 4.2: Affiliate Partner Portal & Deterministic Conversion Attribution', () => {
  let createdAffiliateId = null;
  let affiliateToken = null;
  const uniqueCode = `affqa${Date.now().toString().slice(-6)}`;
  const partnerEmail = `partner_${Date.now()}@example.com`;

  test('1. GET /api/dce/affiliates requires DCE Admin authorization', async () => {
    const res = await request(app).get('/api/dce/affiliates');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('2. GET /api/dce/affiliates returns list of registered affiliates', async () => {
    const res = await request(app)
      .get('/api/dce/affiliates')
      .set('Authorization', 'Bearer mock_qa_token_enterprise');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body).toHaveProperty('pagination');
  });

  test('3. POST /api/dce/affiliates onboards a new affiliate partner with default rate', async () => {
    const res = await request(app)
      .post('/api/dce/affiliates')
      .set('Authorization', 'Bearer mock_qa_token_enterprise')
      .send({
        name: 'Growth Partner QA',
        email: partnerEmail,
        phone: '+8801811223344',
        default_rate: 0.20
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.email).toBe(partnerEmail.toLowerCase());
    createdAffiliateId = res.body.data.id;
  });

  test('4. POST /api/dce/affiliates/:id/links creates short referral link', async () => {
    const res = await request(app)
      .post(`/api/dce/affiliates/${createdAffiliateId}/links`)
      .set('Authorization', 'Bearer mock_qa_token_enterprise')
      .send({
        shortCode: uniqueCode,
        destinationUrl: 'https://gro10x-ai.vercel.app/dce/store',
        commissionRate: 0.20
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.short_code).toBe(uniqueCode);
  });

  test('5. POST /api/dce/affiliates/click increments click counter & sets dce_ref cookie', async () => {
    const res = await request(app)
      .post('/api/dce/affiliates/click')
      .send({ shortCode: uniqueCode });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.destinationUrl).toBe('https://gro10x-ai.vercel.app/dce/store');
    
    // Verify dce_ref cookie
    const cookies = res.headers['set-cookie'] || [];
    const hasRefCookie = cookies.some(c => c.includes('dce_ref=') && c.includes(uniqueCode));
    expect(hasRefCookie).toBe(true);
  });

  test('6. GET /r/:shortCode redirects to destination and sets 30-day attribution cookie', async () => {
    const res = await request(app)
      .get(`/r/${uniqueCode}`);

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('https://gro10x-ai.vercel.app/dce/store');
    const cookies = res.headers['set-cookie'] || [];
    const hasRefCookie = cookies.some(c => c.includes('dce_ref='));
    expect(hasRefCookie).toBe(true);
  });

  test('7. POST /api/dce/affiliates/portal/login generates affiliate JWT & aggregates stats', async () => {
    const res = await request(app)
      .post('/api/dce/affiliates/portal/login')
      .send({ email: partnerEmail });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data).toHaveProperty('metrics');
    expect(res.body.data.metrics.totalClicks).toBeGreaterThanOrEqual(1);
    affiliateToken = res.body.data.token;
  });

  test('8. POST /api/dce/affiliates/portal/links allows partner self-service link creation', async () => {
    const customCode = `custom${Date.now().toString().slice(-5)}`;
    const res = await request(app)
      .post('/api/dce/affiliates/portal/links')
      .set('Authorization', `Bearer ${affiliateToken}`)
      .send({
        email: partnerEmail,
        shortCode: customCode,
        destinationUrl: 'https://gro10x-ai.vercel.app/dce/store'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.short_code).toBe(customCode);
    expect(res.body.data.shortUrl).toContain(customCode);
  });

  test('9. PUT /api/dce/affiliates/portal/payout-settings updates partner disbursement preference', async () => {
    const res = await request(app)
      .put('/api/dce/affiliates/portal/payout-settings')
      .set('Authorization', `Bearer ${affiliateToken}`)
      .send({
        email: partnerEmail,
        payoutChannel: 'BKASH',
        payoutDetails: { phone: '01811223344', accountType: 'PERSONAL' }
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.payout_channel).toBe('BKASH');
  });

  test('10. End-to-end attribution: Order ingestion attributes commission & records conversion', async () => {
    const { attributeOrderToAffiliate, getConversions } = require('../src/services/dce-affiliates');
    
    const attribution = await attributeOrderToAffiliate({
      orderId: `ORD-AFF-${Date.now()}`,
      orderAmount: 100.00,
      refCode: uniqueCode
    });

    expect(attribution).toBeDefined();
    expect(attribution.affiliate_id).toBe(createdAffiliateId);
    expect(attribution.commission_earned).toBe(20.00); // 20% of 100.00
    expect(attribution.payout_status).toBe('PENDING');

    const conversions = await getConversions();
    const recorded = conversions.find(c => c.id === attribution.id);
    expect(recorded).toBeDefined();
  });
});
