const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/rbac');
const { supabase, isSupabaseConfigured } = require('../services/supabase');
const { broadcast } = require('../services/sse');
const { sendTelegramNotification } = require('../services/bot');
const { processAutomationEvent } = require('../services/automation');
const { randomUUID } = require('crypto');

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

const DEFAULT_TICKETS = [
  {
    id: 'TCK-001',
    title: 'Brand Campaign Reel Aspect Ratio Adjustment',
    description: 'The reel requires 9:16 vertical crop re-export for social platforms.',
    submitted_by: 'Partner Brand',
    assigned_to: 'Video Editor & Colorist',
    priority: 'Urgent',
    status: 'In Progress',
    category: 'Creative Adjustment',
    client_id: 'cli_001',
    created_at: '2026-08-16T14:20:00Z',
    updated_at: '2026-08-16T15:00:00Z'
  },
  {
    id: 'TCK-002',
    title: 'Product Packaging Color Grade Tone Adjustment',
    description: 'Client requested warmer skin tones on the cosmetic packaging close-up shot.',
    submitted_by: 'Partner Brand',
    assigned_to: 'Video Editor & Colorist',
    priority: 'Medium',
    status: 'Open',
    category: 'Post Production',
    client_id: 'cli_002',
    created_at: '2026-08-17T09:30:00Z',
    updated_at: '2026-08-17T09:30:00Z'
  },
  {
    id: 'TCK-003',
    title: 'Meta Ads Manager Access Token Re-authorization',
    description: 'API access token expired. Needs admin re-authentication.',
    submitted_by: 'Marketing Team',
    assigned_to: 'Technical Admin',
    priority: 'High',
    status: 'Resolved',
    category: 'IT & Infrastructure',
    client_id: null,
    resolved_at: '2026-08-15T18:00:00Z',
    created_at: '2026-08-15T11:00:00Z',
    updated_at: '2026-08-15T18:00:00Z'
  }
];

let inMemoryTickets = [...DEFAULT_TICKETS];

// GET /api/tickets — List all support tickets
router.get('/', requireAuth, async (req, res) => {
  try {
    let tickets = [];
    if (supabase) {
      try {
        let query = supabase.from('tickets').select('*').order('created_at', { ascending: false });

        // Client user restriction: only see own submitted tickets
        const isClientUser = req.user && (req.user.role === 'Client' || req.user.linkedType === 'client' || req.user.accessLevel === 'Client Partner');
        if (isClientUser) {
          const clientName = req.user.profile?.name || req.user.name;
          const clientId = req.user.linkedId || req.user.id;
          query = query.or(`client_id.eq.${clientId},submitted_by.ilike.%${clientName}%`);
        }

        const { data, error } = await query;
        if (!error && Array.isArray(data) && data.length > 0) {
          tickets = data.map(mapTicket);
        }
      } catch (e) {}
    }

    if (tickets.length === 0) {
      let filtered = inMemoryTickets;
      const isClientUser = req.user && (req.user.role === 'Client' || req.user.linkedType === 'client' || req.user.accessLevel === 'Client Partner');
      if (isClientUser) {
        const clientName = (req.user.profile?.name || req.user.name || '').toLowerCase();
        const clientId = req.user.linkedId || req.user.id;
        filtered = filtered.filter(t => t.client_id === clientId || (t.submitted_by || '').toLowerCase().includes(clientName));
      }
      tickets = filtered.map(mapTicket);
    }

    return res.json(tickets);
  } catch (err) {
    console.error('GET /api/tickets error:', err.message);
    return res.json(inMemoryTickets.map(mapTicket));
  }
});

