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
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/rbac');
const { supabase, isSupabaseConfigured } = require('../services/supabase');
const sse = require('../services/sse');
const broadcast = (...args) => sse.broadcast(...args);
const { readDB, writeDB } = require('../services/db');
const { createProjectLockinSpec, standardizePOC } = require('../services/onboarding-spec');
const { signToken } = require('../services/jwt');
const { sendProposalAcceptedClientEmail } = require('../services/resend');
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
    acceptedBy: p.accepted_by || p.acceptedBy || null,
    acceptedNotes: p.accepted_notes || p.acceptedNotes || null,
    convertedProjectId: p.converted_project_id || p.convertedProjectId || null,
    lockinSpecId: p.lockin_spec_id || p.lockinSpecId || null,
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
  },
  {
    id: 'PROP-2026-002',
    share_token: 'nhf-enterprise-ai-2026',
    client_name: 'National Housing Finance PLC',
    client_company: 'National Housing Finance and Investments Limited',
    client_email: 'digital@nationalhousingbd.com',
    client_phone: '+880 1711-000000',
    project_title: 'Dedicated Enterprise AI Operating System & Autonomous Digital Mortgage Sales Officer',
    project_summary: 'Comprehensive enterprise AI digital transformation providing an autonomous 24/7 Digital Sales Officer for home loans, conversational EMI eligibility simulator with Bangladesh Bank regulatory DBR/LTV guardrails, REHAB developer project database synchronization, and private on-premise / hybrid cloud deployment with dedicated monthly SLA retainer maintenance.',
    canonical_service_code: 'SPRINT-01',
    scope_items: [
      {
        title: 'Dedicated AI Mortgage Sales Officer (Web & WhatsApp)',
        description: 'Bilingual conversational intelligence (Bangla + English) fine-tuned on National Housing loan products, interest rates, customer onboarding, and branch locator.'
      },
      {
        title: 'Intelligent Home Loan Eligibility & EMI Simulator',
        description: 'Automated loan calculation engine enforcing Bangladesh Bank Debt Burden Ratio (DBR <= 50%) and Loan-to-Value (LTV <= 70%) regulatory compliance.'
      },
      {
        title: 'REHAB Property Directory & Valuation Database Sync',
        description: 'Integrated lookup for approved developer projects, property valuation estimates, and instant applicant preliminary screening.'
      },
      {
        title: 'Single-Tenant Private Cloud Infrastructure & Security Hardening',
        description: 'Zero data leakage, on-premise / hybrid cloud hosting, TLS 1.3 encryption, role-based access control, and bank CRM webhook bridge.'
      },
      {
        title: '30-Day Defect-Free Warranty & Dedicated Monthly Retainer SLA',
        description: 'Proactive 24/7 system health monitoring, Bangladesh Bank rate updates, error triaging under 60 minutes, and continuous model refinement.'
      }
    ],
    one_time_items: [
      {
        name: 'Custom AI Mortgage Officer Engine & Conversational Grounding',
        description: 'Fine-tuned LLM reasoning engine, banking FAQ vector knowledgebase & bilingual dialogue tuning',
        amount: 120000
      },
      {
        name: 'Home Loan Eligibility & EMI Simulator with BB DBR/LTV Guardrails',
        description: 'Real-time mathematical simulator enforcing central bank regulatory limits',
        amount: 85000
      },
      {
        name: 'REHAB Approved Property Directory & CRM Webhook Integration',
        description: 'Real estate project database synchronization and lead ingestion bridge',
        amount: 65000
      },
      {
        name: 'Private Cloud Infrastructure Setup & Bank Security Hardening',
        description: 'Single-tenant deployment, TLS 1.3 security audits, PII masking & UAT handover',
        amount: 50000
      }
    ],
    recurring_items: [
      {
        name: 'Dedicated Cloud Compute & High-Availability AI Inference Allocation',
        description: 'Enterprise server hosting, database backups, SSL certificates & model token quota',
        amount: 25000,
        frequency: 'Monthly'
      },
      {
        name: 'Proactive Monitoring, Bangladesh Bank Compliance Updates & Priority SLA',
        description: 'Under-60-minute defect resolution, regulatory policy sync & monthly prompt optimization',
        amount: 15000,
        frequency: 'Monthly'
      }
    ],
    one_time_total: 320000,
    recurring_total: 40000,
    currency: 'BDT',
    timeline: '3–4 Weeks from Kickoff',
    valid_until: '2026-10-31',
    terms: '1. One-time build cost is structured: 50% mobilization advance upon signing, 25% upon staging UAT deployment, 25% upon formal production handover.\n2. Monthly maintenance and dedicated AI compute retainer is billed at the beginning of each 30-day service cycle.\n3. National Housing Finance retains 100% proprietary data ownership and customer conversation history.\n4. Includes 30-day post-delivery bug-fix warranty shield with 24-hour defect SLA triage response.',
    notes: 'Enterprise Banking Tier. Custom build for National Housing Finance Limited. Zero third-party telemetry leakage.',
    status: 'Sent',
    created_by: 'GRO-001',
    view_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const ENTERPRISE_PRESETS = {
  NATIONAL_HOUSING_FINANCE_AI_OS: {
    id: 'nhf-enterprise-ai-os',
    presetKey: 'NATIONAL_HOUSING_FINANCE_AI_OS',
    name: 'National Housing Finance PLC — Dedicated Enterprise AI Operating System',
    clientName: 'National Housing Finance PLC',
    clientCompany: 'National Housing Finance and Investments Limited',
    clientEmail: 'digital@nationalhousingbd.com',
    clientPhone: '+880 1711-000000',
    projectTitle: 'Dedicated Enterprise AI Operating System & Autonomous Digital Mortgage Sales Officer',
    projectSummary: 'Comprehensive enterprise AI digital transformation providing an autonomous 24/7 Digital Sales Officer for home loans, conversational EMI eligibility simulator with Bangladesh Bank regulatory DBR/LTV guardrails, REHAB developer project database synchronization, and private on-premise / hybrid cloud deployment with dedicated monthly SLA retainer maintenance.',
    canonicalServiceCode: 'SPRINT-01',
    scopeItems: [
      {
        title: 'Dedicated AI Mortgage Sales Officer (Web & WhatsApp)',
        description: 'Bilingual conversational intelligence (Bangla + English) fine-tuned on National Housing loan products, interest rates, customer onboarding, and branch locator.'
      },
      {
        title: 'Intelligent Home Loan Eligibility & EMI Simulator',
        description: 'Automated loan calculation engine enforcing Bangladesh Bank Debt Burden Ratio (DBR <= 50%) and Loan-to-Value (LTV <= 70%) regulatory compliance.'
      },
      {
        title: 'REHAB Property Directory & Valuation Database Sync',
        description: 'Integrated lookup for approved developer projects, property valuation estimates, and instant applicant preliminary screening.'
      },
      {
        title: 'Single-Tenant Private Cloud Infrastructure & Security Hardening',
        description: 'Zero data leakage, on-premise / hybrid cloud hosting, TLS 1.3 encryption, role-based access control, and bank CRM webhook bridge.'
      },
      {
        title: '30-Day Defect-Free Warranty & Dedicated Monthly Retainer SLA',
        description: 'Proactive 24/7 system health monitoring, Bangladesh Bank rate updates, error triaging under 60 minutes, and continuous model refinement.'
      }
    ],
    oneTimeItems: [
      {
        name: 'Custom AI Mortgage Officer Engine & Conversational Grounding',
        description: 'Fine-tuned LLM reasoning engine, banking FAQ vector knowledgebase & bilingual dialogue tuning',
        amount: 120000
      },
      {
        name: 'Home Loan Eligibility & EMI Simulator with BB DBR/LTV Guardrails',
        description: 'Real-time mathematical simulator enforcing central bank regulatory limits',
        amount: 85000
      },
      {
        name: 'REHAB Approved Property Directory & CRM Webhook Integration',
        description: 'Real estate project database synchronization and lead ingestion bridge',
        amount: 65000
      },
      {
        name: 'Private Cloud Infrastructure Setup & Bank Security Hardening',
        description: 'Single-tenant deployment, TLS 1.3 security audits, PII masking & UAT handover',
        amount: 50000
      }
    ],
    recurringItems: [
      {
        name: 'Dedicated Cloud Compute & High-Availability AI Inference Allocation',
        description: 'Enterprise server hosting, database backups, SSL certificates & model token quota',
        amount: 25000,
        frequency: 'Monthly'
      },
      {
        name: 'Proactive Monitoring, Bangladesh Bank Compliance Updates & Priority SLA',
        description: 'Under-60-minute defect resolution, regulatory policy sync & monthly prompt optimization',
        amount: 15000,
        frequency: 'Monthly'
      }
    ],
    oneTimeTotal: 320000,
    recurringTotal: 40000,
    currency: 'BDT',
    timeline: '3–4 Weeks from Kickoff',
    terms: '1. One-time build cost is structured: 50% mobilization advance upon signing, 25% upon staging UAT deployment, 25% upon formal production handover.\n2. Monthly maintenance and dedicated AI compute retainer is billed at the beginning of each 30-day service cycle.\n3. National Housing Finance retains 100% proprietary data ownership and customer conversation history.\n4. Includes 30-day post-delivery bug-fix warranty shield with 24-hour defect SLA triage response.',
    notes: 'Enterprise Banking Tier. Custom build for National Housing Finance Limited. Zero third-party telemetry leakage.'
  },
  UCB_BANK_AI_CHATBOT: {
    id: 'ucb-meta-ai',
    presetKey: 'UCB_BANK_AI_CHATBOT',
    name: 'United Commercial Bank (UCB) — 24/7 Social Media Customer Automation',
    clientName: 'United Commercial Bank (UCB)',
    clientCompany: 'United Commercial Bank PLC',
    clientEmail: 'digital.banking@ucb.com.bd',
    clientPhone: '+880 1700-000000',
    projectTitle: '24/7 AI-Powered Social Media Customer Automation (Facebook & Instagram)',
    projectSummary: 'Implementation of a dedicated, enterprise-grade conversational AI chatbot architecture across UCB Official Facebook and Instagram channels.',
    canonicalServiceCode: 'SVC-003',
    oneTimeTotal: 48000,
    recurringTotal: 9500,
    currency: 'BDT',
    timeline: '10–14 Working Days from Meta Credentials Handover'
  }
};

const DB_JSON_PATH = path.join(__dirname, '../../data/db.json');

function readLocalDBProposals() {
  try {
    if (fs.existsSync(DB_JSON_PATH)) {
      const content = fs.readFileSync(DB_JSON_PATH, 'utf8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed.proposals) && parsed.proposals.length > 0) {
        return parsed.proposals;
      }
    }
  } catch (_) {}
  return null;
}

function writeLocalDBProposals(proposals) {
  try {
    if (fs.existsSync(DB_JSON_PATH)) {
      const content = fs.readFileSync(DB_JSON_PATH, 'utf8');
      const parsed = JSON.parse(content);
      parsed.proposals = proposals;
      fs.writeFileSync(DB_JSON_PATH, JSON.stringify(parsed, null, 2), 'utf8');
    }
  } catch (_) {}
}

function proposalToQuoteRecord(p) {
  const meta = {
    share_token: p.share_token || p.shareToken,
    client_company: p.client_company || p.clientCompany || '',
    client_email: p.client_email || p.clientEmail || '',
    client_phone: p.client_phone || p.clientPhone || '',
    project_summary: p.project_summary || p.projectSummary || '',
    canonical_service_code: p.canonical_service_code || p.canonicalServiceCode || null,
    scope_items: p.scope_items || p.scopeItems || [],
    one_time_items: p.one_time_items || p.oneTimeItems || [],
    recurring_items: p.recurring_items || p.recurringItems || [],
    one_time_total: Number(p.one_time_total !== undefined ? p.one_time_total : (p.oneTimeTotal || 0)),
    recurring_total: Number(p.recurring_total !== undefined ? p.recurring_total : (p.recurringTotal || 0)),
    timeline: p.timeline || '2–3 Weeks',
    terms: p.terms || '',
    notes: p.notes || '',
    created_by: p.created_by || p.createdBy || 'GRO-001',
    view_count: Number(p.view_count || p.viewCount || 0),
    viewed_at: p.viewed_at || p.viewedAt || null,
    accepted_at: p.accepted_at || p.acceptedAt || null,
    converted_project_id: p.converted_project_id || p.convertedProjectId || null
  };

  return {
    id: p.id,
    client_name: p.client_name || p.clientName || '',
    project_title: p.project_title || p.projectTitle || '',
    scope: JSON.stringify(meta.scope_items),
    amount: meta.one_time_total,
    currency: p.currency || 'BDT',
    status: p.status || 'Draft',
    valid_until: p.valid_until || p.validUntil || null,
    line_items: JSON.stringify(meta),
    notes: p.notes || '',
    updated_at: p.updated_at || new Date().toISOString()
  };
}

function quoteRecordToProposal(q) {
  let meta = {};
  try {
    meta = typeof q.line_items === 'string' ? JSON.parse(q.line_items) : (q.line_items || {});
  } catch (_) {}

  let scopeItems = [];
  try {
    scopeItems = typeof q.scope === 'string' ? JSON.parse(q.scope) : (q.scope || []);
  } catch (_) {}

  return {
    id: q.id,
    share_token: meta.share_token || q.id.toLowerCase(),
    client_name: q.client_name,
    client_company: meta.client_company || '',
    client_email: meta.client_email || '',
    client_phone: meta.client_phone || '',
    project_title: q.project_title,
    project_summary: meta.project_summary || '',
    canonical_service_code: meta.canonical_service_code || null,
    scope_items: meta.scope_items && meta.scope_items.length > 0 ? meta.scope_items : scopeItems,
    one_time_items: meta.one_time_items || [],
    recurring_items: meta.recurring_items || [],
    one_time_total: Number(meta.one_time_total !== undefined ? meta.one_time_total : q.amount || 0),
    recurring_total: Number(meta.recurring_total || 0),
    currency: q.currency || 'BDT',
    timeline: meta.timeline || '2–3 Weeks',
    valid_until: q.valid_until,
    terms: meta.terms || '',
    notes: q.notes || meta.notes || '',
    status: q.status || 'Draft',
    created_by: meta.created_by || 'GRO-001',
    view_count: Number(meta.view_count || 0),
    viewed_at: meta.viewed_at || null,
    accepted_at: meta.accepted_at || null,
    converted_project_id: meta.converted_project_id || null,
    created_at: q.created_at || meta.created_at || new Date().toISOString(),
    updated_at: q.updated_at || new Date().toISOString()
  };
}

let inMemoryProposals = readLocalDBProposals() || [...DEFAULT_PROPOSALS];

async function getProposalsStore() {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('proposals')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && Array.isArray(data) && data.length > 0) {
        inMemoryProposals = data;
        writeLocalDBProposals(inMemoryProposals);
        return inMemoryProposals;
      }
    } catch (_) {}

    // Cloud fallback for Vercel: read from Supabase quotes table where id begins with PROP-
    try {
      const { data: qData, error: qErr } = await supabase
        .from('quotes')
        .select('*')
        .like('id', 'PROP-%')
        .order('created_at', { ascending: false });
      if (!qErr && Array.isArray(qData) && qData.length > 0) {
        inMemoryProposals = qData.map(quoteRecordToProposal);
        writeLocalDBProposals(inMemoryProposals);
        return inMemoryProposals;
      }
    } catch (_) {}
  }

  const localProps = readLocalDBProposals();
  if (localProps && localProps.length > 0) {
    inMemoryProposals = localProps;
    return inMemoryProposals;
  }

  try {
    const db = await readDB();
    if (Array.isArray(db.proposals) && db.proposals.length > 0) {
      inMemoryProposals = db.proposals;
      writeLocalDBProposals(inMemoryProposals);
      return inMemoryProposals;
    }
  } catch (_) {}

  if (!inMemoryProposals || inMemoryProposals.length === 0) {
    inMemoryProposals = [...DEFAULT_PROPOSALS];
    writeLocalDBProposals(inMemoryProposals);
  }
  return inMemoryProposals;
}

