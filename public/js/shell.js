/**
 * public/js/shell.js
 * ─────────────────────────────────────────────────────────────────────────────
 * PurpleOS Shared Navigation & Page Shell Manager.
 * Injects top header bar, sidebar navigation, and performs Auth Guard checks.
 * ─────────────────────────────────────────────────────────────────────────────
 */

(function initPurpleShell() {
  // 1. IIFE Auth Guard
  const token = localStorage.getItem('sb-access-token') ||
                localStorage.getItem('purpleos_pin_token') ||
                localStorage.getItem('purple_token');
  if (!token && !window.location.pathname.startsWith('/auth')) {
    console.warn('[PurpleOS Shell] ⛔ No session token found. Redirecting to auth...');
    window.location.replace('/auth?redirect=' + encodeURIComponent(window.location.pathname));
    return;
  }

  // 2. Inject CSS if not already present
  if (!document.querySelector('link[href*="shell.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/css/shell.css';
    document.head.appendChild(link);
  }

  // 3. Render Header & Sidebar when DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    renderHeader();
    renderSidebar();
    hydrateUserInfo();
  });
})();

function renderHeader() {
  const headerContainer = document.getElementById('app-header');
  if (!headerContainer) return;

  headerContainer.className = 'top-header';
  headerContainer.innerHTML = `
    <div style="display: flex; align-items: center; gap: 0.8rem;">
      <div class="brand-container">
        <div class="brand-logo">PB</div>
        <div>
          <div class="brand-title">PurpleOS</div>
          <div style="font-size: 0.72rem; color: var(--purple-light); font-weight: 500;">Digital Agency Operating System v1.1</div>
        </div>
      </div>
    </div>

    <!-- Quick Search Command Trigger -->
    <div class="cmd-trigger-btn" onclick="toggleCommandCenter()" style="display: flex; align-items: center; gap: 0.6rem; padding: 0.45rem 1rem; background: rgba(9,9,11,0.6); border: 1px solid rgba(168,85,247,0.3); border-radius: 12px; cursor: pointer; color: #a1a1aa; font-size: 0.85rem;">
      <span>🔍 Quick Search or Command...</span>
      <span style="padding: 0.15rem 0.45rem; background: rgba(255,255,255,0.08); border-radius: 6px; font-size: 0.75rem; font-weight: 700; color: #c084fc;">Ctrl + K</span>
    </div>

    <div style="display: flex; align-items: center; gap: 1.25rem;">
      <div class="system-status" id="systemStatusBar">
        <div class="status-dot"></div>
        <span id="systemStatusText" style="font-size: 0.8rem; color: #34d399; font-weight: 600;">🟢 PurpleOS Active</span>
      </div>

      <div class="user-profile-badge">
        <div class="user-avatar" id="userAvatar">PB</div>
        <div class="user-info">
          <span class="user-name" id="userName">Staff User</span>
          <span class="user-role-tag" id="userRoleTag">Team Member</span>
        </div>
      </div>

      <button onclick="adminSignOut()" style="color: #f87171; background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.3); border-radius: 10px; font-size: 0.825rem; font-weight: 600; padding: 0.4rem 0.75rem; cursor: pointer; transition: all 0.2s;">🔓 Sign Out</button>
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
      category: 'Finance & Admin',
      items: [
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

function hydrateUserInfo() {
  try {
    const rawUser = localStorage.getItem('purple_user');
    if (rawUser) {
      const user = JSON.parse(rawUser);
      const nameEl = document.getElementById('userName');
      const roleEl = document.getElementById('userRoleTag');
      const avatarEl = document.getElementById('userAvatar');

      if (nameEl) nameEl.textContent = user.name || 'Team Member';
      if (roleEl) roleEl.textContent = user.role || user.accessLevel || 'Specialist';
      if (avatarEl) avatarEl.textContent = (user.name || 'PB').substring(0, 2).toUpperCase();
    }
  } catch (e) {}
}

function adminSignOut() {
  localStorage.removeItem('sb-access-token');
  localStorage.removeItem('purpleos_pin_token');
  localStorage.removeItem('purple_token');
  localStorage.removeItem('purple_user');
  window.location.href = '/auth';
}

// Global Toast Notification System (available across all shell pages)
window.showShellToast = function(message, type = 'info') {
  let container = document.getElementById('shell-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'shell-toast-container';
    container.style.cssText = 'position:fixed;bottom:1.5rem;right:1.5rem;z-index:99999;display:flex;flex-direction:column;gap:0.5rem;';
    document.body.appendChild(container);
  }
  const colors = { success: '#34d399', error: '#f87171', info: '#c084fc' };
  const toast = document.createElement('div');
  toast.style.cssText = `background:rgba(18,18,22,0.96);border:1px solid ${colors[type]||colors.info};color:#fff;padding:0.75rem 1.1rem;border-radius:12px;font-size:0.85rem;font-weight:600;font-family:inherit;max-width:340px;backdrop-filter:blur(8px);box-shadow:0 4px 20px rgba(0,0,0,0.5);transition:all 0.25s ease;`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity='0'; toast.style.transform='translateY(8px)'; setTimeout(()=>toast.remove(),250); }, 4000);
};
