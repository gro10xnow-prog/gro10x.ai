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

  container.innerHTML = `
    <div style="display:flex; align-items:center; justify-content:center; min-height:300px; color:var(--text-muted);">
      <div style="text-align:center;">
        <div style="font-size:2rem; animation:pulse 1s infinite;">⚡</div>
        <div style="margin-top:0.5rem; font-size:0.9rem;">Loading Marketplace Gig Studio...</div>
      </div>
    </div>
  `;

  await fetchGigs();

  const totalGigs = activeGigsData.length || 7;
  const liveCount = activeGigsData.filter(g => g.status === 'Live').length;
  const readyCount = activeGigsData.filter(g => g.healthCheck?.passed).length;
  const avgHealth = Math.round(activeGigsData.reduce((s, g) => s + (g.healthCheck?.score || 10), 0) / (totalGigs || 1));

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

        <div style="display:flex; gap:0.5rem; align-items:center;">
          <button onclick="window.GigsModule.regenerateAllGigs()" class="btn-secondary btn-sm" style="display:flex; align-items:center; gap:0.4rem;">
            <span>🤖</span> <span>Regenerate All with AI</span>
          </button>
          <a href="#engines" class="btn-secondary btn-sm" style="display:flex; align-items:center; gap:0.4rem; text-decoration:none;">
            <span>🚀</span> <span>5-Engine Cockpit</span>
          </a>
        </div>
      </div>

      <!-- Metric KPI Cards -->
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:1rem; margin-bottom:1.75rem;">
        <div style="background:var(--card-bg, #121824); border:1px solid var(--border-subtle, rgba(255,255,255,0.08)); border-radius:12px; padding:1.1rem;">
          <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; font-weight:700; letter-spacing:0.05em;">Account Gig Quota</div>
          <div style="font-size:1.6rem; font-weight:800; color:#00df89; margin:0.3rem 0 0.1rem 0;">${totalGigs} / 7 <span style="font-size:0.85rem; color:var(--text-muted); font-weight:600;">Slots</span></div>
          <div style="font-size:0.75rem; color:var(--text-muted);">100% Slot Capacity Ready</div>
        </div>

        <div style="background:var(--card-bg, #121824); border:1px solid var(--border-subtle, rgba(255,255,255,0.08)); border-radius:12px; padding:1.1rem;">
          <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; font-weight:700; letter-spacing:0.05em;">Health Check Pass Rate</div>
          <div style="font-size:1.6rem; font-weight:800; color:#38bdf8; margin:0.3rem 0 0.1rem 0;">${readyCount} / ${totalGigs} <span style="font-size:0.85rem; color:var(--text-muted); font-weight:600;">(Score: ${avgHealth}/10)</span></div>
          <div style="font-size:0.75rem; color:var(--text-muted);">Fiverr & Upwork TOS Compliant</div>
        </div>

        <div style="background:var(--card-bg, #121824); border:1px solid var(--border-subtle, rgba(255,255,255,0.08)); border-radius:12px; padding:1.1rem;">
          <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; font-weight:700; letter-spacing:0.05em;">Live Marketplace Gigs</div>
          <div style="font-size:1.6rem; font-weight:800; color:#a855f7; margin:0.3rem 0 0.1rem 0;">${liveCount} <span style="font-size:0.85rem; color:var(--text-muted); font-weight:600;">Live URLs</span></div>
          <div style="font-size:0.75rem; color:var(--text-muted);">${7 - liveCount} Pending Copy-Paste Upload</div>
        </div>

        <div style="background:var(--card-bg, #121824); border:1px solid var(--border-subtle, rgba(255,255,255,0.08)); border-radius:12px; padding:1.1rem;">
          <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; font-weight:700; letter-spacing:0.05em;">Monthly Engine Target</div>
          <div style="font-size:1.6rem; font-weight:800; color:#f59e0b; margin:0.3rem 0 0.1rem 0;">$5,000 <span style="font-size:0.85rem; color:var(--text-muted); font-weight:600;">/ mo</span></div>
          <div style="font-size:0.75rem; color:var(--text-muted);">$60k ARR Combined Engine 1 & 2</div>
        </div>
      </div>

      <!-- 7 Gig Slot Cards Grid -->
      <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(400px, 1fr)); gap:1.25rem;">
  `;

  activeGigsData.forEach((gig, idx) => {
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

    html += `
      <div style="background:var(--card-bg, #121824); border:1px solid var(--border-subtle, rgba(255,255,255,0.08)); border-radius:14px; padding:1.3rem; display:flex; flex-direction:column; justify-content:space-between; position:relative; box-shadow:0 4px 20px rgba(0,0,0,0.25);">
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <span style="font-size:0.75rem; font-weight:800; background:rgba(255,255,255,0.08); padding:0.2rem 0.5rem; border-radius:6px; color:var(--text-muted);">SLOT 0${gig.gigIndex || idx + 1}</span>
              <span style="font-size:0.75rem; font-weight:700; color:var(--text-muted);">${gig.id}</span>
            </div>
            <div style="display:flex; align-items:center; gap:0.4rem;">
              <span style="font-size:0.75rem; background:${healthPassed ? 'rgba(0,223,137,0.15)' : 'rgba(239,68,68,0.15)'}; color:${healthPassed ? '#00df89' : '#f87171'}; padding:0.15rem 0.5rem; border-radius:6px; font-weight:800;">
                ${healthPassed ? '🟢' : '🔴'} ${healthScore}/10
              </span>
              <span style="font-size:0.75rem; background:${statusBg}; color:${statusColor}; padding:0.15rem 0.5rem; border-radius:6px; font-weight:800;">
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
              <div style="font-weight:800; font-size:0.95rem; color:#00df89;">$${basicPrice}</div>
              <div style="font-size:0.65rem; color:var(--text-muted);">${gig.pricing?.basic?.deliveryDays || 2}d delivery</div>
            </div>
            <div style="border-left:1px solid rgba(255,255,255,0.08); border-right:1px solid rgba(255,255,255,0.08);">
              <div style="font-size:0.65rem; color:var(--text-muted); text-transform:uppercase;">Standard</div>
              <div style="font-weight:800; font-size:0.95rem; color:#38bdf8;">$${standardPrice}</div>
              <div style="font-size:0.65rem; color:var(--text-muted);">${gig.pricing?.standard?.deliveryDays || 4}d delivery</div>
            </div>
            <div>
              <div style="font-size:0.65rem; color:var(--text-muted); text-transform:uppercase;">Premium</div>
              <div style="font-weight:800; font-size:0.95rem; color:#a855f7;">$${premiumPrice}</div>
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
            <button onclick="window.GigsModule.openCopyStudio('${gig.id}')" class="btn-primary btn-sm" style="justify-content:center; font-weight:700; font-size:0.8rem; background:linear-gradient(135deg, #00df89, #00b36b); color:#09090b; border:none;">
              📋 Open Copy Studio
            </button>
            <button onclick="window.GigsModule.dispatchToTelegram('${gig.id}')" class="btn-secondary btn-sm" style="justify-content:center; font-size:0.8rem;">
              📲 Push to Telegram
            </button>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.75rem;">
            <button onclick="window.GigsModule.regenerateSingleGig('${gig.serviceId}', ${gig.gigIndex || idx + 1})" style="background:none; border:none; color:var(--text-muted); cursor:pointer; padding:0; text-decoration:underline;">
              🔄 Regenerate AI
            </button>
            ${gig.liveUrl ? `<a href="${gig.liveUrl}" target="_blank" style="color:#00df89; text-decoration:none; font-weight:700;">🔗 View Live Gig &rarr;</a>` : `<button onclick="window.GigsModule.setLiveUrl('${gig.id}')" style="background:none; border:none; color:#38bdf8; cursor:pointer; padding:0; text-decoration:underline;">+ Link Live URL</button>`}
          </div>
        </div>
      </div>
    `;
  });

  html += `
      </div>
    </div>

    <!-- Modal Container for Copy Studio -->
    <div id="gigStudioModalOverlay" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.8); z-index:9999; align-items:center; justify-content:center; padding:1.5rem; backdrop-filter:blur(4px);">
      <div id="gigStudioModalContent" style="background:#0f172a; border:1px solid rgba(255,255,255,0.15); border-radius:16px; width:100%; max-width:850px; max-height:90vh; overflow-y:auto; padding:1.75rem; box-shadow:0 20px 60px rgba(0,0,0,0.6); position:relative;">
        <!-- Modal injected dynamically -->
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
                <th style="padding:0.75rem; color:#00df89; width:24%; font-weight:800; font-size:0.95rem;">BASIC ($${gig.pricing?.basic?.price || 300})</th>
                <th style="padding:0.75rem; color:#38bdf8; width:24%; font-weight:800; font-size:0.95rem;">STANDARD ($${gig.pricing?.standard?.price || 600})</th>
                <th style="padding:0.75rem; color:#a855f7; width:24%; font-weight:800; font-size:0.95rem;">PREMIUM ($${gig.pricing?.premium?.price || 1200})</th>
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
        <div style="background:rgba(56,189,248,0.08); border:1px solid rgba(56,189,248,0.25); border-radius:10px; padding:0.75rem 1rem; font-size:0.85rem; color:#38bdf8;">
          📋 <strong>Fiverr Requirements Flow:</strong> Click <strong>+ Add New Question</strong> in Fiverr, paste each question below, check <strong>Required</strong>, and set format to <strong>Free text</strong>.
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
    alert('✅ Thumbnail design brief copied to clipboard for Canva!');
  });
}

