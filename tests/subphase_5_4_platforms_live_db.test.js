const request = require('supertest');
const app = require('../server');
const sse = require('../src/services/sse');
const { signToken } = require('../src/services/jwt');
const { readDB, writeDB } = require('../src/services/db');

function createToken(payload) {
  return signToken(payload);
}

describe('Sub-Phase 5.4: Platforms Module Live DB Backend Integration Tests', () => {
  const adminToken = createToken({
    id: 'USR-ADMIN-504',
    userId: 'USR-ADMIN-504',
    role: 'Admin',
    accessLevel: 'Owner / Admin',
    name: 'Executive Admin'
  });

  const customPlatformId = 'pulse-health-ai';
  let sseSpy;

  beforeEach(() => {
    sseSpy = jest.spyOn(sse, 'broadcast').mockImplementation(() => {});
  });

  afterEach(() => {
    sseSpy.mockRestore();
  });

  test('1. GET /api/platforms lists the baseline platform portfolio assets', async () => {
    const res = await request(app).get('/api/platforms');

    expect(res.status).toBe(200);
    expect(res.body.success || res.body.ok).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);

    const ids = res.body.data.map(p => p.id);
    expect(ids).toContain('groupacademy');
    expect(ids).toContain('gro10xcapital');
    expect(ids).toContain('orjon');
    expect(ids).toContain('purpleos');

    // Orjon next action should not be parked
    const orjon = res.body.data.find(p => p.id === 'orjon');
    expect(orjon.nextAction).not.toContain('Parked');
    expect(orjon.nextAction).toContain('Production Database Connected');
  });

  test('2. POST /api/platforms registers a new platform, persists it, and emits platform_update SSE', async () => {
    const newPlatformPayload = {
      id: customPlatformId,
      name: 'Pulse Health AI',
      badge: 'Engine 1: Micro-SaaS',
      engineId: 1,
      tagline: 'Autonomous Clinical Intake & Diagnostic Copilot',
      stage: 'v1.0 Beta',
      stageType: 'mvp',
      readiness: 75,
      stack: 'React 19 · Node.js · Supabase pgvector · Gemini 1.5 Pro',
      dbSchema: 'Clinical Records, Patient Intakes, Diagnostic Triages',
      targetMarket: 'Private BD Hospitals & Diagnostic Centers',
      revenueModel: 'SaaS License BDT 45,000/mo',
      liveUrl: 'https://pulse-health.vercel.app',
      isOwned: true
    };

    const res = await request(app)
      .post('/api/platforms')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(newPlatformPayload);

    expect(res.status).toBe(201);
    expect(res.body.success || res.body.ok).toBe(true);
    expect(res.body.data.id).toBe(customPlatformId);
    expect(res.body.data.name).toBe('Pulse Health AI');

    // Check SSE broadcast
    expect(sseSpy).toHaveBeenCalledWith('platform_update', expect.anything());

    // Verify it appears in GET /api/platforms
    const listRes = await request(app).get('/api/platforms');
    const registered = listRes.body.data.find(p => p.id === customPlatformId);
    expect(registered).toBeDefined();
    expect(registered.name).toBe('Pulse Health AI');
  });

  test('3. DELETE /api/platforms/:id deletes custom platform and broadcasts update', async () => {
    const res = await request(app)
      .delete(`/api/platforms/${customPlatformId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success || res.body.ok).toBe(true);

    // Verify deletion in GET /api/platforms
    const listRes = await request(app).get('/api/platforms');
    const registered = listRes.body.data.find(p => p.id === customPlatformId);
    expect(registered).toBeUndefined();
  });
});
