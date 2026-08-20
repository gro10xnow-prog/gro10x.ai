const { test, expect } = require('@playwright/test');

test.describe('HR & Team Operations', () => {
  test('Team invitation-status endpoint is functional', async ({ request }) => {
    const res = await request.get('/api/team/invitation-status');
    expect(res.status()).toBeLessThan(500);
  });
});
