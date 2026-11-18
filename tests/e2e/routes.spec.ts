import { expect, test } from '@playwright/test';
import { openSeededApp } from './helpers/workspace';

test.describe('routes and API', () => {
  test('serves the app version endpoint', async ({ request }) => {
    const response = await request.get('/api/app-version');
    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body).toHaveProperty('buildId');
    expect(body).toHaveProperty('version');
  });

  test('loads the public pages without runtime errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    for (const path of ['/', '/service', '/install', '/sos']) {
      let response;
      try {
        response = await page.goto(path);
      } catch (error) {
        // Nuxt dev can reload once while Vite optimizes dependencies. Retry the
        // navigation instead of treating that reload as a product failure.
        if (!String(error).includes('ERR_ABORTED')) throw error;
        response = await page.goto(path);
      }
      expect(response?.status()).toBeLessThan(500);
      if (path !== '/sos') await expect(page.locator('body')).toBeVisible();
    }
    expect(errors).toEqual([]);
  });

  test('keeps the main app reachable through /app', async ({ page }) => {
    await openSeededApp(page);
    await expect(page).toHaveURL(/\/app$/);
    await expect(page.getByRole('button', { name: /Welcome to OpenNotas/ })).toBeVisible();
  });
});
