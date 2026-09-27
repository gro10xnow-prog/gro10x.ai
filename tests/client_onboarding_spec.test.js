/**
 * tests/client_onboarding_spec.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Comprehensive Test Suite for Engine 2 Client Onboarding & Project Lock-In Engine
 * Validates:
 * 1. Multi-POC Schema Standardization & Decision Role Authority Validation
 * 2. Client Organization Profile Normalization (Firmographics & Multi-POC)
 * 3. Canonical Service Technical Scoping Questionnaire Generation
 * 4. Project Lock-In Specification Creation (Scope Boundaries, Exclusions, DoD)
 * 5. Prerequisite Credentials & Asset Tracking (PENDING -> RECEIVED -> VERIFIED)
 * 6. API Endpoints in catalog.js and clients.js
 * ─────────────────────────────────────────────────────────────────────────────
 */

const request = require('supertest');
const app = require('../server');
const { signToken } = require('../src/services/jwt');
const {
  standardizePOC,
  standardizeClientProfile,
  generateScopingQuestionnaire,
  createProjectLockinSpec,
  updatePrerequisiteStatus,
  getClientLockinSpecs,
  getLockinSpecById
} = require('../src/services/onboarding-spec');

describe('Engine 2: Client Onboarding & Project Lock-In Specification Engine', () => {

  const adminToken = signToken({
    userId: 'EMP-001',
    name: 'Admin Lead',
    role: 'Technology Admin',
    accessLevel: 'Owner / Admin',
    department: 'Management',
    linkedType: 'team'
  });

  const testClientId = 'CLI-ONBOARD-TEST-99';

  // ───────────────────────────────────────────────────────────────────────────
  // 1. Multi-POC Standardization & Role Validation
  // ───────────────────────────────────────────────────────────────────────────
  describe('1. Multi-POC Standardization & Role Authority', () => {

    test('standardizePOC should set correct authority flags for PRIMARY_DECISION_MAKER', () => {
      const poc = standardizePOC({
        name: 'Alex Mercer',
        designation: 'Managing Director',
        decision_role: 'PRIMARY_DECISION_MAKER',
        email: 'alex@mercerhealth.ai',
        phone: '+1-555-0199',
        preferred_channel: 'WHATSAPP'
      });

      expect(poc.name).toBe('Alex Mercer');
      expect(poc.decision_role).toBe('PRIMARY_DECISION_MAKER');
      expect(poc.authority.can_sign_sow).toBe(true);
      expect(poc.authority.can_authorize_payment).toBe(true);
      expect(poc.authority.can_approve_deliverables).toBe(true);
      expect(poc.preferred_channel).toBe('WHATSAPP');
    });

    test('standardizePOC should set correct authority flags for TECHNICAL_LEAD', () => {
      const poc = standardizePOC({
        name: 'Dr. Sarah Connor',
        designation: 'Head of Engineering',
        decision_role: 'TECHNICAL_LEAD',
        email: 'sarah@mercerhealth.ai'
      });

      expect(poc.decision_role).toBe('TECHNICAL_LEAD');
      expect(poc.authority.can_sign_sow).toBe(false);
      expect(poc.authority.can_authorize_payment).toBe(false);
      expect(poc.authority.can_approve_deliverables).toBe(true);
    });

    test('standardizePOC should set correct authority flags for BILLING_FINANCE', () => {
      const poc = standardizePOC({
        name: 'Marcus Vance',
        designation: 'Chief Financial Officer',
        decision_role: 'BILLING_FINANCE',
        email: 'marcus@mercerhealth.ai'
      });

      expect(poc.decision_role).toBe('BILLING_FINANCE');
      expect(poc.authority.can_sign_sow).toBe(false);
      expect(poc.authority.can_authorize_payment).toBe(true);
      expect(poc.authority.can_approve_deliverables).toBe(false);
    });

    test('standardizePOC should default invalid roles to DAY_TO_DAY_OPERATOR', () => {
      const poc = standardizePOC({
        name: 'John Intern',
        decision_role: 'SOME_UNKNOWN_ROLE'
      });

      expect(poc.decision_role).toBe('DAY_TO_DAY_OPERATOR');
      expect(poc.authority.can_sign_sow).toBe(false);
      expect(poc.authority.can_authorize_payment).toBe(false);
      expect(poc.authority.can_approve_deliverables).toBe(false);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2. Client Profile Standardization
  // ───────────────────────────────────────────────────────────────────────────
  describe('2. Client Profile Standardization', () => {

    test('standardizeClientProfile should normalize firmographics and POC list', () => {
      const client = standardizeClientProfile({
        id: 'CLI-001',
        name: 'Mercer Health AI Inc',
        legal_name: 'Mercer Health Technologies LLC',
        company_size: '50-100 employees',
        country: 'United States',
        timezone: 'America/New_York (EST)',
        website_url: 'https://mercerhealth.ai',
        billing_info: {
          currency: 'USD',
          tax_id_bin: 'US-987654321'
        },
        pocs: [
          {
            name: 'Alex Mercer',
            decision_role: 'PRIMARY_DECISION_MAKER',
            email: 'alex@mercerhealth.ai'
          },
          {
            name: 'Sarah Connor',
            decision_role: 'TECHNICAL_LEAD',
            email: 'sarah@mercerhealth.ai'
          }
        ]
      });

      expect(client.name).toBe('Mercer Health AI Inc');
      expect(client.legal_name).toBe('Mercer Health Technologies LLC');
      expect(client.company_size).toBe('50-100 employees');
      expect(client.country).toBe('United States');
      expect(client.pocs.length).toBe(2);
      expect(client.contact_person).toBe('Alex Mercer');
      expect(client.email).toBe('alex@mercerhealth.ai');
      expect(client.billing_info.currency).toBe('USD');
    });

    test('standardizeClientProfile should synthesize primary POC if only legacy contact_person exists', () => {
      const client = standardizeClientProfile({
        name: 'QuickStart Ventures',
        contact_person: 'David Kim',
        email: 'david@quickstart.io',
        phone: '+1-555-0100'
      });

      expect(client.pocs.length).toBe(1);
      expect(client.pocs[0].name).toBe('David Kim');
      expect(client.pocs[0].decision_role).toBe('PRIMARY_DECISION_MAKER');
      expect(client.pocs[0].authority.can_sign_sow).toBe(true);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3. Technical Scoping Questionnaire Generation
  // ───────────────────────────────────────────────────────────────────────────
  describe('3. Technical Scoping Questionnaire Generation', () => {

    test('generateScopingQuestionnaire should generate structured questions for SVC-001', async () => {
      const questionnaire = await generateScopingQuestionnaire('SVC-001');

      expect(questionnaire.ok).toBe(true);
      expect(questionnaire.productCode).toBe('SVC-001');
      expect(questionnaire.turnaroundDays).toBe(14);
      expect(Array.isArray(questionnaire.questions)).toBe(true);
      expect(questionnaire.questions.length).toBeGreaterThanOrEqual(5);

      const qIds = questionnaire.questions.map(q => q.id);
      expect(qIds).toContain('Q1_INFRASTRUCTURE');
      expect(qIds).toContain('Q2_DESIGN_ASSETS');
      expect(qIds).toContain('Q3_AUTH_SECURITY');
      expect(qIds).toContain('Q4_INTEGRATIONS');
      expect(qIds).toContain('Q5_SUCCESS_BENCHMARK');
    });

    test('generateScopingQuestionnaire should throw error for invalid product code', async () => {
      await expect(generateScopingQuestionnaire('NON_EXISTENT_SVC')).rejects.toThrow();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4. Project Lock-In Specification Creation
  // ───────────────────────────────────────────────────────────────────────────
  describe('4. Project Lock-In Specification Creation', () => {
    let createdSpec = null;

    test('createProjectLockinSpec should establish comprehensive boundaries and checklist', async () => {
      createdSpec = await createProjectLockinSpec({
        clientId: testClientId,
        productCode: 'SVC-001',
        questionnaireAnswers: {
          Q1_INFRASTRUCTURE: 'Provision a new dedicated Supabase + Vercel stack for our organization',
          Q2_DESIGN_ASSETS: 'We have reference apps and a brand logo, but need GRO10X to design all UX/UI screens',
          Q5_SUCCESS_BENCHMARK: 'Must launch pilot clinic before Nov 1.'
        },
        customInclusions: ['Custom EHR FHIR webhook ingestion'],
        customExclusions: ['Hardware-level Bluetooth stethoscope sync']
      });

      expect(createdSpec.id).toMatch(/^SPEC-/);
      expect(createdSpec.client_id).toBe(testClientId);
      expect(createdSpec.canonical_service_code).toBe('SVC-001');
      expect(createdSpec.status).toBe('LOCKED');

      // Scope boundaries
      expect(createdSpec.scope_boundaries.core_inclusions).toContain('Custom EHR FHIR webhook ingestion');
      expect(createdSpec.scope_boundaries.explicit_exclusions).toContain('Hardware-level Bluetooth stethoscope sync');
      expect(createdSpec.scope_boundaries.explicit_exclusions.some(e => e.includes('Legacy data migration'))).toBe(true);
      expect(createdSpec.scope_boundaries.definition_of_done).toBeDefined();

      // Delivery & Governance
      expect(createdSpec.delivery_and_governance.turnaround_days).toBe(14);
      expect(createdSpec.delivery_and_governance.review_window_hours).toBe(48);
      expect(createdSpec.delivery_and_governance.warranty_days).toBe(30);

      // Prerequisites Checklist (5 items initialized to PENDING)
      expect(Array.isArray(createdSpec.prerequisites_checklist)).toBe(true);
      expect(createdSpec.prerequisites_checklist.length).toBe(5);
      expect(createdSpec.prerequisites_checklist.every(item => item.status === 'PENDING')).toBe(true);

      // Milestone Schedule (50/50)
      expect(createdSpec.milestone_schedule.milestone_1.percent).toBe(50);
      expect(createdSpec.milestone_schedule.milestone_2.percent).toBe(50);
    });

    test('updatePrerequisiteStatus should update item status and evaluate sprint readiness', async () => {
      expect(createdSpec).toBeDefined();

      // Update first prerequisite (PRE-01) to RECEIVED
      const res1 = await updatePrerequisiteStatus(createdSpec.id, 'PRE-01', 'RECEIVED');
      expect(res1.ok).toBe(true);
      expect(res1.item.status).toBe('RECEIVED');
      expect(res1.allPrerequisitesReady).toBe(false);

      // Update remaining prerequisites to RECEIVED
      await updatePrerequisiteStatus(createdSpec.id, 'PRE-02', 'RECEIVED');
      await updatePrerequisiteStatus(createdSpec.id, 'PRE-03', 'RECEIVED');
      await updatePrerequisiteStatus(createdSpec.id, 'PRE-04', 'RECEIVED');
      const resFinal = await updatePrerequisiteStatus(createdSpec.id, 'PRE-05', 'VERIFIED');

      expect(resFinal.ok).toBe(true);
      expect(resFinal.allPrerequisitesReady).toBe(true);
      expect(resFinal.specStatus).toBe('PREREQUISITES_RECEIVED');
    });

    test('getLockinSpecById and getClientLockinSpecs should retrieve created specs', async () => {
      const fetchedSpec = await getLockinSpecById(createdSpec.id);
      expect(fetchedSpec).toBeDefined();
      expect(fetchedSpec.id).toBe(createdSpec.id);

      const clientSpecs = await getClientLockinSpecs(testClientId);
      expect(clientSpecs.length).toBeGreaterThan(0);
      expect(clientSpecs.some(s => s.id === createdSpec.id)).toBe(true);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 5. HTTP API Endpoints Integration Tests
  // ───────────────────────────────────────────────────────────────────────────
  describe('5. HTTP API Endpoints Integration Tests', () => {

    test('GET /api/catalog/services/SVC-001/scoping-questionnaire should return questionnaire', async () => {
      const res = await request(app)
        .get('/api/catalog/services/SVC-001/scoping-questionnaire');

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.productCode).toBe('SVC-001');
      expect(Array.isArray(res.body.data.questions)).toBe(true);
    });

    test('POST /api/clients/:id/pocs should add a new POC to a client', async () => {
      // First ensure client exists or create one
      const clientRes = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          id: testClientId,
          name: 'Apex AI Health Technologies',
          email: 'contact@apexai.health',
          status: 'Active Retainer'
        });

      expect(clientRes.status).toBe(200);

      // Add a Technical Lead POC
      const pocRes = await request(app)
        .post(`/api/clients/${testClientId}/pocs`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Dr. Evelyn Reed',
          designation: 'Lead ML Architect',
          decision_role: 'TECHNICAL_LEAD',
          email: 'evelyn@apexai.health',
          phone: '+1-555-0988',
          preferred_channel: 'SLACK'
        });

      expect(pocRes.status).toBe(200);
      expect(pocRes.body.ok).toBe(true);
      expect(pocRes.body.poc.decision_role).toBe('TECHNICAL_LEAD');
      expect(pocRes.body.poc.authority.can_approve_deliverables).toBe(true);
      expect(pocRes.body.poc.authority.can_sign_sow).toBe(false);
    });

    test('POST /api/clients/:id/lockin-specs should generate locked spec via API', async () => {
      const specRes = await request(app)
        .post(`/api/clients/${testClientId}/lockin-specs`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          productCode: 'SVC-001',
          questionnaireAnswers: {
            Q1_INFRASTRUCTURE: 'Provision a new dedicated Supabase + Vercel stack for our organization'
          },
          customInclusions: ['HIPAA compliant audit logging middleware']
        });

      expect(specRes.status).toBe(201);
      expect(specRes.body.ok).toBe(true);
      expect(specRes.body.spec.id).toMatch(/^SPEC-/);
      expect(specRes.body.spec.scope_boundaries.core_inclusions).toContain('HIPAA compliant audit logging middleware');
      
      const createdId = specRes.body.spec.id;

      // GET /api/clients/:id/lockin-specs
      const listRes = await request(app)
        .get(`/api/clients/${testClientId}/lockin-specs`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.ok).toBe(true);
      expect(listRes.body.count).toBeGreaterThan(0);

      // GET /api/clients/:id/lockin-specs/:specId
      const singleRes = await request(app)
        .get(`/api/clients/${testClientId}/lockin-specs/${createdId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(singleRes.status).toBe(200);
      expect(singleRes.body.ok).toBe(true);
      expect(singleRes.body.data.id).toBe(createdId);

      // PUT prerequisite update
      const updateRes = await request(app)
        .put(`/api/clients/${testClientId}/lockin-specs/${createdId}/prerequisites/PRE-01`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'RECEIVED' });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.ok).toBe(true);
      expect(updateRes.body.data.item.status).toBe('RECEIVED');
    });
  });
});
