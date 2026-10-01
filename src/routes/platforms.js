const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireManager, requireAdmin } = require('../middleware/rbac');
const { supabase, isSupabaseConfigured } = require('../services/supabase');
const sse = require('../services/sse');
const broadcast = (...args) => sse.broadcast(...args);
const { readDB, writeDB } = require('../services/db');
const { ok, fail, asyncHandler } = require('../utils/response');

// Baseline Predefined Platform Portfolio Seeds
const BASELINE_PLATFORMS = [
  {
    id: 'groupacademy',
    name: 'GroUp Academy',
    badge: 'Engine 1: Micro-SaaS',
    engineId: 1,
    tagline: 'Global AI Career OS & Unified Learning Economy',
    stage: 'Near-Launch (QA Code-Freeze)',
    stageType: 'near-launch',
    readiness: 94,
    stack: 'React 19 · Supabase (120+ Edge Functions) · Gemini Swarm · Stripe/bKash',
    dbSchema: 'PostgreSQL with Row-Level Security on all tables · 120+ Edge Functions',
    aiStack: 'Gemini Swarm, Role-specific AI Agents with Zod RPC Tools',
    authPayments: 'bKash Tokenized, Stripe Checkout, Fractional Credit Economy (1 Cr ≈ 2 BDT)',
    infrastructure: 'Lovable Cloud AP-Southeast · PWA · Dual-Shell Architecture (/app & /gro10x)',
    targetMarket: 'Global & BD Professionals, Students & B2B Enterprise Upskilling',
    revenueModel: 'Credit Economy + Tiered Subscriptions ($9–$49/mo) + 60/40 Course Splits',
    liveUrl: 'https://groupacademy.online',
    repo: 'Group Academy Monorepo (QA Branch)',
    nextAction: 'Code-frozen for final end-to-end payment QA before soft launch',
    icon: '🎓',
    isOwned: true,
    keyModules: [
      'Mastery-driven Talent Matchmaking',
      '16-Stakeholder AI Admin Cockpit',
      'Dynamic Credit Wallet System (1 Cr ≈ 2 BDT)',
      'Instructor Course & Royalty Payout Engine'
    ]
  },
  {
    id: 'gro10xcapital',
    name: 'GRO10X Capital',
    badge: 'Engine 1: Micro-SaaS',
    engineId: 1,
    tagline: 'BD SME Micro-Private Equity & Revenue-Based Growth Financing',
    stage: 'Production Ready (v0.8.5)',
    stageType: 'live',
    readiness: 98,
    stack: 'Next.js 16 · React 19 · Supabase (26 Tables) · 3 Telegram Bots · MiniApp',
    dbSchema: '26 PostgreSQL Tables with RLS · Escrow & Deal Ledger',
    aiStack: 'Financial Risk Assessment & Underwriting Rule Engine',
    authPayments: 'Direct Bank Wire, bKash Merchant, Syndication Revenue Share',
    infrastructure: 'Vercel Edge Network · Supabase Database',
    targetMarket: 'BD Retail & F&B SMEs (e.g. ORO Roasters, Segreto Hub)',
    revenueModel: 'RBF Revenue Share (8-15%) + Deal Syndication Platform Fees',
    liveUrl: 'https://capital.gro10x.ai',
    repo: 'Capital Monorepo (Production)',
    nextAction: 'Ready for first live SME syndication deal pipeline',
    icon: '🏆',
    isOwned: true,
    keyModules: [
      'Automated RBF Deal Underwriting',
      'SME Revenue & Bank Statement Analyzer',
      'Syndication Investor Portal & Ledger',
      'Daily Revenue Share Collection Engine'
    ]
  },
  {
    id: 'orjon',
    name: 'Orjon.app (অর্জন)',
    badge: 'Engine 1: Micro-SaaS',
    engineId: 1,
    tagline: 'AI Career & Verification Marketplace for Technical Blue-Collar BD',
    stage: 'v0.5 MVP Demo',
    stageType: 'mvp',
    readiness: 65,
    stack: 'React 19 · TypeScript · Vite · Tailwind · Supabase Live DB Tables',
    dbSchema: 'Live PostgreSQL Schema (Workers, Skills, Verifications, Badges)',
    aiStack: 'AI Bangla Skill Assessment & Audio Question Prompter',
    authPayments: 'Employer Verification Fees + Hiring Tokens',
    infrastructure: 'Vercel Preview Deployments',
    targetMarket: 'BD Electricians, Drivers, Technicians & Employer Verification',
    revenueModel: 'Employer Hiring Fees + Technical Verification Badges',
    liveUrl: 'https://orjon-app.vercel.app',
    repo: 'Orjon Workspace Repo',
    nextAction: 'Production Database Connected — Ready for Blue-Collar Verification Pipeline',
    icon: '🛠️',
    isOwned: true,
    keyModules: [
      'Bangla Voice/Audio Intake',
      'Verified Trade Skill Badges',
      'Employer Search & Direct Call Dispatch',
      'Field Trade Assessment Tests'
    ]
  },
  {
    id: 'purpleos',
    name: 'PurpleOS (Agency OS)',
    badge: 'Engine 4: Retainer OS',
    engineId: 4,
    tagline: 'Enterprise Agency Operating System & Dual Telegram Bot Mesh',
    stage: 'Commercial Proposal Active (v0.8.9.9)',
    stageType: 'proposal',
    readiness: 100,
    stack: 'Node.js Express · Supabase (18 Tables RLS) · Vanilla ES Modules · Telegram Bots',
    dbSchema: '18 Supabase Tables with RLS (Clients, Sprints, Retainers, Deliverables)',
    aiStack: 'Telegram Lead Intake Bot & Automated Scope Breakdown Agent',
    authPayments: 'Bank Wire SLA Billing, bKash Merchant (৳35k/mo baseline)',
    infrastructure: 'Vercel Serverless & Node Express API',
    targetMarket: 'Purplebot Digital Limited (Commercial Proposal GRO-PBD-FIN-2026)',
    revenueModel: '৳35,000 / month (৳10k amortized platform + ৳25k SLA & continuous sprints)',
    liveUrl: 'https://purpleos-iota.vercel.app',
    repo: 'Purple Bot Monorepo',
    nextAction: '🔴 Close Purplebot Digital retainer contract (Proposal ref: GRO-PBD-FIN-2026)',
    icon: '🏢',
    isOwned: false,
    keyModules: [
      '16-Module Core Agency ERP',
      'Client Partner Review Room Cockpit',
      'Dual Telegram Bot Notification Mesh',
      'Continuous Delivery Sprint Tracker'
    ]
  }
];

