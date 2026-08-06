/**
 * public/app/app.js
 * ─────────────────────────────────────────────────────────────────────────────
 * PurpleOS Admin Portal Single Page Application Router & Controller v3.0
 * Manages hash navigation (#dashboard, #crm, #kanban, #social, #finance, #hr, #tickets, #settings),
 * sidebar active states, and lazy-loaded view modules.
 * ─────────────────────────────────────────────────────────────────────────────
 */

(function initAdminApp() {
  const ROUTES = {
    '#dashboard':  { module: 'dashboard.js',  title: 'Executive Overview', icon: '📊' },
    '#analytics':  { module: 'analytics.js',  title: 'Agency Analytics & Scorecards', icon: '📈' },
    '#crm':        { module: 'crm.js',        title: 'Client Intelligence & CRM', icon: '👥' },
    '#kanban':     { module: 'kanban.js',     title: 'Production Pipeline Hub', icon: '📋' },
    '#reviews':    { module: 'reviews.js',    title: 'Client Review Room Proofing', icon: '🎬' },
    '#social':     { module: 'social.js',     title: 'Social Media Planner', icon: '📱' },
    '#cms':        { module: 'cms.js',        title: 'Services Catalog & CMS Editor', icon: '📝' },
    '#finance':    { module: 'finance.js',    title: 'Financials & Expense Hub', icon: '💰' },
    '#hr':         { module: 'hr.js',         title: 'HR Ops & Roster Management', icon: '👨‍💼' },
    '#assets':     { module: 'assets.js',     title: 'Hardware Assets', icon: '📷' },
    '#tickets':    { module: 'tickets.js',    title: 'Support Desk Triage', icon: '🎟️' },
    '#automation': { module: 'automation.js', title: 'Bot Engine & Automation Logs', icon: '⚡' },
    '#leads':      { module: 'leads.js',      title: 'Leads Pipeline', icon: '🎯' },
    '#settings':   { module: 'settings.js',   title: 'Workspace Settings', icon: '⚙️' }
  };

  const loadedModules = {};

  document.addEventListener('DOMContentLoaded', async () => {
    await validateServerSession();
    hydrateUserBadge();
    initRouter();
  });

  async function validateServerSession() {
    try {
      const me = await APP_API.get('/auth/me');
      if (me && me.user) {
        localStorage.setItem('purple_user', JSON.stringify(me.user));
      }
    } catch (err) {
      console.warn('[PurpleOS Session] Server validation failed:', err);
    }
  }

  function hydrateUserBadge() {
    try {
      const rawUser = localStorage.getItem('purple_user');
      if (rawUser) {
        const user = JSON.parse(rawUser);
        const avatarEl = document.getElementById('userAvatar');
        const nameEl = document.getElementById('userName');
        const roleEl = document.getElementById('userRoleTag');

        if (avatarEl) avatarEl.textContent = (user.name || 'PB').substring(0, 2).toUpperCase();
        if (nameEl) nameEl.textContent = user.name || 'Admin User';
        if (roleEl) roleEl.textContent = user.role || user.accessLevel || 'Owner';
      }
    } catch (e) {
      console.warn('User badge hydration error:', e);
    }
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
        viewContainer.innerHTML = `
          <div class="card-glass" style="text-align:center; padding:3rem;">
            <div style="font-size:2rem; margin-bottom:0.5rem;">⚠️ Module Error</div>
            <div style="color:var(--text-muted);">Failed to render module: ${moduleName}</div>
          </div>
        `;
      }
    } catch (err) {
      console.error(`[PurpleOS Router] Error loading route ${hash}:`, err);
      viewContainer.innerHTML = `
        <div class="card-glass" style="text-align:center; padding:3rem;">
          <div style="font-size:2rem; margin-bottom:0.5rem;">❌ Failed to load page</div>
          <div style="color:var(--text-muted);">${err.message || 'Network error'}</div>
        </div>
      `;
      if (window.showToast) window.showToast(`Failed to load module: ${err.message}`, 'error');
    }
  }

  function loadModuleScript(moduleFile) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `/app/modules/${moduleFile}?v=${Date.now()}`;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Could not load /app/modules/${moduleFile}`));
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
})();
