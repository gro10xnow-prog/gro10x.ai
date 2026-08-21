/**
 * scripts/run-visual-e2e.js
 * Automated Visual & Interaction Browser Testing Script for PurpleOS Admin Panel
 */
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { signToken } = require('../src/services/jwt');

const ARTIFACTS_DIR = 'C:\\Users\\LeNoVo\\.gemini\\antigravity\\brain\\d8d9ad1c-1a18-4645-8113-f55dcc1dc507';
const PORT = 3000;
const APP_URL = `http://localhost:${PORT}/app/index.html`;

async function isServerRunning() {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${PORT}/api/system-health`, (res) => {
      resolve(res.statusCode === 200 || res.statusCode === 401);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function startServerIfNeeded() {
  const running = await isServerRunning();
  if (running) {
    console.log('✅ Server already running on port ' + PORT);
    return null;
  }
  console.log('🚀 Starting Express server on port ' + PORT + '...');
  const app = require('../server.js');
  return new Promise((resolve) => {
    const server = app.listen(PORT, () => {
      console.log(`✅ Server successfully listening on http://localhost:${PORT}`);
      resolve(server);
    });
  });
}

async function runVisualE2E() {
  console.log('🌐 Starting Visual Browser Automation Suite...');
  const serverInstance = await startServerIfNeeded();

  // Generate valid signed JWT Admin Token
  const validAdminToken = signToken({
    id: 'PBD-004',
    emp_code: 'PBD-004',
    name: 'Md. Zahin Khandaker',
    phone: '01708459008',
    role: 'Tech Admin',
    access_level: 'Technology Admin',
    type: 'team'
  });

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });

  try {
    // 1. Navigate to Admin App & Hydrate Auth
    console.log('1️⃣ Navigating to PurpleOS Admin Portal...');
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // Inject Mock Admin Session into localStorage to ensure full admin privileges
    await page.evaluate((token) => {
      localStorage.setItem('sb-access-token', token);
      localStorage.setItem('purpleos_pin_token', token);
      localStorage.setItem('purple_token', token);
      localStorage.setItem('purple_user', JSON.stringify({
        id: 'PBD-004',
        emp_code: 'PBD-004',
        name: 'Md. Zahin Khandaker',
        phone: '01708459008',
        role: 'Tech Admin',
        access_level: 'Technology Admin'
      }));
    }, validAdminToken);

    await page.goto(APP_URL + '#dashboard', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));

    // Capture 01: Executive Command Dashboard
    console.log('📸 Capturing Screenshot 1: Executive Command Dashboard...');
    const dashPath = path.join(ARTIFACTS_DIR, 'screenshot_01_dashboard.png');
    await page.screenshot({ path: dashPath, fullPage: false });

    // 2. Test Command Palette (Ctrl+K)
    console.log('2️⃣ Triggering Global Command Palette (Ctrl+K)...');
    await page.keyboard.down('Control');
    await page.keyboard.press('KeyK');
    await page.keyboard.up('Control');
    await new Promise(r => setTimeout(r, 800));

    // Type query in search
    const searchInp = await page.$('#cmdPaletteInput');
    if (searchInp) {
      await searchInp.type('Chillox');
      await new Promise(r => setTimeout(r, 600));
    }
    console.log('📸 Capturing Screenshot 2: Command Palette Modal...');
    const cmdPath = path.join(ARTIFACTS_DIR, 'screenshot_02_command_palette.png');
    await page.screenshot({ path: cmdPath, fullPage: false });

    // Close palette
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 500));

    // 3. Navigate to Finance Hub
    console.log('3️⃣ Navigating to Finance & Invoicing Command Center...');
    await page.evaluate(() => { window.location.hash = '#finance'; });
    await new Promise(r => setTimeout(r, 1500));

    console.log('📸 Capturing Screenshot 3: Finance Command Center...');
    const finPath = path.join(ARTIFACTS_DIR, 'screenshot_03_finance_hub.png');
    await page.screenshot({ path: finPath, fullPage: false });

    // 4. Navigate to Production Kanban
    console.log('4️⃣ Navigating to Production Kanban Pipeline...');
    await page.evaluate(() => { window.location.hash = '#kanban'; });
    await new Promise(r => setTimeout(r, 1500));

    console.log('📸 Capturing Screenshot 4: Kanban Board with Workload & Urgent Glow...');
    const kanbanPath = path.join(ARTIFACTS_DIR, 'screenshot_04_kanban_hub.png');
    await page.screenshot({ path: kanbanPath, fullPage: false });

    // 5. Open Bulk Import Modal
    console.log('5️⃣ Opening Bulk Import CSV & AI Sanitizer Modal...');
    await page.evaluate(() => {
      if (window.KANBAN_MODULE && window.KANBAN_MODULE.openImportModal) {
        window.KANBAN_MODULE.openImportModal();
        window.KANBAN_MODULE.downloadSampleCSV = () => {}; // mock download
        const mockCsv = "Task Title,Client Name,Project Name,Assignee,Department,Workflow Type,Stage,Priority,Due Date,Estimated Hours,Description\nHero Commercial Video Cut 1,Apex Footwear,Apex Autumn 2026 Campaign,Md. Zahin Khandaker,Post Production,video,Editing,Urgent,2026-09-15,12,Main 60s 4K video edit\nSocial Media 15-Grid Creative Suite,Chillox Bangladesh,Chillox Retainer,Firoz Ahmed,Creative,social,Content Draft,Medium,2026-09-10,16,15 static banners";
        window.KANBAN_MODULE.processCSVText(mockCsv);
      }
    });
    await new Promise(r => setTimeout(r, 800));

    console.log('📸 Capturing Screenshot 5: Bulk Import Modal...');
    const importPath = path.join(ARTIFACTS_DIR, 'screenshot_05_bulk_import_ai_cleaner.png');
    await page.screenshot({ path: importPath, fullPage: false });

    // Close import modal
    await page.evaluate(() => {
      if (window.KANBAN_MODULE && window.KANBAN_MODULE.closeImportModal) {
        window.KANBAN_MODULE.closeImportModal();
      }
    });
    await new Promise(r => setTimeout(r, 500));

    // 6. Navigate to HR Roster & Open Staff Drawer
    console.log('6️⃣ Navigating to HR Staff Roster & Opening Profile Drawer...');
    await page.evaluate(() => { window.location.hash = '#hr'; });
    await new Promise(r => setTimeout(r, 1500));

    await page.evaluate(() => {
      if (window.HR_MODULE && window.HR_MODULE.viewProfile) {
        window.HR_MODULE.viewProfile('PBD-003');
      }
    });
    await new Promise(r => setTimeout(r, 800));

    console.log('📸 Capturing Screenshot 6: HR Staff Profile Drawer with PIN Reset...');
    const hrPath = path.join(ARTIFACTS_DIR, 'screenshot_06_hr_staff_drawer.png');
    await page.screenshot({ path: hrPath, fullPage: false });

    console.log('🎉 ALL 6 BROWSER SCREENSHOTS CAPTURED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Browser testing error:', err);
  } finally {
    await browser.close();
    if (serverInstance) {
      serverInstance.close();
    }
    process.exit(0);
  }
}

runVisualE2E();
