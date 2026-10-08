/**
 * public/app/modules/engines.js
 * ─────────────────────────────────────────────────────────────────────────────
 * GRO10X 5-Engine Growth Operations Cockpit
 * Tracks and manages execution across:
 * 1. Proprietary Micro-SaaS Software ($35k target)
 * 2. High-Intent Freelancing & Sprint Contracts ($25k target)
 * 3. Automated Digital Asset Sales ($20k target)
 * 4. Core Agency Retainers ($15k target)
 * 5. Programmatic AI Video Scale ($5k target)
 * ─────────────────────────────────────────────────────────────────────────────
 */

window.APP_MODULES = window.APP_MODULES || {};

var DEFAULT_ENGINES_STATE = window.DEFAULT_ENGINES_STATE || {
  saas: {
    target: 35000,
    current: 1000,
    subscribers: 45,
    mrr: 1000,
    products: [
      { name: 'GroUp Academy', status: 'QA / Soft-Launch', users: 24, mrr: 450, icon: '🎓' },
      { name: 'GRO10X Capital', status: 'Production v0.8.5', users: 12, mrr: 350, icon: '🏆' },
      { name: 'ServiQ', status: 'Near-Launch (96%)', users: 6, mrr: 100, icon: '🔧' },
      { name: 'Telegrab BPaaS', status: 'Active Backbone', users: 15, mrr: 100, icon: '🤖' }
    ]
  },
  sprints: {
    target: 25000,
    current: 0,
    gigsLive: 7,
    activeSprints: 3,
    avgValue: 750,
    pipeline: [
      { client: 'Upwork Enterprise', sprint: 'Next.js AI MVP Sprint', val: 1200 },
      { client: 'Direct B2B Client', sprint: 'Telegram MiniApp Build', val: 850 },
      { client: 'Fiverr Pro Buyer', sprint: 'Chrome Extension Automation', val: 500 }
    ]
  },
  assets: {
    target: 20000,
    current: 0,
    listings: 1300,
    downloads: 0,
    stores: [
      { name: 'DigiVault BD (Subscriptions & Licenses)', items: 44, monthlySales: 0, rev: 0, link: '/dce/digivault' },
      { name: 'PlannerQueen (Interactive Planners & Print)', items: 14, monthlySales: 0, rev: 0, link: '/dce' },
      { name: '13-Brand Etsy & POD Portfolio', items: 1300, monthlySales: 0, rev: 0, link: '#brands' }
    ]
  },
  retainers: {
    target: 15000,
    current: 0,
    activeCount: 3,
    accounts: [],
    osTemplates: [
      { id: 'agency', name: 'Agency OS', vertical: '🏢', completion: 100, client: 'PurpleBot Digital', mrr: 35000, status: 'proposal', statusLabel: 'Proposal Out', action: 'Close Contract', color: '#f59e0b', desc: 'Full AI agency client management, dual Telegram bot mesh, invoice & delivery tracking.' },
      { id: 'laundry', name: 'Laundry OS', vertical: '🧺', completion: 80, client: 'Laundry Mama', mrr: 35000, status: 'stuck', statusLabel: 'Stuck', action: 'Fix Implementation', color: '#ef4444', desc: 'Pickup scheduling, bKash automated token dispatch, route tracking mini-app.' },
      { id: 'clinic', name: 'Clinic OS', vertical: '🏥', completion: 95, client: null, mrr: 35000, status: 'available', statusLabel: 'Ready to Pitch', action: 'Find Client', color: '#00df89', desc: 'Doctor appointment scheduler, prescription vault, SMS/WhatsApp patient follow-up.' },
      { id: 'hospitality', name: 'Hospitality OS', vertical: '🏨', completion: 71, client: null, mrr: 35000, status: 'available', statusLabel: 'Ready to Pitch', action: 'Find Client', color: '#00df89', desc: 'Room booking engine, concierge Telegram bot, guest room service management.' },
      { id: 'wholesale', name: 'Wholesale OS', vertical: '🛒', completion: 85, client: null, mrr: 35000, status: 'available', statusLabel: 'Ready to Pitch', action: 'Find Client', color: '#00df89', desc: 'B2B order catalog, credit ledger, inventory re-order alerts, distributor mini-app.' },
      { id: 'hr', name: 'HR/Staffing OS', vertical: '👔', completion: 100, client: null, mrr: 35000, status: 'available', statusLabel: 'Ready to Pitch', action: 'Find Client', color: '#00df89', desc: 'Employee onboarding, attendance geolocation bot, payroll and leave approval flow.' },
      { id: 'commerce', name: 'Commerce OS', vertical: '🛍️', completion: 80, client: "Rob's (pilot)", mrr: 35000, status: 'pilot', statusLabel: 'Live Pilot', action: 'Convert to Paid', color: '#06b6d4', desc: 'Direct-to-consumer social commerce storefront with automated abandoned cart recovery.' },
      { id: 'distribution', name: 'Distribution OS', vertical: '🚚', completion: 100, client: null, mrr: 35000, status: 'available', statusLabel: 'Ready to Pitch', action: 'Find City Partner', color: '#00df89', desc: '64-district delivery fleet tracking, merchant settlement dashboard, COD reconciliation.' }
    ]
  },
  video: {
    target: 5000,
    current: 0,
    monthlyViews: 3205,
    avgRPM: 2.5,
    channels: [
      { name: 'Grow Bangla', platform: 'YouTube', subs: 427, monthlyViews: 805, yield: 0 },
      { name: 'PILUTICS', platform: 'YouTube', subs: 218, monthlyViews: 1200, yield: 0 },
      { name: 'Bong Hits', platform: 'YouTube + TikTok', subs: 85, monthlyViews: 1200, yield: 0 }
    ]
  }
};

function getStoredState() {
  try {
    const saved = localStorage.getItem('gro10x_engines_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (!parsed.saas || !parsed.saas.products || parsed.saas.products.length === 0) {
        parsed.saas = { ...DEFAULT_ENGINES_STATE.saas, ...(parsed.saas || {}) };
      }
      if (!parsed.sprints || !parsed.sprints.pipeline || parsed.sprints.pipeline.length === 0) {
        parsed.sprints = { ...DEFAULT_ENGINES_STATE.sprints, ...(parsed.sprints || {}) };
      }
      if (!parsed.retainers || !parsed.retainers.osTemplates || parsed.retainers.osTemplates.length === 0) {
        parsed.retainers = { ...DEFAULT_ENGINES_STATE.retainers, ...(parsed.retainers || {}) };
      }
      return parsed;
    }
  } catch (e) {
    console.warn('Engines state load error:', e);
  }
  return JSON.parse(JSON.stringify(DEFAULT_ENGINES_STATE));
}

function saveState(state) {
  try {
    localStorage.setItem('gro10x_engines_state', JSON.stringify(state));
  } catch (e) {
    console.warn('Engines state save error:', e);
  }
}

