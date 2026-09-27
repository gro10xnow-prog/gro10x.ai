/**
 * tests/rbac-engine-scoping.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Comprehensive Test Suite for 3-Tier Seniority RBAC & Engine Scoping Core
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { getSeniorityTier, requireSeniority, requireAdmin, requireManager } = require('../src/middleware/rbac');
const { normalizeEngineId, resolveUserEngine, resolveEngineScope } = require('../src/utils/engine-scope');
const { enrichUserContext } = require('../src/middleware/auth');
const request = require('supertest');
const { signToken } = require('../src/services/jwt');

describe('🛡️ 3-Tier Seniority RBAC & Engine Scoping Core', () => {

  describe('1. Role & Seniority Classification (getSeniorityTier)', () => {
    test('Tier 3: Executive Leadership & Founders resolve to Tier 3', () => {
      expect(getSeniorityTier({ role: 'Managing Director', accessLevel: 'Owner / Admin' })).toBe(3);
      expect(getSeniorityTier({ role: 'Agency Founder & Master Owner' })).toBe(3);
      expect(getSeniorityTier({ role: 'Chairman', accessLevel: 'Executive' })).toBe(3);
      expect(getSeniorityTier({ role: 'Technology Admin', emp_code: 'GRO-000' })).toBe(3);
      expect(getSeniorityTier({ emp_code: 'GRO-001' })).toBe(3);
      expect(getSeniorityTier({ emp_code: 'GRO-002' })).toBe(3);
      expect(getSeniorityTier({ emp_code: 'GRO-005' })).toBe(3);
      expect(getSeniorityTier({ role: 'Engine Lead', department: 'Micro-SaaS' })).toBe(3);
    });

    test('Tier 2: Operational Managers & Supervisors resolve to Tier 2', () => {
      expect(getSeniorityTier({ role: 'Department Manager', department: 'Production' })).toBe(2);
      expect(getSeniorityTier({ role: 'Creative Supervisor', accessLevel: 'Supervisor' })).toBe(2);
      expect(getSeniorityTier({ role: 'Operations Coordinator', accessLevel: 'Coordinator' })).toBe(2);
      expect(getSeniorityTier({ role: 'QC Lead Inspector' })).toBe(2);
      expect(getSeniorityTier({ role: 'Pod Lead', accessLevel: 'Lead' })).toBe(2);
    });

    test('Tier 1: Specialists, Crew, and Execution Team resolve to Tier 1', () => {
      expect(getSeniorityTier({ role: 'Specialist', accessLevel: 'Specialist / Crew' })).toBe(1);
      expect(getSeniorityTier({ role: 'Digital Brand Manager', department: 'Brand Operations' })).toBe(1);
      expect(getSeniorityTier({ role: 'Video Editor & Motion Designer' })).toBe(1);
      expect(getSeniorityTier({ role: 'Business Development Executive' })).toBe(1);
      expect(getSeniorityTier({ role: 'Junior Fullstack Engineer' })).toBe(1);
      expect(getSeniorityTier(null)).toBe(1);
    });
  });

  describe('2. Seniority Middleware Gating (requireSeniority)', () => {
    let req, res, next;

    beforeEach(() => {
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };
      next = jest.fn();
    });

    test('Rejects unauthenticated request with 401', () => {
      req = { user: null };
      const middleware = requireSeniority(2);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('Unauthorized') }));
      expect(next).not.toHaveBeenCalled();
    });

    test('Tier 1 specialist is blocked from Tier 2 manager route with 403', () => {
      req = {
        user: {
          id: 'EMP-001',
          role: 'Specialist',
          accessLevel: 'Specialist / Crew'
        }
      };

      const middleware = requireSeniority(2);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        requiredTier: 2,
        currentTier: 1
      }));
      expect(next).not.toHaveBeenCalled();
    });

    test('Tier 2 manager passes Tier 2 route', () => {
      req = {
        user: {
          id: 'MGR-001',
          role: 'Department Manager',
          accessLevel: 'Manager'
        }
      };

      const middleware = requireSeniority(2);
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user.seniorityTier).toBe(2);
      expect(req.user.seniorityTitle).toBe('Tier 2 (Review)');
    });

    test('Tier 2 manager is blocked from Tier 3 executive route with 403', () => {
      req = {
        user: {
          id: 'MGR-001',
          role: 'Department Manager',
          accessLevel: 'Manager'
        }
      };

      const middleware = requireSeniority(3);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        requiredTier: 3,
        currentTier: 2
      }));
      expect(next).not.toHaveBeenCalled();
    });

    test('Tier 3 executive passes Tier 1, 2, and 3 routes', () => {
      req = {
        user: {
          id: 'GRO-000',
          role: 'Managing Director',
          accessLevel: 'Owner / Admin'
        }
      };

      const m1 = requireSeniority(1);
      const m2 = requireSeniority(2);
      const m3 = requireSeniority(3);

      m1(req, res, next);
      expect(next).toHaveBeenCalledTimes(1);

      m2(req, res, next);
      expect(next).toHaveBeenCalledTimes(2);

      m3(req, res, next);
      expect(next).toHaveBeenCalledTimes(3);
      expect(req.user.seniorityTier).toBe(3);
      expect(req.user.seniorityTitle).toBe('Tier 3 (Command)');
    });

    test('Backward compatibility: requireManager allows Tier 2 and Tier 3', () => {
      req = { user: { role: 'Department Manager' } };
      requireManager(req, res, next);
      expect(next).toHaveBeenCalled();

      next.mockClear();
      req = { user: { role: 'Agency Founder & Master Owner' } };
      requireManager(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    test('Backward compatibility: requireAdmin allows Tier 3 and blocks Tier 2', () => {
      req = { user: { role: 'Department Manager' } };
      requireAdmin(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);

      next.mockClear();
      req = { user: { role: 'Technology Admin', emp_code: 'GRO-000' } };
      requireAdmin(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('3. Engine Normalization & Scoping (engine-scope.js)', () => {
    test('normalizeEngineId parses diverse formats accurately', () => {
      expect(normalizeEngineId('1')).toBe('engine1');
      expect(normalizeEngineId('e1')).toBe('engine1');
      expect(normalizeEngineId('Engine1')).toBe('engine1');
      expect(normalizeEngineId('engine_2')).toBe('engine2');
      expect(normalizeEngineId('E3')).toBe('engine3');
      expect(normalizeEngineId('engine-4')).toBe('engine4');
      expect(normalizeEngineId('5')).toBe('engine5');
      expect(normalizeEngineId('all')).toBe('all');
      expect(normalizeEngineId('*')).toBe('all');
      expect(normalizeEngineId('invalid')).toBeNull();
      expect(normalizeEngineId(null)).toBeNull();
    });

    test('resolveUserEngine assigns canonical engine by role and department', () => {
      expect(resolveUserEngine({ department: 'Brand Operations' })).toBe('engine3');
      expect(resolveUserEngine({ role: 'Digital Brand Manager' })).toBe('engine3');
      expect(resolveUserEngine({ department: 'Video & Animation' })).toBe('engine5');
      expect(resolveUserEngine({ department: 'Client Retainers & DevCare' })).toBe('engine4');
      expect(resolveUserEngine({ role: 'SaaS Platform Engineer' })).toBe('engine1');
      expect(resolveUserEngine({ role: 'Managing Director' })).toBe('all');
      expect(resolveUserEngine({ role: 'Specialist', department: 'Production' })).toBe('engine2');
    });

    test('resolveEngineScope manages access rights based on seniority', () => {
      // Tier 3 accessing specific engine
      const reqTier3 = {
        user: { seniorityTier: 3, role: 'Owner' },
        query: { engineId: 'engine1' }
      };
      const scopeTier3 = resolveEngineScope(reqTier3);
      expect(scopeTier3.engineId).toBe('engine1');
      expect(scopeTier3.isAll).toBe(false);
      expect(scopeTier3.isAuthorized).toBe(true);

      // Tier 3 with no query defaults to 'all'
      const reqTier3All = {
        user: { seniorityTier: 3, role: 'Owner' },
        query: {}
      };
      const scopeTier3All = resolveEngineScope(reqTier3All);
      expect(scopeTier3All.engineId).toBe('all');
      expect(scopeTier3All.isAll).toBe(true);
      expect(scopeTier3All.isAuthorized).toBe(true);

      // Tier 1 requesting assigned engine
      const reqTier1Assigned = {
        user: { seniorityTier: 1, department: 'Brand Operations' },
        query: { engineId: 'engine3' }
      };
      const scopeTier1 = resolveEngineScope(reqTier1Assigned);
      expect(scopeTier1.engineId).toBe('engine3');
      expect(scopeTier1.isAuthorized).toBe(true);

      // Tier 1 requesting different engine falls back safely with isAuthorized = false
      const reqTier1Diff = {
        user: { seniorityTier: 1, department: 'Brand Operations' },
        query: { engineId: 'engine1' }
      };
      const scopeTier1Diff = resolveEngineScope(reqTier1Diff);
      expect(scopeTier1Diff.engineId).toBe('engine3');
      expect(scopeTier1Diff.isAuthorized).toBe(false);
      expect(scopeTier1Diff.attemptedEngine).toBe('engine1');
    });
  });

  describe('4. Session Enrichment (enrichUserContext)', () => {
    test('Enriches user object with seniority and engine attributes', () => {
      const user = {
        id: 'GRO-000',
        name: 'Firoz Uddin Ahmed',
        role: 'Technology Admin',
        accessLevel: 'Technology Admin'
      };

      const enriched = enrichUserContext(user);
      expect(enriched.seniorityTier).toBe(3);
      expect(enriched.seniorityTitle).toBe('Tier 3 (Command)');
      expect(enriched.assignedEngine).toBe('all');
      expect(enriched.allowedEngines).toEqual(['all', 'engine1', 'engine2', 'engine3', 'engine4', 'engine5']);
    });
  });

  describe('5. HTTP Integration & API Endpoints', () => {
    let server;

    beforeAll(() => {
      server = require('../server.js');
    });

    test('GET /api/auth/me returns enriched seniority and engine scoping', async () => {
      const token = signToken({
        userId: 'PBD-004',
        name: 'Md. Zahin Khandaker',
        role: 'Managing Director',
        accessLevel: 'Owner / Admin',
        department: 'Executive Leadership'
      });

      const res = await request(server)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.seniorityTier).toBe(3);
      expect(res.body.user.seniorityTitle).toBe('Tier 3 (Command)');
      expect(res.body.user.assignedEngine).toBe('all');
      expect(Array.isArray(res.body.user.allowedEngines)).toBe(true);
      expect(res.body.user.allowedEngines).toContain('engine1');
      expect(res.body.user.allowedEngines).toContain('engine2');
    });

    test('GET /api/tasks supports ?engineId= query parameter', async () => {
      const token = signToken({
        userId: 'GRO-000',
        role: 'Technology Admin',
        accessLevel: 'Technology Admin'
      });

      const res = await request(server)
        .get('/api/tasks?engineId=engine2')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('POST /api/expenses/:id/approve-tier2 rejects a Tier 1 user with 403', async () => {
      const token = signToken({
        userId: 'EMP-999',
        name: 'Junior Associate',
        role: 'Specialist',
        accessLevel: 'Specialist / Crew'
      });

      const res = await request(server)
        .post('/api/expenses/EXP-TEST-001/approve-tier2')
        .set('Authorization', `Bearer ${token}`)
        .send({ approvedBy: 'Junior' });

      expect(res.status).toBe(403);
      expect(res.body.requiredTier).toBe(3);
      expect(res.body.currentTier).toBe(1);
    });
  });

});
