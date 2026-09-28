/**
 * tests/subphase_4_3_digital_vault_grocredits.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Sub-Phase 4.3 Test Suite: Digital Product Vault & GroCredits Wallet Hardening
 *
 * Verifies:
 * 1. GET /my-portal static route serves member portal HTML
 * 2. POST /api/portal/activate seeds +200 GroCredits, unlocks PLA-14, issues JWT session
 * 3. GET /api/portal/me validates auth, returns customer profile, wallet, and product catalog
 * 4. POST /api/portal/redeem successfully unlocks PLA-15 companion for 150 credits, updates balance & ledger
 * 5. POST /api/portal/redeem rejects with 402 Payment Required when balance is insufficient
 * 6. POST /api/portal/ai-assist consumes 10 credits and returns structured morning briefing
 * 7. Zero Native Dialogs Policy Audit in public/my-portal/ (0 alerts, confirms, prompts)
 * 8. Zero Banned Phone Numbers Policy Audit in public/my-portal/
 * ─────────────────────────────────────────────────────────────────────────────
 */

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_purple_os_production_2026';
process.env.TELEGRAM_OWNER_CHAT_ID = '7754769807';
process.env.TELEGRAM_ADMIN_CHAT_ID = '7754769807';

const fs = require('fs');
const path = require('path');
const request = require('supertest');
const app = require('../server');
const sse = require('../src/services/sse');

