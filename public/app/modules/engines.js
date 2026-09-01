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
    current: 0,
    subscribers: 0,
    mrr: 0,
    products: []
  },
  sprints: {
    target: 25000,
    current: 0,
    gigsLive: 4,
    activeSprints: 0,
    avgValue: 0,
    pipeline: []
  },
  assets: {
    target: 20000,
    current: 0,
    listings: 1300,
    downloads: 0,
    digivaultSales: 0,
    stores: [
      { name: 'DigiVault (AI Subscriptions — WhatsApp)', items: 5, monthlySales: 0, rev: 0 },
      { name: '13-Brand Etsy/POD Portfolio', items: 1300, monthlySales: 0, rev: 0 }
    ]
  },
  retainers: {
    target: 15000,
    current: 0,
    activeCount: 0,
    accounts: [],
    osTemplates: [
      { name: 'Agency OS',       vertical: '🏢', completion: 100, client: 'PurpleBot Digital', mrr: 0,     status: 'proposal',    statusLabel: 'Proposal Out',      action: 'Close Contract',   color: '#f59e0b' },
      { name: 'Laundry OS',      vertical: '🧺', completion: 80,  client: 'Stuck client',      mrr: 0,     status: 'stuck',       statusLabel: 'Stuck',             action: 'Fix Implementation', color: '#ef4444' },
      { name: 'Clinic OS',       vertical: '🏥', completion: 95,  client: null,                mrr: 0,     status: 'available',   statusLabel: 'Ready to Pitch',    action: 'Find Client',      color: '#00df89' },
      { name: 'Hospitality OS',  vertical: '🏨', completion: 71,  client: null,                mrr: 0,     status: 'available',   statusLabel: 'Ready to Pitch',    action: 'Find Client',      color: '#00df89' },
      { name: 'Wholesale OS',    vertical: '🛒', completion: 85,  client: null,                mrr: 0,     status: 'available',   statusLabel: 'Ready to Pitch',    action: 'Find Client',      color: '#00df89' },
      { name: 'HR/Staffing OS',  vertical: '👔', completion: 100, client: null,                mrr: 0,     status: 'available',   statusLabel: 'Ready to Pitch',    action: 'Find Client',      color: '#00df89' },
      { name: 'Commerce OS',     vertical: '🛍️', completion: 80,  client: "Rob's (pilot)",     mrr: 0,     status: 'pilot',       statusLabel: 'Live Pilot',        action: 'Convert to Paid',  color: '#06b6d4' },
      { name: 'Distribution OS', vertical: '🚚', completion: 100, client: null,                mrr: 0,     status: 'available',   statusLabel: 'Ready to Pitch',    action: 'Find City Partner', color: '#00df89' }
    ]
  },
  video: {
    target: 5000,
    current: 0,
    monthlyViews: 0,
    avgRPM: 0,
    channels: [
      { name: 'Grow Bangla',  platform: 'YouTube',         subs: 427, monthlyViews: 805,  yield: 0 },
      { name: 'PILUTICS',     platform: 'YouTube',         subs: 218, monthlyViews: 1200, yield: 0 },
      { name: 'Bong Hits',    platform: 'YouTube + TikTok', subs: 85,  monthlyViews: 1200, yield: 0 }
    ]
  }
};


function getStoredState() {
  try {
    const saved = localStorage.getItem('gro10x_engines_state');
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.warn('Engines state load error:', e);
  }
  return DEFAULT_ENGINES_STATE;
}

function saveState(state) {
  try {
    localStorage.setItem('gro10x_engines_state', JSON.stringify(state));
  } catch (e) {
    console.warn('Engines state save error:', e);
  }
}

