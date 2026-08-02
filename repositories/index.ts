import localForage from 'localforage';

import NotasRepository from "./storage";
import { encryptSensitiveSettings, decryptSensitiveSettings, stripEncryptedFields } from "~/utils/settings";
import type {
  FolderCreateType,
  FolderType,
  FolderUpdateType,
  NoteCreateType,
  NoteSortType,
  NoteType,
  NoteUpdateType,
  TagCreateType,
  TagType,
  TagUpdateType,
  NoteTagCreateType,
  NoteTagType,
} from "./storage.type";

class LocalForageRepository implements NotasRepository {
  // in-memory cache for full-table reads — any new code path that writes to the
  // notes/folders/tags/noteTags localForage keys directly (bypassing the create*/update*/delete*
  // methods below) must also invalidate the matching cache field here.
  private notesCache: NoteType[] | null = null;
  private foldersCache: FolderType[] | null = null;
  private tagsCache: TagType[] | null = null;
  private noteTagsCache: NoteTagType[] | null = null;

  // common
  async get(key: string): Promise<any> {
    return await localForage.getItem(key);
  }
  async set(key: string, value: any): Promise<any> {
    return await localForage.setItem(key, value);
  }

  // logic
  async getAllFolders(): Promise<FolderType[]> {
    if (this.foldersCache) return [...this.foldersCache];
    const folders = JSON.parse(await localForage.getItem('folders') || '[]');
    this.foldersCache = folders;
    return [...folders] as FolderType[];
  }
  async getFolders(): Promise<FolderType[]> {
    const folders = await this.getAllFolders();
    return folders.filter((folder: any) => !folder.deletedAt) as FolderType[];
  }
  async getDeletedFolders(): Promise<FolderType[]> {
    const folders = await this.getAllFolders();
    return folders.filter((folder: any) => folder.deletedAt) as FolderType[];
  }
  async getFolderDetail(folderId: string): Promise<FolderType> {
    return JSON.parse(await localForage.getItem(`folders-${folderId}`) || '{}') as FolderType;
  }
  async createFolder(data: FolderCreateType): Promise<FolderType> {
    const folders = await this.getAllFolders();
    const newFolder = [data, ...folders];
    await localForage.setItem('folders', JSON.stringify(newFolder));
    await localForage.setItem(`folders-${data.id}`, JSON.stringify(data));
    this.foldersCache = null;
    return data as FolderType;
  }
  async updateFolder(folderId: string, data: FolderUpdateType): Promise<FolderType> {
    const folders = await this.getAllFolders();
    const folderIndex = folders.findIndex((folder: any) => folder.id === folderId);
    if (folderIndex < 0) {
      // folder not found in array — fetch individually and prepend
      const existing = await this.getFolderDetail(folderId);
      const merged = { ...existing, ...data } as FolderType;
      folders.unshift(merged);
      await localForage.setItem('folders', JSON.stringify(folders));
      await localForage.setItem(`folders-${folderId}`, JSON.stringify(merged));
      this.foldersCache = null;
      return merged;
    }
    folders[folderIndex] = { ...folders[folderIndex], ...data };
    await localForage.setItem('folders', JSON.stringify(folders));
    await localForage.setItem(`folders-${folderId}`, JSON.stringify(folders[folderIndex]));
    this.foldersCache = null;
    return folders[folderIndex] as FolderType;
  }
  async deleteFolder(folderId: string): Promise<boolean> {
    const folders = await this.getAllFolders();
    const newFolders = folders.filter((folder: any) => folder.id !== folderId);
    await localForage.setItem('folders', JSON.stringify(newFolders));
    // await localForage.removeItem(`folders-${folderId}`);
    this.foldersCache = null;
    return true;
  }
  async getActiveFolder(): Promise<string | null> {
    return await localForage.getItem('activeFolder') || null;
  }
  async setActiveFolder(folderId: string): Promise<string> {
    await localForage.setItem('activeFolder', folderId);
    return folderId;
  }

