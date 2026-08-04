const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/rbac');
const { supabase, isSupabaseConfigured } = require('../services/supabase');
const { broadcast } = require('../services/sse');
const { sendTelegramNotification } = require('../services/bot');

/**
 * Helper to map ticket DB object to clean JSON API format
 */
function mapTicket(t) {
  if (!t) return null;
  return {
    id: t.id,
    title: t.title,
    description: t.description,
    submittedBy: t.submitted_by,
    assignedTo: t.assigned_to,
    priority: t.priority || 'Medium',
    status: t.status || 'Open',
    category: t.category || 'General',
    clientId: t.client_id,
    resolvedAt: t.resolved_at,
    createdAt: t.created_at,
    updatedAt: t.updated_at
  };
}

// GET /api/tickets — List all support tickets
router.get('/', requireAuth, async (req, res) => {
  try {
    if (!isSupabaseConfigured()) return res.json([]);

    let query = supabase.from('tickets').select('*').order('created_at', { ascending: false });

    // Client user restriction: only see own submitted tickets
    const isClientUser = req.user.role === 'Client' || req.user.linkedType === 'client' || req.user.accessLevel === 'Client Partner';
    if (isClientUser) {
      const clientName = req.user.profile?.name || req.user.name;
      const clientId = req.user.linkedId || req.user.id;
      query = query.or(`client_id.eq.${clientId},submitted_by.ilike.%${clientName}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json((data || []).map(mapTicket));
  } catch (err) {
    console.error('GET /api/tickets error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tickets — Create a new support ticket
router.post('/', requireAuth, async (req, res) => {
  try {
    const { title, description, category, priority, clientId } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Ticket title is required' });
    }

    const ticketId = `TCK-${Date.now().toString().slice(-6)}`;
    const submittedBy = req.user.name || req.user.email || 'Client';

    const payload = {
      id: ticketId,
      title: title.trim(),
      description: description || '',
      submitted_by: submittedBy,
      assigned_to: null,
      priority: priority || 'Medium',
      status: 'Open',
      category: category || 'General',
      client_id: clientId || req.user.linkedId || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('tickets').insert([payload]);
      if (error) throw error;
    }

    const formatted = mapTicket(payload);
    broadcast('ticket_update', [formatted]);

    // Send Telegram Alert to Support / Admin
    try {
      const adminTgId = process.env.OWNER_TELEGRAM_ID;
      if (adminTgId) {
        const msg =
          `🎟️ *New Support Ticket Created*\n\n` +
          `• Ticket ID: *${payload.id}*\n` +
          `• Title: *${payload.title}*\n` +
          `• Submitted By: *${payload.submitted_by}*\n` +
          `• Category: *${payload.category}*\n` +
          `• Priority: *${payload.priority}*\n\n` +
          `*Details:*\n${payload.description || 'No additional details provided.'}`;

        await sendTelegramNotification(adminTgId, msg, null, true);
      }
    } catch (e) {
      console.warn('Telegram notification for new ticket failed:', e.message);
    }

    res.json({ success: true, ticket: formatted });
  } catch (err) {
    console.error('POST /api/tickets error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/tickets/:id — Update ticket status / assignee
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, assignedTo, priority } = req.body;

    const updates = { updated_at: new Date().toISOString() };
    if (status) updates.status = status;
    if (assignedTo !== undefined) updates.assigned_to = assignedTo;
    if (priority) updates.priority = priority;

    if (status === 'Resolved' || status === 'Closed') {
      updates.resolved_at = new Date().toISOString();
    }

    if (!isSupabaseConfigured()) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    const { data, error } = await supabase.from('tickets').update(updates).eq('id', id).select().single();
    if (error) throw error;

    const formatted = mapTicket(data);
    broadcast('ticket_update', [formatted]);

    res.json({ success: true, ticket: formatted });
  } catch (err) {
    console.error('PUT /api/tickets error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/tickets/:id/status — Quick status update
router.patch('/:id/status', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'Status is required' });

    const updates = {
      status,
      updated_at: new Date().toISOString()
    };
    if (status === 'Resolved' || status === 'Closed') {
      updates.resolved_at = new Date().toISOString();
    }

    const { data, error } = await supabase.from('tickets').update(updates).eq('id', id).select().single();
    if (error) throw error;

    const formatted = mapTicket(data);
    broadcast('ticket_update', [formatted]);
    res.json({ success: true, ticket: formatted });
  } catch (err) {
    console.error('PATCH /api/tickets/:id/status error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
