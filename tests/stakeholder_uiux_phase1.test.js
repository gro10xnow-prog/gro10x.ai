/**
 * tests/stakeholder_uiux_phase1.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Phase 1 UI/UX Test Suite: Client Experience & Institutional Handover
 * Validates:
 * 1. Deliverable Side-by-Side Version Comparison Drawer & Modal Integration
 * 2. Post-Acceptance 1-Click NPS & Testimonial Harvest Modal Integration
 * 3. Master IP Handover Certificate Card, Modal & Handover View Dynamic Seal
 * 4. Client Self-Serve Scope Change Order Desk & Approval Actions
 * 5. Code Integrity & DOM Element Presence across frontend files
 * ─────────────────────────────────────────────────────────────────────────────
 */

process.env.NODE_ENV = 'test';

const fs = require('fs');
const path = require('path');
const request = require('supertest');
const app = require('../server');
const { signToken } = require('../src/services/jwt');
const { saveMemoryProject } = require('../src/services/post-delivery');

describe('Phase 1 UI/UX: Client Experience & Institutional Handover Suite', () => {

  const clientToken = signToken({
    userId: 'CLI-PHASE1-001',
    name: 'Amina Rahman',
    role: 'Managing Director',
    accessLevel: 'Client',
    linkedType: 'client',
    clientId: 'CLI-ORG-001'
  });

  const testProjectId = `PRJ-UX1-${Date.now()}`;
  const testReviewId = 'REV-SAMPLE01'; // Default fallback review present in reviews.js

  beforeAll(async () => {
    // Seed project in memory
    saveMemoryProject({
      id: testProjectId,
      name: 'OmniFlow AI Enterprise Suite',
      client: 'Chillox Bangladesh',
      client_id: 'CLI-ORG-001',
      status: 'active',
      warranty_until: '2026-11-30',
      changeOrders: []
    });
  });

  describe('1. Deliverable Side-by-Side Version Comparison', () => {
    test('GET /api/reviews/:id/compare returns version diff, active & previous versions', async () => {
      const res = await request(app)
        .get(`/api/reviews/${testReviewId}/compare`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.activeVersion).toBeDefined();
      expect(res.body.previousVersion).toBeDefined();
      expect(Array.isArray(res.body.versions)).toBe(true);
      expect(res.body.comparisonMode).toBe('side_by_side_synchronized');
    });

    test('public/client/modules/review.js contains #clCompareModal and openCompareModal handler', () => {
      const reviewJsPath = path.join(__dirname, '../public/client/modules/review.js');
      expect(fs.existsSync(reviewJsPath)).toBe(true);
      const content = fs.readFileSync(reviewJsPath, 'utf8');

      expect(content).toContain('clCompareModal');
      expect(content).toContain('openCompareModal');
      expect(content).toContain('/compare');
      expect(content).toContain('Compare Versions');
    });

    test('public/reviewroom.html contains #rrCompareModal and version diff integration', () => {
      const rrPath = path.join(__dirname, '../public/reviewroom.html');
      expect(fs.existsSync(rrPath)).toBe(true);
      const content = fs.readFileSync(rrPath, 'utf8');

      expect(content).toContain('rrCompareModal');
      expect(content).toContain('openCompareModal');
      expect(content).toContain('SYNCHRONIZED VERSION DIFF');
      expect(content).toContain('/api/reviews/');
    });
  });

  describe('2. Post-Acceptance 1-Click NPS & Testimonial Harvest Modal', () => {
    test('POST /api/reviews/:id/feedback persists CSAT rating, NPS score & testimonial with consent', async () => {
      const feedbackPayload = {
        csatRating: 5,
        npsScore: 10,
        reviewText: 'The rapid prototyping and automated deployment exceeded our expectations!',
        consentShowcase: true
      };

      const res = await request(app)
        .post(`/api/reviews/${testReviewId}/feedback`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send(feedbackPayload);

      expect(res.statusCode).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.testimonial).toBeDefined();
      expect(res.body.testimonial.csatRating).toBe(5);
      expect(res.body.testimonial.npsScore).toBe(10);
      expect(res.body.testimonial.consentShowcase).toBe(true);
      expect(res.body.isFeaturedTestimonial).toBe(true);
    });

    test('public/client/modules/review.js contains #clNpsModal and executeSignOff triggers NPS flow', () => {
      const reviewJsPath = path.join(__dirname, '../public/client/modules/review.js');
      const content = fs.readFileSync(reviewJsPath, 'utf8');

      expect(content).toContain('clNpsModal');
      expect(content).toContain('openNpsModal');
      expect(content).toContain('submitNpsFeedback');
      expect(content).toContain('/feedback');
      expect(content).toContain('How was your sprint experience?');
      expect(content).toContain('this.openNpsModal');
    });

    test('public/reviewroom.html contains #rrNpsModal and cut approval triggers NPS flow', () => {
      const rrPath = path.join(__dirname, '../public/reviewroom.html');
      const content = fs.readFileSync(rrPath, 'utf8');

      expect(content).toContain('rrNpsModal');
      expect(content).toContain('openNpsModal');
      expect(content).toContain('submitRrNpsFeedback');
      expect(content).toContain('executeCutApproval');
    });
  });

  describe('3. Master IP Handover Certificate Card, Modal & Handover View', () => {
    test('GET /api/projects/:id/ip-certificate returns cryptographically signed IP certificate', async () => {
      const res = await request(app)
        .get(`/api/projects/${testProjectId}/ip-certificate`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.ok).toBe(true);
      const cert = res.body.certificate;
      expect(cert).toBeDefined();
      expect(cert.projectId).toBe(testProjectId);
      expect(cert.ipTransferStatus).toBe('IRREVOCABLE_ASSIGNMENT');
      expect(cert.digitalVerificationHash).toMatch(/^GRO10X-SEC-[A-F0-9]{16}$/);
      expect(cert.settlementRail).toContain('BRAC Bank Limited');
      expect(cert.settlementRail).toContain('2081636480001');
      expect(cert.authoritySignatory).toContain('Neoncore Tech Solution');
    });

    test('public/client/modules/account.js renders Master IP Certificate card and #clIpCertModal', () => {
      const accountJsPath = path.join(__dirname, '../public/client/modules/account.js');
      expect(fs.existsSync(accountJsPath)).toBe(true);
      const content = fs.readFileSync(accountJsPath, 'utf8');

      expect(content).toContain('clIpCertModal');
      expect(content).toContain('openIpCertModal');
      expect(content).toContain('Master IP Handover Certificate');
      expect(content).toContain('/ip-certificate');
      expect(content).toContain('GRO10X-SEC-');
      expect(content).toContain('2081636480001');
    });

    test('public/handover-view.html dynamically renders cryptographic IP seal and BRAC Bank settlement stamp', () => {
      const handoverPath = path.join(__dirname, '../public/handover-view.html');
      expect(fs.existsSync(handoverPath)).toBe(true);
      const content = fs.readFileSync(handoverPath, 'utf8');

      expect(content).toContain('docSettlementRail');
      expect(content).toContain('docCertSealTag');
      expect(content).toContain('docCertHash');
      expect(content).toContain('BRAC Bank Limited');
      expect(content).toContain('2081636480001');
      expect(content).toContain('Mohakhali Branch');
      expect(content).toContain('060263290');
      expect(content).toContain('ip-certificate');
    });
  });

  describe('4. Client Self-Serve Scope Change Order Desk', () => {
    let createdCoId = null;

    test('POST /api/projects/:id/change-order submits scope addendum', async () => {
      const res = await request(app)
        .post(`/api/projects/${testProjectId}/change-order`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          title: 'Dedicated WebSocket Feed for High-Frequency Trades',
          description: 'Implement bi-directional binary WebSocket pipeline with <25ms p99 latency guarantee.',
          estimatedDays: 3,
          proposedFeeBDT: 120000
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.changeOrder).toBeDefined();
      expect(res.body.changeOrder.id).toMatch(/^CO-/);
      expect(res.body.changeOrder.status).toBe('PENDING_APPROVAL');
      createdCoId = res.body.changeOrder.id;
    });

    test('GET /api/projects/:id/change-orders lists submitted change orders', async () => {
      const res = await request(app)
        .get(`/api/projects/${testProjectId}/change-orders`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(Array.isArray(res.body.changeOrders)).toBe(true);
      expect(res.body.changeOrders.length).toBeGreaterThan(0);
      const co = res.body.changeOrders.find(c => c.id === createdCoId);
      expect(co).toBeDefined();
      expect(co.title).toContain('WebSocket');
    });

    test('PUT /api/projects/:id/change-order/:coId/approve approves change order and invoices it', async () => {
      const res = await request(app)
        .put(`/api/projects/${testProjectId}/change-order/${createdCoId}/approve`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ approvedBy: 'Amina Rahman' });

      expect(res.statusCode).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.changeOrder.status).toBe('APPROVED');
      expect(res.body.changeOrder.approvedBy).toBe('Amina Rahman');
      expect(res.body.changeOrder.invoiceId).toMatch(/^INV-/);
    });

    test('public/client/modules/tickets.js contains Scope Change Orders view and submission modal', () => {
      const ticketsJsPath = path.join(__dirname, '../public/client/modules/tickets.js');
      expect(fs.existsSync(ticketsJsPath)).toBe(true);
      const content = fs.readFileSync(ticketsJsPath, 'utf8');

      expect(content).toContain('clChangeOrderModal');
      expect(content).toContain('openChangeOrderModal');
      expect(content).toContain('submitChangeOrder');
      expect(content).toContain('approveChangeOrder');
      expect(content).toContain('/change-orders');
      expect(content).toContain('Scope Change Orders & Addenda');
    });
  });

});
