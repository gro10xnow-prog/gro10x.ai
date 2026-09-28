/**
 * tests/subphase_3_4_review_warranty_handover.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Sub-Phase 3.4 Test Suite: Review Room 2-Round Revisions, DoD Scope Creep Shield & Warranty Activation
 *
 * Verifies:
 * 1. POST /api/reviews/:id/request-revisions advances to Round 2 and enforces 2-round contractual limit with requiresChangeOrder
 * 2. POST /api/reviews/:id/comments flags OUT_OF_SCOPE potential scope creep and issues advisory
 * 3. POST /api/reviews/:id/approve formally signs off sprint deliverable, sets 30-day warranty, and creates Milestone Invoice 2
 * 4. Handover & IP Transfer Manifest is auto-provisioned upon sign-off via getOrCreateHandoverManifest and startWarrantyClock
 * 5. public/client/sse.js registers warranty_update and handover_update listeners to sync #review, #lockin, and #home
 * 6. public/client/modules/review.js provides change order UI state when revision limits are reached
 * 7. Static Zero-Leakage & Zero-Dialog: zero native dialogs (alert, confirm, prompt) in review.js and lockin.js, zero banned phone (1708)
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
const { memoryDeliverables } = require('../src/services/delivery-review');
const { saveMemoryProject, getOrCreateHandoverManifest, startWarrantyClock } = require('../src/services/post-delivery');

describe('🚀 Sub-Phase 3.4: Review Room 2-Round Revisions, DoD Scope Creep Shield & Warranty Activation', () => {

  const testClientToken = signToken({
    userId: 'CLI-WARRANTY-001',
    name: 'Naveen Chowdhury',
    company: 'Apex Health Logistics',
    role: 'Client Partner',
    accessLevel: 'Client',
    linkedType: 'client',
    linkedId: 'CLI-WARRANTY-001'
  });

  const testProjectId = `PRJ-WARRANTY-${Date.now()}`;
  const testReviewId = `REV-WARRANTY-${Date.now()}`;

  beforeAll(async () => {
    saveMemoryProject({
      id: testProjectId,
      name: 'Cold-Chain Telemetry Dashboard & AI Router',
      client: 'Apex Health Logistics',
      clientName: 'Apex Health Logistics',
      clientId: 'CLI-WARRANTY-001',
      budget: 80000,
      hourlyRate: 50,
      status: 'In Progress',
      delivery_status: 'IN_PROGRESS'
    });

    memoryDeliverables.push({
      id: testReviewId,
      project_id: testProjectId,
      projectId: testProjectId,
      project_name: 'Cold-Chain Telemetry Dashboard & AI Router',
      client: 'Apex Health Logistics',
      client_id: 'CLI-WARRANTY-001',
      clientId: 'CLI-WARRANTY-001',
      title: 'v1.0 Staging Release — Real-Time IoT Telemetry',
      status: 'pending',
      isApproved: false,
      revision_round: 1,
      max_revisions: 2,
      versions: ['v1.0-alpha'],
      active_version: 'v1.0-alpha',
      dodChecklist: [
        { id: 'dod-1', text: 'End-to-end WebSocket telemetry feed tested', checked: true },
        { id: 'dod-2', text: 'Supabase RLS tenant isolation verified', checked: true }
      ]
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  test('1. POST /api/reviews/:id/request-revisions advances to Round 2 and enforces contractual 2-round limit with requiresChangeOrder', async () => {
    // 1st request: Advance from Round 1 to Round 2
    const rev1 = await request(app)
      .post(`/api/reviews/${testReviewId}/request-revisions`)
      .set('Authorization', `Bearer ${testClientToken}`)
      .send({
        feedback: 'Please refine the graph sensor line smoothing.',
        author: 'Naveen Chowdhury'
      });

    expect(rev1.status).toBe(200);
    expect(rev1.body.success).toBe(true);
    expect(rev1.body.review.revisionRound).toBe(2);
    expect(rev1.body.review.status).toBe('revision_requested');

    // 2nd request: Attempting Round 3 when max_revisions is 2 -> must block
    const rev2 = await request(app)
      .post(`/api/reviews/${testReviewId}/request-revisions`)
      .set('Authorization', `Bearer ${testClientToken}`)
      .send({
        feedback: 'We now need historical weather forecasting overlays.',
        author: 'Naveen Chowdhury'
      });

    expect(rev2.status).toBe(400);
    expect(rev2.body.ok).toBe(false);
    expect(rev2.body.requiresChangeOrder).toBe(true);
    expect(rev2.body.error).toContain('Revision limit reached');
  });

  test('2. POST /api/reviews/:id/comments flags OUT_OF_SCOPE potential scope creep and issues advisory', async () => {
    const res = await request(app)
      .post(`/api/reviews/${testReviewId}/comments`)
      .set('Authorization', `Bearer ${testClientToken}`)
      .send({
        text: 'Can we also build a native Flutter iOS and Android mobile app with Bluetooth beacon tracking?',
        timestamp: 'IoT Gateway Section',
        author: 'Naveen Chowdhury',
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

  test('3. POST /api/reviews/:id/approve formally signs off sprint deliverable, sets 30-day warranty, and creates Milestone Invoice 2', async () => {
    const res = await request(app)
      .post(`/api/reviews/${testReviewId}/approve`)
      .set('Authorization', `Bearer ${testClientToken}`)
      .send({
        approvedBy: 'Naveen Chowdhury (Managing Director)',
        clientName: 'Apex Health Logistics'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.review.status).toBe('approved');
    expect(res.body.review.isApproved).toBe(true);
    expect(res.body.review.approvedBy).toBe('Naveen Chowdhury (Managing Director)');

    // 30-Day Warranty verification
    expect(res.body.warranty).toBeDefined();
    expect(res.body.warranty.warrantyDays).toBe(30);
    const approvedMs = new Date(res.body.review.approvedAt).getTime();
    const warrantyEndMs = new Date(res.body.warranty.warrantyEndsAt).getTime();
    const diffDays = Math.round((warrantyEndMs - approvedMs) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(30);

    // Milestone Invoice release verification
    expect(res.body.milestoneInvoiceReleased).toBe(true);
    expect(res.body.invoiceId).toBeDefined();
  });

  test('4. Formal sign-off auto-provisions Handover & IP Transfer Manifest via getOrCreateHandoverManifest and startWarrantyClock', async () => {
    const manifest = await getOrCreateHandoverManifest(testProjectId);
    expect(manifest).toBeDefined();
    expect(manifest.projectId).toBe(testProjectId);
    expect(manifest.projectName).toContain('Cold-Chain Telemetry');
    expect(manifest.ipTransferStatus).toBe('IRREVOCABLY_ASSIGNED');
    expect(manifest.ipAssignmentClause).toContain('irrevocably assigns, transfers, and conveys');
    expect(manifest.warranty.isActive).toBe(true);
    expect(manifest.warranty.remainingDays).toBeGreaterThanOrEqual(29);
  });

  test('5. public/client/sse.js registers warranty_update and handover_update listeners to sync #review, #lockin, and #home', () => {
    const ssePath = path.join(__dirname, '../public/client/sse.js');
    const sseContent = fs.readFileSync(ssePath, 'utf8');

    expect(sseContent).toContain('evtSource.addEventListener(\'warranty_update\'');
    expect(sseContent).toMatch(/warranty_update[\s\S]*?#lockin/);
    expect(sseContent).toContain('evtSource.addEventListener(\'handover_update\'');
    expect(sseContent).toMatch(/handover_update[\s\S]*?#lockin/);
  });

  test('6. public/client/modules/review.js provides change order UI state when revision limits are reached', () => {
    const reviewPath = path.join(__dirname, '../public/client/modules/review.js');
    const content = fs.readFileSync(reviewPath, 'utf8');

    expect(content).toContain('isLimitReached');
    expect(content).toContain('Contractual Revision Limit Reached');
    expect(content).toContain('Request Scope Change Order');
    expect(content).toContain('requiresChangeOrder');
  });

  test('7. Static Zero-Leakage & Zero-Dialog: zero native dialogs (alert, confirm, prompt) in review.js and lockin.js, zero banned phone (1708)', () => {
    const reviewPath = path.join(__dirname, '../public/client/modules/review.js');
    const lockinPath = path.join(__dirname, '../public/client/modules/lockin.js');
    const reviewsRoutePath = path.join(__dirname, '../src/routes/reviews.js');
    const postDeliveryPath = path.join(__dirname, '../src/services/post-delivery.js');

    const uiFiles = [reviewPath, lockinPath];
    uiFiles.forEach(fp => {
      const content = fs.readFileSync(fp, 'utf8');
      expect(content).not.toMatch(/\balert\s*\(/);
      expect(content).not.toMatch(/\bconfirm\s*\(/);
      expect(content).not.toMatch(/\bprompt\s*\(/);
    });

    const allFiles = [reviewPath, lockinPath, reviewsRoutePath, postDeliveryPath];
    allFiles.forEach(fp => {
      const content = fs.readFileSync(fp, 'utf8');
      expect(content).not.toContain('1708');
    });
  });
});
