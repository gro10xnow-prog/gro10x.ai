const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/rbac');
const { supabase, isSupabaseConfigured } = require('../services/supabase');
const { broadcast } = require('../services/sse');
const { processAutomationEvent } = require('../services/automation');
const { sendTelegramNotification } = require('../services/bot');
const { sendClientOnboardingEmail } = require('../services/resend');

// ─────────────────────────────────────────────────────────────────────────────
// Helper: generate next lead ID from Supabase count
// ─────────────────────────────────────────────────────────────────────────────
async function nextLeadId() {
  if (isSupabaseConfigured()) {
    const { count } = await supabase.from('leads').select('id', { count: 'exact', head: true });
    return `LED-${String((count || 0) + 1).padStart(3, '0')}`;
  }
  return `LED-${Date.now()}`;
}

// GET all leads (Internal Team/Admin)
router.get('/', requireAuth, async (req, res) => {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
    if (!error) return res.json(data || []);
  }
  res.json([]);
});

// POST Public Lead Capture (Chat widget, newsletter, landing page form)
router.post('/', async (req, res) => {
  const newLead = {
    id: await nextLeadId(),
    stage: 'New Inquiry',
    created_at: new Date().toISOString(),
    company: req.body.clientName || req.body.company || '',
    contact_person: req.body.contactPerson || '',
    email: req.body.contactEmail || req.body.email || '',
    phone: req.body.phone || '',
    whatsapp: req.body.whatsapp || req.body.phone || '',
    source: req.body.source || 'Website Widget',
    category: req.body.category || 'General',
    service: req.body.service || req.body.serviceTitle || 'General',
    value: req.body.value || '',
    notes: req.body.notes || ''
  };

  if (isSupabaseConfigured()) {
    const { error } = await supabase.from('leads').insert([newLead]);
    if (error) console.warn('Lead insert error:', error.message);
  }

  broadcast('lead_update', [newLead]);

  // Telegram alert to agency owner
  try {
    const ownerChatId = process.env.OWNER_TELEGRAM_ID;
    if (ownerChatId) {
      sendTelegramNotification(ownerChatId,
        `🔔 *New Lead from Purple Bot Website!*\n\n` +
        `👤 *${newLead.contact_person || newLead.company}* — ${newLead.company || 'Brand'}\n` +
        `📞 Phone: \`${newLead.phone || newLead.whatsapp || 'N/A'}\`\n` +
        `🎯 Interested Service: *${newLead.service}*\n` +
        `📍 Source: ${newLead.source}`, null, false
      );
    }
  } catch (err) {
    console.warn('Telegram alert failed:', err.message);
  }

  res.json({ success: true, lead: newLead });
});

// PUT Update Lead Stage / Notes (Admin)
router.put('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;

  if (isSupabaseConfigured()) {
    const { data: existing } = await supabase.from('leads').select('*').eq('id', id).maybeSingle();
    if (!existing) return res.status(404).json({ error: 'Lead not found' });

    const updatedLead = { ...existing, ...req.body, updated_at: new Date().toISOString() };
    await supabase.from('leads').update(updatedLead).eq('id', id);
    broadcast('lead_update', [updatedLead]);
    return res.json({ success: true, lead: updatedLead });
  }

  res.status(503).json({ error: 'Database unavailable' });
});

// DELETE Lead (Admin only)
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;

  if (isSupabaseConfigured()) {
    await supabase.from('leads').delete().eq('id', id);
    broadcast('lead_update', [{ id, deleted: true }]);
    return res.json({ success: true });
  }

  res.status(503).json({ error: 'Database unavailable' });
});

