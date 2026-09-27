/**
 * tests/stakeholder_uiux_phase2.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Phase 2 UI/UX Test Suite: Partner Growth, White-Label Intake & Banking Rail
 * Validates:
 * 1. Co-Branded White-Label Intake Desk & Live Preview Modal
 * 2. Tier Elevation Gamification & Compounding Retainer Renewal Ledger
 * 3. Institutional Banking Rail Coordinates Hardening (Mohakhali, 060263290)
 * 4. Public Client Testimonials Showcase Carousel on index.html and sprint.html
 * ─────────────────────────────────────────────────────────────────────────────
 */

process.env.NODE_ENV = 'test';

const fs = require('fs');
const path = require('path');
const request = require('supertest');
const app = require('../server');
const { signToken } = require('../src/services/jwt');

describe('Phase 2 UI/UX: Partner Growth, White-Label Intake & Banking Rail Suite', () => {

  const partnerToken = signToken({
    userId: 'AFF-TANVIR',
    name: 'Tanvir Ahmed',
    role: 'Partner',
    accessLevel: 'Partner',
    linkedType: 'affiliate',
    refCode: 'AFF-TANVIR'
  });

  describe('1. Co-Branded White-Label Intake Desk & Live Preview Modal', () => {
    test('GET /api/affiliates/me returns whiteLabelPortalUrl and eligibility flag', async () => {
      const res = await request(app)
        .get('/api/affiliates/me')
        .set('Authorization', `Bearer ${partnerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.affiliate).toBeDefined();
      expect(res.body.affiliate.whiteLabelPortalUrl).toContain('/portal/');
      expect(res.body.affiliate.whiteLabelPortalUrl).toContain('AFF-TANVIR');
      expect(res.body.affiliate.referralLink).toContain('ref=AFF-TANVIR');
      expect(res.body.affiliate.isWhiteLabelEligible).toBeDefined();
    });

    test('public/partners.html contains #whiteLabelIntakeCard and #whiteLabelPreviewModal', () => {
      const partnersHtmlPath = path.join(__dirname, '../public/partners.html');
      expect(fs.existsSync(partnersHtmlPath)).toBe(true);
      const content = fs.readFileSync(partnersHtmlPath, 'utf8');

      expect(content).toContain('whiteLabelIntakeCard');
      expect(content).toContain('whiteLabelPreviewModal');
      expect(content).toContain('openWhiteLabelPreview');
      expect(content).toContain('closeWhiteLabelPreview');
      expect(content).toContain('copyWhiteLabelLink');
      expect(content).toContain('/portal/:refCode');
      expect(content).toContain('GRO10X AUTONOMOUS PODS');
    });

    test('public/js/partners.js contains white-label modal and copy handlers', () => {
      const partnersJsPath = path.join(__dirname, '../public/js/partners.js');
      expect(fs.existsSync(partnersJsPath)).toBe(true);
      const content = fs.readFileSync(partnersJsPath, 'utf8');

      expect(content).toContain('openWhiteLabelPreview');
      expect(content).toContain('closeWhiteLabelPreview');
      expect(content).toContain('copyWhiteLabelLink');
      expect(content).toContain('whiteLabelLinkInput');
      expect(content).toContain('wlPreviewLiveBtn');
    });
  });

  describe('2. Tier Elevation Gamification & Compounding Retainer Ledger', () => {
    test('public/partners.html contains Tier Elevation Gamification Card', () => {
      const partnersHtmlPath = path.join(__dirname, '../public/partners.html');
      const content = fs.readFileSync(partnersHtmlPath, 'utf8');

      expect(content).toContain('affTierGamificationCard');
      expect(content).toContain('affTierProgressBar');
      expect(content).toContain('affTierProgressBadge');
      expect(content).toContain('affTierProgressMsg');
      expect(content).toContain('affTierVolumeRatio');
    });

    test('public/js/partners.js computes dynamic tier progression and tags Retainer Renewals', () => {
      const partnersJsPath = path.join(__dirname, '../public/js/partners.js');
      const content = fs.readFileSync(partnersJsPath, 'utf8');

      expect(content).toContain('affTierProgressBar');
      expect(content).toContain('affTierProgressBadge');
      expect(content).toContain('affTierProgressMsg');
      expect(content).toContain('Retainer Renewal');
      expect(content).toContain('isRetainer');
    });
  });

  describe('3. Institutional Banking Rail Coordinates Hardening', () => {
    test('src/routes/affiliates.js returns Mohakhali Branch and routing 060263290', async () => {
      const res = await request(app)
        .get('/api/affiliates/me')
        .set('Authorization', `Bearer ${partnerToken}`);

      expect(res.statusCode).toBe(200);
      const acct = res.body.affiliate.settlementAccount;
      expect(acct).toBeDefined();
      expect(acct.bankName).toBe('BRAC Bank Limited');
      expect(acct.accountName).toBe('Neoncore Tech Solution');
      expect(acct.accountNumber).toBe('2081636480001');
      expect(acct.branch).toContain('Mohakhali Branch');
      expect(acct.routing).toBe('060263290');
    });

    test('public/partners.html displays hardened BRAC Bank coordinates with 1-click copy buttons', () => {
      const partnersHtmlPath = path.join(__dirname, '../public/partners.html');
      const content = fs.readFileSync(partnersHtmlPath, 'utf8');

      expect(content).toContain('Neoncore Tech Solution');
      expect(content).toContain('2081636480001');
      expect(content).toContain('Mohakhali Branch');
      expect(content).toContain('060263290');
      expect(content).toContain('copyAccountNumber()');
      expect(content).toContain('copyRoutingNumber()');
    });

    test('public/js/partners.js contains copyAccountNumber and copyRoutingNumber functions', () => {
      const partnersJsPath = path.join(__dirname, '../public/js/partners.js');
      const content = fs.readFileSync(partnersJsPath, 'utf8');

      expect(content).toContain('copyAccountNumber');
      expect(content).toContain('copyRoutingNumber');
      expect(content).toContain('2081636480001');
      expect(content).toContain('060263290');
    });
  });

  describe('4. Public Client Testimonials Showcase Carousel', () => {
    test('GET /api/reviews/testimonials/showcase returns verified client testimonials', async () => {
      const res = await request(app).get('/api/reviews/testimonials/showcase');

      expect(res.statusCode).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(Array.isArray(res.body.testimonials)).toBe(true);
      expect(res.body.testimonials.length).toBeGreaterThan(0);

      const first = res.body.testimonials[0];
      expect(first.csatRating).toBeDefined();
      expect(first.npsScore).toBeDefined();
      expect(first.reviewText).toBeDefined();
      expect(first.consentShowcase).toBe(true);
    });

    test('public/index.html contains #indexTestimonialsGrid and initShowcaseTestimonials', () => {
      const indexPath = path.join(__dirname, '../public/index.html');
      expect(fs.existsSync(indexPath)).toBe(true);
      const content = fs.readFileSync(indexPath, 'utf8');

      expect(content).toContain('indexTestimonialsGrid');
      expect(content).toContain('VERIFIED SOCIAL PROOF');
      expect(content).toContain('Endorsed by Enterprise Leaders');
    });

    test('public/js/landing.js contains initShowcaseTestimonials and endpoint fetch', () => {
      const landingJsPath = path.join(__dirname, '../public/js/landing.js');
      expect(fs.existsSync(landingJsPath)).toBe(true);
      const content = fs.readFileSync(landingJsPath, 'utf8');

      expect(content).toContain('initShowcaseTestimonials');
      expect(content).toContain('/api/reviews/testimonials/showcase');
      expect(content).toContain('indexTestimonialsGrid');
    });

    test('public/sprint.html contains #showcaseTestimonialsGrid and loadShowcaseTestimonials', () => {
      const sprintPath = path.join(__dirname, '../public/sprint.html');
      expect(fs.existsSync(sprintPath)).toBe(true);
      const content = fs.readFileSync(sprintPath, 'utf8');

      expect(content).toContain('showcaseTestimonialsGrid');
      expect(content).toContain('loadShowcaseTestimonials');
      expect(content).toContain('/api/reviews/testimonials/showcase');
      expect(content).toContain('Built & Delivered at Lightning Velocity');
    });
  });

});
