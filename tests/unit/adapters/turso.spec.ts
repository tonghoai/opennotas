import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const state = {
    selectResults: [] as any[][],
    select: vi.fn(),
    from: vi.fn(),
    where: vi.fn(),
    all: vi.fn(),
    insert: vi.fn(),
    values: vi.fn(),
    onConflictDoUpdate: vi.fn(),
    returning: vi.fn(),
    createClient: vi.fn(),
    drizzle: vi.fn(),
    applyMigrations: vi.fn(),
    db: null as any,
  };
  return state;
});

vi.mock('@libsql/client/web', () => ({ createClient: mocks.createClient }));
vi.mock('drizzle-orm/libsql', () => ({
  LibSQLDatabase: class {},
  drizzle: mocks.drizzle,
}));
vi.mock('~/migrate/scripts/apply-migrations', () => ({
  applySchemaMigrations: mocks.applyMigrations,
}));

type AdapterModule = typeof import('~/adapter/turso');
let TursoAdapter: AdapterModule['default'];

function setupDb() {
  mocks.all.mockImplementation(() => Promise.resolve(mocks.selectResults.shift() || []));
  mocks.where.mockReturnValue({ all: mocks.all });
  mocks.from.mockReturnValue({ where: mocks.where });
  mocks.select.mockReturnValue({ from: mocks.from });

  mocks.returning.mockResolvedValue([{ id: 'row-1' }]);
  mocks.onConflictDoUpdate.mockReturnValue({ returning: mocks.returning });
  mocks.values.mockReturnValue({ onConflictDoUpdate: mocks.onConflictDoUpdate });
  mocks.insert.mockReturnValue({ values: mocks.values });
  mocks.db = { select: mocks.select, insert: mocks.insert };
  mocks.drizzle.mockReturnValue(mocks.db);
  mocks.createClient.mockReturnValue({ client: true });
  mocks.applyMigrations.mockResolvedValue(undefined);
}

describe('TursoAdapter', () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    mocks.selectResults = [];
    setupDb();
    TursoAdapter = (await import('~/adapter/turso')).default;
  });

  it('creates the client from JSON config and runs migrations', async () => {
    const config = { url: 'libsql://db', authToken: 'token' };
    new TursoAdapter(JSON.stringify(config));
    expect(mocks.createClient).toHaveBeenCalledWith(config);
    expect(mocks.applyMigrations).toHaveBeenCalledWith({ client: true });
    await Promise.resolve();
  });

  it('rejects malformed configuration JSON', () => {
    expect(() => new TursoAdapter('{nope')).toThrow();
  });

  it('pulls and maps folders, notes, tags and note-tags', async () => {
    mocks.selectResults = [
      [{ id: 'f', name: 'Work', lastSync: 1, createdAt: 2, updatedAt: 3, deletedAt: 0 }],
      [{
        id: 'n',
        folderId: 'f',
        previousFolderId: null,
        content: 'cipher',
        isLocked: 1,
        isPinned: 0,
        lastSync: 1,
        createdAt: 2,
        updatedAt: 3,
        deletedAt: null,
        deleteCompletelyAt: null,
      }],
      [{ id: 't', name: 'Tag', color: '#fff', lastSync: 1, createdAt: 2, updatedAt: 3, deletedAt: null }],
      [{ id: 'nt', noteId: 'n', tagId: 't', lastSync: 1, createdAt: 2, updatedAt: 3, deletedAt: null }],
      [{ id: 'settings', password: 'hash', lastSync: 1, updatedAt: 3 }],
    ];
    const adapter = new TursoAdapter('{}');

    await expect(adapter.pullFolders(0)).resolves.toEqual([
      { id: 'f', name: 'Work', lastSync: 1, createdAt: 2, updatedAt: 3, deletedAt: null },
    ]);
    await expect(adapter.pullNotes(0)).resolves.toEqual([
      expect.objectContaining({ id: 'n', folderId: 'f', content: 'cipher', isLocked: 1, isPinned: 0 }),
    ]);
    await expect(adapter.pullTags(0)).resolves.toEqual([
      { id: 't', name: 'Tag', color: '#fff', lastSync: 1, createdAt: 2, updatedAt: 3, deletedAt: null },
    ]);
    await expect(adapter.pullNoteTags(0)).resolves.toEqual([
      expect.objectContaining({ id: 'nt', noteId: 'n', tagId: 't' }),
    ]);
    await expect(adapter.pullSettings(0)).resolves.toEqual({
      id: 'settings', password: 'hash', lastSync: 1, updatedAt: 3,
    });
  });

  it('pushes records through insert/upsert with the mapped columns', async () => {
    const adapter = new TursoAdapter('{}');
    await adapter.pushFolder({ id: 'f', name: 'Work', lastSync: 1, createdAt: 2, updatedAt: 3, deletedAt: null });
    expect(mocks.values).toHaveBeenCalledWith({
      id: 'f', name: 'Work', lastSync: 1, createdAt: 2, updatedAt: 3, deletedAt: null,
    });
    expect(mocks.onConflictDoUpdate).toHaveBeenCalledWith(expect.objectContaining({
      target: expect.anything(),
      set: expect.objectContaining({ name: 'Work' }),
    }));

    await adapter.pushNote({
      id: 'n', folderId: 'f', content: 'cipher', isLocked: 1, isPinned: 0,
      lastSync: 1, createdAt: 2, updatedAt: 3, deletedAt: null, deleteCompletelyAt: null,
    });
    expect(mocks.values).toHaveBeenLastCalledWith(expect.objectContaining({
      id: 'n', folderId: 'f', previousFolderId: null, content: 'cipher',
    }));

    await adapter.pushTag({ id: 't', name: 'Tag', color: '#fff', lastSync: 1, createdAt: 2, updatedAt: 3, deletedAt: null });
    expect(mocks.values).toHaveBeenLastCalledWith(expect.objectContaining({ id: 't', color: '#fff' }));

    await adapter.pushNoteTag({ id: 'nt', noteId: 'n', tagId: 't', lastSync: 1, createdAt: 2, updatedAt: 3, deletedAt: null });
    expect(mocks.values).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'nt', noteId: 'n', tagId: 't' }));

    await adapter.pushSettings({ id: 'settings', password: 'hash', lastSync: 1, updatedAt: 3 });
    expect(mocks.values).toHaveBeenLastCalledWith({ id: 'settings', password: 'hash', lastSync: 1, updatedAt: 3 });
  });

  it('swallows push failures after logging', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    mocks.returning.mockResolvedValueOnce(Promise.reject(new Error('remote')));
    const adapter = new TursoAdapter('{}');
    await expect(adapter.pushFolder({ id: 'f', name: 'x', lastSync: 1, createdAt: 1, updatedAt: 1, deletedAt: null }))
      .resolves.toBeUndefined();
    expect(log).toHaveBeenCalledWith('pushFolder error', expect.any(Error));
  });
});
