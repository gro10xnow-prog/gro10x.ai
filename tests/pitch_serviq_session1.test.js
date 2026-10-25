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

    test('contains Slide 4: Why BPO is Ground Zero for AI Leverage', async () => {
      const res = await request(app).get('/pitch/serviq-session1');
      expect(res.text).toContain('BPO অপারেশন্সে AI কেন সবচেয়ে বেশি শক্তিশালী?');
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

    test('renders slide-by-slide audio rehearsal recorder with MediaRecorder & Web Audio API triggers', async () => {
      const res = await request(app).get('/pitch/serviq-session1/copilot');
      expect(res.text).toContain('toggleAudioRecordingActive()');
      expect(res.text).toContain('startAudioRecordingActive()');
      expect(res.text).toContain('stopAudioRecordingActive()');
      expect(res.text).toContain('navigator.mediaDevices.getUserMedia');
      expect(res.text).toContain('MediaRecorder');
      expect(res.text).toContain('serviq_audio_slide_');
      expect(res.text).toContain('id="btn-record-audio-desktop"');
      expect(res.text).toContain('id="audio-player-desktop"');
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

});
