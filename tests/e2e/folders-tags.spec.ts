import { expect, test } from '@playwright/test';
import {
  openFolderCreate,
  openNoteTags,
  openSeededApp,
  openTagCreate,
} from './helpers/workspace';

test.describe('folders and tags', () => {
  test('creates a folder and opens it', async ({ page, isMobile }) => {
    await openSeededApp(page);
    await openFolderCreate(page, isMobile);

    const modal = page.locator('#modal-change-folder-name');
    await expect(modal).toHaveAttribute('open', '');
    await modal.locator('input').fill('Projects');
    await modal.getByRole('button', { name: 'Create', exact: true }).click();
    await expect(page.locator('.app-toast').filter({ hasText: 'Folder Created' })).toBeVisible();
    await expect(page.locator('h1:visible').filter({ hasText: 'Projects' }).first()).toBeVisible();
  });

  test('creates and names a tag', async ({ page, isMobile }) => {
    await openSeededApp(page);
    await openTagCreate(page, isMobile);

    const modal = page.locator('#modal-tag-form');
    await expect(modal).toHaveAttribute('open', '');
    await modal.locator('input').fill('Archive');
    await modal.getByRole('button', { name: 'Confirm', exact: true }).click();
    await expect(page.locator('.app-toast').filter({ hasText: 'Tag created' })).toBeVisible();
    await expect(modal).toBeHidden();

    await page.keyboard.press('Control+k');
    const palette = page.locator('dialog[open]').filter({ has: page.locator('input[placeholder="Search notes, folders, tags…"]') });
    await palette.locator('input[placeholder="Search notes, folders, tags…"]').fill('Archive');
    await expect(palette.getByRole('button', { name: 'Archive', exact: true })).toBeVisible();
  });

  test('shows filled and hollow tag dots and toggles assignment', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'The circular tag indicator is the mobile menu contract');
    await openSeededApp(page);
    await page.locator('[data-note-id="note-product"]').click();
    await expect(page.locator('.note-editor-pane')).toHaveClass(/is-open/);
    await openNoteTags(page, 'note-product', true);

    const tags = page.locator('#modal-menu-note-tags');
    await expect(tags).toHaveAttribute('open', '');
    const work = tags.getByRole('button', { name: 'Work', exact: true });
    const ideas = tags.getByRole('button', { name: 'Ideas', exact: true });
    await expect(work).toHaveAttribute('aria-pressed', 'true');
    await expect(ideas).toHaveAttribute('aria-pressed', 'false');

    const dotStyle = async (button) => button.locator('span[aria-hidden="true"]').evaluate((el) => {
      const style = getComputedStyle(el);
      return { background: style.backgroundColor, border: style.borderColor, width: style.width };
    });
    const filled = await dotStyle(work);
    const hollow = await dotStyle(ideas);
    expect(filled.background).not.toBe('rgba(0, 0, 0, 0)');
    expect(hollow.background).toBe('rgba(0, 0, 0, 0)');
    expect(hollow.border).not.toBe('rgba(0, 0, 0, 0)');
    expect(filled.width).toBe(hollow.width);

    await ideas.click();
    await expect(ideas).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.app-toast').filter({ hasText: 'Tag Added to Note' })).toBeVisible();
  });
});
