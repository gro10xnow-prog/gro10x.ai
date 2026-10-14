/**
 * public/js/shell.js
 * ─────────────────────────────────────────────────────────────────────────────
 * GRO10X OS Shared Navigation & Page Shell Manager v3.0
 * Injects top header bar, sidebar navigation, mobile bottom nav, theme engine.
 * ─────────────────────────────────────────────────────────────────────────────
 */

(function initGRO10XShell() {
  // 1. Theme Engine Initialization
  const savedTheme = localStorage.getItem('gro10x_theme') || localStorage.getItem('purple_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);

  // 2. IIFE Auth Guard
  const token = localStorage.getItem('gro10x_token') ||
                sessionStorage.getItem('gro10x_token') ||
                localStorage.getItem('jwt_token') ||
                localStorage.getItem('sb-access-token');
  if (!token && !window.location.pathname.startsWith('/auth')) {
    console.warn('[GRO10X Shell] ⛔ No session token found. Redirecting to auth...');
    window.location.replace('/auth?redirect=' + encodeURIComponent(window.location.pathname));
    return;
  }

  // 3. Inject CSS if not already present
  if (!document.querySelector('link[href*="shell.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/css/shell.css';
    document.head.appendChild(link);
  }

  // 4. Render Header, Sidebar, Mobile Nav when DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    renderHeader();
    renderSidebar();
    renderMobileBottomNav();
    hydrateUserInfo();
  });
})();

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('gro10x_theme', newTheme);
  localStorage.setItem('purple_theme', newTheme);
  
  const themeBtn = document.getElementById('themeToggleBtn');
  if (themeBtn) {
    themeBtn.textContent = newTheme === 'dark' ? '🌙' : '☀️';
    themeBtn.title = `Switch to ${newTheme === 'dark' ? 'Light' : 'Dark'} Theme`;
  }
}

// Global safe command center invoker
window.toggleCommandCenter = window.toggleCommandCenter || function() {
  if (typeof openCommandPalette === 'function') {
    openCommandPalette();
  } else if (typeof toggleCommandCenterModal === 'function') {
    toggleCommandCenterModal();
  } else {
    window.location.href = '/app#dashboard';
  }
};

function renderHeader() {
  const headerContainer = document.getElementById('app-header');
  if (!headerContainer) return;

  const currentTheme = localStorage.getItem('gro10x_theme') || localStorage.getItem('purple_theme') || 'dark';

  headerContainer.className = 'top-header';
  headerContainer.innerHTML = `
    <div style="display: flex; align-items: center; gap: 0.8rem;">
      <a href="/app#dashboard" class="brand-container" style="display:flex; align-items:center; gap:0.6rem; text-decoration:none;">
        <div class="brand-logo" style="background:var(--brand-primary, #00df89); color:#070b12; font-weight:900; width:34px; height:34px; border-radius:10px; display:flex; align-items:center; justify-content:center;">⚡</div>
        <div>
          <div class="brand-title" style="font-family:var(--font-heading); font-weight:900; font-size:1.1rem; color:var(--text-primary, #f8fafc); line-height:1;">GRO10X</div>
          <div style="font-size: 0.65rem; color: var(--brand-primary, #00df89); font-weight: 800; letter-spacing: 0.06em;">AI GROWTH AGENCY</div>
        </div>
      </a>
    </div>

    <!-- Quick Search Command Trigger -->
    <div class="cmd-trigger-btn" onclick="toggleCommandCenter()" style="display: flex; align-items: center; gap: 0.6rem; padding: 0.45rem 1rem; background: var(--surface-1, #0f172a); border: 1px solid var(--border-subtle, #1e293b); border-radius: 12px; cursor: pointer; color: var(--text-muted); font-size: 0.82rem; font-weight: 500;">
      <span>🔍 Quick Search or Command...</span>
      <span style="padding: 0.15rem 0.45rem; background: rgba(0,223,137,0.15); border-radius: 6px; font-size: 0.72rem; font-weight: 800; color: var(--brand-primary, #00df89);">Ctrl + K</span>
    </div>

    <div style="display: flex; align-items: center; gap: 0.85rem;">
      <!-- Theme Toggle Button -->
      <button class="theme-toggle-btn" id="themeToggleBtn" onclick="toggleTheme()" title="Toggle Light/Dark Theme">
        ${currentTheme === 'dark' ? '🌙' : '☀️'}
      </button>

      <!-- User Profile Badge (Clickable link to Settings) -->
      <a href="/app#settings" class="user-profile-badge" title="Manage Settings">
        <div class="user-avatar" id="userAvatar" style="background:var(--brand-primary, #00df89); color:#070b12; font-weight:800;">GX</div>
        <div class="user-info">
          <span class="user-name" id="userName">Admin</span>
          <span class="user-role-tag" id="userRoleTag">Owner</span>
        </div>
      </a>

      <button onclick="adminSignOut()" style="color: #f87171; background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 10px; font-size: 0.8rem; font-weight: 700; padding: 0.45rem 0.75rem; cursor: pointer; transition: all 0.2s;" title="Sign Out">🔓</button>
    </div>
  `;
}