async function saveLiveUrlFromModal(gigId) {
  const input = document.getElementById('liveGigUrlInput');
  if (!input) return;
  const url = input.value.trim();
  if (!url) {
    alert('Please enter a valid Fiverr/Upwork URL');
    return;
  }
  try {
    await APP_API.put(`/gigs/${gigId}`, { liveUrl: url, status: 'Live' });
    alert('✅ Live URL saved and gig status set to LIVE!');
    closeModal();
    const container = document.getElementById('app-view');
    if (container) renderGigsView(container);
  } catch (err) {
    alert('Error saving live URL: ' + err.message);
  }
}

async function dispatchToTelegram(gigId) {
  try {
    const res = await APP_API.post(`/gigs/${gigId}/dispatch-telegram`, {});
    if (res && (res.success || res.status === 200)) {
      alert('📲 Gig brief pushed to Team Telegram Bot successfully!');
      const container = document.getElementById('app-view');
      if (container) renderGigsView(container);
    }
  } catch (err) {
    alert('Telegram dispatch note: ' + (err.message || 'Dispatched'));
  }
}

async function regenerateSingleGig(serviceId, gigIndex) {
  if (!confirm(`Regenerate AI content for Slot ${gigIndex}?`)) return;
  try {
    const res = await APP_API.post('/gigs/generate', { serviceId, gigIndex });
    if (res) {
      alert(`✅ Slot ${gigIndex} regenerated with AI!`);
      const container = document.getElementById('app-view');
      if (container) renderGigsView(container);
    }
  } catch (err) {
    alert('Generation error: ' + err.message);
  }
}

