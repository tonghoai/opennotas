import type NotasAdapter from '../adapter';
import type { FolderType, NoteType, TagType, NoteTagType } from '~/repositories/storage.type';

import SqliteWorkerClient from './client';
import {
  createOplogHeader,
  encodeOplogFrame,
  parseOplog,
  maxFrameSeq,
  type OplogFrame,
} from './oplog';
import {
  BASE_FILE,
  OPLOG_FILE,
  BACKUP_FILE,
  loadDirectoryHandle,
  queryDirectoryPermission,
  getFileHandleSafe,
  getOrCreateFileHandle,
  readFileBytes,
  writeFileBytes,
  appendFileBytes,
} from '~/utils/directory-fs';
import { applySchemaMigrations, CURRENT_SCHEMA_VERSION } from '~/migrate/scripts/apply-migrations';
import { encryptData } from '~/utils/encrypt';
import { getPassword } from '~/services/main';
import { nowUnix } from '~/utils/datetime';

const LOCK_NAME = 'opennotas-directory-sqlite';
const OPLOG_COMPACT_BYTES = 1_500_000;
const OPLOG_COMPACT_AGE_MS = 10 * 60 * 1000;

const TABLE_COLUMNS: Record<string, string[]> = {
  folders: ['id', 'name', 'lastSync', 'createdAt', 'updatedAt', 'deletedAt'],
  notes: [
    'id', 'folderId', 'previousFolderId', 'content', 'isPinned', 'isLocked',
    'lastSync', 'createdAt', 'updatedAt', 'deletedAt', 'deleteCompletelyAt',
  ],
  tags: ['id', 'name', 'color', 'lastSync', 'createdAt', 'updatedAt', 'deletedAt'],
  note_tags: ['id', 'noteId', 'tagId', 'lastSync', 'createdAt', 'updatedAt', 'deletedAt'],
  settings: ['id', 'password', 'lastSync', 'updatedAt', 'schemaVersion'],
  local_meta: ['key', 'value'],
};

class DirectoryAdapterError extends Error {
  className = 'error';
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'DirectoryAdapterError';
    this.code = code;
  }
}

function toInteger(value: any): any {
  if (value === true) return 1;
  if (value === false) return 0;
  return value === undefined ? null : value;
}

function normalizeRow(row: any): Record<string, any> {
  const normalized: Record<string, any> = {};
  for (const [key, value] of Object.entries(row || {})) {
    normalized[key] = toInteger(value);
  }
  return normalized;
}

function sortFrames(frames: OplogFrame[]): OplogFrame[] {
  return [...frames].sort((a, b) => a.seq - b.seq);
}

class DirectoryAdapter implements NotasAdapter {
  private worker: SqliteWorkerClient | null = null;
  private directoryHandle: FileSystemDirectoryHandle | null = null;
  private baseHandle: FileSystemFileHandle | null = null;
  private oplogHandle: FileSystemFileHandle | null = null;
  private backupHandle: FileSystemFileHandle | null = null;

  private sessionActive = false;
  private sessionLoading: Promise<void> | null = null;
  private lockRelease: (() => void) | null = null;
  private baseMtime = 0;
  private oplogMtime = 0;
  private baseExists = false;
  private oplogExists = false;
  private generation = 1;
  private nextSeq = 1;
  private pendingFrames: OplogFrame[] = [];
  private oplogBytes = 0;
  private lastCompactAt = 0;
  private needsCompaction = false;
  private needsOplogReset = false;
  private disposed = false;

  private async acquireLock(): Promise<void> {
    const locks = (navigator as any).locks;
    if (!locks?.request) return;

    let resolveAcquired: ((release: (() => void) | null) => void) | null = null;
    const acquired = new Promise<(() => void) | null>((resolve) => {
      resolveAcquired = resolve;
    });

    locks.request(LOCK_NAME, { mode: 'exclusive', ifAvailable: true }, async (lock: any) => {
      if (!lock) {
        resolveAcquired?.(null);
        return;
      }

      let releaseLock: (() => void) | null = null;
      const released = new Promise<void>((resolve) => { releaseLock = resolve; });
      resolveAcquired?.(releaseLock);
      await released;
    });

    const release = await acquired;
    if (!release) {
      throw new DirectoryAdapterError('DIRECTORY_BUSY', 'The OpenNotas folder is in use by another tab.');
    }
    this.lockRelease = release;
  }

