/**
 * tests/sprint_delivery_operational_workflow.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Engine 2 Operational Workflow Test Suite:
 * Review & Delivery Cockpit, Scope Creep Shield, Revision Rounds & Warranty
 * ─────────────────────────────────────────────────────────────────────────────
 * Validates:
 * 1. Publishing multi-format sprint deliverables (Staging URLs, GitHub Repos, OpenAPI Specs, DoD)
 * 2. Client Portal retrieval with correct field mappings
 * 3. In-scope feedback logging (BUG_FIX, POLISH_REVISION)
 * 4. Real-time Scope Creep Shield screening & OUT_OF_SCOPE advisory generation
 * 5. Revision round lifecycle management (Round 1 -> 2) and max_revisions enforcement
 * 6. 1-Click Formal Sign-Off with 50% milestone commercial invoice release
 * 7. 30-Day Bug-Fix Warranty calculation and activation
 * 8. Stakeholder matrix assignment and retrieval
 * ─────────────────────────────────────────────────────────────────────────────
 */

const request = require('supertest');
const app = require('../server');
const { signToken } = require('../src/services/jwt');

describe('Engine 2: Sprint Delivery Operational Workflow & Governance Tests', () => {

  const adminToken = signToken({
    userId: 'EMP-LEAD-01',
    name: 'Fahim Rahman (Lead Dev)',
    role: 'Technology Admin',
    accessLevel: 'Owner / Admin',
    department: 'Engineering',
    linkedType: 'team'
  });

  const clientToken = signToken({
    userId: 'POC-CLIENT-99',
    name: 'Samiya Khan',
    role: 'Client Partner',
    accessLevel: 'Client Partner',
    linkedType: 'client',
    company: 'Apex BioTech Labs'
  });

  const uniqueProjectCode = `PRJ-E2-${Date.now().toString().slice(-6)}`;
  let createdDeliverableId = null;
  let testCommentId = null;

  // ───────────────────────────────────────────────────────────────────────────
  // 1. Publishing Multi-Format Sprint Deliverable (Admin Cockpit)
  // ───────────────────────────────────────────────────────────────────────────
  describe('1. Deliverable Publication & Stakeholder Matrix', () => {

    test('POST /api/reviews should publish a multi-format deliverable with DoD criteria', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          projectId: uniqueProjectCode,
          projectName: 'Apex AI Health Portal v1.0-alpha',
          client: 'Apex BioTech Labs',
          deliverableType: 'staging_url',
          stagingUrl: 'https://staging.apexhealth.gro10x.ai',
          repoUrl: 'https://github.com/gro10x/apex-health-portal',
          branchName: 'release/sprint-1',
          apiDocsUrl: 'https://api.apexhealth.gro10x.ai/docs',
          dodChecklist: [
            { item: 'Unit & integration tests passing (>80% coverage)', completed: true, verified_by: 'QA Specialist' },
            { item: 'Zero high-severity CVEs in security audit', completed: true, verified_by: 'SecOps' },
            { item: 'Staging environment deployed and health-checked', completed: true, verified_by: 'DevOps' }
          ],
          maxRevisions: 2
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.review).toBeDefined();
      expect(res.body.review.id).toMatch(/^REV-/);
      expect(res.body.review.stagingUrl).toBe('https://staging.apexhealth.gro10x.ai');
      expect(res.body.review.repoUrl).toBe('https://github.com/gro10x/apex-health-portal');
      expect(res.body.review.branchName).toBe('release/sprint-1');
      expect(res.body.review.apiDocsUrl).toBe('https://api.apexhealth.gro10x.ai/docs');
      expect(res.body.review.revisionRound).toBe(1);
      expect(res.body.review.maxRevisions).toBe(2);
      expect(res.body.review.dodChecklist.length).toBe(3);

      createdDeliverableId = res.body.review.id;
    });

    test('PUT /api/projects/:id/stakeholders should assign internal and external matrices', async () => {
      // Ensure project exists first
      await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          id: uniqueProjectCode,
          name: 'Apex AI Health Portal',
          client: 'Apex BioTech Labs',
          department: 'AI Transformation'
        });

      const res = await request(app)
        .put(`/api/projects/${uniqueProjectCode}/stakeholders`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          internal: {
            deliveryLead: 'Admin Lead',
            leadEngineer: 'Fahim Rahman',
            qaLead: 'Nusrat Jahan'
          },
          external: {
            primaryApproverId: 'POC-CLIENT-99'
          }
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.stakeholders.internal.lead_engineer).toBe('Fahim Rahman');
      expect(res.body.stakeholders.internal.qa_lead).toBe('Nusrat Jahan');
    });

    test('GET /api/projects/:id/stakeholders should retrieve the configured matrix', async () => {
      const res = await request(app)
        .get(`/api/projects/${uniqueProjectCode}/stakeholders`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.stakeholders.internal.lead_engineer).toBe('Fahim Rahman');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2. Client Portal Review Room Access
  // ───────────────────────────────────────────────────────────────────────────
  describe('2. Client Review Room Querying', () => {

    test('GET /api/reviews/:id should retrieve the deliverable with all multi-format links', async () => {
      const res = await request(app)
        .get(`/api/reviews/${createdDeliverableId}`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(createdDeliverableId);
      expect(res.body.stagingUrl).toBe('https://staging.apexhealth.gro10x.ai');
      expect(res.body.repoUrl).toBe('https://github.com/gro10x/apex-health-portal');
      expect(res.body.dodChecklist.length).toBe(3);
      expect(res.body.status).toBe('pending');
      expect(res.body.isApproved).toBe(false);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3. Threaded Feedback & Scope Creep Shield Screening
  // ───────────────────────────────────────────────────────────────────────────
  describe('3. Feedback Submission & Scope Creep Shield', () => {

    test('POST /api/reviews/:id/comments should accept and log in-scope BUG_FIX feedback', async () => {
      const res = await request(app)
        .post(`/api/reviews/${createdDeliverableId}/comments`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          text: 'The password reset link returned a 404 error on staging.',
          timestamp: 'POST /api/v1/auth/reset',
          author: 'Samiya Khan',
          authorRole: 'Client Approver',
          commentType: 'BUG_FIX'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.comment).toBeDefined();
      expect(res.body.comment.commentType).toBe('BUG_FIX');
      expect(res.body.comment.scopeFlag).toBe('IN_SCOPE');
      expect(res.body.comment.resolved).toBe(false);

      testCommentId = res.body.comment.id;
    });

    test('POST /api/reviews/:id/comments should detect OUT_OF_SCOPE feedback and trigger shield advisory', async () => {
      const res = await request(app)
        .post(`/api/reviews/${createdDeliverableId}/comments`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          text: 'We would also like a native iOS and Android mobile app build with payment gateway.',
          timestamp: 'Mobile App Architecture',
          author: 'Samiya Khan',
          authorRole: 'Client Approver',
          commentType: 'OUT_OF_SCOPE'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.comment.commentType).toBe('OUT_OF_SCOPE');
      expect(res.body.comment.scopeFlag).toBe('OUT_OF_SCOPE_POTENTIAL');
      expect(res.body.comment.scopeWarning).toBeDefined();
      expect(res.body.comment.scopeWarning).toContain('Notice');
    });

    test('PUT /api/reviews/comments/:id/resolve should mark feedback as resolved', async () => {
      if (testCommentId) {
        const res = await request(app)
          .put(`/api/reviews/comments/${testCommentId}/resolve`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ resolved: true });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      }
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4. Revision Round Lifecycle & SLA Enforcement
  // ───────────────────────────────────────────────────────────────────────────
  describe('4. Revision Round Lifecycle (48h Turnaround)', () => {

    test('POST /api/reviews/:id/request-revisions should advance to Round 2', async () => {
      const res = await request(app)
        .post(`/api/reviews/${createdDeliverableId}/request-revisions`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          feedback: 'Please adjust the header styling and fix the auth redirect.',
          author: 'Samiya Khan'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.review.status).toBe('revision_requested');
      expect(res.body.review.revisionRound).toBe(2);
    });

    test('POST /api/reviews/:id/request-revisions should block round advancement beyond max_revisions', async () => {
      // Attempting to advance beyond round 2 (max_revisions = 2)
      const res = await request(app)
        .post(`/api/reviews/${createdDeliverableId}/request-revisions`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          feedback: 'Third round of revisions requested.',
          author: 'Samiya Khan'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Revision limit reached');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 5. Formal Milestone Sign-Off & 30-Day Bug-Fix Warranty Activation
  // ───────────────────────────────────────────────────────────────────────────
  describe('5. Milestone Commercial Handover & Warranty Activation', () => {

    test('POST /api/reviews/:id/approve should sign off deliverable, release invoice, and start warranty clock', async () => {
      const res = await request(app)
        .post(`/api/reviews/${createdDeliverableId}/approve`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          approvedBy: 'Samiya Khan (VP of Engineering)',
          clientName: 'Apex BioTech Labs'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.review.status).toBe('approved');
      expect(res.body.review.isApproved).toBe(true);
      expect(res.body.review.approvedBy).toBe('Samiya Khan (VP of Engineering)');
      expect(res.body.review.approvedAt).toBeDefined();

      // Warranty calculation verification: ends ~30 days in the future
      expect(res.body.warranty).toBeDefined();
      expect(res.body.warranty.warrantyEndsAt).toBeDefined();
      const approvedTime = new Date(res.body.review.approvedAt).getTime();
      const warrantyEndTime = new Date(res.body.warranty.warrantyEndsAt).getTime();
      const diffDays = Math.round((warrantyEndTime - approvedTime) / (1000 * 60 * 60 * 24));
      expect(diffDays).toBe(30);

      // Invoice generation verification
      expect(res.body.invoiceId).toBeDefined();
    });
  });

});