// POST Magic Link Onboarding & Resend Email Trigger
router.post('/:id/onboard', requireAuth, async (req, res) => {
  const { id } = req.params;
  let lead = null;

  if (isSupabaseConfigured()) {
    const { data: l } = await supabase.from('leads').select('*').eq('id', id).maybeSingle();
    if (!l) {
      const { data: c } = await supabase.from('clients').select('*').eq('id', id).maybeSingle();
      lead = c;
    } else {
      lead = l;
    }
  }

  const clientName = lead ? (lead.company || lead.contact_person || lead.name || 'Client') : 'Client';
  const email = lead ? (lead.email || 'client@agency.com') : 'client@agency.com';
  const token = `TOK-${Date.now()}`;
  const magicLink = `https://purpleos-iota.vercel.app/partners?client=${encodeURIComponent(clientName)}&token=${token}`;

  let emailResult = { success: false };
  if (email && email.includes('@') && !email.includes('lead.com')) {
    emailResult = await sendClientOnboardingEmail({ clientName, email, magicLink });
  }

  res.json({ success: true, clientName, email, magicLink, emailSent: emailResult.success });
});

// POST Convert Lead to Active Client CRM
router.post('/:id/convert', requireAuth, async (req, res) => {
  const { id } = req.params;

  if (!isSupabaseConfigured()) return res.status(503).json({ error: 'Database unavailable' });

  const { data: lead } = await supabase.from('leads').select('*').eq('id', id).maybeSingle();
  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  // Mark lead as won
  await supabase.from('leads').update({ stage: 'Won / Closed', updated_at: new Date().toISOString() }).eq('id', id);

  // Check if client already exists
  const clientName = lead.company || lead.contact_person || 'New Client';
  const { data: existingClient } = await supabase.from('clients').select('id').ilike('name', clientName).maybeSingle();

  let clientRecord = existingClient;

  if (!existingClient) {
    const { count } = await supabase.from('clients').select('id', { count: 'exact', head: true });
    const newClientId = `CLI-${String((count || 0) + 1).padStart(4, '0')}`;
    const clientPayload = {
      id: newClientId,
      name: clientName,
      contact_person: lead.contact_person || 'Brand Lead',
      email: lead.email || '',
      phone: lead.phone || '',
      whatsapp: lead.whatsapp || lead.phone || '',
      status: 'Active Retainer',
      category: lead.category || 'General',
      total_spent: '$0',
      active_campaigns: [lead.service || 'New Campaign']
    };
    await supabase.from('clients').insert([clientPayload]);
    clientRecord = clientPayload;
    broadcast('client_update', [clientPayload]);
  }

  broadcast('lead_update', [{ id, stage: 'Won / Closed' }]);
  res.json({ success: true, client: clientRecord, lead });
});

// POST Public Web Consultation Booking
router.post('/book', async (req, res) => {
  const newLead = {
    id: await nextLeadId(),
    company: req.body.company || req.body.contactPerson || 'Web Lead',
    contact_person: req.body.contactPerson || 'Prospective Client',
    email: req.body.email || '',
    phone: req.body.phone || '',
    whatsapp: req.body.whatsapp || req.body.phone || '',
    source: 'Website Booking',
    category: req.body.category || 'General',
    service: req.body.service || 'Agency Services',
    value: req.body.value || '$1,000 - $3,000',
    stage: 'New Inquiry',
    notes: `Timeline: ${req.body.timeline || 'Flexible'}. Notes: ${req.body.notes || 'No extra notes.'}`,
    created_at: new Date().toISOString()
  };

  if (isSupabaseConfigured()) {
    await supabase.from('leads').insert([newLead]);
  }

  broadcast('lead_update', [newLead]);

  // Telegram alert to agency owner
  try {
    const ownerChatId = process.env.OWNER_TELEGRAM_ID;
    if (ownerChatId) {
      sendTelegramNotification(ownerChatId,
        `📅 *New Campaign Consultation Booked!*\n\n` +
        `👤 *${newLead.contact_person}* — ${newLead.company}\n` +
        `📞 Phone: \`${newLead.phone || newLead.whatsapp || 'N/A'}\`\n` +
        `🎯 Service: *${newLead.service}*\n` +
        `⏱️ Timeline: ${req.body.timeline || 'Flexible'}\n` +
        `📝 Notes: ${req.body.notes || 'N/A'}`, null, false
      );
    }
  } catch (err) {
    console.warn('Telegram booking alert failed:', err.message);
  }

  res.json({ success: true, lead: newLead });
});

module.exports = router;
