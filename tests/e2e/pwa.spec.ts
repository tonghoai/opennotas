import { expect, test } from '@playwright/test';
import { openSeededApp } from './helpers/workspace';

test.describe('PWA @pwa', () => {
  test.use({ serviceWorkers: 'allow' });

  test('ships a valid standalone manifest', async ({ request }) => {
    const response = await request.get('/manifest.json');
    expect(response.ok()).toBe(true);
    const manifest = await response.json();
    expect(manifest).toMatchObject({
      name: 'OpenNotas',
      short_name: 'Notas',
      start_url: '/app',
      scope: '/',
      display: 'standalone',
      theme_color: '#ffffff',
    });
    expect(manifest.icons.length).toBeGreaterThanOrEqual(3);
    expect(manifest.icons.every((icon: any) => icon.src && icon.sizes && icon.type)).toBe(true);
  });

  test('serves the offline service worker', async ({ request }) => {
    const response = await request.get('/sw.js');
    expect(response.ok()).toBe(true);
    const source = await response.text();
    expect(source).toContain('opennotas');
    expect(source).toContain('/app');
    expect(source).toContain('addEventListener("fetch"');
  });

  test('opens the app offline after a successful first load', async ({ page, context }) => {
    test.skip(process.env.E2E_SERVER !== 'prod', 'Service worker registration is production-only');
    await openSeededApp(page);
    await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
    // The first visit registers the worker; a reload promotes it to controller.
    await page.reload();
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller), { timeout: 20_000 }).toBe(true);

    await context.setOffline(true);
    await page.reload();
    await expect(page.locator('#notes-instance')).toBeVisible();
    await expect(page.getByRole('button', { name: /Welcome to OpenNotas/ })).toBeVisible();
    await context.setOffline(false);
  });
});