  private releaseLock(): void {
    const release = this.lockRelease;
    this.lockRelease = null;
    release?.();
  }

  private async ensureDirectory(): Promise<FileSystemDirectoryHandle> {
    if (this.directoryHandle) return this.directoryHandle;

    const handle = await loadDirectoryHandle();
    if (!handle) {
      throw new DirectoryAdapterError(
        'DIRECTORY_MISSING',
        'No OpenNotas folder is connected. Choose a folder in Settings.',
      );
    }

    const permission = await queryDirectoryPermission(handle);
    if (permission !== 'granted') {
      throw new DirectoryAdapterError(
        'DIRECTORY_PERMISSION',
        'OpenNotas needs permission to read and write the selected folder.',
      );
    }

    this.directoryHandle = handle;
    return handle;
  }

  private get migrationClient() {
    return {
      execute: async (input: any) => {
        const sql = typeof input === 'string' ? input : input.sql;
        const args = typeof input === 'string' ? [] : (input.args || []);
        if (/^\s*(select|pragma)\b/i.test(sql)) {
          const rows = await this.worker!.all(sql, args);
          return { rows };
        }
        await this.worker!.run(sql, args);
        return { rows: [] };
      },
    };
  }

  private async ensureLocalTables(): Promise<void> {
    await this.worker!.run(`
      CREATE TABLE IF NOT EXISTS app_meta (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      )
    `);
    await this.worker!.run(`
      CREATE TABLE IF NOT EXISTS local_meta (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      )
    `);
  }

  private async readMeta(key: string): Promise<string | null> {
    const rows = await this.worker!.all('SELECT value FROM app_meta WHERE key = ? LIMIT 1', [key]);
    return rows[0]?.value ?? null;
  }

  private async writeMeta(key: string, value: string): Promise<void> {
    await this.worker!.run(
      'INSERT INTO app_meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      [key, value],
    );
  }

  private async applyFrame(frame: OplogFrame): Promise<void> {
    const columns = TABLE_COLUMNS[frame.table];
    if (!columns) throw new DirectoryAdapterError('OPLOG_TABLE', `Unsupported oplog table: ${frame.table}`);

    const row = normalizeRow(frame.row);
    const presentColumns = columns.filter((column) => Object.prototype.hasOwnProperty.call(row, column));
    if (!presentColumns.length) return;

    const values = presentColumns.map((column) => row[column]);
    const conflict = frame.table === 'local_meta' ? 'key' : 'id';
    const updateColumns = presentColumns.filter((column) => column !== conflict);

    const columnSql = presentColumns.join(', ');
    const placeholders = presentColumns.map(() => '?').join(', ');
    const updates = updateColumns.map((column) => `${column} = excluded.${column}`).join(', ');
    const sql = [
      `INSERT INTO ${frame.table} (${columnSql})`,
      `VALUES (${placeholders})`,
      `ON CONFLICT(${conflict}) DO UPDATE SET ${updates}`,
    ].join(' ');

    await this.worker!.run(sql, values);
  }

  private async replay(frames: OplogFrame[], isPartial = false): Promise<void> {
    if (!frames.length) return;
    await this.worker!.run('BEGIN');
    try {
      for (const frame of sortFrames(frames)) {
        await this.applyFrame(frame);
      }
      await this.worker!.run('COMMIT');
    } catch (error) {
      await this.worker!.run('ROLLBACK').catch(() => {});
      throw error;
    }
    if (isPartial) {
      this.needsCompaction = true;
    }
  }

