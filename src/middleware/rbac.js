/**
 * 🛡️ PURPLEOS ROLE-BASED ACCESS CONTROL (RBAC) MIDDLEWARE
 */

function requireAdmin(req, res, next) {
  // ── PERMISSION MATRIX ──────────────────────────────────────────
  // ADMIN tier: Firoz (PBD-000), Iftekhar (PBD-001), Tariful (PBD-002)
  //   access_level: 'Owner / Admin'
  //   Roles: Technology Admin, Managing Director, Chairman
  // ────────────────────────────────────────────────────────────────
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized: Authentication required' });
  }

  const role = (req.user.profile?.role || req.user.role || '').toLowerCase();
  const access = (req.user.profile?.accessLevel || req.user.accessLevel || '').toLowerCase();
  const empId = req.user.profile?.emp_code || req.user.id || '';

  const isOwnerAdmin =
    ['GRO-001', 'GRO-000', 'PBD-000', 'PBD-001', 'PBD-002'].includes(empId) ||
    access.includes('owner') ||
    access.includes('admin') ||
    access.includes('executive') ||
    role.includes('owner') ||
    role.includes('founder') ||
    role.includes('managing director') ||
    role.includes('chairman') ||
    role.includes('technology admin') ||
    role.includes('executive');

  if (!isOwnerAdmin) {
    return res.status(403).json({ error: 'Forbidden: Owner / Admin privileges required' });
  }

  next();
}

function requireManager(req, res, next) {
  // ── PERMISSION MATRIX ──────────────────────────────────────────
  // MANAGER tier: Director / Manager, Finance Manager (+ all Admin tier)
  //   Covers: all Heads, Directors, Managers, Finance, HR, Operations
  // ────────────────────────────────────────────────────────────────
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized: Authentication required' });
  }

  const role = (req.user.profile?.role || req.user.role || '').toLowerCase();
  const access = (req.user.profile?.accessLevel || req.user.accessLevel || '').toLowerCase();
  const empId = req.user.profile?.emp_code || req.user.id || '';

  const isManagerOrAdmin =
    ['GRO-001', 'GRO-000', 'PBD-000', 'PBD-001', 'PBD-002'].includes(empId) ||
    access.includes('owner') ||
    access.includes('admin') ||
    access.includes('director') ||
    access.includes('manager') ||
    access.includes('executive') ||
    access.includes('leadership') ||
    role.includes('director') ||
    role.includes('manager') ||
    role.includes('head') ||
    role.includes('lead') ||
    role.includes('owner') ||
    role.includes('founder');

  if (!isManagerOrAdmin) {
    return res.status(403).json({ error: 'Forbidden: Department Manager privileges required' });
  }

  next();
}

function requireClientOwnership(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized: Authentication required' });
  }

  const requestedClientId = req.params.clientId || req.params.id || req.query.clientId || req.body.clientId;
  const userLinkedId = req.user.linkedId || req.user.profile?.linkedId || req.user.id;
  const linkedType = req.user.linkedType || req.user.profile?.linkedType || '';

  const role = (req.user.profile?.role || req.user.role || '').toLowerCase();
  const access = (req.user.profile?.accessLevel || req.user.accessLevel || '').toLowerCase();

  const isAdmin = access.includes('owner') || access.includes('admin') || role.includes('owner') || role.includes('director');

  if (isAdmin) {
    return next(); // Admins can access any client data
  }

  if (linkedType === 'client' && userLinkedId && requestedClientId) {
    if (userLinkedId.toLowerCase() === requestedClientId.toLowerCase()) {
      return next();
    }
  }

  return res.status(403).json({ error: 'Forbidden: You do not have permission to access this client account' });
}

module.exports = {
  requireAdmin,
  requireManager,
  requireClientOwnership
};
