/**
 * tests/subphase_1_2_store_dual_currency.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Sub-Phase 1.2: PlannerQueen Storefront Dual Currency & Dynamic Catalog Hydration
 * 
 * Tests:
 * 1. GET /dce/store serves valid HTML with dual-currency controls & product cards
 * 2. GET /api/dce/products returns SKUs with both USD and BDT pricing metadata
 * 3. POST /api/dce/promotions/validate computes USD percentage discount
 * 4. POST /api/dce/promotions/validate computes BDT percentage & fixed discount accurately
 * 5. POST /api/dce/promotions/validate enforces spend thresholds in both USD and BDT
 * 6. POST /api/dce/orders/checkout executes digital checkout in USD ($19.99)
 * 7. POST /api/dce/orders/checkout executes digital checkout in BDT (৳2,400)
 * 8. POST /api/dce/orders/checkout with promo code applies discount in BDT
 * 9. POST /api/dce/orders/checkout executes physical planner checkout in BDT (৳4,200)
 * 10. QA runner suite (portal-audits.js) includes dce_store currency toggle steps
 * ─────────────────────────────────────────────────────────────────────────────
 */

const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../server');

describe('Sub-Phase 1.2: PlannerQueen Storefront Dual Currency & Dynamic Catalog Hydration', () => {

  test('1. GET /dce/store serves valid HTML with dual-currency controls & price elements', async () => {
    const res = await request(app).get('/dce/store');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toContain('id="storeCurrencyToggleBtn"');
    expect(res.text).toContain('id="storeCurrencyFlag"');
    expect(res.text).toContain('id="storeCurrencyLabel"');
    expect(res.text).toContain('id="price-digital"');
    expect(res.text).toContain('id="price-physical"');
    expect(res.text).toContain('id="orig-price-digital"');
    expect(res.text).toContain('id="orig-price-physical"');
    expect(res.text).toContain('id="sumItemPrice"');
    expect(res.text).toContain('id="sumTotal"');
    expect(res.text).toContain('id="payBtn"');
  });

  test('2. GET /api/dce/products returns products with DIRECT SKUs and dual currency metadata', async () => {
    const res = await request(app).get('/api/dce/products');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);

    const allSkus = res.body.data.flatMap(p => p.skus || []);
    const directSkus = allSkus.filter(s => s.channel_code === 'DIRECT');
    expect(directSkus.length).toBeGreaterThanOrEqual(1);

    const directBundle = directSkus.find(s => s.sku && s.sku.includes('BUNDLE'));
    if (directBundle) {
      expect(directBundle.price).toBe(19.99);
      expect(directBundle.price_bdt).toBe(2400);
    }
  });

  test('3. POST /api/dce/promotions/validate calculates USD percentage discount', async () => {
    const res = await request(app)
      .post('/api/dce/promotions/validate')
      .send({
        code: 'VIP50',
        orderTotal: 19.99,
        currency: 'USD'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.valid).toBe(true);
    expect([9.99, 10.00]).toContain(res.body.data.discount_amount); // 50% of 19.99 rounded
    expect(res.body.data.currency).toBe('USD');
  });

  test('4. POST /api/dce/promotions/validate calculates BDT percentage & fixed discount accurately', async () => {
    // 50% discount on BDT 2,400 = 1,200 BDT
    const pctRes = await request(app)
      .post('/api/dce/promotions/validate')
      .send({
        code: 'VIP50',
        orderTotal: 2400,
        currency: 'BDT'
      });

    expect(pctRes.status).toBe(200);
    expect(pctRes.body.data.valid).toBe(true);
    expect(pctRes.body.data.discount_amount).toBe(1200);
    expect(pctRes.body.data.currency).toBe('BDT');

    // Fixed $5 discount on BDT 2,400 = 5 * 120 = 600 BDT
    const fixedRes = await request(app)
      .post('/api/dce/promotions/validate')
      .send({
        code: 'SAVE5NOW',
        orderTotal: 2400,
        currency: 'BDT'
      });

    expect(fixedRes.status).toBe(200);
    expect(fixedRes.body.data.valid).toBe(true);
    expect(fixedRes.body.data.discount_amount).toBe(600);
    expect(fixedRes.body.data.currency).toBe('BDT');
  });

  test('5. POST /api/dce/promotions/validate enforces spend thresholds in both USD and BDT', async () => {
    // SAVE5NOW requires $15 min spend in USD. $10 should fail.
    const failUsdRes = await request(app)
      .post('/api/dce/promotions/validate')
      .send({
        code: 'SAVE5NOW',
        orderTotal: 10,
        currency: 'USD'
      });

    expect(failUsdRes.status).toBe(200);
    expect(failUsdRes.body.data.valid).toBe(false);
    expect(failUsdRes.body.data.reason).toBe('MIN_SPEND_NOT_MET');

    // SAVE5NOW requires $15 * 120 = 1,800 BDT min spend in BDT. 1,000 BDT should fail.
    const failBdtRes = await request(app)
      .post('/api/dce/promotions/validate')
      .send({
        code: 'SAVE5NOW',
        orderTotal: 1000,
        currency: 'BDT'
      });

    expect(failBdtRes.status).toBe(200);
    expect(failBdtRes.body.data.valid).toBe(false);
    expect(failBdtRes.body.data.reason).toBe('MIN_SPEND_NOT_MET');
  });

  test('6. POST /api/dce/orders/checkout executes digital checkout in USD', async () => {
    const res = await request(app)
      .post('/api/dce/orders/checkout')
      .send({
        brandSlug: 'plannerqueen',
        skuId: 'sku-pq-dir-01',
        customer: {
          name: 'Jane Doe USD',
          email: 'jane.usd@example.com'
        },
        quantity: 1,
        paymentMethod: 'CARD',
        currency: 'USD'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.externalOrderId).toMatch(/^DIR-PQ-/);
    expect(res.body.data.totalAmount).toBe(19.99);
    expect(res.body.data.currency).toBe('USD');
    expect(res.body.data.accessUrl).toBeDefined();
    expect(res.body.data.trackingUrl).toContain('/dce/track?');
  });

  test('7. POST /api/dce/orders/checkout executes digital checkout in BDT (৳2,400)', async () => {
    const res = await request(app)
      .post('/api/dce/orders/checkout')
      .send({
        brandSlug: 'plannerqueen',
        skuId: 'sku-pq-dir-01',
        customer: {
          name: 'Rahim Khan BDT',
          email: 'rahim.bdt@example.com'
        },
        quantity: 1,
        paymentMethod: 'BKASH',
        currency: 'BDT'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.externalOrderId).toMatch(/^DIR-PQ-/);
    expect(res.body.data.totalAmount).toBe(2400);
    expect(res.body.data.currency).toBe('BDT');
    expect(res.body.data.accessUrl).toBeDefined();
  });

  test('8. POST /api/dce/orders/checkout with promo code applies discount in BDT', async () => {
    const res = await request(app)
      .post('/api/dce/orders/checkout')
      .send({
        brandSlug: 'plannerqueen',
        skuId: 'sku-pq-dir-01',
        customer: {
          name: 'Karim Discount BDT',
          email: 'karim.promo@example.com'
        },
        quantity: 1,
        paymentMethod: 'BKASH',
        promoCode: 'VIP50',
        currency: 'BDT'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.currency).toBe('BDT');
    // Base 2400 - 1200 discount = 1200 BDT
    expect(res.body.data.totalAmount).toBe(1200);
  });

  test('9. POST /api/dce/orders/checkout executes physical planner checkout in BDT (৳4,200)', async () => {
    const res = await request(app)
      .post('/api/dce/orders/checkout')
      .send({
        brandSlug: 'plannerqueen',
        skuId: 'sku-pq-phys-01',
        customer: {
          name: 'Nusrat Physical BDT',
          email: 'nusrat.phys@example.com',
          address: 'House 12, Road 4, Banani, Dhaka'
        },
        quantity: 1,
        paymentMethod: 'BKASH',
        currency: 'BDT'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalAmount).toBe(4200);
    expect(res.body.data.currency).toBe('BDT');
  });

  test('10. Chrome Extension QA Suite (portal-audits.js) includes dce_store currency toggle steps', () => {
    const suiteFilePath = path.join(__dirname, '../extension/gro10x-qa-runner/suites/portal-audits.js');
    expect(fs.existsSync(suiteFilePath)).toBe(true);

    const fileContent = fs.readFileSync(suiteFilePath, 'utf8');
    expect(fileContent).toContain('"dce_store"');
    expect(fileContent).toContain('#storeCurrencyToggleBtn');
    expect(fileContent).toContain('Toggle Currency to BDT Mode');
    expect(fileContent).toContain('Toggle Currency Back to USD Mode');
  });

});