describe('🚀 Sub-Phase 4.3: Digital Product Vault & GroCredits Wallet Hardening', () => {

  const testEmail = `elena.test.${Date.now()}@plannerqueengro.com`;
  let customerToken = null;
  let customerId = null;

  let sseBroadcastSpy = null;

  beforeAll(() => {
    sseBroadcastSpy = jest.spyOn(sse, 'broadcast').mockImplementation(() => {});
  });

  afterAll(() => {
    if (sseBroadcastSpy) sseBroadcastSpy.mockRestore();
  });

  // 1. Static Route Check
  test('1. GET /my-portal serves PlannerQueenGro Members Vault HTML', async () => {
    const res = await request(app).get('/my-portal');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toContain('PlannerQueenGro');
    expect(res.text).toContain('Members Vault');
  });

  // 2. Digital Customer Activation & Credit Seeding
  test('2. POST /api/portal/activate provisions customer, seeds +200 GroCredits, unlocks PLA-14, and issues JWT', async () => {
    const res = await request(app)
      .post('/api/portal/activate')
      .send({
        code: 'PLA14-DEMO-TEST',
        email: testEmail,
        name: 'Elena Rostova'
      });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.customer).toBeDefined();
    expect(res.body.customer.email).toBe(testEmail);
    expect(res.body.customer.unlockedSkus).toContain('PLA-14');
    expect(res.body.wallet.balance).toBe(200);
    expect(res.body.isNewCustomer).toBe(true);

    customerToken = res.body.token;
    customerId = res.body.customer.id;

    // Verify SSE was broadcasted
    expect(sseBroadcastSpy).toHaveBeenCalledWith(
      'customer_activated',
      expect.objectContaining({
        customerId,
        email: testEmail,
        sku: 'PLA-14',
        credits: 200
      })
    );
  });

  // 3. Member Profile & Catalog Hydration
  test('3. GET /api/portal/me validates JWT session, returns customer profile, wallet, and product catalog', async () => {
    const res = await request(app)
      .get('/api/portal/me')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.customer.id).toBe(customerId);
    expect(res.body.wallet.balance).toBe(200);
    expect(Array.isArray(res.body.products)).toBe(true);

    const pla14 = res.body.products.find(p => p.sku === 'PLA-14');
    expect(pla14).toBeDefined();
    expect(pla14.status).toBe('unlocked');

    const pla15 = res.body.products.find(p => p.sku === 'PLA-15');
    expect(pla15).toBeDefined();
    expect(pla15.status).toBe('locked');
    expect(pla15.creditsCost).toBe(150);
  });

  // 4. Successful Companion SKU Redemption (PLA-15)
  test('4. POST /api/portal/redeem unlocks PLA-15 (150 credits), decrements balance to 50, and records ledger entry', async () => {
    const res = await request(app)
      .post('/api/portal/redeem')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        sku: 'PLA-15',
        creditsCost: 150,
        name: 'ADHD Low-Dopamine Daily Planner'
      });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.newBalance).toBe(50);
    expect(res.body.unlockedSkus).toContain('PLA-15');
    expect(res.body.transaction).toBeDefined();
    expect(res.body.transaction.amount).toBe(-150);
    expect(res.body.transaction.type).toBe('debit');

    // Verify SSE was broadcasted
    expect(sseBroadcastSpy).toHaveBeenCalledWith(
      'vault_redeemed',
      expect.objectContaining({
        customerId,
        sku: 'PLA-15',
        cost: 150,
        balance: 50
      })
    );

    // Verify GET /api/portal/me reflects updated balance and unlocked PLA-15
    const meRes = await request(app)
      .get('/api/portal/me')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(meRes.body.wallet.balance).toBe(50);
    const pla15 = meRes.body.products.find(p => p.sku === 'PLA-15');
    expect(pla15.status).toBe('unlocked');
  });

  // 5. Insufficient Balance Guard (402 Payment Required)
  test('5. POST /api/portal/redeem rejects redemption with HTTP 402 when credits are insufficient', async () => {
    // Current balance is 50; MERCH-01 requires 100 credits
    const res = await request(app)
      .post('/api/portal/redeem')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        sku: 'MERCH-01',
        creditsCost: 100,
        name: 'Planner Queen T-Shirt ($10 Voucher)'
      });

    expect(res.status).toBe(402);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toMatch(/Insufficient GroCredits/);
    expect(res.body.balance).toBe(50);
    expect(res.body.required).toBe(100);

    // Verify balance was preserved
    const meRes = await request(app)
      .get('/api/portal/me')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(meRes.body.wallet.balance).toBe(50);
  });

  // 6. AI Focus Coach Morning Briefing
  test('6. POST /api/portal/ai-assist consumes 10 GroCredits, deducts balance to 40, and returns coaching briefing', async () => {
    const res = await request(app)
      .post('/api/portal/ai-assist')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        date: '2026-09-29',
        intention: 'Deep Focus Sprint',
        priorities: ['Refactor Universal Wallet', 'Verify Zero Native Dialogs'],
        energy: 5
      });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.deducted).toBe(10);
    expect(res.body.newBalance).toBe(40);
    expect(typeof res.body.coaching).toBe('string');
    expect(res.body.coaching.length).toBeGreaterThan(20);

    // Verify SSE was broadcasted
    expect(sseBroadcastSpy).toHaveBeenCalledWith(
      'ai_coach_invoked',
      expect.objectContaining({
        customerId,
        cost: 10,
        newBalance: 40
      })
    );
  });

  // 7. Strict Zero Native Dialogs Policy Audit
  test('7. Static Code Audit: public/my-portal/ enforces Zero Native Dialogs (0 alert, confirm, prompt calls)', () => {
    const jsPath = path.join(__dirname, '../public/my-portal/portal.js');
    const htmlPath = path.join(__dirname, '../public/my-portal/index.html');

    const jsContent = fs.readFileSync(jsPath, 'utf8');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');

    // Strict regex checking for native dialog function calls: alert(...), confirm(...), prompt(...)
    const nativeDialogRegex = /\b(alert|confirm|prompt)\s*\(/g;

    const jsMatches = jsContent.match(nativeDialogRegex) || [];
    const htmlMatches = htmlContent.match(nativeDialogRegex) || [];

    expect(jsMatches).toEqual([]);
    expect(htmlMatches).toEqual([]);
  });

  // 8. Zero Banned Phone Numbers Policy Audit
  test('8. Static Code Audit: public/my-portal/ strictly excludes banned phone numbers', () => {
    const jsPath = path.join(__dirname, '../public/my-portal/portal.js');
    const htmlPath = path.join(__dirname, '../public/my-portal/index.html');
    const cssPath = path.join(__dirname, '../public/my-portal/portal.css');

    const combinedContent =
      fs.readFileSync(jsPath, 'utf8') +
      fs.readFileSync(htmlPath, 'utf8') +
      fs.readFileSync(cssPath, 'utf8');

    expect(combinedContent).not.toContain('+880 1708-459008');
    expect(combinedContent).not.toContain('1708459008');
    expect(combinedContent).not.toContain('1708-459008');
  });

});
