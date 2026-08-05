const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/rbac');
const { supabase, isSupabaseConfigured } = require('../services/supabase');
const { processAutomationEvent } = require('../services/automation');
const { broadcast } = require('../services/sse');

// GET Automation Logs — Supabase first
router.get('/logs', requireAuth, requireAdmin, async (req, res) => {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('automation_logs').select('*').order('created_at', { ascending: false });
    if (!error && data) return res.json(data);
  }
  res.json([]);
});

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

// POST Manual Trigger Simulation (Admin test) — Supabase only, no db.json write
router.post('/trigger', requireAuth, requireAdmin, async (req, res) => {
  const { eventType, eventData } = req.body;
  if (!isSupabaseConfigured()) {
    return res.status(503).json({ error: 'Supabase not configured — trigger unavailable in this environment.' });
  }
  // Pass null for db/writeDB — automation.js logs directly to Supabase
  await processAutomationEvent(eventType || 'task_stage_change', eventData || {}, { clients: [], team: [] }, null, broadcast);
  res.json({ success: true, message: `Automation event '${eventType}' triggered.` });
});

// ──────── TELEGRAM GROUPS REGISTRY ────────

// GET all registered Telegram groups — Supabase first
router.get('/groups', requireAuth, async (req, res) => {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('telegram_groups').select('*');
    if (!error && data) {
      return res.json(data.map(g => ({ ...g, chatId: g.chat_id, registeredAt: g.registered_at })));
    }
  }
  res.json([]);
});

// POST Register a new Telegram group/channel — Supabase only
router.post('/groups', requireAuth, requireAdmin, async (req, res) => {
  const { name, type, chatId, bot, description } = req.body;
  if (!chatId) return res.status(400).json({ error: 'chatId is required' });

  if (!isSupabaseConfigured()) return res.status(503).json({ error: 'Database unavailable' });

  const { data: existing } = await supabase.from('telegram_groups').select('*').eq('chat_id', String(chatId)).maybeSingle();
  if (existing) {
    return res.json({ success: true, group: { ...existing, chatId: existing.chat_id, registeredAt: existing.registered_at }, duplicate: true });
  }

  const { count } = await supabase.from('telegram_groups').select('id', { count: 'exact', head: true });
  const newId = `GRP-${String((count || 0) + 1).padStart(3, '0')}`;
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

// PUT Update a group (rename, toggle active, etc.) — Supabase only
router.put('/groups/:id', requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  if (!isSupabaseConfigured()) return res.status(503).json({ error: 'Database unavailable' });

  const updates = { ...req.body };
  // Normalise camelCase → snake_case for Supabase
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

// DELETE Remove a group from registry — Supabase only
router.delete('/groups/:id', requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  if (!isSupabaseConfigured()) return res.status(503).json({ error: 'Database unavailable' });

  await supabase.from('telegram_groups').delete().or(`id.eq.${id},chat_id.eq.${id}`);
  broadcast('group_update', [{ id, deleted: true }]);
  res.json({ success: true });
});

module.exports = router;
