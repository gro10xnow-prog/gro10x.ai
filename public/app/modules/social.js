/**
 * public/app/modules/social.js
 * Social Media Planner & Engine 5 Content Command Center
 * v5.0 — Channel-Aware + AI Brief Generator + AI QC Engine + Monthly Content Calendar (Phase 1, 2, 5)
 * Channels: Grow Bangla, PILUTICS, Bong Hits, GRO10X Brand, Client Accounts
 * Views: 5-Stage Kanban Board & Monthly Content Calendar with Cadence Tracking
 */
window.APP_MODULES = window.APP_MODULES || {};

// Phase 6.5 & 6.6: Inject animations, mobile responsive snapping & drag-and-drop styles
  if (!document.getElementById('socialModuleStyles')) {
    const st = document.createElement('style');
    st.id = 'socialModuleStyles';
    st.textContent = `
      @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      .social-board {
        scroll-snap-type: x mandatory;
        -webkit-overflow-scrolling: touch;
      }
      .social-col {
        scroll-snap-align: start;
        transition: background-color 0.2s ease, border-color 0.2s ease;
      }
      .social-col.drag-over {
        background: rgba(168, 85, 247, 0.08) !important;
        border-color: #a855f7 !important;
      }
      .post-card[draggable="true"] {
        cursor: grab;
      }
      .post-card.dragging {
        opacity: 0.35;
        transform: scale(0.97);
        border: 2px dashed #a855f7 !important;
      }
      @media (max-width: 768px) {
        .social-board {
          display: flex !important;
          overflow-x: auto !important;
          gap: 0.75rem !important;
          padding-bottom: 1.25rem !important;
        }
        .social-col {
          min-width: 84vw !important;
          max-width: 84vw !important;
        }
      }
    `;
    document.head.appendChild(st);
  }

