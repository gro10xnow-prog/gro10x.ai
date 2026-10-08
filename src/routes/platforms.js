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
      'SME Revenue Verification Engine',
      'Syndication Investor MiniApp',
      'Daily Revenue Share Distribution',
      'Deal Due Diligence Vault'
    ]
  },
  {
    id: 'serviq',
    name: 'ServiQ',
    badge: 'Engine 1: Micro-SaaS',
    engineId: 1,
    tagline: 'AI-Powered Home Services Marketplace (4 Languages + RTL)',
    stage: '95% Production Ready',
    stageType: 'live',
    readiness: 96,
    stack: 'React 18 · TypeScript · Supabase · Lovable AI · Stripe Credit Wallet · PWA',
    dbSchema: 'Supabase PostgreSQL · Realtime Bookings · Technician Geolocation',
    aiStack: 'Conversational Job Quoting Assistant & Multilingual Translation',
    authPayments: 'Stripe Credit Wallet Top-ups ($4.99 - $19.99) + bKash COD',
    infrastructure: 'Lovable Cloud · Geofenced Dhaka Node',
    targetMarket: 'Global & BD Urban Homeowners & Service Technicians (Dhaka First)',
    revenueModel: 'Credit Wallet Pack Top-ups + 12-15% Booking Commission',
    liveUrl: 'https://servique.lovable.app',
    repo: 'ServiQ Core (Lovable Cloud / GitHub)',
    nextAction: '🔥 Launch Dhaka Home Services pilot when Engine 4 hits stable cash',
    icon: '🔧',
    isOwned: true,
    keyModules: [
      '4-Language RTL / LTR Engine',
      'Technician Dispatch & GPS Geofencing',
      'Instant Job Booking Escrow',
      'Dual-mode Customer / Provider App'
    ]
  },
  {
    id: 'telegrab',
    name: 'Telegrab',
    badge: 'Engine 1: Infrastructure',
    engineId: 1,
    tagline: 'Multi-Channel Bot Platform-as-a-Service (BPaaS) & Knowledge Mesh',
    stage: '75% Built (Active Backbone)',
    stageType: 'near-launch',
    readiness: 75,
    stack: 'React 18 · Deno Edge · Supabase pgvector · Telegram Stars · WhatsApp Cloud API',
    dbSchema: 'Supabase with pgvector Embedding Store · Bot Session Mesh',
    aiStack: 'Vector RAG & Multi-agent Bot Orchestration Router',
    authPayments: 'Telegram Stars (XTR) + Stripe SaaS Tiers + Bot Add-ons (৳5k-10k/mo)',
    infrastructure: 'Deno Edge Runtimes · Telegram Webhook Gateway',
    targetMarket: 'B2B Clients, Marketers & Internal GRO10X Engine 4 OS Deployments',
    revenueModel: 'Telegram Stars (XTR) + Monthly Retainer Automation Add-on (৳5k-10k/mo)',
    liveUrl: 'https://telegrab.lovable.app',
    repo: 'Core Edge Backbone',
    nextAction: '⚡ Sell as bot automation add-on (৳5k-10k/mo) to all Engine 4 OS retainers',
    icon: '🤖',
    isOwned: true,
    keyModules: [
      'Deno Edge Webhook Router',
      'Multi-tenant Bot Configurator',
      'Telegram Stars Monetization',
      'WhatsApp Cloud API Gateway'
    ]
  },
  {
    id: 'pathshala',
    name: 'Pathshala.ai',
    badge: 'Engine 1: Micro-SaaS',
    engineId: 1,
    tagline: 'AI-Powered K-12 Phygital EdTech & 64-District Logistics',
    stage: 'v0.5.0 Live Staging',
    stageType: 'near-launch',
    readiness: 82,
    stack: 'Vanilla JS / Vite · Supabase · 64-District Geo Engine · bKash/Nagad · QR Scanner',
    dbSchema: 'Supabase PostgreSQL · District Logistics & SKU Inventory',
    aiStack: 'Planned Bangla ASR / TTS Speech AI for K-12 Tutoring',
    authPayments: 'bKash / Nagad Instant Checkout + Physical Cash-on-Delivery (COD)',
    infrastructure: 'Vercel Staging · Supabase Singapore AP',
    targetMarket: 'BD K-12 Students, Tutors & Phygital Book Distribution',
    revenueModel: 'Course Bundles + Physical Study Book COD Sales',
    liveUrl: 'https://pathshala.vercel.app',
    repo: 'Pathshala Staging / Production',
    nextAction: 'Parked — Implement v0.6 Bangla ASR/TTS after primary cash baseline',
    icon: '📚',
    isOwned: true,
    keyModules: [
      '64-District Logistics Routing',
      'Physical Book QR Code Scanner',
      'K-12 Video Course DRM Player',
      'Direct MFS Payment Gateway'
    ]
  },
  {
    id: 'pawsomebd',
    name: 'PawsomeBD',
    badge: 'Engine 1: Micro-SaaS',
    engineId: 1,
    tagline: 'AI Pet Portrait Merch Studio & Veterinary Concierge',
    stage: 'Feature Complete',
    stageType: 'live',
    readiness: 90,
    stack: 'React 18 · Gemini Flash · Canvas Composite · Credit Wallet (1 Cr = 2 BDT)',
    dbSchema: 'Supabase Orders, Art Generation Gallery, Credit Wallets',
    aiStack: 'Gemini Flash Image Composition & Style Transfer Prompter',
    authPayments: 'Credit Packs + Custom Printed Merch WhatsApp COD',
    infrastructure: 'Lovable Cloud · Canvas Client Rendering',
    targetMarket: 'BD Pet Parents + Global WildMutt Co. Etsy Crossover',
    revenueModel: 'AI Art Credit Packs + Custom Printed Merch (T-shirts, mugs, collars)',
    liveUrl: 'https://iampawsome.lovable.app',
    repo: 'PawsomeBD Lovable Workspace',
    nextAction: 'Activate alongside WildMutt Co. Etsy brand for AI merch crossover',
    icon: '🐾',
    isOwned: true,
    keyModules: [
      'Gemini Pet Art Generator',
      'HTML5 Canvas Print Previews',
      'WhatsApp Order Handoff',
      'Credit Wallet Top-up Engine'
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
    stack: 'React 19 · TypeScript · Vite · Tailwind · Supabase Schema Ready',
    dbSchema: 'Supabase Schema Drafted (Workers, Skills, Verifications, Badges)',
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
      '18 Supabase RLS Data Tables',
      'Dual Telegram Bot Mesh (Lead Inbound + Ops)',
      'Sprint & Milestone Deliverable Matrix',
      'Monthly Retainer Invoicing Engine'
    ]
  },
  {
    id: 'laundrymama',
    name: 'LaundryMama',
    badge: 'Engine 4: Retainer OS',
    engineId: 4,
    tagline: 'Smart Laundry & Fleet Logistics SaaS with Telegram MiniApps',
    stage: 'Implementation Blocked',
    stageType: 'stuck',
    readiness: 80,
    stack: 'React 19 · TypeScript · Supabase Realtime · Node Bot Server · TanStack Query v5',
    dbSchema: 'Supabase Realtime Tables (Orders, Drivers, Route Hubs, Garments)',
    aiStack: 'Smart Delivery Route Optimizer & Automated Order Status Bot',
    authPayments: 'bKash Merchant Auto-Deduct + Fleet Driver COD Reconciliation',
    infrastructure: 'Local Staging Server / Node Bot Server (Port 5173)',
    targetMarket: 'BD Commercial Laundry & Dry Cleaning Chains',
    revenueModel: '৳35,000 / month Retainer + Fleet Routing SLA',
    liveUrl: 'https://laundrymama.lovable.app',
    repo: 'Laundry Mama Workspace',
    nextAction: '🟠 Unblock implementation blocker to secure 2nd ৳35k/mo retainer contract',
    icon: '🧺',
    isOwned: false,
    keyModules: [
      'Driver Pickup/Delivery Routing',
      'Garment Barcode Tagging State Machine',
      'Customer Telegram MiniApp Booking',
      'Realtime Fleet Dispatch Ledger'
    ]
  },
  {
    id: 'shamsdental',
    name: 'Shams Dental Care (Clinic OS)',
    badge: 'Engine 4: Retainer OS',
    engineId: 4,
    tagline: '17-Module Dental Practice OS with AI Tooth Health Score Magnet',
    stage: '95% Feature Complete',
    stageType: 'live',
    readiness: 95,
    stack: 'React 18 · Supabase (PostgreSQL RLS) · Gemini Vision AI · Dual Telegram Bots',
    dbSchema: 'Supabase PostgreSQL RLS (Patients, Appointments, Tooth Charting, Invoices)',
    aiStack: 'Gemini Vision AI Tooth Scan Analysis & Patient Triage Bot',
    authPayments: 'bKash Tokenized + Clinic Front-Desk Cash POS',
    infrastructure: 'Lovable Cloud · Realtime Postgres Webhooks',
    targetMarket: 'Dental Clinics, Poly-clinics & Specialist Doctors in Dhaka',
    revenueModel: '৳35,000 / month OS Retainer + Lead Generation Bot Add-on',
    liveUrl: 'https://shamsdental.lovable.app',
    repo: 'Clinic OS Blueprint',
    nextAction: '⚡ Pitch Clinic OS to 1–2 premium dental practices in Banani/Dhanmondi',
    icon: '🏥',
    isOwned: false,
    keyModules: [
      '17-Module Dental Clinic OS',
      'AI Tooth Health Score Lead Magnet',
      'Dual Appointment Telegram Bots',
      'Interactive 32-Tooth Charting Canvas'
    ]
  },
  {
    id: 'bellavista',
    name: 'BellaVista (Hospitality OS)',
    badge: 'Engine 4: Retainer OS',
    engineId: 4,
    tagline: 'Resort & Multi-Property Management OS with Guest AI Concierge',
    stage: '71% Built (Dev Blueprint)',
    stageType: 'dev',
    readiness: 71,
    stack: 'React 18 · TypeScript · Supabase · Stripe Keys per Property · Telegram Bot',
    dbSchema: 'Supabase PostgreSQL (Rooms, Bookings, Guest Profiles, Folios)',
    aiStack: 'Guest WhatsApp / Telegram AI Concierge & Room Service Assistant',
    authPayments: 'Multi-account Stripe per property + Local Bank / MFS',
    infrastructure: 'Lovable Cloud Deployment',
    targetMarket: 'Resorts, Boutique Hotels, Villa Networks (Cox’s Bazar / Sylhet)',
    revenueModel: '৳35,000 / month Retainer as single-tenant Hospitality OS',
    liveUrl: 'https://bellavista.lovable.app',
    repo: 'Hospitality OS Blueprint',
    nextAction: '⚡ Pitch as single-tenant Hospitality OS to resort owners (no multi-tenant overhead)',
    icon: '🏨',
    isOwned: false,
    keyModules: [
      'Single-Tenant Resort Reservation Gateway',
      'Guest AI Concierge Bot',
      'Housekeeping Roster & Inventory Matrix',
      'Folio Settlement & Invoice Export'
    ]
  },
  {
    id: 'dwc',
    name: 'Dhaka Wholesale Club (DWC)',
    badge: 'Engine 4: Retainer OS',
    engineId: 4,
    tagline: 'Mobile-First B2C Wholesale Commerce & Multi-Hub Logistics OS',
    stage: 'Production-Ready Build',
    stageType: 'live',
    readiness: 88,
    stack: 'React 18 · TypeScript · Supabase · bKash Tokenized · Zone Routing · PWA',
    dbSchema: 'Supabase PostgreSQL (Wholesale SKUs, Tiered Pricing, Hub Warehouses)',
    aiStack: 'Automated Re-order Prediction & Customer Bulk Buying Assistant',
    authPayments: 'Tokenized bKash Instant Merchant Checkout + Commercial COD',
    infrastructure: 'Lovable Cloud PWA Deployment',
    targetMarket: 'BD Bulk Grocery Suppliers, Supermarkets & D2C Wholesalers',
    revenueModel: '৳35,000 / month Retainer or White-label Commerce License',
    liveUrl: 'https://dhakawsclub.lovable.app',
    repo: 'Wholesale OS Blueprint',
    nextAction: 'Ready to pitch as turnkey Wholesale/Retail E-Commerce OS',
    icon: '🛒',
    isOwned: false,
    keyModules: [
      'B2C Bulk Tiered Cart Engine',
      'Multi-Hub Zone Warehouse Routing',
      'Tokenized bKash Instant Settlements',
      'Field Sales Order Entry PWA'
    ]
  },
  {
    id: 'hrx',
    name: 'HRX (by ServiQ Technologies)',
    badge: 'Engine 4: Retainer OS',
    engineId: 4,
    tagline: 'Enterprise AI-First HRMS & Staffing Operating System (26 Modules)',
    stage: '100% Architecturally Built',
    stageType: 'live',
    readiness: 100,
    stack: 'React 18 · Supabase (104 Tables) · Gemini 2.5 Pro · GPT-5 · PWA',
    dbSchema: '104 PostgreSQL Tables with Enterprise RLS (Employees, Payroll, Leaves, ATS)',
    aiStack: 'Gemini 2.5 Pro Candidate Resume Parser & Performance Review Agent',
    authPayments: 'Enterprise Monthly Wire SLA (৳35k–৳60k/mo)',
    infrastructure: 'ServiQ Dedicated Cloud Architecture',
    targetMarket: 'IT Staffing, Recruitment Agencies & Mid-market Corporates',
    revenueModel: '৳35,000–৳60,000 / month White-Label HRIS Retainer',
    liveUrl: 'https://hrx.serviq.io',
    repo: 'Serviq Technologies Monorepo',
    nextAction: 'Pitch as single-tenant HRIS or white-label for staffing agencies',
    icon: '👔',
    isOwned: false,
    keyModules: [
      '26 Modular HR & Staffing Engines',
      '104-Table Normalized Database Schema',
      'Gemini 2.5 Pro Candidate Screener',
      'Automated Payroll & Tax Deduction Engine'
    ]
  },
  {
    id: 'shopway',
    name: 'ShopWay (Commerce OS)',
    badge: 'Engine 4: Retainer OS',
    engineId: 4,
    tagline: 'Omnichannel D2C Storefront & Multi-Agent AI Inbox (Web, WA, TG)',
    stage: 'Live Pilot (Rob’s)',
    stageType: 'pilot',
    readiness: 85,
    stack: 'React 18 · Supabase pgvector · Multi-Agent Router · Unipile WA · Telegram',
    dbSchema: 'Supabase PostgreSQL (Products, Orders, Customers, Conversations, Vector Embeddings)',
    aiStack: 'Multi-Agent Semantic Router across WhatsApp, Telegram, and Web Chat',
    authPayments: 'bKash Merchant Checkout + Stripe International',
    infrastructure: 'Lovable Cloud · Unipile API Gateway',
    targetMarket: 'BD D2C Brands, Cloud Kitchens & Specialty Retailers',
    revenueModel: '৳25,000–৳35,000 / month Commerce Retainer',
    liveUrl: 'https://shopway.lovable.app',
    repo: 'Commerce OS Blueprint',
    nextAction: 'Convert live pilot into long-term commercial retainer',
    icon: '🛍️',
    isOwned: false,
    keyModules: [
      'Unified Multi-Agent AI Inbox (Web, WA, TG)',
      'Omnichannel D2C Storefront Engine',
      'Vector Search Product Recommendation',
      'Automated WhatsApp Order Dispatch'
    ]
  },
  {
    id: 'tarangini',
    name: 'Tarangini (Distribution OS)',
    badge: 'Engine 4: Hyperlocal Franchise',
    engineId: 4,
    tagline: 'Telegram Commerce & 400K-Lead Field Distribution OS',
    stage: 'Production-Ready (41 Functions)',
    stageType: 'live',
    readiness: 95,
    stack: 'React 18 · Supabase (41 Edge Functions) · SSLCommerz · Bhairav P&L Bot · Town PWA',
    dbSchema: 'Supabase PostgreSQL (400k Lead Database, Regional Warehouses, Orders)',
    aiStack: 'Bhairav P&L Bot & Automated SMS Broadcast Trigger',
    authPayments: 'SSLCommerz, bKash Merchant, Regional COD Collections',
    infrastructure: '41 Supabase Edge Functions · Town-level PWA',
    targetMarket: 'Regional Distributors, Town Entrepreneurs & D2C Networks',
    revenueModel: 'City Franchise Licensing + Tarangini Daily Credit Deductions',
    liveUrl: 'https://tarangini.lovable.app',
    repo: 'Tarangini Monorepo',
    nextAction: 'Offer turnkey Hyperlocal Tech Franchise to city-level entrepreneurs',
    icon: '🚚',
    isOwned: true,
    keyModules: [
      '400,000-Lead Field Distribution Engine',
      '41 Supabase Edge Microservices',
      'Bhairav P&L Telegram Analytics Bot',
      'Regional Franchisee Credit Wallet'
    ]
  },
  {
    id: 'smartbangladesh',
    name: 'SmartBangladesh.ai',
    badge: 'Engine 5: GovTech Portfolio',
    engineId: 5,
    tagline: 'National AI Governance & 30-Agent Public Digital Transformation Portal',
    stage: 'Production Showcase',
    stageType: 'live',
    readiness: 80,
    stack: 'React 18 · TypeScript · Vite · Tailwind (National Theme) · shadcn/ui',
    dbSchema: 'Government Data Taxonomy & Public Service Ontologies',
    aiStack: '30-Agent Public Citizen Assistance & Policy Intelligence Mesh',
    authPayments: 'Government Institutional Grants & Enterprise Procurement',
    infrastructure: 'Lovable Cloud High-Availability Hosting',
    targetMarket: 'Government Ministries, ICT Divisions & Institutional RFPs',
    revenueModel: 'GovTech Enterprise RFP / Institutional Grant Positioning',
    liveUrl: 'https://smart-bangla-guide.lovable.app',
    repo: 'GovTech Showcase Repository',
    nextAction: 'Positioning asset for high-ticket Government/Institutional tenders',
    icon: '🇧🇩',
    isOwned: true,
    keyModules: [
      '30-Agent Citizen Service Navigator',
      'National AI Strategy Showcase',
      'ICT Division Procurement Portal',
      'Bilingual Civic Knowledge Mesh'
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