  async getAllNotes(): Promise<NoteType[]> {
    if (this.notesCache) return [...this.notesCache];
    const notes = JSON.parse(await localForage.getItem(`notes`) || '[]');
    this.notesCache = notes;
    return [...notes] as NoteType[];
  }
  async getNotes(folderId: string): Promise<NoteType[]> {
    const notes = await this.getAllNotes()
    return notes.filter((note: NoteType) => (folderId ? note.folderId === folderId : true) && !note.deletedAt) as NoteType[];
  }
  async getNotesWithContent(folderId: string): Promise<NoteType[]> {
    const notes = await this.getNotes(folderId);
    const notesWithContent = await Promise.all(notes.map(async (note: NoteType) => {
      const content = (await this.getNoteDetail(note.id)).content;
      return { ...note, content } as NoteType;
    }));
    return notesWithContent;
  }
  async getNoteDetail(noteId: string): Promise<NoteType> {
    return JSON.parse(await localForage.getItem(`notes-${noteId}`) || '{}') as NoteType;
  }
  async getDeletedNotes(): Promise<NoteType[]> {
    const notes = await this.getAllNotes();
    return notes.filter((note: NoteType) => note.deletedAt && !note.deleteCompletelyAt) as NoteType[];
  }
  async createNote(data: NoteCreateType): Promise<NoteType> {
    const notes = JSON.parse(await localForage.getItem(`notes`) || '[]');
    const newNote = [data, ...notes];
    await localForage.setItem('notes', JSON.stringify(newNote));
    await localForage.setItem(`notes-${data.id}`, JSON.stringify(data));
    this.notesCache = null;
    return data as NoteType;
  }
  async updateNote(noteId: string, data: NoteUpdateType): Promise<NoteType> {
    const notes = JSON.parse(await localForage.getItem(`notes`) || '[]');
    const noteIndex = notes.findIndex((note: any) => note.id === noteId);
    if (noteIndex < 0) {
      // note not found in array — fetch individually and prepend
      const existing = await this.getNoteDetail(noteId);
      const merged = { ...existing, ...data } as NoteType;
      notes.unshift(merged);
      await localForage.setItem('notes', JSON.stringify(notes));
      await localForage.setItem(`notes-${noteId}`, JSON.stringify(merged));
      this.notesCache = null;
      return merged;
    }
    notes[noteIndex] = { ...notes[noteIndex], ...data };
    await localForage.setItem('notes', JSON.stringify(notes));
    await localForage.setItem(`notes-${noteId}`, JSON.stringify(notes[noteIndex]));
    this.notesCache = null;
    return notes[noteIndex];
  }
  async deleteNote(noteId: string): Promise<boolean> {
    const notes = await this.getAllNotes();
    const newNotes = notes.filter((note: any) => note.id !== noteId);
    await localForage.setItem('notes', JSON.stringify(newNotes));
    // await localForage.removeItem(`notes-${noteId}`);
    this.notesCache = null;
    return true;
  }
  async getNoteHistory(noteId: string): Promise<any[]> {
    return JSON.parse(await localForage.getItem(`notes-history-${noteId}`) || '[]');
  }
  private historyDayKey(unixSeconds: number): string {
    const d = new Date(unixSeconds * 1000);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  }
  async addNoteHistorySnapshot(noteId: string, snapshot: any, maxDays: number = 3, maxPerDay: number = 5): Promise<any[]> {
    let history = await this.getNoteHistory(noteId);
    history.unshift(snapshot);

    const dayKey = this.historyDayKey.bind(this);
    const newDayKey = dayKey(snapshot.snapshotAt);

    const sameDay = history.filter((item: any) => dayKey(item.snapshotAt) === newDayKey);
    if (sameDay.length > maxPerDay) {
      const dropIds = new Set(sameDay.slice(-(sameDay.length - maxPerDay)).map((item: any) => item.id));
      history = history.filter((item: any) => !dropIds.has(item.id));
    }

    const days = Array.from(new Set(history.map((item: any) => dayKey(item.snapshotAt))));
    if (days.length > maxDays) {
      const keepDays = new Set(days.slice(0, maxDays));
      history = history.filter((item: any) => keepDays.has(dayKey(item.snapshotAt)));
    }

    await localForage.setItem(`notes-history-${noteId}`, JSON.stringify(history));
    return history;
  }
  async deleteNoteHistorySnapshot(noteId: string, snapshotId: string): Promise<any[]> {
    const history = await this.getNoteHistory(noteId);
    const filtered = history.filter((item: any) => item.id !== snapshotId);
    await localForage.setItem(`notes-history-${noteId}`, JSON.stringify(filtered));
    return filtered;
  }
  async getActiveNote(): Promise<string | null> {
    return await localForage.getItem('activeNote') || null;
  }
  async setActiveNote(noteId: string): Promise<string> {
    await localForage.setItem('activeNote', noteId);
    return noteId;
  }
  async getSortNote(): Promise<NoteSortType> {
    return await localForage.getItem('sortNote') || 'createdAt';
  }
  async setSortNote(sort: NoteSortType): Promise<NoteSortType> {
    await localForage.setItem('sortNote', sort);
    return sort;
  }

