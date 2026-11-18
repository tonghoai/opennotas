import { expect, test } from '@playwright/test';
import {
  closeSettings,
  openSeededApp,
  openSettings,
} from './helpers/workspace';

async function chooseTheme(page, isMobile, theme: 'light' | 'dark') {
  if (isMobile) {
    const row = page.locator('.settings-drawer-shell .setting-row').filter({ hasText: 'Theme' }).first();
    await row.locator('button').first().click();
    const label = theme === 'dark' ? 'OpenNotas Dark' : 'OpenNotas Light';
    await page.getByRole('option', { name: label }).click();
    return;
  }
  const group = page.getByRole('group', { name: 'Theme' });
  await group.getByRole('button', { name: theme === 'dark' ? 'Dark' : 'Light' }).click();
}

test.describe('settings and dialogs', () => {
  test('switches the theme and updates browser chrome', async ({ page, isMobile }) => {
    await openSeededApp(page);
    await openSettings(page, isMobile);
    await chooseTheme(page, isMobile, 'dark');

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('meta[name="color-scheme"]')).toHaveAttribute('content', 'dark');
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#171614');

    if (!isMobile) {
      await chooseTheme(page, isMobile, 'light');
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
      await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#ffffff');
    }
    await closeSettings(page, isMobile);
  });

  test('animates desktop settings dismissal', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop settings is a modal window');
    await openSeededApp(page);
    await openSettings(page, false);

    const settings = page.locator('#modal-settings');
    await settings.locator('.setting-close').click();
    await expect(settings).toHaveClass(/is-closing/);
    await expect(settings).toBeHidden();
  });

  test('closes the mobile settings drawer with the header back button', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile settings is a full-screen drawer');
    await openSeededApp(page);
    await openSettings(page, true);

    await page.locator('.settings-drawer-shell button[aria-label="Back"]').click();
    await expect(page.locator('.settings-drawer-shell')).toBeHidden();
    await expect(page.locator('[data-note-id="note-welcome"]')).toBeVisible();
  });

  test('opens and closes the command palette with Escape or the mobile back button', async ({ page, isMobile }) => {
    await openSeededApp(page);
    await page.keyboard.press('Control+k');
    const palette = page.locator('dialog[open]').filter({ has: page.locator('input[placeholder="Search notes, folders, tags…"]') });
    await expect(palette).toBeVisible();
    await expect(palette).toContainText('Search or run a command');

    if (isMobile) {
      const back = palette.locator('.ui-modal-back');
      await expect(back).toBeVisible();
      await back.click();
    } else {
      await page.keyboard.press('Escape');
    }
    await expect(palette).toBeHidden();
  });

  test('opens the UI kit gallery without runtime errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/dev/ui');
    await expect(page.getByRole('heading', { name: 'UI Kit' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Primary', exact: true })).toBeVisible();
    expect(errors).toEqual([]);
  });
});
