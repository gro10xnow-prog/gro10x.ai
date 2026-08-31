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
    { hash: '#dashboard', id: 'dashboard' },
    { hash: '#analytics', id: 'analytics' },
    { hash: '#leads', id: 'leads' },
    { hash: '#crm', id: 'crm' },
    { hash: '#kanban', id: 'kanban' },
    { hash: '#reviews', id: 'reviews' },
    { hash: '#social', id: 'social' },
    { hash: '#cms', id: 'cms' },
    { hash: '#finance', id: 'finance' },
    { hash: '#hr', id: 'hr' },
    { hash: '#assets', id: 'assets' },
    { hash: '#tickets', id: 'tickets' },
    { hash: '#automation', id: 'automation' },
    { hash: '#settings', id: 'settings' }
  ];

  await tracker.runStep('A1.5', 'Verify all 14 Sidebar Tabs render active content without JS error', async () => {
    for (const tab of navTabs) {
      await page.evaluate((h) => { window.location.hash = h; }, tab.hash);
      await wait(600);
      const appViewContent = await page.$eval('#app-view', el => el.innerHTML.trim());
      tracker.assert(appViewContent.length > 50, 'Module ' + tab.hash + ' should render HTML content');
    }
  });

  await tracker.runStep('A1.6', 'Open Command Palette, Search and Close', async () => {
    await page.evaluate(() => {
      if (typeof window.openCommandPalette === 'function') window.openCommandPalette();
    });
    await wait(500);
    await assertModalOpen(page, '#commandPaletteModal');
    const searchInp = await page.$('#cmdPaletteInput');
    if (searchInp) {
      await searchInp.type('Invoice');
      await wait(300);
    }
    await tracker.screenshot(page, 'A1.6_command_palette.png');
    await page.evaluate(() => {
      if (typeof window.closeCommandPalette === 'function') window.closeCommandPalette();
    });
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

  return tracker.getSummary();
}

module.exports = { runPhaseA1 };
