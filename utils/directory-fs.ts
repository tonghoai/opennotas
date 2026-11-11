// File System Access helpers for the local SQLite directory adapter.
// The directory handle is structured-cloneable, so it lives in a tiny native
// IndexedDB store rather than in the JSON settings blob (handles cannot be JSON
// serialized and must never end up in exported settings).

const HANDLE_DB = 'opennotas-fs-handles';
const HANDLE_STORE = 'handles';
const HANDLE_KEY = 'sqlite-directory';

const DATA_DIRECTORY = 'OpenNotas';
const BASE_FILE = 'opennotas.sqlite3';
const OPLOG_FILE = 'opennotas.oplog';
const BACKUP_FILE = 'opennotas.sqlite3.bak';

type DirectoryInspection = {
  hasBase: boolean;
  hasOplog: boolean;
  hasBackup: boolean;
  baseSize: number;
  oplogSize: number;
  hasExistingData: boolean;
};

function isDirectorySyncSupported(): boolean {
  return typeof window !== 'undefined'
    && window.isSecureContext
    && typeof (window as any).showDirectoryPicker === 'function';
}

function openHandleDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(HANDLE_DB, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(HANDLE_STORE)) {
        request.result.createObjectStore(HANDLE_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveDirectoryHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  const db = await openHandleDatabase();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(HANDLE_STORE, 'readwrite');
    tx.objectStore(HANDLE_STORE).put(handle, HANDLE_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

async function loadDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
  if (typeof indexedDB === 'undefined') return null;

  const db = await openHandleDatabase();
  const handle = await new Promise<FileSystemDirectoryHandle | null>((resolve, reject) => {
    const tx = db.transaction(HANDLE_STORE, 'readonly');
    const request = tx.objectStore(HANDLE_STORE).get(HANDLE_KEY);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return handle;
}

async function clearDirectoryHandle(): Promise<void> {
  const db = await openHandleDatabase();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(HANDLE_STORE, 'readwrite');
    tx.objectStore(HANDLE_STORE).delete(HANDLE_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

async function queryDirectoryPermission(
  handle: FileSystemDirectoryHandle,
  request = false,
): Promise<PermissionState> {
  const options: FileSystemHandlePermissionDescriptor = { mode: 'readwrite' };
  const current = await handle.queryPermission(options);
  if (current === 'granted' || !request) return current;
  return await handle.requestPermission(options);
}

async function pickParentDirectory(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const picker = (window as any).showDirectoryPicker;
    return await picker({
      id: 'opennotas-directory',
      mode: 'readwrite',
      startIn: 'documents',
    });
  } catch (error: any) {
    if (error?.name === 'AbortError') return null;
    throw error;
  }
}

// If the user already selected the OpenNotas data folder itself, use it as-is.
// Otherwise create the conventional OpenNotas subfolder inside the chosen parent.
async function resolveDataDirectory(parent: FileSystemDirectoryHandle): Promise<FileSystemDirectoryHandle> {
  try {
    await parent.getFileHandle(BASE_FILE);
    return parent;
  } catch {
    // The selected folder is a parent, not the data folder itself.
  }

  if (parent.name === DATA_DIRECTORY) return parent;
  return parent.getDirectoryHandle(DATA_DIRECTORY, { create: true });
}

async function getFileHandleSafe(
  directory: FileSystemDirectoryHandle,
  name: string,
): Promise<FileSystemFileHandle | null> {
  try {
    return await directory.getFileHandle(name);
  } catch (error: any) {
    if (error?.name === 'NotFoundError') return null;
    throw error;
  }
}

async function getOrCreateFileHandle(
  directory: FileSystemDirectoryHandle,
  name: string,
): Promise<FileSystemFileHandle> {
  return directory.getFileHandle(name, { create: true });
}

async function readFileBytes(handle: FileSystemFileHandle): Promise<Uint8Array> {
  const file = await handle.getFile();
  return new Uint8Array(await file.arrayBuffer());
}

async function writeFileBytes(handle: FileSystemFileHandle, bytes: Uint8Array): Promise<void> {
  const writable = await handle.createWritable({ keepExistingData: false });
  try {
    await writable.write(bytes);
    await writable.close();
  } catch (error) {
    await writable.abort().catch(() => {});
    throw error;
  }
}

async function appendFileBytes(
  handle: FileSystemFileHandle,
  bytes: Uint8Array,
  truncateAt?: number,
): Promise<void> {
  const existing = await readFileBytes(handle);
  const targetLength = truncateAt ?? existing.byteLength;
  const writable = await handle.createWritable({ keepExistingData: true });
  try {
    if (targetLength !== existing.byteLength) {
      await writable.truncate(targetLength);
    }
    await writable.seek(targetLength);
    await writable.write(bytes);
    await writable.close();
  } catch (error) {
    await writable.abort().catch(() => {});
    throw error;
  }
}

async function inspectDataDirectory(directory: FileSystemDirectoryHandle): Promise<DirectoryInspection> {
  const base = await getFileHandleSafe(directory, BASE_FILE);
  const oplog = await getFileHandleSafe(directory, OPLOG_FILE);
  const backup = await getFileHandleSafe(directory, BACKUP_FILE);

  const baseSize = base ? (await base.getFile()).size : 0;
  const oplogSize = oplog ? (await oplog.getFile()).size : 0;

  return {
    hasBase: !!base,
    hasOplog: !!oplog,
    hasBackup: !!backup,
    baseSize,
    oplogSize,
    hasExistingData: baseSize > 0 || oplogSize > 64,
  };
}

export type { DirectoryInspection };

export {
  BASE_FILE,
  OPLOG_FILE,
  BACKUP_FILE,
  DATA_DIRECTORY,
  isDirectorySyncSupported,
  saveDirectoryHandle,
  loadDirectoryHandle,
  clearDirectoryHandle,
  queryDirectoryPermission,
  pickParentDirectory,
  resolveDataDirectory,
  getFileHandleSafe,
  getOrCreateFileHandle,
  readFileBytes,
  writeFileBytes,
  appendFileBytes,
  inspectDataDirectory,
};
