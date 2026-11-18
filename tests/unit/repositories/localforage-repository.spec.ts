import { beforeEach, describe, expect, it, vi } from 'vitest';
import localForage from 'localforage';
import LocalForageRepository from '~/repositories';
import { BASE_TIME, makeFolder, makeNote, makeNoteTag, makeTag } from '../helpers/fixtures';

const DAY = 86_400;

async function clearStorage() {
  await localForage.clear();
  vi.restoreAllMocks();
}

describe('LocalForageRepository folders', () => {
  let repo: LocalForageRepository;

  beforeEach(async () => {
    await clearStorage();
    repo = new LocalForageRepository();
  });

  it('creates, reads, updates and soft-deletes folders', async () => {
    const folder = makeFolder();
    await repo.createFolder(folder);

    expect(await repo.getAllFolders()).toHaveLength(1);
    expect(await repo.getFolders()).toHaveLength(1);
    expect(await repo.getFolderDetail(folder.id)).toEqual(folder);

    await repo.updateFolder(folder.id, { name: 'Renamed', updatedAt: BASE_TIME + 10 });
    expect((await repo.getFolderDetail(folder.id)).name).toBe('Renamed');
    expect((await repo.getAllFolders())[0].name).toBe('Renamed');

    await repo.updateFolder('missing-folder', { name: 'Recovered' });
    const recovered = await repo.getFolderDetail('missing-folder');
    expect(recovered.name).toBe('Recovered');
    expect(await repo.getAllFolders()).toHaveLength(2);

    await repo.updateFolder(folder.id, { ...folder, deletedAt: BASE_TIME + 20, updatedAt: BASE_TIME + 20 });
    expect(await repo.getFolders()).toHaveLength(1);
    expect(await repo.getDeletedFolders()).toHaveLength(1);

    await repo.deleteFolder(folder.id);
    expect(await repo.getAllFolders()).toHaveLength(1);
  });

  it('persists active folder', async () => {
    expect(await repo.getActiveFolder()).toBeNull();
    await repo.setActiveFolder('folder-1');
    expect(await repo.getActiveFolder()).toBe('folder-1');
  });
});

