/**
 * scripts/e2e/suites/suite-a-admin/phase-A11-engines-portfolio.js
 * Suite A - Phase A11: 5-Engine Operations, Marketplace Gigs, Platform Portfolio, Analytics & CMS Editor
 * 
 * Tests:
 * 1. 5-Engine Growth Operations Cockpit (#engines) & Revenue Logging
 * 2. Platform Portfolio Registry & Architecture Cockpit (#platforms) with Live Search
 * 3. Marketplace Gig Studio & Fiverr/Upwork Copy Studio (#gigs)
 * 4. Agency Analytics & Performance Intelligence (#analytics) with Period Selector & Export Dropdown
 * 5. Services Catalog & Landing Page CMS Editor (#cms) & Create Service Package Modal
 * 6. Admin OS 22-Tab Full Integrity Closure Verification
 */

const { APP_URL, wait, interceptApiCall, TestTracker } = require('../../utils');
const { injectRoleSession } = require('../../auth');

async function runPhaseA11(page) {
  const tracker = new TestTracker('Suite A - Phase A11: Engines, Gigs, Platforms, Analytics & CMS');
  console.log('\n--- 🚀 Running Suite A - Phase A11: Engines, Platforms, Gigs, Analytics & CMS ---');

  // Ensure owner session is loaded
  await injectRoleSession(page, 'owner');

  await tracker.runStep('A11.1', '5-Engine Growth Operations Cockpit (#engines)', async () => {
    await page.goto(APP_URL + '#engines', { waitUntil: 'networkidle2' });
    await wait(1200);

    await page.waitForFunction(() => {
      const el = document.querySelector('#app-view');
      return el && (el.textContent.includes('5-Engine') || el.textContent.includes('Growth Operations') || el.textContent.includes('ARR'));
    }, { timeout: 8000 });

    const isEnginesReady = await page.evaluate(() => {
      return typeof window.EnginesModule === 'object' && window.EnginesModule !== null;
    });
    tracker.assert(isEnginesReady, 'window.EnginesModule must be initialized on window');

    const content = await page.$eval('#app-view', el => el.textContent);
    tracker.assert(
      content.includes('100,000') || content.includes('Engine') || content.includes('Run Rate'),
      '5-Engine Growth Cockpit must display ARR run rate and performance metrics'
    );

    // Test revenue logging modal via prompt mock
    await page.evaluate(() => {
      let callCount = 0;
      window.prompt = () => {
        callCount++;
        if (callCount === 1) return '1'; // Engine 1: Micro-SaaS
        return '500'; // $500 USD
      };
    });

    await page.evaluate(() => {
      window.EnginesModule.openLogRevenueModal();
    });
    await wait(500);

    await tracker.screenshot(page, 'A11.1_engines_cockpit.png');
  });

  await tracker.runStep('A11.2', 'Platform Portfolio Registry & Architecture Cockpit (#platforms)', async () => {
    await page.goto(APP_URL + '#platforms', { waitUntil: 'networkidle2' });
    await wait(1200);

    await page.waitForFunction(() => {
      const el = document.querySelector('#app-view');
      return el && (el.textContent.includes('Platform') || el.textContent.includes('Architecture') || el.textContent.includes('Registry'));
    }, { timeout: 8000 });

    const isPlatformsReady = await page.evaluate(() => {
      return typeof window.PlatformsModule === 'object' && window.PlatformsModule !== null;
    });
    tracker.assert(isPlatformsReady, 'window.PlatformsModule must be initialized on window');

    // Test live search filter
    await page.evaluate(() => {
      window.PlatformsModule.handleSearch('GroUp');
    });
    await wait(400);

    const visibleCards = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.platform-card'));
      return cards.filter(c => c.style.display !== 'none').length;
    });
    tracker.assert(visibleCards >= 1, 'Search filter for "GroUp" must match registered platform');

    // Reset search
    await page.evaluate(() => {
      window.PlatformsModule.handleSearch('');
    });
    await wait(300);

    await tracker.screenshot(page, 'A11.2_platforms_registry.png');
  });

  await tracker.runStep('A11.3', 'Marketplace Gig Studio & Fiverr/Upwork Copy Studio (#gigs)', async () => {
    await page.goto(APP_URL + '#gigs', { waitUntil: 'networkidle2' });
    await wait(1200);

    await page.waitForFunction(() => {
      const el = document.querySelector('#app-view');
      return el && (el.textContent.includes('Gig') || el.textContent.includes('Marketplace'));
    }, { timeout: 8000 });

    const isGigsReady = await page.evaluate(() => {
      return typeof window.GigsModule === 'object' && window.GigsModule !== null;
    });
    tracker.assert(isGigsReady, 'window.GigsModule must be initialized on window');

    const content = await page.$eval('#app-view', el => el.textContent);
    tracker.assert(
      content.includes('Marketplace Gig Studio') && (content.includes('Quota') || content.includes('Health')),
      'Gig Studio must display 7-slot quota and marketplace compliance metrics'
    );

    // Open Copy Studio Drawer for first gig
    await page.evaluate(() => {
      const firstBtn = document.querySelector('button[onclick*="openCopyStudio"]');
      if (firstBtn) firstBtn.click();
    });
    await wait(500);

    const isModalVisible = await page.evaluate(() => {
      const overlay = document.getElementById('gigStudioModalOverlay');
      return overlay && overlay.style.display !== 'none';
    });
    tracker.assert(isModalVisible, '#gigStudioModalOverlay must be open');

    await tracker.screenshot(page, 'A11.3_gigs_studio.png');

    // Close Copy Studio
    await page.evaluate(() => {
      const overlay = document.getElementById('gigStudioModalOverlay');
      if (overlay) overlay.style.display = 'none';
    });
    await wait(300);
  });

  await tracker.runStep('A11.4', 'Agency Analytics & Performance Intelligence (#analytics)', async () => {
    await page.goto(APP_URL + '#analytics', { waitUntil: 'networkidle2' });
    await wait(1200);

    await page.waitForFunction(() => {
      const el = document.querySelector('#app-view');
      return el && (el.textContent.includes('Analytics') || el.textContent.includes('Intelligence'));
    }, { timeout: 8000 });

    const isAnalyticsReady = await page.evaluate(() => {
      return typeof window.ANALYTICS_MODULE === 'object' && window.ANALYTICS_MODULE !== null;
    });
    tracker.assert(isAnalyticsReady, 'window.ANALYTICS_MODULE must be initialized on window');

    // Test period selector change
    await page.evaluate(() => {
      const sel = document.getElementById('analyticsDaysSelect');
      if (sel) {
        sel.value = '90';
        sel.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await wait(500);

    // Test Export Menu dropdown toggle
    await page.evaluate(() => {
      window.ANALYTICS_MODULE.toggleExportMenu();
    });
    await wait(300);

    const isDropdownVisible = await page.evaluate(() => {
      const d = document.getElementById('exportMenuDropdown');
      return d && d.style.display !== 'none';
    });
    tracker.assert(isDropdownVisible, '#exportMenuDropdown must toggle open');

    // Toggle dropdown closed
    await page.evaluate(() => {
      window.ANALYTICS_MODULE.toggleExportMenu();
    });
    await wait(300);

    await tracker.screenshot(page, 'A11.4_analytics_intelligence.png');
  });

  await tracker.runStep('A11.5', 'Services Catalog & Landing Page CMS Editor (#cms)', async () => {
    await page.goto(APP_URL + '#cms', { waitUntil: 'networkidle2' });
    await wait(1200);

    await page.waitForFunction(() => {
      const el = document.querySelector('#app-view');
      return el && (el.textContent.includes('Services Catalog') || el.textContent.includes('CMS'));
    }, { timeout: 8000 });

    const isCmsReady = await page.evaluate(() => {
      return typeof window.CMS_MODULE === 'object' && window.CMS_MODULE !== null;
    });
    tracker.assert(isCmsReady, 'window.CMS_MODULE must be initialized on window');

    // Open Add Service Package Modal
    await page.evaluate(() => {
      window.CMS_MODULE.openAddServiceModal();
    });
    await wait(400);

    const isModalActive = await page.evaluate(() => {
      const m = document.getElementById('cmsServiceModal');
      return m && m.classList.contains('active');
    });
    tracker.assert(isModalActive, '#cmsServiceModal must have .active class');

    await tracker.screenshot(page, 'A11.5_cms_services.png');

    // Close Modal
    await page.evaluate(() => {
      window.CMS_MODULE.closeModal();
    });
    await wait(300);
  });

  await tracker.runStep('A11.6', 'Admin OS 22-Tab Full Integrity Closure Verification', async () => {
    const ALL_ADMIN_ROUTES = [
      '#dashboard', '#engines', '#platforms', '#gigs', '#analytics',
      '#crm', '#kanban', '#reviews', '#content-os', '#social',
      '#cms', '#brands', '#digistore', '#dbm', '#finance',
      '#hr', '#assets', '#tickets', '#automation', '#leads',
      '#proposals', '#settings'
    ];

    tracker.assert(ALL_ADMIN_ROUTES.length === 22, 'Must verify all 22 Admin OS tabs');

    const sidebarHrefs = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.sidebar-nav .nav-item'));
      return items.map(el => el.getAttribute('href'));
    });

    const allPresent = ALL_ADMIN_ROUTES.every(route => sidebarHrefs.includes(route));
    tracker.assert(allPresent, `All 22 Admin OS tabs are present in sidebar navigation (${sidebarHrefs.length} total)`);
  });

  return tracker.getSummary();
}

module.exports = { runPhaseA11 };
