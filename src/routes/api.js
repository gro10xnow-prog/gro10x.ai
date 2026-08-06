/**
 * src/routes/api.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Central Express Router Registry for PurpleOS Backend v2.0.
 * Mounts all domain routers, public catalog endpoints, and version metadata.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const { readDB } = require('../services/db');
const { supabase, isSupabaseConfigured } = require('../services/supabase');
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/rbac');
const { validateInput } = require('../middleware/validate');
const { ok, fail, asyncHandler } = require('../utils/response');

// Mount Payload Validation Middleware
router.use(validateInput);

// Import Modular Domain Routers
const authRoutes = require('./auth');
const clientsRoutes = require('./clients');
const leadsRoutes = require('./leads');
const tasksRoutes = require('./tasks');
const reviewsRoutes = require('./reviews');
const invoicesRoutes = require('./invoices');
const teamRoutes = require('./team');
const postsRoutes = require('./posts');
const cmsRoutes = require('./cms');
const analyticsRoutes = require('./analytics');
const automationRoutes = require('./automation');
const managerRoutes = require('./manager');
const expensesRoutes = require('./expenses');
const assetsRoutes = require('./assets');
const leavesRoutes = require('./leaves');
const cronRoutes = require('./cron');
const paymentsRoutes = require('./payments');
const ticketsRoutes = require('./tickets');
const projectsRoutes = require('./projects');
const labelsRoutes = require('./labels');
const customFieldsRoutes = require('./custom-fields');
const taskTemplatesRoutes = require('./task-templates');
const chatRoutes = require('./chat');
const adminImportRoutes = require('./admin-import');
const workflowsRoutes = require('./workflows');

// System Version Endpoint
router.get('/version', (req, res) => {
  const pkg = require('../../package.json');
  return ok(res, { version: pkg.version });
});

// Canonical Sub-Router Mounting
router.use('/auth', authRoutes);
router.use('/clients', clientsRoutes);
router.use('/leads', leadsRoutes);
router.use('/tasks', tasksRoutes);
router.use('/workflows', workflowsRoutes);
router.use('/projects', projectsRoutes);
router.use('/reviews', reviewsRoutes);
router.use('/invoices', invoicesRoutes);
router.use('/payments', paymentsRoutes);
router.use('/tickets', ticketsRoutes);
router.use('/team', teamRoutes);
router.use('/posts', postsRoutes);
router.use('/cms', cmsRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/automation', automationRoutes);
router.use('/cron', cronRoutes);
router.use('/manager', managerRoutes);
router.use('/admin/import', adminImportRoutes);
router.use('/expenses', expensesRoutes);
router.use('/assets', assetsRoutes);
router.use('/leaves', leavesRoutes);
router.use('/labels', labelsRoutes);
router.use('/custom-fields', customFieldsRoutes);
router.use('/task-templates', taskTemplatesRoutes);
router.use('/chat', chatRoutes);

// Public Client Phone Check (used by chat widget — rate-limited & safe)
router.get('/public/client-check', asyncHandler(async (req, res) => {
  const { phone } = req.query;
  if (!phone) return ok(res, { found: false });
  const norm = String(phone).replace(/[^0-9]/g, '').slice(-10);
  if (isSupabaseConfigured() && norm.length >= 6) {
    try {
      const { data } = await supabase.from('clients').select('id,name,phone').ilike('phone', `%${norm}%`).maybeSingle();
      if (data) return ok(res, { found: true, name: data.name });
    } catch (e) {}
  }
  return ok(res, { found: false });
}));

// Public Services Catalog Endpoint
router.get('/services', asyncHandler(async (req, res) => {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('services').select('*');
      if (!error && data && data.length > 0) {
        return ok(res, data.map(s => ({ ...s, includedFeatures: s.included_features, public: s.is_public })));
      }
    } catch (err) {}
  }
  const db = await readDB();
  return ok(res, db.services || []);
}));

// Full DB State Snapshot (Admin only)
router.get('/db', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const db = await readDB();
  return ok(res, db);
}));

module.exports = router;
