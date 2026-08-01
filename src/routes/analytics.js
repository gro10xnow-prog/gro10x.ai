const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/rbac');
const { readDB, writeDB } = require('../services/db');

// POST Track Event (Public endpoint for analytics)
router.post('/track', (req, res) => {
  const db = readDB();
  db.analyticsEvents = db.analyticsEvents || [];

  const newEvent = {
    id: `EVT-${Date.now()}`,
    event: req.body.event || 'page_view',
    label: req.body.label || '',
    referrer: req.body.referrer || '',
    utm: req.body.utm || '',
    ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || '',
    timestamp: new Date().toISOString()
  };

  db.analyticsEvents.unshift(newEvent);

  // Cap analytics events to latest 2000 in flat file
  if (db.analyticsEvents.length > 2000) {
    db.analyticsEvents = db.analyticsEvents.slice(0, 2000);
  }

  writeDB(db);
  res.json({ success: true });
});

// GET Analytics Overview (Admin only)
router.get('/', requireAuth, requireAdmin, (req, res) => {
  const db = readDB();
  const events = db.analyticsEvents || [];

  const pageViews = events.filter(e => e.event === 'page_view').length;
  const ctaClicks = events.filter(e => e.event === 'cta_click').length;
  const botOpens = events.filter(e => e.event === 'bot_open').length;
  const leadsCaptured = (db.leads || []).length;

  // Breakdown by label
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
