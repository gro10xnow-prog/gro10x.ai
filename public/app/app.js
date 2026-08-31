/**
 * public/app/app.js
 * ─────────────────────────────────────────────────────────────────────────────
 * GRO10X Admin Command Center Single Page Application Router & Controller v3.0
 * Manages hash navigation (#dashboard, #engines, #brands, #dbm, #crm, #kanban, etc.),
 * sidebar active states, and lazy-loaded view modules.
 * ─────────────────────────────────────────────────────────────────────────────
 */

(function initAdminApp() {
  const ROUTES = {
    '#dashboard':  { module: 'dashboard.js',  title: 'Executive Overview', icon: '📊' },
    '#engines':    { module: 'engines.js',    title: '5-Engine Growth Operations', icon: '🚀' },
    '#gigs':       { module: 'gigs.js',       title: 'Marketplace Gig Studio', icon: '⚡' },
    '#analytics':  { module: 'analytics.js',  title: 'Agency Analytics & Scorecards', icon: '📈' },
    '#crm':        { module: 'crm.js',        title: 'Clients & Retainers CRM', icon: '👥' },
    '#kanban':     { module: 'kanban.js',     title: 'Production Pipeline Hub', icon: '📋' },
    '#reviews':    { module: 'reviews.js',    title: 'Client Review Room Proofing', icon: '🎬' },
    '#social':     { module: 'social.js',     title: 'Social Media Planner', icon: '📱' },
    '#cms':        { module: 'cms.js',        title: 'Services Catalog & CMS Editor', icon: '📝' },
    '#brands':     { module: 'brands.js',     title: 'Digital Brand Empire Command Center', icon: '🛍️' },
    '#dbm':        { module: 'dbm.js',        title: 'DBM Operations & Team Tracker', icon: '👤' },
    '#finance':    { module: 'finance.js',    title: 'Financials & Expense Hub', icon: '💰' },
    '#hr':         { module: 'hr.js',         title: 'HR Ops & Roster Management', icon: '👨‍💼' },
    '#assets':     { module: 'assets.js',     title: 'Hardware Assets', icon: '📷' },
    '#tickets':    { module: 'tickets.js',    title: 'Support Desk Triage', icon: '🎟️' },
    '#automation': { module: 'automation.js', title: 'Bot Engine & Automation Logs', icon: '⚡' },
    '#leads':      { module: 'leads.js',      title: 'Leads Pipeline', icon: '🎯' },
    '#proposals':  { module: 'proposals.js',  title: 'Client Proposals Studio', icon: '💼' },
    '#settings':   { module: 'settings.js',   title: 'Workspace Settings', icon: '⚙️' }
  };

  const loadedModules = {};

  document.addEventListener('DOMContentLoaded', async () => {
    await validateServerSession();
    hydrateUserBadge();
    initRouter();
    updateSidebarBadges();
    initCommandPalette();
    initSSEBadgeSync();
  });

  async function validateServerSession() {
    try {
      const me = await APP_API.get('/auth/me');
      if (me && me.user) {
        localStorage.setItem('gro10x_user', JSON.stringify(me.user));
      }
    } catch (err) {
      console.warn('[GRO10X Session] Server validation failed:', err);
    }
  }

  function getPreferredFirstName(fullName) {
    if (!fullName) return 'Executive';
    const clean = String(fullName).trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'Executive';

    const HONORIFICS = new Set([
      'md', 'md.', 'mohammad', 'mohammed', 'muhammad', 'dr', 'dr.',
      'engr', 'engr.', 'mr', 'mr.', 'mrs', 'mrs.', 'ms', 'ms.',
      'prof', 'prof.', 'adv', 'adv.'
    ]);

    for (const p of parts) {
      if (!HONORIFICS.has(p.toLowerCase())) {
        return p;
      }
    }
    return parts[0];
  }

  function hydrateUserBadge() {
    try {
      const rawUser = localStorage.getItem('gro10x_user') || localStorage.getItem('purple_user');
      if (rawUser) {
        const user = JSON.parse(rawUser);
        const avatarEl = document.getElementById('userAvatar');
        const nameEl = document.getElementById('userName');
        const roleEl = document.getElementById('userRoleTag');

        const firstName = getPreferredFirstName(user.name);

        if (avatarEl) {
          const initials = (user.name || 'GX')
            .split(' ')
            .filter(Boolean)
            .map(w => w[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();
          avatarEl.textContent = initials || 'GX';
        }
        if (nameEl) nameEl.textContent = user.name || 'Admin User';
        if (roleEl) roleEl.textContent = user.role || user.accessLevel || 'Owner';

        window.CURRENT_USER = {
          ...user,
          firstName
        };
      }
    } catch (e) {
      console.warn('User badge hydration error:', e);
    }
  }

  // ──────── SIDEBAR ATTENTION BADGES ENGINE ────────
  async function updateSidebarBadges() {
    try {
      const [tasks, expenses, leads, leaves, tickets] = await Promise.all([
        APP_API.get('/tasks').catch(() => []),
        APP_API.get('/expenses').catch(() => []),
        APP_API.get('/leads').catch(() => []),
        APP_API.get('/leaves').catch(() => []),
        APP_API.get('/tickets').catch(() => [])
      ]);

      const todayStr = new Date().toISOString().split('T')[0];

      // 1. Kanban Overdue Tasks
      const overdueCount = (tasks || []).filter(t => 
        t.due_date && t.due_date < todayStr && !['Approved', 'Published', 'Completed'].includes(t.stage)
      ).length;
      setBadge('sidebarBadgeKanban', overdueCount, '🚨');

      // 2. Reviews In Review
      const reviewCount = (tasks || []).filter(t => t.stage === 'Client Review').length;
      setBadge('sidebarBadgeReviews', reviewCount, '🎬');

      // 3. Finance Pending Approvals (Pending Expenses + Pending Leaves)
      const pendingExps = (expenses || []).filter(e => {
        const st = (e.status || '').toLowerCase();
        return st.includes('pending') || (!e.tier1?.approved && !e.tier2?.approved);
      }).length;
      const pendingLeaves = (leaves || []).filter(l => (l.status || '').toLowerCase().includes('pending')).length;
      const totalFinanceApprovals = pendingExps + pendingLeaves;
      setBadge('sidebarBadgeFinance', totalFinanceApprovals, '✍️');
      setBadge('sidebarBadgeHR', pendingLeaves, '🌴');

      // 4. Hot / Uncontacted Leads
      const newLeads = (leads || []).filter(l => (l.status || '').toLowerCase() === 'new' || (l.status || '').toLowerCase() === 'contacted').length;
      setBadge('sidebarBadgeLeads', newLeads, '🎯');

      // 5. Open Tickets
      const openTickets = (tickets || []).filter(t => (t.status || '').toLowerCase() === 'open').length;
      setBadge('sidebarBadgeTickets', openTickets, '🎟️');
    } catch (e) {
      console.warn('[Sidebar Badges] Sync note:', e.message);
    }
  }

  function setBadge(elementId, count, emoji = '') {
    const el = document.getElementById(elementId);
    if (!el) return;
    if (count > 0) {
      el.textContent = `${count}`;
      el.style.display = 'inline-block';
    } else {
      el.style.display = 'none';
    }
  }

  function initSSEBadgeSync() {
    if (window.APP_SSE) {
      window.APP_SSE.onAny(() => updateSidebarBadges());
    }
    // Periodic badge check every 45s
    setInterval(updateSidebarBadges, 45000);
  }

  function initRouter() {
    window.addEventListener('hashchange', handleRoute);
    handleRoute(); // Boot current hash or default
  }

  async function handleRoute() {
    let hash = window.location.hash || '#dashboard';
    if (!ROUTES[hash]) hash = '#dashboard';

    const routeInfo = ROUTES[hash];

    // Update Sidebar Active Link
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(link => {
      const href = link.getAttribute('href');
      if (href === hash) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Update Header Breadcrumb Title
    const headerTitleEl = document.getElementById('headerPageTitle');
    if (headerTitleEl) {
      headerTitleEl.textContent = `${routeInfo.icon} ${routeInfo.title}`;
    }

    const viewContainer = document.getElementById('app-view');
    if (!viewContainer) return;

    // Show Loading Skeleton
    viewContainer.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:1rem; padding:1rem;">
        <div class="skeleton" style="height:120px; width:100%;"></div>
        <div style="display:grid; grid-template-columns: 2fr 1fr; gap:1rem;">
          <div class="skeleton" style="height:350px;"></div>
          <div class="skeleton" style="height:350px;"></div>
        </div>
      </div>
    `;

    try {
      // Lazy load module script if not already loaded
      if (!loadedModules[routeInfo.module]) {
        await loadModuleScript(routeInfo.module);
        loadedModules[routeInfo.module] = true;
      }

      // Execute module render method
      const moduleName = routeInfo.module.replace('.js', '');
      const renderFn = window.APP_MODULES && window.APP_MODULES[moduleName];

      if (typeof renderFn === 'function') {
        viewContainer.innerHTML = '';
        await renderFn(viewContainer);
      } else {
        console.error(`[PurpleOS Router] Module function missing for '${moduleName}'. Available:`, Object.keys(window.APP_MODULES || {}));
        viewContainer.innerHTML = `
          <div class="card-glass" style="text-align:center; padding:3rem;">
            <div style="font-size:2rem; margin-bottom:0.5rem;">⚠️ Module Error</div>
            <div style="color:var(--text-muted); margin-bottom:1rem;">Failed to render module: <b>${moduleName}</b></div>
            <button class="btn-primary" onclick="window.location.reload()">🔄 Reload Portal</button>
          </div>
        `;
      }
    } catch (err) {
      console.error(`[PurpleOS Router] Error loading route ${hash}:`, err);
      viewContainer.innerHTML = `
        <div class="card-glass" style="text-align:center; padding:3rem;">
          <div style="font-size:2rem; margin-bottom:0.5rem;">❌ Failed to load page</div>
          <div style="color:var(--text-muted); margin-bottom:1rem;">${err.message || 'Network error'}</div>
          <button class="btn-primary" onclick="window.location.reload()">🔄 Reload Portal</button>
        </div>
      `;
      if (window.showToast) window.showToast(`Failed to load module: ${err.message}`, 'error');
    }
  }

  function loadModuleScript(moduleFile) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `/app/modules/${moduleFile}?v=${Date.now()}`;
      script.onload = () => {
        console.log(`[PurpleOS Router] Script loaded successfully: /app/modules/${moduleFile}`);
        resolve();
      };
      script.onerror = (e) => {
        console.error(`[PurpleOS Router] Failed script load event for /app/modules/${moduleFile}`, e);
        reject(new Error(`Could not load /app/modules/${moduleFile}`));
      };
      document.body.appendChild(script);
    });
  }

  // Global Toast Notification Helper
  window.showToast = function(message, type = 'success', duration = 3500) {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  };

  // Global HTML Sanitizer to prevent XSS in modules
  window.escapeHTML = function(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  // Global Modal & Drawer Accessibility Controller
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      // Close active modal overlays
      document.querySelectorAll('.modal-overlay.active, .modal-overlay[style*="display: flex"], .modal-overlay[style*="display: block"]').forEach(m => {
        m.classList.remove('active');
        if (m.style.display && m.style.display !== 'none') m.style.display = 'none';
      });

      // Close drawers
      document.querySelectorAll('.drawer-panel.open, .drawer-backdrop.open').forEach(d => d.classList.remove('open'));
      const leadDrawer = document.getElementById('leadProfileDrawer');
      const leadBackdrop = document.getElementById('leadDrawerBackdrop');
      if (leadDrawer) leadDrawer.style.display = 'none';
      if (leadBackdrop) leadBackdrop.style.display = 'none';
    }
  });

  // ──────── GLOBAL COMMAND PALETTE (CTRL+K / CMD+K) ────────
  let cmdPaletteItems = [];
  let selectedCmdIdx = 0;

  function initCommandPalette() {
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openCommandPalette();
      }
    });
  }

  window.openCommandPalette = async function() {
    const modal = document.getElementById('commandPaletteModal');
    const input = document.getElementById('cmdPaletteInput');
    if (modal) {
      modal.style.display = 'flex';
      if (input) {
        input.value = '';
        input.focus();
      }
      await buildCommandPaletteIndex();
      renderCommandPaletteResults('');
    }
  };

  window.closeCommandPalette = function() {
    const modal = document.getElementById('commandPaletteModal');
    if (modal) modal.style.display = 'none';
  };

  async function buildCommandPaletteIndex() {
    cmdPaletteItems = [
      // Navigation
      { type: 'Navigation', icon: '📊', title: 'Executive Overview', hash: '#dashboard' },
      { type: 'Navigation', icon: '🚀', title: '5-Engine Growth Operations Cockpit', hash: '#engines' },
      { type: 'Navigation', icon: '⚡', title: 'Marketplace Gig Studio (Fiverr & Upwork)', hash: '#gigs' },
      { type: 'Navigation', icon: '📈', title: 'Agency Analytics & Scorecards', hash: '#analytics' },
      { type: 'Navigation', icon: '🎯', title: 'Leads Pipeline Hub', hash: '#leads' },
      { type: 'Navigation', icon: '👥', title: 'Client CRM Directory', hash: '#crm' },
      { type: 'Navigation', icon: '📋', title: 'Production Kanban Pipeline', hash: '#kanban' },
      { type: 'Navigation', icon: '🎬', title: 'Review Room Proofing Hub', hash: '#reviews' },
      { type: 'Navigation', icon: '📱', title: 'Social Media Planner', hash: '#social' },
      { type: 'Navigation', icon: '🛍️', title: 'Digital Brand Empire Command Center', hash: '#brands' },
      { type: 'Navigation', icon: '👤', title: 'DBM Operations & Team Tracker', hash: '#dbm' },
      { type: 'Navigation', icon: '💰', title: 'Financials & Expense Claims', hash: '#finance' },
      { type: 'Navigation', icon: '👨‍💼', title: 'HR Ops & Team Roster', hash: '#hr' },
      { type: 'Navigation', icon: '🎟️', title: 'Support Desk Triaging', hash: '#tickets' },
      { type: 'Navigation', icon: '⚙️', title: 'Workspace Settings & API', hash: '#settings' },
      // Quick Actions
      { type: 'Action', icon: '🛍️', title: 'Open Brand Command Center', action: () => { window.location.hash = '#brands'; } },
      { type: 'Action', icon: '💼', title: 'Open Investor & Capital Partner Hub', action: () => window.open('/investors.html', '_blank') },
      { type: 'Action', icon: '📥', title: 'Bulk Import Tasks & Projects (CSV)', action: () => { window.location.hash = '#kanban'; setTimeout(() => window.KANBAN_MODULE?.openImportModal(), 400); } },
      { type: 'Action', icon: '✨', title: 'Open Live Ops Health Center', action: () => window.openOpsHealthModal() },
      { type: 'Action', icon: '🧾', title: 'Create New Client Invoice', action: () => { window.location.hash = '#finance'; setTimeout(() => window.FINANCE_MODULE?.openNewInvoiceModal?.(), 400); } }
    ];

    // Try to append live clients & team
    try {
      const [clients, team] = await Promise.all([
        APP_API.get('/clients').catch(() => []),
        APP_API.get('/team').catch(() => [])
      ]);

      (clients || []).slice(0, 10).forEach(c => {
        cmdPaletteItems.push({
          type: 'Clients',
          icon: '🏢',
          title: c.name || 'Client',
          badge: c.category || 'Retainer',
          action: () => { window.location.hash = '#crm'; }
        });
      });

      (team || []).slice(0, 10).forEach(t => {
        cmdPaletteItems.push({
          type: 'Team',
          icon: '👤',
          title: t.name || 'Staff',
          badge: t.role || t.department || 'Specialist',
          action: () => { window.location.hash = '#hr'; }
        });
      });
    } catch (e) {}
  }

  window.handleCommandPaletteInput = function(e) {
    const query = e.target.value.toLowerCase().trim();
    renderCommandPaletteResults(query);
  };

  window.handleCommandPaletteKeydown = function(e) {
    const resultsContainer = document.getElementById('cmdPaletteResults');
    const items = resultsContainer ? resultsContainer.querySelectorAll('.cmd-item') : [];

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (items.length === 0) return;
      selectedCmdIdx = (selectedCmdIdx + 1) % items.length;
      updateCmdPaletteHighlight(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (items.length === 0) return;
      selectedCmdIdx = (selectedCmdIdx - 1 + items.length) % items.length;
      updateCmdPaletteHighlight(items);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (items[selectedCmdIdx]) {
        items[selectedCmdIdx].click();
      }
    } else if (e.key === 'Escape') {
      closeCommandPalette();
    }
  };

  function updateCmdPaletteHighlight(items) {
    items.forEach((it, idx) => {
      if (idx === selectedCmdIdx) {
        it.classList.add('selected');
        it.scrollIntoView({ block: 'nearest' });
      } else {
        it.classList.remove('selected');
      }
    });
  }

  function renderCommandPaletteResults(query) {
    const resultsContainer = document.getElementById('cmdPaletteResults');
    if (!resultsContainer) return;

    selectedCmdIdx = 0;

    let filtered = cmdPaletteItems;
    if (query) {
      filtered = cmdPaletteItems.filter(item => 
        item.title.toLowerCase().includes(query) || 
        item.type.toLowerCase().includes(query) ||
        (item.badge && item.badge.toLowerCase().includes(query))
      );
    }

    if (filtered.length === 0) {
      resultsContainer.innerHTML = `
        <div style="text-align:center; padding:2rem; color:var(--text-muted); font-size:0.85rem;">
          No matching commands, clients or pages found for "<b>${escapeHTML(query)}</b>"
        </div>
      `;
      return;
    }

    // Group by type
    const groups = {};
    filtered.forEach(f => {
      groups[f.type] = groups[f.type] || [];
      groups[f.type].push(f);
    });

    let html = '';
    let globalIdx = 0;

    Object.keys(groups).forEach(grp => {
      html += `<div class="cmd-group-title">${grp}</div>`;
      groups[grp].forEach(item => {
        const isSel = globalIdx === selectedCmdIdx ? 'selected' : '';
        html += `
          <div class="cmd-item ${isSel}" data-idx="${globalIdx}" onclick="executeCmdItem(${globalIdx})">
            <span class="cmd-item-icon">${item.icon}</span>
            <span class="cmd-item-title">${escapeHTML(item.title)}</span>
            ${item.badge ? `<span class="cmd-item-badge">${escapeHTML(item.badge)}</span>` : ''}
          </div>
        `;
        globalIdx++;
      });
    });

    resultsContainer.innerHTML = html;

    // Attach to current filtered list for execution
    window._currentFilteredCmds = filtered;
  }

  window.executeCmdItem = function(idx) {
    const list = window._currentFilteredCmds || cmdPaletteItems;
    const item = list[idx];
    if (!item) return;

    closeCommandPalette();

    if (item.hash) {
      window.location.hash = item.hash;
    } else if (typeof item.action === 'function') {
      item.action();
    }
  };
})();