  // tags
  async getAllTags(): Promise<TagType[]> {
    if (this.tagsCache) return [...this.tagsCache];
    const tags = JSON.parse(await localForage.getItem('tags') || '[]');
    this.tagsCache = tags;
    return [...tags] as TagType[];
  }
  async getTags(): Promise<TagType[]> {
    const tags = await this.getAllTags();
    return tags.filter((tag: any) => !tag.deletedAt) as TagType[];
  }
  async getTagDetail(tagId: string): Promise<TagType> {
    return JSON.parse(await localForage.getItem(`tags-${tagId}`) || '{}') as TagType;
  }
  async createTag(data: TagCreateType): Promise<TagType> {
    const tags = await this.getAllTags();
    const newTags = [data, ...tags];
    await localForage.setItem('tags', JSON.stringify(newTags));
    await localForage.setItem(`tags-${data.id}`, JSON.stringify(data));
    this.tagsCache = null;
    return data as TagType;
  }
  async updateTag(tagId: string, data: TagUpdateType): Promise<TagType> {
    const tags = await this.getAllTags();
    const tagIndex = tags.findIndex((tag: any) => tag.id === tagId);
    if (tagIndex < 0) {
      // tag not found in array — fetch from individual key and prepend
      const existing = await this.getTagDetail(tagId);
      const merged = { ...existing, ...data } as TagType;
      tags.unshift(merged);
      await localForage.setItem('tags', JSON.stringify(tags));
      await localForage.setItem(`tags-${tagId}`, JSON.stringify(merged));
      this.tagsCache = null;
      return merged;
    }
    tags[tagIndex] = { ...tags[tagIndex], ...data };
    await localForage.setItem('tags', JSON.stringify(tags));
    await localForage.setItem(`tags-${tagId}`, JSON.stringify(tags[tagIndex]));
    this.tagsCache = null;
    return tags[tagIndex] as TagType;
  }

  // note tags (map note <-> tag)
  async getAllNoteTags(): Promise<NoteTagType[]> {
    if (this.noteTagsCache) return [...this.noteTagsCache];
    const noteTags = JSON.parse(await localForage.getItem('noteTags') || '[]');
    this.noteTagsCache = noteTags;
    return [...noteTags] as NoteTagType[];
  }
  async getNoteTagsByNote(noteId: string): Promise<NoteTagType[]> {
    const noteTags = await this.getAllNoteTags();
    return noteTags.filter((noteTag: any) => noteTag.noteId === noteId && !noteTag.deletedAt) as NoteTagType[];
  }
  async getNoteTagsByTag(tagId: string): Promise<NoteTagType[]> {
    const noteTags = await this.getAllNoteTags();
    return noteTags.filter((noteTag: any) => noteTag.tagId === tagId && !noteTag.deletedAt) as NoteTagType[];
  }
  async createNoteTag(data: NoteTagCreateType): Promise<NoteTagType> {
    const noteTags = await this.getAllNoteTags();
    const newNoteTags = [data, ...noteTags];
    await localForage.setItem('noteTags', JSON.stringify(newNoteTags));
    await localForage.setItem(`noteTags-${data.id}`, JSON.stringify(data));
    this.noteTagsCache = null;
    return data as NoteTagType;
  }
  async updateNoteTag(noteTagId: string, data: Partial<NoteTagType>): Promise<NoteTagType> {
    const noteTags = await this.getAllNoteTags();
    const noteTagIndex = noteTags.findIndex((noteTag: any) => noteTag.id === noteTagId);
    if (noteTagIndex < 0) {
      // noteTag not found in array — fetch from individual key and prepend
      const existing = JSON.parse(await localForage.getItem(`noteTags-${noteTagId}`) || '{}') as NoteTagType;
      const merged = { ...existing, ...data } as NoteTagType;
      noteTags.unshift(merged);
      await localForage.setItem('noteTags', JSON.stringify(noteTags));
      await localForage.setItem(`noteTags-${noteTagId}`, JSON.stringify(merged));
      this.noteTagsCache = null;
      return merged;
    }
    noteTags[noteTagIndex] = { ...noteTags[noteTagIndex], ...data };
    await localForage.setItem('noteTags', JSON.stringify(noteTags));
    await localForage.setItem(`noteTags-${noteTagId}`, JSON.stringify(noteTags[noteTagIndex]));
    this.noteTagsCache = null;
    return noteTags[noteTagIndex] as NoteTagType;
  }

