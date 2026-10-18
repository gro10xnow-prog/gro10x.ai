const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

// Ensure directories exist
const proposalsDir = path.resolve('public/proposals/toffeecon');
const docsDir = path.resolve('public/docs');
if (!fs.existsSync(proposalsDir)) fs.mkdirSync(proposalsDir, { recursive: true });
if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });

// Load base64 assets
const logoBase64 = 'data:image/png;base64,' + fs.readFileSync('public/images/rishka_logo.png').toString('base64');
const watermarkBase64 = 'data:image/png;base64,' + fs.readFileSync('public/images/rishka_bg_watermark.png').toString('base64');

function buildHTML(opts) {
  const { title, items, total, note, isEstimate } = opts;
  
  const rows = items.map(it => `
    <tr>
      <td class="col-item">${it.item}</td>
      <td class="col-desc">${it.desc}</td>
      <td class="col-qty">${it.qty}</td>
      <td class="col-cost">${it.cost}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    html, body {
      width: 210mm;
      height: 297mm;
      background: #fff;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #000;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page-container {
      width: 210mm;
      height: 297mm;
      padding: 38px 50px 32px 50px;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      background: #fff;
    }
    .watermark {
      position: absolute;
      right: -80px;
      top: 90px;
      width: 480px;
      opacity: 0.045;
      pointer-events: none;
      z-index: 1;
    }
    .content {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      flex: 1;
    }
    .header-img {
      width: 100%;
      height: auto;
      display: block;
      margin-bottom: 22px;
    }
    .meta-block {
      font-size: 13.5px;
      line-height: 1.5;
      margin-bottom: 18px;
      color: #000;
    }
    .meta-block .bold-label {
      font-weight: 700;
    }
    table.quotation-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      margin-bottom: 16px;
    }
    table.quotation-table th,
    table.quotation-table td {
      border: 1px solid #000;
      padding: 8px 10px;
      font-size: 11.5px;
      line-height: 1.38;
      vertical-align: top;
    }
    table.quotation-table th {
      font-weight: 700;
      font-size: 12.5px;
      text-align: left;
      background: #fff;
    }
    .col-item {
      width: 24%;
      font-weight: 600;
      color: #000;
    }
    .col-desc {
      width: 49%;
      color: #111;
    }
    .col-qty {
      width: 13%;
      color: #000;
    }
    .col-cost {
      width: 14%;
      font-weight: 600;
      color: #000;
    }
    .total-row td {
      font-weight: 700;
      font-size: 12.5px;
      border: 1px solid #000;
      padding: 9px 10px;
    }
    .total-label {
      text-align: right;
      padding-right: 14px !important;
    }
    .note-box {
      font-size: 11px;
      line-height: 1.5;
      color: #222;
      font-style: italic;
      margin-top: 10px;
      margin-bottom: 22px;
    }
    .sig-block {
      font-size: 12.5px;
      line-height: 1.45;
      color: #000;
      margin-top: auto;
      margin-bottom: 16px;
    }
    .sig-block .auth-label {
      margin-bottom: 12px;
    }
    .sig-block .auth-name {
      font-weight: 500;
    }
    .page-footer-bar {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 7px;
      background-color: #ef3976;
    }
    .page-num {
      position: absolute;
      bottom: 16px;
      right: 50px;
      font-size: 12px;
      color: #333;
    }
    a.link {
      color: #000;
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="page-container">
    <img src="${watermarkBase64}" class="watermark" alt="">
    
    <div class="content">
      <img src="${logoBase64}" class="header-img" alt="Rishka Connects">
      
      <div class="meta-block">
        <div><span class="bold-label">client :</span> Toffee</div>
        <div><span class="bold-label">Date:</span> 18th October , 2026</div>
        <div><span class="bold-label">Event:</span> ToffeeCon</div>
      </div>
      
      <table class="quotation-table">
        <thead>
          <tr>
            <th class="col-item">Item</th>
            <th class="col-desc">Description</th>
            <th class="col-qty">Qty</th>
            <th class="col-cost">Cost</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
          <tr class="total-row">
            <td colspan="3" class="total-label">Total (BDT)</td>
            <td>${total}</td>
          </tr>
        </tbody>
      </table>
      
      <div class="note-box">
        ${note}
      </div>
      
      <div class="sig-block">
        <div class="auth-label">Authorized By</div>
        <div class="auth-name">Ridowan Mehrab Ayan / Dewan Saki</div>
        <div>Rishka connects.</div>
      </div>
    </div>
    
    <div class="page-num">1</div>
    <div class="page-footer-bar"></div>
  </div>
</body>
</html>`;
}

const items350K = [
  {
    item: 'AI Creator Dubbing Studio',
    desc: 'Multilingual AI voice cloning & instant video dubbing booth. Real-time creator voice enrollment, auto-transcription, bilingual lip-synced audio generation (Bangla / English), and instant QR code video download. Includes live prototype staging: <a class="link" href="https://toffeecon-2026.onrender.com/dubbing">toffeecon-2026.onrender.com/dubbing</a>',
    qty: '500–800 uses',
    cost: '120,000'
  },
  {
    item: 'Mainstage Interactive LED & Live Voting HUD',
    desc: 'Real-time audience engagement engine for 600+ seated attendees. WebSocket-powered live polling HUD, interactive creator award voting, dynamic leaderboard rendering, and broadcast-grade stage graphics. Prototype staging: <a class="link" href="https://toffeecon-2026.onrender.com/stage">toffeecon-2026.onrender.com/stage</a>',
    qty: '600+ guests',
    cost: '90,000'
  },
  {
    item: 'Optical Ingress & Gate Accreditation',
    desc: 'Sub-second NFC/QR optical credential verification and digital guest accreditation. Real-time attendee check-in telemetry, VIP arrival notifications, duplicate entry prevention, and badge synchronization. Prototype staging: <a class="link" href="https://toffeecon-2026.onrender.com/ingress">toffeecon-2026.onrender.com/ingress</a>',
    qty: '500–800 passes',
    cost: '60,000'
  },
  {
    item: 'Dedicated High-Availability Cloud & Token Pool',
    desc: 'Pre-provisioned neural compute cluster, dedicated GPU inference token pool for real-time AI dubbing pipelines, edge caching, and failover redundancy ensuring zero latency during peak creator sessions.',
    qty: '1 cluster',
    cost: '50,000'
  },
  {
    item: 'Event Master Software Direction',
    desc: 'Lead systems architect and technical director on-site for end-to-end rehearsal, live stage coordination, audio-visual mesh integration, and continuous runtime monitoring throughout the event.',
    qty: '1 lead',
    cost: '30,000'
  }
];

const note350K = 'Note: This quotation covers the complete AI & Interactive Technology Operating System for ToffeeCon 2026, including software architecture, AI neural inference, live prototype staging (<a class="link" href="https://toffeecon-2026.onrender.com">toffeecon-2026.onrender.com</a>), optical ingress verification, and on-site technical supervision. Hardware equipment, LED wall panels, venue rent, acoustic physical booth carpentry, and catering are excluded and handled by event production partners.';

const items550K = [
  {
    item: 'AI Creator Dubbing Studio & Acoustic Booth',
    desc: 'Complete physical + digital creator dubbing experience. High-fidelity acoustic isolation booth, professional directional microphone rig, automated voice cloning & multilingual video synthesis (Bangla / English), live preview monitor, and instant branded video delivery via dynamic QR pass. Prototype staging: <a class="link" href="https://toffeecon-2026.onrender.com/dubbing">toffeecon-2026.onrender.com/dubbing</a>',
    qty: '500–800 uses',
    cost: '165,000'
  },
  {
    item: 'Mainstage Interactive LED Engine & Crowd Voting',
    desc: 'Broadcast-grade mainstage visual orchestration. Ultra-low latency WebSocket voting HUD for 600+ guests, live interactive polling, real-time award nomination countdowns, dynamic 4K visualizer feeds, and automated stage lighting cue integration. Prototype staging: <a class="link" href="https://toffeecon-2026.onrender.com/stage">toffeecon-2026.onrender.com/stage</a>',
    qty: '600+ guests',
    cost: '135,000'
  },
  {
    item: 'Optical Ingress Terminal & Accreditation Desk',
    desc: 'Dual-lane high-speed optical scanning terminals with dedicated barcode/QR readers, instant digital credential printing, VIP priority routing alerts, offline fallback database sync, and real-time gate occupancy dashboard. Prototype staging: <a class="link" href="https://toffeecon-2026.onrender.com/ingress">toffeecon-2026.onrender.com/ingress</a>',
    qty: '500–800 passes',
    cost: '85,000'
  },
  {
    item: 'High-Availability Cloud Cluster & Neural Compute',
    desc: 'Dedicated high-throughput GPU inference cluster with pre-allocated Gemini / ElevenLabs neural token quota, multi-region API fallback, SSL encryption, and high-concurrency websocket server infrastructure.',
    qty: '1 cluster',
    cost: '65,000'
  },
  {
    item: 'Air-Gapped Edge Server & Internet-Drop Redundancy',
    desc: 'On-site localized edge server deployment providing 100% offline-resilient local LAN failover for gate ingress, voting, and media processing in the event of venue cellular or ISP network degradation.',
    qty: '1 rig',
    cost: '55,000'
  },
  {
    item: 'On-Site Technical Directorate & Operations',
    desc: 'Full-day dedicated technical crew (Lead Systems Architect, DevOps Engineer, Stage AV Operator, Ingress Floor Specialist) for hardware testing, dry-run rehearsals, and uninterrupted live operational governance.',
    qty: '1 crew',
    cost: '45,000'
  }
];

const note550K = 'Note: This quotation covers the complete AI & Interactive Technology Operating System for ToffeeCon 2026, including acoustic dubbing booth technology, on-site air-gapped edge server redundancy, broadcast mainstage engine, live prototype staging (<a class="link" href="https://toffeecon-2026.onrender.com">toffeecon-2026.onrender.com</a>), and full technical directorate. Mainstage LED physical panels, general venue rental, security personnel, and guest catering are excluded and handled by venue and logistics partners.';

const html350K = buildHTML({
  title: 'ToffeeCon 2026 Tech Operating System — Commercial Estimate (3.50L)',
  items: items350K,
  total: '3,50,000',
  note: note350K,
  isEstimate: true
});

const html550K = buildHTML({
  title: 'ToffeeCon 2026 Tech Operating System — Official Quotation (5.50L)',
  items: items550K,
  total: '5,50,000',
  note: note550K,
  isEstimate: false
});

fs.writeFileSync('public/proposals/toffeecon/toffeecon_tech_estimate_350k.html', html350K);
fs.writeFileSync('public/proposals/toffeecon/toffeecon_tech_quotation_550k.html', html550K);
console.log('✅ HTML templates saved to public/proposals/toffeecon/');

(async () => {
  console.log('🚀 Launching Chrome to compile 300 DPI master PDFs...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });

  // 1. Render 350K PDF
  const path350 = path.resolve('public/proposals/toffeecon/toffeecon_tech_estimate_350k.html');
  await page.goto('file:///' + path350.replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
  await page.pdf({
    path: 'public/docs/TOFFEECON_TECH_ESTIMATE_350K.pdf',
    format: 'A4',
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 }
  });
  console.log('✅ public/docs/TOFFEECON_TECH_ESTIMATE_350K.pdf compiled!');

  // 2. Render 550K PDF
  const path550 = path.resolve('public/proposals/toffeecon/toffeecon_tech_quotation_550k.html');
  await page.goto('file:///' + path550.replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
  await page.pdf({
    path: 'public/docs/TOFFEECON_TECH_QUOTATION_550K.pdf',
    format: 'A4',
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 }
  });
  console.log('✅ public/docs/TOFFEECON_TECH_QUOTATION_550K.pdf compiled!');

  await browser.close();
  console.log('🎉 Dual PDF compilation successful!');
})();