describe('LocalForageRepository notes', () => {
  let repo: LocalForageRepository;

  beforeEach(async () => {
    await clearStorage();
    repo = new LocalForageRepository();
  });

  it('creates, filters, updates and deletes notes', async () => {
    await repo.createNote(makeNote());
    await repo.createNote(makeNote({ id: 'note-2', folderId: 'folder-2', content: 'Other' }));
    await repo.createNote(makeNote({ id: 'note-trash', deletedAt: BASE_TIME + 1 }));

    expect(await repo.getAllNotes()).toHaveLength(3);
    expect(await repo.getNotes('folder-1')).toHaveLength(1);
    expect(await repo.getNotes('')).toHaveLength(2);
    expect(await repo.getDeletedNotes()).toHaveLength(1);

    const withContent = await repo.getNotesWithContent('folder-1');
    expect(withContent[0].content).toContain('First note');

    await repo.updateNote('note-1', { content: 'Updated', updatedAt: BASE_TIME + 5 });
    expect((await repo.getNoteDetail('note-1')).content).toBe('Updated');

    await repo.updateNote('missing-note', { content: 'Recovered' });
    expect((await repo.getNoteDetail('missing-note')).content).toBe('Recovered');

    await repo.deleteNote('note-2');
    expect(await repo.getAllNotes()).toHaveLength(3);
  });

  it('invalidates the note cache after every mutation', async () => {
    expect(await repo.getAllNotes()).toEqual([]);
    await repo.createNote(makeNote());
    expect(await repo.getAllNotes()).toHaveLength(1);

    const raw = JSON.parse((await localForage.getItem('notes')) as string);
    raw.push(makeNote({ id: 'external-note' }));
    await localForage.setItem('notes', JSON.stringify(raw));
    expect(await repo.getAllNotes()).toHaveLength(1);

    await repo.updateNote('note-1', { content: 'fresh' });
    expect(await repo.getAllNotes()).toHaveLength(2);
  });

  it('persists active note and sort order', async () => {
    expect(await repo.getActiveNote()).toBeNull();
    await repo.setActiveNote('note-1');
    expect(await repo.getActiveNote()).toBe('note-1');

    expect(await repo.getSortNote()).toBe('createdAt');
    await repo.setSortNote('updatedAt');
    expect(await repo.getSortNote()).toBe('updatedAt');
    await expect(repo.setSortNote('createdAt')).resolves.toBe('createdAt');
  });

  it('keeps note history bounded by day and per-day limits', async () => {
    const sameDay = Array.from({ length: 8 }, (_, index) => ({
      id: `snap-${index}`,
      content: `content-${index}`,
      snapshotAt: BASE_TIME + index,
    }));

    let history: any[] = [];
    for (const snapshot of sameDay) {
      history = await repo.addNoteHistorySnapshot('note-1', snapshot, 3, 5);
    }
    expect(history).toHaveLength(5);
    expect(history.map((item) => item.id)).toEqual([
      'snap-7', 'snap-6', 'snap-5', 'snap-4', 'snap-3',
    ]);

    const olderDays = [
      { id: 'day-old-1', content: 'a', snapshotAt: BASE_TIME - DAY },
      { id: 'day-old-2', content: 'b', snapshotAt: BASE_TIME - DAY * 2 },
      { id: 'day-old-3', content: 'c', snapshotAt: BASE_TIME - DAY * 3 },
    ];
    for (const snapshot of olderDays) {
      history = await repo.addNoteHistorySnapshot('note-1', snapshot, 3, 5);
    }
    expect(new Set(history.map((item) => new Date(item.snapshotAt * 1000).getDate())).size).toBeLessThanOrEqual(3);

    const filtered = await repo.deleteNoteHistorySnapshot('note-1', history[0].id);
    expect(filtered).toHaveLength(history.length - 1);
  });
});

describe('LocalForageRepository tags and note-tags', () => {
  let repo: LocalForageRepository;

  beforeEach(async () => {
    await clearStorage();
    repo = new LocalForageRepository();
  });

  it('creates, updates and filters tags', async () => {
    await repo.createTag(makeTag());
    await repo.createTag(makeTag({ id: 'tag-2', name: 'Later', deletedAt: BASE_TIME + 1 }));

    expect(await repo.getAllTags()).toHaveLength(2);
    expect(await repo.getTags()).toHaveLength(1);
    expect(await repo.getTagDetail('tag-1')).toMatchObject({ name: 'Ideas' });

    await repo.updateTag('tag-1', { name: 'Renamed' });
    expect((await repo.getTagDetail('tag-1')).name).toBe('Renamed');
    await repo.updateTag('missing-tag', { name: 'Recovered' });
    expect(await repo.getTagDetail('missing-tag')).toMatchObject({ name: 'Recovered' });
  });

  it('creates, updates and filters note-tag links', async () => {
    await repo.createNoteTag(makeNoteTag());
    await repo.createNoteTag(makeNoteTag({ id: 'note-1:tag-2', tagId: 'tag-2' }));
    await repo.createNoteTag(makeNoteTag({ id: 'note-1:tag-3', tagId: 'tag-3', deletedAt: BASE_TIME + 1 }));

    expect(await repo.getAllNoteTags()).toHaveLength(3);
    expect(await repo.getNoteTagsByNote('note-1')).toHaveLength(2);
    expect(await repo.getNoteTagsByTag('tag-1')).toHaveLength(1);

    const updated = await repo.updateNoteTag('note-1:tag-1', { deletedAt: BASE_TIME + 10, updatedAt: BASE_TIME + 10 });
    expect(updated.deletedAt).toBe(BASE_TIME + 10);
    await repo.updateNoteTag('missing-note-tag', { noteId: 'note-9' });
    expect(await repo.getAllNoteTags()).toHaveLength(4);
  });
});

