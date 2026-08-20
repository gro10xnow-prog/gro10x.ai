const { test, expect } = require('@playwright/test');

test.describe('CRM Client Workflows', () => {
  test('API services endpoint delivers service catalog', async ({ request }) => {
    const res = await request.get('/api/services');
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
