/**
 * tests/workload.test.js
 * Verification test for Version 0.6.2 & 0.6.3 Resource Allocation & Workload Engine
 */

const request = require('supertest');
const app = require('../server');

describe('Version 0.6.2 & 0.6.3 — Resource Allocation API Test Suite', () => {
  test('GET /api/team/workload should return capacity metrics for team members', async () => {
    const res = await request(app).get('/api/team/workload');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body.length > 0) {
      const member = res.body[0];
      expect(member).toHaveProperty('name');
      expect(member).toHaveProperty('weeklyCapacityHours');
      expect(member).toHaveProperty('assignedHours');
      expect(member).toHaveProperty('workloadPercent');
      expect(member).toHaveProperty('status');
      expect(['Available', 'Balanced', 'Overloaded']).toContain(member.status);
    }
  });

  test('GET /api/team/best-match should return ranked recommendations for task assignment', async () => {
    const res = await request(app).get('/api/team/best-match?department=Production&estimatedHours=5');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('bestMatch');
    expect(res.body).toHaveProperty('recommendations');
    expect(Array.isArray(res.body.recommendations)).toBe(true);
    if (res.body.bestMatch) {
      expect(res.body.bestMatch).toHaveProperty('name');
      expect(res.body.bestMatch).toHaveProperty('freeHours');
    }
  });
});
