/**
 * public/workspace/workspace.js
 * ─────────────────────────────────────────────────────────────────────────────
 * GRO10X Unified Multi-Engine Workspace Controller v1.0
 * Powers the single-pane-of-glass internal OS:
 * - Dynamic Engine Context Switcher (Engine 1–5 + All Engines)
 * - 3-Tier Seniority & Role-Filtered Navigation
 * - Seamless module loader bridging battle-tested components
 * ─────────────────────────────────────────────────────────────────────────────
 */

(function () {
  'use strict';

  // 1. Unified API Client
  const WORKSPACE_API = {
    getToken: function () {
      return localStorage.getItem('gro10x_token') || sessionStorage.getItem('gro10x_token') || localStorage.getItem('token') || '';
    },
    buildUrl: function (endpoint) {
      const base = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`;
      const url = new URL(base, window.location.origin);
      if (window.WORKSPACE && window.WORKSPACE.currentEngine && window.WORKSPACE.currentEngine !== 'all') {
        if (!url.searchParams.has('engineId')) {
          url.searchParams.set('engineId', window.WORKSPACE.currentEngine);
        }
      }
      return url.toString();
    },
    request: async function (endpoint, options = {}) {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getToken()}`,
        ...(window.WORKSPACE?.currentEngine ? { 'x-gro10x-engine': window.WORKSPACE.currentEngine } : {}),
        ...(options.headers || {})
      };

      const res = await fetch(this.buildUrl(endpoint), { ...options, headers });
      if (res.status === 401) {
        window.location.href = `/auth?portal=workspace&redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
        return null;
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(err.error || `Request failed with status ${res.status}`);
      }
      return res.json();
    },
    get: function (url) { return this.request(url, { method: 'GET' }); },
    post: function (url, body) { return this.request(url, { method: 'POST', body: JSON.stringify(body) }); },
    put: function (url, body) { return this.request(url, { method: 'PUT', body: JSON.stringify(body) }); },
    patch: function (url, body) { return this.request(url, { method: 'PATCH', body: JSON.stringify(body) }); },
    delete: function (url) { return this.request(url, { method: 'DELETE' }); }
  };

  // Expose globally so existing modules have immediate compatibility
  window.WORKSPACE_API = WORKSPACE_API;
  window.APP_API = WORKSPACE_API;
  window.MANAGER_API = WORKSPACE_API;

  window.escapeHTML = window.escapeHTML || function(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, function(m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
  };
  window.escapeHtml = window.escapeHTML;

  window.showManagerToast = window.showManagerToast || function(msg, type = 'success') {
    console.log(`[Toast ${type}]:`, msg);
  };
  window.showToast = window.showManagerToast;

  window.toggleTheme = function() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('gro10x_theme', next);
    localStorage.setItem('purple_theme', next);
    const btn = document.getElementById('themeToggleBtn');
    if (btn) btn.textContent = next === 'dark' ? '🌙' : '☀️';
  };

  const ENGINE_META = {
    engine1: { name: 'Engine 1: Micro-SaaS Platforms', icon: '💻' },
    engine2: { name: 'Engine 2: AI Agency & Sprints', icon: '⚡' },
    engine3: { name: 'Engine 3: Digital Commerce (DCE)', icon: '🛍️' },
    engine4: { name: 'Engine 4: Managed Retainers', icon: '🤝' },
    engine5: { name: 'Engine 5: AI Video & Media', icon: '🎬' },
    all:     { name: 'All Engines (Executive Command)', icon: '🏛️' }
  };

  // 2. Global Workspace State
  window.WORKSPACE = {
    currentUser: null,
    currentEngine: localStorage.getItem('gro10x_current_engine') || 'engine2',
    activeTab: null,
    loadedScripts: {},

    init: async function () {
      this.syncTheme();
      this.initClock();
      await this.loadSession();
      this.initEngineSwitcher();
      this.applyRoleFilter();
      this.initRouter();
    },

    syncTheme: function () {
      const theme = localStorage.getItem('gro10x_theme') || document.documentElement.getAttribute('data-theme') || 'dark';
      document.documentElement.setAttribute('data-theme', theme);
      const btn = document.getElementById('themeToggleBtn');
      if (btn) btn.textContent = theme === 'dark' ? '🌙' : '☀️';
    },

    loadSession: async function () {
      const stored = localStorage.getItem('gro10x_user') || localStorage.getItem('purple_user');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed === 'object') {
            this.currentUser = Object.assign({
              name: 'Enterprise Leader',
              role: 'Technology Admin',
              seniorityTier: 3,
              seniorityTitle: 'Tier 3 (Command)',
              assignedEngine: 'all',
              allowedEngines: ['all', 'engine1', 'engine2', 'engine3', 'engine4', 'engine5']
            }, parsed);
            if (!this.currentUser.seniorityTier) {
              this.currentUser.seniorityTier = 3;
              this.currentUser.seniorityTitle = 'Tier 3 (Command)';
            }
            if (!this.currentUser.allowedEngines) {
              this.currentUser.allowedEngines = ['all', 'engine1', 'engine2', 'engine3', 'engine4', 'engine5'];
            }
            this.renderUserBadge();
            return;
          }
        } catch (e) {}
      }
      try {
        const data = await WORKSPACE_API.get('/auth/me');
        if (data && data.user) {
          this.currentUser = data.user;
          this.renderUserBadge();
        }
      } catch (err) {
        console.warn('[Workspace] Session fetch fallback:', err.message);
        // Fallback user for dev/demo if offline
        this.currentUser = {
          name: 'Agency Leader',
          role: 'Technology Admin',
          seniorityTier: 3,
          seniorityTitle: 'Tier 3 (Command)',
          assignedEngine: 'all',
          allowedEngines: ['all', 'engine1', 'engine2', 'engine3', 'engine4', 'engine5']
        };
        this.renderUserBadge();
      }
    },

    renderUserBadge: function () {
      const u = this.currentUser || {};
      const tier = u.seniorityTier || 1;

      // Update Topbar User Info
      const nameEl = document.getElementById('userName');
      const roleEl = document.getElementById('userRoleTag');
      const avatarEl = document.getElementById('userAvatar');
      const tierBadge = document.getElementById('userTierBadge');
      const tierText = document.getElementById('userTierText');

      if (nameEl) nameEl.textContent = u.name || 'Team Member';
      if (roleEl) roleEl.textContent = u.role || 'Specialist';
      if (avatarEl) {
        const initials = (u.name || 'User').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
        avatarEl.textContent = initials;
      }

      if (tierBadge && tierText) {
        tierBadge.className = `user-tier-badge tier-badge-${tier}`;
        tierText.textContent = u.seniorityTitle || `Tier ${tier}`;
      }
    },

    initEngineSwitcher: function () {
      const select = document.getElementById('engineSwitcherSelect');
      const icon = document.getElementById('engineSwitcherIcon');
      if (!select) return;

      const allowed = this.currentUser?.allowedEngines || ['engine2'];
      const tier = Number(this.currentUser?.seniorityTier) || 1;

      // Restrict options if not in allowedEngines
      Array.from(select.options).forEach(opt => {
        if (!allowed.includes(opt.value)) {
          opt.disabled = true;
          opt.textContent = `🔒 ${opt.textContent}`;
        }
      });

      // Check for URL query param or hash param overrides (e.g. ?engineId=engine3 or #deliverables?engineId=engine3)
      const urlParams = new URLSearchParams(window.location.search);
      let queryEngine = urlParams.get('engineId') || urlParams.get('engine');
      if (!queryEngine && window.location.hash.includes('engineId=')) {
        const match = window.location.hash.match(/engineId=([a-z0-9_]+)/i);
        if (match) queryEngine = match[1];
      }

      if (queryEngine && (allowed.includes(queryEngine) || tier >= 2)) {
        this.currentEngine = queryEngine;
        localStorage.setItem('gro10x_current_engine', queryEngine);
      } else if (!allowed.includes(this.currentEngine)) {
        // Default to assigned engine if current selection is not allowed
        this.currentEngine = this.currentUser?.assignedEngine || 'engine2';
        localStorage.setItem('gro10x_current_engine', this.currentEngine);
      }

      select.value = this.currentEngine;
      if (icon && ENGINE_META[this.currentEngine]) {
        icon.textContent = ENGINE_META[this.currentEngine].icon;
      }
    },

    switchEngine: function (engineId) {
      if (!engineId) return;
      this.currentEngine = engineId;
      localStorage.setItem('gro10x_current_engine', engineId);

      const select = document.getElementById('engineSwitcherSelect');
      if (select && select.value !== engineId) select.value = engineId;

      const icon = document.getElementById('engineSwitcherIcon');
      if (icon && ENGINE_META[engineId]) {
        icon.textContent = ENGINE_META[engineId].icon;
      }

      // Re-render current active tab with the new engine context
      this.navigateTo(this.activeTab, true);
    },

    applyRoleFilter: function () {
      const u = this.currentUser || {};
      const tier = Number(u.seniorityTier) || 1;
      const role = String(u.role || '').toLowerCase();

      const pCommand = document.getElementById('pillar-command');
      const pGrowth = document.getElementById('pillar-growth');
      const pDelivery = document.getElementById('pillar-delivery');
      const pOperations = document.getElementById('pillar-operations');

      // Tier 1 Delivery Specialist: Hides Command & Growth
      if (tier === 1 && (role.includes('specialist') || role.includes('crew') || role.includes('developer') || role.includes('editor'))) {
        if (pCommand) pCommand.style.display = 'none';
        if (pGrowth) pGrowth.style.display = 'none';
        if (pDelivery) pDelivery.style.display = 'block';
        if (pOperations) pOperations.style.display = 'block';

        // Hide manager-only desks in operations
        const techLink = document.querySelector('a[href="#tech"]');
        if (techLink) techLink.style.display = 'none';
      }
      // Tier 1 BD / Sales Specialist: Hides Command, shows Growth
      else if (tier === 1 && (role.includes('business development') || role.includes('bd') || role.includes('sales'))) {
        if (pCommand) pCommand.style.display = 'none';
        if (pGrowth) pGrowth.style.display = 'block';
        if (pDelivery) pDelivery.style.display = 'block';
        if (pOperations) pOperations.style.display = 'block';

        const techLink = document.querySelector('a[href="#tech"]');
        if (techLink) techLink.style.display = 'none';
      }
      // Tier 2 Managers: Full access to Operations, Delivery, Velocity
      else if (tier === 2) {
        if (pCommand) pCommand.style.display = 'block';
        if (pGrowth) pGrowth.style.display = 'block';
        if (pDelivery) pDelivery.style.display = 'block';
        if (pOperations) pOperations.style.display = 'block';

        // Non-tech managers don't need tech console
        if (!role.includes('tech')) {
          const techLink = document.querySelector('a[href="#tech"]');
          if (techLink) techLink.style.display = 'none';
        }
      }
      // Tier 3 Command / CXO / Leads: All pillars visible
      else {
        if (pCommand) pCommand.style.display = 'block';
        if (pGrowth) pGrowth.style.display = 'block';
        if (pDelivery) pDelivery.style.display = 'block';
        if (pOperations) pOperations.style.display = 'block';
      }
    },

    initRouter: function () {
      const parseHash = () => {
        const raw = window.location.hash.replace('#', '') || 'overview';
        const [tab, query] = raw.split('?');
        if (query && query.includes('engineId=')) {
          const match = query.match(/engineId=([a-z0-9_]+)/i);
          if (match && match[1] !== this.currentEngine) {
            this.switchEngine(match[1]);
          }
        }
        return tab || 'overview';
      };

      window.addEventListener('hashchange', () => {
        this.navigateTo(parseHash());
      });

      this.navigateTo(parseHash());
    },

    navigateTo: async function (tabId, force = false) {
      if (!tabId) tabId = 'overview';
      const container = document.getElementById('workspace-view');
      if (this.activeTab === tabId && !force && container && !container.textContent.includes('Loading Workspace...')) {
        return;
      }

      this.activeTab = tabId;

      // Update sidebar active states
      document.querySelectorAll('.workspace-nav-item').forEach(el => {
        el.classList.toggle('active', el.getAttribute('data-tab') === tabId || el.getAttribute('href') === `#${tabId}`);
      });

      if (!container) return;

      container.innerHTML = `
        <div style="display:flex; align-items:center; justify-content:center; min-height:300px; color:var(--text-muted);">
          <div style="text-align:center;">
            <div style="font-size:1.5rem; margin-bottom:0.4rem;">⚡</div>
            <div style="font-weight:600; font-size:0.9rem;">Loading ${tabId.toUpperCase()}...</div>
          </div>
        </div>
      `;

      try {
        await this.mountModule(tabId, container);
      } catch (err) {
        console.error(`[Workspace Router] Error mounting #${tabId}:`, err);
        container.innerHTML = `
          <div class="card-glass" style="padding:2rem; border-color:rgba(239,68,68,0.3);">
            <h2 style="color:#ef4444; margin-top:0;">⚠️ Failed to load view: #${tabId}</h2>
            <p style="color:var(--text-secondary);">${err.message}</p>
            <button class="btn btn-secondary" onclick="WORKSPACE.navigateTo('${tabId}', true)">🔄 Retry</button>
          </div>
        `;
      }
    },

    importScript: function (src) {
      if (this.loadedScripts[src]) {
        return this.loadedScripts[src];
      }
      const promise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve();
        script.onerror = (e) => reject(new Error(`Failed to load script ${src}`));
        document.head.appendChild(script);
      });
      this.loadedScripts[src] = promise;
      return promise;
    },

    mountModule: async function (tabId, container) {
      const eng = this.currentEngine;
      const meta = ENGINE_META[eng] || ENGINE_META.engine2;

      switch (tabId) {
        case 'overview':
          await this.importScript('/manager/modules/overview.js');
          if (window.MANAGER_MODULES && window.MANAGER_MODULES.overview) {
            await window.MANAGER_MODULES.overview(container);
          }
          break;

        case 'velocity':
          await this.importScript('/app/modules/engines.js');
          if (window.APP_MODULES && window.APP_MODULES.engines) {
            await window.APP_MODULES.engines(container);
          }
          break;

        case 'pnl':
          await this.renderPnlWaterfall(container);
          break;

        case 'leads':
          await this.importScript('/app/modules/leads.js');
          if (window.APP_MODULES && window.APP_MODULES.leads) {
            await window.APP_MODULES.leads(container);
          }
          break;

        case 'proposals':
          await this.importScript('/app/modules/proposals.js');
          if (window.APP_MODULES && window.APP_MODULES.proposals) {
            await window.APP_MODULES.proposals(container);
          } else if (window.APP_MODULES && window.APP_MODULES['proposals.js']) {
            await window.APP_MODULES['proposals.js'].render(container);
          }
          break;

        case 'crm':
          await this.importScript('/app/modules/crm.js');
          if (window.APP_MODULES && window.APP_MODULES.crm) {
            await window.APP_MODULES.crm(container);
          }
          break;

        case 'invoices':
          await this.importScript('/app/modules/finance.js');
          if (window.APP_MODULES && window.APP_MODULES.finance) {
            await window.APP_MODULES.finance(container);
          }
          break;

        case 'tasks':
          await this.importScript('/manager/modules/tasks.js');
          if (window.MANAGER_MODULES && window.MANAGER_MODULES.tasks) {
            await window.MANAGER_MODULES.tasks(container);
          }
          break;

        case 'kanban':
          await this.importScript('/app/modules/kanban.js');
          if (window.APP_MODULES && window.APP_MODULES.kanban) {
            await window.APP_MODULES.kanban(container);
          }
          break;

        case 'deliverables':
          await this.renderDeliverablesVault(container);
          break;

        case 'tickets':
          await this.importScript('/manager/modules/tickets.js');
          if (window.MANAGER_MODULES && window.MANAGER_MODULES.tickets) {
            await window.MANAGER_MODULES.tickets(container);
          }
          break;

        case 'team':
          await this.importScript('/manager/modules/team.js');
          if (window.MANAGER_MODULES && window.MANAGER_MODULES.team) {
            await window.MANAGER_MODULES.team(container);
          }
          break;

        case 'leaves':
          await this.importScript('/manager/modules/leaves.js');
          if (window.MANAGER_MODULES && window.MANAGER_MODULES.leaves) {
            await window.MANAGER_MODULES.leaves(container);
          }
          break;

        case 'claims':
          await this.importScript('/manager/modules/finance.js');
          if (window.MANAGER_MODULES && window.MANAGER_MODULES.finance) {
            await window.MANAGER_MODULES.finance(container);
          }
          break;

        case 'tech':
          await this.importScript('/manager/modules/tech.js');
          if (window.MANAGER_MODULES && window.MANAGER_MODULES.tech) {
            await window.MANAGER_MODULES.tech(container);
          }
          break;

        case 'settings':
          await this.importScript('/app/modules/settings.js');
          if (window.APP_MODULES && window.APP_MODULES.settings) {
            await window.APP_MODULES.settings(container);
          }
          break;

        default:
          container.innerHTML = `
            <div class="card-glass" style="padding:2rem;">
              <h2>${meta.icon} ${meta.name} — #${tabId}</h2>
              <p style="color:var(--text-secondary);">Module loaded inside the unified workspace container.</p>
            </div>
          `;
      }
    },

    renderPnlWaterfall: async function (container) {
      try {
        const data = await WORKSPACE_API.get('/engines/pnl-waterfall');
        const wf = data.waterfall || {};
        container.innerHTML = `
          <div style="margin-bottom:1.5rem;">
            <h1 style="font-size:1.6rem; font-weight:800; font-family:var(--font-heading); margin:0 0 0.3rem;">
              💰 Consolidated P&L Financial Waterfall
            </h1>
            <div style="font-size:0.88rem; color:var(--text-muted);">
              Real-time agency cash flow, compute/contractor COGS, and 65%+ net margin governance.
            </div>
          </div>

          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:1rem; margin-bottom:1.5rem;">
            <div class="card-glass" style="padding:1.25rem;">
              <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Gross Inflow (USD)</div>
              <div style="font-size:1.6rem; font-weight:900; color:var(--brand-primary); font-family:var(--font-heading);">$${(wf.grossInflowUSD || 0).toLocaleString()}</div>
              <div style="font-size:0.8rem; color:var(--text-secondary);">৳${(wf.grossInflowBDT || 0).toLocaleString()} BDT</div>
            </div>
            <div class="card-glass" style="padding:1.25rem;">
              <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Total COGS (Compute & Dev)</div>
              <div style="font-size:1.6rem; font-weight:900; color:#ef4444; font-family:var(--font-heading);">$${(wf.cogs?.totalCOGS_USD || 0).toLocaleString()}</div>
              <div style="font-size:0.8rem; color:var(--text-secondary);">Guarded direct project costs</div>
            </div>
            <div class="card-glass" style="padding:1.25rem;">
              <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Net Margin</div>
              <div style="font-size:1.6rem; font-weight:900; color:#38bdf8; font-family:var(--font-heading);">${wf.netMarginPercent || '65%'}</div>
              <div style="font-size:0.8rem; color:var(--text-secondary);">Benchmark Target: >60%</div>
            </div>
            <div class="card-glass" style="padding:1.25rem;">
              <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Operating Runway</div>
              <div style="font-size:1.6rem; font-weight:900; color:#a855f7; font-family:var(--font-heading);">${wf.runwayMonths || 36} Mo</div>
              <div style="font-size:0.8rem; color:var(--text-secondary);">$${(wf.cashReservesUSD || 45000).toLocaleString()} Reserves</div>
            </div>
          </div>
        `;
      } catch (e) {
        container.innerHTML = `<div class="card-glass" style="padding:2rem;"><p>Failed to load P&L telemetry: ${e.message}</p></div>`;
      }
    },

    renderDeliverablesVault: async function (container) {
      container.innerHTML = `
        <div style="margin-bottom:1.5rem;">
          <h1 style="font-size:1.6rem; font-weight:800; font-family:var(--font-heading); margin:0 0 0.3rem;">
            📦 Deliverables Vault & Staging Room
          </h1>
          <div style="font-size:0.88rem; color:var(--text-muted);">
            Engine sprint proofing, client review assets, and 24-hour contractor defect hotfix room.
          </div>
        </div>
        <div class="card-glass" style="padding:2rem; text-align:center;">
          <div style="font-size:2.5rem; margin-bottom:0.75rem;">🛡️</div>
          <h2 style="margin:0 0 0.5rem; font-family:var(--font-heading);">Sprint Assets & Staging Proofing</h2>
          <p style="color:var(--text-secondary); max-width:600px; margin:0 auto 1.5rem;">
            Assets uploaded by specialists are inspected here before advancing to client review. 30-day bug-fix warranties and 15% contractor holdbacks are enforced automatically.
          </p>
          <a href="#tasks" class="btn btn-primary">Go to Tasks Pipeline</a>
        </div>
      `;
    },

    initClock: function () {
      const clockText = document.getElementById('dhakaClockText');
      if (!clockText) return;

      const update = () => {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', {
          timeZone: 'Asia/Dhaka',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        });
        clockText.textContent = `${timeStr} · BST`;
      };
      update();
      setInterval(update, 1000);
    },

    signOut: function () {
      localStorage.removeItem('gro10x_token');
      sessionStorage.removeItem('gro10x_token');
      localStorage.removeItem('token');
      window.location.href = '/auth?portal=workspace';
    }
  };

  // Bootstrap on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    window.WORKSPACE.init();
  });

})();
