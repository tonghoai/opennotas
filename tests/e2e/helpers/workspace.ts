import { expect, type Page } from '@playwright/test';

const BASE_TIME = 1_700_000_000;

export function makeWorkspace(overrides: Record<string, any> = {}) {
  const folders = [
    {
      id: 'folder-work',
      name: 'Work',
      lastSync: 0,
      createdAt: BASE_TIME,
      updatedAt: BASE_TIME,
      deletedAt: null,
    },
    {
      id: 'folder-personal',
      name: 'Personal',
      lastSync: 0,
      createdAt: BASE_TIME + 1,
      updatedAt: BASE_TIME + 1,
      deletedAt: null,
    },
  ];

  const notes = [
    {
      id: 'note-welcome',
      folderId: 'folder-work',
      content: '# Welcome to OpenNotas\nA calm place to think.',
      isPinned: true,
      isLocked: false,
      lastSync: 0,
      createdAt: BASE_TIME,
      updatedAt: BASE_TIME + 10,
      deletedAt: null,
      deleteCompletelyAt: null,
    },
    {
      id: 'note-product',
      folderId: 'folder-work',
      content: '# Product plan\nShip the native-feeling notes experience.',
      isPinned: false,
      isLocked: false,
      lastSync: 0,
      createdAt: BASE_TIME + 2,
      updatedAt: BASE_TIME + 9,
      deletedAt: null,
      deleteCompletelyAt: null,
    },
    {
      id: 'note-meeting',
      folderId: 'folder-work',
      content: '# Weekly meeting\nDiscuss the roadmap and the next release.',
      isPinned: false,
      isLocked: false,
      lastSync: 0,
      createdAt: BASE_TIME + 3,
      updatedAt: BASE_TIME + 8,
      deletedAt: null,
      deleteCompletelyAt: null,
    },
    {
      id: 'note-reading',
      folderId: 'folder-personal',
      content: '# Reading list\n- The Design of Everyday Things\n- Thinking in Systems',
      isPinned: false,
      isLocked: false,
      lastSync: 0,
      createdAt: BASE_TIME + 4,
      updatedAt: BASE_TIME + 7,
      deletedAt: null,
      deleteCompletelyAt: null,
    },
    {
      id: 'note-trip',
      folderId: 'folder-personal',
      content: '# Trip notes\nPack light, bring a notebook.',
      isPinned: false,
      isLocked: false,
      lastSync: 0,
      createdAt: BASE_TIME + 5,
      updatedAt: BASE_TIME + 6,
      deletedAt: null,
      deleteCompletelyAt: null,
    },
  ];

  const tags = [
    {
      id: 'tag-ideas',
      name: 'Ideas',
      color: '#f59e0b',
      lastSync: 0,
      createdAt: BASE_TIME,
      updatedAt: BASE_TIME,
      deletedAt: null,
    },
    {
      id: 'tag-work',
      name: 'Work',
      color: '#3b82f6',
      lastSync: 0,
      createdAt: BASE_TIME + 1,
      updatedAt: BASE_TIME + 1,
      deletedAt: null,
    },
  ];

  const noteTags = [
    {
      id: 'note-product:tag-work',
      noteId: 'note-product',
      tagId: 'tag-work',
      lastSync: 0,
      createdAt: BASE_TIME,
      updatedAt: BASE_TIME,
      deletedAt: null,
    },
    {
      id: 'note-reading:tag-ideas',
      noteId: 'note-reading',
      tagId: 'tag-ideas',
      lastSync: 0,
      createdAt: BASE_TIME,
      updatedAt: BASE_TIME,
      deletedAt: null,
    },
  ];

  return {
    folders,
    notes,
    noteDetails: Object.fromEntries(notes.map((note) => [note.id, note])),
    tags,
    noteTags,
    firstInit: true,
    activeFolder: 'folder-work',
    activeNote: 'note-welcome',
    sortNote: 'updatedAt',
    settings: {
      general: {
        lang: 'en',
        theme: 'system',
        defaultEditor: 'Crepe',
        editorView: 'compact',
        fontFamily: 'System',
        editorFontFamily: '',
        editorFontSize: 14,
        editorLineHeight: 1.5,
        editorBlockSpacing: 0.75,
      },
      sync: { frequency: '5', adapter: 'LocalForage', configuration: '{}' },
      imageSync: {
        enabled: false,
        workerUrl: '',
        s3Endpoint: '',
        s3AccessKey: '',
        s3SecretKey: '',
        s3Bucket: '',
      },
    },
    ...overrides,
  };
}

/**
 * Seed localForage's IndexedDB store before the app page boots. The landing
 * page is same-origin but does not touch the notes repository, so this avoids
 * racing the first `localforage.getItem()` calls in /app.
 */