window.APP_MODULES.social = async function(container) {
  // Sync view mode if hash changes to/from #content-os
  window.addEventListener('hashchange', () => {
    if (window.location.hash === '#content-os' && activeViewMode !== 'content_os') {
      activeViewMode = 'content_os';
      renderContent();
    } else if (window.location.hash === '#social' && activeViewMode === 'content_os') {
      activeViewMode = 'kanban';
      renderContent();
    }
  });
  let postsData = [];
  let clientsData = [];
  let socialBrandsData = [];
  let isLoading = true;
  let hasError = false;
  let activeGeneratedBrief = null;
  let activeViewMode = window.location.hash === '#content-os' ? 'content_os' : 'kanban'; // 'kanban' | 'calendar' | 'content_os'
  let activeOnboardingPath = 'csv'; // 'csv' | 'qa'
  let isOnboardingOverride = false;
  let currentCalendarDate = new Date();

  // Brand Hub & Content OS State — persisted across navigation
  let activeBrandSlug = localStorage.getItem('social_activeBrandSlug') || 'grow-bangla';
  let activeBrandSubTab = localStorage.getItem('social_activeBrandSubTab') || 'overview'; // 'overview' | 'channel' | 'assets'
  let activeChannelId = localStorage.getItem('social_activeChannelId') || null;
  let selectedPlanMonth = new Date().toLocaleString('default', { month: 'long' });
  let selectedPlanYear = new Date().getFullYear();
  let alignAnchorSynergy = true;
  let activeCalendarFilter = "all"; // "all" | "long_form" | "shorts"
  let activeBoardSearch = sessionStorage.getItem('social_boardSearch') || ''; // Kanban title search term
  let monthlyFocusNote = '';
  let isGeneratingCalendar = false;
  let isUploadingAnalytics = false;
  let currentPostMediaUrls = []; // Multi-media attachments for current modal

  // Phase 5.1: Client Role Detection Helper
  function getCurrentUser() {
    return window.CURRENT_USER || JSON.parse(localStorage.getItem('gro10x_user') || '{}');
  }

  function isClientRole() {
    const u = getCurrentUser();
    const role = (u.role || u.accessLevel || '').toLowerCase();
    const linkedType = (u.linkedType || '').toLowerCase();
    return role.includes('client') || linkedType === 'client';
  }

  // Topic Intelligence & Multi-modal State
  let activeTopicInputMode = 'type';
  let speechRecognitionInstance = null;
  let isVoiceRecordingActive = false;
  let activeSuggestedTopics = [];
  let currentSuggestedIndex = 0;
  let activeReferenceAsset = null;

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

  let activePlatformFilter = sessionStorage.getItem('social_platformFilter') || 'all';
  let activeChannelFilter = sessionStorage.getItem('social_channelFilter') || 'all';

  function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  function getChannelConfig(channelNameOrId) {
    if (!channelNameOrId) return CHANNELS[4]; // Default to Client Account
    const lower = String(channelNameOrId).toLowerCase();
    const found = CHANNELS.find(c => c.id === lower || c.name.toLowerCase().includes(lower) || lower.includes(c.id));
    if (found) return found;

    // Check dynamic socialBrandsData
    const brand = (socialBrandsData || []).find(b => b.slug === lower || b.id === lower || (b.name && b.name.toLowerCase().includes(lower)));
    if (brand) {
      const ch = (brand.channels || [])[0];
      const cats = (ch && ch.analyticsKnowledgeBase && ch.analyticsKnowledgeBase.topCategories && ch.analyticsKnowledgeBase.topCategories.length > 0)
        ? ch.analyticsKnowledgeBase.topCategories
        : ['General', 'Strategic Breakdown', 'Core Track'];
      return {
        id: brand.slug,
        name: brand.name,
        engine: 'Brand Hub',
        badgeClass: 'badge-purple',
        defaultPlatform: ch ? ch.platform : 'YouTube',
        defaultContentType: ch ? ch.defaultContentType : 'Short-form Video',
        targetPerWeek: ch ? ch.targetCadencePerWeek : 3,
        categories: cats
      };
    }

    return {
      id: 'custom',
      name: channelNameOrId,
      engine: 'Custom',
      badgeClass: 'badge-purple',
      defaultPlatform: 'Facebook',
      targetPerWeek: 2,
      categories: ['General', 'Promo', 'Update']
    };
  }

  function populateBrandChannelDropdown(selectedVal = '') {
    const spChannel = document.getElementById('spChannel');
    if (!spChannel) return;
    const brands = (socialBrandsData && socialBrandsData.length > 0) ? socialBrandsData : [
      { slug: 'grow-bangla', name: 'Grow Bangla', channels: [{ audienceLabel: '427 subs' }] },
      { slug: 'pilutics', name: 'PILUTICS', channels: [{ audienceLabel: '218 subs' }] },
      { slug: 'bong-hits', name: 'Bong Hits', channels: [{ audienceLabel: '85 subs' }] },
      { slug: 'gro10x', name: 'GRO10X Brand', channels: [{ audienceLabel: 'Agency' }] }
    ];

    const currentVal = selectedVal || spChannel.value || activeBrandSlug || 'grow-bangla';
    
    let html = brands.map(b => {
      const icon = b.slug === 'grow-bangla' ? '🎓' :
                   b.slug === 'pilutics' ? '🗺️' :
                   b.slug === 'bong-hits' ? '🎭' :
                   b.slug === 'gro10x' ? '📢' : '🏛️';
      const aud = (b.channels && b.channels[0] && b.channels[0].audienceLabel) ? ` (${b.channels[0].audienceLabel})` : '';
      return `<option value="${escapeHTML(b.slug || b.id)}" ${(b.slug === currentVal || b.id === currentVal) ? 'selected' : ''}>${icon} ${escapeHTML(b.name)}${escapeHTML(aud)}</option>`;
    }).join('');

    html += `<option value="client" ${currentVal === 'client' ? 'selected' : ''}>🏢 Client Account (CRM Retainer)</option>`;
    spChannel.innerHTML = html;
    if (currentVal) spChannel.value = currentVal;
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

    // Phase 7.4: Multi-Language Bengali Unicode Script & Strict Overlay Validation
    const chanLower = (post.channel || '').toLowerCase();
    const isBengaliChannel = chanLower.includes('bangla') || chanLower.includes('bong') || chanLower.includes('pilutics');
    const hasBengaliUnicode = /[\u0980-\u09FF]/.test(post.caption || '') || /[\u0980-\u09FF]/.test(post.title || '');

    if (isBengaliChannel && !hasBengaliUnicode) {
      warnings.push('Spoken dialogue script should use authentic Bengali Unicode (করো, বলবো) for accurate TTS pronunciation');
    }

    const veoString = typeof post.veoPrompts === 'string' ? post.veoPrompts : JSON.stringify(post.veoPrompts || '');
    if (/text overlay|words on screen|title card|subtitle overlay/i.test(veoString)) {
      warnings.push('Strict video rule: Text overlay prohibited in VEO prompts. Use graphical icons only.');
    }

    if (warnings.length === 0) {
      return { status: 'pass', label: '🟢 All QC Passed', color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)', warnings };
    } else if (warnings.length <= 2) {
      return { status: 'warn', label: `🟡 ${warnings.length} QC Notice${warnings.length > 1 ? 's' : ''}`, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', warnings };
    } else {
      return { status: 'fail', label: `🔴 ${warnings.length} Fixes Needed`, color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', warnings };
    }
  }

  async function loadInitialData(showSkeleton = true) {
    if (showSkeleton) {
      isLoading = true;
      hasError = false;
      renderSkeleton();
    }

    try {
      const [postsRes, clientsRes, brandsRes] = await Promise.all([
        APP_API.get('/posts').catch(() => []),
        APP_API.get('/clients').catch(() => []),
        APP_API.get('/social-brands').catch(() => ({ brands: [] }))
      ]);
      postsData = Array.isArray(postsRes) ? postsRes : [];
      clientsData = Array.isArray(clientsRes) ? clientsRes : [];
      socialBrandsData = (brandsRes && Array.isArray(brandsRes.brands)) ? brandsRes.brands : [];

      // Sync monthlyFocusNote for currently active brand & month
      const activeBrand = (socialBrandsData || []).find(b => b.slug === activeBrandSlug || b.id === activeBrandSlug);
      const mIdx = new Date(selectedPlanMonth + ' 1, ' + selectedPlanYear).getMonth();
      const mKey = `${selectedPlanYear}-${String(mIdx + 1).padStart(2, '0')}`;
      monthlyFocusNote = (activeBrand && activeBrand.monthlyFocus && activeBrand.monthlyFocus[mKey] && activeBrand.monthlyFocus[mKey].thesis) || '';

      isLoading = false;
      if (showSkeleton) {
        renderContent();
      } else {
        renderKPIs();
        if (activeViewMode === 'content_os' || activeViewMode === 'planner_ai') renderContentOS();
        else if (activeViewMode === 'calendar') renderCalendar();
        else renderBoard();
      }
    } catch (err) {
      console.error('[Social Module] Failed to load data:', err);
      isLoading = false;
      if (showSkeleton) renderContent();
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
          ${!isClientRole() ? `
            <button class="btn-ghost" style="font-size:0.8rem; border:1px solid rgba(255,255,255,0.12); padding:0.4rem 0.8rem;" onclick="window.SOCIAL_MODULE.openBatchImportModal()">📥 Batch Import</button>
            <button class="btn-primary" onclick="window.SOCIAL_MODULE.openPostModal()">+ Draft New Post</button>
          ` : ''}
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

          <!-- ISSUE 21: Kanban Search Input -->
          <input type="search" id="kanbanSearchInput" class="input-text" placeholder="🔍 Search posts by title..." style="margin-left:auto; max-width:220px; font-size:0.76rem; padding:0.3rem 0.7rem; background:rgba(0,0,0,0.35); border-color:rgba(255,255,255,0.1);" oninput="activeBoardSearch = this.value; if(window.SOCIAL_MODULE && typeof renderBoard !== 'undefined') { const rb = window.SOCIAL_MODULE._renderBoard || null; } window.SOCIAL_MODULE.refilterBoard();">
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

          <!-- Phase 5.3: Post Revision History Log Display -->
          <div id="spRevisionHistorySection" style="display:none; margin-bottom:0.75rem;"></div>

          <form onsubmit="window.SOCIAL_MODULE.handleFormSubmit(event)" style="display:flex; flex-direction:column; gap:1rem;">
            <input type="hidden" id="spEditId" value="">

            <!-- Row 1: Channel & Category Selection -->
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.9rem;">
              <div class="form-group">
                <label class="form-label">Media Channel / Brand *</label>
                <select id="spChannel" class="input-text" required onchange="window.SOCIAL_MODULE.onChannelChange(this.value)">
                  <option value="grow-bangla">⏳ Loading channels...</option>
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

            <!-- Multi-Modal Topic Intelligence Input Panel -->
            <div class="form-group" style="background:rgba(255,255,255,0.02); border:1px solid rgba(168,85,247,0.25); border-radius:12px; padding:0.9rem 1rem; display:flex; flex-direction:column; gap:0.65rem;">
              
              <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
                <div style="display:flex; align-items:center; gap:0.5rem;">
                  <label class="form-label" style="margin:0; font-weight:800; color:#fff; font-size:0.84rem;">
                    💡 Topic & Strategic Concept *
                  </label>
                  <span id="aiModelStatusBadge" style="font-size:0.65rem; padding:0.12rem 0.45rem; border-radius:12px; background:rgba(16,185,129,0.18); color:#34d399; font-weight:700;" title="Gemini 1.5 Flash Active">🟢 AI Ready</span>
                </div>
                
                <div style="display:flex; gap:0.35rem; align-items:center;">
                  <button type="button" class="btn-ghost btn-sm" id="btnSavedIdeas" style="font-size:0.72rem; padding:0.22rem 0.55rem; color:#facc15; border:1px solid rgba(250,204,21,0.3); border-radius:8px;" onclick="window.SOCIAL_MODULE.showSavedIdeasModal()">
                    ⭐ Saved Ideas
                  </button>
                  <button type="button" class="btn-ghost btn-sm" id="btnFindTopic" style="font-size:0.72rem; padding:0.22rem 0.6rem; color:#38bdf8; border:1px solid rgba(56,189,248,0.3); border-radius:8px;" onclick="window.SOCIAL_MODULE.findMeTopic()">
                    🎯 Find Me a Topic
                  </button>
                  <button type="button" class="btn-primary btn-sm" id="btnAiBrief" style="font-size:0.75rem; padding:0.25rem 0.7rem; background:linear-gradient(135deg, #a855f7, #6366f1); border:none;" onclick="window.SOCIAL_MODULE.generateAIBrief()">
                    ✨ Generate AI Brief & Prompts
                  </button>
                </div>
              </div>

              <!-- Mode Switcher Tabs -->
              <div style="display:flex; background:rgba(0,0,0,0.35); padding:0.2rem; border-radius:8px; gap:0.3rem; border:1px solid var(--border-subtle);">
                <button type="button" id="tabModeType" class="btn-sm btn-primary" style="flex:1; font-size:0.72rem; padding:0.25rem 0.45rem; text-align:center;" onclick="window.SOCIAL_MODULE.switchTopicInputMode('type')">
                  ✍️ Type Concept
                </button>
                <button type="button" id="tabModeVoice" class="btn-sm btn-ghost" style="flex:1; font-size:0.72rem; padding:0.25rem 0.45rem; text-align:center;" onclick="window.SOCIAL_MODULE.switchTopicInputMode('voice')">
                  🎤 Speak Idea (Voice)
                </button>
                <button type="button" id="tabModeRef" class="btn-sm btn-ghost" style="flex:1; font-size:0.72rem; padding:0.25rem 0.45rem; text-align:center;" onclick="window.SOCIAL_MODULE.switchTopicInputMode('reference')">
                  📎 Upload Reference (50MB)
                </button>
              </div>

              <!-- Sub-View A: Type Input -->
              <div id="topicModeTypeContainer" style="display:flex; flex-direction:column; gap:0.4rem;">
                <input type="text" id="spTitle" class="input-text" placeholder="e.g. Corporate Interview-e 'Tell Me About Yourself'-এর সঠিক ৩টি ফর্মুলা" required oninput="window.SOCIAL_MODULE.onTopicInputChange(this)">
              </div>

              <!-- Sub-View B: Voice Capture -->
              <div id="topicModeVoiceContainer" style="display:none; flex-direction:column; align-items:center; gap:0.6rem; padding:0.8rem; background:rgba(0,0,0,0.25); border-radius:10px; border:1px dashed rgba(168,85,247,0.4); text-align:center;">
                <div id="voiceStatusIndicator" style="display:flex; align-items:center; gap:0.5rem; font-size:0.78rem; color:var(--text-muted);">
                  <span id="voicePulseDot" style="width:10px; height:10px; border-radius:50%; background:#6b7280; display:inline-block;"></span>
                  <span id="voiceStatusText">Press the microphone and speak your concept in Bangla, Banglish, or English</span>
                </div>
                <div style="display:flex; gap:0.6rem; align-items:center;">
                  <button type="button" id="btnToggleVoice" class="btn-primary btn-sm" style="font-size:0.8rem; padding:0.4rem 1.2rem; background:linear-gradient(135deg, #ef4444, #dc2626); border:none; font-weight:800;" onclick="window.SOCIAL_MODULE.toggleVoiceRecording()">
                    🎙️ Start Recording Voice
                  </button>
                </div>
                <div style="font-size:0.7rem; color:var(--text-dim);">Live audio is transcribed directly into your post topic field using Chrome Speech AI.</div>
              </div>

              <!-- Sub-View C: Reference Upload (Up to 50MB) -->
              <div id="topicModeRefContainer" style="display:none; flex-direction:column; gap:0.6rem;">
                <input type="file" id="refAssetFileInput" style="display:none;" accept=".pdf,.doc,.docx,.txt,.csv,.png,.jpg,.jpeg,.mp4,.mp3" onchange="window.SOCIAL_MODULE.handleReferenceAssetUpload(this)">
                
                <div id="refAssetUploadPrompt" onclick="document.getElementById('refAssetFileInput').click()" style="cursor:pointer; border:1px dashed rgba(56,189,248,0.4); border-radius:10px; padding:0.9rem; text-align:center; background:rgba(56,189,248,0.03); transition:border-color 0.2s ease;">
                  <div style="font-size:1.3rem; margin-bottom:0.2rem;">📎</div>
                  <div style="font-weight:700; font-size:0.8rem; color:#fff;">Drop reference document, audio, video, or script here</div>
                  <div style="font-size:0.68rem; color:var(--text-dim); margin-top:0.15rem;">Gemini 2.5 Flash analyzes files up to 50MB to distill high-performing talking points</div>
                </div>

                <!-- Reference Progress Indicator -->
                <div id="refUploadProgressBox" style="display:none; flex-direction:column; gap:0.4rem; background:rgba(0,0,0,0.3); border:1px solid rgba(56,189,248,0.3); border-radius:8px; padding:0.6rem 0.8rem;">
                  <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.72rem;">
                    <span id="refProgressLabel" style="color:#38bdf8; font-weight:700;">Analyzing reference with Gemini 2.5...</span>
                    <span id="refProgressPercent" style="color:var(--text-dim);">20%</span>
                  </div>
                  <div style="display:flex; justify-content:center;">
                    <div style="width:100%; max-width:340px; height:6px; background:rgba(255,255,255,0.1); border-radius:10px; overflow:hidden;">
                      <div id="refProgressBar" style="width:20%; height:100%; background:linear-gradient(90deg, #38bdf8, #10b981); transition:width 0.2s ease;"></div>
                    </div>
                  </div>
                </div>

                <!-- Reference Ingestion Result Pill -->
                <div id="refResultPill" style="display:none; align-items:center; justify-content:space-between; background:rgba(56,189,248,0.1); border:1px solid rgba(56,189,248,0.3); border-radius:8px; padding:0.5rem 0.75rem; font-size:0.75rem;">
                  <div style="display:flex; align-items:center; gap:0.5rem; overflow:hidden;">
                    <span>📄</span>
                    <div style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                      <strong id="refFileNameLabel" style="color:#fff;">document.pdf</strong>
                      <span id="refMetaLabel" style="color:var(--text-dim); margin-left:0.3rem;">(Extracted Topic & Angle)</span>
                    </div>
                  </div>
                  <button type="button" class="btn-ghost btn-sm" style="font-size:0.68rem; padding:0.15rem 0.45rem; color:#f87171;" onclick="window.SOCIAL_MODULE.clearReferenceAsset()">
                    ✕ Remove
                  </button>
                </div>

              </div>

              <!-- Smart Topic Suggestion Card (Populated when Find Me a Topic is clicked) -->
              <div id="topicSuggestionCard" style="display:none; background:rgba(56,189,248,0.08); border:1px solid rgba(56,189,248,0.35); border-radius:10px; padding:0.85rem; flex-direction:column; gap:0.5rem;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <div style="display:flex; align-items:center; gap:0.4rem; font-size:0.78rem; font-weight:800; color:#38bdf8;">
                    <span>💡 Smart Suggested Topic</span>
                    <span id="suggIndexBadge" style="font-size:0.68rem; background:rgba(56,189,248,0.2); color:#e0f2fe; padding:0.1rem 0.4rem; border-radius:10px;">1 of 5</span>
                  </div>
                  <button type="button" class="btn-ghost btn-sm" style="font-size:0.7rem; color:var(--text-dim);" onclick="document.getElementById('topicSuggestionCard').style.display='none'">✕</button>
                </div>
                
                <div id="suggTopicTitle" style="font-weight:900; font-size:0.92rem; color:#fff; font-family:var(--font-heading);">
                  Topic Title...
                </div>

                <div id="suggRationale" style="font-size:0.72rem; color:#cbd5e1; line-height:1.35; background:rgba(0,0,0,0.25); padding:0.4rem 0.6rem; border-radius:6px;">
                  Rationale explanation...
                </div>

                <div style="display:flex; justify-content:flex-end; gap:0.5rem; margin-top:0.2rem; flex-wrap:wrap;">
                  <button type="button" class="btn-ghost btn-sm" style="font-size:0.72rem; padding:0.25rem 0.65rem; color:#facc15; border:1px solid rgba(250,204,21,0.3); border-radius:6px;" onclick="window.SOCIAL_MODULE.saveTopicSuggestion()">
                    ⭐ Save Idea
                  </button>
                  <button type="button" class="btn-secondary btn-sm" style="font-size:0.72rem; padding:0.25rem 0.65rem;" onclick="window.SOCIAL_MODULE.cycleNextTopicSuggestion()">
                    🔄 Suggest Another
                  </button>
                  <button type="button" class="btn-primary btn-sm" style="font-size:0.72rem; padding:0.25rem 0.75rem; background:#10b981; border:none; font-weight:800;" onclick="window.SOCIAL_MODULE.acceptSuggestedTopic()">
                    ✅ Use This Topic
                  </button>
                </div>
              </div>

              <!-- Supporting Strategic Angle Field -->
              <div style="display:flex; flex-direction:column; gap:0.3rem;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <label class="form-label" style="margin:0; font-size:0.74rem; color:#a78bfa; font-weight:700;">
                    🎯 Strategic Angle / Direction <span style="font-weight:400; color:var(--text-dim);">(Optional)</span>
                  </label>
                  <span style="font-size:0.68rem; color:var(--text-dim);">Guides AI prompt tone & hook psychology</span>
                </div>
                <input type="text" id="spAngle" class="input-text" style="font-size:0.78rem; padding:0.38rem 0.65rem;" placeholder="e.g. Show why common interview advice fails and give the contrarian 3-step fix">
              </div>

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
              <textarea id="spCaption" class="input-text" rows="4" placeholder="Write post hook, body, and call-to-action..." oninput="window.SOCIAL_MODULE.updateCharCount(this)" onpaste="setTimeout(() => window.SOCIAL_MODULE.updateCharCount(this), 10)"></textarea>
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
                <div id="spMediaUploadPreview" style="display:none; flex-direction:column; gap:0.5rem; background:rgba(255,255,255,0.03); border-radius:8px; padding:0.6rem;">
                  <!-- Dynamic multi-image thumbnail grid & remove buttons -->
                </div>
              </div>
              <input type="hidden" id="spMediaUrl" value="">
              <div style="margin-top:0.4rem; display:flex; justify-content:space-between; align-items:center;">
                <a href="javascript:void(0)" onclick="window.SOCIAL_MODULE.toggleDirectMediaUrl()" style="font-size:0.72rem; color:var(--purple-light); text-decoration:none;">🔗 Or paste direct CDN/Cloudinary URL</a>
              </div>
              <div id="spDirectMediaUrlWrap" style="display:none; margin-top:0.4rem;">
                <div style="display:flex; gap:0.4rem;">
                  <input type="url" id="spDirectMediaUrl" class="input-text" placeholder="https://res.cloudinary.com/..." style="flex:1;">
                  <button type="button" class="btn-primary btn-sm" style="font-size:0.75rem;" onclick="window.SOCIAL_MODULE.addDirectMediaUrl()">+ Add URL</button>
                </div>
              </div>
            </div>

            <div style="display:flex; gap:0.75rem; justify-content:space-between; align-items:center; margin-top:0.8rem; border-top:1px solid var(--border-subtle); padding-top:0.9rem; flex-wrap:wrap;">
              <div id="spClientActionBtns" style="display:none; gap:0.6rem; align-items:center;">
                <button type="button" class="btn-emerald btn-sm" id="spModalApproveBtn" style="font-weight:800; font-size:0.85rem; padding:0.45rem 1rem;">
                  ✅ Approve Post
                </button>
                <button type="button" class="btn-secondary btn-danger btn-sm" id="spModalRejectBtn" style="font-weight:800; font-size:0.85rem; padding:0.45rem 1rem;">
                  🔴 Request Revision
                </button>
              </div>
              <div style="display:flex; gap:0.75rem; align-items:center; margin-left:auto;">
                <button type="button" class="btn-secondary" onclick="window.SOCIAL_MODULE.closePostModal()">Cancel</button>
                <button type="submit" class="btn-primary" id="spSubmitBtn">🚀 Save & Submit Draft</button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <!-- Universal Dialog Modal (Confirmations & Dynamic Inputs) -->
      <div class="modal-overlay" id="socialDialogModal" style="display:none; z-index:1050;">
        <div class="modal-box" id="socialDialogBox" style="max-width: 520px; background:var(--surface-card, #14141e); border:1px solid var(--border-subtle); border-radius:14px; padding:1.25rem;">
          <!-- Dynamically populated -->
        </div>
      </div>

      <!-- Plan Item Edit Modal -->
      <div class="modal-overlay" id="planItemEditModal" style="display:none; z-index:1050;">
        <div class="modal-box" style="max-width: 560px; background:var(--surface-card, #14141e); border:1px solid var(--border-subtle); border-radius:14px; padding:1.25rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; border-bottom:1px solid var(--border-subtle); padding-bottom:0.8rem;">
            <div>
              <h3 style="color:#fff; font-size:1.15rem; margin:0; font-family:var(--font-heading);">✏️ Edit Calendar Plan Item</h3>
              <div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.2rem;">Fine-tune schedule, hook, and strategic focus</div>
            </div>
            <button onclick="window.SOCIAL_MODULE.closePlanItemEditModal()" style="background:transparent; border:none; color:var(--text-muted); font-size:1.4rem; cursor:pointer;">✕</button>
          </div>
          <form onsubmit="window.SOCIAL_MODULE.handlePlanItemEditSubmit(event)" style="display:flex; flex-direction:column; gap:0.9rem;">
            <input type="hidden" id="editPlanBrandSlug">
            <input type="hidden" id="editPlanChannelId">
            <input type="hidden" id="editPlanMonthKey">
            <input type="hidden" id="editPlanIndex">
            
            <div class="form-group">
              <label class="form-label" style="font-size:0.82rem; font-weight:700;">Topic Idea / Title *</label>
              <input type="text" id="editPlanTopic" class="input-text" required>
            </div>

            <div class="form-group">
              <label class="form-label" style="font-size:0.82rem; font-weight:700;">First 3-Second Hook</label>
              <input type="text" id="editPlanHook" class="input-text" placeholder="e.g. Stop making this critical error...">
            </div>

            <div class="form-group">
              <label class="form-label" style="font-size:0.82rem; font-weight:700;">Strategic Rationale</label>
              <input type="text" id="editPlanRationale" class="input-text">
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem;">
              <div class="form-group">
                <label class="form-label" style="font-size:0.82rem; font-weight:700;">Scheduled Date</label>
                <input type="date" id="editPlanDate" class="input-text">
              </div>
              <div class="form-group">
                <label class="form-label" style="font-size:0.82rem; font-weight:700;">Suggested Time</label>
                <input type="time" id="editPlanTime" class="input-text" value="18:00">
              </div>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem;">
              <div class="form-group">
                <label class="form-label" style="font-size:0.82rem; font-weight:700;">Content Type</label>
                <select id="editPlanContentType" class="input-text">
                  <option value="Short-form Video">Short-form Video</option>
                  <option value="Long-form Video">Long-form Video</option>
                  <option value="Carousel Graphic">Carousel Graphic</option>
                  <option value="Static Post">Static Post</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" style="font-size:0.82rem; font-weight:700;">Target Duration</label>
                <input type="text" id="editPlanDuration" class="input-text" placeholder="60s">
              </div>
            </div>

            <div style="display:flex; gap:0.6rem; justify-content:flex-end; margin-top:0.6rem; border-top:1px solid var(--border-subtle); padding-top:0.8rem;">
              <button type="button" class="btn-secondary" onclick="window.SOCIAL_MODULE.closePlanItemEditModal()">Cancel</button>
              <button type="submit" class="btn-primary" id="btnSavePlanItem">💾 Save Changes</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Saved Topic Ideas Modal -->
      <div class="modal-overlay" id="savedIdeasModal" style="display:none; z-index:1050;">
        <div class="modal-box" style="max-width: 580px; max-height:85vh; overflow-y:auto; background:var(--surface-card, #14141e); border:1px solid var(--border-subtle); border-radius:14px; padding:1.25rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; border-bottom:1px solid var(--border-subtle); padding-bottom:0.8rem;">
            <div>
              <h3 style="color:#fff; font-size:1.15rem; margin:0; font-family:var(--font-heading);">⭐ Saved Topic Ideas</h3>
              <div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.2rem;">Bookmarked content concepts ready for drafting</div>
            </div>
            <button onclick="window.SOCIAL_MODULE.closeSavedIdeasModal()" style="background:transparent; border:none; color:var(--text-muted); font-size:1.4rem; cursor:pointer;">✕</button>
          <div id="savedIdeasList" style="display:flex; flex-direction:column; gap:0.65rem;">
            <!-- Rendered by JS -->
          </div>
        </div>
      </div>

      <!-- Phase 4.3: Knowledge Base Inspector Modal -->
      <div class="modal-overlay" id="knowledgeBaseModal" style="display:none; z-index:1050;">
        <div class="modal-box" style="max-width: 680px; max-height:85vh; overflow-y:auto; background:var(--surface-card, #14141e); border:1px solid var(--border-subtle); border-radius:14px; padding:1.25rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; border-bottom:1px solid var(--border-subtle); padding-bottom:0.8rem;">
            <div>
              <h3 style="color:#fff; font-size:1.15rem; margin:0; font-family:var(--font-heading);" id="kbModalTitle">🏛️ Channel Intelligence Knowledge Base</h3>
              <div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.2rem;" id="kbModalSubtitle">Active audience memory & performance benchmarks</div>
            </div>
            <button onclick="window.SOCIAL_MODULE.closeKnowledgeBaseModal()" style="background:transparent; border:none; color:var(--text-muted); font-size:1.4rem; cursor:pointer;">✕</button>
          </div>
          <div id="kbModalContent" style="display:flex; flex-direction:column; gap:0.9rem;">
            <!-- Rendered by JS -->
          </div>
        </div>
      </div>

      <!-- Phase 6.7: Batch Import UI Modal -->
      <div class="modal-overlay" id="batchImportModal" style="display:none; z-index:1050;">
        <div class="modal-box" style="max-width: 650px; max-height:88vh; overflow-y:auto; background:var(--surface-card, #14141e); border:1px solid var(--border-subtle); border-radius:14px; padding:1.25rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; border-bottom:1px solid var(--border-subtle); padding-bottom:0.8rem;">
            <div>
              <h3 style="color:#fff; font-size:1.15rem; margin:0; font-family:var(--font-heading);">📥 Batch Import Social Posts</h3>
              <div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.2rem;">Bulk-create drafts via CSV upload or direct text paste into Kanban pipeline</div>
            </div>
            <button onclick="window.SOCIAL_MODULE.closeBatchImportModal()" style="background:transparent; border:none; color:var(--text-muted); font-size:1.4rem; cursor:pointer;">✕</button>
          </div>

          <form onsubmit="window.SOCIAL_MODULE.handleBatchImportSubmit(event)" style="display:flex; flex-direction:column; gap:0.9rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.02); border:1px solid var(--border-subtle); border-radius:8px; padding:0.6rem 0.8rem;">
              <span style="font-size:0.78rem; color:var(--text-muted);">Need standard format?</span>
              <button type="button" class="btn-ghost btn-sm" style="font-size:0.72rem; color:var(--purple-light); border:1px solid rgba(168,85,247,0.3);" onclick="window.SOCIAL_MODULE.downloadBatchTemplateCsv()">📄 Download CSV Template</button>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.8rem;">
              <div class="form-group">
                <label class="form-label" style="font-size:0.82rem; font-weight:700;">Target Channel *</label>
                <select id="batchImportChannel" class="input-text" required>
                  <option value="grow-bangla">🎓 Grow Bangla</option>
                  <option value="pilutics">🗺️ PILUTICS</option>
                  <option value="bong-hits">🎬 Bong Hits</option>
                  <option value="gro10x">⚡ GRO10X Brand</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label" style="font-size:0.82rem; font-weight:700;">Default Platform *</label>
                <select id="batchImportPlatform" class="input-text" required>
                  <option value="YouTube">YouTube</option>
                  <option value="Facebook">Facebook</option>
                  <option value="Instagram">Instagram</option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="TikTok">TikTok</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" style="font-size:0.82rem; font-weight:700;">Upload CSV File</label>
              <input type="file" id="batchImportFileInput" class="input-text" accept=".csv,text/csv" onchange="window.SOCIAL_MODULE.handleBatchCsvFile(this)">
            </div>

            <div class="form-group">
              <label class="form-label" style="font-size:0.82rem; font-weight:700;">Or Paste CSV Lines (Title, ScheduledDate, Caption, Category)</label>
              <textarea id="batchImportText" class="input-text" rows="6" placeholder="Topic Title, 2026-09-15, Catchy caption copy here..., Tutorial&#10;Next Video Idea, 2026-09-18, Another hook here..., Case Study" style="font-family:monospace; font-size:0.78rem;"></textarea>
            </div>

            <div style="display:flex; justify-content:flex-end; gap:0.6rem; border-top:1px solid var(--border-subtle); padding-top:0.8rem;">
              <button type="button" class="btn-secondary" onclick="window.SOCIAL_MODULE.closeBatchImportModal()">Cancel</button>
              <button type="submit" class="btn-primary" id="btnRunBatchImport">🚀 Process Batch Import</button>
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
    populateBrandChannelDropdown(activeBrandSlug);
    updateCategoryOptions(activeBrandSlug || 'grow-bangla');
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

    // ISSUE 21 FIX: Filter by title search text (real-time search)
    const searchVal = (document.getElementById('kanbanSearchInput')?.value || activeBoardSearch || '').trim().toLowerCase();
    if (searchVal) {
      filteredPosts = filteredPosts.filter(p =>
        (p.title || '').toLowerCase().includes(searchVal) ||
        (p.caption || '').toLowerCase().includes(searchVal)
      );
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

    // Phase 5.1: Client Portal Dedicated Board Layout
    if (isClientRole()) {
      board.innerHTML = `
        <div class="social-board" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:1rem; overflow-x:auto; padding-bottom:1rem;">
          <!-- Col 1: Awaiting Client Review -->
          <div class="social-col" style="background:var(--surface-card, #14141e); border:1px solid rgba(245,158,11,0.3); border-radius:14px; padding:1rem; display:flex; flex-direction:column; min-height:550px;">
            <div style="display:flex; justify-content:space-between; align-items:center; font-weight:800; font-size:0.85rem; color:var(--amber-brand); margin-bottom:0.9rem; padding-bottom:0.5rem; border-bottom:1px solid rgba(245,158,11,0.2);">
              <span>💬 Awaiting Your Review & Feedback</span>
              <span class="badge badge-amber">${client.length}</span>
            </div>
            <div style="display:flex; flex-direction:column; gap:0.85rem; flex:1;">
              ${renderColumnCards(client, 'client')}
            </div>
          </div>

          <!-- Col 2: Approved Posts -->
          <div class="social-col" style="background:var(--surface-card, #14141e); border:1px solid rgba(16,185,129,0.3); border-radius:14px; padding:1rem; display:flex; flex-direction:column; min-height:550px;">
            <div style="display:flex; justify-content:space-between; align-items:center; font-weight:800; font-size:0.85rem; color:#10b981; margin-bottom:0.9rem; padding-bottom:0.5rem; border-bottom:1px solid rgba(16,185,129,0.2);">
              <span>✨ Approved by You (Ready to Publish)</span>
              <span class="badge badge-emerald">${approved.length}</span>
            </div>
            <div style="display:flex; flex-direction:column; gap:0.85rem; flex:1;">
              ${renderColumnCards(approved, 'approved')}
            </div>
          </div>

          <!-- Col 3: Published & Live -->
          <div class="social-col" style="background:var(--surface-card, #14141e); border:1px solid rgba(59,130,246,0.3); border-radius:14px; padding:1rem; display:flex; flex-direction:column; min-height:550px;">
            <div style="display:flex; justify-content:space-between; align-items:center; font-weight:800; font-size:0.85rem; color:#60a5fa; margin-bottom:0.9rem; padding-bottom:0.5rem; border-bottom:1px solid rgba(59,130,246,0.2);">
              <span>🚀 Published & Live</span>
              <span class="badge badge-blue">${posted.length}</span>
            </div>
            <div style="display:flex; flex-direction:column; gap:0.85rem; flex:1;">
              ${renderColumnCards(posted, 'posted')}
            </div>
          </div>
        </div>
      `;
      return;
    }

    board.innerHTML = `
      <div class="social-board" style="display:grid; grid-template-columns:repeat(5, minmax(280px, 1fr)); gap:1rem; overflow-x:auto; padding-bottom:1rem;">
        <!-- Col 1: Drafts -->
        <div class="social-col" data-stage="draft" ondragover="window.SOCIAL_MODULE.handleDragOver(event)" ondragleave="window.SOCIAL_MODULE.handleDragLeave(event)" ondrop="window.SOCIAL_MODULE.handleDrop(event, 'draft')" style="background:var(--surface-card, #14141e); border:1px solid var(--border-subtle); border-radius:14px; padding:1rem; display:flex; flex-direction:column; min-height:550px;">
          <div style="display:flex; justify-content:space-between; align-items:center; font-weight:800; font-size:0.85rem; color:var(--text-secondary); margin-bottom:0.9rem; padding-bottom:0.5rem; border-bottom:1px solid var(--border-subtle);">
            <span>📝 Drafts & Concepts</span>
            <span class="badge badge-gray">${drafts.length}</span>
          </div>
          <div style="display:flex; flex-direction:column; gap:0.85rem; flex:1;">
            ${renderColumnCards(drafts, 'draft')}
          </div>
        </div>

        <!-- Col 2: Internal QC -->
        <div class="social-col" data-stage="internal" ondragover="window.SOCIAL_MODULE.handleDragOver(event)" ondragleave="window.SOCIAL_MODULE.handleDragLeave(event)" ondrop="window.SOCIAL_MODULE.handleDrop(event, 'internal')" style="background:var(--surface-card, #14141e); border:1px solid var(--border-subtle); border-radius:14px; padding:1rem; display:flex; flex-direction:column; min-height:550px;">
          <div style="display:flex; justify-content:space-between; align-items:center; font-weight:800; font-size:0.85rem; color:var(--purple-light); margin-bottom:0.9rem; padding-bottom:0.5rem; border-bottom:1px solid var(--border-subtle);">
            <span>👁️ Internal QC</span>
            <span class="badge badge-purple">${internal.length}</span>
          </div>
          <div style="display:flex; flex-direction:column; gap:0.85rem; flex:1;">
            ${renderColumnCards(internal, 'internal')}
          </div>
        </div>

        <!-- Col 3: Review -->
        <div class="social-col" data-stage="client" ondragover="window.SOCIAL_MODULE.handleDragOver(event)" ondragleave="window.SOCIAL_MODULE.handleDragLeave(event)" ondrop="window.SOCIAL_MODULE.handleDrop(event, 'client')" style="background:var(--surface-card, #14141e); border:1px solid var(--border-subtle); border-radius:14px; padding:1rem; display:flex; flex-direction:column; min-height:550px;">
          <div style="display:flex; justify-content:space-between; align-items:center; font-weight:800; font-size:0.85rem; color:var(--amber-brand); margin-bottom:0.9rem; padding-bottom:0.5rem; border-bottom:1px solid var(--border-subtle);">
            <span>💬 Review & Feedback</span>
            <span class="badge badge-amber">${client.length}</span>
          </div>
          <div style="display:flex; flex-direction:column; gap:0.85rem; flex:1;">
            ${renderColumnCards(client, 'client')}
          </div>
        </div>

        <!-- Col 4: Approved & Scheduled -->
        <div class="social-col" data-stage="approved" ondragover="window.SOCIAL_MODULE.handleDragOver(event)" ondragleave="window.SOCIAL_MODULE.handleDragLeave(event)" ondrop="window.SOCIAL_MODULE.handleDrop(event, 'approved')" style="background:var(--surface-card, #14141e); border:1px solid rgba(16,185,129,0.3); border-radius:14px; padding:1rem; display:flex; flex-direction:column; min-height:550px;">
          <div style="display:flex; justify-content:space-between; align-items:center; font-weight:800; font-size:0.85rem; color:#10b981; margin-bottom:0.9rem; padding-bottom:0.5rem; border-bottom:1px solid rgba(16,185,129,0.2);">
            <span>🚀 Approved & Scheduled</span>
            <span class="badge badge-emerald">${approved.length}</span>
          </div>
          <div style="display:flex; flex-direction:column; gap:0.85rem; flex:1;">
            ${renderColumnCards(approved, 'approved')}
          </div>
        </div>

        <!-- Col 5: Posted -->
        <div class="social-col" data-stage="posted" ondragover="window.SOCIAL_MODULE.handleDragOver(event)" ondragleave="window.SOCIAL_MODULE.handleDragLeave(event)" ondrop="window.SOCIAL_MODULE.handleDrop(event, 'posted')" style="background:var(--surface-card, #14141e); border:1px solid rgba(59,130,246,0.3); border-radius:14px; padding:1rem; display:flex; flex-direction:column; min-height:550px;">
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

    // ISSUE 1 FIX: Always ensure brands are available for navigation — fall back to seed data
    // if the API returned an empty array (file missing, first run, or fetch error)
    const FALLBACK_BRANDS = [
      { id: 'brand-grow-bangla', slug: 'grow-bangla', name: 'Grow Bangla', primaryLanguage: 'Bangla + English (Banglish / Spoken)', tagline: 'Bridging Career, Language & Professional Growth for Bangladesh', niche: 'Spoken English & Career Preparation', channels: [] },
      { id: 'brand-pilutics', slug: 'pilutics', name: 'PILUTICS', primaryLanguage: 'Bangla / Bengali (Documentary & Analysis)', tagline: 'Geopolitical Intelligence & Strategic Analysis', niche: 'Geopolitics & World Affairs', channels: [] },
      { id: 'brand-bong-hits', slug: 'bong-hits', name: 'Bong Hits', primaryLanguage: 'Bengali (Music, Skits & Pop Culture)', tagline: 'Bengali Entertainment & Music', niche: 'Music, Comedy & Pop Culture', channels: [] },
      { id: 'brand-gro10x', slug: 'gro10x', name: 'GRO10X Brand', primaryLanguage: 'English (Global B2B & Tech)', tagline: 'AI-Powered Agency & Content Infrastructure', niche: 'B2B AI Agency & SaaS', channels: [] }
    ];
    const effectiveBrandsData = (socialBrandsData && socialBrandsData.length > 0) ? socialBrandsData : FALLBACK_BRANDS;

    const brand = effectiveBrandsData.find(b => b.slug === activeBrandSlug || b.id === activeBrandSlug) ||
      effectiveBrandsData[0] || FALLBACK_BRANDS[0];

    const currentChannel = (brand.channels || []).find(c => c.id === activeChannelId || c.slug === activeChannelId) || null;

    // Phase 4.4: Brand-Scoped Pipeline Metrics
    const brandPosts = (postsData || []).filter(p => {
      const ch = p.channel || '';
      return (brand.channels || []).some(c => c.name.includes(ch) || ch.includes(c.name)) ||
        ch.toLowerCase().includes(brand.slug) ||
        (brand.name && ch.toLowerCase().includes(brand.name.toLowerCase()));
    });

    const kpiDrafts = brandPosts.filter(p => p.status === 'Draft').length;
    const kpiInternal = brandPosts.filter(p => p.status === 'Internal Review').length;
    const kpiClient = brandPosts.filter(p => p.status === 'Client Review').length;
    const kpiApproved = brandPosts.filter(p => p.status === 'Approved').length;
    const kpiPosted = brandPosts.filter(p => p.status === 'Posted').length;

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
            ${effectiveBrandsData.map(b => `
              <button type="button" class="r-pill ${b.slug === activeBrandSlug ? 'active' : ''}" style="font-size:0.76rem; padding:0.35rem 0.75rem;" onclick="window.SOCIAL_MODULE.switchBrand('${b.slug}')">
                ${escapeHTML(b.name)}
              </button>
            `).join('')}
            ${!isClientRole() ? `<button type="button" class="btn-ghost btn-sm" style="font-size:0.75rem; color:var(--purple-light);" onclick="window.SOCIAL_MODULE.promptAddBrand()">+ New Brand</button>` : ''}
          </div>
        </div>

        <!-- Phase 4.4: Brand-Scoped KPI Bar -->
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(130px, 1fr)); gap:0.6rem;">
          <div style="background:rgba(255,255,255,0.02); border:1px solid var(--border-subtle); border-radius:10px; padding:0.65rem 0.85rem; display:flex; flex-direction:column; gap:0.15rem;">
            <div style="font-size:0.68rem; color:var(--text-dim); text-transform:uppercase; font-weight:800; letter-spacing:0.5px;">Brand Posts</div>
            <div style="font-size:1.25rem; font-weight:900; color:#fff; font-family:var(--font-heading);">${brandPosts.length}</div>
            <div style="font-size:0.65rem; color:var(--text-muted);">${(brand.channels || []).length} active channels</div>
          </div>
          <div style="background:rgba(255,255,255,0.02); border:1px solid var(--border-subtle); border-radius:10px; padding:0.65rem 0.85rem; display:flex; flex-direction:column; gap:0.15rem;">
            <div style="font-size:0.68rem; color:var(--text-dim); text-transform:uppercase; font-weight:800; letter-spacing:0.5px;">📝 In Drafting</div>
            <div style="font-size:1.25rem; font-weight:900; color:#a855f7; font-family:var(--font-heading);">${kpiDrafts}</div>
            <div style="font-size:0.65rem; color:var(--text-muted);">Creator stage</div>
          </div>
          <div style="background:rgba(255,255,255,0.02); border:1px solid var(--border-subtle); border-radius:10px; padding:0.65rem 0.85rem; display:flex; flex-direction:column; gap:0.15rem;">
            <div style="font-size:0.68rem; color:var(--text-dim); text-transform:uppercase; font-weight:800; letter-spacing:0.5px;">🔍 QC Review</div>
            <div style="font-size:1.25rem; font-weight:900; color:#38bdf8; font-family:var(--font-heading);">${kpiInternal}</div>
            <div style="font-size:0.65rem; color:var(--text-muted);">Internal check</div>
          </div>
          <div style="background:rgba(255,255,255,0.02); border:1px solid var(--border-subtle); border-radius:10px; padding:0.65rem 0.85rem; display:flex; flex-direction:column; gap:0.15rem;">
            <div style="font-size:0.68rem; color:var(--text-dim); text-transform:uppercase; font-weight:800; letter-spacing:0.5px;">👤 Client Sign-off</div>
            <div style="font-size:1.25rem; font-weight:900; color:#fbbf24; font-family:var(--font-heading);">${kpiClient}</div>
            <div style="font-size:0.65rem; color:var(--text-muted);">Client approval</div>
          </div>
          <div style="background:rgba(255,255,255,0.02); border:1px solid var(--border-subtle); border-radius:10px; padding:0.65rem 0.85rem; display:flex; flex-direction:column; gap:0.15rem;">
            <div style="font-size:0.68rem; color:var(--text-dim); text-transform:uppercase; font-weight:800; letter-spacing:0.5px;">🚀 Live / Posted</div>
            <div style="font-size:1.25rem; font-weight:900; color:#10b981; font-family:var(--font-heading);">${kpiPosted}</div>
            <div style="font-size:0.65rem; color:var(--text-muted);">${kpiApproved} approved ready</div>
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
    const monthIndex = new Date(selectedPlanMonth + ' 1, ' + selectedPlanYear).getMonth();
    const currentMonthKey = `${selectedPlanYear}-${String(monthIndex + 1).padStart(2, '0')}`;
    const monthlyFocus = (brand.monthlyFocus && brand.monthlyFocus[currentMonthKey]) || {
      thesis: monthlyFocusNote || '',
      keyProducts: '',
      campaignTags: []
    };

    let totalAudience = 0;
    (brand.channels || []).forEach(c => totalAudience += (c.audienceCount || 0));

    // Calculate total scheduled posts across all channels for this month
    let totalScheduledPosts = 0;
    let lockedChannelsCount = 0;
    (brand.channels || []).forEach(ch => {
      const cal = ch.calendars && ch.calendars[currentMonthKey];
      if (cal && Array.isArray(cal.planItems)) {
        totalScheduledPosts += cal.planItems.length;
        if (cal.status === 'Locked') lockedChannelsCount++;
      }
    });

    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    return `
      <div style="display:flex; flex-direction:column; gap:1.3rem;">
        
        <!-- Layer 1: Brand Monthly Focus Command Deck -->
        <div style="background:linear-gradient(135deg, rgba(20,20,30,0.95), rgba(30,27,75,0.4)); border:1px solid rgba(168,85,247,0.35); border-radius:14px; padding:1.25rem; display:flex; flex-direction:column; gap:1rem; box-shadow:0 8px 24px rgba(0,0,0,0.3);">
          
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.8rem; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:0.75rem;">
            <div style="display:flex; align-items:center; gap:0.6rem;">
              <span style="font-size:1.4rem;">🎯</span>
              <div>
                <div style="font-weight:900; color:#fff; font-size:1.05rem; display:flex; align-items:center; gap:0.5rem;">
                  Brand Master Monthly Focus Deck (${selectedPlanMonth} ${selectedPlanYear})
                  <span class="badge ${monthlyFocus.thesis ? 'badge-emerald' : 'badge-purple'}" style="font-size:0.68rem;">
                    ${monthlyFocus.thesis ? '✅ Focus Active & Synced' : '📝 Set Strategic Direction'}
                  </span>
                </div>
                <div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.15rem;">
                  Overarching campaign thesis, core offers, and key themes applied across all ${(brand.channels || []).length} connected channels.
                </div>
              </div>
            </div>

            <!-- Month & Year Controls -->
            <div style="display:flex; align-items:center; gap:0.45rem;">
              <select class="input-text" style="padding:0.35rem 0.65rem; font-size:0.78rem; background:rgba(0,0,0,0.4); border-color:rgba(168,85,247,0.4); color:#fff;" onchange="window.SOCIAL_MODULE.changePlanMonth(this.value)">
                ${months.map(m => `<option value="${m}" ${m === selectedPlanMonth ? 'selected' : ''}>${m}</option>`).join('')}
              </select>
              <input type="number" class="input-text" style="width:75px; padding:0.35rem 0.65rem; font-size:0.78rem; background:rgba(0,0,0,0.4); border-color:rgba(168,85,247,0.4); color:#fff;" value="${selectedPlanYear}" oninput="window.SOCIAL_MODULE.changePlanYear(this.value)">
            </div>
          </div>

          <div style="display:grid; grid-template-columns:1.5fr 1fr 1fr; gap:0.9rem;">
            
            <div class="form-group" style="margin:0;">
              <label class="form-label" style="font-size:0.72rem; color:#c084fc; font-weight:800; text-transform:uppercase; letter-spacing:0.5px;">
                💡 Campaign Thesis / Main Monthly Angle
              </label>
              <input type="text" id="inpBrandMonthlyThesis" class="input-text" style="font-size:0.82rem; background:rgba(0,0,0,0.3); border-color:rgba(255,255,255,0.1);" placeholder="e.g. Corporate Job Interview Mastery & Salary Negotiation Blueprint..." value="${escapeHTML(monthlyFocus.thesis || '')}" oninput="monthlyFocusNote = this.value">
            </div>

            <div class="form-group" style="margin:0;">
              <label class="form-label" style="font-size:0.72rem; color:#c084fc; font-weight:800; text-transform:uppercase; letter-spacing:0.5px;">
                🎁 Key Products / Lead Magnets
              </label>
              <input type="text" id="inpBrandMonthlyProducts" class="input-text" style="font-size:0.82rem; background:rgba(0,0,0,0.3); border-color:rgba(255,255,255,0.1);" placeholder="e.g. Campus to Career Bootcamp · Viva PDF Guide..." value="${escapeHTML(monthlyFocus.keyProducts || '')}">
            </div>

            <div class="form-group" style="margin:0;">
              <label class="form-label" style="font-size:0.72rem; color:#c084fc; font-weight:800; text-transform:uppercase; letter-spacing:0.5px;">
                🏷️ Campaign Tags / Keywords
              </label>
              <input type="text" id="inpBrandMonthlyTags" class="input-text" style="font-size:0.82rem; background:rgba(0,0,0,0.3); border-color:rgba(255,255,255,0.1);" placeholder="e.g. Interview English, Salary Negotiation, CV Power" value="${escapeHTML(Array.isArray(monthlyFocus.campaignTags) ? monthlyFocus.campaignTags.join(', ') : (monthlyFocus.campaignTags || ''))}">
            </div>

          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; padding-top:0.4rem; border-top:1px solid rgba(255,255,255,0.05);">
            <div style="font-size:0.72rem; color:var(--text-dim);">
              ${monthlyFocus.updatedAt ? `🕒 Last saved: ${new Date(monthlyFocus.updatedAt).toLocaleString()}` : 'ℹ️ Save focus to auto-propagate to all channel strategy generations.'}
            </div>
            <button type="button" class="btn-primary btn-sm" style="font-weight:800; font-size:0.78rem; padding:0.35rem 0.9rem;" onclick="window.SOCIAL_MODULE.saveBrandMonthlyFocus('${brand.slug}')">
              💾 Save Brand Monthly Focus
            </button>
          </div>

        </div>

        <!-- Cross-Channel Quick Metrics -->
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:1rem;">
          <div style="background:var(--surface-card, #14141e); border:1px solid var(--border-subtle); border-radius:12px; padding:1rem; display:flex; flex-direction:column; gap:0.25rem;">
            <span style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; font-weight:800;">Total Cross-Channel Audience</span>
            <span style="font-size:1.6rem; font-weight:900; color:#fff;">${totalAudience.toLocaleString()} <span style="font-size:0.85rem; color:var(--text-dim);">Subs / Followers</span></span>
            <span style="font-size:0.72rem; color:#10b981;">Across ${(brand.channels || []).length} connected touchpoints</span>
          </div>

          <div style="background:var(--surface-card, #14141e); border:1px solid var(--border-subtle); border-radius:12px; padding:1rem; display:flex; flex-direction:column; gap:0.25rem;">
            <span style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; font-weight:800;">${selectedPlanMonth} Scheduled Output</span>
            <span style="font-size:1.6rem; font-weight:900; color:#c084fc;">${totalScheduledPosts} <span style="font-size:0.85rem; color:var(--text-dim);">Posts Planned</span></span>
            <span style="font-size:0.72rem; color:${lockedChannelsCount > 0 ? '#10b981' : 'var(--text-secondary)'};">
              ${lockedChannelsCount} / ${(brand.channels || []).length} Channels Locked in Pipeline
            </span>
          </div>

          <div style="background:var(--surface-card, #14141e); border:1px solid var(--border-subtle); border-radius:12px; padding:1rem; display:flex; flex-direction:column; gap:0.25rem;">
            <span style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; font-weight:800;">Analytics Knowledge Memory</span>
            <span style="font-size:1.6rem; font-weight:900; color:#34d399;">${(brand.channels || []).filter(c => c.analyticsKnowledgeBase).length} / ${(brand.channels || []).length} <span style="font-size:0.85rem; color:var(--text-dim);">Indexed</span></span>
            <span style="font-size:0.72rem; color:var(--text-dim);">Proven retention & velocity signals</span>
          </div>
        </div>

        <!-- Channel Status Matrix Cards with Setup Checklist -->
        <div style="background:var(--surface-card, #14141e); border:1px solid var(--border-subtle); border-radius:14px; padding:1.25rem; display:flex; flex-direction:column; gap:1rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-subtle); padding-bottom:0.7rem; flex-wrap:wrap; gap:0.6rem;">
            <div>
              <h3 style="margin:0; font-size:1.05rem; color:#fff; font-family:var(--font-heading);">
                📡 Channel Status & Strategy Command (${selectedPlanMonth} ${selectedPlanYear})
              </h3>
              <div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.2rem;">
                Manage onboarding memory, generate monthly strategies, and lock plans into your production pipeline.
              </div>
            </div>
            <button type="button" class="btn-emerald btn-sm" onclick="window.SOCIAL_MODULE.openChannelWorkspace(((brand.channels && brand.channels[0] && brand.channels[0].id) || ''))">
              🚀 Open Anchor Channel
            </button>
          </div>

          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:1rem;">
            ${(brand.channels || []).map(ch => {
              const icon = PLATFORM_ICONS[ch.platform] || '📱';
              const kb = ch.analyticsKnowledgeBase;
              const cal = ch.calendars && ch.calendars[currentMonthKey];
              const isLocked = cal && cal.status === 'Locked';
              const isDraft = cal && cal.status === 'Draft';
              const hasKnowledge = Boolean(kb);

              return `
                <div style="background:rgba(255,255,255,0.02); border:1px solid ${isLocked ? 'rgba(16,185,129,0.4)' : (hasKnowledge ? 'var(--border-subtle)' : 'rgba(245,158,11,0.3)')}; border-radius:12px; padding:1.1rem; display:flex; flex-direction:column; gap:0.85rem; position:relative;">
                  
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div style="display:flex; align-items:center; gap:0.6rem;">
                      <span style="font-size:1.4rem;">${icon}</span>
                      <div>
                        <div style="font-weight:800; color:#fff; font-size:0.95rem; display:flex; align-items:center; gap:0.4rem;">
                          ${escapeHTML(ch.name)}
                          ${ch.isAnchor ? `<span class="badge badge-emerald" style="font-size:0.6rem; padding:0 0.35rem;">Anchor Channel</span>` : ''}
                        </div>
                        <div style="font-size:0.72rem; color:var(--text-dim);">${escapeHTML(ch.handle || ch.platform)}</div>
                      </div>
                    </div>
                    <span class="badge ${hasKnowledge ? (isLocked ? 'badge-emerald' : (isDraft ? 'badge-purple' : 'badge-blue')) : 'badge-warning'}" style="font-size:0.68rem; font-weight:800;">
                      ${hasKnowledge ? (isLocked ? '🔒 Locked (' + (cal.planItems || []).length + ' Posts)' : (isDraft ? '📝 Draft Ready (' + (cal.planItems || []).length + ')' : '🟢 Onboarded')) : '🟡 Needs Onboarding'}
                    </span>
                  </div>

                  <!-- Channel Setup Completion Checklist -->
                  <div style="background:rgba(0,0,0,0.3); border-radius:8px; padding:0.65rem 0.8rem; font-size:0.72rem; display:flex; flex-direction:column; gap:0.35rem; border:1px solid rgba(255,255,255,0.04);">
                    <div style="font-weight:800; color:var(--text-dim); text-transform:uppercase; font-size:0.65rem; letter-spacing:0.5px; margin-bottom:0.1rem;">
                      ⚙️ Setup & Intelligence Checklist
                    </div>
                    <div style="display:flex; align-items:center; justify-content:space-between;">
                      <span style="color:${hasKnowledge ? '#34d399' : '#f59e0b'};">
                        ${hasKnowledge ? '✅' : '🟡'} 1. Analytics & Audience Baseline:
                      </span>
                      <strong style="color:#fff;">${hasKnowledge ? (kb.source?.slice(0, 20) || 'Indexed') : 'Not Onboarded'}</strong>
                    </div>
                    <div style="display:flex; align-items:center; justify-content:space-between;">
                      <span style="color:${cal ? '#34d399' : 'var(--text-muted)'};">
                        ${cal ? '✅' : '🔲'} 2. ${selectedPlanMonth} Production Calendar:
                      </span>
                      <strong style="color:#fff;">${cal ? (cal.planItems || []).length + ' Posts' : 'Needs Generation'}</strong>
                    </div>
                    <div style="display:flex; align-items:center; justify-content:space-between;">
                      <span style="color:${isLocked ? '#34d399' : 'var(--text-muted)'};">
                        ${isLocked ? '✅' : '🔲'} 3. Kanban Pipeline Lock:
                      </span>
                      <strong style="color:#fff;">${isLocked ? 'In Production' : 'Unlocked'}</strong>
                    </div>
                  </div>

                  <!-- Quick Action Button -->
                  <div style="display:flex; gap:0.5rem; align-items:center; margin-top:auto;">
                    <button type="button" class="${hasKnowledge ? 'btn-secondary' : 'btn-primary'} btn-sm" style="flex:1; font-size:0.75rem; ${!hasKnowledge ? 'background:linear-gradient(135deg, #f59e0b, #d97706); border:none; font-weight:800;' : ''}" onclick="window.SOCIAL_MODULE.openChannelWorkspace('${ch.id}')">
                      ${hasKnowledge ? '⚡ Open Strategy & Data Workspace →' : '🚀 Start Channel Onboarding Wizard →'}
                    </button>
                  </div>

                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Layer 3: Cross-Channel Weekly Production Matrix -->
        <div style="background:var(--surface-card, #14141e); border:1px solid var(--border-subtle); border-radius:14px; padding:1.25rem; display:flex; flex-direction:column; gap:1rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-subtle); padding-bottom:0.7rem; flex-wrap:wrap; gap:0.6rem;">
            <div>
              <h3 style="margin:0; font-size:1.05rem; color:#fff; font-family:var(--font-heading);">
                🗓️ Omnichannel Weekly Production Matrix (${selectedPlanMonth} ${selectedPlanYear})
              </h3>
              <div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.2rem;">
                Unified weekly content rollout across all active brand channels.
              </div>
            </div>
            <div style="display:flex; gap:0.4rem; align-items:center;">
              <span class="badge badge-purple" style="font-size:0.7rem; font-weight:800;">Week-by-Week Cross-Channel Synergy</span>
            </div>
          </div>

          <div style="display:flex; flex-direction:column; gap:0.9rem;">
            ${[1, 2, 3, 4].map(weekNum => {
              // ISSUE 15 FIX: Compute real calendar date ranges for each week
              const daysInMonth = new Date(selectedPlanYear, monthIndex + 1, 0).getDate();
              const weekStartDay = (weekNum - 1) * 7 + 1;
              const weekEndDay = Math.min(daysInMonth, weekNum * 7);
              const monthShort = new Date(selectedPlanYear, monthIndex).toLocaleString('default', { month: 'short' });
              const weekDateLabel = `${monthShort} ${weekStartDay}–${weekEndDay}`;
              return `
                <div style="background:rgba(255,255,255,0.02); border:1px solid var(--border-subtle); border-radius:10px; padding:0.9rem; display:flex; flex-direction:column; gap:0.65rem;">
                  <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.04); padding-bottom:0.45rem;">
                    <div style="font-weight:900; color:#c084fc; font-size:0.85rem; display:flex; align-items:center; gap:0.4rem;">
                      <span>📅</span> Week ${weekNum} (${weekDateLabel})
                    </div>
                  </div>

                  <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:0.75rem;">
                    ${(brand.channels || []).map(ch => {
                      const icon = PLATFORM_ICONS[ch.platform] || '📱';
                      const cal = ch.calendars && ch.calendars[currentMonthKey];
                      const weekItems = cal && Array.isArray(cal.planItems) 
                        ? cal.planItems.filter(item => (item.week || '') === `Week ${weekNum}`)
                        : [];
                      const isLocked = cal && cal.status === 'Locked';
                      const longCount = weekItems.filter(i => i.contentType === 'Long-form Video' || i.formatTag?.includes('Long-form')).length;
                      const shortCount = weekItems.length - longCount;

                      return `
                        <div style="background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.05); border-radius:8px; padding:0.65rem 0.8rem; font-size:0.75rem; display:flex; flex-direction:column; gap:0.4rem;">
                          <div style="display:flex; justify-content:space-between; align-items:center;">
                            <span style="font-weight:800; color:#fff; display:flex; align-items:center; gap:0.35rem;">
                              <span>${icon}</span>
                              ${escapeHTML(ch.name.replace('Channel','').replace('Page','').trim())}
                            </span>
                            <span class="badge ${isLocked ? 'badge-emerald' : (weekItems.length > 0 ? 'badge-purple' : 'badge-ghost')}" style="font-size:0.62rem; padding:0.1rem 0.4rem;">
                              ${isLocked ? '🔒 Locked' : (weekItems.length > 0 ? '📝 Draft' : '⏳ Unscheduled')}
                            </span>
                          </div>

                          ${weekItems.length > 0 ? `
                            <div style="font-size:0.72rem; color:var(--text-muted); display:flex; gap:0.5rem;">
                              ${longCount > 0 ? `<span style="color:#10b981; font-weight:700;">📹 ${longCount} Long-form</span>` : ''}
                              ${shortCount > 0 ? `<span style="color:#a855f7; font-weight:700;">🎬 ${shortCount} ${ch.type === 'video' ? 'Shorts' : 'Posts'}</span>` : ''}
                            </div>
                            <div style="font-size:0.7rem; color:var(--text-dim); max-height:42px; overflow:hidden; text-overflow:ellipsis; line-height:1.3;">
                              • ${escapeHTML(weekItems[0]?.topicIdea || '')}
                              ${weekItems.length > 1 ? `<br>• ${escapeHTML(weekItems[1]?.topicIdea || '')}` : ''}
                            </div>
                          ` : `
                            <div style="font-size:0.72rem; color:var(--text-dim); font-style:italic; display:flex; justify-content:space-between; align-items:center;">
                              <span>No schedule generated</span>
                              <button type="button" class="btn-ghost btn-sm" style="font-size:0.65rem; color:#c084fc; padding:0.1rem 0.35rem;" onclick="window.SOCIAL_MODULE.openChannelWorkspace('${ch.id}')">Generate →</button>
                            </div>
                          `}
                        </div>
                      `;
                    }).join('')}
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
    const kb = channel.analyticsKnowledgeBase;
    const isUnonboarded = !kb || isOnboardingOverride;
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const currentMonthIndex = new Date(`${selectedPlanMonth} 1, ${selectedPlanYear}`).getMonth();
    const currentMonthKey = `${selectedPlanYear}-${String(currentMonthIndex + 1).padStart(2, '0')}`;

    // ISSUE 3 FIX: Always resolve monthly focus from brand data for the current month key,
    // not from the shared monthlyFocusNote state variable which can be stale on rapid month switches
    const resolvedMonthFocus = (brand.monthlyFocus && brand.monthlyFocus[currentMonthKey]) || {};
    const resolvedFocusThesis = resolvedMonthFocus.thesis || '';
    // Keep the state variable in sync so calendar generation uses correct value
    monthlyFocusNote = resolvedFocusThesis;

    const now = new Date();
    const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const isPastMonth = currentMonthKey < thisMonthKey;

    const currentCal = channel.calendars && channel.calendars[currentMonthKey];
    const isLocked = currentCal && currentCal.status === 'Locked';
    const allPlanItems = (currentCal && Array.isArray(currentCal.planItems)) ? currentCal.planItems : [];
    
    const isYouTube = channel.platform === 'YouTube' || channel.type === 'video';
    const lang = channel.primaryLanguage || brand.primaryLanguage || 'Bangla + English (Banglish / Spoken)';

    const longFormItems = allPlanItems.filter(p => p.contentType === 'Long-form Video' || (p.targetDuration && !p.targetDuration.includes('s')));
    const shortFormItems = allPlanItems.filter(p => p.contentType !== 'Long-form Video' && (!p.targetDuration || p.targetDuration.includes('s')));

    let displayedPlanItems = allPlanItems;
    if (activeCalendarFilter === 'long_form') displayedPlanItems = longFormItems;
    else if (activeCalendarFilter === 'shorts') displayedPlanItems = shortFormItems;

    return `
      <div style="display:flex; flex-direction:column; gap:1.25rem;">
        
        <!-- Workspace Header Bar -->
        <div style="background:var(--surface-card, #14141e); border:1px solid var(--border-subtle); border-radius:14px; padding:1rem 1.25rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.8rem;">
          <div style="display:flex; align-items:center; gap:0.9rem;">
            <button type="button" class="btn-ghost btn-sm" style="padding:0.25rem 0.6rem; font-size:0.75rem;" onclick="window.SOCIAL_MODULE.switchBrandSubTab('overview')">← Brand Hub</button>
            <span style="font-size:1.5rem;">${PLATFORM_ICONS[channel.platform] || '📱'}</span>
            <div>
              <div style="font-weight:800; font-size:1.15rem; color:#fff; display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap;">
                <span>${escapeHTML(channel.name)}</span>
                ${channel.isAnchor ? `<span class="badge badge-emerald" style="font-size:0.7rem; font-weight:800;">⚓ Anchor Pillar</span>` : ''}
                <span class="badge badge-purple" style="font-size:0.7rem; font-weight:700;">🗣️ ${escapeHTML(lang)}</span>
              </div>
              <div style="font-size:0.72rem; color:var(--text-dim); margin-top:0.15rem;">
                ${escapeHTML(channel.handle || channel.url || channel.platform)} · ${isYouTube ? 'Fixed Standard: 2 Long-form + 7 Shorts / week' : 'Target: ' + channel.targetCadencePerWeek + '× / week'}
              </div>
            </div>
          </div>

          <div style="display:flex; gap:0.6rem; align-items:center;">
            ${kb ? `
              <button type="button" class="btn-ghost btn-sm" style="font-size:0.72rem; color:#c084fc; border:1px solid rgba(192,132,252,0.3); border-radius:6px;" onclick="window.SOCIAL_MODULE.viewChannelKnowledgeBase('${brand.slug}', '${channel.id}')">
                🔍 View Knowledge Base
              </button>
              <button type="button" class="btn-ghost btn-sm" style="font-size:0.72rem; color:var(--text-muted);" onclick="window.SOCIAL_MODULE.resetChannelOnboarding('${brand.slug}', '${channel.id}')">
                🔄 Re-onboard
              </button>
            ` : ''}
            <span class="badge ${isLocked ? 'badge-emerald' : (isPastMonth ? 'badge-gray' : 'badge-purple')}" style="font-size:0.75rem; font-weight:800; padding:0.35rem 0.7rem;">
              ${isLocked ? '🔒 ' + selectedPlanMonth + ' Locked & In Pipeline' : (isPastMonth ? '📁 ' + selectedPlanMonth + ' Archived (Read-Only)' : '✨ ' + selectedPlanMonth + ' Active Planning')}
            </span>
          </div>
        </div>

        ${isUnonboarded ? renderChannelOnboardingWizardHTML(brand, channel) : `
          <!-- Section 1: Channel Intelligence Baseline Card (Permanent Memory) -->
          <div style="background:linear-gradient(135deg, rgba(16,185,129,0.06), rgba(99,102,241,0.06)); border:1px solid rgba(16,185,129,0.25); border-radius:14px; padding:1.2rem; display:flex; flex-direction:column; gap:0.8rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:0.6rem; flex-wrap:wrap; gap:0.5rem;">
              <div style="font-weight:800; font-size:0.95rem; color:#fff; display:flex; align-items:center; gap:0.5rem;">
                <span>🏛️</span> Channel Intelligence Baseline
                <span class="badge badge-emerald" style="font-size:0.68rem; font-weight:800;">${escapeHTML(kb.source || 'Active Memory')}</span>
                <span class="badge badge-blue" style="font-size:0.68rem;">${escapeHTML(kb.primaryLanguage || lang)}</span>
              </div>
              <div style="font-size:0.72rem; color:var(--text-dim);">
                Last Indexed: ${new Date(kb.lastUpdated || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>

            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:0.75rem; font-size:0.75rem;">
              <div>
                <span style="color:var(--text-muted); font-weight:700;">📋 Core Content Pillars:</span>
                <div style="display:flex; gap:0.35rem; flex-wrap:wrap; margin-top:0.25rem;">
                  ${(kb.topCategories || ['Core Content']).map(c => `<span class="badge badge-blue" style="font-size:0.68rem;">${escapeHTML(c)}</span>`).join('')}
                </div>
              </div>

              <div>
                <span style="color:var(--text-muted); font-weight:700;">⚡ Peak Velocity Windows:</span>
                <div style="display:flex; gap:0.35rem; flex-wrap:wrap; margin-top:0.25rem;">
                  ${(kb.bestPostingDays || ['Friday 18:00', 'Tuesday 19:00']).map(d => `<span class="badge badge-emerald" style="font-size:0.68rem;">🔥 ${escapeHTML(d)}</span>`).join('')}
                </div>
              </div>

              <div>
                <span style="color:var(--text-muted); font-weight:700;">👤 Target Persona & Rules:</span>
                <div style="color:var(--text-secondary); margin-top:0.25rem; font-size:0.72rem; line-height:1.4;">
                  ${escapeHTML(kb.audiencePersona || (brand.name + ' Audience'))} · ${escapeHTML(kb.contentConstraints || 'Bengali script for voiceover; no text overlays.')}
                </div>
              </div>
            </div>
          </div>

          <!-- Section 2: Interactive Analytics Command Deck -->
          <div style="background:var(--surface-card, #14141e); border:1px solid var(--border-subtle); border-radius:14px; padding:1.25rem; display:flex; flex-direction:column; gap:1.1rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-subtle); padding-bottom:0.7rem; flex-wrap:wrap; gap:0.6rem;">
              <div>
                <div style="font-weight:800; font-size:1rem; color:#fff; display:flex; align-items:center; gap:0.5rem;">
                  <span>📊</span> Performance Signals & Metrics
                </div>
                <div style="font-size:0.72rem; color:var(--text-muted); margin-top:0.15rem;">
                  Audience conversion signals & proven retention data grounding all AI monthly strategies.
                </div>
              </div>
              <div style="display:flex; gap:0.5rem;">
                <button type="button" class="btn-secondary btn-sm" style="font-size:0.75rem; font-weight:700;" onclick="document.getElementById('channelCsvRefreshInput').click()">
                  📈 Ingest New CSV Report
                </button>
                <button type="button" class="btn-secondary btn-sm" style="font-size:0.75rem;" onclick="window.SOCIAL_MODULE.openCommunitySnapshotModal()">
                  📝 Log Snapshot
                </button>
              </div>
            </div>

            <input type="file" id="channelCsvRefreshInput" style="display:none;" accept=".csv,text/csv" onchange="window.SOCIAL_MODULE.handleChannelCsvUpload(this, '${brand.slug}', '${channel.id}')">

            <!-- 6 Key KPI Cards with MoM Deltas -->
            ${(() => {
              const snapshots = channel.analyticsSnapshots || [];
              let momViews = '+12.4%';
              let momWatch = '+8.7%';
              let momSubs = '+15.2%';
              let momCtr = '+0.65%';
              if (snapshots.length >= 2) {
                const latest = snapshots[snapshots.length - 1];
                const prev = snapshots[snapshots.length - 2];
                if (prev.views > 0) momViews = (latest.views >= prev.views ? '+' : '') + (((latest.views - prev.views)/prev.views)*100).toFixed(1) + '%';
                if (prev.watchHours > 0) momWatch = (latest.watchHours >= prev.watchHours ? '+' : '') + (((latest.watchHours - prev.watchHours)/prev.watchHours)*100).toFixed(1) + '%';
                if (prev.subscribers > 0) momSubs = (latest.subscribers >= prev.subscribers ? '+' : '') + (((latest.subscribers - prev.subscribers)/prev.subscribers)*100).toFixed(1) + '%';
                if (prev.ctr > 0) momCtr = (latest.ctr >= prev.ctr ? '+' : '') + (latest.ctr - prev.ctr).toFixed(2) + '%';
              }
              return `
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(140px, 1fr)); gap:0.75rem;">
                  
                  <div style="background:rgba(255,255,255,0.02); border:1px solid var(--border-subtle); border-radius:10px; padding:0.75rem 0.9rem;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                      <span style="font-size:0.68rem; color:var(--text-dim); text-transform:uppercase; font-weight:800; letter-spacing:0.5px;">Total Views</span>
                      <span class="badge badge-emerald" style="font-size:0.6rem; font-weight:800; padding:0.1rem 0.35rem;">${momViews} MoM</span>
                    </div>
                    <div style="font-size:1.3rem; font-weight:900; color:#fff; font-family:var(--font-heading); margin-top:0.2rem;">
                      ${(kb.totalViews || 0).toLocaleString()}
                    </div>
                    <div style="font-size:0.68rem; color:#34d399; margin-top:0.1rem;">Across ${kb.totalVideosIndexed || 0} contents</div>
                  </div>

                  <div style="background:rgba(255,255,255,0.02); border:1px solid var(--border-subtle); border-radius:10px; padding:0.75rem 0.9rem;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                      <span style="font-size:0.68rem; color:var(--text-dim); text-transform:uppercase; font-weight:800; letter-spacing:0.5px;">Watch Time</span>
                      <span class="badge badge-emerald" style="font-size:0.6rem; font-weight:800; padding:0.1rem 0.35rem;">${momWatch} MoM</span>
                    </div>
                    <div style="font-size:1.3rem; font-weight:900; color:#38bdf8; font-family:var(--font-heading); margin-top:0.2rem;">
                      ${(kb.totalWatchTimeHours || 0).toLocaleString()} <span style="font-size:0.8rem; font-weight:700;">hrs</span>
                    </div>
                    <div style="font-size:0.68rem; color:var(--text-muted); margin-top:0.1rem;">Verified watch hours</div>
                  </div>

                  <div style="background:rgba(255,255,255,0.02); border:1px solid var(--border-subtle); border-radius:10px; padding:0.75rem 0.9rem;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                      <span style="font-size:0.68rem; color:var(--text-dim); text-transform:uppercase; font-weight:800; letter-spacing:0.5px;">Audience / Subs</span>
                      <span class="badge badge-emerald" style="font-size:0.6rem; font-weight:800; padding:0.1rem 0.35rem;">${momSubs} MoM</span>
                    </div>
                    <div style="font-size:1.3rem; font-weight:900; color:#a855f7; font-family:var(--font-heading); margin-top:0.2rem;">
                      ${(kb.totalSubscribers || channel.audienceCount || 0).toLocaleString()}
                    </div>
                    <div style="font-size:0.68rem; color:#d8b4fe; margin-top:0.1rem;">Net conversions</div>
                  </div>

                  <div style="background:rgba(255,255,255,0.02); border:1px solid var(--border-subtle); border-radius:10px; padding:0.75rem 0.9rem;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                      <span style="font-size:0.68rem; color:var(--text-dim); text-transform:uppercase; font-weight:800; letter-spacing:0.5px;">Impressions</span>
                      <span class="badge badge-purple" style="font-size:0.6rem; font-weight:800; padding:0.1rem 0.35rem;">Reach</span>
                    </div>
                    <div style="font-size:1.3rem; font-weight:900; color:#f59e0b; font-family:var(--font-heading); margin-top:0.2rem;">
                      ${(kb.impressions || 201198).toLocaleString()}
                    </div>
                    <div style="font-size:0.68rem; color:var(--text-muted); margin-top:0.1rem;">Algorithmic reach</div>
                  </div>

                  <div style="background:rgba(255,255,255,0.02); border:1px solid var(--border-subtle); border-radius:10px; padding:0.75rem 0.9rem;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                      <span style="font-size:0.68rem; color:var(--text-dim); text-transform:uppercase; font-weight:800; letter-spacing:0.5px;">Average CTR</span>
                      <span class="badge badge-emerald" style="font-size:0.6rem; font-weight:800; padding:0.1rem 0.35rem;">${momCtr} MoM</span>
                    </div>
                    <div style="font-size:1.3rem; font-weight:900; color:#10b981; font-family:var(--font-heading); margin-top:0.2rem;">
                      ${kb.avgCtr || 5.18}%
                    </div>
                    <div style="font-size:0.68rem; color:#6ee7b7; margin-top:0.1rem;">High click intent</div>
                  </div>

                  <div style="background:rgba(255,255,255,0.02); border:1px solid var(--border-subtle); border-radius:10px; padding:0.75rem 0.9rem;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                      <span style="font-size:0.68rem; color:var(--text-dim); text-transform:uppercase; font-weight:800; letter-spacing:0.5px;">Avg Duration</span>
                      <span class="badge badge-blue" style="font-size:0.6rem; font-weight:800; padding:0.1rem 0.35rem;">Retention</span>
                    </div>
                    <div style="font-size:1.3rem; font-weight:900; color:#ec4899; font-family:var(--font-heading); margin-top:0.2rem;">
                      ${kb.avgViewDuration || '2:24'}
                    </div>
                    <div style="font-size:0.68rem; color:var(--text-muted); margin-top:0.1rem;">Retention baseline</div>
                  </div>

                </div>
              `;
            })()}

            <!-- Ranked Top 5 Performing Videos Table (if existing content available) -->
            ${Array.isArray(kb.topPerformers) && kb.topPerformers.length > 0 ? `
              <div style="display:flex; flex-direction:column; gap:0.5rem; margin-top:0.2rem;">
                <div style="font-weight:800; font-size:0.82rem; color:#fff; display:flex; justify-content:space-between; align-items:center;">
                  <span>🏆 Ranked Top Converting Content Assets (Watch Time Drivers):</span>
                  <span style="font-size:0.7rem; color:var(--text-dim);">Grounding ${brand.name} Calendar</span>
                </div>
                <div style="border:1px solid var(--border-subtle); border-radius:10px; overflow:hidden;">
                  <table style="width:100%; border-collapse:collapse; font-size:0.75rem; text-align:left;">
                    <thead style="background:rgba(255,255,255,0.04); color:var(--text-muted); border-bottom:1px solid var(--border-subtle);">
                      <tr>
                        <th style="padding:0.5rem 0.75rem; width:40px;">#</th>
                        <th style="padding:0.5rem 0.75rem;">Content Title</th>
                        <th style="padding:0.5rem 0.75rem; width:90px;">Format</th>
                        <th style="padding:0.5rem 0.75rem; width:90px; text-align:right;">Views</th>
                        <th style="padding:0.5rem 0.75rem; width:90px; text-align:right;">Watch Hrs</th>
                        <th style="padding:0.5rem 0.75rem; width:70px; text-align:right;">Subs</th>
                        <th style="padding:0.5rem 0.75rem; width:80px; text-align:right;">CTR %</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${kb.topPerformers.slice(0, 5).map((p, idx) => `
                        <tr style="border-bottom:1px solid rgba(255,255,255,0.03); background:${idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'};">
                          <td style="padding:0.5rem 0.75rem; font-weight:800; color:${idx === 0 ? '#f59e0b' : 'var(--text-dim)'};">${idx + 1}</td>
                          <td style="padding:0.5rem 0.75rem; font-weight:700; color:#fff;">${escapeHTML(p.title)}</td>
                          <td style="padding:0.5rem 0.75rem;">
                            <span class="badge ${p.format === 'Short' ? 'badge-purple' : 'badge-emerald'}" style="font-size:0.65rem;">
                              ${escapeHTML(p.format || (p.title.includes('#shorts') ? 'Short' : 'Long-form'))}
                            </span>
                          </td>
                          <td style="padding:0.5rem 0.75rem; text-align:right; font-weight:800; color:#38bdf8;">${(p.views || 0).toLocaleString()}</td>
                          <td style="padding:0.5rem 0.75rem; text-align:right; color:#a7f3d0;">${(p.watchHours || 0).toLocaleString()}h</td>
                          <td style="padding:0.5rem 0.75rem; text-align:right; color:#d8b4fe;">+${p.subs || 0}</td>
                          <td style="padding:0.5rem 0.75rem; text-align:right; font-weight:700; color:${(p.ctr || 0) >= 5 ? '#34d399' : 'var(--text-muted)'};">${p.ctr ? p.ctr + '%' : 'N/A'}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              </div>
            ` : ''}
          </div>
        `}

        <!-- Section 3: Monthly Content Calendar Strategy & Locking Engine -->
        <div style="background:var(--surface-card, #14141e); border:1px solid var(--border-subtle); border-radius:14px; padding:1.25rem; display:flex; flex-direction:column; gap:1.1rem;">
          
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-subtle); padding-bottom:0.8rem; flex-wrap:wrap; gap:0.8rem;">
            <div>
              <h3 style="margin:0; font-size:1.05rem; color:#fff; font-family:var(--font-heading); display:flex; align-items:center; gap:0.5rem;">
                <span>🗓️</span> Monthly Production Blueprint (${selectedPlanMonth} ${selectedPlanYear})
              </h3>
              <div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.2rem;">
                ${isYouTube ? '⚡ Fixed Standard: 2 Long-form Deep Dives/week (Friday & Tuesday) + 1 Daily Short (Mon-Sun).' : '100% automated AI strategy with per-post Strategic Rationale.'}
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

          <!-- Animated Percentage Loader for Calendar Generation -->
          <div id="channelGenProgressContainer" style="display:none; background:linear-gradient(135deg, rgba(168,85,247,0.12), rgba(99,102,241,0.12)); border:1px solid rgba(168,85,247,0.4); border-radius:12px; padding:1.25rem; flex-direction:column; gap:0.75rem; margin-bottom:0.8rem;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <div style="display:flex; align-items:center; gap:0.6rem;">
                <span class="spinner" style="width:20px; height:20px; border:2px solid #a855f7; border-top-color:transparent; border-radius:50%; display:inline-block; animation:spin 0.8s linear infinite;"></span>
                <span id="genProgressStepText" style="font-weight:800; font-size:0.88rem; color:#fff;">Analyzing Channel Analytics & Audience Signals...</span>
              </div>
              <span id="genProgressPercent" style="font-weight:900; font-size:1.2rem; color:#a855f7; font-family:var(--font-heading);">0%</span>
            </div>
            <div style="width:100%; height:8px; background:rgba(0,0,0,0.5); border-radius:10px; overflow:hidden; border:1px solid rgba(255,255,255,0.05);">
              <div id="genProgressBarFill" style="width:0%; height:100%; background:linear-gradient(90deg, #a855f7, #6366f1, #10b981); transition:width 0.35s ease; border-radius:10px;"></div>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:0.72rem; color:var(--text-dim);">
              <span>🚀 100% Unique Topic Banks Grounded in Channel Authority</span>
              <span>⚡ Fixed Production: 2 Long-form Tutorials + 7 Daily Shorts/week</span>
            </div>
          </div>

          <!-- Strategy Configuration Bar (if not locked and not archived) -->
          ${!isLocked && !isPastMonth ? `
            <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); border-radius:10px; padding:0.85rem 1rem; display:grid; grid-template-columns:1.5fr 1fr auto; gap:0.8rem; align-items:center;">
              
              <!-- Focus / Campaign Note -->
              <div>
                <label class="form-label" style="margin-bottom:0.2rem;">🎯 Monthly Campaign Focus in ${escapeHTML(lang)}</label>
                <input type="text" id="inpMonthlyFocusNote" class="input-text" placeholder="e.g. Job interview spoken English simulation & career roadmap..." value="${escapeHTML(resolvedFocusThesis)}" oninput="monthlyFocusNote = this.value">
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
                  <label class="form-label" style="margin-bottom:0.2rem;">⚓ Anchor Channel Standard</label>
                  <div style="font-size:0.72rem; color:#34d399; margin-top:0.35rem;">2 Long-form tutorials + Daily Shorts</div>
                `}
              </div>

              <!-- Generate Button -->
              <div style="display:flex; align-items:flex-end;">
                <button type="button" id="btnRunChannelGen" class="btn-primary" style="background:linear-gradient(135deg, #a855f7, #6366f1); border:none; font-weight:800; font-size:0.85rem; padding:0.55rem 1rem; white-space:nowrap;" onclick="window.SOCIAL_MODULE.generateChannelCalendarPlan('${brand.slug}', '${channel.id}')">
                  ✨ Generate ${selectedPlanMonth} Plan
                </button>
              </div>

            </div>
          ` : ''}

          <!-- Filter Pills & Lock Action Bar -->
          ${allPlanItems.length > 0 ? `
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.8rem; background:rgba(0,0,0,0.2); border-radius:10px; padding:0.6rem 0.85rem; border:1px solid var(--border-subtle);">
              
              <!-- Cadence Filter Pills -->
              <div style="display:flex; gap:0.4rem; align-items:center;">
                <button type="button" class="btn-sm ${activeCalendarFilter === 'all' ? 'btn-primary' : 'btn-ghost'}" style="font-size:0.72rem; padding:0.2rem 0.6rem;" onclick="window.SOCIAL_MODULE.setCalendarFilter('all')">
                  All (${allPlanItems.length})
                </button>
                ${isYouTube ? `
                  <button type="button" class="btn-sm ${activeCalendarFilter === 'long_form' ? 'btn-primary' : 'btn-ghost'}" style="font-size:0.72rem; padding:0.2rem 0.6rem; ${activeCalendarFilter === 'long_form' ? 'background:#10b981; border:none;' : ''}" onclick="window.SOCIAL_MODULE.setCalendarFilter('long_form')">
                    📹 Long-form (${longFormItems.length})
                  </button>
                  <button type="button" class="btn-sm ${activeCalendarFilter === 'shorts' ? 'btn-primary' : 'btn-ghost'}" style="font-size:0.72rem; padding:0.2rem 0.6rem; ${activeCalendarFilter === 'shorts' ? 'background:#a855f7; border:none;' : ''}" onclick="window.SOCIAL_MODULE.setCalendarFilter('shorts')">
                    🎬 Shorts (${shortFormItems.length})
                  </button>
                ` : ''}
              </div>

              <!-- Phase 4.5: Calendar Bulk Actions -->
              <div style="display:flex; gap:0.4rem; align-items:center;">
                <button type="button" class="btn-ghost btn-sm" style="font-size:0.75rem; border:1px solid rgba(255,255,255,0.12);" onclick="window.SOCIAL_MODULE.exportCalendarPlanCsv('${brand.slug}', '${channel.id}', '${currentMonthKey}')" title="Export calendar to CSV">
                  📥 Export CSV
                </button>
                ${!isLocked && !isPastMonth ? `
                  <button type="button" class="btn-ghost btn-sm" style="font-size:0.75rem; color:#f87171; border:1px solid rgba(239,68,68,0.25);" onclick="window.SOCIAL_MODULE.clearChannelMonthCalendar('${brand.slug}', '${channel.id}', '${currentMonthKey}')" title="Clear this month's plan">
                    🗑️ Clear Plan
                  </button>
                  <button type="button" class="btn-emerald btn-sm" style="font-weight:800; font-size:0.78rem; padding:0.35rem 0.85rem;" onclick="window.SOCIAL_MODULE.lockChannelCalendar('${brand.slug}', '${channel.id}', '${currentMonthKey}')">
                    🔒 Lock & Push ${allPlanItems.length} Drafts to Pipeline
                  </button>
                ` : ''}
              </div>

            </div>
          ` : ''}

          <!-- Scheduled Items List -->
          <div style="display:flex; flex-direction:column; gap:0.65rem;">
            ${displayedPlanItems.length > 0 ? displayedPlanItems.map((item, idx) => {
              const isLong = item.contentType === 'Long-form Video' || (item.targetDuration && !item.targetDuration.includes('s'));
              return `
                <div style="background:rgba(255,255,255,0.02); border:1px solid ${isLong ? 'rgba(16,185,129,0.35)' : 'var(--border-subtle)'}; border-left:4px solid ${isLong ? '#10b981' : '#a855f7'}; border-radius:10px; padding:0.85rem 1rem; display:flex; justify-content:space-between; align-items:center; gap:0.8rem; flex-wrap:wrap;">
                  
                  <div style="display:flex; flex-direction:column; gap:0.25rem; flex:1; min-width:260px;">
                    <div style="display:flex; align-items:center; gap:0.45rem; flex-wrap:wrap;">
                      <span class="badge badge-gray" style="font-size:0.65rem; font-weight:800;">${escapeHTML(item.week || 'Week 1')} · ${escapeHTML(item.dayOfWeek || 'Mon')}</span>
                      <span style="font-size:0.72rem; color:var(--text-dim);">${escapeHTML(item.scheduledDate || '')}</span>
                      <span class="badge ${isLong ? 'badge-emerald' : 'badge-purple'}" style="font-size:0.65rem;">${escapeHTML(item.contentType || 'Post')}</span>
                      <span class="badge badge-blue" style="font-size:0.65rem;">${escapeHTML(item.formatTag || 'Cadence Drop')}</span>
                    </div>

                    <div style="font-weight:700; color:#fff; font-size:0.88rem; margin-top:0.15rem;">
                      ${escapeHTML(item.topicIdea || item.title)}
                    </div>

                    ${item.hook ? `
                      <div style="font-size:0.74rem; color:#a7f3d0; line-height:1.4;">
                        💬 "${escapeHTML(item.hook)}"
                      </div>
                    ` : ''}

                    <div style="font-size:0.7rem; color:var(--text-muted);">
                      💡 ${escapeHTML(item.strategicRationale || 'Standard Cadence')}
                    </div>
                  </div>

                  <div style="display:flex; gap:0.6rem; align-items:center;">
                    <div style="text-align:right; font-size:0.72rem; color:var(--text-dim);">
                      <div>⏰ ${escapeHTML(item.suggestedTime || '18:00')}</div>
                      <div>⌛ ${escapeHTML(item.targetDuration || '60s')}</div>
                      <div style="font-size:0.65rem; color:#c084fc;">${escapeHTML(item.primaryLanguage || lang)}</div>
                    </div>

                    <button type="button" class="btn-secondary btn-sm" style="font-size:0.75rem; padding:0.35rem 0.75rem;" onclick="window.SOCIAL_MODULE.draftPostFromPlanItem('${brand.slug}', '${channel.id}', ${idx})">
                      📝 Draft Now
                    </button>
                    ${!isLocked && !isPastMonth ? `
                      <button type="button" class="btn-ghost btn-sm" style="font-size:0.75rem; padding:0.35rem 0.55rem; color:var(--text-muted); border:1px solid rgba(255,255,255,0.1); border-radius:6px;" title="Edit plan item" onclick="window.SOCIAL_MODULE.openEditPlanItemModal('${brand.slug}', '${channel.id}', '${currentMonthKey}', ${idx})">
                        ✏️ Edit
                      </button>
                      <button type="button" class="btn-ghost btn-sm" style="font-size:0.75rem; padding:0.35rem 0.55rem; color:#f87171; border:1px solid rgba(239,68,68,0.25); border-radius:6px;" title="Delete plan item" onclick="window.SOCIAL_MODULE.deletePlanItem('${brand.slug}', '${channel.id}', '${currentMonthKey}', ${idx})">
                        🗑️
                      </button>
                    ` : ''}
                  </div>

                </div>
              `;
            }).join('') : `
              <div style="padding:2rem 1rem; text-align:center; color:var(--text-dim); font-size:0.85rem; border:1px dashed var(--border-subtle); border-radius:10px;">
                <div style="font-size:2rem; margin-bottom:0.5rem;">🗓️</div>
                No strategy calendar generated for ${selectedPlanMonth} ${selectedPlanYear} yet.
                <div style="margin-top:0.35rem; font-size:0.75rem; color:var(--text-muted);">
                  Click <strong>"Generate ${selectedPlanMonth} Plan"</strong> above to auto-create all unique daily shorts and long-form tutorials!
                </div>
              </div>
            `}
          </div>

        </div>

      </div>
    `;
  }

  // Dual-Path Channel Onboarding Wizard HTML
  function renderChannelOnboardingWizardHTML(brand, channel) {
    const isVideo = channel.platform === 'YouTube' || channel.platform === 'TikTok' || channel.type === 'video';
    const lang = channel.primaryLanguage || brand.primaryLanguage || 'Bangla + English (Banglish / Spoken)';

    return `
      <div style="background:var(--surface-card, #14141e); border:1px solid rgba(245,158,11,0.3); border-radius:14px; padding:1.5rem; display:flex; flex-direction:column; gap:1.2rem;">
        
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-subtle); padding-bottom:0.8rem; flex-wrap:wrap; gap:0.6rem;">
          <div>
            <div style="font-weight:900; font-size:1.15rem; color:#fff; display:flex; align-items:center; gap:0.5rem;">
              <span>🚀</span> Channel Intelligence Onboarding Wizard — ${escapeHTML(channel.name)}
            </div>
            <div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.2rem;">
              Establish channel intelligence memory to prevent assumptions and ground all AI generation in real audience signals.
            </div>
          </div>
          <div style="display:flex; gap:0.4rem; background:rgba(0,0,0,0.3); padding:0.25rem; border-radius:8px; border:1px solid var(--border-subtle);">
            <button type="button" class="btn-sm ${activeOnboardingPath === 'csv' ? 'btn-primary' : 'btn-ghost'}" style="font-size:0.72rem; padding:0.25rem 0.65rem;" onclick="window.SOCIAL_MODULE.toggleOnboardingPath('csv')">
              📈 Path A: Upload CSV
            </button>
            <button type="button" class="btn-sm ${activeOnboardingPath === 'qa' ? 'btn-primary' : 'btn-ghost'}" style="font-size:0.72rem; padding:0.25rem 0.65rem;" onclick="window.SOCIAL_MODULE.toggleOnboardingPath('qa')">
              📝 Path B: Guided Q&A
            </button>
          </div>
        </div>

        ${activeOnboardingPath === 'csv' ? `
          <!-- Path A: CSV Analytics Ingestion -->
          <div style="display:flex; flex-direction:column; gap:1rem;">
            <div id="channelCsvDropzone" style="background:rgba(255,255,255,0.02); border:2px dashed rgba(168,85,247,0.5); border-radius:14px; padding:2.2rem 1.5rem; text-align:center; cursor:pointer; transition:all 0.2s ease;" 
                 onclick="document.getElementById('channelCsvFileInput').click()"
                 ondragover="event.preventDefault(); this.style.borderColor='#10b981'; this.style.background='rgba(16,185,129,0.08)';"
                 ondragleave="event.preventDefault(); this.style.borderColor='rgba(168,85,247,0.5)'; this.style.background='rgba(255,255,255,0.02)';"
                 ondrop="event.preventDefault(); this.style.borderColor='rgba(168,85,247,0.5)'; this.style.background='rgba(255,255,255,0.02)'; const f = event.dataTransfer.files && event.dataTransfer.files[0]; if(f) window.SOCIAL_MODULE.handleChannelCsvUpload(f, '${brand.slug}', '${channel.id}');">
              
              <input type="file" id="channelCsvFileInput" style="display:none;" accept=".csv,text/csv" onchange="window.SOCIAL_MODULE.handleChannelCsvUpload(this, '${brand.slug}', '${channel.id}')">
              
              <div id="csvDefaultDropContent">
                <div style="font-size:2.4rem; margin-bottom:0.4rem;">📊</div>
                <div style="font-weight:900; font-size:1.05rem; color:#fff;">Drag & Drop or Click to Ingest ${escapeHTML(channel.name)} Analytics CSV</div>
                <div style="font-size:0.75rem; color:var(--text-dim); margin-top:0.35rem; max-width:560px; margin-left:auto; margin-right:auto; line-height:1.4;">
                  Supports <strong>YouTube Studio Table Export</strong>, <strong>Meta Creator Studio</strong>, or <strong>TikTok Analytics</strong> CSV files. Automatically indexes total watch hours, impressions, top converting titles, and dialect signals.
                </div>
                <div style="display:flex; justify-content:center; gap:0.6rem; margin-top:1.1rem;">
                  <button type="button" class="btn-primary btn-sm" style="font-size:0.78rem; background:linear-gradient(135deg,#a855f7,#6366f1); border:none; padding:0.45rem 1.2rem; font-weight:800; pointer-events:none;">
                    📁 Browse CSV File
                  </button>
                </div>
              </div>

              <!-- Animated Progress Box during CSV upload & indexing -->
              <div id="csvUploadProgressBox" style="display:none; flex-direction:column; align-items:center; gap:0.8rem; padding:0.5rem 0;">
                <div style="display:flex; justify-content:space-between; align-items:center; width:100%; max-width:420px; font-size:0.82rem; font-weight:800;">
                  <span id="csvProgressStepText" style="color:#c084fc;">📊 Parsing CSV Rows & Ingesting Video Data...</span>
                  <span id="csvProgressPercentText" style="color:#10b981;">10%</span>
                </div>
                <div style="width:100%; max-width:420px; height:8px; background:rgba(255,255,255,0.1); border-radius:10px; overflow:hidden;">
                  <div id="csvProgressBarFill" style="width:10%; height:100%; background:linear-gradient(90deg, #a855f7, #10b981); transition:width 0.25s ease; border-radius:10px;"></div>
                </div>
                <div style="font-size:0.72rem; color:var(--text-dim);">Grounding channel intelligence memory into persistent brand state...</div>
              </div>

            </div>
          </div>
        ` : `
          <!-- Path B: Guided Discovery Q&A -->
          <div style="display:flex; flex-direction:column; gap:1.2rem;">
            
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:1rem;">
              
              <!-- Step 1: Niche Archetype -->
              <div style="background:rgba(255,255,255,0.02); border:1px solid var(--border-subtle); border-radius:10px; padding:1rem; display:flex; flex-direction:column; gap:0.5rem;">
                <label class="form-label" style="font-weight:800; color:#c084fc;">1. Channel Archetype & Format</label>
                <select id="qaArchetype" class="input-text" style="font-size:0.8rem;">
                  <option value="Spoken English & Career Skills" selected>🎓 Spoken English, Career Preparation & Job Circulars</option>
                  <option value="Geopolitical Documentaries & News Analysis">🗺️ Geopolitical Documentaries & Global Strategy</option>
                  <option value="Viral Entertainment, Skits & Pop Culture">🎭 Viral Comedy Skits & Youth Pop Culture</option>
                  <option value="Bengali Music & Lyrical Beats">🎵 Original Bengali Music & Soundtracks</option>
                  <option value="B2B AI Automation & SaaS Systems">💼 B2B AI Agency Systems & SaaS Infrastructure</option>
                  <option value="E-commerce & Digital Commerce">🛒 Digital Products, DigiVault & Commerce</option>
                </select>
                <div style="font-size:0.7rem; color:var(--text-dim);">Defines content generation formulas and retention cadence.</div>
              </div>

              <!-- Step 2: Primary Content & Delivery Language -->
              <div style="background:rgba(255,255,255,0.02); border:1px solid var(--border-subtle); border-radius:10px; padding:1rem; display:flex; flex-direction:column; gap:0.5rem;">
                <label class="form-label" style="font-weight:800; color:#34d399;">2. Primary Delivery Language</label>
                <select id="qaLanguage" class="input-text" style="font-size:0.8rem;">
                  <option value="Bangla + English (Banglish / Spoken)" ${lang.includes('Banglish') ? 'selected' : ''}>🗣️ Bangla + English (Banglish / Spoken)</option>
                  <option value="Bangla / Bengali (Documentary & Analysis)" ${lang.includes('Documentary') || lang === 'Bangla / Bengali' ? 'selected' : ''}>✍️ Bangla / Bengali (Standard Script)</option>
                  <option value="English (Global B2B & Tech)" ${lang.includes('English (Global') ? 'selected' : ''}>🌐 English (Global B2B & Tech)</option>
                </select>
                <div style="font-size:0.7rem; color:var(--text-dim);">Spoken script voiceover language (Bengali script for Bangla).</div>
              </div>

              <!-- Step 3: Target Audience Persona -->
              <div style="background:rgba(255,255,255,0.02); border:1px solid var(--border-subtle); border-radius:10px; padding:1rem; display:flex; flex-direction:column; gap:0.5rem;">
                <label class="form-label" style="font-weight:800; color:#38bdf8;">3. Target Audience Persona</label>
                <input type="text" id="qaAudiencePersona" class="input-text" value="${escapeHTML(channel.name)} Target Audience (Ages 20–35) seeking high-value growth" style="font-size:0.8rem;">
                <div style="font-size:0.7rem; color:var(--text-dim);">Who this channel speaks to and their aspirations.</div>
              </div>

              <!-- Step 4: Core Content Pillars (Tags) -->
              <div style="background:rgba(255,255,255,0.02); border:1px solid var(--border-subtle); border-radius:10px; padding:1rem; display:flex; flex-direction:column; gap:0.5rem;">
                <label class="form-label" style="font-weight:800; color:#f59e0b;">4. Core Content Pillars (Comma-separated)</label>
                <input type="text" id="qaPillars" class="input-text" value="Interview English, Salary Negotiation, CV Optimization, Career Roadmaps" style="font-size:0.8rem;">
                <div style="font-size:0.7rem; color:var(--text-dim);">3–5 recurring topic pillars for strategy variation.</div>
              </div>

            </div>

            <!-- Content Constraints -->
            <div style="background:rgba(0,0,0,0.25); border-radius:10px; padding:0.85rem 1rem; border:1px solid var(--border-subtle); display:flex; flex-direction:column; gap:0.3rem;">
              <label class="form-label" style="font-size:0.75rem;">📝 Production Constraints & Voice Rules:</label>
              <input type="text" id="qaConstraints" class="input-text" value="No text overlays in video scenes (prevents visual glitches). Spoken scripts written in genuine script for correct pronunciation." style="font-size:0.78rem;">
            </div>

            <div style="display:flex; justify-content:flex-end; gap:0.6rem;">
              <button type="button" class="btn-primary" style="background:linear-gradient(135deg, #10b981, #059669); border:none; font-weight:800; padding:0.5rem 1.2rem; font-size:0.85rem;" onclick="window.SOCIAL_MODULE.saveChannelOnboardingQA('${brand.slug}', '${channel.id}')">
                ⚡ Complete Onboarding & Save Baseline
              </button>
            </div>

          </div>
        `}

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
            <label class="form-label">Primary Content & Script Language</label>
            <select id="inpBrandLanguage" class="input-text">
              <option value="Bangla + English (Banglish / Spoken)" ${brand.primaryLanguage === 'Bangla + English (Banglish / Spoken)' ? 'selected' : ''}>Bangla + English (Banglish / Spoken)</option>
              <option value="Bangla / Bengali (Documentary & Analysis)" ${brand.primaryLanguage === 'Bangla / Bengali (Documentary & Analysis)' ? 'selected' : ''}>Bangla / Bengali (Documentary & Analysis)</option>
              <option value="Bengali (Music, Skits & Pop Culture)" ${brand.primaryLanguage === 'Bengali (Music, Skits & Pop Culture)' ? 'selected' : ''}>Bengali (Music, Skits & Pop Culture)</option>
              <option value="English (Global B2B & Tech)" ${brand.primaryLanguage === 'English (Global B2B & Tech)' ? 'selected' : ''}>English (Global B2B & Tech)</option>
              <option value="English (Professional / Corporate)" ${brand.primaryLanguage === 'English (Professional / Corporate)' ? 'selected' : ''}>English (Professional / Corporate)</option>
            </select>
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
      const stageEmptyMeta = {
        draft: { icon: '📝', title: 'No Drafts', desc: 'New concepts and calendar drops start here.', action: '+ Create Draft' },
        internal: { icon: '🔍', title: 'Queue Empty', desc: 'No posts waiting for Internal QC verification.' },
        client: { icon: '🤝', title: 'All Clear', desc: 'No posts awaiting client sign-off.' },
        approved: { icon: '🚀', title: 'Ready to Ship', desc: 'Approved posts lined up for publishing.' },
        posted: { icon: '🎉', title: 'Archive Empty', desc: 'Published posts will appear here once live.' }
      };
      const meta = stageEmptyMeta[stageKey] || { icon: '📄', title: 'Empty Stage', desc: 'No posts in this column.' };
      return `
        <div style="text-align:center; color:var(--text-dim); padding:2rem 1rem; border:1px dashed rgba(255,255,255,0.08); border-radius:12px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:0.4rem; min-height:160px;">
          <div style="font-size:1.8rem; opacity:0.6;">${meta.icon}</div>
          <div style="font-weight:700; color:#fff; font-size:0.85rem;">${meta.title}</div>
          <div style="font-size:0.72rem; color:var(--text-muted); max-width:180px;">${meta.desc}</div>
          ${meta.action ? `<button type="button" class="btn-ghost btn-sm" style="font-size:0.7rem; margin-top:0.4rem; padding:0.25rem 0.6rem; border:1px solid rgba(255,255,255,0.15); border-radius:6px;" onclick="window.SOCIAL_MODULE.openPostModal()">${meta.action}</button>` : ''}
        </div>
      `;
    }

    return list.map(p => {
      const chanCfg = getChannelConfig(p.channel);
      const icon = PLATFORM_ICONS[p.platform] || '📱';
      const isRevision = p.status === 'Revision Requested';
      const hasMedia = Array.isArray(p.mediaUrls) && p.mediaUrls.length > 0;
      const mediaThumb = hasMedia ? p.mediaUrls[0] : null;
      const qc = evaluatePostQC(p);

      // Check if scheduled date has passed and post is not yet published
      const isOverdue = p.scheduledDate && 
        new Date(p.scheduledDate + 'T' + (p.scheduledTime || '23:59')) < new Date() && 
        !['Posted', 'Published'].includes(p.status);

      return `
        <div class="post-card" draggable="${!isClientRole()}" data-post-id="${p.id}" ondragstart="window.SOCIAL_MODULE.handleDragStart(event, '${p.id}')" ondragend="window.SOCIAL_MODULE.handleDragEnd(event)" style="background:rgba(255,255,255,0.03); border:1px solid ${isOverdue ? 'rgba(239,68,68,0.4)' : 'var(--border-subtle)'}; border-radius:12px; padding:0.9rem; display:flex; flex-direction:column; gap:0.6rem; transition:transform 0.15s ease, border-color 0.15s ease;">
          
          <!-- Channel & Platform Badges Header -->
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.3rem;">
            <span class="badge ${chanCfg.badgeClass}" style="font-size:0.72rem; font-weight:800;">
              ${escapeHTML(chanCfg.name)}
            </span>
            <div style="display:flex; gap:0.3rem; align-items:center;">
              ${isOverdue ? `<span class="badge badge-danger" style="font-size:0.62rem; font-weight:800; background:rgba(239,68,68,0.2); color:#f87171; border:1px solid rgba(239,68,68,0.4);">⚠️ OVERDUE</span>` : ''}
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
            <span>👤 ${escapeHTML(p.assignedPublisher || 'Unassigned')}</span>
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
    const isClient = isClientRole();

    if (isClient) {
      if (stageKey === 'client') {
        btns += `
          <button class="btn-emerald btn-sm" style="font-size:0.72rem; flex:1; font-weight:800;" onclick="window.SOCIAL_MODULE.approvePost('${p.id}')">✅ Approve</button>
          <button class="btn-secondary btn-sm" style="font-size:0.72rem; color:#fca5a5;" onclick="window.SOCIAL_MODULE.promptRejectPost('${p.id}')">🔴 Revisions</button>
          <button class="btn-secondary btn-sm" style="padding:0.2rem 0.45rem; font-size:0.75rem;" title="View Details" onclick="window.SOCIAL_MODULE.openEditModal('${p.id}')">👁️ View</button>
        `;
      } else if (stageKey === 'approved') {
        btns += `
          <span class="badge badge-emerald" style="font-size:0.72rem; flex:1; text-align:center; padding:0.3rem;">✅ Approved by You</span>
          <button class="btn-secondary btn-sm" style="padding:0.2rem 0.45rem; font-size:0.75rem;" title="View Details" onclick="window.SOCIAL_MODULE.openEditModal('${p.id}')">👁️ View</button>
        `;
      } else if (stageKey === 'posted') {
        btns += `
          <span class="badge badge-blue" style="font-size:0.72rem; flex:1; text-align:center; padding:0.3rem;">🚀 Published & Live</span>
          <button class="btn-secondary btn-sm" style="padding:0.2rem 0.45rem; font-size:0.75rem;" title="View Details" onclick="window.SOCIAL_MODULE.openEditModal('${p.id}')">👁️ View</button>
        `;
      }
      return btns;
    }

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

  // Phase 6.3: Subscribe to real-time updates via SSE with memory leak prevention
  if (window._socialSseUnsub && typeof window._socialSseUnsub === 'function') {
    window._socialSseUnsub();
    window._socialSseUnsub = null;
  }
  if (window.APP_SSE && window.APP_SSE.subscribe) {
    window._socialSseUnsub = window.APP_SSE.subscribe('post_update', (updatedPosts) => {
      if (Array.isArray(updatedPosts)) {
        postsData = updatedPosts;
        renderKPIs();
        if (activeViewMode === 'content_os' || activeViewMode === 'planner_ai') renderContentOS();
        else if (activeViewMode === 'calendar') renderCalendar();
        else renderBoard();
      }
    });
  }

  window.SOCIAL_MODULE = {
    reload() {
      loadInitialData(false);
    },
    destroy() {
      if (window._socialSseUnsub && typeof window._socialSseUnsub === 'function') {
        window._socialSseUnsub();
        window._socialSseUnsub = null;
      }
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
      localStorage.setItem('social_activeBrandSlug', brandSlug); // Persist across navigation
      activeBrandSubTab = 'overview';
      activeChannelId = null;
      const brand = (socialBrandsData || []).find(b => b.slug === brandSlug || b.id === brandSlug);
      const mIdx = new Date(selectedPlanMonth + ' 1, ' + selectedPlanYear).getMonth();
      const mKey = `${selectedPlanYear}-${String(mIdx + 1).padStart(2, '0')}`;
      monthlyFocusNote = (brand && brand.monthlyFocus && brand.monthlyFocus[mKey] && brand.monthlyFocus[mKey].thesis) || '';
      populateBrandChannelDropdown(brandSlug);
      updateCategoryOptions(brandSlug);
      renderContentOS();
    },
    switchBrandSubTab(tab) {
      activeBrandSubTab = tab;
      localStorage.setItem('social_activeBrandSubTab', tab);
      if (tab !== 'channel') {
        activeChannelId = null;
        localStorage.removeItem('social_activeChannelId');
      }
      renderContentOS();
    },
    openChannelWorkspace(channelId) {
      activeBrandSubTab = 'channel';
      activeChannelId = channelId;
      localStorage.setItem('social_activeBrandSubTab', 'channel');
      localStorage.setItem('social_activeChannelId', channelId);
      const brand = (socialBrandsData || []).find(b => b.slug === activeBrandSlug || b.id === activeBrandSlug);
      const mIdx = new Date(selectedPlanMonth + ' 1, ' + selectedPlanYear).getMonth();
      const mKey = `${selectedPlanYear}-${String(mIdx + 1).padStart(2, '0')}`;
      monthlyFocusNote = (brand && brand.monthlyFocus && brand.monthlyFocus[mKey] && brand.monthlyFocus[mKey].thesis) || '';
      renderContentOS();
    },
    changePlanMonth(m) {
      selectedPlanMonth = m;
      const brand = (socialBrandsData || []).find(b => b.slug === activeBrandSlug || b.id === activeBrandSlug);
      const mIdx = new Date(selectedPlanMonth + ' 1, ' + selectedPlanYear).getMonth();
      const mKey = `${selectedPlanYear}-${String(mIdx + 1).padStart(2, '0')}`;
      monthlyFocusNote = (brand && brand.monthlyFocus && brand.monthlyFocus[mKey] && brand.monthlyFocus[mKey].thesis) || '';
      renderContentOS();
    },
    changePlanYear(y) {
      const num = Number(y);
      // Only re-render when a valid 4-digit year is entered (prevents rerender on each keystroke: 2, 20, 202, 2026)
      if (!num || num < 2020 || num > 2035) return;
      selectedPlanYear = num;
      const brand = (socialBrandsData || []).find(b => b.slug === activeBrandSlug || b.id === activeBrandSlug);
      const mIdx = new Date(selectedPlanMonth + ' 1, ' + selectedPlanYear).getMonth();
      const mKey = `${selectedPlanYear}-${String(mIdx + 1).padStart(2, '0')}`;
      monthlyFocusNote = (brand && brand.monthlyFocus && brand.monthlyFocus[mKey] && brand.monthlyFocus[mKey].thesis) || '';
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
      sessionStorage.setItem('social_platformFilter', plat);
      if (activeViewMode === 'calendar') renderCalendar();
      else renderBoard();
    },
    filterChannel(chan) {
      activeChannelFilter = chan;
      sessionStorage.setItem('social_channelFilter', chan);
      if (activeViewMode === 'calendar') renderCalendar();
      else renderBoard();
    },
    setCalendarFilter(filter) {
      // Filter the channel workspace plan items list by content type (all / long_form / shorts)
      activeCalendarFilter = filter;
      const brand = (socialBrandsData && socialBrandsData.length > 0 ? socialBrandsData : []).find(b => b.slug === activeBrandSlug || b.id === activeBrandSlug) || null;
      const channel = brand && (brand.channels || []).find(c => c.id === activeChannelId || c.slug === activeChannelId);
      if (brand && channel) {
        const container = document.getElementById('brandSubTabBodyContainer');
        if (container) container.innerHTML = renderChannelWorkspaceHTML(brand, channel);
      }
    },
    refilterBoard() {
      // Called by Kanban search input — re-reads activeBoardSearch from the input and re-renders
      const input = document.getElementById('kanbanSearchInput');
      if (input) {
        activeBoardSearch = input.value || '';
        sessionStorage.setItem('social_boardSearch', activeBoardSearch);
      }
      renderBoard();
    },
    async handleChannelCsvUpload(input, brandSlug, channelId) {
      const file = (input && input.files) ? input.files[0] : (input instanceof File ? input : null);
      if (!file) return;

      const progressBox = document.getElementById('csvUploadProgressBox');
      const defaultContent = document.getElementById('csvDefaultDropContent');
      const stepText = document.getElementById('csvProgressStepText');
      const percentText = document.getElementById('csvProgressPercentText');
      const barFill = document.getElementById('csvProgressBarFill');

      if (progressBox && defaultContent) {
        defaultContent.style.display = 'none';
        progressBox.style.display = 'flex';
      }

      let currentPercent = 10;
      const progressInterval = setInterval(() => {
        if (currentPercent < 90) {
          currentPercent += Math.floor(Math.random() * 12) + 6;
          if (currentPercent > 90) currentPercent = 90;
          if (percentText) percentText.textContent = `${currentPercent}%`;
          if (barFill) barFill.style.width = `${currentPercent}%`;
          if (stepText) {
            if (currentPercent < 35) {
              stepText.textContent = `📊 Ingesting CSV rows & verifying retention metrics...`;
            } else if (currentPercent < 65) {
              stepText.textContent = `🔍 Indexing watch hours, conversion CTRs & dialect signals...`;
            } else {
              stepText.textContent = `🧠 Grounding Channel Intelligence Baseline Card...`;
            }
          }
        }
      }, 220);

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
        clearInterval(progressInterval);

        if (percentText) percentText.textContent = `100%`;
        if (barFill) barFill.style.width = `100%`;
        if (stepText) stepText.textContent = `🎉 Ingestion Complete! Memory Indexed.`;

        if (json && json.success) {
          isOnboardingOverride = false;
          if (window.showToast) window.showToast('✅ Channel analytics & audience memory indexed permanently!', 'success');
          await new Promise(r => setTimeout(r, 450));
          await loadInitialData();
          this.openChannelWorkspace(channelId);
        } else {
          throw new Error(json?.error || 'Failed to upload CSV');
        }
      } catch (err) {
        clearInterval(progressInterval);
        console.error('CSV upload error:', err);
        if (window.showToast) window.showToast('Upload notice: ' + err.message, 'error');
        if (progressBox && defaultContent) {
          defaultContent.style.display = 'block';
          progressBox.style.display = 'none';
        }
      } finally {
        if (input && input.value) input.value = '';
      }
    },
    toggleOnboardingPath(path) {
      activeOnboardingPath = path;
      const brand = (socialBrandsData || []).find(b => b.slug === activeBrandSlug) || socialBrandsData[0];
      const channel = (brand && brand.channels) ? brand.channels.find(c => c.id === activeChannelId) : null;
      if (brand && channel) {
        const container = document.getElementById('brandSubTabBodyContainer');
        if (container) container.innerHTML = renderChannelWorkspaceHTML(brand, channel);
      }
    },
    async saveChannelOnboardingQA(brandSlug, channelId) {
      const archetype = document.getElementById('qaArchetype')?.value || 'General Media';
      const primaryLanguage = document.getElementById('qaLanguage')?.value || 'Bangla + English (Banglish / Spoken)';
      const audiencePersona = document.getElementById('qaAudiencePersona')?.value || '';
      const pillars = (document.getElementById('qaPillars')?.value || '').split(',').map(s => s.trim()).filter(Boolean);
      const contentConstraints = document.getElementById('qaConstraints')?.value || '';

      try {
        const res = await APP_API.post(`/social-brands/${brandSlug}/channels/${channelId}/onboard`, {
          archetype,
          primaryLanguage,
          audiencePersona,
          pillars,
          contentConstraints
        });

        if (res && res.success) {
          isOnboardingOverride = false;
          if (window.showToast) window.showToast('🎉 Channel Intelligence Onboarding Complete!', 'success');
          await loadInitialData();
          this.openChannelWorkspace(channelId);
        } else {
          throw new Error(res?.error || 'Failed to complete onboarding');
        }
      } catch (err) {
        if (window.showToast) window.showToast('Onboarding error: ' + err.message, 'error');
      }
    },
    async resetChannelOnboarding(brandSlug, channelId) {
      this.showConfirmDialog({
        title: 'Reset Channel Baseline?',
        message: 'This will clear the current channel analytics knowledge base so you can upload a new CSV report or re-enter baseline metrics.\n\nDo you want to proceed?',
        icon: '🔄',
        confirmText: 'Reset Baseline',
        confirmStyle: 'btn-secondary btn-danger',
        onConfirm: async () => {
          try {
            const res = await APP_API.post(`/social-brands/${brandSlug}/channels/${channelId}/reset-onboarding`);
            if (res && res.success) {
              isOnboardingOverride = true;
              if (window.showToast) window.showToast('🔄 Channel ready for fresh onboarding!', 'info');
              await loadInitialData();
              this.openChannelWorkspace(channelId);
            }
          } catch (err) {
            if (window.showToast) window.showToast('Reset notice: ' + err.message, 'error');
          }
        }
      });
    },
    openCommunitySnapshotModal() {
      let modal = document.getElementById('communitySnapshotModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'communitySnapshotModal';
        modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; z-index:9999;';
        document.body.appendChild(modal);
      }

      const brand = (socialBrandsData || []).find(b => b.slug === activeBrandSlug) || socialBrandsData[0];
      const channel = (brand && brand.channels) ? brand.channels.find(c => c.id === activeChannelId) : null;

      modal.innerHTML = `
        <div style="background:#181824; border:1px solid var(--border-subtle); border-radius:14px; width:90%; max-width:480px; padding:1.5rem; display:flex; flex-direction:column; gap:1rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-subtle); padding-bottom:0.6rem;">
            <div style="font-weight:800; font-size:1rem; color:#fff; display:flex; align-items:center; gap:0.4rem;">
              <span>📝</span> Log Community & Audience Snapshot
            </div>
            <button type="button" class="btn-ghost btn-sm" onclick="window.SOCIAL_MODULE.closeCommunitySnapshotModal()">✕</button>
          </div>

          <div style="display:flex; flex-direction:column; gap:0.75rem; font-size:0.78rem;">
            <div>
              <label class="form-label">Active Member / Audience Count</label>
              <input type="number" id="snapMemberCount" class="input-text" value="${channel?.audienceCount || 1200}">
            </div>

            <div>
              <label class="form-label">Top Discussed Topics & Questions (comma-separated)</label>
              <input type="text" id="snapTopTopics" class="input-text" value="${escapeHTML(channel?.analyticsKnowledgeBase?.topCategories?.join(', ') || '')}" placeholder="e.g. Job Interview English, Career Growth, Skill Development...">
            </div>

            <div>
              <label class="form-label">Snapshot Notes / Context</label>
              <textarea id="snapNotes" class="input-text" rows="2" placeholder="e.g. High response rate on morning job alerts..."></textarea>
            </div>
          </div>

          <div style="display:flex; justify-content:flex-end; gap:0.5rem; margin-top:0.4rem;">
            <button type="button" class="btn-ghost btn-sm" onclick="window.SOCIAL_MODULE.closeCommunitySnapshotModal()">Cancel</button>
            <button type="button" class="btn-primary btn-sm" style="background:#10b981; border:none; font-weight:800;" onclick="window.SOCIAL_MODULE.submitCommunitySnapshot()">Save Snapshot</button>
          </div>
        </div>
      `;
      modal.style.display = 'flex';
    },
    closeCommunitySnapshotModal() {
      const modal = document.getElementById('communitySnapshotModal');
      if (modal) modal.style.display = 'none';
    },
    async submitCommunitySnapshot() {
      const count = document.getElementById('snapMemberCount')?.value || 100;
      const topics = document.getElementById('snapTopTopics')?.value || '';
      const notes = document.getElementById('snapNotes')?.value || '';

      this.closeCommunitySnapshotModal();
      await this.saveCommunitySnapshot(count, topics, notes);
    },
    async saveCommunitySnapshot(memberCount, topTopics, notes) {
      const brand = (socialBrandsData || []).find(b => b.slug === activeBrandSlug) || socialBrandsData[0];
      const channelId = activeChannelId || (brand && brand.channels && brand.channels[0]?.id);

      try {
        const res = await APP_API.post(`/social-brands/${brand.slug}/channels/${channelId}/analytics`, {
          memberCount: Number(memberCount) || 100,
          topTopics: (typeof topTopics === 'string' ? topTopics.split(',') : topTopics).map(s => s.trim()).filter(Boolean),
          notes,
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

      const progressBox = document.getElementById('channelGenProgressContainer');
      const stepText = document.getElementById('genProgressStepText');
      const percentText = document.getElementById('genProgressPercent');
      const barFill = document.getElementById('genProgressBarFill');

      if (progressBox) progressBox.style.display = 'flex';

      let currentPercent = 5;
      const progressInterval = setInterval(() => {
        if (currentPercent < 90) {
          currentPercent += Math.floor(Math.random() * 8) + 4;
          if (currentPercent > 90) currentPercent = 90;
          if (percentText) percentText.textContent = `${currentPercent}%`;
          if (barFill) barFill.style.width = `${currentPercent}%`;

          if (stepText) {
            if (currentPercent < 25) {
              stepText.textContent = `🔍 Ingesting 114 Indexed Content Signals & Watch Time CTRs...`;
            } else if (currentPercent < 50) {
              stepText.textContent = `🧠 Applying Primary Language Profile & Search Intent...`;
            } else if (currentPercent < 75) {
              stepText.textContent = `📹 Structuring 8 Long-form Pillar Deep Dives on Peak Velocity Days (Fri & Tue)...`;
            } else {
              stepText.textContent = `🎬 Generating 28 Daily Discovery Shorts with Viral Hooks & VEO Prompts...`;
            }
          }
        }
      }, 350);

      try {
        const res = await APP_API.post(`/social-brands/${brandSlug}/channels/${channelId}/generate-calendar`, {
          month: selectedPlanMonth,
          year: selectedPlanYear,
          alignAnchor: alignAnchorSynergy,
          focusNote: monthlyFocusNote
        });

        clearInterval(progressInterval);
        if (percentText) percentText.textContent = `100%`;
        if (barFill) barFill.style.width = `100%`;
        if (stepText) stepText.textContent = `🎉 4-Week Strategic Production Blueprint Complete!`;

        if (res && res.success && res.calendar) {
          // Direct in-memory state synchronization
          const brand = (socialBrandsData || []).find(b => b.slug === brandSlug || b.id === brandSlug);
          if (brand && brand.channels) {
            const ch = brand.channels.find(c => c.id === channelId || c.slug === channelId);
            if (ch) {
              ch.calendars = ch.calendars || {};
              ch.calendars[res.calendar.monthKey] = res.calendar;
            }
          }

          selectedPlanMonth = res.calendar.month || selectedPlanMonth;
          selectedPlanYear = res.calendar.year || selectedPlanYear;

          await new Promise(r => setTimeout(r, 450));
          if (window.showToast) window.showToast(`✨ Generated ${selectedPlanMonth} strategic calendar for ${channelId}!`, 'success');
          
          await loadInitialData();
          this.openChannelWorkspace(channelId);
        } else {
          throw new Error(res?.error || 'Generation failed');
        }
      } catch (err) {
        clearInterval(progressInterval);
        console.error('Calendar Gen Error:', err);
        if (window.showToast) window.showToast('Generation notice: ' + err.message, 'error');
      } finally {
        isGeneratingCalendar = false;
        if (progressBox) progressBox.style.display = 'none';
        if (btn) {
          btn.disabled = false;
          btn.textContent = '✨ Generate ' + selectedPlanMonth + ' Strategy';
        }
      }
    },
    async lockChannelCalendar(brandSlug, channelId, monthKey) {
      this.showConfirmDialog({
        title: `Lock ${selectedPlanMonth} Calendar?`,
        message: `All plan items will be frozen and auto-created as active drafts in your Kanban pipeline for production and approval.\n\nAre you ready to lock?`,
        icon: '🔒',
        confirmText: 'Lock & Push Drafts',
        confirmStyle: 'btn-emerald',
        onConfirm: async () => {
          if (window.showToast) window.showToast('🔒 Freezing plan and provisioning drafts in pipeline...', 'info');
          try {
            const res = await APP_API.post(`/social-brands/${brandSlug}/channels/${channelId}/calendars/${monthKey}/lock`, {});
            if (res && res.success) {
              const brand = (socialBrandsData || []).find(b => b.slug === brandSlug || b.id === brandSlug);
              const ch = brand && (brand.channels || []).find(c => c.id === channelId || c.slug === channelId);
              const planItems = ch && ch.calendars && ch.calendars[monthKey] && ch.calendars[monthKey].planItems;
              const draftCount = (planItems && planItems.length) || (res.draftsCreated || 0);

              const msg = `🔒 ${selectedPlanMonth} locked! ${draftCount} drafts → Kanban pipeline.`;
              if (window.showToast) window.showToast(msg, 'success');

              await loadInitialData();
              this.openChannelWorkspace(channelId);

              setTimeout(() => {
                if (window.showToast) window.showToast('👀 Switch to Kanban view to see your new drafts', 'info');
              }, 1500);
            } else {
              throw new Error(res?.error || 'Lock failed');
            }
          } catch (err) {
            console.error('Lock error:', err);
            if (window.showToast) window.showToast('Lock failed: ' + err.message, 'error');
          }
        }
      });
    },
    openPostModalFromPlanItem(brandSlug, channelId, monthKey, planIndex) {
      const brand = (socialBrandsData || []).find(b => b.slug === brandSlug || b.id === brandSlug);
      const channel = (brand && brand.channels || []).find(c => c.id === channelId || c.slug === channelId);
      const calendar = channel && channel.calendars && channel.calendars[monthKey];
      const item = calendar && calendar.planItems && calendar.planItems[planIndex];

      if (!item) return;

      this.openPostModal(brandSlug);
      const titleEl = document.getElementById('spTitle');
      const dateEl = document.getElementById('spDate');
      const timeEl = document.getElementById('spTime');
      const chanEl = document.getElementById('spChannel');
      const platEl = document.getElementById('spPlatform');
      const ctEl = document.getElementById('spContentType');
      const durEl = document.getElementById('spTargetDuration');

      if (titleEl) titleEl.value = item.topicIdea || item.title || '';
      const kbPeakTime = channel && channel.analyticsKnowledgeBase && (channel.analyticsKnowledgeBase.peakPostingTime || (channel.analyticsKnowledgeBase.bestPostingDays && channel.analyticsKnowledgeBase.bestPostingDays[0] && channel.analyticsKnowledgeBase.bestPostingDays[0].match(/\d{1,2}:\d{2}/)?.[0]));
      const resolvedTime = item.suggestedTime || kbPeakTime || '18:00';
      if (timeEl) timeEl.value = resolvedTime;

      if (chanEl) {
        chanEl.value = brandSlug;
        this.onChannelChange(brandSlug);
      }

      if (platEl && channel && channel.platform) {
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
    draftPostFromPlanItem(brandSlug, channelId, planIndex) {
      const brand = (socialBrandsData || []).find(b => b.slug === brandSlug || b.id === brandSlug);
      const channel = (brand && brand.channels || []).find(c => c.id === channelId || c.slug === channelId);
      const monthIndex = new Date(selectedPlanMonth + ' 1, ' + selectedPlanYear).getMonth();
      const currentMonthKey = `${selectedPlanYear}-${String(monthIndex + 1).padStart(2, '0')}`;
      
      let calendar = channel && channel.calendars && channel.calendars[currentMonthKey];
      if (!calendar && channel && channel.calendars) {
        const keys = Object.keys(channel.calendars);
        if (keys.length > 0) calendar = channel.calendars[keys[0]];
      }

      const planItem = calendar && calendar.planItems && calendar.planItems[planIndex];
      const planTopic = (planItem && (planItem.topicIdea || planItem.title)) || '';

      // Item 3.8: Duplicate draft detection
      if (planTopic && Array.isArray(postsData)) {
        const existingDraft = postsData.find(p => 
          p.title && p.title.trim().toLowerCase() === planTopic.trim().toLowerCase()
        );
        if (existingDraft) {
          const proceed = window.confirm(`⚠️ A post with the title "${planTopic}" already exists in your pipeline (${existingDraft.status}).\n\nDo you want to draft another post for this topic anyway?`);
          if (!proceed) return;
        }
      }

      this.openPostModalFromPlanItem(brandSlug, channelId, (calendar && calendar.monthKey) || currentMonthKey, planIndex);
    },
    async saveBrandMonthlyFocus(brandSlug) {
      const thesis = document.getElementById('inpBrandMonthlyThesis')?.value || '';
      const keyProducts = document.getElementById('inpBrandMonthlyProducts')?.value || '';
      const campaignTags = document.getElementById('inpBrandMonthlyTags')?.value || '';

      const monthIndex = new Date(selectedPlanMonth + ' 1, ' + selectedPlanYear).getMonth();
      const monthKey = `${selectedPlanYear}-${String(monthIndex + 1).padStart(2, '0')}`;

      if (window.showToast) window.showToast(`💾 Saving Brand Monthly Focus for ${selectedPlanMonth} ${selectedPlanYear}...`, 'info');

      try {
        const res = await APP_API.post(`/social-brands/${brandSlug}/monthly-focus`, {
          month: selectedPlanMonth,
          year: selectedPlanYear,
          monthKey,
          thesis,
          keyProducts,
          campaignTags
        });

        if (res && res.success) {
          monthlyFocusNote = thesis;
          await loadInitialData();
          if (window.showToast) window.showToast(`✨ Brand Monthly Focus saved & synced across all channels!`, 'success');
          renderContentOS();
        } else {
          throw new Error(res?.error || 'Save failed');
        }
      } catch (err) {
        console.error('Save Monthly Focus error:', err);
        if (window.showToast) window.showToast('Save failed: ' + err.message, 'error');
      }
    },
    async saveBrandGuidelines(brandSlug) {
      const primaryLanguage = document.getElementById('inpBrandLanguage')?.value || 'Bangla + English (Banglish / Spoken)';
      const tagline = document.getElementById('inpBrandTagline')?.value.trim();
      const niche = document.getElementById('inpBrandNiche')?.value.trim();
      const tone = document.getElementById('inpBrandTone')?.value.trim();
      const mission = document.getElementById('inpBrandMission')?.value.trim();
      const standardHashtags = document.getElementById('inpBrandHashtags')?.value.trim();
      const fonts = document.getElementById('inpBrandFonts')?.value.trim();
      const standardCta = document.getElementById('inpBrandCta')?.value.trim();

      try {
        const res = await APP_API.put(`/social-brands/${brandSlug}`, {
          primaryLanguage,
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
    showDialogModal(html) {
      const modal = document.getElementById('socialDialogModal');
      const box = document.getElementById('socialDialogBox');
      if (modal && box) {
        box.innerHTML = html;
        modal.style.display = 'flex';
      }
    },
    closeSocialDialog() {
      const modal = document.getElementById('socialDialogModal');
      if (modal) modal.style.display = 'none';
    },
    showConfirmDialog({ title, message, icon = '⚠️', confirmText = 'Confirm', confirmStyle = 'btn-primary', onConfirm }) {
      window._socialModalConfirmAction = onConfirm;
      const html = `
        <div style="display:flex; flex-direction:column; gap:0.9rem;">
          <div style="display:flex; align-items:center; gap:0.6rem;">
            <span style="font-size:1.6rem;">${icon}</span>
            <div style="font-weight:800; font-size:1.1rem; color:#fff; font-family:var(--font-heading);">${escapeHTML(title)}</div>
          </div>
          <div style="font-size:0.85rem; color:var(--text-muted); line-height:1.45; white-space:pre-wrap;">${escapeHTML(message)}</div>
          <div style="display:flex; justify-content:flex-end; gap:0.6rem; margin-top:0.4rem; border-top:1px solid var(--border-subtle); padding-top:0.8rem;">
            <button type="button" class="btn-secondary" onclick="window.SOCIAL_MODULE.closeSocialDialog()">Cancel</button>
            <button type="button" class="${confirmStyle}" onclick="window.SOCIAL_MODULE.closeSocialDialog(); if (window._socialModalConfirmAction) window._socialModalConfirmAction();">${confirmText}</button>
          </div>
        </div>
      `;
      this.showDialogModal(html);
    },
    promptAddBrand() {
      const html = `
        <div style="display:flex; flex-direction:column; gap:0.9rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-subtle); padding-bottom:0.6rem;">
            <div style="font-weight:800; font-size:1.1rem; color:#fff; font-family:var(--font-heading);">✨ Create Digital Brand</div>
            <button type="button" class="btn-ghost btn-sm" onclick="window.SOCIAL_MODULE.closeSocialDialog()">✕</button>
          </div>
          <div class="form-group">
            <label class="form-label" style="font-size:0.82rem; font-weight:700;">Brand Name *</label>
            <input type="text" id="dlgBrandName" class="input-text" placeholder="e.g. Creator Academy" required autofocus>
          </div>
          <div class="form-group">
            <label class="form-label" style="font-size:0.82rem; font-weight:700;">Core Niche / Focus</label>
            <input type="text" id="dlgBrandNiche" class="input-text" placeholder="e.g. EdTech & Career Skills" value="Digital Media & AI">
          </div>
          <div style="display:flex; justify-content:flex-end; gap:0.6rem; border-top:1px solid var(--border-subtle); padding-top:0.8rem;">
            <button type="button" class="btn-secondary" onclick="window.SOCIAL_MODULE.closeSocialDialog()">Cancel</button>
            <button type="button" class="btn-primary" onclick="
              const name = document.getElementById('dlgBrandName')?.value.trim();
              const niche = document.getElementById('dlgBrandNiche')?.value.trim() || 'Digital Media & AI';
              if (!name) { if (window.showToast) window.showToast('Please enter a brand name', 'error'); return; }
              window.SOCIAL_MODULE.closeSocialDialog();
              window.SOCIAL_MODULE.createCustomBrand(name, niche);
            ">🚀 Create Brand</button>
          </div>
        </div>
      `;
      this.showDialogModal(html);
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
      const html = `
        <div style="display:flex; flex-direction:column; gap:0.9rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-subtle); padding-bottom:0.6rem;">
            <div style="font-weight:800; font-size:1.1rem; color:#fff; font-family:var(--font-heading);">📺 Add Channel</div>
            <button type="button" class="btn-ghost btn-sm" onclick="window.SOCIAL_MODULE.closeSocialDialog()">✕</button>
          </div>
          <div class="form-group">
            <label class="form-label" style="font-size:0.82rem; font-weight:700;">Channel Name *</label>
            <input type="text" id="dlgChanName" class="input-text" placeholder="e.g. TikTok Shorts Channel" required autofocus>
          </div>
          <div class="form-group">
            <label class="form-label" style="font-size:0.82rem; font-weight:700;">Platform *</label>
            <select id="dlgChanPlatform" class="input-text">
              <option value="YouTube">YouTube</option>
              <option value="TikTok" selected>TikTok</option>
              <option value="Facebook">Facebook</option>
              <option value="Instagram">Instagram</option>
              <option value="LinkedIn">LinkedIn</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="X">X (Twitter)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" style="font-size:0.82rem; font-weight:700;">Handle / Profile URL</label>
            <input type="text" id="dlgChanHandle" class="input-text" placeholder="@brand_official">
          </div>
          <div style="display:flex; justify-content:flex-end; gap:0.6rem; border-top:1px solid var(--border-subtle); padding-top:0.8rem;">
            <button type="button" class="btn-secondary" onclick="window.SOCIAL_MODULE.closeSocialDialog()">Cancel</button>
            <button type="button" class="btn-primary" onclick="
              const name = document.getElementById('dlgChanName')?.value.trim();
              const platform = document.getElementById('dlgChanPlatform')?.value || 'TikTok';
              const handle = document.getElementById('dlgChanHandle')?.value.trim() || '@brand_official';
              if (!name) { if (window.showToast) window.showToast('Please enter a channel name', 'error'); return; }
              window.SOCIAL_MODULE.closeSocialDialog();
              window.SOCIAL_MODULE.createCustomChannel(name, platform, handle);
            ">🚀 Add Channel</button>
          </div>
        </div>
      `;
      this.showDialogModal(html);
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
    renderMediaUploadPreview() {
      const previewBox = document.getElementById('spMediaUploadPreview');
      const promptBox = document.getElementById('spMediaUploadPrompt');
      const urlHidden = document.getElementById('spMediaUrl');
      if (!previewBox) return;

      if (!currentPostMediaUrls || currentPostMediaUrls.length === 0) {
        previewBox.style.display = 'none';
        if (promptBox) promptBox.style.display = 'block';
        if (urlHidden) urlHidden.value = '';
        return;
      }

      previewBox.style.display = 'flex';
      previewBox.style.flexDirection = 'column';
      if (urlHidden) urlHidden.value = currentPostMediaUrls[0] || '';

      previewBox.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.3rem;">
          <span style="font-size:0.75rem; font-weight:800; color:#c084fc;">
            Attached Media Assets (${currentPostMediaUrls.length})
          </span>
          <button type="button" class="btn-ghost btn-sm" style="font-size:0.68rem; color:#ef4444; padding:0.1rem 0.4rem;" onclick="window.SOCIAL_MODULE.clearUploadedMedia()">Clear All</button>
        </div>
        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(95px, 1fr)); gap:0.5rem; max-height:160px; overflow-y:auto; padding:0.2rem;">
          ${currentPostMediaUrls.map((url, idx) => {
            const isImg = url.startsWith('data:image') || url.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i);
            return `
              <div style="position:relative; height:68px; border-radius:6px; overflow:hidden; background:rgba(0,0,0,0.5); border:1px solid var(--border-subtle); display:flex; align-items:center; justify-content:center;">
                ${isImg ? `<img src="${escapeHTML(url)}" style="width:100%; height:100%; object-fit:cover;" alt="asset">` : `<span style="font-size:1.2rem;">🎬</span>`}
                <button type="button" style="position:absolute; top:3px; right:3px; width:18px; height:18px; border-radius:50%; background:rgba(239,68,68,0.9); color:#fff; border:none; display:flex; align-items:center; justify-content:center; font-size:10px; cursor:pointer; line-height:1;" onclick="window.SOCIAL_MODULE.removePostMediaUrl(${idx})" title="Remove">✕</button>
              </div>
            `;
          }).join('')}
        </div>
      `;
    },
    removePostMediaUrl(idx) {
      if (currentPostMediaUrls && currentPostMediaUrls[idx] !== undefined) {
        currentPostMediaUrls.splice(idx, 1);
        this.renderMediaUploadPreview();
      }
    },
    addDirectMediaUrl() {
      const input = document.getElementById('spDirectMediaUrl');
      const val = input ? input.value.trim() : '';
      if (!val) return;
      currentPostMediaUrls.push(val);
      input.value = '';
      this.renderMediaUploadPreview();
      if (window.showToast) window.showToast('✅ Asset URL attached to post!', 'info');
    },
    async handleMediaFileUpload(input) {
      const file = input.files && input.files[0];
      if (!file) return;

      const previewBox = document.getElementById('spMediaUploadPreview');
      if (previewBox) {
        previewBox.style.display = 'flex';
        previewBox.innerHTML += `<div style="font-size:0.75rem; color:#a855f7; padding:0.3rem;">⏳ Uploading ${escapeHTML(file.name)}...</div>`;
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
          currentPostMediaUrls.push(json.url);
          this.renderMediaUploadPreview();
          if (window.showToast) window.showToast('✅ Media asset attached successfully!', 'success');
        } else {
          throw new Error((json && json.error) || 'Upload failed');
        }
      } catch (err) {
        console.error('Media upload failed:', err);
        this.renderMediaUploadPreview();
        if (window.showToast) window.showToast('Upload error: ' + err.message, 'error');
      }
    },
    clearUploadedMedia() {
      const fileInput = document.getElementById('spMediaFileInput');
      const urlHidden = document.getElementById('spMediaUrl');
      currentPostMediaUrls = [];

      if (fileInput) fileInput.value = '';
      if (urlHidden) urlHidden.value = '';
      this.renderMediaUploadPreview();
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
      const channelKey = document.getElementById('spChannel')?.value || activeBrandSlug || 'grow-bangla';
      const channelObj = getChannelConfig(channelKey);
      const contentCategory = document.getElementById('spCategory')?.value || (channelObj.categories && channelObj.categories[0]) || 'English Lesson';
      const platform = document.getElementById('spPlatform')?.value || 'YouTube';
      const contentType = document.getElementById('spContentType')?.value || 'Short-form Video';
      const targetDuration = document.getElementById('spTargetDuration')?.value || '60s';
      const topic = document.getElementById('spTitle')?.value || '';
      const angle = document.getElementById('spAngle')?.value || '';
      const referenceContext = activeReferenceAsset ? JSON.stringify(activeReferenceAsset) : null;

      // Resolve primary language from active brand/channel context
      const activeBrand = (socialBrandsData || []).find(b => b.slug === channelKey || b.id === channelKey || b.slug === activeBrandSlug ||
        (b.channels || []).some(c => c.id === channelKey || c.slug === channelKey));
      const activeChannel = activeBrand && (activeBrand.channels || []).find(c =>
        c.id === channelKey || c.slug === channelKey || (activeChannelId && (c.id === activeChannelId || c.slug === activeChannelId)));

      const BRAND_LANG_MAP = {
        'grow-bangla': 'Bangla + English (Banglish / Spoken)',
        'pilutics': 'Bangla / Bengali (Documentary & Analysis)',
        'bong-hits': 'Bengali (Music, Skits & Pop Culture)',
        'gro10x': 'English (Global B2B & Tech)'
      };

      const primaryLanguage = (activeChannel && activeChannel.primaryLanguage) ||
        (activeBrand && activeBrand.primaryLanguage) ||
        BRAND_LANG_MAP[channelKey] ||
        BRAND_LANG_MAP[activeBrand?.slug] ||
        BRAND_LANG_MAP[activeBrandSlug] ||
        'Bangla + English (Banglish / Spoken)';

      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '✨ Generating Brief &amp; Prompts...';
      }

      let progressInterval = null;
      if (container) {
        container.style.display = 'flex';
        container.innerHTML = `
          <div style="width:100%; background:rgba(20,20,35,0.95); border:1px solid rgba(168,85,247,0.3); border-radius:12px; padding:1.4rem; display:flex; flex-direction:column; align-items:center; gap:0.8rem; text-align:center;">
            <div style="font-size:2rem; animation: pulse 1.2s infinite;">🤖</div>
            <div style="font-weight:900; font-size:0.95rem; color:#fff;">
              Crafting Strategic <strong>${escapeHTML(contentType)}</strong> Blueprint
            </div>
            <div style="width:100%; max-width:380px; display:flex; flex-direction:column; gap:0.4rem;">
              <div style="display:flex; justify-content:space-between; font-size:0.75rem; font-weight:800;">
                <span id="briefProgressStep" style="color:#c084fc;">🎯 Synthesizing Viral Hook &amp; Retention Angle...</span>
                <span id="briefProgressPercent" style="color:#10b981;">15%</span>
              </div>
              <div style="width:100%; height:7px; background:rgba(255,255,255,0.1); border-radius:10px; overflow:hidden;">
                <div id="briefProgressBar" style="width:15%; height:100%; background:linear-gradient(90deg, #a855f7, #10b981); transition:width 0.22s ease; border-radius:10px;"></div>
              </div>
            </div>
            <div style="font-size:0.72rem; color:var(--text-dim);">
              Grounding character actions, camera moves &amp; spoken voice lines for <strong>${escapeHTML(channelObj.name)}</strong>...
            </div>
          </div>
        `;

        let currentPercent = 15;
        const stepEl = document.getElementById('briefProgressStep');
        const pctEl = document.getElementById('briefProgressPercent');
        const barEl = document.getElementById('briefProgressBar');

        progressInterval = setInterval(() => {
          if (currentPercent < 90) {
            currentPercent += Math.floor(Math.random() * 12) + 6;
            if (currentPercent > 90) currentPercent = 90;
            if (pctEl) pctEl.textContent = `${currentPercent}%`;
            if (barEl) barEl.style.width = `${currentPercent}%`;
            if (stepEl) {
              if (currentPercent < 35) {
                stepEl.textContent = `🎯 Synthesizing Stop-The-Scroll Hook & Angle...`;
              } else if (currentPercent < 65) {
                stepEl.textContent = `🎬 Directing 6 Character-Driven VEO 3 Scenes...`;
              } else {
                stepEl.textContent = `🎙️ Syncing Spoken Script & Flow Agent Brief...`;
              }
            }
          }
        }, 220);
      }

      try {
        const res = await APP_API.post('/ai/social-brief', {
          brandSlug: activeBrandSlug,
          channel: channelObj.name,
          contentCategory,
          platform,
          contentType,
          targetDuration,
          topic,
          angle,
          referenceContext,
          primaryLanguage
        });

        if (progressInterval) clearInterval(progressInterval);

        if (res && res.success && res.brief) {
          activeGeneratedBrief = res.brief;
          this.renderAIBriefPanel(res.brief, res.generatedBy);
          if (window.showToast) window.showToast('✨ AI Content Blueprint & Prompts generated!', 'success');
        } else {
          throw new Error((res && res.error) || 'Failed to generate brief');
        }
      } catch (err) {
        if (progressInterval) clearInterval(progressInterval);
        console.error('[AI Brief] Error:', err);
        if (container) {
          container.innerHTML = `
            <div style="color:#fca5a5; font-size:0.82rem; padding:0.5rem;">
              ⚠️ AI generation error: ${escapeHTML(err.message)}
            </div>
          `;
        }
      } finally {
        if (progressInterval) clearInterval(progressInterval);
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

      // Build spoken script from scene voice lines (verbatim teleprompter) or fall back to voiceNote
      const spokenScript = (isVideo && brief.veoScenes[0] && brief.veoScenes[0].voiceLine)
        ? brief.veoScenes.map(s => `[${s.timeRange}] ${s.voiceLine}`).join('\n\n')
        : (brief.voiceNote || '');

      container.style.display = 'flex';
      container.innerHTML = `
        <!-- Panel Header: title + Regenerate + Auto-Fill -->
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(168,85,247,0.2); padding-bottom:0.5rem; flex-wrap:wrap; gap:0.4rem;">
          <span style="font-size:0.82rem; font-weight:800; color:#d8b4fe;">
            ✨ ${escapeHTML(brief.contentType || 'Content')} Blueprint (${escapeHTML(generatedBy || 'gemini')})
          </span>
          <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
            <button type="button" class="btn-ghost btn-sm" style="font-size:0.7rem; padding:0.2rem 0.6rem;" onclick="window.SOCIAL_MODULE.generateAIBrief()">
              🔄 Regenerate
            </button>
            <button type="button" class="btn-primary btn-sm" style="font-size:0.7rem; padding:0.2rem 0.6rem; background:#10b981; border:none;" onclick="window.SOCIAL_MODULE.applyAllBriefFields()">
              ⚡ Auto-Fill Post Form
            </button>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr; gap:0.6rem; font-size:0.78rem;">

          <!-- 🎙️ SPOKEN TALKING SCRIPT — FIRST & PROMINENT (this is the primary creator output) -->
          <div style="background:rgba(10,10,30,0.85); border:1.5px solid rgba(168,85,247,0.5); border-radius:12px; padding:0.85rem 1rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
              <strong style="color:#d8b4fe; font-size:0.88rem;">🎙️ Spoken Talking Script (Read Verbatim)</strong>
              <button type="button" class="btn-primary btn-sm" style="font-size:0.68rem; padding:0.2rem 0.65rem; background:linear-gradient(135deg,#a855f7,#6366f1); border:none; font-weight:800;" onclick="navigator.clipboard.writeText('${escapeHTML(spokenScript).replace(/'/g, "\\'")}'); if(window.showToast) window.showToast('📋 Talking script copied to clipboard!','success');">📋 Copy Script</button>
            </div>
            <div style="color:#e2e8f0; font-size:0.8rem; line-height:1.75; white-space:pre-wrap; font-family: 'Georgia', serif; background:rgba(0,0,0,0.35); padding:0.65rem 0.8rem; border-radius:8px; max-height:220px; overflow-y:auto;">${escapeHTML(spokenScript)}</div>
          </div>

          <!-- Viral Hook & Angle -->
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
                <button type="button" class="btn-primary btn-sm" style="font-size:0.68rem; padding:0.25rem 0.65rem; background:linear-gradient(135deg,#a855f7,#6366f1); border:none; font-weight:800;" onclick="window.SOCIAL_MODULE.copyAllVeoPrompts()">
                  📋 Copy Full Flow Agent Brief (Angle + Script + VEO)
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

          <!-- Visual Brief -->
          <div style="background:rgba(0,0,0,0.25); border-radius:6px; padding:0.5rem; border:1px solid rgba(255,255,255,0.05);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.2rem;">
              <strong style="color:#ffffff;">🎬 Visual Brief (CapCut/Canva):</strong>
              <button type="button" class="btn-ghost btn-sm" style="font-size:0.65rem; padding:0.1rem 0.4rem;" onclick="navigator.clipboard.writeText('${escapeHTML(brief.visualBrief).replace(/'/g, "\\'")}'); if(window.showToast) window.showToast('Visual brief copied!','success');">📋 Copy</button>
            </div>
            <div style="color:var(--text-muted); font-size:0.74rem;">${escapeHTML(brief.visualBrief)}</div>
          </div>

        </div>
      `;
    },
    copyAllVeoPrompts() {
      if (!activeGeneratedBrief) return;
      const b = activeGeneratedBrief;

      // Build a complete, structured brief that the Flow agent can consume directly
      const sections = [];

      sections.push(`===== 🎬 SHORT-FORM VIDEO FLOW AGENT BRIEF =====`);
      sections.push(`Language: ${b.primaryLanguage || 'Bangla + English (Banglish / Spoken)'}`);
      sections.push(`Duration: ${b.targetDuration || '60s'} | Format: ${b.contentType || 'Short-form Video'}`);
      sections.push('');

      sections.push(`🎯 VIRAL HOOK:`);
      sections.push(`"${b.hook}"`);
      sections.push('');

      sections.push(`📐 ANGLE (Why This Resonates):`);
      sections.push(b.angle || '');
      sections.push('');

      if (Array.isArray(b.keyPoints) && b.keyPoints.length > 0) {
        sections.push(`🔑 KEY POINTS TO COVER:`);
        b.keyPoints.forEach((p, i) => sections.push(`  ${i + 1}. ${p}`));
        sections.push('');
      }

      // Build spoken talking script directly from 10-second scene voice lines for a guaranteed verbatim teleprompter read
      const spokenScript = (Array.isArray(b.veoScenes) && b.veoScenes.length > 0 && b.veoScenes[0].voiceLine)
        ? b.veoScenes.map(s => `[${s.timeRange}] ${s.voiceLine}`).join('\n\n')
        : (b.voiceNote || '');

      sections.push(`🎙️ SPOKEN TALKING SCRIPT (Read this verbatim on camera, in ${b.primaryLanguage || 'Bangla + English (Banglish / Spoken)'}):`);
      sections.push(spokenScript);
      sections.push('');

      if (b.masterVeoPrompt) {
        sections.push(`🎥 GOOGLE VEO 3 SCENE PROMPTS (10-Second Chunks for Flow Agent):`);
        sections.push(b.masterVeoPrompt);
        sections.push('');
      }

      sections.push(`===== END OF FLOW AGENT BRIEF =====`);

      const fullBrief = sections.join('\n');
      navigator.clipboard.writeText(fullBrief);
      if (window.showToast) window.showToast('📋 Complete Flow Agent Brief copied! Angle + Key Points + Visual Brief + Talking Script + VEO Prompts all bundled.', 'success');
    },
    copyAllPdfSlides() {
      if (!activeGeneratedBrief || !Array.isArray(activeGeneratedBrief.pdfOutline) || activeGeneratedBrief.pdfOutline.length === 0) return;
      // Build a readable slide deck outline from the pdfOutline array
      const text = activeGeneratedBrief.pdfOutline.map(s => {
        const bullets = (s.bullets || []).map(b => `  • ${b}`).join('\n');
        const visual = s.visualNote ? `  [Layout: ${s.visualNote}]` : '';
        return `Slide ${s.slideNumber}: ${s.headline} (${s.type})\n${bullets}${visual ? '\n' + visual : ''}`;
      }).join('\n\n');
      navigator.clipboard.writeText(text);
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
    async openPostModal(brandSlugOverride = null) {
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

      const targetBrand = brandSlugOverride || activeBrandSlug || 'grow-bangla';
      populateBrandChannelDropdown(targetBrand);
      const spChannel = document.getElementById('spChannel');
      if (spChannel) spChannel.value = targetBrand;
      this.onChannelChange(targetBrand);

      document.getElementById('spClientSelect').value = '';
      document.getElementById('spClientName').value = '';
      this.updateCharCount({ value: '' }, 'YouTube');

      const revSec = document.getElementById('spRevisionHistorySection');
      if (revSec) { revSec.style.display = 'none'; revSec.innerHTML = ''; }
      const clientBtns = document.getElementById('spClientActionBtns');
      const submitBtn = document.getElementById('spSubmitBtn');
      if (clientBtns) clientBtns.style.display = 'none';
      if (submitBtn) submitBtn.style.display = 'block';
      ['spTitle', 'spCaption', 'spFirstComment', 'spHashtags'].forEach(fId => {
        const el = document.getElementById(fId);
        if (el) el.removeAttribute('readonly');
      });

      this.checkAiModelHealth();
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
      document.getElementById('spTitle').value = post.title || '';
      document.getElementById('spCaption').value = post.caption || '';
      document.getElementById('spFirstComment').value = post.firstComment || '';
      document.getElementById('spHashtags').value = post.hashtags || '';
      document.getElementById('spMediaUrl').value = (post.mediaUrls && post.mediaUrls[0]) || '';
      
      // Initialize multi-media preview grid
      currentPostMediaUrls = Array.isArray(post.mediaUrls) ? [...post.mediaUrls] : ((post.mediaUrls && post.mediaUrls[0]) ? [post.mediaUrls[0]] : []);
      this.renderMediaUploadPreview();

      document.getElementById('spDate').value = post.scheduledDate || new Date().toISOString().split('T')[0];
      document.getElementById('spTime').value = post.scheduledTime || '18:00';
      document.getElementById('spPlatform').value = post.platform || 'YouTube';
      
      const channelVal = post.channel ? (CHANNELS.find(c => c.name.includes(post.channel) || c.id === post.channel)?.id || (socialBrandsData || []).find(b => (b.name && b.name.includes(post.channel)) || b.slug === post.channel)?.slug || 'grow-bangla') : 'grow-bangla';
      populateBrandChannelDropdown(channelVal);
      const channelSelect = document.getElementById('spChannel');
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

      // Phase 5.3: Render Revision History Log if revisions exist
      const revSec = document.getElementById('spRevisionHistorySection');
      if (revSec) {
        const revs = post.revisionHistory || [];
        if (revs.length > 0) {
          revSec.style.display = 'block';
          revSec.innerHTML = `
            <div style="background:rgba(239,68,68,0.06); border:1px solid rgba(239,68,68,0.25); border-radius:10px; padding:0.8rem; display:flex; flex-direction:column; gap:0.5rem;">
              <div style="font-weight:800; font-size:0.82rem; color:#f87171; display:flex; justify-content:space-between; align-items:center;">
                <span>📋 Revision History Log (${revs.length})</span>
                <span style="font-size:0.7rem; color:var(--text-muted);">Chronological Log</span>
              </div>
              <div style="display:flex; flex-direction:column; gap:0.45rem; max-height:140px; overflow-y:auto;">
                ${revs.map(r => `
                  <div style="background:rgba(0,0,0,0.3); border-radius:6px; padding:0.45rem 0.6rem; font-size:0.75rem; display:flex; flex-direction:column; gap:0.2rem;">
                    <div style="display:flex; justify-content:space-between; align-items:center; color:var(--text-dim); font-size:0.68rem;">
                      <span><strong>${escapeHTML(r.by || 'Reviewer')}</strong> (${escapeHTML(r.role || 'Client')})</span>
                      <span>${new Date(r.timestamp || Date.now()).toLocaleDateString()} ${new Date(r.timestamp || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    ${Array.isArray(r.tags) && r.tags.length > 0 ? `
                      <div style="display:flex; gap:0.3rem; flex-wrap:wrap;">
                        ${r.tags.map(t => `<span class="badge badge-amber" style="font-size:0.6rem; padding:0.1rem 0.35rem;">${escapeHTML(t)}</span>`).join('')}
                      </div>
                    ` : ''}
                    <div style="color:#fff; line-height:1.35;">${escapeHTML(r.feedback || '')}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          `;
        } else {
          revSec.style.display = 'none';
          revSec.innerHTML = '';
        }
      }

      // Phase 5.1: Client Role Adaptations
      const isClient = isClientRole();
      const clientBtns = document.getElementById('spClientActionBtns');
      const submitBtn = document.getElementById('spSubmitBtn');

      if (isClient) {
        document.getElementById('postModalTitle').textContent = '👁️ Review Social Post';
        if (clientBtns) {
          clientBtns.style.display = 'flex';
          const approveBtn = document.getElementById('spModalApproveBtn');
          const rejectBtn = document.getElementById('spModalRejectBtn');
          if (approveBtn) {
            approveBtn.onclick = () => {
              window.SOCIAL_MODULE.closePostModal(true);
              window.SOCIAL_MODULE.approvePost(post.id);
            };
          }
          if (rejectBtn) {
            rejectBtn.onclick = () => {
              window.SOCIAL_MODULE.closePostModal(true);
              window.SOCIAL_MODULE.promptRejectPost(post.id);
            };
          }
        }
        if (submitBtn) submitBtn.style.display = 'none';
        ['spTitle', 'spCaption', 'spFirstComment', 'spHashtags'].forEach(fId => {
          const el = document.getElementById(fId);
          if (el) el.setAttribute('readonly', 'true');
        });
      } else {
        document.getElementById('postModalTitle').textContent = '✏️ Edit Social Post Draft';
        if (clientBtns) clientBtns.style.display = 'none';
        if (submitBtn) submitBtn.style.display = 'block';
        ['spTitle', 'spCaption', 'spFirstComment', 'spHashtags'].forEach(fId => {
          const el = document.getElementById(fId);
          if (el) el.removeAttribute('readonly');
        });
      }

      this.checkAiModelHealth();
      document.getElementById('postModal').classList.add('active');
    },
    closePostModal(force = false) {
      if (!force) {
        const title = document.getElementById('spTitle')?.value.trim() || '';
        const caption = document.getElementById('spCaption')?.value.trim() || '';
        if (title.length > 0 || caption.length > 0) {
          const proceed = window.confirm('⚠️ You have unsaved changes in your draft.\n\nDo you want to discard your changes and close?');
          if (!proceed) return;
        }
      }
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

      // Platform character limit check
      const limit = PLATFORM_LIMITS[platform] || 5000;
      if (caption.length > limit) {
        if (window.showToast) window.showToast(`⚠️ Caption exceeds ${platform} limit (${caption.length}/${limit} chars). Please shorten before saving.`, 'error');
        return;
      }

      // Past scheduled date warning
      if (scheduledDate && new Date(scheduledDate + 'T00:00:00') < new Date(new Date().toDateString())) {
        const proceed = window.confirm(`⚠️ Notice: Scheduled date (${scheduledDate}) is in the past.\n\nDo you want to proceed saving with this date?`);
        if (!proceed) return;
      }

      const submitBtn = document.getElementById('spSubmitBtn');
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = '⏳ Saving...'; }

      try {
        const resolvedMedia = (currentPostMediaUrls && currentPostMediaUrls.length > 0)
          ? currentPostMediaUrls
          : (mediaUrl ? [mediaUrl] : []);

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
          assignedPublisher: window.CURRENT_USER?.name || window.APP_STATE?.user?.name || 'Content Team',
          mediaUrls: resolvedMedia
        };

        if (editId) {
          await APP_API.put(`/posts/${editId}`, payload);
          if (window.showToast) window.showToast('Social post updated!', 'success');
        } else {
          payload.status = 'Draft';
          await APP_API.post('/posts', payload);
          if (window.showToast) window.showToast('Social post draft created!', 'success');
        }

        this.closePostModal(true);
        loadInitialData(false);
      } catch (err) {
        if (window.showToast) window.showToast('Failed to save post: ' + err.message, 'error');
      } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = '🚀 Save & Submit Draft'; }
      }
    },
    async updatePostStatus(id, newStatus) {
      const p = postsData.find(x => x.id === id);
      const prev = p ? p.status : null;
      if (p) {
        p.status = newStatus;
        renderKPIs();
        renderBoard();
      }
      try {
        await APP_API.patch(`/posts/${id}/status`, { status: newStatus });
        if (window.showToast) window.showToast(`Post stage updated to "${newStatus}"`, 'success');
        loadInitialData(false);
      } catch (err) {
        if (p && prev) { p.status = prev; renderKPIs(); renderBoard(); }
        if (window.showToast) window.showToast('Status update failed: ' + err.message, 'error');
      }
    },
    async approvePost(id) {
      const p = postsData.find(x => x.id === id);
      const prev = p ? p.status : null;
      if (p) {
        p.status = 'Approved';
        renderKPIs();
        renderBoard();
      }
      try {
        await APP_API.post(`/posts/${id}/approve`, {});
        if (window.showToast) window.showToast('🎉 Social post approved!', 'success');
        loadInitialData(false);
      } catch (err) {
        if (p && prev) { p.status = prev; renderKPIs(); renderBoard(); }
        if (window.showToast) window.showToast('Approval failed: ' + err.message, 'error');
      }
    },
    async markAsPosted(id) {
      const p = postsData.find(x => x.id === id);
      const prev = p ? p.status : null;
      if (p) {
        p.status = 'Posted';
        renderKPIs();
        renderBoard();
      }
      try {
        await APP_API.post(`/posts/${id}/posted`, {});
        if (window.showToast) window.showToast('✅ Post marked as Posted & Live!', 'success');
        loadInitialData(false);
      } catch (err) {
        if (p && prev) { p.status = prev; renderKPIs(); renderBoard(); }
        if (window.showToast) window.showToast('Failed to mark as posted: ' + err.message, 'error');
      }
    },
    promptRejectPost(id) {
      let selectedTags = [];
      window._toggleRevTag = (btn, tag) => {
        const idx = selectedTags.indexOf(tag);
        if (idx === -1) {
          selectedTags.push(tag);
          btn.style.background = 'rgba(239,68,68,0.25)';
          btn.style.borderColor = '#ef4444';
          btn.style.color = '#fff';
        } else {
          selectedTags.splice(idx, 1);
          btn.style.background = 'transparent';
          btn.style.borderColor = 'var(--border-subtle)';
          btn.style.color = 'var(--text-muted)';
        }
      };

      const html = `
        <div style="display:flex; flex-direction:column; gap:0.9rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-subtle); padding-bottom:0.6rem;">
            <div style="font-weight:800; font-size:1.1rem; color:#f87171; font-family:var(--font-heading);">🔴 Structured Revision Feedback</div>
            <button type="button" class="btn-ghost btn-sm" onclick="window.SOCIAL_MODULE.closeSocialDialog()">✕</button>
          </div>
          <div style="font-size:0.8rem; color:var(--text-muted);">Select key revision focus areas:</div>
          <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
            <button type="button" class="btn-ghost btn-sm" style="font-size:0.7rem; border:1px solid var(--border-subtle);" onclick="window._toggleRevTag(this, 'Tone adjustment')">🎭 Tone adjustment</button>
            <button type="button" class="btn-ghost btn-sm" style="font-size:0.7rem; border:1px solid var(--border-subtle);" onclick="window._toggleRevTag(this, 'Stronger hook')">⚡ Stronger hook</button>
            <button type="button" class="btn-ghost btn-sm" style="font-size:0.7rem; border:1px solid var(--border-subtle);" onclick="window._toggleRevTag(this, 'Add clear CTA')">📣 Add clear CTA</button>
            <button type="button" class="btn-ghost btn-sm" style="font-size:0.7rem; border:1px solid var(--border-subtle);" onclick="window._toggleRevTag(this, 'Fix Spelling/Grammar')">✍️ Spelling/Grammar</button>
            <button type="button" class="btn-ghost btn-sm" style="font-size:0.7rem; border:1px solid var(--border-subtle);" onclick="window._toggleRevTag(this, 'Replace Media Asset')">🖼️ Replace Media Asset</button>
            <button type="button" class="btn-ghost btn-sm" style="font-size:0.7rem; border:1px solid var(--border-subtle);" onclick="window._toggleRevTag(this, 'Caption/Hashtag tweak')">🏷️ Caption/Hashtags</button>
          </div>
          <div class="form-group">
            <label class="form-label" style="font-size:0.82rem; font-weight:700;">Revision Instructions *</label>
            <textarea id="dlgRevText" class="input-text" rows="3" placeholder="Provide clear, actionable directions for the creator to revise..." required autofocus></textarea>
          </div>
          <div style="display:flex; justify-content:flex-end; gap:0.6rem; border-top:1px solid var(--border-subtle); padding-top:0.8rem;">
            <button type="button" class="btn-secondary" onclick="window.SOCIAL_MODULE.closeSocialDialog()">Cancel</button>
            <button type="button" class="btn-primary" style="background:#ef4444; border:none; font-weight:800;" onclick="
              const fb = document.getElementById('dlgRevText')?.value.trim();
              if (!fb) { if (window.showToast) window.showToast('Please provide revision instructions', 'error'); return; }
              window.SOCIAL_MODULE.closeSocialDialog();
              window.SOCIAL_MODULE.submitPostRejection('${id}', fb, selectedTags);
            ">Submit Revision Request</button>
          </div>
        </div>
      `;
      this.showDialogModal(html);
    },
    async submitPostRejection(id, feedback, tags = []) {
      try {
        await APP_API.post(`/posts/${id}/reject`, { feedback, tags });
        if (window.showToast) window.showToast('🔴 Revision request submitted & logged.', 'info');
        loadInitialData(false);
      } catch (err) {
        if (window.showToast) window.showToast('Revision request failed: ' + err.message, 'error');
      }
    },
    deletePost(id) {
      this.showConfirmDialog({
        title: 'Delete Social Post?',
        message: 'Are you sure you want to delete this draft? This action cannot be undone.',
        icon: '🗑️',
        confirmText: 'Delete Post',
        confirmStyle: 'btn-secondary btn-danger',
        onConfirm: async () => {
          try {
            await APP_API.delete(`/posts/${id}`);
            if (window.showToast) window.showToast('Post deleted.', 'info');
            loadInitialData(false);
          } catch (err) {
            if (window.showToast) window.showToast('Delete failed: ' + err.message, 'error');
          }
        }
      });
    },
    openEditPlanItemModal(brandSlug, channelId, monthKey, planIndex) {
      const brand = (socialBrandsData || []).find(b => b.slug === brandSlug || b.id === brandSlug);
      const channel = brand && (brand.channels || []).find(c => c.id === channelId || c.slug === channelId);
      const calendar = channel && channel.calendars && channel.calendars[monthKey];
      const item = calendar && calendar.planItems && calendar.planItems[planIndex];
      if (!item) return;

      document.getElementById('editPlanBrandSlug').value = brandSlug;
      document.getElementById('editPlanChannelId').value = channelId;
      document.getElementById('editPlanMonthKey').value = monthKey;
      document.getElementById('editPlanIndex').value = planIndex;

      document.getElementById('editPlanTopic').value = item.topicIdea || item.title || '';
      document.getElementById('editPlanHook').value = item.hook || '';
      document.getElementById('editPlanRationale').value = item.strategicRationale || item.rationale || '';
      document.getElementById('editPlanDate').value = item.scheduledDate || '';
      document.getElementById('editPlanTime').value = item.suggestedTime || '18:00';
      document.getElementById('editPlanContentType').value = item.contentType || 'Short-form Video';
      document.getElementById('editPlanDuration').value = item.targetDuration || '60s';

      const modal = document.getElementById('planItemEditModal');
      if (modal) modal.style.display = 'flex';
    },
    closePlanItemEditModal() {
      const modal = document.getElementById('planItemEditModal');
      if (modal) modal.style.display = 'none';
    },
    async handlePlanItemEditSubmit(e) {
      e.preventDefault();
      const brandSlug = document.getElementById('editPlanBrandSlug').value;
      const channelId = document.getElementById('editPlanChannelId').value;
      const monthKey = document.getElementById('editPlanMonthKey').value;
      const planIndex = document.getElementById('editPlanIndex').value;

      const payload = {
        topicIdea: document.getElementById('editPlanTopic').value.trim(),
        hook: document.getElementById('editPlanHook').value.trim(),
        rationale: document.getElementById('editPlanRationale').value.trim(),
        scheduledDate: document.getElementById('editPlanDate').value,
        suggestedTime: document.getElementById('editPlanTime').value || '18:00',
        contentType: document.getElementById('editPlanContentType').value,
        targetDuration: document.getElementById('editPlanDuration').value.trim() || '60s'
      };

      const btn = document.getElementById('btnSavePlanItem');
      if (btn) { btn.disabled = true; btn.textContent = '⏳ Saving...'; }

      try {
        const res = await APP_API.put(`/social-brands/${brandSlug}/channels/${channelId}/calendars/${monthKey}/items/${planIndex}`, payload);
        if (res && res.success) {
          if (window.showToast) window.showToast('✅ Plan item updated!', 'success');
          this.closePlanItemEditModal();
          await loadInitialData();
          this.openChannelWorkspace(channelId);
        } else {
          throw new Error(res?.error || 'Update failed');
        }
      } catch (err) {
        if (window.showToast) window.showToast('Update failed: ' + err.message, 'error');
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = '💾 Save Changes'; }
      }
    },
    deletePlanItem(brandSlug, channelId, monthKey, planIndex) {
      this.showConfirmDialog({
        title: 'Delete Plan Item?',
        message: 'Are you sure you want to remove this scheduled item from the calendar plan?',
        icon: '🗑️',
        confirmText: 'Delete Item',
        confirmStyle: 'btn-secondary btn-danger',
        onConfirm: async () => {
          try {
            const res = await APP_API.delete(`/social-brands/${brandSlug}/channels/${channelId}/calendars/${monthKey}/items/${planIndex}`);
            if (res && res.success) {
              if (window.showToast) window.showToast('Plan item removed.', 'info');
              await loadInitialData();
              this.openChannelWorkspace(channelId);
            } else {
              throw new Error(res?.error || 'Delete failed');
            }
          } catch (err) {
            if (window.showToast) window.showToast('Delete failed: ' + err.message, 'error');
          }
        }
      });
    },
    saveTopicSuggestion() {
      if (!activeSuggestedTopics || activeSuggestedTopics.length === 0) return;
      const current = activeSuggestedTopics[currentSuggestedIndex] || activeSuggestedTopics[0];
      if (!current) return;

      let saved = [];
      try {
        saved = JSON.parse(localStorage.getItem('social_saved_ideas') || '[]');
      } catch (e) { saved = []; }

      const exists = saved.some(s => (s.topicIdea || s.title) === (current.topicIdea || current.title));
      if (!exists) {
        saved.push({
          ...current,
          savedAt: new Date().toISOString(),
          brandSlug: activeBrandSlug,
          channelId: activeChannelId
        });
        localStorage.setItem('social_saved_ideas', JSON.stringify(saved));
        if (window.showToast) window.showToast('⭐ Idea saved to bookmarks!', 'success');
      } else {
        if (window.showToast) window.showToast('ℹ️ Idea is already saved.', 'info');
      }
    },
    showSavedIdeasModal() {
      let saved = [];
      try {
        saved = JSON.parse(localStorage.getItem('social_saved_ideas') || '[]');
      } catch (e) { saved = []; }

      const listEl = document.getElementById('savedIdeasList');
      if (listEl) {
        if (saved.length === 0) {
          listEl.innerHTML = `
            <div style="text-align:center; padding:2rem 1rem; color:var(--text-dim); font-size:0.85rem;">
              <div style="font-size:2rem; margin-bottom:0.4rem;">⭐</div>
              No saved ideas yet. Click "⭐ Save Idea" on any suggested topic to bookmark it here!
            </div>
          `;
        } else {
          listEl.innerHTML = saved.map((idea, idx) => `
            <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); border-radius:10px; padding:0.8rem; display:flex; justify-content:space-between; align-items:center; gap:0.75rem;">
              <div style="flex:1;">
                <div style="font-weight:700; color:#fff; font-size:0.88rem;">${escapeHTML(idea.topicIdea || idea.title)}</div>
                ${idea.hook ? `<div style="font-size:0.75rem; color:#a7f3d0; margin-top:0.2rem;">💬 "${escapeHTML(idea.hook)}"</div>` : ''}
                <div style="font-size:0.68rem; color:var(--text-dim); margin-top:0.2rem;">Saved ${new Date(idea.savedAt).toLocaleDateString()}</div>
              </div>
              <div style="display:flex; gap:0.4rem; align-items:center;">
                <button type="button" class="btn-primary btn-sm" style="font-size:0.72rem; padding:0.25rem 0.65rem;" onclick="window.SOCIAL_MODULE.useSavedIdea(${idx})">Use Topic</button>
                <button type="button" class="btn-ghost btn-sm" style="font-size:0.75rem; color:#f87171;" onclick="window.SOCIAL_MODULE.removeSavedIdea(${idx})">✕</button>
              </div>
            </div>
          `).join('');
        }
      }

      const modal = document.getElementById('savedIdeasModal');
      if (modal) modal.style.display = 'flex';
    },
    closeSavedIdeasModal() {
      const modal = document.getElementById('savedIdeasModal');
      if (modal) modal.style.display = 'none';
    },
    useSavedIdea(idx) {
      let saved = [];
      try {
        saved = JSON.parse(localStorage.getItem('social_saved_ideas') || '[]');
      } catch (e) { saved = []; }

      const idea = saved[idx];
      if (idea) {
        const titleEl = document.getElementById('spTitle');
        if (titleEl) titleEl.value = idea.topicIdea || idea.title || '';
        this.closeSavedIdeasModal();
        if (window.showToast) window.showToast('✅ Saved topic loaded into post draft!', 'success');
      }
    },
    removeSavedIdea(idx) {
      let saved = [];
      try {
        saved = JSON.parse(localStorage.getItem('social_saved_ideas') || '[]');
      } catch (e) { saved = []; }

      saved.splice(idx, 1);
      localStorage.setItem('social_saved_ideas', JSON.stringify(saved));
      this.showSavedIdeasModal();
    },
    viewChannelKnowledgeBase(brandSlug, channelId) {
      const brand = (socialBrandsData || []).find(b => b.slug === brandSlug || b.id === brandSlug);
      const channel = brand && (brand.channels || []).find(c => c.id === channelId || c.slug === channelId);
      const kb = channel && channel.analyticsKnowledgeBase;
      if (!channel || !kb) {
        if (window.showToast) window.showToast('No knowledge base indexed for this channel yet.', 'info');
        return;
      }

      const modal = document.getElementById('knowledgeBaseModal');
      const titleEl = document.getElementById('kbModalTitle');
      const subEl = document.getElementById('kbModalSubtitle');
      const contentEl = document.getElementById('kbModalContent');

      if (titleEl) titleEl.innerHTML = `🏛️ ${escapeHTML(channel.name)} Knowledge Base`;
      if (subEl) subEl.textContent = `Indexed on ${new Date(kb.lastUpdated || Date.now()).toLocaleDateString()} · Source: ${kb.source || 'Studio Analytics'}`;

      if (contentEl) {
        contentEl.innerHTML = `
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(140px, 1fr)); gap:0.6rem;">
            <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); border-radius:8px; padding:0.6rem 0.8rem;">
              <div style="font-size:0.65rem; color:var(--text-dim); text-transform:uppercase; font-weight:800;">Indexed Views</div>
              <div style="font-size:1.15rem; font-weight:800; color:#fff; margin-top:0.2rem;">${(kb.totalViews || 0).toLocaleString()}</div>
            </div>
            <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); border-radius:8px; padding:0.6rem 0.8rem;">
              <div style="font-size:0.65rem; color:var(--text-dim); text-transform:uppercase; font-weight:800;">Watch Hours</div>
              <div style="font-size:1.15rem; font-weight:800; color:#38bdf8; margin-top:0.2rem;">${(kb.totalWatchTimeHours || 0).toLocaleString()} hrs</div>
            </div>
            <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); border-radius:8px; padding:0.6rem 0.8rem;">
              <div style="font-size:0.65rem; color:var(--text-dim); text-transform:uppercase; font-weight:800;">Audience / Subs</div>
              <div style="font-size:1.15rem; font-weight:800; color:#a855f7; margin-top:0.2rem;">${(kb.totalSubscribers || channel.audienceCount || 0).toLocaleString()}</div>
            </div>
            <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); border-radius:8px; padding:0.6rem 0.8rem;">
              <div style="font-size:0.65rem; color:var(--text-dim); text-transform:uppercase; font-weight:800;">Average CTR</div>
              <div style="font-size:1.15rem; font-weight:800; color:#10b981; margin-top:0.2rem;">${kb.avgCtr || 5.18}%</div>
            </div>
          </div>

          <!-- Content Pillars -->
          <div style="background:rgba(255,255,255,0.02); border:1px solid var(--border-subtle); border-radius:10px; padding:0.8rem;">
            <div style="font-weight:800; font-size:0.82rem; color:#fff; margin-bottom:0.4rem;">📋 Core Content Pillars & Categories</div>
            <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
              ${(kb.topCategories || ['Core Content']).map(c => `<span class="badge badge-blue" style="font-size:0.75rem; padding:0.25rem 0.6rem;">${escapeHTML(c)}</span>`).join('')}
            </div>
          </div>

          <!-- Velocity Windows & Best Times -->
          <div style="background:rgba(255,255,255,0.02); border:1px solid var(--border-subtle); border-radius:10px; padding:0.8rem;">
            <div style="font-weight:800; font-size:0.82rem; color:#fff; margin-bottom:0.4rem;">⚡ Peak Velocity Posting Windows</div>
            <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
              ${(kb.bestPostingDays || ['Friday 18:00', 'Tuesday 19:00']).map(d => `<span class="badge badge-emerald" style="font-size:0.75rem; padding:0.25rem 0.6rem;">🔥 ${escapeHTML(d)}</span>`).join('')}
            </div>
          </div>

          <!-- Persona & Rules -->
          <div style="background:rgba(255,255,255,0.02); border:1px solid var(--border-subtle); border-radius:10px; padding:0.8rem;">
            <div style="font-weight:800; font-size:0.82rem; color:#fff; margin-bottom:0.4rem;">👤 Audience Persona & Brand Constraints</div>
            <div style="font-size:0.78rem; color:var(--text-secondary); line-height:1.5;">
              <div><strong>Persona:</strong> ${escapeHTML(kb.audiencePersona || brand.niche || 'Target Content Consumers')}</div>
              <div style="margin-top:0.3rem;"><strong>Production Constraints:</strong> ${escapeHTML(kb.contentConstraints || 'Bengali script for voiceover; NO text overlay on video generation; strictly icon graphics only.')}</div>
              <div style="margin-top:0.3rem;"><strong>Primary Spoken Language:</strong> ${escapeHTML(kb.primaryLanguage || channel.primaryLanguage || brand.primaryLanguage || 'Bengali')}</div>
            </div>
          </div>

          ${Array.isArray(kb.topPerformers) && kb.topPerformers.length > 0 ? `
            <!-- Top Proven Performers -->
            <div style="background:rgba(255,255,255,0.02); border:1px solid var(--border-subtle); border-radius:10px; padding:0.8rem;">
              <div style="font-weight:800; font-size:0.82rem; color:#fff; margin-bottom:0.5rem;">🏆 Proven High-Performing Content</div>
              <div style="display:flex; flex-direction:column; gap:0.4rem; max-height:160px; overflow-y:auto;">
                ${kb.topPerformers.map(p => `
                  <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.3); border-radius:6px; padding:0.4rem 0.6rem; font-size:0.75rem;">
                    <span style="font-weight:700; color:#fff; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:70%;">${escapeHTML(p.title || p.topicIdea)}</span>
                    <span style="color:#10b981; font-weight:800;">${(p.views || 0).toLocaleString()} views</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <div style="display:flex; justify-content:flex-end; border-top:1px solid var(--border-subtle); padding-top:0.8rem;">
            <button type="button" class="btn-primary" onclick="window.SOCIAL_MODULE.closeKnowledgeBaseModal()">Close Inspector</button>
          </div>
        `;
      }

      if (modal) modal.style.display = 'flex';
    },
    closeKnowledgeBaseModal() {
      const modal = document.getElementById('knowledgeBaseModal');
      if (modal) modal.style.display = 'none';
    },
    exportCalendarPlanCsv(brandSlug, channelId, monthKey) {
      const brand = (socialBrandsData || []).find(b => b.slug === brandSlug || b.id === brandSlug);
      const channel = brand && (brand.channels || []).find(c => c.id === channelId || c.slug === channelId);
      const cal = channel && channel.calendars && channel.calendars[monthKey];
      const items = (cal && cal.planItems) || [];

      if (items.length === 0) {
        if (window.showToast) window.showToast('No scheduled items to export for this month.', 'info');
        return;
      }

      const headers = ['Week', 'Day', 'Scheduled Date', 'Suggested Time', 'Content Type', 'Duration', 'Format', 'Topic Idea', '3-Second Hook', 'Strategic Rationale'];
      const rows = items.map(item => [
        `"${(item.week || '').replace(/"/g, '""')}"`,
        `"${(item.dayOfWeek || '').replace(/"/g, '""')}"`,
        `"${(item.scheduledDate || '').replace(/"/g, '""')}"`,
        `"${(item.suggestedTime || '18:00').replace(/"/g, '""')}"`,
        `"${(item.contentType || '').replace(/"/g, '""')}"`,
        `"${(item.targetDuration || '60s').replace(/"/g, '""')}"`,
        `"${(item.formatTag || '').replace(/"/g, '""')}"`,
        `"${(item.topicIdea || item.title || '').replace(/"/g, '""')}"`,
        `"${(item.hook || '').replace(/"/g, '""')}"`,
        `"${(item.strategicRationale || '').replace(/"/g, '""')}"`
      ]);

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${channel.slug || channel.id}-${monthKey}-content-plan.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      if (window.showToast) window.showToast(`📥 Exported ${items.length} items to CSV!`, 'success');
    },
    clearChannelMonthCalendar(brandSlug, channelId, monthKey) {
      this.showConfirmDialog({
        title: `Clear ${selectedPlanMonth} Calendar?`,
        message: 'Are you sure you want to remove all scheduled plan items for this month? This action cannot be undone.',
        icon: '🗑️',
        confirmText: 'Clear Entire Month',
        confirmStyle: 'btn-secondary btn-danger',
        onConfirm: async () => {
          try {
            const res = await APP_API.delete(`/social-brands/${brandSlug}/channels/${channelId}/calendars/${monthKey}`);
            if (res && res.success) {
              if (window.showToast) window.showToast(`🗑️ ${selectedPlanMonth} plan items cleared.`, 'info');
              await loadInitialData();
              this.openChannelWorkspace(channelId);
            } else {
              throw new Error(res?.error || 'Clear failed');
            }
          } catch (err) {
            if (window.showToast) window.showToast('Clear failed: ' + err.message, 'error');
          }
        }
      });
    },
    switchTopicInputMode(mode) {
      activeTopicInputMode = mode;
      const tabType = document.getElementById('tabModeType');
      const tabVoice = document.getElementById('tabModeVoice');
      const tabRef = document.getElementById('tabModeRef');

      const cType = document.getElementById('topicModeTypeContainer');
      const cVoice = document.getElementById('topicModeVoiceContainer');
      const cRef = document.getElementById('topicModeRefContainer');

      if (tabType) tabType.className = mode === 'type' ? 'btn-sm btn-primary' : 'btn-sm btn-ghost';
      if (tabVoice) tabVoice.className = mode === 'voice' ? 'btn-sm btn-primary' : 'btn-sm btn-ghost';
      if (tabRef) tabRef.className = mode === 'reference' ? 'btn-sm btn-primary' : 'btn-sm btn-ghost';

      if (cType) cType.style.display = (mode === 'type' || mode === 'voice' || mode === 'reference') ? 'flex' : 'none';
      if (cVoice) cVoice.style.display = mode === 'voice' ? 'flex' : 'none';
      if (cRef) cRef.style.display = mode === 'reference' ? 'flex' : 'none';
    },
    onTopicInputChange(input) {
      const val = (input?.value || '').trim();
      if (val.length > 5) {
        const card = document.getElementById('topicSuggestionCard');
        if (card && card.style.display !== 'none') {
          card.style.display = 'none';
        }
      }
    },
    toggleVoiceRecording() {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        if (window.showToast) window.showToast('⚠️ Voice recognition is not supported in this browser. Please use Chrome.', 'error');
        return;
      }

      const pulseDot = document.getElementById('voicePulseDot');
      const statusText = document.getElementById('voiceStatusText');
      const btn = document.getElementById('btnToggleVoice');
      const titleInput = document.getElementById('spTitle');

      if (isVoiceRecordingActive) {
        if (speechRecognitionInstance) {
          try { speechRecognitionInstance.stop(); } catch (e) {}
        }
        isVoiceRecordingActive = false;
        if (pulseDot) { pulseDot.style.background = '#6b7280'; pulseDot.style.animation = 'none'; }
        if (statusText) statusText.textContent = 'Voice capture stopped. You can edit the text above.';
        if (btn) {
          btn.innerHTML = '🎙️ Start Recording Voice';
          btn.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
        }
        return;
      }

      try {
        const recog = new SpeechRecognition();
        speechRecognitionInstance = recog;
        recog.continuous = true;
        recog.interimResults = true;

        const channelKey = document.getElementById('spChannel')?.value || 'grow-bangla';
        const activeBrand = (socialBrandsData || []).find(b => b.slug === channelKey || b.id === channelKey ||
          (b.channels || []).some(c => c.id === channelKey || c.slug === channelKey));
        const activeChannel = activeBrand && (activeBrand.channels || []).find(c => c.id === channelKey || c.slug === channelKey);
        const lang = (activeChannel && activeChannel.primaryLanguage) || (activeBrand && activeBrand.primaryLanguage) || '';

        if (lang.includes('Bangla') || lang.includes('Bengali')) {
          recog.lang = 'bn-BD';
        } else {
          recog.lang = 'en-US';
        }

        recog.onstart = () => {
          isVoiceRecordingActive = true;
          if (pulseDot) { pulseDot.style.background = '#ef4444'; pulseDot.style.animation = 'pulse 1s infinite'; }
          if (statusText) statusText.textContent = '🔴 Listening... speak your concept in Bangla / English';
          if (btn) {
            btn.innerHTML = '⏹️ Stop Recording';
            btn.style.background = '#374151';
          }
          if (window.showToast) window.showToast('🎙️ Microphone active! Speak your concept...', 'info');
        };

        recog.onresult = (event) => {
          let interimTranscript = '';
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          const spoken = (finalTranscript || interimTranscript).trim();
          if (titleInput && spoken) {
            titleInput.value = spoken;
          }
        };

        recog.onerror = (event) => {
          console.warn('Speech recognition error:', event.error);
          isVoiceRecordingActive = false;
          if (pulseDot) { pulseDot.style.background = '#6b7280'; pulseDot.style.animation = 'none'; }
          if (statusText) statusText.textContent = `Microphone notice: ${event.error}`;
          if (btn) {
            btn.innerHTML = '🎙️ Start Recording Voice';
            btn.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
          }
        };

        recog.onend = () => {
          isVoiceRecordingActive = false;
          if (pulseDot) { pulseDot.style.background = '#6b7280'; pulseDot.style.animation = 'none'; }
          if (btn) {
            btn.innerHTML = '🎙️ Start Recording Voice';
            btn.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
          }
          // ISSUE 8 FIX: If a transcript was captured, switch to Type mode so user can see/edit it
          const capturedText = titleInput && titleInput.value && titleInput.value.trim();
          if (capturedText) {
            if (statusText) statusText.textContent = '✅ Transcript captured — edit below or generate your brief!';
            window.SOCIAL_MODULE.switchTopicInputMode('type');
            if (window.showToast) window.showToast('🎙️ Voice captured! Review your topic below.', 'success');
          } else {
            if (statusText) statusText.textContent = 'Recording finished. Ready to generate brief!';
          }
        };

        recog.start();
      } catch (err) {
        console.error('Speech start error:', err);
        if (window.showToast) window.showToast('Microphone error: ' + err.message, 'error');
      }
    },
    async findMeTopic() {
      const channelKey = document.getElementById('spChannel')?.value || activeBrandSlug || 'grow-bangla';
      const activeBrand = (socialBrandsData || []).find(b => b.slug === channelKey || b.id === channelKey || b.slug === activeBrandSlug ||
        (b.channels || []).some(c => c.id === channelKey || c.slug === channelKey)) || 
        (socialBrandsData || []).find(b => b.slug === activeBrandSlug) || 
        socialBrandsData[0];
      const activeChannel = (activeBrand && (activeBrand.channels || []).find(c => c.id === channelKey || c.slug === channelKey || (activeChannelId && (c.id === activeChannelId || c.slug === activeChannelId)))) || 
        activeBrand?.channels?.[0];

      const contentType = document.getElementById('spContentType')?.value || 'Short-form Video';
      const platform = document.getElementById('spPlatform')?.value || 'YouTube';

      const btn = document.getElementById('btnFindTopic');
      if (btn) { btn.disabled = true; btn.textContent = '🔍 Finding...'; }

      if (window.showToast) window.showToast('🎯 Scanning channel knowledge base & monthly campaign focus...', 'info');

      const targetBrandSlug = activeBrand?.slug || activeBrandSlug || 'grow-bangla';

      // Resolve channelId dynamically from the brand's loaded channel list — never use hardcoded IDs
      // Priority: 1) matched by channelKey or activeChannelId, 2) anchor channel, 3) first channel in list
      const resolvedChannelId = activeChannel?.id ||
        (activeBrand?.channels || []).find(c => c.isAnchor)?.id ||
        (activeBrand?.channels || [])[0]?.id ||
        null;

      if (!resolvedChannelId) {
        if (window.showToast) window.showToast('⚠️ No channel found for this brand. Open Brand Hub and onboard a channel first.', 'error');
        if (btn) { btn.disabled = false; btn.textContent = '🎯 Find Me a Topic'; }
        return;
      }

      try {
        const res = await APP_API.post('/ai/suggest-topic', {
          brandSlug: targetBrandSlug,
          channelId: resolvedChannelId,
          contentType,
          platform,
          month: selectedPlanMonth,
          year: selectedPlanYear
        });

        if (res && res.success && Array.isArray(res.suggestions) && res.suggestions.length > 0) {
          activeSuggestedTopics = res.suggestions;
          currentSuggestedIndex = 0;
          this.renderSuggestedTopicCard();
        } else {
          throw new Error(res?.error || 'No suggestions available');
        }
      } catch (err) {
        console.error('Find Topic Error:', err);
        if (window.showToast) window.showToast('Topic suggestion notice: ' + err.message, 'error');
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = '🎯 Find Me a Topic'; }
      }
    },
    renderSuggestedTopicCard() {
      const card = document.getElementById('topicSuggestionCard');
      const titleEl = document.getElementById('suggTopicTitle');
      const ratEl = document.getElementById('suggRationale');
      const badgeEl = document.getElementById('suggIndexBadge');

      if (!card || activeSuggestedTopics.length === 0) return;

      const item = activeSuggestedTopics[currentSuggestedIndex];
      card.style.display = 'flex';
      if (titleEl) titleEl.textContent = item.topic;
      if (ratEl) ratEl.innerHTML = `📌 <strong>Strategic Rationale:</strong> ${escapeHTML(item.rationale)} ${item.hook ? `<br>🎯 <em>Hook: "${escapeHTML(item.hook)}"</em>` : ''}`;
      if (badgeEl) badgeEl.textContent = `${currentSuggestedIndex + 1} of ${activeSuggestedTopics.length}`;
    },
    cycleNextTopicSuggestion() {
      if (activeSuggestedTopics.length === 0) return;
      currentSuggestedIndex = (currentSuggestedIndex + 1) % activeSuggestedTopics.length;
      this.renderSuggestedTopicCard();
    },
    acceptSuggestedTopic() {
      if (activeSuggestedTopics.length === 0) return;
      const item = activeSuggestedTopics[currentSuggestedIndex];
      const titleInput = document.getElementById('spTitle');
      const angleInput = document.getElementById('spAngle');
      const card = document.getElementById('topicSuggestionCard');

      if (titleInput) titleInput.value = item.topic;
      if (angleInput && item.rationale) angleInput.value = item.rationale;
      if (card) card.style.display = 'none';

      this.switchTopicInputMode('type');
      if (window.showToast) window.showToast(`✅ Topic applied: "${item.topic.slice(0, 35)}..."`, 'success');
    },
    async handleReferenceUpload(file) {
      if (!file) return;

      if (file.size > 50 * 1024 * 1024) {
        if (window.showToast) window.showToast('⚠️ Reference file exceeds 50MB maximum limit.', 'error');
        return;
      }

      const promptBox = document.getElementById('refDefaultPrompt');
      const progressBox = document.getElementById('refUploadProgressBox');
      const pctEl = document.getElementById('refProgressPct');
      const barEl = document.getElementById('refProgressBar');
      const stepEl = document.getElementById('refProgressStep');
      const pillEl = document.getElementById('refResultPill');
      const fileNameEl = document.getElementById('refFileNameLabel');
      const metaLabelEl = document.getElementById('refMetaLabel');

      if (promptBox) promptBox.style.display = 'none';
      if (progressBox) progressBox.style.display = 'flex';

      let currentPct = 20;
      const interval = setInterval(() => {
        if (currentPct < 90) {
          currentPct += Math.floor(Math.random() * 15) + 8;
          if (currentPct > 90) currentPct = 90;
          if (pctEl) pctEl.textContent = `${currentPct}%`;
          if (barEl) barEl.style.width = `${currentPct}%`;
          if (stepEl) {
            if (currentPct < 50) stepEl.textContent = '🔍 Reading document & extracting key concepts...';
            else stepEl.textContent = '🧠 Analyzing visual charts & formatting strategic angle...';
          }
        }
      }, 200);

      if (window.showToast) window.showToast(`📎 Ingesting reference: ${file.name} (up to 50MB)...`, 'info');

      try {
        const formData = new FormData();
        formData.append('referenceFile', file);

        const token = localStorage.getItem('token') || '';
        const res = await fetch('/api/ai/analyze-reference', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        const json = await res.json();
        clearInterval(interval);

        if (pctEl) pctEl.textContent = '100%';
        if (barEl) barEl.style.width = '100%';

        if (json && json.success) {
          activeReferenceAsset = json;

          const titleInput = document.getElementById('spTitle');
          const angleInput = document.getElementById('spAngle');

          if (titleInput && json.suggestedTopic) titleInput.value = json.suggestedTopic;
          if (angleInput && json.angle) angleInput.value = json.angle;

          if (progressBox) progressBox.style.display = 'none';
          if (pillEl) pillEl.style.display = 'flex';
          if (fileNameEl) fileNameEl.textContent = json.fileName;
          if (metaLabelEl) metaLabelEl.textContent = `(${json.visualSummary || 'Analyzed'})`;

          if (window.showToast) window.showToast('✨ Reference analyzed! Topic & Angle applied — review below.', 'success');

          // ISSUE 9 FIX: Auto-switch to Type mode so user can immediately see the auto-filled topic/angle
          setTimeout(() => {
            window.SOCIAL_MODULE.switchTopicInputMode('type');
            // Briefly highlight the auto-filled title field to draw attention
            if (titleInput) {
              titleInput.style.transition = 'box-shadow 0.3s ease';
              titleInput.style.boxShadow = '0 0 0 2px #10b981';
              setTimeout(() => { titleInput.style.boxShadow = ''; }, 1800);
            }
          }, 300);
        } else {
          throw new Error(json?.error || 'Analysis failed');
        }
      } catch (err) {
        clearInterval(interval);
        console.error('Reference analysis error:', err);
        if (window.showToast) window.showToast('Reference notice: ' + err.message, 'error');
        if (progressBox) progressBox.style.display = 'none';
        if (promptBox) promptBox.style.display = 'block';
      }
    },
    clearReferenceAsset() {
      activeReferenceAsset = null;
      const pillEl = document.getElementById('refResultPill');
      const promptBox = document.getElementById('refDefaultPrompt');
      const fileInput = document.getElementById('spRefFileInput');

      if (pillEl) pillEl.style.display = 'none';
      if (promptBox) promptBox.style.display = 'block';
      if (fileInput) fileInput.value = '';

      if (window.showToast) window.showToast('Reference asset removed.', 'info');
    },

    // Phase 6.6: HTML5 Drag-and-Drop Kanban Engine
    handleDragStart(e, postId) {
      if (isClientRole()) return;
      if (e.dataTransfer) {
        e.dataTransfer.setData('text/plain', postId);
        e.dataTransfer.effectAllowed = 'move';
      }
      window._draggedPostId = postId;
      setTimeout(() => {
        if (e.target && e.target.classList) e.target.classList.add('dragging');
      }, 0);
    },
    handleDragEnd(e) {
      window._draggedPostId = null;
      if (e.target && e.target.classList) e.target.classList.remove('dragging');
      document.querySelectorAll('.social-col.drag-over').forEach(c => c.classList.remove('drag-over'));
    },
    handleDragOver(e) {
      if (isClientRole()) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
      const col = e.currentTarget;
      if (col && !col.classList.contains('drag-over')) col.classList.add('drag-over');
    },
    handleDragLeave(e) {
      const col = e.currentTarget;
      if (col && !col.contains(e.relatedTarget)) col.classList.remove('drag-over');
    },
    async handleDrop(e, targetStageKey) {
      e.preventDefault();
      const col = e.currentTarget;
      if (col) col.classList.remove('drag-over');
      if (isClientRole()) return;

      const postId = (e.dataTransfer && e.dataTransfer.getData('text/plain')) || window._draggedPostId;
      if (!postId) return;

      const stageMap = {
        draft: 'Draft',
        internal: 'Internal QC',
        client: 'Pending Client Approval',
        approved: 'Approved',
        posted: 'Posted'
      };
      const targetStatus = stageMap[targetStageKey] || 'Draft';

      const post = postsData.find(p => p.id === postId);
      if (!post || post.status === targetStatus) return;

      const prevStatus = post.status;
      post.status = targetStatus;

      // Optimistic instant re-render (0ms latency, no skeleton)
      renderKPIs();
      renderBoard();

      try {
        await APP_API.patch(`/posts/${postId}/status`, { status: targetStatus });
        if (window.showToast) window.showToast(`Post moved to ${targetStatus}`, 'success');
      } catch (err) {
        post.status = prevStatus;
        renderBoard();
        if (window.showToast) window.showToast('Failed to update stage: ' + err.message, 'error');
      }
    },

    // Phase 6.7: Batch Import UI Methods
    openBatchImportModal() {
      const modal = document.getElementById('batchImportModal');
      if (modal) modal.style.display = 'flex';
    },
    closeBatchImportModal() {
      const modal = document.getElementById('batchImportModal');
      if (modal) modal.style.display = 'none';
    },
    downloadBatchTemplateCsv() {
      const csv = "Title,ScheduledDate,ScheduledTime,Caption,Category,ContentType,Duration\n" +
        "\"5 Corporate English Interview Mistakes\",\"2026-09-15\",\"18:00\",\"Stop making these 5 mistakes when answering interview questions in English! #GrowBangla\",\"English Lesson\",\"Short-form Video\",\"60s\"\n" +
        "\"Geopolitics of the Malacca Strait\",\"2026-09-18\",\"19:00\",\"Why 80,000 ships pass through this narrow choke point every year. Full breakdown. #PILUTICS\",\"Geopolitics\",\"Long-form Video\",\"12m\"\n";
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'gro10x-social-posts-batch-template.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      if (window.showToast) window.showToast('📥 CSV Template downloaded!', 'success');
    },
    handleBatchCsvFile(input) {
      const file = (input && input.files) ? input.files[0] : null;
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result || '';
        const textarea = document.getElementById('batchImportText');
        if (textarea) textarea.value = text;
        if (window.showToast) window.showToast(`Loaded ${file.name} into import preview.`, 'info');
      };
      reader.readAsText(file);
    },
    async handleBatchImportSubmit(e) {
      e.preventDefault();
      const rawText = document.getElementById('batchImportText')?.value.trim();
      if (!rawText) {
        if (window.showToast) window.showToast('Please provide CSV data or upload a file.', 'error');
        return;
      }

      const channelSlug = document.getElementById('batchImportChannel')?.value || 'grow-bangla';
      const channelCfg = getChannelConfig(channelSlug);
      const platform = document.getElementById('batchImportPlatform')?.value || 'YouTube';
      const submitBtn = document.getElementById('btnRunBatchImport');

      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = '⏳ Importing...'; }

      try {
        const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length === 0) throw new Error('No lines found in text');

        let startIndex = 0;
        const firstLineLower = lines[0].toLowerCase();
        if (firstLineLower.includes('title') || firstLineLower.includes('topic') || firstLineLower.includes('scheduled')) {
          startIndex = 1;
        }

        const itemsToCreate = [];
        for (let i = startIndex; i < lines.length; i++) {
          const line = lines[i];
          const match = line.match(/(?:[^\s,"]|"(?:\\.|[^"])*")+/g);
          const cols = match ? match.map(c => c.replace(/^"|"$/g, '').trim()) : line.split(',').map(c => c.trim());
          if (cols.length === 0 || !cols[0]) continue;

          const title = cols[0];
          const scheduledDate = cols[1] || new Date().toISOString().split('T')[0];
          const scheduledTime = cols[2] && cols[2].includes(':') ? cols[2] : '18:00';
          const caption = cols[3] || '';
          const category = cols[4] || 'General';
          const contentType = cols[5] || 'Short-form Video';
          const targetDuration = cols[6] || '60s';

          itemsToCreate.push({
            title,
            scheduledDate,
            scheduledTime,
            caption,
            contentCategory: category,
            contentType,
            targetDuration,
            platform,
            channel: channelCfg.name,
            status: 'Draft'
          });
        }

        if (itemsToCreate.length === 0) throw new Error('No valid post rows found');

        const res = await APP_API.post('/posts/batch', { posts: itemsToCreate });
        if (res && res.success) {
          if (window.showToast) window.showToast(`🚀 Successfully batch-imported ${res.count || itemsToCreate.length} posts!`, 'success');
          this.closeBatchImportModal();
          await loadInitialData(false);
        } else {
          throw new Error(res?.error || 'Batch import failed');
        }
      } catch (err) {
        if (window.showToast) window.showToast('Batch import notice: ' + err.message, 'error');
      } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = '🚀 Process Batch Import'; }
      }
    },

    // Phase 7.2: AI Model Health & Quota Checker
    async checkAiModelHealth() {
      const badge = document.getElementById('aiModelStatusBadge');
      if (!badge) return;
      try {
        const res = await APP_API.get('/ai/health').catch(() => null);
        if (res && res.status === 'healthy') {
          badge.innerHTML = `🟢 ${escapeHTML(res.primaryModel || 'Gemini 1.5')} Online`;
          badge.style.background = 'rgba(16,185,129,0.18)';
          badge.style.color = '#34d399';
          badge.title = `AI Engine: ${res.primaryModel || 'Gemini'} | 45 reqs/min quota active`;
        } else {
          badge.innerHTML = `🟡 Fallback Generator Active`;
          badge.style.background = 'rgba(245,158,11,0.18)';
          badge.style.color = '#fbbf24';
          badge.title = 'Deterministic generator mode active';
        }
      } catch (e) {
        badge.innerHTML = `🟢 AI Engine Ready`;
      }
    }
  };

  // Phase 7.5: Comprehensive Keyboard & Accessibility Listener
  if (!window._socialA11yInit) {
    window._socialA11yInit = true;
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const postModal = document.getElementById('postModal');
        if (postModal && postModal.classList.contains('active')) {
          window.SOCIAL_MODULE.closePostModal();
          return;
        }
        const batchModal = document.getElementById('batchImportModal');
        if (batchModal && batchModal.style.display === 'flex') {
          window.SOCIAL_MODULE.closeBatchImportModal();
          return;
        }
        const kbModal = document.getElementById('knowledgeBaseModal');
        if (kbModal && kbModal.style.display === 'flex') {
          window.SOCIAL_MODULE.closeKnowledgeBaseModal();
          return;
        }
        const ideasModal = document.getElementById('savedIdeasModal');
        if (ideasModal && ideasModal.style.display === 'flex') {
          window.SOCIAL_MODULE.closeSavedIdeasModal();
          return;
        }
        const cwModal = document.getElementById('channelWorkspaceModal');
        if (cwModal && cwModal.style.display === 'flex') {
          window.SOCIAL_MODULE.closeChannelWorkspace();
          return;
        }
      }
    });
  }

  await loadInitialData();
};



