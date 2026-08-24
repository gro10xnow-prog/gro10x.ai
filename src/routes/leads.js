const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/rbac');
const { supabase, isSupabaseConfigured } = require('../services/supabase');
const { broadcast, broadcastToRole } = require('../services/sse');
const { processAutomationEvent } = require('../services/automation');
const { sendTelegramNotification } = require('../services/bot');
const { sendClientOnboardingEmail, sendLeadConfirmationEmail } = require('../services/resend');
const cache = require('../services/cache');

// Rate limiter for public lead submissions (10 submissions per 15 min per IP)
const leadSubmitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'test',
  message: { error: 'Too many submissions from this IP. Please try again later or contact us directly at +880 1711-019550.' }
});

function broadcastLeadEvent(eventType, data) {
  cache.delByPrefix('leads:');
  try {
    return broadcastToRole(eventType, data, ['owner', 'admin', 'manager', 'specialist', 'team']);
  } catch (e) {}
}

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

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Calculate dynamic lead score (1-100)
// ─────────────────────────────────────────────────────────────────────────────
function calculateLeadScore(lead) {
  let score = 50; // Base score

  // Budget Tier
  const value = String(lead.value || '').toLowerCase();
  if (value.includes('1000') || value.includes('5000') || value.includes('high')) score += 20;
  else if (value.includes('500') || value.includes('medium')) score += 10;
  else if (value.includes('low') || value.includes('100')) score -= 10;

  // Source
  const source = String(lead.source || '').toLowerCase();
  if (source.includes('referral') || source.includes('partner')) score += 15;
  else if (source.includes('organic') || source.includes('search')) score += 5;
  else if (source.includes('cold') || source.includes('outbound')) score -= 5;

  // Time in pipeline decay (decay by 1 point per day since creation, max -20)
  if (lead.created_at) {
    const createdDate = new Date(lead.created_at);
    const now = new Date();
    const daysOld = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
    if (daysOld > 0) {
      score -= Math.min(daysOld, 20);
    }
  }

  // Bonus for activity
  if (lead.stage === 'Proposal Sent' || lead.stage === 'Meeting Scheduled') score += 20;
  else if (lead.stage === 'Contacted') score += 10;
  else if (lead.stage === 'Lost' || lead.stage === 'Spam') score = 0;

  return Math.max(1, Math.min(100, score)); // Clamp between 1 and 100
}

