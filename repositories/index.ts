import localForage from 'localforage';

import NotasRepository from "./storage";
import type {
  FolderCreateType,
  FolderType,
  FolderUpdateType,
  NoteCreateType,
  NoteType,
  NoteUpdateType,
} from "./storage.type";

class LocalForageRepository implements NotasRepository {
  // common
  async get(key: string): Promise<any> {
    return await localForage.getItem(key);
  }
  async set(key: string, value: any): Promise<any> {
    return await localForage.setItem(key, value);
  }

  // logic
  async getAllFolders(): Promise<FolderType[]> {
    const folders = JSON.parse(await localForage.getItem('folders') || '[]');
    return folders as FolderType[];
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
    return data as FolderType;
  }
  async updateFolder(folderId: string, data: FolderUpdateType): Promise<FolderType> {
    const folders = await this.getAllFolders();
    const folderIndex = folders.findIndex((folder: any) => folder.id === folderId);
    folders[folderIndex] = { ...folders[folderIndex], ...data };
    await localForage.setItem('folders', JSON.stringify(folders));
    await localForage.setItem(`folders-${folderId}`, JSON.stringify(folders[folderIndex]));
    return folders[folderIndex] as FolderType;
  }
  async deleteFolder(folderId: string): Promise<boolean> {
    const folders = await this.getAllFolders();
    const newFolders = folders.filter((folder: any) => folder.id !== folderId);
    await localForage.setItem('folders', JSON.stringify(newFolders));
    // await localForage.removeItem(`folders-${folderId}`);
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
    const notes = JSON.parse(await localForage.getItem(`notes`) || '[]');
    return notes as NoteType[];
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
    return data as NoteType;
  }
  async updateNote(noteId: string, data: NoteUpdateType): Promise<NoteType> {
    const notes = JSON.parse(await localForage.getItem(`notes`) || '[]');
    const noteIndex = notes.findIndex((note: any) => note.id === noteId);
    notes[noteIndex] = { ...notes[noteIndex], ...data };
    await localForage.setItem('notes', JSON.stringify(notes));
    await localForage.setItem(`notes-${noteId}`, JSON.stringify(notes[noteIndex]));
    return notes[noteIndex];
  }
  async deleteNote(noteId: string): Promise<boolean> {
    const notes = await this.getAllNotes();
    const newNotes = notes.filter((note: any) => note.id !== noteId);
    await localForage.setItem('notes', JSON.stringify(newNotes));
    // await localForage.removeItem(`notes-${noteId}`);
    return true;
  }
  async getActiveNote(): Promise<string | null> {
    return await localForage.getItem('activeNote') || null;
  }
  async setActiveNote(noteId: string): Promise<string> {
    await localForage.setItem('activeNote', noteId);
    return noteId;
  }

  // password | settings
  async getSettings(): Promise<any> {
    return JSON.parse(await localForage.getItem('settings') || '{}');
  }
  async setSettings(data: any): Promise<any> {
    await localForage.setItem('settings', JSON.stringify(data));
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
    return true;
  }
}

export default LocalForageRepository;
