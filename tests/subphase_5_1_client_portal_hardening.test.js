/**
 * tests/subphase_5_1_client_portal_hardening.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Sub-Phase 5.1: Client Portal: Brief, Lock-In & Campaign Modules Hardening
 * ─────────────────────────────────────────────────────────────────────────────
 * Verifies:
 * 1. POST /api/projects/intake receives client intake brief, creates project,
 *    matches delivery pod, and emits real-time 'brief_update' SSE event
 * 2. POST /api/clients/:id/lockin-specs/:specId/kickoff transitions spec status to
 *    IN_PROGRESS, provisions project, and emits 'sprint_kickoff' SSE event
 * 3. POST /api/reviews/:id/approve signs off deliverable, activates 30-day warranty,
 *    releases Milestone 2 invoice, and broadcasts 'warranty_update' SSE
 */

const fs = require('fs');
const path = require('path');
const request = require('supertest');
const app = require('../server');
const { signToken } = require('../src/services/jwt');
const { readDB, writeDB } = require('../src/services/db');
const sse = require('../src/services/sse');

const DB_JSON_PATH = path.join(__dirname, '../data/db.json');

describe('Sub-Phase 5.1: Client Portal Modules Hardening', () => {
  const testClientId = 'CLI-PORTAL-501';
  const testSpecId = 'SPEC-PORTAL-501';
  const testReviewId = 'REV-PORTAL-501';

  const clientToken = signToken({
    userId: testClientId,
    linkedId: testClientId,
    name: 'Apex Global Technologies',
    role: 'Client Partner',
    accessLevel: 'Client',
    linkedType: 'client'
  });

  const adminToken = signToken({
    userId: 'EMP-ADM-501',
    name: 'Firoz Admin',
    role: 'Technology Admin',
    accessLevel: 'Technology Admin',
    department: 'Executive',
    linkedType: 'team'
  });

  let originalDbBackup = null;
  let createdProjectId = null;

  beforeAll(async () => {
    if (fs.existsSync(DB_JSON_PATH)) {
      originalDbBackup = fs.readFileSync(DB_JSON_PATH, 'utf8');
    }

    const db = await readDB();
    db.clients = db.clients || [];
    db.clients = db.clients.filter(c => c.id !== testClientId);
    db.clients.push({
      id: testClientId,
      name: 'Apex Global Technologies',
      email: 'partnerships@apexglobal.tech',
      status: 'Active',
      retainerHours: 40,
      hourlyRate: 65
    });

    db.lockin_specs = db.lockin_specs || [];
    db.lockin_specs = db.lockin_specs.filter(s => s.id !== testSpecId);
    db.lockin_specs.push({
      id: testSpecId,
      client_id: testClientId,
      canonical_service_code: 'SVC-AI-01',
      service_title: 'AI Multi-Agent RAG Pipeline MVP',
      status: 'LOCKED',
      prerequisites_checklist: [
        { id: 'PRE-1', name: 'GitHub Repo Access', status: 'RECEIVED' },
        { id: 'PRE-2', name: 'OpenAI / Anthropic API Key', status: 'VERIFIED' }
      ],
      delivery_and_governance: {
        turnaround_days: 14
      },
      scope_boundaries: {
        definition_of_done: 'Production ready vector search pipeline deployed to Vercel.'
      }
    });

    db.reviews = db.reviews || [];
    db.reviews = db.reviews.filter(r => r.id !== testReviewId);
    db.reviews.push({
      id: testReviewId,
      client_id: testClientId,
      client: 'Apex Global Technologies',
      client_email: 'partnerships@apexglobal.tech',
      project_name: 'AI Multi-Agent RAG Pipeline MVP',
      project_id: 'PRJ-TEST-501',
      status: 'In Review',
      is_approved: false,
      video_url: 'https://cdn.gro10x.ai/demo-cut.mp4',
      milestoneAmount: 3500,
      milestoneAmountBdt: 411250,
      created_at: new Date().toISOString()
    });

    await writeDB(db);
  });

  afterAll(async () => {
    try {
      if (originalDbBackup) {
        fs.writeFileSync(DB_JSON_PATH, originalDbBackup, 'utf8');
      }

      const { supabase, isSupabaseConfigured } = require('../src/services/supabase');
      if (isSupabaseConfigured()) {
        if (createdProjectId) await supabase.from('projects').delete().eq('id', createdProjectId);
        await supabase.from('reviews').delete().eq('id', testReviewId);
      }
    } catch (_) {}
  });

  test('1. POST /api/projects/intake registers client brief and emits brief_update SSE', async () => {
    const sseSpy = jest.spyOn(sse, 'broadcast');

    const res = await request(app)
      .post('/api/projects/intake')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        title: 'Autonomous Growth Analytics Agent',
        objective: 'Build real-time revenue attribution pipeline',
        timeline: '14-Day Delivery',
        deliverables: ['Custom AI Agent', 'Next.js Analytics Dashboard'],
        description: 'Multi-rail attribution pipeline integrating Stripe and bKash webhooks',
        budget: 185000
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.project).toBeDefined();
    expect(res.body.podRecommendation).toBeDefined();

    createdProjectId = res.body.project.id;
    expect(res.body.project.name).toBe('Autonomous Growth Analytics Agent');

    // Verify brief_update SSE broadcast
    expect(sseSpy).toHaveBeenCalledWith('brief_update', expect.objectContaining({
      brief: expect.objectContaining({ name: 'Autonomous Growth Analytics Agent' })
    }));

    sseSpy.mockRestore();
  });

  test('2. POST /api/clients/:id/lockin-specs/:specId/kickoff transitions spec and emits sprint_kickoff SSE', async () => {
    const sseSpy = jest.spyOn(sse, 'broadcast');

    const res = await request(app)
      .post(`/api/clients/${testClientId}/lockin-specs/${testSpecId}/kickoff`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        forceKickoff: true,
        clientEmail: 'partnerships@apexglobal.tech'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.spec).toBeDefined();
    expect(res.body.spec.status).toBe('IN_PROGRESS');

    // Verify sprint_kickoff SSE broadcast
    expect(sseSpy).toHaveBeenCalledWith('sprint_kickoff', expect.objectContaining({
      clientId: testClientId,
      specId: testSpecId
    }));

    sseSpy.mockRestore();
  });

  test('3. POST /api/reviews/:id/approve signs off deliverable and activates 30-day warranty', async () => {
    const sseSpy = jest.spyOn(sse, 'broadcast');

    const res = await request(app)
      .post(`/api/reviews/${testReviewId}/approve`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        approverName: 'CTO - Apex Global'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.warranty).toBeDefined();
    expect(res.body.warranty.warrantyDays).toBe(30);
    expect(res.body.milestoneInvoiceReleased).toBe(true);

    // Verify warranty_update SSE broadcast
    expect(sseSpy).toHaveBeenCalledWith('warranty_update', expect.objectContaining({
      warrantyDays: 30,
      isActive: true
    }));

    sseSpy.mockRestore();
  });
});
