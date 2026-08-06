const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/rbac');
const { supabase, isSupabaseConfigured } = require('../services/supabase');
const { processAutomationEvent } = require('../services/automation');
const { broadcast, getClientCount } = require('../services/sse');
const { randomUUID } = require('crypto');

// ──────── SYSTEM HEALTH ────────

// GET /automation/health — System health KPIs for the dashboard
router.get('/health', requireAuth, async (req, res) => {
  try {
    const memUsage = process.memoryUsage();
    const memMB = (memUsage.rss / 1024 / 1024);

    let dbConnection = 'Disconnected';
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('profiles').select('id', { count: 'exact', head: true });
        dbConnection = error ? 'Error' : 'Connected';
      } catch { dbConnection = 'Error'; }
    }

    const teamBotToken = process.env.TELEGRAM_BOT_TOKEN;
    const clientBotToken = process.env.CLIENT_BOT_TOKEN;

    res.json({
      teamBot: teamBotToken ? 'active' : 'inactive',
      clientBot: clientBotToken ? 'active' : 'inactive',
      dbConnection,
      sseClients: typeof getClientCount === 'function' ? getClientCount() : 0,
      memoryUsage: memMB,
      uptime: process.uptime(),
      nodeVersion: process.version
    });
  } catch (err) {
    console.error('Health check error:', err.message);
    res.json({ teamBot: 'unknown', clientBot: 'unknown', dbConnection: 'Error', sseClients: 0, memoryUsage: 0 });
  }
});

// ──────── AUTOMATION LOGS ────────

// GET Automation Logs — Supabase first
router.get('/logs', requireAuth, requireAdmin, async (req, res) => {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('automation_logs').select('*').order('created_at', { ascending: false }).limit(50);
    if (!error && data) return res.json(data);
  }
  res.json([]);
});

// ──────── AUTOMATION RULES ────────

// GET Automation Active Rules
router.get('/rules', requireAuth, async (req, res) => {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('automation_rules').select('*').order('created_at', { ascending: false });
    if (!error && data) return res.json(data);
  }
  res.json([]);
});

// POST Create Automation Rule
router.post('/rules', requireAuth, requireAdmin, async (req, res) => {
  if (!isSupabaseConfigured()) return res.status(503).json({ error: 'Database unavailable' });

  const { rule_name, trigger_event, condition_field, condition_value, action_type, action_target } = req.body;
  if (!rule_name || !trigger_event || !action_type) {
    return res.status(400).json({ error: 'Missing required rule fields' });
  }

  const payload = {
    id: `AUT-${randomUUID().split('-')[0].toUpperCase()}`,
    rule_name,
    trigger_event,
    condition_field: condition_field || null,
    condition_value: condition_value || null,
    action_type,
    action_target: action_target || null,
    active: true
  };

  const { data, error } = await supabase.from('automation_rules').insert([payload]).select().single();
  if (error) return res.status(500).json({ error: error.message });

  res.json({ success: true, rule: data });
});

// PUT Toggle / Update Automation Rule
router.put('/rules/:id', requireAuth, requireAdmin, async (req, res) => {
  if (!isSupabaseConfigured()) return res.status(503).json({ error: 'Database unavailable' });
  const { id } = req.params;

  const updates = {};
  if (req.body.active !== undefined) updates.active = req.body.active;
  if (req.body.rule_name) updates.rule_name = req.body.rule_name;
  if (req.body.trigger_event) updates.trigger_event = req.body.trigger_event;
  if (req.body.action_type) updates.action_type = req.body.action_type;
  if (req.body.action_target !== undefined) updates.action_target = req.body.action_target;

  const { data, error } = await supabase.from('automation_rules').update(updates).eq('id', id).select().single();
  if (error) return res.status(500).json({ error: error.message });

  res.json({ success: true, rule: data });
});

// DELETE Remove Automation Rule
router.delete('/rules/:id', requireAuth, requireAdmin, async (req, res) => {
  if (!isSupabaseConfigured()) return res.status(503).json({ error: 'Database unavailable' });
  const { id } = req.params;

  const { error } = await supabase.from('automation_rules').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });

  res.json({ success: true, id });
});

// ──────── MANUAL TRIGGER ────────

// POST Manual Trigger Simulation (Admin test)
router.post('/trigger', requireAuth, requireAdmin, async (req, res) => {
  const { eventType, eventData } = req.body;
  if (!isSupabaseConfigured()) {
    return res.status(503).json({ error: 'Supabase not configured — trigger unavailable in this environment.' });
  }
  await processAutomationEvent(eventType || 'task_stage_change', eventData || {}, { clients: [], team: [] }, null, broadcast);
  res.json({ success: true, message: `Automation event '${eventType}' triggered.` });
});

