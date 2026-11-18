import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { NetworkError, SyncError } from '~/utils/sync-error';
import { encryptDataAES, generateKey } from '~/utils/encrypt-aes';

const mocks = vi.hoisted(() => ({
  createFolder: vi.fn(),
  createNote: vi.fn(),
  getAllFolders: vi.fn(),
  getAllNotes: vi.fn(),
  getAllNoteTags: vi.fn(),
  getAllTags: vi.fn(),
  getFolderDetail: vi.fn(),
  getNoteDetail: vi.fn(),
  getPassword: vi.fn(),
  setPassword: vi.fn(),
  updateFolder: vi.fn(),
  updateNote: vi.fn(),
  getTagDetail: vi.fn(),
  createTag: vi.fn(),
  updateTag: vi.fn(),
  getNoteTagDetail: vi.fn(),
  createNoteTag: vi.fn(),
  updateNoteTag: vi.fn(),
  syncImages: vi.fn(),
  TursoAdapter: vi.fn(),
  DirectoryAdapter: vi.fn(),
}));

vi.mock('~/services/main', () => ({
  createFolder: mocks.createFolder,
  createNote: mocks.createNote,
  getAllFolders: mocks.getAllFolders,
  getAllNotes: mocks.getAllNotes,
  getAllNoteTags: mocks.getAllNoteTags,
  getAllTags: mocks.getAllTags,
  getFolderDetail: mocks.getFolderDetail,
  getNoteDetail: mocks.getNoteDetail,
  getPassword: mocks.getPassword,
  setPassword: mocks.setPassword,
  updateFolder: mocks.updateFolder,
  updateNote: mocks.updateNote,
  getTagDetail: mocks.getTagDetail,
  createTag: mocks.createTag,
  updateTag: mocks.updateTag,
  getNoteTagDetail: mocks.getNoteTagDetail,
  createNoteTag: mocks.createNoteTag,
  updateNoteTag: mocks.updateNoteTag,
}));
vi.mock('~/utils/image-sync', () => ({ syncImages: mocks.syncImages }));
vi.mock('~/adapter/turso', () => ({
  default: class {
    constructor(config: any) {
      mocks.TursoAdapter(config);
    }
  },
}));
vi.mock('~/adapter/directory', () => ({
  DirectoryAdapter: class {
    constructor() {
      mocks.DirectoryAdapter();
    }
  },
}));

type SyncModule = typeof import('~/utils/sync');
let sync: SyncModule;

function refs() {
  return {
    lastPull: ref(0),
    idPulled: ref<string[]>([]),
    actionObject: ref<Record<string, string>>({}),
    isPasswordExist: ref(false),
    activeNoteId: ref(''),
  };
}