async function persistProposal(proposal, isUpdate = false) {
  if (!proposal || !proposal.id) return proposal;

  // 1. Sync in-memory cache
  const idx = inMemoryProposals.findIndex(p => p.id === proposal.id || (proposal.share_token && p.share_token === proposal.share_token));
  if (idx !== -1) {
    inMemoryProposals[idx] = { ...inMemoryProposals[idx], ...proposal };
  } else {
    inMemoryProposals.unshift(proposal);
  }

  // 2. Dual-persist to data/db.json
  writeLocalDBProposals(inMemoryProposals);

  try {
    const db = await readDB();
    db.proposals = db.proposals || [];
    const dIdx = db.proposals.findIndex(p => p.id === proposal.id || (proposal.share_token && p.share_token === proposal.share_token));
    if (dIdx !== -1) {
      db.proposals[dIdx] = { ...db.proposals[dIdx], ...proposal };
    } else {
      db.proposals.unshift(proposal);
    }
    await writeDB(db);
  } catch (err) {
    console.warn('[Proposals Store] db.json write note:', err.message);
  }

  // 3. Persist to Supabase
  if (isSupabaseConfigured() && process.env.NODE_ENV !== 'test') {
    try {
      if (isUpdate) {
        await supabase.from('proposals').update(proposal).eq('id', proposal.id);
      } else {
        await supabase.from('proposals').upsert([proposal]);
      }
    } catch (e) {
      console.warn('[Proposals Store] Supabase sync note:', e.message);
    }

    // Always mirror to quotes table with PROP- ID to guarantee cloud persistence on Vercel
    try {
      const qRecord = proposalToQuoteRecord(proposal);
      await supabase.from('quotes').upsert([qRecord], { onConflict: 'id' });
    } catch (e) {
      console.warn('[Proposals Store] Supabase quotes table fallback note:', e.message);
    }
  }

  return inMemoryProposals.find(p => p.id === proposal.id) || proposal;
}

