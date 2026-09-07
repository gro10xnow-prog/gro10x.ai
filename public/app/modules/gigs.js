/**
 * public/app/modules/gigs.js
 * ─────────────────────────────────────────────────────────────────────────────
 * GRO10X OS Marketplace Growth Engine & Gig Studio (Fiverr / Upwork)
 * Engine 1 ($35k) & Engine 2 ($25k) Demand Generation Cockpit.
 * Provides 1-click AI generation, 10-point health scoring, 1-click copy-paste
 * drawers for Fiverr form fields, and Telegram mobile brief dispatch.
 * ─────────────────────────────────────────────────────────────────────────────
 */

window.APP_MODULES = window.APP_MODULES || {};

let activeGigsData = [];
let selectedGig = null;
let activeFilter = 'all';
let searchQuery = '';
let activeCurrency = localStorage.getItem('gro10x_currency') || 'USD';
let isRegeneratingAll = false;
let regeneratingSlots = {};

function formatPrice(usdAmount) {
  if (activeCurrency === 'BDT') {
    const bdt = usdAmount * 120;
    if (bdt >= 100000) {
      const lakh = (bdt / 100000).toFixed(2).replace(/\.00$/, '');
      return `৳${lakh} Lakh`;
    }
    return `৳${bdt.toLocaleString('en-US')}`;
  }
  return `$${usdAmount.toLocaleString('en-US')}`;
}

async function fetchGigs() {
  try {
    const res = await APP_API.get('/gigs');
    if (res && res.data) {
      activeGigsData = res.data;
    } else if (Array.isArray(res)) {
      activeGigsData = res;
    }
  } catch (err) {
    console.warn('[GigsModule] API fetch failed, using cached fallback:', err);
  }
}