function mapPlatform(p) {
  if (!p) return null;
  return {
    id: p.id,
    name: p.name,
    badge: p.badge,
    engineId: Number(p.engine_id || p.engineId) || 1,
    tagline: p.tagline || '',
    stage: p.stage || 'MVP',
    stageType: p.stage_type || p.stageType || 'mvp',
    readiness: Number(p.readiness) || 50,
    stack: p.stack || '',
    dbSchema: p.db_schema || p.dbSchema || '',
    aiStack: p.ai_stack || p.aiStack || '',
    authPayments: p.auth_payments || p.authPayments || '',
    infrastructure: p.infrastructure || '',
    targetMarket: p.target_market || p.targetMarket || '',
    revenueModel: p.revenue_model || p.revenueModel || '',
    liveUrl: p.live_url || p.liveUrl || '',
    repo: p.repo || '',
    nextAction: p.next_action || p.nextAction || '',
    icon: p.icon || '🚀',
    isOwned: Boolean(p.is_owned !== undefined ? p.is_owned : p.isOwned),
    keyModules: Array.isArray(p.key_modules || p.keyModules) ? (p.key_modules || p.keyModules) : [],
    createdAt: p.created_at || p.createdAt || new Date().toISOString()
  };
}

// GET /api/platforms — List all registered platforms & portfolio assets
router.get('/', asyncHandler(async (req, res) => {
  let customPlatforms = [];

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('platforms').select('*').order('created_at', { ascending: false });
      if (!error && Array.isArray(data)) {
        customPlatforms = data.map(mapPlatform);
      }
    } catch (_) {}
  }

  try {
    const db = await readDB();
    if (Array.isArray(db.platforms) && db.platforms.length > 0) {
      const dbPlatforms = db.platforms.map(mapPlatform);
      // Merge unique by id
      const existingIds = new Set(customPlatforms.map(p => p.id));
      dbPlatforms.forEach(p => {
        if (!existingIds.has(p.id)) {
          customPlatforms.push(p);
          existingIds.add(p.id);
        }
      });
    }
  } catch (_) {}

  // Merge custom platforms on top of baseline platforms
  const customMap = new Map(customPlatforms.map(p => [p.id, p]));
  const merged = [...customPlatforms];
  BASELINE_PLATFORMS.forEach(bp => {
    if (!customMap.has(bp.id)) {
      merged.push(bp);
    }
  });

  return ok(res, merged);
}));

