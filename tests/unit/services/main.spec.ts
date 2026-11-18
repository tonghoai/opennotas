import { beforeEach, describe, expect, it, vi } from 'vitest';
import localForage from 'localforage';
import { BASE_TIME, makeFolder, makeNote, makeTag } from '../helpers/fixtures';
import { generateKey } from '~/utils/encrypt-aes';

type MainService = typeof import('~/services/main');
let service: MainService;

async function loadService() {
  vi.resetModules();
  service = await import('~/services/main');
}

describe('main service', () => {
  beforeEach(async () => {
    await localForage.clear();
    await loadService();
  });

  it('creates folders with defaults and lists the all-notes pseudo folder', async () => {
    const folder = await service.createFolder({ ...makeFolder(), id: 'folder-a', name: 'Alpha' });
    expect(folder.name).toBe('Alpha');

    const folders = await service.getFolders('All notes');
    expect(folders[0]).toMatchObject({ id: '', name: 'All notes' });
    expect(folders[1].name).toBe('Alpha');

    const created = await service.createFolder();
    expect(created.name).toBe('New Folder');
    expect(created.id).toBeTruthy();

    await service.updateFolder('folder-a', { name: 'Renamed' });
    expect((await service.getFolderDetail('folder-a')).name).toBe('Renamed');
    await service.setActiveFolder('folder-a');
    expect(await service.getActiveFolder()).toBe('folder-a');
  });

  it('creates notes with defaults, updates them and exposes active/sort state', async () => {
    const note = await service.createNote('folder-a');
    expect(note).toMatchObject({
      folderId: 'folder-a',
      content: '',
      isLocked: false,
      isPinned: false,
      deletedAt: null,
    });
    expect(note.id).toBeTruthy();

    await service.updateNote(note.id, { content: 'changed', isPinned: true, updatedAt: BASE_TIME + 100 });
    expect((await service.getNoteDetail(note.id)).content).toBe('changed');
    await service.setActiveNote(note.id);
    expect(await service.getActiveNote()).toBe(note.id);

    expect(await service.getSortNote()).toBe('createdAt');
    await service.setSortNote('updatedAt');
    expect(await service.getSortNote()).toBe('updatedAt');
  });

  it('reformats, filters and sorts note lists with tags and locked placeholders', async () => {
    const oldPinned = await service.createNote('folder-a', makeNote({
      id: 'pinned',
      folderId: 'folder-a',
      content: 'Pinned title\nbody',
      isPinned: true,
      createdAt: BASE_TIME,
      updatedAt: BASE_TIME,
    }));
    const older = await service.createNote('folder-a', makeNote({
      id: 'older',
      folderId: 'folder-a',
      content: 'Older title\nbody',
      createdAt: BASE_TIME - 20,
      updatedAt: BASE_TIME - 20,
    }));
    const newer = await service.createNote('folder-a', makeNote({
      id: 'newer',
      folderId: 'folder-a',
      content: '**Newer** [title](https://example.com)\nbody',
      createdAt: BASE_TIME - 10,
      updatedAt: BASE_TIME + 10,
    }));
    const locked = await service.createNote('folder-a', makeNote({
      id: 'locked',
      folderId: 'folder-a',
      content: 'ciphertext',
      title: 'Private title',
      isLocked: true,
      createdAt: BASE_TIME - 30,
      updatedAt: BASE_TIME - 30,
    }));
    await service.createNote('folder-b', makeNote({ id: 'other-folder', folderId: 'folder-b' }));

    const tag = await service.createTag(makeTag({ id: 'tag-a', name: 'Work' }));
    await service.addTagToNote(newer.id, tag.id);

    const byCreated = await service.getNotes('folder-a', 'createdAt', 'Locked', 'Hidden');
    expect(byCreated.map((note: any) => note.id)[0]).toBe(oldPinned.id);
    expect(byCreated.map((note: any) => note.id)).toEqual(['pinned', 'newer', 'older', 'locked']);
    const newerView = byCreated.find((note: any) => note.id === newer.id);
    expect(newerView.title).toBe('Newer title');
    expect(newerView.content).toBe('body');
    expect(newerView.tags).toHaveLength(1);

    const lockedView = byCreated.find((note: any) => note.id === locked.id);
    expect(lockedView.title).toBe('Private title');
    expect(lockedView.content).toBe('Hidden');
    expect(locked.title).toBe('Private title');

    const byUpdated = await service.getNotes('folder-a', 'updatedAt', 'Locked', 'Hidden');
    expect(byUpdated.map((note: any) => note.id)).toEqual(['pinned', 'newer', 'older', 'locked']);
    expect(await service.getNotes('folder-b', 'createdAt', 'Locked', 'Hidden')).toHaveLength(1);
    expect(await service.getNotes('', 'createdAt', 'Locked', 'Hidden')).toHaveLength(5);

    const withContent = await service.getNotesWithContent('folder-a');
    expect(withContent.find((item: any) => item.id === newer.id)?.content).toContain('**Newer**');
    expect(await service.getAllNotes()).toHaveLength(5);
    expect(await service.getNoteDetail(older.id)).toMatchObject({ content: 'Older title\nbody' });
  });

  it('handles deleted notes separately', async () => {
    await service.createNote('folder-a', makeNote({ id: 'active' }));
    await service.createNote('folder-a', makeNote({
      id: 'trashed',
      content: 'Trash title\nbody',
      deletedAt: BASE_TIME + 10,
    }));
    await service.createNote('folder-a', makeNote({
      id: 'gone',
      content: 'Gone title',
      deletedAt: BASE_TIME + 20,
      deleteCompletelyAt: BASE_TIME + 30,
    }));

    const deleted = await service.getDeletedNotes('Locked', 'Hidden');
    expect(deleted).toHaveLength(1);
    expect(deleted[0].title).toBe('Trash title');
  });

  it('creates, updates, filters and soft-deletes tags and note-tag links', async () => {
    const noteA = await service.createNote('folder-a', makeNote({ id: 'note-a' }));
    const noteB = await service.createNote('folder-a', makeNote({ id: 'note-b' }));
    const tag = await service.createTag(makeTag({ id: 'tag-a', name: 'Work' }));
    const autoTag = await service.createTag();
    expect(autoTag.name).toBe('New Tag');

    const link = await service.addTagToNote(noteA.id, tag.id);
    expect(link.id).toBe('note-a:tag-a');
    await service.addTagToNote(noteB.id, tag.id);

    expect(await service.getTags()).toHaveLength(2);
    expect(await service.getAllTags()).toHaveLength(2);
    expect(await service.getTagsForNote(noteA.id)).toHaveLength(1);
    expect(await service.getNoteTagsByNote(noteA.id)).toHaveLength(1);
    expect(await service.getNoteTagsByTag(tag.id)).toHaveLength(2);
    expect(await service.getNoteTagDetail(link.id)).toMatchObject({ noteId: noteA.id, tagId: tag.id });
    expect(await service.getNoteCountsByTag()).toEqual({ [tag.id]: 2 });

    const tagNotes = await service.getNotesForTag(tag.id, 'createdAt', 'Locked', 'Hidden');
    expect(tagNotes.map((note: any) => note.id).sort()).toEqual(['note-a', 'note-b']);

    await service.updateTag(tag.id, { name: 'Renamed', color: '#000000' });
    expect(await service.getTagDetail(tag.id)).toMatchObject({ name: 'Renamed', color: '#000000' });

    await service.removeTagFromNote(noteA.id, tag.id);
    expect(await service.getNoteTagsByNote(noteA.id)).toHaveLength(0);

    await service.deleteTag(tag.id);
    const deletedTag = await service.getTagDetail(tag.id);
    expect(deletedTag.deletedAt).toBeTruthy();
    expect(await service.getTags()).toHaveLength(1);
    expect(await service.getNoteTagsByTag(tag.id)).toHaveLength(0);
  });

  it('persists settings and all metadata stores', async () => {
    expect(await service.getSettings()).toEqual({});
    await service.setSettings({ general: { lang: 'vi' }, sync: { configuration: 'secret' } });
    expect(await service.getSettings()).toMatchObject({ general: { lang: 'vi' }, sync: { configuration: 'secret' } });

    await service.saveActionObject({ 'note-1': 'note' });
    expect(await service.getActionObject()).toEqual({ 'note-1': 'note' });

    await service.setImportData({ folders: [] });
    expect(await service.getImportData()).toEqual({ folders: [] });

    await service.updateLastPull(BASE_TIME);
    expect(await service.getLastPull()).toBe(BASE_TIME);
    await service.updateLastPull((BASE_TIME + 10) * 1000);
    expect(await service.getLastPull()).toBe(BASE_TIME + 10);

    expect(await service.getColsWidth()).toEqual({ colsFoldersWidth: 234, colsNotesWidth: 400 });
    await service.setColsWidth({ colsFoldersWidth: 300, colsNotesWidth: 500 });
    expect(await service.getColsWidth()).toEqual({ colsFoldersWidth: 300, colsNotesWidth: 500 });

    expect(await service.checkIsInstalledApp()).toBe(false);
    await service.setInstalledApp();
    expect(await service.checkIsInstalledApp()).toBe(true);
  });

  it('manages password, password-change backup and E2EE keys', async () => {
    expect(await service.checkPasswordExist()).toBe(false);
    expect(await service.getPassword()).toBe('');
    await service.setPassword('hash');
    expect(await service.checkPasswordExist()).toBe(true);
    expect(await service.getPassword()).toBe('hash');

    expect(await service.getPasswordChangeBackup()).toBeNull();
    await service.savePasswordChangeBackup({ phase: 2 });
    expect(await service.getPasswordChangeBackup()).toEqual({ phase: 2 });
    await service.clearPasswordChangeBackup();
    expect(await service.getPasswordChangeBackup()).toBeNull();

    const key = await generateKey();
    await service.saveE2EEKey(key);
    expect(await service.getE2EEKey()).not.toBeNull();
  });

  it('stores note history snapshots and deletes one', async () => {
    expect(await service.getNoteHistory('note-a')).toEqual([]);
    await service.addNoteHistorySnapshot('note-a', 'first');
    const history = await service.addNoteHistorySnapshot('note-a', 'second');
    expect(history).toHaveLength(2);
    expect(history[0].content).toBe('second');
    expect(history[0].snapshotAt).toBeTruthy();

    const filtered = await service.deleteNoteHistorySnapshot('note-a', history[0].id);
    expect(filtered).toHaveLength(1);
  });

  it('detects first init and cleans local data', async () => {
    expect(await service.checkIsFirstInit()).toBe(true);
    await service.setFirstInit();
    expect(await service.checkIsFirstInit()).toBe(false);

    await service.cleanData();
    expect(await service.checkIsFirstInit()).toBe(true);
    expect(await service.getAllNotes()).toEqual([]);
    expect(await service.getAllFolders()).toEqual([]);
  });
});