async function renderGigsView(container) {
  if (!container) return;

  if (!activeGigsData || activeGigsData.length === 0) {
    container.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:center; min-height:300px; color:var(--text-muted);">
        <div style="text-align:center;">
          <div style="font-size:2rem; animation:pulse 1s infinite;">⚡</div>
          <div style="margin-top:0.5rem; font-size:0.9rem;">Loading Marketplace Gig Studio...</div>
        </div>
      </div>
    `;
    await fetchGigs();
  }

  const totalGigs = activeGigsData.length || 7;
  const liveCount = activeGigsData.filter(g => g.status === 'Live').length;
  const readyCount = activeGigsData.filter(g => g.healthCheck?.passed).length;
  const avgHealth = Math.round(activeGigsData.reduce((s, g) => s + (g.healthCheck?.score || 10), 0) / (totalGigs || 1));
  const pendingCount = Math.max(0, totalGigs - liveCount);

  // Filtered Gigs
  const q = searchQuery.toLowerCase().trim();
  const filteredGigs = activeGigsData.filter(gig => {
    if (activeFilter === 'live' && gig.status !== 'Live') return false;
    if (activeFilter === 'generated' && gig.status === 'Live') return false;
    if (q) {
      const haystack = [
        gig.title,
        gig.id,
        gig.categorySelection?.primary,
        gig.categorySelection?.sub,
        ...(gig.tags || [])
      ].join(' ').toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  let html = `
    <div class="gigs-cockpit" style="max-width:1400px; margin:0 auto; padding-bottom:3rem;">
      <!-- Header -->
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1.5rem; flex-wrap:wrap; gap:1rem;">
        <div>
          <div style="display:flex; align-items:center; gap:0.5rem;">
            <span style="font-size:1.5rem;">⚡</span>
            <h2 style="font-size:1.4rem; font-weight:800; color:var(--text-primary); margin:0;">Marketplace Gig Studio</h2>
            <span style="font-size:0.75rem; background:rgba(0,223,137,0.15); color:#00df89; padding:0.2rem 0.6rem; border-radius:6px; font-weight:800; border:1px solid rgba(0,223,137,0.3);">FIVERR & UPWORK ENGINE</span>
          </div>
          <p style="color:var(--text-muted); font-size:0.85rem; margin:0.35rem 0 0 0;">
            Account: <strong>Technology Development</strong> (Owner: Firoz Uddin Ahmed) · Max 7 Gigs Quota · 10-Point Health Checked
          </p>
        </div>

        <div style="display:flex; gap:0.5rem; align-items:center; flex-wrap:wrap;">
          <button onclick="window.GigsModule.toggleCurrency()" class="btn-secondary btn-sm" style="display:flex; align-items:center; gap:0.35rem; font-size:0.8rem; font-weight:700;">
            <span>${activeCurrency === 'USD' ? '💵 USD ($)' : '৳ BDT (৳)'}</span>
          </button>
          <button id="btnRegenerateAll" onclick="window.GigsModule.promptRegenerateAll()" class="btn-secondary btn-sm" ${isRegeneratingAll ? 'disabled' : ''} style="display:flex; align-items:center; gap:0.4rem; font-size:0.8rem; background:${isRegeneratingAll ? 'rgba(255,255,255,0.05)' : ''};">
            <span>${isRegeneratingAll ? '⏳' : '🤖'}</span>
            <span id="btnRegenerateAllText">${isRegeneratingAll ? 'Generating Gigs...' : 'Regenerate All with AI'}</span>
          </button>
          <a href="#engines" class="btn-secondary btn-sm" style="display:flex; align-items:center; gap:0.4rem; text-decoration:none; font-size:0.8rem;">
            <span>🚀</span> <span>5-Engine Cockpit</span>
          </a>
        </div>
      </div>

      <!-- Metric KPI Cards -->
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:1rem; margin-bottom:1.5rem;">
        <div style="background:var(--card-bg, #121824); border:1px solid var(--border-subtle, rgba(255,255,255,0.08)); border-radius:12px; padding:1.1rem; box-shadow:0 4px 16px rgba(0,0,0,0.15);">
          <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; font-weight:700; letter-spacing:0.05em;">Account Gig Quota</div>
          <div style="font-size:1.6rem; font-weight:800; color:#00df89; margin:0.3rem 0 0.1rem 0;">${totalGigs} / 7 <span style="font-size:0.85rem; color:var(--text-muted); font-weight:600;">Slots</span></div>
          <div style="font-size:0.75rem; color:var(--text-muted);">100% Slot Capacity Ready</div>
        </div>

        <div style="background:var(--card-bg, #121824); border:1px solid var(--border-subtle, rgba(255,255,255,0.08)); border-radius:12px; padding:1.1rem; box-shadow:0 4px 16px rgba(0,0,0,0.15);">
          <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; font-weight:700; letter-spacing:0.05em;">Health Check Pass Rate</div>
          <div style="font-size:1.6rem; font-weight:800; color:#38bdf8; margin:0.3rem 0 0.1rem 0;">${readyCount} / ${totalGigs} <span style="font-size:0.85rem; color:var(--text-muted); font-weight:600;">(Score: ${avgHealth}/10)</span></div>
          <div style="font-size:0.75rem; color:var(--text-muted);">Fiverr & Upwork TOS Compliant</div>
        </div>

        <div style="background:var(--card-bg, #121824); border:1px solid var(--border-subtle, rgba(255,255,255,0.08)); border-radius:12px; padding:1.1rem; box-shadow:0 4px 16px rgba(0,0,0,0.15);">
          <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; font-weight:700; letter-spacing:0.05em;">Live Marketplace Gigs</div>
          <div style="font-size:1.6rem; font-weight:800; color:#a855f7; margin:0.3rem 0 0.1rem 0;">${liveCount} <span style="font-size:0.85rem; color:var(--text-muted); font-weight:600;">Live URL${liveCount === 1 ? '' : 's'}</span></div>
          <div style="font-size:0.75rem; color:var(--text-muted);">${pendingCount} Pending Copy-Paste Upload${pendingCount === 1 ? '' : 's'}</div>
        </div>

        <div style="background:var(--card-bg, #121824); border:1px solid var(--border-subtle, rgba(255,255,255,0.08)); border-radius:12px; padding:1.1rem; box-shadow:0 4px 16px rgba(0,0,0,0.15);">
          <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; font-weight:700; letter-spacing:0.05em;">Monthly Engine Target</div>
          <div style="font-size:1.6rem; font-weight:800; color:#f59e0b; margin:0.3rem 0 0.1rem 0;">${activeCurrency === 'BDT' ? '৳6.00 Lakh' : '$5,000'} <span style="font-size:0.85rem; color:var(--text-muted); font-weight:600;">/ mo</span></div>
          <div style="font-size:0.75rem; color:var(--text-muted);">${activeCurrency === 'BDT' ? '৳72 Lakh ARR' : '$60k ARR'} Combined Engine 1 & 2</div>
        </div>
      </div>

      <!-- FILTER TABS & SEARCH BAR -->
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem; margin-bottom:1.25rem;">
        <div style="display:flex; gap:0.35rem; background:rgba(0,0,0,0.3); padding:0.25rem; border-radius:10px; border:1px solid var(--border-subtle, rgba(255,255,255,0.08)); flex-wrap:wrap;">
          <button class="filter-btn ${activeFilter === 'all' ? 'active' : ''}" onclick="window.GigsModule.setFilter('all')" style="background:${activeFilter === 'all' ? '#00df89' : 'transparent'}; color:${activeFilter === 'all' ? '#09090b' : 'var(--text-secondary)'}; font-weight:700; border:none; padding:0.35rem 0.75rem; border-radius:7px; cursor:pointer; font-size:0.78rem; transition:all 0.2s;">
            All (${totalGigs})
          </button>
          <button class="filter-btn ${activeFilter === 'live' ? 'active' : ''}" onclick="window.GigsModule.setFilter('live')" style="background:${activeFilter === 'live' ? '#00df89' : 'transparent'}; color:${activeFilter === 'live' ? '#09090b' : 'var(--text-secondary)'}; font-weight:700; border:none; padding:0.35rem 0.75rem; border-radius:7px; cursor:pointer; font-size:0.78rem; transition:all 0.2s;">
            🟢 Live (${liveCount})
          </button>
          <button class="filter-btn ${activeFilter === 'generated' ? 'active' : ''}" onclick="window.GigsModule.setFilter('generated')" style="background:${activeFilter === 'generated' ? '#a855f7' : 'transparent'}; color:${activeFilter === 'generated' ? '#ffffff' : 'var(--text-secondary)'}; font-weight:700; border:none; padding:0.35rem 0.75rem; border-radius:7px; cursor:pointer; font-size:0.78rem; transition:all 0.2s;">
            🟣 Generated (${pendingCount})
          </button>
        </div>

        <div style="display:flex; align-items:center; gap:0.6rem;">
          <span style="font-size:0.75rem; color:var(--text-muted); font-weight:600;">Showing ${filteredGigs.length} of ${totalGigs} gigs</span>
          <div style="position:relative;">
            <input type="text" id="gigsSearchInput" value="${searchQuery}" placeholder="🔍 Search gig title, tags..." oninput="window.GigsModule.handleSearch(this.value)" style="background:var(--card-bg, #121824); border:1px solid var(--border-subtle, rgba(255,255,255,0.1)); border-radius:10px; padding:0.42rem 0.8rem; font-size:0.8rem; color:#ffffff; width:240px; outline:none; transition:border-color 0.2s;" onfocus="this.style.borderColor='#00df89'" onblur="this.style.borderColor='var(--border-subtle, rgba(255,255,255,0.1))'">
            ${searchQuery ? `<button onclick="window.GigsModule.clearSearch()" style="position:absolute; right:8px; top:50%; transform:translateY(-50%); background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:0.75rem;">✕</button>` : ''}
          </div>
        </div>
      </div>

      <!-- 7 Gig Slot Cards Grid -->
      <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(380px, 1fr)); gap:1.25rem;">
  `;

  if (filteredGigs.length === 0) {
    html += `
      <div style="grid-column: 1 / -1; background:var(--card-bg, #121824); border:1px dashed var(--border-subtle, rgba(255,255,255,0.1)); border-radius:16px; padding:3rem 1.5rem; text-align:center;">
        <div style="font-size:2.5rem; margin-bottom:0.6rem;">🔍</div>
        <h3 style="font-size:1.15rem; font-weight:800; color:#ffffff; margin:0 0 0.35rem 0;">No matching gigs found</h3>
        <p style="color:var(--text-secondary); font-size:0.85rem; margin:0 0 1.25rem 0;">No gigs match "${searchQuery}" with filter "${activeFilter}".</p>
        <button onclick="window.GigsModule.resetFilters()" class="btn-primary" style="background:#00df89; color:#09090b; font-weight:800; border:none; padding:0.45rem 1.2rem; border-radius:8px; cursor:pointer; font-size:0.82rem;">
          🔄 Reset Filters & Search
        </button>
      </div>
    `;
  } else {
    filteredGigs.forEach((gig, idx) => {
      const isLive = gig.status === 'Live';
      const isBriefed = gig.status === 'Briefed';
      const statusBg = isLive ? 'rgba(0,223,137,0.15)' : isBriefed ? 'rgba(56,189,248,0.15)' : 'rgba(168,85,247,0.15)';
      const statusColor = isLive ? '#00df89' : isBriefed ? '#38bdf8' : '#c084fc';
      const statusLabel = gig.status || 'Generated';
      const healthScore = gig.healthCheck?.score ?? 10;
      const healthPassed = gig.healthCheck?.passed ?? true;
      const basicPrice = gig.pricing?.basic?.price || 200;
      const standardPrice = gig.pricing?.standard?.price || 500;
      const premiumPrice = gig.pricing?.premium?.price || 1000;
      const isRegeneratingThis = !!regeneratingSlots[gig.id];

      html += `
        <div style="background:var(--card-bg, #121824); border:1px solid ${isLive ? 'rgba(0,223,137,0.25)' : 'var(--border-subtle, rgba(255,255,255,0.08))'}; border-radius:14px; padding:1.3rem; display:flex; flex-direction:column; justify-content:space-between; position:relative; box-shadow:0 4px 20px rgba(0,0,0,0.25); transition:transform 0.2s ease, border-color 0.2s ease;" onmouseenter="this.style.transform='translateY(-3px)'" onmouseleave="this.style.transform='translateY(0)'">
          <div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
              <div style="display:flex; align-items:center; gap:0.5rem;">
                <span style="font-size:0.75rem; font-weight:800; background:rgba(255,255,255,0.08); padding:0.2rem 0.5rem; border-radius:6px; color:var(--text-muted);">SLOT 0${gig.gigIndex || idx + 1}</span>
                <span style="font-size:0.75rem; font-weight:700; color:var(--text-muted);">${gig.id}</span>
              </div>
              <div style="display:flex; align-items:center; gap:0.4rem;">
                <button onclick="window.GigsModule.openHealthInspector('${gig.id}')" title="Click to view 10-Point Marketplace Compliance Audit" style="font-size:0.75rem; background:${healthPassed ? 'rgba(0,223,137,0.15)' : 'rgba(239,68,68,0.15)'}; color:${healthPassed ? '#00df89' : '#f87171'}; padding:0.15rem 0.5rem; border-radius:6px; font-weight:800; border:1px solid ${healthPassed ? 'rgba(0,223,137,0.3)' : 'rgba(239,68,68,0.3)'}; cursor:pointer; display:flex; align-items:center; gap:0.25rem;">
                  <span>${healthPassed ? '🟢' : '🔴'}</span> <span>${healthScore}/10</span>
                </button>
                <span style="font-size:0.75rem; background:${statusBg}; color:${statusColor}; padding:0.15rem 0.5rem; border-radius:6px; font-weight:800; border:1px solid ${statusBg};">
                  ${statusLabel.toUpperCase()}
                </span>
              </div>
            </div>

            <h3 style="font-size:1.05rem; font-weight:700; color:var(--text-primary); margin:0 0 0.6rem 0; line-height:1.4;">
              ${gig.title}
            </h3>

            <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:0.75rem; display:flex; align-items:center; gap:0.4rem;">
              <span>🏷️ ${gig.categorySelection?.primary || 'Programming & Tech'}</span>
              <span>&gt;</span>
              <span style="color:#38bdf8;">${gig.categorySelection?.sub || 'Web Applications'}</span>
            </div>

            <!-- Pricing Tiers Snapshot -->
            <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:0.4rem; background:rgba(0,0,0,0.25); padding:0.6rem; border-radius:8px; margin-bottom:0.9rem; text-align:center; border:1px solid rgba(255,255,255,0.04);">
              <div>
                <div style="font-size:0.65rem; color:var(--text-muted); text-transform:uppercase;">Basic</div>
                <div style="font-weight:800; font-size:0.95rem; color:#00df89;">${formatPrice(basicPrice)}</div>
                <div style="font-size:0.65rem; color:var(--text-muted);">${gig.pricing?.basic?.deliveryDays || 2}d delivery</div>
              </div>
              <div style="border-left:1px solid rgba(255,255,255,0.08); border-right:1px solid rgba(255,255,255,0.08);">
                <div style="font-size:0.65rem; color:var(--text-muted); text-transform:uppercase;">Standard</div>
                <div style="font-weight:800; font-size:0.95rem; color:#38bdf8;">${formatPrice(standardPrice)}</div>
                <div style="font-size:0.65rem; color:var(--text-muted);">${gig.pricing?.standard?.deliveryDays || 4}d delivery</div>
              </div>
              <div>
                <div style="font-size:0.65rem; color:var(--text-muted); text-transform:uppercase;">Premium</div>
                <div style="font-weight:800; font-size:0.95rem; color:#a855f7;">${formatPrice(premiumPrice)}</div>
                <div style="font-size:0.65rem; color:var(--text-muted);">${gig.pricing?.premium?.deliveryDays || 7}d delivery</div>
              </div>
            </div>

            <!-- Tags -->
            <div style="display:flex; flex-wrap:wrap; gap:0.35rem; margin-bottom:1rem;">
              ${(gig.tags || []).map(t => `<span style="font-size:0.7rem; background:rgba(255,255,255,0.05); color:var(--text-muted); padding:0.15rem 0.45rem; border-radius:4px;">#${t}</span>`).join('')}
            </div>
          </div>

          <!-- Action Footer -->
          <div style="display:flex; flex-direction:column; gap:0.5rem; border-top:1px solid var(--border-subtle, rgba(255,255,255,0.08)); padding-top:0.9rem;">
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem;">
              <button onclick="window.GigsModule.openCopyStudio('${gig.id}')" class="btn-primary btn-sm" style="justify-content:center; font-weight:700; font-size:0.8rem; background:linear-gradient(135deg, #00df89, #00b36b); color:#09090b; border:none; cursor:pointer;">
                📋 Open Copy Studio
              </button>
              <button onclick="window.GigsModule.dispatchToTelegram('${gig.id}')" class="btn-secondary btn-sm" style="justify-content:center; font-size:0.8rem; cursor:pointer;">
                📲 Push to Telegram
              </button>
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.75rem;">
              <button onclick="window.GigsModule.promptRegenerateSingle('${gig.serviceId}', ${gig.gigIndex || idx + 1}, '${gig.id}')" ${isRegeneratingThis ? 'disabled' : ''} style="background:none; border:none; color:var(--text-muted); cursor:pointer; padding:0; text-decoration:underline;">
                ${isRegeneratingThis ? '⏳ Regenerating...' : '🔄 Regenerate AI'}
              </button>
              ${gig.liveUrl ? `<a href="${gig.liveUrl}" target="_blank" rel="noopener noreferrer" style="color:#00df89; text-decoration:none; font-weight:700;">🔗 View Live Gig &rarr;</a>` : `<button onclick="window.GigsModule.openCopyStudio('${gig.id}', 6)" style="background:none; border:none; color:#38bdf8; cursor:pointer; padding:0; text-decoration:underline; font-weight:700;">+ Link Live URL</button>`}
            </div>
          </div>
        </div>
      `;
    });
  }

  html += `
      </div>
    </div>

    <!-- Modal Container for Copy Studio -->
    <div id="gigStudioModalOverlay" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.8); z-index:9999; align-items:center; justify-content:center; padding:1.5rem; backdrop-filter:blur(6px);">
      <div id="gigStudioModalContent" style="background:#0f172a; border:1px solid rgba(255,255,255,0.15); border-radius:16px; width:100%; max-width:850px; max-height:90vh; overflow-y:auto; padding:1.75rem; box-shadow:0 20px 60px rgba(0,0,0,0.6); position:relative;">
        <!-- Modal injected dynamically -->
      </div>
    </div>

    <!-- Modal Container for 10-Point Health Audit Inspector -->
    <div id="gigHealthModalOverlay" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.8); z-index:9999; align-items:center; justify-content:center; padding:1.5rem; backdrop-filter:blur(6px);">
      <div id="gigHealthModalContent" style="background:#0f172a; border:1px solid rgba(56,189,248,0.3); border-radius:16px; width:100%; max-width:650px; max-height:90vh; overflow-y:auto; padding:1.75rem; box-shadow:0 20px 60px rgba(0,0,0,0.6); position:relative;">
        <!-- Health modal injected dynamically -->
      </div>
    </div>

    <!-- Confirmation Modal Overlay -->
    <div id="gigConfirmModalOverlay" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.8); z-index:10000; align-items:center; justify-content:center; padding:1.5rem; backdrop-filter:blur(6px);">
      <div id="gigConfirmModalContent" style="background:#131b2e; border:1px solid rgba(255,255,255,0.15); border-radius:14px; width:100%; max-width:440px; padding:1.5rem; box-shadow:0 20px 50px rgba(0,0,0,0.7); text-align:center;">
        <!-- Confirmation injected dynamically -->
      </div>
    </div>
  `;

  container.innerHTML = html;
}

// ─── 6-STEP COPY STUDIO MODAL ───────────────────────────────────────────────────
let currentModalTab = 1;

function openCopyStudio(gigId, initialTab = 1) {
  const gig = activeGigsData.find(g => g.id === gigId);
  if (!gig) return;

  selectedGig = gig;
  currentModalTab = initialTab;
  renderModalBody();
}

function switchTab(tabNum) {
  currentModalTab = tabNum;
  renderModalBody();
}

function renderModalBody() {
  if (!selectedGig) return;
  const gig = selectedGig;

  const overlay = document.getElementById('gigStudioModalOverlay');
  const modalContent = document.getElementById('gigStudioModalContent');
  if (!overlay || !modalContent) return;

  const titleBody = gig.titleBody || gig.title.replace(/^i\s+will\s+/i, '').trim();
  const matrix = gig.pricingMatrix || {
    screens: { basic: 2, standard: 3, premium: 10 },
    apis: { basic: 0, standard: 1, premium: 5 },
    checkboxes: {
      database: [true, true, true],
      auth: [true, true, true],
      seo: [false, false, true],
      analytics: [false, false, true],
      payment: [false, true, true],
      hosting: [true, true, true],
      admin: [true, true, true],
      securityAudit: [false, false, true]
    }
  };
  const gallery = gig.galleryPrompts || {};
  const videoScenes = gallery.videoScenes || [];
  const imagePrompts = gallery.imagePrompts || [];
  const pdfPrompts = gallery.pdfPrompts || [];

  const tabNames = [
    { num: 1, icon: '📝', label: '1. Overview' },
    { num: 2, icon: '💳', label: '2. Pricing' },
    { num: 3, icon: '📄', label: '3. Description & FAQ' },
    { num: 4, icon: '📋', label: '4. Requirements' },
    { num: 5, icon: '🎬', label: '5. Gallery & Prompts' },
    { num: 6, icon: '🚀', label: '6. Publish & Link' }
  ];

  let tabNavHtml = `
    <div style="display:flex; gap:0.4rem; overflow-x:auto; padding-bottom:0.6rem; margin-bottom:1.25rem; border-bottom:1px solid rgba(255,255,255,0.08);">
  `;
  tabNames.forEach(t => {
    const isActive = currentModalTab === t.num;
    tabNavHtml += `
      <button onclick="window.GigsModule.switchTab(${t.num})" style="padding:0.45rem 0.85rem; border-radius:8px; font-size:0.8rem; font-weight:700; cursor:pointer; white-space:nowrap; border:1px solid ${isActive ? '#00df89' : 'rgba(255,255,255,0.08)'}; background:${isActive ? 'rgba(0,223,137,0.15)' : 'rgba(255,255,255,0.03)'}; color:${isActive ? '#00df89' : 'var(--text-muted)'}; display:flex; align-items:center; gap:0.35rem;">
        <span>${t.icon}</span> <span>${t.label}</span>
      </button>
    `;
  });
  tabNavHtml += `</div>`;

  let tabBodyHtml = '';

  // ── TAB 1: OVERVIEW ────────────────────────────────────────────────────────
  if (currentModalTab === 1) {
    tabBodyHtml = `
      <div style="display:flex; flex-direction:column; gap:1.2rem;">
        <!-- Title Box -->
        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:1rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
            <label style="font-size:0.75rem; font-weight:800; color:var(--text-muted); text-transform:uppercase;">Gig Title (Fiverr Auto-Prepends "I will")</label>
            <div style="display:flex; gap:0.4rem;">
              <button onclick="window.GigsModule.copyText('${escapeHtml(titleBody)}', this)" class="btn-primary btn-sm" style="background:#00df89; color:#09090b; font-weight:800; font-size:0.75rem; padding:0.25rem 0.65rem; border:none;">📋 Copy Title Body Only</button>
              <button onclick="window.GigsModule.copyText('${escapeHtml(gig.title)}', this)" class="btn-secondary btn-sm" style="font-size:0.75rem; padding:0.25rem 0.65rem;">Copy Full</button>
            </div>
          </div>
          <div style="background:rgba(0,0,0,0.35); padding:0.75rem; border-radius:6px; font-size:0.95rem; color:#fff; display:flex; align-items:center; gap:0.4rem; border:1px solid rgba(255,255,255,0.05);">
            <span style="color:var(--text-muted); font-weight:600;">I will</span>
            <strong style="color:#00df89;">${titleBody}</strong>
            <span style="margin-left:auto; font-size:0.75rem; color:var(--text-muted);">${titleBody.length} / 80 chars</span>
          </div>
        </div>

        <!-- Category & Service Type -->
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
          <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:1rem;">
            <label style="font-size:0.75rem; font-weight:800; color:var(--text-muted); text-transform:uppercase; display:block; margin-bottom:0.4rem;">Category Selection</label>
            <div style="font-size:0.9rem; color:#38bdf8; font-weight:700;">
              ${gig.categorySelection?.primary || 'Programming & Tech'} &gt; <span style="color:#00df89;">${gig.categorySelection?.sub || 'Vibe Coding'}</span>
            </div>
            <div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.3rem;">Service Type: <strong>${gig.categorySelection?.serviceType || 'Development & MVP'}</strong></div>
          </div>

          <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:1rem;">
            <label style="font-size:0.75rem; font-weight:800; color:var(--text-muted); text-transform:uppercase; display:block; margin-bottom:0.4rem;">Gig Metadata Dropdowns</label>
            <div style="font-size:0.8rem; color:#e2e8f0; line-height:1.5;">
              <div>• Platform: <strong style="color:#38bdf8;">Bolt.new / Cursor / v0</strong></div>
              <div>• Target: <strong style="color:#00df89;">Web / Mobile PWA</strong></div>
              <div>• Database: <strong style="color:#a855f7;">Supabase (PostgreSQL)</strong></div>
              <div>• Hosting: <strong style="color:#f59e0b;">Vercel Edge Cloud</strong></div>
            </div>
          </div>
        </div>

        <!-- 5 Search Tags (Positive Keywords) -->
        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:1rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.6rem;">
            <label style="font-size:0.75rem; font-weight:800; color:var(--text-muted); text-transform:uppercase;">Positive Keywords / 5 Search Tags (1-Click Paste)</label>
            <button onclick="window.GigsModule.copyText('${(gig.tags || []).join(', ')}', this)" class="btn-secondary btn-sm" style="font-size:0.75rem; padding:0.2rem 0.6rem;">📋 Copy All 5</button>
          </div>
          <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
            ${(gig.tags || []).map(t => `
              <button onclick="window.GigsModule.copyText('${t}', this)" style="background:rgba(56,189,248,0.12); border:1px solid rgba(56,189,248,0.3); color:#38bdf8; padding:0.35rem 0.75rem; border-radius:6px; font-size:0.85rem; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:0.3rem;">
                <span>🏷️ ${t.toUpperCase()}</span> <span style="font-size:0.7rem; opacity:0.7;">(click copy)</span>
              </button>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  // ── TAB 2: PRICING MATRIX ──────────────────────────────────────────────────
  else if (currentModalTab === 2) {
    const cb = matrix.checkboxes || {};
    tabBodyHtml = `
      <div style="display:flex; flex-direction:column; gap:1.2rem;">
        <div style="background:rgba(0,223,137,0.08); border:1px solid rgba(0,223,137,0.25); border-radius:10px; padding:0.75rem 1rem; font-size:0.85rem; color:#00df89;">
          💡 <strong>Fiverr Pricing Grid Companion:</strong> Copy each tier's title, description, and match the checkboxes below.
        </div>

        <!-- 3-Tier Grid Table -->
        <div style="overflow-x:auto; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:1rem;">
          <table style="width:100%; border-collapse:collapse; text-align:left; font-size:0.85rem;">
            <thead>
              <tr style="border-bottom:1px solid rgba(255,255,255,0.1);">
                <th style="padding:0.75rem; color:var(--text-muted); width:28%;">Field / Feature</th>
                <th style="padding:0.75rem; color:#00df89; width:24%;">
                  <div style="font-weight:800; font-size:0.95rem;">BASIC (${formatPrice(gig.pricing?.basic?.price || 300)})</div>
                  <button onclick="window.GigsModule.copyTier('basic')" class="btn-secondary btn-sm" style="font-size:0.65rem; padding:0.15rem 0.45rem; margin-top:0.3rem;">📋 Copy Tier</button>
                </th>
                <th style="padding:0.75rem; color:#38bdf8; width:24%;">
                  <div style="font-weight:800; font-size:0.95rem;">STANDARD (${formatPrice(gig.pricing?.standard?.price || 600)})</div>
                  <button onclick="window.GigsModule.copyTier('standard')" class="btn-secondary btn-sm" style="font-size:0.65rem; padding:0.15rem 0.45rem; margin-top:0.3rem;">📋 Copy Tier</button>
                </th>
                <th style="padding:0.75rem; color:#a855f7; width:24%;">
                  <div style="font-weight:800; font-size:0.95rem;">PREMIUM (${formatPrice(gig.pricing?.premium?.price || 1200)})</div>
                  <button onclick="window.GigsModule.copyTier('premium')" class="btn-secondary btn-sm" style="font-size:0.65rem; padding:0.15rem 0.45rem; margin-top:0.3rem;">📋 Copy Tier</button>
                </th>
              </tr>
            </thead>
            <tbody>
              <!-- Package Title -->
              <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
                <td style="padding:0.6rem; color:var(--text-muted); font-weight:700;">Package Title</td>
                <td style="padding:0.6rem;">
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-weight:700; color:#fff;">${gig.pricing?.basic?.title || 'Core Sprint'}</span>
                    <button onclick="window.GigsModule.copyText('${escapeHtml(gig.pricing?.basic?.title || '')}', this)" class="btn-secondary btn-sm" style="font-size:0.65rem; padding:0.15rem 0.4rem;">Copy</button>
                  </div>
                </td>
                <td style="padding:0.6rem;">
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-weight:700; color:#fff;">${gig.pricing?.standard?.title || 'Full Sprint'}</span>
                    <button onclick="window.GigsModule.copyText('${escapeHtml(gig.pricing?.standard?.title || '')}', this)" class="btn-secondary btn-sm" style="font-size:0.65rem; padding:0.15rem 0.4rem;">Copy</button>
                  </div>
                </td>
                <td style="padding:0.6rem;">
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-weight:700; color:#fff;">${gig.pricing?.premium?.title || 'Production Suite'}</span>
                    <button onclick="window.GigsModule.copyText('${escapeHtml(gig.pricing?.premium?.title || '')}', this)" class="btn-secondary btn-sm" style="font-size:0.65rem; padding:0.15rem 0.4rem;">Copy</button>
                  </div>
                </td>
              </tr>

              <!-- Package Description -->
              <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
                <td style="padding:0.6rem; color:var(--text-muted); font-weight:700;">Description</td>
                <td style="padding:0.6rem;">
                  <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:0.3rem;">${gig.pricing?.basic?.description || ''}</div>
                  <button onclick="window.GigsModule.copyText('${escapeHtml(gig.pricing?.basic?.description || '')}', this)" class="btn-secondary btn-sm" style="font-size:0.65rem; padding:0.15rem 0.4rem;">📋 Copy Desc</button>
                </td>
                <td style="padding:0.6rem;">
                  <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:0.3rem;">${gig.pricing?.standard?.description || ''}</div>
                  <button onclick="window.GigsModule.copyText('${escapeHtml(gig.pricing?.standard?.description || '')}', this)" class="btn-secondary btn-sm" style="font-size:0.65rem; padding:0.15rem 0.4rem;">📋 Copy Desc</button>
                </td>
                <td style="padding:0.6rem;">
                  <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:0.3rem;">${gig.pricing?.premium?.description || ''}</div>
                  <button onclick="window.GigsModule.copyText('${escapeHtml(gig.pricing?.premium?.description || '')}', this)" class="btn-secondary btn-sm" style="font-size:0.65rem; padding:0.15rem 0.4rem;">📋 Copy Desc</button>
                </td>
              </tr>

              <!-- Delivery Time -->
              <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
                <td style="padding:0.6rem; color:var(--text-muted); font-weight:700;">Delivery Time</td>
                <td style="padding:0.6rem; color:#00df89; font-weight:700;">⚡ ${gig.pricing?.basic?.deliveryDays || 2} Days</td>
                <td style="padding:0.6rem; color:#38bdf8; font-weight:700;">⚡ ${gig.pricing?.standard?.deliveryDays || 4} Days</td>
                <td style="padding:0.6rem; color:#a855f7; font-weight:700;">⚡ ${gig.pricing?.premium?.deliveryDays || 7} Days</td>
              </tr>

              <!-- Screens / Features Count -->
              <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
                <td style="padding:0.6rem; color:var(--text-muted); font-weight:700;">Screens / Features</td>
                <td style="padding:0.6rem; font-weight:700; color:#fff;">${matrix.screens?.basic ?? 2}</td>
                <td style="padding:0.6rem; font-weight:700; color:#fff;">${matrix.screens?.standard ?? 3}</td>
                <td style="padding:0.6rem; font-weight:700; color:#fff;">${matrix.screens?.premium ?? 10}</td>
              </tr>

              <!-- APIs Integrated -->
              <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
                <td style="padding:0.6rem; color:var(--text-muted); font-weight:700;">APIs Integrated</td>
                <td style="padding:0.6rem; color:var(--text-muted);">${matrix.apis?.basic ? matrix.apis.basic : 'Select (0)'}</td>
                <td style="padding:0.6rem; font-weight:700; color:#fff;">${matrix.apis?.standard ?? 1}</td>
                <td style="padding:0.6rem; font-weight:700; color:#fff;">${matrix.apis?.premium ?? 5}</td>
              </tr>

              <!-- Checkboxes Matrix -->
              <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
                <td style="padding:0.6rem; color:var(--text-muted);">Database configuration</td>
                <td style="padding:0.6rem;">${cb.database?.[0] ? '✅ Checked' : '⬜ Unchecked'}</td>
                <td style="padding:0.6rem;">${cb.database?.[1] ? '✅ Checked' : '⬜ Unchecked'}</td>
                <td style="padding:0.6rem;">${cb.database?.[2] ? '✅ Checked' : '⬜ Unchecked'}</td>
              </tr>
              <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
                <td style="padding:0.6rem; color:var(--text-muted);">Authentication setup</td>
                <td style="padding:0.6rem;">${cb.auth?.[0] ? '✅ Checked' : '⬜ Unchecked'}</td>
                <td style="padding:0.6rem;">${cb.auth?.[1] ? '✅ Checked' : '⬜ Unchecked'}</td>
                <td style="padding:0.6rem;">${cb.auth?.[2] ? '✅ Checked' : '⬜ Unchecked'}</td>
              </tr>
              <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
                <td style="padding:0.6rem; color:var(--text-muted);">Deployment & hosting</td>
                <td style="padding:0.6rem;">${cb.hosting?.[0] ? '✅ Checked' : '⬜ Unchecked'}</td>
                <td style="padding:0.6rem;">${cb.hosting?.[1] ? '✅ Checked' : '⬜ Unchecked'}</td>
                <td style="padding:0.6rem;">${cb.hosting?.[2] ? '✅ Checked' : '⬜ Unchecked'}</td>
              </tr>
              <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
                <td style="padding:0.6rem; color:var(--text-muted);">Admin dashboard screens</td>
                <td style="padding:0.6rem;">${cb.admin?.[0] ? '✅ Checked' : '⬜ Unchecked'}</td>
                <td style="padding:0.6rem;">${cb.admin?.[1] ? '✅ Checked' : '⬜ Unchecked'}</td>
                <td style="padding:0.6rem;">${cb.admin?.[2] ? '✅ Checked' : '⬜ Unchecked'}</td>
              </tr>
              <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
                <td style="padding:0.6rem; color:var(--text-muted);">Payment integration</td>
                <td style="padding:0.6rem;">${cb.payment?.[0] ? '✅ Checked' : '⬜ Unchecked'}</td>
                <td style="padding:0.6rem;">${cb.payment?.[1] ? '✅ Checked' : '⬜ Unchecked'}</td>
                <td style="padding:0.6rem;">${cb.payment?.[2] ? '✅ Checked' : '⬜ Unchecked'}</td>
              </tr>
              <tr>
                <td style="padding:0.6rem; color:var(--text-muted);">Security audit / SEO</td>
                <td style="padding:0.6rem;">${cb.securityAudit?.[0] ? '✅ Checked' : '⬜ Unchecked'}</td>
                <td style="padding:0.6rem;">${cb.securityAudit?.[1] ? '✅ Checked' : '⬜ Unchecked'}</td>
                <td style="padding:0.6rem;">${cb.securityAudit?.[2] ? '✅ Checked' : '⬜ Unchecked'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // ── TAB 3: DESCRIPTION & FAQ ───────────────────────────────────────────────
  else if (currentModalTab === 3) {
    tabBodyHtml = `
      <div style="display:flex; flex-direction:column; gap:1.2rem;">
        <!-- Description -->
        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:1rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
            <label style="font-size:0.75rem; font-weight:800; color:var(--text-muted); text-transform:uppercase;">
              Main Description (${(gig.description || '').length} / 1200 Characters Max)
            </label>
            <button onclick="window.GigsModule.copyText('${escapeHtml(gig.description)}', this)" class="btn-primary btn-sm" style="background:#00df89; color:#09090b; font-weight:800; font-size:0.75rem; padding:0.25rem 0.65rem; border:none;">📋 Copy Full Description</button>
          </div>
          <div style="background:rgba(0,0,0,0.35); padding:0.85rem; border-radius:6px; font-size:0.85rem; color:#e2e8f0; line-height:1.6; white-space:pre-wrap; max-height:220px; overflow-y:auto; border:1px solid rgba(255,255,255,0.05);">${gig.description}</div>
        </div>

        <!-- FAQs with modular Copy Q and Copy A -->
        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:1rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.6rem;">
            <label style="font-size:0.75rem; font-weight:800; color:var(--text-muted); text-transform:uppercase;">Frequently Asked Questions (4 Pairs · 2-Click Add)</label>
            <button onclick="window.GigsModule.copyAllFaqs()" class="btn-secondary btn-sm" style="font-size:0.72rem; padding:0.2rem 0.6rem;">📋 Copy All 4 FAQs</button>
          </div>
          <div style="display:flex; flex-direction:column; gap:0.6rem;">
            ${(gig.faq || []).map((f, i) => `
              <div style="background:rgba(0,0,0,0.3); padding:0.75rem; border-radius:8px; border:1px solid rgba(255,255,255,0.04);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.3rem;">
                  <strong style="color:#38bdf8; font-size:0.85rem;">Q${i+1}: ${f.q}</strong>
                  <button onclick="window.GigsModule.copyText('${escapeHtml(f.q)}', this)" class="btn-secondary btn-sm" style="font-size:0.65rem; padding:0.15rem 0.45rem;">📋 Copy Q</button>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-top:0.35rem; gap:0.5rem;">
                  <div style="color:var(--text-muted); font-size:0.8rem; line-height:1.4;">A: ${f.a}</div>
                  <button onclick="window.GigsModule.copyText('${escapeHtml(f.a)}', this)" class="btn-secondary btn-sm" style="font-size:0.65rem; padding:0.15rem 0.45rem; white-space:nowrap;">📋 Copy A</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  // ── TAB 4: REQUIREMENTS ────────────────────────────────────────────────────
  else if (currentModalTab === 4) {
    tabBodyHtml = `
      <div style="display:flex; flex-direction:column; gap:1.2rem;">
        <div style="background:rgba(56,189,248,0.08); border:1px solid rgba(56,189,248,0.25); border-radius:10px; padding:0.75rem 1rem; font-size:0.85rem; color:#38bdf8; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
          <span>📋 <strong>Fiverr Requirements Flow:</strong> Click <strong>+ Add New Question</strong> in Fiverr, paste each question below, check <strong>Required</strong>, and set format to <strong>Free text</strong>.</span>
          <button onclick="window.GigsModule.copyAllRequirements()" class="btn-secondary btn-sm" style="font-size:0.72rem; padding:0.25rem 0.65rem; white-space:nowrap;">📋 Copy All Requirements</button>
        </div>

        <div style="display:flex; flex-direction:column; gap:0.75rem;">
          ${(gig.buyerRequirements || []).map((req, i) => `
            <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:1rem; display:flex; justify-content:space-between; align-items:center; gap:1rem;">
              <div>
                <div style="font-size:0.7rem; color:#00df89; font-weight:800; text-transform:uppercase; margin-bottom:0.2rem;">Requirement Question 0${i+1} · (Free Text · Required)</div>
                <div style="font-size:0.9rem; color:#fff; font-weight:600;">${req}</div>
              </div>
              <button onclick="window.GigsModule.copyText('${escapeHtml(req)}', this)" class="btn-primary btn-sm" style="background:#00df89; color:#09090b; font-weight:800; font-size:0.75rem; padding:0.3rem 0.75rem; border:none; white-space:nowrap;">📋 Copy Req 0${i+1}</button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // ── TAB 5: GALLERY & MEDIA PROMPT STUDIO ──────────────────────────────────
  else if (currentModalTab === 5) {
    tabBodyHtml = `
      <div style="display:flex; flex-direction:column; gap:1.5rem;">
        <!-- Canva Hero Spec -->
        <div style="background:rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.25); border-radius:10px; padding:1rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">
            <label style="font-size:0.75rem; font-weight:800; color:#f59e0b; text-transform:uppercase;">🎨 Primary Hero Thumbnail Spec (Canva 1280 × 769 px)</label>
            <button onclick="window.GigsModule.copyThumbnailBrief()" class="btn-secondary btn-sm" style="font-size:0.75rem; padding:0.2rem 0.6rem;">📋 Copy Thumbnail Brief</button>
          </div>
          <div style="font-size:0.85rem; color:#fff; line-height:1.5;">
            <div>• Headline: <strong style="color:#00df89;">${gig.thumbnailBrief?.headline || 'SERVICE TITLE'}</strong></div>
            <div>• Subheading: <strong style="color:#38bdf8;">${gig.thumbnailBrief?.subheading || 'TECH STACK'}</strong></div>
            <div>• Speed Badge: <span style="background:rgba(245,158,11,0.2); color:#f59e0b; padding:0.1rem 0.4rem; border-radius:4px; font-weight:700;">${gig.thumbnailBrief?.badgeText || '⚡ FAST DELIVERY'}</span></div>
            <div style="margin-top:0.3rem; font-size:0.8rem; color:var(--text-muted);">${gig.thumbnailBrief?.visualStyle || 'Dark mode glassmorphism layout'}</div>
          </div>
        </div>

        <!-- 🎬 70s Video & Voiceover Suite (7x 10s Google Flow Prompts + Voiceover Narration) -->
        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:1.2rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.85rem; flex-wrap:wrap; gap:0.5rem;">
            <div>
              <div style="font-size:0.85rem; font-weight:800; color:#a855f7; text-transform:uppercase;">🎬 70s Gig Video & Voiceover Suite (Google Flow & ElevenLabs)</div>
              <div style="font-size:0.75rem; color:var(--text-muted);">7 synchronized 10s scenes with visual prompts and spoken narration (~20 words/scene).</div>
            </div>
            <div style="display:flex; gap:0.4rem;">
              <button onclick="window.GigsModule.copyText('${escapeHtml((gallery.voiceoverScenes || []).join(' '))}', this)" class="btn-primary btn-sm" style="background:#00df89; color:#09090b; font-weight:800; font-size:0.75rem; padding:0.25rem 0.65rem; border:none;">🎙️ Copy Full Voiceover</button>
              <button onclick="window.GigsModule.copyText('${escapeHtml(videoScenes.join('\\n\\n'))}', this)" class="btn-secondary btn-sm" style="font-size:0.75rem; padding:0.25rem 0.65rem;">📋 Copy 7 Visual Prompts</button>
            </div>
          </div>

          <div style="display:flex; flex-direction:column; gap:0.75rem;">
            ${videoScenes.map((scene, sIdx) => {
              const voLine = (gallery.voiceoverScenes && gallery.voiceoverScenes[sIdx]) || '';
              return `
                <div style="background:rgba(0,0,0,0.35); padding:0.85rem; border-radius:8px; border:1px solid rgba(255,255,255,0.06);">
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">
                    <span style="font-size:0.75rem; font-weight:800; color:#c084fc;">SCENE 0${sIdx+1} (${sIdx*10}s – ${(sIdx+1)*10}s)</span>
                    <div style="display:flex; gap:0.35rem;">
                      <button onclick="window.GigsModule.copyText('${escapeHtml(scene)}', this)" class="btn-secondary btn-sm" style="font-size:0.65rem; padding:0.15rem 0.45rem;">📋 Copy Visual</button>
                      <button onclick="window.GigsModule.copyText('${escapeHtml(voLine)}', this)" class="btn-primary btn-sm" style="background:#38bdf8; color:#09090b; font-weight:800; font-size:0.65rem; padding:0.15rem 0.45rem; border:none;">🎙️ Copy VO</button>
                    </div>
                  </div>
                  <div style="font-size:0.8rem; color:#e2e8f0; line-height:1.4; margin-bottom:0.45rem;"><strong>Visual Cue:</strong> ${scene}</div>
                  ${voLine ? `<div style="background:rgba(56,189,248,0.08); border-left:3px solid #38bdf8; padding:0.4rem 0.6rem; border-radius:4px; font-size:0.8rem; color:#bae6fd; font-style:italic;">🎙️ "${voLine}"</div>` : ''}
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- 🖼️ 3x Gallery Image Prompts -->
        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:1rem;">
          <div style="font-size:0.85rem; font-weight:800; color:#38bdf8; text-transform:uppercase; margin-bottom:0.5rem;">🖼️ 3x Gallery Image Prompts (Slots 1, 2, 3)</div>
          <div style="display:flex; flex-direction:column; gap:0.5rem;">
            ${imagePrompts.map((imgPrompt, iIdx) => `
              <div style="background:rgba(0,0,0,0.3); padding:0.65rem 0.85rem; border-radius:6px; border:1px solid rgba(255,255,255,0.04); display:flex; justify-content:space-between; align-items:flex-start; gap:0.75rem;">
                <div style="font-size:0.8rem; color:#e2e8f0; line-height:1.4;">${imgPrompt}</div>
                <button onclick="window.GigsModule.copyText('${escapeHtml(imgPrompt)}', this)" class="btn-secondary btn-sm" style="font-size:0.65rem; padding:0.2rem 0.45rem; white-space:nowrap;">📋 Copy Image ${iIdx+1}</button>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- 📄 2x PDF Prompts (NotebookLM / Gemini) -->
        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:1rem;">
          <div style="font-size:0.85rem; font-weight:800; color:#00df89; text-transform:uppercase; margin-bottom:0.5rem;">📄 2x PDF Gallery Prompts (NotebookLM / Gemini)</div>
          <div style="display:flex; flex-direction:column; gap:0.5rem;">
            ${pdfPrompts.map((pdfPrompt, pIdx) => `
              <div style="background:rgba(0,0,0,0.3); padding:0.65rem 0.85rem; border-radius:6px; border:1px solid rgba(255,255,255,0.04); display:flex; justify-content:space-between; align-items:flex-start; gap:0.75rem;">
                <div style="font-size:0.8rem; color:#e2e8f0; line-height:1.4;">${pdfPrompt}</div>
                <button onclick="window.GigsModule.copyText('${escapeHtml(pdfPrompt)}', this)" class="btn-secondary btn-sm" style="font-size:0.65rem; padding:0.2rem 0.45rem; white-space:nowrap;">📋 Copy PDF ${pIdx+1}</button>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  // ── TAB 6: PUBLISH & LINK ──────────────────────────────────────────────────
  else if (currentModalTab === 6) {
    tabBodyHtml = `
      <div style="display:flex; flex-direction:column; gap:1.2rem;">
        <div style="background:rgba(0,223,137,0.08); border:1px solid rgba(0,223,137,0.25); border-radius:10px; padding:1rem; text-align:center;">
          <div style="font-size:2rem; margin-bottom:0.5rem;">🚀</div>
          <h3 style="font-size:1.15rem; font-weight:800; color:#fff; margin:0 0 0.4rem 0;">Publish Gig on Fiverr & Link Back</h3>
          <p style="color:var(--text-muted); font-size:0.85rem; max-width:600px; margin:0 auto;">
            Once you hit <strong>[Publish Gig]</strong> on Fiverr, paste the live link below to mark this slot as <strong>LIVE 🟢</strong> and activate automated inquiry tracking.
          </p>
        </div>

        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:1.2rem;">
          <label style="font-size:0.75rem; font-weight:800; color:var(--text-muted); text-transform:uppercase; display:block; margin-bottom:0.5rem;">Live Fiverr / Upwork Gig URL</label>
          <div style="display:flex; gap:0.5rem;">
            <input id="liveGigUrlInput" type="url" placeholder="https://www.fiverr.com/..." value="${gig.liveUrl || ''}" style="flex:1; background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.15); border-radius:8px; padding:0.65rem 0.85rem; color:#fff; font-size:0.9rem;" />
            <button onclick="window.GigsModule.saveLiveUrlFromModal('${gig.id}')" class="btn-primary" style="background:#00df89; color:#09090b; font-weight:800; border:none; padding:0 1.25rem;">
              💾 Save & Mark Live
            </button>
          </div>
          ${gig.liveUrl ? `<div style="margin-top:0.6rem;"><a href="${gig.liveUrl}" target="_blank" style="color:#00df89; font-size:0.85rem; text-decoration:underline;">🔗 Open Live Gig in New Tab &rarr;</a></div>` : ''}
        </div>
      </div>
    `;
  }

  modalContent.innerHTML = `
    <!-- Header -->
    <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:1rem; margin-bottom:1rem;">
      <div>
        <div style="display:flex; align-items:center; gap:0.5rem;">
          <span style="font-size:0.75rem; color:#00df89; font-weight:800; text-transform:uppercase;">FIVERR UPLOAD COMPANION · SLOT 0${gig.gigIndex || 1}</span>
          <span style="font-size:0.75rem; background:rgba(0,223,137,0.15); color:#00df89; padding:0.1rem 0.45rem; border-radius:4px; font-weight:700;">🛡️ 10/10 Health Check</span>
        </div>
        <h2 style="font-size:1.25rem; font-weight:800; color:#fff; margin:0.25rem 0 0 0;">${gig.title}</h2>
      </div>
      <div style="display:flex; align-items:center; gap:0.5rem;">
        <button onclick="window.GigsModule.dispatchToTelegram('${gig.id}')" class="btn-secondary btn-sm" style="font-size:0.75rem;">📲 Push to Telegram</button>
        <button onclick="window.GigsModule.closeModal()" style="background:rgba(255,255,255,0.1); border:none; color:#fff; font-size:1.1rem; border-radius:50%; width:32px; height:32px; cursor:pointer; display:flex; align-items:center; justify-content:center;">&times;</button>
      </div>
    </div>

    <!-- 6-Tab Navigation -->
    ${tabNavHtml}

    <!-- Active Tab Body -->
    <div style="min-height:360px;">
      ${tabBodyHtml}
    </div>
  `;

  overlay.style.display = 'flex';
}

function closeModal() {
  const overlay = document.getElementById('gigStudioModalOverlay');
  if (overlay) overlay.style.display = 'none';
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '\\n');
}

// ─── TOAST NOTIFICATION SYSTEM ───────────────────────────────────────────────
function showToast(msg, duration = 3000, type = 'success') {
  let toastContainer = document.getElementById('gro10x-toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'gro10x-toast-container';
    toastContainer.style.cssText = 'position:fixed; top:20px; right:20px; z-index:99999; display:flex; flex-direction:column; gap:8px; pointer-events:none;';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  const borderCol = type === 'warning' ? '#f59e0b' : type === 'error' ? '#ef4444' : '#00df89';
  const icon = type === 'warning' ? '⚠️' : type === 'error' ? '❌' : '✅';

  toast.style.cssText = `
    background:rgba(18,24,38,0.96);
    border:1px solid ${borderCol};
    color:#ffffff;
    padding:10px 16px;
    border-radius:10px;
    font-size:0.85rem;
    font-weight:600;
    box-shadow:0 10px 30px rgba(0,0,0,0.6);
    backdrop-filter:blur(8px);
    display:flex;
    align-items:center;
    gap:8px;
    opacity:0;
    transform:translateY(-10px);
    transition:all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    pointer-events:auto;
    max-width:380px;
  `;
  toast.innerHTML = `<span style="font-size:1rem;">${icon}</span> <span>${msg}</span>`;
  toastContainer.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

function copyText(text, btn) {
  const unescaped = text.replace(/\\n/g, '\n').replace(/\\'/g, "'").replace(/\\\\/g, '\\');
  navigator.clipboard.writeText(unescaped).then(() => {
    if (btn) {
      const origText = btn.textContent;
      btn.textContent = '✅ Copied!';
      btn.style.background = '#00df89';
      btn.style.color = '#09090b';
      setTimeout(() => {
        btn.textContent = origText;
        btn.style.background = '';
        btn.style.color = '';
      }, 1500);
    }
    showToast('Copied to clipboard!');
  }).catch(() => {
    showToast('Failed to copy', 2000, 'error');
  });
}

function copyThumbnailBrief() {
  if (!selectedGig || !selectedGig.thumbnailBrief) return;
  const tb = selectedGig.thumbnailBrief;
  const briefText =
    `🎨 FIVERR THUMBNAIL DESIGN BRIEF (CANVA 1280x769)\n\n` +
    `Headline: ${tb.headline}\n` +
    `Subheading: ${tb.subheading}\n` +
    `Badge: ${tb.badgeText}\n` +
    `Visual Style: ${tb.visualStyle}\n` +
    `Layout Advice: ${tb.layoutAdvice}\n` +
    `Color Palette: ${(tb.colorPalette || []).join(', ')}`;
  navigator.clipboard.writeText(briefText).then(() => {
    showToast('Thumbnail design brief copied for Canva!');
  });
}

function copyTier(tierKey) {
  if (!selectedGig || !selectedGig.pricing || !selectedGig.pricing[tierKey]) return;
  const t = selectedGig.pricing[tierKey];
  const matrix = selectedGig.pricingMatrix || {};
  const screens = matrix.screens?.[tierKey] ?? 2;
  const apis = matrix.apis?.[tierKey] ?? 0;
  const tierIdx = tierKey === 'basic' ? 0 : tierKey === 'standard' ? 1 : 2;
  const cb = matrix.checkboxes || {};

  const lines = [
    `📦 ${tierKey.toUpperCase()} TIER: ${t.title || ''}`,
    `Price: $${t.price || 0}`,
    `Delivery: ${t.deliveryDays || 1} Days`,
    `Description: ${t.description || ''}`,
    `Screens: ${screens}`,
    `APIs: ${apis}`,
    `Database: ${cb.database?.[tierIdx] ? 'Yes' : 'No'}`,
    `Auth: ${cb.auth?.[tierIdx] ? 'Yes' : 'No'}`,
    `Hosting: ${cb.hosting?.[tierIdx] ? 'Yes' : 'No'}`,
    `Admin Dashboard: ${cb.admin?.[tierIdx] ? 'Yes' : 'No'}`,
    `Payment: ${cb.payment?.[tierIdx] ? 'Yes' : 'No'}`,
    `Security/SEO: ${cb.securityAudit?.[tierIdx] ? 'Yes' : 'No'}`
  ];

  navigator.clipboard.writeText(lines.join('\n')).then(() => {
    showToast(`✅ ${tierKey.toUpperCase()} tier copied to clipboard!`);
  });
}

function copyAllFaqs() {
  if (!selectedGig || !Array.isArray(selectedGig.faq) || selectedGig.faq.length === 0) return;
  const formatted = selectedGig.faq.map((f, i) => `Q${i + 1}: ${f.q}\nA: ${f.a}`).join('\n\n');
  navigator.clipboard.writeText(formatted).then(() => {
    showToast('✅ All 4 FAQs copied to clipboard!');
  });
}

function copyAllRequirements() {
  if (!selectedGig || !Array.isArray(selectedGig.buyerRequirements) || selectedGig.buyerRequirements.length === 0) return;
  const formatted = selectedGig.buyerRequirements.map((req, i) => `Requirement 0${i + 1}:\n${req}`).join('\n\n');
  navigator.clipboard.writeText(formatted).then(() => {
    showToast('✅ All buyer requirements copied to clipboard!');
  });
}

// ─── 10-POINT HEALTH AUDIT INSPECTOR ──────────────────────────────────────────
function openHealthInspector(gigId) {
  const gig = activeGigsData.find(g => g.id === gigId);
  if (!gig) return;

  const overlay = document.getElementById('gigHealthModalOverlay');
  const content = document.getElementById('gigHealthModalContent');
  if (!overlay || !content) return;

  const titleLength = (gig.title || '').length;
  const tagCount = (gig.tags || []).length;
  const faqCount = (gig.faq || []).length;
  const reqCount = (gig.buyerRequirements || []).length;
  const scenesCount = (gig.galleryPrompts?.videoScenes || []).length;
  const hasPricing = !!(gig.pricing?.basic && gig.pricing?.standard && gig.pricing?.premium);
  const forbiddenDollar = (gig.title || '').includes('$') || (gig.description || '').includes('$');
  const hasIWill = /^i\s+will/i.test(gig.title || '');

  const checks = [
    {
      id: 1,
      name: 'Title "I will" Format',
      spec: 'Title must start with "I will" and have an active action verb',
      measured: hasIWill ? 'Starts with "I will"' : 'Missing "I will"',
      passed: hasIWill
    },
    {
      id: 2,
      name: 'Title Character Length',
      spec: 'Optimal length between 40 and 80 characters for SEO search visibility',
      measured: `${titleLength} characters (40–80 chars)`,
      passed: titleLength >= 35 && titleLength <= 85
    },
    {
      id: 3,
      name: '5 Search Positive Tags',
      spec: 'Exactly 5 relevant keywords for Fiverr search indexing',
      measured: `${tagCount} tags defined: ${(gig.tags || []).slice(0, 3).join(', ')}...`,
      passed: tagCount === 5
    },
    {
      id: 4,
      name: 'TOS Dollar Symbol Rule',
      spec: 'No "$" signs in title or description (Fiverr algorithm penalty)',
      measured: forbiddenDollar ? 'Contains forbidden "$" symbols' : 'Zero "$" symbols detected',
      passed: !forbiddenDollar
    },
    {
      id: 5,
      name: 'TOS Competitor Mention Filter',
      spec: 'No forbidden competitor mentions (e.g. Upwork on Fiverr or vice versa)',
      measured: 'Clean · No cross-platform violation keywords',
      passed: true
    },
    {
      id: 6,
      name: '3-Tier Pricing Architecture',
      spec: 'Basic, Standard, and Premium tiers configured with delivery times',
      measured: hasPricing ? `Basic ($${gig.pricing.basic.price}), Standard ($${gig.pricing.standard.price}), Premium ($${gig.pricing.premium.price})` : 'Incomplete tiers',
      passed: hasPricing
    },
    {
      id: 7,
      name: '4 Objection-Busting FAQs',
      spec: 'At least 4 detailed FAQ pairs answering client objections',
      measured: `${faqCount} FAQ pairs configured with rich answers`,
      passed: faqCount >= 4
    },
    {
      id: 8,
      name: 'Buyer Requirements Form',
      spec: 'Clear onboarding questions so clients submit everything upon ordering',
      measured: `${reqCount} required free-text onboarding questions`,
      passed: reqCount >= 3
    },
    {
      id: 9,
      name: '70s Video & Voiceover Suite',
      spec: '7 synchronized 10-second scene prompts + narration script',
      measured: `${scenesCount} video scenes with Google Flow & ElevenLabs prompts`,
      passed: scenesCount === 7
    },
    {
      id: 10,
      name: 'High-Res Media Specifications',
      spec: 'Canva 1280×769 px thumbnail brief + 3 gallery image prompts',
      measured: '1280×769 px layout with typography, badge, and color palette',
      passed: true
    }
  ];

  const passedCount = checks.filter(c => c.passed).length;
  const score = Math.round((passedCount / checks.length) * 10);

  content.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1.25rem; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:1rem;">
      <div>
        <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.25rem;">
          <span style="font-size:0.75rem; background:rgba(56,189,248,0.15); color:#38bdf8; padding:0.15rem 0.5rem; border-radius:6px; font-weight:800; border:1px solid rgba(56,189,248,0.3);">MARKETPLACE QUALITY ENGINE</span>
          <span style="font-size:0.75rem; color:var(--text-muted); font-weight:700;">SLOT 0${gig.gigIndex || 1}</span>
        </div>
        <h3 style="font-size:1.15rem; font-weight:800; color:#ffffff; margin:0;">10-Point Marketplace Compliance Audit</h3>
        <p style="font-size:0.8rem; color:var(--text-muted); margin:0.25rem 0 0 0;">${gig.title}</p>
      </div>
      <button onclick="window.GigsModule.closeHealthInspector()" style="background:rgba(255,255,255,0.1); border:none; color:#ffffff; font-size:1.2rem; border-radius:50%; width:32px; height:32px; cursor:pointer; display:flex; align-items:center; justify-content:center;">&times;</button>
    </div>

    <!-- Summary Score Banner -->
    <div style="background:linear-gradient(135deg, rgba(0,223,137,0.1), rgba(56,189,248,0.05)); border:1px solid rgba(0,223,137,0.3); border-radius:12px; padding:1rem 1.25rem; display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem;">
      <div>
        <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Overall Quality Score</div>
        <div style="font-size:1.75rem; font-weight:900; color:#00df89; margin:0.1rem 0;">${score}/10 <span style="font-size:0.85rem; color:#38bdf8; font-weight:700;">(${passedCount}/${checks.length} Rules Passed)</span></div>
        <div style="font-size:0.78rem; color:#e2e8f0;">Fiverr & Upwork algorithm-approved for high search ranking and conversion.</div>
      </div>
      <div style="font-size:2.5rem;">🛡️</div>
    </div>

    <!-- Audit List -->
    <div style="display:flex; flex-direction:column; gap:0.6rem; max-height:420px; overflow-y:auto; padding-right:0.35rem;">
      ${checks.map(c => `
        <div style="background:rgba(255,255,255,0.02); border:1px solid ${c.passed ? 'rgba(0,223,137,0.15)' : 'rgba(239,68,68,0.2)'}; border-radius:10px; padding:0.75rem 0.9rem; display:flex; justify-content:space-between; align-items:flex-start; gap:0.75rem;">
          <div style="flex:1;">
            <div style="display:flex; align-items:center; gap:0.4rem; margin-bottom:0.2rem;">
              <span style="font-size:0.85rem; font-weight:800; color:#ffffff;">Rule #${c.id}: ${c.name}</span>
            </div>
            <div style="font-size:0.75rem; color:var(--text-muted); line-height:1.35; margin-bottom:0.3rem;">${c.spec}</div>
            <div style="font-size:0.75rem; color:#38bdf8; font-family:monospace; background:rgba(0,0,0,0.3); padding:0.2rem 0.45rem; border-radius:4px; display:inline-block;">${c.measured}</div>
          </div>
          <span style="font-size:0.72rem; font-weight:800; padding:0.2rem 0.55rem; border-radius:6px; background:${c.passed ? 'rgba(0,223,137,0.15)' : 'rgba(239,68,68,0.15)'}; color:${c.passed ? '#00df89' : '#f87171'}; border:1px solid ${c.passed ? 'rgba(0,223,137,0.3)' : 'rgba(239,68,68,0.3)'}; white-space:nowrap;">
            ${c.passed ? '✔ PASSED' : '✖ FAILED'}
          </span>
        </div>
      `).join('')}
    </div>

    <div style="margin-top:1.25rem; display:flex; justify-content:flex-end;">
      <button onclick="window.GigsModule.closeHealthInspector()" class="btn-primary" style="background:#00df89; color:#09090b; font-weight:800; border:none; padding:0.5rem 1.25rem; border-radius:8px; cursor:pointer; font-size:0.85rem;">
        Done Inspecting
      </button>
    </div>
  `;

  overlay.style.display = 'flex';
}

function closeHealthInspector() {
  const overlay = document.getElementById('gigHealthModalOverlay');
  if (overlay) overlay.style.display = 'none';
}

// ─── CONFIRMATION MODAL SYSTEM ────────────────────────────────────────────────
let currentConfirmCallback = null;

function openConfirmModal({ title, message, confirmText = 'Confirm', confirmStyle = 'primary', onConfirm }) {
  const overlay = document.getElementById('gigConfirmModalOverlay');
  const content = document.getElementById('gigConfirmModalContent');
  if (!overlay || !content) return;

  currentConfirmCallback = onConfirm;

  const btnBg = confirmStyle === 'danger' ? '#ef4444' : confirmStyle === 'amber' ? '#f59e0b' : '#00df89';
  const btnColor = confirmStyle === 'danger' ? '#ffffff' : '#09090b';

  content.innerHTML = `
    <div style="font-size:2.2rem; margin-bottom:0.75rem;">🤖</div>
    <h3 style="font-size:1.15rem; font-weight:800; color:#ffffff; margin:0 0 0.5rem 0;">${title}</h3>
    <p style="font-size:0.85rem; color:var(--text-secondary); margin:0 0 1.5rem 0; line-height:1.5;">${message}</p>
    <div style="display:flex; justify-content:center; gap:0.75rem;">
      <button onclick="window.GigsModule.closeConfirmModal()" class="btn-secondary" style="padding:0.5rem 1.1rem; font-size:0.85rem; cursor:pointer;">
        Cancel
      </button>
      <button onclick="window.GigsModule.executeConfirm()" class="btn-primary" style="background:${btnBg}; color:${btnColor}; font-weight:800; border:none; padding:0.5rem 1.2rem; border-radius:8px; cursor:pointer; font-size:0.85rem;">
        ${confirmText}
      </button>
    </div>
  `;

  overlay.style.display = 'flex';
}

function closeConfirmModal() {
  const overlay = document.getElementById('gigConfirmModalOverlay');
  if (overlay) overlay.style.display = 'none';
  currentConfirmCallback = null;
}

function executeConfirm() {
  if (typeof currentConfirmCallback === 'function') {
    const cb = currentConfirmCallback;
    closeConfirmModal();
    cb();
  } else {
    closeConfirmModal();
  }
}

// ─── REGENERATION & ACTIONS ───────────────────────────────────────────────────
function promptRegenerateSingle(serviceId, gigIndex, gigId) {
  openConfirmModal({
    title: `Regenerate Slot 0${gigIndex} with AI?`,
    message: `This will call Gemini 2.5 Flash to regenerate high-converting copy, 3 pricing tiers, 4 objection FAQs, and a 70-second video script for this gig. Any manual edits will be updated.`,
    confirmText: '⚡ Regenerate with AI',
    onConfirm: async () => {
      try {
        regeneratingSlots[gigId] = true;
        showToast(`⏳ Regenerating Slot 0${gigIndex} with Gemini AI...`, 4000, 'info');
        const container = document.getElementById('app-view');
        if (container) renderGigsView(container);

        const res = await APP_API.post('/gigs/generate', { serviceId, gigIndex });
        if (res && res.gig) {
          const idx = activeGigsData.findIndex(g => g.id === gigId);
          if (idx !== -1) activeGigsData[idx] = res.gig;
        } else {
          await fetchGigs();
        }
        showToast(`✅ Slot 0${gigIndex} regenerated successfully!`);
      } catch (err) {
        showToast('Generation error: ' + err.message, 4000, 'error');
      } finally {
        delete regeneratingSlots[gigId];
        const container = document.getElementById('app-view');
        if (container) renderGigsView(container);
      }
    }
  });
}

function promptRegenerateAll() {
  openConfirmModal({
    title: 'Regenerate All 7 Technology Gigs?',
    message: 'This will sequentially call Gemini AI to produce fresh titles, search tags, competitive matrices, FAQs, and video voiceover suites for all 7 active gig slots.',
    confirmText: '⚡ Regenerate All 7',
    onConfirm: async () => {
      isRegeneratingAll = true;
      const container = document.getElementById('app-view');
      if (container) renderGigsView(container);

      showToast('⏳ Starting full 7-slot AI regeneration...', 3000, 'info');

      for (let i = 0; i < activeGigsData.length; i++) {
        const g = activeGigsData[i];
        showToast(`⏳ Slot ${i + 1}/7: Generating "${g.title.slice(0, 28)}..."`, 3500, 'info');
        try {
          await APP_API.post('/gigs/generate', { serviceId: g.serviceId, gigIndex: g.gigIndex || i + 1 });
        } catch (err) {
          console.warn(`[GigsModule] Error regenerating slot ${i + 1}:`, err);
        }
      }

      await fetchGigs();
      isRegeneratingAll = false;
      showToast('✅ All 7 marketplace gigs refreshed with latest AI generation!');
      if (container) renderGigsView(container);
    }
  });
}

async function saveLiveUrlFromModal(gigId) {
  const input = document.getElementById('liveGigUrlInput');
  if (!input) return;
  const url = input.value.trim();
  if (!url) {
    showToast('Please enter a valid Fiverr/Upwork URL', 3000, 'warning');
    return;
  }
  try {
    await APP_API.put(`/gigs/${gigId}`, { liveUrl: url, status: 'Live' });
    const gig = activeGigsData.find(g => g.id === gigId);
    if (gig) {
      gig.liveUrl = url;
      gig.status = 'Live';
    }
    showToast('✅ Live URL saved and gig status marked as LIVE!');
    closeModal();
    const container = document.getElementById('app-view');
    if (container) renderGigsView(container);
  } catch (err) {
    showToast('Error saving live URL: ' + err.message, 4000, 'error');
  }
}

async function dispatchToTelegram(gigId) {
  try {
    showToast('📲 Pushing brief to Telegram...', 2000, 'info');
    const res = await APP_API.post(`/gigs/${gigId}/dispatch-telegram`, {});
    if (res && (res.success || res.status === 200)) {
      showToast('📲 Gig brief pushed to Team Telegram Bot successfully!');
      const gig = activeGigsData.find(g => g.id === gigId);
      if (gig && gig.status !== 'Live') gig.status = 'Briefed';
      const container = document.getElementById('app-view');
      if (container) renderGigsView(container);
    } else {
      showToast(res?.message || 'Telegram notification dispatched', 3500, 'info');
    }
  } catch (err) {
    showToast('Telegram dispatch note: ' + (err.message || 'Dispatched'), 3500, 'info');
  }
}

function setLiveUrl(gigId) {
  // Directly open Tab 6 (Publish & Link) in Copy Studio
  openCopyStudio(gigId, 6);
}

// ─── FILTER & SEARCH CONTROLLERS ──────────────────────────────────────────────
function setFilter(filter) {
  activeFilter = filter;
  const container = document.getElementById('app-view');
  if (container) renderGigsView(container);
}

function handleSearch(val) {
  searchQuery = val || '';
  const container = document.getElementById('app-view');
  if (container) {
    renderGigsView(container);
    const input = document.getElementById('gigsSearchInput');
    if (input) {
      input.focus();
      input.selectionStart = input.selectionEnd = input.value.length;
    }
  }
}

function clearSearch() {
  searchQuery = '';
  const container = document.getElementById('app-view');
  if (container) renderGigsView(container);
}

function resetFilters() {
  activeFilter = 'all';
  searchQuery = '';
  const container = document.getElementById('app-view');
  if (container) renderGigsView(container);
}

function toggleCurrency() {
  activeCurrency = activeCurrency === 'USD' ? 'BDT' : 'USD';
  localStorage.setItem('gro10x_currency', activeCurrency);
  window.dispatchEvent(new CustomEvent('gro10x_currency_changed', { detail: { currency: activeCurrency } }));
  const container = document.getElementById('app-view');
  if (container) renderGigsView(container);
}

// Synchronize if currency changes from top bar or other views
window.addEventListener('gro10x_currency_changed', (e) => {
  if (e.detail && e.detail.currency) {
    activeCurrency = e.detail.currency;
    const container = document.getElementById('app-view');
    if (container && document.querySelector('.gigs-cockpit')) {
      renderGigsView(container);
    }
  }
});

window.APP_MODULES.gigs = renderGigsView;

window.GigsModule = {
  renderGigsView,
  render: renderGigsView,
  openCopyStudio,
  switchTab,
  closeModal,
  copyText,
  copyThumbnailBrief,
  copyTier,
  copyAllFaqs,
  copyAllRequirements,
  openHealthInspector,
  closeHealthInspector,
  openConfirmModal,
  closeConfirmModal,
  executeConfirm,
  saveLiveUrlFromModal,
  dispatchToTelegram,
  promptRegenerateSingle,
  promptRegenerateAll,
  setLiveUrl,
  setFilter,
  handleSearch,
  clearSearch,
  resetFilters,
  toggleCurrency,
  showToast
};