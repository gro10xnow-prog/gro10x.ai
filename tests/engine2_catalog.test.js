/**
 * tests/engine2_catalog.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Comprehensive Test Suite for Engine 2 (AI Service Agency)
 * Validates:
 * 1. All 26 canonical services + Sprint 01 presence in catalog.
 * 2. Exact category distribution across 6 Engine 2 categories.
 * 3. Complete 5-Pillar Authority Proof Pack (Spotify, YouTube, Slides, Blueprint, Case Study).
 * 4. Multi-channel SKU resolution:
 *    - Fiverr Pro 3-tier matrix (Basic, Standard, Premium) & search tags.
 *    - Upwork Project Catalog deliverables & turnaround.
 *    - Direct Wire enterprise SOW milestone payment schedule.
 * 5. Deterministic canonical SKU resolution (GRO-E2-SME-GWT-SVC001-FIV).
 * ─────────────────────────────────────────────────────────────────────────────
 */

const request = require('supertest');
const app = require('../server');
const {
  getProducts,
  getServiceByCode,
  resolveSku,
  FALLBACK_CATALOG
} = require('../src/services/taxonomy');

describe('Engine 2 (AI Service Agency) Deep Dive Catalog Tests', () => {

  // ───────────────────────────────────────────────────────────────────────────
  // 1. Inventory Volume & Integrity
  // ───────────────────────────────────────────────────────────────────────────
  describe('1. Inventory & Category Distribution', () => {

    test('should contain exactly 27 products for Engine 2 (Sprint 01 + 26 Services)', async () => {
      const e2Products = await getProducts({ brandId: 'b-gro10x-growth' });
      expect(e2Products).toBeDefined();
      expect(e2Products.length).toBe(27);

      const codes = e2Products.map(p => p.product_code);
      expect(codes).toContain('SPRINT-01');
      for (let i = 1; i <= 26; i++) {
        const svcId = `SVC-${String(i).padStart(3, '0')}`;
        expect(codes).toContain(svcId);
      }
    });

    test('should assign services accurately to the 6 Engine 2 categories', async () => {
      const mobileWeb = await getProducts({ categoryId: 'cat-e2-mobile-web' });
      const automation = await getProducts({ categoryId: 'cat-e2-automation' });
      const agents = await getProducts({ categoryId: 'cat-e2-agents' });
      const dataVision = await getProducts({ categoryId: 'cat-e2-data-vision' });
      const advisory = await getProducts({ categoryId: 'cat-e2-advisory' });
      const sprints = await getProducts({ categoryId: 'cat-e2-sprints' });

      // Sprints: SPRINT-01
      expect(sprints.length).toBe(1);
      expect(sprints[0].product_code).toBe('SPRINT-01');

      // Mobile & Web Apps: SVC-001 to SVC-007 + SVC-025 = 8 products
      expect(mobileWeb.length).toBe(8);
      const mwCodes = mobileWeb.map(p => p.product_code);
      expect(mwCodes).toContain('SVC-001');
      expect(mwCodes).toContain('SVC-007');
      expect(mwCodes).toContain('SVC-025');

      // AI Automation & Workflows: SVC-008 to SVC-013 = 6 products
      expect(automation.length).toBe(6);
      const autoCodes = automation.map(p => p.product_code);
      expect(autoCodes).toContain('SVC-008');
      expect(autoCodes).toContain('SVC-013');

      // Autonomous Agents: SVC-014 to SVC-018 = 5 products
      expect(agents.length).toBe(5);
      const agentCodes = agents.map(p => p.product_code);
      expect(agentCodes).toContain('SVC-014');
      expect(agentCodes).toContain('SVC-018');

      // Data, AI Vision & Voice: SVC-019 to SVC-022 = 4 products
      expect(dataVision.length).toBe(4);
      const dvCodes = dataVision.map(p => p.product_code);
      expect(dvCodes).toContain('SVC-019');
      expect(dvCodes).toContain('SVC-022');

      // Advisory, Audit & MLOps: SVC-023, SVC-024, SVC-026 = 3 products
      expect(advisory.length).toBe(3);
      const advCodes = advisory.map(p => p.product_code);
      expect(advCodes).toContain('SVC-023');
      expect(advCodes).toContain('SVC-024');
      expect(advCodes).toContain('SVC-026');

      // Total sum: 1 + 8 + 6 + 5 + 4 + 3 = 27
      expect(sprints.length + mobileWeb.length + automation.length + agents.length + dataVision.length + advisory.length).toBe(27);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2. 5-Pillar Authority Proof Pack Validation
  // ───────────────────────────────────────────────────────────────────────────
  describe('2. 5-Pillar Authority Proof Pack Verification', () => {

    test('Sprint 01 should have all 5 proof pillars complete with working assets', async () => {
      const sprint = await getServiceByCode('SPRINT-01');
      expect(sprint).toBeDefined();
      expect(sprint.name).toBe('Sprint 01: Idea to Reality (14-Day MVP)');
      
      const proof = sprint.metadata.proof_pack;
      expect(proof).toBeDefined();
      expect(proof.audio_overview_url).toMatch(/^https:\/\/open\.spotify\.com\/episode\//);
      expect(proof.video_url).toMatch(/^https:\/\/youtu\.be\//);
      expect(proof.slides_pdf_url).toMatch(/\.pdf$/);
      expect(proof.blueprint_url).toMatch(/\.pdf$/);
      expect(proof.case_study_title).toBeDefined();
      expect(proof.case_study_title.length).toBeGreaterThan(20);
    });

    test('all 26 canonical services must have a fully populated 5-pillar proof pack', async () => {
      for (let i = 1; i <= 26; i++) {
        const code = `SVC-${String(i).padStart(3, '0')}`;
        const svc = await getServiceByCode(code);
        
        expect(svc).toBeDefined();
        expect(svc.product_code).toBe(code);
        
        const proof = svc.metadata?.proof_pack;
        expect(proof).toBeDefined();

        // 1. Audio podcast overview (Spotify)
        expect(proof.audio_overview_url).toBeDefined();
        expect(proof.audio_overview_url).toContain('open.spotify.com');

        // 2. Architecture video breakdown (YouTube)
        expect(proof.video_url).toBeDefined();
        expect(proof.video_url).toContain('youtu.be');

        // 3. Slides PDF
        expect(proof.slides_pdf_url).toBeDefined();
        expect(proof.slides_pdf_url).toMatch(/\.pdf$/);

        // 4. Blueprint diagram PDF
        expect(proof.blueprint_url).toBeDefined();
        expect(proof.blueprint_url).toMatch(/\.pdf$/);

        // 5. Case study headline
        expect(proof.case_study_title).toBeDefined();
        expect(typeof proof.case_study_title).toBe('string');
        expect(proof.case_study_title.length).toBeGreaterThan(15);
      }
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3. Multi-Channel SKU Resolution & Schema Integrity
  // ───────────────────────────────────────────────────────────────────────────
  describe('3. Multi-Channel SKU Payloads', () => {

    test('should resolve Fiverr Pro SKU with 3-tier matrix and tags for SVC-001', async () => {
      const sku = await resolveSku('GRO-E2-SME-GWT-SVC001-FIV');
      expect(sku).toBeDefined();
      expect(sku.channel).toBe('FIVERR');
      expect(sku.price_usd).toBeGreaterThan(0);

      const payload = sku.channel_payload;
      expect(payload).toBeDefined();
      expect(payload.gig_title).toMatch(/^I will /);
      expect(Array.isArray(payload.tags)).toBe(true);
      expect(payload.tags.length).toBeLessThanOrEqual(5);

      // Verify 3-tier pricing matrix
      expect(payload.tiers).toBeDefined();
      expect(payload.tiers.basic).toBeDefined();
      expect(payload.tiers.standard).toBeDefined();
      expect(payload.tiers.premium).toBeDefined();

      expect(payload.tiers.basic.price).toBeLessThan(payload.tiers.standard.price);
      expect(payload.tiers.standard.price).toBeLessThan(payload.tiers.premium.price);
    });

    test('should resolve Upwork Catalog SKU with project deliverables for SVC-001', async () => {
      const sku = await resolveSku('GRO-E2-SME-GWT-SVC001-UPW');
      expect(sku).toBeDefined();
      expect(sku.channel).toBe('UPWORK');
      expect(sku.channel_payload).toBeDefined();
      expect(sku.channel_payload.outcome_title).toMatch(/^You will get /);
      expect(sku.channel_payload.delivery_time).toBeDefined();
      expect(Array.isArray(sku.channel_payload.key_deliverables)).toBe(true);
      expect(sku.channel_payload.key_deliverables.length).toBeGreaterThan(0);
    });

    test('should resolve Direct Wire SKU with SOW milestone schedule for Sprint 01', async () => {
      const sku = await resolveSku('GRO-E2-SME-GWT-SPRINT01-DIR');
      expect(sku).toBeDefined();
      expect(sku.channel).toBe('DIRECT_WIRE');
      expect(sku.price_usd).toBe(3000);
      expect(sku.price_bdt).toBe(350000);

      const payload = sku.channel_payload;
      expect(payload).toBeDefined();
      expect(payload.sow_type).toBe('FIXED_SPRINT');
      expect(Array.isArray(payload.milestones)).toBe(true);
      expect(payload.milestones[0].percent).toBe(50);
      expect(payload.milestones[1].percent).toBe(50);
      expect(payload.warranty_days).toBe(30);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4. API Endpoints Integration
  // ───────────────────────────────────────────────────────────────────────────
  describe('4. API Catalog Endpoints for Engine 2', () => {

    test('GET /api/catalog/products/SVC-001 should return service with skus and proof pack', async () => {
      const res = await request(app).get('/api/catalog/products/SVC-001');
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.product_code).toBe('SVC-001');
      expect(res.body.data.metadata.proof_pack).toBeDefined();
      expect(res.body.data.skus).toBeDefined();
      expect(res.body.data.skus.length).toBeGreaterThanOrEqual(3);
    });

    test('GET /api/catalog/products/SPRINT-01 should return Sprint 01 data', async () => {
      const res = await request(app).get('/api/catalog/products/SPRINT-01');
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.product_code).toBe('SPRINT-01');
      expect(res.body.data.metadata.proof_pack.audio_overview_url).toContain('open.spotify.com');
    });

    test('GET /api/catalog/skus/GRO-E2-SME-GWT-SVC001-FIV should return resolved SKU', async () => {
      const res = await request(app).get('/api/catalog/skus/GRO-E2-SME-GWT-SVC001-FIV');
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.sku_code).toBe('GRO-E2-SME-GWT-SVC001-FIV');
      expect(res.body.data.channel).toBe('FIVERR');
    });
  });

});
