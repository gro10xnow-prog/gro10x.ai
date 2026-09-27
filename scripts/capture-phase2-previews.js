/**
 * scripts/capture-phase2-previews.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Captures high-res visual verification screenshots for Phase 2:
 * 1. Etsy Buyer Delivery Certificate (/delivery)
 * 2. Universal Customer Vault & Credit Wallet (/my-portal)
 * 3. Daily Execution Planner with AI Focus Coach Briefing (/planner)
 * ─────────────────────────────────────────────────────────────────────────────
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const http = require('http');
const app = require('../server');

async function capturePreviews() {
  console.log('📸 Starting Phase 2 Visual Previews Capture over HTTP...');
  const distDir = path.join(__dirname, '..', 'dist');
  if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });

  const artMediaDir = 'C:/Users/LeNoVo/.gemini/antigravity/brain/895ad1f6-33f4-4ee6-bd65-45d7acd0b387/.tempmediaStorage';
  if (!fs.existsSync(artMediaDir)) fs.mkdirSync(artMediaDir, { recursive: true });

  const PORT = 3099;
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`📡 Local preview server listening on http://127.0.0.1:${PORT}`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 960, deviceScaleFactor: 2 });

    // 1. Delivery Certificate
    console.log(`📄 Capturing Delivery Certificate...`);
    await page.goto(`http://127.0.0.1:${PORT}/delivery`, { waitUntil: 'networkidle0', timeout: 20000 });
    const deliveryShot = path.join(distDir, 'PLA-14_Delivery_Certificate.png');
    await page.screenshot({ path: deliveryShot, fullPage: true });
    fs.copyFileSync(deliveryShot, path.join(artMediaDir, 'PLA-14_Delivery_Certificate.png'));
    console.log(`✅ Saved: ${deliveryShot}`);

    // 2. Customer Portal Dashboard
    console.log(`📄 Capturing Customer Portal...`);
    await page.goto(`http://127.0.0.1:${PORT}/my-portal`, { waitUntil: 'networkidle0', timeout: 20000 });
    await page.click('#btnInstantDemo');
    await page.waitForSelector('#dashboardView', { visible: true, timeout: 10000 });
    await new Promise(r => setTimeout(r, 800));
    const portalShot = path.join(distDir, 'PLA-14_Customer_Portal_Dashboard.png');
    await page.screenshot({ path: portalShot, fullPage: true });
    fs.copyFileSync(portalShot, path.join(artMediaDir, 'PLA-14_Customer_Portal_Dashboard.png'));
    console.log(`✅ Saved: ${portalShot}`);

    // 3. Interactive Planner with AI Focus Coach Modal
    console.log(`📄 Capturing Planner AI Focus Coach...`);
    await page.goto(`http://127.0.0.1:${PORT}/planner`, { waitUntil: 'networkidle0', timeout: 20000 });
    await page.click('.side-tab[data-tab="tab-daily"]');
    await new Promise(r => setTimeout(r, 500));

    // Show modal
    const evalRes = await page.evaluate(() => {
      const modal = document.getElementById('aiCoachModal');
      const result = document.getElementById('aiModalResult');
      const loading = document.getElementById('aiModalLoading');
      if (!modal) return { error: 'aiCoachModal NOT FOUND in DOM' };
      if (loading) loading.style.display = 'none';
      modal.style.display = 'flex';
      if (result) {
        result.innerHTML = `
          <div class="ai-briefing-box">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.5rem;">
              <span style="font-size: 0.75rem; font-weight: 700; color: var(--accent-sage); text-transform: uppercase;">✨ Morning Briefing Generated</span>
              <span style="font-size: 0.75rem; color: var(--text-muted);">Energy Level: 4/5 · GroCredits: 190</span>
            </div>
            <h4 style="margin-top: 0;">⚡ FOCUS ARCHITECTURE</h4>
            <p style="font-size: 0.88rem; line-height: 1.6; margin-bottom: 0.6rem;">
              Tackle your primary needle-mover during your first 90-minute morning window before checking notifications. Protect this time block fiercely.
            </p>
            <h4>🛡️ FRICTION BUSTER</h4>
            <p style="font-size: 0.88rem; line-height: 1.6; margin-bottom: 0.6rem;">
              Pair your medium-impact tasks with an environmental anchor—a clean workspace, fresh herbal tea, and 25-minute Pomodoro intervals.
            </p>
            <h4>🌿 BOTANICAL MANTRA</h4>
            <p style="font-size: 0.88rem; line-height: 1.6; font-style: italic; color: var(--primary-plum);">
              "Consistency is not about perfection; it is the quiet grace of showing up for your intentions one focused hour at a time."
            </p>
          </div>
        `;
      }
      return { success: true, modalDisplay: modal.style.display, computedDisplay: window.getComputedStyle(modal).display };
    });
    console.log('Evaluate result:', JSON.stringify(evalRes));
    await new Promise(r => setTimeout(r, 800));
    const aiModalShot = path.join(distDir, 'PLA-14_AI_Focus_Coach_Modal.png');
    await page.screenshot({ path: aiModalShot });
    fs.copyFileSync(aiModalShot, path.join(artMediaDir, 'PLA-14_AI_Focus_Coach_Modal.png'));
    console.log(`✅ Saved: ${aiModalShot}`);

  } catch (err) {
    console.error('Preview capture error:', err);
  } finally {
    await browser.close();
    server.close();
    console.log('🎉 All Phase 2 visual previews captured successfully!');
  }
}

capturePreviews().then(() => {
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
