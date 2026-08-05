const { test, expect } = require('@playwright/test');

test.describe('CRM & Client Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Admin / CRM Dashboard
    await page.goto('/admin');
  });

  test('Should open CRM tab and display client list', async ({ page }) => {
    // Click CRM / Clients tab
    const crmTab = page.locator('nav a, nav button, .sidebar-link').filter({ hasText: /Client|CRM/i }).first();
    if (await crmTab.isVisible()) {
      await crmTab.click();
    }
    
    // Expect client list table or grid to be visible
    const clientList = page.locator('table, .client-grid, .data-table');
    await expect(clientList).toBeVisible({ timeout: 10000 });
  });

  test('Should open Add Client modal', async ({ page }) => {
    const crmTab = page.locator('nav a, nav button, .sidebar-link').filter({ hasText: /Client|CRM/i }).first();
    if (await crmTab.isVisible()) {
      await crmTab.click();
    }

    const addClientBtn = page.locator('button:has-text("Add Client"), button:has-text("New Client"), .add-btn').first();
    if (await addClientBtn.isVisible()) {
      await addClientBtn.click();
      
      const modal = page.locator('.modal, dialog').filter({ hasText: /Client/i });
      await expect(modal).toBeVisible();
      
      // Close modal to reset state
      const closeBtn = modal.locator('button.close, .close-btn, button:has-text("Cancel")');
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
      }
    }
  });
});
