/**
 * public/crew/crew.js
 * Crew Personal Workspace SPA Router
 */
(function initCrewApp() {
  const ROUTES = {
    '#home':         { module: 'home.js',         title: 'My Dashboard', icon: '🏠' },
    '#tasks':        { module: 'tasks.js',        title: 'My Tasks', icon: '📋' },
    '#deliverables': { module: 'deliverables.js', title: 'Submit Deliverable', icon: '📤' },
    '#calendar':     { module: 'calendar.js',     title: 'Content Calendar', icon: '📅' },
    '#tickets':      { module: 'tickets.js',      title: 'My Tickets', icon: '🎟️' },
    '#earnings':     { module: 'earnings.js',     title: 'Earnings & Payroll', icon: '💰' },
    '#leaderboard':  { module: 'leaderboard.js',  title: 'Leaderboard', icon: '🏆' },
    '#leaves':       { module: 'leaves.js',       title: 'Leave Requests', icon: '🌴' },
    '#eod':          { module: 'eod.js',          title: 'EOD Report', icon: '📝' },
    '#expenses':     { module: 'expenses.js',     title: 'Submit Expense', icon: '🧾' },
    '#profile':      { module: 'profile.js',      title: 'My Profile', icon: '👤' }
  };

  const loadedModules = {};

  document.addEventListener('DOMContentLoaded', async () => {
    hydrateUserBadge();
    initRouter();
  });

  async function hydrateUserBadge() {
    try {
      const rawUser = localStorage.getItem('purple_user');
      if (rawUser) {
        const user = JSON.parse(rawUser);
        const nameEl = document.getElementById('crewHeaderName');
        if (nameEl && user.name) nameEl.textContent = user.name;
      }
      // Async fetch to guarantee freshness and resolve deep links
      if (window.CREW_API) {
        const me = await window.CREW_API.getMe().catch(() => null);
        if (me && me.user) {
          const nameEl = document.getElementById('crewHeaderName');
          const finalName = me.user.name || me.user.profile?.name || 'Crew Member';
          if (nameEl) nameEl.textContent = finalName;
          localStorage.setItem('purple_user', JSON.stringify({ ...me.user, name: finalName }));
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
    document.title = `GRO10X OS — ${routeInfo.title || 'Crew'}`;

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
      viewContainer.innerHTML = `
        <div class="card-glass" style="text-align:center; padding:3rem 1.5rem; color:var(--text-muted);">
          <div style="font-size:2.5rem; margin-bottom:0.75rem;">⚠️</div>
          <div style="font-weight:700; color:var(--text-primary); font-size:1.1rem; margin-bottom:0.4rem;">Could not load this module</div>
          <div style="font-size:0.85rem; max-width:400px; margin:0 auto 1.25rem;">${err.message || 'An unexpected error occurred while loading content.'}</div>
          <button class="btn-primary" onclick="window.dispatchEvent(new HashChangeEvent('hashchange'))" style="font-size:0.85rem; padding:0.5rem 1.2rem; cursor:pointer;">
            🔄 Retry
          </button>
        </div>
      `;
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
    const icon = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : type === 'info' ? 'ℹ️' : '✅';
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = `<span>${icon}</span><span>${msg}</span>`;
    box.appendChild(t);
    setTimeout(() => t.remove(), 3500);
  };
})();
