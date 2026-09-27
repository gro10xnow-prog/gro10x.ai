/**
 * tests/chrome-extensions-scout.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Verification test suite for:
 * 1. GET /api/brands/extensions (Registry of extensions)
 * 2. GET /api/brands/product-suggestions (Inspiration queue)
 * 3. POST /api/brands/product-suggestions (Product Scout ingestion)
 * ─────────────────────────────────────────────────────────────────────────────
 */

const request = require('supertest');
const app = require('../server');

describe('Chrome Extensions Registry & Product Scout Pipeline', () => {

  test('GET /api/brands/extensions returns 3 registered extensions', async () => {
    const res = await request(app).get('/api/brands/extensions');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.extensions)).toBe(true);
    expect(res.body.extensions.length).toBeGreaterThanOrEqual(3);

    const slugs = res.body.extensions.map(e => e.slug);
    expect(slugs).toContain('gro10x-dbm-copilot');
    expect(slugs).toContain('gro10x-qa-runner');
    expect(slugs).toContain('gro10x-product-scout');
  });

  test('GET /api/brands/product-suggestions returns list array', async () => {
    const res = await request(app).get('/api/brands/product-suggestions');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.suggestions)).toBe(true);
  });

  test('POST /api/brands/product-suggestions ingests scraped product metadata', async () => {
    const testProduct = {
      url: 'https://www.etsy.com/listing/987654321/boho-minimalist-wall-art-bundle',
      domain: 'etsy.com',
      product_title: 'Boho Minimalist Wall Art Bundle - 50 Printables',
      price: '$14.99',
      currency: 'USD',
      description: 'Instant download high-resolution 300 DPI boho minimalist art prints.',
      image_urls: ['https://i.etsystatic.com/mock/sample.jpg'],
      reviews_count: 342,
      star_rating: 4.9,
      tags: ['wall art', 'boho', 'printables', 'minimalist'],
      seller_name: 'NordicPrintHouse',
      product_type: 'digital',
      captured_by: 'Test DBM Engineer'
    };

    const res = await request(app)
      .post('/api/brands/product-suggestions')
      .send(testProduct);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.suggestion).toBeDefined();
    expect(res.body.suggestion.product_title).toBe(testProduct.product_title);
    expect(res.body.suggestion.domain).toBe('etsy.com');
    expect(res.body.suggestion.product_type).toBe('digital');
    expect(res.body.suggestion.price).toBe('$14.99');
  });

  test('POST /api/brands/product-suggestions/:id/ai-analyze generates adapted SEO package', async () => {
    // 1. Create a test suggestion
    const createRes = await request(app)
      .post('/api/brands/product-suggestions')
      .send({
        url: 'https://www.etsy.com/listing/1122334455/executive-client-proposal-template',
        domain: 'etsy.com',
        product_title: 'Executive Client Proposal Deck & Contract Template',
        price: '$19.00',
        tags: ['proposal', 'b2b', 'agency', 'contract'],
        seller_name: 'AgencyStudio'
      });

    expect(createRes.status).toBe(200);
    const suggId = createRes.body.suggestion.id;

    // 2. Call AI Analyze
    const aiRes = await request(app)
      .post(`/api/brands/product-suggestions/${suggId}/ai-analyze`)
      .send({ brandId: 3 }); // TinyDesks Studio

    expect(aiRes.status).toBe(200);
    expect(aiRes.body.success).toBe(true);
    expect(aiRes.body.analysis).toBeDefined();
    expect(aiRes.body.analysis.adaptedTitle).toBeDefined();
    expect(Array.isArray(aiRes.body.analysis.tags)).toBe(true);
    expect(aiRes.body.analysis.tags.length).toBeLessThanOrEqual(13);
    expect(aiRes.body.analysis.description).toBeDefined();
    expect(aiRes.body.analysis.blueprint).toBeDefined();
  });

  test('POST /api/brands/product-suggestions/:id/promote adds product directly into Brand Catalog', async () => {
    // 1. Ingest suggestion
    const createRes = await request(app)
      .post('/api/brands/product-suggestions')
      .send({
        url: 'https://www.etsy.com/listing/5544332211/modern-habit-matrix-planner',
        domain: 'etsy.com',
        product_title: 'Modern Habit Matrix Daily Life Planner',
        price: '$8.50',
        tags: ['planner', 'habits', 'life planning'],
        seller_name: 'LifeDesignPro'
      });

    const suggId = createRes.body.suggestion.id;

    // 2. Promote to Brand 1 (PlannerQueenGro)
    const promoteRes = await request(app)
      .post(`/api/brands/product-suggestions/${suggId}/promote`)
      .send({ brandId: 1 });

    expect(promoteRes.status).toBe(200);
    expect(promoteRes.body.success).toBe(true);
    expect(promoteRes.body.product).toBeDefined();
    expect(promoteRes.body.product.code).toMatch(/^PLA-\d+/);
    expect(promoteRes.body.product.sourceSuggestionId).toBe(suggId);
    expect(promoteRes.body.product.status).toBe('SEO Ready');
    expect(promoteRes.body.brand.id).toBe(1);
    expect(promoteRes.body.brand.name).toBe('PlannerQueenGro');
  });
});
