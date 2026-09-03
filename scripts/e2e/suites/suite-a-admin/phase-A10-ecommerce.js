/**
 * scripts/e2e/suites/suite-a-admin/phase-A10-ecommerce.js
 * Suite A - Phase A10: Digital Brand Empire, Products & DigiStore E-Commerce
 * 
 * Tests:
 * 1. Load Digital Brand Empire Hub (#brands) & Verify Portfolio Matrix
 * 2. Brand Studio Drawer & 8-Step Launch Checklist (#brands roster subtab)
 * 3. Products Catalog Upload Tracker (#brands products subtab)
 * 4. Load DigiVault Subscription Hub (#digistore) & Verify Order Pipeline
 * 5. DigiVault Product Catalog & Margin Engine (#digistore products subtab)
 * 6. DBM Operations & Team Tracker Hub (#dbm)
 */

const { APP_URL, wait, interceptApiCall, TestTracker } = require('../../utils');
const { injectRoleSession } = require('../../auth');

async function runPhaseA10(page) {
  const tracker = new TestTracker('Suite A - Phase A10: E-Commerce, Brands & DigiStore');
  console.log('\n--- 🛍️ Running Suite A - Phase A10: Digital Brands & DigiStore ---');

  // Ensure owner session is loaded
  await injectRoleSession(page, 'owner');
  await page.goto(APP_URL + '#brands', { waitUntil: 'networkidle2' });
  await wait(1200);

  await tracker.runStep('A10.1', 'Load Digital Brand Empire Hub & Verify Portfolio Matrix', async () => {
    await page.waitForFunction(() => {
      const el = document.querySelector('#brands-tab-container') || document.querySelector('#app-view');
      return el && el.textContent.includes('Brand');
    }, { timeout: 8000 });

    const isBrandsReady = await page.evaluate(() => {
      return typeof window.BrandsModule === 'object' && window.BrandsModule !== null;
    });
    tracker.assert(isBrandsReady, 'window.BrandsModule must be initialized on window');

    const content = await page.$eval('#app-view', el => el.textContent);
    tracker.assert(
      content.includes('328,116') || content.includes('Digital') || content.includes('Portfolio'),
      'Digital Brand Empire hub must render portfolio revenue targets & overview'
    );

    await tracker.screenshot(page, 'A10.1_brands_matrix.png');
  });

  await tracker.runStep('A10.2', 'Brand Studio Drawer & 8-Step Launch Checklist (#brands roster)', async () => {
    // Switch to brand roster subtab
    await page.evaluate(() => {
      window.BrandsModule.switchTab('roster');
    });
    await wait(600);

    // Open brand drawer for Brand #1 (PlannerQueenGro)
    await page.evaluate(() => {
      window.BrandsModule.openBrandDrawer(1);
    });
    await wait(500);

    const isDrawerOpen = await page.evaluate(() => {
      const d = document.getElementById('brandDetailDrawer');
      return d && d.style.display !== 'none';
    });
    tracker.assert(isDrawerOpen, '#brandDetailDrawer must be open (display !== none)');

    const drawerContent = await page.$eval('#drawerInner', el => el.textContent);
    tracker.assert(
      drawerContent.includes('PlannerQueenGro') && drawerContent.includes('8-Step'),
      'Brand Studio drawer must display brand name and 8-step launch checklist'
    );

    await tracker.screenshot(page, 'A10.2_brand_studio_drawer.png');

    // Close drawer
    await page.evaluate(() => {
      const d = document.getElementById('brandDetailDrawer');
      if (d) d.style.display = 'none';
    });
    await wait(300);
  });

  await tracker.runStep('A10.3', 'Products Catalog Upload Tracker (#brands products)', async () => {
    await page.evaluate(() => {
      window.BrandsModule.switchTab('products');
    });
    await wait(600);

    const content = await page.$eval('#brands-tab-container', el => el.textContent);
    tracker.assert(
      content.includes('Product') || content.includes('Tracker') || content.includes('Upload') || content.includes('1,300'),
      'Products catalog upload tracker must render product upload progress'
    );

    await tracker.screenshot(page, 'A10.3_products_tracker.png');
  });

  await tracker.runStep('A10.4', 'Load DigiVault Subscription Hub (#digistore) & Verify Order Pipeline', async () => {
    await page.goto(APP_URL + '#digistore', { waitUntil: 'networkidle2' });
    await wait(1200);

    await page.waitForFunction(() => {
      const el = document.querySelector('#app-view');
      return el && (el.textContent.includes('DigiVault') || el.textContent.includes('Order') || el.textContent.includes('Subscription'));
    }, { timeout: 8000 });

    const isDigistoreReady = await page.evaluate(() => {
      return typeof window.DigistoreModule === 'object' && window.DigistoreModule !== null;
    });
    tracker.assert(isDigistoreReady, 'window.DigistoreModule must be initialized on window');

    const content = await page.$eval('#app-view', el => el.textContent);
    tracker.assert(
      content.includes('Order') || content.includes('SLA') || content.includes('Queue'),
      'DigiVault orders hub must render order management pipeline'
    );

    await tracker.screenshot(page, 'A10.4_digistore_orders.png');
  });

  await tracker.runStep('A10.5', 'DigiVault Product Catalog & Margin Engine (#digistore products)', async () => {
    await page.evaluate(() => {
      window.DigistoreModule.switchTab('products');
    });
    await wait(600);

    const content = await page.$eval('#app-view', el => el.textContent);
    tracker.assert(
      content.includes('Product') || content.includes('Margin') || content.includes('Catalog') || content.includes('BDT'),
      'DigiVault product catalog must display digital subscription offerings & margin engine'
    );

    await tracker.screenshot(page, 'A10.5_digistore_products.png');
  });

  await tracker.runStep('A10.6', 'DBM Operations & Team Tracker Hub (#dbm)', async () => {
    await page.goto(APP_URL + '#dbm', { waitUntil: 'networkidle2' });
    await wait(1200);

    await page.waitForFunction(() => {
      const el = document.querySelector('#app-view');
      return el && (el.textContent.includes('DBM') || el.textContent.includes('Brand Manager') || el.textContent.includes('Standup'));
    }, { timeout: 8000 });

    const isDbmReady = await page.evaluate(() => {
      return typeof window.DBMModule === 'object' && window.DBMModule !== null;
    });
    tracker.assert(isDbmReady, 'window.DBMModule must be initialized on window');

    const content = await page.$eval('#app-view', el => el.textContent);
    tracker.assert(
      content.includes('DBM') && (content.includes('Standup') || content.includes('Division') || content.includes('Pipeline')),
      'DBM Operations hub must display team division matrix and daily operating tracker'
    );

    // Test opening DBM standup modal
    await page.evaluate(() => {
      window.DBMModule.openLogStandupModal();
    });
    await wait(400);

    const isModalOpen = await page.evaluate(() => {
      const m = document.getElementById('dbmStandupModal');
      return m && m.style.display !== 'none';
    });
    tracker.assert(isModalOpen, '#dbmStandupModal should open when requested');

    // Close modal
    await page.evaluate(() => {
      const m = document.getElementById('dbmStandupModal');
      if (m) m.style.display = 'none';
    });
    await wait(300);

    await tracker.screenshot(page, 'A10.6_dbm_operations.png');
  });

  return tracker.getSummary();
}

module.exports = { runPhaseA10 };
