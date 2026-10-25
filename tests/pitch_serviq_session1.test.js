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
      expect(res.text).toContain('Serviq BPO AI Workforce Acceleration:');
      expect(res.text).toContain('Day 1 Kickoff');
      expect(res.text).toContain('4,700+ deployed personnel across 64 districts');
      expect(res.text).toContain('Built Specifically for Serviq');
      expect(res.text).toContain('The 3-Hour Daily Reclaim');
      expect(res.text).toMatch(/Executive (&|&amp;) Team Alignment/);
    });

    test('contains Slide 2: The Core Mental Model ("The Junior Executive Intern")', async () => {
      const res = await request(app).get('/pitch/serviq-session1');
      expect(res.text).toContain("Stop Thinking 'Search Engine' — Start Thinking 'Tireless MBA Intern'");
      expect(res.text).toContain('Tier-1 Ivy League / IBA Graduate');
      expect(res.text).toContain('Photographic Memory');
      expect(res.text).toContain('Zero (Until Briefed)');
    });

    test('contains Slide 3: The 3-Layer Enterprise Power Grid (Power Grid / Brain in a Jar / Desk)', async () => {
      const res = await request(app).get('/pitch/serviq-session1');
      expect(res.text).toContain('How Modern AI Works: The Power Grid, The Brain, and The Desk');
      expect(res.text).toContain('The National Power Grid');
      expect(res.text).toContain('The Brain in a Jar');
      expect(res.text).toContain('The Workstation Desk');
    });

    test('contains Slide 4: Why BPO is Ground Zero for AI Leverage', async () => {
      const res = await request(app).get('/pitch/serviq-session1');
      expect(res.text).toMatch(/The Repetitive Communication (&|&amp;) Data Bottleneck/);
      expect(res.text).toContain('Traditional BPO Model');
      expect(res.text).toContain('AI-Accelerated Serviq');
      expect(res.text).toContain('The Unfair Market Advantage');
    });

    test('contains Slide 5: The "Lazy Prompt" Trap', async () => {
      const res = await request(app).get('/pitch/serviq-session1');
      expect(res.text).toContain('Why Most People Give Up on AI After 48 Hours');
      expect(res.text).toContain('The Typical 4-Word Disaster');
      expect(res.text).toContain('Write an email to a client saying salaries are delayed.');
    });

    test('contains Slide 6: The Proprietary GRO10X RCTO Protocol (R-C-T-O)', async () => {
      const res = await request(app).get('/pitch/serviq-session1');
      expect(res.text).toContain('The Master Blueprint for Flawless AI Execution: R-C-T-O');
      expect(res.text).toContain('Role · Who is Speaking?');
      expect(res.text).toContain('Context · What Happened?');
      expect(res.text).toContain('Task · What to Produce?');
      expect(res.text).toContain('Output · Guardrails');
    });

    test('contains Slide 7: Live Masterclass Shootout (Prompt A vs Prompt B)', async () => {
      const res = await request(app).get('/pitch/serviq-session1');
      expect(res.text).toContain('Live Demonstration: Resolving an Urgent Client Payroll Inquiry');
      expect(res.text).toContain('Prompt A · The Lazy Request');
      expect(res.text).toContain('Prompt B · Serviq RCTO Protocol');
    });

    test('contains Slide 8: The 4 Serviq Desks (Shabuddin, Rayhan, Ridhiya, Partha)', async () => {
      const res = await request(app).get('/pitch/serviq-session1');
      expect(res.text).toContain("Precision-Tailored for Each Team Member's Real Daily Tasks");
      expect(res.text).toContain('Shabuddin');
      expect(res.text).toContain('Khandaker Rayhan');
      expect(res.text).toContain('Ridhiya Islam');
      expect(res.text).toContain('Partha Nath Sarker');
    });

    test('contains Slide 9: Enterprise Governance & The Security Shield', async () => {
      const res = await request(app).get('/pitch/serviq-session1');
      expect(res.text).toMatch(/Enterprise Governance: Protecting Client Data (&|&amp;) Company Trust/);
      expect(res.text).toContain('No Public AI Training');
      expect(res.text).toContain('Zero Raw PII in Prompts');
      expect(res.text).toContain('Human-in-the-Loop');
    });

    test('contains Slide 10: The 5-Session Flight Plan', async () => {
      const res = await request(app).get('/pitch/serviq-session1');
      expect(res.text).toContain('From Zero-Friction Foundations to Live Office Execution');
      expect(res.text).toMatch(/Foundations (&|&amp;) RCTO/);
      expect(res.text).toMatch(/Gemini (&|&amp;) Multimodal/);
      expect(res.text).toMatch(/Workspace (&|&amp;) Sheets/);
      expect(res.text).toContain('In-Person Lab');
      expect(res.text).toContain('Founders Command');
    });

    test('contains Slide 11: 2-Minute Zero-Friction Homework', async () => {
      const res = await request(app).get('/pitch/serviq-session1');
      expect(res.text).toContain('Your Mission Before Tuesday:');
      expect(res.text).toContain('Zero Typing, Zero Stress');
      expect(res.text).toContain('gemini.google.com');
      expect(res.text).toContain('Pick 1 Annoying Task');
      expect(res.text).toContain('Do Not Prompt Yet!');
    });

    test('contains Slide 12: Open Floor Discussion & PDF Download action', async () => {
      const res = await request(app).get('/pitch/serviq-session1');
      expect(res.text).toContain("The Floor is Yours: Let's Address Every Question Directly");
      expect(res.text).toContain('Zero Judgment Zone');
      expect(res.text).toContain('The Replacement Question');
      expect(res.text).toContain('downloadPdfDeck()');
    });
  });

  describe('Surface B: Private Presenter Co-Pilot HUD (/pitch/serviq-session1/copilot)', () => {
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

    test('contains speaker notes for all 12 slides from the curriculum blueprint', async () => {
      const res = await request(app).get('/pitch/serviq-session1/copilot');
      expect(res.text).toMatch(/Welcome (&|&amp;) Mission Launch/);
      expect(res.text).toContain('The Core Mental Model');
      expect(res.text).toContain('The 3-Layer Enterprise Power Grid');
      expect(res.text).toContain('Why BPO is Ground Zero for AI');
      expect(res.text).toContain('The "Lazy Prompt" Trap');
      expect(res.text).toContain('The GRO10X RCTO Protocol');
      expect(res.text).toContain('Live Shootout');
      expect(res.text).toContain('The 4 Serviq Desks Ahead');
      expect(res.text).toMatch(/Security, Privacy (&|&amp;) PII Shield/);
      expect(res.text).toContain('The 5-Session Flight Plan');
      expect(res.text).toContain('2-Minute Zero-Friction Homework');
      expect(res.text).toMatch(/Open Floor: Questions (&|&amp;) Fear Dissolution/);
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
  });

});