function renderSidebar() {
  const sidebarContainer = document.getElementById('app-sidebar');
  if (!sidebarContainer) return;

  const currentPath = window.location.pathname;
  const currentHash = window.location.hash;

  const navGroups = [
    {
      category: 'Core Operations',
      items: [
        { label: 'Dashboard Overview', icon: '📊', path: '/app#dashboard' },
        { label: 'Project Pipeline Hub', icon: '📋', path: '/app#kanban' },
        { label: 'Client CRM', icon: '👥', path: '/app#crm' }
      ]
    },
    {
      category: 'Content Pipeline',
      items: [
        { label: 'Social Planner', icon: '📱', path: '/app#social' },
        { label: 'Review Room V2', icon: '🎥', path: '/reviewroom.html' },
        { label: 'Team & Attendance', icon: '👨‍💼', path: '/app#hr' }
      ]
    },
    {
      category: 'Finance & Analytics',
      items: [
        { label: 'Agency Analytics', icon: '📈', path: '/app#analytics' },
        { label: 'Financials & Expenses', icon: '💰', path: '/app#finance' },
        { label: 'System Settings', icon: '⚙️', path: '/app#settings' }
      ]
    }
  ];

  let html = `<nav class="sidebar-nav">`;

  navGroups.forEach(group => {
    html += `<div class="nav-category">${group.category}</div>`;
    group.items.forEach(item => {
      const isActive = (item.path === '/reviewroom.html' && currentPath.includes('reviewroom')) ||
                       (currentPath.includes('/app') && currentHash && item.path.includes(currentHash));
      html += `
        <a href="${item.path}" class="nav-item ${isActive ? 'active' : ''}">
          <span class="icon">${item.icon}</span>
          <span>${item.label}</span>
        </a>
      `;
    });
  });

  html += `</nav>`;
  sidebarContainer.innerHTML = html;
}

function renderMobileBottomNav() {
  let navEl = document.getElementById('mobile-bottom-nav-bar');
  if (!navEl) {
    navEl = document.createElement('div');
    navEl.id = 'mobile-bottom-nav-bar';
    navEl.className = 'mobile-bottom-nav';
    document.body.appendChild(navEl);
  }

  const currentPath = window.location.pathname;
  const currentHash = window.location.hash;

  const mobileTabs = [
    { label: 'Home', icon: '📊', path: '/app#dashboard' },
    { label: 'Projects', icon: '📋', path: '/app#kanban' },
    { label: 'Review', icon: '🎬', path: '/reviewroom.html' },
    { label: 'Social', icon: '📱', path: '/app#social' },
    { label: 'Finance', icon: '💰', path: '/app#finance' }
  ];

  navEl.innerHTML = mobileTabs.map(tab => {
    const isActive = (tab.path === '/reviewroom.html' && currentPath.includes('reviewroom')) ||
                     (currentPath.includes('/app') && currentHash && tab.path.includes(currentHash));
    return `
      <a href="${tab.path}" class="mobile-nav-btn ${isActive ? 'active' : ''}">
        <span class="nav-icon">${tab.icon}</span>
        <span>${tab.label}</span>
      </a>
    `;
  }).join('');
}

