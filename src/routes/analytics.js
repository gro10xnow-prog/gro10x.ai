const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/rbac');
const { supabase, isSupabaseConfigured } = require('../services/supabase');

// POST Track Event (Public endpoint for analytics — writes to Supabase page_events)
router.post('/track', async (req, res) => {
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

  res.json({ success: true });
});

// GET Analytics Overview (Admin only)
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  let events = [];

  if (isSupabaseConfigured()) {
    const { data } = await supabase
      .from('page_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(2000);
    events = data || [];
  }

  const pageViews  = events.filter(e => e.event === 'page_view').length;
  const ctaClicks  = events.filter(e => e.event === 'cta_click').length;
  const botOpens   = events.filter(e => e.event === 'bot_open').length;

  // Lead count from Supabase
  let leadsCaptured = 0;
  if (isSupabaseConfigured()) {
    const { count } = await supabase.from('leads').select('id', { count: 'exact', head: true });
    leadsCaptured = count || 0;
  }

  const ctaBreakdown = {};
  events.filter(e => e.event === 'cta_click').forEach(e => {
    ctaBreakdown[e.label] = (ctaBreakdown[e.label] || 0) + 1;
  });

  res.json({
    summary: {
      pageViews,
      ctaClicks,
      botOpens,
      leadsCaptured,
      conversionRate: pageViews > 0 ? ((leadsCaptured / pageViews) * 100).toFixed(2) + '%' : '0%'
    },
    ctaBreakdown,
    recentEvents: events.slice(0, 50)
  });
});

module.exports = router;
