import { expect, test } from '@playwright/test';
import {
  BASE_TIME,
  makeWorkspace,
  openApp,
  openSeededApp,
  waitForApp,
} from './helpers/workspace';

test.describe('notes', () => {
  test('shows the first-run sample prompt and an empty workspace after cancelling', async ({ page }) => {
    await page.goto('/app');
    await waitForApp(page);

    const sample = page.locator('#modal-confirm-sample-data');
    await expect(sample).toHaveAttribute('open', '');
    await expect(sample).toContainText('sample');

    await sample.locator('.ui-modal-footer button').first().click();
    await expect(sample).toBeHidden();
    await expect(page.getByText('No Notes', { exact: true })).toBeVisible();
  });

  test('creates a note, edits it, and persists it across reloads', async ({ page }) => {
    await openApp(page);
    // A fresh context starts at the sample prompt; dismiss it.
    const sample = page.locator('#modal-confirm-sample-data');
    if (await sample.isVisible().catch(() => false)) {
      await sample.locator('.ui-modal-footer button').first().click();
      await expect(sample).toBeHidden();
    }

    await page.locator('[data-ga-event="note_create"]:visible').first().click();
    await expect(page.locator('.app-toast').filter({ hasText: 'Note Created' })).toBeVisible();

    const editor = page.locator('#form-editors .ProseMirror');
    await expect(editor).toBeVisible();
    await editor.click();
    await page.keyboard.type('Regression note');
    await page.keyboard.press('Enter');
    await page.keyboard.type('The body survives a reload.');

    await expect(page.getByRole('button', { name: /Regression note/ })).toBeVisible();
    await page.reload();
    await waitForApp(page);

    const option = page.getByRole('button', { name: /Regression note/ });
    await expect(option).toBeVisible();
    await option.click();
    await expect(page.locator('#form-editors .ProseMirror')).toContainText('The body survives a reload.');
  });

  test('finds notes through the command palette and inside the editor', async ({ page }) => {
    await openSeededApp(page);
    await page.keyboard.press('Control+k');

    const palette = page.locator('dialog[open]').filter({ has: page.locator('input[placeholder="Search notes, folders, tags…"]') });
    await expect(palette).toBeVisible();
    const input = palette.locator('input[placeholder="Search notes, folders, tags…"]');
    await input.fill('Product');
    const result = palette.getByRole('button', { name: /Product plan/ });
    await expect(result).toBeVisible();
    await result.click();
    await expect(palette).toBeHidden();

    await expect(page.locator('#form-editors .ProseMirror')).toContainText('Product plan');
    const beforeScroll = await page.locator('#form-editors').evaluate((el) => el.scrollTop);

    await page.locator('button[aria-label="Find in note"]:visible').first().click();
    const search = page.locator('.note-search-shell');
    await expect(search).toBeVisible();
    const searchInput = search.locator('input[placeholder="Find in note..."]');
    await expect(searchInput).toBeFocused();
    await searchInput.fill('Product');
    await expect(search).toContainText('1/1');

    const afterOpenScroll = await page.locator('#form-editors').evaluate((el) => el.scrollTop);
    expect(afterOpenScroll).toBe(beforeScroll);

    await searchInput.fill('missing');
    await expect(search).toContainText('No results');
    await searchInput.press('Escape');
    await expect(search).toBeHidden();
  });

  test('restores a note from the trash', async ({ page, isMobile }) => {
    const workspace = makeWorkspace();
    const trashed = {
      ...workspace.notes[2],
      id: 'note-trash',
      content: '# Trash note\nRestore me',
      deletedAt: BASE_TIME + 20,
      deleteCompletelyAt: null,
    };
    workspace.notes.push(trashed);
    workspace.noteDetails[trashed.id] = trashed;
    await openSeededApp(page, workspace);

    if (isMobile) {
      await page.locator('button[aria-label="Menu"]:visible').first().click();
    }
    await page.locator('button[title="Trash"]:visible').first().click();
    const option = page.getByRole('button', { name: /Trash note/ });
    await expect(option).toBeVisible();
    await option.click();
    const restore = page.getByRole('button', { name: 'Restore', exact: true }).first();
    await restore.click();
    await expect(page.locator('.app-toast').filter({ hasText: 'Note Restored' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Trash note/ })).toBeVisible();
  });
});
