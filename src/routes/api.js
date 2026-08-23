/**
 * src/routes/api.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Central Express Router Registry for PurpleOS Backend v2.0.
 * Mounts all domain routers, public catalog endpoints, and version metadata.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const { normalizePhone } = require('../utils/phone');
const { readDB } = require('../services/db');
const { supabase, isSupabaseConfigured } = require('../services/supabase');
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/rbac');
const { validateInput } = require('../middleware/validate');
const { ok, fail, asyncHandler } = require('../utils/response');
const rateLimit = require('express-rate-limit');

// Global API rate limiter (300 req / min per IP) — generous for SPA usage
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path.startsWith('/cron') || req.path.startsWith('/webhooks') || process.env.NODE_ENV === 'test',
  message: { error: 'Rate limit exceeded. Please slow down.' }
});

router.use(globalLimiter);

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
const aiRoutes = require('./ai');
const exportRoutes = require('./export');

// System Version Endpoint
router.get('/version', (req, res) => {
  const pkg = require('../../package.json');
  return ok(res, { version: pkg.version });
});

// System Health Dashboard API & Deep Telemetry
router.get(['/system-health', '/system-health/detailed'], asyncHandler(async (req, res) => {
  const { getActiveClientsCount } = require('../services/sse');
  const cache = require('../services/cache');
  const pkg = require('../../package.json');
  const { getTeamBot, getClientBot } = require('../services/bot');
  
  let dbStatus = 'Offline';
  let dbLatencyMs = null;
  let agencyStats = {
    totalStaff: 0,
    openTasks: 0,
    urgentTasks: 0,
    overdueTasks: 0
  };

  if (isSupabaseConfigured()) {
    const dbStart = Date.now();
    try {
      const [profRes, taskRes] = await Promise.all([
        supabase.from('profiles').select('id, emp_code, status').limit(100),
        supabase.from('tasks').select('id, priority, due_date, stage').limit(200)
      ]);
      dbLatencyMs = Date.now() - dbStart;
      dbStatus = (profRes.error || taskRes.error) ? 'Degraded' : 'Connected';

      if (profRes.data) {
        agencyStats.totalStaff = profRes.data.length;
      }
      if (taskRes.data) {
        const todayStr = new Date().toISOString().split('T')[0];
        agencyStats.openTasks = taskRes.data.filter(t => !['Approved', 'Published', 'Completed'].includes(t.stage)).length;
        agencyStats.urgentTasks = taskRes.data.filter(t => t.priority === 'Urgent').length;
        agencyStats.overdueTasks = taskRes.data.filter(t => t.due_date && t.due_date < todayStr && !['Approved', 'Published', 'Completed'].includes(t.stage)).length;
      }
    } catch (e) {
      dbStatus = 'Error';
      dbLatencyMs = Date.now() - dbStart;
    }
  }

  let team = null;
  let client = null;
  try {
    team = getTeamBot();
    client = getClientBot();
  } catch (e) {}

  const isHealthy = dbStatus === 'Connected' && (team !== null || !process.env.TELEGRAM_BOT_TOKEN_TEAM);

  return res.json({
    status: isHealthy ? 'healthy' : 'degraded',
    version: pkg.version || '0.9.0.0',
    environment: process.env.NODE_ENV || 'production',
    dbConnection: dbStatus,
    dbLatencyMs: dbLatencyMs !== null ? dbLatencyMs : 0,
    sseClients: getActiveClientsCount ? getActiveClientsCount() : 0,
    botStatus: {
      teamBot: team ? 'active' : 'null',
      teamBotMode: process.env.RENDER || process.env.NODE_ENV === 'production' ? 'webhook' : 'polling',
      clientBot: client ? 'active' : 'null',
      clientBotMode: process.env.RENDER || process.env.NODE_ENV === 'production' ? 'webhook' : 'polling'
    },
    uptimeSeconds: Math.floor(process.uptime()),
    memoryMB: Math.round(process.memoryUsage().rss / 1024 / 1024 * 100) / 100,
    cacheStats: cache.getStats ? cache.getStats() : { activeKeys: 0, hits: 0, misses: 0, hitRatePercent: 100 },
    agencyTelemetry: agencyStats,
    timestamp: new Date().toISOString()
  });
}));

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
router.use('/ai', aiRoutes);
router.use('/export', exportRoutes);

// Public Client Phone Check (used by chat widget — rate-limited & safe)
router.get('/public/client-check', asyncHandler(async (req, res) => {
  const { phone } = req.query;
  if (!phone) return ok(res, { found: false });
  const norm = normalizePhone(phone);
  if (isSupabaseConfigured() && norm.length >= 6) {
    try {
      const { data } = await supabase.from('clients').select('id,name,phone').ilike('phone', `%${norm}%`).maybeSingle();
      if (data) return ok(res, { found: true, name: data.name });
    } catch (e) {}
  }
  return ok(res, { found: false });
}));

const DEFAULT_SERVICES = [
  { id: "SVC-001", icon: "📢", title: "Digital Marketing & Growth", category: "Digital Marketing", price: "৳75,000 / month", description: "Data-driven social media management, paid advertising, and conversion rate optimization.", features: ["Paid Meta & Google Ads", "Social Media Strategy", "Audience Retargeting", "Monthly Growth Analytics"], includedFeatures: ["Paid Meta & Google Ads", "Social Media Strategy", "Audience Retargeting", "Monthly Growth Analytics"], public: true },
  { id: "SVC-002", icon: "🎥", title: "Video Production & Editing", category: "Video Production", price: "৳45,000 / 10 Reels", description: "High-impact commercial TVCs, viral Reels/TikToks, and full post-production color grading.", features: ["Commercial TVC Shoots", "Short-Form Reels & TikToks", "Color Grading & Sound FX", "Frame.io Review Workflows"], includedFeatures: ["Commercial TVC Shoots", "Short-Form Reels & TikToks", "Color Grading & Sound FX", "Frame.io Review Workflows"], public: true },
  { id: "SVC-003", icon: "🎨", title: "Branding & Motion Design", category: "Branding & Graphics", price: "৳65,000 / project", description: "Brand identity systems, 3D motion graphics, packaging, and high-converting ad creative.", features: ["Brand Guidelines & Logos", "3D & 2D Motion Graphics", "Social Media Creative Kits", "Packaging & Print Design"], includedFeatures: ["Brand Guidelines & Logos", "3D & 2D Motion Graphics", "Social Media Creative Kits", "Packaging & Print Design"], public: true },
  { id: "SVC-004", icon: "💻", title: "Website & Tech Development", category: "Website Development", price: "৳120,000 / project", description: "Custom web applications, responsive landing pages, e-commerce, and bot integrations.", features: ["Custom React / Next.js Apps", "High-Converting Landing Pages", "Telegram & WhatsApp Bots", "API & CRM Integration"], includedFeatures: ["Custom React / Next.js Apps", "High-Converting Landing Pages", "Telegram & WhatsApp Bots", "API & CRM Integration"], public: true }
];

// Public Services Catalog Endpoint
router.get('/services', asyncHandler(async (req, res) => {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('services').select('*').order('created_at', { ascending: true });
      if (!error && data && data.length > 0) {
        return ok(res, data.map(s => ({ ...s, includedFeatures: s.included_features || s.features || [], public: s.is_public ?? true })));
      }
    } catch (err) {}
  }
  return ok(res, DEFAULT_SERVICES);
}));

// Full DB State Snapshot (Admin only)
router.get('/db', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const db = await readDB();
  return ok(res, db);
}));

module.exports = router;
