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
    current: 4200,
    subscribers: 28,
    mrr: 1400,
    products: [
      { name: 'AI Prompt Optimizer V2', status: 'Live', users: 142, mrr: 710 },
      { name: 'ComfyUI Node Visualizer', status: 'Beta', users: 65, mrr: 450 },
      { name: 'Multi-Bot Auto Engine', status: 'Live', users: 34, mrr: 240 }
    ]
  },
  sprints: {
    target: 25000,
    current: 6000,
    activeSprints: 4,
    avgValue: 1500,
    pipeline: [
      { client: 'Nexus Retail Corp', sprint: 'ComfyUI Product Pipeline', val: 1500, status: 'In Review' },
      { client: 'FinGrowth Global', sprint: 'Custom RAG Chatbot', val: 1500, status: 'Active' },
      { client: 'AeroTech Studio', sprint: 'Photorealistic Visuals', val: 1500, status: 'Active' },
      { client: 'HealthAI Labs', sprint: 'Prompt Architecture', val: 1500, status: 'Proposal' }
    ]
  },
  assets: {
    target: 20000,
    current: 3100,
    listings: 52,
    downloads: 418,
    stores: [
      { name: 'Etsy AI Design Vault', items: 34, monthlySales: 125, rev: 1850 },
      { name: 'Gumroad ComfyUI Workflows', items: 12, monthlySales: 54, rev: 890 },
      { name: 'CreativeMarket Synth Kits', items: 6, monthlySales: 18, rev: 360 }
    ]
  },
  retainers: {
    target: 15000,
    current: 4500,
    activeCount: 3,
    accounts: [
      { client: 'BrandPulse UK', tier: 'Growth Retainer ($1,500/mo)', renewal: '2026-09-01', health: 'Healthy' },
      { client: 'Solvent AI Singapore', tier: 'Growth Retainer ($1,500/mo)', renewal: '2026-09-10', health: 'Healthy' },
      { client: 'Apex Media Group', tier: 'Growth Retainer ($1,500/mo)', renewal: '2026-09-15', health: 'Healthy' }
    ]
  },
  video: {
    target: 5000,
    current: 950,
    monthlyViews: 48500,
    avgRPM: 8.5,
    channels: [
      { name: 'YouTube — AI Workflow Labs', subs: '4.2K', monthlyViews: '32K', yield: 620 },
      { name: 'TikTok — 10x AI Automation', subs: '12.8K', monthlyViews: '16.5K', yield: 330 }
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
              <span style="font-size:1.4rem;">🚀</span>
              <div>
                <h3 style="font-size:1.05rem; font-weight:800; color:#ffffff; margin:0;">Engine 2: Sprint Contracts</h3>
                <span style="font-size:0.72rem; color:#06b6d4; font-weight:700;">Target: $25,000 (25% Share)</span>
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
        <div style="margin-top:1rem; padding-top:0.75rem; border-top:1px solid rgba(255,255,255,0.05); display:flex; justify-content:space-between; align-items:center;">
          <a href="#kanban" class="btn-ghost btn-sm">Open Kanban Pipeline</a>
          <a href="/reviewroom.html" class="btn-secondary btn-sm">Review Room →</a>
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
          <button class="btn-ghost btn-sm" onclick="alert('Asset Auto-Publisher connects directly with Etsy and Gumroad.')">+ Publish Asset Pack</button>
          <a href="#assets" class="btn-secondary btn-sm">Hardware & Assets →</a>
        </div>
      </div>

      <!-- ENGINE 4: CORE AGENCY RETAINERS -->
      <div class="card-glass" style="border:1px solid rgba(245,158,11,0.3); border-radius:16px; padding:1.25rem; display:flex; flex-direction:column; justify-content:space-between;">
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <span style="font-size:1.4rem;">🤝</span>
              <div>
                <h3 style="font-size:1.05rem; font-weight:800; color:#ffffff; margin:0;">Engine 4: Agency Retainers</h3>
                <span style="font-size:0.72rem; color:#f59e0b; font-weight:700;">Target: $15,000 (15% Share)</span>
              </div>
            </div>
            <span class="badge" style="background:rgba(245,158,11,0.15); color:#f59e0b; font-weight:800; border:1px solid rgba(245,158,11,0.3); border-radius:12px; padding:0.2rem 0.6rem; font-size:0.75rem;">
              $${state.retainers.current.toLocaleString()} Generated
            </span>
          </div>

          <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:0.5rem; background:rgba(0,0,0,0.2); padding:0.75rem; border-radius:10px; margin-bottom:1rem;">
            <div>
              <span style="font-size:0.7rem; color:var(--text-muted);">Active Retainers</span>
              <div style="font-size:1.1rem; font-weight:800; color:#f59e0b;">${state.retainers.activeCount} Clients</div>
            </div>
            <div>
              <span style="font-size:0.7rem; color:var(--text-muted);">Monthly Contract Value</span>
              <div style="font-size:1.1rem; font-weight:800; color:#ffffff;">$${state.retainers.current}/mo</div>
            </div>
          </div>

          <h4 style="font-size:0.78rem; color:var(--text-muted); text-transform:uppercase; margin-bottom:0.5rem;">Active Partner Accounts</h4>
          <div style="display:flex; flex-direction:column; gap:0.4rem;">
            ${state.retainers.accounts.map(a => `
              <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.03); padding:0.4rem 0.6rem; border-radius:8px; font-size:0.8rem;">
                <div>
                  <strong style="color:#ffffff;">${a.client}</strong>
                  <div style="font-size:0.7rem; color:var(--text-muted);">${a.tier} · Renewal: ${a.renewal}</div>
                </div>
                <span style="color:#f59e0b; font-weight:700;">🟢 Active</span>
              </div>
            `).join('')}
          </div>
        </div>
        <div style="margin-top:1rem; padding-top:0.75rem; border-top:1px solid rgba(255,255,255,0.05); display:flex; justify-content:space-between; align-items:center;">
          <a href="#crm" class="btn-ghost btn-sm">View CRM Accounts</a>
          <a href="/partners.html" class="btn-secondary btn-sm">Partner Portal →</a>
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

window.APP_MODULES.engines = renderEnginesView;

window.EnginesModule = {
  renderEnginesView,
  render: renderEnginesView,
  openLogRevenueModal,
  openAddProductModal
};
