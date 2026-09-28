/**
 * public/client/client.js
 * Client Portal SPA Hash Router
 */
(function initClientApp() {
  window.escapeHTML = window.escapeHTML || function(s) {
    return s ? String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') : '';
  };
  const ROUTES = {
    '#home':     { module: 'home.js',     title: 'Account Overview', icon: '🏠' },
    '#retainer': { module: 'retainer.js', title: 'Retainer Health & Quota', icon: '⚡' },
    '#review':   { module: 'review.js',   title: 'Content Review Room', icon: '🎬' },
    '#campaign': { module: 'campaign.js', title: 'Campaign Schedule', icon: '📋' },
    '#brief':    { module: 'brief.js',    title: 'Submit Campaign Brief', icon: '📝' },
    '#lockin':   { module: 'lockin.js',   title: 'Sprint Lock-In & Handover', icon: '🔒' },
    '#invoices': { module: 'invoices.js', title: 'Billing & Invoices', icon: '💳' },
    '#tickets':  { module: 'tickets.js',  title: 'Support Requests', icon: '🎟️' },
    '#account':  { module: 'account.js',  title: 'My Account & Contacts', icon: '👤' }
  };

  const ROUTE_ALIASES = {
    '#overview':  '#home',
    '#dashboard': '#home',
    '#sprint':    '#lockin',
    '#handover':  '#lockin',
    '#billing':   '#invoices',
    '#support':   '#tickets'
  };

  window.ROUTES = ROUTES;
  window.ROUTE_ALIASES = ROUTE_ALIASES;

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
        if (subEl) subEl.textContent = `${user.pocRole ? user.pocRole.toUpperCase() + ' · ' : ''}${user.company ? user.company.toUpperCase() : 'GRO10X CLIENT'}`;
        if (deskSubEl) deskSubEl.textContent = `${user.pocRole ? user.pocRole.toUpperCase() + ' · ' : ''}VERIFIED WORKSPACE`;
        if (deskLogo) deskLogo.textContent = initial;
        if (mobLogo) mobLogo.textContent = initial;
      }
    } catch (e) {}
  }

  let routeNavSeq = 0;
  let currentRenderedHash = null;
  const moduleLoadPromises = {};

  function initRouter() {
    window.addEventListener('hashchange', handleRoute);
    handleRoute();
  }

  async function handleRoute() {
    const currentSeq = ++routeNavSeq;
    let rawHash = window.location.hash || '#home';
    let hash = rawHash;

    if (ROUTE_ALIASES[hash]) {
      hash = ROUTE_ALIASES[hash];
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, '', hash);
      } else {
        window.location.hash = hash;
      }
    }

    if (!ROUTES[hash]) {
      hash = '#home';
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, '', '#home');
      }
    }

    const routeInfo = ROUTES[hash];

    // Sync Desktop Sidebar Links
    document.querySelectorAll('.desktop-nav-link').forEach(link => {
      const linkHash = link.getAttribute('href') || link.getAttribute('data-hash');
      if (linkHash === hash) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Sync Mobile Bottom Nav Items (4 primary)
    let isPrimaryRoute = false;
    document.querySelectorAll('.bottom-nav-item:not(#btnMoreSheet)').forEach(link => {
      const linkHash = link.getAttribute('href') || link.getAttribute('data-hash');
      if (linkHash === hash) {
        link.classList.add('active');
        isPrimaryRoute = true;
      } else {
        link.classList.remove('active');
      }
    });

    // Sync Mobile "More" Button
    const btnMore = document.getElementById('btnMoreSheet');
    if (btnMore) {
      if (!isPrimaryRoute && ROUTES[hash]) {
        btnMore.classList.add('active');
      } else {
        btnMore.classList.remove('active');
      }
    }

    // Sync Mobile Bottom Sheet Drawer Links
    document.querySelectorAll('#mobileBottomSheet a').forEach(link => {
      const linkHash = link.getAttribute('href') || link.getAttribute('data-hash');
      if (linkHash === hash) {
        link.classList.add('active');
        link.style.borderColor = 'rgba(236,72,153,0.5)';
        link.style.background = 'rgba(236,72,153,0.12)';
      } else {
        link.classList.remove('active');
        link.style.borderColor = '';
        link.style.background = '';
      }
    });

    const viewContainer = document.getElementById('client-view');
    if (!viewContainer) return;

    // If current hash is already fully mounted and rendered without skeleton, keep it intact
    if (currentRenderedHash === hash && viewContainer.children.length > 0 && !viewContainer.querySelector('.skeleton')) {
      return;
    }

    viewContainer.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:1.25rem; padding:1.5rem 0;">
        <div class="skeleton" style="height:120px; width:100%; border-radius:16px;"></div>
        <div class="skeleton" style="height:260px; width:100%; border-radius:16px;"></div>
      </div>
    `;

    try {
      await loadModuleScript(routeInfo.module);

      if (currentSeq !== routeNavSeq) {
        const latestHash = window.location.hash || '#home';
        if (latestHash !== hash) {
          // Navigation was genuinely superseded by a different route
          return;
        }
      }

      const moduleName = routeInfo.module.replace('.js', '');
      const renderFn = window.CLIENT_MODULES && window.CLIENT_MODULES[moduleName];

      if (typeof renderFn === 'function') {
        viewContainer.innerHTML = '';
        viewContainer.className = 'client-main-content content-area view-fade-in';
        await renderFn(viewContainer);
        currentRenderedHash = hash;
      }
    } catch (err) {
      if (currentSeq !== routeNavSeq) {
        const latestHash = window.location.hash || '#home';
        if (latestHash !== hash) return;
      }
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
    const moduleName = file.replace('.js', '');
    if (window.CLIENT_MODULES && window.CLIENT_MODULES[moduleName]) {
      return Promise.resolve();
    }
    if (moduleLoadPromises[file]) {
      return moduleLoadPromises[file];
    }
    moduleLoadPromises[file] = new Promise((resolve, reject) => {
      const scriptId = `script-mod-${moduleName}`;
      const existing = document.getElementById(scriptId);
      if (existing) {
        if (window.CLIENT_MODULES && window.CLIENT_MODULES[moduleName]) {
          return resolve();
        }
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => {
          delete moduleLoadPromises[file];
          reject(new Error(`Could not load module: ${file}`));
        }, { once: true });
        return;
      }
      const script = document.createElement('script');
      script.id = scriptId;
      script.setAttribute('data-module', moduleName);
      script.src = `/client/modules/${file}?v=3.0`;
      script.onload = () => resolve();
      script.onerror = () => {
        delete moduleLoadPromises[file];
        reject(new Error(`Could not load module: ${file}`));
      };
      document.body.appendChild(script);
    });
    return moduleLoadPromises[file];
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
