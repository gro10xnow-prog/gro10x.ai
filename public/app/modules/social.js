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
  let socialBrandsData = [];
  let isLoading = true;
  let hasError = false;
  let activeGeneratedBrief = null;
  let activeViewMode = 'kanban'; // 'kanban' | 'calendar' | 'content_os'
  let currentCalendarDate = new Date();

  // Brand Hub & Content OS State
  let activeBrandSlug = 'grow-bangla';
  let activeBrandSubTab = 'overview'; // 'overview' | 'channel' | 'assets'
  let activeChannelId = null;
  let selectedPlanMonth = new Date().toLocaleString('default', { month: 'long' });
  let selectedPlanYear = new Date().getFullYear();
  let alignAnchorSynergy = true;
  let monthlyFocusNote = '';
  let isGeneratingCalendar = false;
  let isUploadingAnalytics = false;

  const CHANNELS = [
    {
      id: 'grow-bangla',
      name: '🎓 Grow Bangla',
      engine: 'Engine 5',
      subs: '427 subs',
      badgeClass: 'badge-blue',
      defaultPlatform: 'YouTube',
      defaultContentType: 'Short-form Video',
      targetPerWeek: 2,
      categories: ['English Lesson', 'Vocabulary Drop', 'Grammar Hack', 'Pronunciation Tip', 'Motivation', 'Live Q&A']
    },
    {
      id: 'pilutics',
      name: '🗺️ PILUTICS',
      engine: 'Engine 5',
      subs: '218 subs',
      badgeClass: 'badge-emerald',
      defaultPlatform: 'YouTube',
      defaultContentType: 'Long-form Video',
      targetPerWeek: 1,
      categories: ['Geopolitical Analysis', 'Travel Vlog', 'Country Spotlight', 'BD Insight', 'Current Events', 'Documentary']
    },
    {
      id: 'bong-hits',
      name: '🎭 Bong Hits',
      engine: 'Engine 5',
      subs: '85 subs (YT+TikTok)',
      badgeClass: 'badge-pink',
      defaultPlatform: 'TikTok',
      defaultContentType: 'Music Video',
      targetPerWeek: 3,
      categories: ['Music Video', 'Entertainment', 'Humor', 'Trending Sound', 'Cultural Moment', 'Reaction', 'Short Skit']
    },
    {
      id: 'gro10x',
      name: '📢 GRO10X Brand',
      engine: 'Agency Brand',
      subs: 'Official',
      badgeClass: 'badge-amber',
      defaultPlatform: 'LinkedIn',
      defaultContentType: 'PDF / Document',
      targetPerWeek: 2,
      categories: ['AI Tips', 'Agency BTS', 'Case Study', 'DigiVault Promo', 'B2B Hook', 'Executive Framework']
    },
    {
      id: 'client',
      name: '🏢 Client Account',
      engine: 'Client Retainer',
      subs: 'CRM Sync',
      badgeClass: 'badge-gray',
      defaultPlatform: 'Facebook',
      defaultContentType: 'Static Image / Graphic',
      targetPerWeek: 3,
      categories: ['Promo', 'Offer', 'Educational', 'Behind-the-Scenes', 'Testimonial', 'Product Launch']
    }
  ];

  const CONTENT_TYPES = [
    { id: 'Short-form Video', name: '🎬 Short-form Video (≤60s)', icon: '🎬', defaultDuration: '30s' },
    { id: 'Long-form Video', name: '📹 Long-form Video (YouTube)', icon: '📹', defaultDuration: '3 min' },
    { id: 'Music Video', name: '🎵 Music Video (LRC + VEO)', icon: '🎵', defaultDuration: '60s' },
    { id: 'Static Image / Graphic', name: '🖼️ Static Graphic / Image', icon: '🖼️', defaultDuration: null },
    { id: 'Carousel', name: '🎠 Multi-Slide Carousel', icon: '🎠', defaultDuration: null },
    { id: 'PDF / Document', name: '📄 LinkedIn PDF / Document', icon: '📄', defaultDuration: null },
    { id: 'Story', name: '⚡ Story / Ephemeral', icon: '⚡', defaultDuration: '15s' },
    { id: 'Text-only', name: '✍️ Text-only / Thought', icon: '✍️', defaultDuration: null }
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
      const [postsRes, clientsRes, brandsRes] = await Promise.all([
        APP_API.get('/posts').catch(() => []),
        APP_API.get('/clients').catch(() => []),
        APP_API.get('/social-brands').catch(() => ({ brands: [] }))
      ]);
      postsData = Array.isArray(postsRes) ? postsRes : [];
      clientsData = Array.isArray(clientsRes) ? clientsRes : [];
      socialBrandsData = (brandsRes && Array.isArray(brandsRes.brands)) ? brandsRes.brands : [];
      isLoading = false;
      renderContent();
    } catch (err) {
      console.error('[Social Module] Failed to load data:', err);
      isLoading = false;
      postsData = [];
      clientsData = [];
      socialBrandsData = [];
      renderContent();
    }
  }

  function renderSkeleton() {
    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1.5rem; flex-wrap:wrap; gap:1rem;">
        <div>
          <div style="display:flex; align-items:center; gap:0.6rem;">
            <h1 style="font-size: 1.6rem; font-weight: 800; font-family: var(--font-heading); margin: 0;">
              📱 Social Media Planner & Content OS
            </h1>
            <span class="badge badge-purple" style="font-size:0.75rem; font-weight:800;">
              Engine 5 Command Center
            </span>
          </div>
          <div style="font-size: 0.88rem; color: var(--text-muted); margin-top:0.25rem;">
            Brand-driven multi-channel architecture with persistent analytics memory, monthly strategy locking & VEO 3 studio.
          </div>
        </div>
        <div style="display:flex; gap:0.6rem; align-items:center; flex-wrap:wrap;">
          <!-- 3-Way Top View Switcher -->
          <div style="display:flex; background:rgba(255,255,255,0.06); border:1px solid var(--border-subtle); border-radius:10px; padding:3px; gap:2px;">
            <button class="btn-ghost btn-sm" id="btnViewKanban" style="font-size:0.8rem; font-weight:800; padding:0.35rem 0.75rem; border-radius:8px; ${activeViewMode === 'kanban' ? 'background:rgba(255,255,255,0.15); color:#fff;' : 'color:var(--text-muted);'}" onclick="window.SOCIAL_MODULE.switchView('kanban')">📋 Kanban</button>
            <button class="btn-ghost btn-sm" id="btnViewCalendar" style="font-size:0.8rem; font-weight:800; padding:0.35rem 0.75rem; border-radius:8px; ${activeViewMode === 'calendar' ? 'background:rgba(255,255,255,0.15); color:#fff;' : 'color:var(--text-muted);'}" onclick="window.SOCIAL_MODULE.switchView('calendar')">📅 Calendar</button>
            <button class="btn-ghost btn-sm" id="btnViewContentOS" style="font-size:0.8rem; font-weight:800; padding:0.35rem 0.75rem; border-radius:8px; ${activeViewMode === 'content_os' ? 'background:linear-gradient(135deg, rgba(168,85,247,0.35), rgba(99,102,241,0.35)); color:#fff; border:1px solid #a855f7;' : 'color:var(--text-muted);'}" onclick="window.SOCIAL_MODULE.switchView('content_os')">🏛️ Content OS & Brand Hub</button>
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

      <!-- Filter Section (Visible in Kanban and Calendar views) -->
      <div id="socialFiltersSection" style="background:rgba(255,255,255,0.02); border:1px solid var(--border-subtle); border-radius:14px; padding:0.9rem 1.2rem; margin-bottom:1.5rem; display:flex; flex-direction:column; gap:0.75rem;">
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
        <div class="modal-box" style="max-width: 680px; max-height: 92vh; overflow-y:auto;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1rem; border-bottom:1px solid var(--border-subtle); padding-bottom:0.8rem;">
            <div>
              <h2 style="color:#fff; font-size:1.25rem; margin:0; font-family:var(--font-heading);" id="postModalTitle">📱 Draft New Social Post</h2>
              <div style="font-size:0.78rem; color:var(--text-muted); margin-top:0.2rem;">AI-assisted content creation with VEO 3 Prompts & Format Blueprints.</div>
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

            <!-- Row 2: Platform, Content Type & Target Duration -->
            <div style="display:grid; grid-template-columns:1.2fr 1.3fr 1.1fr; gap:0.9rem;">
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
                <label class="form-label">Content Type *</label>
                <select id="spContentType" class="input-text" onchange="window.SOCIAL_MODULE.onContentTypeChange(this.value)">
                  ${CONTENT_TYPES.map(ct => `<option value="${escapeHTML(ct.id)}">${escapeHTML(ct.name)}</option>`).join('')}
                </select>
              </div>

              <div class="form-group" id="spDurationGroup">
                <label class="form-label">Video Target Duration</label>
                <select id="spTargetDuration" class="input-text">
                  <option value="30s">30s (3 × 10s VEO)</option>
                  <option value="60s" selected>60s (6 × 10s VEO)</option>
                  <option value="90s">90s (9 × 10s VEO)</option>
                  <option value="2 min">2 min (12 × 10s VEO)</option>
                  <option value="3 min">3 min (18 × 10s VEO)</option>
                </select>
              </div>
            </div>

            <!-- Bong Hits Music Video Studio Box (Shown when Bong Hits / Music Video is active) -->
            <div id="spMusicVideoStudioBox" style="display:none; background:rgba(236,72,153,0.06); border:1px solid rgba(236,72,153,0.3); border-radius:12px; padding:1rem; flex-direction:column; gap:0.75rem;">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <div style="font-size:0.82rem; font-weight:800; color:#f472b6;">
                  🎵 Bong Hits Music Video & LRC Lip-Sync Studio
                </div>
                <span class="badge badge-pink" style="font-size:0.68rem;">Suno & CapCut Workflow</span>
              </div>
              <div style="font-size:0.75rem; color:var(--text-muted);">
                Generate exact timestamped <code>.lrc</code> lyric captions for CapCut + 10-second beat-synced VEO 3 scene prompts.
              </div>
              <div style="display:grid; grid-template-columns:2fr 1fr; gap:0.6rem;">
                <input type="text" id="mvTrackTitle" class="input-text" placeholder="Track / Song Title (e.g. Bong Hits Beats #1)">
                <input type="text" id="mvGenre" class="input-text" placeholder="Genre (e.g. Bengali Folk Rock)">
              </div>
              <textarea id="mvLyrics" class="input-text" rows="3" placeholder="Paste Suno song lyrics here (or leave blank to auto-generate from topic)..."></textarea>
              <div style="display:flex; justify-content:flex-end;">
                <button type="button" class="btn-primary btn-sm" id="btnGenMusicLrc" style="background:linear-gradient(135deg, #ec4899, #8b5cf6); border:none;" onclick="window.SOCIAL_MODULE.generateMusicLrc()">
                  ✨ Generate LRC Timestamps & VEO Scenes
                </button>
              </div>
              <div id="mvMusicResultContainer" style="display:none; flex-direction:column; gap:0.6rem; margin-top:0.4rem;">
                <!-- Populated on LRC generation -->
              </div>
            </div>

            <!-- Row 3: Scheduled Date & Time -->
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.9rem;">
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
                  ✨ Generate AI Brief & Prompts
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

            <!-- Hashtags -->
            <div class="form-group">
              <label class="form-label">Hashtags</label>
              <input type="text" id="spHashtags" class="input-text" placeholder="#GRO10X #VideoScale #Automation">
            </div>

            <!-- Media Upload & Asset Zone -->
            <div class="form-group">
              <label class="form-label">Media Asset (Image, Video, Audio, PDF)</label>
              <div id="spMediaDropzone" style="border:2px dashed var(--border-subtle); border-radius:10px; padding:1rem; text-align:center; background:rgba(0,0,0,0.25); cursor:pointer; transition:border-color 0.2s ease;">
                <input type="file" id="spMediaFileInput" style="display:none;" accept="image/*,video/*,audio/*,application/pdf" onchange="window.SOCIAL_MODULE.handleMediaFileUpload(this)">
                <div id="spMediaUploadPrompt" onclick="document.getElementById('spMediaFileInput').click()">
                  <div style="font-size:1.5rem; margin-bottom:0.2rem;">📁</div>
                  <div style="font-weight:700; font-size:0.85rem; color:#fff;">Drag & drop or click to upload file</div>
                  <div style="font-size:0.72rem; color:var(--text-dim); margin-top:0.15rem;">Supports JPG, PNG, MP4, MP3, WAV, PDF (up to 50MB)</div>
                </div>
                <div id="spMediaUploadPreview" style="display:none; align-items:center; justify-content:space-between; gap:0.75rem; background:rgba(255,255,255,0.04); border-radius:8px; padding:0.5rem 0.75rem;">
                  <!-- Dynamic preview thumbnail & remove button -->
                </div>
              </div>
              <input type="hidden" id="spMediaUrl" value="">
              <div style="margin-top:0.4rem; display:flex; justify-content:space-between; align-items:center;">
                <a href="javascript:void(0)" onclick="window.SOCIAL_MODULE.toggleDirectMediaUrl()" style="font-size:0.72rem; color:var(--purple-light); text-decoration:none;">🔗 Or paste direct CDN/Cloudinary URL</a>
              </div>
              <div id="spDirectMediaUrlWrap" style="display:none; margin-top:0.4rem;">
                <input type="url" id="spDirectMediaUrl" class="input-text" placeholder="https://res.cloudinary.com/..." oninput="document.getElementById('spMediaUrl').value = this.value">
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

  // State for Content Calendar AI Planner
  let plannerSelectedChannels = ['grow-bangla', 'pilutics', 'bong-hits', 'gro10x'];
  let plannerMonth = new Date().toLocaleString('default', { month: 'long' });
  let plannerYear = new Date().getFullYear();
  let plannerMix = { educational: 40, entertainment: 30, promo: 20, bts: 10 };
  let plannerAnalytics = null;
  let plannerGeneratedPlan = [];
  let plannerSelectedRows = new Set();
  let isPlannerLoading = false;
  let isCsvParsing = false;
  let activeLrcData = null;

  function renderContent() {
    renderKPIs();
    const filterSection = document.getElementById('socialFiltersSection');

    if (activeViewMode === 'content_os') {
      if (filterSection) filterSection.style.display = 'none';
      renderContentOS();
    } else if (activeViewMode === 'calendar') {
      if (filterSection) filterSection.style.display = 'flex';
      renderCalendar();
    } else {
      if (filterSection) filterSection.style.display = 'flex';
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

    let dayCellsHtml = '';

    for (let i = 0; i < totalCells; i++) {
      let dayNumber;
      let dateString;
      let isCurrentMonthCell = false;
      let isTodayCell = false;

      if (i < firstDayIndex) {
        dayNumber = prevLastDate - firstDayIndex + i + 1;
        const prevMonth = month === 0 ? 11 : month - 1;
        const prevYear = month === 0 ? year - 1 : year;
        dateString = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
      } else if (i < firstDayIndex + lastDate) {
        dayNumber = i - firstDayIndex + 1;
        isCurrentMonthCell = true;
        dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
        if (isCurrentMonth && today.getDate() === dayNumber) isTodayCell = true;
      } else {
        dayNumber = i - (firstDayIndex + lastDate) + 1;
        const nextMonth = month === 11 ? 0 : month + 1;
        const nextYear = month === 11 ? year + 1 : year;
        dateString = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
      }

      const dayPosts = filteredPosts.filter(p => p.scheduledDate === dateString);

      dayCellsHtml += `
        <div class="calendar-day-cell" style="background:${isCurrentMonthCell ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.2)'}; border:1px solid ${isTodayCell ? '#10b981' : 'var(--border-subtle)'}; border-radius:10px; padding:0.6rem; min-height:115px; display:flex; flex-direction:column; gap:0.4rem; cursor:pointer; position:relative; transition:border-color 0.15s ease;" onclick="window.SOCIAL_MODULE.openPostModalWithDate('${dateString}')">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:0.82rem; font-weight:${isTodayCell ? '900' : '700'}; color:${isTodayCell ? '#10b981' : (isCurrentMonthCell ? 'var(--text-primary)' : 'var(--text-dim)')};">
              ${dayNumber} ${isTodayCell ? '· Today' : ''}
            </span>
            ${dayPosts.length > 0 ? `<span class="badge badge-purple" style="font-size:0.62rem; padding:0.1rem 0.35rem;">${dayPosts.length}</span>` : ''}
          </div>

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

    const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    const monthPosts = postsData.filter(p => (p.scheduledDate || '').startsWith(monthPrefix));

    const cadenceStatsHtml = CHANNELS.map(ch => {
      const count = monthPosts.filter(p => {
        const pChan = (p.channel || '').toLowerCase();
        return pChan.includes(ch.id) || pChan.includes(ch.name.toLowerCase()) || (ch.id === 'client' && pChan.includes('client'));
      }).length;

      const target = ch.targetPerWeek * 4;
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

        <div style="display:grid; grid-template-columns:repeat(7, 1fr); gap:0.6rem; text-align:center; font-weight:800; font-size:0.78rem; color:var(--text-muted); text-transform:uppercase;">
          <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
        </div>

        <div style="display:grid; grid-template-columns:repeat(7, 1fr); gap:0.6rem;">
          ${dayCellsHtml}
        </div>

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

  // ─────────────────────────────────────────────────────────────────────────────
  // 3RD VIEW: CONTENT OS & BRAND HUB (Multi-Channel Hierarchy, Memory & Locking)
  // ─────────────────────────────────────────────────────────────────────────────
  function renderContentOS() {
    const board = document.getElementById('socialBoardContainer');
    if (!board) return;

    const brand = (socialBrandsData || []).find(b => b.slug === activeBrandSlug || b.id === activeBrandSlug) || socialBrandsData[0] || {
      name: 'Grow Bangla',
      slug: 'grow-bangla',
      tagline: 'Bridging Career, Language & Professional Growth for Bangladesh',
      niche: 'Spoken English & Career Preparation',
      channels: []
    };

    const currentChannel = (brand.channels || []).find(c => c.id === activeChannelId || c.slug === activeChannelId) || null;

    board.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:1.3rem;">
        
        <!-- Brand Header with Brand Switcher Tabs -->
        <div style="background:var(--surface-card, #14141e); border:1px solid var(--border-subtle); border-radius:14px; padding:1rem 1.25rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.9rem;">
          <div style="display:flex; align-items:center; gap:0.8rem;">
            <div style="font-size:1.8rem;">🏛️</div>
            <div>
              <div style="display:flex; align-items:center; gap:0.6rem;">
                <h2 style="margin:0; font-size:1.3rem; font-family:var(--font-heading); color:#fff;">
                  ${escapeHTML(brand.name)}
                </h2>
                <span class="badge badge-purple" style="font-size:0.72rem; font-weight:800;">${(brand.channels || []).length} Channels Active</span>
              </div>
              <div style="font-size:0.78rem; color:var(--text-muted); margin-top:0.2rem;">
                ${escapeHTML(brand.tagline || brand.niche || 'Digital Brand Content Command')}
              </div>
            </div>
          </div>

          <!-- Brand Switcher Pills -->
          <div style="display:flex; gap:0.4rem; align-items:center; flex-wrap:wrap;">
            ${(socialBrandsData || []).map(b => `
              <button type="button" class="r-pill ${b.slug === activeBrandSlug ? 'active' : ''}" style="font-size:0.76rem; padding:0.35rem 0.75rem;" onclick="window.SOCIAL_MODULE.switchBrand('${b.slug}')">
                ${escapeHTML(b.name)}
              </button>
            `).join('')}
            <button type="button" class="btn-ghost btn-sm" style="font-size:0.75rem; color:var(--purple-light);" onclick="window.SOCIAL_MODULE.promptAddBrand()">+ New Brand</button>
          </div>
        </div>

        <!-- Sub-Nav Switcher: Overview Matrix vs Channels vs Brand Kit -->
        <div style="display:flex; background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); border-radius:12px; padding:0.4rem; gap:0.4rem; flex-wrap:wrap; align-items:center;">
          <button type="button" class="btn-ghost btn-sm" style="font-size:0.78rem; font-weight:800; border-radius:8px; ${activeBrandSubTab === 'overview' ? 'background:rgba(255,255,255,0.15); color:#fff;' : 'color:var(--text-muted);'}" onclick="window.SOCIAL_MODULE.switchBrandSubTab('overview')">
            📊 Cross-Channel Matrix (Brand Overview)
          </button>
          <button type="button" class="btn-ghost btn-sm" style="font-size:0.78rem; font-weight:800; border-radius:8px; ${activeBrandSubTab === 'assets' ? 'background:rgba(255,255,255,0.15); color:#fff;' : 'color:var(--text-muted);'}" onclick="window.SOCIAL_MODULE.switchBrandSubTab('assets')">
            🎨 Brand Identity & Asset Kit
          </button>
          
          <div style="height:20px; width:1px; background:rgba(255,255,255,0.1); margin:0 0.3rem;"></div>
          
          <span style="font-size:0.7rem; color:var(--text-dim); text-transform:uppercase; font-weight:800;">Channels:</span>
          ${(brand.channels || []).map(ch => {
            const isSelected = activeBrandSubTab === 'channel' && (activeChannelId === ch.id || activeChannelId === ch.slug);
            const icon = PLATFORM_ICONS[ch.platform] || '📱';
            return `
              <button type="button" class="btn-ghost btn-sm" style="font-size:0.76rem; border-radius:8px; display:flex; align-items:center; gap:0.35rem; ${isSelected ? 'background:linear-gradient(135deg, rgba(168,85,247,0.35), rgba(99,102,241,0.35)); color:#fff; border:1px solid #a855f7;' : 'color:var(--text-muted);'}" onclick="window.SOCIAL_MODULE.openChannelWorkspace('${ch.id}')">
                <span>${icon}</span>
                <span>${escapeHTML(ch.name.replace('Channel','').replace('Page','').trim())}</span>
                ${ch.isAnchor ? `<span style="font-size:0.6rem; color:#10b981; font-weight:900;">⚓</span>` : ''}
              </button>
            `;
          }).join('')}
          <button type="button" class="btn-ghost btn-sm" style="font-size:0.72rem; color:var(--text-dim);" onclick="window.SOCIAL_MODULE.promptAddChannel()">+ Add Channel</button>
        </div>

        <!-- Dynamic Body Area based on activeBrandSubTab -->
        <div id="brandSubTabBodyContainer">
          ${activeBrandSubTab === 'overview' ? renderBrandOverviewMatrixHTML(brand) : (activeBrandSubTab === 'assets' ? renderBrandAssetsKitHTML(brand) : renderChannelWorkspaceHTML(brand, currentChannel))}
        </div>

      </div>
    `;
  }

  function renderBrandOverviewMatrixHTML(brand) {
    const currentMonthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const currentMonthName = new Date().toLocaleString('default', { month: 'long' });

    let totalAudience = 0;
    (brand.channels || []).forEach(c => totalAudience += (c.audienceCount || 0));

    return `
      <div style="display:flex; flex-direction:column; gap:1.3rem;">
        
        <!-- Cross-Channel Quick Metrics -->
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:1rem;">
          <div style="background:var(--surface-card, #14141e); border:1px solid var(--border-subtle); border-radius:12px; padding:1rem; display:flex; flex-direction:column; gap:0.25rem;">
            <span style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; font-weight:800;">Total Cross-Channel Audience</span>
            <span style="font-size:1.6rem; font-weight:900; color:#fff;">${totalAudience.toLocaleString()} <span style="font-size:0.85rem; color:var(--text-dim);">Subs / Followers</span></span>
            <span style="font-size:0.72rem; color:#10b981;">Across ${(brand.channels || []).length} connected touchpoints</span>
          </div>

          <div style="background:var(--surface-card, #14141e); border:1px solid var(--border-subtle); border-radius:12px; padding:1rem; display:flex; flex-direction:column; gap:0.25rem;">
            <span style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; font-weight:800;">Current Month Target (${currentMonthName})</span>
            <span style="font-size:1.6rem; font-weight:900; color:#c084fc;">${(brand.channels || []).reduce((acc, c) => acc + (c.targetCadencePerWeek || 3) * 4, 0)} <span style="font-size:0.85rem; color:var(--text-dim);">Posts Output</span></span>
            <span style="font-size:0.72rem; color:var(--text-secondary);">Cadence calculated from channel targets</span>
          </div>

          <div style="background:var(--surface-card, #14141e); border:1px solid var(--border-subtle); border-radius:12px; padding:1rem; display:flex; flex-direction:column; gap:0.25rem;">
            <span style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; font-weight:800;">Analytics Knowledge Memory</span>
            <span style="font-size:1.6rem; font-weight:900; color:#34d399;">${(brand.channels || []).filter(c => c.analyticsKnowledgeBase).length} / ${(brand.channels || []).length} <span style="font-size:0.85rem; color:var(--text-dim);">Indexed</span></span>
            <span style="font-size:0.72rem; color:var(--text-dim);">Proven retention & velocity signals</span>
          </div>
        </div>

        <!-- Channel Status Matrix Cards -->
        <div style="background:var(--surface-card, #14141e); border:1px solid var(--border-subtle); border-radius:14px; padding:1.25rem; display:flex; flex-direction:column; gap:1rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-subtle); padding-bottom:0.7rem;">
            <div>
              <h3 style="margin:0; font-size:1.05rem; color:#fff; font-family:var(--font-heading);">
                📡 Channel Status & Monthly Locking Matrix (${currentMonthName} ${new Date().getFullYear()})
              </h3>
              <div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.2rem;">
                Select a channel below to upload analytics CSVs, generate 100% automated strategic calendars with reasoning, and lock into Kanban.
              </div>
            </div>
            <button type="button" class="btn-emerald btn-sm" onclick="window.SOCIAL_MODULE.openChannelWorkspace(((brand.channels && brand.channels[0] && brand.channels[0].id) || ''))">
              🚀 Open Anchor Channel
            </button>
          </div>

          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(300px, 1fr)); gap:1rem;">
            ${(brand.channels || []).map(ch => {
              const icon = PLATFORM_ICONS[ch.platform] || '📱';
              const kb = ch.analyticsKnowledgeBase;
              const cal = ch.calendars && ch.calendars[currentMonthKey];
              const isLocked = cal && cal.status === 'Locked';
              const isDraft = cal && cal.status === 'Draft';

              return `
                <div style="background:rgba(255,255,255,0.02); border:1px solid ${isLocked ? 'rgba(16,185,129,0.4)' : 'var(--border-subtle)'}; border-radius:12px; padding:1rem; display:flex; flex-direction:column; gap:0.75rem; position:relative;">
                  
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div style="display:flex; align-items:center; gap:0.5rem;">
                      <span style="font-size:1.3rem;">${icon}</span>
                      <div>
                        <div style="font-weight:800; color:#fff; font-size:0.92rem; display:flex; align-items:center; gap:0.4rem;">
                          ${escapeHTML(ch.name)}
                          ${ch.isAnchor ? `<span class="badge badge-emerald" style="font-size:0.6rem; padding:0 0.35rem;">Anchor Channel</span>` : ''}
                        </div>
                        <div style="font-size:0.72rem; color:var(--text-dim);">${escapeHTML(ch.handle || ch.platform)}</div>
                      </div>
                    </div>
                    <span class="badge ${isLocked ? 'badge-emerald' : (isDraft ? 'badge-purple' : 'badge-gray')}" style="font-size:0.68rem; font-weight:800;">
                      ${isLocked ? '🔒 Locked (' + (cal.planItems || []).length + ' Posts)' : (isDraft ? '📝 Draft Ready' : '⏳ Needs Plan')}
                    </span>
                  </div>

                  <!-- Audience & Knowledge Base Indicator -->
                  <div style="background:rgba(0,0,0,0.25); border-radius:8px; padding:0.6rem 0.75rem; font-size:0.72rem; display:flex; flex-direction:column; gap:0.3rem;">
                    <div style="display:flex; justify-content:space-between;">
                      <span style="color:var(--text-muted);">Audience:</span>
                      <strong style="color:#fff;">${escapeHTML(ch.audienceLabel || (ch.audienceCount + ' Subscribers'))}</strong>
                    </div>
                    <div style="display:flex; justify-content:space-between;">
                      <span style="color:var(--text-muted);">Analytics Memory:</span>
                      <span style="color:${kb ? '#34d399' : '#f59e0b'}; font-weight:700;">
                        ${kb ? '🟢 ' + (kb.totalVideosIndexed || 0) + ' items (' + (kb.totalViews || 0).toLocaleString() + ' views)' : '🟡 Needs Data Upload'}
                      </span>
                    </div>
                    ${kb && kb.topCategories ? `
                      <div style="color:var(--text-dim); margin-top:0.2rem;">
                        <strong>Pillars:</strong> ${(kb.topCategories || []).slice(0, 2).join(', ')}
                      </div>
                    ` : ''}
                  </div>

                  <!-- Quick Action Button -->
                  <div style="display:flex; gap:0.5rem; align-items:center; margin-top:auto;">
                    <button type="button" class="btn-secondary btn-sm" style="flex:1; font-size:0.74rem;" onclick="window.SOCIAL_MODULE.openChannelWorkspace('${ch.id}')">
                      ⚡ Open Strategy & Data Workspace →
                    </button>
                  </div>

                </div>
              `;
            }).join('')}
          </div>
        </div>

      </div>
    `;
  }

  function renderChannelWorkspaceHTML(brand, channel) {
    if (!channel) {
      return `<div style="padding:3rem; text-align:center; color:var(--text-muted);">Channel not found. Please select an active channel from the bar above.</div>`;
    }

    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthIndex = months.indexOf(selectedPlanMonth);
    const monthNumStr = String(monthIndex >= 0 ? monthIndex + 1 : 10).padStart(2, '0');
    const currentMonthKey = `${selectedPlanYear}-${monthNumStr}`;
    
    const currDate = new Date();
    const isPastMonth = selectedPlanYear < currDate.getFullYear() || (selectedPlanYear === currDate.getFullYear() && monthIndex < currDate.getMonth());

    const kb = channel.analyticsKnowledgeBase;
    const currentCal = channel.calendars && channel.calendars[currentMonthKey];
    const isLocked = currentCal && currentCal.status === 'Locked';
    const planItems = (currentCal && currentCal.planItems) || [];

    return `
      <div style="display:flex; flex-direction:column; gap:1.3rem;">
        
        <!-- Channel Top Banner -->
        <div style="background:var(--surface-card, #14141e); border:1px solid var(--border-subtle); border-radius:14px; padding:1rem 1.25rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.8rem;">
          <div style="display:flex; align-items:center; gap:0.6rem;">
            <button type="button" class="btn-ghost btn-sm" style="padding:0.2rem 0.5rem;" onclick="window.SOCIAL_MODULE.switchBrandSubTab('overview')">← Brand Overview</button>
            <span style="font-size:1.4rem;">${PLATFORM_ICONS[channel.platform] || '📱'}</span>
            <div>
              <div style="font-weight:800; font-size:1.15rem; color:#fff; display:flex; align-items:center; gap:0.5rem;">
                ${escapeHTML(channel.name)}
                ${channel.isAnchor ? `<span class="badge badge-emerald">Anchor Pillar</span>` : ''}
              </div>
              <div style="font-size:0.72rem; color:var(--text-dim);">${escapeHTML(channel.handle || channel.url || channel.platform)} · Target: ${channel.targetCadencePerWeek}× / week</div>
            </div>
          </div>

          <div style="display:flex; gap:0.6rem; align-items:center;">
            <span class="badge ${isLocked ? 'badge-emerald' : (isPastMonth ? 'badge-gray' : 'badge-purple')}" style="font-size:0.75rem; font-weight:800;">
              ${isLocked ? '🔒 ' + selectedPlanMonth + ' Locked & In Pipeline' : (isPastMonth ? '📁 ' + selectedPlanMonth + ' Archived (Read-Only)' : '✨ ' + selectedPlanMonth + ' Active Planning')}
            </span>
          </div>
        </div>

        <!-- Section 1: Channel Analytics Memory & Ingestion Dropzone -->
        <div style="background:var(--surface-card, #14141e); border:1px solid var(--border-subtle); border-radius:14px; padding:1.25rem; display:flex; flex-direction:column; gap:1rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-subtle); padding-bottom:0.6rem; flex-wrap:wrap; gap:0.5rem;">
            <div style="font-weight:800; font-size:0.95rem; color:#fff; display:flex; align-items:center; gap:0.5rem;">
              <span>📊</span> Channel Analytics Memory & Audience Signals (Persistent Knowledge Base)
            </div>
            <div style="display:flex; gap:0.5rem;">
              <button type="button" class="btn-secondary btn-sm" style="font-size:0.72rem;" onclick="document.getElementById('channelCsvFileInput').click()">
                📈 Upload Analytics CSV
              </button>
              <button type="button" class="btn-secondary btn-sm" style="font-size:0.72rem;" onclick="window.SOCIAL_MODULE.openCommunitySnapshotModal()">
                📝 Log Metrics Snapshot
              </button>
            </div>
          </div>

          <input type="file" id="channelCsvFileInput" style="display:none;" accept=".csv,text/csv" onchange="window.SOCIAL_MODULE.handleChannelCsvUpload(this, '${brand.slug}', '${channel.id}')">

          <!-- Knowledge Base Content Display -->
          ${kb ? `
            <div style="background:rgba(16,185,129,0.04); border:1px solid rgba(16,185,129,0.25); border-radius:12px; padding:1rem; display:flex; flex-direction:column; gap:0.75rem;">
              <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
                <div style="display:flex; align-items:center; gap:0.6rem;">
                  <span class="badge badge-emerald" style="font-weight:800; font-size:0.72rem;">✅ Verified Knowledge Indexed</span>
                  <span style="font-size:0.72rem; color:var(--text-dim);">Source: ${escapeHTML(kb.source || 'CSV Export')} · Updated: ${new Date(kb.lastUpdated || Date.now()).toLocaleDateString()}</span>
                </div>
                <span style="font-size:0.75rem; font-weight:800; color:#34d399;">${(kb.totalVideosIndexed || 0)} Content Items · ${(kb.totalViews || 0).toLocaleString()} Views</span>
              </div>

              <!-- Top Content Pillars -->
              ${Array.isArray(kb.topCategories) && kb.topCategories.length > 0 ? `
                <div style="display:flex; gap:0.4rem; flex-wrap:wrap; align-items:center;">
                  <span style="font-size:0.7rem; color:var(--text-muted); font-weight:800;">High-Velocity Pillars:</span>
                  ${kb.topCategories.map(c => `<span class="badge badge-blue" style="font-size:0.68rem;">${escapeHTML(c)}</span>`).join('')}
                </div>
              ` : ''}

              <!-- Top Performing Content List (if available) -->
              ${Array.isArray(kb.topPerformers) && kb.topPerformers.length > 0 ? `
                <div style="display:flex; flex-direction:column; gap:0.35rem; margin-top:0.2rem;">
                  <span style="font-size:0.72rem; font-weight:800; color:#fff;">🏆 Top Lifetime Converting Content:</span>
                  <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:0.5rem;">
                    ${kb.topPerformers.slice(0, 3).map(p => `
                      <div style="background:rgba(0,0,0,0.3); border-radius:6px; padding:0.4rem 0.6rem; border:1px solid rgba(255,255,255,0.05); font-size:0.7rem; line-height:1.35;">
                        <div style="color:#fff; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHTML(p.title)}</div>
                        <div style="color:#a7f3d0; margin-top:0.15rem;">${(p.views || 0).toLocaleString()} Views · ${p.subs || 0} Subs · ${p.ctr ? p.ctr + '% CTR' : ''}</div>
                      </div>
                    `).join('')}
                  </div>
                </div>
              ` : ''}

              <!-- AI Recommendations List -->
              ${Array.isArray(kb.recommendations) && kb.recommendations.length > 0 ? `
                <div style="font-size:0.72rem; color:var(--text-secondary); margin-top:0.2rem;">
                  <ul style="margin:0; padding-left:1.1rem; line-height:1.45;">
                    ${kb.recommendations.map(r => `<li>${escapeHTML(r)}</li>`).join('')}
                  </ul>
                </div>
              ` : ''}
            </div>
          ` : `
            <div style="border:2px dashed var(--border-subtle); border-radius:12px; padding:1.5rem 1rem; text-align:center; background:rgba(0,0,0,0.25); cursor:pointer;" onclick="document.getElementById('channelCsvFileInput').click()">
              <div style="font-size:1.8rem; margin-bottom:0.3rem;">📈</div>
              <div style="font-weight:700; font-size:0.88rem; color:#fff;">Upload ${escapeHTML(channel.name)} Analytics Data</div>
              <div style="font-size:0.74rem; color:var(--text-dim); margin-top:0.2rem;">
                Upload YouTube Studio CSV, Meta Suite CSV, TikTok export, or log Community metrics to set permanent memory for AI calendar strategy.
              </div>
            </div>
          `}
        </div>

        <!-- Section 2: Monthly Content Calendar Strategy & Locking Engine -->
        <div style="background:var(--surface-card, #14141e); border:1px solid var(--border-subtle); border-radius:14px; padding:1.25rem; display:flex; flex-direction:column; gap:1.1rem;">
          
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-subtle); padding-bottom:0.8rem; flex-wrap:wrap; gap:0.8rem;">
            <div>
              <h3 style="margin:0; font-size:1.05rem; color:#fff; font-family:var(--font-heading);">
                🗓️ Monthly Strategic Production Blueprint (${selectedPlanMonth} ${selectedPlanYear})
              </h3>
              <div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.2rem;">
                100% automated AI strategy with per-post Strategic Rationale. Lock the month to freeze and auto-create active pipeline drafts.
              </div>
            </div>

            <!-- Month & Year Selector -->
            <div style="display:flex; gap:0.5rem; align-items:center; flex-wrap:wrap;">
              <select class="input-text" style="padding:0.35rem 0.6rem; font-size:0.78rem;" onchange="window.SOCIAL_MODULE.changePlanMonth(this.value)">
                ${months.map(m => `<option value="${m}" ${m === selectedPlanMonth ? 'selected' : ''}>${m}</option>`).join('')}
              </select>
              <input type="number" class="input-text" style="width:75px; padding:0.35rem 0.6rem; font-size:0.78rem;" value="${selectedPlanYear}" oninput="window.SOCIAL_MODULE.changePlanYear(this.value)">
            </div>
          </div>

          <!-- Strategy Configuration Bar (if not locked and not archived) -->
          ${!isLocked && !isPastMonth ? `
            <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); border-radius:10px; padding:0.85rem 1rem; display:grid; grid-template-columns:1.5fr 1fr auto; gap:0.8rem; align-items:center;">
              
              <!-- Focus / Campaign Note -->
              <div>
                <label class="form-label" style="margin-bottom:0.2rem;">🎯 Optional Monthly Focus / Theme</label>
                <input type="text" id="inpMonthlyFocusNote" class="input-text" placeholder="e.g. Fresher interview prep & global job skill series..." value="${escapeHTML(monthlyFocusNote)}" oninput="monthlyFocusNote = this.value">
              </div>

              <!-- Anchor Synergy Toggle (if channel is not the anchor) -->
              <div>
                ${!channel.isAnchor ? `
                  <label class="form-label" style="margin-bottom:0.2rem;">🔗 Anchor Channel Synergy</label>
                  <label style="display:flex; align-items:center; gap:0.4rem; font-size:0.75rem; color:#fff; cursor:pointer; margin-top:0.35rem;">
                    <input type="checkbox" style="accent-color:#10b981; width:16px; height:16px;" ${alignAnchorSynergy ? 'checked' : ''} onchange="alignAnchorSynergy = this.checked">
                    Align with Anchor YouTube Pillars
                  </label>
                ` : `
                  <label class="form-label" style="margin-bottom:0.2rem;">⚓ Anchor Channel</label>
                  <div style="font-size:0.72rem; color:#34d399; margin-top:0.35rem;">Core Pillar Origin for other channels</div>
                `}
              </div>

              <!-- Run AI Generation Button -->
              <div>
                <button type="button" class="btn-primary" id="btnRunChannelGen" style="padding:0.6rem 1rem; font-size:0.85rem; font-weight:800; background:linear-gradient(135deg, #a855f7, #6366f1); border:none;" onclick="window.SOCIAL_MODULE.generateChannelCalendarPlan('${brand.slug}', '${channel.id}')">
                  ${isGeneratingCalendar ? '⏳ AI Strategizing...' : '✨ Generate ' + selectedPlanMonth + ' Strategy'}
                </button>
              </div>

            </div>
          ` : ''}

          <!-- Strategic Summary Banner (if plan exists) -->
          ${currentCal ? `
            <div style="background:rgba(168,85,247,0.06); border:1px solid rgba(168,85,247,0.25); border-radius:10px; padding:0.85rem 1rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.6rem;">
              <div>
                <div style="font-weight:800; font-size:0.82rem; color:#d8b4fe;">💡 Strategy Thesis: ${escapeHTML(currentCal.theme || selectedPlanMonth + ' Blueprint')}</div>
                <div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.15rem;">${escapeHTML(currentCal.strategicSummary || '')}</div>
              </div>

              <!-- Lock / Pipeline Action Button -->
              ${!isLocked && !isPastMonth ? `
                <button type="button" class="btn-emerald btn-sm" style="font-weight:800; padding:0.4rem 0.9rem;" onclick="window.SOCIAL_MODULE.lockChannelCalendar('${brand.slug}', '${channel.id}', '${currentMonthKey}')">
                  🔒 Lock & Push to Pipeline (${planItems.length} Drafts)
                </button>
              ` : (isLocked ? `
                <div style="display:flex; align-items:center; gap:0.5rem;">
                  <span class="badge badge-emerald" style="font-weight:800; font-size:0.75rem;">🔒 Locked by ${escapeHTML(currentCal.lockedBy || 'Admin')}</span>
                  <button type="button" class="btn-secondary btn-sm" style="font-size:0.72rem;" onclick="window.SOCIAL_MODULE.switchView('kanban')">View in Kanban Pipeline →</button>
                </div>
              ` : `
                <span class="badge badge-gray" style="font-size:0.75rem;">📁 Read-Only Archive</span>
              `)}
            </div>
          ` : ''}

          <!-- Blueprint Plan Items Table -->
          <div style="display:flex; flex-direction:column; gap:0.65rem;">
            ${planItems.length === 0 ? `
              <div style="text-align:center; padding:3.5rem 1rem; color:var(--text-dim); border:1px dashed var(--border-subtle); border-radius:12px;">
                <div style="font-size:2.2rem; margin-bottom:0.4rem;">🗓️</div>
                <div style="font-weight:700; color:#fff; font-size:0.95rem;">No Content Calendar Generated for ${selectedPlanMonth} ${selectedPlanYear}</div>
                <div style="font-size:0.78rem; color:var(--text-muted); margin-top:0.2rem; max-width:480px; margin-left:auto; margin-right:auto;">
                  ${isPastMonth ? 'This month is in the past and has no recorded calendar archive.' : 'Click <strong>"Generate ' + selectedPlanMonth + ' Strategy"</strong> to auto-build a verified 4-week production plan grounded in audience demand.'}
                </div>
              </div>
            ` : planItems.map((item, idx) => {
              const icon = PLATFORM_ICONS[channel.platform] || '📱';
              return `
                <div style="background:rgba(255,255,255,0.02); border:1px solid var(--border-subtle); border-radius:10px; padding:0.9rem 1rem; display:grid; grid-template-columns:1fr 2.5fr 1fr auto; gap:0.9rem; align-items:center;">
                  
                  <!-- Timing & Channel Badges -->
                  <div style="display:flex; flex-direction:column; gap:0.25rem;">
                    <div style="display:flex; gap:0.35rem; align-items:center;">
                      <span class="badge badge-purple" style="font-size:0.68rem; font-weight:800;">${escapeHTML(item.week)} · ${escapeHTML(item.dayOfWeek)}</span>
                      <span style="font-size:0.68rem; color:var(--text-dim);">${escapeHTML(item.scheduledDate || '')}</span>
                    </div>
                    <span class="badge badge-gray" style="font-size:0.65rem; width:fit-content;">${icon} ${escapeHTML(item.contentType || channel.defaultContentType)}</span>
                  </div>

                  <!-- Topic Idea & Strategic Rationale -->
                  <div style="display:flex; flex-direction:column; gap:0.2rem;">
                    <div style="font-weight:800; color:#fff; font-size:0.9rem; line-height:1.35;">
                      ${escapeHTML(item.topicIdea)}
                    </div>
                    ${item.hook ? `<div style="font-size:0.74rem; color:#a7f3d0; font-style:italic;">🎯 "${escapeHTML(item.hook)}"</div>` : ''}
                    <div style="font-size:0.7rem; color:#94a3b8; margin-top:0.15rem;">
                      💡 <strong>Strategic Rationale:</strong> ${escapeHTML(item.strategicRationale || 'Proven audience signal')}
                    </div>
                  </div>

                  <!-- Time & Duration -->
                  <div style="font-size:0.74rem; color:var(--text-muted); display:flex; flex-direction:column; gap:0.2rem;">
                    <div>⏰ <strong>${escapeHTML(item.suggestedTime || '18:00')}</strong></div>
                    <div>⏱️ <strong>${escapeHTML(item.targetDuration || '60s')}</strong></div>
                  </div>

                  <!-- Quick Action Button -->
                  <div>
                    <button type="button" class="btn-secondary btn-sm" style="font-size:0.72rem; padding:0.3rem 0.6rem;" onclick="window.SOCIAL_MODULE.openPostModalFromPlanItem('${brand.slug}', '${channel.id}', '${currentMonthKey}', ${idx})">
                      ✏️ Draft Now
                    </button>
                  </div>

                </div>
              `;
            }).join('')}
          </div>

        </div>

      </div>
    `;
  }

  function renderBrandAssetsKitHTML(brand) {
    return `
      <div style="display:grid; grid-template-columns:1.2fr 1fr; gap:1.2rem;">
        
        <!-- Brand Identity & Guidelines Form -->
        <div style="background:var(--surface-card, #14141e); border:1px solid var(--border-subtle); border-radius:14px; padding:1.25rem; display:flex; flex-direction:column; gap:0.9rem;">
          <div style="font-weight:800; font-size:0.95rem; color:#fff; border-bottom:1px solid var(--border-subtle); padding-bottom:0.6rem;">
            🎨 Brand Identity & Copy Guidelines (${escapeHTML(brand.name)})
          </div>

          <div class="form-group">
            <label class="form-label">Brand Tagline</label>
            <input type="text" id="inpBrandTagline" class="input-text" value="${escapeHTML(brand.tagline || '')}">
          </div>

          <div class="form-group">
            <label class="form-label">Core Niche & Target Audience</label>
            <input type="text" id="inpBrandNiche" class="input-text" value="${escapeHTML(brand.niche || '')}">
          </div>

          <div class="form-group">
            <label class="form-label">Tone of Voice Guidelines</label>
            <input type="text" id="inpBrandTone" class="input-text" value="${escapeHTML(brand.tone || '')}">
          </div>

          <div class="form-group">
            <label class="form-label">Brand Mission Statement</label>
            <textarea id="inpBrandMission" class="input-text" rows="2">${escapeHTML(brand.mission || '')}</textarea>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.8rem;">
            <div class="form-group">
              <label class="form-label">Standard Hashtags</label>
              <input type="text" id="inpBrandHashtags" class="input-text" value="${escapeHTML(brand.standardHashtags || '')}">
            </div>
            <div class="form-group">
              <label class="form-label">Font Pairing</label>
              <input type="text" id="inpBrandFonts" class="input-text" value="${escapeHTML(brand.fonts || '')}">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Default CTA (Call-to-Action)</label>
            <textarea id="inpBrandCta" class="input-text" rows="2">${escapeHTML(brand.standardCta || '')}</textarea>
          </div>

          <div style="display:flex; justify-content:flex-end; margin-top:0.4rem;">
            <button type="button" class="btn-primary" onclick="window.SOCIAL_MODULE.saveBrandGuidelines('${brand.slug}')">
              💾 Save Brand Identity Guidelines
            </button>
          </div>
        </div>

        <!-- Reusable Media Assets Library -->
        <div style="background:var(--surface-card, #14141e); border:1px solid var(--border-subtle); border-radius:14px; padding:1.25rem; display:flex; flex-direction:column; gap:0.9rem;">
          <div style="font-weight:800; font-size:0.95rem; color:#fff; border-bottom:1px solid var(--border-subtle); padding-bottom:0.6rem; display:flex; justify-content:space-between; align-items:center;">
            <span>📁 Reusable Media Assets Library</span>
            <span class="badge badge-purple">${(brand.assets || []).length} Assets</span>
          </div>

          <div style="border:2px dashed var(--border-subtle); border-radius:10px; padding:1rem; text-align:center; background:rgba(0,0,0,0.25); cursor:pointer;" onclick="document.getElementById('brandAssetUploadInput').click()">
            <input type="file" id="brandAssetUploadInput" style="display:none;" accept="image/*,video/*,audio/*,application/pdf" onchange="window.SOCIAL_MODULE.handleBrandAssetUpload(this, '${brand.slug}')">
            <div style="font-size:1.5rem;">☁️</div>
            <div style="font-weight:700; font-size:0.82rem; color:#fff;">Upload Reusable Brand Asset</div>
            <div style="font-size:0.7rem; color:var(--text-dim);">Watermarks, Logo PNGs, Intro/Outro Videos, Canva Templates</div>
          </div>

          <!-- Assets List -->
          <div style="display:flex; flex-direction:column; gap:0.5rem; max-height:280px; overflow-y:auto;">
            ${(brand.assets || []).length === 0 ? `
              <div style="text-align:center; color:var(--text-dim); padding:1.5rem; font-size:0.75rem;">
                No brand assets uploaded yet. Upload transparent PNG logos, intro clips, and PowerPoint/Canva templates here.
              </div>
            ` : brand.assets.map(a => `
              <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); border-radius:8px; padding:0.5rem 0.75rem; display:flex; justify-content:space-between; align-items:center; font-size:0.75rem;">
                <div style="font-weight:700; color:#fff; max-width:220px; overflow:hidden; text-overflow:ellipsis;">${escapeHTML(a.name || 'Asset')}</div>
                <button type="button" class="btn-ghost btn-sm" style="font-size:0.68rem;" onclick="navigator.clipboard.writeText('${escapeHTML(a.url)}'); if(window.showToast) window.showToast('Asset URL copied!','success');">📋 Copy URL</button>
              </div>
            `).join('')}
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
              ${p.contentType ? `<span class="badge badge-blue" style="font-size:0.62rem;">${escapeHTML(p.contentType)}</span>` : ''}
              ${p.contentCategory ? `<span class="badge badge-purple" style="font-size:0.62rem;">${escapeHTML(p.contentCategory)}</span>` : ''}
            </div>
          </div>

          <!-- Post Title -->
          <div style="font-weight:800; color:var(--text-primary); font-size:0.92rem; line-height:1.35;">
            ${escapeHTML(p.title)}
          </div>

          <!-- Internal QC Evaluation Badge -->
          ${stageKey === 'internal' ? `
            <div style="background:${qc.bg}; border:1px solid ${qc.border}; border-radius:6px; padding:0.35rem 0.5rem; font-size:0.72rem; color:${qc.color}; display:flex; justify-content:space-between; align-items:center;">
              <span style="font-weight:800;">${qc.label}</span>
              ${qc.warnings.length > 0 ? `<span style="font-size:0.65rem; color:var(--text-muted); cursor:help;" title="${escapeHTML(qc.warnings.join(' • '))}">ℹ️ Details</span>` : ''}
            </div>
          ` : ''}

          <!-- Media Thumbnail -->
          ${mediaThumb ? `
            <div style="height:110px; border-radius:8px; overflow:hidden; background:rgba(0,0,0,0.4); border:1px solid var(--border-subtle); display:flex; align-items:center; justify-content:center;">
              ${mediaThumb.startsWith('data:image') || mediaThumb.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i) ? `
                <img src="${escapeHTML(mediaThumb)}" style="width:100%; height:100%; object-fit:cover;" alt="Media Thumbnail" onerror="this.parentElement.style.display='none'">
              ` : `
                <div style="font-size:0.8rem; color:#fff; display:flex; align-items:center; gap:0.4rem;">
                  <span>🎬</span> Media Asset Attached
                </div>
              `}
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
        if (activeViewMode === 'planner_ai') renderPlannerAI();
        else if (activeViewMode === 'calendar') renderCalendar();
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
      const btnP = document.getElementById('btnViewContentOS');

      if (btnK) {
        btnK.style.background = mode === 'kanban' ? 'rgba(255,255,255,0.15)' : 'transparent';
        btnK.style.color = mode === 'kanban' ? '#fff' : 'var(--text-muted)';
      }
      if (btnC) {
        btnC.style.background = mode === 'calendar' ? 'rgba(255,255,255,0.15)' : 'transparent';
        btnC.style.color = mode === 'calendar' ? '#fff' : 'var(--text-muted)';
      }
      if (btnP) {
        btnP.style.background = mode === 'content_os' ? 'linear-gradient(135deg, rgba(168,85,247,0.35), rgba(99,102,241,0.35))' : 'transparent';
        btnP.style.color = mode === 'content_os' ? '#fff' : 'var(--text-muted)';
      }

      renderContent();
    },
    switchBrand(brandSlug) {
      activeBrandSlug = brandSlug;
      activeBrandSubTab = 'overview';
      activeChannelId = null;
      renderContentOS();
    },
    switchBrandSubTab(tab) {
      activeBrandSubTab = tab;
      if (tab !== 'channel') activeChannelId = null;
      renderContentOS();
    },
    openChannelWorkspace(channelId) {
      activeBrandSubTab = 'channel';
      activeChannelId = channelId;
      renderContentOS();
    },
    changePlanMonth(m) {
      selectedPlanMonth = m;
      renderContentOS();
    },
    changePlanYear(y) {
      selectedPlanYear = Number(y) || 2026;
      renderContentOS();
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
    async handleChannelCsvUpload(input, brandSlug, channelId) {
      const file = input.files && input.files[0];
      if (!file) return;

      if (window.showToast) window.showToast(`📈 Ingesting ${file.name} into ${channelId} memory...`, 'info');

      try {
        const formData = new FormData();
        formData.append('csvFile', file);

        const token = localStorage.getItem('token') || '';
        const res = await fetch(`/api/social-brands/${brandSlug}/channels/${channelId}/analytics`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        const json = await res.json();
        if (json && json.success) {
          if (window.showToast) window.showToast('✅ Channel analytics & audience memory indexed permanently!', 'success');
          await loadInitialData();
          this.openChannelWorkspace(channelId);
        } else {
          throw new Error(json?.error || 'Failed to upload CSV');
        }
      } catch (err) {
        console.error('CSV upload error:', err);
        if (window.showToast) window.showToast('Upload notice: ' + err.message, 'error');
      }
    },
    openCommunitySnapshotModal() {
      const count = prompt('Enter Current Active Member Count:', '1200');
      if (count === null) return;
      const topics = prompt('Enter Top Discussed Topics (comma-separated):', 'Daily Job Circulars, Interview Q&A, PDF Guides');
      if (topics === null) return;

      this.saveCommunitySnapshot(count, topics);
    },
    async saveCommunitySnapshot(memberCount, topTopics) {
      const brand = (socialBrandsData || []).find(b => b.slug === activeBrandSlug) || socialBrandsData[0];
      const channelId = activeChannelId || (brand && brand.channels && brand.channels[0]?.id);

      try {
        const res = await APP_API.post(`/social-brands/${brand.slug}/channels/${channelId}/analytics`, {
          memberCount: Number(memberCount) || 100,
          topTopics: topTopics.split(',').map(s => s.trim()).filter(Boolean),
          snapshotSource: 'Community Metrics Snapshot'
        });

        if (res && res.success) {
          if (window.showToast) window.showToast('✅ Community metrics snapshot saved!', 'success');
          await loadInitialData();
          this.openChannelWorkspace(channelId);
        }
      } catch (err) {
        if (window.showToast) window.showToast('Failed to save snapshot: ' + err.message, 'error');
      }
    },
    async generateChannelCalendarPlan(brandSlug, channelId) {
      isGeneratingCalendar = true;
      const btn = document.getElementById('btnRunChannelGen');
      if (btn) {
        btn.disabled = true;
        btn.textContent = '⏳ AI Strategizing ' + selectedPlanMonth + '...';
      }

      try {
        const res = await APP_API.post(`/social-brands/${brandSlug}/channels/${channelId}/generate-calendar`, {
          month: selectedPlanMonth,
          year: selectedPlanYear,
          alignAnchor: alignAnchorSynergy,
          focusNote: monthlyFocusNote
        });

        if (res && res.success) {
          if (window.showToast) window.showToast(`✨ Generated ${selectedPlanMonth} strategic calendar for ${channelId}!`, 'success');
          await loadInitialData();
          this.openChannelWorkspace(channelId);
        } else {
          throw new Error(res?.error || 'Generation failed');
        }
      } catch (err) {
        console.error('Calendar Gen Error:', err);
        if (window.showToast) window.showToast('Generation notice: ' + err.message, 'error');
      } finally {
        isGeneratingCalendar = false;
        if (btn) {
          btn.disabled = false;
          btn.textContent = '✨ Generate ' + selectedPlanMonth + ' Strategy';
        }
      }
    },
    async lockChannelCalendar(brandSlug, channelId, monthKey) {
      if (!confirm(`Are you sure you want to LOCK the ${selectedPlanMonth} calendar for this channel? All items will be frozen and auto-created as active drafts in your Kanban pipeline.`)) return;

      if (window.showToast) window.showToast('🔒 Freezing plan and provisioning drafts in pipeline...', 'info');

      try {
        const res = await APP_API.post(`/social-brands/${brandSlug}/channels/${channelId}/calendars/${monthKey}/lock`, {});
        if (res && res.success) {
          if (window.showToast) window.showToast(res.message || '🎉 Calendar locked and drafts created!', 'success');
          await loadInitialData();
          this.openChannelWorkspace(channelId);
        } else {
          throw new Error(res?.error || 'Lock failed');
        }
      } catch (err) {
        console.error('Lock error:', err);
        if (window.showToast) window.showToast('Lock failed: ' + err.message, 'error');
      }
    },
    openPostModalFromPlanItem(brandSlug, channelId, monthKey, planIndex) {
      const brand = (socialBrandsData || []).find(b => b.slug === brandSlug || b.id === brandSlug);
      const channel = (brand && brand.channels || []).find(c => c.id === channelId || c.slug === channelId);
      const calendar = channel && channel.calendars && channel.calendars[monthKey];
      const item = calendar && calendar.planItems && calendar.planItems[planIndex];

      if (!item) return;

      this.openPostModal();
      const titleEl = document.getElementById('spTitle');
      const dateEl = document.getElementById('spDate');
      const timeEl = document.getElementById('spTime');
      const chanEl = document.getElementById('spChannel');
      const platEl = document.getElementById('spPlatform');
      const ctEl = document.getElementById('spContentType');
      const durEl = document.getElementById('spTargetDuration');

      if (titleEl) titleEl.value = item.topicIdea || item.title || '';
      if (dateEl && item.scheduledDate) dateEl.value = item.scheduledDate;
      if (timeEl && item.suggestedTime) timeEl.value = item.suggestedTime;

      const chanCfg = CHANNELS.find(c => (brand.name || '').includes(c.name) || (brand.slug || '').includes(c.id));
      if (chanCfg && chanEl) {
        chanEl.value = chanCfg.id;
        this.onChannelChange(chanCfg.id);
      }

      if (platEl && channel.platform) {
        platEl.value = channel.platform;
        this.onPlatformChange(platEl);
      }

      if (ctEl && item.contentType) {
        ctEl.value = item.contentType;
        this.onContentTypeChange(item.contentType);
      }

      if (durEl && item.targetDuration) {
        durEl.value = item.targetDuration;
      }
    },
    async saveBrandGuidelines(brandSlug) {
      const tagline = document.getElementById('inpBrandTagline')?.value.trim();
      const niche = document.getElementById('inpBrandNiche')?.value.trim();
      const tone = document.getElementById('inpBrandTone')?.value.trim();
      const mission = document.getElementById('inpBrandMission')?.value.trim();
      const standardHashtags = document.getElementById('inpBrandHashtags')?.value.trim();
      const fonts = document.getElementById('inpBrandFonts')?.value.trim();
      const standardCta = document.getElementById('inpBrandCta')?.value.trim();

      try {
        const res = await APP_API.put(`/social-brands/${brandSlug}`, {
          tagline,
          niche,
          tone,
          mission,
          standardHashtags,
          fonts,
          standardCta
        });

        if (res && res.success) {
          if (window.showToast) window.showToast('✅ Brand identity guidelines updated!', 'success');
          await loadInitialData();
          this.switchBrandSubTab('assets');
        }
      } catch (err) {
        if (window.showToast) window.showToast('Failed to save guidelines: ' + err.message, 'error');
      }
    },
    async handleBrandAssetUpload(input, brandSlug) {
      const file = input.files && input.files[0];
      if (!file) return;

      if (window.showToast) window.showToast(`Uploading ${file.name} to brand asset kit...`, 'info');

      try {
        const formData = new FormData();
        formData.append('file', file);

        const token = localStorage.getItem('token') || '';
        const res = await fetch('/api/posts/upload-media', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });

        const json = await res.json();
        if (json && json.success && json.url) {
          const brand = (socialBrandsData || []).find(b => b.slug === brandSlug);
          const currentAssets = brand?.assets || [];
          currentAssets.push({ name: file.name, url: json.url, type: file.type, uploadedAt: new Date().toISOString() });

          await APP_API.put(`/social-brands/${brandSlug}`, { assets: currentAssets });
          if (window.showToast) window.showToast('✅ Asset added to brand library!', 'success');
          await loadInitialData();
          this.switchBrandSubTab('assets');
        }
      } catch (err) {
        if (window.showToast) window.showToast('Asset upload failed: ' + err.message, 'error');
      }
    },
    promptAddBrand() {
      const name = prompt('Enter New Brand Name:');
      if (!name) return;
      const niche = prompt('Enter Core Niche / Topic:', 'Digital Media & AI');
      if (!niche) return;

      this.createCustomBrand(name, niche);
    },
    async createCustomBrand(name, niche) {
      try {
        const res = await APP_API.post('/social-brands', { name, niche });
        if (res && res.success) {
          if (window.showToast) window.showToast(`🎉 Created brand "${name}"!`, 'success');
          await loadInitialData();
          this.switchBrand(res.brand.slug);
        }
      } catch (err) {
        if (window.showToast) window.showToast('Failed to create brand: ' + err.message, 'error');
      }
    },
    promptAddChannel() {
      const name = prompt('Enter Channel Name:', 'TikTok Channel');
      if (!name) return;
      const platform = prompt('Enter Platform (YouTube, TikTok, Facebook, Instagram, LinkedIn, WhatsApp):', 'TikTok');
      if (!platform) return;
      const handle = prompt('Enter Handle / Profile URL:', '@brand_official');

      this.createCustomChannel(name, platform, handle);
    },
    async createCustomChannel(name, platform, handle) {
      try {
        const res = await APP_API.post(`/social-brands/${activeBrandSlug}/channels`, {
          name,
          platform,
          handle,
          targetCadencePerWeek: 3
        });

        if (res && res.success) {
          if (window.showToast) window.showToast(`🎉 Added channel "${name}"!`, 'success');
          await loadInitialData();
          this.openChannelWorkspace(res.channel.id);
        }
      } catch (err) {
        if (window.showToast) window.showToast('Failed to add channel: ' + err.message, 'error');
      }
    },
    onChannelChange(channelKey) {
      updateCategoryOptions(channelKey);
      const clientGroup = document.getElementById('spClientSelectGroup');
      const platformSelect = document.getElementById('spPlatform');
      const contentTypeSelect = document.getElementById('spContentType');
      const musicBox = document.getElementById('spMusicVideoStudioBox');

      if (channelKey === 'client') {
        if (clientGroup) clientGroup.style.display = 'block';
      } else {
        if (clientGroup) clientGroup.style.display = 'none';
        const channel = getChannelConfig(channelKey);
        if (channel && platformSelect && channel.defaultPlatform) {
          platformSelect.value = channel.defaultPlatform;
          this.onPlatformChange(platformSelect);
        }
        if (channel && contentTypeSelect && channel.defaultContentType) {
          contentTypeSelect.value = channel.defaultContentType;
          this.onContentTypeChange(channel.defaultContentType);
        }
      }

      if (channelKey === 'bong-hits' || (contentTypeSelect && contentTypeSelect.value === 'Music Video')) {
        if (musicBox) musicBox.style.display = 'flex';
      } else {
        if (musicBox) musicBox.style.display = 'none';
      }
    },
    onPlatformChange(selectEl) {
      const plat = selectEl.value;
      const caption = document.getElementById('spCaption');
      this.updateCharCount(caption || { value: '' }, plat);

      const contentTypeSelect = document.getElementById('spContentType');
      if (contentTypeSelect) {
        if (plat === 'TikTok' || plat === 'Instagram') {
          if (contentTypeSelect.value === 'Long-form Video') contentTypeSelect.value = 'Short-form Video';
        } else if (plat === 'LinkedIn') {
          if (contentTypeSelect.value === 'Short-form Video') contentTypeSelect.value = 'PDF / Document';
        }
        this.onContentTypeChange(contentTypeSelect.value);
      }
    },
    onContentTypeChange(typeVal) {
      const durGroup = document.getElementById('spDurationGroup');
      const musicBox = document.getElementById('spMusicVideoStudioBox');
      const chanKey = document.getElementById('spChannel')?.value || '';

      const isVideo = typeVal.includes('Video') || typeVal === 'Short-form Video' || typeVal === 'Long-form Video' || typeVal === 'Music Video';
      if (durGroup) durGroup.style.display = isVideo ? 'block' : 'none';

      if (typeVal === 'Music Video' || chanKey === 'bong-hits') {
        if (musicBox) musicBox.style.display = 'flex';
      } else {
        if (musicBox) musicBox.style.display = 'none';
      }
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
    toggleDirectMediaUrl() {
      const wrap = document.getElementById('spDirectMediaUrlWrap');
      if (wrap) wrap.style.display = wrap.style.display === 'none' ? 'block' : 'none';
    },
    async handleMediaFileUpload(input) {
      const file = input.files && input.files[0];
      if (!file) return;

      const previewBox = document.getElementById('spMediaUploadPreview');
      const promptBox = document.getElementById('spMediaUploadPrompt');
      const urlHidden = document.getElementById('spMediaUrl');

      if (promptBox) promptBox.style.display = 'none';
      if (previewBox) {
        previewBox.style.display = 'flex';
        previewBox.innerHTML = `<span style="font-size:0.8rem; color:#a855f7;">⏳ Uploading ${escapeHTML(file.name)}...</span>`;
      }

      try {
        const formData = new FormData();
        formData.append('file', file);

        const token = localStorage.getItem('token') || '';
        const res = await fetch('/api/posts/upload-media', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        const json = await res.json();
        if (json && json.success && json.url) {
          if (urlHidden) urlHidden.value = json.url;
          
          const isImg = file.type.startsWith('image/');
          previewBox.innerHTML = `
            <div style="display:flex; align-items:center; gap:0.6rem;">
              ${isImg ? `<img src="${json.url}" style="width:44px; height:44px; object-fit:cover; border-radius:6px;" alt="preview">` : `<span style="font-size:1.4rem;">📁</span>`}
              <div style="text-align:left;">
                <div style="font-weight:700; font-size:0.82rem; color:#fff; max-width:260px; overflow:hidden; text-overflow:ellipsis;">${escapeHTML(file.name)}</div>
                <div style="font-size:0.7rem; color:#10b981;">✅ Uploaded (${Math.round(file.size/1024)} KB)</div>
              </div>
            </div>
            <button type="button" class="btn-ghost btn-sm" style="color:#ef4444; font-size:0.85rem;" onclick="window.SOCIAL_MODULE.clearUploadedMedia()">✕</button>
          `;
          if (window.showToast) window.showToast('✅ Media asset uploaded successfully!', 'success');
        } else {
          throw new Error((json && json.error) || 'Upload failed');
        }
      } catch (err) {
        console.error('Media upload failed:', err);
        if (previewBox) previewBox.style.display = 'none';
        if (promptBox) promptBox.style.display = 'block';
        if (window.showToast) window.showToast('Upload error: ' + err.message, 'error');
      }
    },
    clearUploadedMedia() {
      const fileInput = document.getElementById('spMediaFileInput');
      const previewBox = document.getElementById('spMediaUploadPreview');
      const promptBox = document.getElementById('spMediaUploadPrompt');
      const urlHidden = document.getElementById('spMediaUrl');

      if (fileInput) fileInput.value = '';
      if (urlHidden) urlHidden.value = '';
      if (previewBox) { previewBox.style.display = 'none'; previewBox.innerHTML = ''; }
      if (promptBox) promptBox.style.display = 'block';
    },
    async generateMusicLrc() {
      const btn = document.getElementById('btnGenMusicLrc');
      const container = document.getElementById('mvMusicResultContainer');
      const title = document.getElementById('mvTrackTitle')?.value.trim() || document.getElementById('spTitle')?.value.trim() || 'Bong Hits Track';
      const lyrics = document.getElementById('mvLyrics')?.value.trim() || '';
      const genre = document.getElementById('mvGenre')?.value.trim() || 'Bengali Folk Rock';
      const duration = document.getElementById('spTargetDuration')?.value || '60s';

      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '⏳ Analyzing & Syncing LRC...';
      }

      if (container) {
        container.style.display = 'flex';
        container.innerHTML = `<div style="padding:1rem; text-align:center; color:#f472b6; font-size:0.82rem;">🎵 Generating timestamped lyrics and 10-second VEO 3 scene cuts...</div>`;
      }

      try {
        const res = await APP_API.post('/ai/music-lrc', {
          title,
          lyrics,
          genre,
          durationSeconds: duration.includes('30') ? 30 : (duration.includes('90') ? 90 : 60)
        });

        if (res && res.success && res.data) {
          activeLrcData = res.data;
          this.renderMusicLrcResult(res.data);
          if (window.showToast) window.showToast('🎵 LRC file & VEO music scene prompts generated!', 'success');
        }
      } catch (err) {
        console.error('Music LRC error:', err);
        if (container) container.innerHTML = `<div style="color:#ef4444; font-size:0.8rem;">⚠️ ${escapeHTML(err.message)}</div>`;
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = '✨ Generate LRC Timestamps & VEO Scenes';
        }
      }
    },
    renderMusicLrcResult(data) {
      const container = document.getElementById('mvMusicResultContainer');
      if (!container) return;

      container.style.display = 'flex';
      container.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid rgba(236,72,153,0.2); padding-top:0.6rem;">
          <span style="font-weight:800; color:#f472b6; font-size:0.8rem;">
            ✅ LRC Ready (${data.timestamps?.length || 0} Lyric Lines)
          </span>
          <button type="button" class="btn-emerald btn-sm" style="font-size:0.72rem; padding:0.25rem 0.6rem; font-weight:800;" onclick="window.SOCIAL_MODULE.downloadLrcFile()">
            ⬇️ Download .LRC File (For CapCut)
          </button>
        </div>

        <div style="background:rgba(0,0,0,0.35); border-radius:8px; padding:0.6rem; max-height:120px; overflow-y:auto; font-family:monospace; font-size:0.72rem; color:#fbcfe8; border:1px solid rgba(255,255,255,0.05); white-space:pre-wrap;">${escapeHTML(data.lrcContent || '')}</div>

        <!-- 10s VEO Scene Prompts for Music -->
        <div style="font-weight:800; color:#fff; font-size:0.8rem; margin-top:0.3rem;">
          🎬 Beat-Synced 10-Second VEO 3 Scene Prompts (${data.veoScenes?.length || 0} Chunks):
        </div>
        <div style="display:flex; flex-direction:column; gap:0.5rem; max-height:220px; overflow-y:auto;">
          ${(data.veoScenes || []).map(s => `
            <div style="background:rgba(0,0,0,0.3); border:1px solid rgba(236,72,153,0.2); border-radius:8px; padding:0.5rem 0.7rem; font-size:0.74rem;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.2rem;">
                <span style="font-weight:800; color:#f472b6;">[${escapeHTML(s.timeRange)}] ${escapeHTML(s.musicSection || `Scene ${s.scene}`)}</span>
                <button type="button" class="btn-ghost btn-sm" style="font-size:0.65rem; padding:0.1rem 0.35rem;" onclick="navigator.clipboard.writeText('${escapeHTML(s.prompt).replace(/'/g, "\\'")}'); if(window.showToast) window.showToast('VEO scene prompt copied!','success');">📋 Copy</button>
              </div>
              <div style="color:var(--text-secondary); margin-bottom:0.2rem;">${escapeHTML(s.prompt)}</div>
              ${s.capcutAction ? `<div style="color:#a7f3d0; font-size:0.68rem;">✂️ <em>CapCut: ${escapeHTML(s.capcutAction)}</em></div>` : ''}
            </div>
          `).join('')}
        </div>
      `;
    },
    downloadLrcFile() {
      if (!activeLrcData || !activeLrcData.lrcContent) return;
      const blob = new Blob([activeLrcData.lrcContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(activeLrcData.title || 'bong-hits-track').replace(/[^a-zA-Z0-9_-]/g, '_')}.lrc`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      if (window.showToast) window.showToast('⬇️ .LRC file downloaded! Ready to import into CapCut.', 'success');
    },
    async generateAIBrief() {
      const btn = document.getElementById('btnAiBrief');
      const container = document.getElementById('aiBriefContainer');
      const channelKey = document.getElementById('spChannel')?.value || 'grow-bangla';
      const channelObj = getChannelConfig(channelKey);
      const contentCategory = document.getElementById('spCategory')?.value || 'English Lesson';
      const platform = document.getElementById('spPlatform')?.value || 'YouTube';
      const contentType = document.getElementById('spContentType')?.value || 'Short-form Video';
      const targetDuration = document.getElementById('spTargetDuration')?.value || '60s';
      const topic = document.getElementById('spTitle')?.value || '';

      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '✨ Generating Brief & Prompts...';
      }

      if (container) {
        container.style.display = 'flex';
        container.innerHTML = `
          <div style="text-align:center; padding:1.2rem; color:var(--purple-light); font-size:0.85rem;">
            <div style="font-size:1.6rem; margin-bottom:0.3rem;">🤖</div>
            Gemini AI crafting structured <strong>${escapeHTML(contentType)}</strong> blueprint with VEO 3 prompts for <strong>${escapeHTML(channelObj.name)}</strong>...
          </div>
        `;
      }

      try {
        const res = await APP_API.post('/ai/social-brief', {
          channel: channelObj.name,
          contentCategory,
          platform,
          contentType,
          targetDuration,
          topic
        });

        if (res && res.success && res.brief) {
          activeGeneratedBrief = res.brief;
          this.renderAIBriefPanel(res.brief, res.generatedBy);
          if (window.showToast) window.showToast('✨ AI Content Blueprint & Prompts generated!', 'success');
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
          btn.innerHTML = '✨ Generate AI Brief & Prompts';
        }
      }
    },
    renderAIBriefPanel(brief, generatedBy) {
      const container = document.getElementById('aiBriefContainer');
      if (!container) return;

      const isVideo = Array.isArray(brief.veoScenes) && brief.veoScenes.length > 0;
      const isPdf = Array.isArray(brief.pdfOutline) && brief.pdfOutline.length > 0;
      const isCarousel = Array.isArray(brief.carouselSlides) && brief.carouselSlides.length > 0;

      container.style.display = 'flex';
      container.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(168,85,247,0.2); padding-bottom:0.5rem;">
          <span style="font-size:0.82rem; font-weight:800; color:#d8b4fe;">
            ✨ ${escapeHTML(brief.contentType || 'Content')} Blueprint (${escapeHTML(generatedBy || 'gemini')})
          </span>
          <button type="button" class="btn-primary btn-sm" style="font-size:0.7rem; padding:0.2rem 0.6rem; background:#10b981; border:none;" onclick="window.SOCIAL_MODULE.applyAllBriefFields()">
            ⚡ Auto-Fill Post Form
          </button>
        </div>

        <div style="display:grid; grid-template-columns:1fr; gap:0.6rem; font-size:0.78rem;">
          <div>
            <strong style="color:#ffffff;">🎯 Viral Hook:</strong>
            <div style="color:#a7f3d0; margin-top:0.15rem; font-size:0.85rem;">"${escapeHTML(brief.hook)}"</div>
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

          <!-- VEO 3 Prompt Studio (Chunked 10-Second Prompts) -->
          ${isVideo ? `
            <div style="background:rgba(0,0,0,0.35); border-radius:10px; padding:0.85rem; border:1px solid rgba(168,85,247,0.25);">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem; flex-wrap:wrap; gap:0.4rem;">
                <div style="font-weight:800; color:#c084fc; font-size:0.82rem; display:flex; align-items:center; gap:0.4rem;">
                  <span>🎬</span> Google VEO 3 Prompt Studio (${brief.targetDuration || '60s'} · ${brief.veoScenes.length} Chunks of 10s)
                </div>
                <button type="button" class="btn-primary btn-sm" style="font-size:0.68rem; padding:0.2rem 0.55rem; background:#6366f1; border:none;" onclick="window.SOCIAL_MODULE.copyAllVeoPrompts()">
                  📋 Copy All VEO Prompts (For Flow Agent)
                </button>
              </div>
              <div style="display:flex; flex-direction:column; gap:0.5rem; max-height:240px; overflow-y:auto; padding-right:0.2rem;">
                ${brief.veoScenes.map(s => `
                  <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); border-radius:8px; padding:0.55rem 0.75rem; font-size:0.74rem;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.2rem;">
                      <span style="font-weight:800; color:#a7f3d0;">[${escapeHTML(s.timeRange)}] Scene ${s.scene}: ${escapeHTML(s.section || '')}</span>
                      <button type="button" class="btn-ghost btn-sm" style="font-size:0.65rem; padding:0.1rem 0.4rem;" onclick="navigator.clipboard.writeText('${escapeHTML(s.prompt).replace(/'/g, "\\'")}'); if(window.showToast) window.showToast('Scene ${s.scene} VEO prompt copied!','success');">📋 Copy</button>
                    </div>
                    <div style="color:var(--text-secondary); line-height:1.4;">${escapeHTML(s.prompt)}</div>
                    ${s.visualCue ? `<div style="color:#94a3b8; font-size:0.68rem; margin-top:0.2rem;">🎨 <em>On-screen: ${escapeHTML(s.visualCue)}</em></div>` : ''}
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- LinkedIn PDF Slide Deck Outline -->
          ${isPdf ? `
            <div style="background:rgba(0,0,0,0.35); border-radius:10px; padding:0.85rem; border:1px solid rgba(56,189,248,0.25);">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem; flex-wrap:wrap; gap:0.4rem;">
                <div style="font-weight:800; color:#38bdf8; font-size:0.82rem; display:flex; align-items:center; gap:0.4rem;">
                  <span>📄</span> LinkedIn PDF Document Slide Deck (${brief.pdfOutline.length} Slides)
                </div>
                <button type="button" class="btn-primary btn-sm" style="font-size:0.68rem; padding:0.2rem 0.55rem; background:#0284c7; border:none;" onclick="window.SOCIAL_MODULE.copyAllPdfSlides()">
                  📋 Copy Full Deck Outline (For PowerPoint)
                </button>
              </div>
              <div style="display:flex; flex-direction:column; gap:0.5rem; max-height:240px; overflow-y:auto; padding-right:0.2rem;">
                ${brief.pdfOutline.map(s => `
                  <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); border-radius:8px; padding:0.55rem 0.75rem; font-size:0.74rem;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.2rem;">
                      <span style="font-weight:800; color:#38bdf8;">Slide ${s.slideNumber}: ${escapeHTML(s.headline)} (${escapeHTML(s.type)})</span>
                      <button type="button" class="btn-ghost btn-sm" style="font-size:0.65rem; padding:0.1rem 0.4rem;" onclick="navigator.clipboard.writeText('${escapeHTML(s.headline + '\n' + (s.bullets || []).join('\n')).replace(/'/g, "\\'")}'); if(window.showToast) window.showToast('Slide ${s.slideNumber} copied!','success');">📋 Copy</button>
                    </div>
                    <ul style="margin:0.2rem 0 0.2rem 1.1rem; padding:0; color:var(--text-secondary);">
                      ${(s.bullets || []).map(b => `<li>${escapeHTML(b)}</li>`).join('')}
                    </ul>
                    ${s.visualNote ? `<div style="color:#94a3b8; font-size:0.68rem; margin-top:0.2rem;">📐 <em>Layout: ${escapeHTML(s.visualNote)}</em></div>` : ''}
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Carousel Slides -->
          ${isCarousel ? `
            <div style="background:rgba(0,0,0,0.35); border-radius:10px; padding:0.85rem; border:1px solid rgba(244,114,182,0.25);">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
                <span style="font-weight:800; color:#f472b6; font-size:0.82rem;">🎠 Carousel Slide Cards (${brief.carouselSlides.length} Slides)</span>
                <button type="button" class="btn-ghost btn-sm" style="font-size:0.68rem;" onclick="window.SOCIAL_MODULE.copyCarouselSlides()">📋 Copy All Slides</button>
              </div>
              <div style="display:flex; flex-direction:column; gap:0.4rem; max-height:200px; overflow-y:auto;">
                ${brief.carouselSlides.map(s => `
                  <div style="background:rgba(255,255,255,0.03); border-radius:6px; padding:0.5rem; border:1px solid var(--border-subtle); font-size:0.73rem;">
                    <div style="font-weight:700; color:#fff;">Slide ${s.slide}: ${escapeHTML(s.headline)}</div>
                    <div style="color:var(--text-secondary); margin-top:0.15rem;">${escapeHTML(s.copy)}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Visual Brief & Voice Note -->
          <div style="background:rgba(0,0,0,0.25); border-radius:6px; padding:0.5rem; border:1px solid rgba(255,255,255,0.05);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.2rem;">
              <strong style="color:#ffffff;">🎬 Visual Brief (CapCut/Canva):</strong>
              <button type="button" class="btn-ghost btn-sm" style="font-size:0.65rem; padding:0.1rem 0.4rem;" onclick="navigator.clipboard.writeText('${escapeHTML(brief.visualBrief).replace(/'/g, "\\'")}'); if(window.showToast) window.showToast('Visual brief copied!','success');">📋 Copy</button>
            </div>
            <div style="color:var(--text-muted); font-size:0.74rem;">${escapeHTML(brief.visualBrief)}</div>
          </div>

          <div style="background:rgba(0,0,0,0.25); border-radius:6px; padding:0.5rem; border:1px solid rgba(255,255,255,0.05);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.2rem;">
              <strong style="color:#ffffff;">🎙️ Spoken Talking Script:</strong>
              <button type="button" class="btn-ghost btn-sm" style="font-size:0.65rem; padding:0.1rem 0.4rem;" onclick="navigator.clipboard.writeText('${escapeHTML(brief.voiceNote).replace(/'/g, "\\'")}'); if(window.showToast) window.showToast('Voice script copied!','success');">📋 Copy</button>
            </div>
            <div style="color:var(--text-muted); font-size:0.74rem;">${escapeHTML(brief.voiceNote)}</div>
          </div>

        </div>
      `;
    },
    copyAllVeoPrompts() {
      if (!activeGeneratedBrief || !activeGeneratedBrief.masterVeoPrompt) return;
      navigator.clipboard.writeText(activeGeneratedBrief.masterVeoPrompt);
      if (window.showToast) window.showToast('📋 All VEO 3 scene prompts copied! Ready to paste into flow agent.', 'success');
    },
    copyAllPdfSlides() {
      if (!activeGeneratedBrief || !activeGeneratedBrief.masterPdfOutline) return;
      navigator.clipboard.writeText(activeGeneratedBrief.masterPdfOutline);
      if (window.showToast) window.showToast('📋 Full slide deck outline copied! Ready for PowerPoint / Canva.', 'success');
    },
    copyCarouselSlides() {
      if (!activeGeneratedBrief || !Array.isArray(activeGeneratedBrief.carouselSlides)) return;
      const text = activeGeneratedBrief.carouselSlides.map(s => `Slide ${s.slide}: ${s.headline}\n${s.copy}\n(Visual: ${s.visualCue})`).join('\n\n');
      navigator.clipboard.writeText(text);
      if (window.showToast) window.showToast('📋 Carousel slides copied!', 'success');
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

      if (window.showToast) window.showToast('⚡ Post fields auto-filled from AI blueprint!', 'success');
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
      activeLrcData = null;

      const briefBox = document.getElementById('aiBriefContainer');
      if (briefBox) { briefBox.style.display = 'none'; briefBox.innerHTML = ''; }
      const musicRes = document.getElementById('mvMusicResultContainer');
      if (musicRes) { musicRes.style.display = 'none'; musicRes.innerHTML = ''; }

      document.getElementById('spEditId').value = '';
      document.getElementById('postModalTitle').textContent = '📱 Draft New Social Post';
      document.getElementById('spTitle').value = '';
      document.getElementById('spCaption').value = '';
      document.getElementById('spFirstComment').value = '';
      document.getElementById('spHashtags').value = '';
      document.getElementById('spMediaUrl').value = '';
      this.clearUploadedMedia();
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
      activeLrcData = null;

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

      const ctSelect = document.getElementById('spContentType');
      if (ctSelect && post.contentType) {
        ctSelect.value = post.contentType;
        this.onContentTypeChange(post.contentType);
      }

      const durSelect = document.getElementById('spTargetDuration');
      if (durSelect && post.targetDuration) {
        durSelect.value = post.targetDuration;
      }
      
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
      const contentType = document.getElementById('spContentType')?.value || 'Short-form Video';
      const targetDuration = document.getElementById('spTargetDuration')?.value || '60s';
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
          contentType,
          targetDuration,
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



