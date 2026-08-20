const { test, expect } = require('@playwright/test');

test.describe('Portal Navigation & Shell Load', () => {
  test('Public Landing Page loads successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Purple|Agency/i);
  });

  test('Admin App Shell loads without catastrophic crash', async ({ page }) => {
    await page.goto('/app');
    await expect(page.locator('body')).toBeVisible();
  });
});
