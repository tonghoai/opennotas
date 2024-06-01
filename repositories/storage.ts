import type {
  FolderCreateType,
  FolderType,
  FolderUpdateType,
  NoteCreateType,
  NoteType,
  NoteUpdateType,
} from "./storage.type";

class NotasStorage {
  async getAllFolders(): Promise<FolderType[]> {
    throw new Error('Not implemented');
  }
  async getFolders(): Promise<FolderType[]> {
    throw new Error('Not implemented');
  }
  async getDeletedFolders(): Promise<FolderType[]> {
    throw new Error('Not implemented');
  }
  async getFolderDetail(folderId: string): Promise<FolderType> {
    throw new Error('Not implemented');
  }
  async createFolder(data: FolderCreateType): Promise<FolderType> {
    throw new Error('Not implemented');
  }
  async updateFolder(folderId: string, data: FolderUpdateType): Promise<FolderType> {
    throw new Error('Not implemented');
  }
  async getActiveFolder(): Promise<string | null> {
    throw new Error('Not implemented');
  }
  async setActiveFolder(folderId: string): Promise<string> {
    throw new Error('Not implemented');
  }

  async getAllNotes(): Promise<NoteType[]> {
    throw new Error('Not implemented');
  }
  async getNotes(folderId: string): Promise<NoteType[]> {
    throw new Error('Not implemented');
  }
  async getNoteDetail(noteId: string): Promise<NoteType> {
    throw new Error('Not implemented');
  }
  async getDeletedNotes(): Promise<NoteType[]> {
    throw new Error('Not implemented');
  }
  async createNote(data: NoteCreateType): Promise<NoteType> {
    throw new Error('Not implemented');
  }
  async updateNote(noteId: string, data: NoteUpdateType): Promise<NoteType> {
    throw new Error('Not implemented');
  }
  async getActiveNote(): Promise<string | null> {
    throw new Error('Not implemented');
  }
  async setActiveNote(noteId: string): Promise<string> {
    throw new Error('Not implemented');
  }

  // password | settings
  async getSettings(): Promise<any> {
    throw new Error('Not implemented');
  }
  async checkPasswordExist(): Promise<boolean> {
    throw new Error('Not implemented');
  }
  async setPassword(password: string): Promise<string> {
    throw new Error('Not implemented');
  }

  // sync
  async getLastPull(): Promise<number> {
    throw new Error('Not implemented');
  }
  async updateLastPull(now: number): Promise<boolean> {
    throw new Error('Not implemented');
  }
  async getActionObject(): Promise<any> {
    throw new Error('Not implemented');
  }
  async saveActionObject(data: any): Promise<any> {
    throw new Error('Not implemented');
  }

  // import
  async getImportData(): Promise<any> {
    throw new Error('Not implemented');
  }
  async setImportData(data: any): Promise<any> {
    throw new Error('Not implemented');
  }

  // encrypt aes notes
  async generateAESKey(): Promise<CryptoKey> {
    throw new Error('Not implemented');
  }
  async saveAESKey(key: CryptoKey): Promise<string> {
    throw new Error('Not implemented');
  }
  async getAESKey(): Promise<CryptoKey | null> {
    throw new Error('Not implemented');
  }

  // utils
  async checkIsFirstInit(): Promise<boolean> {
    throw new Error('Not implemented');
  }

  // dangerus
  async cleanData(): Promise<boolean> {
    throw new Error('Not implemented');
  }
}

export default NotasStorage;
