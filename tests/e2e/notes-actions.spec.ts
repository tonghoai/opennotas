import { expect, test } from '@playwright/test';
import { openNoteMenu, openSeededApp } from './helpers/workspace';

function noteMenuItem(page, isMobile: boolean, name: string) {
  const menu = isMobile ? page.locator('#modal-menu-note') : page.locator('#menu-note');
  return menu.getByRole(isMobile ? 'button' : 'menuitem', { name, exact: true });
}

test.describe('note actions', () => {
  test('pins, unpins and copies note metadata actions', async ({ page, isMobile }) => {
    await openSeededApp(page);
    await openNoteMenu(page, 'note-product', isMobile);
    await noteMenuItem(page, isMobile, 'Pin Note').click();
    await expect(page.locator('.app-toast').filter({ hasText: 'Note Pinned' })).toBeVisible();

    await openNoteMenu(page, 'note-product', isMobile);
    await noteMenuItem(page, isMobile, 'Unpin Note').click();
    await expect(page.locator('.app-toast').filter({ hasText: 'Note Unpinned' })).toBeVisible();
  });

  test('opens note info and history dialogs', async ({ page, isMobile }) => {
    await openSeededApp(page);
    await openNoteMenu(page, 'note-product', isMobile);
    await noteMenuItem(page, isMobile, 'Note Info').click();

    const info = page.locator('#modal-notes-detail');
    await expect(info).toHaveAttribute('open', '');
    await expect(info).toContainText('Word Count');
    await expect(info).toContainText('7');
    await expect(info).toContainText('54');
    await info.locator('button').first().click();
    await expect(info).toBeHidden();
    if (isMobile) {
      await page.keyboard.press('Escape');
      await expect(page.locator('#modal-menu-note')).toBeHidden();
    }

    await openNoteMenu(page, 'note-product', isMobile);
    await noteMenuItem(page, isMobile, 'History').click();
    const history = page.locator('#modal-note-history');
    await expect(history).toHaveAttribute('open', '');
    await expect(history).toContainText('Note History');
    await history.locator('button').first().click();
    await expect(history).toBeHidden();
  });


  test('closes standalone note dialogs with Escape', async ({ page, isMobile }) => {
    await openSeededApp(page);
    await openNoteMenu(page, 'note-product', isMobile);
    await noteMenuItem(page, isMobile, 'Note Info').click();

    const info = page.locator('#modal-notes-detail');
    await expect(info).toHaveAttribute('open', '');
    await page.keyboard.press('Escape');
    await expect(info).toBeHidden();
  });

  test('moves a note to another folder', async ({ page, isMobile }) => {
    await openSeededApp(page);
    await openNoteMenu(page, 'note-product', isMobile);
    await noteMenuItem(page, isMobile, isMobile ? 'Move to Folder' : 'Move').click();

    if (isMobile) {
      const move = page.locator('#modal-menu-move-note');
      await expect(move).toHaveAttribute('open', '');
      await move.getByRole('button', { name: 'Personal', exact: true }).click();
    } else {
      const move = page.locator('#menu-move-note');
      await expect(move).toBeVisible();
      await move.getByRole('menuitem', { name: 'Personal', exact: true }).click();
    }

    await expect(page.locator('.app-toast').filter({ hasText: 'Note Moved' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Product plan/ })).toHaveCount(0);
  });
});
