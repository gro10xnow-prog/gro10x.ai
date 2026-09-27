const request = require('supertest');
const app = require('../server');

describe('Universal Customer Portal & Credit Wallet Engine (Phase 2)', () => {
  let customerToken = '';
  const testEmail = `test.creator.${Date.now()}@plannerqueengro.com`;

  it('GET /my-portal should serve customer portal HTML', async () => {
    const res = await request(app).get('/my-portal').redirects(1);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toContain('PlannerQueenGro · Members Vault');
    expect(res.text).toContain('Universal Credit Wallet &amp; Ledger');
  });

  it('GET /delivery should serve Etsy delivery certificate HTML', async () => {
    const res = await request(app).get('/delivery').redirects(1);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toContain('Your Digital Planner Delivery Hub');
    expect(res.text).toContain('PLA14-DEMO-2026');
    expect(res.text).toContain('Complete 16-Page Vector PDF (300 DPI)');
  });

  it('POST /api/portal/activate should reject requests without a valid email', async () => {
    const res = await request(app)
      .post('/api/portal/activate')
      .send({ code: 'PLA14-DEMO-2026', email: 'not-an-email' });
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  it('POST /api/portal/activate should provision customer and seed 200 GroCredits', async () => {
    const res = await request(app)
      .post('/api/portal/activate')
      .send({
        code: 'PLA14-DEMO-2026',
        email: testEmail,
        name: 'Test Creator'
      });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.wallet.balance).toBe(200);
    expect(res.body.customer.unlockedSkus).toContain('PLA-14');

    customerToken = res.body.token;
  });

  it('GET /api/portal/me should require authentication (401)', async () => {
    const res = await request(app).get('/api/portal/me');
    expect(res.status).toBe(401);
  });

  it('GET /api/portal/me should return customer profile and wallet with valid Bearer token', async () => {
    const res = await request(app)
      .get('/api/portal/me')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.customer.email).toBe(testEmail);
    expect(res.body.wallet.balance).toBe(200);
    expect(Array.isArray(res.body.products)).toBe(true);
    expect(res.body.products.length).toBeGreaterThanOrEqual(2);
  });

  it('POST /api/portal/ai-assist should consume 10 GroCredits and deliver daily focus briefing', async () => {
    const res = await request(app)
      .post('/api/portal/ai-assist')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        date: '2026-09-12',
        intention: 'Deep creative focus and systematic progress',
        priorities: ['Finish Phase 2 implementation', 'Verify automated tests'],
        energy: 5
      });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.coaching).toBeDefined();
    expect(res.body.deducted).toBe(10);
    expect(res.body.newBalance).toBe(190);
  }, 25000);

  it('PUT & GET /api/portal/sync-state should persist and retrieve planner cloud state', async () => {
    const sampleState = {
      owner_name: 'Elena Vance',
      week_goal_1: 'Etsy Launch'
    };

    const putRes = await request(app)
      .put('/api/portal/sync-state')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        sku: 'PLA-14',
        plannerData: sampleState
      });
    expect(putRes.status).toBe(200);
    expect(putRes.body.ok).toBe(true);

    const getRes = await request(app)
      .get('/api/portal/sync-state?sku=PLA-14')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.ok).toBe(true);
    expect(getRes.body.data.owner_name).toBe('Elena Vance');
  });
});
