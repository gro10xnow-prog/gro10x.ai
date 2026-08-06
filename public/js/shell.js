/**
 * public/js/shell.js
 * ─────────────────────────────────────────────────────────────────────────────
 * PurpleOS Shared Navigation & Page Shell Manager v2.0
 * Injects top header bar, sidebar navigation, mobile bottom nav, theme engine.
 * ─────────────────────────────────────────────────────────────────────────────
 */

(function initPurpleShell() {
  // 1. Theme Engine Initialization
  const savedTheme = localStorage.getItem('purple_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);

  // 2. IIFE Auth Guard
  const token = localStorage.getItem('sb-access-token') ||
                localStorage.getItem('purpleos_pin_token') ||
                localStorage.getItem('purple_token');
  if (!token && !window.location.pathname.startsWith('/auth')) {
    console.warn('[PurpleOS Shell] ⛔ No session token found. Redirecting to auth...');
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
  localStorage.setItem('purple_theme', newTheme);
  
  const themeBtn = document.getElementById('themeToggleBtn');
  if (themeBtn) {
    themeBtn.textContent = newTheme === 'dark' ? '🌙' : '☀️';
    themeBtn.title = `Switch to ${newTheme === 'dark' ? 'Light' : 'Dark'} Theme`;
  }
}

function renderHeader() {
  const headerContainer = document.getElementById('app-header');
  if (!headerContainer) return;

  const currentTheme = localStorage.getItem('purple_theme') || 'dark';

  headerContainer.className = 'top-header';
  headerContainer.innerHTML = `
    <div style="display: flex; align-items: center; gap: 0.8rem;">
      <a href="/pages/dashboard.html" class="brand-container">
        <div class="brand-logo">PB</div>
        <div>
          <div class="brand-title">PurpleOS</div>
          <div style="font-size: 0.68rem; color: var(--pink-accent); font-weight: 700; letter-spacing: 0.05em;">DIGITAL OPERATING SYSTEM</div>
        </div>
      </a>
    </div>

    <!-- Quick Search Command Trigger -->
    <div class="cmd-trigger-btn" onclick="toggleCommandCenter()" style="display: flex; align-items: center; gap: 0.6rem; padding: 0.45rem 1rem; background: var(--bg-input); border: 1px solid var(--border-color); border-radius: 12px; cursor: pointer; color: var(--text-muted); font-size: 0.82rem; font-weight: 500;">
      <span>🔍 Quick Search or Command...</span>
      <span style="padding: 0.15rem 0.45rem; background: var(--border-glow); border-radius: 6px; font-size: 0.72rem; font-weight: 800; color: var(--text-main);">Ctrl + K</span>
    </div>

    <div style="display: flex; align-items: center; gap: 0.85rem;">
      <!-- Theme Toggle Button -->
      <button class="theme-toggle-btn" id="themeToggleBtn" onclick="toggleTheme()" title="Toggle Light/Dark Theme">
        ${currentTheme === 'dark' ? '🌙' : '☀️'}
      </button>

      <!-- User Profile Badge (Clickable link to profile page) -->
      <a href="/pages/profile.html" class="user-profile-badge" title="Manage Profile & PIN">
        <div class="user-avatar" id="userAvatar">PB</div>
        <div class="user-info">
          <span class="user-name" id="userName">Staff User</span>
          <span class="user-role-tag" id="userRoleTag">Team Member</span>
        </div>
      </a>

      <button onclick="adminSignOut()" style="color: #f87171; background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 10px; font-size: 0.8rem; font-weight: 700; padding: 0.45rem 0.75rem; cursor: pointer; transition: all 0.2s;">🔓</button>
    </div>
  `;
}

function renderSidebar() {
  const sidebarContainer = document.getElementById('app-sidebar');
  if (!sidebarContainer) return;

  const currentPath = window.location.pathname;

  const navGroups = [
    {
      category: 'Core Operations',
      items: [
        { label: 'Dashboard Overview', icon: '📊', path: '/pages/dashboard.html' },
        { label: 'Project Hub', icon: '📋', path: '/pages/projects.html' },
        { label: 'Client CRM', icon: '👥', path: '/pages/clients.html' }
      ]
    },
    {
      category: 'Content Pipeline',
      items: [
        { label: 'Social Planner', icon: '📱', path: '/pages/social.html' },
        { label: 'Review Room V2', icon: '🎥', path: '/pages/reviewroom.html' },
        { label: 'Team & Attendance', icon: '👨‍💼', path: '/pages/team-admin.html' }
      ]
    },
    {
      category: 'Finance & Analytics',
      items: [
        { label: 'Agency Analytics', icon: '📈', path: '/pages/analytics.html' },
        { label: 'Financials & Expenses', icon: '💰', path: '/pages/finance.html' },
        { label: 'System Settings', icon: '⚙️', path: '/pages/settings.html' }
      ]
    }
  ];

  let html = `<nav class="sidebar-nav">`;

  navGroups.forEach(group => {
    html += `<div class="nav-category">${group.category}</div>`;
    group.items.forEach(item => {
      const isActive = currentPath.includes(item.path) || (item.path.includes('dashboard') && currentPath === '/admin');
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

  const mobileTabs = [
    { label: 'Home', icon: '📊', path: '/pages/dashboard.html' },
    { label: 'Projects', icon: '📋', path: '/pages/projects.html' },
    { label: 'Social', icon: '📱', path: '/pages/social.html' },
    { label: 'Finance', icon: '💰', path: '/pages/finance.html' },
    { label: 'Profile', icon: '🪪', path: '/pages/profile.html' }
  ];

  navEl.innerHTML = mobileTabs.map(tab => {
    const isActive = currentPath.includes(tab.path) || (tab.path.includes('dashboard') && currentPath === '/admin');
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
    let phone = localStorage.getItem('purple_user_phone') || '';

    // 1. Try parsed purple_user object
    const rawUser = localStorage.getItem('purple_user');
    if (rawUser) {
      try {
        const u = JSON.parse(rawUser);
        name = u.name;
        role = u.role || u.accessLevel;
        if (u.phone) phone = u.phone;
      } catch (e) {}
    }

    // 2. Fall back to individual keys
    if (!name) name = localStorage.getItem('purple_user_name');
    if (!role) role = localStorage.getItem('purple_user_role') || localStorage.getItem('purple_user_access');

    // 3. Fall back for Executive / Owner phone numbers (e.g. 01708459008)
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.includes('1708459008') || cleanPhone.includes('1612309290')) {
      if (!name || name === 'Staff User') name = 'Managing Director';
      if (!role || role === 'Team Member') role = 'Executive / Owner';
    }

    // Default fallbacks
    if (!name) name = 'Staff User';
    if (!role) role = 'Team Member';

    // Store normalized user object back to localStorage
    const userObj = { name, role, phone: cleanPhone, email: localStorage.getItem('purple_user_email') || 'contact@purpleos.agency' };
    localStorage.setItem('purple_user', JSON.stringify(userObj));

    // Hydrate UI elements
    const nameEl = document.getElementById('userName');
    const roleEl = document.getElementById('userRoleTag');
    const avatarEl = document.getElementById('userAvatar');

    if (nameEl) nameEl.textContent = name;
    if (roleEl) roleEl.textContent = role;
    if (avatarEl) avatarEl.textContent = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'PB';

  } catch (e) {
    console.warn('[PurpleOS Shell] User hydration error:', e);
  }
}

function adminSignOut() {
  localStorage.removeItem('sb-access-token');
  localStorage.removeItem('purpleos_pin_token');
  localStorage.removeItem('purple_token');
  localStorage.removeItem('purple_user');
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

