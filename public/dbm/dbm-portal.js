/**
 * public/dbm/dbm-portal.js
 * ─────────────────────────────────────────────────────────────────────────────
 * GRO10X Digital Brand Manager Dedicated Portal Engine v2.5
 * Tab 5: Enhanced EOD Standup with Auto-Population, Quick Win Chips,
 * Structured Blocker Escalation, and Direct Telegram Alerting.
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

  window.dbmSignOut = function() {
    localStorage.removeItem('gro10x_token');
    localStorage.removeItem('gro10x_user');
    sessionStorage.clear();
    document.cookie = 'gro10x_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    window.location.href = '/auth';
  };

  // Router
  function initRouter() {
    window.addEventListener('hashchange', renderCurrentRoute);
    renderCurrentRoute();
  }

  function renderCurrentRoute() {
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
    const displayName = getUserDisplayName();

    container.innerHTML = `
      <!-- Brand Switcher Chips on Workspace -->
      <div style="display: flex; gap: 0.5rem; margin-bottom: 1.5rem; overflow-x: auto; background: var(--bg-surface); padding: 0.4rem; border-radius: 14px; border: 1px solid var(--border-subtle);">
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
            Active Focus: <strong style="color: #fff;">${brand.name || 'PlannerQueenGro'}</strong> · Day 1 Target: <strong style="color: #38bdf8;">SKUs PLA-14 through PLA-21 (8 Products Quota)</strong>
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
              <div style="font-size: 0.72rem; color: var(--text-muted);">Target: PLA-14 to PLA-21</div>
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
              All (100)
            </button>
            <button onclick="setQueueFilter('live')" class="btn-filter ${DBM_STATE.tableFilter === 'live' ? 'active' : ''}" style="padding: 0.35rem 0.75rem; border-radius: 6px; font-size: 0.75rem; font-weight: 700; border: none; cursor: pointer; background: ${DBM_STATE.tableFilter === 'live' ? '#a855f7' : 'transparent'}; color: ${DBM_STATE.tableFilter === 'live' ? '#fff' : 'var(--text-muted)'};">
              🌟 Live References (${liveProducts.length})
            </button>
            <button onclick="setQueueFilter('today')" class="btn-filter ${DBM_STATE.tableFilter === 'today' ? 'active' : ''}" style="padding: 0.35rem 0.75rem; border-radius: 6px; font-size: 0.75rem; font-weight: 700; border: none; cursor: pointer; background: ${DBM_STATE.tableFilter === 'today' ? '#06b6d4' : 'transparent'}; color: ${DBM_STATE.tableFilter === 'today' ? '#070b12' : 'var(--text-muted)'};">
              🎯 Today's Batch (8)
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

  function renderFilteredQueueTable(catalog, nextCode) {
    let filtered = [...catalog];
    const filter = DBM_STATE.tableFilter || 'all';

    if (filter === 'live') {
      filtered = catalog.filter(p => p.status === 'Live');
    } else if (filter === 'today') {
      // Day 1 batch: index 13 to 20 (PLA-14 to PLA-21)
      filtered = catalog.slice(13, 21);
    } else if (filter === 'review') {
      filtered = catalog.filter(p => p.status === 'Pending Review');
    } else {
      // Show first 25 for fast rendering
      filtered = catalog.slice(0, 25);
    }

    if (filtered.length === 0) {
      return '<div style="color: var(--text-muted); padding: 2rem; text-align: center;">No products match this filter.</div>';
    }

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
    `;
  }

  // ── VIEW 2: BRAND STUDIO (5-STEP WIZARD) ──
  function renderStudioView(container) {
    const brands = DBM_STATE.assignedBrands;
    const activeBrand = brands.find(b => b.id === DBM_STATE.activeBrandId) || brands[0] || {};
    const catalog = DBM_STATE.productsCatalog[activeBrand.id] || [];

    const activeProd = catalog.find(p => p.code === DBM_STATE.currentStudioCode) || getNextActiveDraft(catalog);
    DBM_STATE.activeEditingProduct = activeProd;
    const step = DBM_STATE.currentStudioStep || 1;

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
      const isValidCanva = canvaUrl.includes('canva.com');

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
                ${isValidCanva ? '<span style="color:#00df89; font-weight:800; font-size:0.75rem;">🟢 Valid Canva Link</span>' : '<span style="color:var(--text-muted); font-size:0.75rem;">Paste share link below</span>'}
              </div>
            </div>
            
            <div style="display: flex; gap: 0.5rem;">
              <input type="url" id="step2CanvaUrl" value="${canvaUrl}" oninput="validateCanvaLinkInput(this.value)" placeholder="https://www.canva.com/design/DA..." style="flex: 1; padding: 0.7rem; background: var(--surface-card); border: 1px solid var(--border-subtle); color: #fff; border-radius: 8px; font-size: 0.88rem;">
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

      const mockupSlots = [
        { slot: 1, name: 'Hero Flatlay Presentation', desc: 'Main Etsy search image: iPad + clean accessories on neutral backdrop.' },
        { slot: 2, name: '3D Isometric Page Fan', desc: 'Shows full product depth and multiple spreads fanned out.' },
        { slot: 3, name: 'Features & Benefits Infographic', desc: 'Bullet points highlighting key tabs, index links, and productivity wins.' },
        { slot: 4, name: 'Compatible Devices & Sizes', desc: 'Badges showing GoodNotes, Notability, Apple iPad, and Printable PDF.' },
        { slot: 5, name: 'Daily Priority Matrix Spread', desc: 'Close-up high-resolution zoom of the primary daily planning page.' },
        { slot: 6, name: 'Habit & Routine Tracker Spread', desc: 'Close-up of streak tracking and monthly habit circles.' },
        { slot: 7, name: 'Monthly Overview & Budget Spread', desc: 'Close-up of calendar grid and financial logging section.' },
        { slot: 8, name: 'How to Download in 3 Steps', desc: 'Simple diagram: Purchase -> Download PDF -> Open in GoodNotes/Print.' },
        { slot: 9, name: 'Customer Review & Social Proof', desc: '5-star badge with empowering testimonial quote.' },
        { slot: 10, name: 'Brand Story & Guarantee', desc: 'PlannerQueenGro quality seal and instant delivery guarantee.' }
      ];

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
        <div style="background: var(--bg-surface); padding: 0.85rem 1.25rem; border-radius: 10px; border: 1px solid var(--border-subtle); margin-bottom: 1.5rem;">
          <label style="font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: var(--accent-purple); display: block; margin-bottom: 0.2rem;">
            🎬 Listing Demo Video URL (MP4 / Short Screen Walkthrough)
          </label>
          <input type="url" id="step3VideoUrl" value="${videoUrl}" placeholder="https://gro10x-ai.vercel.app/demo.mp4" style="width: 100%; padding: 0.55rem; background: var(--surface-card); border: 1px solid var(--border-subtle); color: #fff; border-radius: 6px; font-size: 0.82rem;">
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
      const title = prod.seoTitle || prod.seo?.title || prod.name || '';
      const canva = prod.vault?.canvaTemplateUrl || prod.canvaTemplateUrl || '';
      const price = Number(prod.price || 7.49).toFixed(2);
      const tags = prod.seoTags || [];
      const hasCanva = Boolean(canva);
      const hasTitle = Boolean(title && title.length >= 5 && title.length <= 140);
      const hasTags = tags.length >= 10;

      return `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
          <div>
            <h3 style="font-size: 1.25rem; font-weight: 800;">🚀 Step 5: Pre-Flight QC Verification & Submit for Admin Review</h3>
            <p style="color: var(--text-secondary); font-size: 0.85rem;">Review all checklist items before submitting for final Admin approval and Etsy publishing.</p>
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
              <div><strong>Title:</strong> ${title || '<span style="color:#f43f5e;">Missing Title</span>'}</div>
              <div><strong>Category:</strong> ${prod.category || 'General'}</div>
              <div><strong>Price:</strong> $${price} USD</div>
              <div><strong>Canva Deliverable:</strong> ${hasCanva ? '<a href="' + canva + '" target="_blank" style="color:#00df89;">🔗 Open Canva Link ↗</a>' : '<span style="color:#f43f5e;">Missing Link (Go back to Step 2)</span>'}</div>
              <div><strong>Tags Attached:</strong> ${tags.length} / 13 Tags</div>
            </div>
          </div>

          <!-- 5-Point Self-Checklist -->
          <div style="background: var(--bg-surface); padding: 1.25rem; border-radius: 12px; border: 1px solid var(--border-subtle);">
            <h4 style="font-size: 0.88rem; font-weight: 800; color: var(--brand-primary); margin-bottom: 0.8rem;">✅ Auto-Quality Verification Checklist</h4>
            <div style="display: flex; flex-direction: column; gap: 0.6rem; font-size: 0.82rem;">
              <label style="display: flex; align-items: center; gap: 0.5rem;">
                <span style="color:${hasTitle ? '#00df89' : '#f43f5e'}; font-weight:800;">${hasTitle ? '✓' : '✗'}</span>
                <span>Etsy SEO Title is formatted and under 140 chars</span>
              </label>
              <label style="display: flex; align-items: center; gap: 0.5rem;">
                <span style="color:${hasTags ? '#00df89' : '#f59e0b'}; font-weight:800;">${hasTags ? '✓' : '⚠️'}</span>
                <span>13 high-intent search tags populated (${tags.length} ready)</span>
              </label>
              <label style="display: flex; align-items: center; gap: 0.5rem;">
                <span style="color:${hasCanva ? '#00df89' : '#f43f5e'}; font-weight:800;">${hasCanva ? '✓' : '✗'}</span>
                <span>Canva deliverable template link attached & working</span>
              </label>
              <label style="display: flex; align-items: center; gap: 0.5rem;">
                <span style="color:#00df89; font-weight:800;">✓</span>
                <span>Retail price set to $${price} USD</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Big Submit Action -->
        <div style="background: linear-gradient(135deg, rgba(0,223,137,0.12), rgba(6,182,212,0.08)); border: 1px solid rgba(0,223,137,0.3); border-radius: 14px; padding: 1.5rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h4 style="font-size: 1.1rem; font-weight: 800; color: #fff;">Ready to proceed for publication?</h4>
            <p style="color: var(--text-secondary); font-size: 0.82rem;">Admin receives an immediate Telegram push notification to review and publish to Etsy.</p>
          </div>
          <button class="btn-primary" onclick="finalSubmitProductForReview('${prod.code}')" style="font-size: 1.05rem; padding: 0.85rem 2rem; background: linear-gradient(135deg, #00df89, #06b6d4);">
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
    if (val.includes('canva.com')) {
      el.innerHTML = '<span style="color:#00df89; font-weight:800; font-size:0.75rem;">🟢 Valid Canva Link</span>';
    } else if (val.length > 5) {
      el.innerHTML = '<span style="color:#f59e0b; font-size:0.75rem;">⚠️ Ensure link is from canva.com</span>';
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

  window.saveStep2AndContinue = function(code) {
    const canva = document.getElementById('step2CanvaUrl')?.value.trim();
    const notion = document.getElementById('step2NotionUrl')?.value.trim();

    if (DBM_STATE.activeEditingProduct) {
      if (!DBM_STATE.activeEditingProduct.vault) DBM_STATE.activeEditingProduct.vault = {};
      if (canva) DBM_STATE.activeEditingProduct.vault.canvaTemplateUrl = canva;
      if (notion) DBM_STATE.activeEditingProduct.vault.notionTemplateUrl = notion;
    }
    showToast('Saved Step 2 Deliverable Vault!');
    goToStudioStep(3);
  };

  window.saveStep3AndContinue = function(code) {
    const inputs = document.querySelectorAll('.mockup-input-slot');
    const mockups = [];
    inputs.forEach(inp => {
      const val = inp.value.trim();
      if (val) mockups.push(val);
    });
    const video = document.getElementById('step3VideoUrl')?.value.trim();

    if (DBM_STATE.activeEditingProduct) {
      DBM_STATE.activeEditingProduct.mockups = mockups;
      if (video) DBM_STATE.activeEditingProduct.video = { url: video };
    }
    showToast('Saved Step 3 Mockup Slots!');
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
    showToast('Saved Step 4 SEO & Pricing!');
    goToStudioStep(5);
  };

  window.generateAiSeoForCurrentProduct = async function(code) {
    const brand = DBM_STATE.assignedBrands.find(b => b.id === DBM_STATE.activeBrandId) || DBM_STATE.assignedBrands[0];
    const prod = DBM_STATE.activeEditingProduct || {};
    const name = prod.name || prod.seoTitle || 'Digital Planner';

    showToast('🤖 Generating AI SEO Package...', 'success');

    try {
      const res = await DBM_API.post('/ai/etsy-seo', {
        productName: name,
        title: name,
        category: prod.category || 'Productivity Planner',
        brandNiche: brand.niche,
        brandName: brand.name
      }).catch(() => null);

      if (res && res.title) {
        document.getElementById('step4Title').value = res.title;
        document.getElementById('step4Tags').value = Array.isArray(res.tags) ? res.tags.join(', ') : (res.tags || '');
        document.getElementById('step4Desc').value = res.description || '';
        updateTitleCharCount(res.title);
        updateTagCountBadge(Array.isArray(res.tags) ? res.tags.join(', ') : res.tags);
        showToast('✅ AI SEO Generated!');
      } else {
        // Fallback
        const cleanTitle = (name + ' | Printable Planner Template for ' + brand.name).slice(0, 138);
        const tags = 'digital planner, daily planner, goodnotes template, printable planner, productivity tracker, life planner, ipad agenda, adhd planner, goal tracker, routine journal, habit schedule, minimalist binder, weekly spread';
        document.getElementById('step4Title').value = cleanTitle;
        document.getElementById('step4Tags').value = tags;
        updateTitleCharCount(cleanTitle);
        updateTagCountBadge(tags);
        showToast('✅ SEO Template Generated!');
      }
    } catch (e) {
      showToast('Generated standard SEO package', 'success');
    }
  };

  window.finalSubmitProductForReview = async function(code) {
    const brand = DBM_STATE.assignedBrands.find(b => b.id === DBM_STATE.activeBrandId) || DBM_STATE.assignedBrands[0];
    const prod = DBM_STATE.activeEditingProduct || {};
    const submitterName = getUserDisplayName();

    const payload = {
      title: prod.seoTitle || prod.name || 'Product ' + code,
      name: prod.name || prod.seoTitle || 'Product ' + code,
      category: prod.category || 'General',
      price: Number(prod.price || 7.49),
      canvaTemplateUrl: prod.vault?.canvaTemplateUrl || prod.canvaTemplateUrl || 'https://canva.com',
      description: prod.seoDescription || prod.seo?.description || '',
      tags: prod.seoTags || ['digital planner', 'goodnotes planner', 'printable planner'],
      mockups: prod.mockups || [],
      submittedBy: submitterName
    };

    showToast('🚀 Submitting for Admin Review...', 'success');

    try {
      const res = await DBM_API.post('/brands/' + brand.id + '/product/' + code + '/submit-review', payload);
      if (res.success) {
        showToast('🎉 Product submitted! Admin alerted via Telegram.');
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
    const allRefs = catalog.filter(p => p.status === 'Live' || ['PLA-01','PLA-02','PLA-03','PLA-04','PLA-05','PLA-06','PLA-07','PLA-08','PLA-09','PLA-10','PLA-11','PLA-12','PLA-13'].includes(p.code));

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

    return products.map(p => `
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

        <div style="display: flex; gap: 0.4rem; align-items: center;">
          <span style="font-size: 0.72rem; font-weight: 700; color: #38bdf8; background: rgba(6,182,212,0.1); padding: 0.15rem 0.45rem; border-radius: 6px;">16 Spreads PDF</span>
          <span style="font-size: 0.72rem; font-weight: 700; color: #a855f7; background: rgba(168,85,247,0.1); padding: 0.15rem 0.45rem; border-radius: 6px;">13 Tags</span>
        </div>

        <button class="btn-ghost" style="width: 100%; justify-content: center; font-size: 0.8rem; color: #c084fc; border-color: rgba(168,85,247,0.3); margin-top: 0.75rem;">
          👀 Inspect Complete Assets & SEO →
        </button>
      </div>
    `).join('');
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

    inner.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 0.75rem;">
        <div>
          <span style="font-size: 0.75rem; font-weight: 800; color: #c084fc; text-transform: uppercase; letter-spacing: 0.5px;">🌟 Gold Standard Reference Specification</span>
          <h2 style="font-size: 1.4rem; font-weight: 900; color: #fff; margin-top: 0.2rem;">${prod.code}: ${prod.name || title}</h2>
        </div>
        <button onclick="closeReferenceModal()" style="background: none; border: none; font-size: 1.5rem; color: var(--text-muted); cursor: pointer; padding: 0.2rem 0.5rem;">✕</button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 1.2rem;">
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

    // Weekly 7-Day Velocity Data
    const weekDays = [
      { day: 'Mon', count: todayCount >= 8 ? 8 : (todayCount > 0 ? todayCount : 8), quota: 8, isToday: true },
      { day: 'Tue', count: 0, quota: 8, isToday: false },
      { day: 'Wed', count: 0, quota: 8, isToday: false },
      { day: 'Thu', count: 0, quota: 8, isToday: false },
      { day: 'Fri', count: 0, quota: 8, isToday: false },
      { day: 'Sat', count: 0, quota: 8, isToday: false },
      { day: 'Sun', count: 0, quota: 8, isToday: false }
    ];

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
          <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.3rem;">Target: 8 listings per day</div>
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
            <h3 style="font-size: 1.15rem; font-weight: 800;">📈 7-Day Production Velocity (8 Products / Day Cadence)</h3>
            <p style="font-size: 0.8rem; color: var(--text-muted);">Daily upload consistency tracker for this week.</p>
          </div>
          <span style="font-size: 0.8rem; font-weight: 800; color: #00df89; background: rgba(0,223,137,0.12); padding: 0.25rem 0.6rem; border-radius: 20px;">
            Target: 40 Listings / Week
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
              <strong style="color: #a855f7;">1.0x (100% First-Pass QC)</strong>
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

  function renderStandupHistoryTable() {
    if (!DBM_STATE.standups || DBM_STATE.standups.length === 0) {
      return '<div style="color: var(--text-muted); padding: 1.5rem; text-align: center;">No standup reports logged yet.</div>';
    }

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
          ${DBM_STATE.standups.map(s => `
            <tr style="border-bottom: 1px solid var(--border-subtle);">
              <td style="padding: 0.75rem 0.6rem; font-weight: 700;">${s.date}</td>
              <td style="padding: 0.75rem 0.6rem; color: #38bdf8; font-weight: 600;">${s.brandName}</td>
              <td style="padding: 0.75rem 0.6rem; font-weight: 800;">${s.listed} / 8</td>
              <td style="padding: 0.75rem 0.6rem;">${s.isBlocker ? '<span style="color:#f43f5e; font-weight:800;">🚨 Yes</span>' : '<span style="color:#00df89;">🟢 No</span>'}</td>
              <td style="padding: 0.75rem 0.6rem; color: var(--text-secondary);">${s.notes || 'None'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  // ── VIEW 5: EOD STANDUP ──
  function renderStandupView(container) {
    const brands = DBM_STATE.assignedBrands || [];
    const activeBrand = brands.find(b => b.id === DBM_STATE.activeBrandId) || brands[0] || {};
    const catalog = DBM_STATE.productsCatalog[activeBrand.id] || [];
    const today = new Date().toISOString().split('T')[0];

    const todayCount = DBM_STATE.todaySubmittedCount || 8;

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

    try {
      const res = await DBM_API.post('/brands/dbm-logs', {
        dbmId: DBM_STATE.dbm?.id || 1,
        brandName,
        listed,
        productCodes,
        notes: blockerCategory ? ('[Blocker: ' + blockerCategory + '] ' + notes) : notes,
        isBlocker
      });

      if (res.success) {
        showToast('✅ EOD Report Submitted! Admin notified via Telegram.');
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
    container.innerHTML = `
      <div style="margin-bottom: 2rem;">
        <h1 style="font-family: var(--font-heading); font-size: 1.8rem; font-weight: 800;">⚙️ Account Settings</h1>
        <p style="color: var(--text-secondary);">Manage your security PIN and profile details.</p>
      </div>

      <div class="card" style="max-width: 500px;">
        <h3 style="font-size: 1.15rem; font-weight: 800; margin-bottom: 1rem;">🔐 Change Access PIN</h3>
        
        <form onsubmit="changeDbmPin(event)" style="display: flex; flex-direction: column; gap: 1rem;">
          <div>
            <label style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); display: block; margin-bottom: 0.3rem;">New 4-Digit PIN</label>
            <input type="password" maxlength="4" id="settingsNewPin" required placeholder="••••" style="width: 100%; padding: 0.65rem; background: var(--bg-surface); border: 1px solid var(--border-subtle); color: var(--text-primary); border-radius: 8px; font-size: 1.2rem; letter-spacing: 4px; text-align: center;">
          </div>

          <div>
            <label style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); display: block; margin-bottom: 0.3rem;">Confirm New PIN</label>
            <input type="password" maxlength="4" id="settingsConfirmPin" required placeholder="••••" style="width: 100%; padding: 0.65rem; background: var(--bg-surface); border: 1px solid var(--border-subtle); color: var(--text-primary); border-radius: 8px; font-size: 1.2rem; letter-spacing: 4px; text-align: center;">
          </div>

          <button type="submit" class="btn-primary" style="justify-content: center; margin-top: 0.5rem;">
            💾 Save New PIN
          </button>
        </form>
      </div>
    `;
  }

  window.changeDbmPin = async function(event) {
    event.preventDefault();
    const newPin = document.getElementById('settingsNewPin')?.value.trim();
    const confirmPin = document.getElementById('settingsConfirmPin')?.value.trim();

    if (!newPin || newPin.length !== 4) {
      showToast('PIN must be exactly 4 digits', 'error');
      return;
    }
    if (newPin !== confirmPin) {
      showToast('PINs do not match', 'error');
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem('gro10x_user') || '{}');
      const res = await DBM_API.post('/auth/pin/set', {
        phone: user.phone || '01889825025',
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

        // Hydrate header with real display name
        const displayName = getUserDisplayName();
        const nameEl = document.getElementById('userName');
        const avatarEl = document.getElementById('userAvatar');
        if (nameEl) nameEl.textContent = displayName;
        if (avatarEl) {
          const initials = displayName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
          avatarEl.textContent = initials || 'AN';
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
