/**
 * public/manager/manager.js
 * Department Manager Portal SPA Router
 */
(function initManagerApp() {
  const ROUTES = {
    '#overview': { module: 'overview.js', title: 'Department Overview', icon: '📊' },
    '#tasks':    { module: 'tasks.js',    title: 'Department Pipeline', icon: '📋' },
    '#team':     { module: 'team.js',     title: 'Team Roster', icon: '👥' },
    '#leaves':   { module: 'leaves.js',   title: 'Leave Approvals', icon: '🌴' },
    '#tickets':  { module: 'tickets.js',  title: 'Ticket Triage', icon: '🎟️' }
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
        const nameEl = document.getElementById('mgrHeaderName');
        if (nameEl) nameEl.textContent = user.name || 'Department Manager';
      }
    } catch (e) {}
  }

  function initRouter() {
    window.addEventListener('hashchange', handleRoute);
    handleRoute();
  }

  async function handleRoute() {
    let hash = window.location.hash || '#overview';
    if (!ROUTES[hash]) hash = '#overview';

    const routeInfo = ROUTES[hash];

    document.querySelectorAll('.nav-item').forEach(link => {
      if (link.getAttribute('href') === hash) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    const viewContainer = document.getElementById('manager-view');
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
      const renderFn = window.MANAGER_MODULES && window.MANAGER_MODULES[moduleName];

      if (typeof renderFn === 'function') {
        viewContainer.innerHTML = '';
        await renderFn(viewContainer);
      }
    } catch (err) {
      console.error(`[Manager Router] Error loading ${hash}:`, err);
    }
  }

  function loadModuleScript(file) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `/manager/modules/${file}`;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Could not load ${file}`));
      document.body.appendChild(script);
    });
  }

  window.showManagerToast = function(msg, type = 'success') {
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
})();
