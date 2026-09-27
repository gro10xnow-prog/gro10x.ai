const request = require('supertest');
const app = require('../server');

describe('Interactive Digital Planner & Micro-Product Engine (Phase 1)', () => {
  it('GET /planner should return 200 (following trailing slash redirect) and serve HTML', async () => {
    const res = await request(app).get('/planner').redirects(1);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toContain('PlannerQueenGro');
    expect(res.text).toContain('Daily &amp; Weekly Planners #1');
    expect(res.text).toContain('spread-viewport');
    expect(res.text).toContain('habitTable');
  });

  it('GET /planner/ should also return 200', async () => {
    const res = await request(app).get('/planner/');
    expect([200, 301]).toContain(res.status);
  });

  it('GET /planner/theme.css should return 200 with design system tokens', async () => {
    const res = await request(app).get('/planner/theme.css');
    expect(res.status).toBe(200);
    expect(res.text).toContain('--primary-plum: #8B5A7A');
    expect(res.text).toContain('--bg-canvas: #FAF3E8');
  });

  it('GET /planner/planner.js should return 200 with reactive engine', async () => {
    const res = await request(app).get('/planner/planner.js');
    expect(res.status).toBe(200);
    expect(res.text).toContain('calculateHabitMetrics');
    expect(res.text).toContain('recalculateFinances');
  });

  it('GET /planner/planner.css should return 200 with print styles', async () => {
    const res = await request(app).get('/planner/planner.css');
    expect(res.status).toBe(200);
    expect(res.text).toContain('@media print');
    expect(res.text).toContain('break-before: page');
  });
});
