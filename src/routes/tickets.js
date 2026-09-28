const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireAdmin, requireManager } = require('../middleware/rbac');
const { supabase, isSupabaseConfigured } = require('../services/supabase');
const sse = require('../services/sse');
const broadcast = (...args) => sse.broadcast(...args);
const broadcastToClient = (...args) => sse.broadcastToClient(...args);
const botNotifications = require('../services/bot/notifications');
const sendTelegramNotification = (...args) => botNotifications.sendTelegramNotification(...args);
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
    submittedBy: t.submitted_by || t.submittedBy,
    assignedTo: t.assigned_to || t.assignedTo,
    priority: t.priority || 'Medium',
    status: t.status || 'Open',
    category: t.category || 'General',
    clientId: t.client_id || t.clientId,
    projectId: t.project_id || t.projectId || null,
    isWarranty: t.is_warranty !== undefined ? t.is_warranty : (t.isWarranty || false),
    warrantyStatus: t.warranty_status || t.warrantyStatus || (t.is_warranty ? 'ACTIVE' : 'NONE'),
    slaResponseDue: t.sla_response_due || t.slaResponseDue || null,
    slaResolutionDue: t.sla_resolution_due || t.slaResolutionDue || null,
    billable: t.billable !== undefined ? t.billable : (t.is_warranty ? false : true),
    resolvedAt: t.resolved_at || t.resolvedAt,
    createdAt: t.created_at || t.createdAt,
    updatedAt: t.updated_at || t.updatedAt
  };
}

const DEFAULT_TICKETS = [
  {
    id: 'TCK-1001',
    title: 'Color Grading Drift on YouTube Reel #4',
    description: 'Exported reel #4 has noticeable magenta tint on skin tones compared to approved preview.',
    submitted_by: 'Pilutics Brand',
    assigned_to: 'Anika Nower',
    priority: 'High',
    status: 'Open',
    category: 'Creative Revision',
    client_id: 'client-pilutics',
    resolved_at: null,
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'TCK-1002',
    title: 'Render Farm Server GPU Node Out of Memory',
    description: 'After Effects GPU renderer crashed during 4K 60fps export batch on node 2.',
    submitted_by: 'Firoz Uddin Ahmed',
    assigned_to: 'Firoz Uddin Ahmed',
    priority: 'Urgent',
    status: 'In Progress',
    category: 'IT Issue',
    client_id: null,
    resolved_at: null,
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 1).toISOString()
  },
  {
    id: 'TCK-1003',
    title: 'Brand Portal Asset Download Link Expired',
    description: 'Client unable to access Google Drive RAW asset folder from brand portal dashboard.',
    submitted_by: 'Grow Bangla',
    assigned_to: null,
    priority: 'Medium',
    status: 'Open',
    category: 'Client Request',
    client_id: 'client-growbangla',
    resolved_at: null,
    created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 8).toISOString()
  },
  {
    id: 'TCK-1004',
    title: 'Invoice #INV-2026-088 Wire Payment Confirmation',
    description: 'Client confirmed wire transfer of $3,500; please verify and mark retainer invoice as paid.',
    submitted_by: 'TechCorp Global',
    assigned_to: 'Firoz Uddin Ahmed',
    priority: 'Low',
    status: 'Resolved',
    category: 'Billing',
    client_id: 'client-techcorp',
    resolved_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: 'TCK-1005',
    title: 'TikTok Sound License Clearance Documentation',
    description: 'Submitted commercial license proof for audio track used in TikTok video #12.',
    submitted_by: 'Bong Hits',
    assigned_to: 'Anika Nower',
    priority: 'Medium',
    status: 'Closed',
    category: 'General',
    client_id: 'client-bonghits',
    resolved_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 18).toISOString()
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
        const isClientUser = req.user && (
          req.user.role === 'Client' || req.user.role === 'client' ||
          req.user.linkedType === 'client' ||
          (req.user.accessLevel && String(req.user.accessLevel).toLowerCase().includes('client'))
        );
        if (isClientUser) {
          const clientName = req.user.profile?.name || req.user.name;
          const clientId = req.user.clientId || req.user.linkedId || req.user.id;
          if (clientId && clientName) {
            query = query.or(`client_id.eq.${clientId},submitted_by.eq.${clientName},submitted_by.eq.${clientId}`);
          } else if (clientId) {
            query = query.or(`client_id.eq.${clientId},submitted_by.eq.${clientId}`);
          } else if (clientName) {
            query = query.eq('submitted_by', clientName);
          } else {
            return res.json([]);
          }
        }

        const { data, error } = await query;
        if (!error && Array.isArray(data) && data.length > 0) {
          tickets = data.map(mapTicket);
        }
      } catch (e) {}
    }

    function getFilteredTickets() {
      let filtered = inMemoryTickets;
      const isClientUser = req.user && (
        req.user.role === 'Client' || req.user.role === 'client' ||
        req.user.linkedType === 'client' ||
        (req.user.accessLevel && String(req.user.accessLevel).toLowerCase().includes('client'))
      );
      if (isClientUser) {
        const clientName = (req.user.profile?.name || req.user.name || '').toLowerCase();
        const clientId = req.user.clientId || req.user.linkedId || req.user.id;
        filtered = filtered.filter(t => (clientId && t.client_id === clientId) || (clientName && (t.submitted_by || '').toLowerCase() === clientName));
      }
      return filtered.map(mapTicket);
    }

    if (tickets.length === 0) {
      tickets = getFilteredTickets();
    }

    return res.json(tickets);
  } catch (err) {
    console.error('GET /api/tickets error:', err.message);
    const isClientUser = req.user && (req.user.role === 'Client' || req.user.linkedType === 'client' || req.user.accessLevel === 'Client Partner');
    let filtered = inMemoryTickets;
    if (isClientUser) {
      const clientName = (req.user?.profile?.name || req.user?.name || '').toLowerCase();
      const clientId = req.user?.linkedId || req.user?.id;
      filtered = filtered.filter(t => t.client_id === clientId || (t.submitted_by || '').toLowerCase().includes(clientName));
    }
    return res.json(filtered.map(mapTicket));
  }
});

