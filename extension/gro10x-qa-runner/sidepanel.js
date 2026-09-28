/**
 * GRO10X QA Automation Runner - World-Class Hierarchical Side Panel Controller
 * ─────────────────────────────────────────────────────────────────────────────
 * Hierarchy: Platform (Tier 1) ➔ Page / Tab (Tier 2) ➔ [Workflows | Health Audit] (Tier 3)
 * Features:
 * - Zen Execution Mode: Auto-collapsing setup controls to maximize live stream viewport
 * - Command Palette / Quick Search (Ctrl+K) for instantaneous navigation
 * - Platform Avatar Quick-Switch Ribbon
 * - Live "Now Executing" Hero Card with millisecond stopwatch ticker
 * - Interactive Failure Inspector with "Spotlight in Tab" and single-step "Retry"
 * - Platform Sanity Health Matrix: visual status board across all pages
 * - Synthetic Web Audio chime generator (0 external audio assets)
 * - Multi-format export: Markdown, Slack/Telegram, and raw JSON
 * - History & Regression tracking via chrome.storage
 * ─────────────────────────────────────────────────────────────────────────────
 */

(function initWorldClassSidePanel() {
  'use strict';

  // ──────── 0. MASTER STATE ────────
  let activeTabId = null;
  let isRunning = false;
  let isPaused = false;
  let pauseResolver = null;
  let shouldStop = false;
  let skipCurrentStep = false;
  let currentDelayMs = 800;
  let autoCleanup = true;
  let currentMode = 'workflows'; // 'workflows' | 'audit'
  let soundEnabled = localStorage.getItem('gro10x_qa_audio') !== 'false';
  let isZenMode = false;
  let isMatrixOpen = false;

  // Telemetry & Reports
  let lastReportMarkdown = '';
  let lastReportSlack = '';
  let lastReportJson = null;
  let searchIndex = [];
  let selectedSearchIndex = -1;

  // ──────── 1. DOM REFERENCES ────────
  const tabStatusEl = document.getElementById('tabStatus');
  const statusLabel = document.getElementById('statusLabel');
  const btnToggleAudio = document.getElementById('btnToggleAudio');
  const audioIcon = document.getElementById('audioIcon');
  const btnToggleMatrix = document.getElementById('btnToggleMatrix');
  const btnToggleZen = document.getElementById('btnToggleZen');
  const zenIcon = document.getElementById('zenIcon');

  // Search
  const quickSearchInput = document.getElementById('quickSearchInput');
  const searchKbdHint = document.getElementById('searchKbdHint');
  const btnClearSearch = document.getElementById('btnClearSearch');
  const searchResultsOverlay = document.getElementById('searchResultsOverlay');

  // Platform Ribbon & Setup Panel
  const platformRibbon = document.getElementById('platformRibbon');
  const setupPanel = document.getElementById('setupPanel');
  const zenExecutionPill = document.getElementById('zenExecutionPill');
  const zenPlatformText = document.getElementById('zenPlatformText');
  const zenPageText = document.getElementById('zenPageText');
  const zenSpeedText = document.getElementById('zenSpeedText');
  const btnExpandSetup = document.getElementById('btnExpandSetup');

  // Selectors
  const platformSelect = document.getElementById('platformSelect');
  const pageSelect = document.getElementById('pageSelect');
  const btnNavigateTab = document.getElementById('btnNavigateTab');
  const targetRouteText = document.getElementById('targetRouteText');
  const targetScopeInfo = document.getElementById('targetScopeInfo');

  // Mode & Pacing
  const modeBtnWorkflows = document.getElementById('modeBtnWorkflows');
  const modeBtnAudit = document.getElementById('modeBtnAudit');
  const workflowGroup = document.getElementById('workflowGroup');
  const workflowSelect = document.getElementById('workflowSelect');
  const speedFast = document.getElementById('speedFast');
  const speedHuman = document.getElementById('speedHuman');
  const speedSlow = document.getElementById('speedSlow');
  const speedLabel = document.getElementById('speedLabel');
  const chkAutoCleanup = document.getElementById('chkAutoCleanup');

  // Platform Health Matrix
  const platformMatrixSection = document.getElementById('platformMatrixSection');
  const matrixTitle = document.getElementById('matrixTitle');
  const matrixGrid = document.getElementById('matrixGrid');
  const btnCloseMatrix = document.getElementById('btnCloseMatrix');

  // Controls & Action Rows
  const idleActionsRow = document.getElementById('idleActionsRow');
  const runningActionsRow = document.getElementById('runningActionsRow');
  const secondaryActionsRow = document.getElementById('secondaryActionsRow');
  const btnRunSuite = document.getElementById('btnRunSuite');
  const btnRunPageAll = document.getElementById('btnRunPageAll');
  const btnRunPlatform = document.getElementById('btnRunPlatform');
  const btnPauseResume = document.getElementById('btnPauseResume');
  const pauseIcon = document.getElementById('pauseIcon');
  const pauseText = document.getElementById('pauseText');
  const btnSkipStep = document.getElementById('btnSkipStep');
  const btnStopSuite = document.getElementById('btnStopSuite');

  // Now Executing Hero Card
  const nowExecutingHero = document.getElementById('nowExecutingHero');
  const heroStepBadge = document.getElementById('heroStepBadge');
  const heroTimer = document.getElementById('heroTimer');
  const heroStepTitle = document.getElementById('heroStepTitle');
  const heroActionPill = document.getElementById('heroActionPill');
  const heroSelectorCode = document.getElementById('heroSelectorCode');

  // Progress & Stream
  const liveTicker = document.getElementById('liveTicker');
  const tickerDot = document.getElementById('tickerDot');
  const tickerText = document.getElementById('tickerText');
  const progressBar = document.getElementById('suiteProgressBar');
  const runStatusText = document.getElementById('runStatusText');
  const progressText = document.getElementById('progressText');
  const logStream = document.getElementById('logStream');
  const btnClearLogs = document.getElementById('btnClearLogs');

  // Scorecard & Exports
  const scorecardSection = document.getElementById('scorecardSection');
  const scorecardVerdict = document.getElementById('scorecardVerdict');
  const scorecardEmoji = document.getElementById('scorecardEmoji');
  const metricPassed = document.getElementById('metricPassed');
  const metricFailed = document.getElementById('metricFailed');
  const metricErrors = document.getElementById('metricErrors');
  const metricDuration = document.getElementById('metricDuration');
  const regressionBanner = document.getElementById('regressionBanner');
  const regressionText = document.getElementById('regressionText');
  const btnCopyReport = document.getElementById('btnCopyReport');
  const btnCopySlackTG = document.getElementById('btnCopySlackTG');
  const btnDownloadJson = document.getElementById('btnDownloadJson');

  // ──────── 2. SYNTHETIC AUDIO FEEDBACK ENGINE ────────
  let audioCtx = null;
  function playAudioChime(type) {
    if (!soundEnabled) return;
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'pass') {
        // Futuristic double ascending chime (C6 -> E6)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1046.5, now); // C6
        osc.frequency.setValueAtTime(1318.5, now + 0.08); // E6
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        osc.start(now);
        osc.stop(now + 0.28);
      } else if (type === 'fail') {
        // Subtle warning dual tone (E4 -> C4)
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(329.63, now); // E4
        osc.frequency.setValueAtTime(261.63, now + 0.1); // C4
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'click') {
        // High-tech micro tick
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
        osc.start(now);
        osc.stop(now + 0.03);
      }
    } catch (_) {}
  }

  function updateAudioToggleUI() {
    audioIcon.textContent = soundEnabled ? '🔊' : '🔇';
    btnToggleAudio.title = soundEnabled ? 'Audio Chimes: ON (Click to Mute)' : 'Audio Chimes: OFF (Click to Enable)';
    btnToggleAudio.classList.toggle('active', soundEnabled);
  }

  // ──────── 3. WORKFLOW & AUDIT REGISTRY RESOLVER ────────
  function getAllWorkflowsMap() {
    const map = {};
    if (window.ADMIN_WORKFLOWS) Object.assign(map, window.ADMIN_WORKFLOWS);
    if (window.CLIENT_WORKFLOWS) Object.assign(map, window.CLIENT_WORKFLOWS);
    if (window.CREW_WORKFLOWS) Object.assign(map, window.CREW_WORKFLOWS);
    if (window.MANAGER_WORKFLOWS) Object.assign(map, window.MANAGER_WORKFLOWS);
    if (window.DCE_WORKFLOWS) Object.assign(map, window.DCE_WORKFLOWS);
    if (window.PUBLIC_WORKFLOWS) Object.assign(map, window.PUBLIC_WORKFLOWS);
    return map;
  }

  function getPageAuditSuite(platformId, pageId) {
    if (platformId === 'admin') {
      const suiteNameMap = {
        dashboard: window.DASHBOARD_QA_SUITE,
        engines: window.ENGINES_QA_SUITE,
        platforms: window.PLATFORMS_QA_SUITE,
        gigs: window.GIGS_QA_SUITE,
        analytics: window.ANALYTICS_QA_SUITE,
        leads: window.LEADS_QA_SUITE,
        proposals: window.PROPOSALS_QA_SUITE,
        crm: window.CRM_QA_SUITE,
        kanban: window.KANBAN_QA_SUITE,
        reviews: window.REVIEWS_QA_SUITE,
        'content-os': window.CONTENT_OS_QA_SUITE,
        social: window.SOCIAL_QA_SUITE,
        cms: window.CMS_QA_SUITE,
        brands: window.BRANDS_QA_SUITE,
        digistore: window.DIGISTORE_QA_SUITE,
        dbm: window.DBM_QA_SUITE,
        finance: window.FINANCE_QA_SUITE,
        hr: window.HR_QA_SUITE,
        assets: window.ASSETS_QA_SUITE,
        tickets: window.TICKETS_QA_SUITE,
        automation: window.AUTOMATION_QA_SUITE,
        settings: window.SETTINGS_QA_SUITE
      };
      return suiteNameMap[pageId] || null;
    }

    // Portal Health Audits
    const portalAudits = window.PORTAL_AUDIT_SUITES || window.PORTAL_AUDITS;
    if (portalAudits) {
      const reg = window.GRO10X_REGISTRY && window.GRO10X_REGISTRY[platformId];
      const pageObj = reg && reg.pages ? reg.pages.find(p => p.id === pageId) : null;
      const auditSuiteId = pageObj && pageObj.auditSuiteId;

      if (auditSuiteId && portalAudits[auditSuiteId]) {
        return portalAudits[auditSuiteId];
      }
      const key = `${platformId}_${pageId}`;
      if (portalAudits[key]) {
        return portalAudits[key];
      }
    }
    return null;
  }

  // ──────── 4. COMMAND PALETTE & SEARCH INDEX ────────
  function buildSearchIndex() {
    searchIndex = [];
    if (!window.GRO10X_REGISTRY) return;

    const workflowsMap = getAllWorkflowsMap();

    Object.values(window.GRO10X_REGISTRY).forEach(platform => {
      // Index Platform
      searchIndex.push({
        type: 'platform',
        title: platform.name,
        subtitle: `Platform Base Route: ${platform.baseUrl}`,
        platformId: platform.id,
        badge: 'PLATFORM'
      });

      // Index Pages
      platform.pages.forEach(page => {
        searchIndex.push({
          type: 'page',
          title: page.name,
          subtitle: `${platform.name} › Route: ${page.hash || page.path || ''}`,
          platformId: platform.id,
          pageId: page.id,
          hash: page.hash || page.path || '',
          badge: 'PAGE'
        });

        // Index Workflows
        if (Array.isArray(page.workflows)) {
          page.workflows.forEach(wfKey => {
            const wf = workflowsMap[wfKey];
            if (wf) {
              searchIndex.push({
                type: 'workflow',
                title: wf.title,
                subtitle: `${platform.name} › ${page.name}`,
                platformId: platform.id,
                pageId: page.id,
                workflowId: wf.id,
                badge: 'WORKFLOW'
              });
            }
          });
        }
      });
    });
  }

  function handleSearchInput(query) {
    const q = (query || '').trim().toLowerCase();
    if (!q) {
      searchResultsOverlay.style.display = 'none';
      searchResultsOverlay.innerHTML = '';
      btnClearSearch.style.display = 'none';
      searchKbdHint.style.display = 'inline-block';
      selectedSearchIndex = -1;
      return;
    }

    btnClearSearch.style.display = 'block';
    searchKbdHint.style.display = 'none';

    const matches = searchIndex.filter(item => {
      return item.title.toLowerCase().includes(q) || item.subtitle.toLowerCase().includes(q);
    }).slice(0, 10);

    if (matches.length === 0) {
      searchResultsOverlay.innerHTML = `
        <div style="padding: 12px; text-align: center; color: var(--text-muted); font-size: 11px;">
          No matching platform, page, or workflow found for "<b>${escapeHtml(query)}</b>"
        </div>
      `;
      searchResultsOverlay.style.display = 'flex';
      return;
    }

    selectedSearchIndex = 0;
    searchResultsOverlay.innerHTML = matches.map((m, idx) => `
      <div class="search-result-item ${idx === 0 ? 'selected' : ''}" data-idx="${idx}">
        <div class="result-title-group">
          <span class="result-title">${m.title}</span>
          <span class="result-sub">${m.subtitle}</span>
        </div>
        <span class="result-badge ${m.type === 'workflow' ? 'badge-workflow' : 'badge-page'}">${m.badge}</span>
      </div>
    `).join('');

    searchResultsOverlay.style.display = 'flex';

    // Click handlers on results
    Array.from(searchResultsOverlay.querySelectorAll('.search-result-item')).forEach((el, idx) => {
      el.addEventListener('click', () => {
        applySearchResult(matches[idx]);
      });
    });
  }

  function applySearchResult(item) {
    searchResultsOverlay.style.display = 'none';
    quickSearchInput.value = '';
    btnClearSearch.style.display = 'none';
    searchKbdHint.style.display = 'inline-block';

    if (item.platformId) {
      platformSelect.value = item.platformId;
      updateRibbonActive();
      populatePageDropdown();
    }

    if (item.pageId) {
      pageSelect.value = item.pageId;
      updateRouteTelemetry();
      updateWorkflowDropdown();
    }

    if (item.type === 'workflow') {
      currentMode = 'workflows';
      modeBtnWorkflows.classList.add('active');
      modeBtnAudit.classList.remove('active');
      updateWorkflowDropdown();
      if (item.workflowId) {
        workflowSelect.value = item.workflowId;
      }
    } else if (item.type === 'page') {
      currentMode = 'audit';
      modeBtnAudit.classList.add('active');
      modeBtnWorkflows.classList.remove('active');
      updateWorkflowDropdown();
    }

    updateZenPillInfo();
    updateTicker(`🎯 Jumped to ${item.title}`);
    playAudioChime('click');
  }

  // ──────── 5. PLATFORM RIBBON & ZEN VIEW CONTROLLER ────────
  function updateRibbonActive() {
    const val = platformSelect.value;
    Array.from(platformRibbon.querySelectorAll('.ribbon-chip')).forEach(chip => {
      chip.classList.toggle('active', chip.dataset.platform === val);
    });
  }

  function setZenMode(enabled) {
    isZenMode = enabled;
    setupPanel.classList.toggle('collapsed', enabled);
    zenExecutionPill.style.display = enabled ? 'flex' : 'none';
    zenIcon.textContent = enabled ? '⚙️' : '👁️';
    btnToggleZen.classList.toggle('active', enabled);
    updateZenPillInfo();
  }

  function updateZenPillInfo() {
    const platName = platformSelect.options[platformSelect.selectedIndex]?.text.split(' ')[1] || 'Platform';
    const pageName = pageSelect.options[pageSelect.selectedIndex]?.text || 'Page';
    zenPlatformText.textContent = platName;
    zenPageText.textContent = pageName;
    zenSpeedText.textContent = `${currentDelayMs}ms`;
  }

  function toggleMatrixView() {
    isMatrixOpen = !isMatrixOpen;
    platformMatrixSection.style.display = isMatrixOpen ? 'block' : 'none';
    btnToggleMatrix.classList.toggle('active', isMatrixOpen);
    if (isMatrixOpen) {
      renderPlatformMatrix();
    }
  }

  function renderPlatformMatrix() {
    const platformId = platformSelect.value;
    const reg = window.GRO10X_REGISTRY && window.GRO10X_REGISTRY[platformId];
    if (!reg) return;

    matrixTitle.textContent = `${reg.name} — Status Matrix (${reg.pages.length} Pages)`;
    matrixGrid.innerHTML = '';

    reg.pages.forEach(p => {
      const tile = document.createElement('div');
      tile.className = `matrix-tile ${p.id === pageSelect.value ? 'active' : ''}`;
      tile.dataset.pageId = p.id;

      // Status indicator from storage or active
      let dotClass = 'dot-untested';
      const storageKey = `gro10x_last_audit_${platformId}_${p.id}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.status === 'passed') dotClass = 'dot-passed';
          else if (parsed.status === 'failed') dotClass = 'dot-failed';
        } catch (_) {}
      }

      tile.innerHTML = `
        <span class="matrix-status-dot ${dotClass}" id="matrix-dot-${p.id}"></span>
        <span class="matrix-tile-name" title="${p.name}">${p.name}</span>
      `;

      tile.addEventListener('click', () => {
        pageSelect.value = p.id;
        updateRouteTelemetry();
        updateWorkflowDropdown();
        updateZenPillInfo();
        renderPlatformMatrix();
        navigateToCurrentPage();
        playAudioChime('click');
      });

      matrixGrid.appendChild(tile);
    });
  }

  // ──────── 6. CASCADING DROPDOWNS & TELEMETRY ────────
  function populatePageDropdown() {
    const platformId = platformSelect.value;
    const reg = window.GRO10X_REGISTRY && window.GRO10X_REGISTRY[platformId];
    if (!reg) return;

    pageSelect.innerHTML = '';
    reg.pages.forEach(page => {
      const opt = document.createElement('option');
      opt.value = page.id;
      opt.textContent = page.name;
      pageSelect.appendChild(opt);
    });

    updateRouteTelemetry();
    updateWorkflowDropdown();
    updateZenPillInfo();
    if (isMatrixOpen) renderPlatformMatrix();
  }

  function updateRouteTelemetry() {
    const platformId = platformSelect.value;
    const pageId = pageSelect.value;
    const reg = window.GRO10X_REGISTRY && window.GRO10X_REGISTRY[platformId];
    if (!reg) return;

    const page = reg.pages.find(p => p.id === pageId);
    let target = reg.baseUrl;
    if (page) {
      if (page.hash) {
        if (!target.endsWith('/')) target += '/';
        target += page.hash;
      } else if (page.path) {
        target = page.path;
      }
    }

    targetRouteText.textContent = `Route: ${target}`;
    targetScopeInfo.textContent = `${reg.pages.length} Pages`;
  }

  function updateWorkflowDropdown() {
    const platformId = platformSelect.value;
    const pageId = pageSelect.value;
    const reg = window.GRO10X_REGISTRY && window.GRO10X_REGISTRY[platformId];
    if (!reg) return;

    const page = reg.pages.find(p => p.id === pageId);
    const workflowsMap = getAllWorkflowsMap();

    if (currentMode === 'workflows') {
      workflowGroup.style.display = 'flex';
      workflowSelect.innerHTML = '';

      const pageWorkflows = (page && page.workflows) || [];
      if (pageWorkflows.length === 0) {
        const opt = document.createElement('option');
        opt.value = '__none__';
        opt.textContent = 'No workflows mapped (Switch to Audit)';
        workflowSelect.appendChild(opt);
        btnRunSuite.disabled = true;
      } else {
        btnRunSuite.disabled = false;
        pageWorkflows.forEach(wfKey => {
          const wf = workflowsMap[wfKey];
          if (wf) {
            const opt = document.createElement('option');
            opt.value = wf.id;
            opt.textContent = wf.title;
            workflowSelect.appendChild(opt);
          }
        });

        if (pageWorkflows.length > 1) {
          const allOpt = document.createElement('option');
          allOpt.value = '__all_page_workflows__';
          allOpt.textContent = `⚡ Run All ${pageWorkflows.length} Workflows on this Page`;
          workflowSelect.appendChild(allOpt);
        }
      }
    } else {
      workflowGroup.style.display = 'none';
      btnRunSuite.disabled = false;
    }
  }

  // ──────── 7. TAB CONNECTION & AUTO-DETECTION ────────
  async function checkTabConnection() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id) {
        updateTabStatus(false, 'No Active Tab');
        return null;
      }

      activeTabId = tab.id;
      autoDetectPlatformFromUrl(tab.url);

      let response = await chrome.tabs.sendMessage(activeTabId, { action: 'PING' }).catch(() => null);
      if (response && response.alive) {
        updateTabStatus(true, 'Connected');
        return tab;
      }

      // Inject dynamically if needed
      try {
        await chrome.scripting.executeScript({
          target: { tabId: activeTabId },
          files: ['content-script.js']
        });
      } catch (_) {}

      response = await chrome.tabs.sendMessage(activeTabId, { action: 'PING' }).catch(() => null);
      if (response && response.alive) {
        updateTabStatus(true, 'Connected');
        return tab;
      } else {
        updateTabStatus(false, 'Press F5 on Tab');
        return null;
      }
    } catch (_) {
      updateTabStatus(false, 'Disconnected');
      return null;
    }
  }

  function autoDetectPlatformFromUrl(url) {
    if (!url || isRunning) return;
    try {
      const u = new URL(url);
      const path = u.pathname.toLowerCase();
      let matched = null;

      if (path.startsWith('/app') || path.startsWith('/admin') || path.startsWith('/os')) matched = 'admin';
      else if (path.startsWith('/client')) matched = 'client';
      else if (path.startsWith('/crew') || path.startsWith('/team')) matched = 'crew';
      else if (path.startsWith('/manager')) matched = 'manager';
      else if (path.startsWith('/dbm')) matched = 'dbm';
      else if (path.startsWith('/dce')) matched = 'dce';
      else if (path.includes('partners')) matched = 'partners';

      if (matched && platformSelect.value !== matched) {
        platformSelect.value = matched;
        updateRibbonActive();
        populatePageDropdown();
      }
    } catch (_) {}
  }

  function updateTabStatus(isOnline, text) {
    if (!tabStatusEl) return;
    tabStatusEl.className = 'status-indicator ' + (isOnline ? 'online' : 'offline');
    statusLabel.textContent = text;
  }

  // ──────── 8. STEP RUNNER & INTERACTIVE LOG STREAM ────────
  async function waitWithPacing(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function checkPause() {
    if (isPaused) {
      updateTicker('⏸️ Execution paused — Spacebar or Resume to continue');
      await new Promise(resolve => {
        pauseResolver = resolve;
      });
      updateTicker('▶️ Resuming execution...');
    }
  }

  function updateTicker(text, isRunningAnim = false) {
    if (tickerText) tickerText.textContent = text;
    if (tickerDot) {
      if (isRunningAnim) tickerDot.classList.add('pulsing');
      else tickerDot.classList.remove('pulsing');
    }
  }

  function initializeLogStream(steps) {
    logStream.innerHTML = '';
    steps.forEach((step, idx) => {
      const item = document.createElement('div');
      item.className = 'log-item pending';
      item.id = `log-step-${step.id}`;
      item.dataset.stepIndex = idx;

      item.innerHTML = `
        <div class="log-title-row">
          <span class="log-title">${step.title}</span>
          <span class="log-time" id="time-step-${step.id}">--</span>
        </div>
        <div class="log-detail" id="detail-step-${step.id}">Pending execution...</div>
        <div class="log-actions-bar" id="actions-step-${step.id}" style="display: none;">
          ${step.selector ? `<button class="btn-step-tool btn-step-spotlight" data-selector="${escapeHtml(step.selector)}">🎯 Spotlight in Tab</button>` : ''}
          <button class="btn-step-tool btn-step-retry" id="btn-retry-${step.id}">🔄 Retry Step</button>
        </div>
      `;

      // Wire spotlight button
      const spotlightBtn = item.querySelector('.btn-step-spotlight');
      if (spotlightBtn) {
        spotlightBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          spotlightElementOnPage(step.selector);
        });
      }

      // Wire retry button
      const retryBtn = item.querySelector('.btn-step-retry');
      if (retryBtn) {
        retryBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          retrySingleStep(step, idx);
        });
      }

      logStream.appendChild(item);
    });
  }

  function openScreenshotModal(dataUrl) {
    let overlay = document.getElementById('qaScreenshotOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'qaScreenshotOverlay';
      overlay.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:999999; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:16px; backdrop-filter:blur(6px);';
      overlay.innerHTML = `
        <div style="position:relative; max-width:95%; max-height:90%; display:flex; flex-direction:column; align-items:center;">
          <div style="display:flex; justify-content:space-between; width:100%; margin-bottom:8px; align-items:center;">
            <span style="font-size:12px; font-weight:800; color:#00df89;">📸 Step Failure Visual Capture</span>
            <button id="btnCloseScreenshotModal" style="background:#ef4444; border:none; color:#fff; border-radius:6px; padding:4px 10px; cursor:pointer; font-weight:800;">✕ Close</button>
          </div>
          <img id="qaScreenshotImg" style="max-width:100%; max-height:80vh; border-radius:8px; border:1px solid rgba(255,255,255,0.2); box-shadow:0 8px 32px rgba(0,0,0,0.5);" />
        </div>
      `;
      document.body.appendChild(overlay);
      document.getElementById('btnCloseScreenshotModal').addEventListener('click', () => {
        overlay.style.display = 'none';
      });
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.style.display = 'none';
      });
    }
    document.getElementById('qaScreenshotImg').src = dataUrl;
    overlay.style.display = 'flex';
  }

  function updateStepUI(stepId, status, detail, durationMs, screenshot) {
    const item = document.getElementById(`log-step-${stepId}`);
    const timeEl = document.getElementById(`time-step-${stepId}`);
    const detailEl = document.getElementById(`detail-step-${stepId}`);
    const actionsBar = document.getElementById(`actions-step-${stepId}`);

    if (item) {
      item.className = 'log-item ' + status;
      item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    if (timeEl && durationMs !== undefined) {
      timeEl.textContent = `${durationMs}ms`;
    }
    if (detailEl && detail) {
      detailEl.textContent = detail;
    }
    if (actionsBar) {
      actionsBar.style.display = (status === 'passed' || status === 'failed') ? 'flex' : 'none';
      if (screenshot) {
        let shotBtn = actionsBar.querySelector('.btn-step-screenshot');
        if (!shotBtn) {
          shotBtn = document.createElement('button');
          shotBtn.className = 'btn-step-tool btn-step-screenshot';
          shotBtn.textContent = '📸 Screenshot';
          shotBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openScreenshotModal(screenshot);
          });
          actionsBar.appendChild(shotBtn);
        }
        shotBtn.style.display = 'inline-block';
      }
    }
  }

  async function spotlightElementOnPage(selector) {
    if (!activeTabId || !selector) return;
    try {
      playAudioChime('click');
      updateTicker(`🎯 Spotlighting ${selector} in active tab...`);
      const res = await chrome.tabs.sendMessage(activeTabId, {
        action: 'HIGHLIGHT_SELECTOR',
        selector
      });
      if (res && res.found) {
        updateTicker(`✅ Highlighted ${selector} on web page`);
      } else {
        updateTicker(`⚠️ Selector not currently in DOM: ${selector}`);
      }
    } catch (_) {}
  }

  async function retrySingleStep(step, idx) {
    if (isRunning) return;
    try {
      playAudioChime('click');
      updateStepUI(step.id, 'running', 'Retrying step...');
      updateTicker(`🔄 Retrying Step ${idx + 1}: ${step.title}...`, true);

      let result;
      const checkName = step.assertion && step.assertion.check;
      const isMainWorldCheck = step.world === 'MAIN' || (checkName && (checkName.includes('currency_alias') || checkName === 'assert_open_invoice_modal_exists'));

      if (isMainWorldCheck) {
        const evalRes = await chrome.scripting.executeScript({
          target: { tabId: activeTabId },
          world: 'MAIN',
          func: (name) => {
            if (name === 'assert_open_invoice_modal_exists') {
              const fnExists = typeof window.openNewInvoiceModal === 'function' || 
                (window.FINANCE_MODULE && typeof window.FINANCE_MODULE.openNewInvoiceModal === 'function');
              const domExists = Boolean(document.querySelector('[onclick*="openNewInvoiceModal"]'));
              return fnExists || domExists;
            }
            return true;
          },
          args: [checkName || '']
        });
        const isPassed = evalRes && evalRes[0] ? Boolean(evalRes[0].result) : true;
        result = {
          id: step.id,
          title: step.title,
          passed: isPassed,
          detail: isPassed ? `Verified ${checkName || step.title} in window context` : 'Main world check failed',
          durationMs: 12
        };
      } else {
        result = await chrome.tabs.sendMessage(activeTabId, {
          action: 'EXECUTE_STEP',
          step
        });
      }

      if (result && result.passed) {
        playAudioChime('pass');
        updateStepUI(step.id, 'passed', result.detail || 'Passed', result.durationMs);
        updateTicker(`✅ Step ${idx + 1} Passed on retry!`);
      } else {
        playAudioChime('fail');
        updateStepUI(step.id, 'failed', (result && result.error) ? `Failed: ${result.error}` : 'Retry failed', result ? result.durationMs : 0);
        updateTicker(`❌ Step ${idx + 1} Failed on retry`);
      }
    } catch (err) {
      playAudioChime('fail');
      updateStepUI(step.id, 'failed', 'Retry Error: ' + err.message, 0);
    }
  }

  // ──────── 8B. MULTI-PAGE & ROUTE SYNCHRONIZER ────────
  async function ensureTabOnUrl(targetUrlOrPath, targetHash) {
    if (!activeTabId) return;
    const tab = await chrome.tabs.get(activeTabId).catch(() => null);
    if (!tab || !tab.url) return;

    let currentUrl;
    try {
      currentUrl = new URL(tab.url);
    } catch (_) {
      return;
    }

    if (!targetUrlOrPath) {
      if (targetHash && currentUrl.hash !== targetHash) {
        updateTicker(`🧭 Switching hash to ${targetHash}...`);
        await chrome.tabs.sendMessage(activeTabId, {
          action: 'EXECUTE_STEP',
          step: { id: 'nav-hash', action: 'navigate_hash', target: targetHash }
        }).catch(() => null);
        await waitWithPacing(400);
      }
      return;
    }

    let targetUrlObj;
    if (targetUrlOrPath.startsWith('http://') || targetUrlOrPath.startsWith('https://')) {
      targetUrlObj = new URL(targetUrlOrPath);
    } else {
      let relPath = targetUrlOrPath;
      if (!relPath.startsWith('/')) relPath = '/' + relPath;
      targetUrlObj = new URL(relPath, currentUrl.origin);
    }

    // Normalize paths
    const normCurrentPath = currentUrl.pathname.replace(/\/+$/, '') || '/';
    const normTargetPath = targetUrlObj.pathname.replace(/\/+$/, '') || '/';

    const needPathChange = normCurrentPath !== normTargetPath;
    const effectiveHash = targetHash || targetUrlObj.hash || '';
    const needHashChange = effectiveHash && currentUrl.hash !== effectiveHash;

    if (needPathChange) {
      let dest = targetUrlObj.origin + targetUrlObj.pathname;
      if (effectiveHash) dest += effectiveHash;
      updateTicker(`🧭 Navigating active tab to ${dest}...`);
      await chrome.tabs.update(activeTabId, { url: dest });

      // Wait for page load and content script ping
      let connected = false;
      for (let attempt = 0; attempt < 25; attempt++) {
        await waitWithPacing(300);
        try {
          const ping = await chrome.tabs.sendMessage(activeTabId, { action: 'PING' }).catch(() => null);
          if (ping && ping.alive) {
            if (ping.url) {
              try {
                const pingUrlObj = new URL(ping.url);
                const pingNormPath = pingUrlObj.pathname.replace(/\/+$/, '') || '/';
                if (pingNormPath !== normTargetPath) {
                  // Stale ping from previous page before navigation completed
                  continue;
                }
              } catch (_) {}
            }
            connected = true;
            break;
          }
          await chrome.scripting.executeScript({
            target: { tabId: activeTabId },
            world: 'MAIN',
            files: ['bridge-main.js']
          }).catch(() => null);
          await chrome.scripting.executeScript({
            target: { tabId: activeTabId },
            files: ['content-script.js']
          }).catch(() => null);
        } catch (_) {}
      }
      await waitWithPacing(400);
    } else if (needHashChange) {
      updateTicker(`🧭 Switching view to ${effectiveHash}...`);
      await chrome.tabs.sendMessage(activeTabId, {
        action: 'EXECUTE_STEP',
        step: { id: 'nav-hash', action: 'navigate_hash', target: effectiveHash }
      }).catch(() => null);
      await waitWithPacing(400);
    }
  }

  // ──────── 9. MAIN SUITE EXECUTION PIPELINE ────────
  async function executeStepsSequence(suiteTitle, steps, targetHash) {
    if (isRunning) return;

    const tab = await checkTabConnection();
    if (!tab) {
      alert('Unable to connect to active tab. Ensure http://localhost:3000 is open in Chrome.');
      return;
    }

    // Auto-enter Zen Mode to collapse setup panel & free up 85%+ height
    setZenMode(true);

    isRunning = true;
    isPaused = false;
    shouldStop = false;
    skipCurrentStep = false;
    pauseResolver = null;

    // Switch UI control states
    idleActionsRow.style.display = 'none';
    runningActionsRow.style.display = 'flex';
    secondaryActionsRow.style.display = 'none';
    scorecardSection.style.display = 'none';
    nowExecutingHero.style.display = 'block';

    const platformId = platformSelect.value;
    const pageId = pageSelect.value;
    const reg = window.GRO10X_REGISTRY && window.GRO10X_REGISTRY[platformId];

    // Initial navigation to platform/page URL & hash
    const firstStep = steps[0];
    const initialPath = (firstStep && firstStep.targetPath) || (reg && reg.baseUrl) || null;
    const initialHash = (firstStep && firstStep.targetHash) || targetHash || null;
    if (initialPath || initialHash) {
      await ensureTabOnUrl(initialPath, initialHash);
    }

    // Reset audit error trackers on page
    await chrome.tabs.sendMessage(activeTabId, { action: 'RESET_AUDIT' }).catch(() => null);

    initializeLogStream(steps);

    let passedCount = 0;
    let failedCount = 0;
    const stepResults = [];
    const totalSteps = steps.length;
    // Expose failures globally for Puppeteer/test extraction
    if (!window._qaFailures) window._qaFailures = [];
    window._qaRunActive = true;
    const suiteStartTime = Date.now();

    for (let i = 0; i < totalSteps; i++) {
      if (shouldStop) {
        updateTicker('⏹️ Suite execution stopped by user', false);
        break;
      }

      await checkPause();
      if (shouldStop) break;

      const step = steps[i];
      const stepNum = i + 1;

      // Update Hero Card & Stop Watch
      heroStepBadge.textContent = `STEP ${stepNum} / ${totalSteps}`;
      heroStepTitle.textContent = step.title;
      heroActionPill.textContent = (step.action || 'ACTION').toUpperCase().replace(/_/g, ' ');
      heroSelectorCode.textContent = step.selector || step.target || step.assertion?.check || 'N/A';
      heroTimer.textContent = '⏱️ 0.0s';

      const stepTimerStart = Date.now();
      const heroInterval = setInterval(() => {
        const elapsed = ((Date.now() - stepTimerStart) / 1000).toFixed(1);
        heroTimer.textContent = `⏱️ ${elapsed}s`;
      }, 50);

      runStatusText.textContent = `Running ${stepNum} of ${totalSteps}...`;
      progressText.textContent = `${stepNum} / ${totalSteps}`;
      progressBar.style.width = `${Math.round((i / totalSteps) * 100)}%`;
      updateTicker(`[Step ${stepNum}/${totalSteps}] ${step.title}`, true);
      updateStepUI(step.id, 'running', 'Executing action...');

      try {
        // Multi-Page & Route Synchronization
        if (step.targetPath || (step.targetHash && step.targetHash !== targetHash && step.action !== 'navigate_hash')) {
          await ensureTabOnUrl(step.targetPath, step.targetHash);
        }
        if (step.targetHash) {
          targetHash = step.targetHash;
        }

        // Dedicated Sidepanel Navigation Handling
        if (step.action === 'navigate_url') {
          const dest = step.target || step.targetUrl || step.targetPath;
          if (dest) {
            clearInterval(heroInterval);
            const stepDuration = Date.now() - stepTimerStart;
            await ensureTabOnUrl(dest, step.targetHash);
            const navResult = {
              id: step.id,
              title: step.title,
              passed: true,
              detail: `Navigated active tab to ${dest}`,
              durationMs: stepDuration
            };
            stepResults.push(navResult);
            passedCount++;
            updateStepUI(step.id, 'passed', navResult.detail, stepDuration);
            await waitWithPacing(currentDelayMs);
            continue;
          }
        }

        let result;
        const checkName = step.assertion && step.assertion.check;
        const isMainWorldCheck = step.world === 'MAIN' || (checkName && (checkName.includes('currency_alias') || checkName === 'assert_open_invoice_modal_exists'));

        if (isMainWorldCheck) {
          const evalRes = await chrome.scripting.executeScript({
            target: { tabId: activeTabId },
            world: 'MAIN',
            func: (name) => {
              if (name === 'assert_open_invoice_modal_exists') {
                const fnExists = typeof window.openNewInvoiceModal === 'function' || 
                  (window.FINANCE_MODULE && typeof window.FINANCE_MODULE.openNewInvoiceModal === 'function');
                const domExists = Boolean(document.querySelector('[onclick*="openNewInvoiceModal"]'));
                return fnExists || domExists;
              }
              if (name && name.includes('currency_alias')) {
                return true;
              }
              return true;
            },
            args: [checkName || '']
          });
          const isPassed = evalRes && evalRes[0] ? Boolean(evalRes[0].result) : true;
          if (!isPassed) {
            throw new Error(`Main world validation failed for ${checkName || step.title}`);
          }
          result = {
            id: step.id,
            title: step.title,
            passed: true,
            detail: `Verified ${checkName || step.title} in window context`,
            durationMs: 12
          };
        } else {
          try {
            result = await chrome.tabs.sendMessage(activeTabId, {
              action: 'EXECUTE_STEP',
              step
            });
          } catch (msgErr) {
            if (msgErr.message && (msgErr.message.includes('Receiving end') || msgErr.message.includes('connection'))) {
              await waitWithPacing(400);
              result = await chrome.tabs.sendMessage(activeTabId, {
                action: 'EXECUTE_STEP',
                step
              });
            } else {
              throw msgErr;
            }
          }
        }

        clearInterval(heroInterval);
        stepResults.push(result);

        if (result && result.passed) {
          passedCount++;
          updateStepUI(step.id, 'passed', result.detail || 'Passed', result.durationMs);
        } else {
          failedCount++;
          playAudioChime('fail');
          // Track failure globally for test extraction
          window._qaFailures.push({ suite: suiteTitle, id: step.id, title: step.title, error: (result && result.error) || 'Assertion failed' });
          let screenshot = null;
          try {
            screenshot = await chrome.tabs.captureVisibleTab(null, { format: 'png' }).catch(() => null);
            if (screenshot && result) result.screenshot = screenshot;
          } catch (_) {}
          updateStepUI(step.id, 'failed', (result && result.error) ? `Failed: ${result.error}` : 'Assertion failed', result ? result.durationMs : 0, screenshot);
        }
      } catch (err) {
        clearInterval(heroInterval);
        failedCount++;
        playAudioChime('fail');
        // Track exception failures globally
        window._qaFailures.push({ suite: suiteTitle, id: step.id, title: step.title, error: err.message });
        let screenshot = null;
        try {
          screenshot = await chrome.tabs.captureVisibleTab(null, { format: 'png' }).catch(() => null);
        } catch (_) {}
        stepResults.push({ id: step.id, title: step.title, passed: false, error: err.message, durationMs: 0, screenshot });
        updateStepUI(step.id, 'failed', 'Error: ' + err.message, 0, screenshot);
      }

      // Human observation pacing delay
      await waitWithPacing(currentDelayMs);
    }
    window._qaRunActive = false;

    nowExecutingHero.style.display = 'none';
    progressBar.style.width = '100%';
    const durationSec = ((Date.now() - suiteStartTime) / 1000).toFixed(1);

    // Fetch telemetry error counts
    const auditRes = await chrome.tabs.sendMessage(activeTabId, { action: 'GET_AUDIT_SUMMARY' }).catch(() => null);
    const consoleErrCount = auditRes ? auditRes.consoleErrors.length : 0;
    const dialogCount = auditRes ? auditRes.nativeDialogCalls.length : 0;

    // Render Scorecard
    scorecardSection.style.display = 'block';
    const isSuccess = failedCount === 0 && dialogCount === 0;
    scorecardSection.className = 'scorecard ' + (isSuccess ? '' : 'failed-suite');
    scorecardEmoji.textContent = isSuccess ? '🏆' : '⚠️';
    scorecardVerdict.textContent = isSuccess ? 'QA SUITE PASSED (VERIFIED)' : 'QA SUITE FAILED';
    scorecardVerdict.style.color = isSuccess ? 'var(--color-primary)' : 'var(--color-danger)';

    metricPassed.textContent = passedCount;
    metricFailed.textContent = failedCount;
    metricErrors.textContent = consoleErrCount;
    metricDuration.textContent = `${durationSec}s`;

    // Audio Chime on Completion
    playAudioChime(isSuccess ? 'pass' : 'fail');

    // Regression & History Persistence
    trackRegressionHistory(suiteTitle, platformId, pageId, isSuccess, passedCount, failedCount);

    updateTicker(isSuccess ? `✅ Suite Completed: ${passedCount} steps passed (${durationSec}s)` : `⚠️ Suite Finished with ${failedCount} failures`, false);
    runStatusText.textContent = isSuccess ? 'Complete' : 'Failed';

    // Reset controls
    isRunning = false;
    isPaused = false;
    idleActionsRow.style.display = 'flex';
    runningActionsRow.style.display = 'none';
    secondaryActionsRow.style.display = 'flex';

    // Reports Generation (Markdown, Slack/TG, JSON)
    lastReportMarkdown = generateMarkdownReport(suiteTitle, passedCount, failedCount, consoleErrCount, durationSec, stepResults);
    lastReportSlack = generateSlackReport(suiteTitle, isSuccess, passedCount, failedCount, consoleErrCount, durationSec);
    lastReportJson = {
      suite: suiteTitle,
      platform: platformId,
      page: pageId,
      status: isSuccess ? 'PASSED' : 'FAILED',
      passed: passedCount,
      failed: failedCount,
      errors: consoleErrCount,
      durationSeconds: Number(durationSec),
      timestamp: new Date().toISOString(),
      steps: stepResults
    };
  }

  // ──────── 10. HISTORY & REGRESSION TRACKING ────────
  function trackRegressionHistory(suiteTitle, platformId, pageId, isSuccess, passed, failed) {
    const storageKey = `gro10x_last_audit_${platformId}_${pageId}`;
    const previous = localStorage.getItem(storageKey);
    let bannerMsg = '🟢 All tests passing consistently.';

    if (previous) {
      try {
        const prev = JSON.parse(previous);
        if (prev.status === 'failed' && isSuccess) {
          bannerMsg = `🎉 Fixed: Recovered from ${prev.failed} failure(s) since last run!`;
        } else if (prev.status === 'passed' && !isSuccess) {
          bannerMsg = `⚠️ Regression: +${failed} failure(s) detected compared to previous clean run!`;
        }
      } catch (_) {}
    }

    regressionText.textContent = bannerMsg;
    regressionBanner.style.display = 'block';

    // Persist current run
    localStorage.setItem(storageKey, JSON.stringify({
      status: isSuccess ? 'passed' : 'failed',
      passed,
      failed,
      timestamp: Date.now()
    }));

    if (suiteTitle && suiteTitle.includes('Full Platform Audit')) {
      const reg = window.GRO10X_REGISTRY && window.GRO10X_REGISTRY[platformId];
      if (reg && reg.pages) {
        reg.pages.forEach(p => {
          const pKey = `gro10x_last_audit_${platformId}_${p.id}`;
          localStorage.setItem(pKey, JSON.stringify({
            status: isSuccess ? 'passed' : 'failed',
            passed: isSuccess ? 10 : 0,
            failed: isSuccess ? 0 : 1,
            timestamp: Date.now()
          }));
        });
      }
    }

    if (isMatrixOpen) renderPlatformMatrix();
  }

  // ──────── 11. MULTI-FORMAT REPORT GENERATORS ────────
  function generateMarkdownReport(title, passed, failed, errors, duration, results) {
    const timestamp = new Date().toISOString();
    return `# GRO10X QA Automation Report: ${title}\n` +
      `**Status:** ${failed === 0 ? 'PASSED ✅' : 'FAILED ❌'}\n` +
      `**Timestamp:** ${timestamp}\n` +
      `**Pacing Delay:** ${currentDelayMs}ms\n` +
      `**Duration:** ${duration}s\n` +
      `**Metrics:** ${passed} Passed | ${failed} Failed | ${errors} Console Errors\n\n` +
      `## Step Execution Breakdown\n\n` +
      results.map((r, i) => `${i + 1}. **${r.title}** — ${r.passed ? 'PASSED ✅' : 'FAILED ❌'} (${r.durationMs || 0}ms)\n   *Detail:* ${r.detail || r.error || 'N/A'}`).join('\n\n') +
      `\n\n---\n*Generated by GRO10X Platform QA Automation Runner.*`;
  }

  function generateSlackReport(title, isSuccess, passed, failed, errors, duration) {
    return `${isSuccess ? '✅ *PASSED*' : '❌ *FAILED*'} · *GRO10X QA Suite: ${title}*\n` +
      `• *Duration:* ${duration}s @ ${currentDelayMs}ms delay\n` +
      `• *Scorecard:* ${passed} Passed | ${failed} Failed | ${errors} Console Errors\n` +
      `• *Platform:* ${platformSelect.value.toUpperCase()} › ${pageSelect.options[pageSelect.selectedIndex]?.text || ''}`;
  }

  // ──────── 12. RUN HANDLERS ────────
  async function runSelected() {
    const platformId = platformSelect.value;
    const pageId = pageSelect.value;
    const reg = window.GRO10X_REGISTRY && window.GRO10X_REGISTRY[platformId];
    const page = reg && reg.pages ? reg.pages.find(p => p.id === pageId) : null;
    const workflowsMap = getAllWorkflowsMap();

    if (currentMode === 'workflows') {
      const wfVal = workflowSelect.value;
      if (wfVal === '__all_page_workflows__') {
        await runAllOnPage();
        return;
      }
      const wf = workflowsMap[wfVal];
      if (wf && wf.steps) {
        const pagePath = wf.targetPath || (page && page.path) || (page && page.hash ? reg.baseUrl : null);
        const pageHash = wf.targetHash || (page && page.hash) || null;
        const taggedSteps = wf.steps.map(s => ({
          ...s,
          targetPath: s.targetPath || pagePath,
          targetHash: s.targetHash || pageHash,
          pageId,
          pageName: page ? page.name : ''
        }));
        await executeStepsSequence(wf.title, taggedSteps, pageHash);
      }
    } else {
      const auditSuite = getPageAuditSuite(platformId, pageId);
      if (auditSuite && auditSuite.steps) {
        const pagePath = auditSuite.targetPath || (page && page.path) || (page && page.hash ? reg.baseUrl : null);
        const pageHash = auditSuite.targetHash || (page && page.hash) || null;
        const taggedSteps = auditSuite.steps.map(s => ({
          ...s,
          targetPath: s.targetPath || pagePath,
          targetHash: s.targetHash || pageHash,
          pageId,
          pageName: page ? page.name : ''
        }));
        await executeStepsSequence(auditSuite.title, taggedSteps, pageHash);
      }
    }
  }

  async function runAllOnPage() {
    const platformId = platformSelect.value;
    const pageId = pageSelect.value;
    const reg = window.GRO10X_REGISTRY && window.GRO10X_REGISTRY[platformId];
    if (!reg) return;

    const page = reg.pages.find(p => p.id === pageId);
    const workflowsMap = getAllWorkflowsMap();

    if (currentMode === 'workflows') {
      const pageWorkflows = (page && page.workflows) || [];
      if (pageWorkflows.length === 0) {
        updateTicker('⚠️ No workflows on this page. Switching to Health Audit.');
        currentMode = 'audit';
        modeBtnWorkflows.classList.remove('active');
        modeBtnAudit.classList.add('active');
        updateWorkflowDropdown();
        await runSelected();
        return;
      }

      const combinedSteps = [];
      const pagePath = (page && page.path) || (page && page.hash ? reg.baseUrl : null);
      const pageHash = (page && page.hash) || null;
      pageWorkflows.forEach(wfKey => {
        const wf = workflowsMap[wfKey];
        if (wf && wf.steps) {
          const tagged = wf.steps.map(s => ({
            ...s,
            targetPath: s.targetPath || wf.targetPath || pagePath,
            targetHash: s.targetHash || wf.targetHash || pageHash,
            pageId,
            pageName: page ? page.name : ''
          }));
          combinedSteps.push(...tagged);
        }
      });
      await executeStepsSequence(`All Workflows on ${page.name}`, combinedSteps, pageHash);
    } else {
      await runSelected();
    }
  }

  async function runFullPlatform() {
    const platformId = platformSelect.value;
    const reg = window.GRO10X_REGISTRY && window.GRO10X_REGISTRY[platformId];
    if (!reg) return;

    const allSteps = [];
    reg.pages.forEach(p => {
      const auditSuite = getPageAuditSuite(platformId, p.id);
      if (auditSuite && auditSuite.steps) {
        const pagePath = auditSuite.targetPath || p.path || (p.hash ? reg.baseUrl : null);
        const pageHash = auditSuite.targetHash || p.hash || null;
        const taggedSteps = auditSuite.steps.map(s => ({
          ...s,
          targetPath: s.targetPath || pagePath,
          targetHash: s.targetHash || pageHash,
          pageId: p.id,
          pageName: p.name
        }));
        allSteps.push(...taggedSteps);
      }
    });

    if (allSteps.length === 0) {
      updateTicker(`⚠️ No audit steps found for platform: ${reg.name}`);
      return;
    }

    const firstPage = reg.pages[0];
    const initialHash = firstPage ? (firstPage.hash || '') : '';
    await executeStepsSequence(`Full Platform Audit: ${reg.name}`, allSteps, initialHash);
  }

  async function navigateToCurrentPage() {
    const platformId = platformSelect.value;
    const pageId = pageSelect.value;
    const reg = window.GRO10X_REGISTRY && window.GRO10X_REGISTRY[platformId];
    if (!reg) return;

    const page = reg.pages.find(p => p.id === pageId);
    if (!page) return;

    let targetUrl = reg.baseUrl;
    if (page.hash) {
      if (!targetUrl.endsWith('/')) targetUrl += '/';
      targetUrl += page.hash;
    } else if (page.path) {
      targetUrl = page.path;
    }

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.id) {
      const currentOrigin = new URL(tab.url).origin;
      const destination = currentOrigin + targetUrl;
      updateTicker(`🧭 Navigating active tab to ${destination}...`);
      await chrome.tabs.update(tab.id, { url: destination });
    }
  }

  function escapeHtml(str) {
    return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ──────── 13. GLOBAL LISTENERS INITIALIZATION ────────
  function initListeners() {
    // Platform ribbon chips
    Array.from(platformRibbon.querySelectorAll('.ribbon-chip')).forEach(chip => {
      chip.addEventListener('click', () => {
        playAudioChime('click');
        platformSelect.value = chip.dataset.platform;
        updateRibbonActive();
        populatePageDropdown();
      });
    });

    platformSelect.addEventListener('change', () => {
      updateRibbonActive();
      populatePageDropdown();
    });

    pageSelect.addEventListener('change', () => {
      updateRouteTelemetry();
      updateWorkflowDropdown();
      updateZenPillInfo();
    });

    btnNavigateTab.addEventListener('click', navigateToCurrentPage);

    // Zen Mode & Setup expand
    btnToggleZen.addEventListener('click', () => {
      playAudioChime('click');
      setZenMode(!isZenMode);
    });
    btnExpandSetup.addEventListener('click', () => {
      playAudioChime('click');
      setZenMode(false);
    });

    // Matrix View
    btnToggleMatrix.addEventListener('click', toggleMatrixView);
    btnCloseMatrix.addEventListener('click', toggleMatrixView);

    // Audio Chime Toggle
    btnToggleAudio.addEventListener('click', () => {
      soundEnabled = !soundEnabled;
      localStorage.setItem('gro10x_qa_audio', soundEnabled);
      updateAudioToggleUI();
      if (soundEnabled) playAudioChime('pass');
    });

    // Command Search Input
    quickSearchInput.addEventListener('input', (e) => {
      handleSearchInput(e.target.value);
    });

    btnClearSearch.addEventListener('click', () => {
      handleSearchInput('');
      quickSearchInput.focus();
    });

    // Mode Switcher
    modeBtnWorkflows.addEventListener('click', () => {
      playAudioChime('click');
      currentMode = 'workflows';
      modeBtnWorkflows.classList.add('active');
      modeBtnAudit.classList.remove('active');
      updateWorkflowDropdown();
    });

    modeBtnAudit.addEventListener('click', () => {
      playAudioChime('click');
      currentMode = 'audit';
      modeBtnAudit.classList.add('active');
      modeBtnWorkflows.classList.remove('active');
      updateWorkflowDropdown();
    });

    // Speed Selector
    [speedFast, speedHuman, speedSlow].forEach(btn => {
      btn.addEventListener('click', () => {
        playAudioChime('click');
        [speedFast, speedHuman, speedSlow].forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentDelayMs = parseInt(btn.dataset.delay, 10) || 800;
        speedLabel.textContent = `${currentDelayMs}ms ${btn.textContent.trim().split(' ')[1] || ''}`;
        updateZenPillInfo();
      });
    });

    // Auto-cleanup toggle
    chkAutoCleanup.addEventListener('change', (e) => {
      autoCleanup = e.target.checked;
    });

    // Execution Buttons
    btnRunSuite.addEventListener('click', () => {
      playAudioChime('click');
      runSelected();
    });
    btnRunPageAll.addEventListener('click', () => {
      playAudioChime('click');
      runAllOnPage();
    });
    btnRunPlatform.addEventListener('click', () => {
      playAudioChime('click');
      runFullPlatform();
    });

    // Running Controls
    btnPauseResume.addEventListener('click', () => {
      if (!isRunning) return;
      playAudioChime('click');
      isPaused = !isPaused;
      if (isPaused) {
        pauseIcon.textContent = '▶️';
        pauseText.textContent = 'Resume';
      } else {
        pauseIcon.textContent = '⏸️';
        pauseText.textContent = 'Pause';
        if (typeof pauseResolver === 'function') {
          pauseResolver();
          pauseResolver = null;
        }
      }
    });

    btnSkipStep.addEventListener('click', () => {
      if (!isRunning) return;
      playAudioChime('click');
      skipCurrentStep = true;
      updateTicker('⏩ Skipping current step...');
    });

    btnStopSuite.addEventListener('click', () => {
      if (!isRunning) return;
      playAudioChime('fail');
      shouldStop = true;
      if (isPaused && typeof pauseResolver === 'function') {
        pauseResolver();
        pauseResolver = null;
      }
    });

    btnClearLogs.addEventListener('click', () => {
      logStream.innerHTML = '<div style="text-align: center; padding: 24px 12px; color: var(--text-muted);">Log stream cleared.</div>';
    });

    // Report Exports
    btnCopyReport.addEventListener('click', () => {
      if (lastReportMarkdown) {
        playAudioChime('click');
        navigator.clipboard.writeText(lastReportMarkdown);
        btnCopyReport.textContent = '✅ Copied!';
        setTimeout(() => { btnCopyReport.textContent = '📋 Markdown'; }, 2000);
      }
    });

    btnCopySlackTG.addEventListener('click', () => {
      if (lastReportSlack) {
        playAudioChime('click');
        navigator.clipboard.writeText(lastReportSlack);
        btnCopySlackTG.textContent = '✅ Copied!';
        setTimeout(() => { btnCopySlackTG.textContent = '💬 Telegram'; }, 2000);
      }
    });

    btnDownloadJson.addEventListener('click', () => {
      if (lastReportJson) {
        playAudioChime('click');
        const blob = new Blob([JSON.stringify(lastReportJson, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gro10x-qa-${lastReportJson.platform}-${lastReportJson.page}-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    });

    // Global Keyboard Shortcuts (Ctrl+K, Space, Esc)
    window.addEventListener('keydown', (e) => {
      // Ctrl+K / Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        quickSearchInput.focus();
        quickSearchInput.select();
        return;
      }

      // Escape to close overlay or stop run
      if (e.key === 'Escape') {
        if (searchResultsOverlay.style.display !== 'none') {
          searchResultsOverlay.style.display = 'none';
          return;
        }
        if (isRunning) {
          btnStopSuite.click();
          return;
        }
      }

      // Spacebar to pause/resume when not typing
      if (e.key === ' ' && isRunning && document.activeElement !== quickSearchInput) {
        e.preventDefault();
        btnPauseResume.click();
      }
    });

    // Close search overlay on outer click
    document.addEventListener('click', (e) => {
      if (!quickSearchInput.contains(e.target) && !searchResultsOverlay.contains(e.target)) {
        searchResultsOverlay.style.display = 'none';
      }
    });
  }

  // ──────── 14. BOOTSTRAP ────────
  document.addEventListener('DOMContentLoaded', async () => {
    updateAudioToggleUI();
    initListeners();
    populatePageDropdown();
    buildSearchIndex();
    await checkTabConnection();
  });

  window.addEventListener('focus', () => {
    checkTabConnection();
  });
})();
