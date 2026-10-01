/**
 * tests/subphase_1_6_leads_persistence.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Sub-Phase 1.6: Lead Operations Dual-Store Persistence & Offline Fallback
 * ─────────────────────────────────────────────────────────────────────────────
 * Verifies:
 * 1. POST /api/leads dual-persists lead into data/db.json via writeDB
 * 2. PUT /api/leads/:id updates stage/notes without 503 and syncs to data/db.json
 * 3. POST /api/leads/bulk persists all imported CSV leads into data/db.json
 * 4. POST /api/leads/ai-audit calculates AI scorecard and dual-persists lead to data/db.json
 * 5. POST /api/leads/:id/convert converts lead into active client CRM record in data/db.json
 * 6. DELETE /api/leads/:id removes lead cleanly from data/db.json without 503
 * 7. Clean teardown: restores pristine database state
 */

const fs = require('fs');
const path = require('path');
const request = require('supertest');
const app = require('../server');
const { signToken } = require('../src/services/jwt');
const { readDB, writeDB } = require('../src/services/db');

const DB_JSON_PATH = path.join(__dirname, '../data/db.json');

describe('Sub-Phase 1.6: Lead Operations Dual-Store Persistence & writeDB Sync', () => {
  const adminToken = signToken({
    userId: 'EMP-MD-001',
    name: 'Mehedi Bin Jayed',
    role: 'Managing Director',
    accessLevel: 'Owner / Admin',
    department: 'Executive',
    linkedType: 'team'
  });

  const testCompany = `FinTech Wave ${Date.now()}`;
  let originalDbBackup = null;
  let testLeadId = null;
  let bulkLeadIds = [];
  let aiAuditLeadId = null;

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

      // Cleanup Supabase test rows
      const { supabase, isSupabaseConfigured } = require('../src/services/supabase');
      if (isSupabaseConfigured()) {
        if (testLeadId) await supabase.from('leads').delete().eq('id', testLeadId);
        if (aiAuditLeadId) await supabase.from('leads').delete().eq('id', aiAuditLeadId);
        for (const bId of bulkLeadIds) {
          await supabase.from('leads').delete().eq('id', bId);
        }
        await supabase.from('leads').delete().ilike('company', '%FinTech Wave%');
        await supabase.from('clients').delete().ilike('name', '%FinTech Wave%');
      }
    } catch (_) {}
  });

  test('1. POST /api/leads creates lead and dual-persists to data/db.json', async () => {
    const uniqueEmail = `zubair_${Date.now()}@fintechwave.com`;
    const uniquePhone = `+8801711${Math.floor(100000 + Math.random() * 900000)}`;
    const res = await request(app)
      .post('/api/leads')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        company: testCompany,
        contactPerson: 'Zubair Hossain',
        email: uniqueEmail,
        phone: uniquePhone,
        service: 'AI Agents & Automation',
        source: 'Website Form',
        value: '75000'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.lead).toBeDefined();
    expect(res.body.lead.id).toBeDefined();

    testLeadId = res.body.lead.id;

    // Direct disk verification in data/db.json
    const diskDb = JSON.parse(fs.readFileSync(DB_JSON_PATH, 'utf8'));
    expect(Array.isArray(diskDb.leads)).toBe(true);
    const persisted = diskDb.leads.find(l => l.id === testLeadId);
    expect(persisted).toBeDefined();
    expect(persisted.company).toBe(testCompany);
    expect(persisted.score).toBeGreaterThan(0);
  });

  test('2. PUT /api/leads/:id updates lead stage and notes without 503 and syncs to disk', async () => {
    expect(testLeadId).toBeDefined();

    const res = await request(app)
      .put(`/api/leads/${testLeadId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        stage: 'Proposal Sent',
        notes: 'Enterprise solution proposal dispatched via executive channel.'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.lead).toBeDefined();
    expect(res.body.lead.stage).toBe('Proposal Sent');

    // Direct disk verification in data/db.json
    const diskDb = JSON.parse(fs.readFileSync(DB_JSON_PATH, 'utf8'));
    const persisted = diskDb.leads.find(l => l.id === testLeadId);
    expect(persisted).toBeDefined();
    expect(persisted.stage).toBe('Proposal Sent');
    expect(persisted.notes).toContain('Enterprise solution proposal dispatched');
  });

  test('3. POST /api/leads/bulk inserts batch of leads and persists into data/db.json', async () => {
    const bulkPayload = [
      {
        company: `${testCompany} Bulk 1`,
        contactPerson: 'Rahim Khan',
        email: 'rahim@fintechwave.com',
        phone: '+8801811223344',
        service: 'Custom CRM Pipeline'
      },
      {
        company: `${testCompany} Bulk 2`,
        contactPerson: 'Karim Ahmed',
        email: 'karim@fintechwave.com',
        phone: '+8801911223344',
        service: 'AI Voice Agent'
      }
    ];

    const res = await request(app)
      .post('/api/leads/bulk')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ leads: bulkPayload });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(2);

    // Direct disk verification
    const diskDb = JSON.parse(fs.readFileSync(DB_JSON_PATH, 'utf8'));
    const bulk1 = diskDb.leads.find(l => l.company === `${testCompany} Bulk 1`);
    const bulk2 = diskDb.leads.find(l => l.company === `${testCompany} Bulk 2`);
    expect(bulk1).toBeDefined();
    expect(bulk2).toBeDefined();

    bulkLeadIds.push(bulk1.id, bulk2.id);
  });

  test('4. POST /api/leads/ai-audit calculates readiness score and dual-persists lead to data/db.json', async () => {
    const res = await request(app)
      .post('/api/leads/ai-audit')
      .send({
        companyName: `${testCompany} Enterprise AI`,
        contactName: 'Nadia Islam',
        email: 'nadia@fintechwave.com',
        phone: '+8801700112233',
        currentTechStack: ['PostgreSQL', 'Python', 'React', 'Docker'],
        dataReadiness: 'clean_relational_db',
        automationPriority: 'internal_ops',
        monthlyBudgetUsd: 3500
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.scorecard).toBeDefined();
    expect(res.body.scorecard.score).toBeGreaterThanOrEqual(60);

    aiAuditLeadId = res.body.leadId;
    expect(aiAuditLeadId).toBeDefined();

    // Direct disk verification in data/db.json
    const diskDb = JSON.parse(fs.readFileSync(DB_JSON_PATH, 'utf8'));
    const auditLead = diskDb.leads.find(l => l.id === aiAuditLeadId);
    expect(auditLead).toBeDefined();
    expect(auditLead.company).toBe(`${testCompany} Enterprise AI`);
    expect(auditLead.score).toBeGreaterThanOrEqual(60);
  });

  test('5. POST /api/leads/:id/convert converts lead into client CRM record and dual-persists to data/db.json', async () => {
    expect(testLeadId).toBeDefined();

    const res = await request(app)
      .post(`/api/leads/${testLeadId}/convert`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.client).toBeDefined();
    expect(res.body.client.id).toMatch(/^CLI-/);
    expect(res.body.lead.stage).toBe('Won / Closed');

    const createdClientId = res.body.client.id;

    // Direct disk verification in data/db.json
    const diskDb = JSON.parse(fs.readFileSync(DB_JSON_PATH, 'utf8'));
    
    // Check client in diskDb.clients
    expect(Array.isArray(diskDb.clients)).toBe(true);
    const persistedClient = diskDb.clients.find(c => c.id === createdClientId || c.name === testCompany);
    expect(persistedClient).toBeDefined();

    // Check lead in diskDb.leads marked Won / Closed with client_id
    const persistedLead = diskDb.leads.find(l => l.id === testLeadId);
    expect(persistedLead).toBeDefined();
    expect(persistedLead.stage).toBe('Won / Closed');
    expect(persistedLead.client_id).toBe(createdClientId);
  });

  test('6. DELETE /api/leads/:id removes lead cleanly from data/db.json without 503', async () => {
    expect(testLeadId).toBeDefined();

    const res = await request(app)
      .delete(`/api/leads/${testLeadId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    // Direct disk verification
    const diskDb = JSON.parse(fs.readFileSync(DB_JSON_PATH, 'utf8'));
    const found = diskDb.leads.find(l => l.id === testLeadId);
    expect(found).toBeUndefined();
  });
});