describe('LocalForageRepository settings, security and sync metadata', () => {
  let repo: LocalForageRepository;

  beforeEach(async () => {
    await clearStorage();
    repo = new LocalForageRepository();
  });

  it('encrypts sensitive settings at rest and decrypts them on read', async () => {
    const settings = {
      general: { lang: 'vi' },
      sync: { adapter: 'Turso', configuration: '{"url":"libsql://secret"}' },
      imageSync: { s3AccessKey: 'AKIA', s3SecretKey: 'shh', s3Bucket: 'notes' },
    };

    await repo.setSettings(settings);
    const raw = JSON.parse((await localForage.getItem('settings')) as string);
    expect(raw.general).toEqual({ lang: 'vi' });
    expect(raw.sync.adapter).toBe('Turso');
    expect(raw.sync.configuration).not.toContain('libsql');
    expect(raw.imageSync.s3AccessKey).not.toBe('AKIA');
    expect(raw.encryptedFields).toEqual([
      'sync.configuration',
      'imageSync.s3AccessKey',
      'imageSync.s3SecretKey',
    ]);

    expect(await repo.getSettings()).toEqual(settings);
    expect(await repo.get('settingsEncryptionKey')).toBeTruthy();
  });

  it('returns plain settings when nothing is encrypted', async () => {
    await localForage.setItem('settings', JSON.stringify({ general: { lang: 'en' } }));
    expect(await repo.getSettings()).toEqual({ general: { lang: 'en' } });
  });

  it('handles corrupt encrypted settings without losing general settings', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await localForage.setItem('settingsEncryptionKey', 'key');
    await localForage.setItem('settings', JSON.stringify({
      general: { lang: 'ru' },
      sync: { configuration: 'not-hex' },
      encryptedFields: ['sync.configuration'],
    }));
    expect(await repo.getSettings()).toEqual({
      general: { lang: 'ru' },
      sync: { configuration: 'not-hex' },
    });
    expect(warn).toHaveBeenCalled();
  });

  it('manages password, backup, last pull, action object and import data', async () => {
    expect(await repo.checkPasswordExist()).toBe(false);
    expect(await repo.getPassword()).toBe('');
    await repo.setPassword('hashed');
    expect(await repo.checkPasswordExist()).toBe(true);
    expect(await repo.getPassword()).toBe('hashed');

    expect(await repo.getPasswordChangeBackup()).toBeNull();
    await repo.savePasswordChangeBackup({ phase: 1 });
    expect(await repo.getPasswordChangeBackup()).toEqual({ phase: 1 });
    await repo.clearPasswordChangeBackup();
    expect(await repo.getPasswordChangeBackup()).toBeNull();

    expect(await repo.getLastPull()).toBe(0);
    await repo.updateLastPull(BASE_TIME);
    expect(await repo.getLastPull()).toBe(BASE_TIME);

    expect(await repo.getActionObject()).toEqual({});
    await repo.saveActionObject({ 'note-1': 'note' });
    expect(await repo.getActionObject()).toEqual({ 'note-1': 'note' });

    expect(await repo.getImportData()).toEqual({});
    await repo.setImportData({ folders: [] });
    expect(await repo.getImportData()).toEqual({ folders: [] });
  });

  it('exports, saves and imports an AES key', async () => {
    const generated = await repo.generateAESKey();
    const serialized = await repo.saveAESKey(generated);
    expect(JSON.parse(serialized).kty).toBe('oct');
    const loaded = await repo.getAESKey();
    expect(loaded).not.toBeNull();
    expect(loaded?.type).toBe('secret');
    expect(await repo.getAESKey()).toBeTruthy();
  });

  it('detects first init and cleans all data', async () => {
    expect(await repo.checkIsFirstInit()).toBe(true);
    await repo.createNote(makeNote());
    expect(await repo.checkIsFirstInit()).toBe(false);

    await repo.cleanData();
    expect(await repo.checkIsFirstInit()).toBe(true);
    expect(await repo.getAllNotes()).toEqual([]);
    expect(await repo.getAllFolders()).toEqual([]);
  });
});
