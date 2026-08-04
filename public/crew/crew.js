/**
 * public/crew/crew.js
 * Crew Personal Workspace SPA Router
 */
(function initCrewApp() {
  const ROUTES = {
    '#home':     { module: 'home.js',     title: 'My Dashboard', icon: '🏠' },
    '#tasks':    { module: 'tasks.js',    title: 'My Tasks', icon: '📋' },
    '#earnings': { module: 'earnings.js', title: 'Earnings & EOD', icon: '💰' },
    '#leaves':   { module: 'leaves.js',   title: 'Leave Requests', icon: '🌴' },
    '#profile':  { module: 'profile.js',  title: 'My Profile', icon: '👤' }
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
        const nameEl = document.getElementById('crewHeaderName');
        if (nameEl) nameEl.textContent = user.name || 'Crew Member';
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

    const viewContainer = document.getElementById('crew-view');
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
      const renderFn = window.CREW_MODULES && window.CREW_MODULES[moduleName];

      if (typeof renderFn === 'function') {
        viewContainer.innerHTML = '';
        await renderFn(viewContainer);
      }
    } catch (err) {
      console.error(`[Crew Router] Error loading ${hash}:`, err);
    }
  }

  function loadModuleScript(file) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `/crew/modules/${file}`;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Could not load ${file}`));
      document.body.appendChild(script);
    });
  }

  window.showCrewToast = function(msg, type = 'success') {
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
