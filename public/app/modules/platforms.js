/**
 * public/app/modules/platforms.js
 * ─────────────────────────────────────────────────────────────────────────────
 * GRO10X 16-Platform Portfolio Registry & Architecture Cockpit
 * Tracks state, tech stack, readiness %, live URLs, and commercial actions
 * across all proprietary SaaS platforms, client OS builds, and portfolio assets.
 * ─────────────────────────────────────────────────────────────────────────────
 */

window.APP_MODULES = window.APP_MODULES || {};

const PLATFORMS_REGISTRY_DATA = [
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
    nextAction: 'Parked — Replace supabaseMock.ts with live DB tables when ready',
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

// Custom Platform Registry Persistence
function getCustomPlatforms() {
  try {
    const raw = localStorage.getItem('gro10x_custom_platforms');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to parse custom platforms:', e);
    return [];
  }
}

function saveCustomPlatform(platform) {
  const list = getCustomPlatforms();
  list.unshift(platform);
  localStorage.setItem('gro10x_custom_platforms', JSON.stringify(list));
}

function getAllPlatforms() {
  return [...getCustomPlatforms(), ...PLATFORMS_REGISTRY_DATA];
}

function renderPlatformsView(container) {
  let activeFilter = 'all';
  let searchTerm = '';

  function getBadgeColor(stageType) {
    switch (stageType) {
      case 'live':
        return { bg: 'rgba(0,223,137,0.15)', text: '#00df89', border: 'rgba(0,223,137,0.35)' };
      case 'proposal':
        return { bg: 'rgba(245,158,11,0.18)', text: '#f59e0b', border: 'rgba(245,158,11,0.4)' };
      case 'pilot':
        return { bg: 'rgba(6,182,212,0.18)', text: '#06b6d4', border: 'rgba(6,182,212,0.4)' };
      case 'stuck':
        return { bg: 'rgba(239,68,68,0.18)', text: '#ef4444', border: 'rgba(239,68,68,0.4)' };
      case 'near-launch':
        return { bg: 'rgba(168,85,247,0.18)', text: '#c084fc', border: 'rgba(168,85,247,0.4)' };
      case 'dev':
      case 'mvp':
      default:
        return { bg: 'rgba(255,255,255,0.08)', text: '#94a3b8', border: 'rgba(255,255,255,0.15)' };
    }
  }

  function getFilteredPlatforms() {
    const all = getAllPlatforms();
    const q = searchTerm.toLowerCase().trim();

    return all.filter(p => {
      // Tab Category Filter
      if (activeFilter === 'engine1' && p.engineId !== 1) return false;
      if (activeFilter === 'engine4' && p.engineId !== 4) return false;
      if (activeFilter === 'live' && p.stageType !== 'live') return false;
      if (activeFilter === 'owned' && !p.isOwned) return false;

      // Search Query Filter
      if (q) {
        const haystack = [
          p.name,
          p.tagline,
          p.stack,
          p.targetMarket,
          p.revenueModel,
          p.repo,
          p.badge,
          p.stage,
          p.nextAction,
          ...(p.keyModules || [])
        ].join(' ').toLowerCase();

        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }

  function updateTabButtons() {
    const all = getAllPlatforms();
    const totalCount = all.length;
    const engine4Count = all.filter(p => p.engineId === 4).length;
    const engine1Count = all.filter(p => p.engineId === 1).length;
    const ownedCount = all.filter(p => p.isOwned).length;
    const liveCount = all.filter(p => p.stageType === 'live').length;

    const tabsContainer = document.getElementById('platformsFilterTabs');
    if (!tabsContainer) return;

    tabsContainer.innerHTML = `
      <button class="filter-btn ${activeFilter === 'all' ? 'active' : ''}" onclick="window.PlatformsModule.setFilter('all')" style="background:${activeFilter === 'all' ? '#00df89' : 'transparent'}; color:${activeFilter === 'all' ? '#09090b' : 'var(--text-secondary)'}; font-weight:700; border:none; padding:0.35rem 0.75rem; border-radius:7px; cursor:pointer; font-size:0.78rem; transition:all 0.2s;">
        All (${totalCount})
      </button>
      <button class="filter-btn ${activeFilter === 'engine4' ? 'active' : ''}" onclick="window.PlatformsModule.setFilter('engine4')" style="background:${activeFilter === 'engine4' ? '#f59e0b' : 'transparent'}; color:${activeFilter === 'engine4' ? '#09090b' : 'var(--text-secondary)'}; font-weight:700; border:none; padding:0.35rem 0.75rem; border-radius:7px; cursor:pointer; font-size:0.78rem; transition:all 0.2s;">
        🤝 Engine 4 OS (${engine4Count})
      </button>
      <button class="filter-btn ${activeFilter === 'engine1' ? 'active' : ''}" onclick="window.PlatformsModule.setFilter('engine1')" style="background:${activeFilter === 'engine1' ? '#00df89' : 'transparent'}; color:${activeFilter === 'engine1' ? '#09090b' : 'var(--text-secondary)'}; font-weight:700; border:none; padding:0.35rem 0.75rem; border-radius:7px; cursor:pointer; font-size:0.78rem; transition:all 0.2s;">
        💻 Engine 1 SaaS (${engine1Count})
      </button>
      <button class="filter-btn ${activeFilter === 'live' ? 'active' : ''}" onclick="window.PlatformsModule.setFilter('live')" style="background:${activeFilter === 'live' ? '#06b6d4' : 'transparent'}; color:${activeFilter === 'live' ? '#09090b' : 'var(--text-secondary)'}; font-weight:700; border:none; padding:0.35rem 0.75rem; border-radius:7px; cursor:pointer; font-size:0.78rem; transition:all 0.2s;">
        ⚡ Live / Prod (${liveCount})
      </button>
      <button class="filter-btn ${activeFilter === 'owned' ? 'active' : ''}" onclick="window.PlatformsModule.setFilter('owned')" style="background:${activeFilter === 'owned' ? '#a855f7' : 'transparent'}; color:${activeFilter === 'owned' ? '#ffffff' : 'var(--text-secondary)'}; font-weight:700; border:none; padding:0.35rem 0.75rem; border-radius:7px; cursor:pointer; font-size:0.78rem; transition:all 0.2s;">
        👑 Owned (${ownedCount})
      </button>
    `;
  }

  function updateStatsStrip() {
    const all = getAllPlatforms();
    const totalCount = all.length;
    const engine4Count = all.filter(p => p.engineId === 4).length;
    const engine1Count = all.filter(p => p.engineId === 1).length;
    const readyToPitchCount = all.filter(p => p.readiness >= 90 || p.stageType === 'live').length;

    const statsStrip = document.getElementById('platformsStatsStrip');
    if (!statsStrip) return;

    statsStrip.innerHTML = `
      <div style="background:var(--surface-card, #181824); border:1px solid var(--border-subtle, #2e2e3e); border-radius:14px; padding:1.1rem; box-shadow:0 4px 16px rgba(0,0,0,0.15);">
        <span style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; font-weight:700; letter-spacing:0.5px;">Total Platforms Built</span>
        <div style="font-size:1.6rem; font-weight:900; color:#ffffff; margin:0.15rem 0;">${totalCount} Codebases</div>
        <span style="font-size:0.72rem; color:#00df89; font-weight:600;">100% Documented & Architecture-Mapped</span>
      </div>
      <div style="background:var(--surface-card, #181824); border:1px solid rgba(245,158,11,0.3); border-radius:14px; padding:1.1rem; box-shadow:0 4px 16px rgba(0,0,0,0.15);">
        <span style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; font-weight:700; letter-spacing:0.5px;">Engine 4 OS Templates</span>
        <div style="font-size:1.6rem; font-weight:900; color:#f59e0b; margin:0.15rem 0;">${engine4Count} Vertical OS</div>
        <span style="font-size:0.72rem; color:#f59e0b; font-weight:600;">৳35,000/mo Retainer Engine</span>
      </div>
      <div style="background:var(--surface-card, #181824); border:1px solid rgba(0,223,137,0.3); border-radius:14px; padding:1.1rem; box-shadow:0 4px 16px rgba(0,0,0,0.15);">
        <span style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; font-weight:700; letter-spacing:0.5px;">Engine 1 Proprietary SaaS</span>
        <div style="font-size:1.6rem; font-weight:900; color:#00df89; margin:0.15rem 0;">${engine1Count} Platforms</div>
        <span style="font-size:0.72rem; color:#00df89; font-weight:600;">GroUp Academy + ServiQ + Telegrab</span>
      </div>
      <div style="background:var(--surface-card, #181824); border:1px solid rgba(6,182,212,0.3); border-radius:14px; padding:1.1rem; box-shadow:0 4px 16px rgba(0,0,0,0.15);">
        <span style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; font-weight:700; letter-spacing:0.5px;">Pitch-Ready Deployments</span>
        <div style="font-size:1.6rem; font-weight:900; color:#06b6d4; margin:0.15rem 0;">${readyToPitchCount} Deployable Assets</div>
        <span style="font-size:0.72rem; color:#06b6d4; font-weight:600;">Turnkey in &lt; 3-4 days</span>
      </div>
    `;
  }

  function renderCardsGrid() {
    const filtered = getFilteredPlatforms();
    const allCount = getAllPlatforms().length;
    const gridContainer = document.getElementById('platformsCardsGrid');
    const resultsCountEl = document.getElementById('platformResultsCount');

    if (resultsCountEl) {
      resultsCountEl.textContent = `Showing ${filtered.length} of ${allCount} platforms`;
    }

    if (!gridContainer) return;

    if (filtered.length === 0) {
      gridContainer.innerHTML = `
        <div style="grid-column: 1 / -1; background:var(--surface-card, #181824); border:1px dashed var(--border-subtle, #2e2e3e); border-radius:16px; padding:3rem 1.5rem; text-align:center;">
          <div style="font-size:3rem; margin-bottom:0.75rem;">🔍</div>
          <h3 style="font-size:1.2rem; font-weight:800; color:#ffffff; margin:0 0 0.4rem 0;">No matching platforms found</h3>
          <p style="color:var(--text-secondary); font-size:0.85rem; max-width:440px; margin:0 auto 1.25rem auto;">
            No platforms match your search term <strong style="color:#00df89;">"${searchTerm}"</strong> with filter <strong style="color:#f59e0b;">"${activeFilter}"</strong>.
          </p>
          <button onclick="window.PlatformsModule.resetFilters()" class="btn-primary" style="background:#00df89; color:#09090b; font-weight:800; border:none; padding:0.45rem 1.2rem; border-radius:8px; cursor:pointer; font-size:0.82rem;">
            🔄 Reset Filters & Search
          </button>
        </div>
      `;
      return;
    }

    gridContainer.innerHTML = filtered.map(p => {
      const badgeStyle = getBadgeColor(p.stageType);
      const isEngine4 = p.engineId === 4;
      const engineColor = isEngine4 ? '#f59e0b' : p.engineId === 1 ? '#00df89' : '#06b6d4';

      return `
        <div class="platform-card" style="background:var(--surface-card, #181824); border:1px solid ${p.stageType === 'live' ? 'rgba(0,223,137,0.25)' : p.stageType === 'stuck' ? 'rgba(239,68,68,0.4)' : p.stageType === 'proposal' ? 'rgba(245,158,11,0.3)' : 'var(--border-subtle, #2e2e3e)'}; border-radius:16px; padding:1.25rem; display:flex; flex-direction:column; justify-content:space-between; box-shadow:0 8px 24px rgba(0,0,0,0.18); transition:transform 0.2s ease, border-color 0.2s ease; position:relative; overflow:hidden;" onmouseenter="this.style.transform='translateY(-3px)'" onmouseleave="this.style.transform='translateY(0)'">
          <div>
            <!-- CARD HEADER -->
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.75rem; gap:0.5rem;">
              <div style="display:flex; align-items:center; gap:0.65rem;">
                <span style="font-size:1.6rem; line-height:1;">${p.icon || '🚀'}</span>
                <div>
                  <h3 style="font-size:1.05rem; font-weight:900; color:#ffffff; margin:0; line-height:1.2;">${p.name}</h3>
                  <span style="font-size:0.68rem; font-weight:800; color:${engineColor};">
                    ${p.badge}
                  </span>
                </div>
              </div>
              <span style="font-size:0.68rem; font-weight:800; padding:0.2rem 0.55rem; border-radius:8px; background:${badgeStyle.bg}; color:${badgeStyle.text}; border:1px solid ${badgeStyle.border}; white-space:nowrap;">
                ${p.stage}
              </span>
            </div>

            <!-- TAGLINE -->
            <p style="color:var(--text-secondary); font-size:0.82rem; margin:0 0 0.85rem 0; line-height:1.4;">
              ${p.tagline}
            </p>

            <!-- READINESS BAR -->
            <div style="margin-bottom:0.85rem;">
              <div style="display:flex; justify-content:space-between; font-size:0.68rem; color:var(--text-muted); margin-bottom:0.25rem;">
                <span>Architectural Readiness</span>
                <span style="color:#ffffff; font-weight:700;">${p.readiness}% Complete</span>
              </div>
              <div style="background:rgba(255,255,255,0.06); height:6px; border-radius:4px; overflow:hidden;">
                <div style="width:${p.readiness}%; background:${p.readiness > 85 ? '#00df89' : p.readiness > 70 ? '#06b6d4' : '#f59e0b'}; height:100%; transition:width 0.4s ease;"></div>
              </div>
            </div>

            <!-- SPECS DETAIL -->
            <div style="background:rgba(0,0,0,0.25); padding:0.75rem; border-radius:10px; font-size:0.74rem; display:flex; flex-direction:column; gap:0.35rem; margin-bottom:0.85rem; border:1px solid rgba(255,255,255,0.04);">
              <div><span style="color:var(--text-muted);">Stack:</span> <span style="color:#ffffff; font-weight:600;">${p.stack}</span></div>
              <div><span style="color:var(--text-muted);">Market:</span> <span style="color:var(--text-secondary);">${p.targetMarket}</span></div>
              <div><span style="color:var(--text-muted);">Model:</span> <span style="color:#f59e0b; font-weight:700;">${p.revenueModel}</span></div>
            </div>

            <!-- NEXT ACTION -->
            <div style="font-size:0.72rem; color:#06b6d4; background:rgba(6,182,212,0.08); border:1px solid rgba(6,182,212,0.2); padding:0.45rem 0.6rem; border-radius:8px; margin-bottom:0.85rem; line-height:1.35;">
              <strong style="color:#ffffff;">Next:</strong> ${p.nextAction}
            </div>
          </div>

          <!-- FOOTER LINKS & ACTIONS -->
          <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid rgba(255,255,255,0.06); padding-top:0.75rem; gap:0.5rem;">
            <span style="font-size:0.7rem; color:var(--text-muted); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:130px;" title="${p.repo}">
              📦 ${p.repo}
            </span>
            <div style="display:flex; gap:0.35rem; flex-shrink:0;">
              <button class="btn-ghost btn-sm" onclick="window.PlatformsModule.openSpecs('${p.id}')" style="font-size:0.72rem; padding:0.25rem 0.55rem; background:rgba(255,255,255,0.05); border:1px solid var(--border-subtle, #2e2e3e); border-radius:6px; cursor:pointer; color:var(--text-primary);">
                📐 Specs
              </button>
              <button class="btn-ghost btn-sm" onclick="window.PlatformsModule.openLivePreview('${p.liveUrl}', '${p.name.replace(/'/g, "\\'")}')" style="font-size:0.72rem; padding:0.25rem 0.55rem; background:rgba(0,223,137,0.08); border:1px solid rgba(0,223,137,0.3); color:#00df89; border-radius:6px; cursor:pointer;">
                🌐 Live Preview →
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Initial Full Shell Markup
  container.innerHTML = `
    <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem; margin-bottom:1.5rem;">
      <div>
        <div style="display:flex; align-items:center; gap:0.6rem; margin-bottom:0.25rem;">
          <h1 style="font-size:1.6rem; font-weight:900; font-family:var(--font-heading); color:var(--text-primary); margin:0;">
            🏗️ Platform Portfolio & Architecture Registry
          </h1>
          <span id="platformsHeaderBadge" style="font-size:0.7rem; font-weight:800; padding:0.2rem 0.55rem; border-radius:999px; background:rgba(0,223,137,0.15); color:#00df89; border:1px solid rgba(0,223,137,0.3);">
            ${getAllPlatforms().length} Registered Platforms & OS Engines
          </span>
        </div>
        <p style="color:var(--text-secondary); font-size:0.88rem; margin:0;">
          Comprehensive architecture, database telemetry, and commercial readiness directory across all proprietary SaaS and client OS assets.
        </p>
      </div>
      <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
        <button onclick="window.PlatformsModule.openRegisterModal()" class="btn-primary" style="background:#00df89; color:#09090b; font-weight:800; border:none; padding:0.45rem 0.9rem; border-radius:8px; cursor:pointer; font-size:0.82rem; display:flex; align-items:center; gap:0.35rem;">
          <span>➕</span> Register Platform
        </button>
        <a href="#engines" class="btn-secondary" style="text-decoration:none; display:flex; align-items:center; gap:0.35rem; font-size:0.82rem; padding:0.45rem 0.9rem;">
          🚀 Growth Engines
        </a>
        <a href="#proposals" class="btn-secondary" style="background:rgba(255,255,255,0.06); text-decoration:none; display:flex; align-items:center; gap:0.35rem; font-size:0.82rem; padding:0.45rem 0.9rem;">
          💼 Commercial Proposals
        </a>
      </div>
    </div>

    <!-- PORTFOLIO STATS STRIP -->
    <div id="platformsStatsStrip" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(210px, 1fr)); gap:1rem; margin-bottom:1.5rem;">
      <!-- Populated dynamically via updateStatsStrip() -->
    </div>

    <!-- FILTER TABS & SEARCH BAR -->
    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem; margin-bottom:1.25rem;">
      <div id="platformsFilterTabs" style="display:flex; gap:0.35rem; background:rgba(0,0,0,0.3); padding:0.25rem; border-radius:10px; border:1px solid var(--border-subtle, #2e2e3e); flex-wrap:wrap;">
        <!-- Populated dynamically via updateTabButtons() -->
      </div>

      <div style="display:flex; align-items:center; gap:0.75rem;">
        <span id="platformResultsCount" style="font-size:0.74rem; color:var(--text-muted); font-weight:600;"></span>
        <div style="position:relative;">
          <input type="text" id="platformSearchInput" placeholder="🔍 Search stack, market, repo..." oninput="window.PlatformsModule.handleSearch(this.value)" style="background:var(--surface-card, #181824); border:1px solid var(--border-subtle, #2e2e3e); border-radius:10px; padding:0.45rem 0.85rem; font-size:0.8rem; color:#ffffff; width:260px; outline:none; transition:border-color 0.2s;" onfocus="this.style.borderColor='#00df89'" onblur="this.style.borderColor='var(--border-subtle, #2e2e3e)'">
          <button onclick="window.PlatformsModule.clearSearch()" style="position:absolute; right:8px; top:50%; transform:translateY(-50%); background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:0.75rem; display:none;" id="platformClearSearchBtn">✕</button>
        </div>
      </div>
    </div>

    <!-- PLATFORMS GRID -->
    <div id="platformsCardsGrid" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(340px, 1fr)); gap:1.25rem;">
      <!-- Populated dynamically via renderCardsGrid() -->
    </div>

    <!-- ARCHITECTURE SPEC SHEET DRAWER / MODAL -->
    <div id="platformSpecsModal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.78); backdrop-filter:blur(6px); z-index:9999; align-items:center; justify-content:center; padding:1.25rem;">
      <div style="background:#13131c; border:1px solid var(--border-subtle, #2e2e3e); border-radius:18px; width:100%; max-width:680px; max-height:90vh; overflow-y:auto; box-shadow:0 24px 60px rgba(0,0,0,0.6); display:flex; flex-direction:column;">
        <div id="platformSpecsModalBody" style="padding:1.5rem;">
          <!-- Dynamically populated by openSpecs() -->
        </div>
      </div>
    </div>

    <!-- REGISTER NEW PLATFORM MODAL -->
    <div id="registerPlatformModal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.78); backdrop-filter:blur(6px); z-index:9999; align-items:center; justify-content:center; padding:1.25rem;">
      <div style="background:#13131c; border:1px solid var(--border-subtle, #2e2e3e); border-radius:18px; width:100%; max-width:620px; max-height:90vh; overflow-y:auto; box-shadow:0 24px 60px rgba(0,0,0,0.6);">
        <div style="padding:1.5rem; border-bottom:1px solid rgba(255,255,255,0.08); display:flex; justify-content:space-between; align-items:center;">
          <div style="display:flex; align-items:center; gap:0.5rem;">
            <span style="font-size:1.4rem;">🏗️</span>
            <div>
              <h3 style="font-size:1.15rem; font-weight:800; color:#ffffff; margin:0;">Register New Platform or OS Engine</h3>
              <p style="font-size:0.75rem; color:var(--text-muted); margin:0.15rem 0 0 0;">Add a new codebase asset to the GRO10X architecture registry.</p>
            </div>
          </div>
          <button onclick="window.PlatformsModule.closeRegisterModal()" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:1.2rem; line-height:1;">✕</button>
        </div>

        <form id="registerPlatformForm" onsubmit="window.PlatformsModule.handleRegisterSubmit(event)" style="padding:1.5rem; display:flex; flex-direction:column; gap:1rem;">
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.85rem;">
            <div>
              <label style="font-size:0.75rem; color:var(--text-secondary); font-weight:700; display:block; margin-bottom:0.35rem;">Platform Name *</label>
              <input type="text" id="regName" required placeholder="e.g. HealthPoint OS" style="width:100%; background:#1a1a26; border:1px solid var(--border-subtle, #2e2e3e); border-radius:8px; padding:0.5rem 0.75rem; color:#ffffff; font-size:0.82rem; box-sizing:border-box;">
            </div>
            <div>
              <label style="font-size:0.75rem; color:var(--text-secondary); font-weight:700; display:block; margin-bottom:0.35rem;">Icon Emoji</label>
              <input type="text" id="regIcon" placeholder="e.g. 🩺" value="🚀" style="width:100%; background:#1a1a26; border:1px solid var(--border-subtle, #2e2e3e); border-radius:8px; padding:0.5rem 0.75rem; color:#ffffff; font-size:0.82rem; box-sizing:border-box;">
            </div>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.85rem;">
            <div>
              <label style="font-size:0.75rem; color:var(--text-secondary); font-weight:700; display:block; margin-bottom:0.35rem;">Engine Category *</label>
              <select id="regEngineId" style="width:100%; background:#1a1a26; border:1px solid var(--border-subtle, #2e2e3e); border-radius:8px; padding:0.5rem 0.75rem; color:#ffffff; font-size:0.82rem; box-sizing:border-box;">
                <option value="4">Engine 4: Retainer OS (SLA)</option>
                <option value="1">Engine 1: Micro-SaaS (ARR)</option>
                <option value="2">Engine 2: Tech Sprints</option>
                <option value="3">Engine 3: Growth Marketing</option>
                <option value="5">Engine 5: Ventures & GovTech</option>
              </select>
            </div>
            <div>
              <label style="font-size:0.75rem; color:var(--text-secondary); font-weight:700; display:block; margin-bottom:0.35rem;">Deployment Stage *</label>
              <select id="regStage" style="width:100%; background:#1a1a26; border:1px solid var(--border-subtle, #2e2e3e); border-radius:8px; padding:0.5rem 0.75rem; color:#ffffff; font-size:0.82rem; box-sizing:border-box;">
                <option value="live|Production Ready">Production Ready (Live)</option>
                <option value="proposal|Commercial Proposal Active">Commercial Proposal Active</option>
                <option value="pilot|Live Pilot">Live Pilot</option>
                <option value="near-launch|Near-Launch (QA)">Near-Launch (QA)</option>
                <option value="dev|In Development">In Development</option>
                <option value="stuck|Implementation Blocked">Implementation Blocked</option>
              </select>
            </div>
          </div>

          <div>
            <label style="font-size:0.75rem; color:var(--text-secondary); font-weight:700; display:block; margin-bottom:0.35rem;">Tagline / Positioning *</label>
            <input type="text" id="regTagline" required placeholder="e.g. AI-First Diagnostic Lab Management OS with WhatsApp CRM" style="width:100%; background:#1a1a26; border:1px solid var(--border-subtle, #2e2e3e); border-radius:8px; padding:0.5rem 0.75rem; color:#ffffff; font-size:0.82rem; box-sizing:border-box;">
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.85rem;">
            <div>
              <label style="font-size:0.75rem; color:var(--text-secondary); font-weight:700; display:block; margin-bottom:0.35rem;">Tech Stack *</label>
              <input type="text" id="regStack" required placeholder="e.g. React 19 · Supabase · Gemini Flash" style="width:100%; background:#1a1a26; border:1px solid var(--border-subtle, #2e2e3e); border-radius:8px; padding:0.5rem 0.75rem; color:#ffffff; font-size:0.82rem; box-sizing:border-box;">
            </div>
            <div>
              <label style="font-size:0.75rem; color:var(--text-secondary); font-weight:700; display:block; margin-bottom:0.35rem;">Architectural Readiness %</label>
              <input type="number" id="regReadiness" min="0" max="100" value="85" style="width:100%; background:#1a1a26; border:1px solid var(--border-subtle, #2e2e3e); border-radius:8px; padding:0.5rem 0.75rem; color:#ffffff; font-size:0.82rem; box-sizing:border-box;">
            </div>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.85rem;">
            <div>
              <label style="font-size:0.75rem; color:var(--text-secondary); font-weight:700; display:block; margin-bottom:0.35rem;">Target Market</label>
              <input type="text" id="regMarket" placeholder="e.g. BD Private Diagnostic Centers" style="width:100%; background:#1a1a26; border:1px solid var(--border-subtle, #2e2e3e); border-radius:8px; padding:0.5rem 0.75rem; color:#ffffff; font-size:0.82rem; box-sizing:border-box;">
            </div>
            <div>
              <label style="font-size:0.75rem; color:var(--text-secondary); font-weight:700; display:block; margin-bottom:0.35rem;">Revenue Model</label>
              <input type="text" id="regModel" placeholder="e.g. ৳35,000 / month Retainer" style="width:100%; background:#1a1a26; border:1px solid var(--border-subtle, #2e2e3e); border-radius:8px; padding:0.5rem 0.75rem; color:#ffffff; font-size:0.82rem; box-sizing:border-box;">
            </div>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.85rem;">
            <div>
              <label style="font-size:0.75rem; color:var(--text-secondary); font-weight:700; display:block; margin-bottom:0.35rem;">Live Preview URL</label>
              <input type="url" id="regUrl" placeholder="https://example.lovable.app" style="width:100%; background:#1a1a26; border:1px solid var(--border-subtle, #2e2e3e); border-radius:8px; padding:0.5rem 0.75rem; color:#ffffff; font-size:0.82rem; box-sizing:border-box;">
            </div>
            <div>
              <label style="font-size:0.75rem; color:var(--text-secondary); font-weight:700; display:block; margin-bottom:0.35rem;">Repo / Workspace</label>
              <input type="text" id="regRepo" placeholder="e.g. HealthPoint Repo" style="width:100%; background:#1a1a26; border:1px solid var(--border-subtle, #2e2e3e); border-radius:8px; padding:0.5rem 0.75rem; color:#ffffff; font-size:0.82rem; box-sizing:border-box;">
            </div>
          </div>

          <div>
            <label style="font-size:0.75rem; color:var(--text-secondary); font-weight:700; display:block; margin-bottom:0.35rem;">Immediate Next Action</label>
            <input type="text" id="regNextAction" placeholder="e.g. Pitch to 2 local diagnostic centers in Dhanmondi" style="width:100%; background:#1a1a26; border:1px solid var(--border-subtle, #2e2e3e); border-radius:8px; padding:0.5rem 0.75rem; color:#ffffff; font-size:0.82rem; box-sizing:border-box;">
          </div>

          <div style="display:flex; justify-content:flex-end; gap:0.75rem; margin-top:0.75rem; border-top:1px solid rgba(255,255,255,0.08); padding-top:1rem;">
            <button type="button" onclick="window.PlatformsModule.closeRegisterModal()" class="btn-secondary" style="font-size:0.82rem; padding:0.45rem 1rem;">Cancel</button>
            <button type="submit" class="btn-primary" style="background:#00df89; color:#09090b; font-weight:800; border:none; padding:0.45rem 1.25rem; border-radius:8px; font-size:0.82rem; cursor:pointer;">
              💾 Save to Registry
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  // Global PlatformsModule API
  window.PlatformsModule = {
    setFilter: function(filter) {
      activeFilter = filter;
      updateTabButtons();
      renderCardsGrid();
    },

    handleSearch: function(term) {
      searchTerm = term || '';
      const clearBtn = document.getElementById('platformClearSearchBtn');
      if (clearBtn) {
        clearBtn.style.display = searchTerm ? 'block' : 'none';
      }
      renderCardsGrid();
    },

    clearSearch: function() {
      const input = document.getElementById('platformSearchInput');
      if (input) input.value = '';
      this.handleSearch('');
    },

    resetFilters: function() {
      activeFilter = 'all';
      searchTerm = '';
      const input = document.getElementById('platformSearchInput');
      if (input) input.value = '';
      const clearBtn = document.getElementById('platformClearSearchBtn');
      if (clearBtn) clearBtn.style.display = 'none';
      updateTabButtons();
      renderCardsGrid();
    },

    openLivePreview: function(url, name) {
      if (!url || url.trim() === '' || url === '#') {
        this.showToast(`⚠️ No live preview URL configured for ${name}.`);
        return;
      }
      const cleanUrl = url.trim();
      if (cleanUrl.includes('localhost')) {
        this.showToast(`ℹ️ Launching local staging URL (${cleanUrl}). Ensure your dev server is active.`);
      }
      window.open(cleanUrl, '_blank', 'noopener,noreferrer');
    },

    showToast: function(msg, duration = 3000) {
      let toast = document.getElementById('platformsToast');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'platformsToast';
        toast.style.cssText = 'position:fixed; bottom:24px; right:24px; z-index:99999; background:#181824; color:#ffffff; border:1px solid #00df89; padding:0.75rem 1.25rem; border-radius:12px; font-size:0.82rem; font-weight:700; box-shadow:0 10px 30px rgba(0,0,0,0.5); display:flex; align-items:center; gap:0.6rem; transform:translateY(100px); opacity:0; transition:all 0.3s cubic-bezier(0.16, 1, 0.3, 1);';
        document.body.appendChild(toast);
      }
      toast.innerHTML = msg;
      toast.style.transform = 'translateY(0)';
      toast.style.opacity = '1';
      clearTimeout(toast._timeout);
      toast._timeout = setTimeout(() => {
        toast.style.transform = 'translateY(100px)';
        toast.style.opacity = '0';
      }, duration);
    },

    openSpecs: function(platformId) {
      const p = getAllPlatforms().find(item => item.id === platformId);
      if (!p) return;

      const modal = document.getElementById('platformSpecsModal');
      const body = document.getElementById('platformSpecsModalBody');
      if (!modal || !body) return;

      const badgeStyle = getBadgeColor(p.stageType);
      const modulesList = p.keyModules && p.keyModules.length > 0
        ? p.keyModules.map(m => `
            <li style="margin-bottom:0.35rem; color:var(--text-secondary); font-size:0.78rem; display:flex; align-items:center; gap:0.4rem;">
              <span style="color:#00df89;">✔</span> ${m}
            </li>
          `).join('')
        : '<li style="color:var(--text-muted); font-size:0.78rem;">Full modules catalog mapped in engineering monorepo.</li>';

      body.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1.25rem; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:1rem;">
          <div style="display:flex; align-items:center; gap:0.75rem;">
            <span style="font-size:2.2rem; line-height:1;">${p.icon || '🚀'}</span>
            <div>
              <div style="display:flex; align-items:center; gap:0.5rem;">
                <h2 style="font-size:1.35rem; font-weight:900; color:#ffffff; margin:0;">${p.name}</h2>
                <span style="font-size:0.68rem; font-weight:800; padding:0.15rem 0.5rem; border-radius:6px; background:${badgeStyle.bg}; color:${badgeStyle.text}; border:1px solid ${badgeStyle.border};">
                  ${p.stage}
                </span>
              </div>
              <span style="font-size:0.75rem; color:${p.engineId === 4 ? '#f59e0b' : p.engineId === 1 ? '#00df89' : '#06b6d4'}; font-weight:700;">
                ${p.badge} · Engine ${p.engineId}
              </span>
            </div>
          </div>
          <button onclick="window.PlatformsModule.closeSpecs()" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:1.4rem; line-height:1;">✕</button>
        </div>

        <p style="color:var(--text-secondary); font-size:0.85rem; margin:0 0 1.25rem 0; line-height:1.45;">
          ${p.tagline}
        </p>

        <!-- READINESS GAUGE -->
        <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle, #2e2e3e); border-radius:12px; padding:0.85rem 1rem; margin-bottom:1.25rem;">
          <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:0.35rem;">
            <span style="color:var(--text-muted); font-weight:700; text-transform:uppercase;">Architecture Completion Level</span>
            <span style="color:#ffffff; font-weight:900;">${p.readiness}% Production Ready</span>
          </div>
          <div style="background:rgba(255,255,255,0.08); height:8px; border-radius:4px; overflow:hidden;">
            <div style="width:${p.readiness}%; background:${p.readiness > 85 ? '#00df89' : p.readiness > 70 ? '#06b6d4' : '#f59e0b'}; height:100%;"></div>
          </div>
        </div>

        <!-- ARCHITECTURE GRID -->
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.85rem; margin-bottom:1.25rem;">
          <div style="background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:0.85rem;">
            <div style="font-size:0.68rem; color:var(--text-muted); font-weight:700; text-transform:uppercase; margin-bottom:0.25rem;">Frontend & Runtime</div>
            <div style="font-size:0.8rem; font-weight:700; color:#ffffff;">${p.stack}</div>
          </div>
          <div style="background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:0.85rem;">
            <div style="font-size:0.68rem; color:var(--text-muted); font-weight:700; text-transform:uppercase; margin-bottom:0.25rem;">Database & RLS</div>
            <div style="font-size:0.8rem; font-weight:700; color:#ffffff;">${p.dbSchema || 'Supabase PostgreSQL with RLS'}</div>
          </div>
          <div style="background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:0.85rem;">
            <div style="font-size:0.68rem; color:var(--text-muted); font-weight:700; text-transform:uppercase; margin-bottom:0.25rem;">AI Mesh & Swarm Models</div>
            <div style="font-size:0.8rem; font-weight:700; color:#ffffff;">${p.aiStack || 'Gemini LLM Multi-Agent Router'}</div>
          </div>
          <div style="background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:0.85rem;">
            <div style="font-size:0.68rem; color:var(--text-muted); font-weight:700; text-transform:uppercase; margin-bottom:0.25rem;">Payment & Transaction Rails</div>
            <div style="font-size:0.8rem; font-weight:700; color:#00df89;">${p.authPayments || 'bKash / Stripe Checkout'}</div>
          </div>
        </div>

        <!-- COMMERCIAL STRATEGY -->
        <div style="background:rgba(0,0,0,0.3); border:1px solid rgba(245,158,11,0.25); border-radius:10px; padding:0.85rem; margin-bottom:1.25rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">
            <span style="font-size:0.7rem; color:#f59e0b; font-weight:800; text-transform:uppercase;">Commercial Retainer Strategy</span>
            <span style="font-size:0.82rem; font-weight:800; color:#ffffff;">${p.revenueModel}</span>
          </div>
          <div style="font-size:0.75rem; color:var(--text-secondary); margin-bottom:0.35rem;">
            <strong style="color:var(--text-muted);">Target ICP:</strong> ${p.targetMarket}
          </div>
          <div style="font-size:0.75rem; color:#06b6d4;">
            <strong style="color:var(--text-muted);">Next Strategic Action:</strong> ${p.nextAction}
          </div>
        </div>

        <!-- KEY MODULES -->
        <div style="margin-bottom:1.5rem;">
          <div style="font-size:0.72rem; color:var(--text-muted); font-weight:700; text-transform:uppercase; margin-bottom:0.5rem;">Engineered Modules & Capabilities</div>
          <ul style="list-style:none; padding:0; margin:0; display:grid; grid-template-columns:1fr 1fr; gap:0.4rem;">
            ${modulesList}
          </ul>
        </div>

        <!-- MODAL ACTIONS -->
        <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid rgba(255,255,255,0.08); padding-top:1rem; flex-wrap:wrap; gap:0.6rem;">
          <button onclick="window.PlatformsModule.copySpecs('${p.id}')" class="btn-secondary" style="font-size:0.78rem; padding:0.45rem 0.85rem; display:flex; align-items:center; gap:0.35rem; cursor:pointer;">
            <span>📋</span> Copy Architecture Spec
          </button>
          <div style="display:flex; gap:0.5rem;">
            <a href="#proposals" onclick="window.PlatformsModule.closeSpecs()" class="btn-secondary" style="font-size:0.78rem; padding:0.45rem 0.85rem; text-decoration:none; display:flex; align-items:center; gap:0.35rem;">
              💼 View Proposals
            </a>
            <button onclick="window.PlatformsModule.openLivePreview('${p.liveUrl}', '${p.name.replace(/'/g, "\\'")}')" class="btn-primary" style="background:#00df89; color:#09090b; font-weight:800; border:none; padding:0.45rem 1rem; border-radius:8px; font-size:0.78rem; cursor:pointer;">
              🌐 Launch Live Preview
            </button>
          </div>
        </div>
      `;

      modal.style.display = 'flex';
    },

    closeSpecs: function() {
      const modal = document.getElementById('platformSpecsModal');
      if (modal) modal.style.display = 'none';
    },

    copySpecs: function(platformId) {
      const p = getAllPlatforms().find(item => item.id === platformId);
      if (!p) return;

      const md = `# GRO10X Architecture Spec Sheet: ${p.name}
- **Badge / Engine**: ${p.badge} (Engine ${p.engineId})
- **Stage**: ${p.stage} (${p.readiness}% Complete)
- **Tagline**: ${p.tagline}
- **Frontend & Runtime**: ${p.stack}
- **Database & RLS**: ${p.dbSchema || 'Supabase PostgreSQL with RLS'}
- **AI Mesh**: ${p.aiStack || 'Gemini LLM Multi-Agent Router'}
- **Payment Rails**: ${p.authPayments || 'bKash / Stripe Checkout'}
- **Target Market**: ${p.targetMarket}
- **Revenue Model**: ${p.revenueModel}
- **Live Preview**: ${p.liveUrl}
- **Repository**: ${p.repo}
- **Next Action**: ${p.nextAction}
- **Engineered Capabilities**:
${(p.keyModules || []).map(m => `  - ${m}`).join('\n')}
`;

      navigator.clipboard.writeText(md)
        .then(() => {
          this.showToast('📋 Architecture spec sheet copied to clipboard!');
        })
        .catch(() => {
          this.showToast('⚠️ Could not copy to clipboard.');
        });
    },

    openRegisterModal: function() {
      const modal = document.getElementById('registerPlatformModal');
      if (modal) modal.style.display = 'flex';
    },

    closeRegisterModal: function() {
      const modal = document.getElementById('registerPlatformModal');
      if (modal) modal.style.display = 'none';
      const form = document.getElementById('registerPlatformForm');
      if (form) form.reset();
    },

    handleRegisterSubmit: function(e) {
      e.preventDefault();
      const name = document.getElementById('regName').value.trim();
      const icon = document.getElementById('regIcon').value.trim() || '🚀';
      const engineId = parseInt(document.getElementById('regEngineId').value, 10);
      const stageRaw = document.getElementById('regStage').value;
      const [stageType, stageName] = stageRaw.split('|');
      const tagline = document.getElementById('regTagline').value.trim();
      const stack = document.getElementById('regStack').value.trim();
      const readiness = parseInt(document.getElementById('regReadiness').value, 10) || 85;
      const targetMarket = document.getElementById('regMarket').value.trim() || 'BD Commercial SME';
      const revenueModel = document.getElementById('regModel').value.trim() || '৳35,000 / month Retainer';
      const liveUrl = document.getElementById('regUrl').value.trim() || '#';
      const repo = document.getElementById('regRepo').value.trim() || `${name} Repo`;
      const nextAction = document.getElementById('regNextAction').value.trim() || 'Prepare pitch deck and outreach';

      const engineBadge = engineId === 4 ? 'Engine 4: Retainer OS'
        : engineId === 1 ? 'Engine 1: Micro-SaaS'
        : engineId === 2 ? 'Engine 2: Tech Sprints'
        : engineId === 3 ? 'Engine 3: Growth Marketing'
        : 'Engine 5: Ventures & GovTech';

      const newPlatform = {
        id: 'custom_' + Date.now(),
        name,
        badge: engineBadge,
        engineId,
        tagline,
        stage: stageName,
        stageType,
        readiness,
        stack,
        dbSchema: 'Supabase PostgreSQL RLS',
        aiStack: 'Gemini 2.5 Flash / Pro Automation',
        authPayments: 'bKash Merchant / Stripe',
        infrastructure: 'Lovable Cloud / Vercel Edge',
        targetMarket,
        revenueModel,
        liveUrl,
        repo,
        nextAction,
        icon,
        isOwned: engineId === 1 || engineId === 5,
        keyModules: [
          'Core Architecture Boilerplate',
          'Database Schema & RLS Setup',
          'Commercial Retainer SLA Terms'
        ]
      };

      saveCustomPlatform(newPlatform);
      this.closeRegisterModal();
      this.showToast(`✅ Registered "${name}" into Platform Portfolio!`);

      // Refresh Stats & Badges
      const headerBadge = document.getElementById('platformsHeaderBadge');
      if (headerBadge) {
        headerBadge.textContent = `${getAllPlatforms().length} Registered Platforms & OS Engines`;
      }
      updateStatsStrip();
      updateTabButtons();
      renderCardsGrid();
    }
  };

  // Initial Data Bind
  updateStatsStrip();
  updateTabButtons();
  renderCardsGrid();
}

window.APP_MODULES.platforms = renderPlatformsView;
