import { expect, test } from '@playwright/test';
import { openSeededApp, makeWorkspace } from './helpers/workspace';

test.describe('app smoke', () => {
  test('loads a seeded workspace without runtime errors', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));

    await openSeededApp(page, makeWorkspace());

    await expect(page.getByRole('button', { name: /Welcome to OpenNotas/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Product plan/ })).toBeVisible();
    await expect(page.locator('body')).not.toContainText('Locked Content');
    expect(pageErrors).toEqual([]);
  });

  test('keeps the document inside the viewport', async ({ page }) => {
    await openSeededApp(page);
    const overflow = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      viewport: window.innerWidth,
    }));
    expect(overflow.width).toBeLessThanOrEqual(overflow.viewport + 1);
  });

  test('syncs color-scheme and theme-color meta tags', async ({ page }) => {
    await openSeededApp(page);
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#ffffff');
    await expect(page.locator('meta[name="color-scheme"]')).toHaveAttribute('content', 'light');
  });

  test('keeps the desktop shell free of text selection while allowing inputs', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop-only browser chrome contract');
    await openSeededApp(page);
    const bodySelect = await page.evaluate(() => getComputedStyle(document.body).userSelect);
    const editorSelect = await page.evaluate(() => getComputedStyle(document.querySelector('.ProseMirror, .cm-editor, #crepe-editor')!).userSelect);
    expect(bodySelect).toBe('none');
    expect(editorSelect).toBe('text');
  });
});
