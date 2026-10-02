/**
 * tests/subphase_2_1_planner_upsell_bridge.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Sub-Phase 2.1: Interactive Digital Planner (/planner) E-Commerce Upsell Bridge
 * 
 * Tests:
 * 1. GET /planner serves valid HTML with #plannerUpsellRibbon, #btnUpgradeHardcover, #ownerLicenseKeyDisplay
 * 2. GET /planner contains luxury physical upsell card in Spread 16 with #btnSpread16Upgrade
 * 3. GET /planner contains #plannerUpsellModal with SKU sku-pq-phys-01, dual pricing, #upsellLicenseKeyInput, #btn1ClickCheckout
 * 4. GET /planner/planner.js defines initCommerceUpsellBridge and registers event triggers
 * 5. GET /planner/planner.js contains 1-click checkout URL targeting /dce/store?sku=sku-pq-phys-01
 * 6. GET /planner/planner.js implements license auto-hydration from localStorage
 * 7. POST /api/portal/activate provisions valid JWT token and sets up starter wallet
 * 8. POST /api/portal/ai-assist requires valid Bearer customer token (returns 401 on missing)
 * 9. POST /api/portal/ai-assist executes AI Focus Coach briefing with credit deduction
 * 10. QA runner suite (portal-audits.js) includes public_planner upsell modal assertions (10 steps)
 * ─────────────────────────────────────────────────────────────────────────────
 */

const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../server');

describe('Sub-Phase 2.1: Interactive Digital Planner (/planner) E-Commerce Upsell Bridge', () => {

  test('1. GET /planner serves valid HTML with #plannerUpsellRibbon, #btnUpgradeHardcover, #ownerLicenseKeyDisplay', async () => {
    const res = await request(app).get('/planner');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toContain('id="btnUpgradeHardcover"');
    expect(res.text).toContain('id="plannerUpsellRibbon"');
    expect(res.text).toContain('id="ownerLicenseKeyDisplay"');
    expect(res.text).toContain('id="ownerLicenseCode"');
    expect(res.text).toContain('id="btnClaimCertificate"');
  });

  test('2. GET /planner contains luxury physical upsell card in Spread 16 with #btnSpread16Upgrade', async () => {
    const res = await request(app).get('/planner');
    expect(res.status).toBe(200);
    expect(res.text).toContain('id="spread-16"');
    expect(res.text).toContain('id="btnSpread16Upgrade"');
    expect(res.text).toContain('Order Hardcover ($39.99 / ৳4,800)');
  });

  test('3. GET /planner contains #plannerUpsellModal with SKU sku-pq-phys-01, dual pricing, #upsellLicenseKeyInput, #btn1ClickCheckout', async () => {
    const res = await request(app).get('/planner');
    expect(res.status).toBe(200);
    expect(res.text).toContain('id="plannerUpsellModal"');
    expect(res.text).toContain('SKU: sku-pq-phys-01');
    expect(res.text).toContain('$39.99');
    expect(res.text).toContain('৳4,800 BDT');
    expect(res.text).toContain('id="upsellLicenseKeyInput"');
    expect(res.text).toContain('id="btnCopyUpsellLicense"');
    expect(res.text).toContain('id="btn1ClickCheckout"');
    expect(res.text).toContain('id="btnCloseUpsellModal"');
  });

  test('4. GET /planner/planner.js defines initCommerceUpsellBridge and registers event triggers', async () => {
    const res = await request(app).get('/planner/planner.js');
    expect(res.status).toBe(200);
    expect(res.text).toContain('function initCommerceUpsellBridge()');
    expect(res.text).toContain('initCommerceUpsellBridge();');
    expect(res.text).toContain('btnUpgradeHardcover');
    expect(res.text).toContain('btnRibbonUpgrade');
    expect(res.text).toContain('btnSpread16Upgrade');
    expect(res.text).toContain('btnClaimCertificate');
  });

  test('5. GET /planner/planner.js contains 1-click checkout URL targeting /dce/store?sku=sku-pq-phys-01', async () => {
    const res = await request(app).get('/planner/planner.js');
    expect(res.status).toBe(200);
    expect(res.text).toContain("const UPSELL_SKU = 'sku-pq-phys-01'");
    expect(res.text).toContain('/dce/store?sku=');
  });

  test('6. GET /planner/planner.js implements license auto-hydration from localStorage', async () => {
    const res = await request(app).get('/planner/planner.js');
    expect(res.status).toBe(200);
    expect(res.text).toContain('function hydrateCustomerLicenseKey()');
    expect(res.text).toContain('ownerLicenseCode');
    expect(res.text).toContain('upsellLicenseKeyInput');
    expect(res.text).toContain('PLA-14-VIP-2026');
  });

  test('7. POST /api/portal/activate provisions valid JWT token and sets up starter wallet', async () => {
    const res = await request(app)
      .post('/api/portal/activate')
      .send({
        code: 'PLA14-TEST-SUITE',
        email: 'tester.subphase21@plannerqueengro.com',
        name: 'Samantha VIP'
      });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.wallet).toBeDefined();
    expect(res.body.wallet.balance).toBeGreaterThanOrEqual(100);
  });

  test('8. POST /api/portal/ai-assist requires valid Bearer customer token (returns 401 on missing)', async () => {
    const res = await request(app)
      .post('/api/portal/ai-assist')
      .send({
        date: '2026-10-03',
        intention: 'High Focus'
      });

    expect(res.status).toBe(401);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toContain('Customer session token required');
  });

  test('9. POST /api/portal/ai-assist executes AI Focus Coach briefing with credit deduction', async () => {
    // First activate to get token
    const actRes = await request(app)
      .post('/api/portal/activate')
      .send({
        code: 'PLA14-AI-TEST',
        email: 'coach.tester@plannerqueengro.com',
        name: 'Coach Tester'
      });

    expect(actRes.status).toBe(200);
    const token = actRes.body.token;
    const initialBal = actRes.body.wallet.balance;

    // Call ai-assist with token
    const aiRes = await request(app)
      .post('/api/portal/ai-assist')
      .set('Authorization', `Bearer ${token}`)
      .send({
        date: '2026-10-03',
        intention: 'Flawless execution of Phase 2',
        priorities: ['Refactor 3D Viewer', 'Cross-track orders', 'Pass all QA suites'],
        energy: '5'
      });

    expect(aiRes.status).toBe(200);
    expect(aiRes.body.ok).toBe(true);
    expect(aiRes.body.coaching).toBeDefined();
    expect(aiRes.body.deducted).toBe(10);
    expect(aiRes.body.newBalance).toBe(initialBal - 10);
  });

  test('10. QA runner suite (portal-audits.js) includes public_planner upsell modal assertions (10 steps)', () => {
    const auditsPath = path.join(__dirname, '../extension/gro10x-qa-runner/suites/portal-audits.js');
    const content = fs.readFileSync(auditsPath, 'utf8');

    expect(content).toContain('"public_planner": {');
    expect(content).toContain('#btnUpgradeHardcover');
    expect(content).toContain('#plannerUpsellRibbon');
    expect(content).toContain('#plannerUpsellModal');
    expect(content).toContain('#btn1ClickCheckout');
    expect(content).toContain('#upsellLicenseKeyInput');
    expect(content).toContain('#btnCloseUpsellModal');

    const match = content.match(/"public_planner":\s*\{[\s\S]*?"steps":\s*\[([\s\S]*?)\]\s*\}/);
    expect(match).not.toBeNull();
    const stepsJson = `[${match[1]}]`;
    const parsed = JSON.parse(stepsJson);
    expect(parsed.length).toBe(10);
  });

});