export async function seedWorkspace(page: Page, workspace = makeWorkspace()) {
  await page.goto('/');
  await page.evaluate(async (data) => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('localforage', 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore('keyvaluepairs');
      };
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction('keyvaluepairs', 'readwrite');
        const store = tx.objectStore('keyvaluepairs');
        store.clear();
        const set = (key: string, value: unknown) => store.put(
          typeof value === 'string' ? value : JSON.stringify(value),
          key,
        );
        set('folders', data.folders);
        set('notes', data.notes);
        for (const [id, note] of Object.entries(data.noteDetails)) set(`notes-${id}`, note);
        set('tags', data.tags);
        set('noteTags', data.noteTags);
        for (const tag of data.tags) set(`tags-${tag.id}`, tag);
        for (const noteTag of data.noteTags) set(`noteTags-${noteTag.id}`, noteTag);
        set('settings', data.settings);
        set('firstInit', Boolean(data.firstInit));
        set('activeFolder', data.activeFolder);
        set('activeNote', data.activeNote);
        set('sortNote', data.sortNote);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      };
    });
  }, workspace);
}

export async function openSeededApp(page: Page, workspace = makeWorkspace()) {
  await seedWorkspace(page, workspace);
  await page.goto('/app');
  await waitForApp(page);
}

export async function openApp(page: Page) {
  await page.goto('/app');
  await waitForApp(page);
}

export async function waitForApp(page: Page) {
  await expect(page.locator('#notes-instance')).toBeVisible({ timeout: 20_000 });
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('#notes-instance')).toBeVisible();
}

export async function waitForNoteEditor(page: Page, title?: string) {
  if (title) await expect(page.locator('#form-editors')).toContainText(title);
  else await expect(page.locator('#form-editors')).toBeVisible();
}

export async function openSettings(page: Page, isMobile = false) {
  await page.locator('button[data-ga-event="settings_open"]:visible').first().click();
  if (isMobile) {
    await expect(page.locator('.settings-drawer-shell')).toBeVisible();
  } else {
    await expect(page.locator('#modal-settings')).toHaveAttribute('open', '');
  }
}

export async function closeSettings(page: Page, isMobile = false) {
  if (isMobile) {
    await page.locator('.settings-drawer-shell button[aria-label="Back"]').click();
    await expect(page.locator('.settings-drawer-shell')).toBeHidden();
    return;
  }
  await page.locator('#modal-settings .setting-close').click();
  await expect(page.locator('#modal-settings')).toBeHidden();
}

export async function openNoteMenu(page: Page, noteId: string, isMobile = false) {
  const editorOpen = isMobile && await page.locator('.note-editor-pane.is-open').isVisible().catch(() => false);
  if (editorOpen) {
    await page.locator('.lg\\:hidden button[aria-label="More"]:visible').first().click();
  } else {
    const row = page.locator(`[data-note-id="${noteId}"]`);
    await row.locator('button[aria-label="More"]').click();
  }
  if (isMobile) {
    await expect(page.locator('#modal-menu-note')).toHaveAttribute('open', '');
  } else {
    await expect(page.locator('#menu-note')).toBeVisible();
  }
}

export async function closeDialog(page: Page, selector: string) {
  await page.locator(`${selector} .ui-modal-close`).click();
  await expect(page.locator(selector)).not.toHaveAttribute('open', '');
}

export async function visitAllRoutes(page: Page) {
  for (const path of ['/app', '/install', '/landing', '/service', '/sos', '/dev/ui']) {
    await page.goto(path);
    await page.waitForLoadState('networkidle').catch(() => {});
  }
}

export { BASE_TIME };

export async function openFolderCreate(page: Page, isMobile = false) {
  if (isMobile) await page.locator('button[aria-label="Menu"]:visible').first().click();
  await page.locator('button[data-ga-event="folder_create"]:visible').first().click();
}

export async function openTagCreate(page: Page, isMobile = false) {
  if (isMobile) await page.locator('button[aria-label="Menu"]:visible').first().click();
  await page.locator('button[title="Create tag"]:visible').first().click();
}

export async function openNoteTags(page: Page, noteId: string, isMobile = false) {
  await openNoteMenu(page, noteId, isMobile);
  const menu = isMobile ? page.locator('#modal-menu-note') : page.locator('#menu-note');
  await menu.getByRole(isMobile ? 'button' : 'menuitem', { name: 'Add to tag', exact: true }).click();
  if (isMobile) {
    await expect(page.locator('#modal-menu-note-tags')).toHaveAttribute('open', '');
  } else {
    await expect(page.locator('#menu-note-tags')).toBeVisible();
  }
}
