const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireAdmin, requireManager } = require('../middleware/rbac');
const { supabase, isSupabaseConfigured } = require('../services/supabase');

const { ok, fail, asyncHandler } = require('../utils/response');
const { getCache, setCache } = require('../utils/cache');

// POST Track Event (Public endpoint for analytics — writes to Supabase page_events)
router.post('/track', asyncHandler(async (req, res) => {
  const newEvent = {
    id: `EVT-${Date.now()}`,
    event: req.body.event || 'page_view',
    label: req.body.label || '',
    referrer: req.body.referrer || '',
    utm: req.body.utm || '',
    ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '',
    timestamp: new Date().toISOString()
  };

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('page_events').insert([{
        event: newEvent.event,
        label: newEvent.label,
        referrer: newEvent.referrer,
        utm: newEvent.utm,
        ip: newEvent.ip,
        created_at: newEvent.timestamp
      }]);
    } catch (e) {
      console.warn('Analytics insert error:', e.message);
    }
  }

  return ok(res, { tracked: true });
}));

// GET Analytics Overview (Manager+ — 5 min cache)
router.get('/', requireAuth, requireManager, asyncHandler(async (req, res) => {
  const cacheKey = 'analytics_overview';
  const cached = getCache(cacheKey);
  if (cached) return ok(res, cached);

  let events = [];

  if (isSupabaseConfigured()) {
    const { data } = await supabase
      .from('page_events')
      .select('event, label, created_at')
      .order('created_at', { ascending: false })
      .limit(1000);
    events = data || [];
  }

  const pageViews  = events.filter(e => e.event === 'page_view').length;
  const ctaClicks  = events.filter(e => e.event === 'cta_click').length;
  const botOpens   = events.filter(e => e.event === 'bot_open').length;

  let leadsCaptured = 0;
  if (isSupabaseConfigured()) {
    const { count } = await supabase.from('leads').select('id', { count: 'exact', head: true });
    leadsCaptured = count || 0;
  }

  const ctaBreakdown = {};
  events.filter(e => e.event === 'cta_click').forEach(e => {
    ctaBreakdown[e.label] = (ctaBreakdown[e.label] || 0) + 1;
  });

  const payload = {
    summary: {
      pageViews,
      ctaClicks,
      botOpens,
      leadsCaptured,
      conversionRate: pageViews > 0 ? ((leadsCaptured / pageViews) * 100).toFixed(2) + '%' : '0%'
    },
    ctaBreakdown,
    recentEvents: events.slice(0, 50)
  };

  setCache(cacheKey, payload, 300); // 5 min TTL
  return ok(res, payload);
}));

// GET /api/analytics/time-series (5 min cache)
router.get('/time-series', requireAuth, requireManager, asyncHandler(async (req, res) => {
  const period = req.query.period || 'daily';
  const days = parseInt(req.query.days || '30', 10);
  const cacheKey = `analytics_time_series_${period}_${days}`;

  const cached = getCache(cacheKey);
  if (cached) return ok(res, cached);

  let invoices = [], tasks = [], leads = [];
  if (isSupabaseConfigured()) {
    const [invRes, taskRes, leadRes] = await Promise.all([
      supabase.from('invoices').select('amount, status, created_at, paid_at'),
      supabase.from('tasks').select('stage, created_at, updated_at'),
      supabase.from('leads').select('created_at, stage, value')
    ]);
    invoices = invRes.data || [];
    tasks = taskRes.data || [];
    leads = leadRes.data || [];
  }

  const now = new Date();
  const cutoffDate = new Date();
  cutoffDate.setDate(now.getDate() - days);

  const getGroupKey = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (d < cutoffDate) return null;
    if (period === 'weekly') {
      const firstDayOfWeek = new Date(d.setDate(d.getDate() - d.getDay()));
      return firstDayOfWeek.toISOString().split('T')[0];
    }
    return d.toISOString().split('T')[0];
  };

  const timeSeries = {};

  invoices.forEach(inv => {
    if (inv.status === 'Paid') {
      const dateKey = getGroupKey(inv.paid_at || inv.created_at);
      if (dateKey) {
        if (!timeSeries[dateKey]) timeSeries[dateKey] = { date: dateKey, revenue: 0, tasksCompleted: 0, newLeads: 0 };
        timeSeries[dateKey].revenue += Number(inv.amount || 0);
      }
    }
  });

  tasks.forEach(task => {
    if (task.stage === 'Approved' || task.stage === 'Completed') {
      const dateKey = getGroupKey(task.updated_at || task.created_at);
      if (dateKey) {
        if (!timeSeries[dateKey]) timeSeries[dateKey] = { date: dateKey, revenue: 0, tasksCompleted: 0, newLeads: 0 };
        timeSeries[dateKey].tasksCompleted += 1;
      }
    }
  });

  leads.forEach(lead => {
    const dateKey = getGroupKey(lead.created_at);
    if (dateKey) {
      if (!timeSeries[dateKey]) timeSeries[dateKey] = { date: dateKey, revenue: 0, tasksCompleted: 0, newLeads: 0 };
      timeSeries[dateKey].newLeads += 1;
    }
  });

  const seriesArray = Object.values(timeSeries).sort((a, b) => new Date(a.date) - new Date(b.date));
  const payload = { period, days, series: seriesArray };

  setCache(cacheKey, payload, 300);
  return ok(res, payload);
}));

