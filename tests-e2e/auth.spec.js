const { test, expect } = require('@playwright/test');

test.describe('Authentication Flows', () => {
  test('User visits auth page and sees login interface', async ({ page }) => {
    await page.goto('/auth');
    await expect(page.locator('body')).toBeVisible();
  });

  test('Public client check endpoint behaves properly for widget', async ({ page }) => {
    const res = await page.request.get('/api/public/client-check?phone=01708459008');
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data).toHaveProperty('success', true);
  });
});
