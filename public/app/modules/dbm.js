/**
 * public/app/modules/dbm.js
 * ─────────────────────────────────────────────────────────────────────────────
 * GRO10X Digital Brand Manager (DBM) Operations & Team Tracker Module v2.5
 * 
 * Manages the 4-person DBM Team operating the 13-brand digital empire:
 * 1. DBM Division Matrix & Brand Ownership
 * 2. 8-Hour Daily Operating SOP & Listing Cadence (8 products/day target)
 * 3. Daily EOD Standup Submission & Async Log (Synced to Server & Supabase)
 * 4. P&L Performance Bonus Tracker (5% net margin incentive)
 * 5. Quality Control (QC) 10-Point Checklist
 * ─────────────────────────────────────────────────────────────────────────────
 */

window.APP_MODULES = window.APP_MODULES || {};

window.APP_MODULES.dbm = async function(container) {
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

  function render() {
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

        <div style="display:flex; gap:0.5rem;">
          <a href="#brands" class="btn-secondary">
            🛍️ Brand Command Center
          </a>
          <button class="btn-primary" onclick="window.DBMModule.openLogStandupModal()">
            📋 Log Daily EOD Report
          </button>
        </div>
      </div>

      <!-- 4 DBM DIVISIONS CARDS -->
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:1.25rem; margin-bottom:1.75rem;">
        ${brandsState.dbms.map(d => {
          const assigned = brandsState.brands.filter(b => d.assignedBrands.includes(b.id));
          const totalTargetGross = assigned.reduce((acc, b) => acc + (b.target12mo || 0), 0);
          const totalLive = assigned.reduce((acc, b) => acc + (b.productsLive || 0), 0);
          const totalTargetProducts = assigned.reduce((acc, b) => acc + (b.productsTarget || 100), 0);

          return `
            <div class="card-glass" style="border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:1.25rem; display:flex; flex-direction:column; justify-content:space-between;">
              <div>
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.75rem;">
                  <div style="display:flex; align-items:center; gap:0.6rem;">
                    <div style="width:40px; height:40px; border-radius:10px; background:linear-gradient(135deg, #00df89, #06b6d4); color:#070b12; display:flex; align-items:center; justify-content:center; font-weight:900;">
                      D${d.id}
                    </div>
                    <div>
                      <h3 style="font-size:1.05rem; font-weight:800; color:#fff; margin:0;">${d.name}</h3>
                      <span style="font-size:0.7rem; color:var(--text-muted);">${d.title}</span>
                    </div>
                  </div>
                  <span style="font-size:0.68rem; font-weight:800; padding:0.2rem 0.5rem; border-radius:999px; background:rgba(0,223,137,0.15); color:#00df89;">
                    🟢 Active
                  </span>
                </div>

                <div style="background:rgba(0,0,0,0.25); padding:0.75rem; border-radius:10px; margin-bottom:0.85rem;">
                  <span style="font-size:0.68rem; font-weight:800; color:var(--text-muted); text-transform:uppercase;">Assigned Brands:</span>
                  <div style="display:flex; flex-direction:column; gap:0.35rem; margin-top:0.4rem;">
                    ${assigned.map(b => `
                      <div style="display:flex; justify-content:space-between; font-size:0.78rem;">
                        <span style="color:#fff;">${b.name}</span>
                        <span style="color:#00df89; font-weight:700;">$${(b.target12mo || 0).toLocaleString()} target</span>
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
                    <span style="color:var(--text-muted);">Year 1 Gross:</span>
                    <div style="font-size:1rem; font-weight:800; color:#fff;">$${totalTargetGross.toLocaleString()}</div>
                  </div>
                </div>
              </div>

              <div style="display:flex; gap:0.4rem;">
                <button class="btn-primary btn-sm" style="width:100%; font-size:0.75rem;" onclick="window.DBMModule.filterByDBM(${d.id})">
                  Manage ${d.name} Pipeline →
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- 8-HOUR DAILY OPERATING SOP & RECENT STANDUPS -->
      <div style="display:grid; grid-template-columns: 1fr 1.2fr; gap:1.5rem;">
        
        <!-- 8-HOUR DAILY RHYTHM -->
        <div class="card-glass" style="padding:1.5rem; border-radius:16px;">
          <h3 style="font-size:1.1rem; font-weight:800; color:#fff; margin-bottom:0.3rem;">⏰ 8-Hour DBM Daily SOP</h3>
          <span style="font-size:0.75rem; color:var(--text-muted); display:block; margin-bottom:1rem;">Production standard for 7–8 listings / day output</span>

          <div style="display:flex; flex-direction:column; gap:0.6rem; font-size:0.8rem;">
            <div style="background:rgba(255,255,255,0.03); padding:0.6rem; border-radius:8px; border-left:3px solid #00df89;">
              <strong style="color:#00df89;">09:00 – 09:15</strong> · Morning Briefing & Review Checks (15m)
            </div>
            <div style="background:rgba(255,255,255,0.03); padding:0.6rem; border-radius:8px; border-left:3px solid #06b6d4;">
              <strong style="color:#06b6d4;">09:15 – 12:00</strong> · Creation Block 1: Design & List ~3 Products (AI Buttons 6+8)
            </div>
            <div style="background:rgba(255,255,255,0.02); padding:0.45rem 0.6rem; border-radius:8px; color:var(--text-muted);">
              <strong>12:00 – 12:30</strong> · Lunch Break
            </div>
            <div style="background:rgba(255,255,255,0.03); padding:0.6rem; border-radius:8px; border-left:3px solid #a855f7;">
              <strong style="color:#a855f7;">12:30 – 14:30</strong> · Creation Block 2: Design & List ~2 Products
            </div>
            <div style="background:rgba(255,255,255,0.03); padding:0.6rem; border-radius:8px; border-left:3px solid #fbbf24;">
              <strong style="color:#fbbf24;">14:30 – 16:30</strong> · Creation Block 3: Design & List ~2 Products
            </div>
            <div style="background:rgba(255,255,255,0.03); padding:0.6rem; border-radius:8px; border-left:3px solid #ef4444;">
              <strong style="color:#ef4444;">16:30 – 17:30</strong> · Promotion, Pinterest Pins & Daily EOD Standup
            </div>
          </div>
        </div>

        <!-- RECENT DAILY STANDUP LOGS -->
        <div class="card-glass" style="padding:1.5rem; border-radius:16px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
            <div>
              <h3 style="font-size:1.1rem; font-weight:800; color:#fff; margin:0;">📋 Daily Standup Reports</h3>
              <span style="font-size:0.75rem; color:var(--text-muted);">Async EOD accountability log from DBMs (Cloud Persisted)</span>
            </div>
            <button class="btn-ghost btn-sm" onclick="window.DBMModule.openLogStandupModal()">+ Log EOD</button>
          </div>

          <div style="display:flex; flex-direction:column; gap:0.75rem; max-height:360px; overflow-y:auto;">
            ${logs.map(l => `
              <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); padding:0.75rem; border-radius:10px; font-size:0.8rem;">
                <div style="display:flex; justify-content:space-between; margin-bottom:0.25rem;">
                  <strong style="color:#fff;">DBM ${l.dbmId} · ${l.brandName}</strong>
                  <span style="font-size:0.72rem; color:var(--text-muted);">${l.date}</span>
                </div>
                <div style="display:flex; gap:1rem; font-size:0.75rem; color:#00df89; margin-bottom:0.35rem;">
                  <span>Listed Today: <strong>${l.listed} Products</strong></span>
                  ${l.revenue > 0 ? `<span>Revenue: <strong>$${l.revenue}</strong></span>` : ''}
                </div>
                <p style="font-size:0.75rem; color:var(--text-secondary); margin:0;">${l.notes}</p>
              </div>
            `).join('')}
          </div>
        </div>

      </div>

      <!-- STANDUP SUBMISSION MODAL OVERLAY -->
      <div id="dbmStandupModal" style="display:none; position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.8); z-index:9999; align-items:center; justify-content:center; backdrop-filter:blur(6px);">
        <div class="card-glass" style="max-width:540px; width:90%; padding:1.75rem; border-radius:16px; border:1px solid rgba(0,223,137,0.3); background:#0c1017;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem;">
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <span style="font-size:1.4rem;">📋</span>
              <h3 style="margin:0; font-size:1.2rem; color:#fff; font-weight:800;">Log DBM Daily EOD Standup</h3>
            </div>
            <button class="btn-ghost btn-sm" onclick="document.getElementById('dbmStandupModal').style.display='none'">✕</button>
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
                <label style="font-size:0.75rem; color:var(--text-muted); display:block; margin-bottom:0.3rem;">Revenue Today ($ USD):</label>
                <input type="number" id="standupRevenueInput" min="0" step="0.01" value="0" style="width:100%; padding:0.5rem; background:rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.1); border-radius:8px; color:#fff; font-weight:700; font-size:0.9rem;">
              </div>
            </div>

            <div style="margin-bottom:1.25rem;">
              <label style="font-size:0.75rem; color:var(--text-muted); display:block; margin-bottom:0.3rem;">Standup Notes / Wins / Blockers:</label>
              <textarea id="standupNotesInput" rows="3" placeholder="e.g. Completed design & mockup generation for 8 hero products. No blockers." style="width:100%; padding:0.5rem; background:rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.1); border-radius:8px; color:#fff; font-size:0.85rem; resize:vertical;"></textarea>
            </div>

            <div style="display:flex; justify-content:flex-end; gap:0.5rem;">
              <button type="button" class="btn-ghost" onclick="document.getElementById('dbmStandupModal').style.display='none'">Cancel</button>
              <button type="submit" class="btn-primary" style="background:linear-gradient(135deg, #00df89, #06b6d4); font-weight:800;">
                🚀 Submit Standup Report
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    // Populate initial brand options
    window.DBMModule.updateBrandOptions(1);
  }

  window.DBMModule = {
    filterByDBM(dbmId) {
      localStorage.setItem('gro10x_brands_active_tab', 'products');
      const b = brandsState.brands.find(x => x.dbmId === dbmId);
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
        window.DBMModule.updateBrandOptions(document.getElementById('standupDbmSelect')?.value || 1);
      }
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

      const modal = document.getElementById('dbmStandupModal');
      if (modal) modal.style.display = 'none';

      if (window.showToast) window.showToast(`✅ Logged Standup for DBM ${dbmId} (${brandName})!`, 'success');
      render();
    }
  };

  render();
};
