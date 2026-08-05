const { test, expect } = require('@playwright/test');

test.describe('Navigation and Routing Checks', () => {
  const routesToVerify = [
    { path: '/', titleCheck: /PurpleOS/i },
    { path: '/app', titleCheck: /Admin|Dashboard|OS/i },
    { path: '/manager', titleCheck: /Manager/i },
    { path: '/team', titleCheck: /Crew|Team/i },
    { path: '/partners', titleCheck: /Client|Partner/i }
  ];

  for (const route of routesToVerify) {
    test(`Should successfully load route: ${route.path} without breaking`, async ({ page }) => {
      // Go to route
      const response = await page.goto(route.path);
      
      // Verify response is successful (not 404 or 500)
      expect(response.ok()).toBeTruthy();
      
      // Check if page body loads
      await expect(page.locator('body')).toBeVisible();
      
      // Check for absence of typical error strings
      const bodyText = await page.textContent('body');
      expect(bodyText).not.toMatch(/Cannot GET/);
      expect(bodyText).not.toMatch(/500 Internal Server Error/);
    });
  }
});
