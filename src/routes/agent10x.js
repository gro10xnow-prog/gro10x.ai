/**
 * src/routes/agent10x.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Agent 10X Autonomous Digital Teammates & Recruiter Lead Intake API.
 * Handles onboarding leads, atomic local fallback persistence (data/agent10x_leads.json),
 * CRM synchronization (engine1 scoping), and instant WhatsApp specialist alerts.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const os = require('os');
const { ok, fail, asyncHandler } = require('../utils/response');
const { sendTelegramNotification } = require('../services/bot');
const { supabase, isSupabaseConfigured } = require('../services/supabase');

const DATA_DIR = path.resolve(__dirname, '../../data');
const LEADS_FILE = path.join(DATA_DIR, 'agent10x_leads.json');
const TMP_LEADS_FILE = path.join(os.tmpdir(), 'agent10x_leads.json');

// In-memory leads buffer (resilient against read-only serverless filesystems)
let memoryLeads = [];

function readAgentLeads() {
  const map = new Map();

  // 1. Seed from in-memory cache
  if (Array.isArray(memoryLeads)) {
    for (const lead of memoryLeads) {
      if (lead && lead.id) map.set(lead.id, lead);
    }
  }

  // 2. Read from primary filesystem
  try {
    if (fs.existsSync(LEADS_FILE)) {
      const raw = fs.readFileSync(LEADS_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        for (const lead of parsed) {
          if (lead && lead.id) map.set(lead.id, lead);
        }
      }
    }
  } catch (err) {
    console.warn('[Agent10X Storage] Primary read warning:', err.message);
  }

  // 3. Read from tmp fallback
  try {
    if (fs.existsSync(TMP_LEADS_FILE)) {
      const rawTmp = fs.readFileSync(TMP_LEADS_FILE, 'utf8');
      const parsedTmp = JSON.parse(rawTmp);
      if (Array.isArray(parsedTmp)) {
        for (const lead of parsedTmp) {
          if (lead && lead.id) map.set(lead.id, lead);
        }
      }
    }
  } catch (_) {}

  return Array.from(map.values());
}

function writeAgentLeads(leads) {
  memoryLeads = [...leads];

  let primaryWritten = false;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), 'utf8');
    primaryWritten = true;
  } catch (err) {
    console.warn('[Agent10X Storage] Primary write failed (read-only filesystem):', err.message);
  }

  if (!primaryWritten) {
    try {
      fs.writeFileSync(TMP_LEADS_FILE, JSON.stringify(leads, null, 2), 'utf8');
    } catch (tmpErr) {
      console.warn('[Agent10X Storage] /tmp fallback write failed:', tmpErr.message);
    }
  }
}

// Health check
router.get('/health', (req, res) => {
  return ok(res, { status: 'ok', service: 'Agent10X Intake API', timestamp: new Date().toISOString() });
});

// POST /leads — Submit conversational onboarding lead
router.post('/leads', asyncHandler(async (req, res) => {
  const body = req.body || {};
  const name = String(body.name || '').trim();
  const whatsapp = String(body.whatsapp || '').trim();

  if (!name || !whatsapp) {
    return fail(res, 'Name and WhatsApp number are required to configure your teammate.', 400);
  }

  const hexId = Math.random().toString(16).substring(2, 6).toUpperCase();
  const leadId = `A10X-${Date.now().toString(36).toUpperCase()}-${hexId}`;

  const leadRecord = {
    id: leadId,
    source: body.source || 'agent10x_landing_page',
    submitted_at: body.submitted_at || new Date().toISOString(),
    type: body.type === 'Business' ? 'Business' : 'Personal',
    name,
    whatsapp,
    language: body.language || 'English',
    reply_mode: body.reply_mode || 'Text',
    purpose: String(body.purpose || '').trim(),
    first_thing: String(body.first_thing || '').trim(),
    business_role: String(body.business_role || '').trim(),
    company: String(body.company || '').trim(),
    deadline: String(body.deadline || '').trim(),
    notes: String(body.notes || '').trim(),
    consent_whatsapp: body.consent_whatsapp !== false,
    language_page: body.language_page || 'en',
    engine_tag: 'engine1',
    status: 'new'
  };

  // 1. Atomic local file & memory persistence
  try {
    const existing = readAgentLeads();
    existing.unshift(leadRecord);
    writeAgentLeads(existing);
  } catch (err) {
    console.error('[Agent10X Storage Error]:', err);
  }

  // 2. Sync to Supabase CRM (if available)
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('leads').insert({
        id: leadRecord.id,
        name: leadRecord.name,
        phone: leadRecord.whatsapp,
        company: leadRecord.company || (leadRecord.type === 'Personal' ? 'Individual' : 'Business'),
        service_interest: `Agent 10X - ${leadRecord.type} Teammate`,
        source: 'Agent 10X Landing Page',
        engine_tag: 'engine1',
        stage: 'New Inquiry',
        status: 'new',
        notes: `[Agent10X V1 Intake]\nType: ${leadRecord.type}\nLanguage: ${leadRecord.language}\nReply Mode: ${leadRecord.reply_mode}\nPurpose: ${leadRecord.purpose}\nFirst 24h Need: ${leadRecord.first_thing}\nRole/Company: ${leadRecord.business_role} @ ${leadRecord.company}\nDeadline: ${leadRecord.deadline}\nNotes: ${leadRecord.notes}`,
        created_at: leadRecord.submitted_at
      });
    } catch (dbErr) {
      console.warn('[Agent10X Supabase Sync Non-Fatal]:', dbErr.message);
    }
  }

  // 3. Dispatch Telegram specialist notification (if bot configured)
  try {
    const ownerChatId = process.env.OWNER_TELEGRAM_ID;
    if (ownerChatId) {
      const typeEmoji = leadRecord.type === 'Business' ? '🏢' : '👤';
      const cleanPhone = leadRecord.whatsapp.replace(/\D/g, '');
      const waLink = cleanPhone.startsWith('880') ? `https://wa.me/${cleanPhone}` : `https://wa.me/88${cleanPhone.replace(/^0+/, '')}`;

      const msg = 
        `⚡ *NEW AGENT 10X ONBOARDING LEAD!*\n\n` +
        `${typeEmoji} *Type*: ${leadRecord.type} Teammate\n` +
        `👤 *Name*: ${leadRecord.name}\n` +
        `📱 *WhatsApp*: \`${leadRecord.whatsapp}\`\n` +
        `🗣️ *Language*: ${leadRecord.language} (${leadRecord.reply_mode})\n` +
        `🎯 *Primary Task*: _${leadRecord.purpose || 'General Workflow'}\_\n` +
        `⏱️ *First 24h Need*: _${leadRecord.first_thing || 'Immediate Setup'}\_\n` +
        (leadRecord.type === 'Business' && leadRecord.company ? `🏢 *Company*: ${leadRecord.company} (${leadRecord.business_role})\n📅 *Deadline*: ${leadRecord.deadline}\n` : '') +
        `\n_Real human specialist review assigned for WhatsApp contact._`;

      const buttons = [
        [
          { text: '💬 WhatsApp Candidate', url: waLink },
          { text: '📊 Open CRM', url: 'https://gro10x-ai.vercel.app/app#leads' }
        ]
      ];

      sendTelegramNotification(ownerChatId, msg, buttons, false);
    }
  } catch (_) {}

  return ok(res, {
    success: true,
    message: `Thanks ${leadRecord.name}! We received your request. A GRO10X specialist will contact you on WhatsApp within 1 working day with your setup plan.`,
    leadId: leadRecord.id,
    lead: leadRecord
  });
}));

module.exports = router;
