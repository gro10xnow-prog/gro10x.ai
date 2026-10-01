/**
 * tests/subphase_3_2_stakeholder_events.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Sub-Phase 3.2: Route Core Lifecycle Events Through stakeholderEvents
 * ─────────────────────────────────────────────────────────────────────────────
 * Verifies that the centralized Stakeholder Event Bus receives and dispatches:
 * 1. 'lead.created' on POST /api/leads
 * 2. 'lead.won' and 'lead.lost' on PUT /api/leads/:id stage transitions
 * 3. 'lead.converted' and 'lead.won' on POST /api/leads/:id/convert
 * 4. 'proposal.created' on POST /api/proposals
 * 5. 'proposal.converted' on POST /api/proposals/:id/convert-to-project
 * 6. 'client.onboarded' on POST /api/clients
 * 7. Internal EventBus wildcard '*' fan-out and SSE telemetry broadcast
 */

const fs = require('fs');
const path = require('path');
const request = require('supertest');
const app = require('../server');
const { signToken } = require('../src/services/jwt');
const { readDB, writeDB } = require('../src/services/db');
const { stakeholderEvents } = require('../src/services/stakeholder-events');
const sse = require('../src/services/sse');

const DB_JSON_PATH = path.join(__dirname, '../data/db.json');

describe('Sub-Phase 3.2: Stakeholder Event Bus Core Lifecycle Routing', () => {
  const adminToken = signToken({
    userId: 'EMP-MD-001',
    name: 'Mehedi Bin Jayed',
    role: 'Managing Director',
    accessLevel: 'Owner / Admin',
    department: 'Executive',
    linkedType: 'team'
  });

  let originalDbBackup = null;
  let testLeadId = null;
  let testProposalId = null;
  let testClientId = null;

  beforeAll(async () => {
    if (fs.existsSync(DB_JSON_PATH)) {
      originalDbBackup = fs.readFileSync(DB_JSON_PATH, 'utf8');
    }
  });

  afterAll(async () => {
    try {
      if (originalDbBackup) {
        fs.writeFileSync(DB_JSON_PATH, originalDbBackup, 'utf8');
      }

      // Cleanup Supabase test rows if configured
      const { supabase, isSupabaseConfigured } = require('../src/services/supabase');
      if (isSupabaseConfigured()) {
        if (testLeadId) await supabase.from('leads').delete().eq('id', testLeadId);
        if (testProposalId) await supabase.from('proposals').delete().eq('id', testProposalId);
        if (testClientId) await supabase.from('clients').delete().eq('id', testClientId);
        await supabase.from('leads').delete().ilike('company', '%Quantum Logistics%');
        await supabase.from('clients').delete().ilike('name', '%Quantum Logistics%');
      }
    } catch (_) {}
  });

  test('1. POST /api/leads emits "lead.created" through stakeholderEvents', async () => {
    const emitSpy = jest.spyOn(stakeholderEvents, 'emitEvent');
    const timestamp = Date.now();

    const res = await request(app)
      .post('/api/leads')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        company: `Quantum Logistics ${timestamp}`,
        contactPerson: 'Adnan Sami',
        email: `adnan_${timestamp}@quantumlogistics.bd`,
        phone: '+8801712003344',
        service: 'SPRINT-01',
        source: 'Website Form',
        value: '10000'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    testLeadId = res.body.lead.id;

    // Verify emitEvent called with 'lead.created'
    const leadCreatedCall = emitSpy.mock.calls.find(c => c[0] === 'lead.created');
    expect(leadCreatedCall).toBeDefined();
    expect(leadCreatedCall[1].lead).toBeDefined();
    expect(leadCreatedCall[1].lead.id).toBe(testLeadId);

    emitSpy.mockRestore();
  });

  test('2. PUT /api/leads/:id stage transition emits "lead.won" and "lead.lost"', async () => {
    const emitSpy = jest.spyOn(stakeholderEvents, 'emitEvent');

    // Transition to 'Won / Closed'
    const resWon = await request(app)
      .put(`/api/leads/${testLeadId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ stage: 'Won / Closed' });

    expect(resWon.statusCode).toBe(200);
    expect(resWon.body.success).toBe(true);

    const wonCall = emitSpy.mock.calls.find(c => c[0] === 'lead.won');
    expect(wonCall).toBeDefined();
    expect(wonCall[1].lead.id).toBe(testLeadId);
    expect(wonCall[1].lead.stage).toBe('Won / Closed');

    // Transition to 'Lost'
    const resLost = await request(app)
      .put(`/api/leads/${testLeadId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ stage: 'Lost' });

    expect(resLost.statusCode).toBe(200);
    expect(resLost.body.success).toBe(true);

    const lostCall = emitSpy.mock.calls.find(c => c[0] === 'lead.lost');
    expect(lostCall).toBeDefined();
    expect(lostCall[1].lead.id).toBe(testLeadId);
    expect(lostCall[1].lead.stage).toBe('Lost');

    emitSpy.mockRestore();
  });

  test('3. POST /api/leads/:id/convert emits "lead.converted" and "lead.won"', async () => {
    const emitSpy = jest.spyOn(stakeholderEvents, 'emitEvent');

    const res = await request(app)
      .post(`/api/leads/${testLeadId}/convert`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.client).toBeDefined();

    const convertCall = emitSpy.mock.calls.find(c => c[0] === 'lead.converted');
    expect(convertCall).toBeDefined();
    expect(convertCall[1].lead.id).toBe(testLeadId);
    expect(convertCall[1].client.id).toBe(res.body.client.id);

    const wonCall = emitSpy.mock.calls.find(c => c[0] === 'lead.won');
    expect(wonCall).toBeDefined();

    emitSpy.mockRestore();
  });

  test('4. POST /api/proposals emits "proposal.created"', async () => {
    const emitSpy = jest.spyOn(stakeholderEvents, 'emitEvent');
    const timestamp = Date.now();

    const res = await request(app)
      .post('/api/proposals')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        clientName: 'Nadia Khan',
        clientCompany: `Aura Cosmetics ${timestamp}`,
        clientEmail: `nadia_${timestamp}@auracosmetics.com`,
        projectTitle: 'AI Beauty Advisor Chatbot',
        oneTimeItems: [{ name: 'Chatbot Build', amount: 35000 }],
        currency: 'BDT'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.proposal).toBeDefined();
    expect(res.body.proposal.id).toBeDefined();
    testProposalId = res.body.proposal.id;

    const propCreatedCall = emitSpy.mock.calls.find(c => c[0] === 'proposal.created');
    expect(propCreatedCall).toBeDefined();
    expect(propCreatedCall[1].proposal.id).toBe(testProposalId);

    emitSpy.mockRestore();
  });

  test('5. POST /api/proposals/:id/convert-to-project emits "proposal.converted"', async () => {
    const emitSpy = jest.spyOn(stakeholderEvents, 'emitEvent');

    const res = await request(app)
      .post(`/api/proposals/${testProposalId}/convert-to-project`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.projectId).toBeDefined();

    const propConvertedCall = emitSpy.mock.calls.find(c => c[0] === 'proposal.converted');
    expect(propConvertedCall).toBeDefined();
    expect(propConvertedCall[1].proposal.id).toBe(testProposalId);
    expect(propConvertedCall[1].project.id).toBe(res.body.projectId);

    emitSpy.mockRestore();
  });

  test('6. POST /api/clients emits "client.onboarded"', async () => {
    const emitSpy = jest.spyOn(stakeholderEvents, 'emitEvent');
    const timestamp = Date.now();

    const res = await request(app)
      .post('/api/clients')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: `Summit Global FinTech ${timestamp}`,
        contactPerson: 'Kamran Akmal',
        email: `kamran_${timestamp}@summitglobal.io`,
        phone: '+8801911223344',
        category: 'FinTech',
        status: 'Active Retainer'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.client).toBeDefined();
    testClientId = res.body.client.id;

    const clientOnboardCall = emitSpy.mock.calls.find(c => c[0] === 'client.onboarded');
    expect(clientOnboardCall).toBeDefined();
    expect(clientOnboardCall[1].client).toBeDefined();

    emitSpy.mockRestore();
  });

  test('7. Direct emitEvent dispatches "*" wildcard SSE event broadcast', async () => {
    const sseSpy = jest.spyOn(sse, 'broadcast');

    await stakeholderEvents.emitEvent('test.event_dispatched', {
      testKey: 'testVal'
    }, {
      stakeholderId: 'TEST-001'
    });

    const sseCall = sseSpy.mock.calls.find(c => c[0] === 'stakeholder_event');
    expect(sseCall).toBeDefined();
    expect(sseCall[1].event).toBe('test.event_dispatched');
    expect(sseCall[1].testKey).toBe('testVal');

    sseSpy.mockRestore();
  });
});
