/**
 * scripts/e2e/phases/phase-1-shell.js
 * Phase 1: Global Shell, Authentication & Navigation
 */
const { APP_URL, wait, TestTracker } = require('../utils');
const { injectAdminSession, clearSession } = require('../auth');

async function runPhase1(page) {
  const tracker = new TestTracker('Phase 1: Global Shell & Navigation');
  console.log('\n--- 🚀 Running Phase 1: Global Shell, Auth & Navigation ---');

  // 1.1 Auth Guard: Unauthenticated Redirect
  await tracker.runStep('1.1.1', 'Redirect unauthenticated users to /auth', async () => {
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded' });
    await clearSession(page);
    await page.reload({ waitUntil: 'networkidle2' });
    await wait(800);
    const currentUrl = page.url();
    tracker.assert(currentUrl.includes('/auth'), `Expected URL to include /auth, got ${currentUrl}`);
  });

  // 1.1.3 Inject Valid Admin Session
  await tracker.runStep('1.1.3', 'Load App with Valid Admin JWT Session', async () => {
    await injectAdminSession(page);
    await page.goto(APP_URL + '#dashboard', { waitUntil: 'networkidle2' });
    await wait(1500);
    const currentUrl = page.url();
    tracker.assert(currentUrl.includes('/app/index.html'), `Expected admin app to load, got ${currentUrl}`);
  });

  // 1.1.4 Verify Profile Name & Role
  await tracker.runStep('1.1.4', 'Verify Admin Profile Badge Display', async () => {
    const nameText = await page.$eval('#userName', el => el.textContent.trim());
    const roleText = await page.$eval('#userRoleTag', el => el.textContent.trim());
    tracker.assert(nameText.length > 0, 'User name should not be empty');
    tracker.assert(roleText.length > 0, 'User role tag should not be empty');
  });

  // 1.2 Header Clock: Live BST Dhaka Clock
  await tracker.runStep('1.2.1', 'Verify Live Dhaka BST Clock in Header', async () => {
    const clockElem = await page.$('#dhakaClockText');
    tracker.assert(clockElem !== null, '#dhakaClockText must exist');
    const clockText = await page.evaluate(el => el.textContent.trim(), clockElem);
    tracker.assert(clockText.length > 5, `Clock text "${clockText}" is invalid`);
    await tracker.screenshot(page, '1.2.4_header_clock.png');
  });

  // 1.3 Ops Health Modal & Telemetry
  await tracker.runStep('1.3.1', 'Open and Verify Ops Health Modal', async () => {
    const pill = await page.$('#opsHealthPill');
    tracker.assert(pill !== null, '#opsHealthPill must exist');
    await pill.click();
    await wait(600);
    const modalVisible = await page.$eval('#opsHealthModal', el => el.style.display !== 'none');
    tracker.assert(modalVisible, 'Ops Health modal should be visible');
    await tracker.screenshot(page, '1.3.6_ops_health_modal.png');

    // Refresh telemetry
    const refreshBtn = await page.$('#opsHealthModal button.btn-primary');
    if (refreshBtn) await refreshBtn.click();
    await wait(500);

    // Close modal
    const closeBtn = await page.$('#opsHealthModal button.modal-close-btn');
    if (closeBtn) await closeBtn.click();
    await wait(300);
  });

  // 1.6 Global Command Palette (Ctrl+K or Header Button)
  await tracker.runStep('1.6.1', 'Open Command Palette (Ctrl+K) & Search', async () => {
    await page.evaluate(() => {
      if (typeof window.openCommandPalette === 'function') {
        window.openCommandPalette();
      }
    });
    await wait(600);
    const isModalOpen = await page.$eval('#commandPaletteModal', el => el.style.display !== 'none');
    tracker.assert(isModalOpen, 'Command palette modal should open');

    const searchInp = await page.$('#cmdPaletteInput');
    if (searchInp) {
      await searchInp.type('Invoice');
      await wait(500);
    }
    await tracker.screenshot(page, '1.6.8_command_palette.png');

    await page.evaluate(() => {
      if (typeof window.closeCommandPalette === 'function') {
        window.closeCommandPalette();
      }
    });
    await wait(300);
  });

  // 1.7 Theme Toggle
  await tracker.runStep('1.7.1', 'Verify Theme Toggle Switch (Dark/Light)', async () => {
    const initialTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme') || 'dark');
    await page.click('#themeToggleBtn');
    await wait(300);
    const newTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    tracker.assert(newTheme !== initialTheme, 'Theme attribute should toggle');
    // Switch back to dark
    await page.click('#themeToggleBtn');
    await wait(200);
  });

  // 1.5 Sidebar Navigation: Verify all 13 tabs
  const navTabs = [
    { hash: '#dashboard', title: 'Executive Overview' },
    { hash: '#analytics', title: 'Agency Analytics' },
    { hash: '#leads', title: 'Leads' },
    { hash: '#crm', title: 'CRM' },
    { hash: '#kanban', title: 'Pipeline' },
    { hash: '#reviews', title: 'Review' },
    { hash: '#social', title: 'Social' },
    { hash: '#cms', title: 'CMS' },
    { hash: '#finance', title: 'Financials' },
    { hash: '#hr', title: 'HR' },
    { hash: '#assets', title: 'Assets' },
    { hash: '#tickets', title: 'Support' },
    { hash: '#automation', title: 'Automation' },
    { hash: '#settings', title: 'Settings' }
  ];

  await tracker.runStep('1.5.2', 'Verify 14 Sidebar Tabs Navigation & Content Rendering', async () => {
    for (const tab of navTabs) {
      await page.evaluate((h) => { window.location.hash = h; }, tab.hash);
      await wait(800);
      const appViewContent = await page.$eval('#app-view', el => el.innerHTML.trim());
      tracker.assert(appViewContent.length > 50, `Module ${tab.hash} should render content`);
    }
  });

  return tracker.getSummary();
}

module.exports = { runPhase1 };
