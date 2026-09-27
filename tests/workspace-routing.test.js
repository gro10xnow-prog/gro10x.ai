/**
 * tests/workspace-routing.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Integration & Routing Verification for Unified Web Workspace (/workspace)
 * ─────────────────────────────────────────────────────────────────────────────
 */

const request = require('supertest');
const server = require('../server.js');
const { signToken } = require('../src/services/jwt');

describe('🏛️ Unified Web Workspace (/workspace) Routing & Architecture', () => {

  test('1. GET /workspace returns 200 OK and serves index.html shell', async () => {
    const res = await request(server).get('/workspace');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toContain('GRO10X — Unified Multi-Engine Workspace');
    expect(res.text).toContain('engineSwitcherSelect');
    expect(res.text).toContain('workspaceSidebar');
    expect(res.text).toContain('pillar-command');
    expect(res.text).toContain('pillar-growth');
    expect(res.text).toContain('pillar-delivery');
    expect(res.text).toContain('pillar-operations');
  });

  test('2. GET /workspace/ returns 200 OK and serves index.html shell', async () => {
    const res = await request(server).get('/workspace/');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toContain('UNIFIED WORKSPACE');
  });

  test('3. GET /workspace/workspace.js returns 200 OK and serves client controller', async () => {
    const res = await request(server).get('/workspace/workspace.js');
    expect(res.status).toBe(200);
    expect(res.text).toContain('window.WORKSPACE');
    expect(res.text).toContain('switchEngine');
    expect(res.text).toContain('applyRoleFilter');
  });

  test('4. GET /workspace/workspace.css returns 200 OK and serves styles', async () => {
    const res = await request(server).get('/workspace/workspace.css');
    expect(res.status).toBe(200);
    expect(res.text).toContain('.workspace-layout');
    expect(res.text).toContain('.engine-switcher-select');
    expect(res.text).toContain('.user-tier-badge');
  });

  test('5. Session handshake provides Tier & Engine attributes for Workspace', async () => {
    const token = signToken({
      userId: 'GRO-000',
      name: 'Firoz Uddin Ahmed',
      role: 'Technology Admin',
      accessLevel: 'Technology Admin',
      department: 'Tech & AI'
    });

    const res = await request(server)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.seniorityTier).toBe(3);
    expect(res.body.user.seniorityTitle).toBe('Tier 3 (Command)');
    expect(Array.isArray(res.body.user.allowedEngines)).toBe(true);
    expect(res.body.user.allowedEngines).toContain('engine2');
  });

  test('6. Core resources respond properly with engineId scope', async () => {
    const token = signToken({
      userId: 'GRO-000',
      role: 'Technology Admin',
      accessLevel: 'Technology Admin'
    });

    const [tasksRes, leadsRes, expensesRes, leavesRes] = await Promise.all([
      request(server).get('/api/tasks?engineId=engine2').set('Authorization', `Bearer ${token}`),
      request(server).get('/api/leads?engineId=engine2').set('Authorization', `Bearer ${token}`),
      request(server).get('/api/expenses?engineId=engine2').set('Authorization', `Bearer ${token}`),
      request(server).get('/api/leaves?engineId=engine2').set('Authorization', `Bearer ${token}`)
    ]);

    expect(tasksRes.status).toBe(200);
    expect(leadsRes.status).toBe(200);
    expect(expensesRes.status).toBe(200);
    expect(leavesRes.status).toBe(200);
  });

  test('7. GET /crew returns 302 redirecting to /workspace#tasks', async () => {
    const res = await request(server).get('/crew');
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/workspace#tasks');
  });

  test('8. GET /manager returns 302 redirecting to /workspace#overview', async () => {
    const res = await request(server).get('/manager');
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/workspace#overview');
  });

  test('9. GET /dbm returns 302 redirecting to /workspace?engineId=engine3#deliverables', async () => {
    const res = await request(server).get('/dbm');
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/workspace?engineId=engine3#deliverables');
  });

  test('10. GET /dce returns 302 redirecting to /workspace?engineId=engine3#pnl', async () => {
    const res = await request(server).get('/dce');
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/workspace?engineId=engine3#pnl');
  });

  test('11. Canonical public commerce endpoints remain 200 OK', async () => {
    const [storeRes, trackRes, affRes] = await Promise.all([
      request(server).get('/dce/store'),
      request(server).get('/dce/track'),
      request(server).get('/dce/affiliate')
    ]);

    expect(storeRes.status).toBe(200);
    expect(storeRes.text).toContain('PlannerQueen');
    expect(trackRes.status).toBe(200);
    expect(affRes.status).toBe(200);
  });

});