function fakeAdapter(overrides: Record<string, any> = {}) {
  return {
    pullFolders: vi.fn().mockResolvedValue([]),
    pullNotes: vi.fn().mockResolvedValue([]),
    pullTags: vi.fn().mockResolvedValue([]),
    pullNoteTags: vi.fn().mockResolvedValue([]),
    pullSettings: vi.fn().mockResolvedValue({}),
    pushFolder: vi.fn().mockResolvedValue({}),
    pushNote: vi.fn().mockResolvedValue({}),
    pushTag: vi.fn().mockResolvedValue({}),
    pushNoteTag: vi.fn().mockResolvedValue({}),
    pushSettings: vi.fn().mockResolvedValue({}),
    commitSync: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('sync', () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    sync = await import('~/utils/sync');
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
    mocks.getAllFolders.mockResolvedValue([]);
    mocks.getAllNotes.mockResolvedValue([]);
    mocks.getAllTags.mockResolvedValue([]);
    mocks.getAllNoteTags.mockResolvedValue([]);
    mocks.getFolderDetail.mockResolvedValue({});
    mocks.getNoteDetail.mockResolvedValue({});
    mocks.getTagDetail.mockResolvedValue({});
    mocks.getNoteTagDetail.mockResolvedValue({});
    mocks.getPassword.mockResolvedValue('');
    mocks.syncImages.mockResolvedValue({ success: true, synced: 0, failed: 0, total: 0 });
  });

  it('identifies local adapters and builds stable cache keys', () => {
    expect(sync.isLocalAdapter()).toBe(true);
    expect(sync.isLocalAdapter('LocalForage')).toBe(true);
    expect(sync.isLocalAdapter('SqliteDirectory')).toBe(true);
    expect(sync.isLocalAdapter('Turso')).toBe(false);
    expect(sync.adapterCacheKey('Turso', '{"url":"x"}')).toBe('Turso:{"url":"x"}');
    expect(sync.adapterCacheKey('Turso', { url: 'x' })).toBe('Turso:{"url":"x"}');
    expect(sync.adapterCacheKey('Turso', null)).toBe('Turso:{}');
  });

  it('creates adapters and maps errors', async () => {
    await expect(sync.createSyncAdapter('LocalForage', {})).resolves.toBeInstanceOf(
      (await import('~/adapter/localforage')).default,
    );
    await expect(sync.createSyncAdapter('Unknown', {})).rejects.toMatchObject({ name: 'SyncError' });
    await expect(sync.createSyncAdapter('Turso', {}, false)).rejects.toMatchObject({ name: 'NetworkError' });
    await expect(sync.createSyncAdapter('Turso', { url: 'x' }, true)).resolves.toBeTruthy();
    expect(mocks.TursoAdapter).toHaveBeenCalledWith({ url: 'x' });
    await expect(sync.createSyncAdapter('SqliteDirectory', {}, true)).resolves.toBeTruthy();
    expect(mocks.DirectoryAdapter).toHaveBeenCalled();
  });

  it('skips pull for the LocalForage adapter', async () => {
    const r = refs();
    await expect(sync.pullData({ sync: { adapter: 'LocalForage' } }, undefined, 0, r.lastPull, r.idPulled, r.actionObject, r.isPasswordExist, r.activeNoteId))
      .resolves.toEqual({ ok: false });
  });

  it('pulls folders, notes, tags, note-tags and settings with decryption', async () => {
    const key = await generateKey();
    const encrypted = await encryptDataAES('Secret body', key);
    const adapter = fakeAdapter({
      pullFolders: vi.fn().mockResolvedValue([{ id: 'folder-1', updatedAt: 5, lastSync: 10 }]),
      pullNotes: vi.fn().mockResolvedValue([{ id: 'note-1', content: encrypted, updatedAt: 20, lastSync: 10 }]),
      pullTags: vi.fn().mockResolvedValue([{ id: 'tag-1', updatedAt: 6, lastSync: 10 }]),
      pullNoteTags: vi.fn().mockResolvedValue([{ id: 'note-1:tag-1', updatedAt: 7, lastSync: 10 }]),
      pullSettings: vi.fn().mockResolvedValue({ password: 'hashed', updatedAt: 30, lastSync: 10 }),
    });
    const r = refs();
    r.activeNoteId.value = 'note-1';

    const result = await sync.pullData(
      { sync: { adapter: 'Turso' } },
      key,
      0,
      r.lastPull,
      r.idPulled,
      r.actionObject,
      r.isPasswordExist,
      r.activeNoteId,
      adapter,
    );

    expect(result).toMatchObject({ ok: true, needReloadActiveNote: true });
    expect(mocks.createFolder).toHaveBeenCalledWith(expect.objectContaining({ id: 'folder-1' }));
    expect(mocks.createNote).toHaveBeenCalledWith('', expect.objectContaining({ id: 'note-1', content: 'Secret body' }));
    expect(mocks.createTag).toHaveBeenCalledWith(expect.objectContaining({ id: 'tag-1' }));
    expect(mocks.createNoteTag).toHaveBeenCalledWith(expect.objectContaining({ id: 'note-1:tag-1' }));
    expect(mocks.setPassword).toHaveBeenCalledWith('hashed');
    expect(r.isPasswordExist.value).toBe(true);
    expect(r.lastPull.value).toBe(30);
    expect(r.idPulled.value).toEqual(['folder-1', 'note-1']);
  });

  it('updates existing records only when the remote timestamp is newer', async () => {
    const key = await generateKey();
    const adapter = fakeAdapter({
      pullFolders: vi.fn().mockResolvedValue([{ id: 'folder-1', updatedAt: 20, lastSync: 10 }]),
      pullNotes: vi.fn().mockResolvedValue([{ id: 'note-1', content: await encryptDataAES('new', key), updatedAt: 20, lastSync: 10 }]),
      pullTags: vi.fn().mockResolvedValue([{ id: 'tag-1', updatedAt: 20, lastSync: 10 }]),
      pullNoteTags: vi.fn().mockResolvedValue([{ id: 'nt-1', updatedAt: 20, lastSync: 10 }]),
    });
    mocks.getFolderDetail.mockResolvedValue({ id: 'folder-1', updatedAt: 30 });
    mocks.getNoteDetail.mockResolvedValue({ id: 'note-1', updatedAt: 30, content: 'local' });
    mocks.getTagDetail.mockResolvedValue({ id: 'tag-1', updatedAt: 30 });
    mocks.getNoteTagDetail.mockResolvedValue({ id: 'nt-1', updatedAt: 30 });
    const r = refs();

    await sync.pullData({ sync: { adapter: 'Turso' } }, key, 0, r.lastPull, r.idPulled, r.actionObject, r.isPasswordExist, r.activeNoteId, adapter);

    expect(mocks.updateFolder).toHaveBeenCalledWith('folder-1', expect.objectContaining({ updatedAt: 30 }));
    expect(mocks.updateNote).toHaveBeenCalledWith('note-1', expect.objectContaining({ updatedAt: 30 }));
    expect(mocks.updateTag).toHaveBeenCalledWith('tag-1', expect.objectContaining({ updatedAt: 30 }));
    expect(mocks.updateNoteTag).toHaveBeenCalledWith('nt-1', expect.objectContaining({ updatedAt: 30 }));
  });

  it('merges concurrent edits for notes in the action object', async () => {
    const key = await generateKey();
    const adapter = fakeAdapter({
      pullNotes: vi.fn().mockResolvedValue([{
        id: 'note-1',
        content: await encryptDataAES('remote', key),
        updatedAt: 20,
        lastSync: 10,
      }]),
    });
    mocks.getNoteDetail.mockResolvedValue({ id: 'note-1', updatedAt: 5, content: 'local' });
    const r = refs();
    r.actionObject.value = { 'note-1': 'note' };

    await sync.pullData({ sync: { adapter: 'Turso' } }, key, 0, r.lastPull, r.idPulled, r.actionObject, r.isPasswordExist, r.activeNoteId, adapter);

    expect(mocks.updateNote).toHaveBeenCalledWith('note-1', expect.objectContaining({
      content: expect.stringContaining('local'),
      updatedAt: expect.any(Number),
    }));
  });

  it('filters out stale remote records and returns ok false when nothing changed', async () => {
    const adapter = fakeAdapter({
      pullFolders: vi.fn().mockResolvedValue([{ id: 'old', lastSync: 5, updatedAt: 5 }]),
      pullNotes: vi.fn().mockResolvedValue([{ id: 'old-note', lastSync: 5, updatedAt: 5 }]),
    });
    const r = refs();
    const result = await sync.pullData({ sync: { adapter: 'Turso' } }, undefined, 10, r.lastPull, r.idPulled, r.actionObject, r.isPasswordExist, r.activeNoteId, adapter);
    expect(result.ok).toBe(false);
    expect(mocks.createFolder).not.toHaveBeenCalled();
    expect(mocks.createNote).not.toHaveBeenCalled();
  });

  it('propagates pull errors', async () => {
    const adapter = fakeAdapter({ pullFolders: vi.fn().mockRejectedValue(new Error('network')) });
    const r = refs();
    await expect(sync.pullData({ sync: { adapter: 'Turso' } }, undefined, 0, r.lastPull, r.idPulled, r.actionObject, r.isPasswordExist, r.activeNoteId, adapter))
      .rejects.toThrow('network');
  });

  it('pushes action objects, encrypting note content and syncing images', async () => {
    const key = await generateKey();
    mocks.getFolderDetail.mockResolvedValue({ id: 'f', updatedAt: 1 });
    mocks.getNoteDetail.mockResolvedValue({ id: 'n', updatedAt: 1, content: 'plain text' });
    mocks.getTagDetail.mockResolvedValue({ id: 't', updatedAt: 1 });
    mocks.getNoteTagDetail.mockResolvedValue({ id: 'nt', updatedAt: 1 });
    mocks.getPassword.mockResolvedValue('hash');
    const adapter = fakeAdapter();
    const r = refs();
    r.actionObject.value = { f: 'folder', n: 'note', s: 'settings', t: 'tag', nt: 'noteTag' };

    const pushed = await sync.pushData({ sync: { adapter: 'Turso' } }, key, r.actionObject, ref(0), 100, adapter);

    expect(pushed).toEqual(['f', 'n', 's', 't', 'nt']);
    expect(adapter.pushFolder).toHaveBeenCalledWith(expect.objectContaining({ id: 'f', lastSync: 100 }));
    expect(adapter.pushNote).toHaveBeenCalledWith(expect.objectContaining({
      id: 'n',
      lastSync: 100,
      content: expect.not.stringContaining('plain text'),
    }));
    expect(adapter.pushSettings).toHaveBeenCalledWith(expect.objectContaining({ password: 'hash', id: 'settings' }));
    expect(adapter.pushTag).toHaveBeenCalledWith(expect.objectContaining({ id: 't' }));
    expect(adapter.pushNoteTag).toHaveBeenCalledWith(expect.objectContaining({ id: 'nt' }));
    expect(mocks.syncImages).toHaveBeenCalledOnce();
  });

  it('skips remote push for LocalForage but still syncs images', async () => {
    const r = refs();
    const pushed = await sync.pushData({ sync: { adapter: 'LocalForage' } }, undefined, r.actionObject, ref(0), 100);
    expect(pushed).toEqual([]);
    expect(mocks.syncImages).toHaveBeenCalledOnce();
  });

  it('seeds a remote adapter from local records', async () => {
    const key = await generateKey();
    mocks.getAllFolders.mockResolvedValue([{ id: 'f' }]);
    mocks.getAllNotes.mockResolvedValue([{ id: 'n' }]);
    mocks.getNoteDetail.mockResolvedValue({ id: 'n', content: 'note', updatedAt: 1 });
    mocks.getAllTags.mockResolvedValue([{ id: 't' }]);
    mocks.getAllNoteTags.mockResolvedValue([{ id: 'nt' }]);
    mocks.getPassword.mockResolvedValue('hash');
    const adapter = fakeAdapter();

    const timestamp = await sync.seedAdapterFromLocal(adapter, key);

    expect(timestamp).toEqual(expect.any(Number));
    expect(adapter.pushFolder).toHaveBeenCalledWith(expect.objectContaining({ id: 'f', lastSync: timestamp }));
    expect(adapter.pushNote).toHaveBeenCalledWith(expect.objectContaining({
      id: 'n',
      lastSync: timestamp,
      content: expect.not.stringContaining('note'),
    }));
    expect(adapter.pushTag).toHaveBeenCalledWith(expect.objectContaining({ id: 't', lastSync: timestamp }));
    expect(adapter.pushNoteTag).toHaveBeenCalledWith(expect.objectContaining({ id: 'nt', lastSync: timestamp }));
    expect(adapter.pushSettings).toHaveBeenCalledWith(expect.objectContaining({ password: 'hash', lastSync: timestamp }));
    expect(adapter.commitSync).toHaveBeenCalledOnce();
  });
});