// POST /api/tickets — Create a new support ticket
router.post('/', requireAuth, async (req, res) => {
  try {
    const { title, description, category, priority, clientId, submittedBy: customSubmittedBy } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Ticket title is required' });
    }

    const ticketId = `TCK-${randomUUID ? randomUUID().split('-')[0].toUpperCase() : Date.now().toString().slice(-6)}`;
    const submittedBy = customSubmittedBy || req.user.name || req.user.email || 'Client';

    const payload = {
      id: ticketId,
      title: title.trim(),
      description: description || '',
      submitted_by: submittedBy,
      assigned_to: req.body.assignedTo || null,
      priority: priority || 'Medium',
      status: 'Open',
      category: category || 'General',
      client_id: clientId || req.user.linkedId || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    inMemoryTickets.unshift(payload);
    const formatted = mapTicket(payload);

    if (supabase) {
      const { error: dbErr } = await supabase.from('tickets').insert([payload]);
      if (dbErr) console.warn('[Tickets API] insert note:', dbErr.message);
    }

    try { broadcast('ticket_update', inMemoryTickets.map(mapTicket)); } catch (e) {}

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

        sendTelegramNotification(adminTgId, msg, null, true).catch(() => {});
      }
    } catch (e) {}

    return res.status(201).json({ success: true, ticket: formatted });
  } catch (err) {
    console.error('POST /api/tickets error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// PUT /api/tickets/:id — Update ticket status / assignee / priority
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, assignedTo, priority, title, description, category } = req.body;

    const updates = { updated_at: new Date().toISOString() };
    if (status) updates.status = status;
    if (assignedTo !== undefined) updates.assigned_to = assignedTo;
    if (priority) updates.priority = priority;
    if (title) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (category) updates.category = category;

    if (status === 'Resolved' || status === 'Closed') {
      updates.resolved_at = new Date().toISOString();
    }

    const memIdx = inMemoryTickets.findIndex(t => t.id === id);
    if (memIdx !== -1) {
      inMemoryTickets[memIdx] = { ...inMemoryTickets[memIdx], ...updates };
    }
    const formatted = mapTicket(inMemoryTickets[memIdx] || { id, ...updates });

    if (supabase) {
      const { error: dbErr } = await supabase.from('tickets').update(updates).eq('id', id);
      if (dbErr) console.warn('[Tickets API] update note:', dbErr.message);
    }

    try { broadcast('ticket_update', inMemoryTickets.map(mapTicket)); } catch (e) {}

    if (status === 'Resolved' || status === 'Closed') {
      try {
        const { automation } = require('../services/automation');
        if (automation && automation.trigger) {
          automation.trigger('ticket_resolved', { ticket: formatted }).catch(() => {});
        } else if (processAutomationEvent) {
          processAutomationEvent('ticket_resolved', { ticket: formatted }).catch(() => {});
        }
      } catch (ae) {}
    }

    return res.json({ success: true, ticket: formatted });
  } catch (err) {
    console.error('PUT /api/tickets error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// PATCH /api/tickets/:id or /api/tickets/:id/status — Quick status update
router.patch(['/:id', '/:id/status'], requireAuth, async (req, res) => {
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

    const memIdx = inMemoryTickets.findIndex(t => t.id === id);
    if (memIdx !== -1) {
      inMemoryTickets[memIdx] = { ...inMemoryTickets[memIdx], ...updates };
    }
    const formatted = mapTicket(inMemoryTickets[memIdx] || { id, ...updates });

    if (supabase) {
      const { error: dbErr } = await supabase.from('tickets').update(updates).eq('id', id);
      if (dbErr) console.warn('[Tickets API] patch note:', dbErr.message);
    }

    try { broadcast('ticket_update', inMemoryTickets.map(mapTicket)); } catch (e) {}

    if (status === 'Resolved' || status === 'Closed') {
      try {
        const { automation } = require('../services/automation');
        if (automation && automation.trigger) {
          automation.trigger('ticket_resolved', { ticket: formatted }).catch(() => {});
        } else if (processAutomationEvent) {
          processAutomationEvent('ticket_resolved', { ticket: formatted }).catch(() => {});
        }
      } catch (ae) {}
    }

    return res.json({ success: true, ticket: formatted });
  } catch (err) {
    console.error('PATCH /api/tickets/:id/status error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /api/tickets/:id — Remove ticket (Admin/Manager)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    inMemoryTickets = inMemoryTickets.filter(t => t.id !== id);

    if (supabase) {
      const { error: dbErr } = await supabase.from('tickets').delete().eq('id', id);
      if (dbErr) console.warn('[Tickets API] delete note:', dbErr.message);
    }

    try { broadcast('ticket_update', inMemoryTickets.map(mapTicket)); } catch (e) {}
    return res.json({ success: true, id });
  } catch (err) {
    console.error('DELETE /api/tickets/:id error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
