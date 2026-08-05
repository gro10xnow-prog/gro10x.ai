const express = require('express');
const router = express.Router();
const { readDB } = require('../services/db');
const { supabase, isSupabaseConfigured } = require('../services/supabase');
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/rbac');

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

// System Version Endpoint
router.get('/version', (req, res) => {
  const pkg = require('../../package.json');
  res.json({ version: pkg.version });
});

// Mount Domain Sub-Routers
router.use('/labels', labelsRoutes);
router.use('/custom-fields', customFieldsRoutes);
router.use('/task-templates', taskTemplatesRoutes);
router.use('/', authRoutes);
router.use('/clients', clientsRoutes);
router.use('/leads', leadsRoutes);
router.use('/tasks', tasksRoutes);
router.use('/projects', projectsRoutes);
router.use('/workflows', projectsRoutes);
router.use('/reviews', reviewsRoutes);
router.use('/', invoicesRoutes);
router.use('/payments', paymentsRoutes);
router.use('/tickets', ticketsRoutes);
router.use('/team', teamRoutes);
router.use('/posts', postsRoutes);
router.use('/social-posts', postsRoutes);
router.use('/cms', cmsRoutes);
router.use('/public/content', cmsRoutes);
router.use('/', analyticsRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/automation', automationRoutes);
router.use('/', automationRoutes);  // Exposes /api/groups, /api/logs at root level
router.use('/cron', cronRoutes);
router.use('/manager', managerRoutes);
router.use('/expenses', expensesRoutes);
router.use('/assets', assetsRoutes);
router.use('/', leavesRoutes);

// Public Client Phone Check (used by public chat widget — no auth required)
router.get('/public/client-check', async (req, res) => {
  const { phone } = req.query;
  if (!phone) return res.json({ found: false });
  const norm = String(phone).replace(/[^0-9]/g, '').slice(-10);
  if (isSupabaseConfigured()) {
    try {
      const { data } = await supabase.from('clients').select('id,name,phone').ilike('phone', `%${norm}%`).maybeSingle();
      if (data) return res.json({ found: true, name: data.name });
    } catch (e) {}
  }
  return res.json({ found: false });
});

// Public Services Catalog Endpoint
const defaultServicesList = [
  { id: "SVC-001", title: "Digital Marketing & Growth Retainer", category: "Digital Marketing", price: "৳75,000 / month", description: "Full end-to-end strategy, content calendar, graphic post design, copy, community management, and monthly performance reporting.", includedFeatures: ["Paid Meta & Google Ads", "Social Media Strategy", "Audience Retargeting", "Monthly Growth Analytics"], public: true },
  { id: "SVC-002", title: "Short-Form Video & Reels Production", category: "Video Production", price: "৳45,000 / package (10 Reels)", description: "Trend-driven short video creation tailored for TikTok, IG Reels, and FB Shorts including script, shoot, and motion edit.", includedFeatures: ["Commercial TVC Shoots", "Short-Form Reels & TikToks", "Color Grading & Sound FX", "Frame.io Review Workflows"], public: true },
  { id: "SVC-003", title: "TVC & OVC Commercial Production", category: "Video Production", price: "৳180,000 / project", description: "High-production video commercial with creative storyboard, director, cinema crew, talent casting, and master edit.", includedFeatures: ["4K Cinema Camera Crew", "Professional Lighting & Sound", "Talent & Location Scouting", "Color Grading & Master Cut"], public: true },
  { id: "SVC-004", title: "360-Degree Brand Identity System", category: "Branding & Graphics", price: "৳65,000 / project", description: "Complete corporate identity system including logo design, color palette, brand guidelines book, merchandise, and POSM templates.", includedFeatures: ["Logo Vector & Variants", "Brand Guidelines Book", "Social Media Templates", "Print & Packaging Assets"], public: true }
];

router.get('/services', async (req, res) => {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('services').select('*');
      if (!error && data && data.length > 0) {
        return res.json(data.map(s => ({ ...s, includedFeatures: s.included_features, public: s.is_public })));
      }
    } catch (err) {}
  }
  const db = await readDB();
  if (db.services && db.services.length > 0) {
    return res.json(db.services);
  }
  res.json(defaultServicesList);
});

// Full DB State Snapshot (Admin only)
router.get('/db', requireAuth, requireAdmin, async (req, res) => {
  if (isSupabaseConfigured()) {
    try {
      const [clients, services, team, tasks, reviews, invoices, expenses, assets, attendance] = await Promise.all([
        supabase.from('clients').select('*'),
        supabase.from('services').select('*'),
        supabase.from('profiles').select('*'),
        supabase.from('tasks').select('*'),
        supabase.from('reviews').select('*'),
        supabase.from('invoices').select('*'),
        supabase.from('expenses').select('*'),
        supabase.from('assets').select('*'),
        supabase.from('attendance').select('*')
      ]);

      if (!clients.error && clients.data.length > 0) {
        return res.json({
          clients: clients.data.map(c => ({ ...c, contactPerson: c.contact_person, totalSpent: c.total_spent, activeCampaigns: c.active_campaigns })),
          services: services.data.map(s => ({ ...s, includedFeatures: s.included_features, public: s.is_public })),
          team: team.data.map(t => ({ ...t, id: t.emp_code, telegramId: t.telegram_id, baseSalary: t.base_salary, commissionRate: t.commission_rate, earnedCommissions: t.earned_commissions, activeBookings: t.active_bookings })),
          tasks: tasks.data.map(t => ({ ...t, dueDate: t.due_date })),
          reviews: reviews.data.map(r => ({ ...r, projectId: r.project_id, projectName: r.project_name, activeVersion: r.active_version, mediaType: r.media_type, mediaUrl: r.media_url, posterUrl: r.poster_url, resolvedCount: r.resolved_count, totalCount: r.total_count })),
          invoices: invoices.data.map(i => ({ ...i, clientId: i.client_id, clientName: i.client_name, dueDate: i.due_date, taxRate: i.tax_rate })),
          expenses: expenses.data.map(e => ({ ...e, loggedBy: e.logged_by })),
          assets: assets.data.map(a => ({ ...a, purchasePrice: a.purchase_price, monthlyDepreciation: a.monthly_depreciation, assignedTo: a.assigned_to })),
          attendance: attendance.data.map(at => ({ ...at, employeeId: at.employee_id, clockInTime: at.clock_in_time }))
        });
      }
    } catch (err) {
      console.warn('Supabase query failed, falling back to db.json:', err.message);
    }
  }

  const db = await readDB();
  res.json(db);
});

module.exports = router;
