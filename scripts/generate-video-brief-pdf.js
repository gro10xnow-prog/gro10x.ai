const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>GRO10X — Video Production Brief & Script</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 18mm 16mm 18mm 16mm;
      @bottom-right {
        content: counter(page) " / " counter(pages);
      }
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #1a202c;
      background: #ffffff;
      margin: 0;
      padding: 0;
      font-size: 11pt;
      line-height: 1.5;
    }

    /* HEADER */
    .header {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 14px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .brand-title {
      font-size: 24pt;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #0f172a;
      margin: 0;
      line-height: 1.1;
    }

    .brand-badge {
      display: inline-block;
      background: #00df89;
      color: #052e16;
      font-weight: 700;
      font-size: 8.5pt;
      padding: 3px 8px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
    }

    .subtitle {
      font-size: 13pt;
      font-weight: 600;
      color: #0284c7;
      margin: 4px 0 0 0;
    }

    .meta-box {
      text-align: right;
      font-size: 9pt;
      color: #475569;
      line-height: 1.4;
    }

    .meta-box strong {
      color: #0f172a;
    }

    /* SECTION STYLES */
    h2 {
      font-size: 13pt;
      font-weight: 700;
      color: #0f172a;
      border-left: 4px solid #00df89;
      padding-left: 10px;
      margin: 22px 0 12px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    h3 {
      font-size: 11pt;
      font-weight: 700;
      color: #1e293b;
      margin: 14px 0 6px 0;
    }

    p {
      margin: 0 0 10px 0;
      color: #334155;
    }

    /* CALLOUT BOXES */
    .spec-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 18px;
    }

    .spec-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px 12px;
    }

    .spec-label {
      font-size: 7.5pt;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
      letter-spacing: 0.5px;
    }

    .spec-val {
      font-size: 10pt;
      font-weight: 700;
      color: #0f172a;
      margin-top: 2px;
    }

    /* SCRIPT TABLE */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 14px 0;
      font-size: 9.5pt;
    }

    th {
      background: #0f172a;
      color: #ffffff;
      font-weight: 700;
      text-align: left;
      padding: 9px 10px;
      font-size: 8.5pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    th:first-child {
      border-top-left-radius: 6px;
    }

    th:last-child {
      border-top-right-radius: 6px;
    }

    td {
      padding: 10px 10px;
      border-bottom: 1px solid #e2e8f0;
      vertical-align: top;
      line-height: 1.45;
    }

    tr:nth-child(even) td {
      background: #f8fafc;
    }

    .time-col {
      width: 12%;
      font-weight: 700;
      color: #0284c7;
      white-space: nowrap;
    }

    .visual-col {
      width: 32%;
      color: #334155;
    }

    .text-col {
      width: 26%;
      font-weight: 600;
      color: #0f172a;
    }

    .vo-col {
      width: 30%;
      color: #1e293b;
      font-style: italic;
    }

    .tag-badge {
      display: inline-block;
      font-size: 7.5pt;
      font-weight: 700;
      background: #e0f2fe;
      color: #0369a1;
      padding: 1px 6px;
      border-radius: 3px;
      margin-top: 4px;
    }

    /* PAGE BREAK */
    .page-break {
      page-break-before: always;
    }

    /* CHECKLIST & BULLETS */
    ul {
      margin: 6px 0 14px 18px;
      padding: 0;
      color: #334155;
    }

    li {
      margin-bottom: 5px;
      font-size: 9.5pt;
    }

    .deliverables-box {
      background: #f1f5f9;
      border-left: 4px solid #0284c7;
      padding: 12px 16px;
      border-radius: 0 6px 6px 0;
      margin: 14px 0;
    }

    .strategy-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 12px 14px;
      margin-bottom: 10px;
    }

    .strategy-title {
      font-weight: 700;
      color: #0f172a;
      font-size: 10pt;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .footer {
      margin-top: 25px;
      border-top: 1px solid #e2e8f0;
      padding-top: 10px;
      font-size: 8pt;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
    }
  </style>
</head>
<body>

  <!-- PAGE 1: SCRIPT & CREATIVE BRIEF -->
  <div class="header">
    <div>
      <div class="brand-badge">Agency Production Brief</div>
      <h1 class="brand-title">GRO10X SaaS Engine</h1>
      <div class="subtitle">35-Second Showcase Video: Script & Creative Direction</div>
    </div>
    <div class="meta-box">
      <strong>Client:</strong> GRO10X Technologies<br>
      <strong>Platform URL:</strong> https://gro10x.ai<br>
      <strong>Target Duration:</strong> 35 Seconds (75 Words)<br>
      <strong>Audience:</strong> B2B Decision Makers & Clients
    </div>
  </div>

  <div class="spec-grid">
    <div class="spec-card">
      <div class="spec-label">Target Length</div>
      <div class="spec-val">30 – 35 Seconds</div>
    </div>
    <div class="spec-card">
      <div class="spec-label">Style & Tone</div>
      <div class="spec-val">Modern, Crisp, Linear/Tech</div>
    </div>
    <div class="spec-card">
      <div class="spec-label">Aspect Ratios</div>
      <div class="spec-val">16:9 (Web) + 4:5 (Social)</div>
    </div>
    <div class="spec-card">
      <div class="spec-label">Primary Goal</div>
      <div class="spec-val">B2B Demo Conversion</div>
    </div>
  </div>

  <h2>1. Creative & Audio Direction</h2>
  <p>
    The goal is to position <strong>GRO10X</strong> as an ultra-fast, modern AI & SaaS growth engine. The pacing should feel snappy, authoritative, and clean (inspiration: Apple Keynote, Stripe, Linear). 
    <strong>Sound Design:</strong> Energetic tech-synth baseline, rhythmic digital data clicks, smooth UI swooshes, and a solid cinematic bass hit at the final logo reveal.
  </p>

  <h2>2. 35-Second Shot-by-Shot Script</h2>

  <table>
    <thead>
      <tr>
        <th>Time</th>
        <th>Visual & UI Motion (Agency)</th>
        <th>On-Screen Typography</th>
        <th>Voiceover (VO) & Audio Cues</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="time-col">0:00 – 0:05<br><span class="tag-badge">The Hook</span></td>
        <td class="visual-col">
          Fast, chaotic jump-cuts of messy spreadsheets, 50 open browser tabs, and stalled leads. Sudden red warning glow.
        </td>
        <td class="text-col">
          <strong>Still Scaling With Chaos?</strong>
        </td>
        <td class="vo-col">
          "Scaling your business shouldn't mean drowning in manual ops and disconnected tools."
          <br><small style="color:#64748b;">[Static glitch into clean beat drop]</small>
        </td>
      </tr>
      <tr>
        <td class="time-col">0:05 – 0:13<br><span class="tag-badge">The Reveal</span></td>
        <td class="visual-col">
          Smooth 3D camera push into the sleek dark-mode GRO10X dashboard. Glowing emerald/cyan indicators ignite.
        </td>
        <td class="text-col">
          <strong>Meet GRO10X OS.</strong><br>
          <span style="font-size:8.5pt; color:#0284c7;">Your All-in-One Growth Engine.</span>
        </td>
        <td class="vo-col">
          "Meet GRO10X — the intelligent SaaS engine built to automate, scale, and accelerate your operations."
          <br><small style="color:#64748b;">[Futuristic whoosh + UI click]</small>
        </td>
      </tr>
      <tr>
        <td class="time-col">0:13 – 0:22<br><span class="tag-badge">Core Power</span></td>
        <td class="visual-col">
          Fast-flowing UI flythrough showing:
          1. AI automated pipeline Kanban.<br>
          2. Real-time telemetry & 1-tap approvals.<br>
          3. Multi-channel sync in action.
        </td>
        <td class="text-col">
          ⚡ <strong>Automated Pipelines</strong><br>
          📊 <strong>Real-Time Telemetry</strong><br>
          🚀 <strong>10x Velocity</strong>
        </td>
        <td class="vo-col">
          "From automated client pipelines and smart workflows to live telemetry — deploy enterprise power in days, not months."
          <br><small style="color:#64748b;">[Rhythmic data pulses & clicks]</small>
        </td>
      </tr>
      <tr>
        <td class="time-col">0:22 – 0:28<br><span class="tag-badge">The Proof</span></td>
        <td class="visual-col">
          Split-screen impact cards with verified counters: <strong>65% Cost Reduction</strong> and <strong>10x Faster Sprints</strong>.
        </td>
        <td class="text-col">
          <strong>65% Lower Overhead.</strong><br>
          <strong>Zero Bottlenecks.</strong>
        </td>
        <td class="vo-col">
          "Cut overhead by 65% and unlock unprecedented speed for your team."
          <br><small style="color:#64748b;">[Upward tension riser]</small>
        </td>
      </tr>
      <tr>
        <td class="time-col">0:28 – 0:35<br><span class="tag-badge">Call to Action</span></td>
        <td class="visual-col">
          Minimalist dark endcard. Glowing GRO10X logo with live URL typing effect and glowing primary button.
        </td>
        <td class="text-col">
          <strong>Grow 10x Smarter.</strong><br>
          <span style="color:#00df89; font-weight:800;">gro10x.ai</span><br>
          <span style="font-size:8pt; border:1px solid #cbd5e1; padding:2px 6px; border-radius:3px;">[ Book Your Live Demo ]</span>
        </td>
        <td class="vo-col">
          "Work smarter. Grow faster. Book your live demo today at gro10x.ai."
          <br><small style="color:#64748b;">[Cinematic sub-bass + logo chime]</small>
        </td>
      </tr>
    </tbody>
  </table>

  <!-- PAGE BREAK FOR CLEAN 2-PAGE LAYOUT -->
  <div class="page-break"></div>

  <!-- PAGE 2: AGENCY SPECS & PROMOTION PLAYBOOK -->
  <div class="header">
    <div>
      <div class="brand-badge">Agency Specs & Distribution</div>
      <h1 class="brand-title">Production & Promotion Strategy</h1>
      <div class="subtitle">Deliverables Matrix & B2B Go-To-Market Execution</div>
    </div>
    <div class="meta-box">
      <strong>Document:</strong> GTM & Deliverable Spec<br>
      <strong>Confidentiality:</strong> Internal / Agency Shared<br>
      <strong>Target Launch:</strong> Immediate
    </div>
  </div>

  <h2>3. Technical Deliverables Required from Agency</h2>

  <div class="deliverables-box">
    <ul>
      <li><strong>Master 16:9 Cut (4K / 1080p, 60fps MP4 + ProRes):</strong> For website landing page hero, pitch decks, client proposals, and YouTube.</li>
      <li><strong>Social Cut 4:5 or 9:16 (1080x1350 / 1080x1920):</strong> Optimized for LinkedIn mobile feed, Instagram, and WhatsApp direct shares.</li>
      <li><strong>Burned-in Captions (Subtitle SRT + Hardcoded Clean Subtitles):</strong> Crucial for B2B audiences where 80%+ browse on mute.</li>
      <li><strong>Audio Stems:</strong> Separate tracks for VO (Voiceover clean WAV), BGM (Music stem), and SFX (Sound effects stem).</li>
      <li><strong>3-Second Looping GIF Teaser:</strong> For email signature and cold email preview buttons.</li>
    </ul>
  </div>

  <h3>Brand Guidelines for Motion Designer</h3>
  <ul>
    <li><strong>Primary Brand Accents:</strong> Neon Emerald (#00DF89), Electric Cyan (#00B4D8), Pure White (#FFFFFF).</li>
    <li><strong>Background Canvas:</strong> Deep Navy/Slate (#0B0F19 and #0F172A). Avoid muddy greys.</li>
    <li><strong>Typography:</strong> Outfit / Plus Jakarta Sans (or Inter). Heavy weights (700/800) for headline kinetic typography.</li>
  </ul>

  <h2>4. B2B Client Acquisition & Promotion Playbook</h2>

  <div class="strategy-card">
    <div class="strategy-title">🎯 1. Direct Sales & Client Touchpoints (Instant ROI)</div>
    <p>
      • <strong>Interactive Proposals & Pitch Decks:</strong> Embed the 35s video on Slide 2 of every B2B proposal under <em>"GRO10X in 30 Seconds"</em>.<br>
      • <strong>WhatsApp & Telegram Sales DMs:</strong> Equip account managers with the 4:5 vertical video. When a prospect asks what the platform does, drop the video before sending lengthy text.<br>
      • <strong>Pre-Meeting Warmup:</strong> Embed the video on the Calendly booking confirmation screen to educate clients prior to discovery calls.
    </p>
  </div>

  <div class="strategy-card">
    <div class="strategy-title">💼 2. LinkedIn Thought Leader & Organic Strategy</div>
    <p>
      • <strong>Founder Native Post:</strong> Publish natively with a behind-the-scenes narrative: <em>"We built GRO10X to solve our own ops bottlenecks. Here is what it does in 35 seconds."</em><br>
      • <strong>Thought Leader Ads:</strong> Run targeted sponsored content directly from the founder or leadership profile targeting CTOs, COOs, and Agency Directors with a direct "Book Demo" lead form.
    </p>
  </div>

  <div class="strategy-card">
    <div class="strategy-title">🌐 3. High-Converting Landing Page Optimization</div>
    <p>
      • <strong>Hero Section Anchor:</strong> Place a sleek modal trigger <em>[▶ Watch 35s Demo]</em> right alongside the primary CTA on <strong>gro10x.ai</strong>.<br>
      • <strong>Exit-Intent Engagement:</strong> Display the video in a quick-read drawer when visitors dwell on enterprise features or pricing tables.
    </p>
  </div>

  <div class="footer">
    <span>© 2026 GRO10X Technologies. All rights reserved.</span>
    <span>Confidential Agency Production Brief • Page 2 of 2</span>
  </div>

</body>
</html>`;

(async () => {
  try {
    console.log('Launching Chrome...');
    const browser = await puppeteer.launch({
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    const outputPath = path.resolve(__dirname, '..', 'GRO10X_SaaS_Video_Script_and_Brief.pdf');
    console.log('Generating PDF at:', outputPath);

    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0mm',
        bottom: '0mm',
        left: '0mm',
        right: '0mm'
      }
    });

    await browser.close();
    console.log('SUCCESS! PDF generated successfully.');
    const stats = fs.statSync(outputPath);
    console.log('File size:', stats.size, 'bytes');
  } catch (err) {
    console.error('Error generating PDF:', err);
    process.exit(1);
  }
})();
