/**
 * 🛡️ GRO10X ROLE-BASED ACCESS CONTROL (RBAC) & SENIORITY GOVERNANCE MIDDLEWARE
 * ─────────────────────────────────────────────────────────────────────────────
 * Implements the 3-Tier Seniority Standard for the Unified Multi-Engine OS:
 *   Tier 1 (Execution): Specialist, Crew, BD, Developer, Designer
 *   Tier 2 (Operational Review): Supervisor, Department Manager, QC Lead
 *   Tier 3 (Command & Governance): Engine Lead, CXO, Director, Founder
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { resolveUserEngine } = require('../utils/engine-scope');

/**
 * Evaluates an authenticated user and returns their authoritative Seniority Tier (1, 2, or 3).
 * @param {object} user - Authenticated user object from req.user
 * @returns {number} 1, 2, or 3
 */
function getSeniorityTier(user) {
  if (!user) return 1;

  const prof = user.profile || {};
  const role = String(user.role || prof.role || '').toLowerCase();
  const access = String(user.accessLevel || prof.accessLevel || prof.access_level || '').toLowerCase();
  const empId = String(user.emp_code || user.id || prof.emp_code || '').toUpperCase();

  // ── TIER 3: COMMAND & GOVERNANCE ─────────────────────────────
  // Founders, Executive Leadership, Managing Directors, Chairman, Engine Leads, Tech Admins
  const isTier3 =
    ['GRO-000', 'GRO-001', 'GRO-002', 'GRO-005', 'PBD-000', 'PBD-001', 'PBD-002', 'PBD-005', 'GRO-TEST', 'QA-ADMIN'].includes(empId) ||
    access.includes('owner') ||
    access.includes('admin') ||
    access.includes('executive') ||
    role.includes('owner') ||
    role.includes('founder') ||
    role.includes('managing director') ||
    role.includes('chairman') ||
    role.includes('technology admin') ||
    role.includes('engine lead') ||
    role.includes('director') ||
    role.includes('cxo') ||
    (role.includes('executive') && !role.includes('development') && !role.includes('bd') && !role.includes('sales') && !role.includes('account executive'));

  if (isTier3) return 3;

  // ── TIER 2: OPERATIONAL REVIEW & MANAGEMENT ──────────────────
  // Department Managers, Supervisors, QC Leads, Pod Leads, Operations Coordinators
  // Note: 'Digital Brand Manager' (DBM) is an execution role (Tier 1) unless explicitly lead/head
  const isDBMSpecialist = (role.includes('digital brand') || role.includes('dbm')) &&
    !role.includes('lead') && !role.includes('head') && !role.includes('director');

  const isTier2 = !isDBMSpecialist && (
    access.includes('director') ||
    access.includes('manager') ||
    access.includes('leadership') ||
    access.includes('supervisor') ||
    role.includes('manager') ||
    role.includes('supervisor') ||
    role.includes('head') ||
    role.includes('lead') ||
    role.includes('coordinator') ||
    role.includes('qc')
  );

  if (isTier2) return 2;

  // ── TIER 1: EXECUTION & DELIVERY ─────────────────────────────
  // Specialists, Crew Members, Digital Brand Managers, BD Executives, Developers, Designers
  return 1;
}

/**
 * Middleware factory requiring a minimum Seniority Tier (1, 2, or 3).
 * @param {number} minTier - Minimum required seniority tier
 */
function requireSeniority(minTier) {
  return function (req, res, next) {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required' });
    }

    const currentTier = req.user.seniorityTier || getSeniorityTier(req.user);
    // Enrich req.user with evaluated tier if not already present
    req.user.seniorityTier = currentTier;
    req.user.seniorityTitle = currentTier === 3 ? 'Tier 3 (Command)' : (currentTier === 2 ? 'Tier 2 (Review)' : 'Tier 1 (Execution)');

    if (currentTier < minTier) {
      return res.status(403).json({
        error: `Forbidden: Seniority Tier ${minTier} required`,
        requiredTier: minTier,
        currentTier,
        currentRole: req.user.role
      });
    }

    next();
  };
}

/**
 * Backward-Compatible: Requires Tier 3 (Admin / Executive Command)
 */
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized: Authentication required' });
  }

  const tier = req.user.seniorityTier || getSeniorityTier(req.user);
  req.user.seniorityTier = tier;

  if (tier < 3) {
    return res.status(403).json({ error: 'Forbidden: Owner / Admin privileges required' });
  }

  next();
}

/**
 * Backward-Compatible: Requires Tier 2+ (Department Manager / Operational Review)
 */
function requireManager(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized: Authentication required' });
  }

  const tier = req.user.seniorityTier || getSeniorityTier(req.user);
  req.user.seniorityTier = tier;

  if (tier < 2) {
    return res.status(403).json({ error: 'Forbidden: Department Manager privileges required' });
  }

  next();
}

/**
 * Client Ownership check for External Client Partner Portal
 */
function requireClientOwnership(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized: Authentication required' });
  }

  const requestedClientId = req.params.clientId || req.params.id || req.query.clientId || req.body.clientId;
  const userLinkedId = req.user.linkedId || req.user.profile?.linkedId || req.user.id;
  const linkedType = req.user.linkedType || req.user.profile?.linkedType || '';

  const tier = req.user.seniorityTier || getSeniorityTier(req.user);
  if (tier >= 3) {
    return next(); // Admins and Tier 3 leads can access any client data
  }

  if (linkedType === 'client' && userLinkedId && requestedClientId) {
    if (userLinkedId.toLowerCase() === requestedClientId.toLowerCase()) {
      return next();
    }
  }

  return res.status(403).json({ error: 'Forbidden: You do not have permission to access this client account' });
}

/**
 * Digital Brand Manager / E-Commerce Specialist Access Guard
 */
function requireDBM(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized: Authentication required' });
  }

  const tier = req.user.seniorityTier || getSeniorityTier(req.user);
  if (tier >= 2) {
    return next(); // Managers and Admins always pass
  }

  const role = (req.user.profile?.role || req.user.role || '').toLowerCase();
  const access = (req.user.profile?.accessLevel || req.user.accessLevel || '').toLowerCase();
  const empId = req.user.profile?.emp_code || req.user.id || '';

  const isAuthorized =
    ['GRO-000', 'GRO-001', 'GRO-002', 'GRO-005', 'GRO-TEST', 'PBD-000', 'PBD-001', 'PBD-002', 'PBD-005'].includes(empId) ||
    access.includes('brand') ||
    access.includes('specialist') ||
    access.includes('crew') ||
    role.includes('brand') ||
    role.includes('dbm') ||
    role.includes('digital brand') ||
    role.includes('etsy') ||
    role.includes('specialist');

  if (!isAuthorized) {
    return res.status(403).json({ error: 'Forbidden: Digital Brand Manager or Admin privileges required' });
  }

  next();
}

module.exports = {
  getSeniorityTier,
  requireSeniority,
  requireAdmin,
  requireManager,
  requireDBM,
  requireClientOwnership
};
