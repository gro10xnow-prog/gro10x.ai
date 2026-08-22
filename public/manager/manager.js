/**
 * public/manager/manager.js
 * Department Manager Portal SPA Router
 */
(function initManagerApp() {
  const ROUTES = {
    '#overview': { module: 'overview.js', title: 'Department Overview', icon: '📊' },
    '#tasks':    { module: 'tasks.js',    title: 'Department Pipeline', icon: '📋' },
    '#finance':  { module: 'finance.js',  title: 'Financial Command', icon: '💰' },
    '#team':     { module: 'team.js',     title: 'Team Roster', icon: '👥' },
    '#leaves':   { module: 'leaves.js',   title: 'Leave Approvals', icon: '🌴' },
    '#tickets':  { module: 'tickets.js',  title: 'Ticket Triage', icon: '🎟️' },
    '#tech':     { module: 'tech.js',     title: 'System Diagnostics', icon: '🛠️' }
  };

  const loadedModules = {};

  document.addEventListener('DOMContentLoaded', async () => {
    hydrateUserBadge();
    applyRoleBasedNavigation();
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

  function applyRoleBasedNavigation() {
    try {
      const rawUser = localStorage.getItem('purple_user');
      const user = rawUser ? JSON.parse(rawUser) : {};
      const role = (user.role || '').toLowerCase();
      const access = (user.accessLevel || '').toLowerCase();

      const isFinance = role.includes('finance') || access.includes('finance');
      const isTech = role.includes('tech') || user.id === 'PBD-000' || role.includes('admin');
      const isCreative = role.includes('art') || role.includes('creative') || role.includes('design');
      const isExecutive = access.includes('owner') || role.includes('director') || role.includes('head');

      document.querySelectorAll('.nav-item').forEach(el => {
        const rolesAttr = el.getAttribute('data-roles');
        if (!rolesAttr) return;

        const allowed = rolesAttr.split(',').map(r => r.trim());
        let show = false;

        if (allowed.includes('all') || isExecutive) {
          show = true;
        } else if (isFinance && allowed.includes('finance')) {
          show = true;
        } else if (isTech && allowed.includes('tech')) {
          show = true;
        } else if (isCreative && allowed.includes('creative')) {
          show = true;
        } else if (allowed.includes('operations')) {
          show = true;
        }

        el.style.display = show ? 'flex' : 'none';
      });
    } catch (e) {
      console.warn('Navigation role filtering error:', e);
    }
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