async function deleteProposalFromStore(id) {
  inMemoryProposals = inMemoryProposals.filter(p => p.id !== id);
  writeLocalDBProposals(inMemoryProposals);

  try {
    const db = await readDB();
    if (Array.isArray(db.proposals)) {
      db.proposals = db.proposals.filter(p => p.id !== id);
      await writeDB(db);
    }
  } catch (_) {}

  if (isSupabaseConfigured() && process.env.NODE_ENV !== 'test') {
    try {
      await supabase.from('proposals').delete().eq('id', id);
    } catch (_) {}
    try {
      await supabase.from('quotes').delete().eq('id', id);
    } catch (_) {}
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PRESET & TEMPLATE ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/proposals/presets — List pre-engineered enterprise SOW presets
router.get(['/presets', '/public/presets'], (req, res) => {
  return res.json({
    success: true,
    presets: Object.values(ENTERPRISE_PRESETS)
  });
});

// GET /api/proposals/presets/:key — Retrieve specific enterprise preset
router.get('/presets/:key', (req, res) => {
  const { key } = req.params;
  const preset = ENTERPRISE_PRESETS[key.toUpperCase()] || Object.values(ENTERPRISE_PRESETS).find(p => p.id === key);
  if (!preset) {
    return res.status(404).json({ error: 'Preset not found' });
  }
  return res.json({ success: true, preset });
});
// ADMIN ENDPOINTS (Restricted to Owner / Admin - Firoz)
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/proposals — List all proposals
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const items = await getProposalsStore();
    return res.json(items.map(mapProposal));
  } catch (err) {
    console.error('Proposals list error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/proposals/:id — Get proposal by ID
router.get('/:id', async (req, res, next) => {
  if (req.baseUrl && req.baseUrl.includes('/public')) {
    return next();
  }
  // Share tokens are lowercase alphanumeric with hyphens (e.g. 'ucb-meta-ai-7x9q').
  // If the :id looks like a share token (not a PROP- ID or UUID), pass to the
  // public /:token handler below instead of requiring admin auth.
  const isShareToken = /^[a-z0-9][a-z0-9-]{4,}$/.test(req.params.id) &&
    !req.params.id.startsWith('PROP-') &&
    !/^[0-9a-f]{8}-[0-9a-f]{4}/.test(req.params.id);
  if (isShareToken) return next();

  return requireAuth(req, res, () => {
    return requireAdmin(req, res, async () => {
      const { id } = req.params;
      try {
        const items = await getProposalsStore();
        const found = items.find(p => p.id === id || p.share_token === id);
        if (found) return res.json(mapProposal(found));

        return res.status(404).json({ error: 'Proposal not found' });
      } catch (err) {
        return res.status(500).json({ error: err.message });
      }
    });
  });
});

// POST /api/proposals — Create new proposal
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    await getProposalsStore();
    const nextNum = inMemoryProposals.length + 1;
    const newId = `PROP-2026-${String(nextNum).padStart(3, '0')}`;
    const token = req.body.shareToken || req.body.share_token || generateShareToken();

    const oneTimeItems = Array.isArray(req.body.oneTimeItems) ? req.body.oneTimeItems : (Array.isArray(req.body.one_time_items) ? req.body.one_time_items : []);
    const recurringItems = Array.isArray(req.body.recurringItems) ? req.body.recurringItems : (Array.isArray(req.body.recurring_items) ? req.body.recurring_items : []);

    const oneTimeTotal = oneTimeItems.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
    const recurringTotal = recurringItems.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);

    const payload = {
      id: newId,
      share_token: token,
      client_name: req.body.clientName || req.body.client_name || 'Valued Client',
      client_company: req.body.clientCompany || req.body.client_company || '',
      client_email: req.body.clientEmail || req.body.client_email || '',
      client_phone: req.body.clientPhone || req.body.client_phone || '',
      project_title: req.body.projectTitle || req.body.project_title || 'AI Growth Proposal',
      project_summary: req.body.projectSummary || req.body.project_summary || '',
      canonical_service_code: req.body.canonicalServiceCode || req.body.canonical_service_code || null,
      scope_items: Array.isArray(req.body.scopeItems) ? req.body.scopeItems : (Array.isArray(req.body.scope_items) ? req.body.scope_items : []),
      one_time_items: oneTimeItems,
      recurring_items: recurringItems,
      one_time_total: req.body.oneTimeTotal !== undefined ? Number(req.body.oneTimeTotal) : (req.body.one_time_total !== undefined ? Number(req.body.one_time_total) : oneTimeTotal),
      recurring_total: req.body.recurringTotal !== undefined ? Number(req.body.recurringTotal) : (req.body.recurring_total !== undefined ? Number(req.body.recurring_total) : recurringTotal),
      currency: req.body.currency || 'BDT',
      timeline: req.body.timeline || '2–3 Weeks',
      valid_until: req.body.validUntil || req.body.valid_until || null,
      terms: req.body.terms || '',
      notes: req.body.notes || '',
      status: req.body.status || 'Draft',
      created_by: req.user.profile?.emp_code || req.user.id || 'GRO-001',
      view_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await persistProposal(payload, false);

    try {
      broadcast('proposal_created', mapProposal(payload));
      broadcast('proposal_update', inMemoryProposals.map(mapProposal));
    } catch (e) {}

    // Send Telegram notification to agency owner / admin
    try {
      const ownerChatId = process.env.OWNER_TELEGRAM_ID || process.env.TELEGRAM_OWNER_CHAT_ID;
      if (ownerChatId) {
        const { sendTelegramNotification } = require('../services/bot/notifications');
        const baseUrl = process.env.BASE_URL || 'https://gro10x-ai.vercel.app';
        const publicUrl = `${baseUrl}/p/${token}`;
        const currSym = payload.currency === 'USD' ? '$' : '৳';
        sendTelegramNotification(
          ownerChatId,
          `💼 *New Commercial SOW Proposal Created!*\n\n` +
          `🏢 *Client:* ${payload.client_company || payload.client_name}\n` +
          `📋 *Project:* ${payload.project_title}\n` +
          `💵 *Investment:* ${currSym}${payload.one_time_total.toLocaleString()} + ${currSym}${payload.recurring_total.toLocaleString()}/mo\n` +
          `🔗 *Public Link:* ${publicUrl}`,
          [[{ text: '👁 View Proposal', url: publicUrl }]],
          true
        ).catch(() => {});
      }
    } catch (_) {}

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
    const items = await getProposalsStore();
    const memIdx = items.findIndex(p => p.id === id);
    if (memIdx === -1) {
      return res.status(404).json({ error: 'Proposal not found' });
    }
    const existing = items[memIdx];

    const updates = {
      ...existing,
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

    await persistProposal(updates, true);

    const updated = mapProposal(updates);
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
    await deleteProposalFromStore(id);
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
    const allProposals = await getProposalsStore();
    const memIdx = allProposals.findIndex(p => p.id === id);
    const proposal = memIdx !== -1 ? allProposals[memIdx] : null;

    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    const projectId = `PRJ-${Date.now().toString().slice(-6)}`;
    const newProject = {
      id: projectId,
      name: proposal.project_title || proposal.projectTitle || 'Client Project',
      client_id: proposal.client_id || proposal.clientId || null,
      client_name: proposal.client_name || proposal.clientName || 'Client Partner',
      description: proposal.project_summary || proposal.projectSummary || '',
      department: 'Production',
      workflow_type: 'ai_automation',
      status: 'Active',
      budget: Number(proposal.one_time_total || proposal.oneTimeTotal || 0),
      currency: proposal.currency || 'BDT',
      start_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      created_at: new Date().toISOString()
    };

    const updatedProposal = {
      ...proposal,
      status: 'Converted',
      converted_project_id: projectId,
      updated_at: new Date().toISOString()
    };
    await persistProposal(updatedProposal, true);

    // Dual-persist project in Supabase & data/db.json
    try {
      if (fs.existsSync(DB_JSON_PATH)) {
        const dbContent = JSON.parse(fs.readFileSync(DB_JSON_PATH, 'utf8'));
        dbContent.projects = dbContent.projects || [];
        const pIdx = dbContent.projects.findIndex(p => p.id === projectId);
        if (pIdx !== -1) {
          dbContent.projects[pIdx] = { ...dbContent.projects[pIdx], ...newProject };
        } else {
          dbContent.projects.unshift(newProject);
        }
        fs.writeFileSync(DB_JSON_PATH, JSON.stringify(dbContent, null, 2), 'utf8');
      }
    } catch (_) {}

    try {
      const db = await readDB();
      db.projects = db.projects || [];
      const pIdx = db.projects.findIndex(p => p.id === projectId);
      if (pIdx !== -1) {
        db.projects[pIdx] = { ...db.projects[pIdx], ...newProject };
      } else {
        db.projects.unshift(newProject);
      }
      await writeDB(db);
    } catch (_) {}

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('projects').insert([newProject]);
      } catch (e) {}
    }

    // Telegram Notification to Project Ops Lead / Admin
    try {
      const { sendTelegramNotification } = require('../services/bot/notifications');
      const adminTg = process.env.OWNER_TELEGRAM_ID || process.env.TELEGRAM_ADMIN_CHAT_ID;
      if (adminTg) {
        const currSym = newProject.currency === 'USD' ? '$' : '৳';
        sendTelegramNotification(
          adminTg,
          `🚀 *Production Project Spawned from Proposal!*\n\n` +
          `• Project: *${newProject.name}* (\`${newProject.id}\`)\n` +
          `• Client: *${newProject.client_name}*\n` +
          `• Budget: *${currSym}${newProject.budget.toLocaleString()}*\n` +
          `• Due Date: *${newProject.due_date}*\n` +
          `• Converted from: *${proposal.id}*`,
          null,
          true
        ).catch(() => {});
      }
    } catch (_) {}

    try {
      broadcast('proposal_update', inMemoryProposals.map(mapProposal));
      broadcast('project_update', newProject);
    } catch (e) {}

    return res.json({
      success: true,
      message: 'Proposal successfully converted to project',
      projectId,
      project: newProject,
      proposal: mapProposal(updatedProposal)
    });
  } catch (err) {
    console.error('Convert proposal to project error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// AI PROPOSAL DRAFTING (Gemini Integration)
// ─────────────────────────────────────────────────────────────────────────────

const GEMINI_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3.1-flash-lite-preview',
  'gemma-4-26b-a4b-it',
  'gemini-flash-latest'
];

function callGeminiAPI(model, prompt, key) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: 4000,
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
    req.setTimeout(25000, () => {
      req.destroy();
      reject(new Error(`Gemini Timeout on ${model}`));
    });
    req.write(payload);
    req.end();
  });
}