async function renderEnginesView(container) {
  const state = getStoredState();
  let isLive = false;

  try {
    if (window.APP_API && typeof window.APP_API.get === 'function') {
      const apiData = await window.APP_API.get('/engines/summary');
      if (apiData && apiData.success && apiData.engines) {
        isLive = true;
        if (apiData.engines.engine1) state.saas.current = Math.max(state.saas.current, apiData.engines.engine1.current || 0);
        if (apiData.engines.engine2) state.retainers.current = Math.max(state.retainers.current, apiData.engines.engine2.current || 0);
        if (apiData.engines.engine3) state.assets.current = Math.max(state.assets.current, apiData.engines.engine3.current || 0);
        if (apiData.engines.engine4) state.sprints.current = Math.max(state.sprints.current, apiData.engines.engine4.current || 0);
        if (apiData.engines.engine5) state.video.current = Math.max(state.video.current, apiData.engines.engine5.current || 0);
      }
    }
  } catch (e) {
    console.log('[Engines] Using local fallback state:', e.message);
  }

  const totalTarget = 100000;
  const totalCurrent = state.saas.current + state.sprints.current + state.assets.current + state.retainers.current + state.video.current;
  const totalPercent = Math.min(100, Math.round((totalCurrent / totalTarget) * 100));
  const netProfitProjected = Math.round(totalCurrent * 0.65);

  container.innerHTML = `
    <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem; margin-bottom:1.5rem;">
      <div>
        <div style="display:flex; align-items:center; gap:0.6rem; margin-bottom:0.25rem;">
          <h1 style="font-size:1.6rem; font-weight:900; font-family:var(--font-heading); color:var(--text-primary); margin:0;">
            🚀 5-Engine Growth Operations Cockpit
          </h1>
          <span style="font-size:0.7rem; font-weight:800; padding:0.2rem 0.5rem; border-radius:999px; background:${isLive ? 'rgba(0,223,137,0.15)' : 'rgba(255,255,255,0.08)'}; color:${isLive ? '#00df89' : 'var(--text-muted)'}; border:1px solid ${isLive ? 'rgba(0,223,137,0.3)' : 'rgba(255,255,255,0.15)'};">
            ${isLive ? '🟢 Live Supabase Synced' : '💾 Local Workspace'}
          </span>
        </div>
        <p style="color:var(--text-secondary); font-size:0.88rem; margin:0;">
          Track, operate, and compound the 5 autonomous growth engines towards the <strong>$100,000 Year 1 ARR</strong> goal.
        </p>
      </div>
      <div style="display:flex; gap:0.5rem;">
        <button class="btn-secondary" onclick="window.open('/investors.html', '_blank')">
          💼 View Investor Hub
        </button>
        <button class="btn-primary" onclick="EnginesModule.openLogRevenueModal()">
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
            $${totalCurrent.toLocaleString()} <span style="font-size:1.1rem; color:var(--text-muted); font-weight:500;">/ $100,000 Target</span>
          </div>
        </div>
        <div style="display:flex; gap:1.5rem; text-align:right;">
          <div>
            <span style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase;">65% Net Profit</span>
            <div style="font-size:1.3rem; font-weight:800; color:var(--brand-primary, #00df89);">
              $${netProfitProjected.toLocaleString()}
            </div>
          </div>
          <div>
            <span style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase;">Expense Cap</span>
            <div style="font-size:1.3rem; font-weight:800; color:#fbbf24;">
              $35,000
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

    <!-- 5 ENGINES COCKPIT GRID -->
    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(360px, 1fr)); gap:1.25rem;">
      
      <!-- ENGINE 1: MICRO-SAAS -->
      <div class="card-glass" style="border:1px solid rgba(0,223,137,0.3); border-radius:16px; padding:1.25rem; display:flex; flex-direction:column; justify-content:space-between;">
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <span style="font-size:1.4rem;">💻</span>
              <div>
                <h3 style="font-size:1.05rem; font-weight:800; color:#ffffff; margin:0;">Engine 1: Micro-SaaS</h3>
                <span style="font-size:0.72rem; color:var(--brand-primary, #00df89); font-weight:700;">Target: $35,000 (35% Share)</span>
              </div>
            </div>
            <span class="badge" style="background:rgba(0,223,137,0.15); color:#00df89; font-weight:800; border:1px solid rgba(0,223,137,0.3); border-radius:12px; padding:0.2rem 0.6rem; font-size:0.75rem;">
              $${state.saas.current.toLocaleString()} Generated
            </span>
          </div>

          <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:0.5rem; background:rgba(0,0,0,0.2); padding:0.75rem; border-radius:10px; margin-bottom:1rem;">
            <div>
              <span style="font-size:0.7rem; color:var(--text-muted);">Current MRR</span>
              <div style="font-size:1.1rem; font-weight:800; color:#00df89;">$${state.saas.mrr}/mo</div>
            </div>
            <div>
              <span style="font-size:0.7rem; color:var(--text-muted);">Active Licenses</span>
              <div style="font-size:1.1rem; font-weight:800; color:#ffffff;">${state.saas.subscribers} Users</div>
            </div>
          </div>

          <h4 style="font-size:0.78rem; color:var(--text-muted); text-transform:uppercase; margin-bottom:0.5rem;">Active Software Suite</h4>
          <div style="display:flex; flex-direction:column; gap:0.4rem;">
            ${state.saas.products.map(p => `
              <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.03); padding:0.4rem 0.6rem; border-radius:8px; font-size:0.8rem;">
                <div>
                  <strong style="color:#ffffff;">${p.name}</strong>
                  <span style="font-size:0.7rem; color:var(--text-muted); margin-left:0.4rem;">(${p.users} users)</span>
                </div>
                <span style="color:#00df89; font-weight:700;">+$${p.mrr}/mo</span>
              </div>
            `).join('')}
          </div>
        </div>
        <div style="margin-top:1rem; padding-top:0.75rem; border-top:1px solid rgba(255,255,255,0.05); display:flex; justify-content:space-between; align-items:center;">
          <button class="btn-ghost btn-sm" onclick="EnginesModule.openAddProductModal()">+ Add Product</button>
          <a href="/designs/index.html" class="btn-secondary btn-sm">Inspect UI Mockups →</a>
        </div>
      </div>

      <!-- ENGINE 2: FREELANCING & SPRINTS -->
      <div class="card-glass" style="border:1px solid rgba(6,182,212,0.3); border-radius:16px; padding:1.25rem; display:flex; flex-direction:column; justify-content:space-between;">
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <span style="font-size:1.4rem;">⚡</span>
              <div>
                <h3 style="font-size:1.05rem; font-weight:800; color:#ffffff; margin:0;">Engine 2: Platform Revenue</h3>
                <span style="font-size:0.72rem; color:#06b6d4; font-weight:700;">Fiverr · Upwork · Chrome Store · Target: $25,000</span>
              </div>
            </div>
            <span class="badge" style="background:rgba(6,182,212,0.15); color:#06b6d4; font-weight:800; border:1px solid rgba(6,182,212,0.3); border-radius:12px; padding:0.2rem 0.6rem; font-size:0.75rem;">
              $${state.sprints.current.toLocaleString()} Generated
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
            ${state.sprints.pipeline.map(p => `
              <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.03); padding:0.4rem 0.6rem; border-radius:8px; font-size:0.8rem;">
                <div>
                  <strong style="color:#ffffff;">${p.client}</strong>
                  <div style="font-size:0.7rem; color:var(--text-muted);">${p.sprint}</div>
                </div>
                <span style="color:#06b6d4; font-weight:700;">$${p.val}</span>
              </div>
            `).join('')}
          </div>
        </div>
        <div style="margin-top:1rem; padding-top:0.75rem; border-top:1px solid rgba(255,255,255,0.05); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
          <a href="#gigs" class="btn-primary btn-sm" style="background:#00df89; color:#09090b; font-weight:800; border:none; text-decoration:none; display:inline-flex; align-items:center; gap:0.3rem;">⚡ Open Marketplace Gigs (7 Ready) →</a>
          <a href="#kanban" class="btn-ghost btn-sm">Kanban Pipeline</a>
        </div>
      </div>

      <!-- ENGINE 3: DIGITAL ASSET SALES -->
      <div class="card-glass" style="border:1px solid rgba(168,85,247,0.3); border-radius:16px; padding:1.25rem; display:flex; flex-direction:column; justify-content:space-between;">
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <span style="font-size:1.4rem;">📦</span>
              <div>
                <h3 style="font-size:1.05rem; font-weight:800; color:#ffffff; margin:0;">Engine 3: Digital Asset Store</h3>
                <span style="font-size:0.72rem; color:#a855f7; font-weight:700;">Target: $20,000 (20% Share)</span>
              </div>
            </div>
            <span class="badge" style="background:rgba(168,85,247,0.15); color:#a855f7; font-weight:800; border:1px solid rgba(168,85,247,0.3); border-radius:12px; padding:0.2rem 0.6rem; font-size:0.75rem;">
              $${state.assets.current.toLocaleString()} Generated
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
            ${state.assets.stores.map(s => `
              <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.03); padding:0.4rem 0.6rem; border-radius:8px; font-size:0.8rem;">
                <div>
                  <strong style="color:#ffffff;">${s.name}</strong>
                  <div style="font-size:0.7rem; color:var(--text-muted);">${s.items} items · ${s.monthlySales} sold</div>
                </div>
                <span style="color:#a855f7; font-weight:700;">$${s.rev}</span>
              </div>
            `).join('')}
          </div>
        </div>
        <div style="margin-top:1rem; padding-top:0.75rem; border-top:1px solid rgba(255,255,255,0.05); display:flex; justify-content:space-between; align-items:center;">
          <a href="#brands" class="btn-primary btn-sm">🛍️ Brand Command Center →</a>
          <a href="#dbm" class="btn-secondary btn-sm">DBM Ops →</a>
        </div>
      </div>

      <!-- ENGINE 4: CORE AGENCY RETAINERS & OS STUDIO -->
      <div class="card-glass" style="border:1px solid rgba(245,158,11,0.3); border-radius:16px; padding:1.25rem; display:flex; flex-direction:column; justify-content:space-between;">
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <span style="font-size:1.4rem;">🤝</span>
              <div>
                <h3 style="font-size:1.05rem; font-weight:800; color:#ffffff; margin:0;">Engine 4: Agency OS Studio</h3>
                <span style="font-size:0.72rem; color:#f59e0b; font-weight:700;">8 Vertical OS Templates · Target: $15,000</span>
              </div>
            </div>
            <span class="badge" style="background:rgba(245,158,11,0.15); color:#f59e0b; font-weight:800; border:1px solid rgba(245,158,11,0.3); border-radius:12px; padding:0.2rem 0.6rem; font-size:0.75rem;">
              $${state.retainers.current.toLocaleString()} / ৳35k Baseline
            </span>
          </div>

          <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:0.5rem; background:rgba(0,0,0,0.2); padding:0.75rem; border-radius:10px; margin-bottom:1rem;">
            <div>
              <span style="font-size:0.7rem; color:var(--text-muted);">Deployed OS / Pipeline</span>
              <div style="font-size:1.1rem; font-weight:800; color:#f59e0b;">${(state.retainers.osTemplates || []).filter(t => t.client).length} Active/In-Flight</div>
            </div>
            <div>
              <span style="font-size:0.7rem; color:var(--text-muted);">Ready OS Templates</span>
              <div style="font-size:1.1rem; font-weight:800; color:#00df89;">${(state.retainers.osTemplates || []).filter(t => !t.client).length} Ready to Pitch</div>
            </div>
          </div>

          <h4 style="font-size:0.78rem; color:var(--text-muted); text-transform:uppercase; margin-bottom:0.5rem;">OS Templates Snapshot</h4>
          <div style="display:flex; flex-direction:column; gap:0.4rem;">
            ${(state.retainers.osTemplates || []).slice(0, 4).map(t => `
              <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.03); padding:0.4rem 0.6rem; border-radius:8px; font-size:0.8rem;">
                <div style="display:flex; align-items:center; gap:0.4rem;">
                  <span>${t.vertical}</span>
                  <strong style="color:#ffffff;">${t.name}</strong>
                  <span style="font-size:0.7rem; color:var(--text-muted);">${t.client ? '· ' + t.client : ''}</span>
                </div>
                <span style="color:${t.color}; font-size:0.7rem; font-weight:700; background:rgba(255,255,255,0.05); padding:0.15rem 0.4rem; border-radius:6px;">${t.statusLabel}</span>
              </div>
            `).join('')}
          </div>
        </div>
        <div style="margin-top:1rem; padding-top:0.75rem; border-top:1px solid rgba(255,255,255,0.05); display:flex; justify-content:space-between; align-items:center;">
          <a href="#proposals" class="btn-primary btn-sm" style="background:#f59e0b; color:#09090b; font-weight:800; border:none;">💼 View Proposals</a>
          <a href="#crm" class="btn-secondary btn-sm">CRM Accounts →</a>
        </div>
      </div>

      <!-- ENGINE 5: PROGRAMMATIC AI VIDEO SCALE -->
      <div class="card-glass" style="border:1px solid rgba(239,68,68,0.3); border-radius:16px; padding:1.25rem; display:flex; flex-direction:column; justify-content:space-between;">
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <span style="font-size:1.4rem;">🎬</span>
              <div>
                <h3 style="font-size:1.05rem; font-weight:800; color:#ffffff; margin:0;">Engine 5: Video & Media Scale</h3>
                <span style="font-size:0.72rem; color:#ef4444; font-weight:700;">Target: $5,000 (5% Share)</span>
              </div>
            </div>
            <span class="badge" style="background:rgba(239,68,68,0.15); color:#ef4444; font-weight:800; border:1px solid rgba(239,68,68,0.3); border-radius:12px; padding:0.2rem 0.6rem; font-size:0.75rem;">
              $${state.video.current.toLocaleString()} Generated
            </span>
          </div>

          <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:0.5rem; background:rgba(0,0,0,0.2); padding:0.75rem; border-radius:10px; margin-bottom:1rem;">
            <div>
              <span style="font-size:0.7rem; color:var(--text-muted);">Monthly Views</span>
              <div style="font-size:1.1rem; font-weight:800; color:#ef4444;">${state.video.monthlyViews.toLocaleString()}</div>
            </div>
            <div>
              <span style="font-size:0.7rem; color:var(--text-muted);">Avg RPM Yield</span>
              <div style="font-size:1.1rem; font-weight:800; color:#ffffff;">$${state.video.avgRPM}</div>
            </div>
          </div>

          <h4 style="font-size:0.78rem; color:var(--text-muted); text-transform:uppercase; margin-bottom:0.5rem;">Active Channels & Feeds</h4>
          <div style="display:flex; flex-direction:column; gap:0.4rem;">
            ${state.video.channels.map(c => `
              <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.03); padding:0.4rem 0.6rem; border-radius:8px; font-size:0.8rem;">
                <div>
                  <strong style="color:#ffffff;">${c.name}</strong>
                  <div style="font-size:0.7rem; color:var(--text-muted);">${c.subs} Subs · ${c.monthlyViews} views/mo</div>
                </div>
                <span style="color:#ef4444; font-weight:700;">+$${c.yield}/mo</span>
              </div>
            `).join('')}
          </div>
        </div>
        <div style="margin-top:1rem; padding-top:0.75rem; border-top:1px solid rgba(255,255,255,0.05); display:flex; justify-content:space-between; align-items:center;">
          <a href="#social" class="btn-ghost btn-sm">Open Social Planner</a>
          <button class="btn-secondary btn-sm" onclick="alert('Autonomous Video Batch Dispatch triggers ComfyUI & ElevenLabs rendering pipeline.')">Queue Video Batch</button>
        </div>
      </div>

    </div>
    
    <!-- ENGINE 4 DEEP DIVE: AI OPERATING SYSTEMS STUDIO (8 READY TEMPLATES) -->
    <div style="margin-top:2.5rem; background:var(--surface-card, #181824); border:1px solid rgba(245,158,11,0.3); border-radius:18px; padding:1.5rem; box-shadow:0 12px 36px rgba(0,0,0,0.25);">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem; margin-bottom:1.25rem;">
        <div>
          <div style="display:flex; align-items:center; gap:0.6rem;">
            <span style="font-size:1.5rem;">🏗️</span>
            <h2 style="font-size:1.3rem; font-weight:900; font-family:var(--font-heading); color:#ffffff; margin:0;">
              Engine 4: Vertical AI Operating Systems Studio
            </h2>
            <span style="font-size:0.7rem; font-weight:800; padding:0.2rem 0.6rem; border-radius:999px; background:rgba(245,158,11,0.15); color:#f59e0b; border:1px solid rgba(245,158,11,0.3);">
              Primary 2026 Cash Engine (৳35,000/mo Retainer Model)
            </span>
          </div>
          <p style="color:var(--text-secondary); font-size:0.84rem; margin:0.35rem 0 0 0;">
            Turnkey, single-tenant AI operating systems for Bangladesh & global verticals. Deploy in weeks with Telegrab bot automation.
          </p>
        </div>
        <div style="display:flex; gap:0.6rem;">
          <a href="#proposals" class="btn-primary" style="background:#f59e0b; color:#09090b; font-weight:800; border:none; text-decoration:none; display:inline-flex; align-items:center; gap:0.4rem;">
            💼 Commercial Proposals (${(state.retainers.osTemplates || []).filter(t => t.status === 'proposal').length})
          </a>
          <a href="#leads" class="btn-secondary" style="text-decoration:none;">🎯 Outreach Leads</a>
        </div>
      </div>

      <!-- ENGINE 4 PIPELINE SUMMARY BAR -->
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:0.85rem; margin-bottom:1.5rem; background:rgba(0,0,0,0.3); padding:1rem; border-radius:12px; border:1px solid rgba(255,255,255,0.05);">
        <div>
          <span style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">In-Flight Pipeline Value</span>
          <div style="font-size:1.25rem; font-weight:900; color:#f59e0b;">৳70,000 / mo</div>
          <span style="font-size:0.68rem; color:var(--text-muted);">PurpleBot (৳35k) + Laundry Mama (৳35k)</span>
        </div>
        <div>
          <span style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Ready-to-Pitch Templates</span>
          <div style="font-size:1.25rem; font-weight:900; color:#00df89;">5 Templates Ready</div>
          <span style="font-size:0.68rem; color:var(--text-muted);">Clinic · Hospitality · Wholesale · HR · Dist.</span>
        </div>
        <div>
          <span style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Telegrab Bot Mesh</span>
          <div style="font-size:1.25rem; font-weight:900; color:#06b6d4;">Dual Bot Ecosystem</div>
          <span style="font-size:0.68rem; color:var(--text-muted);">Client Bot + Team Telegram MiniApp</span>
        </div>
        <div>
          <span style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Target Capacity (Dec 2026)</span>
          <div style="font-size:1.25rem; font-weight:900; color:#ffffff;">3–5 Retainers</div>
          <span style="font-size:0.68rem; color:var(--text-muted);">৳105,000 – ৳175,000 / mo MRR</span>
        </div>
      </div>

      <!-- 8 OS TEMPLATES GRID -->
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:1rem;">
        ${(state.retainers.osTemplates || []).map((t, idx) => `
          <div style="background:rgba(255,255,255,0.03); border:1px solid ${t.status === 'proposal' ? 'rgba(245,158,11,0.5)' : t.status === 'stuck' ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.08)'}; border-radius:14px; padding:1rem; display:flex; flex-direction:column; justify-content:space-between; transition:transform 0.2s ease;">
            <div>
              <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.6rem;">
                <div style="display:flex; align-items:center; gap:0.5rem;">
                  <span style="font-size:1.4rem;">${t.vertical}</span>
                  <div>
                    <h4 style="font-size:0.95rem; font-weight:800; color:#ffffff; margin:0;">${t.name}</h4>
                    <span style="font-size:0.68rem; color:var(--text-muted);">${t.client ? 'Client: ' + t.client : 'Available for Deployment'}</span>
                  </div>
                </div>
                <span style="font-size:0.68rem; font-weight:800; padding:0.2rem 0.5rem; border-radius:8px; background:rgba(${t.status === 'proposal' ? '245,158,11' : t.status === 'stuck' ? '239,68,68' : '0,223,137'}, 0.15); color:${t.color}; border:1px solid ${t.color}40;">
                  ${t.statusLabel}
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
                  <strong style="color:#f59e0b;">৳35,000/mo</strong>
                </div>
                <div style="display:flex; justify-content:space-between;">
                  <span>Bot Architecture:</span>
                  <strong style="color:#06b6d4;">Telegrab Dual Bot</strong>
                </div>
              </div>
            </div>

            <!-- ACTION FOOTER -->
            <div style="display:flex; justify-content:space-between; align-items:center; pt:0.5rem; border-top:1px solid rgba(255,255,255,0.05); gap:0.4rem;">
              <span style="font-size:0.68rem; color:var(--text-muted);">Action:</span>
              <button class="btn-ghost btn-sm" onclick="EnginesModule.openTemplateActionModal(${idx})" style="font-size:0.72rem; padding:0.25rem 0.5rem; color:${t.color}; border:1px solid ${t.color}40;">
                ⚡ ${t.action}
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function openLogRevenueModal() {
  const engine = prompt('Select Engine (1: SaaS, 2: Sprints, 3: Assets, 4: Retainers, 5: Video):', '1');
  if (!engine) return;
  const amountStr = prompt('Enter Revenue Amount in USD ($):', '500');
  const amount = Number(amountStr);
  if (!amount || isNaN(amount)) return;

  const state = getStoredState();
  if (engine === '1') state.saas.current += amount;
  else if (engine === '2') state.sprints.current += amount;
  else if (engine === '3') state.assets.current += amount;
  else if (engine === '4') state.retainers.current += amount;
  else if (engine === '5') state.video.current += amount;

  saveState(state);

  // Sync to backend Supabase if API available
  if (window.APP_API && typeof window.APP_API.post === 'function') {
    window.APP_API.post('/engines/log', {
      engineId: 'engine' + engine,
      amount: amount,
      note: 'Manual operational logger input'
    }).catch(e => console.log('[Engines] Background log sync note:', e.message));
  }

  if (window.GRO10XAuth && window.GRO10XAuth.toast) {
    window.GRO10XAuth.toast('✅ Logged $' + amount + ' to Engine ' + engine + ' successfully!', 'success');
  }
  const container = document.getElementById('app-view');
  if (container) renderEnginesView(container);
}

