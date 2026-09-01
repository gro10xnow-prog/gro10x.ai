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
    badge: 'Engine 1: SaaS',
    engineId: 1,
    tagline: 'Global AI Career OS & Unified Learning Economy',
    stage: 'Near-Launch (QA)',
    stageType: 'near-launch',
    readiness: 94,
    stack: 'React 19 · Supabase (120+ Edge Functions) · Gemini Swarm · Stripe/bKash',
    targetMarket: 'Global & BD Professionals & Students',
    revenueModel: 'Credit Economy + Tiered Subscriptions ($9-$49/mo)',
    liveUrl: 'https://groupacademy.online',
    repo: 'Local / GitHub QA Branch',
    nextAction: 'Code-frozen for final end-to-end payment QA before soft launch',
    icon: '🎓',
    isOwned: true
  },
  {
    id: 'gro10xcapital',
    name: 'GRO10X Capital',
    badge: 'Engine 1: SaaS',
    engineId: 1,
    tagline: 'BD SME Micro-Private Equity & Revenue-Based Growth Financing',
    stage: 'Production Ready (v0.8.5)',
    stageType: 'live',
    readiness: 98,
    stack: 'Next.js 16 · React 19 · Supabase (26 Tables) · 3 Telegram Bots · MiniApp',
    targetMarket: 'BD Retail & F&B SMEs (ORO Roasters, Segreto Hub)',
    revenueModel: 'RBF Revenue Share + Syndication Platform Fees (৳ base)',
    liveUrl: 'https://capital.gro10x.ai',
    repo: 'Production Monorepo',
    nextAction: 'Ready for first live SME syndication deal pipeline',
    icon: '🏆',
    isOwned: true
  },
  {
    id: 'serviq',
    name: 'ServiQ',
    badge: 'Engine 1: SaaS',
    engineId: 1,
    tagline: 'AI-Powered Home Services Marketplace (4 Languages + RTL)',
    stage: '95% Production Ready',
    stageType: 'live',
    readiness: 96,
    stack: 'React 18 · TypeScript · Supabase · Lovable AI · Stripe Credit Wallet · PWA',
    targetMarket: 'Global & BD Urban Homeowners (Dhaka First)',
    revenueModel: 'Credit Wallet Pack Top-ups ($4.99 - $19.99) + Booking Commission',
    liveUrl: 'https://servique.lovable.app',
    repo: 'Lovable Cloud / GitHub',
    nextAction: '🔥 Launch Dhaka Home Services pilot when Engine 4 hits stable cash',
    icon: '🔧',
    isOwned: true
  },
  {
    id: 'telegrab',
    name: 'Telegrab',
    badge: 'Engine 1 / Infrastructure',
    engineId: 1,
    tagline: 'Multi-Channel Bot Platform-as-a-Service (BPaaS) & Knowledge Mesh',
    stage: '70% Built (Active Backbone)',
    stageType: 'near-launch',
    readiness: 75,
    stack: 'React 18 · Deno Edge · Supabase pgvector · Telegram Stars · WhatsApp Cloud API',
    targetMarket: 'B2B Clients, Marketers & Internal GRO10X OS Deployments',
    revenueModel: 'Telegram Stars (XTR) + Stripe SaaS Tiers + Bot Retainer Add-ons (৳5k-10k/mo)',
    liveUrl: 'https://telegrab.lovable.app',
    repo: 'Core Edge Backbone',
    nextAction: '⚡ Sell as bot automation add-on (৳5k-10k/mo) to all Engine 4 OS retainers',
    icon: '🤖',
    isOwned: true
  },
  {
    id: 'pathshala',
    name: 'Pathshala.ai',
    badge: 'Engine 1: SaaS',
    engineId: 1,
    tagline: 'AI-Powered K-12 Phygital EdTech & 64-District Logistics',
    stage: 'v0.5.0 Live Staging',
    stageType: 'near-launch',
    readiness: 82,
    stack: 'Vanilla JS / Vite · Supabase · 64-District Geo Engine · bKash/Nagad · QR Scanner',
    targetMarket: 'BD K-12 Students, Tutors & Phygital Book Distribution',
    revenueModel: 'Course Bundles + Physical Goods COD + MFS Checkout',
    liveUrl: 'https://pathshala.vercel.app',
    repo: 'Orjon Test / Production',
    nextAction: 'Parked — Implement v0.6 Bangla ASR/TTS after primary cash baseline',
    icon: '📚',
    isOwned: true
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
    targetMarket: 'BD Pet Parents + Global WildMutt Co. Etsy Crossover',
    revenueModel: 'Credit Packs + Custom Printed Pet Merch (WhatsApp COD)',
    liveUrl: 'https://iampawsome.lovable.app',
    repo: 'Lovable Cloud',
    nextAction: 'Activate alongside WildMutt Co. Etsy brand for AI merch crossover',
    icon: '🐾',
    isOwned: true
  },
  {
    id: 'orjon',
    name: 'Orjon.app (অর্জন)',
    badge: 'Engine 1: SaaS',
    engineId: 1,
    tagline: 'AI Career & Verification Marketplace for Technical Blue-Collar BD',
    stage: 'v0.5 MVP Demo',
    stageType: 'mvp',
    readiness: 65,
    stack: 'React 19 · TypeScript · Vite · Tailwind · Supabase Schema Ready',
    targetMarket: 'BD Electricians, Drivers, Techs & Employer Verification',
    revenueModel: 'Employer Hiring Fees + Verification Badges',
    liveUrl: 'https://orjon-app.vercel.app',
    repo: 'Orjon Test Repo',
    nextAction: 'Parked — Replace supabaseMock.ts with live DB tables when ready',
    icon: '🛠️',
    isOwned: true
  },
  {
    id: 'purpleos',
    name: 'PurpleOS (Agency OS)',
    badge: 'Engine 4: Retainer OS',
    engineId: 4,
    tagline: 'Enterprise Agency Operating System & Dual Telegram Bot Mesh',
    stage: 'Live Production (v0.8.9.9)',
    stageType: 'live',
    readiness: 100,
    stack: 'Node.js Express · Supabase (18 Tables RLS) · Vanilla ES Modules · Telegram Bots',
    targetMarket: 'Purplebot Digital Limited (Commercial Proposal Out)',
    revenueModel: '৳35,000 / month (৳10k amortized platform + ৳25k SLA & continuous sprints)',
    liveUrl: 'https://purpleos-iota.vercel.app',
    repo: 'Purple Bot Workspace',
    nextAction: '🔴 Close Purplebot Digital retainer contract (Proposal ref: GRO-PBD-FIN-2026)',
    icon: '🏢',
    isOwned: false
  },
  {
    id: 'laundrymama',
    name: 'LaundryMama',
    badge: 'Engine 4: Retainer OS',
    engineId: 4,
    tagline: 'Smart Laundry & Fleet Logistics SaaS with Telegram MiniApps',
    stage: 'Implementation Phase',
    stageType: 'stuck',
    readiness: 80,
    stack: 'React 19 · TypeScript · Supabase Realtime · Node Bot Server · TanStack Query v5',
    targetMarket: 'BD Commercial Laundry & Dry Cleaning Chain',
    revenueModel: '৳35,000 / month Retainer + Fleet Routing SLA',
    liveUrl: 'http://localhost:5173 / Staging',
    repo: 'Laundry Mama Workspace',
    nextAction: '🟠 Unblock implementation blocker to secure 2nd ৳35k/mo retainer contract',
    icon: '🧺',
    isOwned: false
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
    targetMarket: 'Dental Clinics, Poly-clinics & Specialist Doctors in Dhaka',
    revenueModel: '৳35,000 / month OS Retainer + Lead Generation Bot Add-on',
    liveUrl: 'https://shamsdental.lovable.app',
    repo: 'Clinic OS Blueprint',
    nextAction: '⚡ Pitch Clinic OS to 1–2 premium dental practices in Banani/Dhanmondi',
    icon: '🏥',
    isOwned: false
  },
  {
    id: 'bellavista',
    name: 'BellaVista (Hospitality OS)',
    badge: 'Engine 4: Retainer OS',
    engineId: 4,
    tagline: 'Resort & Multi-Property Management OS with Guest AI Concierge',
    stage: '71% Built',
    stageType: 'mvp',
    readiness: 71,
    stack: 'React 18 · TypeScript · Supabase · Stripe Keys per Property · Telegram Bot',
    targetMarket: 'Resorts, Boutique Hotels, Villa Networks (Cox’s Bazar / Sylhet)',
    revenueModel: '৳35,000 / month Retainer as single-tenant Hospitality OS',
    liveUrl: 'https://bellavista.lovable.app',
    repo: 'Hospitality OS Blueprint',
    nextAction: '⚡ Pitch as single-tenant Hospitality OS to resort owners (no multi-tenant overhead)',
    icon: '🏨',
    isOwned: false
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
    targetMarket: 'BD Bulk Grocery Suppliers, Supermarkets & D2C Wholesalers',
    revenueModel: '৳35,000 / month Retainer or White-label Commerce License',
    liveUrl: 'https://dhakawsclub.lovable.app',
    repo: 'Wholesale OS Blueprint',
    nextAction: 'Ready to pitch as turnkey Wholesale/Retail E-Commerce OS',
    icon: '🛒',
    isOwned: false
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
    targetMarket: 'IT Staffing, Recruitment Agencies & Mid-market Corporates',
    revenueModel: '৳35,000–৳60,000 / month White-Label HRIS Retainer',
    liveUrl: 'https://hrx.serviq.io',
    repo: 'Serviq Technologies Monorepo',
    nextAction: 'Pitch as single-tenant HRIS or white-label for staffing agencies',
    icon: '👔',
    isOwned: false
  },
  {
    id: 'shopway',
    name: 'ShopWay (Commerce OS)',
    badge: 'Engine 4: Retainer OS',
    engineId: 4,
    tagline: 'Omnichannel D2C Storefront & Multi-Agent AI Inbox (Web, WA, TG)',
    stage: 'Live Pilot (Rob’s)',
    stageType: 'live',
    readiness: 85,
    stack: 'React 18 · Supabase pgvector · Multi-Agent Router · Unipile WA · Telegram',
    targetMarket: 'BD D2C Brands, Cloud Kitchens & Specialty Retailers',
    revenueModel: '৳25,000–৳35,000 / month Commerce Retainer',
    liveUrl: 'https://shopway.lovable.app',
    repo: 'Commerce OS Blueprint',
    nextAction: 'Convert live pilot into long-term commercial retainer',
    icon: '🛍️',
    isOwned: false
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
    targetMarket: 'Regional Distributors, Town Entrepreneurs & D2C Networks',
    revenueModel: 'City Franchise Licensing + Tarangini Daily Credit Deductions',
    liveUrl: 'https://tarangini.lovable.app',
    repo: 'Tarangini Repo',
    nextAction: 'Offer turnkey Hyperlocal Tech Franchise to city-level entrepreneurs',
    icon: '🚚',
    isOwned: true
  },
  {
    id: 'smartbangladesh',
    name: 'SmartBangladesh.ai',
    badge: 'Portfolio / GovTech',
    engineId: 5,
    tagline: 'National AI Governance & 30-Agent Public Digital Transformation Portal',
    stage: 'Production Showcase (Frontend)',
    stageType: 'live',
    readiness: 80,
    stack: 'React 18 · TypeScript · Vite · Tailwind (National Theme) · shadcn/ui',
    targetMarket: 'Government Ministries, ICT Divisions & Institutional RFPs',
    revenueModel: 'GovTech Enterprise RFP / Institutional Grant Positioning',
    liveUrl: 'https://smart-bangla-guide.lovable.app',
    repo: 'GovTech Showcase',
    nextAction: 'Positioning asset for high-ticket Government/Institutional tenders',
    icon: '🇧🇩',
    isOwned: true
  }
];

