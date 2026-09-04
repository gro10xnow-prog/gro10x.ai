/**
 * scripts/e2e/suites/suite-f-investors/phase-F1-load.js
 * Suite F - Phase F1: Investors Page Loading, Telemetry Strip & Currency Switcher
 * 
 * Tests:
 * F1.1: Load Public Investors Portal without Auth Wall
 * F1.2: Verify Top Telemetry Strip KPIs ($100k, 65% Margin, $35k Cap, 5 Engines)
 * F1.3: Live Currency Switcher (USD <-> BDT) Dynamic Formatting
 * F1.4: Header Navigation Anchor Links Integrity
 * F1.5: Header Portal Cross-Links & Brand Identity
 * F1.6: Mobile Viewport Rendering (375x812) Responsiveness
 */

const { BASE_URL, wait, TestTracker } = require('../../utils');

async function runPhaseF1(page) {
  const tracker = new TestTracker('Suite F - Phase F1: Investors Page Load & Telemetry');
  console.log('\n--- 📈 Running Suite F - Phase F1: Investors Load & Telemetry ---');

  const INVESTORS_URL = `${BASE_URL}/investors.html`;

  await tracker.runStep('F1.1', 'Load Public Investors Portal without Auth Wall', async () => {
    await page.goto(INVESTORS_URL, { waitUntil: 'networkidle2' });
    await wait(1000);
    const url = page.url();
    tracker.assert(url.includes('/investors.html'), 'Expected to be on /investors.html, got ' + url);
    
    const title = await page.title();
    tracker.assert(title.toLowerCase().includes('investor') || title.toLowerCase().includes('gro10x'), 'Title should reflect investor portal');
    
    const badgeText = await page.$eval('.investor-badge', el => el.textContent.trim());
    tracker.assert(badgeText.includes('Capital Partner') || badgeText.includes('Investor'), 'Investor badge should be present');
    
    await tracker.screenshot(page, 'F1.1_investors_portal_loaded.png');
  });

  await tracker.runStep('F1.2', 'Verify Top Telemetry Strip KPIs', async () => {
    const metrics = await page.$$eval('.pb-metric-item', items => items.map(item => ({
      val: item.querySelector('.pb-metric-val') ? item.querySelector('.pb-metric-val').textContent.trim() : '',
      label: item.querySelector('.pb-metric-label') ? item.querySelector('.pb-metric-label').textContent.trim() : ''
    })));

    tracker.assert(metrics.length >= 4, `Expected at least 4 KPI metrics in telemetry strip, found ${metrics.length}`);
    
    const hasRevenueTarget = metrics.some(m => m.val.includes('100,000') || m.label.toLowerCase().includes('revenue'));
    const hasMargin = metrics.some(m => m.val.includes('65%') || m.label.toLowerCase().includes('margin'));
    const hasOpex = metrics.some(m => m.val.includes('35,000') || m.label.toLowerCase().includes('expense'));
    const hasEngines = metrics.some(m => m.val.includes('5 Growth Engines') || m.label.toLowerCase().includes('pipelines'));

    tracker.assert(hasRevenueTarget, 'Annual revenue target KPI missing');
    tracker.assert(hasMargin, '65% Net margin KPI missing');
    tracker.assert(hasOpex, 'Lean operational expense cap KPI missing');
    tracker.assert(hasEngines, '5 Growth engines KPI missing');

    await tracker.screenshot(page, 'F1.2_telemetry_strip.png');
  });

  await tracker.runStep('F1.3', 'Live Currency Switcher (USD <-> BDT) Dynamic Formatting', async () => {
    // Check initial USD state
    let revenueVal = await page.$eval('.pb-metric-item:first-child .pb-metric-val', el => el.textContent.trim());
    tracker.assert(revenueVal.includes('$'), 'Initial currency should be USD ($)');

    // Switch to BDT
    const bdtBtn = await page.$('#btnCurrBDT');
    tracker.assert(!!bdtBtn, 'BDT currency toggle button should exist');
    await bdtBtn.click();
    await wait(300);

    revenueVal = await page.$eval('.pb-metric-item:first-child .pb-metric-val', el => el.textContent.trim());
    tracker.assert(revenueVal.includes('৳') || revenueVal.includes('Crore') || revenueVal.includes('BDT'), 'Expected currency values to switch to BDT (৳), got ' + revenueVal);

    // Switch back to USD
    const usdBtn = await page.$('#btnCurrUSD');
    tracker.assert(!!usdBtn, 'USD currency toggle button should exist');
    await usdBtn.click();
    await wait(300);

    revenueVal = await page.$eval('.pb-metric-item:first-child .pb-metric-val', el => el.textContent.trim());
    tracker.assert(revenueVal.includes('$'), 'Expected currency values to return to USD ($), got ' + revenueVal);

    await tracker.screenshot(page, 'F1.3_currency_switched.png');
  });

  await tracker.runStep('F1.4', 'Header Navigation Anchor Links Integrity', async () => {
    const links = await page.$$eval('#desktopNavLinks a', els => els.map(a => ({
      text: a.textContent.trim(),
      href: a.getAttribute('href')
    })));

    tracker.assert(links.length >= 5, `Expected 5 nav links, found ${links.length}`);
    const hrefs = links.map(l => l.href);
    tracker.assert(hrefs.includes('#telemetry'), 'Missing #telemetry anchor');
    tracker.assert(hrefs.includes('#engines'), 'Missing #engines anchor');
    tracker.assert(hrefs.includes('#roadmap'), 'Missing #roadmap anchor');
    tracker.assert(hrefs.includes('#economics'), 'Missing #economics anchor');
    tracker.assert(hrefs.includes('#contact'), 'Missing #contact anchor');
  });

  await tracker.runStep('F1.5', 'Header Portal Cross-Links & Brand Identity', async () => {
    const brandTitle = await page.$eval('.pb-brand-title', el => el.textContent.trim());
    tracker.assertEqual(brandTitle, 'GRO10X', 'Brand title in header should be GRO10X');

    const clientLink = await page.$eval('.pb-btn-portal', el => el.getAttribute('href'));
    tracker.assert(clientLink === '/' || clientLink.includes('index.html'), 'Portal link should point to client site /');

    const requestDeckBtn = await page.$eval('.pb-btn-primary[href="#contact"]', el => el.textContent.trim());
    tracker.assert(requestDeckBtn.includes('Request Deck'), 'Request Deck CTA link should be present');
  });

  await tracker.runStep('F1.6', 'Mobile Viewport Rendering (375x812) Responsiveness', async () => {
    await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 2 });
    await wait(400);

    const isHeroVisible = await page.$eval('.investor-title', el => {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
    tracker.assert(isHeroVisible, 'Investor title should be rendered and visible on mobile viewport');

    const isStripVisible = await page.$eval('.pb-metrics-strip', el => {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
    tracker.assert(isStripVisible, 'Telemetry metrics strip should be rendered and visible on mobile viewport');

    await tracker.screenshot(page, 'F1.6_investors_mobile_viewport.png');

    // Reset to desktop viewport
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });
    await wait(300);
  });

  return tracker.getSummary();
}

module.exports = { runPhaseF1 };