function hydrateUserInfo() {
  try {
    let name = '';
    let role = '';
    let phone = localStorage.getItem('gro10x_user_phone') || localStorage.getItem('purple_user_phone') || '';

    // 1. Try parsed gro10x_user or purple_user object
    const rawUser = localStorage.getItem('gro10x_user') || localStorage.getItem('purple_user');
    if (rawUser) {
      try {
        const u = JSON.parse(rawUser);
        name = u.name;
        role = u.role || u.accessLevel;
        if (u.phone) phone = u.phone;
      } catch (e) {}
    }

    // 2. Fall back to individual keys
    if (!name) name = localStorage.getItem('gro10x_user_name') || localStorage.getItem('purple_user_name');
    if (!role) role = localStorage.getItem('gro10x_user_role') || localStorage.getItem('purple_user_role') || localStorage.getItem('purple_user_access');

    // 3. Fall back for Executive / Owner phone numbers (e.g. 01708459008)
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.includes('1708459008') || cleanPhone.includes('1612309290')) {
      if (!name || name === 'Staff User') name = 'Managing Director';
      if (!role || role === 'Team Member') role = 'Executive / Owner';
    }

    // Default fallbacks
    if (!name) name = 'Admin User';
    if (!role) role = 'Owner';

    // Store normalized user object back to localStorage
    const userObj = { name, role, phone: cleanPhone, email: localStorage.getItem('gro10x_user_email') || localStorage.getItem('purple_user_email') || 'gro10xnow@gmail.com' };
    localStorage.setItem('gro10x_user', JSON.stringify(userObj));

    // Hydrate UI elements
    const nameEl = document.getElementById('userName');
    const roleEl = document.getElementById('userRoleTag');
    const avatarEl = document.getElementById('userAvatar');

    if (nameEl) nameEl.textContent = name;
    if (roleEl) roleEl.textContent = role;
    if (avatarEl) avatarEl.textContent = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'GX';

  } catch (e) {
    console.warn('[GRO10X Shell] User hydration error:', e);
  }
}

function adminSignOut() {
  if (window.GRO10XAuth && typeof window.GRO10XAuth.logout === 'function') {
    window.GRO10XAuth.logout('/auth');
    return;
  }
  localStorage.removeItem('gro10x_token');
  sessionStorage.removeItem('gro10x_token');
  localStorage.removeItem('jwt_token');
  localStorage.removeItem('sb-access-token');
  localStorage.removeItem('gro10x_user');
  localStorage.removeItem('purple_user');
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('sb-') || k.includes('token'))) {
        localStorage.removeItem(k);
      }
    }
  } catch (_) {}
  window.location.href = '/auth';
}

// Global Toast Notification System (Delegate to unified components.js showToast)
window.showShellToast = function(message, type = 'info') {
  if (typeof window.showToast === 'function') {
    window.showToast(message, type);
  } else {
    let container = document.getElementById('shell-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'shell-toast-container';
      container.style.cssText = 'position:fixed;bottom:5rem;right:1.5rem;z-index:99999;display:flex;flex-direction:column;gap:0.5rem;';
      document.body.appendChild(container);
    }
    const colors = { success: '#10b981', error: '#ef4444', info: '#ec4899' };
    const toast = document.createElement('div');
    toast.style.cssText = `background:var(--surface-2, #181822);border:1px solid ${colors[type]||colors.info};color:var(--text-primary, #fff);padding:0.75rem 1.1rem;border-radius:14px;font-size:0.85rem;font-weight:700;font-family:inherit;max-width:340px;backdrop-filter:blur(12px);box-shadow:var(--shadow-elevated);transition:all 0.25s ease;`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity='0'; toast.style.transform='translateY(8px)'; setTimeout(()=>toast.remove(),250); }, 4000);
  }
};

// Global Keyboard & Modal Listener (Close modals on Escape key or backdrop click)
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const activeModals = document.querySelectorAll('.modal-overlay.active, .cmd-backdrop.active');
    activeModals.forEach(modal => {
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
    });
  }
});

document.addEventListener('click', (e) => {
  if (e.target && (e.target.classList.contains('modal-overlay') || e.target.classList.contains('cmd-backdrop'))) {
    e.target.classList.remove('active');
    e.target.setAttribute('aria-hidden', 'true');
  }
});
