/**
 * tests/post_delivery_warranty_governance.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * End-to-End Integration Test Suite for Engine 2 Post-Delivery Governance:
 * 1. 30-Day Bug-Fix Warranty Ticket SLA Engine (Active vs Expired vs Dispute)
 * 2. 4-Hour Response & 24-Hour Remediation SLA calculation with 0-cost billing
 * 3. Formal Handover Shield & Irrevocable IP Transfer Manifest generation & signing
 * 4. Deliverable Dispute Protocol with automatic warranty timer freeze & extension
 * 5. Social Proof & Testimonial Harvesting Engine with public showcase consent
 * ─────────────────────────────────────────────────────────────────────────────
 */

const request = require('supertest');
const app = require('../server');
const { signToken } = require('../src/services/jwt');

describe('Engine 2 Post-Delivery Service, Warranty Governance & Social Proof', () => {

  const adminToken = signToken({
    userId: 'EMP-MD-001',
    name: 'Mehedi Bin Jayed',
    role: 'Managing Director',
    accessLevel: 'Owner / Admin',
    department: 'Executive',
    linkedType: 'team'
  });

  const clientToken = signToken({
    userId: 'CLI-PURPLEBOT-01',
    name: 'H. M. Ifteker Mahmud',
    role: 'Managing Director',
    accessLevel: 'Client Partner',
    department: 'Client Partner',
    linkedType: 'client',
    linkedId: 'CLI-PURPLEBOT-01',
    company: 'Purplebot Digital Limited'
  });

  const activeProjectCode = `PRJ-ACT-${Date.now().toString().slice(-6)}`;
  const expiredProjectCode = `PRJ-EXP-${Date.now().toString().slice(-6)}`;

  beforeAll(async () => {
    const { saveMemoryProject } = require('../src/services/post-delivery');
    
    // Seed Active Warranty Project (25 days remaining)
    saveMemoryProject({
      id: activeProjectCode,
      name: 'Purplebot AI Retainer Infrastructure',
      client: 'Purplebot Digital Limited',
      clientName: 'Purplebot Digital Limited',
      clientId: 'CLI-PURPLEBOT-01',
      budget: 25000,
      department: 'Production',
      workflowType: 'composite_bundle',
      status: 'Active',
      delivery_status: 'APPROVED',
      warranty_until: new Date(Date.now() + 25 * 24 * 3600000).toISOString()
    });

    // Seed Expired Warranty Project (-5 days)
    saveMemoryProject({
      id: expiredProjectCode,
      name: 'Legacy Social Campaign Engine',
      client: 'Purplebot Digital Limited',
      clientName: 'Purplebot Digital Limited',
      clientId: 'CLI-PURPLEBOT-01',
      budget: 15000,
      status: 'Completed',
      delivery_status: 'APPROVED',
      warranty_until: new Date(Date.now() - 5 * 24 * 3600000).toISOString(),
      created_at: new Date(Date.now() - 40 * 24 * 3600000).toISOString()
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 1. Warranty Status Calculation
  // ───────────────────────────────────────────────────────────────────────────
  describe('1. Warranty Status & Countdown Engine', () => {

    test('GET /api/projects/:id/warranty-status should return active warranty shield', async () => {
      const res = await request(app)
        .get(`/api/projects/${activeProjectCode}/warranty-status`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.isActive).toBe(true);
      expect(res.body.badge).toBe('ACTIVE_WARRANTY');
      expect(res.body.remainingDays).toBeGreaterThanOrEqual(24);
      expect(res.body.slaTerms).toContain('4h Response / 24h Resolution');
    });

    test('GET /api/projects/:id/warranty-status should detect expired warranty', async () => {
      const res = await request(app)
        .get(`/api/projects/${expiredProjectCode}/warranty-status`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.isActive).toBe(false);
      expect(res.body.badge).toBe('EXPIRED_WARRANTY');
      expect(res.body.remainingDays).toBe(0);
    });

  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2. Warranty Ticket SLA Engine
  // ───────────────────────────────────────────────────────────────────────────
  describe('2. Warranty Ticket SLA & Zero-Cost Billing Engine', () => {

    test('POST /api/tickets against active project applies 4h/24h SLAs and zero-cost billing', async () => {
      const res = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          title: 'Authentication Token Refresh Intermittent Timeout',
          description: 'OAuth token refresh fails during heavy batch processing on worker node 1.',
          projectId: activeProjectCode,
          category: 'Warranty Bug Fix',
          priority: 'High'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      const ticket = res.body.ticket;
      expect(ticket.isWarranty).toBe(true);
      expect(ticket.warrantyStatus).toBe('ACTIVE');
      expect(ticket.billable).toBe(false); // Zero-cost guarantee
      expect(ticket.slaResponseDue).toBeDefined();
      expect(ticket.slaResolutionDue).toBeDefined();

      // Ensure SLA deadlines are ~4h and ~24h ahead
      const resDue = new Date(ticket.slaResponseDue).getTime();
      const resolDue = new Date(ticket.slaResolutionDue).getTime();
      const now = Date.now();
      expect(resDue - now).toBeGreaterThan(3.5 * 3600000);
      expect(resolDue - now).toBeGreaterThan(23.5 * 3600000);
    });

    test('POST /api/tickets against expired project tags EXPIRED and marks billable', async () => {
      const res = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          title: 'Upgrade Python runtime to 3.12',
          description: 'Deprecated libraries warning in container logs.',
          projectId: expiredProjectCode,
          category: 'Creative Revision'
        });

      expect(res.statusCode).toBe(201);
      const ticket = res.body.ticket;
      expect(ticket.isWarranty).toBe(false);
      expect(ticket.warrantyStatus).toBe('EXPIRED');
      expect(ticket.billable).toBe(true); // Billable retainer maintenance
    });

  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3. Formal Handover Shield & IP Transfer Manifest
  // ───────────────────────────────────────────────────────────────────────────
  describe('3. Formal Handover Shield & Irrevocable IP Transfer Manifest', () => {

    test('GET /api/projects/:id/handover generates legal IP assignment and technical asset manifest', async () => {
      const res = await request(app)
        .get(`/api/projects/${activeProjectCode}/handover`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.ok).toBe(true);
      const manifest = res.body.manifest;
      expect(manifest.manifestId).toMatch(/^MAN-2026-/);
      expect(manifest.ipTransferStatus).toBe('IRREVOCABLY_ASSIGNED');
      expect(manifest.ipAssignmentClause).toContain('irrevocably assigns, transfers, and conveys');
      expect(manifest.technicalAssets.credentialsTransferred).toBe(true);
      expect(manifest.warranty.slaTerms).toContain('30-Day Bug-Fix Guarantee');
    });

    test('POST /api/projects/:id/handover/sign executes digital sign-off and completes handover', async () => {
      const res = await request(app)
        .post(`/api/projects/${activeProjectCode}/handover/sign`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          signedBy: 'H. M. Ifteker Mahmud',
          signatoryRole: 'Managing Director'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.ok).toBe(true);
      const manifest = res.body.manifest;
      expect(manifest.isSigned).toBe(true);
      expect(manifest.signedBy).toBe('H. M. Ifteker Mahmud');
      expect(manifest.signatoryRole).toBe('Managing Director');
      expect(manifest.deliveryStatus).toBe('HANDOVER_COMPLETE');
    });

  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4. Deliverable Dispute Resolution & Warranty Timer Freeze
  // ───────────────────────────────────────────────────────────────────────────
  describe('4. Deliverable Dispute Protocol & Warranty Timer Pause', () => {

    test('POST /api/projects/:id/dispute files formal dispute and freezes warranty timer', async () => {
      const res = await request(app)
        .post(`/api/projects/${activeProjectCode}/dispute`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          reason: 'QUALITY_DEFECT',
          description: 'High concurrency load causes GPU render farm worker crash.',
          requestedRemedy: 'CORRECTION_SPRINT',
          submittedBy: 'H. M. Ifteker Mahmud'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.dispute.status).toBe('ACTIVE_DISPUTE');
      expect(res.body.dispute.disputePausedAt).toBeDefined();

      // Verify warranty status now reflects paused/disputed
      const wRes = await request(app)
        .get(`/api/projects/${activeProjectCode}/warranty-status`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect(wRes.body.isDisputed).toBe(true);
      expect(wRes.body.badge).toBe('DISPUTED_PAUSED');
    });

    test('POST /api/projects/:id/dispute/resolve unfreezes warranty and applies extension days', async () => {
      const res = await request(app)
        .post(`/api/projects/${activeProjectCode}/dispute/resolve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          resolutionType: 'CORRECTION_SPRINT_GRANTED',
          resolutionNotes: 'Granted complimentary 72h GPU cluster patch sprint.',
          extensionDays: 14,
          resolvedBy: 'Mehedi Bin Jayed'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.resolutionType).toBe('CORRECTION_SPRINT_GRANTED');
      expect(res.body.extendedWarrantyUntil).toBeDefined();

      // Verify warranty status is now active again with extended timestamp
      const wRes = await request(app)
        .get(`/api/projects/${activeProjectCode}/warranty-status`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect(wRes.body.isDisputed).toBe(false);
      expect(wRes.body.isActive).toBe(true);
      expect(wRes.body.badge).toBe('ACTIVE_WARRANTY');
      expect(wRes.body.remainingDays).toBeGreaterThan(30); // Extended!
    });

  });

  // ───────────────────────────────────────────────────────────────────────────
  // 5. Social Proof & Testimonial Harvesting Engine
  // ───────────────────────────────────────────────────────────────────────────
  describe('5. Social Proof & Testimonial Harvesting Engine', () => {

    test('POST /api/projects/:id/testimonial collects CSAT, NPS, video link, and consent', async () => {
      const res = await request(app)
        .post(`/api/projects/${activeProjectCode}/testimonial`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          csatRating: 5,
          npsScore: 10,
          reviewText: 'Gro10x.ai delivered our entire automated agency infrastructure with outstanding precision and velocity.',
          videoUrl: 'https://www.loom.com/share/purplebot-review-demo',
          clientDisplayName: 'H. M. Ifteker Mahmud',
          clientRole: 'Managing Director',
          clientCompany: 'Purplebot Digital Limited',
          consentShowcase: true
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.ok).toBe(true);
      const tst = res.body.testimonial;
      expect(tst.csatRating).toBe(5);
      expect(tst.npsScore).toBe(10);
      expect(tst.consentShowcase).toBe(true);
      expect(tst.videoUrl).toBe('https://www.loom.com/share/purplebot-review-demo');
    });

    test('GET /api/projects/:id/testimonial retrieves the saved testimonial', async () => {
      const res = await request(app)
        .get(`/api/projects/${activeProjectCode}/testimonial`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.testimonial.csatRating).toBe(5);
    });

    test('GET /api/testimonials returns public showcase testimonials', async () => {
      const res = await request(app)
        .get('/api/testimonials');

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      const found = res.body.find(t => t.clientCompany === 'Purplebot Digital Limited');
      expect(found).toBeDefined();
      expect(found.consentShowcase).toBe(true);
      expect(found.csatRating).toBe(5);
    });

  });

});
