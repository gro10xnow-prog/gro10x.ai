/**
 * tests/subphase_3_3_reviews_isolation.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Sub-Phase 3.3: Reviews Cross-Client Data Leak Prevention & Error Scoping
 * ─────────────────────────────────────────────────────────────────────────────
 * Verifies:
 * 1. GET /api/reviews returns isolated empty array for client with no reviews
 * 2. Client A cannot see Client B's reviews under normal and fallback scenarios
 * 3. Client A cannot access Client B's review via GET /api/reviews/:id (403 Forbidden)
 * 4. Hardcoded seed data (Chillox TVC) is completely absent
 */

const request = require('supertest');
const app = require('../server');
const { signToken } = require('../src/services/jwt');
const { fallbackReviews } = require('../src/routes/reviews');

describe('Sub-Phase 3.3: Reviews Isolation & Cross-Client Data Leak Prevention', () => {
  const clientAToken = signToken({
    userId: 'CLI-ALPHA-01',
    id: 'CLI-ALPHA-01',
    name: 'Alpha Enterprise',
    company: 'Alpha Enterprise',
    role: 'Client Partner',
    accessLevel: 'Client Partner',
    linkedType: 'client',
    linkedId: 'CLI-ALPHA-01'
  });

  const clientBToken = signToken({
    userId: 'CLI-BETA-02',
    id: 'CLI-BETA-02',
    name: 'Beta Global',
    company: 'Beta Global',
    role: 'Client Partner',
    accessLevel: 'Client Partner',
    linkedType: 'client',
    linkedId: 'CLI-BETA-02'
  });

  const adminToken = signToken({
    userId: 'EMP-MD-001',
    name: 'Mehedi Bin Jayed',
    role: 'Managing Director',
    accessLevel: 'Owner / Admin',
    department: 'Executive',
    linkedType: 'team'
  });

  const testReviewB = {
    id: 'REV-BETA-SECRET-01',
    project_id: 'PRJ-BETA-01',
    project_name: 'Beta Confidential AI Model Cut',
    client: 'Beta Global',
    client_id: 'CLI-BETA-02',
    active_version: 'v1',
    versions: ['v1'],
    media_type: 'video',
    media_url: 'https://cdn.example.com/beta-cut.mp4',
    created_at: new Date().toISOString()
  };

  beforeAll(() => {
    // Insert test review for Client B into fallback memory store
    fallbackReviews.push(testReviewB);
  });

  afterAll(() => {
    // Clean up test review
    const idx = fallbackReviews.findIndex(r => r.id === testReviewB.id);
    if (idx !== -1) fallbackReviews.splice(idx, 1);
  });

  test('1. Verify Chillox hardcoded seed data is completely absent', async () => {
    const res = await request(app)
      .get('/api/reviews')
      .set('Authorization', `Bearer ${clientAToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    const chilloxReview = res.body.find(r => (r.client || '').includes('Chillox') || r.id === 'REV-SAMPLE01');
    expect(chilloxReview).toBeUndefined();
  });

  test('2. Client A querying GET /api/reviews does NOT receive Client B reviews', async () => {
    const res = await request(app)
      .get('/api/reviews')
      .set('Authorization', `Bearer ${clientAToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    const leakedReview = res.body.find(r => r.id === testReviewB.id || r.client === 'Beta Global');
    expect(leakedReview).toBeUndefined();
  });

  test('3. Client B querying GET /api/reviews receives their own review', async () => {
    const res = await request(app)
      .get('/api/reviews')
      .set('Authorization', `Bearer ${clientBToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    const myReview = res.body.find(r => r.id === testReviewB.id);
    expect(myReview).toBeDefined();
    expect(myReview.projectName).toBe(testReviewB.project_name);
  });

  test('4. Client A requesting Client B review via GET /api/reviews/:id returns 403 Forbidden', async () => {
    const res = await request(app)
      .get(`/api/reviews/${testReviewB.id}`)
      .set('Authorization', `Bearer ${clientAToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.error).toContain('Forbidden');
  });

  test('5. Admin requesting GET /api/reviews/:id receives review without 403', async () => {
    const res = await request(app)
      .get(`/api/reviews/${testReviewB.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe(testReviewB.id);
  });
});
