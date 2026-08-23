/**
 * public/client/client.js
 * Client Portal SPA Hash Router
 */
(function initClientApp() {
  const ROUTES = {
    '#home':     { module: 'home.js',     title: 'Account Overview', icon: '🏠' },
    '#retainer': { module: 'retainer.js', title: 'Retainer Health & Quota', icon: '⚡' },
    '#review':   { module: 'review.js',   title: 'Content Review Room', icon: '🎬' },
    '#campaign': { module: 'campaign.js', title: 'Campaign Schedule', icon: '📋' },
    '#brief':    { module: 'brief.js',    title: 'Submit Campaign Brief', icon: '📝' },
    '#invoices': { module: 'invoices.js', title: 'Billing & Invoices', icon: '💳' },
    '#tickets':  { module: 'tickets.js',  title: 'Support Requests', icon: '🎟️' },
    '#account':  { module: 'account.js',  title: 'My Account & Contacts', icon: '👤' }
  };

  const loadedModules = {};

  document.addEventListener('DOMContentLoaded', async () => {
    hydrateUserBadge();
    initRouter();
  });

  function hydrateUserBadge() {
    try {
      const rawUser = localStorage.getItem('purple_user');
      if (rawUser) {
        const user = JSON.parse(rawUser);
        const displayName = user.company || user.name || 'Client Partner';
        const initial = (displayName.charAt(0) || 'P').toUpperCase();

        const nameEl = document.getElementById('clientHeaderName');
        const subEl = document.getElementById('clientHeaderSub');
        const deskNameEl = document.getElementById('deskClientName');
        const deskSubEl = document.getElementById('deskClientSub');
        const deskLogo = document.getElementById('deskBrandLogo');
        const mobLogo = document.getElementById('mobBrandLogo');

        if (nameEl) nameEl.textContent = displayName;
        if (deskNameEl) deskNameEl.textContent = displayName;
        if (subEl) subEl.textContent = `${user.pocRole ? user.pocRole.toUpperCase() + ' · ' : ''}${user.company ? user.company.toUpperCase() : 'PURPLEOS CLIENT'}`;
        if (deskSubEl) deskSubEl.textContent = `${user.pocRole ? user.pocRole.toUpperCase() + ' · ' : ''}VERIFIED WORKSPACE`;
        if (deskLogo) deskLogo.textContent = initial;
        if (mobLogo) mobLogo.textContent = initial;
      }
    } catch (e) {}
  }

  function initRouter() {
    window.addEventListener('hashchange', handleRoute);
    handleRoute();
  }

  async function handleRoute() {
    let hash = window.location.hash || '#home';
    if (!ROUTES[hash]) hash = '#home';

    const routeInfo = ROUTES[hash];

    // Sync Desktop Sidebar Links
    document.querySelectorAll('.desktop-nav-link').forEach(link => {
      if (link.getAttribute('href') === hash) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Sync Mobile Bottom Nav Items
    document.querySelectorAll('.bottom-nav-item').forEach(link => {
      if (link.getAttribute('href') === hash) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    const viewContainer = document.getElementById('client-view');
    if (!viewContainer) return;

    viewContainer.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:1.25rem; padding:1.5rem 0;">
        <div class="skeleton" style="height:120px; width:100%; border-radius:16px;"></div>
        <div class="skeleton" style="height:260px; width:100%; border-radius:16px;"></div>
      </div>
    `;

    try {
      if (!loadedModules[routeInfo.module]) {
        await loadModuleScript(routeInfo.module);
        loadedModules[routeInfo.module] = true;
      }

      const moduleName = routeInfo.module.replace('.js', '');
      const renderFn = window.CLIENT_MODULES && window.CLIENT_MODULES[moduleName];

      if (typeof renderFn === 'function') {
        viewContainer.innerHTML = '';
        viewContainer.className = 'client-main-content content-area view-fade-in';
        await renderFn(viewContainer);
      }
    } catch (err) {
      console.error(`[Client Router] Error loading ${hash}:`, err);
      viewContainer.innerHTML = `
        <div class="card-glass" style="text-align:center; padding:3rem;">
          <div style="font-size:2rem; margin-bottom:0.5rem;">❌ Failed to load view</div>
          <div style="color:var(--text-muted);">${err.message || 'Network error'}</div>
        </div>
      `;
      if (window.showClientToast) window.showClientToast(`Failed to load ${hash}: ${err.message}`, 'error');
    }
  }

  function loadModuleScript(file) {
    return new Promise((resolve, reject) => {
      const scriptId = `script-mod-${file.replace('.js', '')}`;
      const existing = document.getElementById(scriptId);
      if (existing) {
        return resolve();
      }
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = `/client/modules/${file}?v=2.0`;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Could not load module: ${file}`));
      document.body.appendChild(script);
    });
  }

  window.showClientToast = function(msg, type = 'success') {
    let box = document.getElementById('toastContainer');
    if (!box) {
      box = document.createElement('div');
      box.className = 'toast-container';
      document.body.appendChild(box);
    }
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = `<span>${type === 'success' ? '✅' : 'ℹ️'}</span><span>${msg}</span>`;
    box.appendChild(t);
    setTimeout(() => t.remove(), 3500);
  };

  // Global HTML Sanitizer to prevent XSS in client modules
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
