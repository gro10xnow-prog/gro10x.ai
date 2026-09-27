/**
 * tests/stakeholder_touchpoints_phase2.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Stakeholder Touchpoints Phase 2 Test Suite:
 * Experience Evolution, Partner Affiliates & Autonomous Governance
 * 
 * Validates:
 * 1. Dedicated Client Intake Pipeline & Auto-Pod Matching (POST /api/projects/intake)
 * 2. Executive Gross Margin Telemetry & Dip Alert Engine (GET /api/projects/:id/margin)
 * 3. Partner & Affiliate Referral Engine (Tracking Cookie, Calculations, Payout Gate)
 * 4. In-Chat Live Review Room Approval Route Alias (POST /api/reviews/approve)
 * ─────────────────────────────────────────────────────────────────────────────
 */

process.env.NODE_ENV = 'test';
process.env.TELEGRAM_OWNER_CHAT_ID = '7754769807';
process.env.TELEGRAM_ADMIN_CHAT_ID = '7754769807';

const request = require('supertest');
const app = require('../server');
const { signToken } = require('../src/services/jwt');
const { saveMemoryProject } = require('../src/services/post-delivery');
const { memoryDeliverables } = require('../src/services/delivery-review');
const { memoryAffiliates } = require('../src/routes/affiliates');

