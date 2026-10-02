/**
 * public/dce/nav.js
 * ─────────────────────────────────────────────────────────────────────────────
 * GRO10X Digital Commerce Engine — Universal Navigation Shell Component
 * Injects a cohesive top navbar, active indicators, and mobile drawer across all portals.
 * ─────────────────────────────────────────────────────────────────────────────
 */

(function () {
  const currentPath = window.location.pathname;

  const NAV_ITEMS = [
    { label: '⚡ Catalog & SKUs', path: '/dce', icon: '⚡' },
    { label: '🛒 Order Inbox', path: '/dce/orders', icon: '🛒' },
    { label: '🛠️ Operations', path: '/dce/operations', icon: '🛠️' },
    { label: '📈 Growth Suite', path: '/dce/growth', icon: '📈' },
    { label: '🏪 DigiVault Ops', path: '/dce/digivault', icon: '🏪' }
  ];

  const CSS_STYLES = `
    .dce-global-header {
      background: rgba(15, 23, 42, 0.95) !important;
      backdrop-filter: blur(12px) !important;
      border-bottom: 1px solid rgba(51, 65, 85, 0.8) !important;
      padding: 12px 24px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      position: sticky !important;
      top: 0 !important;
      z-index: 1000 !important;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3) !important;
      width: 100% !important;
      box-sizing: border-box !important;
    }
    .dce-header-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
      color: #fff;
    }
    .dce-header-logo-badge {
      width: 38px;
      height: 38px;
      background: linear-gradient(135deg, #6366f1, #3b82f6);
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      box-shadow: 0 2px 10px rgba(99, 102, 241, 0.4);
      flex-shrink: 0;
    }
    .dce-nav-links-wrap {
      display: flex;
      align-items: center;
      gap: 6px;
      background: #090e17;
      padding: 4px;
      border-radius: 10px;
      border: 1px solid #1f2937;
    }
    .dce-nav-link-btn {
      padding: 7px 14px;
      border-radius: 7px;
      font-size: 13px;
      font-weight: 600;
      text-decoration: none;
      color: #94a3b8;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .dce-nav-link-btn:hover {
      color: #f8fafc;
      background: rgba(255, 255, 255, 0.05);
    }
    .dce-nav-link-btn.active {
      background: #6366f1;
      color: #ffffff;
      box-shadow: 0 2px 8px rgba(99, 102, 241, 0.35);
    }
    .dce-header-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .dce-profile-pill {
      font-size: 11px;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #34d399;
      padding: 4px 10px;
      border-radius: 20px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .dce-profile-pill::before {
      content: '';
      width: 6px;
      height: 6px;
      background: #10b981;
      border-radius: 50%;
      display: inline-block;
    }
    .dce-hamburger-btn {
      display: none;
      background: #111827;
      border: 1px solid #374151;
      color: #f8fafc;
      font-size: 20px;
      width: 40px;
      height: 40px;
      border-radius: 8px;
      cursor: pointer;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }
    .dce-hamburger-btn:hover {
      background: #1f2937;
      border-color: #4b5563;
    }

    /* Mobile Drawer */
    .dce-drawer-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(4px);
      z-index: 9998;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.25s ease;
    }
    .dce-drawer-backdrop.open {
      opacity: 1;
      pointer-events: auto;
    }

    .dce-mobile-drawer {
      position: fixed;
      top: 0;
      right: 0;
      width: 300px;
      max-width: 85vw;
      height: 100vh;
      background: #0f172a;
      border-left: 1px solid #1f2937;
      z-index: 9999;
      transform: translateX(100%);
      transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      flex-direction: column;
      padding: 20px;
      box-shadow: -10px 0 30px rgba(0,0,0,0.6);
      box-sizing: border-box;
      overflow-y: auto;
    }
    .dce-mobile-drawer.open {
      transform: translateX(0);
    }
    .dce-drawer-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid #1e293b;
    }
    .dce-drawer-close {
      background: #1e293b;
      border: 1px solid #334155;
      color: #94a3b8;
      width: 34px;
      height: 34px;
      border-radius: 8px;
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
    }
    .dce-drawer-close:hover {
      color: #fff;
      background: #334155;
    }
    .dce-drawer-nav-section {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 24px;
    }
    .dce-drawer-link {
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      text-decoration: none;
      color: #94a3b8;
      display: flex;
      align-items: center;
      gap: 10px;
      transition: all 0.2s;
    }
    .dce-drawer-link:hover {
      background: #1e293b;
      color: #fff;
    }
    .dce-drawer-link.active {
      background: #6366f1;
      color: #fff;
      box-shadow: 0 2px 10px rgba(99, 102, 241, 0.4);
    }
    .dce-drawer-divider {
      height: 1px;
      background: #1e293b;
      margin: 8px 0 20px;
    }
    .dce-drawer-section-title {
      font-size: 11px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
    }
    .dce-drawer-actions-section {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .dce-drawer-action-btn {
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    @media (max-width: 900px) {
      .dce-nav-links-wrap { display: none !important; }
      .dce-header-actions .btn,
      .dce-header-actions .dce-profile-pill {
        display: none !important;
      }
      .dce-hamburger-btn { display: inline-flex !important; }
    }
  `;

  function renderShell() {
    // Prevent duplicate injection if shell already rendered
    if (document.getElementById('dceGlobalHeader')) return;

    // Inject Styles
    const styleEl = document.createElement('style');
    styleEl.id = 'dceGlobalNavStyles';
    styleEl.innerHTML = CSS_STYLES;
    document.head.appendChild(styleEl);

    // Create dedicated global header (NEVER overwrite page <header>)
    const headerEl = document.createElement('header');
    headerEl.id = 'dceGlobalHeader';
    headerEl.className = 'dce-global-header';

    const linksHtml = NAV_ITEMS.map(item => {
      const isActive = currentPath === item.path || (item.path !== '/dce' && currentPath.startsWith(item.path));
      return `
        <a href="${item.path}" class="dce-nav-link-btn ${isActive ? 'active' : ''}">
          <span>${item.icon}</span>
          <span>${item.label.replace(/^[^ ]+ /, '')}</span>
        </a>
      `;
    }).join('');

    headerEl.innerHTML = `
      <a href="/dce" class="dce-header-brand">
        <div class="dce-header-logo-badge">⚡</div>
        <div>
          <div style="font-size: 16px; font-weight: 800; letter-spacing: -0.4px;">GRO10X Commerce Engine</div>
          <div style="font-size: 11px; color: #94a3b8;">Unified Brand Operating System v5.7</div>
        </div>
      </a>

      <nav class="dce-nav-links-wrap" aria-label="Main Navigation">
        ${linksHtml}
      </nav>

      <div class="dce-header-actions">
        <a href="/dce/track" class="btn btn-secondary" style="padding: 6px 10px; font-size: 11px; background: rgba(99,102,241,0.15); border: 1px solid rgba(99,102,241,0.3); color: #a5b4fc; text-decoration: none; border-radius: 6px;">🔍 Track</a>
        <a href="/dce/store" class="btn btn-secondary" style="padding: 6px 10px; font-size: 11px; background: rgba(245,158,11,0.15); border: 1px solid rgba(245,158,11,0.3); color: #fcd34d; text-decoration: none; border-radius: 6px;">🛍️ Store</a>
        <a href="/affiliate/portal" class="btn btn-secondary" style="padding: 6px 10px; font-size: 11px; background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); color: #34d399; text-decoration: none; border-radius: 6px;">🤝 Partners</a>
        <span class="dce-profile-pill">SUPER ADMIN</span>
        <a href="/workspace?engineId=engine3#pnl" class="btn btn-secondary" style="padding: 6px 12px; font-size: 11px; background: rgba(99, 102, 241, 0.15); border: 1px solid rgba(99, 102, 241, 0.3); color: #a5b4fc; text-decoration: none; border-radius: 6px;">Engine 3 P&L ↗</a>
        <a href="/app" class="btn btn-secondary" style="padding: 6px 12px; font-size: 11px; background: #1e293b; color: #f8fafc; text-decoration: none; border-radius: 6px; border: 1px solid #334155;">Agency OS ↗</a>
        <button class="dce-hamburger-btn" id="dceMobileMenuBtn" aria-label="Toggle navigation menu" aria-expanded="false" aria-controls="dceMobileDrawer">☰</button>
      </div>
    `;

    // Prepend dedicated header to body
    document.body.prepend(headerEl);

    // Create Mobile Drawer & Backdrop
    const backdropEl = document.createElement('div');
    backdropEl.id = 'dceDrawerBackdrop';
    backdropEl.className = 'dce-drawer-backdrop';
    backdropEl.setAttribute('aria-hidden', 'true');

    const drawerEl = document.createElement('aside');
    drawerEl.id = 'dceMobileDrawer';
    drawerEl.className = 'dce-mobile-drawer';
    drawerEl.setAttribute('aria-hidden', 'true');

    const drawerLinksHtml = NAV_ITEMS.map(item => {
      const isActive = currentPath === item.path || (item.path !== '/dce' && currentPath.startsWith(item.path));
      return `
        <a href="${item.path}" class="dce-drawer-link ${isActive ? 'active' : ''}">
          <span>${item.icon}</span>
          <span>${item.label.replace(/^[^ ]+ /, '')}</span>
        </a>
      `;
    }).join('');

    drawerEl.innerHTML = `
      <div class="dce-drawer-header">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div class="dce-header-logo-badge" style="width: 32px; height: 32px; font-size: 15px;">⚡</div>
          <span style="font-weight: 800; font-size: 14px; color: #fff;">GRO10X Engine</span>
        </div>
        <button class="dce-drawer-close" id="dceDrawerCloseBtn" aria-label="Close navigation menu">✕</button>
      </div>

      <div class="dce-drawer-section-title">Core Portals</div>
      <nav class="dce-drawer-nav-section" aria-label="Mobile Main Navigation">
        ${drawerLinksHtml}
      </nav>

      <div class="dce-drawer-divider"></div>

      <div class="dce-drawer-section-title">Touchpoints & Tools</div>
      <div class="dce-drawer-actions-section">
        <a href="/dce/track" class="dce-drawer-action-btn" style="background: rgba(99,102,241,0.15); border: 1px solid rgba(99,102,241,0.3); color: #a5b4fc;">
          <span>🔍</span> Track Order
        </a>
        <a href="/dce/store" class="dce-drawer-action-btn" style="background: rgba(245,158,11,0.15); border: 1px solid rgba(245,158,11,0.3); color: #fcd34d;">
          <span>🛍️</span> Storefront
        </a>
        <a href="/affiliate/portal" class="dce-drawer-action-btn" style="background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); color: #34d399;">
          <span>🤝</span> Partner Portal
        </a>
        <a href="/workspace?engineId=engine3#pnl" class="dce-drawer-action-btn" style="background: rgba(99,102,241,0.15); border: 1px solid rgba(99,102,241,0.3); color: #a5b4fc;">
          <span>⚡</span> Engine 3 Workspace P&L
        </a>
        <a href="/app" class="dce-drawer-action-btn" style="background: #1e293b; border: 1px solid #334155; color: #f8fafc;">
          <span>↗️</span> Agency OS Dashboard
        </a>
      </div>

      <div style="margin-top: auto; padding-top: 20px;">
        <span class="dce-profile-pill" style="display: inline-flex;">SUPER ADMIN</span>
      </div>
    `;

    document.body.appendChild(backdropEl);
    document.body.appendChild(drawerEl);

    // Setup interactive toggle handlers
    const hamburgerBtn = document.getElementById('dceMobileMenuBtn');
    const closeBtn = document.getElementById('dceDrawerCloseBtn');

    function openDrawer() {
      drawerEl.classList.add('open');
      backdropEl.classList.add('open');
      drawerEl.setAttribute('aria-hidden', 'false');
      backdropEl.setAttribute('aria-hidden', 'false');
      hamburgerBtn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      closeBtn.focus();
    }

    function closeDrawer() {
      drawerEl.classList.remove('open');
      backdropEl.classList.remove('open');
      drawerEl.setAttribute('aria-hidden', 'true');
      backdropEl.setAttribute('aria-hidden', 'true');
      hamburgerBtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    if (hamburgerBtn) hamburgerBtn.addEventListener('click', openDrawer);
    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
    backdropEl.addEventListener('click', closeDrawer);

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawerEl.classList.contains('open')) {
        closeDrawer();
        hamburgerBtn.focus();
      }
    });

    // Close on clicking any link inside drawer
    drawerEl.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeDrawer);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderShell);
  } else {
    renderShell();
  }
})();