  private async loadSession(): Promise<void> {
    const directory = await this.ensureDirectory();
    this.worker = new SqliteWorkerClient();

    const base = await getFileHandleSafe(directory, BASE_FILE);
    const oplog = await getFileHandleSafe(directory, OPLOG_FILE);
    const backup = await getFileHandleSafe(directory, BACKUP_FILE);
    this.baseHandle = base;
    this.oplogHandle = oplog;
    this.backupHandle = backup;

    if (!base && oplog) {
      throw new DirectoryAdapterError(
        'BASE_MISSING',
        'The OpenNotas oplog exists but opennotas.sqlite3 is missing. Restore the base file or its backup.',
      );
    }

    this.baseExists = !!base;
    this.oplogExists = !!oplog;

    let baseBytes: Uint8Array | undefined;
    if (base) {
      const file = await base.getFile();
      this.baseMtime = file.lastModified;
      if (file.size > 0) {
        baseBytes = new Uint8Array(await file.arrayBuffer());
        const header = new TextDecoder().decode(baseBytes.slice(0, 16));
        if (header !== 'SQLite format 3\u0000') {
          throw new DirectoryAdapterError('BASE_CORRUPT', 'The selected file is not a valid SQLite database.');
        }
      } else {
        this.baseExists = false;
      }
    }

    await this.worker.open(baseBytes);
    await applySchemaMigrations(this.migrationClient, { verifiedVersionKey: null });
    await this.ensureLocalTables();

    if (this.baseExists) {
      const generationValue = await this.readMeta('generation');
      this.generation = Number(generationValue || 1);
    } else {
      this.generation = 1;
      await this.writeMeta('generation', String(this.generation));
      await this.writeMeta('schemaVersion', String(CURRENT_SCHEMA_VERSION));
      await this.writeMeta('createdAt', String(nowUnix()));
    }

    if (oplog) {
      const bytes = new Uint8Array(await (await oplog.getFile()).arrayBuffer());
      this.oplogBytes = bytes.byteLength;
      this.oplogMtime = (await oplog.getFile()).lastModified;

      if (bytes.byteLength === 0) {
        this.oplogExists = false;
      } else if (bytes.byteLength < 64) {
        throw new DirectoryAdapterError('OPLOG_CORRUPT', 'The OpenNotas oplog is incomplete.');
      } else {
        let parsed;
        try {
          parsed = parseOplog(bytes);
        } catch (error) {
          throw new DirectoryAdapterError('OPLOG_CORRUPT', 'The OpenNotas oplog is corrupted.');
        }

        if (parsed.generation > this.generation) {
          throw new DirectoryAdapterError(
            'OPLOG_AHEAD',
            'The oplog belongs to a newer database snapshot. Restore a matching backup.',
          );
        }

        if (parsed.generation === this.generation) {
          await this.replay(parsed.frames, parsed.tailInvalid);
          this.nextSeq = maxFrameSeq(parsed.frames, 0) + 1;
          if (parsed.tailInvalid) {
            this.needsCompaction = true;
          }
        } else {
          // base was committed after the oplog was written; base already contains
          // the old log. Never append new frames to a mismatched generation.
          this.needsCompaction = true;
          this.needsOplogReset = true;
        }
      }
    }

    if (this.baseExists) {
      const schemaValue = await this.readMeta('schemaVersion');
      this.needsCompaction = this.needsCompaction
        || (schemaValue !== null && Number(schemaValue) !== CURRENT_SCHEMA_VERSION);
    }

    this.lastCompactAt = Date.now();
    this.sessionActive = true;
  }

  private async assertFilesUnchanged(): Promise<void> {
    try {
      if (this.baseHandle) {
        const baseFile = await this.baseHandle.getFile();
        if (this.baseMtime && baseFile.lastModified !== this.baseMtime) {
          throw new DirectoryAdapterError(
            'DIRECTORY_CHANGED',
            'The SQLite folder was changed outside OpenNotas. Reconnect the folder to reload it.',
          );
        }
      }
      if (this.oplogHandle) {
        const oplogFile = await this.oplogHandle.getFile();
        if (this.oplogMtime && oplogFile.lastModified !== this.oplogMtime) {
          throw new DirectoryAdapterError(
            'DIRECTORY_CHANGED',
            'The SQLite oplog was changed outside OpenNotas. Reconnect the folder to reload it.',
          );
        }
      }
    } catch (error: any) {
      if (error instanceof DirectoryAdapterError) throw error;
      if (error?.name === 'NotFoundError') {
        throw new DirectoryAdapterError('DIRECTORY_CHANGED', 'The SQLite folder files were moved or deleted.');
      }
      throw error;
    }
  }

