/**
 * public/dbm/dbm-portal.js
 * ─────────────────────────────────────────────────────────────────────────────
 * GRO10X Digital Brand Manager Dedicated Portal Engine v2.6 (Complete 6-Tab Suite)
 * Tab 6: Enhanced Profile & Settings, Telegram Linking, Permanent PIN, and Sign-Out.
 * ─────────────────────────────────────────────────────────────────────────────
 */

(function() {
  'use strict';

  let DBM_STATE = {
    dbm: null,
    assignedBrands: [],
    productsCatalog: {},
    activeBrandId: 1,
    currentStudioCode: 'PLA-14',
    currentStudioStep: 1, // 1 to 5
    tableFilter: 'all', // 'all', 'live', 'today', 'review'
    refCategoryFilter: 'all', // 'all', 'daily', 'finance', 'adhd', 'academic'
    refSearchQuery: '',
    standups: [],
    todaySubmittedCount: 0,
    dailyTarget: 8,
    activeEditingProduct: null
  };

  // Clock runner
  function startDhakaClock() {
    function tick() {
      const el = document.getElementById('dhakaClock');
      if (!el) return;
      const now = new Date();
      const options = { timeZone: 'Asia/Dhaka', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
      el.textContent = '🕒 ' + now.toLocaleTimeString('en-US', options) + ' BST';
    }
    tick();
    setInterval(tick, 1000);
  }

  function showToast(msg, type = 'success') {
    const el = document.getElementById('dbm-toast');
    if (!el) return;
    el.textContent = msg;
    el.style.display = 'block';
    if (type === 'error') {
      el.style.background = '#f43f5e';
      el.style.color = '#fff';
    } else {
      el.style.background = '#00df89';
      el.style.color = '#070b12';
    }
    setTimeout(() => { el.style.display = 'none'; }, 4000);
  }

  function getUserDisplayName() {
    try {
      const user = JSON.parse(localStorage.getItem('gro10x_user') || sessionStorage.getItem('gro10x_user') || '{}');
      if (user && user.name && user.name !== 'DBM 1' && user.name !== 'DBM') {
        return user.name;
      }
    } catch(e) {}
    return DBM_STATE.dbm?.name && DBM_STATE.dbm.name !== 'DBM 1' ? DBM_STATE.dbm.name : 'Anika Nower';
  }

  function getUserEmpCode() {
    try {
      const user = JSON.parse(localStorage.getItem('gro10x_user') || sessionStorage.getItem('gro10x_user') || '{}');
      if (user && user.emp_code) return user.emp_code;
    } catch(e) {}
    return 'GRO-002';
  }

  window.dbmSignOut = function() {
    localStorage.removeItem('gro10x_token');
    localStorage.removeItem('gro10x_user');
    sessionStorage.clear();
    document.cookie = 'gro10x_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    window.location.href = '/auth';
  };

  // Mobile Drawer Toggle
  window.toggleMobileMenu = function(forceClose = false) {
    const sidebar = document.querySelector('aside.dbm-sidebar');
    const backdrop = document.getElementById('sidebarBackdrop');
    if (!sidebar) return;
    if (forceClose) {
      sidebar.classList.remove('open');
      if (backdrop) backdrop.classList.remove('active');
    } else {
      sidebar.classList.toggle('open');
      if (backdrop) backdrop.classList.toggle('active');
    }
  };

  // Router
  function initRouter() {
    window.addEventListener('hashchange', renderCurrentRoute);
    renderCurrentRoute();
  }

  function renderCurrentRoute() {
    if (window.toggleMobileMenu) window.toggleMobileMenu(true);
    const hash = (window.location.hash || '#workspace').replace('#', '');
    const validRoutes = ['workspace', 'studio', 'references', 'output', 'standup', 'settings'];
    const current = validRoutes.includes(hash) ? hash : 'workspace';

    document.querySelectorAll('.nav-link').forEach(link => {
      if (link.getAttribute('data-route') === current) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    const main = document.getElementById('dbm-main');
    if (!main) return;

    if (current === 'workspace') renderWorkspaceView(main);
    else if (current === 'studio') renderStudioView(main);
    else if (current === 'references') renderReferencesView(main);
    else if (current === 'output') renderOutputView(main);
    else if (current === 'standup') renderStandupView(main);
    else if (current === 'settings') renderSettingsView(main);
  }

  // Helper: Get next active draft product (starts from PLA-14 or next draft)
  function getNextActiveDraft(catalog) {
    const draft = catalog.find(p => p.status !== 'Live' && p.status !== 'Pending Review');
    return draft || catalog.find(p => p.code === 'PLA-14') || catalog[13] || catalog[0] || { code: 'PLA-14', name: 'No-Spend Challenge & Impulse Purchase Cooling Tracker' };
  }

  // ── VIEW 1: MY WORKSPACE (HOME) ──
  function renderWorkspaceView(container) {
    const brands = DBM_STATE.assignedBrands || [];
    const displayName = getUserDisplayName();

    // Multi-Brand Portfolio Overview Mode
    if (DBM_STATE.activeBrandId === 'all') {
      let aggregateLive = 0;
      let aggregatePending = [];
      let aggregateTotalProducts = 0;

      const brandCardsData = brands.map(b => {
        const cat = DBM_STATE.productsCatalog[b.id] || [];
        const live = cat.filter(p => p.status === 'Live');
        const pending = cat.filter(p => p.status === 'Pending Review');
        const next = getNextActiveDraft(cat);
        aggregateLive += live.length;
        aggregateTotalProducts += cat.length;
        pending.forEach(p => aggregatePending.push({ ...p, brandName: b.name, brandId: b.id }));
        const pct = Math.min(100, Math.round((live.length / 100) * 100));
        return {
          brand: b,
          catalog: cat,
          liveCount: live.length,
          pendingCount: pending.length,
          remainingCount: Math.max(0, 100 - live.length - pending.length),
          pct,
          next
        };
      });

      const totalGoal = brands.length * 100;
      const totalRemaining = Math.max(0, totalGoal - aggregateLive - aggregatePending.length);

      container.innerHTML = `
        <!-- Brand Switcher Chips on Workspace -->
        <div style="display: flex; gap: 0.5rem; margin-bottom: 1.5rem; overflow-x: auto; background: var(--bg-surface); padding: 0.4rem; border-radius: 14px; border: 1px solid var(--border-subtle);">
          <button onclick="switchWorkspaceBrand('all')" style="padding: 0.55rem 1.1rem; border-radius: 10px; font-weight: 700; font-size: 0.84rem; border: none; cursor: pointer; transition: all 0.2s ease; background: var(--brand-primary); color: #070b12;">
            🌐 All Brands Overview
          </button>
          ${brands.map(b => `
            <button onclick="switchWorkspaceBrand(${b.id})" style="padding: 0.55rem 1.1rem; border-radius: 10px; font-weight: 700; font-size: 0.84rem; border: none; cursor: pointer; transition: all 0.2s ease; background: transparent; color: var(--text-secondary);">
              🛍️ ${b.name} (${b.phase || 'Phase ' + b.id})
            </button>
          `).join('')}
        </div>

        <!-- Multi-Brand Portfolio Header -->
        <div style="margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
          <div>
            <div style="display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.3rem;">
              <h1 style="font-family: var(--font-heading); font-size: 1.8rem; font-weight: 800;">
                🌐 Multi-Brand Portfolio Command
              </h1>
              <span style="background: rgba(168,85,247,0.15); color: #c084fc; border: 1px solid rgba(168,85,247,0.3); font-size: 0.75rem; font-weight: 800; padding: 0.2rem 0.6rem; border-radius: 20px;">
                ${brands.length} Active Empire Brands
              </span>
            </div>
            <p style="color: var(--text-secondary); font-size: 0.95rem;">
              Consolidated 300-SKU scaling overview for <strong style="color: #fff;">${displayName}</strong> across all brand divisions.
            </p>
          </div>

          <button class="btn-secondary" onclick="window.location.hash='#output'" style="background: rgba(0,223,137,0.12); border-color: rgba(0,223,137,0.3); color: #00df89;">
            📊 View Output & Compensation Analytics →
          </button>
        </div>

        <!-- Portfolio Aggregate KPI Strip -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
          <div style="background: rgba(0,223,137,0.08); border: 1px solid rgba(0,223,137,0.25); border-radius: 12px; padding: 0.85rem 1.2rem; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-size: 0.72rem; font-weight: 800; color: #00df89; text-transform: uppercase;">Total Live Empire Listings</div>
              <div style="font-size: 1.5rem; font-weight: 900; color: #fff; margin-top: 0.1rem;">${aggregateLive} <span style="font-size: 0.85rem; color: var(--text-muted);">/ ${totalGoal} Goal</span></div>
            </div>
            <span style="font-size: 1.6rem;">🏪</span>
          </div>

          <div style="background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.25); border-radius: 12px; padding: 0.85rem 1.2rem; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-size: 0.72rem; font-weight: 800; color: #f59e0b; text-transform: uppercase;">Total In Admin Review</div>
              <div style="font-size: 1.5rem; font-weight: 900; color: #fff; margin-top: 0.1rem;">${aggregatePending.length} <span style="font-size: 0.85rem; color: var(--text-muted);">Products</span></div>
            </div>
            <span style="font-size: 1.6rem;">📬</span>
          </div>

          <div style="background: rgba(6,182,212,0.08); border: 1px solid rgba(6,182,212,0.25); border-radius: 12px; padding: 0.85rem 1.2rem; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-size: 0.72rem; font-weight: 800; color: #38bdf8; text-transform: uppercase;">Remaining to Goal</div>
              <div style="font-size: 1.5rem; font-weight: 900; color: #fff; margin-top: 0.1rem;">${totalRemaining} <span style="font-size: 0.85rem; color: var(--text-muted);">SKUs</span></div>
            </div>
            <span style="font-size: 1.6rem;">🚀</span>
          </div>

          <div style="background: rgba(168,85,247,0.08); border: 1px solid rgba(168,85,247,0.25); border-radius: 12px; padding: 0.85rem 1.2rem; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-size: 0.72rem; font-weight: 800; color: #c084fc; text-transform: uppercase;">Estimated Bonus Accrued</div>
              <div style="font-size: 1.5rem; font-weight: 900; color: #c084fc; margin-top: 0.1rem;">$${(aggregateLive * 6.99).toFixed(2)} <span style="font-size: 0.85rem; color: var(--text-muted);">USD</span></div>
            </div>
            <span style="font-size: 1.6rem;">💰</span>
          </div>
        </div>

        <!-- 3 Brand Progression Cards -->
        <h3 style="font-size: 1.2rem; font-weight: 800; margin-bottom: 1rem;">📦 Brand Division Progress (100 SKUs Each)</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.25rem; margin-bottom: 2rem;">
          ${brandCardsData.map(c => `
            <div class="card" style="margin-bottom: 0; display: flex; flex-direction: column; justify-content: space-between; border-top: 4px solid ${c.pct >= 100 ? '#00df89' : c.pct > 0 ? '#38bdf8' : 'var(--border-subtle)'};">
              <div>
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
                  <div>
                    <span style="font-size: 0.72rem; font-weight: 800; color: #38bdf8; text-transform: uppercase;">${c.brand.phase || 'Brand #' + c.brand.id}</span>
                    <h3 style="font-size: 1.25rem; font-weight: 800; color: #fff; margin-top: 0.1rem;">${c.brand.name}</h3>
                    <p style="font-size: 0.78rem; color: var(--text-secondary);">${c.brand.niche || 'Digital Products'}</p>
                  </div>
                  <span style="font-size: 1.2rem; font-weight: 900; color: ${c.pct >= 100 ? '#00df89' : '#38bdf8'};">${c.pct}%</span>
                </div>

                <!-- Progress Bar -->
                <div style="height: 8px; background: rgba(30,41,59,0.8); border-radius: 20px; overflow: hidden; margin-bottom: 1rem;">
                  <div style="height: 100%; width: ${c.pct}%; background: linear-gradient(90deg, #00df89, #06b6d4); border-radius: 20px;"></div>
                </div>

                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; text-align: center; margin-bottom: 1.25rem; background: var(--bg-surface); padding: 0.6rem; border-radius: 10px; border: 1px solid var(--border-subtle);">
                  <div>
                    <div style="font-size: 0.68rem; color: #00df89; font-weight: 700;">🟢 Live</div>
                    <strong style="font-size: 1.1rem; color: #fff;">${c.liveCount}</strong>
                  </div>
                  <div>
                    <div style="font-size: 0.68rem; color: #f59e0b; font-weight: 700;">⏳ Review</div>
                    <strong style="font-size: 1.1rem; color: #fff;">${c.pendingCount}</strong>
                  </div>
                  <div>
                    <div style="font-size: 0.68rem; color: #38bdf8; font-weight: 700;">🎯 Left</div>
                    <strong style="font-size: 1.1rem; color: #fff;">${c.remainingCount}</strong>
                  </div>
                </div>

                <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 1rem;">
                  Immediate Next SKU: <strong style="color: #fff; font-family: var(--font-mono);">${c.next.code}</strong> — ${(c.next.name || c.next.seoTitle || 'Draft').substring(0, 30)}
                </div>
              </div>

              <div style="display: flex; gap: 0.5rem;">
                <button class="btn-primary" onclick="switchWorkspaceBrand(${c.brand.id})" style="flex: 1; justify-content: center; font-size: 0.82rem; padding: 0.55rem 0.8rem;">
                  🎯 Focus Workspace →
                </button>
                <button class="btn-secondary" onclick="switchActiveBrand(${c.brand.id}); window.location.hash='#studio';" style="font-size: 0.82rem; padding: 0.55rem 0.8rem;">
                  🛍️ Studio
                </button>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Cross-Brand Pending Review Triage -->
        <div class="card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <h3 style="font-size: 1.15rem; font-weight: 800;">⏳ Cross-Brand Founder Review Queue</h3>
            <span style="font-size: 0.75rem; color: #f59e0b; font-weight: 700;">${aggregatePending.length} Products Awaiting Approval Across All Brands</span>
          </div>
          ${renderPendingTriageTable(aggregatePending)}
        </div>
      `;
      return;
    }

    const brand = brands.find(b => b.id === DBM_STATE.activeBrandId) || brands[0] || {};
    const catalog = DBM_STATE.productsCatalog[brand.id] || [];
    const today = new Date().toISOString().split('T')[0];

    const todaySubmitted = catalog.filter(p => p.submittedAt && p.submittedAt.startsWith(today)).length;
    DBM_STATE.todaySubmittedCount = todaySubmitted;

    const liveProducts = catalog.filter(p => p.status === 'Live');
    const pendingReview = catalog.filter(p => p.status === 'Pending Review');
    const remainingCount = Math.max(0, 100 - liveProducts.length - pendingReview.length);
    const nextProduct = getNextActiveDraft(catalog);

    const progressPct = Math.min(100, Math.round((todaySubmitted / DBM_STATE.dailyTarget) * 100));

    // Compute today's dynamic SKU batch range from catalog state
    const pendingDrafts = catalog.filter(p => p.status !== 'Live' && p.status !== 'Pending Review');
    const batchStart = pendingDrafts[0] || nextProduct;
    const batchEnd = pendingDrafts[Math.max(0, DBM_STATE.dailyTarget - 1)] || pendingDrafts[pendingDrafts.length - 1] || batchStart;
    const todayBatchLabel = batchStart.code && batchEnd.code && batchStart.code !== batchEnd.code
      ? `SKUs ${batchStart.code} through ${batchEnd.code}`
      : batchStart.code ? `SKU ${batchStart.code}` : 'See Queue Below';


    container.innerHTML = `
      <!-- Brand Switcher Chips on Workspace -->
      <div style="display: flex; gap: 0.5rem; margin-bottom: 1.5rem; overflow-x: auto; background: var(--bg-surface); padding: 0.4rem; border-radius: 14px; border: 1px solid var(--border-subtle);">
        <button onclick="switchWorkspaceBrand('all')" style="padding: 0.55rem 1.1rem; border-radius: 10px; font-weight: 700; font-size: 0.84rem; border: none; cursor: pointer; transition: all 0.2s ease; background: transparent; color: var(--text-secondary);">
          🌐 All Brands Overview
        </button>
        ${brands.map(b => `
          <button onclick="switchWorkspaceBrand(${b.id})" style="padding: 0.55rem 1.1rem; border-radius: 10px; font-weight: 700; font-size: 0.84rem; border: none; cursor: pointer; transition: all 0.2s ease; background: ${b.id === brand.id ? 'var(--brand-primary)' : 'transparent'}; color: ${b.id === brand.id ? '#070b12' : 'var(--text-secondary)'};">
            🛍️ ${b.name} (${b.phase || 'Phase ' + b.id})
          </button>
        `).join('')}
      </div>

      <!-- Top Mission Header -->
      <div style="margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
        <div>
          <div style="display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.3rem;">
            <h1 style="font-family: var(--font-heading); font-size: 1.8rem; font-weight: 800;" id="workspaceWelcomeHeading">
              👋 Welcome, ${displayName}!
            </h1>
            <span style="background: rgba(0,223,137,0.15); color: #00df89; border: 1px solid rgba(0,223,137,0.3); font-size: 0.75rem; font-weight: 800; padding: 0.2rem 0.6rem; border-radius: 20px;">
              🟢 Active Session
            </span>
          </div>
          <p style="color: var(--text-secondary); font-size: 0.95rem;">
            Active Focus: <strong style="color: #fff;">${brand.name || 'PlannerQueenGro'}</strong> · Today's Batch: <strong style="color: #38bdf8;">${todayBatchLabel} (${DBM_STATE.dailyTarget} Products Quota)</strong>
          </p>
        </div>

        <button class="btn-secondary" onclick="window.location.hash='#references'" style="background: rgba(168,85,247,0.12); border-color: rgba(168,85,247,0.3); color: #c084fc;">
          🌟 View 13 Finished Reference Products →
        </button>
      </div>

      <!-- Mini KPI Status Strip -->
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.5rem;">
        <div style="background: rgba(0,223,137,0.08); border: 1px solid rgba(0,223,137,0.25); border-radius: 12px; padding: 0.85rem 1.2rem; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-size: 0.72rem; font-weight: 800; color: #00df89; text-transform: uppercase;">🟢 Live on Etsy Shop</div>
            <div style="font-size: 1.4rem; font-weight: 900; color: #fff; margin-top: 0.1rem;">${liveProducts.length} <span style="font-size: 0.85rem; color: var(--text-muted);">/ 100 Live</span></div>
          </div>
          <span style="font-size: 1.5rem;">🏪</span>
        </div>

        <div style="background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.25); border-radius: 12px; padding: 0.85rem 1.2rem; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-size: 0.72rem; font-weight: 800; color: #f59e0b; text-transform: uppercase;">⏳ In Admin Review</div>
            <div style="font-size: 1.4rem; font-weight: 900; color: #fff; margin-top: 0.1rem;">${pendingReview.length} <span style="font-size: 0.85rem; color: var(--text-muted);">Products</span></div>
          </div>
          <span style="font-size: 1.5rem;">📬</span>
        </div>

        <div style="background: rgba(6,182,212,0.08); border: 1px solid rgba(6,182,212,0.25); border-radius: 12px; padding: 0.85rem 1.2rem; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-size: 0.72rem; font-weight: 800; color: #38bdf8; text-transform: uppercase;">🎯 Remaining to Goal</div>
            <div style="font-size: 1.4rem; font-weight: 900; color: #fff; margin-top: 0.1rem;">${remainingCount} <span style="font-size: 0.85rem; color: var(--text-muted);">SKUs</span></div>
          </div>
          <span style="font-size: 1.5rem;">🚀</span>
        </div>
      </div>

      <!-- Action Card 1: Next Up Highlight Card -->
      <div class="card" style="background: linear-gradient(135deg, rgba(0,223,137,0.08), rgba(6,182,212,0.05)); border: 1px solid rgba(0,223,137,0.35); position: relative; overflow: hidden; margin-bottom: 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1.5rem;">
          <div>
            <span style="font-size: 0.72rem; font-weight: 800; text-transform: uppercase; color: var(--brand-primary); letter-spacing: 0.8px;">
              🎯 YOUR IMMEDIATE NEXT PRODUCT TO BUILD
            </span>
            <h2 style="font-size: 1.5rem; font-weight: 900; margin: 0.3rem 0; color: #fff;">
              ${nextProduct.code}: ${nextProduct.name || nextProduct.seoTitle || 'No-Spend Challenge & Impulse Purchase Cooling Tracker'}
            </h2>
            <p style="color: var(--text-secondary); font-size: 0.85rem;">
              Category: <strong style="color: #e2e8f0;">${nextProduct.category || 'Financial Trackers'}</strong> · Suggested Retail: <strong style="color: #00df89;">$${Number(nextProduct.price || 7.49).toFixed(2)} USD</strong>
            </p>
          </div>

          <div style="display: flex; gap: 0.75rem;">
            <button class="btn-primary" onclick="startProductStudio('${nextProduct.code}')" style="font-size: 1rem; padding: 0.8rem 1.6rem; background: linear-gradient(135deg, #00df89, #06b6d4);">
              ▶️ Start Product ${nextProduct.code} (Step 1)
            </button>
          </div>
        </div>
      </div>

      <!-- Two-Column Status Grid -->
      <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
        <!-- Today's Quota Meter -->
        <div class="card" style="border-left: 4px solid var(--brand-primary);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <div>
              <span style="font-size: 0.72rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted);">Today's Output Progress</span>
              <h3 style="font-size: 1.8rem; font-weight: 900; margin-top: 0.2rem;">
                ${todaySubmitted} <span style="font-size: 1rem; color: var(--text-muted); font-weight: 600;">/ ${DBM_STATE.dailyTarget} Submitted</span>
              </h3>
            </div>
            <div style="text-align: right;">
              <span style="font-size: 1.4rem; font-weight: 800; color: ${progressPct >= 100 ? '#00df89' : '#38bdf8'};">${progressPct}%</span>
              <div style="font-size: 0.72rem; color: var(--text-muted);">Target: ${todayBatchLabel}</div>
            </div>
          </div>

          <!-- Progress Bar -->
          <div style="height: 10px; background: rgba(30,41,59,0.8); border-radius: 20px; overflow: hidden; margin-bottom: 1.25rem;">
            <div style="height: 100%; width: ${progressPct}%; background: linear-gradient(90deg, #00df89, #06b6d4); border-radius: 20px; transition: width 0.4s ease;"></div>
          </div>

          <div style="display: flex; gap: 0.6rem;">
            <button class="btn-secondary" onclick="window.location.hash='#standup'" style="flex: 1; justify-content: center; font-size: 0.82rem;">
              📝 Submit EOD Standup
            </button>
            <button class="btn-secondary" onclick="window.location.hash='#studio'" style="flex: 1; justify-content: center; font-size: 0.82rem;">
              🛍️ Open Studio
            </button>
          </div>
        </div>

        <!-- Gold Standard Snapshot -->
        <div class="card" style="border-left: 4px solid var(--accent-purple);">
          <span style="font-size: 0.72rem; font-weight: 800; text-transform: uppercase; color: var(--accent-purple);">Reference Standard (Completed by Admin)</span>
          <h3 style="font-size: 1.4rem; font-weight: 800; margin-bottom: 0.3rem; color: #fff;">
            ${liveProducts.length} Finished Reference Models
          </h3>
          <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 1rem;">
            Products PLA-01 to PLA-13 are published live. Click below to inspect their exact Canva links, 13 tags, and layout prompt.
          </p>
          <button class="btn-ghost" onclick="openReferenceProductModal('PLA-01')" style="width: 100%; justify-content: center; color: #c084fc; border-color: rgba(168,85,247,0.3);">
            👀 Inspect Reference Example: PLA-01 (Daily Planner)
          </button>
        </div>
      </div>

      <!-- Execution Queue Table with Filters -->
      <div class="card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
          <h3 style="font-size: 1.15rem; font-weight: 800;">📦 ${brand.name} Execution Queue (100 SKUs)</h3>
          
          <!-- Filter Tabs -->
          <div style="display: flex; gap: 0.35rem; background: var(--bg-surface); padding: 0.25rem; border-radius: 8px; border: 1px solid var(--border-subtle);">
            <button onclick="setQueueFilter('all')" class="btn-filter ${DBM_STATE.tableFilter === 'all' ? 'active' : ''}" style="padding: 0.35rem 0.75rem; border-radius: 6px; font-size: 0.75rem; font-weight: 700; border: none; cursor: pointer; background: ${DBM_STATE.tableFilter === 'all' ? 'var(--brand-primary)' : 'transparent'}; color: ${DBM_STATE.tableFilter === 'all' ? '#070b12' : 'var(--text-muted)'};">
              All (${catalog.length})
            </button>
            <button onclick="setQueueFilter('live')" class="btn-filter ${DBM_STATE.tableFilter === 'live' ? 'active' : ''}" style="padding: 0.35rem 0.75rem; border-radius: 6px; font-size: 0.75rem; font-weight: 700; border: none; cursor: pointer; background: ${DBM_STATE.tableFilter === 'live' ? '#a855f7' : 'transparent'}; color: ${DBM_STATE.tableFilter === 'live' ? '#fff' : 'var(--text-muted)'};">
              🌟 Live References (${liveProducts.length})
            </button>
            <button onclick="setQueueFilter('today')" class="btn-filter ${DBM_STATE.tableFilter === 'today' ? 'active' : ''}" style="padding: 0.35rem 0.75rem; border-radius: 6px; font-size: 0.75rem; font-weight: 700; border: none; cursor: pointer; background: ${DBM_STATE.tableFilter === 'today' ? '#06b6d4' : 'transparent'}; color: ${DBM_STATE.tableFilter === 'today' ? '#070b12' : 'var(--text-muted)'};">
              🎯 Today's Batch (${DBM_STATE.dailyTarget})
            </button>
            <button onclick="setQueueFilter('review')" class="btn-filter ${DBM_STATE.tableFilter === 'review' ? 'active' : ''}" style="padding: 0.35rem 0.75rem; border-radius: 6px; font-size: 0.75rem; font-weight: 700; border: none; cursor: pointer; background: ${DBM_STATE.tableFilter === 'review' ? '#f59e0b' : 'transparent'}; color: ${DBM_STATE.tableFilter === 'review' ? '#070b12' : 'var(--text-muted)'};">
              ⏳ In Review (${pendingReview.length})
            </button>
          </div>
        </div>

        <div id="executionTableContainer">
          ${renderFilteredQueueTable(catalog, nextProduct.code)}
        </div>
      </div>
    `;
  }

  window.switchWorkspaceBrand = function(brandId) {
    if (brandId === 'all') {
      DBM_STATE.activeBrandId = 'all';
      renderCurrentRoute();
      return;
    }
    DBM_STATE.activeBrandId = Number(brandId);
    const catalog = DBM_STATE.productsCatalog[brandId] || [];
    const nextProd = getNextActiveDraft(catalog);
    DBM_STATE.currentStudioCode = nextProd.code || 'PLA-14';
    renderCurrentRoute();
  };

  window.setQueueFilter = function(filter) {
    DBM_STATE.tableFilter = filter;
    const brand = DBM_STATE.assignedBrands.find(b => b.id === DBM_STATE.activeBrandId) || DBM_STATE.assignedBrands[0] || {};
    const catalog = DBM_STATE.productsCatalog[brand.id] || [];
    const nextProd = getNextActiveDraft(catalog);

    const container = document.getElementById('executionTableContainer');
    if (container) {
      container.innerHTML = renderFilteredQueueTable(catalog, nextProd.code);
    }
  };

  window.loadMoreQueue = function() {
    DBM_STATE.allQueueLimit = (DBM_STATE.allQueueLimit || 25) + 25;
    const brand = DBM_STATE.assignedBrands.find(b => b.id === DBM_STATE.activeBrandId) || DBM_STATE.assignedBrands[0] || {};
    const catalog = DBM_STATE.productsCatalog[brand.id] || [];
    const nextProd = getNextActiveDraft(catalog);

    const container = document.getElementById('executionTableContainer');
    if (container) {
      container.innerHTML = renderFilteredQueueTable(catalog, nextProd.code);
    }
  };

  function renderFilteredQueueTable(catalog, nextCode) {
    let filtered = [...catalog];
    const filter = DBM_STATE.tableFilter || 'all';

    if (filter === 'live') {
      filtered = catalog.filter(p => p.status === 'Live');
    } else if (filter === 'today') {
      // Dynamic: slice the first dailyTarget pending drafts
      const pendingDrafts = catalog.filter(p => p.status !== 'Live' && p.status !== 'Pending Review');
      filtered = pendingDrafts.slice(0, DBM_STATE.dailyTarget);
    } else if (filter === 'review') {
      filtered = catalog.filter(p => p.status === 'Pending Review');
    } else {
      // Show based on allQueueLimit with load more
      const limit = DBM_STATE.allQueueLimit || 25;
      filtered = catalog.slice(0, limit);
    }

    if (filtered.length === 0) {
      return '<div style="color: var(--text-muted); padding: 2rem; text-align: center;">No products match this filter.</div>';
    }

    const hasMore = filter === 'all' && catalog.length > (DBM_STATE.allQueueLimit || 25);
    const limit = DBM_STATE.allQueueLimit || 25;

    return `
      <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
        <thead>
          <tr style="border-bottom: 1px solid var(--border-subtle); color: var(--text-muted); text-align: left;">
            <th style="padding: 0.6rem;">SKU</th>
            <th style="padding: 0.6rem;">Product Name</th>
            <th style="padding: 0.6rem;">Category</th>
            <th style="padding: 0.6rem;">Price</th>
            <th style="padding: 0.6rem;">Status</th>
            <th style="padding: 0.6rem; text-align: right;">Action</th>
          </tr>
        </thead>
        <tbody>
          ${filtered.map(p => {
            const isNext = p.code === nextCode;
            let statusBadge = '<span style="background:rgba(100,116,139,0.15); color:#94a3b8; padding:0.2rem 0.55rem; border-radius:12px; font-weight:700; font-size:0.75rem;">Draft</span>';
            let actionBtn = `<button class="btn-primary" style="font-size:0.75rem; padding:0.3rem 0.75rem;" onclick="startProductStudio('${p.code}')">Start ➔</button>`;

            if (p.status === 'Pending Review') {
              statusBadge = '<span style="background:rgba(245,158,11,0.15); color:#f59e0b; padding:0.2rem 0.55rem; border-radius:12px; font-weight:700; font-size:0.75rem;">⏳ Pending Review</span>';
              actionBtn = `<button class="btn-secondary" style="font-size:0.75rem; padding:0.3rem 0.75rem;" onclick="startProductStudio('${p.code}')">Edit 🎨</button>`;
            } else if (p.status === 'Live') {
              statusBadge = '<span style="background:rgba(0,223,137,0.15); color:#00df89; padding:0.2rem 0.55rem; border-radius:12px; font-weight:700; font-size:0.75rem;">🟢 Live (Reference)</span>';
              actionBtn = `<button class="btn-ghost" style="font-size:0.75rem; padding:0.3rem 0.75rem; color:#a855f7; border-color:rgba(168,85,247,0.3);" onclick="openReferenceProductModal('${p.code}')">👀 Reference</button>`;
            } else if (isNext) {
              statusBadge = '<span style="background:rgba(6,182,212,0.2); color:#38bdf8; border:1px solid rgba(6,182,212,0.4); padding:0.2rem 0.55rem; border-radius:12px; font-weight:800; font-size:0.75rem;">👉 Next Up</span>';
              actionBtn = `<button class="btn-primary" style="font-size:0.75rem; padding:0.3rem 0.9rem; background:linear-gradient(135deg,#00df89,#06b6d4);" onclick="startProductStudio('${p.code}')">▶️ Start Now</button>`;
            }

            return `
              <tr style="border-bottom: 1px solid var(--border-subtle); background: ${isNext ? 'rgba(6,182,212,0.04)' : 'transparent'};">
                <td style="padding: 0.75rem 0.6rem; font-family: var(--font-mono); font-weight: 700; color: ${isNext ? '#38bdf8' : 'inherit'};">${p.code}</td>
                <td style="padding: 0.75rem 0.6rem; font-weight: 600;">${p.name || p.seoTitle || 'Untitled Product'}</td>
                <td style="padding: 0.75rem 0.6rem; color: var(--text-secondary);">${p.category || 'General'}</td>
                <td style="padding: 0.75rem 0.6rem; font-weight: 700;">$${Number(p.price || 7.49).toFixed(2)}</td>
                <td style="padding: 0.75rem 0.6rem;">${statusBadge}</td>
                <td style="padding: 0.75rem 0.6rem; text-align: right;">${actionBtn}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
      ${hasMore ? `
        <div style="text-align: center; margin-top: 1rem;">
          <button class="btn-secondary" onclick="loadMoreQueue()" style="font-size: 0.82rem; padding: 0.5rem 1.2rem;">
            📦 Load 25 More SKUs (${catalog.length - limit} remaining)
          </button>
        </div>
      ` : ''}
    `;
  }
  }

  // ── BRAND-ADAPTIVE MOCKUP PROMPT GUIDE ──
  function getMockupSlotGuide(brand) {
    const brandName = brand?.name || 'PlannerQueenGro';
    const niche = (brand?.niche || '').toLowerCase();
    const type = (brand?.type || '').toLowerCase();

    // Sublimation / Tumblers / Craft Files (e.g. InkWrapped)
    if (niche.includes('tumbler') || niche.includes('sublimation') || niche.includes('craft') || niche.includes('svg')) {
      return [
        { slot: 1, name: 'Hero 3D Tumbler Wrap Mockup', desc: 'Main Etsy photo: 20oz skinny tumbler with wrap on clean marble surface.' },
        { slot: 2, name: '360° Flat Design Spread', desc: 'Full flat 9.3" x 8.2" seamless wrap preview showing edge-to-edge detail.' },
        { slot: 3, name: 'Straight vs Tapered Fit Guide', desc: 'Infographic explaining straight & tapered PNG files included in pack.' },
        { slot: 4, name: 'Heat Press & Mug Press Specs', desc: 'Time & temperature guide (365°F for 60s, convection oven 375°F for 6 mins).' },
        { slot: 5, name: 'High-Res 300 DPI Print Zoom', desc: 'Close-up macro texture showing ultra-crisp sublimation clarity.' },
        { slot: 6, name: 'Lifestyle Kitchen & Office Scene', desc: 'Holding tumbler in hand with iced coffee or office desk setup.' },
        { slot: 7, name: 'Color & Texture Options', desc: 'White gloss vs stainless steel background render preview.' },
        { slot: 8, name: 'Instant Download & Formats', desc: 'Diagram: 2x 300 DPI PNGs + commercial license + Canva template.' },
        { slot: 9, name: 'Crafter Review & Rating Badge', desc: '5-star badge with quote: "Pressed flawlessly on my Cricut mug press!"' },
        { slot: 10, name: 'Brand Story & Commercial Guarantee', desc: `${brandName} premium craft seal and 100% satisfaction promise.` }
      ];
    }

    // Events / Celebration / Party Suites (e.g. FiestaFoundry)
    if (niche.includes('event') || niche.includes('party') || niche.includes('celebration') || niche.includes('invitation')) {
      return [
        { slot: 1, name: 'Hero Invitation Suite Flatlay', desc: 'Main photo: 5x7 invitation with matching RSVP card, envelope & florals.' },
        { slot: 2, name: 'Smartphone Digital Evite Mockup', desc: 'iPhone mockup showing electronic text/WhatsApp paperless version.' },
        { slot: 3, name: 'Full Matching Decor Bundle', desc: 'Welcome sign, cupcake toppers, favor tags, and banner matching items.' },
        { slot: 4, name: 'Print & Paper Recommendations', desc: 'Cardstock thickness guide (110lb+ / 300gsm, linen & cotton finishes).' },
        { slot: 5, name: 'Customizable Text & Font Guide', desc: 'Highlighting 100% editable Canva fonts with no font installations needed.' },
        { slot: 6, name: 'Tabletop Party Setting Scene', desc: 'Realistic party table spread with place cards and themed decor.' },
        { slot: 7, name: 'Printing Options Infographic', desc: 'Home printing vs Prints of Love / Staples / Canva Print options.' },
        { slot: 8, name: '3-Step Easy Edit Workflow', desc: 'Diagram: Purchase -> Edit text in Canva on phone/PC -> Download & Print.' },
        { slot: 9, name: 'Hostess Review & Social Proof', desc: '5-star badge with quote: "Everyone complimented our party invites!"' },
        { slot: 10, name: 'Brand Story & Event Guarantee', desc: `${brandName} celebration suite seal and instant party guarantee.` }
      ];
    }

    // POD Apparel & Mixed (e.g. WildMutt Co., CozyThreads)
    if (type.includes('pod') || niche.includes('apparel') || niche.includes('pet') || niche.includes('shirt')) {
      return [
        { slot: 1, name: 'Hero Lifestyle Model Shot', desc: 'Model wearing design in aesthetic, well-lit natural environment.' },
        { slot: 2, name: 'Flatlay with Themed Accessories', desc: 'Neatly folded shirt with sunglasses, denim, and trendy accessories.' },
        { slot: 3, name: 'Unisex Size & Fit Chart', desc: 'Clear inch & cm measurement chart for S through 3XL.' },
        { slot: 4, name: 'Color Swatch Variations Grid', desc: 'Grid of 6 top bestselling fabric color options (Black, Sand, Forest, Heather).' },
        { slot: 5, name: 'Fabric & Print Texture Zoom', desc: 'High-definition macro of ring-spun cotton and direct-to-garment print.' },
        { slot: 6, name: 'Back Design or Sleeve Detail', desc: 'Secondary print placement or alternate angle.' },
        { slot: 7, name: 'Eco-Friendly & Ethical Production', desc: 'Badges for water-based inks, ethical manufacturing, and fast dispatch.' },
        { slot: 8, name: 'Care & Washing Instructions', desc: 'Wash cold inside-out, tumble dry low guide for maximum print longevity.' },
        { slot: 9, name: 'Customer Review & Rating Badge', desc: '5-star quote: "Super soft and print quality is top notch!"' },
        { slot: 10, name: 'Brand Story & Guarantee', desc: `${brandName} quality guarantee and easy replacement promise.` }
      ];
    }

    // Default: Digital Planners, Trackers, E-books (e.g. PlannerQueenGro)
    return [
      { slot: 1, name: 'Hero Flatlay Presentation', desc: 'Main Etsy search image: iPad + stylus + clean accessories on warm neutral backdrop.' },
      { slot: 2, name: '3D Isometric Page Fan', desc: 'Shows full product depth with multiple hyperlinked spreads fanned out.' },
      { slot: 3, name: 'Features & Benefits Infographic', desc: 'Bullet points highlighting key indexed tabs, lag-free navigation, and productivity wins.' },
      { slot: 4, name: 'Compatible Devices & Note Apps', desc: 'Badges for GoodNotes 5/6, Notability, Apple iPad, Samsung Notes, and Printable PDF.' },
      { slot: 5, name: 'Daily Priority Matrix Spread', desc: 'Close-up high-resolution zoom of the primary daily planning layout.' },
      { slot: 6, name: 'Habit & Routine Tracker Spread', desc: 'Close-up of streak tracking and monthly habit circles in action.' },
      { slot: 7, name: 'Monthly Overview & Budget Spread', desc: 'Close-up of calendar grid and financial logging section.' },
      { slot: 8, name: 'How to Download in 3 Steps', desc: 'Simple diagram: Purchase -> Download PDF from Etsy -> Import to GoodNotes/Print.' },
      { slot: 9, name: 'Customer Review & Social Proof', desc: '5-star badge with empowering testimonial quote: "Transformed my daily routine!"' },
      { slot: 10, name: 'Brand Story & Guarantee', desc: `${brandName} quality seal and lifetime digital access guarantee.` }
    ];
  }

  // ── LOCAL DRAFT AUTO-SAVE HELPERS ──
  function saveProductDraftLocal(code) {
    try {
      const prod = DBM_STATE.activeEditingProduct;
      if (!prod || !code) return;
      const draftPayload = {
        code: code,
        name: prod.name,
        category: prod.category,
        blueprintPrompt: prod.blueprintPrompt,
        vault: prod.vault,
        canvaTemplateUrl: prod.canvaTemplateUrl || prod.vault?.canvaTemplateUrl,
        notionTemplateUrl: prod.notionTemplateUrl || prod.vault?.notionTemplateUrl,
        mockups: prod.mockups,
        video: prod.video,
        seoTitle: prod.seoTitle,
        seoTags: prod.seoTags,
        seoDescription: prod.seoDescription,
        price: prod.price,
        savedAt: Date.now()
      };
      localStorage.setItem('dbm_studio_draft_' + code, JSON.stringify(draftPayload));
    } catch (e) {}
  }

  function getStoredDraft(code) {
    try {
      const raw = localStorage.getItem('dbm_studio_draft_' + code);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  window.restoreStoredDraft = function(code) {
    const draft = getStoredDraft(code);
    if (!draft || !DBM_STATE.activeEditingProduct) return;
    Object.assign(DBM_STATE.activeEditingProduct, draft);
    showToast('📥 Local draft restored for ' + code + '!');
    render();
  };

  window.discardStoredDraft = function(code) {
    localStorage.removeItem('dbm_studio_draft_' + code);
    showToast('🗑️ Draft discarded');
    render();
  };

  // ── VIEW 2: BRAND STUDIO (5-STEP WIZARD) ──
  function renderStudioView(container) {
    const brands = DBM_STATE.assignedBrands;
    const activeBrand = brands.find(b => b.id === DBM_STATE.activeBrandId) || brands[0] || {};
    const catalog = DBM_STATE.productsCatalog[activeBrand.id] || [];

    const activeProd = catalog.find(p => p.code === DBM_STATE.currentStudioCode) || getNextActiveDraft(catalog);
    DBM_STATE.activeEditingProduct = activeProd;
    const step = DBM_STATE.currentStudioStep || 1;
    const storedDraft = getStoredDraft(activeProd.code);

    container.innerHTML = `
      <!-- Brand Switcher Bar -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 0.75rem;">
        <div style="display: flex; gap: 0.5rem; background: var(--bg-surface); padding: 0.35rem; border-radius: 12px; border: 1px solid var(--border-subtle);">
          ${brands.map(b => `
            <button onclick="switchActiveBrand(${b.id})" style="padding: 0.55rem 1rem; border-radius: 8px; font-weight: 700; font-size: 0.82rem; border: none; cursor: pointer; transition: all 0.2s ease; background: ${b.id === activeBrand.id ? 'var(--brand-primary)' : 'transparent'}; color: ${b.id === activeBrand.id ? '#070b12' : 'var(--text-secondary)'};">
              🛍️ ${b.name}
            </button>
          `).join('')}
        </div>

        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted);">Editing Product SKU:</label>
          <select id="studioProductSelector" onchange="selectStudioProduct(this.value)" style="padding: 0.5rem 0.8rem; background: var(--surface-card); border: 1px solid var(--border-subtle); color: var(--brand-primary); font-family: var(--font-mono); font-weight: 800; border-radius: 8px; cursor: pointer;">
            ${catalog.map(p => `
              <option value="${p.code}" ${p.code === activeProd.code ? 'selected' : ''}>
                ${p.code} · ${(p.name || p.seoTitle || 'Product').substring(0, 32)} (${p.status || 'Draft'})
              </option>
            `).join('')}
          </select>
          <button class="btn-ghost" onclick="openReferenceProductModal('PLA-01')" title="View Finished Reference Model">
            💡 Reference Model
          </button>
        </div>
      </div>

      <!-- Auto-Saved Local Draft Banner (if available) -->
      ${storedDraft && storedDraft.savedAt ? `
        <div style="background: rgba(168, 85, 247, 0.12); border: 1px solid rgba(168, 85, 247, 0.35); border-radius: 10px; padding: 0.65rem 1.1rem; margin-bottom: 1.25rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
          <span style="font-size: 0.82rem; color: #d8b4fe;">
            💾 <strong>Unsaved Local Draft Found</strong> for ${activeProd.code} (Saved ${new Date(storedDraft.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
          </span>
          <div style="display: flex; gap: 0.4rem;">
            <button onclick="restoreStoredDraft('${activeProd.code}')" style="background: var(--accent-purple); color: #fff; border: none; border-radius: 6px; padding: 0.35rem 0.85rem; font-size: 0.75rem; font-weight: 700; cursor: pointer;">
              📥 Restore Draft
            </button>
            <button onclick="discardStoredDraft('${activeProd.code}')" style="background: transparent; color: var(--text-muted); border: 1px solid var(--border-subtle); border-radius: 6px; padding: 0.35rem 0.65rem; font-size: 0.75rem; cursor: pointer;">
              Discard
            </button>
          </div>
        </div>
      ` : ''}

      <!-- Studio Stepper Header (1 to 5) -->
      <div class="studio-stepper">
        <button class="step-item ${step === 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}" onclick="goToStudioStep(1)">
          <span class="step-badge">${step > 1 ? '✓' : '1'}</span>
          <span>1. Blueprint & Prompt</span>
        </button>
        <button class="step-item ${step === 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}" onclick="goToStudioStep(2)">
          <span class="step-badge">${step > 2 ? '✓' : '2'}</span>
          <span>2. Deliverable Vault</span>
        </button>
        <button class="step-item ${step === 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}" onclick="goToStudioStep(3)">
          <span class="step-badge">${step > 3 ? '✓' : '3'}</span>
          <span>3. 10 Mockup Slots</span>
        </button>
        <button class="step-item ${step === 4 ? 'active' : ''} ${step > 4 ? 'completed' : ''}" onclick="goToStudioStep(4)">
          <span class="step-badge">${step > 4 ? '✓' : '4'}</span>
          <span>4. AI Etsy SEO</span>
        </button>
        <button class="step-item ${step === 5 ? 'active' : ''}" onclick="goToStudioStep(5)">
          <span class="step-badge">5</span>
          <span>5. Final QC & Submit</span>
        </button>
      </div>

      <!-- Stepper Content Container -->
      <div class="card" style="border-top: 4px solid var(--brand-primary); min-height: 480px;">
        ${renderStudioStepContent(step, activeProd, activeBrand)}
      </div>
    `;
  }

  function renderStudioStepContent(step, prod, brand) {
    const palette = brand.palette || ['#8B5A7A', '#FAF3E8', '#7D9B76', '#C4887C', '#2E2E2E'];

    if (step === 1) {
      // ── STEP 1: BLUEPRINT & MASTER PROMPT ──
      const prompt = prod.blueprint?.masterPrompt || prod.blueprintPrompt || 
        `Create a high-converting, minimalist printable ${prod.category || 'Productivity Planner'} for ${brand.name}.\n- Dimensions: US Letter (8.5 x 11 in) / A4 Vector PDF\n- Typography: ${brand.fonts || 'Playfair Display + Lato'}\n- Color Palette: ${palette.join(', ')}\n- Aesthetic: Clean minimalist borders, soft neutral margins, hyperlinked index tabs\n- Structure: 16 core spreads including Daily Priority Matrix, Habit Trackers, and Weekly Milestones.`;

      return `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.5rem;">
          <div>
            <h3 style="font-size: 1.25rem; font-weight: 800;">📐 Step 1: Product Blueprint & Creation Master Prompt</h3>
            <p style="color: var(--text-secondary); font-size: 0.85rem;">Use this layout blueprint and master prompt in Google Flow or Canva to build the deliverable template.</p>
          </div>
          <button class="btn-ghost" onclick="openReferenceProductModal('PLA-01')">💡 View How PLA-01 Was Done</button>
        </div>

        <!-- Brand Color Palette Banner -->
        <div style="background: var(--bg-surface); padding: 0.85rem 1.25rem; border-radius: 12px; border: 1px solid var(--border-subtle); margin-bottom: 1.25rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
          <div>
            <strong style="font-size: 0.78rem; color: var(--brand-primary); text-transform: uppercase;">🎨 ${brand.name} Color Palette (Click to copy hex):</strong>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.1rem;">Fonts: ${brand.fonts || 'Playfair Display + Lato'} · Voice: ${brand.voice || 'Warm & motivating'}</div>
          </div>
          <div style="display: flex; gap: 0.5rem;">
            ${palette.map(hex => `
              <button onclick="navigator.clipboard.writeText('${hex}'); showToast('📋 Copied ' + '${hex}');" style="display: flex; align-items: center; gap: 0.35rem; background: var(--surface-card); border: 1px solid var(--border-subtle); padding: 0.25rem 0.55rem; border-radius: 20px; color: #fff; font-size: 0.72rem; font-family: var(--font-mono); font-weight: 700; cursor: pointer;" title="Click to copy ${hex}">
                <span style="width: 14px; height: 14px; border-radius: 50%; background: ${hex}; border: 1px solid rgba(255,255,255,0.2);"></span>
                <span>${hex}</span>
              </button>
            `).join('')}
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
          <div>
            <label style="font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); display: block; margin-bottom: 0.3rem;">Product Working Title</label>
            <input type="text" id="step1ProdName" value="${prod.name || prod.seoTitle || ''}" style="width: 100%; padding: 0.65rem; background: var(--bg-surface); border: 1px solid var(--border-subtle); color: #38bdf8; font-weight: 700; border-radius: 8px;">
          </div>
          <div>
            <label style="font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); display: block; margin-bottom: 0.3rem;">Category Framework</label>
            <select id="step1ProdCategory" style="width: 100%; padding: 0.65rem; background: var(--bg-surface); border: 1px solid var(--border-subtle); color: #fff; font-weight: 600; border-radius: 8px;">
              ${(brand.categories || ['Daily & Weekly Planners', 'Financial Trackers', 'Goal Setting & Habits', 'Life & Project Mgmt', 'Wellness & Self-Dev', 'Work & Career', 'Bundles', 'E-books']).map(c => `
                <option value="${c}" ${c === prod.category ? 'selected' : ''}>${c}</option>
              `).join('')}
            </select>
          </div>
        </div>

        <div style="margin-bottom: 1.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
            <label style="font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: var(--brand-primary);">⚡ Google Flow / Canva Master Creation Prompt</label>
            <div style="display: flex; gap: 0.4rem;">
              <button class="btn-ghost" style="padding: 0.25rem 0.6rem; font-size: 0.75rem;" onclick="navigator.clipboard.writeText(document.getElementById('step1Prompt').value); showToast('📋 Copied Master Prompt!');">
                📋 Copy Prompt
              </button>
              <button class="btn-secondary" style="padding: 0.25rem 0.6rem; font-size: 0.75rem;" onclick="generateAiBlueprintForProduct('${prod.code}')">
                ✨ Auto-Generate Blueprint 2.0
              </button>
            </div>
          </div>
          <textarea id="step1Prompt" rows="6" style="width: 100%; background: var(--bg-surface); border: 1px solid rgba(0,223,137,0.3); padding: 0.85rem; border-radius: 10px; color: #e2e8f0; font-size: 0.82rem; font-family: var(--font-mono); line-height: 1.5;">${prompt}</textarea>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 0.75rem; border-top: 1px solid var(--border-subtle); padding-top: 1.25rem;">
          <button class="btn-primary" onclick="saveStep1AndContinue('${prod.code}')">
            Continue to Step 2: Deliverable Vault ➔
          </button>
        </div>
      `;
    }

    if (step === 2) {
      // ── STEP 2: DELIVERABLE VAULT & CANVA LINK ──
      const canvaUrl = prod.vault?.canvaTemplateUrl || prod.canvaTemplateUrl || '';
      const notionUrl = prod.vault?.notionTemplateUrl || prod.notionTemplateUrl || '';
      const isCanvaTemplate = canvaUrl.includes('canva.com/design/') && (canvaUrl.includes('/template/') || canvaUrl.includes('template=') || canvaUrl.includes('shared'));
      const isCanvaDesign = canvaUrl.includes('canva.com/design/');

      return `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
          <div>
            <h3 style="font-size: 1.25rem; font-weight: 800;">📦 Step 2: Deliverable Vault & Template Links</h3>
            <p style="color: var(--text-secondary); font-size: 0.85rem;">Attach the finished Canva template link or upload the export PDF that the customer downloads.</p>
          </div>
          <span style="font-size: 0.8rem; color: #38bdf8; font-weight: 700;">SKU: ${prod.code}</span>
        </div>

        <div style="display: flex; flex-direction: column; gap: 1.25rem; margin-bottom: 1.5rem;">
          <div style="background: var(--bg-surface); padding: 1.25rem; border-radius: 12px; border: 1px solid var(--border-subtle);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
              <label style="font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: var(--brand-primary);">
                🎨 Canva Template Share Link (Recommended)
              </label>
              <div id="canvaLinkStatus">
                ${isCanvaTemplate ? '<span style="color:#00df89; font-weight:800; font-size:0.75rem;">🟢 Valid Template Share Link</span>' : isCanvaDesign ? '<span style="color:#f59e0b; font-weight:700; font-size:0.75rem;">⚠️ Design Link (Ensure "Share as Template" is on)</span>' : '<span style="color:var(--text-muted); font-size:0.75rem;">Paste share link below</span>'}
              </div>
            </div>
            
            <div style="display: flex; gap: 0.5rem;">
              <input type="url" id="step2CanvaUrl" value="${canvaUrl}" oninput="validateCanvaLinkInput(this.value)" placeholder="https://www.canva.com/design/DA.../template/..." style="flex: 1; padding: 0.7rem; background: var(--surface-card); border: 1px solid var(--border-subtle); color: #fff; border-radius: 8px; font-size: 0.88rem;">
              <button class="btn-secondary" onclick="testCanvaLink()" style="font-size: 0.8rem; padding: 0.5rem 1rem;">
                🔗 Test Link ↗
              </button>
            </div>
            <p style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.3rem;">Ensure template sharing permissions are set to "Anyone with the link can use as template".</p>
          </div>

          <div style="background: var(--bg-surface); padding: 1.25rem; border-radius: 12px; border: 1px solid var(--border-subtle);">
            <label style="font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: var(--accent-purple); display: block; margin-bottom: 0.4rem;">
              📝 Optional: Notion Template Link / Google Drive Asset Link
            </label>
            <input type="url" id="step2NotionUrl" value="${notionUrl}" placeholder="https://notion.so/..." style="width: 100%; padding: 0.7rem; background: var(--surface-card); border: 1px solid var(--border-subtle); color: #fff; border-radius: 8px; font-size: 0.88rem;">
          </div>

          <div style="background: var(--bg-surface); padding: 1.25rem; border-radius: 12px; border: 1px solid var(--border-subtle);">
            <label style="font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); display: block; margin-bottom: 0.4rem;">
              📁 Upload Direct Deliverable File (PDF / ZIP into Vault Storage)
            </label>
            <input type="file" id="step2VaultFile" accept=".pdf,.zip,.png,.jpg" style="width: 100%; padding: 0.5rem; background: var(--surface-card); border: 1px solid var(--border-subtle); color: var(--text-secondary); border-radius: 8px; font-size: 0.82rem;">
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; border-top: 1px solid var(--border-subtle); padding-top: 1.25rem;">
          <button class="btn-secondary" onclick="goToStudioStep(1)">← Back to Step 1</button>
          <button class="btn-primary" onclick="saveStep2AndContinue('${prod.code}')">
            Continue to Step 3: Mockups ➔
          </button>
        </div>
      `;
    }

    if (step === 3) {
      // ── STEP 3: 10 MOCKUP SLOTS & VIDEO ──
      const mockups = prod.mockups || prod.mockupUrls || [];
      const videoUrl = prod.video?.url || (typeof prod.video === 'string' ? prod.video : '') || '';
      const mockupSlots = getMockupSlotGuide(brand);

      return `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.5rem;">
          <div>
            <h3 style="font-size: 1.25rem; font-weight: 800;">🖼️ Step 3: 10 Conversion Mockup Slots & Video</h3>
            <p style="color: var(--text-secondary); font-size: 0.85rem;">Attach image URLs or mockup files for all 10 high-converting Etsy listing slots.</p>
          </div>
          <button class="btn-secondary" onclick="openBulkMockupPrompt()" style="font-size: 0.8rem; padding: 0.4rem 0.85rem;">
            📋 Bulk Paste Image URLs
          </button>
        </div>

        <!-- 10 Mockup Slots Grid -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem; margin-bottom: 1.5rem; max-height: 380px; overflow-y: auto; padding-right: 0.5rem;">
          ${mockupSlots.map(s => {
            const val = mockups[s.slot - 1] || '';
            const hasImg = val.startsWith('http');
            return `
              <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); padding: 0.75rem; border-radius: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.2rem;">
                  <strong style="font-size: 0.78rem; color: var(--brand-primary);">Slot ${s.slot}: ${s.name}</strong>
                  ${hasImg ? '<span style="font-size:0.68rem; color:#00df89; font-weight:800;">✓ Attached</span>' : ''}
                </div>
                <div style="font-size: 0.7rem; color: var(--text-muted); margin-bottom: 0.4rem;">${s.desc}</div>
                <div style="display: flex; gap: 0.4rem; align-items: center;">
                  <input type="text" class="mockup-input-slot" data-slot="${s.slot}" value="${val}" placeholder="Image URL (e.g. https://...)" style="flex: 1; padding: 0.45rem; background: var(--surface-card); border: 1px solid var(--border-subtle); color: #fff; border-radius: 6px; font-size: 0.78rem;">
                  ${hasImg ? `<a href="${val}" target="_blank" style="font-size:0.75rem; color:#38bdf8; text-decoration:none; padding:0.2rem 0.4rem;" title="Preview image">👁️</a>` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Video Slot -->
        <div style="background: var(--bg-surface); padding: 1rem 1.25rem; border-radius: 10px; border: 1px solid var(--border-subtle); margin-bottom: 1.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
            <label style="font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: var(--accent-purple);">
              🎬 Listing Demo Video (Etsy 5–15s Preview Clip)
            </label>
            ${videoUrl ? '<span style="font-size:0.7rem; color:#00df89; font-weight:800;">✓ Video Attached</span>' : ''}
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; align-items: center;">
            <div>
              <span style="font-size: 0.72rem; color: var(--text-muted); display: block; margin-bottom: 0.25rem;">Option A: Video CDN / MP4 URL</span>
              <input type="url" id="step3VideoUrl" value="${videoUrl}" placeholder="https://gro10x-ai.vercel.app/demo.mp4" style="width: 100%; padding: 0.55rem; background: var(--surface-card); border: 1px solid var(--border-subtle); color: #fff; border-radius: 6px; font-size: 0.82rem;">
            </div>
            <div>
              <span style="font-size: 0.72rem; color: var(--text-muted); display: block; margin-bottom: 0.25rem;">Option B: Upload MP4 / MOV Video File (max 50MB)</span>
              <input type="file" id="step3VideoFile" accept=".mp4,.mov,.webm" style="width: 100%; padding: 0.4rem; background: var(--surface-card); border: 1px solid var(--border-subtle); color: var(--text-secondary); border-radius: 6px; font-size: 0.78rem;">
            </div>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; border-top: 1px solid var(--border-subtle); padding-top: 1.25rem;">
          <button class="btn-secondary" onclick="goToStudioStep(2)">← Back to Step 2</button>
          <button class="btn-primary" onclick="saveStep3AndContinue('${prod.code}')">
            Continue to Step 4: AI Etsy SEO ➔
          </button>
        </div>
      `;
    }

    if (step === 4) {
      // ── STEP 4: AI ETSY SEO & PRICING ──
      const title = prod.seoTitle || prod.seo?.title || prod.name || '';
      const tags = Array.isArray(prod.seoTags) ? prod.seoTags.join(', ') : (prod.seo?.tags?.join(', ') || '');
      const desc = prod.seoDescription || prod.seo?.description || `✨ Instant Download Digital ${prod.name || 'Productivity Planner'} by ${brand.name}\n\nWHAT IS INCLUDED:\n- High-resolution printable PDF files (US Letter & A4)\n- Hyperlinked GoodNotes & Notability digital template\n- Canva editable master link\n- Lifetime access & free updates\n\nHOW IT WORKS:\n1. Complete your purchase\n2. Download the instant access PDF from Etsy\n3. Open in your favorite note-taking app or print at home!`;
      const price = Number(prod.price || 7.49).toFixed(2);
      const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);

      return `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.5rem;">
          <div>
            <h3 style="font-size: 1.25rem; font-weight: 800;">📈 Step 4: AI Etsy SEO Package & Retail Pricing</h3>
            <p style="color: var(--text-secondary); font-size: 0.85rem;">Generate and refine the Etsy title (max 140 chars), 13 high-intent SEO tags, and retail price.</p>
          </div>
          <button class="btn-primary" onclick="generateAiSeoForCurrentProduct('${prod.code}')" style="background: linear-gradient(135deg, #a855f7, #06b6d4);">
            ✨ Generate AI SEO Package
          </button>
        </div>

        <div style="display: grid; grid-template-columns: 1.4fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
          <div>
            <!-- Title with character counter -->
            <div style="margin-bottom: 1rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.3rem;">
                <label style="font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: var(--brand-primary);">Etsy Listing Title</label>
                <span id="titleCharCount" style="font-size: 0.75rem; font-weight: 700; color: ${title.length > 140 ? '#f43f5e' : '#38bdf8'};">${title.length} / 140 Chars</span>
              </div>
              <input type="text" id="step4Title" value="${title.replace(/"/g, '&quot;')}" oninput="updateTitleCharCount(this.value)" placeholder="Etsy listing title with top search keywords..." style="width: 100%; padding: 0.7rem; background: var(--bg-surface); border: 1px solid var(--border-subtle); color: #fff; border-radius: 8px; font-weight: 600; font-size: 0.88rem;">
            </div>

            <!-- 13 Tags with Counter & Copy Action -->
            <div style="margin-bottom: 1rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.3rem;">
                <label style="font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: var(--accent-cyan);">13 Etsy SEO Tags (Comma Separated)</label>
                <div style="display: flex; gap: 0.4rem; align-items: center;">
                  <span id="tagsCountBadge" style="font-size: 0.75rem; font-weight: 700; color: ${tagList.length === 13 ? '#00df89' : '#f59e0b'};">${tagList.length} / 13 Tags</span>
                  <button class="btn-ghost" style="padding: 0.15rem 0.45rem; font-size: 0.7rem;" onclick="copyTagsToClipboard()">📋 Copy 13 Tags</button>
                </div>
              </div>
              <input type="text" id="step4Tags" value="${tags.replace(/"/g, '&quot;')}" oninput="updateTagCountBadge(this.value)" placeholder="daily planner, productivity tracker, digital planner, goodnotes..." style="width: 100%; padding: 0.7rem; background: var(--bg-surface); border: 1px solid var(--border-subtle); color: #fff; border-radius: 8px; font-size: 0.85rem;">
            </div>

            <!-- Description -->
            <div>
              <label style="font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); display: block; margin-bottom: 0.3rem;">Product Description & What's Included</label>
              <textarea id="step4Desc" rows="6" style="width: 100%; background: var(--bg-surface); border: 1px solid var(--border-subtle); color: #e2e8f0; padding: 0.7rem; border-radius: 8px; font-family: var(--font-body); font-size: 0.82rem; line-height: 1.4;">${desc}</textarea>
            </div>
          </div>

          <!-- Right Column: Price & SEO Guidance -->
          <div style="display: flex; flex-direction: column; gap: 1rem;">
            <div style="background: var(--bg-surface); padding: 1.25rem; border-radius: 12px; border: 1px solid var(--border-subtle);">
              <label style="font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: var(--brand-primary); display: block; margin-bottom: 0.3rem;">Retail Price ($ USD)</label>
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span style="font-size: 1.4rem; font-weight: 900; color: #00df89;">$</span>
                <input type="number" step="0.50" id="step4Price" value="${price}" style="width: 100%; font-size: 1.3rem; font-weight: 900; padding: 0.5rem; background: var(--surface-card); border: 1px solid var(--border-subtle); color: #fff; border-radius: 8px;">
              </div>
              <p style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.4rem;">Standard digital planner retail: $7.49 - $12.99 USD.</p>
            </div>

            <div style="background: rgba(168,85,247,0.06); padding: 1rem; border-radius: 12px; border: 1px solid rgba(168,85,247,0.25);">
              <strong style="font-size: 0.82rem; color: #c084fc; display: block; margin-bottom: 0.3rem;">💡 High-Converting SEO Rules:</strong>
              <ul style="font-size: 0.75rem; color: var(--text-secondary); line-height: 1.5; padding-left: 1.1rem;">
                <li>Keep Title under 140 characters.</li>
                <li>Include primary keyword in the first 30 characters.</li>
                <li>Ensure all 13 tags are filled without punctuation.</li>
                <li>Avoid repeating exact same keyword in all tags.</li>
              </ul>
            </div>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; border-top: 1px solid var(--border-subtle); padding-top: 1.25rem;">
          <button class="btn-secondary" onclick="goToStudioStep(3)">← Back to Step 3</button>
          <button class="btn-primary" onclick="saveStep4AndContinue('${prod.code}')">
            Continue to Step 5: Final QC & Submit ➔
          </button>
        </div>
      `;
    }

    if (step === 5) {
      // ── STEP 5: FINAL QC & SUBMIT ──
      const title = (prod.seoTitle || prod.seo?.title || prod.name || '').trim();
      const canva = (prod.vault?.canvaTemplateUrl || prod.canvaTemplateUrl || '').trim();
      const price = Number(prod.price || 7.49).toFixed(2);
      const tags = Array.isArray(prod.seoTags) ? prod.seoTags : [];
      const hasCanva = Boolean(canva && (canva.startsWith('http://') || canva.startsWith('https://')));
      const hasTitle = Boolean(title && title.length >= 10 && title.length <= 140);
      const hasTags = tags.length >= 5;
      const hasPrice = Number(price) >= 0.20;
      const isReadyToSubmit = hasTitle && hasCanva && hasTags && hasPrice;

      return `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
          <div>
            <h3 style="font-size: 1.25rem; font-weight: 800;">🚀 Step 5: Pre-Flight QC Verification & Submit for Admin Review</h3>
            <p style="color: var(--text-secondary); font-size: 0.85rem;">Review all quality checks before submitting for final Admin approval and Etsy publishing.</p>
          </div>
          <span style="font-size: 0.85rem; font-weight: 800; color: #00df89; background: rgba(0,223,137,0.1); padding: 0.3rem 0.75rem; border-radius: 20px;">
            SKU: ${prod.code}
          </span>
        </div>

        <!-- Summary Review Box -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
          <div style="background: var(--bg-surface); padding: 1.25rem; border-radius: 12px; border: 1px solid var(--border-subtle);">
            <h4 style="font-size: 0.88rem; font-weight: 800; color: #38bdf8; margin-bottom: 0.8rem;">📋 Asset Summary</h4>
            <div style="font-size: 0.82rem; display: flex; flex-direction: column; gap: 0.5rem;">
              <div><strong>Title:</strong> ${title ? title : '<span style="color:#f43f5e;">Missing Title (Go to Step 4)</span>'}</div>
              <div><strong>Category:</strong> ${prod.category || 'General'}</div>
              <div><strong>Price:</strong> $${price} USD</div>
              <div><strong>Canva Deliverable:</strong> ${hasCanva ? '<a href="' + canva + '" target="_blank" style="color:#00df89;">🔗 Open Canva Link ↗</a>' : '<span style="color:#f43f5e;">Missing Link (Go to Step 2)</span>'}</div>
              <div><strong>Tags Attached:</strong> ${tags.length} / 13 Tags ${tags.length < 5 ? '<span style="color:#f43f5e;">(Min 5 needed)</span>' : ''}</div>
            </div>
          </div>

          <!-- 4-Point Self-Checklist -->
          <div style="background: var(--bg-surface); padding: 1.25rem; border-radius: 12px; border: 1px solid var(--border-subtle);">
            <h4 style="font-size: 0.88rem; font-weight: 800; color: var(--brand-primary); margin-bottom: 0.8rem;">✅ Auto-Quality Verification Checklist</h4>
            <div style="display: flex; flex-direction: column; gap: 0.6rem; font-size: 0.82rem;">
              <label style="display: flex; align-items: center; gap: 0.5rem;">
                <span style="color:${hasTitle ? '#00df89' : '#f43f5e'}; font-weight:800;">${hasTitle ? '✓' : '✗'}</span>
                <span>Etsy SEO Title is formatted (10–140 chars): <strong>${title.length} chars</strong></span>
              </label>
              <label style="display: flex; align-items: center; gap: 0.5rem;">
                <span style="color:${hasTags ? '#00df89' : '#f43f5e'}; font-weight:800;">${hasTags ? '✓' : '✗'}</span>
                <span>High-intent search tags populated: <strong>${tags.length} tags</strong> (min 5)</span>
              </label>
              <label style="display: flex; align-items: center; gap: 0.5rem;">
                <span style="color:${hasCanva ? '#00df89' : '#f43f5e'}; font-weight:800;">${hasCanva ? '✓' : '✗'}</span>
                <span>Canva deliverable template link attached & valid URL</span>
              </label>
              <label style="display: flex; align-items: center; gap: 0.5rem;">
                <span style="color:${hasPrice ? '#00df89' : '#f43f5e'}; font-weight:800;">${hasPrice ? '✓' : '✗'}</span>
                <span>Retail price verified: <strong>$${price} USD</strong></span>
              </label>
            </div>
          </div>
        </div>

        <!-- Big Submit Action -->
        <div style="background: ${isReadyToSubmit ? 'linear-gradient(135deg, rgba(0,223,137,0.12), rgba(6,182,212,0.08))' : 'rgba(244,63,94,0.08)'}; border: 1px solid ${isReadyToSubmit ? 'rgba(0,223,137,0.3)' : 'rgba(244,63,94,0.3)'}; border-radius: 14px; padding: 1.5rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h4 style="font-size: 1.1rem; font-weight: 800; color: #fff;">
              ${isReadyToSubmit ? 'Ready to proceed for publication?' : '⚠️ Action Required Before Submission'}
            </h4>
            <p style="color: var(--text-secondary); font-size: 0.82rem;">
              ${isReadyToSubmit 
                ? 'Admin receives an immediate Telegram push notification to review and publish to Etsy.' 
                : 'Please complete the highlighted checklist items above before submitting.'}
            </p>
          </div>
          <button class="btn-primary" onclick="finalSubmitProductForReview('${prod.code}')" style="font-size: 1.05rem; padding: 0.85rem 2rem; background: ${isReadyToSubmit ? 'linear-gradient(135deg, #00df89, #06b6d4)' : '#4b5563'}; cursor: ${isReadyToSubmit ? 'pointer' : 'not-allowed'};">
            🚀 Submit for Admin Review & Publish
          </button>
        </div>

        <div style="display: flex; justify-content: flex-start; border-top: 1px solid var(--border-subtle); padding-top: 1.25rem; margin-top: 1.5rem;">
          <button class="btn-secondary" onclick="goToStudioStep(4)">← Back to Step 4: SEO</button>
        </div>
      `;
    }
  }

  window.goToStudioStep = function(stepNum) {
    DBM_STATE.currentStudioStep = stepNum;
    const main = document.getElementById('dbm-main');
    if (main && window.location.hash === '#studio') {
      renderStudioView(main);
    }
  };

  window.startProductStudio = function(code) {
    DBM_STATE.currentStudioCode = code;
    DBM_STATE.currentStudioStep = 1;
    window.location.hash = '#studio';
  };

  window.selectStudioProduct = function(code) {
    DBM_STATE.currentStudioCode = code;
    DBM_STATE.currentStudioStep = 1;
    renderCurrentRoute();
  };

  window.switchActiveBrand = function(brandId) {
    DBM_STATE.activeBrandId = Number(brandId);
    const catalog = DBM_STATE.productsCatalog[brandId] || [];
    const nextProd = getNextActiveDraft(catalog);
    DBM_STATE.currentStudioCode = nextProd.code || 'PLA-14';
    DBM_STATE.currentStudioStep = 1;
    renderCurrentRoute();
  };

  window.validateCanvaLinkInput = function(val) {
    const el = document.getElementById('canvaLinkStatus');
    if (!el) return;
    const trimmed = (val || '').trim();
    if (trimmed.includes('canva.com/design/') && (trimmed.includes('/template/') || trimmed.includes('template=') || trimmed.includes('shared'))) {
      el.innerHTML = '<span style="color:#00df89; font-weight:800; font-size:0.75rem;">🟢 Valid Template Share Link</span>';
    } else if (trimmed.includes('canva.com/design/')) {
      el.innerHTML = '<span style="color:#f59e0b; font-weight:700; font-size:0.75rem;">⚠️ Design Link (Ensure "Share as Template" is on)</span>';
    } else if (trimmed.includes('canva.com')) {
      el.innerHTML = '<span style="color:#f59e0b; font-size:0.75rem;">⚠️ Ensure link points to specific /design/</span>';
    } else if (trimmed.length > 5) {
      el.innerHTML = '<span style="color:#f43f5e; font-size:0.75rem;">❌ Must be a canva.com/design/ link</span>';
    } else {
      el.innerHTML = '<span style="color:var(--text-muted); font-size:0.75rem;">Paste share link below</span>';
    }
  };

  window.testCanvaLink = function() {
    const url = document.getElementById('step2CanvaUrl')?.value.trim();
    if (url) {
      window.open(url, '_blank');
    } else {
      showToast('Please enter a Canva link first', 'error');
    }
  };

  window.openBulkMockupPrompt = function() {
    const raw = prompt('Paste up to 10 image URLs (separated by newlines or commas):');
    if (!raw) return;
    const urls = raw.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
    const inputs = document.querySelectorAll('.mockup-input-slot');
    inputs.forEach((inp, idx) => {
      if (urls[idx]) inp.value = urls[idx];
    });
    showToast('Loaded ' + urls.length + ' mockup URLs!');
  };

  window.updateTitleCharCount = function(val) {
    const el = document.getElementById('titleCharCount');
    if (!el) return;
    const len = val.length;
    el.textContent = len + ' / 140 Chars';
    el.style.color = len > 140 ? '#f43f5e' : '#38bdf8';
  };

  window.updateTagCountBadge = function(val) {
    const el = document.getElementById('tagsCountBadge');
    if (!el) return;
    const tags = val.split(',').map(s => s.trim()).filter(Boolean);
    el.textContent = tags.length + ' / 13 Tags';
    el.style.color = tags.length === 13 ? '#00df89' : '#f59e0b';
  };

  window.copyTagsToClipboard = function() {
    const tags = document.getElementById('step4Tags')?.value.trim();
    if (tags) {
      navigator.clipboard.writeText(tags);
      showToast('📋 Copied 13 tags to clipboard!');
    }
  };

  window.saveStep1AndContinue = function(code) {
    const name = document.getElementById('step1ProdName')?.value.trim();
    const category = document.getElementById('step1ProdCategory')?.value;
    const prompt = document.getElementById('step1Prompt')?.value.trim();

    if (DBM_STATE.activeEditingProduct) {
      if (name) DBM_STATE.activeEditingProduct.name = name;
      if (category) DBM_STATE.activeEditingProduct.category = category;
      if (prompt) DBM_STATE.activeEditingProduct.blueprintPrompt = prompt;
    }
    saveProductDraftLocal(code);
    showToast('Saved Step 1 Blueprint!');
    goToStudioStep(2);
  };

  window.generateAiBlueprintForProduct = async function(code) {
    const name = document.getElementById('step1ProdName')?.value.trim() || 'Product ' + code;
    const category = document.getElementById('step1ProdCategory')?.value || 'Daily Planners';
    const brand = DBM_STATE.assignedBrands.find(b => b.id === DBM_STATE.activeBrandId) || DBM_STATE.assignedBrands[0];

    showToast('🤖 Generating Blueprint 2.0...', 'success');

    try {
      const res = await DBM_API.post('/ai/product-blueprint', {
        productName: name,
        title: name,
        category: category,
        brandName: brand.name,
        brandId: brand.id
      }).catch(() => null);

      if (res && res.blueprint) {
        const bp = res.blueprint;
        const promptText = bp.masterPrompt || bp.googleFlowPrompt || JSON.stringify(bp, null, 2);
        document.getElementById('step1Prompt').value = promptText;
        showToast('✅ Generated Blueprint 2.0!');
      } else {
        showToast('Updated blueprint template', 'success');
      }
    } catch(e) {
      showToast('Loaded blueprint prompt', 'success');
    }
  };

  window.saveStep2AndContinue = async function(code) {
    const brand = DBM_STATE.assignedBrands.find(b => b.id === DBM_STATE.activeBrandId) || DBM_STATE.assignedBrands[0];
    const canva = document.getElementById('step2CanvaUrl')?.value.trim();
    const notion = document.getElementById('step2NotionUrl')?.value.trim();
    const fileInput = document.getElementById('step2VaultFile');
    const file = fileInput?.files?.[0];

    if (DBM_STATE.activeEditingProduct) {
      if (!DBM_STATE.activeEditingProduct.vault) DBM_STATE.activeEditingProduct.vault = {};
      if (canva) DBM_STATE.activeEditingProduct.vault.canvaTemplateUrl = canva;
      if (notion) DBM_STATE.activeEditingProduct.vault.notionTemplateUrl = notion;
    }

    if (file && brand) {
      showToast('📤 Uploading deliverable to Vault Storage...', 'success');
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('productCode', code);
        if (canva) formData.append('canvaTemplateUrl', canva);
        if (notion) formData.append('notionTemplateUrl', notion);

        const uploadRes = await DBM_API.post('/brands/' + brand.id + '/vault/upload', formData);
        if (uploadRes && uploadRes.success && uploadRes.vault) {
          if (DBM_STATE.activeEditingProduct) {
            DBM_STATE.activeEditingProduct.vault = uploadRes.vault;
          }
          showToast('✅ Deliverable uploaded to Vault!');
        }
      } catch (err) {
        console.warn('[Vault Upload Warning]:', err.message);
        showToast('Saved template links (file upload skipped or failed)', 'error');
      }
    } else {
      showToast('Saved Step 2 Deliverable Vault!');
    }

    saveProductDraftLocal(code);
    goToStudioStep(3);
  };

  window.saveStep3AndContinue = async function(code) {
    const brand = DBM_STATE.assignedBrands.find(b => b.id === DBM_STATE.activeBrandId) || DBM_STATE.assignedBrands[0];
    const inputs = document.querySelectorAll('.mockup-input-slot');
    const mockups = [];
    inputs.forEach(inp => {
      const val = inp.value.trim();
      if (val) mockups.push(val);
    });

    const videoFileInput = document.getElementById('step3VideoFile');
    const videoFile = videoFileInput?.files?.[0];
    let finalVideoUrl = document.getElementById('step3VideoUrl')?.value.trim() || '';

    // If direct video file attached, upload to Vault storage
    if (videoFile && brand) {
      showToast('📤 Uploading video asset to Vault...', 'success');
      try {
        const formData = new FormData();
        formData.append('file', videoFile);
        formData.append('productCode', code);
        const uploadRes = await DBM_API.post('/brands/' + brand.id + '/vault/upload', formData);
        if (uploadRes && uploadRes.success && uploadRes.vault?.fileUrl) {
          finalVideoUrl = uploadRes.vault.fileUrl;
          showToast('✅ Video asset uploaded!');
        }
      } catch (err) {
        console.warn('[Video Upload Notice]:', err.message);
      }
    }

    if (DBM_STATE.activeEditingProduct) {
      DBM_STATE.activeEditingProduct.mockups = mockups;
      if (finalVideoUrl) DBM_STATE.activeEditingProduct.video = { url: finalVideoUrl };
    }

    // Auto-save locally
    saveProductDraftLocal(code);

    // Non-blocking background persistence to server
    if (brand) {
      DBM_API.post('/brands/' + brand.id + '/product/' + code + '/save-assets', {
        mockups: mockups,
        videoUrl: finalVideoUrl
      }).catch(e => console.warn('[Assets Auto-Save Notice]:', e.message));
    }

    showToast('Saved Step 3 Mockup Slots & Video!');
    goToStudioStep(4);
  };

  window.saveStep4AndContinue = function(code) {
    const title = document.getElementById('step4Title')?.value.trim();
    const tagsRaw = document.getElementById('step4Tags')?.value.trim();
    const desc = document.getElementById('step4Desc')?.value.trim();
    const price = Number(document.getElementById('step4Price')?.value) || 7.49;

    if (DBM_STATE.activeEditingProduct) {
      if (title) DBM_STATE.activeEditingProduct.seoTitle = title;
      if (tagsRaw) DBM_STATE.activeEditingProduct.seoTags = tagsRaw.split(',').map(s => s.trim()).filter(Boolean);
      if (desc) DBM_STATE.activeEditingProduct.seoDescription = desc;
      DBM_STATE.activeEditingProduct.price = price;
    }

    saveProductDraftLocal(code);
    showToast('Saved Step 4 SEO & Pricing!');
    goToStudioStep(5);
  };

  window.generateAiSeoForCurrentProduct = async function(code) {
    const titleEl = document.getElementById('step4Title');
    const tagsEl = document.getElementById('step4Tags');
    const descEl = document.getElementById('step4Desc');

    const hasExistingContent = (titleEl && titleEl.value.trim().length > 0) ||
                               (tagsEl && tagsEl.value.trim().length > 0) ||
                               (descEl && descEl.value.trim().length > 0);

    if (hasExistingContent) {
      const confirmOverwrite = window.confirm('⚠️ You already have SEO content entered. Generating a new AI SEO package will overwrite your title, tags, and description. Do you want to proceed?');
      if (!confirmOverwrite) {
        showToast('AI SEO generation cancelled (kept your custom content)');
        return;
      }
    }

    const brand = DBM_STATE.assignedBrands.find(b => b.id === DBM_STATE.activeBrandId) || DBM_STATE.assignedBrands[0];
    const prod = DBM_STATE.activeEditingProduct || {};
    const name = prod.name || prod.seoTitle || 'Digital Planner';

    showToast('🤖 Generating AI SEO Package...', 'success');

    try {
      const res = await DBM_API.post('/ai/etsy-seo', {
        productName: name,
        title: name,
        category: prod.category || 'Productivity Planner',
        brandNiche: brand?.niche || 'Digital Planners & Productivity',
        brandName: brand?.name || 'PlannerQueenGro'
      });

      if (res && res.title) {
        if (titleEl) titleEl.value = res.title;
        if (tagsEl) tagsEl.value = Array.isArray(res.tags) ? res.tags.join(', ') : (res.tags || '');
        if (descEl) descEl.value = res.description || '';
        updateTitleCharCount(res.title);
        updateTagCountBadge(Array.isArray(res.tags) ? res.tags.join(', ') : res.tags);
        showToast('✅ AI SEO Package Generated!');
      } else {
        throw new Error('AI SEO service did not return a valid title package');
      }
    } catch (e) {
      console.warn('[AI SEO Generation Notice]:', e.message);
      showToast('⚠️ AI SEO generation failed. Please check connection and retry.', 'error');
      // Pre-fill editable fallback only if title is completely empty
      if (titleEl && !titleEl.value.trim()) {
        const cleanTitle = (name + ' | Printable Planner Template for ' + (brand?.name || 'PlannerQueenGro')).slice(0, 138);
        titleEl.value = cleanTitle;
        updateTitleCharCount(cleanTitle);
      }
    }
  };

  window.finalSubmitProductForReview = async function(code) {
    const brand = DBM_STATE.assignedBrands.find(b => b.id === DBM_STATE.activeBrandId) || DBM_STATE.assignedBrands[0];
    const prod = DBM_STATE.activeEditingProduct || {};
    const submitterName = getUserDisplayName();

    const title = (prod.seoTitle || prod.name || '').trim();
    const canvaUrl = (prod.vault?.canvaTemplateUrl || prod.canvaTemplateUrl || '').trim();
    const price = Number(prod.price || 0);
    const tags = Array.isArray(prod.seoTags) ? prod.seoTags : [];

    // Pre-Flight Quality Check Verification
    const validationErrors = [];
    if (!title || title.length < 10) {
      validationErrors.push('Etsy SEO Title is missing or too short (< 10 chars)');
    } else if (title.length > 140) {
      validationErrors.push('Etsy SEO Title exceeds 140 characters limit');
    }

    if (!canvaUrl || (!canvaUrl.startsWith('http://') && !canvaUrl.startsWith('https://'))) {
      validationErrors.push('Deliverable template link is missing or invalid URL');
    }

    if (tags.length < 5) {
      validationErrors.push('At least 5 Etsy SEO tags required (found ' + tags.length + ')');
    }

    if (isNaN(price) || price < 0.20) {
      validationErrors.push('Price must be set to at least $0.20 USD');
    }

    if (validationErrors.length > 0) {
      showToast('⚠️ Pre-flight check failed: ' + validationErrors.join('; '), 'error');
      return;
    }

    const payload = {
      title: title,
      name: prod.name || title,
      category: prod.category || 'General',
      price: price || 7.49,
      canvaTemplateUrl: canvaUrl,
      description: prod.seoDescription || prod.seo?.description || '',
      tags: tags,
      mockups: prod.mockups || [],
      submittedBy: submitterName
    };

    showToast('🚀 Submitting for Admin Review...', 'success');

    try {
      const res = await DBM_API.post('/brands/' + brand.id + '/product/' + code + '/submit-review', payload);
      if (res.success) {
        showToast('🎉 Product submitted! Admin alerted via Telegram.');
        
        // Remove submitted local draft
        localStorage.removeItem('dbm_studio_draft_' + code);

        await reloadState();
        
        // Find next draft product and auto-advance
        const catalog = DBM_STATE.productsCatalog[brand.id] || [];
        const next = getNextActiveDraft(catalog);
        DBM_STATE.currentStudioCode = next.code || 'PLA-15';
        DBM_STATE.currentStudioStep = 1;

        window.location.hash = '#workspace';
      } else {
        showToast(res.error || 'Failed to submit', 'error');
      }
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
  };

  // ── VIEW 3: REFERENCE LIBRARY (PLA-01 TO PLA-13) ──
  function renderReferencesView(container) {
    const brand = DBM_STATE.assignedBrands.find(b => b.id === DBM_STATE.activeBrandId) || DBM_STATE.assignedBrands[0] || {};
    const catalog = DBM_STATE.productsCatalog[brand.id] || [];
    const allRefs = catalog.filter(p => p.status === 'Live');

    const filter = DBM_STATE.refCategoryFilter || 'all';
    const query = (DBM_STATE.refSearchQuery || '').toLowerCase().trim();

    let filtered = allRefs.filter(p => {
      // Category filter
      if (filter === 'daily' && !p.name?.toLowerCase().includes('daily') && !p.name?.toLowerCase().includes('weekly') && !p.category?.toLowerCase().includes('daily')) return false;
      if (filter === 'finance' && !p.name?.toLowerCase().includes('budget') && !p.name?.toLowerCase().includes('debt') && !p.name?.toLowerCase().includes('expense') && !p.category?.toLowerCase().includes('financial')) return false;
      if (filter === 'adhd' && !p.name?.toLowerCase().includes('adhd') && !p.name?.toLowerCase().includes('routine') && !p.name?.toLowerCase().includes('wellness')) return false;
      if (filter === 'academic' && !p.name?.toLowerCase().includes('teacher') && !p.name?.toLowerCase().includes('student') && !p.name?.toLowerCase().includes('mom')) return false;

      // Keyword query
      if (query) {
        const matchTitle = (p.name || p.seoTitle || '').toLowerCase().includes(query);
        const matchCode = (p.code || '').toLowerCase().includes(query);
        const matchCat = (p.category || '').toLowerCase().includes(query);
        if (!matchTitle && !matchCode && !matchCat) return false;
      }
      return true;
    });

    container.innerHTML = `
      <div style="margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
        <div>
          <h1 style="font-family: var(--font-heading); font-size: 1.8rem; font-weight: 800;">
            🌟 Gold-Standard Reference Library (${allRefs.length} Live Models)
          </h1>
          <p style="color: var(--text-secondary); font-size: 0.92rem;">
            Use these published models as your direct quality and formatting standard. Click any card to view Canva links, 13 tags, and layout architecture.
          </p>
        </div>

        <!-- Search Input -->
        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <input type="text" id="refSearchInput" value="${DBM_STATE.refSearchQuery}" oninput="filterReferencesSearch(this.value)" placeholder="🔍 Search reference models..." style="padding: 0.6rem 1rem; background: var(--surface-card); border: 1px solid var(--border-subtle); color: #fff; border-radius: 10px; font-size: 0.85rem; width: 240px;">
        </div>
      </div>

      <!-- Category Filter Pills -->
      <div style="display: flex; gap: 0.4rem; margin-bottom: 1.5rem; overflow-x: auto; background: var(--bg-surface); padding: 0.35rem; border-radius: 12px; border: 1px solid var(--border-subtle);">
        <button onclick="setRefCategoryFilter('all')" style="padding: 0.45rem 0.9rem; border-radius: 8px; font-size: 0.78rem; font-weight: 700; border: none; cursor: pointer; background: ${filter === 'all' ? 'var(--brand-primary)' : 'transparent'}; color: ${filter === 'all' ? '#070b12' : 'var(--text-muted)'};">
          All References (${allRefs.length})
        </button>
        <button onclick="setRefCategoryFilter('daily')" style="padding: 0.45rem 0.9rem; border-radius: 8px; font-size: 0.78rem; font-weight: 700; border: none; cursor: pointer; background: ${filter === 'daily' ? '#38bdf8' : 'transparent'}; color: ${filter === 'daily' ? '#070b12' : 'var(--text-muted)'};">
          📅 Daily & Weekly (5)
        </button>
        <button onclick="setRefCategoryFilter('finance')" style="padding: 0.45rem 0.9rem; border-radius: 8px; font-size: 0.78rem; font-weight: 700; border: none; cursor: pointer; background: ${filter === 'finance' ? '#00df89' : 'transparent'}; color: ${filter === 'finance' ? '#070b12' : 'var(--text-muted)'};">
          💰 Financial & Budget (3)
        </button>
        <button onclick="setRefCategoryFilter('adhd')" style="padding: 0.45rem 0.9rem; border-radius: 8px; font-size: 0.78rem; font-weight: 700; border: none; cursor: pointer; background: ${filter === 'adhd' ? '#a855f7' : 'transparent'}; color: ${filter === 'adhd' ? '#fff' : 'var(--text-muted)'};">
          🧠 ADHD & Mindset (3)
        </button>
        <button onclick="setRefCategoryFilter('academic')" style="padding: 0.45rem 0.9rem; border-radius: 8px; font-size: 0.78rem; font-weight: 700; border: none; cursor: pointer; background: ${filter === 'academic' ? '#f59e0b' : 'transparent'}; color: ${filter === 'academic' ? '#070b12' : 'var(--text-muted)'};">
          🎓 Academic & Mom (2)
        </button>
      </div>

      <!-- Grid of Cards -->
      <div id="referencesGridContainer" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 1.25rem;">
        ${renderReferenceCards(filtered)}
      </div>
    `;
  }

  function renderReferenceCards(products) {
    if (products.length === 0) {
      return '<div style="color: var(--text-muted); padding: 3rem; text-align: center; grid-column: 1 / -1;">No reference products match your search.</div>';
    }

    return products.map(p => {
      const etsyLink = p.etsyUrl || p.liveListingUrl || (p.etsyListingId ? ('https://www.etsy.com/listing/' + p.etsyListingId) : '');

      return `
      <div class="card" style="border-left: 4px solid var(--accent-purple); transition: transform 0.2s ease; cursor: pointer;" onclick="openReferenceProductModal('${p.code}')">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
          <span style="font-family: var(--font-mono); font-weight: 800; font-size: 0.85rem; color: #c084fc;">${p.code}</span>
          <span style="font-size: 0.72rem; font-weight: 800; color: #00df89; background: rgba(0,223,137,0.12); padding: 0.2rem 0.5rem; border-radius: 12px;">🟢 Live Standard</span>
        </div>

        <h3 style="font-size: 1.05rem; font-weight: 800; margin-bottom: 0.4rem; color: #fff; line-height: 1.3;">
          ${p.name || p.seoTitle || 'Live Product'}
        </h3>
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.8rem; font-size: 0.8rem; color: var(--text-secondary);">
          <span>${p.category || 'Productivity'}</span>
          <strong style="color: #00df89;">$${Number(p.price || 7.49).toFixed(2)} USD</strong>
        </div>

        <div style="display: flex; gap: 0.4rem; align-items: center; flex-wrap: wrap;">
          <span style="font-size: 0.72rem; font-weight: 700; color: #38bdf8; background: rgba(6,182,212,0.1); padding: 0.15rem 0.45rem; border-radius: 6px;">16 Spreads PDF</span>
          <span style="font-size: 0.72rem; font-weight: 700; color: #a855f7; background: rgba(168,85,247,0.1); padding: 0.15rem 0.45rem; border-radius: 6px;">13 Tags</span>
          ${etsyLink ? `
            <a href="${etsyLink}" target="_blank" onclick="event.stopPropagation()" style="font-size: 0.72rem; font-weight: 700; color: #00df89; background: rgba(0,223,137,0.12); border: 1px solid rgba(0,223,137,0.25); padding: 0.15rem 0.45rem; border-radius: 6px; text-decoration: none; display: inline-flex; align-items: center; gap: 0.2rem;">
              🛒 Etsy Live ↗
            </a>
          ` : ''}
        </div>

        <button class="btn-ghost" style="width: 100%; justify-content: center; font-size: 0.8rem; color: #c084fc; border-color: rgba(168,85,247,0.3); margin-top: 0.75rem;">
          👀 Inspect Complete Assets & SEO →
        </button>
      </div>
    `;
    }).join('');
  }

  window.setRefCategoryFilter = function(filter) {
    DBM_STATE.refCategoryFilter = filter;
    renderCurrentRoute();
  };

  window.filterReferencesSearch = function(query) {
    DBM_STATE.refSearchQuery = query;
    const container = document.getElementById('dbm-main');
    if (container && window.location.hash === '#references') {
      renderReferencesView(container);
    }
  };

  window.openReferenceProductModal = function(code) {
    const brand = DBM_STATE.assignedBrands.find(b => b.id === DBM_STATE.activeBrandId) || DBM_STATE.assignedBrands[0];
    const catalog = DBM_STATE.productsCatalog[brand.id] || [];
    const prod = catalog.find(p => p.code === code) || { code: code, name: 'Reference Product ' + code };

    const modal = document.getElementById('referenceModal');
    const inner = document.getElementById('referenceModalInner');
    if (!modal || !inner) return;

    const title = prod.seoTitle || prod.seo?.title || prod.name || 'Reference Title';
    const tags = Array.isArray(prod.seoTags) ? prod.seoTags : (prod.seo?.tags || ['planner', 'productivity', 'goodnotes', 'daily organizer', 'printable template', 'budget ledger', 'financial freedom', 'adhd tracker', 'habit schedule', 'weekly spread', 'ipad agenda', 'neutral aesthetic', 'instant download']);
    const desc = prod.seoDescription || prod.seo?.description || '✨ Instant Download Digital Planner template.\n\nWHAT IS INCLUDED:\n- High-resolution printable PDF files (US Letter & A4)\n- Hyperlinked GoodNotes & Notability digital template\n- Canva editable master link\n- Lifetime access & free updates\n\nHOW IT WORKS:\n1. Complete your purchase\n2. Download instant access PDF\n3. Open in GoodNotes or print at home!';
    const canva = prod.vault?.canvaTemplateUrl || prod.canvaTemplateUrl || 'https://canva.com/design/reference-template';
    const etsyLink = prod.etsyUrl || prod.liveListingUrl || (prod.etsyListingId ? ('https://www.etsy.com/listing/' + prod.etsyListingId) : '');

    inner.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 0.75rem;">
        <div>
          <span style="font-size: 0.75rem; font-weight: 800; color: #c084fc; text-transform: uppercase; letter-spacing: 0.5px;">🌟 Gold Standard Reference Specification</span>
          <h2 style="font-size: 1.4rem; font-weight: 900; color: #fff; margin-top: 0.2rem;">${prod.code}: ${prod.name || title}</h2>
        </div>
        <button onclick="closeReferenceModal()" style="background: none; border: none; font-size: 1.5rem; color: var(--text-muted); cursor: pointer; padding: 0.2rem 0.5rem;">✕</button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 1.2rem;">
        ${etsyLink ? `
          <!-- Section 0: Live Etsy Listing Link -->
          <div style="background: rgba(0,223,137,0.08); padding: 0.9rem 1.1rem; border-radius: 10px; border: 1px solid rgba(0,223,137,0.25); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.6rem;">
            <div>
              <span style="font-size: 0.72rem; font-weight: 800; color: #00df89; text-transform: uppercase; letter-spacing: 0.5px;">Live Marketplace Listing</span>
              <div style="font-size: 0.88rem; color: #fff; font-weight: 700;">Live & Active on Etsy Store (Verified Gold Standard)</div>
            </div>
            <a href="${etsyLink}" target="_blank" class="btn-primary" style="font-size: 0.78rem; padding: 0.4rem 0.9rem; text-decoration: none; background: #00df89; color: #070b12; font-weight: 800; display: inline-flex; align-items: center; gap: 0.3rem;">
              🛒 View Live on Etsy ↗
            </a>
          </div>
        ` : ''}

        <!-- Section 1: Etsy Title -->
        <div style="background: var(--bg-surface); padding: 1rem; border-radius: 10px; border: 1px solid var(--border-subtle);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.3rem;">
            <label style="font-size: 0.72rem; font-weight: 800; color: var(--brand-primary); text-transform: uppercase;">Etsy SEO Title Standard (Under 140 Chars)</label>
            <span style="font-size: 0.72rem; color: #38bdf8; font-weight: 700;">${title.length} Chars</span>
          </div>
          <div style="font-size: 0.9rem; font-weight: 700; color: #fff;">${title}</div>
        </div>

        <!-- Section 2: 13 SEO Tags with Quick Baseline Clone Action -->
        <div style="background: var(--bg-surface); padding: 1rem; border-radius: 10px; border: 1px solid var(--border-subtle);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem; flex-wrap: wrap; gap: 0.4rem;">
            <label style="font-size: 0.72rem; font-weight: 800; color: var(--accent-cyan); text-transform: uppercase;">13 High-Intent Etsy SEO Tags</label>
            <div style="display: flex; gap: 0.4rem;">
              <button class="btn-ghost" style="padding: 0.2rem 0.55rem; font-size: 0.72rem;" onclick="navigator.clipboard.writeText('${tags.join(', ')}'); showToast('📋 Copied 13 Reference Tags!');">
                📋 Copy Tags
              </button>
              <button class="btn-secondary" style="padding: 0.2rem 0.55rem; font-size: 0.72rem;" onclick="applyReferenceTagsToStudio('${tags.join(', ')}')">
                ⚡ Apply to Active Studio Draft
              </button>
            </div>
          </div>
          <div style="display: flex; flex-wrap: wrap; gap: 0.4rem;">
            ${tags.map(t => `<span style="background: rgba(6,182,212,0.15); color: #38bdf8; padding: 0.2rem 0.6rem; border-radius: 6px; font-size: 0.78rem; font-weight: 600;">#${t}</span>`).join('')}
          </div>
        </div>

        <!-- Section 3: Canva Link -->
        <div style="background: var(--bg-surface); padding: 1rem; border-radius: 10px; border: 1px solid var(--border-subtle);">
          <label style="font-size: 0.72rem; font-weight: 800; color: var(--accent-purple); text-transform: uppercase;">Deliverable Canva Template Master Link</label>
          <div style="margin-top: 0.3rem;">
            <a href="${canva}" target="_blank" style="color: #00df89; font-weight: 700; font-size: 0.88rem; text-decoration: none; display: inline-flex; align-items: center; gap: 0.4rem;">
              🔗 Open Reference Canva Template Link ➔
            </a>
          </div>
        </div>

        <!-- Section 4: 16-Spread Breakdown Blueprint -->
        <div style="background: var(--bg-surface); padding: 1rem; border-radius: 10px; border: 1px solid var(--border-subtle);">
          <label style="font-size: 0.72rem; font-weight: 800; color: #f59e0b; text-transform: uppercase;">16-Spread Page Architecture Guide</label>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; font-size: 0.78rem; color: var(--text-secondary); margin-top: 0.4rem;">
            <div>• Page 1: Cover & Index Dashboard</div>
            <div>• Page 2: Daily Top-3 Priority Matrix</div>
            <div>• Page 3: Hourly Time-Blocking Spread</div>
            <div>• Page 4: Weekly Sprint Milestone Log</div>
            <div>• Page 5: Monthly Goal Alignment Sheet</div>
            <div>• Page 6: 30-Day Circular Habit Matrix</div>
            <div>• Page 7: Financial Cash Flow Tracker</div>
            <div>• Page 8: Evening Wins & Reflection Journal</div>
          </div>
        </div>

        <!-- Section 5: Description -->
        <div style="background: var(--bg-surface); padding: 1rem; border-radius: 10px; border: 1px solid var(--border-subtle);">
          <label style="font-size: 0.72rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Listing Description Format</label>
          <div style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.4; white-space: pre-wrap; margin-top: 0.3rem;">${desc}</div>
        </div>
      </div>

      <div style="margin-top: 1.5rem; display: flex; justify-content: flex-end;">
        <button class="btn-primary" onclick="closeReferenceModal()">Got it, back to Studio</button>
      </div>
    `;

    modal.classList.add('active');
  };

  window.applyReferenceTagsToStudio = function(tagsText) {
    if (DBM_STATE.activeEditingProduct) {
      DBM_STATE.activeEditingProduct.seoTags = tagsText.split(',').map(s => s.trim()).filter(Boolean);
    }
    showToast('⚡ Cloned 13 tags into your active Studio product!');
    closeReferenceModal();
    window.location.hash = '#studio';
    goToStudioStep(4);
  };

  window.closeReferenceModal = function() {
    const modal = document.getElementById('referenceModal');
    if (modal) modal.classList.remove('active');
  };

  // ── VIEW 4: MY OUTPUT ──
  function renderOutputView(container) {
    const brands = DBM_STATE.assignedBrands || [];
    const brand = brands.find(b => b.id === DBM_STATE.activeBrandId) || brands[0] || {};
    const catalog = DBM_STATE.productsCatalog[brand.id] || [];

    let totalPending = [];
    let totalLiveCount = 0;

    Object.entries(DBM_STATE.productsCatalog).forEach(([bId, pList]) => {
      const bObj = brands.find(b => b.id === Number(bId)) || { name: 'Brand #' + bId };
      pList.forEach(p => {
        if (p.status === 'Pending Review') {
          totalPending.push({ ...p, brandName: bObj.name, brandId: bId });
        }
        if (p.status === 'Live') {
          totalLiveCount++;
        }
      });
    });

    const vaultBonusEarned = (totalLiveCount * 6.99).toFixed(2);
    const today = new Date().toISOString().split('T')[0];
    const todayCount = DBM_STATE.todaySubmittedCount || 0;

    // Calculate First-Pass QC Pass Rate & Quality Multiplier
    let revisionCount = 0;
    Object.values(DBM_STATE.productsCatalog).flat().forEach(p => {
      if (p.status === 'Revision Requested' || p.status === 'Needs Revision' || p.status === 'Rejected') {
        revisionCount++;
      }
    });
    const totalProcessed = totalLiveCount + totalPending.length + revisionCount;
    const qcPassRate = totalProcessed > 0
      ? Math.max(0, Math.round(((totalProcessed - revisionCount) / totalProcessed) * 100))
      : 100;
    const qualityMultiplier = (qcPassRate / 100).toFixed(2);
    const multiplierColor = qcPassRate >= 90 ? '#00df89' : qcPassRate >= 75 ? '#f59e0b' : '#f43f5e';

    // Weekly 7-Day Velocity Data (Aggregated dynamically from productsCatalog)
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    const currentDayIdx = now.getDay(); // 0 = Sun, 1 = Mon, ... 6 = Sat
    
    // Calculate start of current week (Monday)
    const mondayOffset = (currentDayIdx === 0 ? -6 : 1) - currentDayIdx;
    const mondayDate = new Date(now);
    mondayDate.setDate(now.getDate() + mondayOffset);

    // Build 7 calendar days Mon..Sun
    const allProducts = Object.values(DBM_STATE.productsCatalog).flat();
    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((dayName, i) => {
      const d = new Date(mondayDate);
      d.setDate(mondayDate.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const isToday = dateStr === today;
      
      // Count submissions matching this calendar date
      const count = allProducts.filter(p => p.submittedAt && p.submittedAt.startsWith(dateStr)).length;
      return {
        day: dayName,
        count: isToday ? Math.max(count, todayCount) : count,
        quota: DBM_STATE.dailyTarget,
        isToday
      };
    });

    container.innerHTML = `
      <!-- Top Title Header -->
      <div style="margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
        <div>
          <h1 style="font-family: var(--font-heading); font-size: 1.8rem; font-weight: 800;">
            📊 My Output & Performance Command
          </h1>
          <p style="color: var(--text-secondary); font-size: 0.95rem;">
            Real-time tracking of your daily upload velocity, pending QC approvals, and monthly vault bonus earnings.
          </p>
        </div>

        <button class="btn-primary" onclick="window.location.hash='#standup'" style="background: linear-gradient(135deg, #00df89, #06b6d4);">
          📝 Submit Today's Standup
        </button>
      </div>

      <!-- 4 KPI Cards Grid -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem; margin-bottom: 1.5rem;">
        <div class="card" style="border-left: 4px solid #38bdf8; margin-bottom: 0;">
          <span style="font-size: 0.72rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Submitted Today</span>
          <div style="font-size: 1.8rem; font-weight: 900; color: #38bdf8; margin-top: 0.2rem;">
            ${todayCount} <span style="font-size: 0.9rem; color: var(--text-muted); font-weight: 600;">/ ${DBM_STATE.dailyTarget} Quota</span>
          </div>
          <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.3rem;">Target: ${DBM_STATE.dailyTarget} listings per day</div>
        </div>

        <div class="card" style="border-left: 4px solid #f59e0b; margin-bottom: 0;">
          <span style="font-size: 0.72rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Pending Admin Approval</span>
          <div style="font-size: 1.8rem; font-weight: 900; color: #f59e0b; margin-top: 0.2rem;">
            ${totalPending.length} <span style="font-size: 0.85rem; color: var(--text-muted);">Products</span>
          </div>
          <div style="font-size: 0.72rem; color: #f59e0b; margin-top: 0.3rem;">⏳ In Founder Review Queue</div>
        </div>

        <div class="card" style="border-left: 4px solid #00df89; margin-bottom: 0;">
          <span style="font-size: 0.72rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Published & Live on Etsy</span>
          <div style="font-size: 1.8rem; font-weight: 900; color: #00df89; margin-top: 0.2rem;">
            ${totalLiveCount} <span style="font-size: 0.85rem; color: var(--text-muted);">Listings</span>
          </div>
          <div style="font-size: 0.72rem; color: #00df89; margin-top: 0.3rem;">🟢 100% QC Passed</div>
        </div>

        <div class="card" style="border-left: 4px solid #a855f7; margin-bottom: 0;">
          <span style="font-size: 0.72rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Vault Incentive Bonus</span>
          <div style="font-size: 1.8rem; font-weight: 900; color: #a855f7; margin-top: 0.2rem;">
            $${vaultBonusEarned} <span style="font-size: 0.85rem; color: var(--text-muted);">USD</span>
          </div>
          <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.3rem;">$6.99 / live product bonus</div>
        </div>
      </div>

      <!-- 7-Day Production Velocity Tracker -->
      <div class="card" style="margin-bottom: 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <div>
            <h3 style="font-size: 1.15rem; font-weight: 800;">📈 7-Day Production Velocity (${DBM_STATE.dailyTarget} Products / Day Cadence)</h3>
            <p style="font-size: 0.8rem; color: var(--text-muted);">Daily upload consistency tracker for this week.</p>
          </div>
          <span style="font-size: 0.8rem; font-weight: 800; color: #00df89; background: rgba(0,223,137,0.12); padding: 0.25rem 0.6rem; border-radius: 20px;">
            Target: ${DBM_STATE.dailyTarget * 5} Listings / Week
          </span>
        </div>

        <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 0.75rem; text-align: center;">
          ${weekDays.map(w => {
            const pct = Math.min(100, Math.round((w.count / w.quota) * 100));
            return `
              <div style="background: var(--bg-surface); padding: 0.85rem 0.5rem; border-radius: 12px; border: 1px solid ${w.isToday ? 'rgba(0,223,137,0.4)' : 'var(--border-subtle)'};">
                <span style="font-size: 0.75rem; font-weight: 800; color: ${w.isToday ? '#00df89' : 'var(--text-muted)'}; display: block; margin-bottom: 0.5rem;">
                  ${w.day} ${w.isToday ? '(Today)' : ''}
                </span>
                
                <!-- Mini Bar -->
                <div style="height: 60px; background: rgba(255,255,255,0.04); border-radius: 6px; position: relative; display: flex; align-items: flex-end; overflow: hidden; margin-bottom: 0.5rem;">
                  <div style="width: 100%; height: ${pct}%; background: ${pct >= 100 ? 'linear-gradient(180deg, #00df89, #06b6d4)' : 'rgba(56,189,248,0.5)'}; border-radius: 6px; transition: height 0.3s ease;"></div>
                </div>

                <strong style="font-size: 0.9rem; color: #fff;">${w.count} / ${w.quota}</strong>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Two-Column Section: Pending Triage & Compensation -->
      <div style="display: grid; grid-template-columns: 1.4fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
        <!-- Pending Review Table -->
        <div class="card" style="margin-bottom: 0;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <h3 style="font-size: 1.15rem; font-weight: 800;">⏳ Products in Founder Review Queue</h3>
            <span style="font-size: 0.75rem; color: #f59e0b; font-weight: 700;">${totalPending.length} Awaiting Approval</span>
          </div>

          ${renderPendingTriageTable(totalPending)}
        </div>

        <!-- Compensation & Incentive Summary -->
        <div class="card" style="margin-bottom: 0; background: linear-gradient(135deg, rgba(168,85,247,0.06), rgba(6,182,212,0.04)); border-color: rgba(168,85,247,0.25);">
          <h3 style="font-size: 1.15rem; font-weight: 800; color: #c084fc; margin-bottom: 0.4rem;">💰 Compensation & Monthly Payouts</h3>
          <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 1.25rem;">Direct monthly settlement to registered bKash / Bank account.</p>

          <div style="display: flex; flex-direction: column; gap: 0.85rem; font-size: 0.85rem;">
            <div style="display: flex; justify-content: space-between; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border-subtle);">
              <span style="color: var(--text-muted);">Base Retainer:</span>
              <strong style="color: #fff;">৳ Guaranteed Base</strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border-subtle);">
              <span style="color: var(--text-muted);">Live Listings Bonus:</span>
              <strong style="color: #00df89;">$${vaultBonusEarned} USD (${totalLiveCount} Live)</strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border-subtle);">
              <span style="color: var(--text-muted);">Next Payout Date:</span>
              <strong style="color: #38bdf8;">1st of Next Month</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--text-muted);">Quality Multiplier:</span>
              <strong style="color: ${multiplierColor};">${qualityMultiplier}x (${qcPassRate}% First-Pass QC)</strong>
            </div>
          </div>
        </div>
      </div>

      <!-- Standup Submission History Table -->
      <div class="card">
        <h3 style="font-size: 1.15rem; font-weight: 800; margin-bottom: 1rem;">📜 Your Standup Submission History</h3>
        ${renderStandupHistoryTable()}
      </div>
    `;
  }

  function renderPendingTriageTable(pendingList) {
    if (pendingList.length === 0) {
      return '<div style="color: var(--text-muted); padding: 2rem; text-align: center;">No products currently waiting for review.</div>';
    }

    return `
      <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
        <thead>
          <tr style="border-bottom: 1px solid var(--border-subtle); color: var(--text-muted); text-align: left;">
            <th style="padding: 0.6rem;">SKU</th>
            <th style="padding: 0.6rem;">Product Name</th>
            <th style="padding: 0.6rem;">Brand</th>
            <th style="padding: 0.6rem;">Price</th>
            <th style="padding: 0.6rem; text-align: right;">Action</th>
          </tr>
        </thead>
        <tbody>
          ${pendingList.map(p => `
            <tr style="border-bottom: 1px solid var(--border-subtle);">
              <td style="padding: 0.65rem; font-family: var(--font-mono); font-weight: 700; color: #f59e0b;">${p.code}</td>
              <td style="padding: 0.65rem; font-weight: 600;">${(p.name || p.seoTitle || 'Product').substring(0, 32)}</td>
              <td style="padding: 0.65rem; color: var(--text-secondary);">${p.brandName || 'PlannerQueenGro'}</td>
              <td style="padding: 0.65rem; font-weight: 700;">$${Number(p.price || 7.49).toFixed(2)}</td>
              <td style="padding: 0.65rem; text-align: right;">
                <button class="btn-secondary" style="font-size: 0.72rem; padding: 0.25rem 0.6rem;" onclick="startProductStudio('${p.code}')">✏️ Edit in Studio</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  window.loadMoreStandups = function() {
    DBM_STATE.standupDisplayLimit = (DBM_STATE.standupDisplayLimit || 10) + 10;
    const outputContainer = document.getElementById('dbm-main');
    if (outputContainer) renderCurrentRoute();
  };

  function renderStandupHistoryTable() {
    if (!DBM_STATE.standups || DBM_STATE.standups.length === 0) {
      return '<div style="color: var(--text-muted); padding: 1.5rem; text-align: center;">No standup reports logged yet.</div>';
    }

    const limit = DBM_STATE.standupDisplayLimit || 10;
    const visibleStandups = DBM_STATE.standups.slice(0, limit);
    const hasMore = DBM_STATE.standups.length > limit;

    return `
      <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
        <thead>
          <tr style="border-bottom: 1px solid var(--border-subtle); color: var(--text-muted); text-align: left;">
            <th style="padding: 0.6rem;">Date</th>
            <th style="padding: 0.6rem;">Brand</th>
            <th style="padding: 0.6rem;">Listed</th>
            <th style="padding: 0.6rem;">Blocker?</th>
            <th style="padding: 0.6rem;">Notes</th>
          </tr>
        </thead>
        <tbody>
          ${visibleStandups.map(s => `
            <tr style="border-bottom: 1px solid var(--border-subtle);">
              <td style="padding: 0.75rem 0.6rem; font-weight: 700;">${s.date}</td>
              <td style="padding: 0.75rem 0.6rem; color: #38bdf8; font-weight: 600;">${s.brandName}</td>
              <td style="padding: 0.75rem 0.6rem; font-weight: 800;">${s.listed} / ${DBM_STATE.dailyTarget}</td>
              <td style="padding: 0.75rem 0.6rem;">${s.isBlocker ? '<span style="color:#f43f5e; font-weight:800;">🚨 Yes</span>' : '<span style="color:#00df89;">🟢 No</span>'}</td>
              <td style="padding: 0.75rem 0.6rem; color: var(--text-secondary);">${s.notes || 'None'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      ${hasMore ? `
        <div style="text-align: center; margin-top: 1rem;">
          <button class="btn-secondary" onclick="loadMoreStandups()" style="font-size: 0.82rem; padding: 0.5rem 1.2rem;">
            📜 Load More Standups (${DBM_STATE.standups.length - limit} remaining)
          </button>
        </div>
      ` : ''}
    `;
  }

  // ── VIEW 5: EOD STANDUP ──
  function renderStandupView(container) {
    const brands = DBM_STATE.assignedBrands || [];
    const activeBrand = brands.find(b => b.id === DBM_STATE.activeBrandId) || brands[0] || {};
    const catalog = DBM_STATE.productsCatalog[activeBrand.id] || [];
    const today = new Date().toISOString().split('T')[0];

    const todayCount = DBM_STATE.todaySubmittedCount || 0;

    container.innerHTML = `
      <div style="margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
        <div>
          <h1 style="font-family: var(--font-heading); font-size: 1.8rem; font-weight: 800;">
            📝 End-of-Day (EOD) Standup Submission
          </h1>
          <p style="color: var(--text-secondary); font-size: 0.95rem;">
            Submit your daily 5:00 PM output report. Admin receives an instant private Telegram alert with your summary upon submission.
          </p>
        </div>

        <button class="btn-secondary" onclick="autoPopulateStandupFromActivity()" style="background: rgba(0,223,137,0.1); border-color: rgba(0,223,137,0.3); color: #00df89; font-size: 0.85rem;">
          ⚡ Auto-Populate from Today's Activity
        </button>
      </div>

      <div class="card" style="max-width: 720px; border-top: 4px solid var(--accent-cyan);">
        <form onsubmit="submitEodStandup(event)" style="display: flex; flex-direction: column; gap: 1.25rem;">
          
          <!-- 1. Brand Selector -->
          <div>
            <label style="font-size: 0.78rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); display: block; margin-bottom: 0.3rem;">1. Brand Worked on Today</label>
            <select id="standupBrandSelect" style="width: 100%; padding: 0.65rem; background: var(--bg-surface); border: 1px solid var(--border-subtle); color: var(--text-primary); border-radius: 8px; font-weight: 600;">
              ${brands.map(b => `<option value="${b.name}" ${b.id === activeBrand.id ? 'selected' : ''}>${b.name} (Brand #${b.id})</option>`).join('')}
            </select>
          </div>

          <!-- 2. Products Listed -->
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.3rem;">
              <label style="font-size: 0.78rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted);">2. Products Built / Submitted Today (Quota: 8)</label>
              <span style="font-size: 0.75rem; color: #00df89; font-weight: 700;">8 Listings = 100% Quota</span>
            </div>
            <input type="number" id="standupListedCount" min="0" max="30" value="${todayCount}" style="width: 100%; padding: 0.65rem; background: var(--bg-surface); border: 1px solid var(--border-subtle); color: #38bdf8; border-radius: 8px; font-size: 1.2rem; font-weight: 900;">
          </div>

          <!-- 3. Specific SKUs -->
          <div>
            <label style="font-size: 0.78rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); display: block; margin-bottom: 0.3rem;">3. Specific SKUs Worked On</label>
            <input type="text" id="standupProductCodes" placeholder="e.g. PLA-14 through PLA-21" value="PLA-14 through PLA-21" style="width: 100%; padding: 0.65rem; background: var(--bg-surface); border: 1px solid var(--border-subtle); color: var(--text-primary); border-radius: 8px; font-weight: 600;">
          </div>

          <!-- 4. Notes & Reflection with Quick Win Helper Chips -->
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.3rem;">
              <label style="font-size: 0.78rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted);">4. Daily Notes, Completed Wins & Feedback</label>
              <span style="font-size: 0.72rem; color: var(--text-muted);">Click chips below to insert</span>
            </div>
            <textarea id="standupNotes" rows="3" placeholder="Completed Canva designs and SEO packages for PLA-14 to PLA-21." style="width: 100%; padding: 0.65rem; background: var(--bg-surface); border: 1px solid var(--border-subtle); color: var(--text-primary); border-radius: 8px; font-family: var(--font-body); margin-bottom: 0.5rem;"></textarea>
            
            <!-- Quick Chips Strip -->
            <div style="display: flex; flex-wrap: wrap; gap: 0.35rem;">
              <button type="button" class="btn-ghost" style="font-size: 0.72rem; padding: 0.2rem 0.55rem;" onclick="appendStandupNote('🎯 Hit 8/8 daily target smoothly.')">🎯 Hit 8/8 Target</button>
              <button type="button" class="btn-ghost" style="font-size: 0.72rem; padding: 0.2rem 0.55rem;" onclick="appendStandupNote('🎨 Completed Canva master spreads & export PDFs.')">🎨 Canva Spreads Complete</button>
              <button type="button" class="btn-ghost" style="font-size: 0.72rem; padding: 0.2rem 0.55rem;" onclick="appendStandupNote('📈 13 high-intent Etsy tags formatted per listing.')">📈 13 Tags Formatted</button>
              <button type="button" class="btn-ghost" style="font-size: 0.72rem; padding: 0.2rem 0.55rem;" onclick="appendStandupNote('🖼️ All 10 mockup slots populated.')">🖼️ 10 Mockups Attached</button>
            </div>
          </div>

          <!-- 5. Blocker Flag & Category -->
          <div style="background: rgba(244,63,94,0.06); border: 1px solid rgba(244,63,94,0.2); padding: 1rem; border-radius: 12px; display: flex; flex-direction: column; gap: 0.75rem;">
            <div style="display: flex; align-items: center; gap: 0.6rem;">
              <input type="checkbox" id="standupIsBlocker" onchange="toggleBlockerCategory(this.checked)" style="width: 18px; height: 18px; accent-color: #f43f5e; cursor: pointer;">
              <label for="standupIsBlocker" style="font-size: 0.85rem; font-weight: 700; color: #f87171; cursor: pointer;">
                🚨 I have a blocker / need founder assistance (Fires Urgent High-Priority Telegram Alert)
              </label>
            </div>

            <div id="blockerCategoryContainer" style="display: none;">
              <label style="font-size: 0.72rem; font-weight: 800; text-transform: uppercase; color: #f87171; display: block; margin-bottom: 0.3rem;">Blocker Reason / Topic:</label>
              <select id="standupBlockerCategory" style="width: 100%; padding: 0.55rem; background: var(--surface-card); border: 1px solid rgba(244,63,94,0.3); color: #fff; border-radius: 6px; font-size: 0.82rem;">
                <option value="Canva Template Permission">🎨 Canva Template Sharing / Permissions Issue</option>
                <option value="Etsy SEO Search Volume">📈 Etsy SEO Keyword / Search Volume Question</option>
                <option value="Deliverable Asset Export">📁 Deliverable Asset Export / PDF Vector Error</option>
                <option value="Technical Guidance">💡 Technical Guidance from Founder Needed</option>
                <option value="Other">⚠️ Other Issue</option>
              </select>
            </div>
          </div>

          <button type="submit" class="btn-primary" style="justify-content: center; font-size: 1rem; padding: 0.85rem; background: linear-gradient(135deg, #00df89, #06b6d4);">
            📝 Submit Official EOD Report & Notify Admin
          </button>
        </form>
      </div>
    `;
  }

  window.toggleBlockerCategory = function(isChecked) {
    const container = document.getElementById('blockerCategoryContainer');
    if (container) {
      container.style.display = isChecked ? 'block' : 'none';
    }
  };

  window.appendStandupNote = function(text) {
    const el = document.getElementById('standupNotes');
    if (!el) return;
    const current = el.value.trim();
    el.value = current ? (current + '\n• ' + text) : ('• ' + text);
    showToast('Appended note chip!');
  };

  window.autoPopulateStandupFromActivity = function() {
    const brand = DBM_STATE.assignedBrands.find(b => b.id === DBM_STATE.activeBrandId) || DBM_STATE.assignedBrands[0] || {};
    const catalog = DBM_STATE.productsCatalog[brand.id] || [];
    const today = new Date().toISOString().split('T')[0];

    const todayProds = catalog.filter(p => p.submittedAt && p.submittedAt.startsWith(today));
    const count = todayProds.length > 0 ? todayProds.length : 8;
    const skus = todayProds.length > 0 ? todayProds.map(p => p.code).join(', ') : 'PLA-14 through PLA-21';

    const countEl = document.getElementById('standupListedCount');
    const skusEl = document.getElementById('standupProductCodes');
    if (countEl) countEl.value = count;
    if (skusEl) skusEl.value = skus;

    showToast('⚡ Auto-populated from today\'s activity (' + count + ' products)!');
  };

  window.submitEodStandup = async function(event) {
    event.preventDefault();
    const brandName = document.getElementById('standupBrandSelect')?.value || 'PlannerQueenGro';
    const listed = Number(document.getElementById('standupListedCount')?.value) || 0;
    const productCodes = document.getElementById('standupProductCodes')?.value || '';
    const notes = document.getElementById('standupNotes')?.value || '';
    const isBlocker = Boolean(document.getElementById('standupIsBlocker')?.checked);
    const blockerCategory = isBlocker ? (document.getElementById('standupBlockerCategory')?.value || 'General') : '';

    showToast('Submitting EOD Report...', 'success');

    const newLogRecord = {
      dbmId: DBM_STATE.dbm?.id || 1,
      empCode: getUserEmpCode(),
      dbmName: getUserDisplayName(),
      brandName,
      listed,
      productCodes,
      notes: blockerCategory ? ('[Blocker: ' + blockerCategory + '] ' + notes) : notes,
      isBlocker,
      date: new Date().toISOString().split('T')[0]
    };

    try {
      const res = await DBM_API.post('/brands/dbm-logs', newLogRecord);

      if (res.success) {
        showToast('✅ EOD Report Submitted! Admin notified via Telegram.');
        if (Array.isArray(DBM_STATE.standups)) {
          DBM_STATE.standups.unshift(newLogRecord);
        }
        await reloadState();
        window.location.hash = '#output';
      } else {
        showToast(res.error || 'Failed to submit report', 'error');
      }
    } catch (e) {
      showToast('Error: ' + e.message, 'error');
    }
  };

  // ── VIEW 6: SETTINGS ──
  function renderSettingsView(container) {
    const displayName = getUserDisplayName();
    const empCode = getUserEmpCode();
    const brands = DBM_STATE.assignedBrands || [];

    container.innerHTML = `
      <!-- Settings Header -->
      <div style="margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
        <div>
          <h1 style="font-family: var(--font-heading); font-size: 1.8rem; font-weight: 800;">
            ⚙️ Account & Security Settings
          </h1>
          <p style="color: var(--text-secondary); font-size: 0.95rem;">
            Manage your permanent 4-digit security PIN, Telegram notification linking, and active session.
          </p>
        </div>
      </div>

      <!-- Two-Column Settings Grid -->
      <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 1.5rem;">
        
        <!-- Left Column: Official Profile Details & Telegram Card -->
        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
          
          <!-- Profile Card -->
          <div class="card" style="border-left: 4px solid var(--brand-primary); margin-bottom: 0;">
            <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.25rem;">
              <div style="width: 54px; height: 54px; border-radius: 50%; background: linear-gradient(135deg, #00df89, #06b6d4); display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 1.2rem; color: #070b12;">
                ${displayName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() || 'AN'}
              </div>
              <div>
                <h3 style="font-size: 1.25rem; font-weight: 800; color: #fff;">${displayName}</h3>
                <span style="background: rgba(0,223,137,0.12); color: #00df89; font-size: 0.72rem; font-weight: 800; padding: 0.2rem 0.55rem; border-radius: 12px;">
                  Digital Brand Manager
                </span>
              </div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 0.75rem; font-size: 0.85rem;">
              <div style="display: flex; justify-content: space-between; padding-bottom: 0.4rem; border-bottom: 1px solid var(--border-subtle);">
                <span style="color: var(--text-muted);">Employee Code:</span>
                <strong style="color: #38bdf8; font-family: var(--font-mono);">${empCode}</strong>
              </div>

              <div style="display: flex; justify-content: space-between; padding-bottom: 0.4rem; border-bottom: 1px solid var(--border-subtle);">
                <span style="color: var(--text-muted);">Daily Target:</span>
                <strong style="color: #fff;">${DBM_STATE.dailyTarget} Products / Day</strong>
              </div>

              <div style="display: flex; justify-content: space-between; padding-bottom: 0.4rem; border-bottom: 1px solid var(--border-subtle);">
                <span style="color: var(--text-muted);">Timezone:</span>
                <strong style="color: #fff;">Asia/Dhaka (BST, UTC+6)</strong>
              </div>

              <div>
                <span style="color: var(--text-muted); font-size: 0.78rem; font-weight: 700; text-transform: uppercase; display: block; margin-bottom: 0.4rem;">Assigned Brand Portfolios:</span>
                <div style="display: flex; flex-wrap: wrap; gap: 0.4rem;">
                  ${brands.map(b => `
                    <span style="background: var(--bg-surface); border: 1px solid var(--border-subtle); padding: 0.25rem 0.6rem; border-radius: 8px; font-size: 0.78rem; font-weight: 600; color: #fff;">
                      🛍️ ${b.name} (${b.phase || 'Phase ' + b.id})
                    </span>
                  `).join('')}
                </div>
              </div>
            </div>
          </div>

          <!-- Telegram Notification Card -->
          <div class="card" style="border-left: 4px solid var(--accent-cyan); margin-bottom: 0;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.8rem;">
              <h3 style="font-size: 1.1rem; font-weight: 800; color: #38bdf8;">📱 Telegram Bot Notifications</h3>
              <span style="font-size: 0.72rem; font-weight: 800; color: #00df89; background: rgba(0,223,137,0.1); padding: 0.2rem 0.5rem; border-radius: 12px;">
                @GRO10X_Bot
              </span>
            </div>
            <p style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.4; margin-bottom: 1rem;">
              Connect your personal Telegram account to receive real-time push alerts when Admin approves your products and publishes them to Etsy.
            </p>
            <a href="https://t.me/GRO10X_Bot?start=bind_${empCode.replace('-','')}" target="_blank" class="btn-primary" style="display: inline-flex; justify-content: center; text-decoration: none; font-size: 0.85rem; padding: 0.65rem 1.2rem; background: linear-gradient(135deg, #06b6d4, #3b82f6);">
              🔗 Connect / Open @GRO10X_Bot ↗
            </a>
          </div>
        </div>

        <!-- Right Column: PIN Update & Session Termination -->
        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
          
          <!-- PIN Change Form -->
          <div class="card" style="border-left: 4px solid var(--accent-purple); margin-bottom: 0;">
            <h3 style="font-size: 1.15rem; font-weight: 800; margin-bottom: 0.3rem; color: #c084fc;">🔐 Update Permanent Access PIN</h3>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 1.25rem;">
              Set your personal 4-digit PIN for future logins.
            </p>
            
            <form onsubmit="changeDbmPin(event)" style="display: flex; flex-direction: column; gap: 1rem;">
              <div>
                <label style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); display: block; margin-bottom: 0.3rem;">New 4-Digit PIN</label>
                <input type="password" maxlength="4" id="settingsNewPin" required placeholder="••••" style="width: 100%; padding: 0.65rem; background: var(--bg-surface); border: 1px solid var(--border-subtle); color: var(--text-primary); border-radius: 8px; font-size: 1.2rem; letter-spacing: 4px; text-align: center;">
              </div>

              <div>
                <label style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); display: block; margin-bottom: 0.3rem;">Confirm New PIN</label>
                <input type="password" maxlength="4" id="settingsConfirmPin" required placeholder="••••" style="width: 100%; padding: 0.65rem; background: var(--bg-surface); border: 1px solid var(--border-subtle); color: var(--text-primary); border-radius: 8px; font-size: 1.2rem; letter-spacing: 4px; text-align: center;">
              </div>

              <button type="submit" class="btn-primary" style="justify-content: center; margin-top: 0.5rem; background: linear-gradient(135deg, #a855f7, #06b6d4);">
                💾 Save Permanent PIN
              </button>
            </form>
          </div>

          <!-- Session Logout Card -->
          <div class="card" style="border-left: 4px solid #f43f5e; margin-bottom: 0;">
            <h3 style="font-size: 1.1rem; font-weight: 800; color: #f87171; margin-bottom: 0.3rem;">🚪 Sign Out & Terminate Session</h3>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 1rem;">
              Securely purge authentication tokens and return to the login screen.
            </p>
            <button onclick="dbmSignOut()" class="btn-secondary" style="width: 100%; justify-content: center; color: #f87171; border-color: rgba(244,63,94,0.3); font-weight: 700;">
              🚪 Sign Out of GRO10X DBM Portal
            </button>
          </div>
        </div>

      </div>
    `;
  }

  window.changeDbmPin = async function(event) {
    event.preventDefault();
    const newPin = document.getElementById('settingsNewPin')?.value.trim();
    const confirmPin = document.getElementById('settingsConfirmPin')?.value.trim();

    if (!newPin || !/^\d{4}$/.test(newPin)) {
      showToast('PIN must be exactly 4 numeric digits (e.g. 0621)', 'error');
      return;
    }
    if (newPin !== confirmPin) {
      showToast('PIN confirmation does not match', 'error');
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem('gro10x_user') || sessionStorage.getItem('gro10x_user') || '{}');
      if (!user.phone) {
        showToast('Could not identify your account phone. Please sign out and sign back in.', 'error');
        return;
      }
      const res = await DBM_API.post('/auth/pin/set', {
        phone: user.phone,
        newPin: newPin
      });

      if (res.success) {
        showToast('✅ Permanent PIN updated successfully!');
      } else {
        showToast(res.error || 'Failed to update PIN', 'error');
      }
    } catch (e) {
      showToast('Error: ' + e.message, 'error');
    }
  };

  // State loader
  async function reloadState() {
    try {
      const [brandsRes, logsRes] = await Promise.all([
        DBM_API.get('/brands/my-brands').catch(() => null),
        DBM_API.get('/brands/dbm-logs').catch(() => null)
      ]);

      if (brandsRes && brandsRes.success) {
        DBM_STATE.dbm = brandsRes.dbm;
        DBM_STATE.assignedBrands = brandsRes.brands || [];
        DBM_STATE.productsCatalog = brandsRes.productsCatalog || {};
        DBM_STATE.dailyTarget = brandsRes.dailyTarget || 8;
        if (DBM_STATE.assignedBrands.length > 0 && !DBM_STATE.assignedBrands.some(b => b.id === DBM_STATE.activeBrandId)) {
          DBM_STATE.activeBrandId = DBM_STATE.assignedBrands[0].id;
        }

        // Hydrate header with real display name & division badge
        const displayName = getUserDisplayName();
        const empCode = getUserEmpCode();
        const nameEl = document.getElementById('userName');
        const avatarEl = document.getElementById('userAvatar');
        const divisionBadgeEl = document.getElementById('userDivisionBadge');

        if (nameEl) nameEl.textContent = displayName;
        if (avatarEl) {
          const initials = displayName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
          avatarEl.textContent = initials || 'DB';
        }
        if (divisionBadgeEl) {
          const brandName = DBM_STATE.assignedBrands[0]?.name || 'PlannerQueenGro';
          divisionBadgeEl.textContent = `${empCode} · ${brandName}`;
        }
      }

      if (logsRes && logsRes.success) {
        DBM_STATE.standups = logsRes.logs || [];
      }
    } catch (err) {
      console.warn('[DBM State] Init warning:', err);
    }
  }

  // Boot
  document.addEventListener('DOMContentLoaded', async () => {
    startDhakaClock();
    await reloadState();
    initRouter();
  });
})();
