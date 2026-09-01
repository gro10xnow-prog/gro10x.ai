/**
 * public/app/modules/social.js
 * Social Media Planner & Engine 5 Content Command Center
 * v5.0 — Channel-Aware + AI Brief Generator + AI QC Engine + Monthly Content Calendar (Phase 1, 2, 5)
 * Channels: Grow Bangla, PILUTICS, Bong Hits, GRO10X Brand, Client Accounts
 * Views: 5-Stage Kanban Board & Monthly Content Calendar with Cadence Tracking
 */
window.APP_MODULES = window.APP_MODULES || {};

window.APP_MODULES.social = async function(container) {
  let postsData = [];
  let clientsData = [];
  let isLoading = true;
  let hasError = false;
  let activeGeneratedBrief = null;
  let activeViewMode = 'kanban'; // 'kanban' | 'calendar'
  let currentCalendarDate = new Date();

  const CHANNELS = [
    {
      id: 'grow-bangla',
      name: '🎓 Grow Bangla',
      engine: 'Engine 5',
      subs: '427 subs',
      badgeClass: 'badge-blue',
      defaultPlatform: 'YouTube',
      targetPerWeek: 2,
      categories: ['English Lesson', 'Vocabulary Drop', 'Grammar Hack', 'Pronunciation Tip', 'Motivation']
    },
    {
      id: 'pilutics',
      name: '🗺️ PILUTICS',
      engine: 'Engine 5',
      subs: '218 subs',
      badgeClass: 'badge-emerald',
      defaultPlatform: 'YouTube',
      targetPerWeek: 1,
      categories: ['Geopolitical Analysis', 'Travel Vlog', 'Country Spotlight', 'BD Insight', 'Current Events']
    },
    {
      id: 'bong-hits',
      name: '🎭 Bong Hits',
      engine: 'Engine 5',
      subs: '85 subs (YT+TikTok)',
      badgeClass: 'badge-pink',
      defaultPlatform: 'TikTok',
      targetPerWeek: 3,
      categories: ['Entertainment', 'Humor', 'Trending Sound', 'Cultural Moment', 'Reaction']
    },
    {
      id: 'gro10x',
      name: '📢 GRO10X Brand',
      engine: 'Agency Brand',
      subs: 'Official',
      badgeClass: 'badge-amber',
      defaultPlatform: 'LinkedIn',
      targetPerWeek: 2,
      categories: ['AI Tips', 'Agency BTS', 'Case Study', 'DigiVault Promo', 'B2B Hook']
    },
    {
      id: 'client',
      name: '🏢 Client Account',
      engine: 'Client Retainer',
      subs: 'CRM Sync',
      badgeClass: 'badge-gray',
      defaultPlatform: 'Facebook',
      targetPerWeek: 3,
      categories: ['Promo', 'Offer', 'Educational', 'Behind-the-Scenes', 'Testimonial']
    }
  ];

  const PLATFORM_ICONS = {
    Facebook: '📘',
    Instagram: '📸',
    LinkedIn: '💼',
    TikTok: '🎵',
    Twitter: '🐦',
    YouTube: '🎬'
  };

  const PLATFORM_LIMITS = {
    Facebook: 63000,
    Instagram: 2200,
    LinkedIn: 3000,
    TikTok: 2200,
    Twitter: 280,
    YouTube: 5000
  };

  let activePlatformFilter = 'all';
  let activeChannelFilter = 'all';

  function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  function getChannelConfig(channelNameOrId) {
    if (!channelNameOrId) return CHANNELS[4]; // Default to Client Account
    const lower = String(channelNameOrId).toLowerCase();
    const found = CHANNELS.find(c => c.id === lower || c.name.toLowerCase().includes(lower) || lower.includes(c.id));
    return found || {
      id: 'custom',
      name: channelNameOrId,
      engine: 'Custom',
      badgeClass: 'badge-purple',
      defaultPlatform: 'Facebook',
      targetPerWeek: 2,
      categories: ['General', 'Promo', 'Update']
    };
  }

  function evaluatePostQC(post) {
    const warnings = [];
    const plat = post.platform || 'Facebook';
    const limit = PLATFORM_LIMITS[plat] || 5000;
    const captionLen = (post.caption || '').length;

    if (captionLen === 0) {
      warnings.push('Missing caption / copy');
    } else if (captionLen > limit) {
      warnings.push(`Caption exceeds ${plat} limit (${captionLen}/${limit})`);
    }

    if (plat === 'Instagram') {
      const tags = (post.hashtags || '').split(/[,\s#]+/).filter(Boolean);
      if (tags.length > 30) warnings.push(`Instagram hashtag limit exceeded (${tags.length}/30)`);
      if (!post.firstComment || post.firstComment.trim().length === 0) {
        warnings.push('Missing Instagram 1st comment stack');
      }
    }

    const firstLine = (post.caption || '').split('\n')[0].trim();
    if (firstLine.length > 0 && firstLine.split(/\s+/).length < 3) {
      warnings.push('Hook is very short (<3 words)');
    }

    if (warnings.length === 0) {
      return { status: 'pass', label: '🟢 All QC Passed', color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)', warnings };
    } else if (warnings.length <= 2) {
      return { status: 'warn', label: `🟡 ${warnings.length} QC Notice${warnings.length > 1 ? 's' : ''}`, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', warnings };
    } else {
      return { status: 'fail', label: `🔴 ${warnings.length} Fixes Needed`, color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', warnings };
    }
  }

  async function loadInitialData() {
    isLoading = true;
    hasError = false;
    renderSkeleton();

    try {
      const [postsRes, clientsRes] = await Promise.all([
        APP_API.get('/posts').catch(() => []),
        APP_API.get('/clients').catch(() => [])
      ]);
      postsData = Array.isArray(postsRes) ? postsRes : [];
      clientsData = Array.isArray(clientsRes) ? clientsRes : [];
      isLoading = false;
      renderContent();
    } catch (err) {
      console.error('[Social Module] Failed to load data:', err);
      isLoading = false;
      postsData = [];
      clientsData = [];
      renderContent();
    }
  }

  function renderSkeleton() {
    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1.5rem; flex-wrap:wrap; gap:1rem;">
        <div>
          <div style="display:flex; align-items:center; gap:0.6rem;">
            <h1 style="font-size: 1.6rem; font-weight: 800; font-family: var(--font-heading); margin: 0;">
              📱 Social Media Planner
            </h1>
            <span class="badge badge-purple" style="font-size:0.75rem; font-weight:800;">
              Engine 5 Command Center
            </span>
          </div>
          <div style="font-size: 0.88rem; color: var(--text-muted); margin-top:0.25rem;">
            Channel-aware content pipeline with Gemini AI Brief Generator, QC Engine & Monthly Calendar.
          </div>
        </div>
        <div style="display:flex; gap:0.6rem; align-items:center; flex-wrap:wrap;">
          <!-- View Toggle Switcher -->
          <div style="display:flex; background:rgba(255,255,255,0.06); border:1px solid var(--border-subtle); border-radius:10px; padding:3px; gap:2px;">
            <button class="btn-ghost btn-sm" id="btnViewKanban" style="font-size:0.8rem; font-weight:800; padding:0.35rem 0.75rem; border-radius:8px; ${activeViewMode === 'kanban' ? 'background:rgba(255,255,255,0.15); color:#fff;' : 'color:var(--text-muted);'}" onclick="window.SOCIAL_MODULE.switchView('kanban')">📋 Kanban</button>
            <button class="btn-ghost btn-sm" id="btnViewCalendar" style="font-size:0.8rem; font-weight:800; padding:0.35rem 0.75rem; border-radius:8px; ${activeViewMode === 'calendar' ? 'background:rgba(255,255,255,0.15); color:#fff;' : 'color:var(--text-muted);'}" onclick="window.SOCIAL_MODULE.switchView('calendar')">📅 Calendar</button>
          </div>
          <button class="btn-secondary" onclick="window.SOCIAL_MODULE.reload()">🔄 Refresh</button>
          <button class="btn-primary" onclick="window.SOCIAL_MODULE.openPostModal()">+ Draft New Post</button>
        </div>
      </div>

      <!-- KPI summary bar -->
      <div class="social-kpi-row" id="socialKpiRow" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:1rem; margin-bottom:1.5rem;">
        <div class="kpi-tile"><div class="kpi-label">Total Posts</div><div class="kpi-val" id="kpiTotal">...</div></div>
        <div class="kpi-tile"><div class="kpi-label">📝 In Pipeline</div><div class="kpi-val" id="kpiPipeline">...</div></div>
        <div class="kpi-tile"><div class="kpi-label">💬 In Review</div><div class="kpi-val" id="kpiReview">...</div></div>
        <div class="kpi-tile"><div class="kpi-label">🚀 Approved / Ready</div><div class="kpi-val" id="kpiApproved">...</div></div>
        <div class="kpi-tile" style="border-left:3px solid #10b981;"><div class="kpi-label">✅ Published This Month</div><div class="kpi-val" id="kpiPosted" style="color:#10b981;">...</div></div>
      </div>

      <!-- Filter Section -->
      <div style="background:rgba(255,255,255,0.02); border:1px solid var(--border-subtle); border-radius:14px; padding:0.9rem 1.2rem; margin-bottom:1.5rem; display:flex; flex-direction:column; gap:0.75rem;">
        <!-- Channel Filter Pills -->
        <div style="display:flex; align-items:center; gap:0.6rem; flex-wrap:wrap;">
          <span style="font-size:0.75rem; font-weight:800; color:var(--text-muted); text-transform:uppercase; min-width:80px;">Channels:</span>
          <button class="r-pill active" id="sp-chan-all" onclick="window.SOCIAL_MODULE.filterChannel('all')">All Channels</button>
          <button class="r-pill" id="sp-chan-grow-bangla" onclick="window.SOCIAL_MODULE.filterChannel('grow-bangla')">🎓 Grow Bangla</button>
          <button class="r-pill" id="sp-chan-pilutics" onclick="window.SOCIAL_MODULE.filterChannel('pilutics')">🗺️ PILUTICS</button>
          <button class="r-pill" id="sp-chan-bong-hits" onclick="window.SOCIAL_MODULE.filterChannel('bong-hits')">🎭 Bong Hits</button>
          <button class="r-pill" id="sp-chan-gro10x" onclick="window.SOCIAL_MODULE.filterChannel('gro10x')">📢 GRO10X</button>
          <button class="r-pill" id="sp-chan-client" onclick="window.SOCIAL_MODULE.filterChannel('client')">🏢 Client Accounts</button>
        </div>

        <!-- Platform Filter Pills -->
        <div style="display:flex; align-items:center; gap:0.6rem; flex-wrap:wrap; border-top:1px solid rgba(255,255,255,0.05); padding-top:0.6rem;">
          <span style="font-size:0.75rem; font-weight:800; color:var(--text-muted); text-transform:uppercase; min-width:80px;">Platforms:</span>
          <button class="r-pill active" id="sp-pill-all" onclick="window.SOCIAL_MODULE.filterPlatform('all')">All Platforms</button>
          <button class="r-pill" id="sp-pill-YouTube" onclick="window.SOCIAL_MODULE.filterPlatform('YouTube')">🎬 YouTube</button>
          <button class="r-pill" id="sp-pill-TikTok" onclick="window.SOCIAL_MODULE.filterPlatform('TikTok')">🎵 TikTok</button>
          <button class="r-pill" id="sp-pill-Instagram" onclick="window.SOCIAL_MODULE.filterPlatform('Instagram')">📸 Instagram</button>
          <button class="r-pill" id="sp-pill-Facebook" onclick="window.SOCIAL_MODULE.filterPlatform('Facebook')">📘 Facebook</button>
          <button class="r-pill" id="sp-pill-LinkedIn" onclick="window.SOCIAL_MODULE.filterPlatform('LinkedIn')">💼 LinkedIn</button>
          <button class="r-pill" id="sp-pill-Twitter" onclick="window.SOCIAL_MODULE.filterPlatform('Twitter')">🐦 Twitter / X</button>
        </div>
      </div>

      <div id="socialBoardContainer">
        <div style="padding: 3rem; text-align: center; color: var(--text-muted);">Loading social media content board...</div>
      </div>

      <!-- Draft / Edit Post Modal -->
      <div class="modal-overlay" id="postModal">
        <div class="modal-box" style="max-width: 640px; max-height: 92vh; overflow-y:auto;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1rem; border-bottom:1px solid var(--border-subtle); padding-bottom:0.8rem;">
            <div>
              <h2 style="color:#fff; font-size:1.25rem; margin:0; font-family:var(--font-heading);" id="postModalTitle">📱 Draft New Social Post</h2>
              <div style="font-size:0.78rem; color:var(--text-muted); margin-top:0.2rem;">AI-assisted content creation for Engine 5 and agency brands.</div>
            </div>
            <button onclick="window.SOCIAL_MODULE.closePostModal()" style="background:transparent; border:none; color:var(--text-muted); font-size:1.4rem; cursor:pointer;">✕</button>
          </div>

          <form onsubmit="window.SOCIAL_MODULE.handleFormSubmit(event)" style="display:flex; flex-direction:column; gap:1rem;">
            <input type="hidden" id="spEditId" value="">

            <!-- Row 1: Channel & Category Selection -->
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.9rem;">
              <div class="form-group">
                <label class="form-label">Media Channel / Brand *</label>
                <select id="spChannel" class="input-text" required onchange="window.SOCIAL_MODULE.onChannelChange(this.value)">
                  <option value="grow-bangla">🎓 Grow Bangla (Engine 5 · 427 subs)</option>
                  <option value="pilutics">🗺️ PILUTICS (Engine 5 · 218 subs)</option>
                  <option value="bong-hits">🎭 Bong Hits (Engine 5 · 85 subs)</option>
                  <option value="gro10x">📢 GRO10X Brand (Agency Official)</option>
                  <option value="client">🏢 Client Account (CRM Retainer)</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Content Category *</label>
                <select id="spCategory" class="input-text" required>
                  <!-- Dynamically populated based on selected channel -->
                </select>
              </div>
            </div>

            <!-- Client Selector (Shown when Client Account selected) -->
            <div class="form-group" id="spClientSelectGroup" style="display:none;">
              <label class="form-label">CRM Client Account *</label>
              <select id="spClientSelect" class="input-text" onchange="window.SOCIAL_MODULE.syncClientName(this)">
                <option value="">-- Select Client from CRM --</option>
              </select>
              <input type="hidden" id="spClientName" value="">
            </div>

            <!-- Row 2: Platform & Scheduling -->
            <div style="display:grid; grid-template-columns:1.2fr 1fr 1fr; gap:0.9rem;">
              <div class="form-group">
                <label class="form-label">Platform *</label>
                <select id="spPlatform" class="input-text" onchange="window.SOCIAL_MODULE.onPlatformChange(this)">
                  <option value="YouTube">🎬 YouTube / Shorts</option>
                  <option value="TikTok">🎵 TikTok</option>
                  <option value="Instagram">📸 Instagram / Reels</option>
                  <option value="Facebook">📘 Facebook</option>
                  <option value="LinkedIn">💼 LinkedIn</option>
                  <option value="Twitter">🐦 Twitter / X</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Scheduled Date</label>
                <input type="date" id="spDate" class="input-text">
              </div>
              <div class="form-group">
                <label class="form-label">Time (HH:MM)</label>
                <input type="time" id="spTime" class="input-text" value="18:00">
              </div>
            </div>

            <!-- Post Title / Topic + AI Button -->
            <div class="form-group">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.3rem;">
                <label class="form-label" style="margin:0;">Post Title / Content Topic *</label>
                <button type="button" class="btn-primary btn-sm" id="btnAiBrief" style="font-size:0.75rem; padding:0.25rem 0.65rem; background:linear-gradient(135deg, #a855f7, #6366f1); border:none;" onclick="window.SOCIAL_MODULE.generateAIBrief()">
                  ✨ Generate AI Brief
                </button>
              </div>
              <input type="text" id="spTitle" class="input-text" placeholder="e.g. 5 Common Pronunciation Mistakes Bangalis Make" required>
            </div>

            <!-- AI Brief Result Panel (Collapsible) -->
            <div id="aiBriefContainer" style="display:none; background:rgba(168,85,247,0.06); border:1px solid rgba(168,85,247,0.3); border-radius:12px; padding:1rem; flex-direction:column; gap:0.75rem;">
              <!-- Populated via JavaScript on AI generation -->
            </div>

            <!-- Caption / Copywriting -->
            <div class="form-group">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.3rem;">
                <label class="form-label" style="margin:0;">Caption / Copywriting</label>
                <span id="captionCharCount" style="font-size:0.75rem; color:var(--text-dim);">0 / 5,000</span>
              </div>
              <textarea id="spCaption" class="input-text" rows="4" placeholder="Write post hook, body, and call-to-action..." oninput="window.SOCIAL_MODULE.updateCharCount(this)"></textarea>
            </div>

            <!-- First Comment / Hashtag Stack -->
            <div class="form-group">
              <label class="form-label">First Comment (Instagram Hashtag Stack / Engagement Hook)</label>
              <textarea id="spFirstComment" class="input-text" rows="2" placeholder="e.g. #GrowBangla #LearnEnglish #BanglaEnglish #SpokenEnglishBD"></textarea>
            </div>

            <!-- Row 3: Hashtags & Media URL -->
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.9rem;">
              <div class="form-group">
                <label class="form-label">Hashtags</label>
                <input type="text" id="spHashtags" class="input-text" placeholder="#GRO10X #VideoScale #Automation">
              </div>
              <div class="form-group">
                <label class="form-label">Media Asset URL (Cloudinary / CDN)</label>
                <input type="url" id="spMediaUrl" class="input-text" placeholder="https://...">
              </div>
            </div>

            <div style="display:flex; gap:0.75rem; justify-content:flex-end; margin-top:0.8rem; border-top:1px solid var(--border-subtle); padding-top:0.9rem;">
              <button type="button" class="btn-secondary" onclick="window.SOCIAL_MODULE.closePostModal()">Cancel</button>
              <button type="submit" class="btn-primary" id="spSubmitBtn">🚀 Save & Submit Draft</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  function renderContent() {
    renderKPIs();
    if (activeViewMode === 'calendar') {
      renderCalendar();
    } else {
      renderBoard();
    }
    populateClientDropdown();
    updateCategoryOptions('grow-bangla');
  }

  function updateCategoryOptions(channelKey, selectedCategory = '') {
    const categorySelect = document.getElementById('spCategory');
    if (!categorySelect) return;

    const channel = getChannelConfig(channelKey);
    categorySelect.innerHTML = (channel.categories || []).map(cat => `
      <option value="${escapeHTML(cat)}" ${cat === selectedCategory ? 'selected' : ''}>${escapeHTML(cat)}</option>
    `).join('');
  }

  function renderKPIs() {
    const total = postsData.length;
    const pipeline = postsData.filter(p => p.status === 'Draft' || p.status === 'Pending Draft' || p.status === 'Internal QC' || p.status === 'Internal Review').length;
    const review = postsData.filter(p => p.status === 'Pending Client Approval' || p.status === 'Client Review' || p.status === 'Revision Requested').length;
    const approved = postsData.filter(p => p.status === 'Approved' || p.status === 'Scheduled' || p.status === 'Due Today').length;
    const posted = postsData.filter(p => p.status === 'Posted' || p.status === 'Published').length;

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('kpiTotal', total);
    set('kpiPipeline', pipeline);
    set('kpiReview', review);
    set('kpiApproved', approved);
    set('kpiPosted', posted);
  }

  function renderBoard() {
    const board = document.getElementById('socialBoardContainer');
    if (!board) return;

    let filteredPosts = postsData;

    // Filter by platform
    if (activePlatformFilter !== 'all') {
      filteredPosts = filteredPosts.filter(p => (p.platform || '').toLowerCase().includes(activePlatformFilter.toLowerCase()));
    }

    // Filter by channel
    if (activeChannelFilter !== 'all') {
      filteredPosts = filteredPosts.filter(p => {
        const pChan = (p.channel || '').toLowerCase();
        return pChan.includes(activeChannelFilter.toLowerCase()) || (activeChannelFilter === 'client' && (pChan.includes('client') || !pChan));
      });
    }

    // Update active pill states
    ['all', 'Facebook', 'Instagram', 'LinkedIn', 'TikTok', 'Twitter', 'YouTube'].forEach(plat => {
      const pill = document.getElementById(`sp-pill-${plat}`);
      if (pill) pill.classList.toggle('active', plat === activePlatformFilter);
    });

    ['all', 'grow-bangla', 'pilutics', 'bong-hits', 'gro10x', 'client'].forEach(chan => {
      const pill = document.getElementById(`sp-chan-${chan}`);
      if (pill) pill.classList.toggle('active', chan === activeChannelFilter);
    });

    const drafts = filteredPosts.filter(p => p.status === 'Draft' || p.status === 'Pending Draft');
    const internal = filteredPosts.filter(p => p.status === 'Internal QC' || p.status === 'Internal Review');
    const client = filteredPosts.filter(p => p.status === 'Pending Client Approval' || p.status === 'Client Review' || p.status === 'Revision Requested');
    const approved = filteredPosts.filter(p => p.status === 'Approved' || p.status === 'Scheduled' || p.status === 'Due Today');
    const posted = filteredPosts.filter(p => p.status === 'Posted' || p.status === 'Published');

    board.innerHTML = `
      <div class="social-board" style="display:grid; grid-template-columns:repeat(5, minmax(280px, 1fr)); gap:1rem; overflow-x:auto; padding-bottom:1rem;">
        <!-- Col 1: Drafts -->
        <div class="social-col" style="background:var(--surface-card, #14141e); border:1px solid var(--border-subtle); border-radius:14px; padding:1rem; display:flex; flex-direction:column; min-height:550px;">
          <div style="display:flex; justify-content:space-between; align-items:center; font-weight:800; font-size:0.85rem; color:var(--text-secondary); margin-bottom:0.9rem; padding-bottom:0.5rem; border-bottom:1px solid var(--border-subtle);">
            <span>📝 Drafts & Concepts</span>
            <span class="badge badge-gray">${drafts.length}</span>
          </div>
          <div style="display:flex; flex-direction:column; gap:0.85rem; flex:1;">
            ${renderColumnCards(drafts, 'draft')}
          </div>
        </div>

        <!-- Col 2: Internal QC -->
        <div class="social-col" style="background:var(--surface-card, #14141e); border:1px solid var(--border-subtle); border-radius:14px; padding:1rem; display:flex; flex-direction:column; min-height:550px;">
          <div style="display:flex; justify-content:space-between; align-items:center; font-weight:800; font-size:0.85rem; color:var(--purple-light); margin-bottom:0.9rem; padding-bottom:0.5rem; border-bottom:1px solid var(--border-subtle);">
            <span>👁️ Internal QC</span>
            <span class="badge badge-purple">${internal.length}</span>
          </div>
          <div style="display:flex; flex-direction:column; gap:0.85rem; flex:1;">
            ${renderColumnCards(internal, 'internal')}
          </div>
        </div>

        <!-- Col 3: Review -->
        <div class="social-col" style="background:var(--surface-card, #14141e); border:1px solid var(--border-subtle); border-radius:14px; padding:1rem; display:flex; flex-direction:column; min-height:550px;">
          <div style="display:flex; justify-content:space-between; align-items:center; font-weight:800; font-size:0.85rem; color:var(--amber-brand); margin-bottom:0.9rem; padding-bottom:0.5rem; border-bottom:1px solid var(--border-subtle);">
            <span>💬 Review & Feedback</span>
            <span class="badge badge-amber">${client.length}</span>
          </div>
          <div style="display:flex; flex-direction:column; gap:0.85rem; flex:1;">
            ${renderColumnCards(client, 'client')}
          </div>
        </div>

        <!-- Col 4: Approved & Scheduled -->
        <div class="social-col" style="background:var(--surface-card, #14141e); border:1px solid rgba(16,185,129,0.3); border-radius:14px; padding:1rem; display:flex; flex-direction:column; min-height:550px;">
          <div style="display:flex; justify-content:space-between; align-items:center; font-weight:800; font-size:0.85rem; color:#10b981; margin-bottom:0.9rem; padding-bottom:0.5rem; border-bottom:1px solid rgba(16,185,129,0.2);">
            <span>🚀 Approved & Scheduled</span>
            <span class="badge badge-emerald">${approved.length}</span>
          </div>
          <div style="display:flex; flex-direction:column; gap:0.85rem; flex:1;">
            ${renderColumnCards(approved, 'approved')}
          </div>
        </div>

        <!-- Col 5: Posted -->
        <div class="social-col" style="background:var(--surface-card, #14141e); border:1px solid rgba(59,130,246,0.3); border-radius:14px; padding:1rem; display:flex; flex-direction:column; min-height:550px;">
          <div style="display:flex; justify-content:space-between; align-items:center; font-weight:800; font-size:0.85rem; color:#60a5fa; margin-bottom:0.9rem; padding-bottom:0.5rem; border-bottom:1px solid rgba(59,130,246,0.2);">
            <span>✅ Posted & Live</span>
            <span class="badge badge-blue">${posted.length}</span>
          </div>
          <div style="display:flex; flex-direction:column; gap:0.85rem; flex:1;">
            ${renderColumnCards(posted, 'posted')}
          </div>
        </div>
      </div>
    `;
  }

  function renderCalendar() {
    const board = document.getElementById('socialBoardContainer');
    if (!board) return;

    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const currentMonthName = monthNames[month];

    // Filter posts for calendar
    let filteredPosts = postsData;
    if (activePlatformFilter !== 'all') {
      filteredPosts = filteredPosts.filter(p => (p.platform || '').toLowerCase().includes(activePlatformFilter.toLowerCase()));
    }
    if (activeChannelFilter !== 'all') {
      filteredPosts = filteredPosts.filter(p => {
        const pChan = (p.channel || '').toLowerCase();
        return pChan.includes(activeChannelFilter.toLowerCase()) || (activeChannelFilter === 'client' && (pChan.includes('client') || !pChan));
      });
    }

    const firstDayIndex = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    const prevLastDate = new Date(year, month, 0).getDate();
    const totalCells = Math.ceil((firstDayIndex + lastDate) / 7) * 7;

    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

    // Build calendar grid days
    let dayCellsHtml = '';

    for (let i = 0; i < totalCells; i++) {
      let dayNumber;
      let dateString;
      let isCurrentMonthCell = false;
      let isTodayCell = false;

      if (i < firstDayIndex) {
        // Prev month padding
        dayNumber = prevLastDate - firstDayIndex + i + 1;
        const prevMonth = month === 0 ? 11 : month - 1;
        const prevYear = month === 0 ? year - 1 : year;
        dateString = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
      } else if (i < firstDayIndex + lastDate) {
        // Current month
        dayNumber = i - firstDayIndex + 1;
        isCurrentMonthCell = true;
        dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
        if (isCurrentMonth && today.getDate() === dayNumber) isTodayCell = true;
      } else {
        // Next month padding
        dayNumber = i - (firstDayIndex + lastDate) + 1;
        const nextMonth = month === 11 ? 0 : month + 1;
        const nextYear = month === 11 ? year + 1 : year;
        dateString = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
      }

      // Find posts for this day
      const dayPosts = filteredPosts.filter(p => p.scheduledDate === dateString);

      dayCellsHtml += `
        <div class="calendar-day-cell" style="background:${isCurrentMonthCell ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.2)'}; border:1px solid ${isTodayCell ? '#10b981' : 'var(--border-subtle)'}; border-radius:10px; padding:0.6rem; min-height:115px; display:flex; flex-direction:column; gap:0.4rem; cursor:pointer; position:relative; transition:border-color 0.15s ease;" onclick="window.SOCIAL_MODULE.openPostModalWithDate('${dateString}')">
          
          <!-- Day Header -->
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:0.82rem; font-weight:${isTodayCell ? '900' : '700'}; color:${isTodayCell ? '#10b981' : (isCurrentMonthCell ? 'var(--text-primary)' : 'var(--text-dim)')};">
              ${dayNumber} ${isTodayCell ? '· Today' : ''}
            </span>
            ${dayPosts.length > 0 ? `<span class="badge badge-purple" style="font-size:0.62rem; padding:0.1rem 0.35rem;">${dayPosts.length}</span>` : ''}
          </div>

          <!-- Scheduled Post Chips -->
          <div style="display:flex; flex-direction:column; gap:0.3rem; flex:1; overflow-y:auto;">
            ${dayPosts.map(p => {
              const chanCfg = getChannelConfig(p.channel);
              const icon = PLATFORM_ICONS[p.platform] || '📱';
              const isPosted = p.status === 'Posted' || p.status === 'Published';
              const isApproved = p.status === 'Approved' || p.status === 'Scheduled';

              return `
                <div class="calendar-post-chip" style="background:${isPosted ? 'rgba(59,130,246,0.15)' : (isApproved ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)')}; border:1px solid ${isPosted ? '#3b82f6' : (isApproved ? '#10b981' : 'var(--border-subtle)')}; border-radius:6px; padding:0.3rem 0.45rem; font-size:0.7rem; line-height:1.25;" onclick="event.stopPropagation(); window.SOCIAL_MODULE.openEditModal('${p.id}')">
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.15rem;">
                    <span class="badge ${chanCfg.badgeClass}" style="font-size:0.6rem; padding:0 0.3rem;">${escapeHTML(chanCfg.name.split(' ')[1] || chanCfg.name)}</span>
                    <span style="font-size:0.65rem;">${icon} ${p.scheduledTime ? escapeHTML(p.scheduledTime) : ''}</span>
                  </div>
                  <div style="font-weight:700; color:var(--text-primary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                    ${escapeHTML(p.title)}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    // Per-Channel Cadence Calculations for this month
    const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    const monthPosts = postsData.filter(p => (p.scheduledDate || '').startsWith(monthPrefix));

    const cadenceStatsHtml = CHANNELS.map(ch => {
      const count = monthPosts.filter(p => {
        const pChan = (p.channel || '').toLowerCase();
        return pChan.includes(ch.id) || pChan.includes(ch.name.toLowerCase()) || (ch.id === 'client' && pChan.includes('client'));
      }).length;

      const target = ch.targetPerWeek * 4; // Monthly target (~4 weeks)
      const pct = Math.min(100, Math.round((count / target) * 100));
      const statusColor = pct >= 80 ? '#10b981' : (pct >= 40 ? '#f59e0b' : '#ef4444');

      return `
        <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); border-radius:10px; padding:0.75rem 1rem; display:flex; flex-direction:column; gap:0.4rem;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span class="badge ${ch.badgeClass}" style="font-size:0.75rem; font-weight:800;">${escapeHTML(ch.name)}</span>
            <span style="font-size:0.75rem; font-weight:800; color:${statusColor};">${count} / ${target} Posts (${pct}%)</span>
          </div>
          <div style="background:rgba(255,255,255,0.06); border-radius:4px; height:6px; overflow:hidden;">
            <div style="width:${pct}%; background:${statusColor}; height:100%; transition:width 0.3s ease;"></div>
          </div>
          <div style="font-size:0.68rem; color:var(--text-dim); display:flex; justify-content:space-between;">
            <span>Cadence: ${ch.targetPerWeek}× / week</span>
            <span>${ch.subs}</span>
          </div>
        </div>
      `;
    }).join('');

    board.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:1.5rem;">
        
        <!-- Calendar Navigation Header -->
        <div style="display:flex; justify-content:space-between; align-items:center; background:var(--surface-card, #14141e); border:1px solid var(--border-subtle); border-radius:14px; padding:0.9rem 1.2rem; flex-wrap:wrap; gap:0.8rem;">
          <div style="display:flex; align-items:center; gap:0.8rem;">
            <h2 style="margin:0; font-size:1.35rem; font-family:var(--font-heading); color:#fff;">
              📅 ${currentMonthName} ${year}
            </h2>
            <span class="badge badge-purple" style="font-size:0.75rem;">${filteredPosts.length} posts filtered</span>
          </div>
          <div style="display:flex; gap:0.5rem; align-items:center;">
            <button class="btn-secondary btn-sm" onclick="window.SOCIAL_MODULE.prevMonth()">← Prev Month</button>
            <button class="btn-secondary btn-sm" onclick="window.SOCIAL_MODULE.todayMonth()">Today</button>
            <button class="btn-secondary btn-sm" onclick="window.SOCIAL_MODULE.nextMonth()">Next Month →</button>
          </div>
        </div>

        <!-- Day of Week Grid Headers -->
        <div style="display:grid; grid-template-columns:repeat(7, 1fr); gap:0.6rem; text-align:center; font-weight:800; font-size:0.78rem; color:var(--text-muted); text-transform:uppercase;">
          <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
        </div>

        <!-- 7-Column Day Cells Grid -->
        <div style="display:grid; grid-template-columns:repeat(7, 1fr); gap:0.6rem;">
          ${dayCellsHtml}
        </div>

        <!-- Channel Cadence & Frequency Tracker -->
        <div style="background:var(--surface-card, #14141e); border:1px solid var(--border-subtle); border-radius:14px; padding:1.2rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; border-bottom:1px solid var(--border-subtle); padding-bottom:0.6rem;">
            <div>
              <h3 style="margin:0; font-size:1rem; color:#fff; font-family:var(--font-heading);">⚡ Monthly Channel Publishing Cadence & Frequency</h3>
              <div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.2rem;">Engine 5 video output targets vs actual scheduled/published content for ${currentMonthName}.</div>
            </div>
            <span class="badge badge-emerald">Engine 5 Scaling</span>
          </div>
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:1rem;">
            ${cadenceStatsHtml}
          </div>
        </div>

      </div>
    `;
  }

  function renderColumnCards(list, stageKey) {
    if (!list || list.length === 0) {
      return `<div style="text-align:center; color:var(--text-dim); padding:2.5rem 1rem; font-size:0.8rem; border:1px dashed var(--border-subtle); border-radius:12px; height:100%; display:flex; align-items:center; justify-content:center;">No posts in this stage</div>`;
    }

    return list.map(p => {
      const chanCfg = getChannelConfig(p.channel);
      const icon = PLATFORM_ICONS[p.platform] || '📱';
      const isRevision = p.status === 'Revision Requested';
      const hasMedia = Array.isArray(p.mediaUrls) && p.mediaUrls.length > 0;
      const mediaThumb = hasMedia ? p.mediaUrls[0] : null;
      const qc = evaluatePostQC(p);

      return `
        <div class="post-card" style="background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); border-radius:12px; padding:0.9rem; display:flex; flex-direction:column; gap:0.6rem; transition:transform 0.15s ease, border-color 0.15s ease;">
          
          <!-- Channel & Platform Badges Header -->
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.3rem;">
            <span class="badge ${chanCfg.badgeClass}" style="font-size:0.72rem; font-weight:800;">
              ${escapeHTML(chanCfg.name)}
            </span>
            <div style="display:flex; gap:0.3rem; align-items:center;">
              <span class="badge badge-gray" style="font-size:0.68rem;">
                ${icon} ${escapeHTML(p.platform)}
              </span>
              ${p.contentCategory ? `<span class="badge badge-purple" style="font-size:0.65rem;">${escapeHTML(p.contentCategory)}</span>` : ''}
            </div>
          </div>

          <!-- Post Title -->
          <div style="font-weight:800; color:var(--text-primary); font-size:0.92rem; line-height:1.35;">
            ${escapeHTML(p.title)}
          </div>

          <!-- Internal QC Evaluation Badge (shown in Internal QC stage) -->
          ${stageKey === 'internal' ? `
            <div style="background:${qc.bg}; border:1px solid ${qc.border}; border-radius:6px; padding:0.35rem 0.5rem; font-size:0.72rem; color:${qc.color}; display:flex; justify-content:space-between; align-items:center;">
              <span style="font-weight:800;">${qc.label}</span>
              ${qc.warnings.length > 0 ? `<span style="font-size:0.65rem; color:var(--text-muted); cursor:help;" title="${escapeHTML(qc.warnings.join(' • '))}">ℹ️ Details</span>` : ''}
            </div>
          ` : ''}

          <!-- Media Thumbnail -->
          ${mediaThumb ? `
            <div style="height:110px; border-radius:8px; overflow:hidden; background:rgba(0,0,0,0.4); border:1px solid var(--border-subtle);">
              <img src="${escapeHTML(mediaThumb)}" style="width:100%; height:100%; object-fit:cover;" alt="Media Thumbnail" onerror="this.parentElement.style.display='none'">
            </div>
          ` : ''}

          <!-- Caption Preview -->
          <div style="font-size:0.78rem; color:var(--text-muted); line-height:1.45; white-space:pre-wrap; max-height:75px; overflow:hidden; text-overflow:ellipsis;">
            ${escapeHTML(p.caption || 'No copy written yet')}
          </div>

          <!-- First Comment / Hashtag Stack Preview -->
          ${p.firstComment ? `
            <div style="background:rgba(168,85,247,0.06); border:1px solid rgba(168,85,247,0.2); border-radius:6px; padding:0.35rem 0.5rem; font-size:0.7rem; color:#d8b4fe; line-height:1.3;">
              💬 <strong>1st Comment:</strong> ${escapeHTML(p.firstComment.slice(0, 70))}${p.firstComment.length > 70 ? '...' : ''}
            </div>
          ` : ''}

          <!-- Scheduling & Publisher Meta -->
          <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.72rem; color:var(--text-dim); border-top:1px solid rgba(255,255,255,0.04); padding-top:0.4rem;">
            <span>📅 ${escapeHTML(p.scheduledDate || 'TBD')} ${p.scheduledTime ? `· ⏰ ${escapeHTML(p.scheduledTime)}` : ''}</span>
            <span>👤 ${escapeHTML(p.assignedPublisher || 'Firoz')}</span>
          </div>

          ${isRevision ? `
            <div style="background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.25); border-radius:6px; padding:0.4rem 0.6rem; font-size:0.72rem; color:#fca5a5;">
              💬 <strong>Revisions:</strong> ${escapeHTML(p.clientFeedback || 'Revision requested')}
            </div>
          ` : ''}

          <!-- Contextual Stage Controls -->
          <div class="post-card-actions" style="display:flex; gap:0.4rem; align-items:center; margin-top:0.3rem;">
            ${renderCardButtons(p, stageKey)}
          </div>
        </div>
      `;
    }).join('');
  }

  function renderCardButtons(p, stageKey) {
    let btns = '';

    if (stageKey === 'draft') {
      btns += `<button class="btn-primary btn-sm" style="font-size:0.72rem; flex:1;" onclick="window.SOCIAL_MODULE.updatePostStatus('${p.id}', 'Internal QC')">▶ To Internal QC</button>`;
    } else if (stageKey === 'internal') {
      btns += `<button class="btn-primary btn-sm" style="font-size:0.72rem; flex:1;" onclick="window.SOCIAL_MODULE.updatePostStatus('${p.id}', 'Pending Client Approval')">▶ Send to Review</button>`;
    } else if (stageKey === 'client') {
      btns += `
        <button class="btn-emerald btn-sm" style="font-size:0.72rem; flex:1;" onclick="window.SOCIAL_MODULE.approvePost('${p.id}')">✅ Approve</button>
        <button class="btn-secondary btn-sm" style="font-size:0.72rem; color:#fca5a5;" onclick="window.SOCIAL_MODULE.promptRejectPost('${p.id}')">🔴 Revisions</button>
      `;
    } else if (stageKey === 'approved') {
      btns += `
        <button class="btn-emerald btn-sm" style="font-size:0.72rem; flex:1;" onclick="window.SOCIAL_MODULE.markAsPosted('${p.id}')">🚀 Mark as Posted</button>
        <button class="btn-secondary btn-sm" style="font-size:0.72rem;" title="Copy Copy & Tags" onclick="window.SOCIAL_MODULE.copyPostContent('${p.id}')">📋</button>
      `;
    } else if (stageKey === 'posted') {
      btns += `
        <span class="badge badge-emerald" style="font-size:0.72rem; flex:1; text-align:center; padding:0.3rem;">✅ Published</span>
        <button class="btn-secondary btn-sm" style="font-size:0.72rem;" title="Copy Copy" onclick="window.SOCIAL_MODULE.copyPostContent('${p.id}')">📋</button>
      `;
    }

    // Always include Edit and Delete icon buttons
    btns += `
      <button class="btn-secondary btn-sm" style="padding:0.2rem 0.45rem; font-size:0.75rem;" title="Edit Post" onclick="window.SOCIAL_MODULE.openEditModal('${p.id}')">✏️</button>
      <button class="btn-secondary btn-sm" style="padding:0.2rem 0.45rem; font-size:0.75rem; color:#ef4444;" title="Delete Post" onclick="window.SOCIAL_MODULE.deletePost('${p.id}')">🗑️</button>
    `;

    return btns;
  }

  function populateClientDropdown() {
    const select = document.getElementById('spClientSelect');
    if (!select) return;

    select.innerHTML = '<option value="">-- Select Client from CRM --</option>' + clientsData.map(c => `
      <option value="${c.id}" data-name="${escapeHTML(c.name)}">${escapeHTML(c.name)} (${escapeHTML(c.company || c.brand || c.category || 'Client')})</option>
    `).join('') + '<option value="custom" data-name="General Client">+ General / Manual Client</option>';
  }

  // Subscribe to real-time updates via SSE
  let sseUnsub = null;
  if (window.APP_SSE && window.APP_SSE.subscribe) {
    sseUnsub = window.APP_SSE.subscribe('post_update', (updatedPosts) => {
      if (Array.isArray(updatedPosts)) {
        postsData = updatedPosts;
        renderKPIs();
        if (activeViewMode === 'calendar') renderCalendar();
        else renderBoard();
      }
    });
  }

  window.SOCIAL_MODULE = {
    reload() {
      loadInitialData();
    },
    switchView(mode) {
      activeViewMode = mode;
      const btnK = document.getElementById('btnViewKanban');
      const btnC = document.getElementById('btnViewCalendar');
      if (btnK) {
        btnK.style.background = mode === 'kanban' ? 'rgba(255,255,255,0.15)' : 'transparent';
        btnK.style.color = mode === 'kanban' ? '#fff' : 'var(--text-muted)';
      }
      if (btnC) {
        btnC.style.background = mode === 'calendar' ? 'rgba(255,255,255,0.15)' : 'transparent';
        btnC.style.color = mode === 'calendar' ? '#fff' : 'var(--text-muted)';
      }
      if (mode === 'calendar') renderCalendar();
      else renderBoard();
    },
    prevMonth() {
      currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
      renderCalendar();
    },
    nextMonth() {
      currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
      renderCalendar();
    },
    todayMonth() {
      currentCalendarDate = new Date();
      renderCalendar();
    },
    filterPlatform(plat) {
      activePlatformFilter = plat;
      if (activeViewMode === 'calendar') renderCalendar();
      else renderBoard();
    },
    filterChannel(chan) {
      activeChannelFilter = chan;
      if (activeViewMode === 'calendar') renderCalendar();
      else renderBoard();
    },
    onChannelChange(channelKey) {
      updateCategoryOptions(channelKey);
      const clientGroup = document.getElementById('spClientSelectGroup');
      const platformSelect = document.getElementById('spPlatform');

      if (channelKey === 'client') {
        if (clientGroup) clientGroup.style.display = 'block';
      } else {
        if (clientGroup) clientGroup.style.display = 'none';
        const channel = getChannelConfig(channelKey);
        if (channel && platformSelect && channel.defaultPlatform) {
          platformSelect.value = channel.defaultPlatform;
          const caption = document.getElementById('spCaption');
          this.updateCharCount(caption || { value: '' }, channel.defaultPlatform);
        }
      }
    },
    onPlatformChange(selectEl) {
      const plat = selectEl.value;
      const caption = document.getElementById('spCaption');
      this.updateCharCount(caption || { value: '' }, plat);
    },
    syncClientName(selectEl) {
      const selectedOption = selectEl.options[selectEl.selectedIndex];
      const nameInput = document.getElementById('spClientName');
      if (selectedOption && nameInput) {
        nameInput.value = selectedOption.getAttribute('data-name') || selectedOption.text || 'General Client';
      }
    },
    updateCharCount(textarea, optPlatform) {
      const counter = document.getElementById('captionCharCount');
      if (!counter) return;
      const plat = optPlatform || document.getElementById('spPlatform')?.value || 'YouTube';
      const limit = PLATFORM_LIMITS[plat] || 5000;
      const len = (textarea.value || '').length;
      counter.textContent = `${len.toLocaleString()} / ${limit.toLocaleString()} (${plat})`;
      counter.style.color = len > limit ? '#ef4444' : 'var(--text-dim)';
    },
    copyPostContent(id) {
      const p = postsData.find(post => post.id === id);
      if (!p) return;
      const text = [p.caption, p.firstComment ? `\n1st Comment:\n${p.firstComment}` : '', p.hashtags].filter(Boolean).join('\n\n');
      navigator.clipboard.writeText(text);
      if (window.showToast) window.showToast('📋 Post copy and tags copied to clipboard!', 'success');
    },
    async generateAIBrief() {
      const btn = document.getElementById('btnAiBrief');
      const container = document.getElementById('aiBriefContainer');
      const channelKey = document.getElementById('spChannel')?.value || 'grow-bangla';
      const channelObj = getChannelConfig(channelKey);
      const contentCategory = document.getElementById('spCategory')?.value || 'English Lesson';
      const platform = document.getElementById('spPlatform')?.value || 'YouTube';
      const topic = document.getElementById('spTitle')?.value || '';

      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '✨ Generating Brief...';
      }

      if (container) {
        container.style.display = 'flex';
        container.innerHTML = `
          <div style="text-align:center; padding:1rem; color:var(--purple-light); font-size:0.85rem;">
            <div style="font-size:1.4rem; margin-bottom:0.3rem;">🤖</div>
            Gemini AI crafting structured content blueprint for <strong>${escapeHTML(channelObj.name)}</strong>...
          </div>
        `;
      }

      try {
        const res = await APP_API.post('/ai/social-brief', {
          channel: channelObj.name,
          contentCategory,
          platform,
          topic
        });

        if (res && res.success && res.brief) {
          activeGeneratedBrief = res.brief;
          this.renderAIBriefPanel(res.brief, res.generatedBy);
          if (window.showToast) window.showToast('✨ AI Content Brief generated successfully!', 'success');
        } else {
          throw new Error((res && res.error) || 'Failed to generate brief');
        }
      } catch (err) {
        console.error('[AI Brief] Error:', err);
        if (container) {
          container.innerHTML = `
            <div style="color:#fca5a5; font-size:0.82rem; padding:0.5rem;">
              ⚠️ AI generation error: ${escapeHTML(err.message)}
            </div>
          `;
        }
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = '✨ Generate AI Brief';
        }
      }
    },
    renderAIBriefPanel(brief, generatedBy) {
      const container = document.getElementById('aiBriefContainer');
      if (!container) return;

      container.style.display = 'flex';
      container.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(168,85,247,0.2); padding-bottom:0.4rem;">
          <span style="font-size:0.8rem; font-weight:800; color:#d8b4fe;">
            ✨ AI Content Blueprint (${escapeHTML(generatedBy || 'gemini')})
          </span>
          <button type="button" class="btn-primary btn-sm" style="font-size:0.7rem; padding:0.2rem 0.5rem; background:#10b981; border:none;" onclick="window.SOCIAL_MODULE.applyAllBriefFields()">
            ⚡ Auto-Fill Post Form
          </button>
        </div>

        <div style="display:grid; grid-template-columns:1fr; gap:0.5rem; font-size:0.78rem;">
          <div>
            <strong style="color:#ffffff;">🎯 Viral Hook:</strong>
            <div style="color:#a7f3d0; margin-top:0.15rem;">"${escapeHTML(brief.hook)}"</div>
          </div>
          <div>
            <strong style="color:#ffffff;">📐 Angle:</strong>
            <span style="color:var(--text-muted);">${escapeHTML(brief.angle)}</span>
          </div>
          ${Array.isArray(brief.keyPoints) && brief.keyPoints.length > 0 ? `
            <div>
              <strong style="color:#ffffff;">🔑 Key Points:</strong>
              <ul style="margin:0.2rem 0 0 1.2rem; padding:0; color:var(--text-secondary);">
                ${brief.keyPoints.map(p => `<li>${escapeHTML(p)}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          <div style="background:rgba(0,0,0,0.25); border-radius:6px; padding:0.5rem; border:1px solid rgba(255,255,255,0.05);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.2rem;">
              <strong style="color:#ffffff;">🎬 Visual Brief (CapCut/Canva):</strong>
              <button type="button" class="btn-ghost btn-sm" style="font-size:0.65rem; padding:0.1rem 0.4rem;" onclick="navigator.clipboard.writeText('${escapeHTML(brief.visualBrief).replace(/'/g, "\\'")}'); if(window.showToast) window.showToast('Visual brief copied!','success');">📋 Copy</button>
            </div>
            <div style="color:var(--text-muted); font-size:0.74rem;">${escapeHTML(brief.visualBrief)}</div>
          </div>
          <div style="background:rgba(0,0,0,0.25); border-radius:6px; padding:0.5rem; border:1px solid rgba(255,255,255,0.05);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.2rem;">
              <strong style="color:#ffffff;">🎙️ 30s Talking Script:</strong>
              <button type="button" class="btn-ghost btn-sm" style="font-size:0.65rem; padding:0.1rem 0.4rem;" onclick="navigator.clipboard.writeText('${escapeHTML(brief.voiceNote).replace(/'/g, "\\'")}'); if(window.showToast) window.showToast('Voice script copied!','success');">📋 Copy</button>
            </div>
            <div style="color:var(--text-muted); font-size:0.74rem;">${escapeHTML(brief.voiceNote)}</div>
          </div>
        </div>
      `;
    },
    applyAllBriefFields() {
      if (!activeGeneratedBrief) return;
      const b = activeGeneratedBrief;
      const captionEl = document.getElementById('spCaption');
      const firstCommentEl = document.getElementById('spFirstComment');
      const hashtagsEl = document.getElementById('spHashtags');
      const titleEl = document.getElementById('spTitle');

      if (captionEl && b.caption) {
        captionEl.value = b.caption;
        this.updateCharCount(captionEl);
      }
      if (firstCommentEl && b.firstComment) {
        firstCommentEl.value = b.firstComment;
      }
      if (hashtagsEl && b.hashtags) {
        hashtagsEl.value = b.hashtags;
      }
      if (titleEl && (!titleEl.value || titleEl.value.trim().length === 0) && b.hook) {
        titleEl.value = b.hook;
      }

      if (window.showToast) window.showToast('⚡ Post fields auto-filled from AI brief!', 'success');
    },
    async openPostModalWithDate(dateStr) {
      await this.openPostModal();
      const dateEl = document.getElementById('spDate');
      if (dateEl && dateStr) dateEl.value = dateStr;
    },
    async openPostModal() {
      if (clientsData.length === 0) {
        try {
          const res = await APP_API.get('/clients').catch(() => []);
          if (Array.isArray(res) && res.length > 0) clientsData = res;
        } catch(e) {}
      }
      populateClientDropdown();
      activeGeneratedBrief = null;
      const briefBox = document.getElementById('aiBriefContainer');
      if (briefBox) { briefBox.style.display = 'none'; briefBox.innerHTML = ''; }

      document.getElementById('spEditId').value = '';
      document.getElementById('postModalTitle').textContent = '📱 Draft New Social Post';
      document.getElementById('spTitle').value = '';
      document.getElementById('spCaption').value = '';
      document.getElementById('spFirstComment').value = '';
      document.getElementById('spHashtags').value = '';
      document.getElementById('spMediaUrl').value = '';
      document.getElementById('spDate').value = new Date().toISOString().split('T')[0];
      document.getElementById('spTime').value = '18:00';
      document.getElementById('spChannel').value = 'grow-bangla';
      this.onChannelChange('grow-bangla');
      document.getElementById('spClientSelect').value = '';
      document.getElementById('spClientName').value = '';
      this.updateCharCount({ value: '' }, 'YouTube');

      document.getElementById('postModal').classList.add('active');
    },
    async openEditModal(id) {
      if (clientsData.length === 0) {
        try {
          const res = await APP_API.get('/clients').catch(() => []);
          if (Array.isArray(res) && res.length > 0) clientsData = res;
        } catch(e) {}
      }
      populateClientDropdown();
      activeGeneratedBrief = null;
      const briefBox = document.getElementById('aiBriefContainer');
      if (briefBox) { briefBox.style.display = 'none'; briefBox.innerHTML = ''; }

      const post = postsData.find(p => p.id === id);
      if (!post) return;

      document.getElementById('spEditId').value = post.id;
      document.getElementById('postModalTitle').textContent = '✏️ Edit Social Post Draft';
      document.getElementById('spTitle').value = post.title || '';
      document.getElementById('spCaption').value = post.caption || '';
      document.getElementById('spFirstComment').value = post.firstComment || '';
      document.getElementById('spHashtags').value = post.hashtags || '';
      document.getElementById('spMediaUrl').value = (post.mediaUrls && post.mediaUrls[0]) || '';
      document.getElementById('spDate').value = post.scheduledDate || new Date().toISOString().split('T')[0];
      document.getElementById('spTime').value = post.scheduledTime || '18:00';
      document.getElementById('spPlatform').value = post.platform || 'YouTube';
      
      const channelSelect = document.getElementById('spChannel');
      const channelVal = post.channel ? (CHANNELS.find(c => c.name.includes(post.channel) || c.id === post.channel)?.id || 'grow-bangla') : 'grow-bangla';
      if (channelSelect) channelSelect.value = channelVal;
      this.onChannelChange(channelVal);
      
      const categorySelect = document.getElementById('spCategory');
      if (categorySelect && post.contentCategory) {
        categorySelect.value = post.contentCategory;
      }

      const clientSelect = document.getElementById('spClientSelect');
      if (clientSelect) clientSelect.value = post.clientId || '';
      document.getElementById('spClientName').value = post.clientName || '';
      
      this.updateCharCount({ value: post.caption || '' }, post.platform);
      document.getElementById('postModal').classList.add('active');
    },
    closePostModal() {
      document.getElementById('postModal').classList.remove('active');
    },
    async handleFormSubmit(e) {
      e.preventDefault();
      const editId = document.getElementById('spEditId').value;
      const title = document.getElementById('spTitle').value.trim();
      const caption = document.getElementById('spCaption').value.trim();
      const firstComment = document.getElementById('spFirstComment').value.trim();
      const hashtags = document.getElementById('spHashtags').value.trim();
      const platform = document.getElementById('spPlatform').value;
      const channelKey = document.getElementById('spChannel').value;
      const channelObj = getChannelConfig(channelKey);
      const contentCategory = document.getElementById('spCategory').value;
      const scheduledDate = document.getElementById('spDate').value;
      const scheduledTime = document.getElementById('spTime').value || '18:00';
      const clientId = document.getElementById('spClientSelect').value;
      const clientName = channelKey === 'client' 
        ? (document.getElementById('spClientName').value || 'General Client')
        : channelObj.name;
      const mediaUrl = document.getElementById('spMediaUrl').value.trim();

      if (!title) {
        if (window.showToast) window.showToast('Please enter a post title.', 'error');
        return;
      }

      const submitBtn = document.getElementById('spSubmitBtn');
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = '⏳ Saving...'; }

      try {
        const payload = {
          title,
          caption,
          firstComment,
          hashtags,
          platform,
          channel: channelObj.name,
          contentCategory,
          scheduledDate,
          scheduledTime,
          clientId,
          clientName,
          assignedPublisher: 'Firoz',
          mediaUrls: mediaUrl ? [mediaUrl] : []
        };

        if (editId) {
          await APP_API.put(`/posts/${editId}`, payload);
          if (window.showToast) window.showToast('Social post updated!', 'success');
        } else {
          payload.status = 'Draft';
          await APP_API.post('/posts', payload);
          if (window.showToast) window.showToast('Social post draft created!', 'success');
        }

        this.closePostModal();
        loadInitialData();
      } catch (err) {
        if (window.showToast) window.showToast('Failed to save post: ' + err.message, 'error');
      } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = '🚀 Save & Submit Draft'; }
      }
    },
    async updatePostStatus(id, newStatus) {
      try {
        await APP_API.patch(`/posts/${id}/status`, { status: newStatus });
        if (window.showToast) window.showToast(`Post stage updated to "${newStatus}"`, 'success');
        loadInitialData();
      } catch (err) {
        if (window.showToast) window.showToast('Status update failed: ' + err.message, 'error');
      }
    },
    async approvePost(id) {
      try {
        await APP_API.post(`/posts/${id}/approve`, {});
        if (window.showToast) window.showToast('🎉 Social post approved!', 'success');
        loadInitialData();
      } catch (err) {
        if (window.showToast) window.showToast('Approval failed: ' + err.message, 'error');
      }
    },
    async markAsPosted(id) {
      try {
        await APP_API.post(`/posts/${id}/posted`, {});
        if (window.showToast) window.showToast('✅ Post marked as Posted & Live!', 'success');
        loadInitialData();
      } catch (err) {
        if (window.showToast) window.showToast('Failed to mark as posted: ' + err.message, 'error');
      }
    },
    async promptRejectPost(id) {
      const feedback = prompt('Describe the revisions needed for this post:');
      if (feedback === null) return;
      try {
        await APP_API.post(`/posts/${id}/reject`, { feedback });
        if (window.showToast) window.showToast('🔴 Revisions requested.', 'info');
        loadInitialData();
      } catch (err) {
        if (window.showToast) window.showToast('Revision request failed: ' + err.message, 'error');
      }
    },
    async deletePost(id) {
      if (!confirm('Are you sure you want to delete this social post draft?')) return;
      try {
        await APP_API.delete(`/posts/${id}`);
        if (window.showToast) window.showToast('Post deleted.', 'info');
        loadInitialData();
      } catch (err) {
        if (window.showToast) window.showToast('Delete failed: ' + err.message, 'error');
      }
    }
  };

  await loadInitialData();
};



