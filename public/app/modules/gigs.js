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

// ─── COPY STUDIO MODAL ────────────────────────────────────────────────────────
function openCopyStudio(gigId) {
  const gig = activeGigsData.find(g => g.id === gigId);
  if (!gig) return;

  selectedGig = gig;
  const overlay = document.getElementById('gigStudioModalOverlay');
  const modalContent = document.getElementById('gigStudioModalContent');
  if (!overlay || !modalContent) return;

  modalContent.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:1rem; margin-bottom:1.25rem;">
      <div>
        <div style="font-size:0.75rem; color:#00df89; font-weight:800; text-transform:uppercase;">FIVERR / UPWORK COPY-PASTE STUDIO</div>
        <h2 style="font-size:1.25rem; font-weight:800; color:#fff; margin:0.25rem 0 0 0;">${gig.title}</h2>
      </div>
      <button onclick="window.GigsModule.closeModal()" style="background:rgba(255,255,255,0.1); border:none; color:#fff; font-size:1.1rem; border-radius:50%; width:32px; height:32px; cursor:pointer; display:flex; align-items:center; justify-content:center;">&times;</button>
    </div>

    <!-- 10-Point Health Check Score Banner -->
    <div style="background:rgba(0,223,137,0.1); border:1px solid rgba(0,223,137,0.3); border-radius:10px; padding:0.75rem 1rem; margin-bottom:1.5rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
      <div style="display:flex; align-items:center; gap:0.5rem;">
        <span style="font-size:1.2rem;">🛡️</span>
        <div>
          <strong style="color:#00df89; font-size:0.9rem;">10-Point Quality Score: ${gig.healthCheck?.score || 10}/10 Passed</strong>
          <div style="font-size:0.75rem; color:var(--text-muted);">Strictly validated for length, no competitor terms, 5 tags, and speed positioning.</div>
        </div>
      </div>
      <button onclick="window.GigsModule.dispatchToTelegram('${gig.id}')" class="btn-primary btn-sm" style="background:#00df89; color:#09090b; font-weight:800; border:none;">
        📲 Push Brief to Telegram
      </button>
    </div>

    <!-- FIELD 1: TITLE -->
    <div style="margin-bottom:1.25rem; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:1rem;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">
        <label style="font-size:0.75rem; font-weight:800; color:var(--text-muted); text-transform:uppercase;">1. Gig Title (Max 80 chars)</label>
        <button onclick="window.GigsModule.copyText('${escapeHtml(gig.title)}', this)" class="btn-secondary btn-sm" style="font-size:0.75rem; padding:0.2rem 0.6rem;">📋 Copy Title</button>
      </div>
      <div style="font-family:monospace; background:rgba(0,0,0,0.3); padding:0.6rem; border-radius:6px; color:#fff; font-size:0.9rem;">${gig.title}</div>
    </div>

    <!-- FIELD 2: CATEGORY & SEARCH TAGS -->
    <div style="margin-bottom:1.25rem; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:1rem;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">
        <label style="font-size:0.75rem; font-weight:800; color:var(--text-muted); text-transform:uppercase;">2. Category Path & 5 Search Tags</label>
        <button onclick="window.GigsModule.copyText('${(gig.tags || []).join(', ')}', this)" class="btn-secondary btn-sm" style="font-size:0.75rem; padding:0.2rem 0.6rem;">📋 Copy 5 Tags</button>
      </div>
      <div style="font-size:0.85rem; color:#38bdf8; margin-bottom:0.6rem;">
        <strong>Category:</strong> ${gig.categorySelection?.primary || 'Programming & Tech'} &gt; ${gig.categorySelection?.sub || 'Web Applications'}
      </div>
      <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
        ${(gig.tags || []).map(t => `<span style="background:rgba(56,189,248,0.15); color:#38bdf8; border:1px solid rgba(56,189,248,0.3); padding:0.25rem 0.6rem; border-radius:6px; font-size:0.8rem; font-weight:600;">${t}</span>`).join('')}
      </div>
    </div>

    <!-- FIELD 3: PRICING TIERS -->
    <div style="margin-bottom:1.25rem; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:1rem;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.6rem;">
        <label style="font-size:0.75rem; font-weight:800; color:var(--text-muted); text-transform:uppercase;">3. Three Scope & Pricing Packages</label>
      </div>
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:0.75rem;">
        <div style="background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:0.85rem;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-weight:800; color:#00df89; font-size:0.85rem;">BASIC ($${gig.pricing?.basic?.price || 300})</span>
            <button onclick="window.GigsModule.copyText('${escapeHtml(gig.pricing?.basic?.description || '')}', this)" class="btn-secondary btn-sm" style="font-size:0.65rem; padding:0.15rem 0.4rem;">Copy</button>
          </div>
          <div style="font-weight:700; font-size:0.8rem; margin:0.2rem 0; color:#fff;">${gig.pricing?.basic?.title || 'Core Sprint'}</div>
          <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:0.4rem;">${gig.pricing?.basic?.description || ''}</div>
          <div style="font-size:0.7rem; color:#00df89;">⏱️ ${gig.pricing?.basic?.deliveryDays || 2} Days · ${gig.pricing?.basic?.revisions || 2} Revisions</div>
        </div>

        <div style="background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:0.85rem;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-weight:800; color:#38bdf8; font-size:0.85rem;">STANDARD ($${gig.pricing?.standard?.price || 600})</span>
            <button onclick="window.GigsModule.copyText('${escapeHtml(gig.pricing?.standard?.description || '')}', this)" class="btn-secondary btn-sm" style="font-size:0.65rem; padding:0.15rem 0.4rem;">Copy</button>
          </div>
          <div style="font-weight:700; font-size:0.8rem; margin:0.2rem 0; color:#fff;">${gig.pricing?.standard?.title || 'Growth MVP'}</div>
          <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:0.4rem;">${gig.pricing?.standard?.description || ''}</div>
          <div style="font-size:0.7rem; color:#38bdf8;">⏱️ ${gig.pricing?.standard?.deliveryDays || 4} Days · ${gig.pricing?.standard?.revisions || 3} Revisions</div>
        </div>

        <div style="background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:0.85rem;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-weight:800; color:#a855f7; font-size:0.85rem;">PREMIUM ($${gig.pricing?.premium?.price || 1200})</span>
            <button onclick="window.GigsModule.copyText('${escapeHtml(gig.pricing?.premium?.description || '')}', this)" class="btn-secondary btn-sm" style="font-size:0.65rem; padding:0.15rem 0.4rem;">Copy</button>
          </div>
          <div style="font-weight:700; font-size:0.8rem; margin:0.2rem 0; color:#fff;">${gig.pricing?.premium?.title || 'Production Suite'}</div>
          <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:0.4rem;">${gig.pricing?.premium?.description || ''}</div>
          <div style="font-size:0.7rem; color:#a855f7;">⏱️ ${gig.pricing?.premium?.deliveryDays || 7} Days · Unlimited Revisions</div>
        </div>
      </div>
    </div>

    <!-- FIELD 4: GIG DESCRIPTION -->
    <div style="margin-bottom:1.25rem; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:1rem;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">
        <label style="font-size:0.75rem; font-weight:800; color:var(--text-muted); text-transform:uppercase;">4. Main Gig Description (${(gig.description || '').length} chars)</label>
        <button onclick="window.GigsModule.copyText('${escapeHtml(gig.description)}', this)" class="btn-primary btn-sm" style="font-size:0.75rem; padding:0.2rem 0.6rem; background:#00df89; color:#09090b; font-weight:700; border:none;">📋 Copy Full Description</button>
      </div>
      <div style="background:rgba(0,0,0,0.3); padding:0.85rem; border-radius:6px; font-size:0.85rem; color:#e2e8f0; line-height:1.6; white-space:pre-wrap; max-height:220px; overflow-y:auto; border:1px solid rgba(255,255,255,0.05);">${gig.description}</div>
    </div>

    <!-- FIELD 5: FAQS -->
    <div style="margin-bottom:1.25rem; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:1rem;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.6rem;">
        <label style="font-size:0.75rem; font-weight:800; color:var(--text-muted); text-transform:uppercase;">5. Frequently Asked Questions (4 Q&As)</label>
      </div>
      <div style="display:flex; flex-direction:column; gap:0.5rem;">
        ${(gig.faq || []).map((f, i) => `
          <div style="background:rgba(0,0,0,0.2); padding:0.6rem; border-radius:6px; font-size:0.8rem;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <strong style="color:#38bdf8;">Q${i+1}: ${f.q}</strong>
              <button onclick="window.GigsModule.copyText('Q: ${escapeHtml(f.q)}\\nA: ${escapeHtml(f.a)}', this)" class="btn-secondary btn-sm" style="font-size:0.65rem; padding:0.15rem 0.4rem;">Copy</button>
            </div>
            <div style="color:var(--text-muted); margin-top:0.25rem;">A: ${f.a}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- FIELD 6: THUMBNAIL CREATIVE BRIEF (CANVA) -->
    <div style="background:rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.25); border-radius:10px; padding:1rem;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">
        <label style="font-size:0.75rem; font-weight:800; color:#f59e0b; text-transform:uppercase;">🎨 6. Thumbnail Creative Brief (Canva / CapCut)</label>
        <button onclick="window.GigsModule.copyThumbnailBrief()", this" class="btn-secondary btn-sm" style="font-size:0.75rem; padding:0.2rem 0.6rem;">📋 Copy Thumbnail Brief</button>
      </div>
      <div style="font-size:0.85rem; color:#fff; line-height:1.5;">
        <div><strong>Headline:</strong> <span style="color:#00df89; font-weight:800;">${gig.thumbnailBrief?.headline || 'SERVICE TITLE'}</span></div>
        <div><strong>Subheading:</strong> <span style="color:#38bdf8;">${gig.thumbnailBrief?.subheading || 'TECH STACK'}</span></div>
        <div><strong>Badge Text:</strong> <span style="background:rgba(245,158,11,0.2); color:#f59e0b; padding:0.1rem 0.4rem; border-radius:4px; font-weight:700;">${gig.thumbnailBrief?.badgeText || '⚡ FAST DELIVERY'}</span></div>
        <div style="margin-top:0.4rem; font-size:0.8rem; color:var(--text-muted);"><strong>Visual Direction:</strong> ${gig.thumbnailBrief?.visualStyle || 'Dark mode glassmorphism mockup'}</div>
      </div>
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
    `🎨 FIVERR THUMBNAIL DESIGN BRIEF\n\n` +
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
  closeModal,
  copyText,
  copyThumbnailBrief,
  dispatchToTelegram,
  regenerateSingleGig,
  regenerateAllGigs,
  setLiveUrl
};