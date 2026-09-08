import { test as setup, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const authFile = '.auth/admin.json';

setup('authenticate WordPress administrator', async ({ page }) => {
  await mkdir('.auth', { recursive: true });
  await page.goto('/wp-login.php');
  await page.getByLabel(/username|email address/i).fill(
    process.env.WP_ADMIN_USER ?? 'admin'
  );
  await page.locator('#user_pass').fill(
    process.env.WP_ADMIN_PASSWORD ?? 'password'
  );
  await page.getByRole('button', { name: /log in/i }).click();
  await expect(page).toHaveURL(/\/wp-admin\//);
  await page.context().storageState({ path: authFile });
});