function renderPlatformsView(container) {
  let activeFilter = 'all';

  function renderContent() {
    const filtered = PLATFORMS_REGISTRY_DATA.filter(p => {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'engine1') return p.engineId === 1;
      if (activeFilter === 'engine4') return p.engineId === 4;
      if (activeFilter === 'live') return p.stageType === 'live';
      if (activeFilter === 'owned') return p.isOwned;
      return true;
    });

    const totalCount = PLATFORMS_REGISTRY_DATA.length;
    const engine1Count = PLATFORMS_REGISTRY_DATA.filter(p => p.engineId === 1).length;
    const engine4Count = PLATFORMS_REGISTRY_DATA.filter(p => p.engineId === 4).length;
    const readyToPitchCount = PLATFORMS_REGISTRY_DATA.filter(p => p.engineId === 4 && p.stageType === 'live').length;

    container.innerHTML = `
      <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem; margin-bottom:1.5rem;">
        <div>
          <div style="display:flex; align-items:center; gap:0.6rem; margin-bottom:0.25rem;">
            <h1 style="font-size:1.6rem; font-weight:900; font-family:var(--font-heading); color:var(--text-primary); margin:0;">
              🏗️ Platform Portfolio & Architecture Registry
            </h1>
            <span style="font-size:0.7rem; font-weight:800; padding:0.2rem 0.55rem; border-radius:999px; background:rgba(0,223,137,0.15); color:#00df89; border:1px solid rgba(0,223,137,0.3);">
              ${totalCount} Registered Platforms & OS Engines
            </span>
          </div>
          <p style="color:var(--text-secondary); font-size:0.88rem; margin:0;">
            Comprehensive architecture and commercial readiness directory across all proprietary SaaS and client OS assets.
          </p>
        </div>
        <div style="display:flex; gap:0.5rem;">
          <a href="#engines" class="btn-secondary" style="text-decoration:none;">🚀 Growth Engines</a>
          <a href="#proposals" class="btn-primary" style="background:#00df89; color:#09090b; font-weight:800; border:none; text-decoration:none;">💼 Commercial Proposals</a>
        </div>
      </div>

      <!-- PORTFOLIO STATS STRIP -->
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(210px, 1fr)); gap:1rem; margin-bottom:1.5rem;">
        <div style="background:var(--surface-card, #181824); border:1px solid var(--border-subtle, #2e2e3e); border-radius:14px; padding:1.1rem;">
          <span style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Total Platforms Built</span>
          <div style="font-size:1.6rem; font-weight:900; color:#ffffff;">${totalCount} Codebases</div>
          <span style="font-size:0.72rem; color:#00df89;">100% Documented</span>
        </div>
        <div style="background:var(--surface-card, #181824); border:1px solid rgba(245,158,11,0.3); border-radius:14px; padding:1.1rem;">
          <span style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Engine 4 OS Templates</span>
          <div style="font-size:1.6rem; font-weight:900; color:#f59e0b;">${engine4Count} Vertical OS</div>
          <span style="font-size:0.72rem; color:#f59e0b;">৳35,000/mo Retainer Engine</span>
        </div>
        <div style="background:var(--surface-card, #181824); border:1px solid rgba(0,223,137,0.3); border-radius:14px; padding:1.1rem;">
          <span style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Engine 1 Proprietary SaaS</span>
          <div style="font-size:1.6rem; font-weight:900; color:#00df89;">${engine1Count} Platforms</div>
          <span style="font-size:0.72rem; color:#00df89;">GroUp Academy + ServiQ + Telegrab</span>
        </div>
        <div style="background:var(--surface-card, #181824); border:1px solid rgba(6,182,212,0.3); border-radius:14px; padding:1.1rem;">
          <span style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Pitch-Ready Deployments</span>
          <div style="font-size:1.6rem; font-weight:900; color:#06b6d4;">${readyToPitchCount} OS Blueprints</div>
          <span style="font-size:0.72rem; color:#06b6d4;">Deployable in &lt; 3-4 days</span>
        </div>
      </div>

      <!-- FILTER TABS BAR -->
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem; margin-bottom:1.25rem;">
        <div style="display:flex; gap:0.4rem; background:rgba(0,0,0,0.3); padding:0.25rem; border-radius:10px; border:1px solid var(--border-subtle, #2e2e3e);">
          <button class="filter-btn ${activeFilter === 'all' ? 'active' : ''}" onclick="window.PlatformsModule.setFilter('all')" style="background:${activeFilter === 'all' ? '#00df89' : 'transparent'}; color:${activeFilter === 'all' ? '#09090b' : 'var(--text-secondary)'}; font-weight:700; border:none; padding:0.35rem 0.75rem; border-radius:7px; cursor:pointer; font-size:0.78rem;">
            All (${totalCount})
          </button>
          <button class="filter-btn ${activeFilter === 'engine4' ? 'active' : ''}" onclick="window.PlatformsModule.setFilter('engine4')" style="background:${activeFilter === 'engine4' ? '#f59e0b' : 'transparent'}; color:${activeFilter === 'engine4' ? '#09090b' : 'var(--text-secondary)'}; font-weight:700; border:none; padding:0.35rem 0.75rem; border-radius:7px; cursor:pointer; font-size:0.78rem;">
            🤝 Engine 4 OS Templates (${engine4Count})
          </button>
          <button class="filter-btn ${activeFilter === 'engine1' ? 'active' : ''}" onclick="window.PlatformsModule.setFilter('engine1')" style="background:${activeFilter === 'engine1' ? '#00df89' : 'transparent'}; color:${activeFilter === 'engine1' ? '#09090b' : 'var(--text-secondary)'}; font-weight:700; border:none; padding:0.35rem 0.75rem; border-radius:7px; cursor:pointer; font-size:0.78rem;">
            💻 Engine 1 SaaS (${engine1Count})
          </button>
          <button class="filter-btn ${activeFilter === 'owned' ? 'active' : ''}" onclick="window.PlatformsModule.setFilter('owned')" style="background:${activeFilter === 'owned' ? '#a855f7' : 'transparent'}; color:${activeFilter === 'owned' ? '#ffffff' : 'var(--text-secondary)'}; font-weight:700; border:none; padding:0.35rem 0.75rem; border-radius:7px; cursor:pointer; font-size:0.78rem;">
            👑 GRO10X Owned
          </button>
        </div>

        <input type="text" id="platformSearchInput" placeholder="🔍 Search platform, stack, market..." oninput="window.PlatformsModule.handleSearch(this.value)" style="background:var(--surface-card, #181824); border:1px solid var(--border-subtle, #2e2e3e); border-radius:10px; padding:0.4rem 0.8rem; font-size:0.8rem; color:#ffffff; width:260px;">
      </div>

      <!-- PLATFORMS GRID -->
      <div id="platformsCardsGrid" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(340px, 1fr)); gap:1.25rem;">
        ${filtered.map(p => `
          <div class="platform-card" style="background:var(--surface-card, #181824); border:1px solid ${p.stageType === 'live' ? 'rgba(0,223,137,0.25)' : p.stageType === 'stuck' ? 'rgba(239,68,68,0.4)' : 'var(--border-subtle, #2e2e3e)'}; border-radius:16px; padding:1.25rem; display:flex; flex-direction:column; justify-content:space-between; box-shadow:0 8px 24px rgba(0,0,0,0.18);">
            <div>
              <!-- CARD HEADER -->
              <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.75rem;">
                <div style="display:flex; align-items:center; gap:0.6rem;">
                  <span style="font-size:1.6rem;">${p.icon}</span>
                  <div>
                    <h3 style="font-size:1.1rem; font-weight:900; color:#ffffff; margin:0;">${p.name}</h3>
                    <span style="font-size:0.7rem; font-weight:800; color:${p.engineId === 4 ? '#f59e0b' : p.engineId === 1 ? '#00df89' : '#06b6d4'};">
                      ${p.badge}
                    </span>
                  </div>
                </div>
                <span style="font-size:0.68rem; font-weight:800; padding:0.2rem 0.5rem; border-radius:8px; background:${p.stageType === 'live' ? 'rgba(0,223,137,0.15)' : p.stageType === 'stuck' ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.08)'}; color:${p.stageType === 'live' ? '#00df89' : p.stageType === 'stuck' ? '#ef4444' : 'var(--text-secondary)'}; border:1px solid ${p.stageType === 'live' ? 'rgba(0,223,137,0.3)' : 'rgba(255,255,255,0.1)'};">
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
                  <div style="width:${p.readiness}%; background:${p.readiness > 85 ? '#00df89' : p.readiness > 70 ? '#06b6d4' : '#f59e0b'}; height:100%;"></div>
                </div>
              </div>

              <!-- SPECS DETAIL -->
              <div style="background:rgba(0,0,0,0.25); padding:0.75rem; border-radius:10px; font-size:0.75rem; display:flex; flex-direction:column; gap:0.35rem; margin-bottom:0.85rem;">
                <div><span style="color:var(--text-muted);">Stack:</span> <span style="color:#ffffff; font-weight:600;">${p.stack}</span></div>
                <div><span style="color:var(--text-muted);">Market:</span> <span style="color:var(--text-secondary);">${p.targetMarket}</span></div>
                <div><span style="color:var(--text-muted);">Model:</span> <span style="color:#f59e0b; font-weight:700;">${p.revenueModel}</span></div>
              </div>

              <!-- NEXT ACTION -->
              <div style="font-size:0.72rem; color:#06b6d4; background:rgba(6,182,212,0.08); border:1px solid rgba(6,182,212,0.2); padding:0.45rem 0.6rem; border-radius:8px; margin-bottom:0.85rem;">
                <strong>Next:</strong> ${p.nextAction}
              </div>
            </div>

            <!-- FOOTER LINKS -->
            <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid rgba(255,255,255,0.06); padding-top:0.75rem;">
              <span style="font-size:0.7rem; color:var(--text-muted);">${p.repo}</span>
              <div style="display:flex; gap:0.4rem;">
                <button class="btn-ghost btn-sm" onclick="window.open('${p.liveUrl}', '_blank')" style="font-size:0.72rem; padding:0.25rem 0.5rem;">
                  🌐 Live Preview →
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  window.PlatformsModule = {
    setFilter: function(filter) {
      activeFilter = filter;
      renderContent();
    },
    handleSearch: function(term) {
      const q = (term || '').toLowerCase();
      const cards = document.querySelectorAll('.platform-card');
      cards.forEach((c, idx) => {
        const p = PLATFORMS_REGISTRY_DATA[idx];
        if (!p) return;
        const matches = p.name.toLowerCase().includes(q) ||
                        p.tagline.toLowerCase().includes(q) ||
                        p.stack.toLowerCase().includes(q) ||
                        p.targetMarket.toLowerCase().includes(q);
        c.style.display = matches ? 'flex' : 'none';
      });
    }
  };

  renderContent();
}

window.APP_MODULES.platforms = renderPlatformsView;
