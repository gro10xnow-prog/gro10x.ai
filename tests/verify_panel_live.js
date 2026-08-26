const puppeteer = require('puppeteer');
const https = require('https');
const path = require('path');
const fs = require('fs');

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
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function verifyPanel() {
  console.log('--- Verifying Live Panel Reflection ---');
  const authData = await getAuthToken();
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--window-size=1440,900']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.goto('https://gro10x-ai.vercel.app/app/', { waitUntil: 'domcontentloaded' });
  await page.evaluate((auth) => {
    localStorage.clear();
    localStorage.setItem('gro10x_token', auth.token);
    localStorage.setItem('gro10x_user', JSON.stringify({ ...auth.user, role: 'Founder & CEO', accessLevel: 'admin' }));
    document.cookie = 'gro10x_token=' + auth.token + '; path=/; max-age=86400';
  }, authData);

  await page.goto('https://gro10x-ai.vercel.app/app/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  // Open Brand Command Center
  await page.evaluate(() => {
    const navItems = Array.from(document.querySelectorAll('.nav-item, a'));
    const brandBtn = navItems.find(el => el.innerText && el.innerText.includes('Brand Command Center'));
    if (brandBtn) brandBtn.click();
    else if (window.BrandsModule?.render) window.BrandsModule.render();
  });
  await new Promise(r => setTimeout(r, 2500));

  // Switch to Etsy Tab
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('#brandsTabNav button'));
    const etsyTab = tabs.find(t => t.innerText && t.innerText.includes('Etsy'));
    if (etsyTab) etsyTab.click();
    else if (window.BrandsModule?.switchTab) window.BrandsModule.switchTab('etsy');
  });
  await new Promise(r => setTimeout(r, 3000));

  // Check the DOM values
  const panelStatus = await page.evaluate(() => {
    const row = document.querySelector('tr[data-code="PLA-01"]');
    const metricCards = Array.from(document.querySelectorAll('.card-glass')).map(c => c.innerText.replace(/\n+/g, ' '));
    const brandSelector = document.getElementById('etsyBrandSelector')?.selectedOptions?.[0]?.text;
    return {
      pla01Row: row ? row.innerText.replace(/\n+/g, ' | ') : 'ROW NOT FOUND',
      metricCards: metricCards.slice(0, 8),
      brandSelector
    };
  });
  console.log('Panel Status:\n', JSON.stringify(panelStatus, null, 2));

  const destPath = path.join('C:', 'Users', 'LeNoVo', '.gemini', 'antigravity', 'brain', '3a369bde-d8c9-4150-baa2-45eb251e4266', 'live_panel_verified.png');
  await page.screenshot({ path: destPath, fullPage: false });
  console.log('📸 Screenshot saved to:', destPath);

  await browser.close();
}
verifyPanel();
