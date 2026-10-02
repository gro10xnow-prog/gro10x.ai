const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/rbac');
const { supabase, isSupabaseConfigured } = require('../services/supabase');
const sse = require('../services/sse');
const broadcast = (...args) => sse.broadcast(...args);
const broadcastToRole = (...args) => sse.broadcastToRole(...args);
const { processAutomationEvent } = require('../services/automation');
const botNotifications = require('../services/bot/notifications');
const sendTelegramNotification = (...args) => botNotifications.sendTelegramNotification(...args);
const { sendClientOnboardingEmail, sendLeadConfirmationEmail, sendServiceAssetDeliveryEmail } = require('../services/resend');
const cache = require('../services/cache');
const { verifyToken, signToken } = require('../services/jwt');
const { readDB, writeDB } = require('../services/db');

// Rate limiter for public lead submissions (10 submissions per 15 min per IP)
const leadSubmitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    if (process.env.NODE_ENV === 'test') return true;
    const auth = req.headers.authorization;
    if (auth && auth.startsWith('Bearer ')) return true;
    return false;
  },
  message: { error: 'Too many submissions from this IP. Please try again later or contact us directly at +880 1711-019550.' }
});

function broadcastLeadEvent(eventType, data) {
  cache.delByPrefix('leads:');
  try {
    sse.broadcast(eventType, data);
    return broadcastToRole(eventType, data, ['owner', 'admin', 'manager', 'specialist', 'team']);
  } catch (e) {}
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: generate next lead ID from Supabase count
// ─────────────────────────────────────────────────────────────────────────────
async function nextLeadId() {
  let highestNum = 0;
  if (isSupabaseConfigured()) {
    try {
      const { data } = await supabase.from('leads').select('id').order('created_at', { ascending: false }).limit(200);
      if (Array.isArray(data)) {
        for (const row of data) {
          const match = String(row.id).match(/^LED-(\d+)$/i);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num > highestNum) highestNum = num;
          }
        }
      }
    } catch (_) {}
  }
  try {
    const db = await readDB();
    for (const row of (db.leads || [])) {
      const match = String(row.id).match(/^LED-(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > highestNum) highestNum = num;
      }
    }
  } catch (_) {}

  if (highestNum > 0) {
    return `LED-${String(highestNum + 1).padStart(3, '0')}`;
  }
  return `LED-${Date.now()}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Calculate dynamic lead score (1-100)
// ─────────────────────────────────────────────────────────────────────────────
function calculateLeadScore(lead) {
  let score = 50; // Base score

  // Budget Tier
  const value = String(lead.value || lead.budget || '').toLowerCase();
  const numVal = parseFloat(value.replace(/[^0-9.]/g, '')) || 0;
  if (numVal >= 1000 || value.includes('1000') || value.includes('5000') || value.includes('high')) score += 20;
  else if (numVal >= 500 || value.includes('500') || value.includes('medium')) score += 10;
  else if (value.includes('low') || value.includes('100')) score -= 10;

  // Source
  const source = String(lead.source || '').toLowerCase();
  if (source.includes('referral') || source.includes('partner') || lead.referral_code || lead.referralCode) score += 15;
  else if (source.includes('organic') || source.includes('search')) score += 5;
  else if (source.includes('cold') || source.includes('outbound')) score -= 5;

  // Verified Engine 2 Outbound Campaign Attribution
  if (String(lead.utm_campaign || '').startsWith('CMP-E2-')) score += 15;

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

function normalizeStage(stage) {
  if (!stage) return 'New Inquiry';
  const s = String(stage).trim().toLowerCase();
  if (['new', 'new inquiry', 'inquiry', 'pending'].includes(s)) return 'New Inquiry';
  if (['contacted', 'reached_out'].includes(s)) return 'Contacted';
  if (['proposal', 'proposal sent', 'proposal_sent', 'pitched'].includes(s)) return 'Proposal Sent';
  if (['meeting', 'meeting scheduled', 'meeting_scheduled', 'call'].includes(s)) return 'Meeting Scheduled';
  if (['won', 'won / closed', 'closed', 'won_closed', 'converted'].includes(s)) return 'Won / Closed';
  if (['lost', 'rejected'].includes(s)) return 'Lost';
  if (['spam', 'junk'].includes(s)) return 'Spam';
  return stage;
}

// GET all leads (Internal Team/Admin, Supports ?engineId=, ?limit=, ?page=)
router.get('/', requireAuth, async (req, res) => {
  try {
    const { normalizeEngineId } = require('../utils/engine-scope');
    const engineFilter = normalizeEngineId(req.query.engineId || req.query.engine || req.headers['x-gro10x-engine']);
    const limit = Math.min(parseInt(req.query.limit) || 200, 500);
    const page = Math.max(parseInt(req.query.page) || 0, 0);
    const offset = page * limit;
    const cacheKey = `leads:list:${engineFilter || ''}:${limit}:${page}`;

    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    if (isSupabaseConfigured()) {
      let query = supabase.from('leads').select('*').order('created_at', { ascending: false }).range(offset, offset + limit - 1);
      if (engineFilter && engineFilter !== 'all') {
        const engineCode = engineFilter.toUpperCase().replace('ENGINE', 'E');
        query = query.or(`engine_tag.eq.${engineFilter},engine_tag.eq.${engineCode},utm_campaign.ilike.%CMP-${engineCode}%`);
      }
      const { data, error } = await query;
      if (!error) {
        let leads = (data || []).map(l => ({
          ...l,
          engineTag: l.engine_tag || (l.utm_campaign?.includes('CMP-E2') ? 'engine2' : 'engine2'),
          stage: normalizeStage(l.stage || l.status),
          company: l.company || l.name || 'Inquiring Brand',
          contact_person: l.contact_person || l.name || 'Direct Contact',
          score: calculateLeadScore(l)
        }));
        cache.set(cacheKey, leads, 60000);
        return res.json(leads);
      }
    }

    try {
      const db = await readDB();
      let localLeads = (db.leads || []).map(l => ({
        ...l,
        engineTag: l.engine_tag || (l.utm_campaign?.includes('CMP-E2') ? 'engine2' : 'engine2'),
        stage: normalizeStage(l.stage || l.status),
        company: l.company || l.name || 'Inquiring Brand',
        contact_person: l.contact_person || l.name || 'Direct Contact',
        score: calculateLeadScore(l)
      }));
      return res.json(localLeads.slice(offset, offset + limit));
    } catch (_) {}

    res.json([]);
  } catch (err) {
    console.error('[Leads GET Error]:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST Lead Capture (Supports Public Form AND Authenticated Internal Admin Entry)
router.post('/', leadSubmitLimiter, async (req, res) => {
  // Check if requester is authenticated admin/team member
  let isAuthenticatedAdmin = false;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (decoded) isAuthenticatedAdmin = true;
  }

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

  // Deduplication check for public visitors
  const isSprintSubmission = String(req.body.source || '').toLowerCase().includes('sprint') ||
                             String(req.body.service || '').toLowerCase().includes('sprint') ||
                             String(req.body.serviceTitle || '').toLowerCase().includes('sprint') ||
                             String(req.body.notes || '').includes('SPRINT');

  if (isSupabaseConfigured()) {
    if (email || phone) {
      let query = supabase.from('leads').select('*');
      if (email && phone) {
        query = query.or(`email.eq.${email},phone.eq.${phone}`);
      } else if (email) {
        query = query.eq('email', email);
      } else {
        query = query.eq('phone', phone);
      }
      
      const { data: existing } = await query;
      if (!isAuthenticatedAdmin && existing && existing.length > 0) {
        if (isSprintSubmission) {
          // Founder already exists in CRM — seamlessly update their record with Sprint 01 pitch
          const target = existing[0];
          const mergedNotes = req.body.notes 
            ? `${req.body.notes}\n\n---\n[Previous Notes]:\n${target.notes || 'None'}`
            : target.notes;
          
          const updatePayload = {
            company: company || target.company,
            contact_person: contactPerson || target.contact_person,
            name: contactPerson || company || target.name,
            service_interest: req.body.service || 'Venture Studio Sprint',
            source: req.body.source || 'Sprint Cohort 01 - LinkedIn',
            stage: 'New Inquiry',
            status: 'new',
            notes: mergedNotes,
            score: Math.max(target.score || 50, 75), // Boost score for high-intent sprint submission
            updated_at: new Date().toISOString()
          };

          await supabase.from('leads').update(updatePayload).eq('id', target.id);
          const fullUpdatedLead = { ...target, ...updatePayload };
          broadcastLeadEvent('lead_update', [fullUpdatedLead]);

          // Priority Telegram alert for updated sprint applicant
          try {
            const ownerChatId = process.env.OWNER_TELEGRAM_ID;
            if (ownerChatId) {
              const alertMsg =
                `🚀 *NEW SPRINT 01 APPLICANT (Existing Contact Re-Applied)!*\n\n` +
                `👤 *${fullUpdatedLead.contact_person || fullUpdatedLead.company}*\n` +
                `🏢 Startup: *${company || fullUpdatedLead.company}*\n` +
                `📞 Phone: \`${fullUpdatedLead.phone || 'N/A'}\`\n` +
                `📧 Email: \`${fullUpdatedLead.email || 'N/A'}\`\n` +
                `📝 Notes: _${req.body.notes || 'Sprint application received.'}_`;

              const cleanPhone = (fullUpdatedLead.phone || fullUpdatedLead.whatsapp || '').replace(/\D/g, '');
              const buttons = [];
              const row = [];
              if (cleanPhone && cleanPhone.length >= 8) {
                const waPhone = cleanPhone.startsWith('880') ? cleanPhone : (cleanPhone.startsWith('0') ? `88${cleanPhone}` : cleanPhone);
                row.push({ text: '📞 WhatsApp Now', url: `https://wa.me/${waPhone}` });
              }
              const baseUrl = process.env.BASE_URL || 'https://gro10x-ai.vercel.app';
              row.push({ text: '👁 View in CRM', url: `${baseUrl}/app#leads` });
              if (row.length > 0) buttons.push(row);

              sendTelegramNotification(ownerChatId, alertMsg, buttons.length > 0 ? buttons : null, false);
            }
          } catch (_) {}

          return res.status(200).json({
            success: true,
            updated: true,
            lead: fullUpdatedLead
          });
        } else {
          return res.status(200).json({
            success: true,
            isDuplicate: true,
            lead: existing[0],
            message: 'We already have your inquiry on file! Our Account Director will follow up with you shortly.',
            duplicateIds: existing.map(e => e.id)
          });
        }
      }
    }
  }

  const referralCode = (req.body.referral_code || req.body.referralCode || req.body.refCode || req.body.affiliate_code || req.body.ref || req.cookies?.gro10x_aff_ref || '').trim().toUpperCase();

  const startingStage = req.body.stage || 'New Inquiry';
  const newLead = {
    id: await nextLeadId(),
    stage: startingStage,
    created_at: new Date().toISOString(),
    company: company,
    contact_person: contactPerson,
    email,
    phone,
    whatsapp: req.body.whatsapp || phone,
    referral_code: referralCode || null,
    source: referralCode && (!req.body.source || req.body.source === 'Website Widget')
      ? `Partner Referral (${referralCode})`
      : (req.body.source || (isAuthenticatedAdmin ? 'Manual Entry' : 'Website Widget')),
    category: req.body.category || 'General',
    service: req.body.service || req.body.serviceTitle || 'General',
    value: req.body.value || req.body.budget || '',
    notes: referralCode
      ? `[Referred by Partner: ${referralCode}]\n${req.body.notes || ''}`.trim()
      : (req.body.notes || ''),
    utm_source: req.body.utm_source || (referralCode ? `affiliate_${referralCode}` : ''),
    utm_medium: req.body.utm_medium || (referralCode ? 'referral_portal' : ''),
    utm_campaign: req.body.utm_campaign || ''
  };

  newLead.score = calculateLeadScore(newLead);

  const leadRow = {
    id: newLead.id,
    name: contactPerson || company || 'Prospective Client',
    company: company || 'Prospective Client',
    contact_person: contactPerson,
    email: newLead.email,
    phone: newLead.phone,
    service_interest: req.body.service_interest || newLead.service,
    source: newLead.source,
    stage: startingStage,
    status: startingStage === 'Won / Closed' ? 'won' : (startingStage === 'Lost' ? 'lost' : 'new'),
    currency: req.body.currency || 'BDT',
    budget: req.body.budget || req.body.value || null,
    value: parseFloat(String(newLead.value || '0').replace(/[^0-9.]/g, '')) || 0,
    score: newLead.score || 50,
    notes: newLead.notes || null,
    utm_source: newLead.utm_source || null,
    utm_medium: newLead.utm_medium || null,
    utm_campaign: newLead.utm_campaign || null,
    created_at: newLead.created_at,
    updated_at: newLead.created_at
  };

  if (isSupabaseConfigured()) {
    const { error } = await supabase.from('leads').insert([leadRow]);
    if (error) {
      console.warn('[Leads API] Supabase lead insert warning:', error.message);
    } else {
      console.log('✅ [Leads API] Lead persisted successfully to Supabase:', leadRow.id);
    }
  }

  try {
    const db = await readDB();
    db.leads = db.leads || [];
    db.leads.unshift(newLead);
    await writeDB(db);
  } catch (_) {}

  broadcastLeadEvent('lead_update', [newLead]);
  broadcastLeadEvent('lead_created', newLead);
  try {
    const { emitStakeholderEvent } = require('../services/stakeholder-events');
    emitStakeholderEvent('lead.created', { lead: newLead }, { stakeholderId: newLead.id, stakeholderType: 'lead' }).catch(() => {});
  } catch (_) {}

  // Send automated confirmation email asynchronously without blocking HTTP response
  if (email && email.includes('@')) {
    sendLeadConfirmationEmail({
      contactPerson: leadRow.name,
      email: leadRow.email,
      service: leadRow.service_interest,
      company: company || leadRow.name
    }).catch(err => {
      console.warn('[Leads API] Confirmation email exception:', err.message);
    });

    // Also dispatch the requested architecture blueprint and case study assets if service is matched
    const serviceCode = leadRow.service_interest || newLead.service;
    if (serviceCode && typeof sendServiceAssetDeliveryEmail === 'function') {
      const { getServiceByCode } = require('../services/taxonomy');
      getServiceByCode(serviceCode).then(matchedProduct => {
        if (matchedProduct) {
          const proof = matchedProduct.metadata?.proof_pack || {};
          sendServiceAssetDeliveryEmail({
            email: leadRow.email,
            contactPerson: leadRow.name,
            serviceName: matchedProduct.name,
            productCode: matchedProduct.product_code,
            slidesUrl: proof.slides_pdf_url,
            blueprintUrl: proof.blueprint_url,
            audioUrl: proof.audio_overview_url
          }).catch(err => console.warn('[Leads API] Asset delivery email exception:', err.message));
        }
      }).catch(() => {});
    }
  }

  // Tiered Telegram alert to agency owner with dynamic priority & WhatsApp CTA
  try {
    const ownerChatId = process.env.OWNER_TELEGRAM_ID;
    if (ownerChatId) {
      const score = newLead.score || 50;
      let header = `🔔 *New Lead from GRO10X AI Agency!*\n🏅 Score: *${score}/100*`;
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
        (newLead.referral_code ? `\n🤝 Partner Referral: \`${newLead.referral_code}\`` : '') +
        (newLead.utm_campaign ? `\n🎯 Campaign: \`${newLead.utm_campaign}\`` : '') +
        (newLead.notes ? `\n📝 Notes: _${newLead.notes}_` : '');

      const cleanPhone = (newLead.phone || newLead.whatsapp || '').replace(/\D/g, '');
      const buttons = [];
      const row = [];

      if (cleanPhone && cleanPhone.length >= 8) {
        const waPhone = cleanPhone.startsWith('880') ? cleanPhone : (cleanPhone.startsWith('0') ? `88${cleanPhone}` : cleanPhone);
        row.push({ text: '📞 WhatsApp Now', url: `https://wa.me/${waPhone}` });
      }
      if (score >= 75) {
        const baseUrl = process.env.BASE_URL || 'https://gro10x-ai.vercel.app';
        row.push({ text: '👁 View in CRM', url: `${baseUrl}/app#leads` });
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
    let existing = null;

    if (isSupabaseConfigured()) {
      try {
        const { data } = await supabase.from('leads').select('*').eq('id', id).maybeSingle();
        if (data) existing = data;
      } catch (_) {}
    }

    if (!existing) {
      try {
        const db = await readDB();
        existing = (db.leads || []).find(l => l.id === id);
      } catch (_) {}
    }

    if (!existing) return res.status(404).json({ error: 'Lead not found' });

    const updatedLead = { ...existing, ...req.body, updated_at: new Date().toISOString() };
    updatedLead.score = calculateLeadScore(updatedLead);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('leads').update(updatedLead).eq('id', id);
      } catch (_) {}
    }

    try {
      const db = await readDB();
      db.leads = db.leads || [];
      const idx = db.leads.findIndex(l => l.id === id);
      if (idx !== -1) {
        db.leads[idx] = { ...db.leads[idx], ...updatedLead };
      } else {
        db.leads.unshift(updatedLead);
      }
      await writeDB(db);
    } catch (_) {}

    broadcastLeadEvent('lead_update', [updatedLead]);
    if (req.body.stage && req.body.stage !== existing.stage) {
      try {
        const { emitStakeholderEvent } = require('../services/stakeholder-events');
        if (req.body.stage === 'Won / Closed') {
          emitStakeholderEvent('lead.won', { lead: updatedLead }, { stakeholderId: id, stakeholderType: 'lead' }).catch(() => {});
        } else if (req.body.stage === 'Lost') {
          emitStakeholderEvent('lead.lost', { lead: updatedLead }, { stakeholderId: id, stakeholderType: 'lead' }).catch(() => {});
        }
      } catch (_) {}
    }
    return res.json({ success: true, lead: updatedLead });
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
      try {
        await supabase.from('leads').delete().eq('id', id);
      } catch (_) {}
    }

    try {
      const db = await readDB();
      db.leads = (db.leads || []).filter(l => l.id !== id);
      await writeDB(db);
    } catch (_) {}

    broadcastLeadEvent('lead_update', [{ id, deleted: true }]);
    return res.json({ success: true });
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

    if (!lead) {
      try {
        const db = await readDB();
        lead = (db.leads || []).find(x => x.id === id) || (db.clients || []).find(x => x.id === id);
      } catch (_) {}
    }

    const clientId = lead?.client_id || lead?.id || `CLI-${Date.now()}`;
    const clientName = lead ? (lead.company || lead.name || lead.contact_person || 'Client Partner') : 'Client Partner';
    const email = lead ? (lead.email || 'client@agency.com') : 'client@agency.com';

    // Issue signed 30-day Client Partner JWT session token
    const clientSessionToken = signToken({
      userId: clientId,
      id: clientId,
      email,
      name: clientName,
      company: clientName,
      role: 'Client Partner',
      accessLevel: 'Client Partner',
      linkedType: 'client',
      linkedId: clientId
    }, '30d');

    const baseUrl = process.env.BASE_URL || 'https://gro10x-ai.vercel.app';
    const magicLink = `${baseUrl}/client?token=${clientSessionToken}#home`;

    let emailResult = { success: false };
    if (email && email.includes('@') && !email.includes('lead.com') && !email.includes('.test')) {
      try {
        emailResult = await sendClientOnboardingEmail({ clientName, email, magicLink });
      } catch (emailErr) {
        console.warn('[Leads Onboard] Email dispatch skipped/failed:', emailErr.message);
      }
    }

    res.json({
      success: true,
      clientName,
      email,
      clientId,
      token: clientSessionToken,
      clientToken: clientSessionToken,
      magicLink,
      onboardingUrl: magicLink,
      emailSent: Boolean(emailResult?.success)
    });
  } catch (err) {
    console.error('[Leads Onboard Error]:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST Convert Lead to Active Client CRM
router.post('/:id/convert', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    let lead = null;

    if (isSupabaseConfigured()) {
      try {
        const { data } = await supabase.from('leads').select('*').eq('id', id).maybeSingle();
        if (data) lead = data;
      } catch (_) {}
    }

    if (!lead) {
      try {
        const db = await readDB();
        lead = (db.leads || []).find(l => l.id === id);
      } catch (_) {}
    }

    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const clientName = lead.company || lead.contact_person || 'New Client';
    let clientRecord = null;

    if (isSupabaseConfigured()) {
      try {
        const { data: existingClient } = await supabase.from('clients').select('*').ilike('name', clientName).maybeSingle();
        clientRecord = existingClient;
      } catch (_) {}
    }

    if (!clientRecord) {
      try {
        const db = await readDB();
        clientRecord = (db.clients || []).find(c => c.name && c.name.toLowerCase() === clientName.toLowerCase());
      } catch (_) {}
    }

    if (!clientRecord) {
      let clientCount = 0;
      if (isSupabaseConfigured()) {
        try {
          const { count } = await supabase.from('clients').select('id', { count: 'exact', head: true });
          clientCount = count || 0;
        } catch (_) {}
      }
      if (!clientCount) {
        try {
          const db = await readDB();
          clientCount = (db.clients || []).length;
        } catch (_) {}
      }

      const newClientId = `CLI-${String(clientCount + 1).padStart(4, '0')}`;
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

      if (isSupabaseConfigured()) {
        try {
          await supabase.from('clients').insert([clientPayload]);
        } catch (_) {}
      }

      clientRecord = clientPayload;
      broadcastLeadEvent('client_update', [clientPayload]);
    }

    const updatedLeadData = {
      ...lead,
      stage: 'Won / Closed',
      client_id: clientRecord.id,
      updated_at: new Date().toISOString()
    };

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('leads').update({
          stage: 'Won / Closed',
          client_id: clientRecord.id,
          updated_at: updatedLeadData.updated_at
        }).eq('id', id);
      } catch (_) {}
    }

    try {
      const db = await readDB();
      db.clients = db.clients || [];
      const cIdx = db.clients.findIndex(c => c.id === clientRecord.id);
      if (cIdx !== -1) {
        db.clients[cIdx] = { ...db.clients[cIdx], ...clientRecord };
      } else {
        db.clients.push(clientRecord);
      }

      db.leads = db.leads || [];
      const lIdx = db.leads.findIndex(l => l.id === id);
      if (lIdx !== -1) {
        db.leads[lIdx] = { ...db.leads[lIdx], ...updatedLeadData };
      } else {
        db.leads.unshift(updatedLeadData);
      }
      await writeDB(db);
    } catch (_) {}

    broadcastLeadEvent('lead_update', [{ id, stage: 'Won / Closed', client_id: clientRecord.id }]);
    try {
      const { emitStakeholderEvent } = require('../services/stakeholder-events');
      emitStakeholderEvent('lead.converted', { lead: updatedLeadData, client: clientRecord }, { stakeholderId: clientRecord.id, stakeholderType: 'client' }).catch(() => {});
      emitStakeholderEvent('lead.won', { lead: updatedLeadData, client: clientRecord }, { stakeholderId: clientRecord.id, stakeholderType: 'client' }).catch(() => {});
    } catch (_) {}
    res.json({ success: true, client: clientRecord, lead: updatedLeadData });
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

    try {
      const db = await readDB();
      db.leads = db.leads || [];
      db.leads.unshift(newLead);
      await writeDB(db);
    } catch (_) {}

    broadcastLeadEvent('lead_update', [newLead]);
    try {
      const { emitStakeholderEvent } = require('../services/stakeholder-events');
      emitStakeholderEvent('lead.created', { lead: newLead }, { stakeholderId: newLead.id, stakeholderType: 'lead' }).catch(() => {});
    } catch (_) {}

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
      try {
        const sbRows = leadsToInsert.map(l => ({
          id: l.id,
          name: l.contact_person || l.company || 'Prospective Client',
          company: l.company || 'Prospective Client',
          contact_person: l.contact_person,
          email: l.email || `${l.id.toLowerCase()}@bulk.gro10x.ai`,
          phone: l.phone,
          service_interest: l.service || 'General',
          source: l.source,
          stage: l.stage,
          status: 'new',
          currency: 'BDT',
          value: parseFloat(String(l.value || '0').replace(/[^0-9.]/g, '')) || 0,
          score: l.score || 50,
          notes: l.notes || null,
          created_at: l.created_at,
          updated_at: l.created_at
        }));
        const { error } = await supabase.from('leads').insert(sbRows);
        if (error) console.warn('[Leads Bulk] Supabase insert warning:', error.message);
      } catch (sbErr) {
        console.warn('[Leads Bulk] Supabase exception:', sbErr.message);
      }
    }

    try {
      const db = await readDB();
      db.leads = db.leads || [];
      db.leads.unshift(...leadsToInsert);
      await writeDB(db);
    } catch (_) {}

    broadcastLeadEvent('lead_update', leadsToInsert);
    res.json({ success: true, count: leadsToInsert.length });
  } catch (err) {
    console.error('[Leads Bulk Error]:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/leads/:id/create-proposal
 * Converts a lead record directly into an official client SOW proposal referencing the canonical catalog service
 */
router.post('/:id/create-proposal', async (req, res) => {
  try {
    const { id } = req.params;
    const { getServiceByCode } = require('../services/taxonomy');
    const crypto = require('crypto');

    let lead = null;
    if (isSupabaseConfigured()) {
      try {
        const { data } = await supabase.from('leads').select('*').eq('id', id).maybeSingle();
        if (data) lead = data;
      } catch (_) {}
    }

    if (!lead) {
      try {
        const db = await readDB();
        lead = (db.leads || []).find(l => String(l.id) === String(id));
      } catch (_) {}
    }

    if (!lead) {
      // Memory / request body fallback
      lead = {
        id,
        name: req.body.clientName || req.body.contactPerson || 'Valued Client',
        company: req.body.clientCompany || req.body.company || 'Client Partner',
        email: req.body.clientEmail || req.body.email || 'client@example.com',
        phone: req.body.clientPhone || req.body.phone || '',
        service_interest: req.body.service || req.body.service_interest || 'SVC-001',
        budget: req.body.budget || req.body.value || 2500
      };
    }

    const serviceCode = lead.service_interest || lead.service || 'SVC-001';
    const product = await getServiceByCode(serviceCode) || {
      name: `${serviceCode} AI Sprint`,
      metadata: {
        description: 'Production AI engineering sprint deliverable.',
        price_usd: 2500,
        engineering: {
          core_deliverables: [
            'Complete UX/UI Wireframes & Responsive Layouts',
            'Production Codebase Repository (GitHub)',
            'Supabase Database Setup with RLS',
            'Automated CI/CD Edge Deployment'
          ],
          turnaround_days: 14,
          warranty_days: 30
        }
      }
    };

    const deliverables = product.metadata?.engineering?.core_deliverables || [
      'Full Source Code Handover (GitHub Repository)',
      'Production Relational Database Setup',
      'Automated CI/CD Cloud Deployment',
      '30 Days Bug-Fix Warranty & Maintenance'
    ];

    const priceUsd = product.metadata?.price_usd || 2500;
    const shareToken = crypto.randomBytes(6).toString('hex');
    const proposalId = `PRP-${Date.now().toString().slice(-6)}`;

    const newProposal = {
      id: proposalId,
      share_token: shareToken,
      client_name: lead.name || lead.contact_person || 'Valued Client',
      client_company: lead.company || '',
      client_email: lead.email || '',
      client_phone: lead.phone || '',
      project_title: `${product.name} — 14-Day Production Sprint`,
      project_summary: product.metadata?.description || `Turnkey engineering and production deployment of ${product.name}.`,
      canonical_service_code: product.product_code || serviceCode,
      scope_items: deliverables,
      one_time_items: [
        {
          name: `${product.name} Sprint Delivery`,
          description: `Complete 14-day production build, cloud edge hosting, and full GitHub source code handover.`,
          amount: priceUsd
        }
      ],
      recurring_items: [],
      one_time_total: priceUsd,
      recurring_total: 0,
      currency: lead.currency || 'USD',
      timeline: `${product.metadata?.engineering?.turnaround_days || 14} Days`,
      terms: 'Fixed-Price SOW: 50% upon project kickoff, 50% upon final acceptance & GitHub repository transfer. Includes 30 days bug-fix warranty.',
      notes: `Generated from CRM Lead ${id} (Campaign: ${lead.utm_campaign || 'Direct'})`,
      status: 'Draft',
      created_by: 'CRM-AUTOMATION',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('proposals').insert([newProposal]);
        await supabase.from('leads').update({ stage: 'Proposal Sent' }).eq('id', id);
      } catch (sbErr) {
        console.warn('[Leads create-proposal] Supabase notice:', sbErr.message);
      }
    }

    // Dual-persist to data/db.json
    try {
      const db = await readDB();
      db.proposals = db.proposals || [];
      const existingPropIdx = db.proposals.findIndex(p => p.id === proposalId);
      if (existingPropIdx !== -1) {
        db.proposals[existingPropIdx] = newProposal;
      } else {
        db.proposals.unshift(newProposal);
      }
      if (Array.isArray(db.leads)) {
        const leadIdx = db.leads.findIndex(l => String(l.id) === String(id));
        if (leadIdx !== -1) {
          db.leads[leadIdx].stage = 'Proposal Sent';
          db.leads[leadIdx].updated_at = new Date().toISOString();
        }
      }
      await writeDB(db);
    } catch (dbErr) {
      console.warn('[Leads create-proposal] Local DB write warning:', dbErr.message);
    }

    // Real-time SSE Telemetry Broadcasts
    try {
      broadcastLeadEvent('lead_update', [{ id, stage: 'Proposal Sent' }]);
      broadcast('proposal_update', [newProposal]);
      const { emitStakeholderEvent } = require('../services/stakeholder-events');
      emitStakeholderEvent('proposal.created', { proposal: newProposal, leadId: id }, { stakeholderId: id, stakeholderType: 'lead' }).catch(() => {});
    } catch (sseErr) {
      console.warn('[Leads create-proposal] SSE broadcast note:', sseErr.message);
    }

    const shareUrl = `${process.env.PUBLIC_APP_URL || 'https://gro10x-ai.vercel.app'}/p/${shareToken}`;

    res.status(201).json({
      success: true,
      message: 'Proposal generated successfully from lead record.',
      proposalId,
      shareToken,
      shareUrl,
      proposal: newProposal
    });
  } catch (err) {
    console.error('[Leads Create Proposal Error]:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Engine 2: Inbound AI Readiness Audit & Diagnostic Scorecard Lead Capture
// ─────────────────────────────────────────────────────────────────────────────
router.post('/ai-audit', leadSubmitLimiter, async (req, res) => {
  try {
    const {
      companyName,
      contactName,
      email,
      phone,
      currentTechStack = [],
      dataReadiness = 'unstructured_docs',
      automationPriority = 'internal_ops',
      monthlyBudgetUsd = 2500,
      timelineUrgency = 'immediate_1_2_weeks'
    } = req.body;

    if (!email && !phone) {
      return res.status(400).json({ ok: false, error: 'Either email or phone is required for AI audit delivery.' });
    }

    const normCompany = (companyName || contactName || 'Prospective Enterprise Client').trim();
    const techStackArray = Array.isArray(currentTechStack)
      ? currentTechStack
      : String(currentTechStack || '').split(',').map(s => s.trim()).filter(Boolean);

    // 1. Calculate AI Readiness Score (0-100)
    let score = 30; // Baseline

    // Data Readiness (up to +25)
    if (dataReadiness === 'clean_relational_db') score += 25;
    else if (dataReadiness === 'cloud_lake') score += 20;
    else if (dataReadiness === 'unstructured_docs') score += 12;
    else score += 5;

    // Tech Stack Maturity (up to +20)
    if (techStackArray.length >= 4) score += 20;
    else if (techStackArray.length >= 2) score += 12;
    else if (techStackArray.length === 1) score += 6;
    else score += 2;

    // Automation Priority Clarity (+15)
    if (['internal_ops', 'custom_ai_agent', 'customer_support', 'lead_generation'].includes(automationPriority)) {
      score += 15;
    }

    // Budget Commitment (up to +10)
    const budgetNum = Number(monthlyBudgetUsd) || 0;
    if (budgetNum >= 3500) score += 10;
    else if (budgetNum >= 1500) score += 7;
    else if (budgetNum >= 500) score += 3;

    score = Math.min(100, Math.max(25, score));

    // Canonical catalog mapping for automated blueprint delivery
    let canonicalServiceCode = 'SVC-001';
    let canonicalServiceName = 'AI Mobile Apps & Native Software';
    let readinessTier = 'Exploratory AI Candidate';
    let recommendedService = 'ENG2-DISC';
    let recommendedPod = 'CREATIVE_AI_POD';
    let estimatedSprintDays = 21;

    if (score >= 80) {
      readinessTier = 'Enterprise AI Pioneer';
      recommendedService = 'ENG2-MVP';
      recommendedPod = 'MVP_BUILD_POD';
      estimatedSprintDays = 10;
      canonicalServiceCode = 'SPRINT-01';
      canonicalServiceName = '14-Day Production AI MVP Sprint';
    } else if (score >= 65) {
      readinessTier = 'Sprint Ready';
      if (automationPriority === 'customer_support' || automationPriority === 'custom_ai_agent') {
        recommendedService = 'ENG2-AUT';
        recommendedPod = 'ENTERPRISE_AUTOMATION_POD';
        estimatedSprintDays = 14;
        canonicalServiceCode = 'SVC-003';
        canonicalServiceName = 'AI Chatbots & Intelligent Agents';
      } else if (automationPriority === 'internal_ops') {
        recommendedService = 'ENG2-AUT';
        recommendedPod = 'ENTERPRISE_AUTOMATION_POD';
        estimatedSprintDays = 14;
        canonicalServiceCode = 'SVC-007';
        canonicalServiceName = 'Custom Automation & RPA Workflows';
      } else {
        recommendedService = 'ENG2-MVP';
        recommendedPod = 'MVP_BUILD_POD';
        estimatedSprintDays = 14;
        canonicalServiceCode = 'SVC-001';
        canonicalServiceName = 'AI Mobile Apps & Architecture';
      }
    } else {
      readinessTier = 'Exploratory AI Candidate';
      recommendedService = 'ENG2-DISC';
      recommendedPod = 'CREATIVE_AI_POD';
      estimatedSprintDays = 21;
      canonicalServiceCode = 'SVC-013';
      canonicalServiceName = 'AI Strategy & Growth Roadmap';
    }

    const leadId = await nextLeadId();

    const scorecard = {
      score,
      readinessTier,
      recommendedService,
      recommendedPod,
      canonicalServiceCode,
      canonicalServiceName,
      estimatedSprintDays,
      keyBottlenecks: score < 60
        ? ['Data standardization required', 'Production API orchestration pipeline needed']
        : ['Model fine-tuning latency', 'Enterprise SSO & RBAC integration'],
      immediateActionPlan: `Initiate ${estimatedSprintDays}-Day Rapid AI Solution Sprint with GRO10X ${recommendedPod}.`
    };

    // 3. Save Lead into DB / Supabase
    const defaultAgencyPhone = process.env.AGENCY_PHONE || '+8801711019550';
    const defaultAgencyWhatsApp = process.env.AGENCY_WHATSAPP || '+8801711019550';

    const leadRecord = {
      id: leadId,
      name: contactName || normCompany,
      company: normCompany,
      contact_person: contactName || normCompany,
      email: email || '',
      phone: phone || defaultAgencyPhone,
      whatsapp: phone || defaultAgencyWhatsApp,
      source: 'AI_Readiness_Scorecard',
      engine_tag: 'engine2',
      stage: 'Qualified Lead',
      status: 'new',
      service: recommendedService,
      service_interest: canonicalServiceCode,
      currency: 'USD',
      value: budgetNum,
      budget: `$${budgetNum.toLocaleString()}/mo`,
      score: score,
      lead_score: score,
      notes: `AI Audit Score: ${score}/100 (${readinessTier}) | Recommended: ${recommendedService} (${canonicalServiceName}) | Priority: ${automationPriority} | Budget: $${budgetNum}/mo | Tech: ${techStackArray.join(', ')}`,
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured()) {
      try {
        const leadRow = {
          id: leadId,
          name: contactName || normCompany,
          company: normCompany,
          contact_person: contactName || normCompany,
          email: email || '',
          phone: phone || defaultAgencyPhone,
          source: 'AI_Readiness_Scorecard',
          stage: 'Qualified Lead',
          status: 'new',
          service_interest: canonicalServiceCode,
          currency: 'USD',
          value: budgetNum,
          budget: `$${budgetNum.toLocaleString()}/mo`,
          score: score,
          notes: leadRecord.notes,
          utm_source: 'ai_readiness_audit',
          utm_medium: 'web',
          utm_campaign: 'CMP-E2-AI-AUDIT',
          created_at: leadRecord.created_at,
          updated_at: leadRecord.created_at
        };
        const { error } = await supabase.from('leads').insert([leadRow]);
        if (error) {
          console.warn('[Leads AI-Audit] Supabase lead insert warning:', error.message);
        } else {
          console.log('✅ [Leads AI-Audit] Lead persisted successfully to Supabase:', leadRow.id);
        }
      } catch (sbErr) {
        console.warn('[Leads AI-Audit] Supabase insert warning:', sbErr.message);
      }
    }

    try {
      const db = await readDB();
      db.leads = db.leads || [];
      db.leads.unshift(leadRecord);
      await writeDB(db);
    } catch (_) {}

    // Broadcast SSE
    broadcastLeadEvent('lead_created', leadRecord);
    try {
      const { emitStakeholderEvent } = require('../services/stakeholder-events');
      emitStakeholderEvent('lead.created', { lead: leadRecord }, { stakeholderId: leadRecord.id, stakeholderType: 'lead' }).catch(() => {});
    } catch (_) {}

    // Send automated confirmation email and asset delivery asynchronously
    if (email && email.includes('@')) {
      sendLeadConfirmationEmail({
        contactPerson: leadRecord.contact_person || leadRecord.name,
        email: leadRecord.email,
        service: canonicalServiceName,
        company: normCompany
      }).catch(err => {
        console.warn('[Leads AI-Audit] Confirmation email exception:', err.message);
      });

      const { getServiceByCode } = require('../services/taxonomy');
      getServiceByCode(canonicalServiceCode).then(matchedProduct => {
        if (matchedProduct && typeof sendServiceAssetDeliveryEmail === 'function') {
          const proof = matchedProduct.metadata?.proof_pack || {};
          sendServiceAssetDeliveryEmail({
            email: leadRecord.email,
            contactPerson: leadRecord.contact_person || leadRecord.name,
            serviceName: matchedProduct.name,
            productCode: matchedProduct.product_code,
            slidesUrl: proof.slides_pdf_url,
            blueprintUrl: proof.blueprint_url,
            audioUrl: proof.audio_overview_url
          }).catch(err => console.warn('[Leads AI-Audit] Asset delivery email exception:', err.message));
        }
      }).catch(() => {});
    }

    // Telegram Notification to Managing Director & Agency Owner
    try {
      const ownerChatId = process.env.OWNER_TELEGRAM_ID || process.env.TELEGRAM_OWNER_CHAT_ID || process.env.TELEGRAM_ADMIN_CHAT_ID;
      if (ownerChatId) {
        const cleanPhone = (phone || '').replace(/\D/g, '');
        const buttons = [];
        const row = [];

        if (cleanPhone && cleanPhone.length >= 8) {
          const waPhone = cleanPhone.startsWith('880') ? cleanPhone : (cleanPhone.startsWith('0') ? `88${cleanPhone}` : cleanPhone);
          row.push({ text: '📞 WhatsApp Prospect', url: `https://wa.me/${waPhone}` });
        }
        const baseUrl = process.env.BASE_URL || 'https://gro10x-ai.vercel.app';
        row.push({ text: '👁 View in CRM', url: `${baseUrl}/app#leads` });
        if (row.length > 0) buttons.push(row);

        const isSynthetic = (normCompany && normCompany.includes('[QA-')) || (email && email.includes('@test.gro10x.ai')) || (contactName && contactName.includes('QA-'));
        const leadHeader = isSynthetic ? '🧪 *[QA TEST LEAD] Inbound AI Readiness Audit!*\n\n' : '🎯 *New Inbound AI Readiness Audit Lead!*\n\n';

        sendTelegramNotification(
          ownerChatId,
          leadHeader +
          `🏢 *Company:* ${normCompany}\n` +
          `👤 *Contact:* ${contactName || 'N/A'}\n` +
          `📊 *AI Readiness Score:* *${score}/100* (${readinessTier})\n` +
          `🚀 *Recommended:* ${recommendedService} — ${canonicalServiceName} (${recommendedPod})\n` +
          `💵 *Budget:* $${budgetNum.toLocaleString()} / mo\n` +
          `📞 *Phone/Email:* ${phone || email}`,
          buttons.length > 0 ? buttons : null,
          true
        ).catch(() => {});
      }
    } catch (_) {}

    return res.status(201).json({
      ok: true,
      leadId,
      companyName: normCompany,
      scorecard
    });
  } catch (err) {
    console.error('[Leads AI-Audit Error]:', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;

