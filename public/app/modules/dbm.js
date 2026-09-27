/**
 * public/app/modules/dbm.js
 * ─────────────────────────────────────────────────────────────────────────────
 * GRO10X Digital Brand Manager (DBM) Operations & Team Command Module v3.0
 * 
 * Manages the 4-person DBM Team operating the 13-brand digital empire:
 * 1. 4-Division Matrix & Brand Ownership Roster
 * 2. 8-Hour Daily Operating SOP & Listing Cadence (8 products/day target)
 * 3. Daily EOD Standup Submission & Async Log Stream (Cloud Persisted)
 * 4. QC 10-Point Quality Control Checklist Standard
 * 5. P&L Performance Bonus Tracker (5% net margin incentive ledger)
 * ─────────────────────────────────────────────────────────────────────────────
 */

window.APP_MODULES = window.APP_MODULES || {};

window.APP_MODULES.dbm = async function(container) {
  let currentTab = 'matrix';
  let selectedDbmFilter = null;
  let standupDivisionFilter = null;

  function getCurrency() {
    return localStorage.getItem('gro10x_currency') || 'USD';
  }

  function formatMoney(amount) {
    const curr = getCurrency();
    const val = Number(amount) || 0;
    if (curr === 'BDT') {
      return '৳' + Math.round(val * 120).toLocaleString();
    }
    return '$' + Math.round(val).toLocaleString();
  }

  async function getBrandsState() {
    try {
      const saved = localStorage.getItem('gro10x_brands_data');
      if (saved) return JSON.parse(saved);
    } catch (e) {}

    try {
      if (window.APP_API) {
        const res = await window.APP_API.get('/brands');
        if (res && res.brands) return res;
      }
    } catch (e) {}

    return null;
  }

  async function getDBMLogs() {
    let serverLogs = null;
    try {
      if (window.APP_API) {
        const res = await window.APP_API.get('/brands/dbm-logs');
        if (res && res.logs) serverLogs = res.logs;
      }
    } catch (e) {}

    // Flush any pending offline queue to server if online
    try {
      const offlineQueue = localStorage.getItem('gro10x_offline_standup_queue');
      if (offlineQueue && serverLogs) {
        const queuedItems = JSON.parse(offlineQueue);
        if (Array.isArray(queuedItems) && queuedItems.length > 0) {
          for (const item of queuedItems) {
            await window.APP_API.post('/brands/dbm-logs', item).catch(() => {});
          }
          localStorage.removeItem('gro10x_offline_standup_queue');
          const refreshed = await window.APP_API.get('/brands/dbm-logs').catch(() => null);
          if (refreshed && refreshed.logs) serverLogs = refreshed.logs;
        }
      }
    } catch (e) {}

    if (serverLogs) return serverLogs;

    try {
      const saved = localStorage.getItem('gro10x_dbm_standups');
      if (saved) return JSON.parse(saved);
    } catch (e) {}

    return [
      { date: new Date().toISOString().split('T')[0], dbmId: 1, brandName: 'PlannerQueenGro', listed: 8, revenue: 0, notes: 'Completed Batch 1 Hero daily & weekly planners' },
      { date: new Date().toISOString().split('T')[0], dbmId: 4, brandName: 'PromptVault', listed: 10, revenue: 0, notes: 'Configured Notion duplication templates for Midjourney prompts' }
    ];
  }

  const brandsState = (await getBrandsState()) || {
    brands: [
      { id: 1, name: 'PlannerQueenGro', dbmId: 1, target12mo: 24200, productsLive: 0, productsTarget: 100 },
      { id: 2, name: 'WildMutt Co.', dbmId: 2, target12mo: 33540, productsLive: 0, productsTarget: 100 },
      { id: 3, name: 'TinyDesks Studio', dbmId: 3, target12mo: 22050, productsLive: 0, productsTarget: 100 },
      { id: 4, name: 'LittleStarsLearning', dbmId: 3, target12mo: 17850, productsLive: 0, productsTarget: 100 },
      { id: 5, name: 'InkWrapped', dbmId: 1, target12mo: 20900, productsLive: 0, productsTarget: 100 },
      { id: 6, name: 'CozyThreads™', dbmId: 2, target12mo: 23200, productsLive: 0, productsTarget: 100 },
      { id: 7, name: 'ProudProfessional', dbmId: 2, target12mo: 20650, productsLive: 0, productsTarget: 100 },
      { id: 8, name: 'FiestaFoundry', dbmId: 1, target12mo: 21250, productsLive: 0, productsTarget: 100 },
      { id: 9, name: 'ZenWallCo', dbmId: 3, target12mo: 19100, productsLive: 0, productsTarget: 100 },
      { id: 10, name: 'SparkSVG', dbmId: 4, target12mo: 26400, productsLive: 0, productsTarget: 100 },
      { id: 11, name: 'PageForge Publishing', dbmId: 4, target12mo: 33716, productsLive: 0, productsTarget: 100 },
      { id: 12, name: 'LetterLab Fonts', dbmId: 4, target12mo: 20750, productsLive: 0, productsTarget: 100 },
      { id: 13, name: 'PromptVault', dbmId: 4, target12mo: 74560, productsLive: 0, productsTarget: 100 }
    ],
    dbms: [
      { id: 1, name: 'Anika Nower (GRO-002)', title: 'Digital Products Specialist (Division 1 Lead)', assignedBrands: [1, 5, 8], status: 'Active' },
      { id: 2, name: 'Division 2 Lead', title: 'POD & Apparel Products Lead', assignedBrands: [2, 6, 7], status: 'Active' },
      { id: 3, name: 'Division 3 Lead', title: 'B2B, Kids & Education Lead', assignedBrands: [3, 4, 9], status: 'Active' },
      { id: 4, name: 'Division 4 Lead', title: 'Tech, Fonts & AI Prompt Vaults Lead', assignedBrands: [10, 11, 12, 13], status: 'Active' }
    ]
  };

  let logs = await getDBMLogs();

  // Calculate master portfolio metrics
  const totalTargetAnnual = brandsState.brands.reduce((acc, b) => acc + (b.target12mo || 0), 0);
  const totalProductsTarget = brandsState.brands.reduce((acc, b) => acc + (b.productsTarget || 100), 0);
  const totalProductsLive = brandsState.brands.reduce((acc, b) => acc + (b.productsLive || 0), 0);

  function render() {
    const isBdt = getCurrency() === 'BDT';

    container.innerHTML = `
      <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem; margin-bottom:1.5rem;">
        <div>
          <div style="display:flex; align-items:center; gap:0.6rem; margin-bottom:0.3rem;">
            <h1 style="font-size:1.65rem; font-weight:900; font-family:var(--font-heading); color:var(--text-primary); margin:0;">
              👤 DBM Operations & Team Command
            </h1>
            <span style="font-size:0.72rem; font-weight:800; padding:0.2rem 0.6rem; border-radius:999px; background:rgba(6,182,212,0.15); color:#06b6d4; border:1px solid rgba(6,182,212,0.3);">
              4 Digital Brand Managers · 1,300 Units Output Engine
            </span>
          </div>
          <p style="color:var(--text-secondary); font-size:0.88rem; margin:0;">
            Cadence: <strong>8 hrs/day = 8 listings/day = ~13 days per brand</strong>. Full portfolio live in ~8 weeks.
          </p>
        </div>

        <div style="display:flex; align-items:center; gap:0.6rem; flex-wrap:wrap;">
          <button id="dbmCurrencyToggleBtn" class="btn-ghost" onclick="window.DBMModule.toggleCurrency()" style="border:1px solid rgba(255,255,255,0.12); padding:0.45rem 0.85rem; font-size:0.82rem; font-weight:800; border-radius:8px; display:inline-flex; align-items:center; gap:0.4rem; color:var(--text-primary);">
            <span>${isBdt ? '৳ BDT Mode' : '$ USD Mode'}</span>
            <span style="font-size:0.7rem; opacity:0.6;">(1:120)</span>
          </button>
          <a href="#brands" class="btn-secondary" style="display:inline-flex; align-items:center; gap:0.4rem; padding:0.45rem 0.85rem; font-size:0.82rem; text-decoration:none;">
            🛍️ Brand Command Center
          </a>
          <button id="btnOpenLogStandupModal" class="btn-primary" onclick="window.DBMModule.openLogStandupModal()" style="display:inline-flex; align-items:center; gap:0.4rem; padding:0.45rem 0.95rem; font-size:0.82rem; font-weight:800; background:linear-gradient(135deg, #00df89, #06b6d4); color:#070b12; border:none; border-radius:8px; cursor:pointer;">
            📋 Log Daily EOD Report
          </button>
        </div>
      </div>

      <!-- 4 MASTER TOP-LINE KPI TILES -->
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:1rem; margin-bottom:1.75rem;">
        <div class="card-glass" style="padding:1.15rem; border-radius:14px; border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.02);">
          <div style="font-size:0.75rem; color:var(--text-muted); font-weight:700; text-transform:uppercase; letter-spacing:0.04em; margin-bottom:0.35rem;">
            DBM Division Teams
          </div>
          <div id="kpiDbmDivisions" style="font-size:1.6rem; font-weight:900; color:#06b6d4; font-family:var(--font-heading);">
            4 Divisions
          </div>
          <div style="font-size:0.72rem; color:var(--text-secondary); margin-top:0.25rem;">
            4 Leads · 13 Brands Covered
          </div>
        </div>

        <div class="card-glass" style="padding:1.15rem; border-radius:14px; border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.02);">
          <div style="font-size:0.75rem; color:var(--text-muted); font-weight:700; text-transform:uppercase; letter-spacing:0.04em; margin-bottom:0.35rem;">
            Listing Cadence Target
          </div>
          <div id="kpiDbmDailyCadence" style="font-size:1.6rem; font-weight:900; color:#00df89; font-family:var(--font-heading);">
            32 Units / Day
          </div>
          <div style="font-size:0.72rem; color:var(--text-secondary); margin-top:0.25rem;">
            8 listings / DBM / 8-hr SOP
          </div>
        </div>

        <div class="card-glass" style="padding:1.15rem; border-radius:14px; border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.02);">
          <div style="font-size:0.75rem; color:var(--text-muted); font-weight:700; text-transform:uppercase; letter-spacing:0.04em; margin-bottom:0.35rem;">
            Empire Target Gross
          </div>
          <div id="kpiDbmAnnualTarget" style="font-size:1.6rem; font-weight:900; color:#fff; font-family:var(--font-heading);">
            ${formatMoney(totalTargetAnnual)}
          </div>
          <div style="font-size:0.72rem; color:var(--text-secondary); margin-top:0.25rem;">
            13-Brand 12-Month Target ARR
          </div>
        </div>

        <div class="card-glass" style="padding:1.15rem; border-radius:14px; border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.02);">
          <div style="font-size:0.75rem; color:var(--text-muted); font-weight:700; text-transform:uppercase; letter-spacing:0.04em; margin-bottom:0.35rem;">
            Standup Logs Filed
          </div>
          <div id="kpiDbmTotalStandups" style="font-size:1.6rem; font-weight:900; color:#a855f7; font-family:var(--font-heading);">
            ${logs.length} Logged
          </div>
          <div style="font-size:0.72rem; color:var(--text-secondary); margin-top:0.25rem;">
            Verified Cloud EOD Reports
          </div>
        </div>
      </div>

      <!-- 5-WAY NAVIGATION COMMAND TABS -->
      <div id="dbmNavTabs" style="display:flex; gap:0.5rem; border-bottom:1px solid rgba(255,255,255,0.1); margin-bottom:1.5rem; overflow-x:auto; padding-bottom:0.25rem;">
        <button data-tab="matrix" class="dbm-tab-btn ${currentTab === 'matrix' ? 'active' : ''}" onclick="window.DBMModule.switchTab('matrix')" style="background:${currentTab === 'matrix' ? 'rgba(0,223,137,0.15)' : 'transparent'}; color:${currentTab === 'matrix' ? '#00df89' : 'var(--text-secondary)'}; border:none; border-bottom:${currentTab === 'matrix' ? '2px solid #00df89' : '2px solid transparent'}; padding:0.6rem 1.1rem; font-size:0.85rem; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; gap:0.4rem; border-radius:6px 6px 0 0;">
          <span>🏢</span> Division Matrix & Roster
        </button>
        <button data-tab="cadence" class="dbm-tab-btn ${currentTab === 'cadence' ? 'active' : ''}" onclick="window.DBMModule.switchTab('cadence')" style="background:${currentTab === 'cadence' ? 'rgba(6,182,212,0.15)' : 'transparent'}; color:${currentTab === 'cadence' ? '#06b6d4' : 'var(--text-secondary)'}; border:none; border-bottom:${currentTab === 'cadence' ? '2px solid #06b6d4' : '2px solid transparent'}; padding:0.6rem 1.1rem; font-size:0.85rem; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; gap:0.4rem; border-radius:6px 6px 0 0;">
          <span>⏰</span> 8-Hour SOP & Schedule
        </button>
        <button data-tab="standups" class="dbm-tab-btn ${currentTab === 'standups' ? 'active' : ''}" onclick="window.DBMModule.switchTab('standups')" style="background:${currentTab === 'standups' ? 'rgba(168,85,247,0.15)' : 'transparent'}; color:${currentTab === 'standups' ? '#a855f7' : 'var(--text-secondary)'}; border:none; border-bottom:${currentTab === 'standups' ? '2px solid #a855f7' : '2px solid transparent'}; padding:0.6rem 1.1rem; font-size:0.85rem; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; gap:0.4rem; border-radius:6px 6px 0 0;">
          <span>📋</span> Daily Standup Reports
        </button>
        <button data-tab="qc" class="dbm-tab-btn ${currentTab === 'qc' ? 'active' : ''}" onclick="window.DBMModule.switchTab('qc')" style="background:${currentTab === 'qc' ? 'rgba(251,191,36,0.15)' : 'transparent'}; color:${currentTab === 'qc' ? '#fbbf24' : 'var(--text-secondary)'}; border:none; border-bottom:${currentTab === 'qc' ? '2px solid #fbbf24' : '2px solid transparent'}; padding:0.6rem 1.1rem; font-size:0.85rem; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; gap:0.4rem; border-radius:6px 6px 0 0;">
          <span>✅</span> QC 10-Point Checklist
        </button>
        <button data-tab="incentives" class="dbm-tab-btn ${currentTab === 'incentives' ? 'active' : ''}" onclick="window.DBMModule.switchTab('incentives')" style="background:${currentTab === 'incentives' ? 'rgba(239,68,68,0.15)' : 'transparent'}; color:${currentTab === 'incentives' ? '#ef4444' : 'var(--text-secondary)'}; border:none; border-bottom:${currentTab === 'incentives' ? '2px solid #ef4444' : '2px solid transparent'}; padding:0.6rem 1.1rem; font-size:0.85rem; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; gap:0.4rem; border-radius:6px 6px 0 0;">
          <span>💎</span> 5% Incentive & Bonus Ledger
        </button>
      </div>

      <!-- TAB CONTENT CONTAINER -->
      <div id="dbmTabContent">
        ${renderActiveTabContent()}
      </div>

      <!-- STANDUP SUBMISSION MODAL OVERLAY -->
      <div id="dbmStandupModal" style="display:none; position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.8); z-index:9999; align-items:center; justify-content:center; backdrop-filter:blur(6px);" onclick="if(event.target === this) window.DBMModule.closeStandupModal()">
        <div class="card-glass" style="max-width:540px; width:90%; padding:1.75rem; border-radius:16px; border:1px solid rgba(0,223,137,0.3); background:#0c1017; box-shadow:0 20px 40px rgba(0,0,0,0.6);" onclick="event.stopPropagation()">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem;">
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <span style="font-size:1.4rem;">📋</span>
              <h3 style="margin:0; font-size:1.2rem; color:#fff; font-weight:800;">Log DBM Daily EOD Standup</h3>
            </div>
            <button id="btnCloseStandupModal" class="btn-ghost btn-sm" onclick="window.DBMModule.closeStandupModal()" style="border:none; color:var(--text-muted); cursor:pointer; font-size:1.1rem;">✕</button>
          </div>

          <form id="dbmStandupForm" onsubmit="event.preventDefault(); window.DBMModule.submitStandupForm();">
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; margin-bottom:1rem;">
              <div>
                <label style="font-size:0.75rem; color:var(--text-muted); display:block; margin-bottom:0.3rem;">DBM Division:</label>
                <select id="standupDbmSelect" onchange="window.DBMModule.updateBrandOptions(this.value)" style="width:100%; padding:0.5rem; background:rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.1); border-radius:8px; color:#fff; font-size:0.85rem;">
                  ${brandsState.dbms.map(d => `<option value="${d.id}">${d.name} (${d.title})</option>`).join('')}
                </select>
              </div>

              <div>
                <label style="font-size:0.75rem; color:var(--text-muted); display:block; margin-bottom:0.3rem;">Brand Worked On:</label>
                <select id="standupBrandSelect" style="width:100%; padding:0.5rem; background:rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.1); border-radius:8px; color:#00df89; font-weight:700; font-size:0.85rem;">
                  <!-- Populated dynamically -->
                </select>
              </div>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; margin-bottom:1rem;">
              <div>
                <label style="font-size:0.75rem; color:var(--text-muted); display:block; margin-bottom:0.3rem;">Products Built / Listed Today:</label>
                <input type="number" id="standupListedInput" min="0" max="50" value="8" style="width:100%; padding:0.5rem; background:rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.1); border-radius:8px; color:#00df89; font-weight:800; font-size:0.9rem;">
              </div>

              <div>
                <label style="font-size:0.75rem; color:var(--text-muted); display:block; margin-bottom:0.3rem;">Revenue Today (${isBdt ? '৳ BDT' : '$ USD'}):</label>
                <input type="number" id="standupRevenueInput" min="0" step="0.01" value="0" style="width:100%; padding:0.5rem; background:rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.1); border-radius:8px; color:#fff; font-weight:700; font-size:0.9rem;">
              </div>
            </div>

            <div style="margin-bottom:1.25rem;">
              <label style="font-size:0.75rem; color:var(--text-muted); display:block; margin-bottom:0.3rem;">Standup Notes / Wins / Blockers:</label>
              <textarea id="standupNotesInput" rows="3" placeholder="e.g. Completed design & mockup generation for 8 hero products. No blockers." style="width:100%; padding:0.5rem; background:rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.1); border-radius:8px; color:#fff; font-size:0.85rem; resize:vertical;"></textarea>
            </div>

            <div style="display:flex; justify-content:flex-end; gap:0.5rem;">
              <button type="button" id="btnCancelStandupModal" class="btn-ghost" onclick="window.DBMModule.closeStandupModal()">Cancel</button>
              <button type="submit" id="btnSubmitStandupReport" class="btn-primary" style="background:linear-gradient(135deg, #00df89, #06b6d4); color:#070b12; font-weight:800; border:none; padding:0.5rem 1.25rem; border-radius:8px; cursor:pointer;">
                🚀 Submit Standup Report
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    // Initialize dropdown choices
    window.DBMModule.updateBrandOptions(document.getElementById('standupDbmSelect')?.value || 1);
  }

  function renderActiveTabContent() {
    if (currentTab === 'matrix') {
      return renderMatrixTab();
    } else if (currentTab === 'cadence') {
      return renderCadenceTab();
    } else if (currentTab === 'standups') {
      return renderStandupsTab();
    } else if (currentTab === 'qc') {
      return renderQCTab();
    } else if (currentTab === 'incentives') {
      return renderIncentivesTab();
    }
    return renderMatrixTab();
  }

  function renderMatrixTab() {
    const displayedDbms = selectedDbmFilter 
      ? brandsState.dbms.filter(d => d.id === Number(selectedDbmFilter))
      : brandsState.dbms;

    return `
      <!-- DIVISION FILTER PILLS -->
      <div style="display:flex; gap:0.5rem; margin-bottom:1.25rem; flex-wrap:wrap;">
        <button id="btnFilterDbmAll" class="btn-ghost btn-sm ${selectedDbmFilter === null ? 'active' : ''}" onclick="window.DBMModule.setDivisionFilter(null)" style="border:1px solid ${selectedDbmFilter === null ? '#00df89' : 'rgba(255,255,255,0.1)'}; color:${selectedDbmFilter === null ? '#00df89' : 'var(--text-secondary)'}; font-weight:700; border-radius:8px; padding:0.35rem 0.75rem;">
          All Divisions (4)
        </button>
        <button id="btnFilterDbm1" class="btn-ghost btn-sm ${selectedDbmFilter === 1 ? 'active' : ''}" onclick="window.DBMModule.setDivisionFilter(1)" style="border:1px solid ${selectedDbmFilter === 1 ? '#00df89' : 'rgba(255,255,255,0.1)'}; color:${selectedDbmFilter === 1 ? '#00df89' : 'var(--text-secondary)'}; font-weight:700; border-radius:8px; padding:0.35rem 0.75rem;">
          Division 1: Anika Nower (3 Brands)
        </button>
        <button id="btnFilterDbm2" class="btn-ghost btn-sm ${selectedDbmFilter === 2 ? 'active' : ''}" onclick="window.DBMModule.setDivisionFilter(2)" style="border:1px solid ${selectedDbmFilter === 2 ? '#00df89' : 'rgba(255,255,255,0.1)'}; color:${selectedDbmFilter === 2 ? '#00df89' : 'var(--text-secondary)'}; font-weight:700; border-radius:8px; padding:0.35rem 0.75rem;">
          Division 2: POD & Apparel (3 Brands)
        </button>
        <button id="btnFilterDbm3" class="btn-ghost btn-sm ${selectedDbmFilter === 3 ? 'active' : ''}" onclick="window.DBMModule.setDivisionFilter(3)" style="border:1px solid ${selectedDbmFilter === 3 ? '#00df89' : 'rgba(255,255,255,0.1)'}; color:${selectedDbmFilter === 3 ? '#00df89' : 'var(--text-secondary)'}; font-weight:700; border-radius:8px; padding:0.35rem 0.75rem;">
          Division 3: Kids & Education (3 Brands)
        </button>
        <button id="btnFilterDbm4" class="btn-ghost btn-sm ${selectedDbmFilter === 4 ? 'active' : ''}" onclick="window.DBMModule.setDivisionFilter(4)" style="border:1px solid ${selectedDbmFilter === 4 ? '#00df89' : 'rgba(255,255,255,0.1)'}; color:${selectedDbmFilter === 4 ? '#00df89' : 'var(--text-secondary)'}; font-weight:700; border-radius:8px; padding:0.35rem 0.75rem;">
          Division 4: Tech, Fonts & Prompts (4 Brands)
        </button>
      </div>

      <!-- 4 DBM DIVISIONS CARDS -->
      <div id="dbmDivisionsGrid" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(290px, 1fr)); gap:1.25rem;">
        ${displayedDbms.map(d => {
          const assigned = brandsState.brands.filter(b => d.assignedBrands.includes(b.id));
          const totalTargetGross = assigned.reduce((acc, b) => acc + (b.target12mo || 0), 0);
          const totalLive = assigned.reduce((acc, b) => acc + (b.productsLive || 0), 0);
          const totalTargetProducts = assigned.reduce((acc, b) => acc + (b.productsTarget || 100), 0);

          return `
            <div class="card-glass dbm-division-card" data-dbm-id="${d.id}" style="border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:1.25rem; display:flex; flex-direction:column; justify-content:space-between; background:rgba(255,255,255,0.02);">
              <div>
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.75rem;">
                  <div style="display:flex; align-items:center; gap:0.6rem;">
                    <div style="width:42px; height:42px; border-radius:10px; background:linear-gradient(135deg, #00df89, #06b6d4); color:#070b12; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:0.95rem;">
                      D${d.id}
                    </div>
                    <div>
                      <h3 style="font-size:1.05rem; font-weight:800; color:#fff; margin:0;">${d.name} · Division ${d.id}</h3>
                      <span style="font-size:0.7rem; color:var(--text-muted);">${d.title}</span>
                    </div>
                  </div>
                  <span style="font-size:0.68rem; font-weight:800; padding:0.2rem 0.5rem; border-radius:999px; background:rgba(0,223,137,0.15); color:#00df89;">
                    🟢 Active
                  </span>
                </div>

                <div style="background:rgba(0,0,0,0.3); padding:0.75rem; border-radius:10px; margin-bottom:0.85rem;">
                  <span style="font-size:0.68rem; font-weight:800; color:var(--text-muted); text-transform:uppercase;">Assigned Brands (${assigned.length}):</span>
                  <div style="display:flex; flex-direction:column; gap:0.35rem; margin-top:0.4rem;">
                    ${assigned.map(b => `
                      <div style="display:flex; justify-content:space-between; font-size:0.78rem;">
                        <span style="color:#fff;">${b.name}</span>
                        <span style="color:#00df89; font-weight:700;">${formatMoney(b.target12mo || 0)} target</span>
                      </div>
                    `).join('')}
                  </div>
                </div>

                <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem; margin-bottom:0.85rem; font-size:0.75rem;">
                  <div style="background:rgba(255,255,255,0.03); padding:0.5rem; border-radius:8px;">
                    <span style="color:var(--text-muted);">Execution Pace:</span>
                    <div style="font-size:1rem; font-weight:800; color:#06b6d4;">${totalLive} / ${totalTargetProducts}</div>
                  </div>
                  <div style="background:rgba(255,255,255,0.03); padding:0.5rem; border-radius:8px;">
                    <span style="color:var(--text-muted);">Year 1 Gross Target:</span>
                    <div style="font-size:1rem; font-weight:800; color:#fff;">${formatMoney(totalTargetGross)}</div>
                  </div>
                </div>
              </div>

              <div style="display:flex; gap:0.4rem;">
                <button id="btnManageDbm_${d.id}" class="btn-primary btn-sm btn-dbm-manage" style="width:100%; font-size:0.75rem; padding:0.5rem; background:rgba(0,223,137,0.15); color:#00df89; border:1px solid rgba(0,223,137,0.3); border-radius:6px; cursor:pointer;" onclick="window.DBMModule.filterByDBM(${d.id})">
                  Manage ${d.name} Pipeline →
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  function renderCadenceTab() {
    return `
      <div style="display:grid; grid-template-columns:1fr 1.1fr; gap:1.5rem;">
        <!-- 8-HOUR DAILY RHYTHM -->
        <div class="card-glass" style="padding:1.5rem; border-radius:16px; border:1px solid rgba(255,255,255,0.08);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
            <h3 style="font-size:1.15rem; font-weight:800; color:#fff; margin:0;">⏰ 8-Hour DBM Daily SOP</h3>
            <span style="font-size:0.72rem; color:#00df89; background:rgba(0,223,137,0.15); padding:0.2rem 0.5rem; border-radius:999px; font-weight:700;">8 Listings / Day Target</span>
          </div>
          <p style="font-size:0.78rem; color:var(--text-muted); margin-bottom:1.25rem;">
            Standardized 8-hour production schedule enabling rapid execution across the 13-brand digital empire.
          </p>

          <div style="display:flex; flex-direction:column; gap:0.75rem; font-size:0.82rem;">
            <div style="background:rgba(255,255,255,0.03); padding:0.75rem; border-radius:10px; border-left:4px solid #00df89;">
              <div style="display:flex; justify-content:space-between; margin-bottom:0.2rem;">
                <strong style="color:#00df89;">09:00 – 09:15</strong>
                <span style="color:var(--text-muted); font-size:0.72rem;">15 mins</span>
              </div>
              <div style="color:#fff;">Morning Standup Briefing & Review Checks</div>
              <div style="color:var(--text-muted); font-size:0.74rem;">Inspect overnight Etsy orders, review queue, and assign daily product focus.</div>
            </div>

            <div style="background:rgba(255,255,255,0.03); padding:0.75rem; border-radius:10px; border-left:4px solid #06b6d4;">
              <div style="display:flex; justify-content:space-between; margin-bottom:0.2rem;">
                <strong style="color:#06b6d4;">09:15 – 12:00</strong>
                <span style="color:var(--text-muted); font-size:0.72rem;">2h 45m · Target: ~3 Products</span>
              </div>
              <div style="color:#fff;">Creation Block 1: Design & List ~3 Hero Products</div>
              <div style="color:var(--text-muted); font-size:0.74rem;">Generate deliverables, export PDFs/templates, run AI Button 6 (Mockup) + Button 8 (Description).</div>
            </div>

            <div style="background:rgba(255,255,255,0.02); padding:0.5rem 0.75rem; border-radius:8px; color:var(--text-muted); font-size:0.78rem;">
              <strong>12:00 – 12:30</strong> · Lunch & Rest Break (30 mins)
            </div>

            <div style="background:rgba(255,255,255,0.03); padding:0.75rem; border-radius:10px; border-left:4px solid #a855f7;">
              <div style="display:flex; justify-content:space-between; margin-bottom:0.2rem;">
                <strong style="color:#a855f7;">12:30 – 14:30</strong>
                <span style="color:var(--text-muted); font-size:0.72rem;">2h 00m · Target: ~2 Products</span>
              </div>
              <div style="color:#fff;">Creation Block 2: Design & List ~2 Mid-Tier Products</div>
              <div style="color:var(--text-muted); font-size:0.74rem;">Expand product line variations, configure pricing ladders, apply all 13 Etsy SEO tags.</div>
            </div>

            <div style="background:rgba(255,255,255,0.03); padding:0.75rem; border-radius:10px; border-left:4px solid #fbbf24;">
              <div style="display:flex; justify-content:space-between; margin-bottom:0.2rem;">
                <strong style="color:#fbbf24;">14:30 – 16:30</strong>
                <span style="color:var(--text-muted); font-size:0.72rem;">2h 00m · Target: ~2 Products</span>
              </div>
              <div style="color:#fff;">Creation Block 3: Design & List ~2 Extension Products</div>
              <div style="color:var(--text-muted); font-size:0.74rem;">Add bonus templates, bundle packages, and double-check file download links.</div>
            </div>

            <div style="background:rgba(255,255,255,0.03); padding:0.75rem; border-radius:10px; border-left:4px solid #ef4444;">
              <div style="display:flex; justify-content:space-between; margin-bottom:0.2rem;">
                <strong style="color:#ef4444;">16:30 – 17:30</strong>
                <span style="color:var(--text-muted); font-size:0.72rem;">1h 00m · Accountability</span>
              </div>
              <div style="color:#fff;">Promotion, Pinterest Pins & Daily EOD Standup</div>
              <div style="color:var(--text-muted); font-size:0.74rem;">Schedule 5 Pinterest pins per listing, verify QC checklist, and log EOD standup to server.</div>
            </div>
          </div>
        </div>

        <!-- CADENCE VELOCITY & STANDARDS -->
        <div style="display:flex; flex-direction:column; gap:1.25rem;">
          <div class="card-glass" style="padding:1.5rem; border-radius:16px; border:1px solid rgba(255,255,255,0.08);">
            <h3 style="font-size:1.1rem; font-weight:800; color:#fff; margin-bottom:0.35rem;">📊 Production Velocity Model</h3>
            <span style="font-size:0.75rem; color:var(--text-muted); display:block; margin-bottom:1.25rem;">How the 4-DBM team scales to 1,300 live assets in 8 weeks</span>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; margin-bottom:1.25rem;">
              <div style="background:rgba(0,0,0,0.3); padding:0.85rem; border-radius:10px; border:1px solid rgba(0,223,137,0.2);">
                <span style="font-size:0.72rem; color:var(--text-muted); display:block;">Individual Cadence:</span>
                <span style="font-size:1.25rem; font-weight:900; color:#00df89;">8 Listings / Day</span>
                <span style="font-size:0.68rem; color:var(--text-muted); display:block; margin-top:0.2rem;">~13 working days per 100-item store</span>
              </div>

              <div style="background:rgba(0,0,0,0.3); padding:0.85rem; border-radius:10px; border:1px solid rgba(6,182,212,0.2);">
                <span style="font-size:0.72rem; color:var(--text-muted); display:block;">Team Output Velocity:</span>
                <span style="font-size:1.25rem; font-weight:900; color:#06b6d4;">32 Listings / Day</span>
                <span style="font-size:0.68rem; color:var(--text-muted); display:block; margin-top:0.2rem;">160 units / 5-day operating week</span>
              </div>
            </div>

            <div style="background:rgba(255,255,255,0.02); padding:1rem; border-radius:12px; border:1px solid rgba(255,255,255,0.06);">
              <h4 style="font-size:0.88rem; color:#fff; font-weight:800; margin-bottom:0.5rem;">Empire Milestones:</h4>
              <ul style="margin:0; padding-left:1.2rem; font-size:0.78rem; color:var(--text-secondary); display:flex; flex-direction:column; gap:0.4rem;">
                <li><strong>Week 2:</strong> 320 listings live across first 4 primary stores</li>
                <li><strong>Week 4:</strong> 640 listings live — initial Etsy search indexation & first organic sales</li>
                <li><strong>Week 6:</strong> 960 listings live — top seller badges and ad optimization kick in</li>
                <li><strong>Week 8:</strong> 1,300 products live across all 13 brand catalogs (100% complete)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderStandupsTab() {
    const displayedLogs = standupDivisionFilter
      ? logs.filter(l => l.dbmId === Number(standupDivisionFilter))
      : logs;

    return `
      <div class="card-glass" style="padding:1.5rem; border-radius:16px; border:1px solid rgba(255,255,255,0.08);">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem; margin-bottom:1.25rem;">
          <div>
            <h3 style="font-size:1.15rem; font-weight:800; color:#fff; margin:0;">📋 Daily Standup Reports Feed</h3>
            <span style="font-size:0.75rem; color:var(--text-muted);">Async EOD accountability log from DBMs (Cloud Persisted to Server & Supabase)</span>
          </div>

          <div style="display:flex; gap:0.5rem; align-items:center;">
            <div id="standupFilterChips" style="display:flex; gap:0.35rem;">
              <button class="btn-ghost btn-sm ${standupDivisionFilter === null ? 'active' : ''}" onclick="window.DBMModule.setStandupFilter(null)" style="border:1px solid rgba(255,255,255,0.1); font-size:0.75rem; border-radius:6px;">All</button>
              <button class="btn-ghost btn-sm ${standupDivisionFilter === 1 ? 'active' : ''}" onclick="window.DBMModule.setStandupFilter(1)" style="border:1px solid rgba(255,255,255,0.1); font-size:0.75rem; border-radius:6px;">D1</button>
              <button class="btn-ghost btn-sm ${standupDivisionFilter === 2 ? 'active' : ''}" onclick="window.DBMModule.setStandupFilter(2)" style="border:1px solid rgba(255,255,255,0.1); font-size:0.75rem; border-radius:6px;">D2</button>
              <button class="btn-ghost btn-sm ${standupDivisionFilter === 3 ? 'active' : ''}" onclick="window.DBMModule.setStandupFilter(3)" style="border:1px solid rgba(255,255,255,0.1); font-size:0.75rem; border-radius:6px;">D3</button>
              <button class="btn-ghost btn-sm ${standupDivisionFilter === 4 ? 'active' : ''}" onclick="window.DBMModule.setStandupFilter(4)" style="border:1px solid rgba(255,255,255,0.1); font-size:0.75rem; border-radius:6px;">D4</button>
            </div>
            <button id="btnOpenLogStandupModal2" class="btn-ghost btn-sm" onclick="window.DBMModule.openLogStandupModal()" style="border:1px solid rgba(0,223,137,0.3); color:#00df89; font-weight:700; border-radius:6px;">
              + Log EOD
            </button>
          </div>
        </div>

        <div id="dbmStandupLogsList" style="display:flex; flex-direction:column; gap:0.75rem;">
          ${displayedLogs.length === 0 ? `
            <div style="text-align:center; padding:2rem; color:var(--text-muted); font-size:0.85rem;">
              No standup reports found for this division filter.
            </div>
          ` : displayedLogs.map(l => `
            <div class="card-glass dbm-standup-card" style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); padding:1rem; border-radius:12px; font-size:0.82rem;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.35rem;">
                <div style="display:flex; align-items:center; gap:0.5rem;">
                  <span style="font-weight:800; color:#fff; font-size:0.92rem;">DBM ${l.dbmId} · ${l.brandName}</span>
                  <span style="font-size:0.68rem; padding:0.15rem 0.45rem; border-radius:999px; background:rgba(6,182,212,0.15); color:#06b6d4; font-weight:700;">
                    Division ${l.dbmId}
                  </span>
                </div>
                <span style="font-size:0.75rem; color:var(--text-muted);">${l.date}</span>
              </div>
              <div style="display:flex; gap:1.25rem; font-size:0.8rem; color:#00df89; margin-bottom:0.4rem;">
                <span>Listed Today: <strong>${l.listed} Products</strong></span>
                ${l.revenue > 0 ? `<span>Revenue: <strong>${formatMoney(l.revenue)}</strong></span>` : ''}
              </div>
              <p style="font-size:0.8rem; color:var(--text-secondary); margin:0; line-height:1.4;">${l.notes}</p>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function renderQCTab() {
    const qcPoints = [
      { id: 1, title: 'High-Resolution Cover Mockup', desc: 'Minimum 2000x2000px, 300 DPI, realistic scene context and readable primary text overlay.' },
      { id: 2, title: 'Tier-1 Long-Tail SEO Title', desc: 'Listing title packed with 3 verified high-intent long-tail keywords with punctuation separators.' },
      { id: 3, title: '13 All-Inclusive Etsy Tags', desc: 'Zero single-word tags; all 13 tag slots filled with multi-word buyer search queries.' },
      { id: 4, title: 'Instant Digital Deliverable Spec', desc: 'Clean PDF guide included containing verified Canva / Notion / file download links.' },
      { id: 5, title: 'Dynamic Tiered Pricing Matrix', desc: 'Launch price configured according to catalog tier ($4.99 / $9.99 / $14.99) with promotional strike-through.' },
      { id: 6, title: 'Accurate Category Classification', desc: 'Mapped to primary and secondary sub-categories for maximum Etsy search filtering visibility.' },
      { id: 7, title: 'Customer Benefit Bullets & FAQ', desc: '5 value-driven bullet points + standard digital product FAQ (licensing, compatibility, refunds).' },
      { id: 8, title: 'Attached Download File Integrity', desc: 'Working ZIP or PDF deliverable uploaded to Etsy listing draft and tested end-to-end.' },
      { id: 9, title: 'Commercial License & Copyright', desc: 'Clear terms of use statement preventing unauthorized redistribution of intellectual property.' },
      { id: 10, title: 'Social & Pinterest Distribution Pin', desc: '1000x1500px vertical Pinterest graphic generated and queued for programmatic distribution.' }
    ];

    return `
      <div class="card-glass" style="padding:1.5rem; border-radius:16px; border:1px solid rgba(255,255,255,0.08);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem;">
          <div>
            <h3 style="font-size:1.15rem; font-weight:800; color:#fff; margin:0;">✅ QC 10-Point Listing Standard</h3>
            <span style="font-size:0.75rem; color:var(--text-muted);">Mandatory quality control gates required before publishing any digital listing</span>
          </div>
          <span style="font-size:0.75rem; font-weight:800; padding:0.25rem 0.65rem; border-radius:999px; background:rgba(0,223,137,0.15); color:#00df89; border:1px solid rgba(0,223,137,0.3);">
            100% Quality Pass Threshold
          </span>
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:0.85rem;">
          ${qcPoints.map(p => `
            <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); padding:1rem; border-radius:12px; display:flex; gap:0.75rem; align-items:flex-start;">
              <div style="width:28px; height:28px; border-radius:8px; background:rgba(0,223,137,0.15); color:#00df89; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:0.8rem; flex-shrink:0;">
                ${p.id}
              </div>
              <div>
                <h4 style="font-size:0.88rem; font-weight:800; color:#fff; margin:0 0 0.25rem 0;">${p.title}</h4>
                <p style="font-size:0.76rem; color:var(--text-secondary); margin:0; line-height:1.4;">${p.desc}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function renderIncentivesTab() {
    const incentiveData = [
      { id: 1, dbm: 'Anika Nower (Division 1 Lead)', brands: 'PlannerQueenGro, InkWrapped, FiestaFoundry', targetGross: 66350, pool5pct: 3317.50 },
      { id: 2, dbm: 'Division 2 Lead', brands: 'WildMutt Co., CozyThreads™, ProudProfessional', targetGross: 77390, pool5pct: 3869.50 },
      { id: 3, dbm: 'Division 3 Lead', brands: 'TinyDesks Studio, LittleStarsLearning, ZenWallCo', targetGross: 59000, pool5pct: 2950.00 },
      { id: 4, dbm: 'Division 4 Lead', brands: 'SparkSVG, PageForge Publishing, LetterLab Fonts, PromptVault', targetGross: 155426, pool5pct: 7771.30 }
    ];

    const totalPool = incentiveData.reduce((acc, x) => acc + x.pool5pct, 0);

    return `
      <div class="card-glass" style="padding:1.5rem; border-radius:16px; border:1px solid rgba(255,255,255,0.08);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem;">
          <div>
            <h3 style="font-size:1.15rem; font-weight:800; color:#fff; margin:0;">💎 5% Net Margin Incentive & Bonus Ledger</h3>
            <span style="font-size:0.75rem; color:var(--text-muted);">Performance pool distributed directly to DBM leads based on brand profitability</span>
          </div>
          <div style="font-size:0.82rem; font-weight:800; color:#00df89; background:rgba(0,223,137,0.15); padding:0.3rem 0.75rem; border-radius:8px;">
            Total Projected Pool: ${formatMoney(totalPool)}
          </div>
        </div>

        <div style="overflow-x:auto;">
          <table style="width:100%; border-collapse:collapse; font-size:0.82rem; text-align:left;">
            <thead>
              <tr style="border-bottom:1px solid rgba(255,255,255,0.1); color:var(--text-muted);">
                <th style="padding:0.75rem; font-weight:700;">Division</th>
                <th style="padding:0.75rem; font-weight:700;">Lead Manager</th>
                <th style="padding:0.75rem; font-weight:700;">Covered Brands</th>
                <th style="padding:0.75rem; font-weight:700;">Year 1 Target Gross</th>
                <th style="padding:0.75rem; font-weight:700;">5% Performance Bonus Pool</th>
              </tr>
            </thead>
            <tbody>
              ${incentiveData.map(row => `
                <tr style="border-bottom:1px solid rgba(255,255,255,0.04);">
                  <td style="padding:0.75rem; font-weight:800; color:#06b6d4;">D${row.id}</td>
                  <td style="padding:0.75rem; font-weight:700; color:#fff;">${row.dbm}</td>
                  <td style="padding:0.75rem; color:var(--text-secondary); font-size:0.78rem;">${row.brands}</td>
                  <td style="padding:0.75rem; font-weight:800; color:#fff;">${formatMoney(row.targetGross)}</td>
                  <td style="padding:0.75rem; font-weight:900; color:#00df89;">${formatMoney(row.pool5pct)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  window.DBMModule = {
    getCurrency,
    formatMoney,

    toggleCurrency() {
      const next = getCurrency() === 'USD' ? 'BDT' : 'USD';
      this.switchCurrency(next);
    },

    switchCurrency(currency) {
      localStorage.setItem('gro10x_currency', currency);
      window.dispatchEvent(new CustomEvent('gro10x_currency_changed', { detail: { currency } }));
      render();
    },

    switchTab(tabName) {
      currentTab = tabName;
      render();
    },

    setDivisionFilter(dbmId) {
      selectedDbmFilter = dbmId;
      render();
    },

    setStandupFilter(dbmId) {
      standupDivisionFilter = dbmId;
      render();
    },

    filterByDBM(dbmId) {
      localStorage.setItem('gro10x_brands_active_tab', 'products');
      const b = brandsState.brands.find(x => x.dbmId === Number(dbmId));
      if (b) localStorage.setItem('gro10x_brands_selected_brand', b.id);
      window.location.hash = '#brands';
    },

    updateBrandOptions(dbmId) {
      const brandSelect = document.getElementById('standupBrandSelect');
      if (!brandSelect) return;
      const assigned = brandsState.brands.filter(b => b.dbmId === Number(dbmId));
      brandSelect.innerHTML = assigned.map(b => `<option value="${b.name}">${b.name} (Brand #${b.id})</option>`).join('');
    },

    openLogStandupModal() {
      const modal = document.getElementById('dbmStandupModal');
      if (modal) {
        modal.style.display = 'flex';
        this.updateBrandOptions(document.getElementById('standupDbmSelect')?.value || 1);
      }
    },

    closeStandupModal() {
      const modal = document.getElementById('dbmStandupModal');
      if (modal) modal.style.display = 'none';
    },

    async submitStandupForm() {
      const dbmId = Number(document.getElementById('standupDbmSelect')?.value || 1);
      const brandName = document.getElementById('standupBrandSelect')?.value || 'PlannerQueenGro';
      const listed = Number(document.getElementById('standupListedInput')?.value) || 0;
      const revenue = Number(document.getElementById('standupRevenueInput')?.value) || 0;
      const notes = document.getElementById('standupNotesInput')?.value.trim() || 'Completed daily production batch';

      const newLog = {
        date: new Date().toISOString().split('T')[0],
        dbmId,
        brandName,
        listed,
        revenue,
        notes
      };

      logs.unshift(newLog);

      try {
        const token = localStorage.getItem('gro10x_token') || localStorage.getItem('purpleos_token') || '';
        await fetch('/api/brands/dbm-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(newLog)
        });
      } catch (e) {
        localStorage.setItem('gro10x_dbm_standups', JSON.stringify(logs));
      }

      this.closeStandupModal();

      if (window.showToast) window.showToast(`✅ Logged Standup for DBM ${dbmId} (${brandName})!`, 'success');
      render();
    }
  };

  // Global aliases
  window.DBM_MODULE = window.DBMModule;
  window.switchDBMCurrency = (c) => window.DBMModule.switchCurrency(c);
  window.switchDbmCurrency = (c) => window.DBMModule.switchCurrency(c);

  // Deduplicated gro10x_currency_changed listener with #dbm route guard
  if (window._dbmCurrencyHandler) {
    window.removeEventListener('gro10x_currency_changed', window._dbmCurrencyHandler);
  }
  window._dbmCurrencyHandler = function(e) {
    if (window.location.hash !== '#dbm') return;
    render();
  };
  window.addEventListener('gro10x_currency_changed', window._dbmCurrencyHandler);

  // Route-guarded Escape key listener for modal dismissal
  if (window._dbmKeydownHandler) {
    window.removeEventListener('keydown', window._dbmKeydownHandler);
  }
  window._dbmKeydownHandler = function(e) {
    if (window.location.hash !== '#dbm') return;
    if (e.key === 'Escape') {
      window.DBMModule.closeStandupModal();
    }
  };
  window.addEventListener('keydown', window._dbmKeydownHandler);

  // Real-time SSE support
  if (window.APP_SSE && typeof window.APP_SSE.subscribe === 'function') {
    window.APP_SSE.subscribe('brand_update', () => {
      if (window.location.hash === '#dbm') render();
    });
  }

  render();
};