function cleanJSONResponse(rawText) {
  if (!rawText) return null;
  let text = String(rawText).trim();
  if (text.startsWith('```json')) text = text.replace(/^```json/i, '');
  if (text.startsWith('```')) text = text.replace(/^```/i, '');
  if (text.endsWith('```')) text = text.replace(/```$/i, '');
  try {
    return JSON.parse(text.trim());
  } catch (e) {
    const firstObj = text.indexOf('{');
    const lastObj = text.lastIndexOf('}');
    if (firstObj !== -1 && lastObj > firstObj) {
      try {
        return JSON.parse(text.slice(firstObj, lastObj + 1));
      } catch (err) {}
    }
    const firstArr = text.indexOf('[');
    const lastArr = text.lastIndexOf(']');
    if (firstArr !== -1 && lastArr > firstArr) {
      try {
        return JSON.parse(text.slice(firstArr, lastArr + 1));
      } catch (err) {}
    }
    return null;
  }
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
    const isBrandRevamp = /brand|revamp|website|cms|channel|facebook|linkedin|youtube|lead\s*collection|pilot/i.test(notes);
    const isMortgageOS = /mortgage|home\s*loan|rehab/i.test(notes);

    // If explicit mortgage request and not a brand revamp, return the enterprise mortgage preset (used in tests & mortgage proposals)
    if (isMortgageOS && !isBrandRevamp) {
      const p = ENTERPRISE_PRESETS.NATIONAL_HOUSING_FINANCE_AI_OS;
      return {
        clientName: clientName || p.clientName,
        clientCompany: p.clientCompany,
        projectTitle: p.projectTitle,
        projectSummary: p.projectSummary,
        canonicalServiceCode: p.canonicalServiceCode,
        scopeItems: p.scopeItems,
        oneTimeItems: p.oneTimeItems,
        recurringItems: p.recurringItems,
        oneTimeTotal: selectedCurrency === 'USD' ? 2700 : p.oneTimeTotal,
        recurringTotal: selectedCurrency === 'USD' ? 335 : p.recurringTotal,
        currency: selectedCurrency,
        timeline: p.timeline,
        terms: p.terms
      };
    }

    if (isBrandRevamp) {
      const isNHF = /national\s*housing|nhf/i.test(notes);
      return {
        clientName: clientName || (isNHF ? 'National Housing Finance PLC' : 'Client Partner'),
        clientCompany: isNHF ? 'National Housing Finance Limited' : (clientName || 'Enterprise Partner'),
        projectTitle: isNHF
          ? 'Omnichannel Brand Transformation, Digital Revamp & Performance Lead Engine'
          : 'Omnichannel Brand Transformation & Integrated Growth Engine',
        projectSummary: `Comprehensive digital presence revamp and lead generation infrastructure. Phase 1 executes a complete overhaul of web and multi-channel touchpoints (Website, LinkedIn, Facebook, YouTube), coupled with an integrated CMS, automated lead capture, and a 3-month performance pilot.`,
        canonicalServiceCode: 'BRAND-TRANSFORM-PILOT',
        scopeItems: [
          { title: 'Digital Brand & Channel Overhaul', description: 'Complete design and messaging revamp across Website, LinkedIn, Facebook page, YouTube channel, and brand touchpoints.' },
          { title: 'Integrated CMS & Lead Capture Architecture', description: 'Modern CMS setup with high-converting landing pages, lead capture funnels, and CRM pipeline synchronization.' },
          { title: 'Monthly Multi-Channel Content & Management', description: 'Active content creation, scheduled distribution, community engagement, and brand channel maintenance.' },
          { title: 'Qualified Lead Operations & Revenue Engine', description: 'End-to-end performance funnel optimization and qualified lead handoff with performance-linked attribution.' }
        ],
        oneTimeItems: [
          { name: 'Website Revamp & Channel Architecture Overhaul', description: 'Initial complete overhaul of web portal, CMS setup, and communication channels (Website, LinkedIn, Facebook, YouTube)', amount: selectedCurrency === 'USD' ? 250 : 25000 }
        ],
        recurringItems: [
          { name: 'Monthly Content Creation, Channel Maintenance & Lead Ops', description: 'Ongoing monthly content production, channel management, and lead generation operations (3-Month Pilot)', amount: selectedCurrency === 'USD' ? 250 : 25000, frequency: 'Monthly' }
        ],
        oneTimeTotal: selectedCurrency === 'USD' ? 250 : 25000,
        recurringTotal: selectedCurrency === 'USD' ? 250 : 25000,
        currency: selectedCurrency,
        timeline: '3-Month Pilot ending December 27',
        terms: 'Pilot Phase: BDT 50,000/month (BDT 25,000 platform overhaul + BDT 25,000 monthly maintenance/content) for the first 3 months. Performance Revenue Share: Qualified lead conversion incentive agreed upon milestone delivery. Terms: 50% advance on monthly cycle; cancel or renew at end of 3-month pilot evaluation.'
      };
    }

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
Pay close attention to specific budgets, tasks, phases, and commercial structure described in the notes.

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

    let generatedBy = 'gemini';
    if (!parsedDraft) {
      parsedDraft = buildFallbackDraft();
      generatedBy = 'template_fallback';
    }

    return res.json({
      success: true,
      draft: parsedDraft,
      generatedBy
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

// GET /api/public/proposals/:token or /api/proposals/public/:token — Public view of proposal
router.get(['/public/:token', '/:token'], async (req, res) => {
  const { token } = req.params;
  try {
    const store = await getProposalsStore();
    const cleanTok = String(token || '').toLowerCase().trim();

    let proposal = store.find(p =>
      (p.share_token && p.share_token.toLowerCase() === cleanTok) ||
      (p.shareToken && p.shareToken.toLowerCase() === cleanTok) ||
      (p.id && p.id.toLowerCase() === cleanTok)
    );

    if (!proposal && isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('proposals')
          .select('*')
          .or(`share_token.eq.${token},id.eq.${token}`)
          .maybeSingle();
        if (!error && data) proposal = data;
      } catch (e) {}
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

    // Dual-persist updated view count
    await persistProposal({ ...proposal, ...updates }, true);

    // Trigger Telegram notification to Admin on first view or periodically
    if (isFirstView) {
      try {
        sendProposalViewedNotification({ ...proposal, ...updates });
      } catch (e) {
        console.warn('[Telegram Alert] Proposal viewed dispatch warning:', e.message);
      }
    }

    // Broadcast real-time SSE event to admin proposals studio
    try {
      broadcast('proposal_update', inMemoryProposals.map(mapProposal));
      broadcast('proposal_viewed', {
        id: proposal.id,
        shareToken: proposal.share_token || proposal.shareToken,
        clientName: proposal.client_name || proposal.clientName,
        clientCompany: proposal.client_company || proposal.clientCompany,
        projectTitle: proposal.project_title || proposal.projectTitle,
        viewCount: proposal.view_count || updates.view_count || updates.viewCount || 1,
        viewedAt: updates.viewed_at || updates.viewedAt || new Date().toISOString()
      });
    } catch (e) {}

    // Return sanitized public proposal (omit internal notes)
    const publicData = mapProposal({ ...proposal, ...updates });
    delete publicData.notes;

    return res.json(publicData);
  } catch (err) {
    console.error('Public proposal fetch error:', err);
    return res.status(500).json({ error: 'Failed to load proposal' });
  }
});

// POST /api/public/proposals/:token/accept or /api/proposals/public/:token/accept — Client accepts proposal
router.post(['/public/:token/accept', '/:token/accept'], async (req, res) => {
  const { token } = req.params;
  const { acceptedBy, clientNote } = req.body;

  try {
    const store = await getProposalsStore();
    const cleanTok = String(token || '').toLowerCase().trim();
    let proposal = store.find(p =>
      (p.share_token && p.share_token.toLowerCase() === cleanTok) ||
      (p.shareToken && p.shareToken.toLowerCase() === cleanTok) ||
      (p.id && p.id.toLowerCase() === cleanTok)
    );

    if (!proposal && isSupabaseConfigured()) {
      try {
        const { data } = await supabase.from('proposals').select('*').or(`share_token.eq.${token},id.eq.${token}`).maybeSingle();
        if (data) proposal = data;
      } catch (_) {}
    }

    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    const affRef = proposal.affiliate_id || proposal.affiliateId || proposal.ref_code || proposal.refCode || req.query.ref || req.body.refCode || req.body.affiliate_id || null;

    const updates = {
      status: 'Accepted',
      accepted_at: new Date().toISOString(),
      accepted_by: acceptedBy || proposal.client_name || 'Client Representative',
      acceptedBy: acceptedBy || proposal.client_name || 'Client Representative',
      accepted_notes: clientNote || '',
      acceptedNotes: clientNote || '',
      updated_at: new Date().toISOString()
    };
    if (affRef) {
      updates.affiliate_id = affRef;
      updates.ref_code = affRef;
    }

    // 1. Resolve or Auto-Create Client Organization Record
    let clientRecord = null;
    const clientName = (proposal.client_company || proposal.client_name || 'Partner Organization').trim();
    const contactName = acceptedBy || proposal.client_name || 'Primary Contact';
    const clientEmail = proposal.client_email || '';
    const clientPhone = proposal.client_phone || '';

    if (isSupabaseConfigured()) {
      try {
        let q = supabase.from('clients').select('*');
        if (clientEmail) {
          q = q.or(`email.eq.${clientEmail},name.ilike.%${clientName}%`);
        } else {
          q = q.ilike('name', `%${clientName}%`);
        }
        const { data: existingClients } = await q.limit(1);
        if (existingClients && existingClients.length > 0) {
          clientRecord = existingClients[0];
        }
      } catch (_) {}
    }

    const db = await readDB();
    if (!clientRecord) {
      clientRecord = (db.clients || []).find(c => 
        (clientEmail && c.email && c.email.toLowerCase() === clientEmail.toLowerCase()) ||
        (c.name && c.name.toLowerCase().includes(clientName.toLowerCase()))
      );
    }

    if (!clientRecord) {
      const newClientId = `CLI-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
      const primaryPoc = standardizePOC({
        name: contactName,
        email: clientEmail,
        phone: clientPhone,
        decision_role: 'PRIMARY_DECISION_MAKER'
      });

      clientRecord = {
        id: newClientId,
        name: clientName,
        contact_person: contactName,
        email: clientEmail,
        phone: clientPhone,
        whatsapp: clientPhone,
        status: 'Onboarding',
        category: 'AI Transformation',
        total_spent: '0',
        active_campaigns: [],
        pocs: [primaryPoc]
      };

      if (isSupabaseConfigured()) {
        try {
          const { error: insErr } = await supabase.from('clients').insert([clientRecord]);
          if (insErr) console.warn('[Proposals Accept] Insert client warning:', insErr.message);
        } catch (e) {
          console.warn('[Proposals Accept] Insert client exception:', e.message);
        }
      }

      db.clients = db.clients || [];
      db.clients.push(clientRecord);
      try { writeDB(db); } catch (_) {}
      try { broadcast('client_update', [clientRecord]); } catch (_) {}
    }

    // 2. Resolve Canonical Product Code
    let targetProductCode = proposal.canonical_service_code || proposal.product_code || null;
    if (!targetProductCode) {
      const titleLower = (proposal.project_title || '').toLowerCase();
      if (titleLower.includes('chat') || titleLower.includes('conversational')) targetProductCode = 'SVC-002';
      else if (titleLower.includes('crm') || titleLower.includes('hub')) targetProductCode = 'SVC-003';
      else if (titleLower.includes('rag') || titleLower.includes('doc')) targetProductCode = 'SVC-004';
      else if (titleLower.includes('voice') || titleLower.includes('call')) targetProductCode = 'SVC-005';
      else if (titleLower.includes('sprint')) targetProductCode = 'SPRINT-01';
      else targetProductCode = 'SVC-001';
    }

    // 3. Auto-Generate Zero-Miscommunication Project Lock-In Spec
    let lockinSpec = null;
    try {
      lockinSpec = await createProjectLockinSpec({
        clientId: clientRecord.id,
        proposalId: proposal.id,
        productCode: targetProductCode,
        questionnaireAnswers: {
          Q5_SUCCESS_BENCHMARK: clientNote || 'Accepted via digital proposal link.'
        },
        customInclusions: (proposal.scope_items || []).map(s => s.title ? `${s.title}: ${s.description || ''}` : String(s))
      });
    } catch (specErr) {
      console.warn('[Proposal Accept] Lock-in spec warning:', specErr.message);
    }

    const specId = lockinSpec ? lockinSpec.id : null;
    if (specId) {
      updates.lockin_spec_id = specId;
    }

    // 4. Auto-Generate Corporate Upfront Invoice (Engine 2 Settlement Rail)
    let invoice = null;
    try {
      const { createInvoiceRecord } = require('./invoices');
      const oneTime = Number(proposal.one_time_total || proposal.oneTimeTotal || 0);
      const recurring = Number(proposal.recurring_total || proposal.recurringTotal || 0);
      const sprintAmount = oneTime > 0 ? oneTime : (recurring > 0 ? recurring : 50000);
      const projectTitle = proposal.project_title || proposal.projectTitle || 'AI Sprint Solution';
      const currency = proposal.currency || 'BDT';

      invoice = await createInvoiceRecord({
        clientId: clientRecord.id,
        clientName: clientRecord.name || clientName,
        projectName: projectTitle,
        projectRef: proposal.id,
        currency,
        engineTag: 'engine2',
        invoiceType: 'deposit_upfront',
        settlementRail: currency === 'USD' ? 'usd_stripe' : 'bdt_bank_wire',
        status: 'Pending',
        taxRate: 5,
        affiliateId: affRef,
        refCode: affRef,
        items: [
          {
            description: `${projectTitle} — Upfront Sprint Deposit`,
            qty: 1,
            rate: sprintAmount,
            amount: sprintAmount
          }
        ],
        notes: `Upfront Deposit for accepted Proposal ${proposal.id}. Corporate Rail: BRAC Bank Limited (Neoncore Tech Solution) A/C: 2081636480001.`
      });
    } catch (invErr) {
      console.warn('[Proposal Accept] Invoice generation warning:', invErr.message);
    }

    const invoiceId = invoice ? invoice.id : null;
    if (invoiceId) {
      updates.invoice_id = invoiceId;
    }
    updates.client_id = clientRecord.id;

    const baseUrl = process.env.BASE_URL || 'https://gro10x-ai.vercel.app';
    const clientSessionToken = signToken({
      userId: clientRecord.id,
      id: clientRecord.id,
      email: clientRecord.email || proposal.client_email || '',
      name: clientRecord.name,
      role: 'Client Partner',
      accessLevel: 'Client Partner',
      linkedType: 'client',
      linkedId: clientRecord.id
    }, '30d');

    const onboardingUrl = `${baseUrl}/client?token=${clientSessionToken}${specId ? `&specId=${specId}#lockin` : '#account'}`;
    const invoiceUrl = `${baseUrl}/client?token=${clientSessionToken}${invoiceId ? `&inv=${invoiceId}` : ''}#invoices`;
    const invoicePublicUrl = invoiceId ? `${baseUrl}/invoices.html?inv=${invoiceId}` : null;

    // Dual-persist accepted status
    await persistProposal({ ...proposal, ...updates }, true);

    // Dispatch instant celebration Telegram alert to Owner/Admin & DBM with invoice and cockpit reference
    try {
      sendProposalAcceptedNotification({
        ...proposal,
        ...updates,
        invoiceId,
        invoiceAmount: invoice ? invoice.amount : null,
        acceptedBy: acceptedBy || proposal.client_name,
        clientToken: clientSessionToken,
        onboardingUrl
      });
    } catch (e) {
      console.warn('[Telegram Alert] Acceptance dispatch warning:', e.message);
    }

    // Dispatch confirmation email with tokenized handover link to client
    try {
      sendProposalAcceptedClientEmail({
        clientName: clientRecord.name || acceptedBy || proposal.client_name,
        email: clientRecord.email || proposal.client_email,
        projectTitle: proposal.project_title || proposal.projectTitle,
        proposalId: proposal.id,
        onboardingUrl,
        invoiceUrl,
        currency: proposal.currency || 'BDT',
        amount: invoice ? invoice.amount : (proposal.one_time_total || 0)
      });
    } catch (emailErr) {
      console.warn('[Resend Email] Proposal acceptance email dispatch warning:', emailErr.message);
    }

    try {
      broadcast('proposal_update', inMemoryProposals.map(mapProposal));
      broadcast('proposal_accepted', {
        id: proposal.id,
        shareToken: proposal.share_token || proposal.shareToken,
        clientName: clientRecord?.name || acceptedBy || proposal.client_name,
        clientCompany: proposal.client_company || proposal.clientCompany,
        projectTitle: proposal.project_title || proposal.projectTitle,
        convertedProjectId: proposal.converted_project_id || proposal.convertedProjectId || null,
        invoiceId: invoiceId || null,
        acceptedAt: updates.accepted_at || updates.acceptedAt || new Date().toISOString()
      });
    } catch (e) {
      console.warn('[Proposals Accept] Broadcast warning:', e.message);
    }

    return res.json({
      success: true,
      message: 'Proposal successfully accepted. Our team will coordinate next steps immediately.',
      proposal: mapProposal({ ...proposal, ...updates }),
      clientId: clientRecord.id,
      clientToken: clientSessionToken,
      sessionToken: clientSessionToken,
      specId: specId,
      lockinSpec,
      invoiceId: invoiceId,
      invoice: invoice,
      handoverUrl: `/handover-view.html?projectId=${encodeURIComponent(proposal.id)}`,
      invoiceUrl,
      invoicePublicUrl,
      onboardingUrl
    });
  } catch (err) {
    console.error('Proposal acceptance error:', err);
    return res.status(500).json({ error: 'Failed to accept proposal' });
  }
});

