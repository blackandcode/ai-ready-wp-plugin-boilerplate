import { test, expect } from '@playwright/test';

test.describe('Settings Admin Application', () => {
  test('loads settings page and displays WordPress AI Boilerplate title', async ({ page }) => {
    await page.goto('/wp-admin/admin.php?page=airwp-settings');
    await expect(page.locator('h1.wp-heading-inline')).toContainText('Settings');
    await expect(page.locator('.airwp-settings-card')).toBeVisible();
    await expect(page.locator('.airwp-sidebar-tab.is-active')).toContainText('General');
  });

  test('visual snapshot matches design baseline', async ({ page }) => {
    await page.goto('/wp-admin/admin.php?page=airwp-settings');
    await expect(page.locator('.airwp-settings-card')).toBeVisible();
    await expect(page.locator('.airwp-settings-layout')).toHaveScreenshot('settings-layout.png');
  });
});
