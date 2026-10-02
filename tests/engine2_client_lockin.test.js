/**
 * tests/engine2_client_lockin.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Engine 2 Sub-Phase 1.3: Client Project Lock-In & Handover Shield Test Suite
 * ─────────────────────────────────────────────────────────────────────────────
 * Validates:
 * Track 1: Multi-POC Governance Roster & Role Authority Validation
 * Track 2: Handover Shield Prerequisite Lifecycle & Dynamic Progress Calculation
 * Track 3: API Endpoint Integration (PUT /api/clients/:id/lockin-specs/:specId/prerequisites/:itemId)
 * Track 4: Real-time Event Emission & Telegram Routing (lockin.prerequisite_submitted)
 * Track 5: POC Addition with Strict Role Assignment & Profile Synchronization
 * ─────────────────────────────────────────────────────────────────────────────
 */

const request = require('supertest');
const app = require('../server');
const { signToken } = require('../src/services/jwt');
const {
  VALID_DECISION_ROLES,
  standardizePOC,
  standardizeClientProfile,
  createProjectLockinSpec,
  getLockinProgress,
  updatePrerequisiteStatus,
  getClientLockinSpecs,
  getLockinSpecById
} = require('../src/services/onboarding-spec');
const { stakeholderEvents } = require('../src/services/stakeholder-events');

