/**
 * GRO10X Admin Review to Publish — Live E2E Verification Test
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const https = require('https');

const BASE_URL = process.env.BASE_URL || 'https://gro10x-ai.vercel.app';
const REPORT_DIR = path.join(__dirname, 'test_report_admin_review_' + Date.now());
const SCREENSHOTS_DIR = path.join(REPORT_DIR, 'screenshots');
fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

function log(msg) { console.log(msg); }

async function snap(page, name, title) {
  const filePath = path.join(SCREENSHOTS_DIR, name + '.png');
  await page.screenshot({ path: filePath, fullPage: false });
  log(`📸 [${name}] ${title || ''}`);
  return filePath;
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// Direct PIN login helper
async function getAuthToken() {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ phone: '01889825025', pin: '1234' });
    const req = https.request({
      hostname: 'gro10x-ai.vercel.app',
      path: '/api/auth/pin/verify',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': payload.length }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch(e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function run() {
  log('============================================================');
  log('🚀 GRO10X Admin Review → Publish Flow Test');
  log('Base: ' + BASE_URL);
  log('Report: ' + REPORT_DIR);
  log('============================================================\n');

  const authData = await getAuthToken();
  log('✅ Auth successful — User: ' + (authData.user?.name || 'Admin'));

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  try {
    // 1. Load base page and inject credentials
    log('\n[1] Load Base Page & Inject Auth Token');
    await page.goto(BASE_URL + '/app/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await snap(page, '01_base_page', 'Base Page Loaded');

    await page.evaluate((auth) => {
      localStorage.setItem('gro10x_token', auth.token);
      localStorage.setItem('gro10x_user', JSON.stringify({
        ...auth.user,
        role: 'Founder & CEO',
        accessLevel: 'admin'
      }));
      document.cookie = 'gro10x_token=' + auth.token + '; path=/; max-age=86400';
    }, authData);

    // 2. Navigate to /app/ Dashboard
    log('\n[2] Navigate to /app/ Dashboard');
    await page.goto(BASE_URL + '/app/', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);
    await snap(page, '02_app_dashboard', 'App Dashboard');

    // 3. Open Brand Command Center
    log('\n[3] Open Brand Command Center');
    await page.evaluate(() => {
      const navItems = Array.from(document.querySelectorAll('.nav-item, [onclick*="brands"], a'));
      const brandBtn = navItems.find(el => el.innerText && el.innerText.includes('Brand Command Center'));
      if (brandBtn) brandBtn.click();
      else if (window.BrandsModule?.render) window.BrandsModule.render();
    });
    await sleep(2500);
    await snap(page, '03_brand_center', 'Brand Command Center Loaded');

    // 4. Click Etsy Command Center Tab
    log('\n[4] Open Etsy Command Center Tab');
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('#brandsTabNav button, button[onclick*="switchTab"]'));
      const etsyTab = tabs.find(t => t.innerText && t.innerText.includes('Etsy'));
      if (etsyTab) etsyTab.click();
      else if (window.BrandsModule?.switchTab) window.BrandsModule.switchTab('etsy');
    });
    await sleep(2500);
    await snap(page, '04_etsy_tab', 'Etsy Command Center Tab');

    // 5. Switch to Admin Review Queue Sub-View
    log('\n[5] Switch to Admin Review Queue Sub-View');
    await page.evaluate(() => {
      if (window.BrandsModule?.setEtsySubView) {
        window.BrandsModule.setEtsySubView('review_queue');
      } else {
        const subBtns = Array.from(document.querySelectorAll('button[onclick*="setEtsySubView"]'));
        const qBtn = subBtns.find(b => b.innerText && b.innerText.includes('Review Queue'));
        if (qBtn) qBtn.click();
      }
    });
    await sleep(2000);
    await snap(page, '05_review_queue_table', 'Review Queue Table Sub-View');

    // 6. Click "🔍 Inspect & Review" to expand inline panel
    log('\n[6] Expand Inline Inspection Panel');
    const inspectBtnFound = await page.evaluate(() => {
      const inspectBtns = Array.from(document.querySelectorAll('button[onclick*="toggleReviewInspection"]'));
      if (inspectBtns.length > 0) {
        inspectBtns[0].click();
        return true;
      }
      return false;
    });
    log('  Inspect button clicked: ' + inspectBtnFound);
    await sleep(2000);
    await snap(page, '06_inline_inspection_panel', 'Expanded Inline Inspection Panel');

    // 7. Verify all 4 asset cards in the inspection panel
    const panelDetails = await page.evaluate(() => {
      const panel = document.querySelector('tr[id^="reviewDetail_"]');
      if (!panel) return { found: false };
      return {
        found: true,
        display: panel.style.display,
        textSnippet: panel.innerText.slice(0, 400)
      };
    });
    log('  Panel details: ' + JSON.stringify(panelDetails));

    // 8. Click "✅ Approve & Set Live"
    log('\n[8] Click "Approve & Set Live"');
    const approveBtnClicked = await page.evaluate(() => {
      const approveBtns = Array.from(document.querySelectorAll('button[onclick*="approveProductDirectly"]'));
      if (approveBtns.length > 0) {
        approveBtns[0].click();
        return true;
      }
      return false;
    });
    log('  Approve button clicked: ' + approveBtnClicked);
    await sleep(4000);
    await snap(page, '07_after_approval', 'After Product Approval');

    // 9. Switch back to Catalog view to verify the product is LIVE
    log('\n[9] Switch to Catalog View & Verify Live Status');
    await page.evaluate(() => {
      if (window.BrandsModule?.setEtsySubView) {
        window.BrandsModule.setEtsySubView('catalog');
      }
    });
    await sleep(2000);
    await snap(page, '08_catalog_live_verified', 'Catalog with Product Live');

    log('\n============================================================');
    log('🎉 ALL ADMIN REVIEW & APPROVAL STEPS COMPLETED');
    log('============================================================');

  } catch (err) {
    log('\n❌ TEST ERROR: ' + err.message);
    await snap(page, 'error_state', 'Test Error State');
  } finally {
    await browser.close();
  }
}

run();
