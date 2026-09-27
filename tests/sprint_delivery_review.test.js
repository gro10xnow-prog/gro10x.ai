/**
 * tests/sprint_delivery_review.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Comprehensive Integration Test Suite for Engine 2:
 * Sprint Execution, Stakeholder Governance & Review Room 2.0 Engine
 * Validates:
 * 1. Stakeholder Matrix Assignment (Internal Agency Team & External Client POCs)
 * 2. Multi-Format AI Deliverable Publishing (Staging URLs, GitHub Repos, APIs, DoD)
 * 3. Threaded Review Feedback & Scope Creep Shield (OUT_OF_SCOPE detection)
 * 4. Revision Round Lifecycle (v1.0-alpha -> v1.1-rc and max_revisions limit enforcement)
 * 5. Formal Deliverable Sign-Off, Handover & 30-Day Bug-Fix Warranty Activation
 * ─────────────────────────────────────────────────────────────────────────────
 */

const request = require('supertest');
const app = require('../server');
const { signToken } = require('../src/services/jwt');
const {
  assignProjectStakeholders,
  publishSprintDeliverable,
  submitDeliverableFeedback,
  advanceRevisionRound,
  executeDeliverableApproval
} = require('../src/services/delivery-review');

describe('Engine 2: Sprint Execution, Stakeholder Governance & Review Engine Tests', () => {

  const adminToken = signToken({
    userId: 'EMP-001',
    name: 'Admin Lead',
    role: 'Technology Admin',
    accessLevel: 'Owner / Admin',
    department: 'Management',
    linkedType: 'team'
  });

  const clientToken = signToken({
    userId: 'POC-CLIENT-01',
    name: 'Dr. Tariqul Alam',
    role: 'Client Partner',
    accessLevel: 'Client Partner',
    linkedType: 'client',
    company: 'Apex BioTech Labs'
  });

  const testProjectId = `PRJ-TEST-${Date.now().toString().slice(-6)}`;
  let testReviewId = null;

  // ───────────────────────────────────────────────────────────────────────────
  // 1. Direct Service Layer Unit Tests
  // ───────────────────────────────────────────────────────────────────────────
  describe('1. Direct Service Layer Verification', () => {

    test('assignProjectStakeholders should normalize internal and external matrices', async () => {
      const stakeholders = await assignProjectStakeholders(testProjectId, {
        internal: {
          delivery_lead: 'EMP-001 (Admin Lead)',
          lead_engineer: 'EMP-022 (Lead AI Architect)',
          qa_lead: 'EMP-005 (QA Engineer)'
        },
        external: {
          primary_approver_id: 'POC-01 (Dr. Tariqul Alam)',
          technical_lead_id: 'POC-02 (Nabil Hasan)'
        }
      });

      expect(stakeholders).toBeDefined();
      expect(stakeholders.internal.delivery_lead).toContain('Admin Lead');
      expect(stakeholders.internal.lead_engineer).toContain('Lead AI Architect');
      expect(stakeholders.external.primary_approver_id).toContain('Dr. Tariqul Alam');
      expect(stakeholders.assigned_at).toBeDefined();
    });

    test('publishSprintDeliverable should create deliverable with DoD checklist', async () => {
      const deliverable = await publishSprintDeliverable({
        projectId: testProjectId,
        title: 'Clinical SaaS MVP Live Deployment & GitHub PR',
        deliverableType: 'staging_url',
        stagingUrl: 'https://staging-app.apexbio.tech',
        repoUrl: 'https://github.com/gro10x/apexbio-clinical-mvp',
        branchName: 'release/v1.0',
        maxRevisions: 2
      });

      expect(deliverable).toBeDefined();
      expect(deliverable.id).toMatch(/^REV-/);
      expect(deliverable.deliverable_type).toBe('staging_url');
      expect(deliverable.staging_url).toBe('https://staging-app.apexbio.tech');
      expect(deliverable.dod_checklist.length).toBeGreaterThan(0);
      expect(deliverable.revision_round).toBe(1);
    });

    test('submitDeliverableFeedback should detect out-of-scope exclusions', async () => {
      const testRev = await publishSprintDeliverable({
        projectId: testProjectId,
        title: 'Service Delivery Item'
      });

      // 1. Standard Bug Fix
      const c1 = await submitDeliverableFeedback({
        reviewId: testRev.id,
        author: 'Nabil Hasan',
        text: 'The password reset modal button is not reacting on mobile viewport.',
        commentType: 'BUG_FIX'
      });
      expect(c1.comment_type).toBe('BUG_FIX');
      expect(c1.scope_flag).toBe('IN_SCOPE');

      // 2. Out of scope request
      const c2 = await submitDeliverableFeedback({
        reviewId: testRev.id,
        author: 'Dr. Tariqul Alam',
        text: 'We also need full legacy data migration from our on-premise DB and a native mobile app for iOS.',
        commentType: 'GENERAL'
      });
      expect(c2.comment_type).toBe('OUT_OF_SCOPE');
      expect(c2.scope_flag).toBe('OUT_OF_SCOPE_POTENTIAL');
      expect(c2.scope_warning).toContain('fall outside the locked contract scope');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2. HTTP API Endpoints Integration Tests
  // ───────────────────────────────────────────────────────────────────────────
  describe('2. Stakeholder Matrix API Endpoints', () => {

    test('PUT /api/projects/:id/stakeholders should assign project team and client POCs', async () => {
      // First ensure project exists
      await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          id: testProjectId,
          name: 'Apex BioTech — Clinical Trials SaaS MVP',
          department: 'AI Transformation'
        });

      const res = await request(app)
        .put(`/api/projects/${testProjectId}/stakeholders`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          internal: {
            deliveryLead: 'EMP-001 (Admin Lead)',
            leadEngineer: 'EMP-022 (Lead AI Architect)',
            qaLead: 'EMP-005 (QC Engineer)',
            accountManager: 'EMP-002 (Client Partner)'
          },
          external: {
            primaryApproverId: 'POC-01 (Dr. Tariqul Alam)',
            technicalLeadId: 'POC-02 (Nabil Hasan)',
            billingPocId: 'POC-03 (Farzana Haque)'
          }
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.stakeholders.internal.delivery_lead).toContain('Admin Lead');
      expect(res.body.stakeholders.external.primary_approver_id).toContain('Dr. Tariqul');
    });

    test('GET /api/projects/:id/stakeholders should retrieve the assigned matrix', async () => {
      const res = await request(app)
        .get(`/api/projects/${testProjectId}/stakeholders`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.stakeholders.internal).toBeDefined();
      expect(res.body.stakeholders.internal.lead_engineer).toContain('Lead AI Architect');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3. Multi-Format AI Deliverable Review Flow
  // ───────────────────────────────────────────────────────────────────────────
  describe('3. Deliverable Publishing & Review Room Flow', () => {

    test('POST /api/reviews should publish an Engine 2 AI deliverable', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          projectId: testProjectId,
          projectName: 'Apex BioTech MVP Cloud Deployment',
          client: 'Apex BioTech Labs',
          deliverableType: 'staging_url',
          stagingUrl: 'https://staging-app.apexbio.tech',
          repoUrl: 'https://github.com/gro10x/apexbio-clinical-mvp',
          branchName: 'release/v1.0',
          dodChecklist: [
            { id: 'DOD-01', title: 'HIPAA compliant auth and data encryption', passed: true },
            { id: 'DOD-02', title: '14-day turnaround feature complete', passed: true }
          ],
          maxRevisions: 2
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.review.id).toMatch(/^REV-/);
      expect(res.body.review.deliverableType).toBe('staging_url');
      expect(res.body.review.stagingUrl).toBe('https://staging-app.apexbio.tech');
      expect(res.body.review.dodChecklist.length).toBe(2);
      expect(res.body.review.revisionRound).toBe(1);

      testReviewId = res.body.review.id;
    });

    test('GET /api/projects/:id/deliverables should list published deliverables', async () => {
      const res = await request(app)
        .get(`/api/projects/${testProjectId}/deliverables`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(Array.isArray(res.body.deliverables)).toBe(true);
    });

    test('POST /api/reviews/:id/comments should flag out-of-scope feedback', async () => {
      // 1. In-scope comment
      const res1 = await request(app)
        .post(`/api/reviews/${testReviewId}/comments`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          text: 'The audit logging page loads fast, but please tweak the date filter dropdown layout.',
          commentType: 'POLISH_REVISION'
        });

      expect(res1.status).toBe(200);
      expect(res1.body.comment.commentType).toBe('POLISH_REVISION');
      expect(res1.body.comment.scopeFlag).toBe('IN_SCOPE');

      // 2. Out-of-scope comment
      const res2 = await request(app)
        .post(`/api/reviews/${testReviewId}/comments`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          text: 'We also need native mobile app distribution for our lab technicians on Android apk.',
          commentType: 'GENERAL'
        });

      expect(res2.status).toBe(200);
      expect(res2.body.comment.commentType).toBe('OUT_OF_SCOPE');
      expect(res2.body.comment.scopeFlag).toBe('OUT_OF_SCOPE_POTENTIAL');
      expect(res2.body.comment.scopeWarning).toBeDefined();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4. Revision Round Progression & Formal Sign-Off
  // ───────────────────────────────────────────────────────────────────────────
  describe('4. Revision Lifecycle & Handover Activation', () => {

    test('POST /api/reviews/:id/request-revisions advances revision round to v1.1-rc', async () => {
      const res = await request(app)
        .post(`/api/reviews/${testReviewId}/request-revisions`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          feedback: 'Date filter dropdown adjusted. Please update the export button padding.'
        });

      expect(res.status).toBe(200);
      expect(res.body.review.revisionRound).toBe(2);
      expect(res.body.review.activeVersion).toBe('v1.1-rc');
      expect(res.body.review.status).toBe('revision_requested');
    });

    test('Reject revision request when max_revisions limit is exceeded', async () => {
      // Round 2 is already reached (2/2)
      const res = await request(app)
        .post(`/api/reviews/${testReviewId}/request-revisions`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          feedback: 'Additional round beyond our 2 included revisions.'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Revision limit reached');
    });

    test('POST /api/reviews/:id/approve signs off deliverable and activates 30-day warranty', async () => {
      const res = await request(app)
        .post(`/api/reviews/${testReviewId}/approve`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          approverName: 'Dr. Tariqul Alam'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.review.status).toBe('approved');
      expect(res.body.review.approvedBy).toBe('Dr. Tariqul Alam');
      expect(res.body.warrantyUntil).toBeDefined();
      expect(res.body.milestoneInvoiceReleased).toBe(true);

      // Verify warranty date is ~30 days in the future
      const warrantyMs = new Date(res.body.warrantyUntil).getTime() - Date.now();
      const days = Math.round(warrantyMs / (1000 * 60 * 60 * 24));
      expect(days).toBeGreaterThanOrEqual(29);
      expect(days).toBeLessThanOrEqual(31);
    });
  });

  afterAll(async () => {
    const { supabase, isSupabaseConfigured } = require('../src/services/supabase');
    if (isSupabaseConfigured()) {
      try {
        if (testReviewId) await supabase.from('reviews').delete().eq('id', testReviewId);
        if (testProjectId) await supabase.from('projects').delete().eq('id', testProjectId);
      } catch (_) {}
    }
  });
});
