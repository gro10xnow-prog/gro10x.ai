const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/rbac');
const { readDB, writeDB } = require('../services/db');
const { processAutomationEvent } = require('../services/automation');
const { broadcast } = require('../services/sse');

const { supabase, isSupabaseConfigured } = require('../services/supabase');

// GET Automation Logs
router.get('/logs', requireAuth, requireAdmin, async (req, res) => {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('automation_logs').select('*').order('created_at', { ascending: false });
    if (!error && data) return res.json(data);
  }
  const db = readDB();
  res.json(db.automationLogs || []);
});

// GET Automation Active Rules
router.get('/rules', requireAuth, (req, res) => {
  res.json([
    { id: 'AUT-001', name: 'Task Stage Editing -> Telegram Alert to Editor', active: true },
    { id: 'AUT-003', name: 'Lead Won -> Auto Create Client CRM Account', active: true },
    { id: 'AUT-004', name: 'Task Stage Client Review -> Telegram Push & Review Room Link', active: true },
    { id: 'AUT-005', name: 'Invoice Paid -> Payment Verification Telegram Push', active: true },
    { id: 'AUT-006', name: 'Social Post Approved by Client -> Publisher Notification', active: true }
  ]);
});

// POST Manual Trigger Simulation (Admin test)
router.post('/trigger', requireAuth, requireAdmin, (req, res) => {
  const { eventType, eventData } = req.body;
  const db = readDB();

  processAutomationEvent(eventType || 'task_stage_change', eventData || {}, db, writeDB, broadcast);
  writeDB(db);

  res.json({ success: true, message: `Automation event ${eventType} executed successfully.` });
});

// ──────── TELEGRAM GROUPS REGISTRY ────────
// Manage registered Telegram group/channel chats for bot broadcasts

// GET all registered Telegram groups
router.get('/groups', requireAuth, async (req, res) => {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('telegram_groups').select('*');
    if (!error && data) {
      return res.json(data.map(g => ({
        ...g,
        chatId: g.chat_id,
        registeredAt: g.registered_at
      })));
    }
  }
  const db = readDB();
  res.json(db.telegramGroups || []);
});

// POST Register a new Telegram group/channel
router.post('/groups', requireAuth, requireAdmin, async (req, res) => {
  const { name, type, chatId, bot, description } = req.body;
  if (!chatId) return res.status(400).json({ error: 'chatId is required' });

  if (isSupabaseConfigured()) {
    const { data: existing } = await supabase.from('telegram_groups').select('*').eq('chat_id', String(chatId)).maybeSingle();
    if (existing) {
      return res.json({ success: true, group: { ...existing, chatId: existing.chat_id, registeredAt: existing.registered_at }, duplicate: true });
    }
    const { data: countData } = await supabase.from('telegram_groups').select('id');
    const newId = `GRP-${String((countData?.length || 0) + 1).padStart(3, '0')}`;
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
    if (!error) {
      broadcast('group_update', [payload]);
      return res.json({ success: true, group: { ...payload, chatId: payload.chat_id, registeredAt: new Date().toISOString() } });
    }
  }

  const db = readDB();
  db.telegramGroups = db.telegramGroups || [];

  const existing = db.telegramGroups.find(g => String(g.chatId) === String(chatId));
  if (existing) {
    return res.json({ success: true, group: existing, duplicate: true });
  }

  const newGroup = {
    id: `GRP-${String(db.telegramGroups.length + 1).padStart(3, '0')}`,
    name: name || 'Unnamed Group',
    type: type || 'group',
    chatId: String(chatId),
    bot: bot || 'teamBot',
    description: description || '',
    active: true,
    registeredAt: new Date().toISOString()
  };

  db.telegramGroups.push(newGroup);
  writeDB(db);
  broadcast('group_update', db.telegramGroups);

  res.json({ success: true, group: newGroup });
});

// PUT Update a group (rename, toggle active, etc.)
router.put('/groups/:id', requireAuth, requireAdmin, (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const idx = (db.telegramGroups || []).findIndex(g => g.id === id || g.chatId === id);
  if (idx === -1) return res.status(404).json({ error: 'Group not found' });

  db.telegramGroups[idx] = { ...db.telegramGroups[idx], ...req.body };
  writeDB(db);
  broadcast('group_update', db.telegramGroups);
  res.json({ success: true, group: db.telegramGroups[idx] });
});

// DELETE Remove a group from registry
router.delete('/groups/:id', requireAuth, requireAdmin, (req, res) => {
  const { id } = req.params;
  const db = readDB();
  db.telegramGroups = (db.telegramGroups || []).filter(g => g.id !== id && g.chatId !== id);
  writeDB(db);
  broadcast('group_update', db.telegramGroups);
  res.json({ success: true });
});

module.exports = router;

