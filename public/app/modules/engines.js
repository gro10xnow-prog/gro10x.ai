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

const DEFAULT_ENGINES_STATE = {
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
    digivaultSales: 0,
    stores: [
      { name: 'DigiVault (AI Subscriptions — WhatsApp)', items: 44, monthlySales: 0, rev: 0 },
      { name: '13-Brand Etsy/POD Portfolio', items: 1300, monthlySales: 0, rev: 0 }
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
  return `৳${num.toLocaleString()}`;
}

async function renderEnginesView(container) {
  const state = getStoredState();
  let isLive = false;
  let allPosts = [];

  const currentCurrency = localStorage.getItem('gro10x_currency') || 'USD';
  const isUSD = currentCurrency !== 'BDT';

  try {
    if (window.APP_API && typeof window.APP_API.get === 'function') {
      const [apiData, postsRes] = await Promise.all([
        window.APP_API.get('/engines/summary').catch(() => null),
        window.APP_API.get('/posts').catch(() => [])
      ]);
      if (Array.isArray(postsRes)) allPosts = postsRes;
      if (apiData && apiData.success && apiData.engines) {
        isLive = true;
        // Direct canonical 1-to-1 engine mapping
        if (apiData.engines.engine1) state.saas.current = Math.max(state.saas.current, apiData.engines.engine1.current || 0);
        if (apiData.engines.engine2) state.sprints.current = Math.max(state.sprints.current, apiData.engines.engine2.current || 0);
        if (apiData.engines.engine3) state.assets.current = Math.max(state.assets.current, apiData.engines.engine3.current || 0);
        if (apiData.engines.engine4) state.retainers.current = Math.max(state.retainers.current, apiData.engines.engine4.current || 0);
        if (apiData.engines.engine5) state.video.current = Math.max(state.video.current, apiData.engines.engine5.current || 0);
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
          Track, operate, and compound the 5 autonomous growth engines towards the <strong>${isUSD ? '$100,000' : '৳1.18 Crore'} Year 1 ARR</strong> goal.
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

    <!-- MASTER PROGRESS BANNER -->
    <div style="background:var(--surface-card, #181824); border:1px solid var(--border-subtle, #2e2e3e); border-radius:18px; padding:1.5rem; margin-bottom:1.75rem; box-shadow:0 10px 30px rgba(0,0,0,0.2);">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem; margin-bottom:1rem;">
        <div>
          <span style="font-size:0.75rem; font-weight:800; text-transform:uppercase; letter-spacing:0.06em; color:var(--brand-primary, #00df89);">Annual ARR Run Rate</span>
          <div style="font-size:2.2rem; font-weight:900; font-family:var(--font-heading); color:#ffffff;">
            ${isUSD ? `$${totalCurrent.toLocaleString()}` : formatBDT(totalCurrent * 118)}
            <span style="font-size:1.1rem; color:var(--text-muted); font-weight:500;">/ ${isUSD ? '$100,000 Target' : '৳1.18 Cr Target'}</span>
          </div>
        </div>
        <div style="display:flex; gap:1.5rem; text-align:right; flex-wrap:wrap;">
          <div>
            <span style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase;">65% Net Profit</span>
            <div style="font-size:1.3rem; font-weight:800; color:var(--brand-primary, #00df89);">
              ${isUSD ? `$${netProfitProjected.toLocaleString()}` : formatBDT(netProfitProjected * 118)}
            </div>
          </div>
          <div>
            <span style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase;">Expense Cap</span>
            <div style="font-size:1.3rem; font-weight:800; color:#fbbf24;">
              ${isUSD ? '$35,000' : '৳41.3 Lakh'}
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
                <span style="font-size:0.72rem; color:var(--brand-primary, #00df89); font-weight:700;">Target: ${isUSD ? '$35,000' : '৳41.3L'} (35%)</span>
              </div>
            </div>
            <span class="badge" style="background:rgba(0,223,137,0.15); color:#00df89; font-weight:800; border:1px solid rgba(0,223,137,0.3); border-radius:12px; padding:0.2rem 0.6rem; font-size:0.75rem;">
              ${isUSD ? `$${state.saas.current.toLocaleString()}` : formatBDT(state.saas.current * 118)}
            </span>
          </div>

          <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:0.5rem; background:rgba(0,0,0,0.2); padding:0.75rem; border-radius:10px; margin-bottom:1rem;">
            <div>
              <span style="font-size:0.7rem; color:var(--text-muted);">Current MRR</span>
              <div style="font-size:1.1rem; font-weight:800; color:#00df89;">${isUSD ? `$${state.saas.mrr}/mo` : `৳${(state.saas.mrr * 118).toLocaleString()}/mo`}</div>
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
                <span style="color:#00df89; font-weight:700; white-space:nowrap;">+$${p.mrr}/mo</span>
              </div>
            `).join('')}
          </div>
        </div>
        <div style="margin-top:1rem; padding-top:0.75rem; border-top:1px solid rgba(255,255,255,0.05); display:flex; justify-content:space-between; align-items:center;">
          <button class="btn-ghost btn-sm" onclick="window.EnginesModule.openAddProductModal()">+ Add Product</button>
          <a href="/designs/index.html" target="_blank" rel="noopener noreferrer" class="btn-secondary btn-sm">Inspect UI Mockups ↗</a>
        </div>
      </div>

      <!-- ENGINE 2: FREELANCING & SPRINTS -->
      <div class="card-glass engine-card-hover" style="border:1px solid rgba(6,182,212,0.3); border-radius:16px; padding:1.25rem; display:flex; flex-direction:column; justify-content:space-between;">
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <span style="font-size:1.4rem;">⚡</span>
              <div>
                <h3 style="font-size:1.05rem; font-weight:800; color:#ffffff; margin:0;">Engine 2: Platform Revenue</h3>
                <span style="font-size:0.72rem; color:#06b6d4; font-weight:700;">Target: ${isUSD ? '$25,000' : '৳29.5L'} (25%)</span>
              </div>
            </div>
            <span class="badge" style="background:rgba(6,182,212,0.15); color:#06b6d4; font-weight:800; border:1px solid rgba(6,182,212,0.3); border-radius:12px; padding:0.2rem 0.6rem; font-size:0.75rem;">
              ${isUSD ? `$${state.sprints.current.toLocaleString()}` : formatBDT(state.sprints.current * 118)}
            </span>
          </div>

          <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:0.5rem; background:rgba(0,0,0,0.2); padding:0.75rem; border-radius:10px; margin-bottom:1rem;">
            <div>
              <span style="font-size:0.7rem; color:var(--text-muted);">Active Sprints</span>
              <div style="font-size:1.1rem; font-weight:800; color:#06b6d4;">${state.sprints.activeSprints} Contracts</div>
            </div>
            <div>
              <span style="font-size:0.7rem; color:var(--text-muted);">Avg Sprint Value</span>
              <div style="font-size:1.1rem; font-weight:800; color:#ffffff;">$${state.sprints.avgValue}</div>
            </div>
          </div>

          <h4 style="font-size:0.78rem; color:var(--text-muted); text-transform:uppercase; margin-bottom:0.5rem;">Sprint Pipeline & Delivery</h4>
          <div style="display:flex; flex-direction:column; gap:0.4rem;">
            ${(state.sprints.pipeline || []).slice(0, 3).map(p => `
              <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.03); padding:0.4rem 0.6rem; border-radius:8px; font-size:0.8rem;">
                <div style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; padding-right:0.3rem;">
                  <strong style="color:#ffffff;">${escapeHTML(p.client)}</strong>
                  <div style="font-size:0.68rem; color:var(--text-muted); text-overflow:ellipsis; overflow:hidden;">${escapeHTML(p.sprint)}</div>
                </div>
                <span style="color:#06b6d4; font-weight:700; white-space:nowrap;">$${p.val}</span>
              </div>
            `).join('')}
          </div>
        </div>
        <div style="margin-top:1rem; padding-top:0.75rem; border-top:1px solid rgba(255,255,255,0.05); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
          <a href="#gigs" class="btn-primary btn-sm" style="background:#00df89; color:#09090b; font-weight:800; border:none; text-decoration:none; display:inline-flex; align-items:center; gap:0.3rem;">⚡ Gigs (${state.sprints.gigsLive || 7}) →</a>
          <a href="#kanban" class="btn-ghost btn-sm">Kanban ↗</a>
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
                <span style="font-size:0.72rem; color:#a855f7; font-weight:700;">Target: ${isUSD ? '$20,000' : '৳23.6L'} (20%)</span>
              </div>
            </div>
            <span class="badge" style="background:rgba(168,85,247,0.15); color:#a855f7; font-weight:800; border:1px solid rgba(168,85,247,0.3); border-radius:12px; padding:0.2rem 0.6rem; font-size:0.75rem;">
              ${isUSD ? `$${state.assets.current.toLocaleString()}` : formatBDT(state.assets.current * 118)}
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
                <span style="color:#a855f7; font-weight:700; white-space:nowrap;">$${s.rev}</span>
              </div>
            `).join('')}
          </div>
        </div>
        <div style="margin-top:1rem; padding-top:0.75rem; border-top:1px solid rgba(255,255,255,0.05); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.4rem;">
          <a href="#brands" class="btn-primary btn-sm" style="font-size:0.72rem;">🛍️ Brands →</a>
          <a href="#digistore" class="btn-secondary btn-sm" style="font-size:0.72rem;">🏪 DigiVault →</a>
          <a href="#dbm" class="btn-ghost btn-sm" style="font-size:0.72rem;">DBM</a>
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
                <span style="font-size:0.72rem; color:#f59e0b; font-weight:700;">Target: ${isUSD ? '$15,000' : '৳17.7L'} (15%)</span>
              </div>
            </div>
            <span class="badge" style="background:rgba(245,158,11,0.15); color:#f59e0b; font-weight:800; border:1px solid rgba(245,158,11,0.3); border-radius:12px; padding:0.2rem 0.6rem; font-size:0.75rem;">
              ${isUSD ? `$${state.retainers.current.toLocaleString()}` : formatBDT(state.retainers.current * 118)}
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
                <span style="font-size:0.72rem; color:#ef4444; font-weight:700;">Target: ${isUSD ? '$5,000' : '৳5.9L'} (5%)</span>
              </div>
            </div>
            <span class="badge" style="background:rgba(239,68,68,0.15); color:#ef4444; font-weight:800; border:1px solid rgba(239,68,68,0.3); border-radius:12px; padding:0.2rem 0.6rem; font-size:0.75rem;">
              ${isUSD ? `$${state.video.current.toLocaleString()}` : formatBDT(state.video.current * 118)}
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
                <span style="color:#ef4444; font-weight:700; white-space:nowrap;">+$${c.yield}/mo</span>
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
            ${isUSD ? `$${Math.round(inFlightMRR / 118).toLocaleString()}/mo` : `৳${inFlightMRR.toLocaleString()} / mo`}
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
          <span style="font-size:0.68rem; color:var(--text-muted);">${isUSD ? '$900 – $1,500/mo MRR' : '৳105,000 – ৳175,000 / mo MRR'}</span>
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
                  <strong style="color:#f59e0b;">${isUSD ? `$${Math.round((t.mrr || 35000) / 118)}/mo` : `৳${(t.mrr || 35000).toLocaleString()}/mo`}</strong>
                </div>
                <div style="display:flex; justify-content:space-between;">
                  <span>Bot Architecture:</span>
                  <strong style="color:#06b6d4;">Telegrab Dual Bot</strong>
                </div>
              </div>
            </div>

            <!-- ACTION FOOTER -->
            <div style="display:flex; justify-content:space-between; align-items:center; padding-top:0.5rem; border-top:1px solid rgba(255,255,255,0.05); gap:0.4rem;">
              <button class="btn-ghost btn-sm" onclick="window.EnginesModule.openTemplateModal(${idx})" style="font-size:0.72rem; padding:0.2rem 0.5rem; color:var(--text-muted);" title="Inspect Full Technical Architecture">
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

function openTemplateModal(idx) {
  const state = getStoredState();
  const template = (state.retainers.osTemplates || [])[idx];
  if (!template) return;

  const modal = document.getElementById('enginesTemplateModal');
  if (modal) {
    document.getElementById('tmplModalIdx').value = idx;
    document.getElementById('tmplModalIcon').textContent = template.vertical || '🏢';
    document.getElementById('tmplModalTitle').textContent = template.name;
    document.getElementById('tmplModalSubtitle').textContent = `${template.completion}% Built · Telegrab Dual Bot`;
    document.getElementById('tmplModalDesc').textContent = template.desc || 'Turnkey, single-tenant AI operating system with Telegrab Dual Bot mesh.';
    document.getElementById('tmplModalClient').value = template.client || '';
    document.getElementById('tmplModalMrr').value = template.mrr || 35000;
    document.getElementById('tmplModalStatus').value = template.status || 'available';

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
  document.querySelectorAll('#enginesRevenueModal, #enginesAddProductModal, #enginesTemplateModal').forEach(m => {
    m.classList.remove('active');
    m.style.display = 'none';
  });
}

function submitRevenueLog(e) {
  e.preventDefault();
  const engine = document.getElementById('logEngineSelect').value;
  const currency = document.getElementById('logCurrencySelect').value;
  const rawAmt = Number(document.getElementById('logRevenueAmount').value) || 0;
  const note = document.getElementById('logRevenueNote').value || 'Manual operational logger input';

  if (rawAmt <= 0) return;

  // Normalize amount to USD for engine ARR state
  const amountUSD = currency === 'BDT' ? Math.round(rawAmt / 118) : rawAmt;

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
  const name = document.getElementById('addProdName').value;
  const mrr = Number(document.getElementById('addProdMrr').value) || 300;
  const users = Number(document.getElementById('addProdUsers').value) || 10;
  const status = document.getElementById('addProdStage').value;

  if (!name || !name.trim()) return;

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

// Global currency toggle
window.switchEnginesCurrency = function(curr) {
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

window.EnginesModule = {
  renderEnginesView,
  render: renderEnginesView,
  openLogRevenueModal,
  openAddProductModal,
  openTemplateModal,
  openTemplateActionModal,
  closeModals,
  submitRevenueLog,
  submitAddProduct,
  submitTemplateSpecs
};