// POST /api/platforms — Register a new Platform / Micro-SaaS
router.post('/', requireAuth, requireManager, asyncHandler(async (req, res) => {
  const {
    id: customId,
    name,
    badge,
    engineId,
    tagline,
    stage,
    stageType,
    readiness,
    stack,
    dbSchema,
    aiStack,
    authPayments,
    infrastructure,
    targetMarket,
    revenueModel,
    liveUrl,
    repo,
    nextAction,
    icon,
    isOwned,
    keyModules
  } = req.body;

  if (!name) {
    return fail(res, 400, 'Platform name is required', 'VALIDATION_ERROR');
  }

  const slugId = customId || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `platform-${Date.now()}`;
  const now = new Date().toISOString();

  const payload = {
    id: slugId,
    name,
    badge: badge || `Engine ${engineId || 1}: Micro-SaaS`,
    engine_id: Number(engineId) || 1,
    tagline: tagline || '',
    stage: stage || 'MVP In Progress',
    stage_type: stageType || 'mvp',
    readiness: Number(readiness) || 50,
    stack: stack || 'React · Node.js · Supabase',
    db_schema: dbSchema || 'PostgreSQL Schema',
    ai_stack: aiStack || 'None',
    auth_payments: authPayments || 'bKash / Bank Wire',
    infrastructure: infrastructure || 'Vercel Serverless',
    target_market: targetMarket || 'BD SME Market',
    revenue_model: revenueModel || 'SaaS Subscription',
    live_url: liveUrl || '',
    repo: repo || '',
    next_action: nextAction || 'Under active engineering review',
    icon: icon || '🚀',
    is_owned: isOwned !== undefined ? Boolean(isOwned) : true,
    key_modules: Array.isArray(keyModules) ? keyModules : ['Core Engine', 'Database Schema'],
    created_at: now,
    updated_at: now
  };

  // Dual-persist to Supabase
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('platforms').upsert([payload]);
    } catch (_) {}
  }

  // Dual-persist to local db.json
  try {
    const db = await readDB();
    if (!Array.isArray(db.platforms)) db.platforms = [];
    const idx = db.platforms.findIndex(p => p.id === slugId);
    if (idx !== -1) {
      db.platforms[idx] = payload;
    } else {
      db.platforms.unshift(payload);
    }
    await writeDB(db);
  } catch (_) {}

  const mapped = mapPlatform(payload);
  broadcast('platform_update', [mapped]);

  return ok(res, mapped, 201);
}));

// DELETE /api/platforms/:id — Remove a platform from registry (Admin)
router.delete('/:id', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('platforms').delete().eq('id', id);
    } catch (_) {}
  }

  try {
    const db = await readDB();
    if (Array.isArray(db.platforms)) {
      db.platforms = db.platforms.filter(p => p.id !== id);
      await writeDB(db);
    }
  } catch (_) {}

  broadcast('platform_update', [{ id, deleted: true }]);
  return ok(res, { success: true, id, message: 'Platform unregistered' });
}));

module.exports = router;