  async beginSync(): Promise<void> {
    if (this.disposed) throw new DirectoryAdapterError('DISPOSED', 'This sync session is closed.');
    if (this.sessionActive) {
      await this.assertFilesUnchanged();
      return;
    }
    if (this.sessionLoading) return this.sessionLoading;

    this.sessionLoading = (async () => {
      await this.acquireLock();
      try {
        await this.loadSession();
      } catch (error) {
        this.releaseLock();
        await this.worker?.close().catch(() => {});
        this.worker = null;
        throw error;
      }
    })().finally(() => {
      this.sessionLoading = null;
    });

    return this.sessionLoading;
  }

  private async ensureActive(): Promise<void> {
    if (!this.sessionActive) {
      await this.beginSync();
    }
    if (!this.sessionActive) {
      throw new DirectoryAdapterError('SESSION', 'The OpenNotas folder is not ready.');
    }
  }

  private mapFolder(row: any): FolderType {
    return {
      id: row.id,
      name: row.name,
      lastSync: Number(row.lastSync || 0),
      createdAt: Number(row.createdAt || 0),
      updatedAt: Number(row.updatedAt || 0),
      deletedAt: row.deletedAt ?? null,
    };
  }

  private mapNote(row: any): NoteType {
    return {
      id: row.id,
      folderId: row.folderId,
      previousFolderId: row.previousFolderId ?? null,
      content: row.content,
      isPinned: !!row.isPinned,
      isLocked: !!row.isLocked,
      lastSync: Number(row.lastSync || 0),
      createdAt: Number(row.createdAt || 0),
      updatedAt: Number(row.updatedAt || 0),
      deletedAt: row.deletedAt ?? null,
      deleteCompletelyAt: row.deleteCompletelyAt ?? null,
    };
  }

  private mapTag(row: any): TagType {
    return {
      id: row.id,
      name: row.name,
      color: row.color,
      lastSync: Number(row.lastSync || 0),
      createdAt: Number(row.createdAt || 0),
      updatedAt: Number(row.updatedAt || 0),
      deletedAt: row.deletedAt ?? null,
    };
  }

  private mapNoteTag(row: any): NoteTagType {
    return {
      id: row.id,
      noteId: row.noteId,
      tagId: row.tagId,
      lastSync: Number(row.lastSync || 0),
      createdAt: Number(row.createdAt || 0),
      updatedAt: Number(row.updatedAt || 0),
      deletedAt: row.deletedAt ?? null,
    };
  }

  async pullFolders(lastSync: number): Promise<FolderType[]> {
    await this.ensureActive();
    const rows = await this.worker!.all('SELECT * FROM folders WHERE updatedAt > ?', [lastSync]);
    return rows.map((row) => this.mapFolder(row));
  }

  async pullNotes(lastSync: number): Promise<NoteType[]> {
    await this.ensureActive();
    const rows = await this.worker!.all('SELECT * FROM notes WHERE updatedAt > ?', [lastSync]);
    return rows.map((row) => this.mapNote(row));
  }

  async pullTags(lastSync: number): Promise<TagType[]> {
    await this.ensureActive();
    const rows = await this.worker!.all('SELECT * FROM tags WHERE updatedAt > ?', [lastSync]);
    return rows.map((row) => this.mapTag(row));
  }

  async pullNoteTags(lastSync: number): Promise<NoteTagType[]> {
    await this.ensureActive();
    const rows = await this.worker!.all('SELECT * FROM note_tags WHERE updatedAt > ?', [lastSync]);
    return rows.map((row) => this.mapNoteTag(row));
  }

  async pullSettings(lastSync: number): Promise<any> {
    await this.ensureActive();
    const rows = await this.worker!.all('SELECT * FROM settings WHERE updatedAt > ? LIMIT 1', [lastSync]);
    return rows[0];
  }

  private async queuePush(table: string, row: any): Promise<void> {
    const frame: OplogFrame = {
      seq: this.nextSeq++,
      table,
      op: 'upsert',
      row: normalizeRow(row),
    };
    // Apply immediately so the current sync session sees its own writes; the
    // frame is only made durable when commitSync appends it to the oplog.
    await this.applyFrame(frame);
    this.pendingFrames.push(frame);
  }