// POST /api/public/proposals/:token/schedule-call or /api/proposals/public/:token/schedule-call — Client requests alignment call
router.post(['/public/:token/schedule-call', '/:token/schedule-call'], async (req, res) => {
  const { token } = req.params;
  const { name, phone, email, note } = req.body;

  try {
    const store = await getProposalsStore();
    const cleanTok = String(token || '').toLowerCase().trim();
    let proposal = store.find(p =>
      (p.share_token && p.share_token.toLowerCase() === cleanTok) ||
      (p.shareToken && p.shareToken.toLowerCase() === cleanTok) ||
      (p.id && p.id.toLowerCase() === cleanTok)
    );

    if (!proposal && isSupabaseConfigured()) {
      try {
        const { data } = await supabase.from('proposals').select('*').or(`share_token.eq.${token},id.eq.${token}`).maybeSingle();
        if (data) proposal = data;
      } catch (_) {}
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

router.getProposalsStore = getProposalsStore;
router.persistProposal = persistProposal;
router.deleteProposalFromStore = deleteProposalFromStore;

module.exports = router;
module.exports.getProposalsStore = getProposalsStore;
module.exports.persistProposal = persistProposal;
module.exports.deleteProposalFromStore = deleteProposalFromStore;
module.exports.inMemoryProposals = inMemoryProposals;
