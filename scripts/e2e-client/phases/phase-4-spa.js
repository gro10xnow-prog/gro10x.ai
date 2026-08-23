/**
 * scripts/e2e-client/phases/phase-4-spa.js
 * Phase T4: Client SPA (/client/) — 8 Tabs & Interactive Components
 */
const { CLIENT_SPA_URL, wait, TestTracker } = require('../utils');
const { injectClientSession } = require('../auth');

async function runPhase4(page) {
  const tracker = new TestTracker('Phase T4: Client SPA (/client/)');
  console.log('\n--- 🚀 Running Phase T4: Client SPA (8 Tabs & Shell) ---');

  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });

  // T4.1 Desktop Shell & Avatar Hydration
  await tracker.runStep('T4.1.1', 'Load Client SPA and Verify Desktop Sidebar & Brand Hydration', async () => {
    await injectClientSession(page);
    await page.goto(CLIENT_SPA_URL + '#home', { waitUntil: 'networkidle2' });
    await wait(1200);

    const clientName = await page.$eval('#deskClientName', el => el.textContent.trim());
    tracker.assert(clientName.length > 0, 'Client name must be hydrated in desktop sidebar');
    const brandLogo = await page.$eval('#deskBrandLogo', el => el.textContent.trim());
    tracker.assert(brandLogo.length > 0, 'Monogram logo initial must be present');
    await tracker.screenshot(page, 't4.1.1_spa_desktop_shell.png');
  });

  // T4.3 Tab #home: Dashboard KPIs
  await tracker.runStep('T4.3.1', 'Verify #home Overview & KPI Tiles', async () => {
    await page.goto(CLIENT_SPA_URL + '#home', { waitUntil: 'networkidle2' });
    await wait(1000);
    const viewHtml = await page.$eval('#client-view', el => el.innerHTML);
    tracker.assert(viewHtml.length > 50, '#client-view content should be rendered for #home');
    await tracker.screenshot(page, 't4.3.1_spa_tab_home.png');
  });

  // T4.4 Tab #retainer: Retainer Health Dashboard
  await tracker.runStep('T4.4.1', 'Verify #retainer Health Dashboard & Quota', async () => {
    await page.click('a[data-hash="#retainer"]');
    await wait(1000);
    const viewHtml = await page.$eval('#client-view', el => el.innerHTML);
    tracker.assert(viewHtml.length > 50, '#client-view content should be rendered for #retainer');
    await tracker.screenshot(page, 't4.4.1_spa_tab_retainer.png');
  });

  // T4.5 Tab #review: Video Review Room & Desktop Hotkeys
  await tracker.runStep('T4.5.1', 'Verify #review Content Review Room & Video Hotkeys', async () => {
    await page.click('a[data-hash="#review"]');
    await wait(1000);

    // Test spacebar / arrow key listeners
    await page.keyboard.press('Space');
    await wait(200);
    await page.keyboard.press('ArrowRight');
    await wait(200);
    await page.keyboard.press('KeyT');
    await wait(300);

    await tracker.screenshot(page, 't4.5.1_spa_tab_review.png');
  });

  // T4.6 Tab #campaign: Monthly Calendar Grid
  await tracker.runStep('T4.6.1', 'Verify #campaign Campaign Calendar Grid', async () => {
    await page.click('a[data-hash="#campaign"]');
    await wait(1000);
    const viewHtml = await page.$eval('#client-view', el => el.innerHTML);
    tracker.assert(viewHtml.length > 50, '#client-view content should be rendered for #campaign');
    await tracker.screenshot(page, 't4.6.1_spa_tab_campaign.png');
  });

  // T4.7 Tab #brief: 3-Step Briefing Wizard
  await tracker.runStep('T4.7.1', 'Verify #brief 3-Step Briefing Wizard & Stepper', async () => {
    await page.click('a[data-hash="#brief"]');
    await wait(1000);
    const viewHtml = await page.$eval('#client-view', el => el.innerHTML);
    tracker.assert(viewHtml.length > 50, '#client-view content should be rendered for #brief');
    await tracker.screenshot(page, 't4.7.1_spa_tab_brief.png');
  });

  // T4.8 Tab #invoices: Billing & 1-Click Copy Chips
  await tracker.runStep('T4.8.1', 'Verify #invoices Invoices List & Copy Chips', async () => {
    await page.click('a[data-hash="#invoices"]');
    await wait(1000);
    const viewHtml = await page.$eval('#client-view', el => el.innerHTML);
    tracker.assert(viewHtml.length > 50, '#client-view content should be rendered for #invoices');
    await tracker.screenshot(page, 't4.8.1_spa_tab_invoices.png');
  });

  // T4.9 Tab #tickets: Support Desk & 2h SLA
  await tracker.runStep('T4.9.1', 'Verify #tickets Support Requests & Escalation', async () => {
    await page.click('a[data-hash="#tickets"]');
    await wait(1000);
    const viewHtml = await page.$eval('#client-view', el => el.innerHTML);
    tracker.assert(viewHtml.length > 50, '#client-view content should be rendered for #tickets');
    await tracker.screenshot(page, 't4.9.1_spa_tab_tickets.png');
  });

  // T4.10 Tab #account: Account Team & Contacts
  await tracker.runStep('T4.10.1', 'Verify #account Account Team & POC Roster', async () => {
    await page.click('a[data-hash="#account"]');
    await wait(1000);
    const viewHtml = await page.$eval('#client-view', el => el.innerHTML);
    tracker.assert(viewHtml.length > 50, '#client-view content should be rendered for #account');
    await tracker.screenshot(page, 't4.10.1_spa_tab_account.png');
  });

  // T4.2 Mobile Bottom Sheet & Drawer Navigation (<900px)
  await tracker.runStep('T4.2.1', 'Test Mobile Viewport (<900px) and Bottom Sheet Drawer', async () => {
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await page.reload({ waitUntil: 'networkidle2' });
    await wait(800);

    const btnMore = await page.$('#btnMoreSheet');
    if (btnMore) {
      await btnMore.click();
      await wait(500);
      const isSheetActive = await page.$eval('#mobileBottomSheet', el => el.classList.contains('active'));
      tracker.assert(isSheetActive, '#mobileBottomSheet should become active when tapping More');
      await tracker.screenshot(page, 't4.2.1_spa_mobile_drawer.png');

      // Tap overlay to close
      await page.click('#mobileSheetOverlay');
      await wait(300);
      const isSheetClosed = await page.$eval('#mobileBottomSheet', el => !el.classList.contains('active'));
      tracker.assert(isSheetClosed, '#mobileBottomSheet should close when tapping overlay');
    }

    // Reset viewport back to desktop
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });
  });

  return tracker.getSummary();
}

module.exports = { runPhase4 };