  // password | settings
  // Random, device-local key (never exported or synced) used only to keep secrets like S3/sync
  // credentials out of plaintext in IndexedDB. Deliberately independent of the note-lock
  // password so it isn't invalidated by a password change and also protects users who haven't
  // set one — see getSettings/setSettings below.
  private async getOrCreateSettingsEncryptionKey(): Promise<string> {
    const existing = await localForage.getItem('settingsEncryptionKey') as string | null;
    if (existing) return existing;

    const bytes = crypto.getRandomValues(new Uint8Array(32));
    const key = Array.prototype.map.call(bytes, (x: number) => ('00' + x.toString(16)).slice(-2)).join('');
    await localForage.setItem('settingsEncryptionKey', key);
    return key;
  }
  async getSettings(): Promise<any> {
    const raw = JSON.parse(await localForage.getItem('settings') || '{}');
    if (!raw.encryptedFields?.length) return raw;

    const key = await this.getOrCreateSettingsEncryptionKey();
    try {
      const decrypted = await decryptSensitiveSettings(raw, raw.encryptedFields, key);
      delete decrypted.encryptedFields;
      return decrypted;
    } catch (err) {
      // decryptSensitiveSettings already isolates per-field failures — this only guards
      // against something unexpected blowing up the whole call, so the rest of settings
      // (general, sync.adapter, sync.frequency, ...) still loads instead of silently
      // reverting to defaults.
      console.warn('Failed to decrypt settings, returning with encrypted fields stripped', err);
      const stripped = stripEncryptedFields(raw, raw.encryptedFields);
      delete stripped.encryptedFields;
      return stripped;
    }
  }
  async setSettings(data: any): Promise<any> {
    const key = await this.getOrCreateSettingsEncryptionKey();
    const { settings: encrypted, encryptedFields } = await encryptSensitiveSettings(data, key);
    await localForage.setItem('settings', JSON.stringify({ ...encrypted, encryptedFields }));
    return data;
  }
  async checkPasswordExist(): Promise<boolean> {
    return !!await localForage.getItem('password');
  }
  async getPassword(): Promise<string> {
    return await localForage.getItem('password') || '';
  }
  async setPassword(password: string): Promise<string> {
    // const hash = await this.hashPassword(password);
    await localForage.setItem('password', password);
    return password;
  }
  async getPasswordChangeBackup(): Promise<any> {
    return JSON.parse(await localForage.getItem('passwordChangeBackup') || 'null');
  }
  async savePasswordChangeBackup(data: any): Promise<any> {
    await localForage.setItem('passwordChangeBackup', JSON.stringify(data));
    return data;
  }
  async clearPasswordChangeBackup(): Promise<boolean> {
    await localForage.removeItem('passwordChangeBackup');
    return true;
  }

  // sync
  async getLastPull(): Promise<number> {
    return parseInt(await localForage.getItem('lastPull') || '0');
  }
  async updateLastPull(now: number): Promise<boolean> {
    await localForage.setItem('lastPull', now + "");
    return true;
  }
  async getActionObject(): Promise<any> {
    return JSON.parse(await localForage.getItem('actionObject') || '{}');
  }
  async saveActionObject(data: any): Promise<any> {
    await localForage.setItem('actionObject', JSON.stringify(data));
    return data;
  }

  // import
  async getImportData(): Promise<any> {
    return JSON.parse(await localForage.getItem('opennotasImport') || '{}');
  }
  async setImportData(data: any): Promise<any> {
    await localForage.setItem('opennotasImport', JSON.stringify(data));
    return data;
  }

  // encrypt aes notes
  async generateAESKey(): Promise<CryptoKey> {
    return generateKey();
  }
  async saveAESKey(key: CryptoKey): Promise<string> {
    const keyString = await exportKey(key);
    await localForage.setItem('aesEncryptNoteKey', keyString);
    return keyString;
  }
  async getAESKey(): Promise<CryptoKey | null> {
    const keyString: string = await localForage.getItem('aesEncryptNoteKey') || "";
    const key = keyString ? await importKey(keyString) : null;
    return key;
  }

  // utils
  async checkIsFirstInit(): Promise<boolean> {
    return !await localForage.getItem('firstInit')
      && !await localForage.getItem('notes')
      && !await localForage.getItem('folders');
  }

  // dangerus
  async cleanData(): Promise<boolean> {
    await localForage.clear();
    this.notesCache = null;
    this.foldersCache = null;
    this.tagsCache = null;
    this.noteTagsCache = null;
    return true;
  }
}

export default LocalForageRepository;
