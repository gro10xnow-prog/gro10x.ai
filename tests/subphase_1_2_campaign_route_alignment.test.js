/**
 * tests/subphase_1_2_campaign_route_alignment.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Sub-Phase 1.2: Campaign Generator Route Alignment & Vanity URL Rewrites
 * Validates:
 * 1. GET /services/:code vanity routing (SVC-001)
 * 2. GET /services/:slug vanity routing (ai-mobile-apps)
 * 3. GET /services directory 302 redirect to /#capabilities
 * 4. GET /leads/claim lead magnet claim gateway
 * 5. GET /book-consultation consultation booking gateway
 * 6. Campaign pack generator produces 100% active, non-broken routes
 * 7. Lead capture with campaign UTM attribution & +15 score bonus
 * 8. Zero leaks of legacy phone number (1708 / 8801708459008) in campaign pack
 * ─────────────────────────────────────────────────────────────────────────────
 */

const request = require('supertest');
const app = require('../server');
const { generateServiceCampaignPack } = require('../src/services/campaign-generator');

describe('Sub-Phase 1.2: Campaign Generator Route Alignment & Vanity URL Rewrites', () => {

  test('1. GET /services/:code returns 200 and serves service-detail.html', async () => {
    const res = await request(app).get('/services/SVC-001');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toContain('Service Details');
    expect(res.text).toContain('/js/service-detail.js');
  });

  test('2. GET /services/:slug returns 200 and serves service-detail.html', async () => {
    const res = await request(app).get('/services/ai-mobile-apps');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toContain('Service Details');
  });

  test('3. GET /services redirects (302) to /#capabilities', async () => {
    const res = await request(app).get('/services');
    expect(res.statusCode).toBe(302);
    expect(res.headers['location']).toBe('/#capabilities');
  });

  test('4. GET /leads/claim returns 200 and serves landing page HTML', async () => {
    const res = await request(app).get('/leads/claim?service=SVC-001');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toContain('GRO10X');
    expect(res.text).toContain('/js/landing.js');
  });

  test('5. GET /book-consultation returns 200 and serves landing page HTML', async () => {
    const res = await request(app).get('/book-consultation?service=SVC-001');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toContain('GRO10X');
  });

  test('6. generateServiceCampaignPack produces valid URLs with active server routes', async () => {
    const pack = await generateServiceCampaignPack('SVC-001');
    expect(pack.ok).toBe(true);

    const emailUrl = new URL(pack.utmLinks.emailLink);
    const claimUrl = new URL(pack.utmLinks.leadMagnetClaimUrl);

    // Verify /services/:code route
    const resEmail = await request(app).get(emailUrl.pathname + emailUrl.search);
    expect(resEmail.statusCode).toBe(200);

    // Verify /leads/claim route
    const resClaim = await request(app).get(claimUrl.pathname + claimUrl.search);
    expect(resClaim.statusCode).toBe(200);
  });

  test('7. POST /api/leads captures campaign UTM parameters and calculates priority score', async () => {
    const testEmail = `campaign_prospect_${Date.now()}@testoutreach.com`;
    const res = await request(app)
      .post('/api/leads')
      .send({
        name: 'Nasir Uddin',
        company: 'Prime Logistics Ltd',
        email: testEmail,
        phone: '01711998877',
        service_interest: 'SVC-001',
        source: 'Outbound Campaign (CMP-E2-SVC001-EML-01)',
        utm_source: 'outbound_email',
        utm_medium: 'cold_email',
        utm_campaign: 'CMP-E2-SVC001-EML-01',
        budget: '$3,500'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.lead).toBeDefined();
    expect(res.body.lead.utm_campaign).toBe('CMP-E2-SVC001-EML-01');
    expect(res.body.lead.score).toBeGreaterThanOrEqual(65);
  });

  test('8. Campaign pack and templates contain zero legacy WhatsApp leaks (1708)', async () => {
    const pack = await generateServiceCampaignPack('SVC-001');
    const packJson = JSON.stringify(pack);

    expect(packJson).not.toContain('1708');
    expect(packJson).not.toContain('8801708459008');
    expect(packJson).toContain('+880 1711-019550');
  });

});