describe('Engine 2 Sub-Phase 1.3: Client Project Lock-In & Handover Shield Cockpit', () => {

  const testClientId = `CLI-LOCKIN-${Date.now()}`;
  let clientToken;
  let adminToken;
  let createdSpec;

  beforeAll(async () => {
    clientToken = signToken({
      userId: 'USR-CLIENT-99',
      name: 'Alpha Health Corp',
      role: 'Client Partner',
      accessLevel: 'Client',
      linkedId: testClientId,
      linkedType: 'client'
    });

    adminToken = signToken({
      userId: 'EMP-001',
      name: 'Managing Director',
      role: 'Technology Admin',
      accessLevel: 'Owner / Admin',
      department: 'Executive',
      linkedType: 'team'
    });

    // Create client record in system
    await request(app)
      .post('/api/clients')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        id: testClientId,
        name: 'Alpha Health Corp',
        email: 'contact@alpha.health',
        status: 'Active Retainer'
      });

    // Seed a test project lock-in spec
    createdSpec = await createProjectLockinSpec({
      clientId: testClientId,
      productCode: 'SPRINT-01',
      customInclusions: ['Custom Micro-Service API'],
      customExclusions: ['Legacy database extraction']
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TRACK 1: Multi-POC Governance Roster & Role Authority Validation
  // ─────────────────────────────────────────────────────────────────────────
  describe('Track 1: Multi-POC Governance Roster & Role Authority', () => {
    test('All 4 valid decision roles are supported with strict authority delegation', () => {
      expect(VALID_DECISION_ROLES).toContain('PRIMARY_DECISION_MAKER');
      expect(VALID_DECISION_ROLES).toContain('TECHNICAL_LEAD');
      expect(VALID_DECISION_ROLES).toContain('BILLING_FINANCE');
      expect(VALID_DECISION_ROLES).toContain('DAY_TO_DAY_OPERATOR');

      const primary = standardizePOC({ name: 'Alice CEO', decision_role: 'PRIMARY_DECISION_MAKER' });
      expect(primary.authority.can_sign_sow).toBe(true);
      expect(primary.authority.can_authorize_payment).toBe(true);
      expect(primary.authority.can_approve_deliverables).toBe(true);

      const tech = standardizePOC({ name: 'Bob CTO', decision_role: 'TECHNICAL_LEAD' });
      expect(tech.authority.can_sign_sow).toBe(false);
      expect(tech.authority.can_authorize_payment).toBe(false);
      expect(tech.authority.can_approve_deliverables).toBe(true);

      const finance = standardizePOC({ name: 'Carol CFO', decision_role: 'BILLING_FINANCE' });
      expect(finance.authority.can_sign_sow).toBe(false);
      expect(finance.authority.can_authorize_payment).toBe(true);
      expect(finance.authority.can_approve_deliverables).toBe(false);

      const ops = standardizePOC({ name: 'David Ops', decision_role: 'DAY_TO_DAY_OPERATOR' });
      expect(ops.authority.can_sign_sow).toBe(false);
      expect(ops.authority.can_authorize_payment).toBe(false);
      expect(ops.authority.can_approve_deliverables).toBe(false);
    });

    test('standardizeClientProfile correctly normalizes firmographics and POC roster', () => {
      const client = standardizeClientProfile({
        id: testClientId,
        name: 'Alpha Health Corp',
        contact_person: 'Alice CEO',
        pocs: [
          { name: 'Alice CEO', decision_role: 'PRIMARY_DECISION_MAKER', email: 'alice@alpha.health' },
          { name: 'Bob CTO', decision_role: 'TECHNICAL_LEAD', email: 'bob@alpha.health' }
        ]
      });

      expect(client.id).toBe(testClientId);
      expect(client.pocs.length).toBe(2);
      expect(client.contact_person).toBe('Alice CEO');
      expect(client.billing_info.currency).toBe('USD');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TRACK 2: Handover Shield Prerequisite Lifecycle & Progress Metrics
  // ─────────────────────────────────────────────────────────────────────────
  describe('Track 2: Handover Shield Prerequisite Lifecycle & Progress Metrics', () => {
    test('Calculates real-time progress metrics with getLockinProgress', () => {
      const progress = getLockinProgress(createdSpec);
      expect(progress.total).toBe(5);
      expect(progress.pending).toBe(5);
      expect(progress.received).toBe(0);
      expect(progress.verified).toBe(0);
      expect(progress.percent).toBe(0);
      expect(progress.isReadyForKickoff).toBe(false);
    });

    test('updatePrerequisiteStatus transitions item to RECEIVED and records submission note', async () => {
      const note = 'GitHub org invite dispatched to team@gro10x.ai';
      const result = await updatePrerequisiteStatus(createdSpec.id, 'PRE-01', 'RECEIVED', note);

      expect(result.ok).toBe(true);
      expect(result.newStatus).toBe('RECEIVED');
      expect(result.item.status).toBe('RECEIVED');
      expect(result.item.submission_note).toBe(note);
      expect(result.item.received_at).toBeDefined();

      expect(result.progress.completed).toBe(1);
      expect(result.progress.percent).toBe(20);
    });

    test('updatePrerequisiteStatus transitions item to VERIFIED', async () => {
      const result = await updatePrerequisiteStatus(createdSpec.id, 'PRE-01', 'VERIFIED');
      expect(result.ok).toBe(true);
      expect(result.newStatus).toBe('VERIFIED');
      expect(result.item.status).toBe('VERIFIED');
      expect(result.progress.verified).toBe(1);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TRACK 3: API Endpoint Integration (PUT /prerequisites)
  // ─────────────────────────────────────────────────────────────────────────
  describe('Track 3: API Endpoint Integration & RBAC Protection', () => {
    test('Rejects unauthenticated update requests (401)', async () => {
      const res = await request(app)
        .put(`/api/clients/${testClientId}/lockin-specs/${createdSpec.id}/prerequisites/PRE-02`)
        .set('x-disable-dev-auth', 'true')
        .send({ status: 'RECEIVED', note: 'Token added' });

      expect(res.status).toBe(401);
    });

    test('Rejects unauthorized client updating another client spec (403)', async () => {
      const maliciousClientToken = signToken({
        userId: 'USR-MALICIOUS',
        name: 'Malicious Corp',
        role: 'Client Partner',
        accessLevel: 'Client',
        linkedId: 'CLI-OTHER-CLIENT',
        linkedType: 'client'
      });

      const res = await request(app)
        .put(`/api/clients/${testClientId}/lockin-specs/${createdSpec.id}/prerequisites/PRE-02`)
        .set('Authorization', `Bearer ${maliciousClientToken}`)
        .send({ status: 'RECEIVED' });

      expect(res.status).toBe(403);
    });

    test('Allows authorized client to submit prerequisite credentials (200)', async () => {
      const res = await request(app)
        .put(`/api/clients/${testClientId}/lockin-specs/${createdSpec.id}/prerequisites/PRE-02`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          status: 'RECEIVED',
          note: 'Supabase project ref: db.gro10x.supabase.co'
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.newStatus).toBe('RECEIVED');
      expect(res.body.data.item.submission_note).toContain('Supabase project ref');
      expect(res.body.data.progress).toBeDefined();
    });

    test('GET /api/clients/:id/lockin-specs returns active specs with latest statuses', async () => {
      const res = await request(app)
        .get(`/api/clients/${testClientId}/lockin-specs`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);

      const spec = res.body.data.find(s => s.id === createdSpec.id);
      expect(spec).toBeDefined();
      const p2 = spec.prerequisites_checklist.find(i => i.id === 'PRE-02');
      expect(p2.status).toBe('RECEIVED');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TRACK 4: Stakeholder Event Bus Routing
  // ─────────────────────────────────────────────────────────────────────────
  describe('Track 4: Stakeholder Event Bus Routing', () => {
    test('stakeholderEvents emits lockin.prerequisite_submitted without crashing', async () => {
      const emitSpy = jest.spyOn(stakeholderEvents, 'routeTelegramNotification');

      const result = await stakeholderEvents.emitEvent('lockin.prerequisite_submitted', {
        clientId: testClientId,
        specId: createdSpec.id,
        itemId: 'PRE-03',
        item: { name: 'Third-Party Gateway API Credentials', category: 'API_KEYS' },
        submissionNote: 'OpenAI API key configured in env',
        progress: { completed: 3, total: 5, percent: 60 },
        clientName: 'Alpha Health Corp'
      });

      expect(result.success).toBe(true);
      expect(emitSpy).toHaveBeenCalled();
      emitSpy.mockRestore();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TRACK 5: Authorized POC Registration & Role Authority
  // ─────────────────────────────────────────────────────────────────────────
  describe('Track 5: Authorized POC Registration & Profile Synchronization', () => {
    test('POST /api/clients/:id/pocs registers a new technical lead POC', async () => {
      const res = await request(app)
        .post(`/api/clients/${testClientId}/pocs`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          name: 'Tariq Rahman',
          email: 'tariq@alpha.health',
          phone: '+8801700112233',
          decision_role: 'TECHNICAL_LEAD',
          designation: 'Principal Architect'
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.poc.name).toBe('Tariq Rahman');
      expect(res.body.poc.decision_role).toBe('TECHNICAL_LEAD');
      expect(res.body.poc.authority.can_approve_deliverables).toBe(true);
      expect(res.body.poc.authority.can_sign_sow).toBe(false);
    });
  });
});
