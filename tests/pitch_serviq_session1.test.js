const request = require('supertest');
const app = require('../server');

describe('Serviq BPO AI Masterclass — Session 1 Dual Pitch Asset (PitchOS)', () => {

  describe('Surface A: The Boardroom & TV Audience Display (/pitch/serviq-session1)', () => {
    test('serves the TV deck at /pitch/serviq-session1 with status 200 and html content', async () => {
      const res = await request(app).get('/pitch/serviq-session1');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/html/);
    });

    test('serves the TV deck with trailing slash at /pitch/serviq-session1/', async () => {
      const res = await request(app).get('/pitch/serviq-session1/');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/html/);
    });

    test('renders responsive meta viewport and title', async () => {
      const res = await request(app).get('/pitch/serviq-session1');
      expect(res.text).toContain('name="viewport"');
      expect(res.text).toContain('viewport-fit=cover');
      expect(res.text).toContain('Serviq BPO AI Masterclass');
    });

    test('renders strictly 12 canonical slides (#slide-1 to #slide-12)', async () => {
      const res = await request(app).get('/pitch/serviq-session1');
      for (let i = 1; i <= 12; i++) {
        expect(res.text).toContain(`id="slide-${i}"`);
      }
      // Ensure no slide 13 exists
      expect(res.text).not.toContain('id="slide-13"');
    });

    test('contains Slide 1: Welcome & Mission Launch with 4,700+ workforce in 64 districts', async () => {
      const res = await request(app).get('/pitch/serviq-session1');
      expect(res.text).toContain('AI Workforce Acceleration:');
      expect(res.text).toContain('শুরু হচ্ছে নতুন এক অধ্যায়');
      expect(res.text).toContain('4,700+ deployed personnel across 64 districts');
      expect(res.text).toContain('Built for Serviq (১০০% কাস্টমাইজড)');
      expect(res.text).toContain('Reclaim 3 Hours Daily (সময় বাঁচানো)');
      expect(res.text).toContain('Zero Tech Friction (সহজ প্রয়োগ)');
    });

    test('contains Slide 2: The Core Mental Model ("The Junior Executive Intern")', async () => {
      const res = await request(app).get('/pitch/serviq-session1');
      expect(res.text).toContain("AI কোনো জাদুকর না — এটা আপনার tireless 'Junior Executive'");
      expect(res.text).toContain('Stop Searching. Start Delegating.');
      expect(res.text).toContain('প্রচণ্ড মুখস্থবিদ্যা');
      expect(res.text).toContain('নির্দেশের অপেক্ষা');
      expect(res.text).toContain('visual-intern.svg');
    });

    test('contains Slide 3: The 3-Layer Enterprise Power Grid (Power Grid / Brain in a Jar / Desk)', async () => {
      const res = await request(app).get('/pitch/serviq-session1');
      expect(res.text).toContain('কীভাবে কাজ করে আধুনিক AI? সহজ ৩টি স্তর');
      expect(res.text).toContain('The Power Grid, The Brain, and Your Workstation');
      expect(res.text).toContain('বিদ্যুৎ কেন্দ্র');
      expect(res.text).toContain('সুপার ব্রেন');
      expect(res.text).toContain('আমাদের কাজের টেবিল');
      expect(res.text).toContain('visual-powergrid.svg');
    });

    test('contains Slide 4: Why BPO is Ground Zero for AI Leverage with humanized non-jargon copy', async () => {
      const res = await request(app).get('/pitch/serviq-session1');
      expect(res.text).toContain('BPO অপারেশন্সে AI কেন সবচেয়ে বেশি শক্তিশালী?');
      expect(res.text).toContain('DAILY MESSAGE FLOOD');
      expect(res.text).toContain('হাজারো মেসেজ ও রিকোয়েস্ট');
      expect(res.text).toContain('ভিন্ন ভিন্ন ফরম্যাট');
      expect(res.text).toContain('সবার আগে সার্ভিস ডেলিভারি');
      expect(res.text).toContain('visual-bpo-contrast.svg');
    });

    test('contains Slide 5: The "Lazy Prompt" Trap', async () => {
      const res = await request(app).get('/pitch/serviq-session1');
      expect(res.text).toContain('অধিকাংশ মানুষ কেন AI দিয়ে ভালো ফল পায় না?');
      expect(res.text).toContain('The "Lazy 4-Word Prompt" Trap');
      expect(res.text).toContain('Write an email to a client saying salaries are delayed.');
      expect(res.text).toContain('Generic Garbage');
      expect(res.text).toContain('ভুল তথ্যের ঝুঁকি');
    });

    test('contains Slide 6: The Proprietary GRO10X RCTO Protocol (R-C-T-O)', async () => {
      const res = await request(app).get('/pitch/serviq-session1');
      expect(res.text).toContain('নিখুঁত উত্তরের ৪টি চাবিকাঠি: R - C - T - O');
      expect(res.text).toContain('Role · Context · Task · Output Guardrails');
      expect(res.text).toContain('R · ROLE');
      expect(res.text).toContain('C · CONTEXT');
      expect(res.text).toContain('visual-rcto.svg');
    });

    test('contains Slide 7: Live Masterclass Shootout (Prompt A vs Prompt B)', async () => {
      const res = await request(app).get('/pitch/serviq-session1');
      expect(res.text).toContain('লাইভ প্রমাণ: ক্লায়েন্টের টেন্সড স্যালারি প্রশ্নের সমাধান');
      expect(res.text).toContain('Lazy Prompt vs. Serviq Production RCTO');
      expect(res.text).toContain('Prompt A · The Lazy Request');
      expect(res.text).toContain('Prompt B · Serviq RCTO Protocol');
      expect(res.text).toContain('Tanvir Ahmed');
    });

    test('contains Slide 8: The 4 Serviq Desks (Shabuddin, Rayhan, Ridhiya, Partha)', async () => {
      const res = await request(app).get('/pitch/serviq-session1');
      expect(res.text).toContain('Serviq-এর ৪টি ডেস্কে ৪টি আলাদা AI ইঞ্জিন');
      expect(res.text).toContain('Shabuddin · Rayhan · Ridhiya · Partha');
      expect(res.text).toContain('Customer Operations');
      expect(res.text).toContain('Instant Executive Drafts');
      expect(res.text).toContain('Field Logistics');
      expect(res.text).toMatch(/Admin (&|&amp;) Data Engine/);
      expect(res.text).toContain('visual-4desks.svg');
    });

    test('contains Slide 9: Enterprise Governance & The Security Shield', async () => {
      const res = await request(app).get('/pitch/serviq-session1');
      expect(res.text).toContain('কোম্পানির তথ্য ও গোপনীয়তা: ১০০% নিরাপদ');
      expect(res.text).toContain('Strict Data Boundary');
      expect(res.text).toContain('The Redaction Rule');
      expect(res.text).toContain('Human-in-the-Loop');
    });

    test('contains Slide 10: The 5-Session Flight Plan', async () => {
      const res = await request(app).get('/pitch/serviq-session1');
      expect(res.text).toContain('৫ সেশনের সুপরিকল্পিত ফ্লাইট প্ল্যান');
      expect(res.text).toContain('Session 1–3 (অনলাইন ফাউন্ডেশন)');
      expect(res.text).toContain('Session 4 (বনানী ল্যাব - হ্যান্ডস-অন)');
      expect(res.text).toContain('Session 5 (ফাউন্ডার্স ড্যাশবোর্ড)');
    });

    test('contains Slide 11: 2-Minute Zero-Friction Homework', async () => {
      const res = await request(app).get('/pitch/serviq-session1');
      expect(res.text).toContain('মঙ্গলবারের আগের কাজ:');
      expect(res.text).toContain('মাত্র ২ মিনিটের একটি প্রস্তুতি');
      expect(res.text).toContain('gemini.google.com');
      expect(res.text).toContain('Step 1 (লগইন চেক - ৩০ সেকেন্ড)');
      expect(res.text).toContain('Step 2 (একটি বিরক্তিকর কাজ বাছুন)');
      expect(res.text).toContain('Step 3 (কিছু প্রম্পট করবেন না!)');
    });

    test('contains Slide 12: Open Floor Discussion & PDF Download action', async () => {
      const res = await request(app).get('/pitch/serviq-session1');
      expect(res.text).toContain('এবার আপনাদের পালা:');
      expect(res.text).toContain('মন খুলে কথা বলুন');
      expect(res.text).toContain('No Silly Questions');
      expect(res.text).toContain('The Truth About AI');
      expect(res.text).toContain('Leadership Thoughts');
      expect(res.text).toContain('downloadPdfDeck()');
      expect(res.text).toContain('href="/pitch/serviq-session1/takeaway"');
      expect(res.text).toContain('target="_blank"');
    });

    test('verifies native inlined SVGs in Slide 2, 3, 4, 6, and 8 with zero network roundtrips', async () => {
      const res = await request(app).get('/pitch/serviq-session1');
      expect(res.text).toContain('id="intern-svg"');
      expect(res.text).toContain('id="powergrid-svg"');
      expect(res.text).toContain('id="bpo-svg"');
      expect(res.text).toContain('id="rcto-svg"');
      expect(res.text).toContain('id="desks-svg"');
      // Verify SVGs are embedded as SVG markup, not bare img tags
      expect(res.text).toContain('data-asset="visual-intern.svg"');
      expect(res.text).toContain('data-asset="visual-powergrid.svg"');
      expect(res.text).toContain('data-asset="visual-bpo-contrast.svg"');
      expect(res.text).toContain('data-asset="visual-rcto.svg"');
      expect(res.text).toContain('data-asset="visual-4desks.svg"');
    });

    test('verifies full 16:9 widescreen space utilization and expanded pod layout', async () => {
      const res = await request(app).get('/pitch/serviq-session1');
      expect(res.text).toContain('max-w-7xl w-full mx-auto px-6 lg:px-12');
      expect(res.text).toContain('min-h-[440px] lg:min-h-[480px]');
      expect(res.text).toContain('flex flex-col justify-between gap-4 h-full min-h-[440px] lg:min-h-[480px]');
    });

    test('verifies vercel.json static asset handler exists for /pitch/serviq-session1/assets/(.*)', () => {
      const fs = require('fs');
      const path = require('path');
      const vercelConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '../vercel.json'), 'utf8'));
      const assetRoute = vercelConfig.routes.find(r => r.src === '/pitch/serviq-session1/assets/(.*)');
      expect(assetRoute).toBeDefined();
      expect(assetRoute.dest).toBe('/public/pitch/serviq-session1/assets/$1');
    });
  });

  describe('Surface B: Private Presenter Co-Pilot 2.0 HUD (/pitch/serviq-session1/copilot)', () => {
    test('serves the copilot HUD at /pitch/serviq-session1/copilot and .html alias', async () => {
      const res1 = await request(app).get('/pitch/serviq-session1/copilot');
      expect(res1.status).toBe(200);
      expect(res1.headers['content-type']).toMatch(/text\/html/);

      const res2 = await request(app).get('/pitch/serviq-session1/copilot.html');
      expect(res2.status).toBe(200);
      expect(res2.headers['content-type']).toMatch(/text\/html/);
    });

    test('renders presenter pacing timer HUD (60m Masterclass + 30m Q&A toggle)', async () => {
      const res = await request(app).get('/pitch/serviq-session1/copilot');
      expect(res.text).toContain('id="timer-display"');
      expect(res.text).toContain('60:00');
      expect(res.text).toContain('id="timer-btn"');
      expect(res.text).toContain('toggleTimer()');
      expect(res.text).toContain('switchTimerMode()');
    });

    test('contains speaker notes for all 12 slides with spoken Banglish cues', async () => {
      const res = await request(app).get('/pitch/serviq-session1/copilot');
      expect(res.text).toContain('Welcome & Mission Launch');
      expect(res.text).toContain('The Core Mental Model');
      expect(res.text).toContain('The 3-Layer Enterprise Power Grid');
      expect(res.text).toContain('Why BPO is Ground Zero for AI');
      expect(res.text).toContain('The GRO10X RCTO Protocol');
      expect(res.text).toContain('Live Shootout');
      expect(res.text).toContain('The 4 Serviq Desks Ahead');
      expect(res.text).toMatch(/Security, Privacy (&|&amp;) PII Shield/);
      expect(res.text).toContain('The 5-Session Flight Plan');
      expect(res.text).toContain('2-Minute Zero-Friction Homework');
      expect(res.text).toMatch(/Open Floor: Questions (&|&amp;) Fear Dissolution/);

      // Verify authentic Banglish spoken dialogues
      expect(res.text).toContain('আসসালামু আলাইকুম মেরাজ ভাই');
      expect(res.text).toContain('আইবিএ বা হার্ভার্ড থেকে ফার্স্ট ক্লাস');
      expect(res.text).toContain('শাবউদ্দিন ভাই, রায়হান ভাই');
      expect(res.text).toContain('R - C - T - O');
      expect(res.text).toContain('BEFTN');
    });

    test('renders Live Shootout drawer with 1-tap copy for Prompt A and Prompt B', async () => {
      const res = await request(app).get('/pitch/serviq-session1/copilot');
      expect(res.text).toContain('tab-shootout');
      expect(res.text).toContain('id="prompt-a-text"');
      expect(res.text).toContain('id="prompt-b-text"');
      expect(res.text).toContain('Write an email to a client saying employee salaries are delayed');
      expect(res.text).toContain('Senior Client Operations Manager at Serviq BPO Limited');
      expect(res.text).toContain('Tanvir Ahmed');
      expect(res.text).toContain('copyElementText(');
    });

    test('renders Security / PII Shield drawer', async () => {
      const res = await request(app).get('/pitch/serviq-session1/copilot');
      expect(res.text).toContain('tab-governance');
      expect(res.text).toContain('Commercial Data Boundary');
      expect(res.text).toContain('The Golden Redaction Rule');
      expect(res.text).toContain('The Human Gatekeeper Law');
    });

    test('renders deep link to TV presentation deck', async () => {
      const res = await request(app).get('/pitch/serviq-session1/copilot');
      expect(res.text).toContain('/pitch/serviq-session1');
      expect(res.text).toContain('TV Deck');
    });

    // ─────────────────────────────────────────────────────────────
    // NEW MANDATORY CAPABILITIES (CO-PILOT 2.0 UPGRADE)
    // ─────────────────────────────────────────────────────────────
    test('renders Desktop Dual-Pane vs. Mobile View toggle with localStorage persistence', async () => {
      const res = await request(app).get('/pitch/serviq-session1/copilot');
      expect(res.text).toContain('id="view-mode-toggle-btn"');
      expect(res.text).toContain('toggleViewMode()');
      expect(res.text).toContain('copilot_view_mode');
      expect(res.text).toContain('id="desktop-layout"');
      expect(res.text).toContain('id="mobile-layout"');
      expect(res.text).toContain('id="desktop-slide-list"');
    });

    test('renders slide-by-slide audio rehearsal recorder with MediaRecorder, quota eviction & Object URL fallback', async () => {
      const res = await request(app).get('/pitch/serviq-session1/copilot');
      expect(res.text).toContain('toggleAudioRecordingActive()');
      expect(res.text).toContain('startAudioRecordingActive()');
      expect(res.text).toContain('stopAudioRecordingActive()');
      expect(res.text).toContain('navigator.mediaDevices.getUserMedia');
      expect(res.text).toContain('MediaRecorder');
      expect(res.text).toContain('serviq_audio_slide_');
      expect(res.text).toContain('manageAudioQuotaEviction');
      expect(res.text).toContain('sessionAudioMap');
      expect(res.text).toContain('URL.createObjectURL');
      expect(res.text).toContain('id="btn-record-audio-desktop"');
      expect(res.text).toContain('id="audio-player-desktop"');
    });

    test('embeds the 2 pacing interventions in Slide 3 and Slide 7 speaker notes', async () => {
      const res = await request(app).get('/pitch/serviq-session1/copilot');
      expect(res.text).toContain('PACING GUARDRAIL (Avoid GPU rabbit holes)');
      expect(res.text).toContain('বিদ্যুৎ কেন্দ্র বানাতে আসিনি');
      expect(res.text).toContain('PACING GUARDRAIL (Avoid wording debates)');
      expect(res.text).toContain('মেইলের প্রতিটি শব্দ নিয়ে কিন্তু আমরা এখন তর্ক করব না');
    });

    test('verifies visual-4desks.svg font size bump for Meet 1080p stream', async () => {
      const fs = require('fs');
      const path = require('path');
      const svg = fs.readFileSync(path.join(__dirname, '../public/pitch/serviq-session1/assets/visual-4desks.svg'), 'utf8');
      expect(svg).toContain('font-size="12"');
      expect(svg).toContain('font-size="13"');
      expect(svg).toContain('font-weight="700"');
      expect(svg).not.toContain('font-size="10"');
    });

    test('renders in-browser editable presenter notes with localStorage persistence', async () => {
      const res = await request(app).get('/pitch/serviq-session1/copilot');
      expect(res.text).toContain('editNotesActive()');
      expect(res.text).toContain('saveNotesActive()');
      expect(res.text).toContain('resetNotesActive()');
      expect(res.text).toContain('serviq_notes_slide_');
      expect(res.text).toContain('id="btn-edit-notes-desktop"');
      expect(res.text).toContain('id="btn-save-notes-desktop"');
      expect(res.text).toContain('id="active-spoken-text"');
      expect(res.text).toContain('contenteditable');
    });
  });

  describe('Surface C: 8-Page Print-Calibrated A4 Takeaway Manual (/pitch/serviq-session1/takeaway)', () => {
    test('serves the Takeaway Manual at /pitch/serviq-session1/takeaway with status 200 and html content', async () => {
      const res = await request(app).get('/pitch/serviq-session1/takeaway');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/html/);
    });

    test('serves the Takeaway Manual with trailing slash at /pitch/serviq-session1/takeaway/', async () => {
      const res = await request(app).get('/pitch/serviq-session1/takeaway/');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/html/);
    });

    test('renders A4 print stylesheet and exactly 8 .page containers (#page-1 to #page-8)', async () => {
      const res = await request(app).get('/pitch/serviq-session1/takeaway');
      expect(res.text).toContain('size: A4 portrait');
      expect(res.text).toContain('@media print');
      
      const pageMatches = res.text.match(/class="page"/g);
      expect(pageMatches).not.toBeNull();
      expect(pageMatches.length).toBe(8);

      for (let i = 1; i <= 8; i++) {
        expect(res.text).toContain(`id="page-${i}"`);
      }
      expect(res.text).not.toContain('id="page-9"');
    });

    test('verifies Page 1: Cover & Executive Joint Letter', async () => {
      const res = await request(app).get('/pitch/serviq-session1/takeaway');
      expect(res.text).toContain('SERVIQ BPO LIMITED');
      expect(res.text).toContain('GRO10X HOLDINGS');
      expect(res.text).toContain('AI Workforce Acceleration Program');
      expect(res.text).toContain('Session 1 Field Guide');
      expect(res.text).toContain('MERAJUL ISLAM');
      expect(res.text).toContain('FIROZ UDDIN AHMED');
      expect(res.text).toContain('PROP-2026-SERVIQ');
    });

    test('verifies Page 2: The Core Mental Models', async () => {
      const res = await request(app).get('/pitch/serviq-session1/takeaway');
      expect(res.text).toContain('The Core Mental Models');
      expect(res.text).toContain('The Tireless Intern');
      expect(res.text).toContain('The 3-Layer Power Grid');
      expect(res.text).toContain('Layer 1: Power Grid');
      expect(res.text).toContain('Layer 2: Foundation Brain');
      expect(res.text).toContain('Layer 3: Serviq Desk');
      expect(res.text).toContain('Tireless IBA Intern');
    });

    test('verifies Page 3: The Universal RCTO Framework & Reusable Prompt Card', async () => {
      const res = await request(app).get('/pitch/serviq-session1/takeaway');
      expect(res.text).toContain('Universal RCTO Framework');
      expect(res.text).toContain('TEAR-OUT / PIN TO DESKTOP: UNIVERSAL RCTO BUILDER');
      expect(res.text).toContain('ROLE:');
      expect(res.text).toContain('CONTEXT:');
      expect(res.text).toContain('TASK:');
      expect(res.text).toContain('OUTPUT:');
      expect(res.text).toContain('Senior Client Operations Manager at Serviq BPO Limited');
    });

    test('verifies Page 4: Live Shootout Case Study', async () => {
      const res = await request(app).get('/pitch/serviq-session1/takeaway');
      expect(res.text).toContain('Live Shootout Case Study');
      expect(res.text).toContain('PROMPT A: THE LAZY PROMPT');
      expect(res.text).toContain('PROMPT B: PRODUCTION SERVIQ RCTO');
      expect(res.text).toContain('Tanvir Ahmed');
      expect(res.text).toContain('BEFTN');
    });

    test('verifies Page 5: Workstations 1 & 2 (Shabuddin & Rayhan)', async () => {
      const res = await request(app).get('/pitch/serviq-session1/takeaway');
      expect(res.text).toContain('WORKSTATION 1: SHABUDDIN PATWARY');
      expect(res.text).toContain('CUSTOMER OPERATIONS &amp; INGRESS');
      expect(res.text).toContain('WORKSTATION 2: KHANDAKER RAYHAN');
      expect(res.text).toContain('FIELD LOGISTICS &amp; WORKFORCE');
      expect(res.text).toContain('SOP-CUST-01');
      expect(res.text).toContain('SOP-OPS-02');
    });

    test('verifies Page 6: Workstations 3 & 4 (Ridhiya & Partha)', async () => {
      const res = await request(app).get('/pitch/serviq-session1/takeaway');
      expect(res.text).toContain('WORKSTATION 3: RIDHIYA ISLAM');
      expect(res.text).toContain('ADMIN, HR &amp; EXECUTIVE DIGESTS');
      expect(res.text).toContain('WORKSTATION 4: PARTHA NATH SARKER');
      expect(res.text).toContain('OPERATIONS &amp; DATA REPORTING');
      expect(res.text).toContain('SOP-ADM-03');
      expect(res.text).toContain('SOP-REP-04');
    });

    test('verifies Page 7: Enterprise Security Shield & 6-Row PII Tokenized Redaction Table', async () => {
      const res = await request(app).get('/pitch/serviq-session1/takeaway');
      expect(res.text).toContain('Enterprise Security Shield');
      expect(res.text).toContain('6-Row PII Tokenized Redaction Table');
      expect(res.text).toContain('[Client_MNC_01]');
      expect(res.text).toContain('[Employee_Logistics_Lead]');
      expect(res.text).toContain('[NID_VERIFIED_10DIGIT]');
      expect(res.text).toContain('Real-World Redaction Demonstration');
      expect(res.text).toContain('DANGEROUS INPUT (RAW DATA)');
      expect(res.text).toContain('SAFE PRODUCTION INPUT (REDACTED)');
    });

    test('verifies Page 8: Day 1 Zero-Friction Homework & 5-Session Flight Plan', async () => {
      const res = await request(app).get('/pitch/serviq-session1/takeaway');
      expect(res.text).toContain('THE 2-MINUTE ZERO-FRICTION HOMEWORK CHECKLIST');
      expect(res.text).toContain('STEP 1: VERIFY BROWSER ACCESS');
      expect(res.text).toContain('STEP 2: HARVEST ONE DAILY FRUSTRATION');
      expect(res.text).toContain('STEP 3: BRING IT TO SESSION 2');
      expect(res.text).toContain('The 5-Session Serviq Flight Plan: Path to Full Acceleration');
      expect(res.text).toContain('https://gro10x-ai.vercel.app/pitch/serviq-session1/takeaway');
    });

    test('verifies floating action bar and navigation controls', async () => {
      const res = await request(app).get('/pitch/serviq-session1/takeaway');
      expect(res.text).toContain('window.print()');
      expect(res.text).toContain('Print / Save as 8-Page A4 PDF');
      expect(res.text).toContain('/pitch/serviq-session1');
      expect(res.text).toContain('/pitch/serviq-session1/copilot');
    });
  });

});
