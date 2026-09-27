/**
 * src/utils/engine-scope.js
 * ─────────────────────────────────────────────────────────────────────────────
 * GRO10X 5-Engine Scoping & Normalization Utility
 * Standardizes engine identification, user assignment, and request-level scoping
 * across the Unified Web Workspace and Backend APIs.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const VALID_ENGINES = ['engine1', 'engine2', 'engine3', 'engine4', 'engine5'];

/**
 * Normalizes any string representation into a canonical engine identifier.
 * e.g., '1', 'e1', 'Engine1', 'ENGINE_1' -> 'engine1'
 *       'all', 'ALL', '*' -> 'all'
 */
function normalizeEngineId(input) {
  if (!input) return null;
  const s = String(input).trim().toLowerCase().replace(/[-_\s]/g, '');

  if (s === 'all' || s === '*' || s === 'aggregate') return 'all';

  if (s === '1' || s === 'e1' || s === 'engine1') return 'engine1';
  if (s === '2' || s === 'e2' || s === 'engine2') return 'engine2';
  if (s === '3' || s === 'e3' || s === 'engine3') return 'engine3';
  if (s === '4' || s === 'e4' || s === 'engine4') return 'engine4';
  if (s === '5' || s === 'e5' || s === 'engine5') return 'engine5';

  return null;
}

/**
 * Derives an employee's assigned primary engine based on their department,
 * role, or explicit profile properties.
 */
function resolveUserEngine(user) {
  if (!user) return 'engine2';

  const prof = user.profile || {};
  const explicitEngine = normalizeEngineId(user.assignedEngine || prof.assigned_engine || prof.assignedEngine);
  if (explicitEngine && explicitEngine !== 'all') {
    return explicitEngine;
  }

  const role = String(user.role || prof.role || '').toLowerCase();
  const dept = String(user.department || prof.department || '').toLowerCase();
  const access = String(user.accessLevel || prof.accessLevel || prof.access_level || '').toLowerCase();

  // Executive / Central Command defaults to all engines
  if (
    access.includes('owner') ||
    access.includes('admin') ||
    role.includes('owner') ||
    role.includes('founder') ||
    role.includes('managing director') ||
    role.includes('chairman') ||
    role.includes('technology admin')
  ) {
    return 'all';
  }

  // Engine 3: Digital Commerce, DBM, Etsy, Print-on-Demand, Physical goods
  if (
    dept.includes('brand') ||
    dept.includes('dbm') ||
    dept.includes('etsy') ||
    dept.includes('commerce') ||
    role.includes('brand manager') ||
    role.includes('dbm')
  ) {
    return 'engine3';
  }

  // Engine 5: Video, Media, Animation, Creator scale
  if (
    dept.includes('video') ||
    dept.includes('media') ||
    dept.includes('youtube') ||
    role.includes('video') ||
    role.includes('animator') ||
    role.includes('editor')
  ) {
    return 'engine5';
  }

  // Engine 4: Managed Retainers, DevCare, B2B Accounts
  if (
    dept.includes('retainer') ||
    dept.includes('devcare') ||
    dept.includes('support') ||
    dept.includes('client accounts') ||
    role.includes('account manager')
  ) {
    return 'engine4';
  }

  // Engine 1: Micro-SaaS, Proprietary Software, AI Token Platforms
  if (dept.includes('saas') || role.includes('saas') || role.includes('product engineer')) {
    return 'engine1';
  }

  // Default to Engine 2 (AI Agency & Sprints) for general production / creative / tech staff
  return 'engine2';
}

/**
 * Resolves the active engine scope for an incoming HTTP request.
 * Takes into account query parameters, headers, user seniority, and user engine assignment.
 */
function resolveEngineScope(req) {
  const queryEngine = normalizeEngineId(req.query?.engineId || req.query?.engine || req.query?.engine_tag);
  const headerEngine = normalizeEngineId(req.headers?.['x-gro10x-engine']);
  const requestedEngine = queryEngine || headerEngine;

  const user = req.user;
  const userEngine = resolveUserEngine(user);
  const userTier = Number(user?.seniorityTier) || 1;

  // Tier 3 (Command) can access any requested engine or 'all'
  if (userTier >= 3) {
    const activeEngine = requestedEngine || 'all';
    return {
      engineId: activeEngine,
      isAll: activeEngine === 'all',
      isAuthorized: true
    };
  }

  // Tier 1 & 2: If no engine requested or user requests their assigned engine, allow it
  if (!requestedEngine || requestedEngine === userEngine) {
    return {
      engineId: userEngine,
      isAll: false,
      isAuthorized: true
    };
  }

  // Tier 2 Managers with cross-engine oversight (or 'all' userEngine)
  if (userEngine === 'all') {
    return {
      engineId: requestedEngine,
      isAll: requestedEngine === 'all',
      isAuthorized: true
    };
  }

  // Specialist/Manager attempting to view an engine they are not assigned to
  return {
    engineId: userEngine, // Fall back safely to assigned engine
    isAll: false,
    isAuthorized: false,
    attemptedEngine: requestedEngine
  };
}

module.exports = {
  VALID_ENGINES,
  normalizeEngineId,
  resolveUserEngine,
  resolveEngineScope
};
