import { expect, test } from '@playwright/test';
import {
  closeSettings,
  openNoteMenu,
  openSeededApp,
  openSettings,
} from './helpers/workspace';

async function setPassword(page, password: string) {
  const modal = page.locator('#modal-set-password');
  await expect(modal).toHaveAttribute('open', '');
  const inputs = modal.locator('input[type="password"]');
  await inputs.nth(0).fill(password);
  await inputs.nth(1).fill(password);
  await modal.getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect(page.locator('.app-toast').filter({ hasText: 'Password Set' })).toBeVisible();
  await expect(modal).toBeHidden();
}

test.describe('password and locked notes', () => {
  test('sets a password once, closes the dialog, and reopens in change mode', async ({ page, isMobile }) => {
    await openSeededApp(page);
    await openSettings(page, isMobile);
    if (!isMobile) await page.getByRole('tab', { name: 'Security' }).click();

    await page.locator('button[data-ga-event="settings_password_open"]:visible').first().click();
    await setPassword(page, 'opennotas-pass');

    await expect(page.locator('button[data-ga-event="settings_password_open"]:visible').first())
      .toHaveText('Change');

    await page.locator('button[data-ga-event="settings_password_open"]:visible').first().click();
    const modal = page.locator('#modal-set-password');
    await expect(modal).toHaveAttribute('open', '');
    await expect(modal).toContainText('Change Password');
    await expect(modal.locator('input[placeholder="Old Password"]')).toBeVisible();
    await expect(modal.locator('input[type="password"]')).toHaveCount(3);

    await modal.locator('button').first().click();
    await expect(modal).toBeHidden();
    await closeSettings(page, isMobile);
  });

  test('locks a note without leaking ciphertext into the title and unlocks it', async ({ page, isMobile }) => {
    await openSeededApp(page);
    await openSettings(page, isMobile);
    if (!isMobile) await page.getByRole('tab', { name: 'Security' }).click();
    await page.locator('button[data-ga-event="settings_password_open"]:visible').first().click();
    await setPassword(page, 'opennotas-pass');
    await closeSettings(page, isMobile);

    await openNoteMenu(page, 'note-product', isMobile);
    const menu = isMobile ? page.locator('#modal-menu-note') : page.locator('#menu-note');
    await menu.getByRole(isMobile ? 'button' : 'menuitem', { name: 'Lock Note', exact: true }).click();
    await expect(page.locator('.app-toast').filter({ hasText: 'Note Locked' })).toBeVisible();

    const option = page.getByRole('button', { name: /Product plan/ });
    await expect(option).toBeVisible();
    const optionText = await option.innerText();
    expect(optionText).toContain('Product plan');
    expect(optionText).not.toMatch(/[0-9a-f]{20,}/i);

    await page.reload();
    await expect(page.locator('#notes-instance')).toBeVisible();
    await page.locator('[data-note-id="note-product"]').click();
    await expect(page.locator('#form-editors input[placeholder="Enter Password"]')).toBeVisible();
    if (isMobile) {
      const header = page.locator('h1', { hasText: 'Product plan' }).first();
      await expect(header).toBeVisible();
      expect(await header.innerText()).not.toMatch(/[0-9a-f]{20,}/i);
      await page.goto('/app');
      await expect(page.locator('#notes-instance')).toBeVisible();
    }

    await openNoteMenu(page, 'note-product', isMobile);
    await menu.getByRole(isMobile ? 'button' : 'menuitem', { name: 'Unlock Note', exact: true }).click();
    const unlock = page.locator('#modal-unlock-notes');
    await expect(unlock).toHaveAttribute('open', '');
    await unlock.locator('input[type="password"]').fill('opennotas-pass');
    await unlock.locator('input[type="password"]').press('Enter');
    await expect(page.locator('.app-toast').filter({ hasText: 'Note Unlocked' })).toBeVisible();
    await expect(page.locator('#form-editors .ProseMirror')).toContainText('Product plan');
  });

  test('rejects an incorrect unlock password and keeps the note locked', async ({ page, isMobile }) => {
    await openSeededApp(page);
    await openSettings(page, isMobile);
    if (!isMobile) await page.getByRole('tab', { name: 'Security' }).click();
    await page.locator('button[data-ga-event="settings_password_open"]:visible').first().click();
    await setPassword(page, 'opennotas-pass');
    await closeSettings(page, isMobile);

    await openNoteMenu(page, 'note-product', isMobile);
    const menu = isMobile ? page.locator('#modal-menu-note') : page.locator('#menu-note');
    await menu.getByRole(isMobile ? 'button' : 'menuitem', { name: 'Lock Note', exact: true }).click();
    await expect(page.locator('.app-toast').filter({ hasText: 'Note Locked' })).toBeVisible();

    await page.reload();
    await page.locator('[data-note-id="note-product"]').click();
    const inline = page.locator('#form-editors input[placeholder="Enter Password"]');
    await expect(inline).toBeVisible();
    await inline.fill('wrong-password');
    await inline.press('Enter');
    await expect(page.locator('.app-toast').filter({ hasText: 'Incorrect Password' })).toBeVisible();
    await expect(inline).toBeVisible();
    await expect(page.locator('#form-editors .ProseMirror')).toHaveCount(0);
  });
});
