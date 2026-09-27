/**
 * tests/operational_onboarding_workflow.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Comprehensive Integration Test Suite for Engine 2:
 * Operational Client Onboarding, Proposal Acceptance Auto-Bridge & Sprint Kickoff
 * Validates:
 * 1. Proposal Acceptance Auto-Bridge (SOW Sign -> Auto Client Org & Lock-In Spec)
 * 2. Client Prerequisite Handover Shield (PENDING -> RECEIVED)
 * 3. Agency Admin Prerequisite Verification (RECEIVED -> VERIFIED)
 * 4. Production Sprint Kickoff (Locked Scope -> Active Project with 14-Day Clock)
 * 5. Multi-POC Authority Management
 * ─────────────────────────────────────────────────────────────────────────────
 */

const request = require('supertest');
const app = require('../server');
const { signToken } = require('../src/services/jwt');

describe('Engine 2: Operational Onboarding & Project Lock-In Workflow Tests', () => {

  const adminToken = signToken({
    userId: 'EMP-001',
    name: 'Admin Lead',
    role: 'Technology Admin',
    accessLevel: 'Owner / Admin',
    department: 'Management',
    linkedType: 'team'
  });

  const testToken = `test-sow-token-${Date.now().toString().slice(-6)}`;
  let shareToken = testToken;
  let proposalId = null;
  let clientId = null;
  let specId = null;

  // ───────────────────────────────────────────────────────────────────────────
  // 1. Proposal Acceptance Auto-Bridge Test
  // ───────────────────────────────────────────────────────────────────────────
  describe('1. Proposal Acceptance & Auto-Initialization', () => {

    test('POST /api/proposals should create a proposal with a shareable token', async () => {
      const res = await request(app)
        .post('/api/proposals')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          share_token: testToken,
          client_name: 'Dr. Tariqul Alam',
          client_company: 'Apex BioTech Labs',
          client_email: `tariqul_${Date.now()}@apexbio.tech`,
          client_phone: '+880 1711-998877',
          project_title: 'Full-Stack SaaS MVP Sprint for Clinical Trials',
          project_summary: '14-day production delivery of compliant clinical SaaS application.',
          canonical_service_code: 'SVC-001',
          scope_items: [
            { title: 'Core UI/UX Prototype', description: 'Interactive clickable Figma design' },
            { title: 'PostgreSQL Database & RLS', description: 'Supabase schema with multi-tenant isolation' }
          ],
          one_time_items: [
            { name: '14-Day SaaS MVP Sprint', description: 'Complete MVP delivery', amount: 2500 }
          ],
          currency: 'USD',
          timeline: '14 Working Days'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.proposal).toBeDefined();
      proposalId = res.body.proposal.id;
      shareToken = res.body.proposal.shareToken || testToken;
    });

    test('POST /api/public/proposals/:token/accept should auto-create client and lock-in spec', async () => {
      const res = await request(app)
        .post(`/api/public/proposals/${shareToken}/accept`)
        .send({
          acceptedBy: 'Dr. Tariqul Alam',
          clientNote: 'Approved. Aiming to kick off our trial recruitment immediately.'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.proposal.status).toBe('Accepted');
      expect(res.body.clientId).toBeDefined();
      expect(res.body.specId).toMatch(/^SPEC-/);
      expect(res.body.onboardingUrl).toContain('/client#lockin?specId=');

      clientId = res.body.clientId;
      specId = res.body.specId;

      // Verify Lock-In Spec properties
      expect(res.body.lockinSpec).toBeDefined();
      expect(res.body.lockinSpec.canonical_service_code).toBe('SVC-001');
      expect(res.body.lockinSpec.status).toBe('LOCKED');
      expect(res.body.lockinSpec.prerequisites_checklist.length).toBe(5);
      expect(res.body.lockinSpec.scope_boundaries.core_inclusions.length).toBeGreaterThan(0);
      expect(res.body.lockinSpec.scope_boundaries.explicit_exclusions.length).toBeGreaterThan(0);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2. Client Prerequisite Handover Submission
  // ───────────────────────────────────────────────────────────────────────────
  describe('2. Client Prerequisite Handover Submission', () => {

    test('PUT /api/clients/:id/lockin-specs/:specId/prerequisites/:itemId should submit credentials', async () => {
      expect(clientId).toBeDefined();
      expect(specId).toBeDefined();

      // Submit GitHub access (PRE-01)
      const res1 = await request(app)
        .put(`/api/clients/${clientId}/lockin-specs/${specId}/prerequisites/PRE-01`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'RECEIVED' });

      expect(res1.status).toBe(200);
      expect(res1.body.ok).toBe(true);
      expect(res1.body.data.item.status).toBe('RECEIVED');
      expect(res1.body.data.item.received_at).toBeDefined();

      // Submit Cloud Credentials (PRE-02)
      const res2 = await request(app)
        .put(`/api/clients/${clientId}/lockin-specs/${specId}/prerequisites/PRE-02`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'RECEIVED' });

      expect(res2.status).toBe(200);
      expect(res2.body.data.item.status).toBe('RECEIVED');
    });

    test('Reject invalid prerequisite status', async () => {
      const res = await request(app)
        .put(`/api/clients/${clientId}/lockin-specs/${specId}/prerequisites/PRE-01`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'INVALID_STATUS' });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3. Agency Admin Prerequisite Verification
  // ───────────────────────────────────────────────────────────────────────────
  describe('3. Agency Admin Prerequisite Verification', () => {

    test('Admin should verify received prerequisite (PRE-01 -> VERIFIED)', async () => {
      const res = await request(app)
        .put(`/api/clients/${clientId}/lockin-specs/${specId}/prerequisites/PRE-01`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'VERIFIED' });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.item.status).toBe('VERIFIED');
    });

    test('Sprint kickoff should be blocked if remaining prerequisites are still PENDING without forceKickoff', async () => {
      const res = await request(app)
        .post(`/api/clients/${clientId}/lockin-specs/${specId}/kickoff`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ forceKickoff: false });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
      expect(res.body.error).toContain('prerequisites are still PENDING');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4. Production Sprint Kickoff
  // ───────────────────────────────────────────────────────────────────────────
  describe('4. Production Sprint Kickoff & Project Linking', () => {

    test('Admin forces/authorizes sprint kickoff with forceKickoff=true', async () => {
      const res = await request(app)
        .post(`/api/clients/${clientId}/lockin-specs/${specId}/kickoff`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          clientName: 'Apex BioTech Labs',
          forceKickoff: true
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.spec.status).toBe('IN_PROGRESS');
      expect(res.body.spec.project_id).toMatch(/^PRJ-/);
      expect(res.body.project).toBeDefined();
      expect(res.body.project.status).toBe('Active');
      expect(res.body.project.start_date).toBeDefined();
      expect(res.body.project.due_date).toBeDefined();
    });

    test('GET /api/clients/:id/lockin-specs/:specId reflects IN_PROGRESS status', async () => {
      const res = await request(app)
        .get(`/api/clients/${clientId}/lockin-specs/${specId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.status).toBe('IN_PROGRESS');
      expect(res.body.data.project_id).toBeDefined();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 5. Multi-POC Governance Integration
  // ───────────────────────────────────────────────────────────────────────────
  describe('5. Multi-POC Governance Integration', () => {

    test('POST /api/clients/:id/pocs should delegate roles and authority', async () => {
      // Add a Technical Lead
      const techRes = await request(app)
        .post(`/api/clients/${clientId}/pocs`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Nabil Hasan',
          designation: 'VP of Engineering',
          decision_role: 'TECHNICAL_LEAD',
          email: 'nabil@apexbio.tech',
          phone: '+880 1811-223344'
        });

      expect(techRes.status).toBe(200);
      expect(techRes.body.ok).toBe(true);
      expect(techRes.body.poc.decision_role).toBe('TECHNICAL_LEAD');
      expect(techRes.body.poc.authority.can_approve_deliverables).toBe(true);
      expect(techRes.body.poc.authority.can_sign_sow).toBe(false);

      // Add a Billing Contact
      const finRes = await request(app)
        .post(`/api/clients/${clientId}/pocs`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Farzana Haque',
          designation: 'Finance Controller',
          decision_role: 'BILLING_FINANCE',
          email: 'farzana@apexbio.tech',
          phone: '+880 1911-334455'
        });

      expect(finRes.status).toBe(200);
      expect(finRes.body.ok).toBe(true);
      expect(finRes.body.poc.decision_role).toBe('BILLING_FINANCE');
      expect(finRes.body.poc.authority.can_authorize_payment).toBe(true);
      expect(finRes.body.poc.authority.can_approve_deliverables).toBe(false);
    });
  });

  afterAll(async () => {
    const { supabase, isSupabaseConfigured } = require('../src/services/supabase');
    if (isSupabaseConfigured() && clientId) {
      try { await supabase.from('clients').delete().eq('id', clientId); } catch (e) {}
    }
  });
});