describe('Stakeholder Touchpoints Phase 2 Suite', () => {

  const adminToken = signToken({
    userId: 'EMP-ADM-001',
    name: 'Tanvir Ahmed',
    role: 'Managing Director',
    accessLevel: 'Owner / Admin',
    department: 'Executive',
    linkedType: 'team'
  });

  const clientToken = signToken({
    userId: 'CLI-TEST-001',
    name: 'Sarah Connor',
    email: 'sarah@skynet.ai',
    role: 'Client',
    accessLevel: 'Client',
    linkedType: 'client'
  });

  const testProjMarginHigh = `PRJ-MARGIN-HIGH-${Date.now()}`;
  const testProjMarginLow = `PRJ-MARGIN-LOW-${Date.now()}`;
  const testReviewId = `REV-P2-${Date.now()}`;

  beforeAll(async () => {
    // Seed high margin project (revenue 100,000, COGS 10,000 -> 90% margin)
    saveMemoryProject({
      id: testProjMarginHigh,
      name: 'High Margin AI Project',
      client: 'SkyNet Global',
      clientName: 'SkyNet Global',
      budget: 100000,
      price: 100000,
      cogs: 10000,
      totalCOGS: 10000,
      cogsItems: [{ amountBDT: 10000, itemType: 'Compute' }],
      status: 'Active'
    });

    // Seed low margin project (revenue 50,000, COGS 40,000 -> 20% margin < 70% benchmark)
    saveMemoryProject({
      id: testProjMarginLow,
      name: 'Low Margin Compute Heavy Project',
      client: 'Cyberdyne Systems',
      clientName: 'Cyberdyne Systems',
      budget: 50000,
      price: 50000,
      cogs: 40000,
      totalCOGS: 40000,
      cogsItems: [{ amountBDT: 40000, itemType: 'GPU Cluster' }],
      status: 'Active'
    });

    // Seed review for approval alias test
    memoryDeliverables.push({
      id: testReviewId,
      project_id: testProjMarginHigh,
      project_name: 'Phase 2 Video Cut Deliverable',
      client: 'SkyNet Global',
      status: 'In Review',
      versions: ['v1.0']
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TRACK 1: Dedicated Client Intake Pipeline & Auto-Pod Matching
  // ───────────────────────────────────────────────────────────────────────────
  describe('Track 1: Client Intake & Auto-Pod Matching (POST /api/projects/intake)', () => {
    test('Rejects intake with missing required title', async () => {
      const res = await request(app)
        .post('/api/projects/intake')
        .send({ clientName: 'Acme Corp', budget: 50000 });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/title/i);
    });

    test('Creates project and auto-matches MVP Rapid Delivery Pod (14d) for mobile/web MVP', async () => {
      const res = await request(app)
        .post('/api/projects/intake')
        .send({
          title: 'Next.js AI MVP Platform',
          clientName: 'Acme Corp',
          clientEmail: 'contact@acme.com',
          projectType: 'mvp',
          deliverables: 'Next.js web app, Supabase database, Stripe billing',
          budget: 65000
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.project).toBeDefined();
      expect(res.body.project.stage).toBe('Discovery');
      expect(res.body.project.deliveryPod).toBe('MVP_BUILD_POD');
      expect(res.body.project.targetSlaDays).toBe(14);
    });

    test('Creates project and auto-matches Enterprise Automation Pod (21d) for automation/RPA', async () => {
      const res = await request(app)
        .post('/api/projects/intake')
        .send({
          title: 'SAP to CRM Webhook Orchestration',
          clientName: 'BigCorp Logistics',
          projectType: 'enterprise_automation',
          deliverables: 'n8n pipelines, webhook listeners, ERP integration',
          budget: 150000
        });

      expect(res.status).toBe(201);
      expect(res.body.project.deliveryPod).toBe('ENTERPRISE_AUTOMATION_POD');
      expect(res.body.project.targetSlaDays).toBe(21);
    });

    test('Creates project and auto-matches Creative AI Pod (7d) for generative video/media', async () => {
      const res = await request(app)
        .post('/api/projects/intake')
        .send({
          title: 'Batch AI Talking Avatar Campaign',
          clientName: 'Fashion Brand X',
          projectType: 'creative_media',
          deliverables: 'ComfyUI batch video generations and voice clones',
          budget: 35000
        });

      expect(res.status).toBe(201);
      expect(res.body.project.deliveryPod).toBe('CREATIVE_AI_POD');
      expect(res.body.project.targetSlaDays).toBe(7);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TRACK 2: Live Gross Margin Telemetry & Warning System
  // ───────────────────────────────────────────────────────────────────────────
  describe('Track 2: Live Gross Margin Telemetry (GET /api/projects/:id/margin)', () => {
    test('Returns 404 for non-existent project', async () => {
      const res = await request(app)
        .get('/api/projects/NON-EXISTENT-999/margin');

      expect(res.status).toBe(404);
    });

    test('Correctly computes healthy gross margin (>= 70%) without alert', async () => {
      const res = await request(app)
        .get(`/api/projects/${testProjMarginHigh}/margin`);

      expect(res.status).toBe(200);
      expect(res.body.projectId).toBe(testProjMarginHigh);
      expect(res.body.grossMarginPercent).toBe('90.0%');
      expect(res.body.marginValue).toBe(90.0);
      expect(res.body.isHealthy).toBe(true);
      expect(res.body.alertSent).toBe(false);
    });

    test('Correctly computes low gross margin (< 70%) and triggers warning alert flag', async () => {
      const res = await request(app)
        .get(`/api/projects/${testProjMarginLow}/margin`);

      expect(res.status).toBe(200);
      expect(res.body.projectId).toBe(testProjMarginLow);
      expect(res.body.marginValue).toBe(20.0);
      expect(res.body.isHealthy).toBe(false);
      expect(res.body.alertSent).toBe(true);
      expect(res.body.warning).toMatch(/Below 70.0% Agency Benchmark/i);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TRACK 3: Partner & Affiliate Referral Engine
  // ───────────────────────────────────────────────────────────────────────────
  describe('Track 3: Affiliate Referral Engine & Settlement Payout Gates', () => {
    test('Affiliate tracking sets 30-day cookie and increments clicks', async () => {
      const refCode = 'AFF-TEST-001';
      // Initialize affiliate in memory
      memoryAffiliates.set(refCode, {
        id: refCode,
        refCode,
        name: 'Tech Growth Partner',
        clicks: 0,
        leadsQualified: 0,
        dealsClosed: 0,
        pendingBalanceBDT: 15000,
        paidOutBDT: 0,
        settlementAccount: {
          type: 'BRAC Bank Limited',
          bankName: 'BRAC Bank Limited',
          accountName: 'Neoncore Tech Solution',
          accountNumber: '2081636480001'
        }
      });

      const res = await request(app)
        .get(`/api/affiliates/track/${refCode}`);

      expect(res.status).toBe(200);
      expect(res.body.tracked).toBe(true);
      expect(res.body.clicks).toBeGreaterThanOrEqual(1);

      // Verify Set-Cookie header contains gro10x_aff_ref
      const cookies = res.headers['set-cookie'] || [];
      const affCookie = cookies.find(c => c.includes('gro10x_aff_ref'));
      expect(affCookie).toBeDefined();
      expect(affCookie).toContain(refCode);
    });

    test('Commission calculation applies 10% on sprints and 15% on retainers', async () => {
      const sprintRes = await request(app)
        .post('/api/affiliates/calculate')
        .send({ dealType: 'sprint', dealValue: 50000 });

      expect(sprintRes.status).toBe(200);
      expect(sprintRes.body.commissionPercent).toBe(10);
      expect(sprintRes.body.commissionAmount).toBe(5000);

      const retainerRes = await request(app)
        .post('/api/affiliates/calculate')
        .send({ dealType: 'retainer', dealValue: 35000 });

      expect(retainerRes.status).toBe(200);
      expect(retainerRes.body.commissionPercent).toBe(15);
      expect(retainerRes.body.commissionAmount).toBe(5250);
    });

    test('Payout gate rejects withdrawal below ৳5,000 BDT minimum threshold', async () => {
      const res = await request(app)
        .post('/api/affiliates/payout')
        .send({
          affiliateCode: 'AFF-TEST-001',
          amount: 3500, // Below 5000
          bankName: 'BRAC Bank Limited',
          accountNumber: '2081636480001'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/5,000/i);
    });

    test('Payout gate rejects withdrawal exceeding affiliate balance', async () => {
      const res = await request(app)
        .post('/api/affiliates/payout')
        .send({
          affiliateCode: 'AFF-TEST-001',
          amount: 999999, // Exceeds balance
          bankName: 'BRAC Bank Limited',
          accountNumber: '2081636480001'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/exceeds/i);
    });

    test('Payout gate approves eligible withdrawal with BRAC Bank institutional rail', async () => {
      const res = await request(app)
        .post('/api/affiliates/payout')
        .send({
          affiliateCode: 'AFF-TEST-001',
          amount: 7500,
          paymentRail: 'BRAC_BANK',
          bankName: 'BRAC Bank Limited',
          accountName: 'Neoncore Tech Solution',
          accountNumber: '2081636480001'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.payoutId).toBeDefined();
      expect(res.body.remainingBalance).toBe(7500); // 15000 - 7500
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TRACK 4: Review Approval Body Alias (In-Chat Live Review Room)
  // ───────────────────────────────────────────────────────────────────────────
  describe('Track 4: In-Chat Live Review Room Approval Route Alias', () => {
    test('POST /api/reviews/approve approves review via body parameter reviewId', async () => {
      const res = await request(app)
        .post('/api/reviews/approve')
        .send({
          reviewId: testReviewId,
          approvedBy: 'Sarah Client Lead',
          feedback: 'Pixel perfect delivery! Approved for sprint closure.'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.review.status.toLowerCase()).toBe('approved');
    });
  });
});
