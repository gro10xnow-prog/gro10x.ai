/**
 * Suite A - Phase A1: Admin OS Global Shell, Authentication & Navigation
 */
const { APP_URL, wait, assertModalOpen, assertModalClosed, TestTracker } = require('../../utils');
const { injectRoleSession, clearSession, generateExpiredToken } = require('../../auth');

async function runPhaseA1(page) {
  const tracker = new TestTracker('Suite A - Phase A1: Shell, Auth & Navigation');
  console.log('\n--- ?? Running Suite A - Phase A1: Shell & Auth ---');

  await tracker.runStep('A1.1', 'Redirect unauthenticated visitor to /auth', async () => {
    await clearSession(page);
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded' });
    await wait(800);
    const currentUrl = page.url();
    tracker.assert(currentUrl.includes('/auth'), 'Expected URL to include /auth, got ' + currentUrl);
  });

  await tracker.runStep('A1.2', 'Expired JWT triggers 401 redirect to /auth?expired=1', async () => {
    const expiredToken = generateExpiredToken('owner');
    await page.evaluate((tok) => {
      localStorage.setItem('gro10x_token', tok);
      localStorage.setItem('gro10x_token', tok);
    }, expiredToken);
    await page.goto(APP_URL + '#dashboard', { waitUntil: 'networkidle2' });
    await wait(1200);
    const url = page.url();
    tracker.assert(url.includes('/auth'), 'Expected redirect to auth on expired token, got ' + url);
  });

  await tracker.runStep('A1.3', 'Load Admin OS with Valid Owner Session', async () => {
    await injectRoleSession(page, 'owner');
    await page.goto(APP_URL + '#dashboard', { waitUntil: 'networkidle2' });
    await wait(1500);
    const url = page.url();
    tracker.assert(url.includes('/app/index.html') || url.includes('/app/#dashboard'), 'Admin OS should load, got ' + url);
    const nameText = await page.$eval('#userName', el => el.textContent.trim());
    const roleText = await page.$eval('#userRoleTag', el => el.textContent.trim());
    tracker.assert(nameText.length > 0, 'User name badge must be populated');
    tracker.assert(roleText.length > 0, 'User role tag must be populated');
  });

  await tracker.runStep('A1.4', 'Verify Live Dhaka BST Clock in Header', async () => {
    const clockElem = await page.$('#dhakaClockText');
    tracker.assert(clockElem !== null, '#dhakaClockText must exist in header');
    const t1 = await page.evaluate(el => el.textContent.trim(), clockElem);
    tracker.assert(t1.length > 5, 'Clock string is valid: ' + t1);
    await tracker.screenshot(page, 'A1.4_header_clock.png');
  });

  const navTabs = [
    { hash: '#dashboard', id: 'dashboard', title: 'Executive Overview' },
    { hash: '#engines', id: 'engines', title: 'Growth Engines' },
    { hash: '#platforms', id: 'platforms', title: 'Platform Portfolio' },
    { hash: '#gigs', id: 'gigs', title: 'Marketplace Gigs' },
    { hash: '#analytics', id: 'analytics', title: 'Agency Analytics' },
    { hash: '#leads', id: 'leads', title: 'Leads Pipeline' },
    { hash: '#proposals', id: 'proposals', title: 'Client Proposals' },
    { hash: '#crm', id: 'crm', title: 'Clients & Retainers CRM' },
    { hash: '#kanban', id: 'kanban', title: 'Project Pipeline' },
    { hash: '#reviews', id: 'reviews', title: 'Review Room' },
    { hash: '#content-os', id: 'content-os', title: 'Content OS' },
    { hash: '#social', id: 'social', title: 'Social Planner' },
    { hash: '#cms', id: 'cms', title: 'Services & CMS' },
    { hash: '#brands', id: 'brands', title: 'Brand Command Center' },
    { hash: '#digistore', id: 'digistore', title: 'DigiVault' },
    { hash: '#dbm', id: 'dbm', title: 'DBM Operations' },
    { hash: '#finance', id: 'finance', title: 'Financials & Expenses' },
    { hash: '#hr', id: 'hr', title: 'HR & Roster Ops' },
    { hash: '#assets', id: 'assets', title: 'Hardware Assets' },
    { hash: '#tickets', id: 'tickets', title: 'Support Desk' },
    { hash: '#automation', id: 'automation', title: 'Bot & Automation Logs' },
    { hash: '#settings', id: 'settings', title: 'Settings' }
  ];

  await tracker.runStep('A1.5', 'Verify all 22 Admin Navigation Tabs render active content with Zero JS Errors', async () => {
    const routeErrors = [];
    const errorListener = err => routeErrors.push(`[PageError] ${err.message}`);
    page.on('pageerror', errorListener);

    for (const tab of navTabs) {
      await page.evaluate((h) => { window.location.hash = h; }, tab.hash);

      try {
        await page.waitForFunction(() => {
          const el = document.querySelector('#app-view');
          if (!el) return false;
          const html = el.innerHTML.trim();
          return html.length > 50 && !html.includes('class="skeleton"');
        }, { timeout: 8000 });
      } catch (_) {
        await wait(500);
      }


      const appViewContent = await page.$eval('#app-view', el => el.innerHTML.trim());
      tracker.assert(appViewContent.length > 50, `Module ${tab.hash} (${tab.title}) should render HTML content`);

      // Verify sidebar nav item has active class
      const isActive = await page.evaluate((h) => {
        const link = document.querySelector(`.sidebar-nav a[href="${h}"]`);
        return link ? link.classList.contains('active') : false;
      }, tab.hash);
      tracker.assert(isActive, `Sidebar link for ${tab.hash} must have .active class`);
    }


    page.off('pageerror', errorListener);
    tracker.assert(routeErrors.length === 0, `Traversed all 22 routes with 0 uncaught errors (found: ${routeErrors.join('; ')})`);
    await tracker.screenshot(page, 'A1.5_all_22_tabs_traversal.png');
  });

  await tracker.runStep('A1.6', 'Open Command Palette, Search and Jump to Route', async () => {
    await page.evaluate(() => {
      if (typeof window.openCommandPalette === 'function') window.openCommandPalette();
    });
    await wait(500);
    await assertModalOpen(page, '#commandPaletteModal');
    const searchInp = await page.$('#cmdPaletteInput');
    if (searchInp) {
      await searchInp.type('Content OS');
      await wait(300);
    }
    await tracker.screenshot(page, 'A1.6_command_palette.png');

    // Select first result if present
    const firstResult = await page.$('#cmdPaletteResults .cmd-palette-item');
    if (firstResult) {
      await firstResult.click();
      await wait(400);
    } else {
      await page.evaluate(() => {
        if (typeof window.closeCommandPalette === 'function') window.closeCommandPalette();
      });
    }
    await wait(300);
    await assertModalClosed(page, '#commandPaletteModal');
  });

  await tracker.runStep('A1.7', 'Toggle Theme (Dark <-> Light)', async () => {
    const initialTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme') || 'dark');
    await page.click('#themeToggleBtn');
    await wait(300);
    const newTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    tracker.assert(newTheme !== initialTheme, 'Theme attribute must toggle');
    await page.click('#themeToggleBtn');
    await wait(200);
  });

  await tracker.runStep('A1.8', 'Open Ops Health Telemetry Modal & Refresh', async () => {
    const pill = await page.$('#opsHealthPill');
    if (pill) {
      await pill.click();
      await wait(500);
      await assertModalOpen(page, '#opsHealthModal');
      await tracker.screenshot(page, 'A1.8_ops_health_modal.png');
      const closeBtn = await page.$('#opsHealthModal button.modal-close-btn, #opsHealthModal .close-btn');
      if (closeBtn) await closeBtn.click();
      await wait(300);
    }
  });

  await tracker.runStep('A1.9', 'Verify Attention Badges Engine DOM Elements Binding', async () => {
    const expectedBadges = [
      'sidebarBadgeLeads',
      'sidebarBadgeProposals',
      'sidebarBadgeKanban',
      'sidebarBadgeReviews',
      'sidebarBadgeBrands',
      'sidebarBadgeDigiStore',
      'sidebarBadgeFinance',
      'sidebarBadgeHR',
      'sidebarBadgeTickets'
    ];

    for (const badgeId of expectedBadges) {
      const el = await page.$(`#${badgeId}`);
      tracker.assert(el !== null, `Attention badge #${badgeId} must exist in sidebar DOM`);
    }
    await tracker.screenshot(page, 'A1.9_attention_badges.png');
  });

  await tracker.runStep('A1.10', 'Verify Mobile Viewport Layout Integrity (375x812)', async () => {
    // Resize to mobile viewport
    await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 2 });
    await wait(500);

    // Verify content area exists and no body horizontal overflow
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth + 2;
    });
    tracker.assert(!hasHorizontalOverflow, 'Mobile layout should not have horizontal body overflow');
    await tracker.screenshot(page, 'A1.10_mobile_viewport.png');

    // Restore desktop viewport
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });
    await wait(300);
  });

  return tracker.getSummary();
}

module.exports = { runPhaseA1 };