// GET /api/analytics/scorecards
router.get('/scorecards', requireAuth, requireManager, async (req, res) => {
  try {
    const days = parseInt(req.query.days || '30', 10);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    let leads = [], tasks = [], clients = [];
    if (isSupabaseConfigured()) {
      const [leadRes, taskRes, clientRes] = await Promise.all([
        supabase.from('leads').select('utm_source, created_at, stage'),
        supabase.from('tasks').select('id, stage, department, client, created_at, updated_at, due_date, assignee, revisions_count, priority'),
        supabase.from('clients').select('id, name')
      ]);
      leads = leadRes.data || [];
      tasks = taskRes.data || [];
      clients = clientRes.data || [];
    }

    // 1. UTM Breakdown
    const utmBreakdown = {};
    leads.forEach(lead => {
      const d = new Date(lead.created_at);
      if (d >= cutoffDate && lead.stage !== 'Spam') {
        const source = lead.utm_source || 'organic';
        utmBreakdown[source] = (utmBreakdown[source] || 0) + 1;
      }
    });

    // 2. Department Scorecard
    // Metrics: tasksDone, avgTurnaroundDays, qcPassRate
    const deptStats = {};
    tasks.forEach(task => {
      const d = new Date(task.updated_at || task.created_at);
      if (d >= cutoffDate && (task.stage === 'Approved' || task.stage === 'Completed')) {
        const dept = task.department || 'General';
        if (!deptStats[dept]) deptStats[dept] = { name: dept, tasksDone: 0, turnaroundTotal: 0, revisionsTotal: 0 };
        
        deptStats[dept].tasksDone += 1;
        const turnAroundMs = new Date(task.updated_at) - new Date(task.created_at);
        deptStats[dept].turnaroundTotal += (turnAroundMs / (1000 * 60 * 60 * 24));
        deptStats[dept].revisionsTotal += (task.revisions_count || 0);
      }
    });

    const departments = Object.values(deptStats).map(d => ({
      name: d.name,
      tasksDone: d.tasksDone,
      avgTurnaroundDays: d.turnaroundTotal / d.tasksDone,
      qcPassRate: Math.max(0, 100 - ((d.revisionsTotal / d.tasksDone) * 10)) // Simple proxy for QC pass rate
    }));

    // 3. Client Delivery Performance
    // Metrics: tasksDelivered, onTimeRate, avgRevisions, avgTurnaround
    const clientStats = {};
    tasks.forEach(task => {
      const d = new Date(task.updated_at || task.created_at);
      if (d >= cutoffDate && (task.stage === 'Approved' || task.stage === 'Completed')) {
        const clientName = task.client || 'Unknown Client';
        if (!clientStats[clientName]) clientStats[clientName] = { name: clientName, tasksDelivered: 0, onTimeCount: 0, revisionsTotal: 0, turnaroundTotal: 0 };
        
        clientStats[clientName].tasksDelivered += 1;
        clientStats[clientName].revisionsTotal += (task.revisions_count || 0);
        
        const turnAroundMs = new Date(task.updated_at) - new Date(task.created_at);
        clientStats[clientName].turnaroundTotal += (turnAroundMs / (1000 * 60 * 60 * 24));

        if (task.due_date) {
          const dueDate = new Date(task.due_date);
          const completedDate = new Date(task.updated_at);
          if (completedDate <= dueDate) {
            clientStats[clientName].onTimeCount += 1;
          }
        } else {
          clientStats[clientName].onTimeCount += 1; // Count as on-time if no due date
        }
      }
    });

    const clientPerformance = Object.values(clientStats).map(c => ({
      name: c.name,
      tasksDelivered: c.tasksDelivered,
      onTimeRate: (c.onTimeCount / c.tasksDelivered) * 100,
      avgRevisions: c.revisionsTotal / c.tasksDelivered,
      avgTurnaround: c.turnaroundTotal / c.tasksDelivered
    })).sort((a, b) => b.tasksDelivered - a.tasksDelivered);

    res.json({ utmBreakdown, departments, clients: clientPerformance });
  } catch (error) {
    console.error('Scorecards error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /reports/revenue (Exposed as /api/reports/revenue)
router.get('/reports/revenue', requireAuth, requireAdmin, async (req, res) => {
  try {
    let invoices = [];
    if (isSupabaseConfigured()) {
      const { data } = await supabase.from('invoices').select('client_name, amount, paid_at, created_at, status').eq('status', 'Paid');
      invoices = data || [];
    }

    const revenueByClientByMonth = {};

    invoices.forEach(inv => {
      const d = new Date(inv.paid_at || inv.created_at);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
      const clientName = inv.client_name || 'Unknown Client';
      const amount = Number(inv.amount || 0);

      if (!revenueByClientByMonth[clientName]) {
        revenueByClientByMonth[clientName] = { client: clientName, total: 0, monthly: {} };
      }

      if (!revenueByClientByMonth[clientName].monthly[monthKey]) {
        revenueByClientByMonth[clientName].monthly[monthKey] = 0;
      }

      revenueByClientByMonth[clientName].monthly[monthKey] += amount;
      revenueByClientByMonth[clientName].total += amount;
    });

    const reportData = Object.values(revenueByClientByMonth).sort((a, b) => b.total - a.total);

    res.json({ success: true, report: reportData });
  } catch (error) {
    console.error('Revenue report error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
