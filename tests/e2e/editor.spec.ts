import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { closeSettings, openSeededApp, openSettings } from './helpers/workspace';

test.describe('editors and export', () => {
  test('switches the default editor to CodeMirror and reloads the note', async ({ page, isMobile }) => {
    await openSeededApp(page);
    await openSettings(page, isMobile);

    const row = page.locator(isMobile ? '.settings-drawer-shell .setting-row' : '#modal-settings .setting-row').filter({ hasText: 'Default Editor' }).first();
    await row.locator('button').first().click();
    await page.getByRole('option', { name: 'CodeMirror', exact: true }).click();
    await expect(page.locator('.app-toast').filter({ hasText: 'Settings Saved' })).toBeVisible();
    await closeSettings(page, isMobile);

    await page.locator('[data-note-id="note-product"]').click();
    await expect(page.locator('#form-editors .cm-editor')).toBeVisible();
    await expect(page.locator('#form-editors .cm-content')).toContainText('Product plan');
    await expect(page.locator('#form-editors .ProseMirror')).toHaveCount(0);

    await page.reload();
    await page.locator('[data-note-id="note-product"]').click();
    await expect(page.locator('#form-editors .cm-editor')).toBeVisible();
  });

  test('exports notes and settings as JSON downloads', async ({ page, isMobile }) => {
    await openSeededApp(page);
    await openSettings(page, isMobile);
    if (!isMobile) await page.getByRole('tab', { name: 'Tools' }).click();

    const notesDownload = page.waitForEvent('download');
    await page.locator('button[data-ga-event="settings_export_notes"]:visible').first().click();
    const notesFile = await notesDownload;
    expect(notesFile.suggestedFilename()).toBe('opennotas-export-notes.json');
    const notesPath = await notesFile.path();
    const notesExport = JSON.parse(await readFile(notesPath, 'utf8'));
    expect(notesExport.data.length).toBeGreaterThanOrEqual(5);
    expect(notesExport.folders).toContain('Work');
    expect(notesExport.tags.map((tag: any) => tag.name)).toContain('Ideas');

    const settingsDownload = page.waitForEvent('download');
    await page.locator('button[data-ga-event="settings_export_settings"]:visible').first().click();
    const settingsFile = await settingsDownload;
    expect(settingsFile.suggestedFilename()).toBe('opennotas-export-settings.json');
    const settingsPath = await settingsFile.path();
    const settingsExport = JSON.parse(await readFile(settingsPath, 'utf8'));
    expect(settingsExport.settings.general.defaultEditor).toBe('Crepe');
    expect(settingsExport.encryptedFields).toEqual([]);
  });
});