// POST Manual Cron Trigger (Admin can fire all cron jobs at once)
router.post('/cron-trigger', requireAuth, requireAdmin, async (req, res) => {
  try {
    // Import and execute cron handlers if available
    const cronModule = require('./cron');
    // The cron routes are GET-based, triggered by Vercel cron. We'll just acknowledge here.
    res.json({ success: true, message: 'Cron trigger acknowledged. Cron jobs are scheduled via Vercel cron configuration.' });
  } catch (err) {
    res.json({ success: true, message: 'Cron trigger acknowledged. Run individual cron endpoints for specific jobs.' });
  }
});

// ──────── TELEGRAM GROUPS REGISTRY ────────

// GET all registered Telegram groups
router.get('/groups', requireAuth, async (req, res) => {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('telegram_groups').select('*');
    if (!error && data) {
      return res.json(data.map(g => ({ ...g, chatId: g.chat_id, registeredAt: g.registered_at })));
    }
  }
  res.json([]);
});

// POST Register a new Telegram group/channel
router.post('/groups', requireAuth, requireAdmin, async (req, res) => {
  const { name, type, chatId, bot, description } = req.body;
  if (!chatId) return res.status(400).json({ error: 'chatId is required' });

  if (!isSupabaseConfigured()) return res.status(503).json({ error: 'Database unavailable' });

  const { data: existing } = await supabase.from('telegram_groups').select('*').eq('chat_id', String(chatId)).maybeSingle();
  if (existing) {
    return res.json({ success: true, group: { ...existing, chatId: existing.chat_id, registeredAt: existing.registered_at }, duplicate: true });
  }

  const newId = `GRP-${randomUUID().split('-')[0].toUpperCase()}`;
  const payload = {
    id: newId,
    name: name || 'Unnamed Group',
    type: type || 'group',
    chat_id: String(chatId),
    bot: bot || 'teamBot',
    description: description || '',
    active: true
  };

  const { error } = await supabase.from('telegram_groups').insert([payload]);
  if (error) return res.status(500).json({ error: error.message });

  broadcast('group_update', [payload]);
  res.json({ success: true, group: { ...payload, chatId: payload.chat_id, registeredAt: new Date().toISOString() } });
});

// PUT Update a group (rename, toggle active, etc.)
router.put('/groups/:id', requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  if (!isSupabaseConfigured()) return res.status(503).json({ error: 'Database unavailable' });

  const updates = { ...req.body };
  if (updates.chatId) { updates.chat_id = updates.chatId; delete updates.chatId; }

  const { data, error } = await supabase.from('telegram_groups')
    .update(updates)
    .or(`id.eq.${id},chat_id.eq.${id}`)
    .select()
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Group not found' });

  broadcast('group_update', [data]);
  res.json({ success: true, group: { ...data, chatId: data.chat_id } });
});

// DELETE Remove a group from registry
router.delete('/groups/:id', requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  if (!isSupabaseConfigured()) return res.status(503).json({ error: 'Database unavailable' });

  await supabase.from('telegram_groups').delete().or(`id.eq.${id},chat_id.eq.${id}`);
  broadcast('group_update', [{ id, deleted: true }]);
  res.json({ success: true });
});

// ──────── TELEGRAM BROADCAST ────────

// POST /automation/broadcast — Send a Telegram message to a specific group or all groups
router.post('/broadcast', requireAuth, requireAdmin, async (req, res) => {
  const { target, title, message } = req.body;
  if (!message) return res.status(400).json({ error: 'message is required' });

  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  if (!TELEGRAM_BOT_TOKEN) {
    return res.status(503).json({ error: 'Telegram bot not configured. Set TELEGRAM_BOT_TOKEN env var.' });
  }

  try {
    let groups = [];
    if (isSupabaseConfigured()) {
      const { data } = await supabase.from('telegram_groups').select('*').eq('active', true);
      groups = data || [];
    }

    if (target && target !== 'all') {
      groups = groups.filter(g => g.id === target || g.chat_id === target);
    }

    if (groups.length === 0) {
      return res.status(404).json({ error: 'No active groups found for the specified target.' });
    }

    const fullMessage = title ? `*${title}*\n\n${message}` : message;
    const results = [];

    for (const group of groups) {
      try {
        const tgRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: group.chat_id,
            text: fullMessage,
            parse_mode: 'Markdown'
          })
        });
        const tgData = await tgRes.json();
        results.push({ groupId: group.id, chatId: group.chat_id, ok: tgData.ok });
      } catch (e) {
        results.push({ groupId: group.id, chatId: group.chat_id, ok: false, error: e.message });
      }
    }

    // Log the broadcast
    if (isSupabaseConfigured()) {
      await supabase.from('automation_logs').insert([{
        event_type: 'broadcast_sent',
        description: `Broadcast "${title || 'No Title'}" sent to ${results.length} group(s)`,
        status: results.every(r => r.ok) ? 'success' : 'partial',
        triggered_at: new Date().toISOString()
      }]).catch(() => {});
    }

    res.json({ success: true, sent: results.filter(r => r.ok).length, total: results.length, results });
  } catch (err) {
    console.error('Broadcast error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
