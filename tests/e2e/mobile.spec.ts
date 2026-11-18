import { expect, test } from '@playwright/test';
import { openSeededApp } from './helpers/workspace';

test.describe('mobile note navigation', () => {
  test('slides the editor over a list whose geometry does not shift', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile viewport only');
    await openSeededApp(page);

    const row = page.locator('[data-note-id="note-product"]');
    const list = page.locator('.note-list-pane');
    const beforeRow = await row.boundingBox();
    const beforeList = await list.boundingBox();
    expect(beforeRow).not.toBeNull();
    expect(beforeList).not.toBeNull();

    await row.click();
    await expect(page.locator('.note-editor-pane')).toHaveClass(/is-open/);
    await expect(page.locator('#form-editors .ProseMirror')).toContainText('Product plan');

    const duringRow = await row.boundingBox();
    const duringList = await list.boundingBox();
    expect(duringRow!.x).toBeCloseTo(beforeRow!.x, 1);
    expect(duringRow!.width).toBeCloseTo(beforeRow!.width, 1);
    expect(duringList!.x).toBeCloseTo(beforeList!.x, 1);
    expect(duringList!.width).toBeCloseTo(beforeList!.width, 1);

    await expect.poll(async () => page.locator('.note-editor-pane').evaluate((el) => getComputedStyle(el).transform))
      .toMatch(/^none$|^matrix\(1, 0, 0, 1, 0, 0\)$/);
    await expect(list).toHaveClass(/is-behind/);
    await expect(list).toHaveAttribute('inert', '');
  });

  test('opens notes read-only once, then enters edit mode on request', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile viewport only');
    await openSeededApp(page);

    await page.locator('[data-note-id="note-product"]').click();
    const editor = page.locator('#form-editors .ProseMirror');
    await expect(editor).toBeVisible();
    await expect(editor).toHaveAttribute('contenteditable', 'false');
    const editButton = page.getByRole('button', { name: 'Edit note', exact: true });
    await expect(editButton).toBeVisible();

    await editButton.click();
    await expect(editor).toHaveAttribute('contenteditable', 'true');
    await expect(page.getByRole('button', { name: 'Read-only mode', exact: true })).toBeVisible();
  });

  test('returns to the list with the back button', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile viewport only');
    await openSeededApp(page);

    await page.locator('[data-note-id="note-product"]').click();
    await expect(page.locator('.note-editor-pane')).toHaveClass(/is-open/);
    await page.locator('button[aria-label="Back"]:visible').first().click();
    await expect(page.locator('.note-editor-pane')).toHaveClass(/is-closed/);
    await expect(page.locator('[data-note-id="note-product"]')).toBeVisible();
  });

  test('opens the navigation drawer and reaches tags and trash', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile viewport only');
    await openSeededApp(page);

    await page.locator('button[aria-label="Menu"]:visible').first().click();
    await expect(page.getByRole('button', { name: 'Tags', exact: true })).toBeVisible();
    await expect(page.locator('button[title="Trash"]:visible')).toBeVisible();
    await expect(page.getByText('Folders', { exact: true }).first()).toBeVisible();
  });
});

test.describe('mobile note swipe', () => {
  test('reveals actions with a left swipe and deletes from the list', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile viewport only');
    await openSeededApp(page);
    const row = page.locator('[data-note-id="note-product"]');
    await expect(row).toBeVisible();

    const transform = await page.evaluate(() => {
      const row = document.querySelector('[data-note-id="note-product"]') as HTMLElement;
      const target = row.querySelector('.cursor-pointer') as HTMLElement;
      const makeTouch = (x: number, y: number) => new Touch({
        identifier: 1,
        target,
        clientX: x,
        clientY: y,
        pageX: x,
        pageY: y,
        screenX: x,
        screenY: y,
      });
      const fire = (type: string, x: number, y: number) => {
        const touch = makeTouch(x, y);
        target.dispatchEvent(new TouchEvent(type, {
          bubbles: true,
          cancelable: true,
          composed: true,
          touches: type === 'touchend' ? [] : [touch],
          targetTouches: type === 'touchend' ? [] : [touch],
          changedTouches: [touch],
        }));
      };
      fire('touchstart', 320, 120);
      fire('touchmove', 250, 121);
      fire('touchmove', 200, 122);
      fire('touchend', 200, 122);
      return new Promise<string>((resolve) => requestAnimationFrame(() => {
        const moving = row.querySelector('.note-swipe-transition') as HTMLElement;
        resolve(moving?.style.transform || '');
      }));
    });
    expect(transform).toContain('translateX(-92px)');

    await row.locator('button[aria-label="Delete"]').click();
    await expect(page.locator('.app-toast').filter({ hasText: 'Note Deleted' })).toBeVisible();
    await expect(row).toHaveCount(0);
  });
});
