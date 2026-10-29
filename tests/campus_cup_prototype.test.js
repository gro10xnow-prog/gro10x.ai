/**
 * tests/campus_cup_prototype.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Automated Test Suite for Campus Cup 2026:
 * Inter-University Football Tournament OS & Mini-Cup Penalty Shootout Fan Hub
 *
 * Validates:
 * 1. Prototype file existence on disk at public/prototypes/campus-cup/index.html
 * 2. GET /prototypes/campus-cup returns HTTP 200 with text/html
 * 3. GET /prototypes/campus-cup/ (trailing slash) returns HTTP 200 OK
 * 4. HTML contains shootout canvas (#shootoutCanvas) and story canvas (#storyShareCanvas)
 * 5. Game HUD telemetry elements are configured (score, streak, lives, AI tier)
 * 6. All 6 Tournament Hub navigation tabs are mounted
 * 7. All 9 Bangladesh varsity allegiances are configured in dataset (DU, BUET, NSU, BRAC, AIUB, IUT, JU, UIU, BUP)
 * 8. Procedural Web Audio API sound synthesizer methods are present (kick, cheer, miss, post-ding)
 * 9. Viral 9:16 mobile story card generator is implemented
 * 10. Anti-Ringer verified digital player pass roster and match center architecture are present
 * ─────────────────────────────────────────────────────────────────────────────
 */

const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../server');

describe('Campus Cup 2026 Tournament OS & Mini-Cup Fan Hub Prototype', () => {

  const prototypePath = path.join(__dirname, '../public/prototypes/campus-cup/index.html');

  test('1. Prototype HTML file exists on disk at public/prototypes/campus-cup/index.html', () => {
    expect(fs.existsSync(prototypePath)).toBe(true);
    const content = fs.readFileSync(prototypePath, 'utf8');
    expect(content.length).toBeGreaterThan(5000);
  });

  test('2. GET /prototypes/campus-cup returns HTTP 200 with text/html content', async () => {
    const res = await request(app).get('/prototypes/campus-cup');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toContain('CAMPUS CUP 2026');
    expect(res.text).toContain('Inter-University Football');
  });

  test('3. GET /prototypes/campus-cup/ (trailing slash) returns HTTP 200 OK', async () => {
    const res = await request(app).get('/prototypes/campus-cup/');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
  });

  test('4. Shootout game canvas and offscreen viral story canvas are mounted', async () => {
    const res = await request(app).get('/prototypes/campus-cup');
    expect(res.text).toContain('id="shootoutCanvas"');
    expect(res.text).toContain('id="storyShareCanvas"');
    expect(res.text).toContain('width="1080" height="1920"');
  });

  test('5. Game HUD telemetry elements are configured (score, streak, lives, AI tier)', async () => {
    const res = await request(app).get('/prototypes/campus-cup');
    expect(res.text).toContain('id="hudScore"');
    expect(res.text).toContain('id="hudStreak"');
    expect(res.text).toContain('id="hudLives"');
    expect(res.text).toContain('id="hudGKLevel"');
  });

  test('6. All 6 Tournament Hub navigation tabs are mounted', async () => {
    const res = await request(app).get('/prototypes/campus-cup');
    expect(res.text).toContain('id="tab-shootout"');
    expect(res.text).toContain('id="tab-leaderboard"');
    expect(res.text).toContain('id="tab-matchcenter"');
    expect(res.text).toContain('id="tab-brackets"');
    expect(res.text).toContain('id="tab-roster"');
    expect(res.text).toContain('id="tab-sponsors"');
  });

  test('7. All 9 Bangladesh varsity allegiances are configured in dataset', async () => {
    const res = await request(app).get('/prototypes/campus-cup');
    const content = res.text;
    expect(content).toContain("id: 'nsu'");
    expect(content).toContain("id: 'du'");
    expect(content).toContain("id: 'buet'");
    expect(content).toContain("id: 'brac'");
    expect(content).toContain("id: 'aiub'");
    expect(content).toContain("id: 'iut'");
    expect(content).toContain("id: 'ju'");
    expect(content).toContain("id: 'uiu'");
    expect(content).toContain("id: 'bup'");
  });

  test('8. Procedural Web Audio API sound synthesizer methods are present', async () => {
    const res = await request(app).get('/prototypes/campus-cup');
    expect(res.text).toContain('playKickSound');
    expect(res.text).toContain('playGoalCheer');
    expect(res.text).toContain('playMissGroan');
    expect(res.text).toContain('playPostDing');
    expect(res.text).toContain('AudioContext');
  });

  test('9. Viral 9:16 mobile story card generator is implemented', async () => {
    const res = await request(app).get('/prototypes/campus-cup');
    expect(res.text).toContain('generateStoryShareCard');
    expect(res.text).toContain('CampusCup-');
    expect(res.text).toContain('toDataURL');
  });

  test('10. Anti-Ringer verified digital player pass roster and match center architecture are present', async () => {
    const res = await request(app).get('/prototypes/campus-cup');
    expect(res.text).toContain('Verified Digital Player Pass');
    expect(res.text).toContain('Anti-Ringer');
    expect(res.text).toContain('Student ID:');
    expect(res.text).toContain('Live Match Center');
  });

});
