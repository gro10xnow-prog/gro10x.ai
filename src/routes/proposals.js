/**
 * src/routes/proposals.js
 * ─────────────────────────────────────────────────────────────────────────────
 * GRO10X Client Proposals & Quotations Engine v1.0
 * Provides full proposal lifecycle management: AI voice/text drafting,
 * shareable public links, status tracking, PDF exporting, and 1-tap project conversion.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const https = require('https');
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/rbac');
const { supabase, isSupabaseConfigured } = require('../services/supabase');
const { broadcast } = require('../services/sse');
const {
  sendProposalViewedNotification,
  sendProposalAcceptedNotification,
  sendProposalCallRequestNotification
} = require('../services/bot/notifications');

function generateShareToken() {
  return crypto.randomBytes(6).toString('hex'); // 12-character unique URL token
}

function mapProposal(p) {
  if (!p) return null;
  return {
    id: p.id,
    shareToken: p.share_token || p.shareToken,
    clientName: p.client_name || p.clientName || 'Valued Client',
    clientCompany: p.client_company || p.clientCompany || '',
    clientEmail: p.client_email || p.clientEmail || '',
    clientPhone: p.client_phone || p.clientPhone || '',
    projectTitle: p.project_title || p.projectTitle || 'AI Solution Proposal',
    projectSummary: p.project_summary || p.projectSummary || '',
    scopeItems: Array.isArray(p.scope_items) ? p.scope_items : (Array.isArray(p.scopeItems) ? p.scopeItems : []),
    oneTimeItems: Array.isArray(p.one_time_items) ? p.one_time_items : (Array.isArray(p.oneTimeItems) ? p.oneTimeItems : []),
    recurringItems: Array.isArray(p.recurring_items) ? p.recurring_items : (Array.isArray(p.recurringItems) ? p.recurringItems : []),
    oneTimeTotal: Number(p.one_time_total !== undefined ? p.one_time_total : (p.oneTimeTotal || 0)),
    recurringTotal: Number(p.recurring_total !== undefined ? p.recurring_total : (p.recurringTotal || 0)),
    currency: p.currency || 'BDT',
    timeline: p.timeline || '2–3 Weeks',
    validUntil: p.valid_until || p.validUntil || null,
    terms: p.terms || '',
    notes: p.notes || '',
    status: p.status || 'Draft',
    createdBy: p.created_by || p.createdBy || 'GRO-001',
    viewCount: Number(p.view_count || p.viewCount || 0),
    viewedAt: p.viewed_at || p.viewedAt || null,
    acceptedAt: p.accepted_at || p.acceptedAt || null,
    convertedProjectId: p.converted_project_id || p.convertedProjectId || null,
    createdAt: p.created_at || p.createdAt || new Date().toISOString(),
    updatedAt: p.updated_at || p.updatedAt || new Date().toISOString()
  };
}

// Initial Seed: Pre-loaded UCB 24/7 AI Chatbot Proposal
const DEFAULT_PROPOSALS = [
  {
    id: 'PROP-2026-001',
    share_token: 'ucb-meta-ai-7x9q',
    client_name: 'United Commercial Bank (UCB)',
    client_company: 'United Commercial Bank PLC',
    client_email: 'digital.banking@ucb.com.bd',
    client_phone: '+880 1700-000000',
    project_title: '24/7 AI-Powered Social Media Customer Automation (Facebook & Instagram)',
    project_summary: 'Implementation of a dedicated, enterprise-grade conversational AI chatbot architecture across UCB Official Facebook and Instagram channels. Features 24/7 real-time customer query handling, private single-tenant data isolation, custom banking FAQ knowledge grounding, and smart Telegram human-in-the-loop escalation dispatch.',
    scope_items: [
      {
        title: 'Meta Graph API & Webhook Infrastructure',
        description: 'Official Facebook Messenger & Instagram Direct Message API connection with dedicated webhook routing, real-time message handshake, and rate-limit buffering.'
      },
      {
        title: 'Custom Conversational AI Engine (Gemini 3.6 Flash)',
        description: 'Bilingual conversational intelligence (Bangla + English) fine-tuned on UCB retail banking services, cards, loans, branch locator, and general FAQs with context memory.'
      },
      {
        title: 'Dedicated Single-Tenant Control Dashboard',
        description: 'Private administrative dashboard with 100% data ownership (non-multi-tenant architecture). Real-time message logs, analytics, user session tracking, and manual override.'
      },
      {
        title: 'Telegram Human-in-the-Loop Escalation Bridge',
        description: 'Instant automated notification alerts dispatched directly to duty officers on Telegram when complex inquiries or high-priority customer requests require human takeover.'
      },
      {
        title: 'Security, Compliance & Load Testing',
        description: 'Enterprise data guardrails, PII masking, rigorous multi-turn stress testing, and seamless go-live handover.'
      }
    ],
    one_time_items: [
      {
        name: 'Architecture Setup & Meta API Integration',
        description: 'Facebook & Instagram Direct Webhook setup, token management & Meta Graph integration',
        amount: 15000
      },
      {
        name: 'Conversational AI Model Grounding & Custom Training',
        description: 'Gemini AI prompt engineering, banking FAQ embedding & bilingual Bangla/English dialogue tuning',
        amount: 18000
      },
      {
        name: 'Dedicated Single-Tenant Management Dashboard',
        description: 'Custom web portal for message monitoring, live escalation controls & analytics',
        amount: 10000
      },
      {
        name: 'Telegram Real-Time Escalation Bot & Deployment',
        description: 'Human-in-the-loop notification bot, end-to-end UAT verification & cloud provisioning',
        amount: 5000
      }
    ],
    recurring_items: [
      {
        name: 'Conversational AI Inference & API Allocation (Baseline)',
        description: 'Standard Gemini Flash AI token quota covering high-volume 24/7 automated messaging. Any high-surge or additional model compute is charged transparently at actual provider cost.',
        amount: 4000,
        frequency: 'Monthly'
      },
      {
        name: 'Dedicated Cloud Infrastructure & High-Availability Hosting',
        description: 'Secure, dedicated single-tenant server hosting, SSL encryption, continuous uptime & webhook listeners',
        amount: 3000,
        frequency: 'Monthly'
      },
      {
        name: '24/7 System Monitoring, SLA & Prompt Refinements',
        description: 'Proactive health checks, error logging, database backups & ongoing FAQ knowledgebase updates',
        amount: 2500,
        frequency: 'Monthly'
      }
    ],
    one_time_total: 48000,
    recurring_total: 9500,
    currency: 'BDT',
    timeline: '10–14 Working Days from Meta Credentials Handover',
    valid_until: '2026-09-30',
    terms: '1. One-time build cost is split: 50% advance upon kickoff, 50% upon successful UAT sign-off.\n2. Monthly maintenance and AI infrastructure retainer is billed at the beginning of each service cycle.\n3. Usage & API Policy: Baseline monthly AI inference is included; any exceptional surges or additional third-party API consumption will be billed at actuals with transparent usage telemetry.\n4. UCB retains full ownership of customer data and conversation history.\n5. Standard SLA response time for critical infrastructure triage is under 60 minutes.',
    notes: 'Agency partner mark-up friendly. Baseline internal price: $400 one-time (~48,000 BDT) + 7,500–10,000 BDT/month retainer. Extra API at actuals.',
    status: 'Sent',
    created_by: 'GRO-001',
    view_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

let inMemoryProposals = [...DEFAULT_PROPOSALS];

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN ENDPOINTS (Restricted to Owner / Admin - Firoz)
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/proposals — List all proposals
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    let list = [];
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('proposals')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && Array.isArray(data) && data.length > 0) {
          list = data.map(mapProposal);
        }
      } catch (err) {
        console.warn('[Proposals GET] Supabase query notice:', err.message);
      }
    }

    if (list.length === 0) {
      list = inMemoryProposals.map(mapProposal);
    }

    return res.json(list);
  } catch (err) {
    console.error('Proposals list error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/proposals/:id — Get proposal by ID
router.get('/:id', requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('proposals').select('*').eq('id', id).maybeSingle();
        if (!error && data) return res.json(mapProposal(data));
      } catch (e) {}
    }

    const found = inMemoryProposals.find(p => p.id === id || p.share_token === id);
    if (found) return res.json(mapProposal(found));

    return res.status(404).json({ error: 'Proposal not found' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/proposals — Create new proposal
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const nextNum = inMemoryProposals.length + 1;
    const newId = `PROP-2026-${String(nextNum).padStart(3, '0')}`;
    const token = req.body.shareToken || generateShareToken();

    const oneTimeItems = Array.isArray(req.body.oneTimeItems) ? req.body.oneTimeItems : [];
    const recurringItems = Array.isArray(req.body.recurringItems) ? req.body.recurringItems : [];

    const oneTimeTotal = oneTimeItems.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
    const recurringTotal = recurringItems.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);

    const payload = {
      id: newId,
      share_token: token,
      client_name: req.body.clientName || 'Valued Client',
      client_company: req.body.clientCompany || '',
      client_email: req.body.clientEmail || '',
      client_phone: req.body.clientPhone || '',
      project_title: req.body.projectTitle || 'AI Growth Proposal',
      project_summary: req.body.projectSummary || '',
      scope_items: Array.isArray(req.body.scopeItems) ? req.body.scopeItems : [],
      one_time_items: oneTimeItems,
      recurring_items: recurringItems,
      one_time_total: req.body.oneTimeTotal !== undefined ? Number(req.body.oneTimeTotal) : oneTimeTotal,
      recurring_total: req.body.recurringTotal !== undefined ? Number(req.body.recurringTotal) : recurringTotal,
      currency: req.body.currency || 'BDT',
      timeline: req.body.timeline || '2–3 Weeks',
      valid_until: req.body.validUntil || null,
      terms: req.body.terms || '',
      notes: req.body.notes || '',
      status: req.body.status || 'Draft',
      created_by: req.user.profile?.emp_code || req.user.id || 'GRO-001',
      view_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    inMemoryProposals.unshift(payload);

    if (isSupabaseConfigured()) {
      try {
        const { error: insErr } = await supabase.from('proposals').insert([payload]);
        if (insErr) console.warn('[Proposals POST] Supabase insert note:', insErr.message);
      } catch (e) {}
    }

    try { broadcast('proposal_update', inMemoryProposals.map(mapProposal)); } catch (e) {}
    return res.status(201).json({ success: true, proposal: mapProposal(payload) });
  } catch (err) {
    console.error('Proposal create error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// PATCH /api/proposals/:id — Update proposal
router.patch('/:id', requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const memIdx = inMemoryProposals.findIndex(p => p.id === id);
    const existing = memIdx !== -1 ? inMemoryProposals[memIdx] : {};

    const updates = {
      updated_at: new Date().toISOString()
    };

    if (req.body.clientName !== undefined) updates.client_name = req.body.clientName;
    if (req.body.clientCompany !== undefined) updates.client_company = req.body.clientCompany;
    if (req.body.clientEmail !== undefined) updates.client_email = req.body.clientEmail;
    if (req.body.clientPhone !== undefined) updates.client_phone = req.body.clientPhone;
    if (req.body.projectTitle !== undefined) updates.project_title = req.body.projectTitle;
    if (req.body.projectSummary !== undefined) updates.project_summary = req.body.projectSummary;
    if (req.body.scopeItems !== undefined) updates.scope_items = req.body.scopeItems;
    if (req.body.oneTimeItems !== undefined) {
      updates.one_time_items = req.body.oneTimeItems;
      updates.one_time_total = req.body.oneTimeItems.reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
    }
    if (req.body.recurringItems !== undefined) {
      updates.recurring_items = req.body.recurringItems;
      updates.recurring_total = req.body.recurringItems.reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
    }
    if (req.body.currency !== undefined) updates.currency = req.body.currency;
    if (req.body.timeline !== undefined) updates.timeline = req.body.timeline;
    if (req.body.validUntil !== undefined) updates.valid_until = req.body.validUntil;
    if (req.body.terms !== undefined) updates.terms = req.body.terms;
    if (req.body.notes !== undefined) updates.notes = req.body.notes;
    if (req.body.status !== undefined) updates.status = req.body.status;

    if (memIdx !== -1) {
      inMemoryProposals[memIdx] = { ...inMemoryProposals[memIdx], ...updates };
    }

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('proposals').update(updates).eq('id', id);
      } catch (e) {}
    }

    const updated = mapProposal(inMemoryProposals[memIdx] || { id, ...updates });
    try { broadcast('proposal_update', inMemoryProposals.map(mapProposal)); } catch (e) {}
    return res.json({ success: true, proposal: updated });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /api/proposals/:id — Delete proposal
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    inMemoryProposals = inMemoryProposals.filter(p => p.id !== id);
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('proposals').delete().eq('id', id);
      } catch (e) {}
    }
    try { broadcast('proposal_update', inMemoryProposals.map(mapProposal)); } catch (e) {}
    return res.json({ success: true, deleted: id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/proposals/:id/convert-to-project — Convert accepted proposal to active production project
router.post('/:id/convert-to-project', requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const memIdx = inMemoryProposals.findIndex(p => p.id === id);
    const proposal = memIdx !== -1 ? inMemoryProposals[memIdx] : null;

    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    const projectId = `PRJ-${Date.now().toString().slice(-6)}`;
    const newProject = {
      id: projectId,
      name: proposal.project_title || proposal.projectTitle || 'Client Project',
      client_name: proposal.client_name || proposal.clientName || 'Client Partner',
      description: proposal.project_summary || proposal.projectSummary || '',
      department: 'Production',
      workflow_type: 'ai_automation',
      status: 'Active',
      budget: Number(proposal.one_time_total || proposal.oneTimeTotal || 0),
      start_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      created_at: new Date().toISOString()
    };

    if (memIdx !== -1) {
      inMemoryProposals[memIdx].status = 'Converted';
      inMemoryProposals[memIdx].converted_project_id = projectId;
      inMemoryProposals[memIdx].updated_at = new Date().toISOString();
    }

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('projects').insert([newProject]);
        await supabase.from('proposals').update({
          status: 'Converted',
          converted_project_id: projectId,
          updated_at: new Date().toISOString()
        }).eq('id', id);
      } catch (e) {}
    }

    try {
      broadcast('proposal_update', inMemoryProposals.map(mapProposal));
      broadcast('project_update', newProject);
    } catch (e) {}

    return res.json({
      success: true,
      message: 'Proposal successfully converted to project',
      projectId,
      project: newProject,
      proposal: mapProposal(inMemoryProposals[memIdx] || proposal)
    });
  } catch (err) {
    console.error('Convert proposal to project error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// AI PROPOSAL DRAFTING (Gemini Integration)
// ─────────────────────────────────────────────────────────────────────────────

const GEMINI_MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];

function callGeminiAPI(model, prompt, key) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: 1800,
        temperature: 0.3,
        responseMimeType: 'application/json'
      }
    });

    const req = https.request({
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/${model}:generateContent?key=${key}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const j = JSON.parse(data);
          if (j.candidates && j.candidates[0] && j.candidates[0].content) {
            const rawText = (j.candidates[0].content.parts || []).map(p => p.text || '').join('').trim();
            return resolve(rawText);
          }
          reject(new Error((j.error && j.error.message) || `No output from ${model}`));
        } catch (e) {
          reject(new Error(`JSON Parse Error from ${model}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error(`Gemini Timeout on ${model}`));
    });
    req.write(payload);
    req.end();
  });
}

function cleanJSONResponse(rawText) {
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/^```json/, '');
  if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```/, '');
  if (cleaned.endsWith('```')) cleaned = cleaned.replace(/```$/, '');
  return JSON.parse(cleaned.trim());
}

// POST /api/proposals/ai-draft — Generate structured proposal draft from raw voice/text context
router.post('/ai-draft', requireAuth, async (req, res) => {
  const { notes, clientName, currency } = req.body;
  if (!notes || notes.trim().length < 5) {
    return res.status(400).json({ error: 'Please provide meeting notes or conversation transcript to draft a proposal.' });
  }

  const selectedCurrency = currency || 'BDT';
  const key = process.env.GEMINI_API_KEY;

  function buildFallbackDraft() {
    return {
      clientName: clientName || 'Client Partner',
      clientCompany: clientName || 'Enterprise Client',
      projectTitle: 'AI Solution Architecture & Deployment',
      projectSummary: `Custom digital solution crafted based on recent requirements: ${notes.slice(0, 200)}...`,
      scopeItems: [
        { title: 'Core Architecture & Infrastructure', description: 'System setup, database provisioning & webhook integration' },
        { title: 'AI Logic & Knowledge Tuning', description: 'Conversational engine grounding and prompt engineering' },
        { title: 'Dedicated Management Interface', description: 'Administrative controls, live telemetry and monitoring' }
      ],
      oneTimeItems: [
        { name: 'System Build & Custom Integration', description: 'Full architectural build, API setup & testing', amount: selectedCurrency === 'USD' ? 400 : 45000 }
      ],
      recurringItems: [
        { name: 'Hosting, AI Model Compute & Maintenance', description: 'Cloud infrastructure, API usage & SLA support', amount: selectedCurrency === 'USD' ? 80 : 8500, frequency: 'Monthly' }
      ],
      oneTimeTotal: selectedCurrency === 'USD' ? 400 : 45000,
      recurringTotal: selectedCurrency === 'USD' ? 80 : 8500,
      currency: selectedCurrency,
      timeline: '10–14 Working Days',
      terms: '50% advance upon kickoff, 50% upon project handover and UAT completion.'
    };
  }

  if (!key || process.env.NODE_ENV === 'test') {
    return res.json({
      success: true,
      draft: buildFallbackDraft(),
      generatedBy: 'template_fallback'
    });
  }

  const prompt = `
You are the Chief AI Solutions Architect and Proposal Writer for "GRO10X" (gro10x.ai), a premier AI growth and digital engineering agency based in Dhaka.

A team member has just completed a client meeting or call and dumped their voice notes / context below.
Transform this raw briefing into a high-converting, professional, executive-grade project proposal.

RAW BRIEFING NOTES:
"""
${notes.slice(0, 4000)}
"""

CLIENT NAME HINT: "${clientName || 'Extract from notes'}"
DEFAULT CURRENCY: "${selectedCurrency}"

You must respond with valid JSON strictly conforming to this JSON schema:
{
  "clientName": "string (Full name of client or business)",
  "clientCompany": "string (Company name)",
  "projectTitle": "string (High-impact executive project title)",
  "projectSummary": "string (2-3 sentences concise executive summary outlining the problem, solution, and business value)",
  "scopeItems": [
    {
      "title": "string (e.g., Meta Graph API & Webhook Infrastructure)",
      "description": "string (Concise 1-2 sentence description of what is delivered)"
    }
  ],
  "oneTimeItems": [
    {
      "name": "string (Deliverable name)",
      "description": "string (Description of work)",
      "amount": number (Estimated numerical amount in ${selectedCurrency})
    }
  ],
  "recurringItems": [
    {
      "name": "string (Service/Hosting name)",
      "description": "string (Description of maintenance, AI inference, SLA)",
      "amount": number (Estimated monthly amount in ${selectedCurrency}),
      "frequency": "Monthly"
    }
  ],
  "oneTimeTotal": number (Sum of oneTimeItems amounts),
  "recurringTotal": number (Sum of recurringItems amounts),
  "currency": "${selectedCurrency}",
  "timeline": "string (e.g., 10–14 Working Days)",
  "terms": "string (Clear 3-4 bullet commercial terms including advance %, retainer cycle, and note that any high-surge API/third-party compute beyond standard quota is billed at actuals)"
}
`;

  try {
    let parsedDraft = null;
    for (const model of GEMINI_MODELS) {
      try {
        const rawJson = await callGeminiAPI(model, prompt, key);
        parsedDraft = cleanJSONResponse(rawJson);
        if (parsedDraft && parsedDraft.projectTitle) {
          break;
        }
      } catch (err) {
        console.warn(`[AI Draft] Model ${model} notice:`, err.message);
      }
    }

    if (!parsedDraft) {
      parsedDraft = buildFallbackDraft();
    }

    return res.json({
      success: true,
      draft: parsedDraft,
      generatedBy: 'gemini'
    });
  } catch (err) {
    console.error('AI Draft Generation error:', err);
    return res.json({
      success: true,
      draft: buildFallbackDraft(),
      generatedBy: 'template_fallback'
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC ENDPOINTS (No authentication required — client shareable link)
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/public/proposals/:token — Public view of proposal
router.get('/public/:token', async (req, res) => {
  const { token } = req.params;
  try {
    let proposal = null;

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('proposals')
          .select('*')
          .eq('share_token', token)
          .maybeSingle();
        if (!error && data) proposal = data;
      } catch (e) {}
    }

    if (!proposal) {
      proposal = inMemoryProposals.find(p => p.share_token === token || p.id === token);
    }

    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found or link has expired' });
    }

    const currentViews = Number(proposal.view_count || 0) + 1;
    const isFirstView = currentViews === 1 || proposal.status === 'Draft' || proposal.status === 'Sent';

    const updates = {
      view_count: currentViews,
      viewed_at: proposal.viewed_at || new Date().toISOString(),
      status: proposal.status === 'Draft' || proposal.status === 'Sent' ? 'Viewed' : proposal.status
    };

    // Update in-memory
    const memIdx = inMemoryProposals.findIndex(p => p.share_token === token || p.id === proposal.id);
    if (memIdx !== -1) {
      inMemoryProposals[memIdx] = { ...inMemoryProposals[memIdx], ...updates };
    }

    // Update Supabase
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('proposals').update(updates).eq('id', proposal.id);
      } catch (e) {}
    }

    // Trigger Telegram notification to Admin on first view or periodically
    if (isFirstView) {
      try {
        sendProposalViewedNotification({ ...proposal, ...updates });
      } catch (e) {
        console.warn('[Telegram Alert] Proposal viewed dispatch warning:', e.message);
      }
    }

    // Return sanitized public proposal (omit internal notes)
    const publicData = mapProposal({ ...proposal, ...updates });
    delete publicData.notes;

    return res.json(publicData);
  } catch (err) {
    console.error('Public proposal fetch error:', err);
    return res.status(500).json({ error: 'Failed to load proposal' });
  }
});

// POST /api/public/proposals/:token/accept — Client accepts proposal
router.post('/public/:token/accept', async (req, res) => {
  const { token } = req.params;
  const { acceptedBy, clientNote } = req.body;

  try {
    let proposal = null;
    const memIdx = inMemoryProposals.findIndex(p => p.share_token === token || p.id === token);

    if (memIdx !== -1) {
      proposal = inMemoryProposals[memIdx];
    } else if (isSupabaseConfigured()) {
      const { data } = await supabase.from('proposals').select('*').eq('share_token', token).maybeSingle();
      if (data) proposal = data;
    }

    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    const updates = {
      status: 'Accepted',
      accepted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (memIdx !== -1) {
      inMemoryProposals[memIdx] = { ...inMemoryProposals[memIdx], ...updates };
    }

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('proposals').update(updates).eq('id', proposal.id);
      } catch (e) {}
    }

    // Dispatch instant celebration Telegram alert to Firoz
    try {
      sendProposalAcceptedNotification({
        ...proposal,
        ...updates,
        acceptedBy: acceptedBy || proposal.client_name
      });
    } catch (e) {
      console.warn('[Telegram Alert] Acceptance dispatch warning:', e.message);
    }

    try { broadcast('proposal_update', inMemoryProposals.map(mapProposal)); } catch (e) {}

    return res.json({
      success: true,
      message: 'Proposal successfully accepted. Our team will coordinate next steps immediately.',
      proposal: mapProposal({ ...proposal, ...updates })
    });
  } catch (err) {
    console.error('Proposal acceptance error:', err);
    return res.status(500).json({ error: 'Failed to accept proposal' });
  }
});

// POST /api/public/proposals/:token/schedule-call — Client requests alignment call
router.post('/public/:token/schedule-call', async (req, res) => {
  const { token } = req.params;
  const { name, phone, email, note } = req.body;

  try {
    let proposal = inMemoryProposals.find(p => p.share_token === token || p.id === token);
    if (!proposal && isSupabaseConfigured()) {
      const { data } = await supabase.from('proposals').select('*').eq('share_token', token).maybeSingle();
      if (data) proposal = data;
    }

    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    try {
      sendProposalCallRequestNotification(proposal, { name, phone, email, note });
    } catch (e) {
      console.warn('[Telegram Alert] Call request dispatch warning:', e.message);
    }

    return res.json({
      success: true,
      message: 'Alignment call request received. Firoz / GRO10X team will reach out shortly!'
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to request call' });
  }
});

module.exports = router;
