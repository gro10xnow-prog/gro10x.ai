/**
 * Sub-Phase 6.2 Integration Test Suite: Traffic Sentinel & Product Scout Extensions Audit
 * ─────────────────────────────────────────────────────────────────────────────
 * Validates:
 * 1. Extension Manifest V3 integrity for Traffic Sentinel and Product Scout.
 * 2. Background service worker message listener & script structure.
 * 3. Backend Ingest API /api/traffic (status check, validation, deduplication).
 * 4. Backend Ingest API /api/brands/product-suggestions (GET listing and POST creation).
 */

const fs = require('fs');
const path = require('path');
const request = require('supertest');
const app = require('../server');
const { signToken } = require('../src/services/jwt');

describe('Sub-Phase 6.2: Traffic Sentinel & Product Scout Extensions Audit', () => {
  const rootDir = path.resolve(__dirname, '..');
  const sentinelDir = path.join(rootDir, 'extension', 'gro10x-traffic-sentinel');
  const scoutDir = path.join(rootDir, 'extension', 'gro10x-product-scout');

  describe('1. Manifest V3 & Extension Structural Completeness', () => {
    test('Traffic Sentinel manifest conforms to Manifest V3 spec', () => {
      const manifestPath = path.join(sentinelDir, 'manifest.json');
      expect(fs.existsSync(manifestPath)).toBe(true);

      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      expect(manifest.manifest_version).toBe(3);
      expect(manifest.name).toContain('Traffic Sentinel');
      expect(manifest.permissions).toContain('sidePanel');
      expect(manifest.permissions).toContain('storage');
      expect(manifest.background?.service_worker).toBe('service-worker.js');

      // Verify referenced files exist
      expect(fs.existsSync(path.join(sentinelDir, manifest.background.service_worker))).toBe(true);
      expect(fs.existsSync(path.join(sentinelDir, manifest.side_panel.default_path))).toBe(true);
      expect(fs.existsSync(path.join(sentinelDir, manifest.content_scripts[0].js[0]))).toBe(true);
    });

    test('Product Scout manifest conforms to Manifest V3 spec', () => {
      const manifestPath = path.join(scoutDir, 'manifest.json');
      expect(fs.existsSync(manifestPath)).toBe(true);

      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      expect(manifest.manifest_version).toBe(3);
      expect(manifest.name).toContain('Product Scout');
      expect(manifest.permissions).toContain('sidePanel');
      expect(manifest.permissions).toContain('storage');
      expect(manifest.background?.service_worker).toBe('service-worker.js');

      // Verify referenced files exist
      expect(fs.existsSync(path.join(scoutDir, manifest.background.service_worker))).toBe(true);
      expect(fs.existsSync(path.join(scoutDir, manifest.side_panel.default_path))).toBe(true);
      expect(fs.existsSync(path.join(scoutDir, manifest.content_scripts[0].js[0]))).toBe(true);
    });
  });

  describe('2. Service Worker & Content Script Protocol Definitions', () => {
    test('Traffic Sentinel service worker registers message and alarm listeners', () => {
      const workerCode = fs.readFileSync(path.join(sentinelDir, 'service-worker.js'), 'utf8');
      expect(workerCode).toContain('chrome.alarms.onAlarm');
      expect(workerCode).toContain('DISPATCH_POST_TO_BACKEND');
      expect(workerCode).toContain('PING_TELEGRAM_BOT');
      expect(workerCode).toContain('handleBackendDispatch');
    });

    test('Product Scout service worker handles capture visible tab and active tab messages', () => {
      const workerCode = fs.readFileSync(path.join(scoutDir, 'service-worker.js'), 'utf8');
      expect(workerCode).toContain('CAPTURE_VISIBLE_TAB');
      expect(workerCode).toContain('GET_ACTIVE_TAB');
      expect(workerCode).toContain('captureVisibleTab');
    });
  });

  describe('3. Backend Ingest API: /api/traffic', () => {
    const apiKey = process.env.API_SECRET_KEY || 'traffic_sec_gro10x_2026';

    test('GET /api/traffic/status returns online status and telemetry flags', async () => {
      const res = await request(app)
        .get('/api/traffic/status')
        .expect(200);

      expect(res.body.status).toBe('online');
      expect(res.body.service).toBe('GRO10X Traffic Sentinel API');
      expect(typeof res.body.hasGeminiKey).toBe('boolean');
      expect(res.body.timestamp).toBeDefined();
    });

    test('POST /api/traffic rejects request with invalid or missing x-api-key', async () => {
      const res = await request(app)
        .post('/api/traffic')
        .set('x-api-key', 'invalid_key_attempt')
        .send({
          postId: 'test-unauth',
          text: 'Accident reported on Dhaka Mawa Expressway.'
        })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/unauthorized/i);
    });

    test('POST /api/traffic rejects text shorter than 10 characters', async () => {
      const res = await request(app)
        .post('/api/traffic')
        .set('x-api-key', apiKey)
        .send({
          postId: 'test-short',
          text: 'Short'
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/at least 10 characters/i);
    });

    test('POST /api/traffic ingests valid report and deduplicates subsequent dispatches', async () => {
      const uniquePostId = `fb-post-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const payload = {
        postId: uniquePostId,
        text: 'Heavy traffic congestion reported on Airport Road near Banani flyover heading towards Mohakhali.',
        postUrl: 'https://facebook.com/groups/traffic/posts/12345',
        author: 'Dhaka Commuter'
      };

      const firstRes = await request(app)
        .post('/api/traffic')
        .set('x-api-key', apiKey)
        .send(payload)
        .expect(200);

      expect(firstRes.body.success).toBe(true);
      expect(firstRes.body.postId).toBe(uniquePostId);

      // Second request with same postId should trigger deduplication
      const dupRes = await request(app)
        .post('/api/traffic')
        .set('x-api-key', apiKey)
        .send(payload)
        .expect(200);

      expect(dupRes.body.success).toBe(true);
      expect(dupRes.body.duplicate).toBe(true);
      expect(dupRes.body.filtered).toBe(true);
    });
  });

  describe('4. Backend Ingest API: /api/brands/product-suggestions', () => {
    const adminToken = signToken({
      userId: 'ADM-SCOUT-01',
      name: 'Ecom Scout Specialist',
      role: 'DBM Specialist',
      accessLevel: 'Technology Admin',
      department: 'Brand Operations'
    });

    test('GET /api/brands/product-suggestions returns suggestion listing', async () => {
      const res = await request(app)
        .get('/api/brands/product-suggestions')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.suggestions)).toBe(true);
    });

    test('POST /api/brands/product-suggestions saves product inspiration', async () => {
      const payload = {
        url: 'https://etsy.com/listing/987654321/digital-planner-2026',
        domain: 'etsy.com',
        product_title: '2026 Minimalist Daily Planner Printable PDF',
        price: '14.99',
        currency: 'USD',
        description: 'Comprehensive 400-page digital hyperlinked planner for GoodNotes and Notability.',
        image_urls: ['https://example.com/planner.jpg'],
        reviews_count: 240,
        star_rating: 4.9,
        tags: ['planner', 'digital', 'pdf'],
        seller_name: 'StudioPlanCo',
        product_type: 'Digital Download',
        captured_by: 'Product Scout Ext'
      };

      const res = await request(app)
        .post('/api/brands/product-suggestions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.suggestion).toBeDefined();
      expect(res.body.suggestion.product_title).toBe('2026 Minimalist Daily Planner Printable PDF');
    });
  });
});