  async pushFolder(folder: any): Promise<any> {
    await this.ensureActive();
    await this.queuePush('folders', folder);
    return folder;
  }

  async pushNote(note: any): Promise<any> {
    await this.ensureActive();
    await this.queuePush('notes', note);
    return note;
  }

  async pushTag(tag: any): Promise<any> {
    await this.ensureActive();
    await this.queuePush('tags', tag);
    return tag;
  }

  async pushNoteTag(noteTag: any): Promise<any> {
    await this.ensureActive();
    await this.queuePush('note_tags', noteTag);
    return noteTag;
  }

  async pushSettings(setting: any): Promise<any> {
    await this.ensureActive();
    await this.queuePush('settings', {
      id: 'settings',
      password: setting.password,
      lastSync: setting.lastSync,
      updatedAt: setting.updatedAt,
    });
    return setting;
  }

  async clearData(): Promise<void> {
    await this.ensureActive();
    await this.worker!.run('BEGIN');
    try {
      for (const table of ['folders', 'notes', 'tags', 'note_tags', 'settings', 'local_meta']) {
        await this.worker!.run(`DELETE FROM ${table}`);
      }
      await this.worker!.run('COMMIT');
    } catch (error) {
      await this.worker!.run('ROLLBACK').catch(() => {});
      throw error;
    }
    // The seed pushes that follow will replace the deleted rows; compaction folds
    // the whole replacement into the base snapshot.
    this.needsCompaction = true;
  }

  async setLocalMeta(key: string, value: string): Promise<void> {
    await this.ensureActive();
    await this.queuePush('local_meta', { key, value });
  }

  async setWrappedE2EEKey(keyString: string): Promise<boolean> {
    const password = await getPassword();
    if (!password) return false;
    const wrapped = await encryptData(keyString, password);
    await this.setLocalMeta('e2eeKeyWrapped', wrapped);
    await this.setLocalMeta('keyWrapVersion', '1');
    return true;
  }

  async readLocalMeta(key: string): Promise<string | null> {
    await this.ensureActive();
    const rows = await this.worker!.all('SELECT value FROM local_meta WHERE key = ? LIMIT 1', [key]);
    return rows[0]?.value ?? null;
  }

  private shouldCompact(): boolean {
    return this.needsCompaction
      || this.oplogBytes > OPLOG_COMPACT_BYTES
      || (this.oplogBytes > 0 && Date.now() - this.lastCompactAt > OPLOG_COMPACT_AGE_MS);
  }

  private async writeOplogHeader(): Promise<void> {
    if (!this.oplogHandle) {
      this.oplogHandle = await getOrCreateFileHandle(this.directoryHandle!, OPLOG_FILE);
    }
    await writeFileBytes(this.oplogHandle, createOplogHeader(this.generation, CURRENT_SCHEMA_VERSION));
    this.oplogExists = true;
    this.oplogBytes = 64;
    this.oplogMtime = (await this.oplogHandle.getFile()).lastModified;
  }

  private async appendPendingFrames(): Promise<void> {
    if (!this.pendingFrames.length) return;
    const frames = sortFrames(this.pendingFrames);

    if (!this.oplogExists || !this.oplogHandle) {
      this.oplogHandle = await getOrCreateFileHandle(this.directoryHandle!, OPLOG_FILE);
      const header = createOplogHeader(this.generation, CURRENT_SCHEMA_VERSION);
      const framesBytes = frames.map(encodeOplogFrame);
      const total = header.byteLength + framesBytes.reduce((sum, item) => sum + item.byteLength, 0);
      const bytes = new Uint8Array(total);
      bytes.set(header, 0);
      let offset = header.byteLength;
      for (const frameBytes of framesBytes) {
        bytes.set(frameBytes, offset);
        offset += frameBytes.byteLength;
      }
      await writeFileBytes(this.oplogHandle, bytes);
      this.oplogExists = true;
      this.oplogBytes = bytes.byteLength;
      this.oplogMtime = (await this.oplogHandle.getFile()).lastModified;
    } else {
      const existing = await readFileBytes(this.oplogHandle);
      if (existing.byteLength < 64) {
        this.oplogExists = false;
        await this.appendPendingFrames();
        return;
      }

      let validLength = existing.byteLength;
      if (existing.byteLength >= 64) {
        try {
          const parsed = parseOplog(existing);
          validLength = parsed.validLength;
        } catch {
          validLength = 64;
        }
      }

      const framesBytes = frames.map(encodeOplogFrame);
      const total = framesBytes.reduce((sum, item) => sum + item.byteLength, 0);
      const bytes = new Uint8Array(total);
      let offset = 0;
      for (const frameBytes of framesBytes) {
        bytes.set(frameBytes, offset);
        offset += frameBytes.byteLength;
      }
      await appendFileBytes(this.oplogHandle, bytes, validLength);
      this.oplogBytes = validLength + total;
      this.oplogMtime = (await this.oplogHandle.getFile()).lastModified;
    }

    this.pendingFrames = [];
  }

