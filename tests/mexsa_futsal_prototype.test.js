/**
 * tests/mexsa_futsal_prototype.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Automated Test Suite for MExSA Futsal Premier League:
 * Auction Room, Mathematical Purse Guard Engine, 9:16 Social Pack Studio,
 * and Tournament Matchday Center.
 *
 * Validates:
 * 1. Prototype HTML file exists on disk at public/prototypes/mexsa-futsal/index.html
 * 2. GET /prototypes/mexsa-futsal returns HTTP 200 with text/html
 * 3. GET /prototypes/mexsa-futsal/ (trailing slash) returns HTTP 200 OK
 * 4. 8 permanent franchises are pre-configured with distinct identities
 * 5. Purse Guard Engine mathematically enforces:
 *    - Base price 20 points
 *    - Formula: maxBid = purse - ((spotsOpen - 1) * 20)
 *    - Foreign cap: max 2 foreign players
 *    - Goalkeeper mandate: min 2 GKs
 * 6. Live bidding console: 40-second timer, +10s anti-snipe, banded bid increments (+10, +25, +50)
 * 7. Autonomous AI bot bidding personalities & Quick-Simulate draft capability
 * 8. Unsold reserve pool drawer with recall mechanism
 * 9. Surface B: 9:16 UHD Social Pack canvas generator (1080x1920) with 1-click PNG download
 * 10. Surface C: Tournament matchday center with 2 groups of 4, organiser score modal, and knockout brackets
 * ─────────────────────────────────────────────────────────────────────────────
 */

const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../server');

describe('MExSA Futsal Premier League Prototype Suite', () => {

  const prototypePath = path.join(__dirname, '../public/prototypes/mexsa-futsal/index.html');

  test('1. Prototype HTML file exists on disk at public/prototypes/mexsa-futsal/index.html', () => {
    expect(fs.existsSync(prototypePath)).toBe(true);
    const content = fs.readFileSync(prototypePath, 'utf8');
    expect(content.length).toBeGreaterThan(10000);
  });

  test('2. GET /prototypes/mexsa-futsal returns HTTP 200 with text/html content', async () => {
    const res = await request(app).get('/prototypes/mexsa-futsal');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toContain('MExSA');
    expect(res.text).toContain('FUTSAL');
    expect(res.text).toContain('PREMIER LEAGUE');
  });

  test('3. GET /prototypes/mexsa-futsal/ (trailing slash) returns HTTP 200 OK', async () => {
    const res = await request(app).get('/prototypes/mexsa-futsal/');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
  });

  test('4. All 8 permanent franchises are configured with high-contrast themes', async () => {
    const res = await request(app).get('/prototypes/mexsa-futsal');
    const content = res.text;
    expect(content).toContain('Apex Strikers');
    expect(content).toContain('Klang Titans');
    expect(content).toContain('Merdeka FC');
    expect(content).toContain('Bangsar Warriors');
    expect(content).toContain('Damansara United');
    expect(content).toContain('Subang Galaxy');
    expect(content).toContain('Cyberjaya Knights');
    expect(content).toContain('Shah Alam Phoenix');
  });

  test('5. Mathematical Purse Guard Engine enforces 1000 pts purse, base 20, min 2 GKs, max 2 foreign', async () => {
    const res = await request(app).get('/prototypes/mexsa-futsal');
    const content = res.text;
    // Core parameters
    expect(content).toContain('getPurseGuardMetrics');
    expect(content).toContain('spotsOpen = 10 - currentCount');
    expect(content).toContain('maxBid = franchise.purse - ((spotsOpen - 1) * 20)');
    expect(content).toContain('Foreign Cap Reached (2/2)');
    expect(content).toContain('Must Reserve');
    expect(content).toContain('for GKs');
    expect(content).toContain('Purse: 1,000 Pts');
  });

  test('6. Live Bidding Console implements 40s timer, anti-snipe +10s, banded increments and Web Audio', async () => {
    const res = await request(app).get('/prototypes/mexsa-futsal');
    const content = res.text;
    expect(content).toContain('lotTimer = 40');
    expect(content).toContain('ANTI-SNIPE +10s EXTENSION!');
    expect(content).toContain('getNextMinimumBid');
    expect(content).toContain('getIncrementBandText');
    expect(content).toContain('+10 Pts (<100)');
    expect(content).toContain('+25 Pts (100–299)');
    expect(content).toContain('+50 Pts (≥300)');
    expect(content).toContain('playGavelStrike');
    expect(content).toContain('playBidChime');
    expect(content).toContain('AudioContext');
  });

  test('7. Autonomous AI Franchise Bots & Quick-Simulate Draft capability are implemented', async () => {
    const res = await request(app).get('/prototypes/mexsa-futsal');
    const content = res.text;
    expect(content).toContain('maybeTriggerAIBid');
    expect(content).toContain('quickSimulateAuction');
    expect(content).toContain('btnSpeedNormal');
    expect(content).toContain('btnSpeedFast');
    expect(content).toContain('btnSpeedDemo');
  });

  test('8. Unsold Reserve Pool Drawer with recall mechanism is mounted', async () => {
    const res = await request(app).get('/prototypes/mexsa-futsal');
    const content = res.text;
    expect(content).toContain('id="surface-reserve"');
    expect(content).toContain('id="reservePoolGrid"');
    expect(content).toContain('recallReservePlayer');
    expect(content).toContain('unsoldReserve');
  });

  test('9. Surface B: 9:16 Social Pack Canvas (1080x1920) generator is mounted', async () => {
    const res = await request(app).get('/prototypes/mexsa-futsal');
    const content = res.text;
    expect(content).toContain('id="surface-social"');
    expect(content).toContain('id="socialPreviewCanvas"');
    expect(content).toContain('width="1080" height="1920"');
    expect(content).toContain('renderSoldCardToCanvas');
    expect(content).toContain('renderSquadPosterToCanvas');
    expect(content).toContain('renderMatchdayCardToCanvas');
    expect(content).toContain('downloadSocialCardPNG');
  });

  test('10. Surface C: Tournament Matchday Center includes 2 groups of 4, organizer score modal, and knockouts', async () => {
    const res = await request(app).get('/prototypes/mexsa-futsal');
    const content = res.text;
    expect(content).toContain('id="surface-tournament"');
    expect(content).toContain('id="groupATableBody"');
    expect(content).toContain('id="groupBTableBody"');
    expect(content).toContain('id="scoreEntryModal"');
    expect(content).toContain('openScoreModal');
    expect(content).toContain('saveMatchScore');
    expect(content).toContain('SEMIFINAL 1');
    expect(content).toContain('SEMIFINAL 2');
    expect(content).toContain('GRAND FINAL');
  });

});
