/**
 * public/client/client.js
 * Client Portal SPA Hash Router
 */
(function initClientApp() {
  const ROUTES = {
    '#home':     { module: 'home.js',     title: 'Account Overview', icon: '🏠' },
    '#review':   { module: 'review.js',   title: 'Content Review Room', icon: '🎬' },
    '#campaign': { module: 'campaign.js', title: 'Campaign Schedule', icon: '📋' },
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
        const nameEl = document.getElementById('clientHeaderName');
        const subEl = document.getElementById('clientHeaderSub');
        if (nameEl) {
          nameEl.textContent = user.name || user.company || 'Client Partner';
        }
        if (subEl) {
          subEl.textContent = `${user.pocRole ? user.pocRole.toUpperCase() + ' · ' : ''}${user.company ? user.company.toUpperCase() : 'PURPLEOS CLIENT PORTAL'}`;
        }
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
      <div style="display:flex; flex-direction:column; gap:1rem; padding:1rem;">
        <div class="skeleton" style="height:140px; width:100%;"></div>
        <div class="skeleton" style="height:250px; width:100%;"></div>
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
      const script = document.createElement('script');
      script.src = `/client/modules/${file}`;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Could not load ${file}`));
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
