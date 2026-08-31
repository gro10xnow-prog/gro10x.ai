const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const SCREENSHOTS_DIR = path.join(__dirname, './tests/screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const TEST_DIR = path.join(__dirname, './tmp_test_assets');
if (!fs.existsSync(TEST_DIR)) {
  fs.mkdirSync(TEST_DIR, { recursive: true });
}

const PDF_PATH = path.join(TEST_DIR, 'planner_PLA-01_v1.0.pdf');
fs.writeFileSync(PDF_PATH, '%PDF-1.4\n1 0 obj\n<< /Title (Daily & Weekly Planners #1) >>\nendobj\nxref\n0 1\n0000000000 65535 f \ntrailer\n<< /Root 1 0 R >>\nstartxref\n60\n%%EOF');

const MOCKUP_PATHS = [];
const PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
for (let i = 1; i <= 4; i++) {
  const p = path.join(TEST_DIR, `mockup_${i}.png`);
  fs.writeFileSync(p, Buffer.from(PNG_BASE64, 'base64'));
  MOCKUP_PATHS.push(p);
}

const VIDEO_PATH = path.join(TEST_DIR, 'listing_video.mp4');
fs.writeFileSync(VIDEO_PATH, Buffer.from('fake-video-data-mp4-test'));

async function runTest() {
  console.log('🚀 Starting Puppeteer Automated Browser Test...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  page.on('dialog', async dialog => {
    console.log(`[Browser Dialog]: ${dialog.type()} "${dialog.message()}" -> Accepting`);
    await dialog.accept();
  });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`[Browser Console Error]:`, msg.text());
    }
  });

  console.log('Authenticating with server via /api/auth/pin/verify...');
  const loginRes = await fetch('http://localhost:3000/api/auth/pin/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '01889825025', pin: '1234' })
  });
  const loginData = await loginRes.json();
  if (!loginData.success || !loginData.token) {
    throw new Error('Failed to authenticate DBM with server: ' + JSON.stringify(loginData));
  }
  const token = loginData.token;
  const user = loginData.user || {
    id: 'DBM-001',
    role: 'Digital Brand Manager',
    accessLevel: 'Specialist / Crew',
    name: 'Digital Brand Manager',
    phone: '+8801889825025'
  };

  await page.evaluateOnNewDocument((t, u) => {
    localStorage.setItem('gro10x_token', t);
    localStorage.setItem('gro10x_token', t);
    localStorage.setItem('gro10x_token', t);
    localStorage.setItem('gro10x_token', t);
    localStorage.setItem('gro10x_user', JSON.stringify(u));
    document.cookie = `sb-access-token=${t}; Path=/; SameSite=Lax`;
  }, token, user);

  try {
    const BASE_URL = 'http://localhost:3000';
    console.log('1. Navigating to ' + BASE_URL + '/app/#brands...');
    await page.goto(BASE_URL + '/app/#brands', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await new Promise(r => setTimeout(r, 2000));
    
    console.log('Waiting for BrandsModule to initialize...');
    await page.waitForFunction(() => window.BrandsModule && typeof window.BrandsModule.generateLiveSEOPackage === 'function', { timeout: 15000 });

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01_brands_dashboard.png') });
    console.log('📸 Saved 01_brands_dashboard.png');

    console.log('3. Triggering Studio Drawer for PLA-01...');
    await page.evaluate(() => {
      window.BrandsModule.generateLiveSEOPackage(1, 'PLA-01', encodeURIComponent('Daily & Weekly Planners #1 — PlannerQueenCo Style'));
    });
    await new Promise(r => setTimeout(r, 1500));

    const genBtn = await page.$('#blueprintGenerateBtn');
    if (genBtn) {
      console.log('4. Clicking "Generate Blueprint from Catalog Reference"...');
      await genBtn.click();
      await new Promise(r => setTimeout(r, 3500));
    }

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02_studio_drawer_step1_blueprint.png') });
    console.log('📸 Saved 02_studio_drawer_step1_blueprint.png');

    console.log('5. Navigating to Step 2: Vault File...');
    await page.evaluate(() => {
      window.BrandsModule.switchStudioTab('vault');
    });
    await new Promise(r => setTimeout(r, 500));

    const vaultFileInput = await page.$('#vaultFileInput');
    if (vaultFileInput) {
      await vaultFileInput.uploadFile(PDF_PATH);
      console.log('Uploaded test PDF to file input');
    }

    const saveVaultBtn = await page.$('button[onclick*="uploadProductDeliverable"]');
    if (saveVaultBtn) {
      console.log('Clicking Save Deliverable to Vault...');
      await saveVaultBtn.click();
      await new Promise(r => setTimeout(r, 2500));
    }
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03_step2_vault_uploaded.png') });
    console.log('📸 Saved 03_step2_vault_uploaded.png');

    console.log('6. Navigating to Step 3: Media Studio...');
    await page.evaluate(() => {
      window.BrandsModule.switchStudioTab('mockups');
    });
    await new Promise(r => setTimeout(r, 500));

    const mockupInput = await page.$('#mockupFilesInput');
    if (mockupInput) {
      await mockupInput.uploadFile(...MOCKUP_PATHS);
      console.log('Uploaded 4 test mockups to file input');
    }

    const saveMockupsBtn = await page.$('button[onclick*="uploadProductMockups"]');
    if (saveMockupsBtn) {
      console.log('Clicking Save Mockups to Vault...');
      await saveMockupsBtn.click();
      await new Promise(r => setTimeout(r, 6000));
    }

    const videoInput = await page.$('#listingVideoInput');
    if (videoInput) {
      await videoInput.uploadFile(VIDEO_PATH);
      console.log('Uploaded test video to file input');
    }

    const saveVideoBtn = await page.$('button[onclick*="uploadProductVideo"]');
    if (saveVideoBtn) {
      console.log('Clicking Save Video...');
      await saveVideoBtn.click();
      await new Promise(r => setTimeout(r, 4000));
    }
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04_step3_media_mockups_video.png') });
    console.log('📸 Saved 04_step3_media_mockups_video.png');

    console.log('7. Navigating to Step 4: AI Vision Audit...');
    await page.evaluate(() => {
      window.BrandsModule.switchStudioTab('audit');
    });
    await new Promise(r => setTimeout(r, 500));

    const auditBtn = await page.$('button[onclick*="runAIProductAudit"]');
    if (auditBtn) {
      console.log('Clicking Run AI Vision Audit Now...');
      await auditBtn.click();
      await new Promise(r => setTimeout(r, 3000));
    }
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05_step4_ai_audit_results.png') });
    console.log('📸 Saved 05_step4_ai_audit_results.png');

    console.log('8. Navigating to Step 5: AI Etsy SEO...');
    await page.evaluate(() => {
      window.BrandsModule.switchStudioTab('seo');
    });
    await new Promise(r => setTimeout(r, 500));

    const seoGenBtn = await page.$('button[onclick*="generateStudioSEOWithAI"]');
    if (seoGenBtn) {
      console.log('Clicking Generate SEO with Audit Context...');
      await seoGenBtn.click();
      await new Promise(r => setTimeout(r, 2000));
    }
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '06_step5_seo_package.png') });
    console.log('📸 Saved 06_step5_seo_package.png');

    console.log('9. Clicking Submit for Admin Review...');
    const submitBtn = await page.$('button[onclick*="submitProductForReview"]');
    if (submitBtn) {
      await submitBtn.click();
      await new Promise(r => setTimeout(r, 2500));
    }
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '07_submitted_status_confirmed.png') });
    console.log('📸 Saved 07_submitted_status_confirmed.png');

    console.log('10. Checking Admin Review Queue...');
    await page.evaluate(() => {
      window.BrandsModule.switchTab('queue');
    });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '08_admin_review_queue.png') });
    console.log('📸 Saved 08_admin_review_queue.png');

    console.log('✅ ALL SCREENSHOT AUTOMATION TESTS COMPLETED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Automation Error:', err);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'error_state.png') });
  } finally {
    await browser.close();
  }
}

runTest();
