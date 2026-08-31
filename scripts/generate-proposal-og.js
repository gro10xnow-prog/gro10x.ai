/**
 * scripts/generate-proposal-og.js
 * Generates a luxury 1200x630 OpenGraph social media preview banner
 * for WhatsApp, Telegram, LinkedIn, and Slack link sharing.
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function generateOG() {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@600;700;800;900&family=Plus+Jakarta+Sans:wght@500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1200px;
      height: 630px;
      background: #070b12;
      font-family: 'Plus Jakarta Sans', sans-serif;
      color: #f8fafc;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 60px 70px;
      position: relative;
      overflow: hidden;
      background-image: 
        radial-gradient(ellipse 70% 50% at 20% -10%, rgba(0, 223, 137, 0.22), transparent 70%),
        radial-gradient(ellipse 60% 40% at 85% 85%, rgba(6, 182, 212, 0.18), transparent 60%);
    }

    /* Framing Borders */
    body::before {
      content: '';
      position: absolute;
      inset: 20px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 20px;
      pointer-events: none;
    }

    .top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 2;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .logo-mark {
      width: 52px;
      height: 52px;
      background: linear-gradient(135deg, #00df89, #06b6d4);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      font-weight: 800;
      color: #070b12;
      box-shadow: 0 0 30px rgba(0, 223, 137, 0.4);
    }

    .logo-text {
      font-family: 'Outfit', sans-serif;
      font-size: 28px;
      font-weight: 800;
      color: #fff;
      letter-spacing: -0.5px;
    }

    .logo-text span { color: #00df89; }

    .doc-pill {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 20px;
      background: rgba(0, 223, 137, 0.12);
      border: 1px solid rgba(0, 223, 137, 0.35);
      border-radius: 999px;
      color: #00df89;
      font-size: 15px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .content {
      margin: auto 0;
      z-index: 2;
    }

    .eyebrow {
      font-size: 15px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #00df89;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .eyebrow::after {
      content: '';
      width: 40px;
      height: 2px;
      background: #00df89;
    }

    .title {
      font-family: 'Outfit', sans-serif;
      font-size: 54px;
      font-weight: 800;
      line-height: 1.15;
      color: #ffffff;
      margin-bottom: 20px;
      max-width: 950px;
      letter-spacing: -1px;
    }

    .subtitle {
      font-size: 21px;
      color: #94a3b8;
      max-width: 860px;
      line-height: 1.5;
    }

    .tags {
      display: flex;
      gap: 12px;
      margin-top: 24px;
    }

    .tag {
      padding: 6px 14px;
      background: rgba(14, 21, 34, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      color: #cbd5e1;
    }

    .footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 24px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      z-index: 2;
    }

    .domain {
      font-family: 'Outfit', sans-serif;
      font-size: 18px;
      font-weight: 700;
      color: #06b6d4;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .security-badge {
      font-size: 13px;
      font-weight: 600;
      color: #64748b;
      display: flex;
      align-items: center;
      gap: 8px;
    }
  </style>
</head>
<body>
  <div class="top-bar">
    <div class="logo">
      <div class="logo-mark">⚡</div>
      <div class="logo-text">GRO<span>10X</span> AI AGENCY</div>
    </div>
    <div class="doc-pill">🔒 Private Commercial Document</div>
  </div>

  <div class="content">
    <div class="eyebrow">Enterprise Solutions</div>
    <h1 class="title">Commercial Project Proposal</h1>
    <p class="subtitle">Custom AI Architecture, 24/7 Operational Automation & Investment Breakdown</p>
    <div class="tags">
      <div class="tag">⚡ Conversational AI (Gemini 3.6 Flash)</div>
      <div class="tag">🛡️ Single-Tenant Data Sovereignty</div>
      <div class="tag">📱 Meta & Telegram Escalation</div>
    </div>
  </div>

  <div class="footer">
    <div class="domain">⚡ gro10x.ai · Dhaka, BD (UTC+6)</div>
    <div class="security-badge">✓ 100% Confidential · Dedicated Client Pass</div>
  </div>
</body>
</html>
  `;

  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'networkidle0' });

  const outDir = path.join(__dirname, '../public/images');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const outPath = path.join(outDir, 'proposal-og-banner.png');
  await page.screenshot({ path: outPath, type: 'png' });
  await browser.close();

  console.log('✅ Generated luxury OpenGraph banner at:', outPath);
}

generateOG().catch(console.error);
