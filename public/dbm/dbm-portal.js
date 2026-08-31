/**
 * public/dbm/dbm-portal.js
 * ─────────────────────────────────────────────────────────────────────────────
 * GRO10X Digital Brand Manager Dedicated Portal Engine v1.0
 * ─────────────────────────────────────────────────────────────────────────────
 */

(function() {
  'use strict';

  let DBM_STATE = {
    dbm: null,
    assignedBrands: [],
    productsCatalog: {},
    activeBrandId: 1,
    standups: [],
    todaySubmittedCount: 0,
    dailyTarget: 8
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
    const validRoutes = ['workspace', 'studio', 'output', 'standup', 'settings'];
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
    else if (current === 'output') renderOutputView(main);
    else if (current === 'standup') renderStandupView(main);
    else if (current === 'settings') renderSettingsView(main);
  }

  // ── VIEW 1: MY WORKSPACE (HOME) ──
  function renderWorkspaceView(container) {
    const brand = DBM_STATE.assignedBrands.find(b => b.id === DBM_STATE.activeBrandId) || DBM_STATE.assignedBrands[0] || {};
    const catalog = DBM_STATE.productsCatalog[brand.id] || [];
    const today = new Date().toISOString().split('T')[0];

    const todaySubmitted = catalog.filter(p => p.submittedAt && p.submittedAt.startsWith(today)).length;
    DBM_STATE.todaySubmittedCount = todaySubmitted;

    const pendingReview = catalog.filter(p => p.status === 'Pending Review').length;
    const liveCount = catalog.filter(p => p.status === 'Live').length;

    const progressPct = Math.min(100, Math.round((todaySubmitted / DBM_STATE.dailyTarget) * 100));

    container.innerHTML = `
      <div style="margin-bottom: 2rem;">
        <h1 style="font-family: var(--font-heading); font-size: 1.8rem; font-weight: 800; margin-bottom: 0.4rem;">
          👋 Welcome back, ${DBM_STATE.dbm?.name || 'Anika'}!
        </h1>
        <p style="color: var(--text-secondary); font-size: 0.95rem;">
          Your Daily Listing Mission: <strong>8 Products Target per day</strong> · Phase 1 Launch: <strong>${brand.name || 'PlannerQueenGro'}</strong>
        </p>
      </div>

      <!-- Quick Action Cards Grid -->
      <div style="display: grid; grid-template-columns: 1.4fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
        <!-- Card 1: Today's Target Meter -->
        <div class="card" style="background: linear-gradient(135deg, #131d33, #0f172a); border-color: rgba(0,223,137,0.2);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
            <div>
              <span style="font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: var(--brand-primary); letter-spacing: 0.5px;">Today's Daily Target</span>
              <h2 style="font-size: 2rem; font-weight: 900; margin-top: 0.2rem;">
                ${todaySubmitted} <span style="font-size: 1.1rem; color: var(--text-muted); font-weight: 500;">/ ${DBM_STATE.dailyTarget} Products</span>
              </h2>
            </div>
            <div style="text-align: right;">
              <span style="font-size: 1.4rem; font-weight: 800; color: ${progressPct >= 100 ? '#00df89' : '#38bdf8'};">${progressPct}%</span>
              <div style="font-size: 0.72rem; color: var(--text-muted);">Completed Today</div>
            </div>
          </div>

          <!-- Progress Bar -->
          <div style="height: 10px; background: rgba(30,41,59,0.8); border-radius: 20px; overflow: hidden; margin-bottom: 1.5rem;">
            <div style="height: 100%; width: ${progressPct}%; background: linear-gradient(90deg, #00df89, #06b6d4); border-radius: 20px; transition: width 0.4s ease;"></div>
          </div>

          <div style="display: flex; gap: 0.75rem;">
            <button class="btn-primary" onclick="window.location.hash='#studio'">
              ➕ Start New Listing
            </button>
            <button class="btn-secondary" onclick="window.location.hash='#standup'">
              📝 Submit EOD Standup
            </button>
          </div>
        </div>

        <!-- Card 2: Active Brand Mission -->
        <div class="card" style="border-left: 4px solid var(--accent-purple);">
          <span style="font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: var(--accent-purple); letter-spacing: 0.5px;">Active Brand Assignment</span>
          <h3 style="font-size: 1.3rem; font-weight: 800; margin: 0.3rem 0;">${brand.name || 'PlannerQueenGro'}</h3>
          <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 1rem;">
            ${brand.niche || 'Productivity & Life Planning'} · ${brand.phase || 'Phase 1 (Week 1–2)'}
          </p>

          <div style="display: flex; justify-content: space-between; font-size: 0.82rem; padding: 0.6rem 0; border-top: 1px solid var(--border-subtle);">
            <span style="color: var(--text-muted);">Pending Admin Approval:</span>
            <strong style="color: #f59e0b;">${pendingReview} Products</strong>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.82rem; padding: 0.6rem 0; border-top: 1px solid var(--border-subtle);">
            <span style="color: var(--text-muted);">Live on Etsy Shop:</span>
            <strong style="color: #00df89;">${liveCount} / 100 Live</strong>
          </div>
        </div>
      </div>

      <!-- Quick Recent Listings Table -->
      <div class="card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <h3 style="font-size: 1.1rem; font-weight: 800;">📋 Today's Submitted Products (${brand.name})</h3>
          <button class="btn-secondary" style="font-size: 0.78rem; padding: 0.35rem 0.75rem;" onclick="window.location.hash='#studio'">View All in Studio →</button>
        </div>

        ${renderRecentProductsTable(catalog)}
      </div>
    `;
  }

  function renderRecentProductsTable(catalog) {
    const recent = catalog.slice(0, 8);
    if (recent.length === 0) {
      return `
        <div style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
          <div style="font-size: 2rem; margin-bottom: 0.5rem;">📦</div>
          No products created for this brand yet.<br>
          <button class="btn-primary" style="margin-top: 1rem;" onclick="window.location.hash='#studio'">➕ Create First Product</button>
        </div>
      `;
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
          ${recent.map(p => {
            let statusBadge = '<span style="background:rgba(100,116,139,0.15); color:#94a3b8; padding:0.2rem 0.55rem; border-radius:12px; font-weight:700; font-size:0.75rem;">Draft</span>';
            if (p.status === 'Pending Review') statusBadge = '<span style="background:rgba(245,158,11,0.15); color:#f59e0b; padding:0.2rem 0.55rem; border-radius:12px; font-weight:700; font-size:0.75rem;">⏳ Pending Review</span>';
            if (p.status === 'Live') statusBadge = '<span style="background:rgba(0,223,137,0.15); color:#00df89; padding:0.2rem 0.55rem; border-radius:12px; font-weight:700; font-size:0.75rem;">🟢 Live on Etsy</span>';

            return `
              <tr style="border-bottom: 1px solid var(--border-subtle);">
                <td style="padding: 0.75rem 0.6rem; font-family: var(--font-mono); font-weight: 700;">${p.code || 'PROD'}</td>
                <td style="padding: 0.75rem 0.6rem; font-weight: 600;">${p.name || p.seoTitle || 'Untitled Product'}</td>
                <td style="padding: 0.75rem 0.6rem; color: var(--text-secondary);">${p.category || 'General'}</td>
                <td style="padding: 0.75rem 0.6rem; font-weight: 700;">$${Number(p.price || 4.99).toFixed(2)}</td>
                <td style="padding: 0.75rem 0.6rem;">${statusBadge}</td>
                <td style="padding: 0.75rem 0.6rem; text-align: right;">
                  <button class="btn-secondary" style="font-size: 0.75rem; padding: 0.25rem 0.6rem;" onclick="openProductInStudio('${p.code}')">Open Studio 🎨</button>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  }

  // ── VIEW 2: BRAND STUDIO ──
  function renderStudioView(container) {
    const brands = DBM_STATE.assignedBrands;
    const activeBrand = brands.find(b => b.id === DBM_STATE.activeBrandId) || brands[0] || {};
    const catalog = DBM_STATE.productsCatalog[activeBrand.id] || [];

    container.innerHTML = `
      <!-- Brand Switcher Tabs -->
      <div style="display: flex; gap: 0.5rem; margin-bottom: 1.5rem; overflow-x: auto; background: var(--bg-surface); padding: 0.4rem; border-radius: 14px; border: 1px solid var(--border-subtle);">
        ${brands.map(b => `
          <button onclick="switchActiveBrand(${b.id})" style="padding: 0.6rem 1.1rem; border-radius: 10px; font-weight: 700; font-size: 0.85rem; border: none; cursor: pointer; transition: all 0.2s ease; background: ${b.id === activeBrand.id ? 'var(--brand-primary)' : 'transparent'}; color: ${b.id === activeBrand.id ? '#070b12' : 'var(--text-secondary)'};">
            🛍️ ${b.name} (Brand #${b.id})
          </button>
        `).join('')}
      </div>

      <!-- Active Brand Banner -->
      <div class="card" style="display: flex; justify-content: space-between; align-items: center; background: linear-gradient(135deg, rgba(168,85,247,0.1), rgba(6,182,212,0.05)); border-color: rgba(168,85,247,0.3);">
        <div>
          <div style="display: flex; align-items: center; gap: 0.6rem;">
            <h2 style="font-size: 1.4rem; font-weight: 900;">${activeBrand.name}</h2>
            <span style="font-size: 0.72rem; font-weight: 800; background: rgba(0,223,137,0.15); color: #00df89; padding: 0.15rem 0.5rem; border-radius: 20px;">${activeBrand.phase || 'Phase 1'}</span>
          </div>
          <p style="color: var(--text-secondary); font-size: 0.85rem; margin-top: 0.2rem;">"${activeBrand.tagline || ''}" · Niche: ${activeBrand.niche}</p>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 1.2rem; font-weight: 800; color: #00df89;">${catalog.filter(p=>p.status==='Live').length} / 100</div>
          <div style="font-size: 0.72rem; color: var(--text-muted);">Products Live on Etsy</div>
        </div>
      </div>

      <!-- Product Creator & Studio Workflow -->
      <div class="card" style="border-top: 4px solid var(--brand-primary);">
        <h3 style="font-size: 1.2rem; font-weight: 800; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
          <span>🎨 3-Step Listing Workflow & Studio</span>
        </h3>

        <!-- Form Grid -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
          <!-- Left: Product Identity & AI Generator -->
          <div style="display: flex; flex-direction: column; gap: 1rem;">
            <div>
              <label style="font-size: 0.78rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); display: block; margin-bottom: 0.3rem;">1. Product Category</label>
              <select id="studioCategorySelect" style="width: 100%; padding: 0.65rem; background: var(--bg-surface); border: 1px solid var(--border-subtle); color: var(--text-primary); border-radius: 8px; font-weight: 600;">
                ${(activeBrand.categories || ['Daily Planners', 'Budget Trackers', 'Life Planners', 'Wellness Journals', 'Work & Career']).map(c => `<option value="${c}">${c}</option>`).join('')}
              </select>
            </div>

            <div>
              <label style="font-size: 0.78rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); display: block; margin-bottom: 0.3rem;">2. Product Working Name / SKU</label>
              <div style="display: flex; gap: 0.5rem;">
                <input type="text" id="studioSkuCode" placeholder="PLA-01" style="width: 90px; padding: 0.65rem; background: var(--bg-surface); border: 1px solid var(--border-subtle); color: var(--text-primary); border-radius: 8px; font-family: var(--font-mono); font-weight: 700;">
                <input type="text" id="studioProductName" placeholder="Ultimate Daily Life & Productivity Planner" style="flex: 1; padding: 0.65rem; background: var(--bg-surface); border: 1px solid var(--border-subtle); color: var(--text-primary); border-radius: 8px; font-weight: 600;">
              </div>
            </div>

            <button class="btn-primary" onclick="generateAiPackageForProduct()" style="justify-content: center;">
              ✨ Generate AI SEO & Blueprint (Title + 13 Tags)
            </button>
          </div>

          <!-- Right: Deliverable Vault & Retail Price -->
          <div style="display: flex; flex-direction: column; gap: 1rem;">
            <div>
              <label style="font-size: 0.78rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); display: block; margin-bottom: 0.3rem;">3. Retail Price ($ USD)</label>
              <input type="number" step="0.50" id="studioPrice" value="7.49" style="width: 100%; padding: 0.65rem; background: var(--bg-surface); border: 1px solid var(--border-subtle); color: var(--text-primary); border-radius: 8px; font-weight: 700;">
            </div>

            <div>
              <label style="font-size: 0.78rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); display: block; margin-bottom: 0.3rem;">4. Canva Template Link / Notion URL</label>
              <input type="url" id="studioCanvaUrl" placeholder="https://www.canva.com/design/..." style="width: 100%; padding: 0.65rem; background: var(--bg-surface); border: 1px solid var(--border-subtle); color: var(--text-primary); border-radius: 8px; font-size: 0.85rem;">
            </div>

            <div>
              <label style="font-size: 0.78rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); display: block; margin-bottom: 0.3rem;">5. Upload Deliverable PDF / ZIP (Vault)</label>
              <input type="file" id="studioVaultFile" accept=".pdf,.zip,.png,.jpg" style="width: 100%; padding: 0.4rem; background: var(--bg-surface); border: 1px solid var(--border-subtle); color: var(--text-secondary); border-radius: 8px; font-size: 0.82rem;">
            </div>
          </div>
        </div>

        <!-- Generated SEO Package (Editable) -->
        <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 1.25rem; margin-bottom: 1.5rem;">
          <h4 style="font-size: 0.95rem; font-weight: 800; color: #38bdf8; margin-bottom: 0.8rem;">📝 Generated Etsy SEO Package</h4>
          
          <div style="margin-bottom: 0.8rem;">
            <label style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted);">Etsy Listing Title (Max 140 Chars)</label>
            <input type="text" id="studioSeoTitle" placeholder="Click 'Generate AI SEO' above to generate..." style="width: 100%; padding: 0.6rem; background: var(--surface-card); border: 1px solid var(--border-subtle); color: var(--text-primary); border-radius: 8px; font-size: 0.88rem; font-weight: 600; margin-top: 0.2rem;">
          </div>

          <div style="margin-bottom: 0.8rem;">
            <label style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted);">13 Etsy SEO Tags (Comma-separated)</label>
            <input type="text" id="studioSeoTags" placeholder="daily planner, productivity tracker, digital planner, goodnotes..." style="width: 100%; padding: 0.6rem; background: var(--surface-card); border: 1px solid var(--border-subtle); color: var(--text-primary); border-radius: 8px; font-size: 0.85rem; margin-top: 0.2rem;">
          </div>

          <div>
            <label style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted);">Description / What's Included</label>
            <textarea id="studioSeoDesc" rows="3" placeholder="Description of the digital product, printable sizes, and included templates..." style="width: 100%; padding: 0.6rem; background: var(--surface-card); border: 1px solid var(--border-subtle); color: var(--text-primary); border-radius: 8px; font-size: 0.85rem; font-family: var(--font-body); margin-top: 0.2rem;"></textarea>
          </div>
        </div>

        <!-- Submit for Admin Approval Action -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-subtle); padding-top: 1.25rem;">
          <div style="font-size: 0.82rem; color: var(--text-muted);">
            ✅ Once submitted, Admin receives instant Telegram alert with review links.
          </div>
          <button class="btn-primary" onclick="submitProductForApproval()" style="background: linear-gradient(135deg, #00df89, #06b6d4); font-size: 1rem; padding: 0.75rem 1.8rem;">
            🚀 Submit for Admin Approval
          </button>
        </div>
      </div>

      <!-- Catalog Table -->
      <div class="card">
        <h3 style="font-size: 1.15rem; font-weight: 800; margin-bottom: 1rem;">📦 ${activeBrand.name} Catalog (${catalog.length} Products)</h3>
        ${renderRecentProductsTable(catalog)}
      </div>
    `;
  }

  window.switchActiveBrand = function(brandId) {
    DBM_STATE.activeBrandId = Number(brandId);
    renderCurrentRoute();
  };

  window.openProductInStudio = function(code) {
    const brand = DBM_STATE.assignedBrands.find(b => b.id === DBM_STATE.activeBrandId) || DBM_STATE.assignedBrands[0];
    const catalog = DBM_STATE.productsCatalog[brand.id] || [];
    const prod = catalog.find(p => p.code === code);
    if (!prod) return;

    window.location.hash = '#studio';
    setTimeout(() => {
      const skuEl = document.getElementById('studioSkuCode');
      const nameEl = document.getElementById('studioProductName');
      const priceEl = document.getElementById('studioPrice');
      const titleEl = document.getElementById('studioSeoTitle');
      const tagsEl = document.getElementById('studioSeoTags');
      const descEl = document.getElementById('studioSeoDesc');

      if (skuEl) skuEl.value = prod.code || '';
      if (nameEl) nameEl.value = prod.name || '';
      if (priceEl) priceEl.value = prod.price || 7.49;
      if (titleEl) titleEl.value = prod.seoTitle || prod.seo?.title || prod.name || '';
      if (tagsEl) tagsEl.value = Array.isArray(prod.seoTags) ? prod.seoTags.join(', ') : (prod.seo?.tags?.join(', ') || '');
      if (descEl) descEl.value = prod.seoDescription || prod.seo?.description || '';

      showToast('Loaded ' + prod.code + ' in Studio 🎨');
    }, 150);
  };

  window.generateAiPackageForProduct = async function() {
    const category = document.getElementById('studioCategorySelect')?.value || 'Daily Planners';
    const name = document.getElementById('studioProductName')?.value || category;
    const brand = DBM_STATE.assignedBrands.find(b => b.id === DBM_STATE.activeBrandId) || DBM_STATE.assignedBrands[0];

    showToast('🤖 Generating AI SEO Package...', 'success');

    try {
      const res = await DBM_API.post('/ai/etsy-seo', {
        title: name,
        category: category,
        niche: brand.niche,
        brandName: brand.name
      }).catch(() => null);

      if (res && res.title) {
        document.getElementById('studioSeoTitle').value = res.title;
        document.getElementById('studioSeoTags').value = Array.isArray(res.tags) ? res.tags.join(', ') : (res.tags || '');
        document.getElementById('studioSeoDesc').value = res.description || '';
        showToast('✅ AI SEO Package Generated!');
      } else {
        // Deterministic fallback
        const cleanName = name.replace(/[^a-zA-Z0-9 ]/g, '');
        document.getElementById('studioSeoTitle').value = cleanName + ' | Printable ' + category + ' for ' + brand.name;
        document.getElementById('studioSeoTags').value = 'digital planner, ' + category.toLowerCase() + ', goodnotes, printable template, daily tracker, ' + brand.niche.toLowerCase();
        document.getElementById('studioSeoDesc').value = 'Instant Download digital deliverable for ' + cleanName + '. Includes printable PDF formats and Canva editable links.';
        showToast('✅ SEO Package Created!');
      }
    } catch (e) {
      showToast('Generated standard template', 'success');
    }
  };

  window.submitProductForApproval = async function() {
    const sku = document.getElementById('studioSkuCode')?.value.trim() || ('SKU-' + Date.now().toString().slice(-4));
    const name = document.getElementById('studioProductName')?.value.trim() || 'Untitled Product';
    const category = document.getElementById('studioCategorySelect')?.value || 'General';
    const price = Number(document.getElementById('studioPrice')?.value) || 7.49;
    const canvaUrl = document.getElementById('studioCanvaUrl')?.value.trim() || '';
    const title = document.getElementById('studioSeoTitle')?.value.trim() || name;
    const tagsRaw = document.getElementById('studioSeoTags')?.value.trim() || '';
    const desc = document.getElementById('studioSeoDesc')?.value.trim() || '';

    const brand = DBM_STATE.assignedBrands.find(b => b.id === DBM_STATE.activeBrandId) || DBM_STATE.assignedBrands[0];

    const payload = {
      title: title,
      name: name,
      category: category,
      price: price,
      canvaTemplateUrl: canvaUrl,
      description: desc,
      tags: tagsRaw.split(',').map(s => s.trim()).filter(Boolean),
      submittedBy: DBM_STATE.dbm?.name || 'Anika Nower'
    };

    showToast('🚀 Submitting product for admin review...', 'success');

    try {
      const res = await DBM_API.post('/brands/' + brand.id + '/product/' + sku + '/submit-for-review', payload);
      if (res.success) {
        showToast('🎉 Submitted! Admin notified via Telegram.');
        await reloadState();
        renderCurrentRoute();
      } else {
        showToast(res.error || 'Failed to submit', 'error');
      }
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
  };

  // ── VIEW 3: MY OUTPUT ──
  function renderOutputView(container) {
    let totalListed = 0;
    let pendingCount = 0;
    let liveCount = 0;

    Object.values(DBM_STATE.productsCatalog).forEach(catalog => {
      catalog.forEach(p => {
        totalListed++;
        if (p.status === 'Pending Review') pendingCount++;
        if (p.status === 'Live') liveCount++;
      });
    });

    const vaultBonusEarned = (liveCount * 6.99).toFixed(2);

    container.innerHTML = `
      <div style="margin-bottom: 2rem;">
        <h1 style="font-family: var(--font-heading); font-size: 1.8rem; font-weight: 800;">📊 My Performance & Output Report</h1>
        <p style="color: var(--text-secondary);">Tracking your personal output, approval cadence, and monthly incentive bonuses.</p>
      </div>

      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.25rem; margin-bottom: 2rem;">
        <div class="card" style="border-left: 4px solid #38bdf8;">
          <span style="font-size: 0.72rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Submitted Today</span>
          <div style="font-size: 1.8rem; font-weight: 900; color: #38bdf8; margin-top: 0.2rem;">${DBM_STATE.todaySubmittedCount} <span style="font-size: 0.9rem; color: var(--text-muted);">/ 8 Quota</span></div>
        </div>

        <div class="card" style="border-left: 4px solid #f59e0b;">
          <span style="font-size: 0.72rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Pending Admin Approval</span>
          <div style="font-size: 1.8rem; font-weight: 900; color: #f59e0b; margin-top: 0.2rem;">${pendingCount}</div>
        </div>

        <div class="card" style="border-left: 4px solid #00df89;">
          <span style="font-size: 0.72rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Published & Live</span>
          <div style="font-size: 1.8rem; font-weight: 900; color: #00df89; margin-top: 0.2rem;">${liveCount}</div>
        </div>

        <div class="card" style="border-left: 4px solid #a855f7;">
          <span style="font-size: 0.72rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Vault Incentive Earned</span>
          <div style="font-size: 1.8rem; font-weight: 900; color: #a855f7; margin-top: 0.2rem;">$${vaultBonusEarned}</div>
        </div>
      </div>

      <!-- Standup Submission History -->
      <div class="card">
        <h3 style="font-size: 1.15rem; font-weight: 800; margin-bottom: 1rem;">📜 Your Standup Submission History</h3>
        ${renderStandupHistoryTable()}
      </div>
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

  // ── VIEW 4: EOD STANDUP ──
  function renderStandupView(container) {
    const brands = DBM_STATE.assignedBrands;
    const today = new Date().toISOString().split('T')[0];

    container.innerHTML = `
      <div style="margin-bottom: 2rem;">
        <h1 style="font-family: var(--font-heading); font-size: 1.8rem; font-weight: 800;">📝 End-of-Day (EOD) Standup Submission</h1>
        <p style="color: var(--text-secondary);">Submit your daily output summary. Admin is automatically notified via Telegram upon submission.</p>
      </div>

      <div class="card" style="max-width: 680px; border-top: 4px solid var(--accent-cyan);">
        <form onsubmit="submitEodStandup(event)" style="display: flex; flex-direction: column; gap: 1.25rem;">
          <div>
            <label style="font-size: 0.78rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); display: block; margin-bottom: 0.3rem;">1. Brand Worked on Today</label>
            <select id="standupBrandSelect" style="width: 100%; padding: 0.65rem; background: var(--bg-surface); border: 1px solid var(--border-subtle); color: var(--text-primary); border-radius: 8px; font-weight: 600;">
              ${brands.map(b => `<option value="${b.name}">${b.name} (Brand #${b.id})</option>`).join('')}
            </select>
          </div>

          <div>
            <label style="font-size: 0.78rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); display: block; margin-bottom: 0.3rem;">2. Products Built / Submitted Today (Quota: 8)</label>
            <input type="number" id="standupListedCount" min="0" max="30" value="${DBM_STATE.todaySubmittedCount || 8}" style="width: 100%; padding: 0.65rem; background: var(--bg-surface); border: 1px solid var(--border-subtle); color: var(--text-primary); border-radius: 8px; font-size: 1.1rem; font-weight: 800;">
          </div>

          <div>
            <label style="font-size: 0.78rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); display: block; margin-bottom: 0.3rem;">3. Specific SKUs / Etsy Categories</label>
            <input type="text" id="standupProductCodes" placeholder="e.g. PLA-01 through PLA-08 (Daily Planners)" style="width: 100%; padding: 0.65rem; background: var(--bg-surface); border: 1px solid var(--border-subtle); color: var(--text-primary); border-radius: 8px;">
          </div>

          <div>
            <label style="font-size: 0.78rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); display: block; margin-bottom: 0.3rem;">4. Daily Notes, Wins & Progress</label>
            <textarea id="standupNotes" rows="3" placeholder="Completed all 8 hero templates for PlannerQueenGro with Canva deliverable files." style="width: 100%; padding: 0.65rem; background: var(--bg-surface); border: 1px solid var(--border-subtle); color: var(--text-primary); border-radius: 8px; font-family: var(--font-body);"></textarea>
          </div>

          <!-- Blocker Flag -->
          <div style="background: rgba(244,63,94,0.08); border: 1px solid rgba(244,63,94,0.25); padding: 0.85rem; border-radius: 10px; display: flex; align-items: center; gap: 0.75rem;">
            <input type="checkbox" id="standupIsBlocker" style="width: 18px; height: 18px; accent-color: #f43f5e; cursor: pointer;">
            <label for="standupIsBlocker" style="font-size: 0.85rem; font-weight: 700; color: #f87171; cursor: pointer;">
              🚨 I have a blocker / need urgent admin assistance (Triggers Immediate Telegram Alert)
            </label>
          </div>

          <button type="submit" class="btn-primary" style="justify-content: center; font-size: 1rem; padding: 0.75rem;">
            📝 Submit Official EOD Report
          </button>
        </form>
      </div>
    `;
  }

  window.submitEodStandup = async function(event) {
    event.preventDefault();
    const brandName = document.getElementById('standupBrandSelect')?.value || 'PlannerQueenGro';
    const listed = Number(document.getElementById('standupListedCount')?.value) || 0;
    const productCodes = document.getElementById('standupProductCodes')?.value || '';
    const notes = document.getElementById('standupNotes')?.value || '';
    const isBlocker = Boolean(document.getElementById('standupIsBlocker')?.checked);

    showToast('Submitting EOD Report...', 'success');

    try {
      const res = await DBM_API.post('/brands/dbm-logs', {
        dbmId: DBM_STATE.dbm?.id || 1,
        brandName,
        listed,
        productCodes,
        notes,
        isBlocker
      });

      if (res.success) {
        showToast('✅ EOD Report Submitted! Admin notified.');
        await reloadState();
        window.location.hash = '#output';
      } else {
        showToast(res.error || 'Failed to submit report', 'error');
      }
    } catch (e) {
      showToast('Error: ' + e.message, 'error');
    }
  };

  // ── VIEW 5: SETTINGS ──
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

        // Hydrate header
        const nameEl = document.getElementById('userName');
        const avatarEl = document.getElementById('userAvatar');
        if (nameEl) nameEl.textContent = brandsRes.dbm.name || 'Anika Nower';
        if (avatarEl) {
          const initials = (brandsRes.dbm.name || 'AN').split(' ').map(w => w[0]).join('').substring(0, 2);
          avatarEl.textContent = initials;
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