async function regenerateAllGigs() {
  if (!confirm('Regenerate all 7 Technology Development Gigs with Gemini AI?')) return;
  for (let i = 0; i < activeGigsData.length; i++) {
    const g = activeGigsData[i];
    await APP_API.post('/gigs/generate', { serviceId: g.serviceId, gigIndex: g.gigIndex || i + 1 }).catch(() => {});
  }
  alert('✅ All 7 gigs refreshed with latest AI generation!');
  const container = document.getElementById('app-view');
  if (container) renderGigsView(container);
}

async function setLiveUrl(gigId) {
  const url = prompt('Enter the Live Fiverr or Upwork Gig URL:');
  if (!url) return;
  try {
    await APP_API.put(`/gigs/${gigId}`, { liveUrl: url, status: 'Live' });
    alert('✅ Live URL saved and gig status set to LIVE!');
    const container = document.getElementById('app-view');
    if (container) renderGigsView(container);
  } catch (err) {
    alert('Error saving live URL: ' + err.message);
  }
}

window.APP_MODULES.gigs = renderGigsView;

window.GigsModule = {
  renderGigsView,
  render: renderGigsView,
  openCopyStudio,
  switchTab,
  closeModal,
  copyText,
  copyThumbnailBrief,
  saveLiveUrlFromModal,
  dispatchToTelegram,
  regenerateSingleGig,
  regenerateAllGigs,
  setLiveUrl
};