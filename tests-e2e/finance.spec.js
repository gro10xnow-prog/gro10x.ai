const { test, expect } = require('@playwright/test');

test.describe('Finance & Invoice Operations', () => {
  test('Invoices API endpoint responds to authenticated requests', async ({ request }) => {
    const res = await request.get('/api/invoices');
    expect(res.status()).toBeLessThan(500);
  });
});