// GET all leads (Internal Team/Admin, Supports ?limit=, ?page=)
router.get('/', requireAuth, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 200, 500);
    const page = Math.max(parseInt(req.query.page) || 0, 0);
    const offset = page * limit;
    const cacheKey = `leads:list:${limit}:${page}`;

    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false }).range(offset, offset + limit - 1);
      if (!error) {
        const leads = (data || []).map(l => ({ ...l, score: calculateLeadScore(l) }));
        cache.set(cacheKey, leads, 60000);
        return res.json(leads);
      }
    }
    res.json([]);
  } catch (err) {
    console.error('[Leads GET Error]:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST Public Lead Capture (Chat widget, newsletter, landing page form)
router.post('/', leadSubmitLimiter, async (req, res) => {
  // Honeypot anti-spam check (if automated bot fills hidden field, silently drop)
  const honeypot = (req.body.website_url || req.body.hp_field || req.body.bot_check || '').trim();
  if (honeypot) {
    return res.status(200).json({ success: true, message: 'Inquiry received' });
  }

  const email = (req.body.contactEmail || req.body.email || '').trim();
  const phone = (req.body.phone || req.body.whatsapp || '').trim();
  const company = (req.body.clientName || req.body.company || '').trim();
  const contactPerson = (req.body.contactPerson || req.body.name || '').trim();

  // Validate at least one contact channel is present
  if (!email && !phone) {
    return res.status(400).json({
      success: false,
      error: 'Please provide at least a phone number or email address so our team can follow up.'
    });
  }

  if (isSupabaseConfigured()) {
    if (email || phone) {
      let query = supabase.from('leads').select('id');
      if (email && phone) {
        query = query.or(`email.eq.${email},phone.eq.${phone}`);
      } else if (email) {
        query = query.eq('email', email);
      } else {
        query = query.eq('phone', phone);
      }
      
      const { data: existing } = await query;
      if (existing && existing.length > 0) {
        return res.status(200).json({
          success: true,
          isDuplicate: true,
          message: 'We already have your inquiry on file! Our Account Director will follow up with you shortly.',
          duplicateIds: existing.map(e => e.id)
        });
      }
    }
  }

  const newLead = {
    id: await nextLeadId(),
    stage: 'New Inquiry',
    created_at: new Date().toISOString(),
    company: company,
    contact_person: contactPerson,
    email,
    phone,
    whatsapp: req.body.whatsapp || phone,
    source: req.body.source || 'Website Widget',
    category: req.body.category || 'General',
    service: req.body.service || req.body.serviceTitle || 'General',
    value: req.body.value || '',
    notes: req.body.notes || '',
    utm_source: req.body.utm_source || '',
    utm_medium: req.body.utm_medium || '',
    utm_campaign: req.body.utm_campaign || ''
  };

  newLead.score = calculateLeadScore(newLead);

  if (isSupabaseConfigured()) {
    const { error } = await supabase.from('leads').insert([newLead]);
    if (error) {
      console.warn('[Leads API] Full schema insert warning:', error.message);
      // Fallback insert with core base columns in case migrations are pending in target DB
      if (error.message && (error.message.includes('column') || error.message.includes('schema'))) {
        const baseLead = {
          id: newLead.id,
          stage: newLead.stage,
          created_at: newLead.created_at,
          company: newLead.company,
          contact_person: newLead.contact_person,
          email: newLead.email,
          phone: newLead.phone,
          whatsapp: newLead.whatsapp,
          source: newLead.source,
          category: newLead.category,
          service: newLead.service,
          value: newLead.value,
          notes: newLead.notes
        };
        const { error: retryErr } = await supabase.from('leads').insert([baseLead]);
        if (retryErr) {
          console.error('[Leads API] Fallback insert error:', retryErr.message);
        } else {
          console.log('✅ [Leads API] Persisted lead with base schema fallback');
        }
      }
    }
  }

  broadcastLeadEvent('lead_update', [newLead]);

  // Send automated confirmation email to prospect if email provided
  if (email && email.includes('@')) {
    try {
      const emailResult = await sendLeadConfirmationEmail({
        contactPerson: newLead.contact_person,
        email: newLead.email,
        service: newLead.service,
        company: newLead.company
      });
      if (emailResult && !emailResult.success && !emailResult.simulated) {
        console.warn('[Leads API] Lead confirmation email delivery note:', emailResult.error);
      }
    } catch (err) {
      console.warn('[Leads API] Confirmation email exception:', err.message);
    }
  }

  // Tiered Telegram alert to agency owner with dynamic priority & WhatsApp CTA
  try {
    const ownerChatId = process.env.OWNER_TELEGRAM_ID;
    if (ownerChatId) {
      const score = newLead.score || 50;
      let header = `🔔 *New Lead from Purplebot Digital!*\n🏅 Score: *${score}/100*`;
      if (score >= 75) {
        header = `🔥 *PRIORITY LEAD — HIGH CONVERSION POTENTIAL!*\n🏅 Score: *${score}/100* — _Fast response recommended (<30m)_`;
      } else if (score < 50) {
        header = `📝 *New Lead Inquiry (Low Priority)*\n🏅 Score: *${score}/100*`;
      }

      const alertMsg =
        `${header}\n\n` +
        `👤 *${newLead.contact_person || newLead.company || 'Prospective Client'}* — ${newLead.company || 'Brand'}\n` +
        `📞 Phone: \`${newLead.phone || newLead.whatsapp || 'N/A'}\`\n` +
        `📧 Email: \`${newLead.email || 'N/A'}\`\n` +
        `🎯 Interested Service: *${newLead.service}*\n` +
        `📍 Source: ${newLead.source}` +
        (newLead.notes ? `\n📝 Notes: _${newLead.notes}_` : '');

      const cleanPhone = (newLead.phone || newLead.whatsapp || '').replace(/\D/g, '');
      const buttons = [];
      const row = [];

      if (cleanPhone && cleanPhone.length >= 8) {
        const waPhone = cleanPhone.startsWith('880') ? cleanPhone : (cleanPhone.startsWith('0') ? `88${cleanPhone}` : cleanPhone);
        row.push({ text: '📞 WhatsApp Now', url: `https://wa.me/${waPhone}` });
      }
      if (score >= 75) {
        row.push({ text: '👁 View in CRM', url: 'https://gro10x-ai.vercel.app/admin?tab=leads' });
      }
      if (row.length > 0) buttons.push(row);

      sendTelegramNotification(ownerChatId, alertMsg, buttons.length > 0 ? buttons : null, false);
    }
  } catch (err) {
    console.warn('Telegram alert failed:', err.message);
  }

  res.json({ success: true, lead: newLead });
});

// PUT Update Lead Stage / Notes (Admin)
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    if (isSupabaseConfigured()) {
      const { data: existing } = await supabase.from('leads').select('*').eq('id', id).maybeSingle();
      if (!existing) return res.status(404).json({ error: 'Lead not found' });

      const updatedLead = { ...existing, ...req.body, updated_at: new Date().toISOString() };
      await supabase.from('leads').update(updatedLead).eq('id', id);
      
      updatedLead.score = calculateLeadScore(updatedLead);
      broadcastLeadEvent('lead_update', [updatedLead]);
      return res.json({ success: true, lead: updatedLead });
    }

    res.status(503).json({ error: 'Database unavailable' });
  } catch (err) {
    console.error('[Leads PUT Error]:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE Lead (Admin only)
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (isSupabaseConfigured()) {
      await supabase.from('leads').delete().eq('id', id);
      broadcastLeadEvent('lead_update', [{ id, deleted: true }]);
      return res.json({ success: true });
    }

    res.status(503).json({ error: 'Database unavailable' });
  } catch (err) {
    console.error('[Leads DELETE Error]:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST Magic Link Onboarding & Resend Email Trigger
router.post('/:id/onboard', requireAuth, async (req, res) => {
  try {
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
    const magicLink = `https://gro10x-ai.vercel.app/partners?client=${encodeURIComponent(clientName)}&token=${token}`;

    let emailResult = { success: false };
    if (email && email.includes('@') && !email.includes('lead.com')) {
      emailResult = await sendClientOnboardingEmail({ clientName, email, magicLink });
    }

    res.json({ success: true, clientName, email, magicLink, emailSent: emailResult.success });
  } catch (err) {
    console.error('[Leads Onboard Error]:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST Convert Lead to Active Client CRM
router.post('/:id/convert', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!isSupabaseConfigured()) return res.status(503).json({ error: 'Database unavailable' });

    const { data: lead } = await supabase.from('leads').select('*').eq('id', id).maybeSingle();
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

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
      broadcastLeadEvent('client_update', [clientPayload]);
    }

    // Update lead with won status and client_id back-reference
    await supabase.from('leads').update({
      stage: 'Won / Closed',
      client_id: clientRecord.id,
      updated_at: new Date().toISOString()
    }).eq('id', id);

    broadcastLeadEvent('lead_update', [{ id, stage: 'Won / Closed', client_id: clientRecord.id }]);
    res.json({ success: true, client: clientRecord, lead });
  } catch (err) {
    console.error('[Leads Convert Error]:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST Public Web Consultation Booking
router.post('/book', leadSubmitLimiter, async (req, res) => {
  try {
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

    broadcastLeadEvent('lead_update', [newLead]);

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
  } catch (err) {
    console.error('[Leads Book Error]:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/leads/bulk (CSV Import)
router.post('/bulk', requireAuth, async (req, res) => {
  try {
    const { leads } = req.body;
    if (!leads || !Array.isArray(leads) || leads.length === 0) {
      return res.status(400).json({ error: 'No leads provided' });
    }

    const leadsToInsert = [];
    const startId = parseInt((await nextLeadId()).replace(/^(LED|LD)-/, ''), 10);
    let idCounter = isNaN(startId) ? 1 : startId;

    for (const l of leads) {
      const newLead = {
        id: `LED-${String(idCounter++).padStart(3, '0')}`,
        stage: 'New Inquiry',
        created_at: new Date().toISOString(),
        company: l.company || l.clientName || 'Unknown',
        contact_person: l.contactPerson || l.name || '',
        email: l.email || '',
        phone: l.phone || l.whatsapp || '',
        whatsapp: l.whatsapp || l.phone || '',
        source: l.source || 'Bulk Import',
        category: l.category || 'General',
        service: l.service || 'General',
        value: l.value || '',
        notes: l.notes || 'Imported via CSV',
        utm_source: '',
        utm_medium: '',
        utm_campaign: ''
      };
      newLead.score = calculateLeadScore(newLead);
      leadsToInsert.push(newLead);
    }

    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('leads').insert(leadsToInsert);
      if (error) return res.status(500).json({ error: 'Database insert failed: ' + error.message });
    }

    broadcastLeadEvent('lead_update', leadsToInsert);
    res.json({ success: true, count: leadsToInsert.length });
  } catch (err) {
    console.error('[Leads Bulk Error]:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
