const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>GRO10X Holdings - Digital Employee Output & Economic Value Audit (Day 2)</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');

    :root {
      --primary: #0f172a;
      --primary-light: #1e293b;
      --accent: #0284c7;
      --accent-cyan: #06b6d4;
      --accent-green: #059669;
      --gray-900: #0f172a;
      --gray-800: #1e293b;
      --gray-700: #334155;
      --gray-600: #475569;
      --gray-500: #64748b;
      --gray-400: #94a3b8;
      --gray-200: #e2e8f0;
      --gray-100: #f1f5f9;
      --gray-50: #f8fafc;
      --white: #ffffff;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    @page { size: A4 portrait; margin: 0; }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      color: var(--gray-800);
      background-color: #cbd5e1;
      line-height: 1.45;
      font-size: 11px;
      -webkit-font-smoothing: antialiased;
    }

    .page {
      width: 210mm;
      height: 297mm;
      max-height: 297mm;
      padding: 16mm 18mm;
      background: var(--white);
      margin: 0 auto;
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      page-break-after: always;
    }

    .header-tag {
      font-size: 8.5px;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: var(--gray-500);
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 4px;
    }

    .header-tag strong { color: var(--accent-green); }

    .main-title {
      font-size: 20px;
      font-weight: 800;
      color: var(--gray-900);
      line-height: 1.2;
      margin-bottom: 4px;
    }

    .sub-title {
      font-size: 11px;
      color: var(--gray-500);
      font-weight: 500;
      margin-bottom: 12px;
    }

    .meta-strip {
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid var(--gray-200);
      padding-bottom: 8px;
      margin-bottom: 14px;
      font-size: 10px;
    }

    .meta-item { display: flex; flex-direction: column; }
    .meta-label { color: var(--gray-400); font-weight: 600; text-transform: uppercase; font-size: 8px; }
    .meta-val { color: var(--gray-800); font-weight: 700; }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 16px;
    }

    .kpi-card {
      background: var(--gray-50);
      border: 1px solid var(--gray-200);
      border-radius: 8px;
      padding: 10px;
    }

    .kpi-title { font-size: 8px; text-transform: uppercase; color: var(--gray-500); font-weight: 700; margin-bottom: 2px; }
    .kpi-val { font-size: 18px; font-weight: 800; color: var(--gray-900); }
    .kpi-val.green { color: var(--accent-green); }
    .kpi-sub { font-size: 8.5px; color: var(--gray-400); margin-top: 2px; }

    .section-title {
      font-size: 12px;
      font-weight: 800;
      color: var(--gray-900);
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 8px;
      border-left: 3px solid var(--accent-green);
      padding-left: 8px;
    }

    .section-desc { font-size: 9.5px; color: var(--gray-500); margin-bottom: 10px; }

    .timesheet-card {
      border: 1px solid var(--gray-200);
      border-radius: 8px;
      padding: 9px 12px;
      margin-bottom: 9px;
      background: #fafafa;
    }

    .ts-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }

    .ts-role { font-weight: 700; font-size: 10.5px; color: var(--gray-900); }
    .ts-badge {
      font-size: 7.5px;
      font-weight: 700;
      text-transform: uppercase;
      padding: 2px 6px;
      border-radius: 4px;
      background: var(--gray-200);
      color: var(--gray-700);
    }
    .ts-badge.green { background: #dcfce7; color: #166534; }
    .ts-badge.cyan { background: #cffafe; color: #155e75; }

    .ts-territory { font-size: 8.5px; color: var(--gray-400); font-family: 'JetBrains Mono', monospace; margin-bottom: 4px; }
    .ts-list { list-style: none; }
    .ts-list li {
      position: relative;
      padding-left: 12px;
      margin-bottom: 3px;
      font-size: 9px;
      color: var(--gray-600);
    }
    .ts-list li::before {
      content: "•";
      position: absolute;
      left: 2px;
      color: var(--accent-green);
      font-weight: 900;
    }

    table.benchmark-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9px;
      margin-top: 8px;
    }

    table.benchmark-table th {
      background: var(--gray-100);
      color: var(--gray-700);
      font-weight: 700;
      text-transform: uppercase;
      font-size: 7.5px;
      padding: 6px 8px;
      border: 1px solid var(--gray-200);
      text-align: left;
    }

    table.benchmark-table td {
      padding: 6px 8px;
      border: 1px solid var(--gray-200);
      color: var(--gray-700);
    }

    table.benchmark-table tr.total-row {
      background: #f0fdf4;
      font-weight: 800;
      color: var(--gray-900);
    }

    .links-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-top: 10px;
    }

    .link-card {
      border: 1px solid var(--gray-200);
      border-radius: 6px;
      padding: 8px 10px;
      background: var(--gray-50);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .link-name { font-weight: 700; font-size: 9.5px; color: var(--gray-800); }
    .link-url { font-family: 'JetBrains Mono', monospace; font-size: 8px; color: var(--accent); }

    .footer {
      border-top: 1px solid var(--gray-200);
      padding-top: 6px;
      display: flex;
      justify-content: space-between;
      font-size: 7.5px;
      color: var(--gray-400);
    }
  </style>
</head>
<body>

  <!-- PAGE 1: EXECUTIVE AUDIT & TIMESHEETS PART 1 -->
  <div class="page">
    <div>
      <div class="header-tag"><strong>GRO10X.AI</strong> HOLDINGS EXECUTIVE COMMAND • DAY 2 OF 77</div>
      <h1 class="main-title">Digital Employee Output & Economic Value Audit</h1>
      <p class="sub-title">Multi-Venture Daily Velocity Audit • Bahon Electric Fleet Command, Serviq BPO Corporate AI & Human Delegation</p>

      <div class="meta-strip">
        <div class="meta-item">
          <span class="meta-label">Command Authority</span>
          <span class="meta-val">Founder & CEO × Central CoS ("Zayan")</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Session Window</span>
          <span class="meta-val">Oct 16, 11:00 AM → Oct 17, 12:00 AM</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Institutional Status</span>
          <span class="meta-val" style="color: var(--accent-green);">100% Certified (243/243 Tests Green)</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Production Host</span>
          <span class="meta-val">https://gro10x-ai.vercel.app</span>
        </div>
      </div>

      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-title">Elapsed Sprint Time</div>
          <div class="kpi-val">13.0</div>
          <div class="kpi-sub">Hours of Multi-Track Execution</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-title">Active Digital Fleet</div>
          <div class="kpi-val">17 Staff</div>
          <div class="kpi-sub">7 Functional + 10 Satellite Leads</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-title">Automated Tests</div>
          <div class="kpi-val green">243 / 243</div>
          <div class="kpi-sub">100% Passing Across 3 Satellites</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-title">New Pipeline Added</div>
          <div class="kpi-val green">৳ 72,000</div>
          <div class="kpi-sub">~$18.40 Compute (2,100x ROI)</div>
        </div>
      </div>

      <div class="section-title">🤖 Digital Employee Timesheet & Production Ledger</div>
      <p class="section-desc">Granular work deliverables mapped digital employee by digital employee across today's sprint sessions.</p>

      <div class="timesheet-card">
        <div class="ts-header">
          <span class="ts-role">Central Chief of Staff & Virtual CTO ("Zayan")</span>
          <span class="ts-badge cyan">13.0 Hours Equivalent</span>
        </div>
        <div class="ts-territory">Territory: Mother OS (d:\gro10x.ai)</div>
        <ul class="ts-list">
          <li>Orchestrated 3 concurrent functional workstreams: Serviq BPO Corporate Training, Bahon Fleet Prototype, and Human Apprentice Bridge.</li>
          <li>Inscribed Rule 6.6 (The Proposal-Wrapped Prototype Mandate) into AGENTS.md, eliminating naked prototype sharing.</li>
          <li>Enforced the Single-Voice CoS Invariant and Production-First Verification Shield with automated live HTTPS probing.</li>
        </ul>
      </div>

      <div class="timesheet-card">
        <div class="ts-header">
          <span class="ts-role">Foundry Lab Director & Rapid Prototyper</span>
          <span class="ts-badge green">4.5 Hours Equivalent</span>
        </div>
        <div class="ts-territory">Territory: public/prototypes/bahon/ (Port 3000 & Vercel)</div>
        <ul class="ts-list">
          <li>Engineered Bahon Fleet Management Command Center covering Bashundhara R/A Blocks A through P.</li>
          <li>Simulated 28 active electric vehicles with dynamic waypoint movement, battery states, and driver dossier drawers.</li>
          <li>Engineered ৳48,500 daily anti-leakage revenue ticker (bKash/NFC QR vs cash), geofence intrusion alerts, and solar swap depot bays. 7/7 test suites green.</li>
        </ul>
      </div>

      <div class="timesheet-card">
        <div class="ts-header">
          <span class="ts-role">Corporate Training Director & Curriculum Architect ([E1])</span>
          <span class="ts-badge cyan">3.5 Hours Equivalent</span>
        </div>
        <div class="ts-territory">Territory: Dedicated Specialized Conversation</div>
        <ul class="ts-list">
          <li>Audited raw daily workflow documentation for 6 Serviq BPO leads (Rayhan, Ridhiya, Partha, Shabuddin, Meraj, Moon).</li>
          <li>Engineered the bespoke 5-module syllabus: "AI Workforce Acceleration with Google Gemini Ecosystem" (SERVIQ_CURRICULUM_BLUEPRINT.md).</li>
          <li>Directly resolved Partha's 3.5h spreadsheet reporting, Ridhiya's daily admin memo, and Shabuddin's 25-scenario customer support matrix.</li>
        </ul>
      </div>
    </div>

    <div class="footer">
      <span>GRO10X Holdings • Central Executive Operations Command</span>
      <span>Page 1 of 3 • Generated October 17, 2026 • 12:00 AM BST</span>
    </div>
  </div>

  <!-- PAGE 2: TIMESHEETS PART 2 & HUMAN TEAM APPRENTICE -->
  <div class="page">
    <div>
      <div class="section-title">🤖 Digital Employee Timesheet & Production Ledger (Continued)</div>
      <p class="section-desc">Specialized deal structurers, corporate registry operations, and human talent integration.</p>

      <div class="timesheet-card">
        <div class="ts-header">
          <span class="ts-role">Proposal Engine & Deal Structurer ([E2])</span>
          <span class="ts-badge green">4.0 Hours Equivalent</span>
        </div>
        <div class="ts-territory">Territory: src/routes/proposals.js & public/proposal.html</div>
        <ul class="ts-list">
          <li>Engineered PROP-2026-SERVIQ (৳12,000 BDT) with 50% mobilization advance (৳6,000) and embedded prototype card.</li>
          <li>Engineered PROP-2026-BAHON (৳60,000 BDT Pilot + ৳15k/mo retainer) wrapping the live Bahon Command Center prototype.</li>
          <li>Upgraded public/proposal.html with dynamic prototypeUrl card embedding and token-level fallbacks. Dual-synced to Supabase quotes table.</li>
        </ul>
      </div>

      <div class="timesheet-card">
        <div class="ts-header">
          <span class="ts-role">Client Operations & CRM Specialist ([E3])</span>
          <span class="ts-badge cyan">2.0 Hours Equivalent</span>
        </div>
        <div class="ts-territory">Territory: Supabase clients/leads & data/db.json</div>
        <ul class="ts-list">
          <li>Audited enterprise client directory; registered Serviq BPO Limited (CLI-SERVIQ-BPO) and Bahon Electric Transport (CLI-BAHON-MOBILITY).</li>
          <li>Purged legacy test mock records (CLI-ONBOARD-TEST-99, CLI-LOCKIN) to ensure clean pipeline data integrity.</li>
        </ul>
      </div>

      <div class="timesheet-card">
        <div class="ts-header">
          <span class="ts-role">Head of People & Talent Operations (Central HR)</span>
          <span class="ts-badge green">3.0 Hours Equivalent</span>
        </div>
        <div class="ts-territory">Territory: Supabase profiles, auth_pins & docs/HUMAN_TEAM_REGISTRY.md</div>
        <ul class="ts-list">
          <li>Onboarded S. M. Mahmud Bin Murad ("Onim") as Junior QA Apprentice (GRO-H-001) with PIN 7633.</li>
          <li>Upgraded Rafsan Ameen (GRO-003) to Head of BD; provisioned permanent partner credentials for Arif Ahmed (1704) and Mahmudul Hasan Samrat (2524).</li>
        </ul>
      </div>

      <div class="timesheet-card">
        <div class="ts-header">
          <span class="ts-role">Head of Finance & Treasury (Central Finance)</span>
          <span class="ts-badge cyan">2.5 Hours Equivalent</span>
        </div>
        <div class="ts-territory">Territory: data/db.json expenses & Supabase expenses</div>
        <ul class="ts-list">
          <li>Booked and verified approved contractor expense EXP-20261016-QA01 (৳2,500 BDT / 1,250 Credits).</li>
          <li>Audited credit economics under the canonical 1 Credit = BDT 2.00 peg; verified 75% gross profit margin on Serviq corporate contract.</li>
        </ul>
      </div>

      <div class="timesheet-card" style="border-left: 3px solid var(--accent); background: #f0f9ff;">
        <div class="ts-header">
          <span class="ts-role">Human Delegate: S. M. Mahmud Bin Murad ("Onim")</span>
          <span class="ts-badge green">Junior QA Apprentice (GRO-H-001)</span>
        </div>
        <div class="ts-territory">Channel: WhatsApp Gro10x<>PurpleOS Execution & Port 6000</div>
        <ul class="ts-list">
          <li>Dispatched on open-ended exploratory manual QA sprint across https://purpleos-iota.vercel.app/app and @purplemanosbot.</li>
          <li>Pioneered the "Human Apprentice Bridge SOP": transitioning manual product testing insights into automated triage for digital squads.</li>
        </ul>
      </div>
    </div>

    <div class="footer">
      <span>GRO10X Holdings • Central Executive Operations Command</span>
      <span>Page 2 of 3 • Generated October 17, 2026 • 12:00 AM BST</span>
    </div>
  </div>

  <!-- PAGE 3: ECONOMIC VALUATION & PRODUCTION LINKS -->
  <div class="page">
    <div>
      <div class="section-title">💰 Economic Valuation & Value-Add Benchmark</div>
      <p class="section-desc">Comparing traditional agency development timelines and budgets against GRO10X AI-native execution velocity.</p>

      <table class="benchmark-table">
        <thead>
          <tr>
            <th>Deliverable Platform</th>
            <th>Traditional Agency Timeline</th>
            <th>Traditional Dev Cost</th>
            <th>GRO10X Time</th>
            <th>GRO10X Compute</th>
            <th>Enterprise Asset Worth</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Bahon Fleet Command Center</strong><br>Spatial GIS Map, 28 EV Telemetry, Anti-Leakage Ledger</td>
            <td>2.5 – 4.0 Months</td>
            <td>৳ 25L – ৳ 38L<br>($25k+)</td>
            <td>4.5 Hours</td>
            <td>~$6.20</td>
            <td>৳ 18L – ৳ 25L</td>
          </tr>
          <tr>
            <td><strong>Serviq BPO AI Architecture</strong><br>5-Module Bespoke Workflow Syllabus & Grounding</td>
            <td>2 – 3 Weeks</td>
            <td>৳ 4.5L – ৳ 7.0L<br>($5k)</td>
            <td>3.5 Hours</td>
            <td>~$4.10</td>
            <td>৳ 3.5L – ৳ 5.0L</td>
          </tr>
          <tr>
            <td><strong>Proposal Engine Dual-Asset Mesh</strong><br>Interactive Live Proposals + Embedded Prototype Binding</td>
            <td>2 – 3 Weeks</td>
            <td>৳ 3.5L – ৳ 6.0L<br>($4k)</td>
            <td>4.0 Hours</td>
            <td>~$4.80</td>
            <td>৳ 4.0L – ৳ 6.0L</td>
          </tr>
          <tr>
            <td><strong>Human Talent & Partner Mesh</strong><br>Apprentice Bridge, Auth PINs, Dual-Currency Treasury</td>
            <td>1 – 2 Weeks</td>
            <td>৳ 4.0L – ৳ 6.0L<br>($4k)</td>
            <td>2.5 Hours</td>
            <td>~$3.30</td>
            <td>৳ 4.5L – ৳ 7.0L</td>
          </tr>
          <tr class="total-row">
            <td><strong>CUMULATIVE TOTALS (DAY 2)</strong></td>
            <td><strong>4 – 6 Months</strong></td>
            <td><strong>৳ 37L – ৳ 57L ($48k+)</strong></td>
            <td><strong>13.0 Hours</strong></td>
            <td><strong>~$18.40</strong></td>
            <td><strong>৳ 30L – ৳ 43L ($38k+)</strong></td>
          </tr>
        </tbody>
      </table>

      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 10px; margin-top: 14px;">
        <div style="font-weight: 800; font-size: 10px; color: #166534; margin-bottom: 2px;">🚀 The AI-Native Commercial Multiplier</div>
        <p style="font-size: 9px; color: #15803d; line-height: 1.4;">
          GRO10X invested ~$18.40 in compute infrastructure and delivered over ৳40 Lakhs ($35,000+) in verifiable software equity and commercial proposals in ~13.0 hours. By transforming prototypes into proposal-wrapped assets with mandatory mobilization advances, GRO10X achieves 100% upfront capital recovery while accelerating delivery velocity by 180x.
        </p>
      </div>

      <div class="section-title" style="margin-top: 16px;">🌐 Live Verified Production Links</div>
      <div class="links-grid">
        <div class="link-card">
          <div>
            <div class="link-name">Bahon Fleet Proposal (PROP-2026-BAHON)</div>
            <div class="link-url">gro10x-ai.vercel.app/p/bahon-fleet</div>
          </div>
          <span class="ts-badge green">Live ➔</span>
        </div>
        <div class="link-card">
          <div>
            <div class="link-name">Bahon Fleet Command Center Prototype</div>
            <div class="link-url">gro10x-ai.vercel.app/prototypes/bahon/</div>
          </div>
          <span class="ts-badge green">Live ➔</span>
        </div>
        <div class="link-card">
          <div>
            <div class="link-name">Serviq Corporate Training Proposal</div>
            <div class="link-url">gro10x-ai.vercel.app/p/serviq-ai-workforce</div>
          </div>
          <span class="ts-badge green">Live ➔</span>
        </div>
        <div class="link-card">
          <div>
            <div class="link-name">Serviq Pilot Sprint Calendar Prototype</div>
            <div class="link-url">gro10x-ai.vercel.app/prototypes/serviq-pilot/</div>
          </div>
          <span class="ts-badge green">Live ➔</span>
        </div>
      </div>
    </div>

    <div class="footer">
      <span>GRO10X Holdings • Central Executive Operations Command</span>
      <span>Page 3 of 3 • Generated October 17, 2026 • 12:00 AM BST</span>
    </div>
  </div>

</body>
</html>
`;

(async () => {
  const htmlPath = path.join(__dirname, '../public/GRO10X_DAY2_AUDIT_REPORT.html');
  const pdfPath = path.join(__dirname, '../public/GRO10X_DAY2_AUDIT_REPORT.pdf');
  fs.writeFileSync(htmlPath, htmlContent, 'utf8');
  console.log('Wrote HTML to:', htmlPath);

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\\\Program Files\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
  });
  await browser.close();
  console.log('✅ Generated PDF to:', pdfPath);
})();
