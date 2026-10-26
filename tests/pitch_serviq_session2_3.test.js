const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../server');

describe('Serviq BPO AI Masterclass — Session 2 & 3 Dual Pitch Asset (PitchOS)', () => {

  // =========================================================================
  // SURFACE A: 16:9 TV AUDIENCE DISPLAY (/pitch/serviq-session2-3)
  // =========================================================================
  describe('Surface A: 16:9 TV Audience Display (/pitch/serviq-session2-3)', () => {
    test('serves the TV deck at /pitch/serviq-session2-3 with status 200 and html content', async () => {
      const res = await request(app).get('/pitch/serviq-session2-3');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/html/);
    });

    test('serves the TV deck with trailing slash at /pitch/serviq-session2-3/', async () => {
      const res = await request(app).get('/pitch/serviq-session2-3/');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/html/);
    });

    test('renders responsive meta viewport, dark styling, and correct title', async () => {
      const res = await request(app).get('/pitch/serviq-session2-3');
      expect(res.text).toContain('name="viewport"');
      expect(res.text).toContain('viewport-fit=cover');
      expect(res.text).toContain('Session 2 & 3');
      expect(res.text).toContain('Vision AI, Custom Gems & NotebookLM Vault');
    });

    test('renders strictly 12 canonical slides (#slide-01 to #slide-12)', async () => {
      const res = await request(app).get('/pitch/serviq-session2-3');
      for (let i = 1; i <= 12; i++) {
        const slideId = `id="slide-${String(i).padStart(2, '0')}"`;
        expect(res.text).toContain(slideId);
      }
      expect(res.text).not.toContain('id="slide-13"');
      expect(res.text).not.toContain('id="slide-00"');
    });

    test('contains Slide 01: Welcome Back & The Friction Harvest', async () => {
      const res = await request(app).get('/pitch/serviq-session2-3');
      expect(res.text).toContain('From 4 Words to Real Workflows:');
      expect(res.text).toContain('হোমওয়ার্কের সমাধান');
      expect(res.text).toContain('REAL HEADACHES ONLY');
      expect(res.text).toContain('THE 10X SHIFT');
    });

    test('contains Slide 02: Multimodal Vision AI Ingress', async () => {
      const res = await request(app).get('/pitch/serviq-session2-3');
      expect(res.text).toContain('Beyond Typing:');
      expect(res.text).toContain('চোখ দিয়ে দেখে কাজ করা');
      expect(res.text).toContain('PHOTO-TO-DATA');
      expect(res.text).toContain('BENGALI SCRIPT NATIVE');
    });

    test('contains Slide 03: Live Shootout: The Blurry Delivery Challan', async () => {
      const res = await request(app).get('/pitch/serviq-session2-3');
      expect(res.text).toContain('Live Shootout:');
      expect(res.text).toContain('অস্পষ্ট রসিদ থেকে ঝকঝকে টেবিল');
      expect(res.text).toContain('METHOD A: MANUAL TYPING');
      expect(res.text).toContain('METHOD B: SERVIQ MULTIMODAL');
      expect(res.text).toContain('3.2 Secs');
    });

    test('contains Slide 04: Custom Gems: Zero-Typing Desk Automations', async () => {
      const res = await request(app).get('/pitch/serviq-session2-3');
      expect(res.text).toContain('Custom Gems:');
      expect(res.text).toContain('বারবার প্রম্পট লেখার দিন শেষ');
      expect(res.text).toContain('DEDICATED MICRO-AI');
      expect(res.text).toContain('1-CLICK DELEGATION');
    });

    test('contains Slide 05: The 4 Serviq Gems Matrix for 4 Desks', async () => {
      const res = await request(app).get('/pitch/serviq-session2-3');
      expect(res.text).toContain('4 Desks, 4 Permanent Gems:');
      expect(res.text).toContain('সার্ভিকের নিজস্ব এআই স্কোয়াড');
      expect(res.text).toContain("SHABUDDIN'S GEM");
      expect(res.text).toContain("RAYHAN'S GEM");
      expect(res.text).toContain("RIDHIYA'S GEM");
      expect(res.text).toContain("PARTHA'S GEM");
    });

    test('contains Slide 06: Live Ticket Triage & In-Flight PII Redaction', async () => {
      const res = await request(app).get('/pitch/serviq-session2-3');
      expect(res.text).toContain('Live Ingress:');
      expect(res.text).toContain('টিকিট রাউটিং ও গোপনীয়তা রক্ষা');
      expect(res.text).toContain('[CLIENT-ALPHA]');
      expect(res.text).toContain('[EMP-4402]');
      expect(res.text).toContain('TOKEN MASKING IN FLIGHT');
    });

    test('contains Slide 07: 10-Minute Intermission Engine with SVG radial ring and chime', async () => {
      const res = await request(app).get('/pitch/serviq-session2-3');
      expect(res.text).toContain('10-Minute Recharge:');
      expect(res.text).toContain('চা খান ও চ্যালেঞ্জ নিন');
      expect(res.text).toContain('id="intermission-display"');
      expect(res.text).toContain('id="timer-progress-ring"');
      expect(res.text).toContain('id="btn-intermission-toggle"');
      expect(res.text).toContain('id="btn-intermission-add"');
      expect(res.text).toContain('id="btn-intermission-reset"');
      expect(res.text).toContain('AudioContext');
      expect(res.text).toContain('createOscillator');
    });

    test('contains Slide 08: Grounded Truth vs Hallucination (NotebookLM)', async () => {
      const res = await request(app).get('/pitch/serviq-session2-3');
      expect(res.text).toContain('100% Source-Grounded:');
      expect(res.text).toContain('মনগড়া উত্তরের চিরতরে সমাপ্তি');
      expect(res.text).toContain('ZERO HALLUCINATION');
      expect(res.text).toContain('CLOSED KNOWLEDGE VAULT');
    });

    test('contains Slide 09: Building the Serviq Enterprise Knowledge Vault', async () => {
      const res = await request(app).get('/pitch/serviq-session2-3');
      expect(res.text).toContain('Building the Serviq Vault:');
      expect(res.text).toContain('সকল ফাইলের একক মস্তিষ্ক');
      expect(res.text).toContain('Serviq HR Policy 2026');
      expect(res.text).toContain('22 MNC Client MSAs');
      expect(res.text).toContain('Paylio Operating Manual');
    });

    test('contains Slide 10: Plain Banglish Q&A with Exact Page Citations', async () => {
      const res = await request(app).get('/pitch/serviq-session2-3');
      expect(res.text).toContain('Exact Page Citations:');
      expect(res.text).toContain('উত্তর মিলবে পৃষ্ঠা নম্বরসহ');
      expect(res.text).toContain('[Source 1, Page 42]');
      expect(res.text).toContain('[Labor Act, Sec 46]');
    });

    test('contains Slide 11: 1-Click Executive Synthesis & Audio Overviews', async () => {
      const res = await request(app).get('/pitch/serviq-session2-3');
      expect(res.text).toContain('1-Click Executive Synthesis:');
      expect(res.text).toContain('সিইও ড্যাশবোর্ড ও অডিও সামারি');
      expect(res.text).toContain('EXECUTIVE STUDY GUIDE');
      expect(res.text).toContain('1 Click');
    });

    test('contains Slide 12: Road to Banani Lab Prep', async () => {
      const res = await request(app).get('/pitch/serviq-session2-3');
      expect(res.text).toContain('Road to Banani Lab:');
      expect(res.text).toContain('শনিবার ল্যাপটপে মুখোমুখি লড়াই');
      expect(res.text).toContain('LAPTOP READINESS');
      expect(res.text).toContain('1 GEM + 1 NOTEBOOK');
      expect(res.text).toContain('GRADUATION &amp; DASHBOARD');
    });

    test('implements keyboard navigation and fullscreen toggle', async () => {
      const res = await request(app).get('/pitch/serviq-session2-3');
      expect(res.text).toContain('toggleFullscreen');
      expect(res.text).toContain('keydown');
      expect(res.text).toContain('nextSlide');
      expect(res.text).toContain('prevSlide');
    });
  });

  // =========================================================================
  // SURFACE B: PRESENTER CO-PILOT 3.0 HUD (/pitch/serviq-session2-3/copilot)
  // =========================================================================
  describe('Surface B: Presenter Co-Pilot 3.0 HUD (/pitch/serviq-session2-3/copilot)', () => {
    test('serves the co-pilot HUD at /pitch/serviq-session2-3/copilot with status 200 and html content', async () => {
      const res = await request(app).get('/pitch/serviq-session2-3/copilot');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/html/);
    });

    test('serves the co-pilot HUD alias at /pitch/serviq-session2-3/copilot.html', async () => {
      const res = await request(app).get('/pitch/serviq-session2-3/copilot.html');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/html/);
    });

    test('features layout toggle between Desktop Dual-Pane (40/60) and Mobile HUD', async () => {
      const res = await request(app).get('/pitch/serviq-session2-3/copilot');
      expect(res.text).toContain('toggleViewMode');
      expect(res.text).toContain('id="desktop-layout"');
      expect(res.text).toContain('id="mobile-layout"');
      expect(res.text).toContain('id="view-mode-toggle-btn"');
    });

    test('features Tri-Timer Stopwatch (Part 1 45m ➔ Intermission 10m ➔ Part 2 45m)', async () => {
      const res = await request(app).get('/pitch/serviq-session2-3/copilot');
      expect(res.text).toContain('switchTimerPhase');
      expect(res.text).toContain('toggleTimer');
      expect(res.text).toContain('resetTimer');
      expect(res.text).toContain('id="timer-display"');
      expect(res.text).toContain('id="timer-label"');
      expect(res.text).toContain('Part 1: Vision & Gems');
      expect(res.text).toContain('Intermission Recharge');
      expect(res.text).toContain('Part 2: NotebookLM');
    });

    test('contains spoken Banglish speaker notes for all 12 slides addressing key Serviq leaders & participants', async () => {
      const res = await request(app).get('/pitch/serviq-session2-3/copilot');
      // Must name Meraz Bhai, Moon Bhai, Shabuddin, Rayhan, Ridhiya, Partha
      expect(res.text).toContain('শাবউদ্দিন ভাই');
      expect(res.text).toContain('রায়হান ভাই');
      expect(res.text).toContain('রিদিয়া');
      expect(res.text).toContain('পার্থ');
      expect(res.text).toContain('মেরাজ ভাই');
      expect(res.text).toContain('মুন ভাই');
    });

    test('contains 1-Tap Field Prompts for Challan OCR, Custom Gem, NotebookLM, and Intermission', async () => {
      const res = await request(app).get('/pitch/serviq-session2-3/copilot');
      expect(res.text).toContain('copyChallanPrompt');
      expect(res.text).toContain('copyGemPrompt');
      expect(res.text).toContain('copyNotebookPrompt');
      expect(res.text).toContain('copyIntermissionDropPrompt');
    });

    test('contains 1-Tap Objection Drawer addressing smudged challans, Gem privacy, and Bengali PDF recognition', async () => {
      const res = await request(app).get('/pitch/serviq-session2-3/copilot');
      expect(res.text).toContain('1. অস্পষ্ট বা ছেঁড়া চালান?');
      expect(res.text).toContain('2. Custom Gem কি অন্য কেউ দেখবে?');
      expect(res.text).toContain('3. NotebookLM কি বাংলা বোঝে?');
      expect(res.text).toContain('[FLAG: Unclear Digit]');
    });

    test('includes audio rehearsal recorder with safe LocalStorage eviction & memory fallback', async () => {
      const res = await request(app).get('/pitch/serviq-session2-3/copilot');
      expect(res.text).toContain('manageAudioQuotaEviction');
      expect(res.text).toContain('sessionAudioMap');
      expect(res.text).toContain('URL.createObjectURL');
      expect(res.text).toContain('toggleAudioRecordingActive');
    });

    test('links back to Surface A TV deck via /pitch/serviq-session2-3', async () => {
      const res = await request(app).get('/pitch/serviq-session2-3/copilot');
      expect(res.text).toContain('href="/pitch/serviq-session2-3"');
    });
  });

  // =========================================================================
  // VERCEL ROUTING & CANONICAL PRODUCTION INVARIANTS
  // =========================================================================
  describe('Vercel Routing & Production Domain Invariants', () => {
    test('vercel.json registers exact routes for Surface A and Surface B', () => {
      const vercelJsonPath = path.join(__dirname, '../vercel.json');
      const vercelContent = fs.readFileSync(vercelJsonPath, 'utf8');
      const vercelConfig = JSON.parse(vercelContent);

      const routes = vercelConfig.routes || [];
      const hasCopilotRoute = routes.some(r => 
        r.src === '/pitch/serviq-session2-3/copilot(.*)' && 
        r.dest === '/public/pitch/serviq-session2-3/copilot.html'
      );
      const hasDeckRoute = routes.some(r => 
        r.src === '/pitch/serviq-session2-3(/.*)?' && 
        r.dest === '/public/pitch/serviq-session2-3/index.html'
      );

      expect(hasCopilotRoute).toBe(true);
      expect(hasDeckRoute).toBe(true);
    });

    test('strictly enforces Zero Occurrences of apex gro10x.ai brand URL in presentation files', () => {
      const surfaceAPath = path.join(__dirname, '../public/pitch/serviq-session2-3/index.html');
      const surfaceBPath = path.join(__dirname, '../public/pitch/serviq-session2-3/copilot.html');

      const surfaceAContent = fs.readFileSync(surfaceAPath, 'utf8');
      const surfaceBContent = fs.readFileSync(surfaceBPath, 'utf8');

      expect(surfaceAContent).not.toMatch(/https?:\/\/(www\.)?gro10x\.ai/);
      expect(surfaceBContent).not.toMatch(/https?:\/\/(www\.)?gro10x\.ai/);
    });
  });

});
