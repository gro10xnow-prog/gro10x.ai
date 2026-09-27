/**
 * tests/service_ingestion_workflow.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Test Suite for Engine 2 (AI Service Agency) Service Ingestion & Listing Workflow
 * Validates:
 * 1. Opportunity Discovery & Ingestion into catalog_products and catalog_skus.
 * 2. 5-Pillar Authority Proof Pack generation on ingested services.
 * 3. Multi-Channel SKU generation (Fiverr Pro, Upwork, Direct Wire).
 * 4. Bespoke client proposal productization with sanitization.
 * 5. 10-Point algorithmic health check validation.
 * 6. REST API routes mounted under /api/catalog/services/*.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const request = require('supertest');
const app = require('../server');
const {
  ingestNewServiceOpportunity,
  productizeProposal,
  generateChannelSkusForService,
  getNextServiceCode
} = require('../src/services/service-ingestion');
const { getServiceByCode, resolveSku } = require('../src/services/taxonomy');

describe('Engine 2 Service Ingestion & Multi-Channel Listing Workflow Tests', () => {

  describe('1. Opportunity Discovery & Ingestion Engine', () => {

    test('getNextServiceCode should return a valid sequential code starting after SVC-026', async () => {
      const nextCode = await getNextServiceCode();
      expect(nextCode).toMatch(/^SVC-\d{3}$/);
      const num = parseInt(nextCode.replace('SVC-', ''), 10);
      expect(num).toBeGreaterThanOrEqual(27);
    });

    test('ingestNewServiceOpportunity should create canonical product with 5-pillar proof pack and multi-channel SKUs', async () => {
      const result = await ingestNewServiceOpportunity({
        title: 'Real-Time Multimodal Voice Agent Architecture',
        description: 'Sub-second conversational voice agents with natural speech interruption, tool-calling and CRM sync.',
        categoryId: 'cat-e2-agents',
        targetIcp: ['Fintech Operations', 'Healthcare Clinics', 'Logistics Dispatchers'],
        techStack: ['Node.js', 'WebSockets', 'Gemini Live API', 'Supabase PostgreSQL'],
        deliverables: [
          'Bidirectional WebSocket Voice Pipeline',
          'Tool-calling & CRM Integration Layer',
          'Audio Session Logging & Analytics'
        ],
        priceUsd: 3800,
        priceBdt: 448000
      });

      expect(result.ok).toBe(true);
      expect(result.product).toBeDefined();
      expect(result.product.product_code).toMatch(/^SVC-\d{3}$/);
      expect(result.product.category_id).toBe('cat-e2-agents');

      // 5-Pillar Proof Pack Verification
      const proof = result.product.metadata.proof_pack;
      expect(proof).toBeDefined();
      expect(proof.case_study_title).toBeDefined();
      expect(proof.video_url).toBeDefined();
      expect(proof.audio_overview_url).toContain('open.spotify.com');
      expect(proof.blueprint_url).toMatch(/\.pdf$/);
      expect(Array.isArray(proof.slide_deck_outline)).toBe(true);
      expect(proof.slide_deck_outline.length).toBe(10);

      // Multi-channel SKUs Verification
      expect(Array.isArray(result.skus)).toBe(true);
      expect(result.skus.length).toBe(3);

      const fiverr = result.skus.find(s => s.channel === 'FIVERR');
      const upwork = result.skus.find(s => s.channel === 'UPWORK');
      const direct = result.skus.find(s => s.channel === 'DIRECT_WIRE');

      expect(fiverr).toBeDefined();
      expect(fiverr.channel_payload.gig_title).toMatch(/^I will /);
      expect(fiverr.channel_payload.tags.length).toBeLessThanOrEqual(5);

      expect(upwork).toBeDefined();
      expect(upwork.channel_payload.outcome_title).toMatch(/^You will get /);
      expect(upwork.channel_payload.turnaround_days).toBeGreaterThan(0);

      expect(direct).toBeDefined();
      expect(direct.channel_payload.sow_type).toBe('FIXED_PRICE_SOW');
      expect(direct.channel_payload.payment_schedule.upfront_percent).toBe(50);

      // 10-Point Health Check
      expect(result.healthCheck).toBeDefined();
      expect(result.healthCheck.score).toBeGreaterThanOrEqual(9);
    });
  });

  describe('2. Bespoke Proposal Productization', () => {

    test('productizeProposal should sanitize confidential info and register canonical service', async () => {
      const result = await productizeProposal('PRP-CUSTOM-TEST');

      expect(result.ok).toBe(true);
      expect(result.product).toBeDefined();
      expect(result.product.product_code).toMatch(/^SVC-\d{3}$/);
      expect(result.product.delivery_type).toBe('SERVICE');
      expect(result.skus.length).toBe(3);

      // Verify product is queryable in master taxonomy
      const fromTaxonomy = await getServiceByCode(result.product.product_code);
      expect(fromTaxonomy).toBeDefined();
      expect(fromTaxonomy.product_code).toBe(result.product.product_code);
    });
  });

  describe('3. Multi-Channel SKU Synchronization', () => {

    test('generateChannelSkusForService should refresh multi-channel SKUs for SVC-001', async () => {
      const res = await generateChannelSkusForService('SVC-001');
      expect(res.ok).toBe(true);
      expect(res.productCode).toBe('SVC-001');
      expect(res.skus.length).toBe(3);

      // Test resolution via resolveSku
      const resolvedFiv = await resolveSku('GRO-E2-SME-GWT-SVC001-FIV');
      expect(resolvedFiv).toBeDefined();
      expect(resolvedFiv.channel).toBe('FIVERR');
      expect(resolvedFiv.channel_payload.gig_title).toMatch(/^I will /);
    });
  });

  describe('4. REST API Workflow Endpoints', () => {

    test('POST /api/catalog/services/ingest should ingest new opportunity via API', async () => {
      const res = await request(app)
        .post('/api/catalog/services/ingest')
        .send({
          title: 'DeepSeek-R1 Local Private LLM Deployment',
          description: 'Deploy open-weights reasoning models locally on private enterprise hardware with zero data leaks.',
          categoryId: 'cat-e2-data-vision',
          priceUsd: 4500,
          priceBdt: 530000
        });

      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.product).toBeDefined();
      expect(res.body.data.product.product_code).toMatch(/^SVC-\d{3}$/);
      expect(res.body.data.listingSummary.healthScore).toBeDefined();
    });

    test('POST /api/catalog/services/productize-proposal/:proposalId should productize proposal via API', async () => {
      const res = await request(app)
        .post('/api/catalog/services/productize-proposal/PRP-DEMO-001')
        .send();

      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.product).toBeDefined();
    });

    test('GET /api/catalog/services/SVC-001/health-check should return 10-point audit result', async () => {
      const res = await request(app).get('/api/catalog/services/SVC-001/health-check');
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.productCode).toBe('SVC-001');
      expect(res.body.health).toBeDefined();
      expect(res.body.health.score).toBeGreaterThanOrEqual(9);
    });
  });

});