function openAddProductModal() {
  const name = prompt('Enter New Micro-SaaS Product Name:', 'GRO10X Synth Studio');
  if (!name) return;
  const mrr = Number(prompt('Projected Monthly MRR ($):', '300')) || 300;
  const state = getStoredState();
  state.saas.products.push({ name, status: 'Beta', users: 10, mrr });
  state.saas.mrr += mrr;
  state.saas.subscribers += 10;
  saveState(state);
  const container = document.getElementById('app-view');
  if (container) renderEnginesView(container);
}

function openTemplateActionModal(idx) {
  const state = getStoredState();
  const template = (state.retainers.osTemplates || [])[idx];
  if (!template) return;

  if (template.status === 'proposal') {
    window.location.hash = '#proposals';
    if (window.GRO10XAuth && window.GRO10XAuth.toast) {
      window.GRO10XAuth.toast(`💼 Navigating to Commercial Proposals for ${template.client} (${template.name})...`, 'info');
    }
  } else if (template.status === 'stuck') {
    if (confirm(`⚠️ ${template.name} is currently flagged as 'Stuck on Implementation' for ${template.client}.\n\nDo you want to open the Leads & Tech Pipeline to resolve the blocker?`)) {
      window.location.hash = '#leads';
    }
  } else if (template.status === 'pilot') {
    if (confirm(`🛍️ ${template.name} is currently running on live pilot (${template.client}).\n\nOpen CRM to review contract conversion terms?`)) {
      window.location.hash = '#crm';
    }
  } else {
    // Available to pitch
    const clientName = prompt(`🎯 Pitch ${template.name} (${template.vertical}) to a new B2B client:\nEnter Target Client or Company Name:`, '');
    if (clientName && clientName.trim()) {
      template.client = clientName.trim();
      template.status = 'proposal';
      template.statusLabel = 'Pitch In-Flight';
      template.color = '#f59e0b';
      template.action = 'Review Proposal';
      saveState(state);
      if (window.GRO10XAuth && window.GRO10XAuth.toast) {
        window.GRO10XAuth.toast(`✅ ${template.name} pitched to ${clientName}! Proposal logged.`, 'success');
      }
      const container = document.getElementById('app-view');
      if (container) renderEnginesView(container);
    }
  }
}

window.APP_MODULES.engines = renderEnginesView;

window.EnginesModule = {
  renderEnginesView,
  render: renderEnginesView,
  openLogRevenueModal,
  openAddProductModal,
  openTemplateActionModal
};