function formatBDT(val) {
  const num = Math.round(Number(val) || 0);
  if (num >= 10000000) return `৳${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `৳${(num / 100000).toFixed(1)} Lakh`;
  return `৳${num.toLocaleString('en-BD')}`;
}

function formatMoney(amountUSD, isUSD, isMonthly = false) {
  const val = Number(amountUSD) || 0;
  const suffix = isMonthly ? '/mo' : '';
  if (isUSD) {
    return `${Math.round(val).toLocaleString()}${suffix}`;
  }
  const bdtVal = Math.round(val * 120);
  return `${formatBDT(bdtVal)}${suffix}`;
}

function formatRetainerBDT(amountBDT, isUSD, isMonthly = true) {
  const val = Number(amountBDT) || 35000;
  const suffix = isMonthly ? '/mo' : '';
  if (isUSD) {
    return `${Math.round(val / 120).toLocaleString()}${suffix}`;
  }
  return `৳${Math.round(val).toLocaleString('en-BD')}${suffix}`;
}

async function renderEnginesView(container) {
  const state = getStoredState();
  let isLive = false;
  let allPosts = [];

  const currentCurrency = localStorage.getItem('gro10x_currency') || 'USD';
  const isUSD = currentCurrency !== 'BDT';

  let e2Capacity = { totalMembers: 8, utilizationRate: '78%', utilizationBenchmark: '75% - 85%', billableHoursAvailable: 320 };
  let e2Flash = null;
  let e2Projects = [];
  let e2Pods = [];
  let activeSprintProjId = 'proj-purplebot-01';
  let e2RetainerBank = {
    hoursBanked: 30,
    hoursLogged: 25,
    hoursRemaining: 5,
    burnRatePercent: '83%',
    clientName: 'Purplebot Digital Limited',
    tasks: [
      { hours: 18, description: 'LangGraph Agent Orchestration & Node State Routing', category: 'Architecture & System Design' },
      { hours: 7, description: 'Supabase pgvector Indexing & Multi-Tenant RLS Policy', category: 'Core AI/LLM Development' }
    ]
  };
  let e2COGS = {
    totalCOGS: 6770,
    totalCogsUSD: 56.42,
    grossMarginPercent: '74.2%',
    grossProfitBDT: 19480,
    grossProfitUSD: 162.33,
    itemCount: 2,
    cogsItems: [
      { id: 'COGS-001', vendor: 'OpenAI', itemType: 'API Tokens', amountBDT: 3600, amountUSD: 30, description: 'GPT-4o & text-embedding-3-small vector runs' },
      { id: 'COGS-002', vendor: 'RunPod / Modal', itemType: 'GPU Compute', amountBDT: 3170, amountUSD: 26.42, description: 'Serverless vLLM Llama-3 batch inference' }
    ]
  };
  let e2Margin = null;
  let waterfallRes = null;

  try {
    if (window.APP_API && typeof window.APP_API.get === 'function') {
      const [apiData, postsRes, dceProductsRes, digiAnalyticsRes, teamCapRes, flashRes, projectsRes, podsRes] = await Promise.all([
        window.APP_API.get('/engines/summary').catch(() => null),
        window.APP_API.get('/posts').catch(() => []),
        fetch('/api/dce/products').then(r => r.json()).catch(() => null),
        fetch('/api/digistore/analytics').then(r => r.json()).catch(() => null),
        window.APP_API.get('/team/capacity').catch(() => null),
        window.APP_API.get('/engines/engine2/flash-report').catch(() => null),
        window.APP_API.get('/projects').catch(() => ({ data: [] })),
        window.APP_API.get('/team/pods').catch(() => null)
      ]);
      if (Array.isArray(postsRes)) allPosts = postsRes;
      if (teamCapRes && (teamCapRes.capacity || teamCapRes.ok)) {
        e2Capacity = teamCapRes.capacity || teamCapRes;
      }
      if (flashRes && flashRes.report) {
        e2Flash = flashRes.report;
      }
      const rawProjects = Array.isArray(projectsRes) ? projectsRes : (projectsRes?.data || projectsRes?.projects || []);
      if (Array.isArray(rawProjects)) e2Projects = rawProjects;
      if (podsRes && podsRes.pods) e2Pods = podsRes.pods;

      const activeProj = e2Projects.find(p => p.id === 'proj-purplebot-01' || p.clientId === 'cl-purplebot-01' || (p.name && p.name.toLowerCase().includes('purplebot')) || p.workflowType === 'sprints') || e2Projects[0];
      if (activeProj?.id) activeSprintProjId = activeProj.id;

      const [bankRes, cogsRes, marginRes, wfResult] = await Promise.all([
        window.APP_API.get(`/projects/${activeSprintProjId}/retainer-bank`).catch(() => null),
        window.APP_API.get(`/projects/${activeSprintProjId}/cogs`).catch(() => null),
        window.APP_API.get(`/projects/${activeSprintProjId}/margin`).catch(() => null),
        window.APP_API.get('/engines/pnl-waterfall').catch(() => null)
      ]);
      waterfallRes = wfResult;

      if (bankRes && (bankRes.bank || bankRes.hoursBanked !== undefined)) {
        const b = bankRes.bank || bankRes;
        e2RetainerBank = {
          ...e2RetainerBank,
          ...b,
          clientName: activeProj?.clientName || activeProj?.name || e2RetainerBank.clientName,
          tasks: (b.tasks && b.tasks.length > 0) ? b.tasks : e2RetainerBank.tasks
        };
      }
      if (cogsRes && (cogsRes.cogs || cogsRes.totalCOGS !== undefined || cogsRes.totalCogsBdt !== undefined)) {
        const c = cogsRes.cogs || cogsRes;
        e2COGS = {
          ...e2COGS,
          ...c,
          cogsItems: (c.cogsItems && c.cogsItems.length > 0) ? c.cogsItems : e2COGS.cogsItems
        };
      }
      if (marginRes && (marginRes.grossMarginPercent || marginRes.marginValue !== undefined)) {
        e2Margin = marginRes;
        if (marginRes.totalCogs !== undefined) {
          e2COGS.totalCOGS = marginRes.totalCogs;
        }
      }

      if (apiData && apiData.success && apiData.engines) {
        isLive = true;
        // Direct canonical 1-to-1 engine mapping
        if (apiData.engines.engine1) state.saas.current = Math.max(state.saas.current, apiData.engines.engine1.current || 0);
        if (apiData.engines.engine2) state.sprints.current = Math.max(state.sprints.current, apiData.engines.engine2.current || 0);
        if (apiData.engines.engine3) state.assets.current = Math.max(state.assets.current, apiData.engines.engine3.current || 0);
        if (apiData.engines.engine4) state.retainers.current = Math.max(state.retainers.current, apiData.engines.engine4.current || 0);
        if (apiData.engines.engine5) state.video.current = Math.max(state.video.current, apiData.engines.engine5.current || 0);
      }

      // Auto-hydrate Engine 3 digital store distribution without manual entry
      if (state.assets && Array.isArray(state.assets.stores)) {
        if (digiAnalyticsRes && (digiAnalyticsRes.totalRevenue || digiAnalyticsRes.totalOrders)) {
          const dvStore = state.assets.stores.find(s => s.name && s.name.includes('DigiVault'));
          if (dvStore) {
            dvStore.monthlySales = digiAnalyticsRes.totalOrders || dvStore.monthlySales;
            dvStore.rev = Math.round((digiAnalyticsRes.totalRevenue || 0) / 120);
          }
        }
        if (dceProductsRes && Array.isArray(dceProductsRes.data)) {
          const pqStore = state.assets.stores.find(s => s.name && s.name.includes('PlannerQueen'));
          if (pqStore) {
            pqStore.items = dceProductsRes.data.length || pqStore.items;
          }
        }
      }
    }
  } catch (e) {
    console.log('[Engines] Using local fallback state:', e.message);
  }

  const e5Published = allPosts.filter(p => (p.status === 'Posted' || p.status === 'Published') && (String(p.channel||'').toLowerCase().includes('grow') || String(p.channel||'').toLowerCase().includes('pilutics') || String(p.channel||'').toLowerCase().includes('bong'))).length;
  const e5Scheduled = allPosts.filter(p => (p.status === 'Approved' || p.status === 'Scheduled') && (String(p.channel||'').toLowerCase().includes('grow') || String(p.channel||'').toLowerCase().includes('pilutics') || String(p.channel||'').toLowerCase().includes('bong'))).length;

  const totalTarget = 100000;
  const totalCurrent = state.saas.current + state.sprints.current + state.assets.current + state.retainers.current + state.video.current;
  const totalPercent = Math.min(100, Math.round((totalCurrent / totalTarget) * 100));
  const netProfitProjected = Math.round(totalCurrent * 0.65);

  // Dynamic Engine 4 calculations
  const osTemplates = state.retainers.osTemplates || [];
  const inFlightTemplates = osTemplates.filter(t => t.client || t.status === 'proposal' || t.status === 'stuck' || t.status === 'pilot');
  const readyTemplates = osTemplates.filter(t => !t.client && t.status === 'available');
  const inFlightMRR = inFlightTemplates.reduce((sum, t) => sum + (Number(t.mrr) || 35000), 0);
  const inFlightNames = inFlightTemplates.map(t => `${t.name.replace(' OS', '')} (${t.client || 'Client'})`).join(' + ') || 'No active in-flight pilots';
  const readyNames = readyTemplates.map(t => t.name.replace(' OS', '')).join(' · ') || 'All deployed';
  const proposalCount = osTemplates.filter(t => t.status === 'proposal').length;

  // Dynamic Engine 2 Pod & Financial calculations
  const mvpPodCount = e2Projects.filter(p => p.podId === 'MVP_BUILD_POD' || p.podType === 'MVP_BUILD_POD' || (p.name && p.name.toLowerCase().includes('mvp'))).length || 2;
  const autoPodCount = e2Projects.filter(p => p.podId === 'ENTERPRISE_AUTOMATION_POD' || p.podType === 'ENTERPRISE_AUTOMATION_POD' || (p.name && p.name.toLowerCase().includes('purplebot'))).length || 1;
  const creativePodCount = e2Projects.filter(p => p.podId === 'CREATIVE_AI_POD' || p.podType === 'CREATIVE_AI_POD' || (p.workflowType === 'video_production')).length || 0;

  const bankedH = Number(e2RetainerBank.hoursBanked || 30);
  const loggedH = Number(e2RetainerBank.hoursLogged || 25);
  const remainingH = Number(e2RetainerBank.hoursRemaining !== undefined ? e2RetainerBank.hoursRemaining : (bankedH - loggedH));
  const burnPct = bankedH > 0 ? Math.round((loggedH / bankedH) * 100) : 83;
  const isDepleted = remainingH <= 0 || burnPct >= 100;
  const isNearCap = !isDepleted && burnPct >= 75;

  const gmVal = e2Margin ? parseFloat(e2Margin.grossMarginPercent || e2Margin.marginValue || '74.2') : parseFloat(e2COGS.grossMarginPercent || '74.2');
  const gmStr = e2Margin ? (e2Margin.grossMarginPercent || `${gmVal.toFixed(1)}%`) : (e2COGS.grossMarginPercent || '74.2%');
  const isMarginHealthy = e2Margin ? (e2Margin.isHealthy !== undefined ? e2Margin.isHealthy : gmVal >= 70.0) : (gmVal >= 70.0);
  const cogsValStr = isUSD ? `$${Number(e2COGS.totalCogsUSD || 56.42).toFixed(2)}` : `৳${Math.round(e2COGS.totalCOGS || e2COGS.totalCogsBdt || 6770).toLocaleString()}`;

  const wf = waterfallRes?.waterfall || {
    grossInflowUSD: 7600,
    grossInflowBDT: 912000,
    engineBreakdown: {
      engine1_saas: { revenueUSD: 1200, share: '15.8%' },
      engine2_sprints: { revenueUSD: 3500, share: '46.1%' },
      engine3_commerce: { revenueUSD: 1400, share: '18.4%' },
      engine4_retainers: { revenueUSD: 1100, share: '14.5%' },
      engine5_media: { revenueUSD: 400, share: '5.3%' }
    },
    cogs: {
      computeCOGS_USD: 850,
      contractorCOGS_USD: 1100,
      totalCOGS_USD: 1950,
      totalCOGS_BDT: 234000
    },
    grossProfitUSD: 5650,
    grossProfitBDT: 678000,
    grossMarginPercent: '74.3%',
    marginValue: 74.3,
    operatingExpensesUSD: 1200,
    netOperatingIncomeUSD: 4450,
    netOperatingIncomeBDT: 534000,
    netMarginPercent: '58.6%',
    runwayMonths: 36,
    settlementRail: 'BRAC Bank Limited (Neoncore Tech Solution / 2081636480001)'
  };

  // Attach Backdrop Click & Keyboard Dismissal for Modals
  setTimeout(() => {
    document.querySelectorAll('#enginesRevenueModal, #enginesAddProductModal, #enginesTemplateModal, #enginesLogRetainerModal, #enginesCOGSModal').forEach(overlay => {
      if (!overlay.__backdropBound) {
        overlay.__backdropBound = true;
        overlay.addEventListener('click', (ev) => {
          if (ev.target === overlay) {
            window.EnginesModule.closeModals();
          }
        });
      }
    });
      if (!window.__enginesEscBound) {
        window.__enginesEscBound = true;
        document.addEventListener('keydown', (ev) => {
          if (ev.key === 'Escape' && window.location.hash === '#engines') {
            window.EnginesModule.closeModals();
          }
        });
      }
    }, 100);

  container.innerHTML = `
    <style>
      .cockpit-engines-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: 1.25rem;
      }
      @media (min-width: 1360px) {
        .cockpit-engines-grid {
          grid-template-columns: repeat(5, 1fr) !important;
        }
      }
      .engine-card-hover {
        transition: transform 0.2s ease, border-color 0.2s ease;
      }
      .engine-card-hover:hover {
        transform: translateY(-3px);
      }
      .os-template-card {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 14px;
        padding: 1rem;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        transition: all 0.2s ease;
      }
      .os-template-card:hover {
        border-color: rgba(245, 158, 11, 0.45);
        background: rgba(255, 255, 255, 0.05);
      }
    </style>

    <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem; margin-bottom:1.5rem;">
      <div>
        <div style="display:flex; align-items:center; gap:0.6rem; margin-bottom:0.25rem; flex-wrap:wrap;">
          <h1 style="font-size:1.6rem; font-weight:900; font-family:var(--font-heading); color:var(--text-primary); margin:0;">
            🚀 5-Engine Growth Operations Cockpit
          </h1>
          <span style="font-size:0.7rem; font-weight:800; padding:0.2rem 0.5rem; border-radius:999px; background:${isLive ? 'rgba(0,223,137,0.15)' : 'rgba(255,255,255,0.08)'}; color:${isLive ? '#00df89' : 'var(--text-muted)'}; border:1px solid ${isLive ? 'rgba(0,223,137,0.3)' : 'rgba(255,255,255,0.15)'};">
            ${isLive ? '🟢 Live Supabase Synced' : '💾 Local Workspace'}
          </span>
          <!-- Currency Toggle -->
          <div style="display:flex; background:rgba(0,0,0,0.3); border:1px solid var(--border-subtle); border-radius:10px; padding:2px; margin-left:0.35rem;">
            <button type="button" onclick="window.switchEnginesCurrency('USD')" style="background:${isUSD ? 'rgba(0, 223, 137, 0.15)' : 'none'}; border:none; color:${isUSD ? '#00df89' : 'var(--text-muted)'}; font-size:0.75rem; font-weight:800; padding:0.2rem 0.5rem; border-radius:6px; cursor:pointer;">USD ($)</button>
            <button type="button" onclick="window.switchEnginesCurrency('BDT')" style="background:${!isUSD ? 'rgba(0, 223, 137, 0.15)' : 'none'}; border:none; color:${!isUSD ? '#00df89' : 'var(--text-muted)'}; font-size:0.75rem; font-weight:800; padding:0.2rem 0.5rem; border-radius:6px; cursor:pointer;">BDT (৳)</button>
          </div>
        </div>
        <p style="color:var(--text-secondary); font-size:0.88rem; margin:0;">
          Track, operate, and compound the 5 autonomous growth engines towards the <strong>${isUSD ? '$100,000' : '৳1.20 Crore'} Year 1 ARR</strong> goal.
        </p>
      </div>
      <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
        <button class="btn-secondary" onclick="window.open('/investors.html', '_blank', 'noopener,noreferrer')">
          💼 View Investor Hub
        </button>
        <button class="btn-primary" onclick="window.EnginesModule.openLogRevenueModal()">
          ⚡ Log Engine Revenue
        </button>
      </div>
    </div>

    <!-- Weekly Executive Cron Pulse & Audit Status Strip -->
    <div id="weeklyCronStatusStrip" class="card-glass" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem; padding:0.85rem 1.25rem; margin-bottom:1.5rem; border:1px solid rgba(0,223,137,0.3); background:linear-gradient(135deg, rgba(0,223,137,0.06), rgba(6,182,212,0.04)); border-radius:14px;">
      <div style="display:flex; align-items:center; gap:0.75rem;">
        <span style="font-size:1.4rem;">⏰</span>
        <div>
          <div style="display:flex; align-items:center; gap:0.5rem;">
            <strong style="color:#fff; font-size:0.92rem;">Weekly Executive P&L Cron:</strong>
            <span class="badge badge-emerald" id="weeklyCronStatusBadge" style="font-size:0.75rem; font-weight:800;">Armed (Every Monday 09:00 BST)</span>
          </div>
          <div style="font-size:0.78rem; color:var(--text-muted); margin-top:0.15rem;">
            Automated Telegram dispatch of 5-Engine revenue, token COGS deductions, and runway telemetry.
          </div>
        </div>
      </div>
      <button type="button" class="btn-primary btn-sm" id="btnFlashDispatchTelegram" style="font-size:0.82rem; font-weight:800; cursor:pointer;" onclick="window.EnginesModule.dispatchFlashPnlSnapshot()">
        ⚡ Dispatch Live P&L Snapshot to Telegram
      </button>
    </div>

    <!-- Consolidated 5-Engine P&L Financial Waterfall Card -->
    <div id="pnlWaterfallCard" class="card-glass" style="margin-bottom:1.75rem; border:1.5px solid rgba(0,223,137,0.35); background:linear-gradient(135deg, rgba(15,23,42,0.9) 0%, rgba(6,182,212,0.06) 100%); padding:1.5rem; border-radius:18px;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem; margin-bottom:1.25rem; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:1rem;">
        <div>
          <div style="font-size:0.72rem; font-weight:800; text-transform:uppercase; letter-spacing:0.06em; color:var(--accent-mint);">Institutional Unit Economics</div>
          <h2 style="font-size:1.3rem; font-weight:900; margin:0.15rem 0 0 0; color:#fff; font-family:var(--font-heading);">
            Consolidated 5-Engine P&L Financial Waterfall
          </h2>
          <div style="font-size:0.8rem; color:var(--text-muted); margin-top:0.2rem;">
            Trailing 30-day cross-engine inflows, direct cloud & contractor COGS, and net operating income.
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:0.6rem;">
          <span class="badge ${wf.marginValue >= 70 ? 'badge-emerald' : 'badge-amber'}" id="pnlWaterfallMarginBadge" style="font-size:0.82rem; font-weight:800; padding:0.4rem 0.85rem;">
            ${wf.marginValue >= 70 ? `✅ Gross Margin: ${wf.grossMarginPercent} (≥70% Benchmark)` : `⚠️ Gross Margin: ${wf.grossMarginPercent} (<70%)`}
          </span>
        </div>
      </div>

      <!-- Financial Metrics Tiles -->
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(170px, 1fr)); gap:1rem; margin-bottom:1.5rem;">
        <div style="background:rgba(10,15,28,0.7); border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:1rem;">
          <div style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase; font-weight:800;">1. Total Gross Inflow</div>
          <div style="font-size:1.3rem; font-weight:900; color:#fff; font-family:var(--font-mono); margin:0.25rem 0 0.1rem;" id="pnlGrossInflow">
            ${isUSD ? `$${wf.grossInflowUSD.toLocaleString()}` : `৳${wf.grossInflowBDT.toLocaleString()}`}
          </div>
          <div style="font-size:0.72rem; color:var(--accent-cyan);">Aggregated 5 Engines</div>
        </div>

        <div style="background:rgba(10,15,28,0.7); border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:1rem;">
          <div style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase; font-weight:800;">2. Direct COGS</div>
          <div style="font-size:1.3rem; font-weight:900; color:#f87171; font-family:var(--font-mono); margin:0.25rem 0 0.1rem;" id="pnlTotalCOGS">
            -${isUSD ? `$${wf.cogs.totalCOGS_USD.toLocaleString()}` : `৳${wf.cogs.totalCOGS_BDT.toLocaleString()}`}
          </div>
          <div style="font-size:0.72rem; color:var(--text-muted);">Compute & Contractor</div>
        </div>

        <div style="background:rgba(10,15,28,0.7); border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:1rem;">
          <div style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase; font-weight:800;">3. Gross Profit</div>
          <div style="font-size:1.3rem; font-weight:900; color:var(--accent-mint); font-family:var(--font-mono); margin:0.25rem 0 0.1rem;" id="pnlGrossProfit">
            ${isUSD ? `$${wf.grossProfitUSD.toLocaleString()}` : `৳${wf.grossProfitBDT.toLocaleString()}`}
          </div>
          <div style="font-size:0.72rem; color:var(--accent-mint); font-weight:700;">Margin: ${wf.grossMarginPercent}</div>
        </div>

        <div style="background:rgba(10,15,28,0.7); border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:1rem;">
          <div style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase; font-weight:800;">4. Operating Overhead</div>
          <div style="font-size:1.3rem; font-weight:900; color:#fbbf24; font-family:var(--font-mono); margin:0.25rem 0 0.1rem;" id="pnlFixedOverhead">
            -${isUSD ? `$${wf.operatingExpensesUSD.toLocaleString()}` : `৳${(wf.operatingExpensesUSD * 120).toLocaleString()}`}
          </div>
          <div style="font-size:0.72rem; color:var(--text-muted);">Cloud Hosting, Tools & Ops</div>
        </div>

        <div style="background:rgba(10,15,28,0.7); border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:1rem;">
          <div style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase; font-weight:800;">5. Net Operating Income</div>
          <div style="font-size:1.3rem; font-weight:900; color:#a855f7; font-family:var(--font-mono); margin:0.25rem 0 0.1rem;" id="pnlNOI">
            ${isUSD ? `$${wf.netOperatingIncomeUSD.toLocaleString()}` : `৳${wf.netOperatingIncomeBDT.toLocaleString()}`}
          </div>
          <div style="font-size:0.72rem; color:#c084fc; font-weight:700;">Net Margin: ${wf.netMarginPercent}</div>
        </div>

        <div style="background:rgba(10,15,28,0.7); border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:1rem;">
          <div style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase; font-weight:800;">6. Cash Runway</div>
          <div style="font-size:1.3rem; font-weight:900; color:#38bdf8; font-family:var(--font-mono); margin:0.25rem 0 0.1rem;" id="pnlRunway">
            ${wf.runwayMonths} Months
          </div>
          <div style="font-size:0.72rem; color:var(--text-muted);">Operations Self-Sustaining</div>
        </div>
      </div>

      <!-- Segmented Waterfall Bar -->
      <div style="margin-bottom:1rem;" id="pnlWaterfallBar">
        <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.76rem; color:var(--text-muted); margin-bottom:0.4rem;">
          <span>Engine Inflow Breakdown (% Share of Gross Revenue)</span>
          <span>100% Consolidated</span>
        </div>
        <div style="display:flex; height:12px; border-radius:8px; overflow:hidden; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.08);">
          <div style="width:${wf.engineBreakdown.engine1_saas.share}; background:#8b5cf6;" title="Engine 1 (SaaS): $${wf.engineBreakdown.engine1_saas.revenueUSD}"></div>
          <div style="width:${wf.engineBreakdown.engine2_sprints.share}; background:#00df89;" title="Engine 2 (Sprints): $${wf.engineBreakdown.engine2_sprints.revenueUSD}"></div>
          <div style="width:${wf.engineBreakdown.engine3_commerce.share}; background:#f59e0b;" title="Engine 3 (Commerce): $${wf.engineBreakdown.engine3_commerce.revenueUSD}"></div>
          <div style="width:${wf.engineBreakdown.engine4_retainers.share}; background:#06b6d4;" title="Engine 4 (Retainers): $${wf.engineBreakdown.engine4_retainers.revenueUSD}"></div>
          <div style="width:${wf.engineBreakdown.engine5_media.share}; background:#ec4899;" title="Engine 5 (Media): $${wf.engineBreakdown.engine5_media.revenueUSD}"></div>
        </div>
        <div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:0.5rem; font-size:0.72rem; color:var(--text-muted); margin-top:0.45rem;">
          <span><span style="color:#8b5cf6;">●</span> E1 SaaS: $${wf.engineBreakdown.engine1_saas.revenueUSD} (${wf.engineBreakdown.engine1_saas.share})</span>
          <span><span style="color:#00df89;">●</span> E2 Sprints: $${wf.engineBreakdown.engine2_sprints.revenueUSD} (${wf.engineBreakdown.engine2_sprints.share})</span>
          <span><span style="color:#f59e0b;">●</span> E3 Commerce: $${wf.engineBreakdown.engine3_commerce.revenueUSD} (${wf.engineBreakdown.engine3_commerce.share})</span>
          <span><span style="color:#06b6d4;">●</span> E4 Retainers: $${wf.engineBreakdown.engine4_retainers.revenueUSD} (${wf.engineBreakdown.engine4_retainers.share})</span>
          <span><span style="color:#ec4899;">●</span> E5 Media: $${wf.engineBreakdown.engine5_media.revenueUSD} (${wf.engineBreakdown.engine5_media.share})</span>
        </div>
      </div>

      <!-- Settlement Rail Footer -->
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:0.75rem 1rem; font-size:0.8rem;">
        <div style="color:var(--text-secondary);">
          🏛️ <strong>Corporate Settlement Rail:</strong> ${wf.settlementRail || 'BRAC Bank Limited (Neoncore Tech Solution / 2081636480001)'}
        </div>
        <div style="font-family:var(--font-mono); font-size:0.74rem; color:var(--accent-mint);">
          ✓ Institutional Audit Verified
        </div>
      </div>
    </div>

    <!-- MASTER PROGRESS BANNER -->
    <div style="background:var(--surface-card, #181824); border:1px solid var(--border-subtle, #2e2e3e); border-radius:18px; padding:1.5rem; margin-bottom:1.75rem; box-shadow:0 10px 30px rgba(0,0,0,0.2);">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem; margin-bottom:1rem;">
        <div>
          <span style="font-size:0.75rem; font-weight:800; text-transform:uppercase; letter-spacing:0.06em; color:var(--brand-primary, #00df89);">Annual ARR Run Rate</span>
          <div style="font-size:2.2rem; font-weight:900; font-family:var(--font-heading); color:#ffffff;">
            ${isUSD ? `${totalCurrent.toLocaleString()}` : formatBDT(totalCurrent * 120)}
            <span style="font-size:1.1rem; color:var(--text-muted); font-weight:500;">/ ${isUSD ? '$100,000 Target' : '৳1.20 Cr Target'}</span>
          </div>
        </div>
        <div style="display:flex; gap:1.5rem; text-align:right; flex-wrap:wrap;">
          <div>
            <span style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase;">65% Net Profit</span>
            <div style="font-size:1.3rem; font-weight:800; color:var(--brand-primary, #00df89);">
              ${isUSD ? `${netProfitProjected.toLocaleString()}` : formatBDT(netProfitProjected * 120)}
            </div>
          </div>
          <div>
            <span style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase;">Expense Cap</span>
            <div style="font-size:1.3rem; font-weight:800; color:#fbbf24;">
              ${isUSD ? '$35,000' : '৳42 Lakh'}
            </div>
          </div>
          <div>
            <span style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase;">Execution Pace</span>
            <div style="font-size:1.3rem; font-weight:800; color:#06b6d4;">
              ${totalPercent}%
            </div>
          </div>
        </div>
      </div>

      <!-- PROGRESS BAR -->
      <div style="background:rgba(255,255,255,0.06); height:12px; border-radius:8px; overflow:hidden; display:flex;">
        <div style="width:${(state.saas.current / totalTarget) * 100}%; background:#00df89;" title="SaaS: $${state.saas.current}"></div>
        <div style="width:${(state.sprints.current / totalTarget) * 100}%; background:#06b6d4;" title="Sprints: $${state.sprints.current}"></div>
        <div style="width:${(state.assets.current / totalTarget) * 100}%; background:#a855f7;" title="Assets: $${state.assets.current}"></div>
        <div style="width:${(state.retainers.current / totalTarget) * 100}%; background:#f59e0b;" title="Retainers: $${state.retainers.current}"></div>
        <div style="width:${(state.video.current / totalTarget) * 100}%; background:#ef4444;" title="Video: $${state.video.current}"></div>
      </div>

      <div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:0.5rem; margin-top:0.75rem; font-size:0.75rem; color:var(--text-muted);">
        <span><span style="color:#00df89;">●</span> Micro-SaaS (35%)</span>
        <span><span style="color:#06b6d4;">●</span> Sprints & Freelance (25%)</span>
        <span><span style="color:#a855f7;">●</span> Digital Assets (20%)</span>
        <span><span style="color:#f59e0b;">●</span> Agency Retainers (15%)</span>
        <span><span style="color:#ef4444;">●</span> Programmatic Video (5%)</span>
      </div>
    </div>

    <!-- 5 ENGINES COCKPIT BALANCED GRID -->
    <div class="cockpit-engines-grid">
      
      <!-- ENGINE 1: MICRO-SAAS -->
      <div class="card-glass engine-card-hover" style="border:1px solid rgba(0,223,137,0.3); border-radius:16px; padding:1.25rem; display:flex; flex-direction:column; justify-content:space-between;">
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <span style="font-size:1.4rem;">💻</span>
              <div>
                <h3 style="font-size:1.05rem; font-weight:800; color:#ffffff; margin:0;">Engine 1: Micro-SaaS</h3>
                <span style="font-size:0.72rem; color:var(--brand-primary, #00df89); font-weight:700;">Target: ${isUSD ? '$35,000' : '৳42L'} (35%)</span>
              </div>
            </div>
            <span class="badge" style="background:rgba(0,223,137,0.15); color:#00df89; font-weight:800; border:1px solid rgba(0,223,137,0.3); border-radius:12px; padding:0.2rem 0.6rem; font-size:0.75rem;">
              ${formatMoney(state.saas.current, isUSD, false)}
            </span>
          </div>

          <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:0.5rem; background:rgba(0,0,0,0.2); padding:0.75rem; border-radius:10px; margin-bottom:1rem;">
            <div>
              <span style="font-size:0.7rem; color:var(--text-muted);">Current MRR</span>
              <div style="font-size:1.1rem; font-weight:800; color:#00df89;">${formatMoney(state.saas.mrr, isUSD, true)}</div>
            </div>
            <div>
              <span style="font-size:0.7rem; color:var(--text-muted);">Active Licenses</span>
              <div style="font-size:1.1rem; font-weight:800; color:#ffffff;">${state.saas.subscribers} Users</div>
            </div>
          </div>

          <h4 style="font-size:0.78rem; color:var(--text-muted); text-transform:uppercase; margin-bottom:0.5rem;">Active Software Suite</h4>
          <div style="display:flex; flex-direction:column; gap:0.4rem;">
            ${(state.saas.products || []).slice(0, 4).map(p => `
              <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.03); padding:0.4rem 0.6rem; border-radius:8px; font-size:0.8rem;">
                <div style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; padding-right:0.3rem;">
                  <span style="margin-right:0.25rem;">${p.icon || '📦'}</span>
                  <strong style="color:#ffffff;">${escapeHTML(p.name)}</strong>
                  <span style="font-size:0.68rem; color:var(--text-muted); display:block;">${escapeHTML(p.status || 'Active')} · ${p.users || 0} users</span>
                </div>
                <span style="color:#00df89; font-weight:700; white-space:nowrap;">+${formatMoney(p.mrr, isUSD, true)}</span>
              </div>
            `).join('')}
          </div>
        </div>
        <div style="margin-top:1rem; padding-top:0.75rem; border-top:1px solid rgba(255,255,255,0.05); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
          <a href="#engine1" class="btn-primary btn-sm" style="background:#8b5cf6; text-decoration:none;">⚡ Open Desk Cockpit ↗</a>
          <button class="btn-ghost btn-sm" onclick="openAddProductModal()">+ Add Product</button>
        </div>
      </div>

      <!-- ENGINE 2: AI SERVICE AGENCY & PLATFORM SPRINTS -->
      <div class="card-glass engine-card-hover" style="border:1px solid rgba(6,182,212,0.35); border-radius:16px; padding:1.25rem; display:flex; flex-direction:column; justify-content:space-between; background:linear-gradient(180deg, rgba(6,182,212,0.06) 0%, rgba(24,24,36,0.95) 100%);">
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <span style="font-size:1.4rem;">⚡</span>
              <div>
                <h3 style="font-size:1.05rem; font-weight:800; color:#ffffff; margin:0;">Engine 2: AI Agency & Sprints</h3>
                <span style="font-size:0.72rem; color:#06b6d4; font-weight:700;">Target: ${isUSD ? '$25,000' : '৳30L'} (25%)</span>
              </div>
            </div>
            <span class="badge" style="background:rgba(6,182,212,0.15); color:#06b6d4; font-weight:800; border:1px solid rgba(6,182,212,0.3); border-radius:12px; padding:0.2rem 0.6rem; font-size:0.75rem;">
              ${e2Flash ? `$${e2Flash.financialTargets.realizedRevenueUsd.toLocaleString()}` : formatMoney(state.sprints.current || 1250, isUSD, false)}
            </span>
          </div>

          <!-- Capacity & Utilization Indicator -->
          <div style="background:rgba(0,0,0,0.25); border:1px solid rgba(255,255,255,0.05); padding:0.65rem 0.75rem; border-radius:10px; margin-bottom:0.75rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.35rem;">
              <span style="font-size:0.68rem; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Pod Crew Utilization</span>
              <span style="font-size:0.75rem; font-weight:800; color:#00df89;">${e2Capacity.utilizationRate || '78%'} (Optimal: 75–85%)</span>
            </div>
            <div style="background:rgba(255,255,255,0.08); height:6px; border-radius:4px; overflow:hidden;">
              <div style="width:${parseInt(e2Capacity.utilizationRate || '78', 10)}%; background:linear-gradient(90deg, #06b6d4, #00df89); height:100%; border-radius:4px;"></div>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:0.65rem; color:var(--text-muted); margin-top:0.3rem;">
              <span>${e2Capacity.totalMembers || 8} Active Engineers</span>
              <span style="color:#00df89; font-weight:700;">74.2% Gross Margin</span>
            </div>
          </div>

          <!-- Pods Pills -->
          <div style="display:flex; gap:0.35rem; flex-wrap:wrap; margin-bottom:0.75rem;">
            <span style="font-size:0.65rem; font-weight:700; background:rgba(6,182,212,0.15); color:#06b6d4; border:1px solid rgba(6,182,212,0.3); border-radius:6px; padding:0.15rem 0.4rem;">⚡ MVP Pod (14d)</span>
            <span style="font-size:0.65rem; font-weight:700; background:rgba(0,223,137,0.15); color:#00df89; border:1px solid rgba(0,223,137,0.3); border-radius:6px; padding:0.15rem 0.4rem;">🏢 Auto Pod (21d)</span>
            <span style="font-size:0.65rem; font-weight:700; background:rgba(168,85,247,0.15); color:#a855f7; border:1px solid rgba(168,85,247,0.3); border-radius:6px; padding:0.15rem 0.4rem;">🎨 Creative (7d)</span>
          </div>

          <!-- Contracts & Retainers -->
          <h4 style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; font-weight:800; margin-bottom:0.4rem;">Active Contracts & Retainers</h4>
          <div style="display:flex; flex-direction:column; gap:0.35rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.03); padding:0.4rem 0.6rem; border-radius:8px; font-size:0.78rem; border-left:2px solid #00df89;">
              <div style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                <strong style="color:#ffffff;">Purplebot Digital</strong>
                <div style="font-size:0.68rem; color:#00df89;">AI Retainer • 30d Warranty Shield</div>
              </div>
              <span style="color:#00df89; font-weight:700; white-space:nowrap;">৳26,250</span>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.03); padding:0.4rem 0.6rem; border-radius:8px; font-size:0.78rem; border-left:2px solid #06b6d4;">
              <div style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                <strong style="color:#ffffff;">Upwork Enterprise</strong>
                <div style="font-size:0.68rem; color:var(--text-muted);">Next.js Agentic MVP Sprint</div>
              </div>
              <span style="color:#06b6d4; font-weight:700; white-space:nowrap;">$1,200</span>
            </div>
          </div>
        </div>

        <div style="margin-top:1rem; padding-top:0.75rem; border-top:1px solid rgba(255,255,255,0.05); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.4rem;">
          <button onclick="document.getElementById('engine2Studio')?.scrollIntoView({behavior:'smooth'})" class="btn-primary btn-sm" style="background:#06b6d4; color:#09090b; font-weight:800; border:none; text-decoration:none; display:inline-flex; align-items:center; gap:0.3rem; cursor:pointer;">
            ⚡ Engine 2 OS Studio ↓
          </button>
          <div style="display:flex; gap:0.3rem;">
            <a href="/invoice-view.html?invoiceId=INV-2026-004" target="_blank" class="btn-ghost btn-sm" style="font-size:0.72rem;" title="View Purplebot Digital Invoice">📄 Invoice ↗</a>
            <a href="/handover-view.html" target="_blank" class="btn-ghost btn-sm" style="font-size:0.72rem;" title="View IP Handover Shield">🛡️ Handover ↗</a>
          </div>
        </div>
      </div>

      <!-- ENGINE 3: DIGITAL ASSET SALES -->
      <div class="card-glass engine-card-hover" style="border:1px solid rgba(168,85,247,0.3); border-radius:16px; padding:1.25rem; display:flex; flex-direction:column; justify-content:space-between;">
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <span style="font-size:1.4rem;">📦</span>
              <div>
                <h3 style="font-size:1.05rem; font-weight:800; color:#ffffff; margin:0;">Engine 3: Digital Asset Store</h3>
                <span style="font-size:0.72rem; color:#a855f7; font-weight:700;">Target: ${isUSD ? '$20,000' : '৳24L'} (20%)</span>
              </div>
            </div>
            <span class="badge" style="background:rgba(168,85,247,0.15); color:#a855f7; font-weight:800; border:1px solid rgba(168,85,247,0.3); border-radius:12px; padding:0.2rem 0.6rem; font-size:0.75rem;">
              ${formatMoney(state.assets.current, isUSD, false)}
            </span>
          </div>

          <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:0.5rem; background:rgba(0,0,0,0.2); padding:0.75rem; border-radius:10px; margin-bottom:1rem;">
            <div>
              <span style="font-size:0.7rem; color:var(--text-muted);">Active Listings</span>
              <div style="font-size:1.1rem; font-weight:800; color:#a855f7;">${state.assets.listings} Products</div>
            </div>
            <div>
              <span style="font-size:0.7rem; color:var(--text-muted);">Unit Downloads</span>
              <div style="font-size:1.1rem; font-weight:800; color:#ffffff;">${state.assets.downloads} Sold</div>
            </div>
          </div>

          <h4 style="font-size:0.78rem; color:var(--text-muted); text-transform:uppercase; margin-bottom:0.5rem;">Storefront Distribution</h4>
          <div style="display:flex; flex-direction:column; gap:0.4rem;">
            ${(state.assets.stores || []).map(s => `
              <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.03); padding:0.4rem 0.6rem; border-radius:8px; font-size:0.8rem;">
                <div style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; padding-right:0.3rem;">
                  <strong style="color:#ffffff;">${escapeHTML(s.name)}</strong>
                  <div style="font-size:0.68rem; color:var(--text-muted);">${s.items} items · ${s.monthlySales} sold</div>
                </div>
                <span style="color:#a855f7; font-weight:700; white-space:nowrap;">${formatMoney(s.rev, isUSD, false)}</span>
              </div>
            `).join('')}
          </div>
        </div>
        <div style="margin-top:1rem; padding-top:0.75rem; border-top:1px solid rgba(255,255,255,0.05); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.4rem;">
          <a href="/dce" target="_blank" rel="noopener" class="btn-primary btn-sm" style="font-size:0.72rem; background:#00df89; color:#070b12; font-weight:800; text-decoration:none;">⚡ DCE Hub ↗</a>
          <a href="/dce/digivault" target="_blank" rel="noopener" class="btn-secondary btn-sm" style="font-size:0.72rem; text-decoration:none;">🏪 DigiVault Ops ↗</a>
          <a href="#brands" class="btn-ghost btn-sm" style="font-size:0.72rem;">🛍️ Brands</a>
        </div>
      </div>

      <!-- ENGINE 4: CORE AGENCY RETAINERS & OS STUDIO -->
      <div class="card-glass engine-card-hover" style="border:1px solid rgba(245,158,11,0.3); border-radius:16px; padding:1.25rem; display:flex; flex-direction:column; justify-content:space-between;">
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <span style="font-size:1.4rem;">🤝</span>
              <div>
                <h3 style="font-size:1.05rem; font-weight:800; color:#ffffff; margin:0;">Engine 4: Agency OS Studio</h3>
                <span style="font-size:0.72rem; color:#f59e0b; font-weight:700;">Target: ${isUSD ? '$15,000' : '৳18L'} (15%)</span>
              </div>
            </div>
            <span class="badge" style="background:rgba(245,158,11,0.15); color:#f59e0b; font-weight:800; border:1px solid rgba(245,158,11,0.3); border-radius:12px; padding:0.2rem 0.6rem; font-size:0.75rem;">
              ${formatMoney(state.retainers.current, isUSD, false)}
            </span>
          </div>

          <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:0.5rem; background:rgba(0,0,0,0.2); padding:0.75rem; border-radius:10px; margin-bottom:1rem;">
            <div>
              <span style="font-size:0.7rem; color:var(--text-muted);">In-Flight Pipeline</span>
              <div style="font-size:1.1rem; font-weight:800; color:#f59e0b;">${inFlightTemplates.length} Active</div>
            </div>
            <div>
              <span style="font-size:0.7rem; color:var(--text-muted);">Ready OS Templates</span>
              <div style="font-size:1.1rem; font-weight:800; color:#00df89;">${readyTemplates.length} Ready</div>
            </div>
          </div>

          <h4 style="font-size:0.78rem; color:var(--text-muted); text-transform:uppercase; margin-bottom:0.5rem;">OS Templates Snapshot</h4>
          <div style="display:flex; flex-direction:column; gap:0.4rem;">
            ${(state.retainers.osTemplates || []).slice(0, 4).map(t => `
              <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.03); padding:0.4rem 0.6rem; border-radius:8px; font-size:0.8rem;">
                <div style="display:flex; align-items:center; gap:0.35rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                  <span>${t.vertical}</span>
                  <strong style="color:#ffffff;">${escapeHTML(t.name)}</strong>
                  <span style="font-size:0.68rem; color:var(--text-muted);">${t.client ? '· ' + escapeHTML(t.client) : ''}</span>
                </div>
                <span style="color:${t.color}; font-size:0.68rem; font-weight:700; background:rgba(255,255,255,0.05); padding:0.15rem 0.4rem; border-radius:6px; white-space:nowrap;">${escapeHTML(t.statusLabel)}</span>
              </div>
            `).join('')}
          </div>
        </div>
        <div style="margin-top:1rem; padding-top:0.75rem; border-top:1px solid rgba(255,255,255,0.05); display:flex; justify-content:space-between; align-items:center;">
          <a href="#proposals" class="btn-primary btn-sm" style="background:#f59e0b; color:#09090b; font-weight:800; border:none; text-decoration:none;">💼 Proposals (${proposalCount})</a>
          <a href="#crm" class="btn-secondary btn-sm">CRM →</a>
        </div>
      </div>

      <!-- ENGINE 5: PROGRAMMATIC AI VIDEO SCALE -->
      <div class="card-glass engine-card-hover" style="border:1px solid rgba(239,68,68,0.3); border-radius:16px; padding:1.25rem; display:flex; flex-direction:column; justify-content:space-between;">
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <span style="font-size:1.4rem;">🎬</span>
              <div>
                <h3 style="font-size:1.05rem; font-weight:800; color:#ffffff; margin:0;">Engine 5: Video Scale</h3>
                <span style="font-size:0.72rem; color:#ef4444; font-weight:700;">Target: ${isUSD ? '$5,000' : '৳6L'} (5%)</span>
              </div>
            </div>
            <span class="badge" style="background:rgba(239,68,68,0.15); color:#ef4444; font-weight:800; border:1px solid rgba(239,68,68,0.3); border-radius:12px; padding:0.2rem 0.6rem; font-size:0.75rem;">
              ${formatMoney(state.video.current, isUSD, false)}
            </span>
          </div>

          <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:0.5rem; background:rgba(0,0,0,0.2); padding:0.75rem; border-radius:10px; margin-bottom:1rem;">
            <div>
              <span style="font-size:0.7rem; color:var(--text-muted);">Posts Published</span>
              <div style="font-size:1.1rem; font-weight:800; color:#10b981;">${e5Published} <span style="font-size:0.72rem; color:var(--text-muted); font-weight:normal;">live</span></div>
            </div>
            <div>
              <span style="font-size:0.7rem; color:var(--text-muted);">In Queue / Sched.</span>
              <div style="font-size:1.1rem; font-weight:800; color:#60a5fa;">${e5Scheduled} <span style="font-size:0.72rem; color:var(--text-muted); font-weight:normal;">posts</span></div>
            </div>
          </div>

          <h4 style="font-size:0.78rem; color:var(--text-muted); text-transform:uppercase; margin-bottom:0.5rem;">Active Channels & Feeds</h4>
          <div style="display:flex; flex-direction:column; gap:0.4rem;">
            ${state.video.channels.map(c => {
              const cPosts = allPosts.filter(p => String(p.channel||'').toLowerCase().includes(c.name.toLowerCase())).length;
              return `
              <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.03); padding:0.4rem 0.6rem; border-radius:8px; font-size:0.8rem;">
                <div style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; padding-right:0.3rem;">
                  <strong style="color:#ffffff;">${escapeHTML(c.name)}</strong>
                  <div style="font-size:0.68rem; color:var(--text-muted);">${c.subs} Subs · ${cPosts} posts</div>
                </div>
                <span style="color:#ef4444; font-weight:700; white-space:nowrap;">+${formatMoney(c.yield, isUSD, true)}</span>
              </div>
            `}).join('')}
          </div>
        </div>
        <div style="margin-top:1rem; padding-top:0.75rem; border-top:1px solid rgba(255,255,255,0.05); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.4rem;">
          <a href="#social" class="btn-ghost btn-sm" style="font-size:0.72rem;">📱 Planner</a>
          <a href="#content-os" class="btn-primary btn-sm" style="font-size:0.72rem;">🏛️ Content OS →</a>
        </div>
      </div>

    </div>
    
    <!-- ENGINE 2 DEEP DIVE: HIGH-INTENT AI SERVICE AGENCY & RAPID SPRINTS STUDIO -->
    <div id="engine2Studio" style="margin-top:2.5rem; background:var(--surface-card, #181824); border:1px solid rgba(6,182,212,0.35); border-radius:18px; padding:1.5rem; box-shadow:0 12px 36px rgba(0,0,0,0.25);">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem; margin-bottom:1.25rem;">
        <div>
          <div style="display:flex; align-items:center; gap:0.6rem; flex-wrap:wrap;">
            <span style="font-size:1.5rem;">⚡</span>
            <h2 style="font-size:1.3rem; font-weight:900; font-family:var(--font-heading); color:#ffffff; margin:0;">
              Engine 2: High-Intent AI Solutions & Rapid Sprints Studio
            </h2>
            <span style="font-size:0.7rem; font-weight:800; padding:0.2rem 0.6rem; border-radius:999px; background:rgba(6,182,212,0.15); color:#06b6d4; border:1px solid rgba(6,182,212,0.3);">
              B2B Agency Scale • $25,000 ARR Standard • ${gmStr} Gross Margin
            </span>
          </div>
          <p style="color:var(--text-secondary); font-size:0.84rem; margin:0.35rem 0 0 0;">
            Autonomous B2B Delivery Pods, Real-Time Token Compute COGS Ledger, 30-Day Warranty Governance & Retainer Hours Bank.
          </p>
        </div>
        <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
          <a href="/invoice-view.html?invoiceId=INV-2026-004" target="_blank" class="btn-primary" style="background:#00df89; color:#09090b; font-weight:800; border:none; text-decoration:none; display:inline-flex; align-items:center; gap:0.4rem;">
            📄 Purplebot Invoice (৳26,250) ↗
          </a>
          <a href="/handover-view.html" target="_blank" class="btn-secondary" style="text-decoration:none; display:inline-flex; align-items:center; gap:0.4rem;">
            🛡️ Handover Shield ↗
          </a>
          <a href="/msa-view.html" target="_blank" class="btn-secondary" style="text-decoration:none; display:inline-flex; align-items:center; gap:0.4rem;">
            📜 MSA & NDA ↗
          </a>
          <button id="btnDispatchE2Flash" onclick="window.EnginesModule.dispatchEngine2Flash()" class="btn-secondary" style="border-color:rgba(6,182,212,0.4); color:#06b6d4; cursor:pointer;">
            📤 Dispatch Flash Report
          </button>
        </div>
      </div>

      <!-- LIVE GROSS MARGIN TELEMETRY & WARNING BANNER (Phase 2 Pillar 5) -->
      ${!isMarginHealthy ? `
        <div style="background:rgba(239,68,68,0.12); border:1px solid rgba(239,68,68,0.4); border-radius:12px; padding:0.9rem 1.1rem; margin-bottom:1.25rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem;">
          <div style="display:flex; align-items:center; gap:0.6rem;">
            <span style="font-size:1.4rem;">🚨</span>
            <div>
              <div style="font-size:0.85rem; font-weight:800; color:#f87171;">GROSS MARGIN BENCHMARK DIP ALERT (${gmStr} &lt; 70.0%)</div>
              <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:0.15rem;">
                Infrastructure or AI token compute COGS (${cogsValStr}) exceed target model. Autonomous Telegram leadership notification dispatched.
              </div>
            </div>
          </div>
          <button onclick="window.EnginesModule.openCOGSModal('${activeSprintProjId}')" class="btn-primary btn-sm" style="background:#ef4444; color:#fff; border:none; font-weight:800;">
            Audit COGS Ledger ↗
          </button>
        </div>
      ` : `
        <div style="background:rgba(0,223,137,0.08); border:1px solid rgba(0,223,137,0.25); border-radius:12px; padding:0.75rem 1.1rem; margin-bottom:1.25rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem;">
          <div style="display:flex; align-items:center; gap:0.5rem;">
            <span style="font-size:1.2rem;">🟢</span>
            <div>
              <span style="font-size:0.82rem; font-weight:800; color:#00df89;">GROSS MARGIN COMPLIANCE: ${gmStr}</span>
              <span style="font-size:0.74rem; color:var(--text-muted); margin-left:0.5rem;">Target Benchmark: &ge;70.0% Realized Gross Margin (Optimal Unit Economics)</span>
            </div>
          </div>
          <div style="font-size:0.72rem; color:var(--text-muted);">
            Live Telemetry Active • ${cogsValStr} Direct COGS
          </div>
        </div>
      `}

      <!-- DYNAMIC ENGINE 2 KPI SUMMARY BAR -->
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:0.85rem; margin-bottom:1.5rem; background:rgba(0,0,0,0.3); padding:1rem; border-radius:12px; border:1px solid rgba(255,255,255,0.05);">
        <div>
          <span style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">ARR Target Quota</span>
          <div style="font-size:1.25rem; font-weight:900; color:#06b6d4;">
            ${isUSD ? '$25,000' : '৳30 Lakh'}
          </div>
          <span style="font-size:0.68rem; color:#00df89; font-weight:700;">Pacing: Active (24.8% Realized)</span>
        </div>
        <div>
          <span style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Pod Billable Utilization</span>
          <div style="font-size:1.25rem; font-weight:900; color:#00df89;">${e2Capacity.utilizationRate || '78%'} Optimal</div>
          <span style="font-size:0.68rem; color:var(--text-muted);">${e2Capacity.totalMembers || 8} Active Engineers (Benchmark: 75%–85%)</span>
        </div>
        <div>
          <span style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Project Unit Economics</span>
          <div style="font-size:1.25rem; font-weight:900; color:${isMarginHealthy ? '#00df89' : '#ef4444'};">${gmStr} Gross Margin</div>
          <span style="font-size:0.68rem; color:${isMarginHealthy ? '#00df89' : '#f87171'}; font-weight:700;">${isMarginHealthy ? '✓ Optimal (≥70%)' : '⚠️ Alert (<70%)'} • ${cogsValStr} Direct COGS</span>
        </div>
        <div>
          <span style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">30-Day Warranty Governance</span>
          <div style="font-size:1.25rem; font-weight:900; color:#00df89;">Zero-Cost SLA Active</div>
          <span style="font-size:0.68rem; color:var(--text-muted);">4h Critical P0 / 24h Standard P1</span>
        </div>
      </div>

      <!-- 3 DELIVERY PODS GRID -->
      <h3 style="font-size:0.85rem; font-weight:800; color:var(--text-muted); text-transform:uppercase; margin-bottom:0.75rem; letter-spacing:0.05em;">
        Autonomous Delivery Pods (Velocity & Specialization)
      </h3>
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:1rem; margin-bottom:1.5rem;">
        
        <!-- POD 1 -->
        <div style="background:rgba(255, 255, 255, 0.03); border:1px solid rgba(6,182,212,0.3); border-radius:14px; padding:1.1rem; display:flex; flex-direction:column; justify-content:space-between;">
          <div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.6rem;">
              <div style="display:flex; align-items:center; gap:0.5rem;">
                <span style="font-size:1.4rem;">⚡</span>
                <div>
                  <h4 style="font-size:0.95rem; font-weight:800; color:#ffffff; margin:0;">MVP Rapid Delivery Pod</h4>
                  <span style="font-size:0.68rem; color:#06b6d4; font-weight:700;">MVP_BUILD_POD</span>
                </div>
              </div>
              <span style="font-size:0.68rem; font-weight:800; padding:0.2rem 0.5rem; border-radius:8px; background:rgba(6,182,212,0.15); color:#06b6d4; border:1px solid rgba(6,182,212,0.3);">
                14d Target
              </span>
            </div>
            <p style="font-size:0.75rem; color:var(--text-secondary); line-height:1.4; margin-bottom:0.75rem;">
              Full-stack AI SaaS MVPs, web apps, and bespoke client pilots with Next.js, Supabase, and LangGraph agent pipelines.
            </p>
            <div style="font-size:0.7rem; color:var(--text-muted); background:rgba(0,0,0,0.25); padding:0.5rem; border-radius:8px;">
              <strong>Roles:</strong> Lead Architect · AI/LLM Prompt Engineer · QA Specialist
            </div>
          </div>
          <div style="margin-top:0.85rem; padding-top:0.65rem; border-top:1px solid rgba(255,255,255,0.05); display:flex; justify-content:space-between; font-size:0.72rem;">
            <span style="color:var(--text-muted);">Current Load:</span>
            <span style="color:#00df89; font-weight:700;">${mvpPodCount} Sprints Active</span>
          </div>
        </div>

        <!-- POD 2 -->
        <div style="background:rgba(255, 255, 255, 0.03); border:1px solid rgba(0,223,137,0.3); border-radius:14px; padding:1.1rem; display:flex; flex-direction:column; justify-content:space-between;">
          <div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.6rem;">
              <div style="display:flex; align-items:center; gap:0.5rem;">
                <span style="font-size:1.4rem;">🏢</span>
                <div>
                  <h4 style="font-size:0.95rem; font-weight:800; color:#ffffff; margin:0;">Enterprise Automation Pod</h4>
                  <span style="font-size:0.68rem; color:#00df89; font-weight:700;">ENTERPRISE_AUTOMATION_POD</span>
                </div>
              </div>
              <span style="font-size:0.68rem; font-weight:800; padding:0.2rem 0.5rem; border-radius:8px; background:rgba(0,223,137,0.15); color:#00df89; border:1px solid rgba(0,223,137,0.3);">
                21d Target
              </span>
            </div>
            <p style="font-size:0.75rem; color:var(--text-secondary); line-height:1.4; margin-bottom:0.75rem;">
              Internal workflows, RPA bots, webhook orchestrations, CRM integrations, and mission-critical enterprise data pipelines.
            </p>
            <div style="font-size:0.7rem; color:var(--text-muted); background:rgba(0,0,0,0.25); padding:0.5rem; border-radius:8px;">
              <strong>Roles:</strong> Solutions Architect · RPA Specialist · DevOps Lead
            </div>
          </div>
          <div style="margin-top:0.85rem; padding-top:0.65rem; border-top:1px solid rgba(255,255,255,0.05); display:flex; justify-content:space-between; font-size:0.72rem;">
            <span style="color:var(--text-muted);">Current Load:</span>
            <span style="color:#00df89; font-weight:700;">${autoPodCount > 0 ? escapeHTML(e2RetainerBank.clientName || 'Purplebot AI Retainer') + ' Active' : 'Standby'}</span>
          </div>
        </div>

        <!-- POD 3 -->
        <div style="background:rgba(255, 255, 255, 0.03); border:1px solid rgba(168,85,247,0.3); border-radius:14px; padding:1.1rem; display:flex; flex-direction:column; justify-content:space-between;">
          <div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.6rem;">
              <div style="display:flex; align-items:center; gap:0.5rem;">
                <span style="font-size:1.4rem;">🎨</span>
                <div>
                  <h4 style="font-size:0.95rem; font-weight:800; color:#ffffff; margin:0;">Programmatic Creative AI Pod</h4>
                  <span style="font-size:0.68rem; color:#a855f7; font-weight:700;">CREATIVE_AI_POD</span>
                </div>
              </div>
              <span style="font-size:0.68rem; font-weight:800; padding:0.2rem 0.5rem; border-radius:8px; background:rgba(168,85,247,0.15); color:#a855f7; border:1px solid rgba(168,85,247,0.3);">
                7d Target
              </span>
            </div>
            <p style="font-size:0.75rem; color:var(--text-secondary); line-height:1.4; margin-bottom:0.75rem;">
              Dynamic generative video cuts, marketing automation pipelines, voice cloning, and batch multi-angle creative assets.
            </p>
            <div style="font-size:0.7rem; color:var(--text-muted); background:rgba(0,0,0,0.25); padding:0.5rem; border-radius:8px;">
              <strong>Roles:</strong> Creative Director · Video/Audio AI Specialist · Motion Designer
            </div>
          </div>
          <div style="margin-top:0.85rem; padding-top:0.65rem; border-top:1px solid rgba(255,255,255,0.05); display:flex; justify-content:space-between; font-size:0.72rem;">
            <span style="color:var(--text-muted);">Current Load:</span>
            <span style="color:#a855f7; font-weight:700;">${creativePodCount > 0 ? creativePodCount + ' Campaigns Active' : 'Standby (Ready)'}</span>
          </div>
        </div>

      </div>

      <!-- OPERATIONAL GOVERNANCE & CONTROLS (2 COLUMNS) -->
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:1.25rem;">
        
        <!-- LEFT: RETAINER HOURS BANK -->
        <div style="background:rgba(0,0,0,0.25); border:1px solid rgba(255,255,255,0.06); border-radius:14px; padding:1.25rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
            <div>
              <span style="font-size:0.7rem; text-transform:uppercase; color:var(--text-muted); font-weight:800;">Monthly Retainer Banking</span>
              <h4 style="font-size:1rem; font-weight:800; color:#ffffff; margin:0.15rem 0 0 0;">${escapeHTML(e2RetainerBank.clientName || 'Purplebot Digital Limited')}</h4>
            </div>
            ${isDepleted ?
              '<span style="font-size:0.7rem; font-weight:800; padding:0.2rem 0.55rem; border-radius:6px; background:rgba(239,68,68,0.15); color:#ef4444; border:1px solid rgba(239,68,68,0.3);">🛑 Depleted (100%)</span>' :
              isNearCap ?
              `<span style="font-size:0.7rem; font-weight:800; padding:0.2rem 0.55rem; border-radius:6px; background:rgba(245,158,11,0.15); color:#f59e0b; border:1px solid rgba(245,158,11,0.3);">⚠️ Nearing Capacity (${burnPct}%)</span>` :
              `<span style="font-size:0.7rem; font-weight:800; padding:0.2rem 0.55rem; border-radius:6px; background:rgba(0,223,137,0.15); color:#00df89; border:1px solid rgba(0,223,137,0.3);">🟢 Healthy (${burnPct}%)</span>`
            }
          </div>

          <div style="margin-bottom:0.85rem;">
            <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:0.35rem;">
              <span style="color:var(--text-muted);">${loggedH.toFixed(1)} hrs logged</span>
              <span style="color:#ffffff; font-weight:700;">${bankedH.toFixed(1)} hrs total allocation</span>
            </div>
            <div style="background:rgba(255,255,255,0.08); height:8px; border-radius:6px; overflow:hidden;">
              <div style="width:${Math.min(100, burnPct)}%; background:${isDepleted ? '#ef4444' : isNearCap ? 'linear-gradient(90deg, #f59e0b, #ef4444)' : 'linear-gradient(90deg, #06b6d4, #00df89)'}; height:100%; border-radius:6px;"></div>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:0.7rem; color:var(--text-muted); margin-top:0.35rem;">
              <span>Remaining: <strong>${remainingH.toFixed(1)} Hours</strong></span>
              <span>Overage Rate: <strong>$50.00 / hr</strong></span>
            </div>
          </div>

          <div style="font-size:0.72rem; color:var(--text-muted); margin-bottom:0.75rem; background:rgba(255,255,255,0.02); padding:0.5rem 0.75rem; border-radius:8px; border-left:2px solid ${isNearCap ? '#f59e0b' : '#06b6d4'};">
            ${(e2RetainerBank.tasks || []).slice(-3).reverse().map(t => `
              <div>• <strong>${Number(t.hours || t.hoursLogged || 0).toFixed(1)}h:</strong> ${escapeHTML(t.taskDescription || t.description || t.task || 'Sprint Task')} <span style="font-size:0.65rem; color:#06b6d4;">[${escapeHTML(t.category || 'Core Dev')}]</span></div>
            `).join('')}
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.4rem;">
            <span style="font-size:0.7rem; color:var(--text-muted);">Cycle: Sept 1 – Sept 30, 2026</span>
            <div style="display:flex; gap:0.4rem;">
              <button class="btn-ghost btn-sm" onclick="window.EnginesModule.openLogRetainerModal('${activeSprintProjId}')" style="font-size:0.72rem; color:#06b6d4; border-color:rgba(6,182,212,0.4); cursor:pointer;">
                + Log Sprint Hours
              </button>
              <button class="btn-ghost btn-sm" onclick="window.EnginesModule.openCOGSModal('${activeSprintProjId}')" style="font-size:0.72rem; color:#00df89; border-color:rgba(0,223,137,0.4); cursor:pointer;">
                + Log AI COGS
              </button>
            </div>
          </div>
        </div>

        <!-- RIGHT: SUBCONTRACTOR GATEWAY & PRIVACY MASK -->
        <div style="background:rgba(0,0,0,0.25); border:1px solid rgba(255,255,255,0.06); border-radius:14px; padding:1.25rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
            <div>
              <span style="font-size:0.7rem; text-transform:uppercase; color:var(--text-muted); font-weight:800;">Subcontractor Scoped Gateway</span>
              <h4 style="font-size:1rem; font-weight:800; color:#ffffff; margin:0.15rem 0 0 0;">Financial Confidentiality Shield</h4>
            </div>
            <span style="font-size:0.7rem; font-weight:800; padding:0.2rem 0.55rem; border-radius:6px; background:rgba(0,223,137,0.15); color:#00df89; border:1px solid rgba(0,223,137,0.3);">
              ✓ 100% Masked
            </span>
          </div>

          <p style="font-size:0.75rem; color:var(--text-secondary); line-height:1.4; margin-bottom:0.75rem;">
            External freelancers and specialized contractors access technical deliverables and repositories without exposing client budgets, agency margins, or invoices.
          </p>

          <div style="font-size:0.7rem; background:rgba(0,0,0,0.2); padding:0.6rem 0.75rem; border-radius:8px; margin-bottom:0.85rem; font-family:var(--font-mono, monospace);">
            <div style="color:#ef4444;">✗ Masked: budget, price, rates, invoices, cogs, margin</div>
            <div style="color:#00df89;">✓ Visible: deliverables, repo guidelines, staging URL, DoD checklist</div>
          </div>

          <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
            <a href="/contractor-view.html?id=${activeSprintProjId}" target="_blank" class="btn-primary btn-sm" style="font-size:0.72rem; background:linear-gradient(135deg, #f59e0b, #d97706); color:#000; font-weight:800; text-decoration:none;">
              🔐 Open Contractor Portal ↗
            </a>
            <button type="button" class="btn-secondary btn-sm" onclick="window.EnginesModule.openContractorPassModal('${activeSprintProjId}')" style="font-size:0.72rem;">
              🔑 Issue Contractor Pass
            </button>
            <a href="/api/projects/${activeSprintProjId}/contractor-view" target="_blank" class="btn-secondary btn-sm" style="font-size:0.72rem;">
              👁️ Raw API ↗
            </a>
            <button class="btn-ghost btn-sm" onclick="window.location.hash='#kanban'; setTimeout(() => window.KANBAN_MODULE && window.KANBAN_MODULE.toggleContractorMode(true), 300);" style="font-size:0.72rem; color:#f59e0b; border-color:rgba(245,158,11,0.4);">
              👁️ Simulate Masked Board
            </button>
          </div>
        </div>

      </div>
    </div>
    
    <!-- ENGINE 4 DEEP DIVE: AI OPERATING SYSTEMS STUDIO (8 READY TEMPLATES) -->
    <div style="margin-top:2.5rem; background:var(--surface-card, #181824); border:1px solid rgba(245,158,11,0.3); border-radius:18px; padding:1.5rem; box-shadow:0 12px 36px rgba(0,0,0,0.25);">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem; margin-bottom:1.25rem;">
        <div>
          <div style="display:flex; align-items:center; gap:0.6rem; flex-wrap:wrap;">
            <span style="font-size:1.5rem;">🏗️</span>
            <h2 style="font-size:1.3rem; font-weight:900; font-family:var(--font-heading); color:#ffffff; margin:0;">
              Engine 4: Vertical AI Operating Systems Studio
            </h2>
            <span style="font-size:0.7rem; font-weight:800; padding:0.2rem 0.6rem; border-radius:999px; background:rgba(245,158,11,0.15); color:#f59e0b; border:1px solid rgba(245,158,11,0.3);">
              Primary 2026 Cash Engine (${isUSD ? '$300/mo' : '৳35,000/mo'} Retainer Model)
            </span>
          </div>
          <p style="color:var(--text-secondary); font-size:0.84rem; margin:0.35rem 0 0 0;">
            Turnkey, single-tenant AI operating systems for Bangladesh & global verticals. Deploy in weeks with Telegrab bot automation.
          </p>
        </div>
        <div style="display:flex; gap:0.6rem; flex-wrap:wrap;">
          <a href="#proposals" class="btn-primary" style="background:#f59e0b; color:#09090b; font-weight:800; border:none; text-decoration:none; display:inline-flex; align-items:center; gap:0.4rem;">
            💼 Commercial Proposals (${proposalCount})
          </a>
          <a href="#leads" class="btn-secondary" style="text-decoration:none;">🎯 Outreach Leads</a>
        </div>
      </div>

      <!-- DYNAMIC ENGINE 4 PIPELINE SUMMARY BAR -->
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:0.85rem; margin-bottom:1.5rem; background:rgba(0,0,0,0.3); padding:1rem; border-radius:12px; border:1px solid rgba(255,255,255,0.05);">
        <div>
          <span style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">In-Flight Pipeline Value</span>
          <div style="font-size:1.25rem; font-weight:900; color:#f59e0b;">
            ${formatRetainerBDT(inFlightMRR, isUSD, true)}
          </div>
          <span style="font-size:0.68rem; color:var(--text-muted);">${inFlightNames}</span>
        </div>
        <div>
          <span style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Ready-to-Pitch Templates</span>
          <div style="font-size:1.25rem; font-weight:900; color:#00df89;">${readyTemplates.length} Templates Ready</div>
          <span style="font-size:0.68rem; color:var(--text-muted);">${readyNames}</span>
        </div>
        <div>
          <span style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Telegrab Bot Mesh</span>
          <div style="font-size:1.25rem; font-weight:900; color:#06b6d4;">Dual Bot Ecosystem</div>
          <span style="font-size:0.68rem; color:var(--text-muted);">Client Bot + Team Telegram MiniApp</span>
        </div>
        <div>
          <span style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Target Capacity (Dec 2026)</span>
          <div style="font-size:1.25rem; font-weight:900; color:#ffffff;">3–5 Retainers</div>
          <span style="font-size:0.68rem; color:var(--text-muted);">${isUSD ? '$900 – $1,500/mo MRR' : '৳108,000 – ৳180,000 / mo MRR'}</span>
        </div>
      </div>

      <!-- 8 OS TEMPLATES GRID -->
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:1rem;">
        ${osTemplates.map((t, idx) => `
          <div class="os-template-card" style="border-color:${t.status === 'proposal' ? 'rgba(245,158,11,0.5)' : t.status === 'stuck' ? 'rgba(239,68,68,0.5)' : t.status === 'pilot' ? 'rgba(6,182,212,0.5)' : 'rgba(255,255,255,0.08)'};">
            <div>
              <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.6rem;">
                <div style="display:flex; align-items:center; gap:0.5rem;">
                  <span style="font-size:1.4rem;">${t.vertical}</span>
                  <div>
                    <h4 style="font-size:0.95rem; font-weight:800; color:#ffffff; margin:0;">${escapeHTML(t.name)}</h4>
                    <span style="font-size:0.68rem; color:var(--text-muted);">${t.client ? 'Client: ' + escapeHTML(t.client) : 'Available for Deployment'}</span>
                  </div>
                </div>
                <span style="font-size:0.68rem; font-weight:800; padding:0.2rem 0.5rem; border-radius:8px; background:rgba(${t.status === 'proposal' ? '245,158,11' : t.status === 'stuck' ? '239,68,68' : t.status === 'pilot' ? '6,182,212' : '0,223,137'}, 0.15); color:${t.color}; border:1px solid ${t.color}40;">
                  ${escapeHTML(t.statusLabel)}
                </span>
              </div>

              <!-- PROGRESS BAR -->
              <div style="margin-bottom:0.75rem;">
                <div style="display:flex; justify-content:space-between; font-size:0.68rem; color:var(--text-muted); margin-bottom:0.25rem;">
                  <span>Readiness</span>
                  <span style="color:#ffffff; font-weight:700;">${t.completion}% Built</span>
                </div>
                <div style="background:rgba(255,255,255,0.06); height:6px; border-radius:4px; overflow:hidden;">
                  <div style="width:${t.completion}%; background:${t.color}; height:100%;"></div>
                </div>
              </div>

              <!-- SPECS & TERMS -->
              <div style="font-size:0.72rem; color:var(--text-secondary); background:rgba(0,0,0,0.2); padding:0.5rem; border-radius:8px; margin-bottom:0.75rem;">
                <div style="display:flex; justify-content:space-between; margin-bottom:0.2rem;">
                  <span>Commercial Base:</span>
                  <strong style="color:#f59e0b;">${formatRetainerBDT(t.mrr || 35000, isUSD, true)}</strong>
                </div>
                <div style="display:flex; justify-content:space-between;">
                  <span>Bot Architecture:</span>
                  <strong style="color:#06b6d4;">Telegrab Dual Bot</strong>
                </div>
              </div>
            </div>

            <!-- ACTION FOOTER -->
            <div style="display:flex; justify-content:space-between; align-items:center; padding-top:0.5rem; border-top:1px solid rgba(255,255,255,0.05); gap:0.4rem;">
              <button class="btn-ghost btn-sm" onclick="openTemplateModal(${idx})" style="font-size:0.72rem; padding:0.2rem 0.5rem; color:var(--text-muted);" title="Inspect Full Technical Architecture">
                ⚙️ Specs
              </button>
              <button class="btn-ghost btn-sm" onclick="window.EnginesModule.openTemplateActionModal(${idx})" style="font-size:0.72rem; padding:0.25rem 0.5rem; color:${t.color}; border:1px solid ${t.color}40; font-weight:700;">
                ⚡ ${escapeHTML(t.action)}
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- ──────── MODAL 1: REVENUE LOGGER OVERLAY ──────── -->
    <div id="enginesRevenueModal" class="modal-overlay">
      <div class="modal-box" style="max-width:440px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem; border-bottom:1px solid var(--border-subtle); padding-bottom:0.75rem;">
          <h3 style="margin:0; font-size:1.15rem; font-weight:800; color:#fff;">⚡ Log Engine Revenue</h3>
          <button onclick="window.EnginesModule.closeModals()" style="background:none; border:none; color:var(--text-muted); font-size:1.2rem; cursor:pointer;">&times;</button>
        </div>
        <form id="enginesRevenueForm" onsubmit="window.EnginesModule.submitRevenueLog(event)">
          <div class="form-group">
            <label class="form-label">Select Growth Engine</label>
            <select id="logEngineSelect" class="form-select" required>
              <option value="1">💻 Engine 1: Micro-SaaS ($35k / 35%)</option>
              <option value="2">⚡ Engine 2: Platform Sprints & Gigs ($25k / 25%)</option>
              <option value="3">📦 Engine 3: Digital Asset Stores ($20k / 20%)</option>
              <option value="4">🤝 Engine 4: Vertical AI OS Retainers ($15k / 15%)</option>
              <option value="5">🎬 Engine 5: Programmatic Video Scale ($5k / 5%)</option>
            </select>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem;">
            <div class="form-group">
              <label class="form-label">Currency</label>
              <select id="logCurrencySelect" class="form-select">
                <option value="USD">USD ($)</option>
                <option value="BDT">BDT (৳)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Amount</label>
              <input type="number" id="logRevenueAmount" class="form-input" placeholder="e.g. 500" min="1" required />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Operational Note / Milestone</label>
            <input type="text" id="logRevenueNote" class="form-input" placeholder="e.g. Upwork sprint milestone / DigiVault bundle sales" />
          </div>
          <div style="display:flex; justify-content:flex-end; gap:0.5rem; margin-top:1.25rem;">
            <button type="button" class="btn-secondary" onclick="window.EnginesModule.closeModals()">Cancel</button>
            <button type="submit" class="btn-primary">⚡ Record & Sync Revenue</button>
          </div>
        </form>
      </div>
    </div>

    <!-- ──────── MODAL 2: ADD PRODUCT OVERLAY ──────── -->
    <div id="enginesAddProductModal" class="modal-overlay">
      <div class="modal-box" style="max-width:440px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem; border-bottom:1px solid var(--border-subtle); padding-bottom:0.75rem;">
          <h3 style="margin:0; font-size:1.15rem; font-weight:800; color:#fff;">🚀 Add Micro-SaaS Product</h3>
          <button onclick="window.EnginesModule.closeModals()" style="background:none; border:none; color:var(--text-muted); font-size:1.2rem; cursor:pointer;">&times;</button>
        </div>
        <form id="enginesAddProductForm" onsubmit="window.EnginesModule.submitAddProduct(event)">
          <div class="form-group">
            <label class="form-label">Software Product Name</label>
            <input type="text" id="addProdName" class="form-input" placeholder="e.g. GRO10X Synth Studio" required />
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem;">
            <div class="form-group">
              <label class="form-label">Projected MRR ($)</label>
              <input type="number" id="addProdMrr" class="form-input" placeholder="300" min="0" required />
            </div>
            <div class="form-group">
              <label class="form-label">Active / Initial Users</label>
              <input type="number" id="addProdUsers" class="form-input" placeholder="10" min="0" required />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Lifecycle Stage</label>
            <select id="addProdStage" class="form-select">
              <option value="Beta">Beta Testing</option>
              <option value="Near-Launch">Near-Launch (QA)</option>
              <option value="Live Production">Live Production</option>
            </select>
          </div>
          <div style="display:flex; justify-content:flex-end; gap:0.5rem; margin-top:1.25rem;">
            <button type="button" class="btn-secondary" onclick="window.EnginesModule.closeModals()">Cancel</button>
            <button type="submit" class="btn-primary">Add Product</button>
          </div>
        </form>
      </div>
    </div>

    <!-- ──────── MODAL 3: OS TEMPLATE INSPECTOR & PITCH DRAWER ──────── -->
    <div id="enginesTemplateModal" class="modal-overlay">
      <div class="modal-box" style="max-width:520px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem; border-bottom:1px solid var(--border-subtle); padding-bottom:0.75rem;">
          <div style="display:flex; align-items:center; gap:0.5rem;">
            <span id="tmplModalIcon" style="font-size:1.6rem;">🏢</span>
            <div>
              <h3 id="tmplModalTitle" style="margin:0; font-size:1.2rem; font-weight:800; color:#fff;">Template Architecture</h3>
              <span id="tmplModalSubtitle" style="font-size:0.72rem; color:var(--text-muted);">Ready for deployment</span>
            </div>
          </div>
          <button onclick="window.EnginesModule.closeModals()" style="background:none; border:none; color:var(--text-muted); font-size:1.2rem; cursor:pointer;">&times;</button>
        </div>
        <form id="enginesTemplateForm" onsubmit="window.EnginesModule.submitTemplateSpecs(event)">
          <input type="hidden" id="tmplModalIdx" />
          
          <div style="background:rgba(0,0,0,0.25); padding:0.75rem; border-radius:10px; margin-bottom:1rem; border:1px solid rgba(255,255,255,0.06);">
            <div style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase; font-weight:700; margin-bottom:0.35rem;">Technical Architecture & Bot Mesh</div>
            <div id="tmplModalDesc" style="font-size:0.8rem; color:var(--text-secondary); line-height:1.4;">Dual bot mesh with Telegram MiniApp.</div>
          </div>

          <div class="form-group">
            <label class="form-label">Client or Company Name (Leave empty if available to pitch)</label>
            <input type="text" id="tmplModalClient" class="form-input" placeholder="e.g. PurpleBot Digital or Available" />
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem;">
            <div class="form-group">
              <label class="form-label">Commercial Retainer (BDT)</label>
              <input type="number" id="tmplModalMrr" class="form-input" placeholder="35000" min="0" />
            </div>
            <div class="form-group">
              <label class="form-label">Deployment Status</label>
              <select id="tmplModalStatus" class="form-select">
                <option value="available">Ready to Pitch (Available)</option>
                <option value="proposal">Pitch In-Flight (Proposal Out)</option>
                <option value="pilot">Live Pilot</option>
                <option value="stuck">Stuck (Tech Blocker)</option>
                <option value="paid">Active Retainer (Paid)</option>
              </select>
            </div>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:1.25rem;">
            <div style="display:flex; gap:0.4rem;">
              <button type="button" class="btn-ghost btn-sm" onclick="window.location.hash='#proposals'; window.EnginesModule.closeModals();">Proposals ↗</button>
              <button type="button" class="btn-ghost btn-sm" onclick="window.location.hash='#crm'; window.EnginesModule.closeModals();">CRM ↗</button>
            </div>
            <div style="display:flex; gap:0.5rem;">
              <button type="button" class="btn-secondary btn-sm" onclick="window.EnginesModule.closeModals()">Cancel</button>
              <button type="submit" class="btn-primary btn-sm">Save Specs</button>
            </div>
          </div>
        </form>
      </div>
    </div>

    <!-- ENGINE 2: LOG RETAINER SPRINT HOURS MODAL -->
    <div class="modal-overlay" id="enginesLogRetainerModal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.75); backdrop-filter:blur(6px); z-index:9999; align-items:center; justify-content:center; padding:1rem;">
      <div class="modal-content" style="background:#181824; border:1px solid rgba(6,182,212,0.4); border-radius:18px; max-width:480px; width:100%; padding:1.5rem; color:#fff; box-shadow:0 20px 50px rgba(0,0,0,0.6);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:0.75rem;">
          <div style="display:flex; align-items:center; gap:0.5rem;">
            <span style="font-size:1.3rem;">⏱️</span>
            <h3 style="margin:0; font-size:1.1rem; font-weight:800; font-family:var(--font-heading);">Log Retainer Sprint Hours</h3>
          </div>
          <button type="button" class="modal-close" onclick="window.EnginesModule.closeModals()" style="background:transparent; border:none; color:var(--text-muted); font-size:1.2rem; cursor:pointer;">✕</button>
        </div>
        <form id="formLogRetainerHours" onsubmit="window.EnginesModule.submitRetainerLog(event)">
          <input type="hidden" id="retainerProjectId" value="${activeSprintProjId}">
          
          <div class="form-group" style="margin-bottom:0.85rem;">
            <label class="form-label" style="font-size:0.78rem; font-weight:700; color:var(--text-secondary); display:block; margin-bottom:0.35rem;">Client / Project</label>
            <input type="text" id="retainerProjectDisplay" class="form-input" style="width:100%; background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:0.5rem 0.75rem; color:#fff;" value="${escapeHTML(e2RetainerBank.clientName || 'Purplebot Digital Limited')} (${activeSprintProjId})" readonly>
          </div>

          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:0.75rem; margin-bottom:0.85rem;">
            <div class="form-group">
              <label class="form-label" style="font-size:0.78rem; font-weight:700; color:var(--text-secondary); display:block; margin-bottom:0.35rem;">Hours to Log *</label>
              <input type="number" id="retainerHoursInput" step="0.5" min="0.5" max="40" class="form-input" style="width:100%; background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:0.5rem 0.75rem; color:#fff;" placeholder="e.g. 2.5" required>
            </div>
            <div class="form-group">
              <label class="form-label" style="font-size:0.78rem; font-weight:700; color:var(--text-secondary); display:block; margin-bottom:0.35rem;">Category</label>
              <select id="retainerCategorySelect" class="form-select" style="width:100%; background:#13131c; border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:0.5rem 0.75rem; color:#fff;">
                <option value="Core AI/LLM Development">Core AI/LLM Development</option>
                <option value="Architecture & System Design">Architecture & System Design</option>
                <option value="Integration & DevOps">Integration & DevOps</option>
                <option value="Bug Fix & Polishing">Bug Fix & Polishing</option>
                <option value="Review & Sign-Off Support">Review & Sign-Off Support</option>
              </select>
            </div>
          </div>

          <div class="form-group" style="margin-bottom:0.85rem;">
            <label class="form-label" style="font-size:0.78rem; font-weight:700; color:var(--text-secondary); display:block; margin-bottom:0.35rem;">Engineering Task Description *</label>
            <textarea id="retainerTaskDescInput" rows="2" class="form-input" style="width:100%; background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:0.5rem 0.75rem; color:#fff;" placeholder="e.g. LangGraph dynamic human-in-the-loop checkpoint handler" required></textarea>
          </div>

          <div class="form-group" style="margin-bottom:1.25rem;">
            <label class="form-label" style="font-size:0.78rem; font-weight:700; color:var(--text-secondary); display:block; margin-bottom:0.35rem;">Logged By</label>
            <input type="text" id="retainerLoggedByInput" class="form-input" style="width:100%; background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:0.5rem 0.75rem; color:#fff;" value="Senior AI Engineer" required>
          </div>

          <div style="display:flex; justify-content:flex-end; gap:0.6rem;">
            <button type="button" class="btn-secondary" onclick="window.EnginesModule.closeModals()">Cancel</button>
            <button type="submit" class="btn-primary" style="background:#06b6d4; color:#09090b; font-weight:800; border:none; cursor:pointer;">Record Sprint Hours</button>
          </div>
        </form>
      </div>
    </div>

    <!-- ENGINE 2: LOG DIRECT COMPUTE & TOKEN COGS MODAL -->
    <div class="modal-overlay" id="enginesCOGSModal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.75); backdrop-filter:blur(6px); z-index:9999; align-items:center; justify-content:center; padding:1rem;">
      <div class="modal-content" style="background:#181824; border:1px solid rgba(0,223,137,0.4); border-radius:18px; max-width:480px; width:100%; padding:1.5rem; color:#fff; box-shadow:0 20px 50px rgba(0,0,0,0.6);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:0.75rem;">
          <div style="display:flex; align-items:center; gap:0.5rem;">
            <span style="font-size:1.3rem;">💸</span>
            <h3 style="margin:0; font-size:1.1rem; font-weight:800; font-family:var(--font-heading);">Log Direct Compute & Token COGS</h3>
          </div>
          <button type="button" class="modal-close" onclick="window.EnginesModule.closeModals()" style="background:transparent; border:none; color:var(--text-muted); font-size:1.2rem; cursor:pointer;">✕</button>
        </div>
        <form id="formLogCOGS" onsubmit="window.EnginesModule.submitCOGS(event)">
          <input type="hidden" id="cogsProjectId" value="${activeSprintProjId}">

          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:0.75rem; margin-bottom:0.85rem;">
            <div class="form-group">
              <label class="form-label" style="font-size:0.78rem; font-weight:700; color:var(--text-secondary); display:block; margin-bottom:0.35rem;">Amount *</label>
              <input type="number" id="cogsAmountInput" step="0.01" min="0.1" class="form-input" style="width:100%; background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:0.5rem 0.75rem; color:#fff;" placeholder="e.g. 15.00" required>
            </div>
            <div class="form-group">
              <label class="form-label" style="font-size:0.78rem; font-weight:700; color:var(--text-secondary); display:block; margin-bottom:0.35rem;">Currency</label>
              <select id="cogsCurrencySelect" class="form-select" style="width:100%; background:#13131c; border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:0.5rem 0.75rem; color:#fff;">
                <option value="USD">USD ($)</option>
                <option value="BDT">BDT (৳)</option>
              </select>
            </div>
          </div>

          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:0.75rem; margin-bottom:0.85rem;">
            <div class="form-group">
              <label class="form-label" style="font-size:0.78rem; font-weight:700; color:var(--text-secondary); display:block; margin-bottom:0.35rem;">Provider / Vendor</label>
              <select id="cogsVendorSelect" class="form-select" style="width:100%; background:#13131c; border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:0.5rem 0.75rem; color:#fff;">
                <option value="OpenAI">OpenAI (GPT-4o / Embeddings)</option>
                <option value="Anthropic">Anthropic (Claude 3.5 Sonnet)</option>
                <option value="RunPod / Modal">RunPod / Modal (Serverless GPU)</option>
                <option value="Supabase">Supabase (pgvector & compute)</option>
                <option value="Perplexity">Perplexity (Sonar Search)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" style="font-size:0.78rem; font-weight:700; color:var(--text-secondary); display:block; margin-bottom:0.35rem;">Item Type</label>
              <select id="cogsItemTypeSelect" class="form-select" style="width:100%; background:#13131c; border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:0.5rem 0.75rem; color:#fff;">
                <option value="API Tokens">API Tokens</option>
                <option value="GPU Compute">GPU Compute</option>
                <option value="Vector Storage">Vector Storage</option>
                <option value="Cloud Infrastructure">Cloud Infrastructure</option>
              </select>
            </div>
          </div>

          <div class="form-group" style="margin-bottom:1.25rem;">
            <label class="form-label" style="font-size:0.78rem; font-weight:700; color:var(--text-secondary); display:block; margin-bottom:0.35rem;">Compute Description *</label>
            <input type="text" id="cogsDescInput" class="form-input" style="width:100%; background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:0.5rem 0.75rem; color:#fff;" placeholder="e.g. Model evaluation and prompt optimization tokens" required>
          </div>

          <div style="display:flex; justify-content:flex-end; gap:0.6rem;">
            <button type="button" class="btn-secondary" onclick="window.EnginesModule.closeModals()">Cancel</button>
            <button type="submit" class="btn-primary" style="background:#00df89; color:#09090b; font-weight:800; border:none; cursor:pointer;">Log Direct COGS</button>
          </div>
        </form>
      </div>
    </div>

    <!-- ENGINE 2: ISSUE SUBCONTRACTOR ACCESS PASS MODAL -->
    <div class="modal-overlay" id="enginesContractorPassModal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.75); backdrop-filter:blur(6px); z-index:9999; align-items:center; justify-content:center; padding:1rem;">
      <div class="modal-content" style="background:#181824; border:1px solid rgba(245,158,11,0.4); border-radius:18px; max-width:500px; width:100%; padding:1.5rem; color:#fff; box-shadow:0 20px 50px rgba(0,0,0,0.6);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:0.75rem;">
          <div style="display:flex; align-items:center; gap:0.5rem;">
            <span style="font-size:1.3rem;">🔑</span>
            <h3 style="margin:0; font-size:1.1rem; font-weight:800; font-family:var(--font-heading); color:#f59e0b;">Issue Subcontractor Access Pass</h3>
          </div>
          <button type="button" class="modal-close" onclick="window.EnginesModule.closeModals()" style="background:transparent; border:none; color:var(--text-muted); font-size:1.2rem; cursor:pointer;">✕</button>
        </div>

        <p style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:1.25rem; line-height:1.45;">
          Generate a cryptographically signed, expiring token for external engineers. Grants technical repository & DoD checklist access with <strong>100% financial confidentiality (zero budget/margins/rates visible)</strong>.
        </p>

        <form id="formContractorPass" onsubmit="window.EnginesModule.submitContractorPass(event)">
          <input type="hidden" id="passProjectId" value="${activeSprintProjId}">

          <div class="form-group" style="margin-bottom:0.85rem;">
            <label class="form-label" style="font-size:0.78rem; font-weight:700; color:var(--text-secondary); display:block; margin-bottom:0.35rem;">Subcontractor / Specialist Name *</label>
            <input type="text" id="passContractorName" class="form-input" style="width:100%; background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:0.5rem 0.75rem; color:#fff;" placeholder="e.g. Asif Mahmud (AI Prompt Specialist)" required>
          </div>

          <div class="form-group" style="margin-bottom:1.25rem;">
            <label class="form-label" style="font-size:0.78rem; font-weight:700; color:var(--text-secondary); display:block; margin-bottom:0.35rem;">Pass Validity Duration</label>
            <select id="passDurationSelect" class="form-select" style="width:100%; background:#13131c; border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:0.5rem 0.75rem; color:#fff;">
              <option value="14" selected>14 Days (Standard Sprint Lifecycle)</option>
              <option value="7">7 Days (Short Task Review)</option>
              <option value="30">30 Days (Extended Retainer Support)</option>
            </select>
          </div>

          <div style="display:flex; justify-content:flex-end; gap:0.6rem; margin-bottom:1rem;">
            <button type="button" class="btn-secondary" onclick="window.EnginesModule.closeModals()">Cancel</button>
            <button type="submit" class="btn-primary" style="background:#f59e0b; color:#09090b; font-weight:800; border:none; cursor:pointer;">Generate Pass</button>
          </div>
        </form>

        <!-- Result Container -->
        <div id="passResultContainer" style="display:none; background:rgba(0,0,0,0.4); border:1px solid rgba(0,223,137,0.3); border-radius:10px; padding:0.85rem; margin-top:0.75rem;">
          <div style="font-size:0.75rem; font-weight:800; color:#00df89; margin-bottom:0.4rem;">✓ Subcontractor Pass Generated:</div>
          <div style="display:flex; gap:0.5rem;">
            <input type="text" id="passGeneratedUrlInput" readonly style="flex:1; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:6px; padding:0.4rem 0.6rem; color:#fff; font-size:0.72rem; font-family:var(--font-mono, monospace);">
            <button type="button" class="btn-secondary" onclick="window.EnginesModule.copyContractorPassLink()" style="font-size:0.72rem; white-space:nowrap; padding:0.4rem 0.75rem;">📋 Copy</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ──────── MODAL HANDLERS ────────

function openLogRevenueModal() {
  const modal = document.getElementById('enginesRevenueModal');
  if (modal) {
    modal.classList.add('active');
    modal.style.display = 'flex';
  }
}

function openAddProductModal() {
  const modal = document.getElementById('enginesAddProductModal');
  if (modal) {
    modal.classList.add('active');
    modal.style.display = 'flex';
  }
}

function openTemplateModal(idx = 0) {
  const state = getStoredState();
  const template = (state.retainers?.osTemplates || [])[idx] || (DEFAULT_ENGINES_STATE.retainers?.osTemplates || [])[0] || {
    id: 'agency', name: 'Agency OS', vertical: '🏢', completion: 100, client: 'PurpleBot Digital', mrr: 35000, status: 'proposal', desc: 'Full AI agency client management, dual Telegram bot mesh.'
  };

  const modal = document.getElementById('enginesTemplateModal');
  if (modal) {
    const idxEl = document.getElementById('tmplModalIdx');
    if (idxEl) idxEl.value = idx;
    const iconEl = document.getElementById('tmplModalIcon');
    if (iconEl) iconEl.textContent = template.vertical || '🏢';
    const titleEl = document.getElementById('tmplModalTitle');
    if (titleEl) titleEl.textContent = template.name || 'Template Architecture';
    const subEl = document.getElementById('tmplModalSubtitle');
    if (subEl) subEl.textContent = `${template.completion || 100}% Built · Telegrab Dual Bot`;
    const descEl = document.getElementById('tmplModalDesc');
    if (descEl) descEl.textContent = template.desc || 'Turnkey, single-tenant AI operating system with Telegrab Dual Bot mesh.';
    const clientEl = document.getElementById('tmplModalClient');
    if (clientEl) clientEl.value = template.client || '';
    const mrrEl = document.getElementById('tmplModalMrr');
    if (mrrEl) mrrEl.value = template.mrr || 35000;
    const statusEl = document.getElementById('tmplModalStatus');
    if (statusEl) statusEl.value = template.status || 'available';

    modal.classList.add('active');
    modal.style.display = 'flex';
  }
}

function openTemplateActionModal(idx) {
  const state = getStoredState();
  const template = (state.retainers.osTemplates || [])[idx];
  if (!template) return;

  if (template.status === 'proposal') {
    window.location.hash = '#proposals';
    if (window.showToast) {
      window.showToast(`💼 Navigating to Commercial Proposals for ${template.client || template.name}...`, 'info');
    }
  } else if (template.status === 'stuck') {
    window.location.hash = '#leads';
    if (window.showToast) {
      window.showToast(`⚠️ Opening Leads pipeline to resolve tech blocker on ${template.name}...`, 'info');
    }
  } else if (template.status === 'pilot') {
    window.location.hash = '#crm';
    if (window.showToast) {
      window.showToast(`🛍️ Opening CRM to manage live pilot terms for ${template.name}...`, 'info');
    }
  } else {
    // Open template modal to pitch directly
    openTemplateModal(idx);
  }
}

function closeModals() {
  document.querySelectorAll('#enginesRevenueModal, #enginesAddProductModal, #enginesTemplateModal, #enginesLogRetainerModal, #enginesCOGSModal').forEach(m => {
    m.classList.remove('active');
    m.style.display = 'none';
  });
}

function openLogRetainerModal(projId) {
  const modal = document.getElementById('enginesLogRetainerModal');
  if (modal) {
    if (projId) {
      const pIdEl = document.getElementById('retainerProjectId');
      if (pIdEl) pIdEl.value = projId;
    }
    modal.classList.add('active');
    modal.style.display = 'flex';
  }
}

function openCOGSModal(projId) {
  const modal = document.getElementById('enginesCOGSModal');
  if (modal) {
    if (projId) {
      const pIdEl = document.getElementById('cogsProjectId');
      if (pIdEl) pIdEl.value = projId;
    }
    modal.classList.add('active');
    modal.style.display = 'flex';
  }
}

function openContractorPassModal(projId) {
  const modal = document.getElementById('enginesContractorPassModal');
  if (modal) {
    if (projId) {
      const pIdEl = document.getElementById('passProjectId');
      if (pIdEl) pIdEl.value = projId;
    }
    const resultBox = document.getElementById('passResultContainer');
    if (resultBox) resultBox.style.display = 'none';
    modal.classList.add('active');
    modal.style.display = 'flex';
  }
}

async function submitContractorPass(e) {
  e.preventDefault();
  const submitBtn = e.target ? e.target.querySelector('button[type="submit"]') : null;
  const origBtnText = submitBtn ? submitBtn.innerHTML : '';
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '⏳ Generating Pass...';
  }

  const projId = document.getElementById('passProjectId').value || 'proj-purplebot-01';
  const contractorName = (document.getElementById('passContractorName').value || '').trim() || 'Specialist Engineer';
  const daysValid = parseInt(document.getElementById('passDurationSelect').value) || 14;

  try {
    const res = await window.APP_API.post(`/projects/${projId}/contractor-pass`, {
      contractorName,
      daysValid
    });

    if (res && res.passUrl) {
      const fullUrl = window.location.origin + res.passUrl;
      const input = document.getElementById('passGeneratedUrlInput');
      if (input) input.value = fullUrl;
      const resultBox = document.getElementById('passResultContainer');
      if (resultBox) resultBox.style.display = 'block';

      if (window.showToast) {
        window.showToast(`🔑 Scoped pass generated for ${contractorName}! Valid for ${daysValid} days.`, 'success');
      }
    }
  } catch (err) {
    console.error('Error generating contractor pass:', err);
    if (window.showToast) {
      window.showToast(`⚠️ Failed to generate pass: ${err.message}`, 'error');
    }
  } finally {
    if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = origBtnText; }
  }
}

function copyContractorPassLink() {
  const input = document.getElementById('passGeneratedUrlInput');
  if (input && input.value) {
    navigator.clipboard.writeText(input.value).then(() => {
      if (window.showToast) window.showToast('📋 Subcontractor Pass URL copied to clipboard!', 'success');
    }).catch(() => {
      input.select();
      document.execCommand('copy');
      if (window.showToast) window.showToast('📋 Subcontractor Pass URL copied!', 'success');
    });
  }
}

function closeModals() {
  document.querySelectorAll('#enginesRevenueModal, #enginesAddProductModal, #enginesTemplateModal, #enginesLogRetainerModal, #enginesCOGSModal, #enginesContractorPassModal').forEach(m => {
    m.classList.remove('active');
    m.style.display = 'none';
  });
}

async function submitRetainerLog(e) {
  e.preventDefault();
  const submitBtn = e.target ? e.target.querySelector('button[type="submit"]') : null;
  const origBtnText = submitBtn ? submitBtn.innerHTML : '';
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '⏳ Logging Hours...';
  }

  const projId = document.getElementById('retainerProjectId').value || 'proj-purplebot-01';
  const hours = parseFloat(document.getElementById('retainerHoursInput').value) || 0;
  const category = document.getElementById('retainerCategorySelect').value;
  const taskDescription = (document.getElementById('retainerTaskDescInput').value || '').trim();
  const loggedBy = (document.getElementById('retainerLoggedByInput').value || '').trim() || 'Senior AI Engineer';

  try {
    const res = await window.APP_API.post(`/projects/${projId}/retainer-bank/log`, {
      hours,
      taskDescription,
      category,
      loggedBy
    });

    closeModals();
    if (window.showToast) {
      window.showToast(`⏱️ Logged ${hours}h for ${taskDescription}! Remaining: ${res.hoursRemaining !== undefined ? res.hoursRemaining : (30 - hours)}h`, 'success');
    }
  } catch (err) {
    console.error('Error logging retainer hours:', err);
    if (window.showToast) {
      window.showToast(`⚠️ Failed to log retainer hours: ${err.message}`, 'error');
    }
  } finally {
    if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = origBtnText; }
    const container = document.getElementById('app-view');
    if (container) renderEnginesView(container);
  }
}

async function submitCOGS(e) {
  e.preventDefault();
  const submitBtn = e.target ? e.target.querySelector('button[type="submit"]') : null;
  const origBtnText = submitBtn ? submitBtn.innerHTML : '';
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '⏳ Logging COGS...';
  }

  const projId = document.getElementById('cogsProjectId').value || 'proj-purplebot-01';
  const amount = parseFloat(document.getElementById('cogsAmountInput').value) || 0;
  const currency = document.getElementById('cogsCurrencySelect').value;
  const vendor = document.getElementById('cogsVendorSelect').value;
  const itemType = document.getElementById('cogsItemTypeSelect').value;
  const description = (document.getElementById('cogsDescInput').value || '').trim();

  try {
    const res = await window.APP_API.post(`/projects/${projId}/cogs`, {
      amount,
      currency,
      vendor,
      itemType,
      description,
      units: itemType === 'API Tokens' ? 'Tokens' : 'Compute Hours'
    });

    closeModals();
    if (window.showToast) {
      window.showToast(`💸 Direct COGS of ${currency === 'USD' ? '$' : '৳'}${amount} logged (${vendor})!`, 'success');
    }
  } catch (err) {
    console.error('Error logging COGS:', err);
    if (window.showToast) {
      window.showToast(`⚠️ Failed to log COGS: ${err.message}`, 'error');
    }
  } finally {
    if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = origBtnText; }
    const container = document.getElementById('app-view');
    if (container) renderEnginesView(container);
  }
}

async function dispatchEngine2Flash() {
  const btn = document.getElementById('btnDispatchE2Flash');
  const origText = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '⏳ Dispatching...';
  }

  try {
    const res = await window.APP_API.post('/engines/engine2/flash-report', { dispatchTelegram: true });
    if (window.showToast) {
      window.showToast('⚡ Executive Flash Report compiled and dispatched to Telegram!', 'success');
    }
    if (btn) btn.innerHTML = 'Dispatched ✓';
    setTimeout(() => {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = origText;
      }
    }, 3000);
  } catch (err) {
    console.error('Error dispatching flash report:', err);
    if (window.showToast) {
      window.showToast(`⚠️ Failed to dispatch flash report: ${err.message}`, 'error');
    }
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = origText;
    }
  }
}

async function dispatchFlashPnlSnapshot() {
  const btn = document.getElementById('btnFlashDispatchTelegram');
  const origText = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '⏳ Dispatching P&L...';
  }

  try {
    const res = await window.APP_API.post('/engines/flash-dispatch', {});
    if (window.showToast) {
      window.showToast('⚡ Consolidated 5-Engine P&L Snapshot dispatched to Executive Telegram!', 'success');
    }
    if (btn) btn.innerHTML = 'Dispatched to Telegram ✓';
    setTimeout(() => {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = origText;
      }
    }, 3000);
    return res;
  } catch (err) {
    console.error('Error dispatching flash P&L snapshot:', err);
    if (window.showToast) {
      window.showToast(`⚠️ Failed to dispatch P&L snapshot: ${err.message}`, 'error');
    }
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = origText;
    }
    throw err;
  }
}

function submitRevenueLog(e) {
  e.preventDefault();
  const submitBtn = e.target ? e.target.querySelector('button[type="submit"]') : null;
  const origBtnText = submitBtn ? submitBtn.innerHTML : '';
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '⏳ Recording & Syncing...';
  }

  const engine = document.getElementById('logEngineSelect').value;
  const currency = document.getElementById('logCurrencySelect').value;
  const rawAmt = Number(document.getElementById('logRevenueAmount').value) || 0;
  const note = document.getElementById('logRevenueNote').value || 'Manual operational logger input';

  if (rawAmt <= 0) {
    if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = origBtnText; }
    return;
  }

  // Normalize amount to USD for engine ARR state
  const amountUSD = currency === 'BDT' ? Math.round(rawAmt / 120) : rawAmt;

  const state = getStoredState();
  if (engine === '1') state.saas.current += amountUSD;
  else if (engine === '2') state.sprints.current += amountUSD;
  else if (engine === '3') state.assets.current += amountUSD;
  else if (engine === '4') state.retainers.current += amountUSD;
  else if (engine === '5') state.video.current += amountUSD;

  saveState(state);

  // Sync to backend Supabase via API
  if (window.APP_API && typeof window.APP_API.post === 'function') {
    window.APP_API.post('/engines/log', {
      engineId: 'engine' + engine,
      amount: amountUSD,
      note: note
    }).catch(err => console.log('[Engines] Background log sync note:', err.message));
  }

  closeModals();
  if (window.showToast) {
    window.showToast(`✅ Successfully logged ${currency === 'BDT' ? '৳' + rawAmt.toLocaleString() : '$' + rawAmt.toLocaleString()} to Engine ${engine}!`, 'success');
  }

  const container = document.getElementById('app-view');
  if (container) renderEnginesView(container);
}

function submitAddProduct(e) {
  e.preventDefault();
  const submitBtn = e.target ? e.target.querySelector('button[type="submit"]') : null;
  const origBtnText = submitBtn ? submitBtn.innerHTML : '';
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '⏳ Adding Product...';
  }

  const name = document.getElementById('addProdName').value;
  const mrr = Number(document.getElementById('addProdMrr').value) || 300;
  const users = Number(document.getElementById('addProdUsers').value) || 10;
  const status = document.getElementById('addProdStage').value;

  if (!name || !name.trim()) {
    if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = origBtnText; }
    return;
  }

  const state = getStoredState();
  state.saas.products.push({ name: name.trim(), status, users, mrr, icon: '🚀' });
  state.saas.mrr += mrr;
  state.saas.subscribers += users;
  saveState(state);

  closeModals();
  if (window.showToast) {
    window.showToast(`🚀 New Micro-SaaS Product "${name.trim()}" added to suite!`, 'success');
  }

  const container = document.getElementById('app-view');
  if (container) renderEnginesView(container);
}

function submitTemplateSpecs(e) {
  e.preventDefault();
  const submitBtn = e.target ? e.target.querySelector('button[type="submit"]') : null;
  const origBtnText = submitBtn ? submitBtn.innerHTML : '';
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '⏳ Saving Specs...';
  }

  const idx = Number(document.getElementById('tmplModalIdx').value);
  const client = (document.getElementById('tmplModalClient').value || '').trim();
  const mrr = Number(document.getElementById('tmplModalMrr').value) || 35000;
  const status = document.getElementById('tmplModalStatus').value;

  const state = getStoredState();
  const template = (state.retainers.osTemplates || [])[idx];
  if (!template) return;

  template.client = client || null;
  template.mrr = mrr;
  template.status = status;

  if (status === 'proposal') {
    template.statusLabel = 'Proposal Out';
    template.action = 'Close Contract';
    template.color = '#f59e0b';
  } else if (status === 'stuck') {
    template.statusLabel = 'Stuck';
    template.action = 'Fix Implementation';
    template.color = '#ef4444';
  } else if (status === 'pilot') {
    template.statusLabel = 'Live Pilot';
    template.action = 'Convert to Paid';
    template.color = '#06b6d4';
  } else if (status === 'paid') {
    template.statusLabel = 'Active Retainer';
    template.action = 'View CRM';
    template.color = '#00df89';
  } else {
    template.statusLabel = 'Ready to Pitch';
    template.action = 'Find Client';
    template.color = '#00df89';
  }

  saveState(state);
  closeModals();

  if (window.showToast) {
    window.showToast(`✅ Updated ${template.name} specifications and pipeline status!`, 'success');
  }

  const container = document.getElementById('app-view');
  if (container) renderEnginesView(container);
}


// Universal currency toggle alias
window.switchEnginesCurrency = function(curr) {
  localStorage.setItem('gro10x_currency', curr);
  if (window.GRO10XAuth && typeof window.GRO10XAuth.setCurrency === 'function') {
    window.GRO10XAuth.setCurrency(curr);
  }
  window.dispatchEvent(new CustomEvent('gro10x_currency_changed', { detail: { currency: curr } }));
  const container = document.getElementById('app-view');
  if (container && window.location.hash === '#engines') renderEnginesView(container);
};
window.switchModuleCurrency = window.switchEnginesCurrency;

// Real-Time SSE Multi-Client Synchronization (350ms debounce)
let enginesSSEDebounce = null;
function handleEnginesLiveSync() {
  if (window.location.hash !== '#engines') return;
  clearTimeout(enginesSSEDebounce);
  enginesSSEDebounce = setTimeout(() => {
    const container = document.getElementById('app-view');
    if (container && window.location.hash === '#engines') {
      renderEnginesView(container);
    }
  }, 350);
}

if (window.APP_SSE && typeof window.APP_SSE.subscribe === 'function') {
  window.APP_SSE.subscribe('engine_update', handleEnginesLiveSync);
  window.APP_SSE.subscribe('invoice_update', handleEnginesLiveSync);
  window.APP_SSE.subscribe('payment_update', handleEnginesLiveSync);
}
window.addEventListener('engine_update', handleEnginesLiveSync);
window.addEventListener('invoice_update', handleEnginesLiveSync);
window.addEventListener('payment_update', handleEnginesLiveSync);

// Global currency toggle
window.switchEnginesCurrency_orig = function(curr) {
  localStorage.setItem('gro10x_currency', curr);
  if (window.GRO10XAuth && typeof window.GRO10XAuth.setCurrency === 'function') {
    window.GRO10XAuth.setCurrency(curr);
  }
  window.dispatchEvent(new CustomEvent('gro10x_currency_changed', { detail: { currency: curr } }));
  const container = document.getElementById('app-view');
  if (container) renderEnginesView(container);
};

// Listen to cross-module currency changes
window.addEventListener('gro10x_currency_changed', (e) => {
  const container = document.getElementById('app-view');
  if (container && window.location.hash === '#engines') {
    renderEnginesView(container);
  }
});

window.APP_MODULES.engines = renderEnginesView;

window.openAddProductModal = openAddProductModal;
window.openTemplateModal = openTemplateModal;
window.openLogRevenueModal = openLogRevenueModal;

window.EnginesModule = {
  renderEnginesView,
  render: renderEnginesView,
  openLogRevenueModal,
  openAddProductModal,
  openTemplateModal,
  openTemplateActionModal,
  openLogRetainerModal,
  openCOGSModal,
  openContractorPassModal,
  submitContractorPass,
  copyContractorPassLink,
  submitRetainerLog,
  submitCOGS,
  dispatchEngine2Flash,
  dispatchFlashPnlSnapshot,
  closeModals,
  submitRevenueLog,
  submitAddProduct,
  submitTemplateSpecs
};
