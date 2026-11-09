/**
 * tests/campus_cup_prototype.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Forensic Attainment & Acceptance Suite for:
 * CAMPUS FUTSAL CHAMP (SEASON 2) — TOURNAMENT OS & FAN HUB PROTOTYPE
 *
 * Author: Zarif Rahman (Rapid Prototyper, GRO10X Foundry Lab)
 * Certified against: Directive (9 Nov 2026), Film Script v3, Pitch Deck v2.1,
 * and Zayan's Executive Alignment Corrections (C1 - C5).
 * ─────────────────────────────────────────────────────────────────────────────
 */

const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../server');

describe('Campus Futsal Champ (Season 2) — Forensic Verification Suite', () => {

  const cfcPath = path.join(__dirname, '../public/prototypes/cfc/index.html');
  const campusCupPath = path.join(__dirname, '../public/prototypes/campus-cup/index.html');

  // ── GATE 1: PRIMARY SPONSOR ROUTE & ALIAS INGRESS (C2) ───────────────────
  describe('Gate 1: Ingress Routing & Identity Tokens (C2)', () => {
    test('1. Primary prototype file exists on disk at public/prototypes/cfc/index.html', () => {
      expect(fs.existsSync(cfcPath)).toBe(true);
      const content = fs.readFileSync(cfcPath, 'utf8');
      expect(content.length).toBeGreaterThan(15000);
    });

    test('2. GET /prototypes/cfc returns HTTP 200 with text/html content', async () => {
      const res = await request(app).get('/prototypes/cfc');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/html/);
      expect(res.text).toContain('Campus Futsal Champ — Season 2');
    });

    test('3. GET /prototypes/cfc/ (trailing slash) returns HTTP 200 OK', async () => {
      const res = await request(app).get('/prototypes/cfc/');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/html/);
    });

    test('4. GET /campus-futsal-champ and /prototypes/campus-cup keep working as aliases', async () => {
      const res1 = await request(app).get('/campus-futsal-champ');
      expect(res1.status).toBe(200);
      expect(res1.text).toContain('Campus Futsal Champ — Season 2');

      const res2 = await request(app).get('/prototypes/campus-cup');
      expect(res2.status).toBe(200);
      expect(res2.text).toContain('Campus Futsal Champ — Season 2');
    });

    test('5. Minimal geometric line crown SVG motif and deep purple palette are configured', () => {
      const content = fs.readFileSync(cfcPath, 'utf8');
      // SVG geometric line crown
      expect(content).toContain('d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"');
      // Color tokens
      expect(content).toContain('#120A2A');
      expect(content).toContain('#9354E9');
      expect(content).toContain('#FBCD5D');
      // Taglines
      expect(content).toContain('Small Court, Big Dreams');
      expect(content).toContain('Bigger Stage, Bolder Dreams');
      expect(content).toContain('Play. Compete. Win.');
    });
  });

  // ── GATE 2: LOCKED TOURNAMENT NUMBERS & PROPOSALS PURSE (C1) ─────────────
  describe('Gate 2: Locked Tournament Structure & BDT 4.5L Purse (C1)', () => {
    let content;
    beforeAll(() => {
      content = fs.readFileSync(cfcPath, 'utf8');
    });

    test('6. Strictly 36 Teams, 51 Matches, 6 Days, 12 Groups', () => {
      expect(content).toContain('36');
      expect(content).toContain('51');
      expect(content).toContain('6 Days');
      expect(content).toContain('12 Groups');
      expect(content).toContain('12 group champions + 4 best runners-up');
    });

    test('7. C1: Locked total ৳4,50,000 and proposal item lines displayed verbatim without invented gap', () => {
      expect(content).toContain('4,50,000');
      expect(content).toContain('Champion:');
      expect(content).toContain('৳2,00,000');
      expect(content).toContain('Runner-Up:');
      expect(content).toContain('৳1,50,000');
      expect(content).toContain('Man of the Match:');
      expect(content).toContain('৳1,000/match');
      expect(content).not.toContain('৳1,00,0/match');
      expect(content).toContain('Semi-Final:');
      expect(content).toContain('৳5,000');
      expect(content).toContain('Man of the Final:');
      expect(content).toContain('৳10,000');
      expect(content).toContain('Special awards:');
      expect(content).toContain('৳5,000 each');

      // Ensure NO computed subtotal gap dressing was added
      expect(content).not.toContain('51 matches = ৳51,000');
      expect(content).not.toContain('= ৳20,000');
      expect(content).not.toContain('৳5,00,000'); // Old incorrect purse
    });

    test('8. Day 1 to Day 6 competition rhythm with zero invented calendar dates and 7+7 min group durations', () => {
      expect(content).toContain('DAY 1');
      expect(content).toContain('DAY 2');
      expect(content).toContain('DAY 3');
      expect(content).toContain('DAY 4');
      expect(content).toContain('DAY 5');
      expect(content).toContain('DAY 6');
      expect(content).toContain('NO CALENDAR DATES INVENTED');
      expect(content).toContain('Morning & Afternoon Sessions · 7+7 min');
      expect(content).toContain('High-Intensity Group Stage · 7+7 min');
      expect(content).toContain('Best Runners-Up Deciders · 7+7 min');
    });

    test('9. Season window Dec 2026 – Jan 2027 and proposed venues labelled PROPOSED', () => {
      expect(content).toContain('Dec 2026 – Jan 2027 Window');
      expect(content).toContain('Mirpur Indoor Stadium');
      expect(content).toContain('Courtside ("Season 1 home")');
      expect(content).toContain('Bashundhara Futsal Stadium');
      expect(content).toContain('[PROPOSED]');
    });
  });

  // ── GATE 3: SEASON 1 PROOF & AUDIT METRICS ─────────────────────────────────
  describe('Gate 3: Season 1 Ground Reality Proof & Insights Label', () => {
    let content;
    beforeAll(() => {
      content = fs.readFileSync(cfcPath, 'utf8');
    });

    test('10. 778K+ organic page views carries mandatory literal label', () => {
      expect(content).toContain('778K+');
      expect(content).toContain('INSIGHTS DATA — as reported by the page\'s own insights');
    });

    test('11. 24 campuses, 5,045 followers, 45.3K reel views, DIU beat BUP 1-0', () => {
      expect(content).toContain('24');
      expect(content).toContain('5,045');
      expect(content).toContain('45.3K');
      expect(content).toContain('DIU 1 - 0 BUP');
    });
  });

  // ── GATE 4: ZERO STAKEHOLDER & ZERO BRAND LEAKAGE ─────────────────────────
  describe('Gate 4: Zero Stakeholder & Zero Real Brand Leakage (Strict Removals)', () => {
    let content;
    beforeAll(() => {
      content = fs.readFileSync(cfcPath, 'utf8');
    });

    test('12. NO stakeholder names anywhere (Tickyto, Innoplume)', () => {
      expect(content).not.toMatch(/Tickyto/i);
      expect(content).not.toMatch(/Innoplume/i);
    });

    test('13. NO real brand names in sponsor slots (Banglalink, bKash, Mojo, CAMPUSCUP20)', () => {
      expect(content).not.toMatch(/Banglalink/i);
      expect(content).not.toMatch(/bKash/i);
      expect(content).not.toMatch(/Mojo/i);
      expect(content).not.toMatch(/CAMPUSCUP20/i);
      expect(content).not.toMatch(/Army Stadium/i);
    });

    test('14. C3: GRO10X is credited exactly once across the entire document', () => {
      // Find all case-insensitive occurrences of GRO10X
      const matches = content.match(/GRO10X/gi) || [];
      expect(matches.length).toBe(1);
    });
  });

  // ── GATE 5: SURFACE 5 (TEAM REGISTRATION CENTREPIECE) (C5) ────────────────
  describe('Gate 5: Team Registration Centrepiece (C5)', () => {
    let content;
    beforeAll(() => {
      content = fs.readFileSync(cfcPath, 'utf8');
    });

    test('15. Interactive multi-step form elements exist (Step 1 to Step 4)', () => {
      expect(content).toContain('id="regStep-1"');
      expect(content).toContain('id="regStep-2"');
      expect(content).toContain('id="regStep-3"');
      expect(content).toContain('id="regStep-4"');
      expect(content).toContain('goToRegStep');
      expect(content).toContain('submitDemoRegistration');
    });

    test('16. C5: Squad builder is a demo form with no hard 10-player cap stated as fact', () => {
      expect(content).toContain('squadListContainer');
      expect(content).toContain('addDemoPlayerRow');
      expect(content).not.toContain('10-player squad limit');
      expect(content).not.toContain('strictly 10 players');
    });

    test('17. Confirmation state displays demo reference ID and visible prototype note', () => {
      expect(content).toContain('confRefId');
      expect(content).toContain('CFC2-REG-');
      expect(content).toContain('Prototype — demo registration');
    });
  });

  // ── GATE 6: SURFACES 6, 7, 8, 9, 10 & REGULATION MATCH FORMAT (C3, C4) ─────
  describe('Gate 6: Specialized Surfaces & Hardening Invariants (C3, C4)', () => {
    let content;
    beforeAll(() => {
      content = fs.readFileSync(cfcPath, 'utf8');
    });

    test('18. C4: Match lengths shown as Group 7+7, R16/QF 10+10, SF 12+12, Final 15+15 min with zero 20-min halves', () => {
      expect(content).toContain('Group 7+7');
      expect(content).toContain('R16/QF 10+10');
      expect(content).toContain('SF 12+12');
      expect(content).toContain('Final 15+15 min');
      expect(content).not.toContain('20-min halves');
      expect(content).not.toContain('20-minute halves');
    });

    test('19. Surface 7 (Predictor): Top predictor wins prize money + gift hamper with NO coupons', () => {
      expect(content).toContain('Top predictor wins prize money + official gift hamper');
      expect(content).not.toContain('coupon');
      expect(content).not.toContain('discount');
      expect(content).not.toContain('voucher');
    });

    test('20. C3: Surface 9 (Player Pass) does NOT mention GRO10X or biometric, and uses sanitized sample names', () => {
      // Find the player pass section
      const rosterSection = content.split('id="tab-roster"')[1].split('</section>')[0];
      expect(rosterSection).not.toContain('GRO10X');
      expect(rosterSection).not.toMatch(/biometric/i);
      expect(rosterSection).toContain('Student ID');
      expect(rosterSection).toContain('QR Verified');

      // Sanitize check: No Shakib or Farhan anywhere in the file; Zubair Ahmed & Saimum Hossain present
      expect(content).not.toMatch(/Shakib/i);
      expect(content).not.toMatch(/Farhan Kabir/i);
      expect(content).toContain('Zubair Ahmed');
      expect(content).toContain('Saimum Hossain');
    });

    test('21. Surface 10 (Partners): Ladder tiers with 7 [ YOUR BRAND HERE ] slots & linked enquiries block', () => {
      expect(content).toContain('1. TITLE SPONSOR');
      expect(content).toContain('৳25,00,000');
      expect(content).toContain('2. POWERED BY SPONSOR');
      expect(content).toContain('৳20,00,000');
      expect(content).toContain('3. IN ASSOCIATION WITH');
      expect(content).toContain('৳15,00,000');
      expect(content).toContain('4. CO-SPONSOR');
      expect(content).toContain('৳11,00,000');
      expect(content).toContain('5. OFFICIAL PARTNERS');
      expect(content).toContain('FROM ৳8,00,000');
      expect(content).toContain('6. ANTI-TOBACCO PARTNER');
      expect(content).toContain('7. STREAMING PARTNER');
      expect(content).toContain('8. TECHNOLOGY PARTNER');
      expect(content).toContain('[ YOUR BRAND HERE ]');
      expect(content).toContain('PARTNERSHIP ENQUIRIES');
      expect(content).toContain('href="tel:01300226959"');
      expect(content).toContain('href="https://campusfutsalchamp.com"');
    });

    test('22. Procedural Web Audio API sound synthesizer functions are configured', () => {
      expect(content).toContain('playKickSound');
      expect(content).toContain('playGoalCheer');
      expect(content).toContain('playMissGroan');
      expect(content).toContain('playPostDing');
      expect(content).toContain('AudioContext');
    });

    test('23. Shootout Canvas and 9:16 mobile story canvas are implemented', () => {
      expect(content).toContain('id="shootoutCanvas"');
      expect(content).toContain('id="storyShareCanvas"');
      expect(content).toContain('generateStoryShareCard');
      expect(content).toContain('width="1080" height="1920"');
    });
  });

  // ── GATE 7: DATASET RIGOR & ZERO HORIZONTAL OVERFLOW ───────────────────────
  describe('Gate 7: 12 Futsal Groups Dataset & Phone-First Viewport Rules', () => {
    let content;
    beforeAll(() => {
      content = fs.readFileSync(cfcPath, 'utf8');
    });

    test('24. All 12 Futsal Groups (A through L) are configured in GROUPS_DATA', () => {
      expect(content).toContain("'A': [");
      expect(content).toContain("'B': [");
      expect(content).toContain("'C': [");
      expect(content).toContain("'D': [");
      expect(content).toContain("'E': [");
      expect(content).toContain("'F': [");
      expect(content).toContain("'G': [");
      expect(content).toContain("'H': [");
      expect(content).toContain("'I': [");
      expect(content).toContain("'J': [");
      expect(content).toContain("'K': [");
      expect(content).toContain("'L': [");
    });

    test('25. Mobile viewport integrity: flex-wrap pill containers and overflow-x hidden', () => {
      expect(content).toContain('overflow-x: hidden');
      expect(content).toContain('box-sizing: border-box');
      expect(content).toContain('.pill-wrap-container');
      expect(content).toContain('flex-wrap: wrap;');
    });
  });

});