// POST /api/tickets — Create a new support ticket (with 30-Day Warranty SLA Governance)
router.post('/', requireAuth, async (req, res) => {
  try {
    const { title, description, category, priority, clientId, projectId: reqProjectId, submittedBy: customSubmittedBy } = req.body;
    const projectId = reqProjectId || req.body.project_id || null;

    if (!title) {
      return res.status(400).json({ error: 'Ticket title is required' });
    }

    const ticketId = `TCK-${randomUUID ? randomUUID().split('-')[0].toUpperCase() : Date.now().toString().slice(-6)}`;
    const submittedBy = customSubmittedBy || req.user.name || req.user.email || 'Client';

    const isClientUser = req.user && (req.user.role === 'Client' || req.user.linkedType === 'client' || req.user.accessLevel === 'Client Partner');
    // Security: Client callers cannot override their own linkedId
    const resolvedClientId = isClientUser ? req.user.linkedId : (clientId || null);

    // ──────────────────────────────────────────────────────────────────────────
    // Warranty & SLA Engine Inspection
    // ──────────────────────────────────────────────────────────────────────────
    const { calculateWarrantyStatus, findProject } = require('../services/post-delivery');
    let linkedProject = null;
    if (projectId) {
      linkedProject = await findProject(projectId);
    }

    const warrantyInfo = calculateWarrantyStatus(linkedProject);
    let isWarranty = false;
    let warrantyStatus = 'NONE';
    let slaResponseDue = null;
    let slaResolutionDue = null;
    let billable = true;
    let finalCategory = category || 'General';
    let finalPriority = priority || 'Medium';

    if (linkedProject) {
      if (warrantyInfo.isActive) {
        const isDefectOrRevision = req.body.isWarranty ||
          (category && (category.includes('Warranty') || category.includes('Creative') || category.includes('Bug') || category.includes('Technical'))) ||
          req.body.isWarranty === undefined;

        if (isDefectOrRevision) {
          isWarranty = true;
          warrantyStatus = 'ACTIVE';
          billable = false;
          finalCategory = category && !category.includes('General') ? category : 'Warranty Bug Fix';
          finalPriority = (priority === 'Urgent') ? 'Urgent' : 'High';
          slaResponseDue = new Date(Date.now() + 4 * 3600000).toISOString();
          slaResolutionDue = new Date(Date.now() + 24 * 3600000).toISOString();
        }
      } else if (warrantyInfo.badge === 'EXPIRED_WARRANTY') {
        warrantyStatus = 'EXPIRED';
        billable = true;
        if (!category || category === 'Warranty Bug Fix') {
          finalCategory = 'Out of Warranty Maintenance';
        }
      }
    }

    const payload = {
      id: ticketId,
      title: title.trim(),
      description: description || '',
      submitted_by: submittedBy,
      assigned_to: req.body.assignedTo || null,
      priority: finalPriority,
      status: 'Open',
      category: finalCategory,
      client_id: resolvedClientId || null,
      project_id: projectId || null,
      is_warranty: isWarranty,
      warranty_status: warrantyStatus,
      sla_response_due: slaResponseDue,
      sla_resolution_due: slaResolutionDue,
      billable: billable,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    inMemoryTickets.unshift(payload);
    const formatted = mapTicket(payload);

    if (supabase) {
      const basePayload = {
        id: payload.id,
        title: payload.title,
        subject: payload.title,
        description: payload.description,
        submitted_by: payload.submitted_by,
        assigned_to: payload.assigned_to,
        priority: payload.priority,
        status: payload.status,
        category: payload.category,
        client_id: payload.client_id,
        created_at: payload.created_at,
        updated_at: payload.updated_at
      };
      const { error: dbErr } = await supabase.from('tickets').insert([basePayload]);
      if (dbErr) console.warn('[Tickets API] insert note:', dbErr.message);
    }

    try {
      broadcast('ticket_update', inMemoryTickets.map(mapTicket));
      broadcast('ticket_created', formatted);
      if (payload.client_id) {
        broadcastToClient('ticket_update', inMemoryTickets.map(mapTicket), [payload.client_id]);
      }
    } catch (e) {}

    // Send Telegram Alert to Support / Admin / Lead Engineer
    try {
      const adminTgId = process.env.OWNER_TELEGRAM_ID || process.env.ADMIN_TELEGRAM_CHAT_ID;
      if (adminTgId) {
        const baseUrl = process.env.BASE_URL || 'https://gro10x-ai.vercel.app';
        const msg = isWarranty
          ? `🛡️ *WARRANTY BUG-FIX TICKET FILED*\n\n` +
            `• Project: *${linkedProject?.name || payload.project_id}*\n` +
            `• Ticket ID: *${payload.id}*\n` +
            `• Title: *${payload.title}*\n` +
            `• Priority: *${payload.priority}* (4h Response / 24h Resolution SLA)\n` +
            `• Response SLA Due: *4 Hours*\n` +
            `• Resolution SLA Due: *24 Hours*\n` +
            `• Submitted By: *${payload.submitted_by}*\n` +
            `• Category: *${payload.category}*\n\n` +
            `*Details:*\n${payload.description || 'No additional details provided.'}`
          : `🎟️ *New Support Ticket Created*\n\n` +
            `• Ticket ID: *${payload.id}*\n` +
            `• Title: *${payload.title}*\n` +
            `• Submitted By: *${payload.submitted_by}*\n` +
            `• Category: *${payload.category}*\n` +
            `• Priority: *${payload.priority}*\n\n` +
            `*Details:*\n${payload.description || 'No additional details provided.'}`;

        sendTelegramNotification(adminTgId, msg, [[{ text: '🎟️ Triage in Support Desk', url: `${baseUrl}/app#tickets` }]], true);
      }
    } catch (e) {}

    return res.status(201).json({ success: true, ticket: formatted });
  } catch (err) {
    console.error('POST /api/tickets error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// PUT /api/tickets/:id — Update ticket status / assignee / priority
router.put('/:id', requireAuth, requireManager, async (req, res) => {
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
        const { processAutomationEvent } = require('../services/automation');
        const { readDB } = require('../services/db');
        const db = await readDB().catch(() => ({ clients: [], team: [] }));
        processAutomationEvent('ticket_resolved', { ticket: formatted }, db, null, broadcast);
      } catch (ae) {}

      // Send resolution email to client/submitter
      try {
        const { sendTicketResolutionEmail } = require('../services/resend');
        let clientEmail = formatted.client_email || formatted.clientEmail;
        let clientName = formatted.submitted_by || formatted.submittedBy || 'Valued Partner';
        if (!clientEmail && formatted.client_id && supabase) {
          const { data: cData } = await supabase.from('clients').select('email, contact_email, name').eq('id', formatted.client_id).maybeSingle();
          if (cData) {
            clientEmail = cData.email || cData.contact_email;
            if (cData.name) clientName = cData.name;
          }
        }
        if (clientEmail) {
          sendTicketResolutionEmail({
            clientEmail,
            clientName,
            ticketTitle: formatted.title,
            ticketId: formatted.id,
            resolutionNotes: description || 'Your support ticket has been resolved by our team.'
          }).catch(() => {});
        }
      } catch (emErr) {}
    }

    return res.json({ success: true, ticket: formatted });
  } catch (err) {
    console.error('PUT /api/tickets error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// PATCH /api/tickets/:id or /api/tickets/:id/status — Quick status update
router.patch(['/:id', '/:id/status'], requireAuth, requireManager, async (req, res) => {
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
router.delete('/:id', requireAuth, requireManager, async (req, res) => {
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

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4: Contractor Defect SLA Breach Holdback Protocol
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:id/sla-holdback', requireAuth, requireManager, async (req, res) => {
  try {
    const { id } = req.params;
    const { holdbackPercent = 15, reason = 'Critical P0 Warranty Defect SLA Breach', contractorId } = req.body;

    let ticket = inMemoryTickets.find(t => t.id === id);
    if (!ticket && supabase) {
      try {
        const { data } = await supabase.from('tickets').select('*').eq('id', id).maybeSingle();
        if (data) ticket = data;
      } catch (_) {}
    }

    if (!ticket) {
      ticket = {
        id,
        title: 'Reported Defect Ticket',
        priority: 'P0',
        status: 'Open',
        assigned_to: contractorId || 'Contractor Specialist'
      };
      inMemoryTickets.push(ticket);
    }

    const assignedContractor = contractorId || ticket.assigned_contractor || ticket.assignedContractor || ticket.assigned_to || ticket.assignedTo || 'Contractor Specialist';
    const holdbackRecord = {
      holdbackId: `HB-${Date.now().toString(36).toUpperCase()}`,
      ticketId: id,
      contractorId: assignedContractor,
      holdbackPercent: Number(holdbackPercent),
      reason,
      status: 'HELD_IN_ESCROW',
      remediationRequired: 'Hotfix verification and QA Lead sign-off',
      appliedAt: new Date().toISOString(),
      appliedBy: req.user?.name || 'Operations Lead'
    };

    ticket.slaHoldback = holdbackRecord;
    ticket.status = 'Escalated - Holdback Applied';
    ticket.updated_at = new Date().toISOString();

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('tickets').update({
          status: 'Escalated - Holdback Applied',
          sla_holdback: holdbackRecord,
          updated_at: ticket.updated_at
        }).eq('id', id);

        await supabase.from('sla_holdbacks').upsert({
          holdback_id: holdbackRecord.holdbackId,
          ticket_id: id,
          project_id: ticket.project_id || ticket.projectId || null,
          contractor_id: assignedContractor,
          holdback_percent: Number(holdbackPercent),
          reason,
          status: 'HELD_IN_ESCROW',
          remediation_required: holdbackRecord.remediationRequired,
          applied_at: holdbackRecord.appliedAt,
          applied_by: holdbackRecord.appliedBy
        });
      } catch (_) {}
    }

    try {
      broadcast('ticket_update', inMemoryTickets.map(mapTicket));
      broadcast('sla_breach_holdback', {
        ticketId: id,
        ticketTitle: ticket.title || 'Warranty Defect',
        contractorId: assignedContractor,
        holdbackPercent: Number(holdbackPercent),
        reason,
        appliedAt: holdbackRecord.appliedAt
      });
    } catch (e) {}

    // Dispatch Telegram alert
    try {
      const alertChatId = process.env.ADMIN_TELEGRAM_CHAT_ID || process.env.TELEGRAM_TEAM_GROUP_ID || process.env.OWNER_TELEGRAM_ID;
      if (alertChatId) {
        const baseUrl = process.env.BASE_URL || 'https://gro10x-ai.vercel.app';
        const alertMsg = `⚠️ *CONTRACTOR SLA HOLDBACK APPLIED*\n\n` +
          `• Ticket: \`${id}\` (${ticket.title || 'Warranty Defect'})\n` +
          `• Contractor: *${assignedContractor}*\n` +
          `• Holdback: *${holdbackPercent}% Milestone Escrow Frozen*\n` +
          `• Reason: ${reason}\n\n` +
          `_Release condition: Verified hotfix and QA approval._`;
        const inlineKeyboard = [
          [
            { text: '🚨 Acknowledge Defect SLA', callback_data: `ack_defect_sla:${id}` },
            { text: '🎟️ Open Ticket', url: `${baseUrl}/app#tickets` }
          ]
        ];
        sendTelegramNotification(alertChatId, alertMsg, inlineKeyboard, true);
      }
    } catch (_) {}

    try {
      const { emitStakeholderEvent } = require('../services/stakeholder-events');
      await emitStakeholderEvent('ticket.sla_breach_holdback', {
        ticket: { ...ticket, id, holdbackRecord },
        holdback: holdbackRecord,
        contractorId: assignedContractor
      }, {
        stakeholderId: assignedContractor,
        stakeholderType: 'contractor'
      });
    } catch (_) {}

    return res.status(200).json({
      ok: true,
      success: true,
      ticketId: id,
      holdback: holdbackRecord
    });
  } catch (err) {
    console.error('POST /api/tickets/:id/sla-holdback error:', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
module.exports.inMemoryTickets = inMemoryTickets;

