/**
 * tests/outbound_campaign_workflow.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Comprehensive Test Suite for Engine 2 Outbound Marketing & Lead Conversion Engine
 * Validates:
 * 1. B2B Outbound Campaign Generation (3-touch emails, LinkedIn, Twitter thread, UTMs)
 * 2. Deterministic campaign attribution codes (CMP-E2-SVC001-EML-01, CMP-E2-SVC001-LNK-01)
 * 3. Dynamic lead magnet asset delivery email dispatch
 * 4. Lead capture with campaign UTM attribution & score boost
 * 5. 1-Click Proposal Conversion from CRM Lead record (POST /api/leads/:id/create-proposal)
 * 6. Catalog campaign-pack API endpoint (GET /api/catalog/services/:productCode/campaign-pack)
 * ─────────────────────────────────────────────────────────────────────────────
 */

const request = require('supertest');
const app = require('../server');
const { generateServiceCampaignPack } = require('../src/services/campaign-generator');
const { sendServiceAssetDeliveryEmail } = require('../src/services/resend');

describe('Engine 2 Outbound Marketing & Closed-Loop Lead Conversion Tests', () => {

  // ───────────────────────────────────────────────────────────────────────────
  // 1. Outbound Campaign Generation Unit Tests
  // ───────────────────────────────────────────────────────────────────────────
  describe('1. Campaign Pack Generation', () => {

    test('generateServiceCampaignPack should produce complete marketing assets for SVC-001', async () => {
      const pack = await generateServiceCampaignPack('SVC-001');

      expect(pack.ok).toBe(true);
      expect(pack.productCode).toBe('SVC-001');
      expect(pack.pricing.usd).toBeGreaterThan(0);

      // Deterministic Campaign Codes
      expect(pack.campaignCodes).toBeDefined();
      expect(pack.campaignCodes.email).toBe('CMP-E2-SVC001-EML-01');
      expect(pack.campaignCodes.linkedin).toBe('CMP-E2-SVC001-LNK-01');
      expect(pack.campaignCodes.twitter).toBe('CMP-E2-SVC001-TWX-01');

      // UTM Tagged Links
      expect(pack.utmLinks.emailLink).toContain('utm_campaign=CMP-E2-SVC001-EML-01');
      expect(pack.utmLinks.linkedinLink).toContain('utm_source=linkedin');

      // 3-Touch Cold Email Sequence
      expect(Array.isArray(pack.coldEmailSequence)).toBe(true);
      expect(pack.coldEmailSequence.length).toBe(3);
      expect(pack.coldEmailSequence[0].dayOffset).toBe(1);
      expect(pack.coldEmailSequence[1].dayOffset).toBe(4);
      expect(pack.coldEmailSequence[2].dayOffset).toBe(8);
      expect(pack.coldEmailSequence[0].bodyText).toContain('Tanvir Rahman');

      // LinkedIn Authority Drop
      expect(pack.linkedInPost).toBeDefined();
      expect(pack.linkedInPost.hook).toBeDefined();
      expect(pack.linkedInPost.callToAction).toContain('BLUEPRINT');
      expect(pack.linkedInPost.recommendedMedia.carouselPdf).toMatch(/\.pdf$/);

      // Twitter / X Thread
      expect(Array.isArray(pack.twitterThread)).toBe(true);
      expect(pack.twitterThread.length).toBe(5);

      // Lead Magnet Gated Offer
      expect(pack.leadMagnet).toBeDefined();
      expect(pack.leadMagnet.assets.length).toBeGreaterThanOrEqual(2);
    });

    test('generateServiceCampaignPack should generate valid campaign for Sprint 01', async () => {
      const pack = await generateServiceCampaignPack('SPRINT-01');
      expect(pack.ok).toBe(true);
      expect(pack.productCode).toBe('SPRINT-01');
      expect(pack.campaignCodes.email).toBe('CMP-E2-SPRINT01-EML-01');
      expect(pack.pricing.usd).toBe(3500);
    });

    test('generateServiceCampaignPack should throw error for invalid product code', async () => {
      await expect(generateServiceCampaignPack('SVC-INVALID-999')).rejects.toThrow();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2. Dynamic Asset Delivery Email Test
  // ───────────────────────────────────────────────────────────────────────────
  describe('2. Dynamic Lead Asset Delivery', () => {

    test('sendServiceAssetDeliveryEmail should simulate email dispatch gracefully', async () => {
      const res = await sendServiceAssetDeliveryEmail({
        email: 'prospect_founder@venturetest.com',
        contactPerson: 'Alex Rivera',
        serviceName: 'AI Mobile Development Sprint',
        productCode: 'SVC-001',
        slidesUrl: '/assets/case-studies/svc-001.pdf',
        blueprintUrl: '/assets/blueprints/svc-001.pdf',
        audioUrl: 'https://open.spotify.com/show/gro10x-ai-case-studies'
      });

      expect(res.success).toBe(true);
      expect(res.to).toBe('prospect_founder@venturetest.com');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3. Lead Capture with Campaign Attribution
  // ───────────────────────────────────────────────────────────────────────────
  describe('3. Lead Ingestion with Campaign Attribution', () => {

    test('POST /api/leads should capture campaign UTM and apply +15 score bonus', async () => {
      const res = await request(app)
        .post('/api/leads')
        .send({
          clientName: 'Apex Health Systems',
          contactPerson: 'Dr. Rafiqul Islam',
          email: `apex_health_${Date.now()}@clinicbd.com`,
          phone: `017${Date.now().toString().slice(-8)}`,
          service: 'SVC-001',
          source: 'LinkedIn Outbound',
          utm_source: 'linkedin',
          utm_campaign: 'CMP-E2-SVC001-LNK-01',
          value: 'High ($3,000+)'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.lead).toBeDefined();
      expect(res.body.lead.utm_campaign).toBe('CMP-E2-SVC001-LNK-01');
      // Base score 50 + high budget 20 + campaign bonus 15 = >= 85
      expect(res.body.lead.score).toBeGreaterThanOrEqual(80);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4. 1-Click Proposal Conversion from CRM Lead
  // ───────────────────────────────────────────────────────────────────────────
  describe('4. CRM 1-Click Proposal Conversion', () => {

    test('POST /api/leads/:id/create-proposal should convert lead into pre-populated SOW proposal', async () => {
      const leadId = `LED-TEST-${Date.now().toString().slice(-4)}`;
      const res = await request(app)
        .post(`/api/leads/${leadId}/create-proposal`)
        .send({
          clientName: 'SaaS Innovators Inc.',
          clientCompany: 'SaaS Innovators',
          clientEmail: 'founder@saasinnovators.io',
          clientPhone: '+8801712345678',
          service: 'SVC-001',
          budget: 2500
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.proposalId).toMatch(/^PRP-/);
      expect(res.body.shareToken).toBeDefined();
      expect(res.body.shareUrl).toContain('/p/');

      const proposal = res.body.proposal;
      expect(proposal.project_title).toContain('Sprint');
      expect(proposal.scope_items.length).toBeGreaterThan(0);
      expect(proposal.terms).toContain('50% upon project kickoff');
      expect(proposal.one_time_total).toBeGreaterThan(0);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 5. REST API Campaign Pack Endpoint
  // ───────────────────────────────────────────────────────────────────────────
  describe('5. REST API Campaign Pack Endpoint', () => {

    test('GET /api/catalog/services/SVC-001/campaign-pack should return 200 with campaign data', async () => {
      const res = await request(app).get('/api/catalog/services/SVC-001/campaign-pack');
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.productCode).toBe('SVC-001');
      expect(res.body.data.coldEmailSequence.length).toBe(3);
      expect(res.body.data.campaignCodes.email).toBe('CMP-E2-SVC001-EML-01');
    });

    test('GET /api/catalog/services/UNKNOWN/campaign-pack should return 404', async () => {
      const res = await request(app).get('/api/catalog/services/UNKNOWN/campaign-pack');
      expect(res.status).toBe(404);
      expect(res.body.ok).toBe(false);
    });
  });

});