  async commitSync(): Promise<void> {
    await this.ensureActive();

    if (this.needsOplogReset) {
      // Fold everything currently in memory into a fresh snapshot, which also
      // resets the oplog to the current generation.
      await this.compact();
      return;
    }

    if (this.pendingFrames.length) {
      if (!this.baseExists) {
        // A brand-new directory has no snapshot yet. Fold the initial data straight
        // into the base instead of writing an oplog on top of a missing base.
        await this.compact();
        return;
      }
      await this.appendPendingFrames();
    }

    if (this.needsCompaction || this.shouldCompact()) {
      try {
        await this.compact();
      } catch (error) {
        // The oplog append already made the changes durable. Keep the session usable;
        // the next sync will retry compaction.
        console.warn('OpenNotas directory compaction failed', error);
      }
    }
  }

  async compact(): Promise<void> {
    await this.ensureActive();
    const directory = await this.ensureDirectory();
    const nextGeneration = this.generation + 1;

    await this.writeMeta('generation', String(nextGeneration));
    await this.writeMeta('schemaVersion', String(CURRENT_SCHEMA_VERSION));
    await this.writeMeta('compactedAt', String(nowUnix()));

    const bytes = await this.worker!.export();

    // Keep one previous snapshot. This is a full copy, so it only happens on
    // compaction, never on every sync.
    if (this.baseHandle && this.baseExists) {
      const backupHandle = this.backupHandle || await getOrCreateFileHandle(directory, BACKUP_FILE);
      const currentBytes = await readFileBytes(this.baseHandle);
      await writeFileBytes(backupHandle, currentBytes);
      this.backupHandle = backupHandle;
    }

    if (!this.baseHandle) {
      this.baseHandle = await getOrCreateFileHandle(directory, BASE_FILE);
    }
    await writeFileBytes(this.baseHandle, bytes);
    this.baseExists = true;
    this.baseMtime = (await this.baseHandle.getFile()).lastModified;

    if (!this.oplogHandle) {
      this.oplogHandle = await getOrCreateFileHandle(directory, OPLOG_FILE);
    }
    try {
      await writeFileBytes(this.oplogHandle, createOplogHeader(nextGeneration, CURRENT_SCHEMA_VERSION));
    } catch (error) {
      // The new base is already committed. The old oplog now belongs to the
      // previous generation and must never receive new frames.
      this.needsOplogReset = true;
      throw error;
    }
    this.oplogExists = true;
    this.oplogBytes = 64;
    this.oplogMtime = (await this.oplogHandle.getFile()).lastModified;

    this.generation = nextGeneration;
    this.nextSeq = 1;
    this.pendingFrames = [];
    this.needsCompaction = false;
    this.needsOplogReset = false;
    this.lastCompactAt = Date.now();
  }

  async flush(): Promise<void> {
    await this.commitSync();
  }

  async abortSync(): Promise<void> {
    this.pendingFrames = [];
    this.sessionActive = false;
    this.baseHandle = null;
    this.oplogHandle = null;
    this.backupHandle = null;
    this.directoryHandle = null;
    this.releaseLock();
    await this.worker?.close().catch(() => {});
    this.worker = null;
  }

  async close(): Promise<void> {
    if (this.disposed) return;
    await this.abortSync();
    this.disposed = true;
  }
}

export type { DirectoryAdapter };
export {
  DirectoryAdapterError,
  DirectoryAdapter,
};
