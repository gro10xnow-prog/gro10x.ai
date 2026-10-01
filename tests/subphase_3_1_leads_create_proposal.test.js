/**
 * tests/subphase_3_1_leads_create_proposal.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Sub-Phase 3.1: Wire POST /leads/:id/create-proposal to Frontend & Persistence
 * ─────────────────────────────────────────────────────────────────────────────
 * Verifies:
 * 1. POST /api/leads/:id/create-proposal creates proposal from existing lead record
 * 2. Lead stage transitions to 'Proposal Sent' in local data/db.json
 * 3. Proposal record is dual-persisted to db.proposals in data/db.json
 * 4. Real-time SSE broadcasts 'lead_update' and 'proposal_update' are emitted
 * 5. Public share URL and token are generated correctly
 * 6. Fallback parameters work gracefully when lead id not pre-indexed
 * 7. Clean teardown restores original database state
 */

const fs = require('fs');
const path = require('path');
const request = require('supertest');
const app = require('../server');
const { signToken } = require('../src/services/jwt');
const { readDB, writeDB } = require('../src/services/db');
const sse = require('../src/services/sse');

const DB_JSON_PATH = path.join(__dirname, '../data/db.json');

describe('Sub-Phase 3.1: Leads Create Proposal Endpoint & Dual-Store Persistence', () => {
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
  let generatedProposalId = null;

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
        if (generatedProposalId) await supabase.from('proposals').delete().eq('id', generatedProposalId);
      }
    } catch (_) {}
  });

  test('1. Pre-condition: Create a new CRM lead for proposal conversion', async () => {
    const timestamp = Date.now();
    const res = await request(app)
      .post('/api/leads')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        company: `Nexus Retail AI ${timestamp}`,
        contactPerson: 'Tahmid Rahman',
        email: `tahmid_${timestamp}@nexusretail.io`,
        phone: '+8801812345678',
        service: 'SPRINT-01',
        source: 'Outbound LinkedIn',
        value: '5000'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.lead).toBeDefined();
    testLeadId = res.body.lead.id;
    expect(testLeadId).toBeDefined();

    // Verify written to db.json
    const db = await readDB();
    const inDb = (db.leads || []).find(l => l.id === testLeadId);
    expect(inDb).toBeDefined();
    expect(inDb.stage).toBe('New Inquiry');
  });

  test('2. POST /api/leads/:id/create-proposal generates proposal, updates lead stage, and dual-persists', async () => {
    const sseSpy = jest.spyOn(sse, 'broadcast');

    const res = await request(app)
      .post(`/api/leads/${testLeadId}/create-proposal`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.proposalId).toMatch(/^PRP-/);
    expect(res.body.shareToken).toBeDefined();
    expect(res.body.shareUrl).toContain(res.body.shareToken);
    expect(res.body.proposal).toBeDefined();

    generatedProposalId = res.body.proposalId;
    const proposal = res.body.proposal;

    expect(proposal.id).toBe(generatedProposalId);
    expect(proposal.client_name).toBe('Tahmid Rahman');
    expect(proposal.client_company).toContain('Nexus Retail AI');
    expect(proposal.client_email).toContain('nexusretail.io');
    expect(proposal.status).toBe('Draft');
    expect(Array.isArray(proposal.scope_items)).toBe(true);
    expect(proposal.scope_items.length).toBeGreaterThan(0);
    expect(proposal.one_time_total).toBeGreaterThan(0);

    // Verify db.json persistence
    const db = await readDB();
    const persistedProposal = (db.proposals || []).find(p => p.id === generatedProposalId);
    expect(persistedProposal).toBeDefined();
    expect(persistedProposal.share_token).toBe(res.body.shareToken);

    // Verify lead stage updated to 'Proposal Sent'
    const updatedLead = (db.leads || []).find(l => l.id === testLeadId);
    expect(updatedLead).toBeDefined();
    expect(updatedLead.stage).toBe('Proposal Sent');

    // Verify SSE broadcasts
    const calls = sseSpy.mock.calls;
    const leadUpdateBroadcast = calls.find(c => c[0] === 'lead_update');
    const proposalUpdateBroadcast = calls.find(c => c[0] === 'proposal_update');

    expect(leadUpdateBroadcast).toBeDefined();
    expect(leadUpdateBroadcast[1]).toEqual([{ id: testLeadId, stage: 'Proposal Sent' }]);

    expect(proposalUpdateBroadcast).toBeDefined();
    expect(proposalUpdateBroadcast[1][0].id).toBe(generatedProposalId);

    sseSpy.mockRestore();
  });

  test('3. Fallback: POST /api/leads/:id/create-proposal with custom parameters for arbitrary lead', async () => {
    const sseSpy = jest.spyOn(sse, 'broadcast');
    const customId = `LED-UNINDEXED-${Date.now()}`;

    const res = await request(app)
      .post(`/api/leads/${customId}/create-proposal`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        clientName: 'Farhan Kabir',
        clientCompany: 'Apex Logistics Ltd',
        clientEmail: 'farhan@apexlogistics.com',
        clientPhone: '+8801700998877',
        service: 'SVC-002',
        budget: 3500
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.proposal.client_name).toBe('Farhan Kabir');
    expect(res.body.proposal.client_company).toBe('Apex Logistics Ltd');
    expect(res.body.proposal.client_email).toBe('farhan@apexlogistics.com');

    // Check dual-persistence in db.json
    const db = await readDB();
    const fallbackProp = (db.proposals || []).find(p => p.id === res.body.proposalId);
    expect(fallbackProp).toBeDefined();

    sseSpy.mockRestore();
  });

  test('4. Idempotency / Multi-creation handles subsequent proposal creations gracefully', async () => {
    const res = await request(app)
      .post(`/api/leads/${testLeadId}/create-proposal`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.proposalId).toBeDefined();

    // Lead stage remains 'Proposal Sent'
    const db = await readDB();
    const lead = (db.leads || []).find(l => l.id === testLeadId);
    expect(lead.stage).toBe('Proposal Sent');
  });
});
