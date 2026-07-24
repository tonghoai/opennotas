import type { FolderType, NoteType } from "~/repositories/storage.type";

class NotasAdapter {
  async pullFolders(lastSync: number): Promise<FolderType[]> {
    throw new Error("Not implemented");
  }

  async pullNotes(lastSync: number): Promise<NoteType[]> {
    throw new Error("Not implemented");
  }

  async pushFolder(folder: any): Promise<any> {
    throw new Error("Not implemented");
  }

  async pushNote(note: any): Promise<any> {
    throw new Error("Not implemented");
  }

  // settings
  async pushSettings(setting: any): Promise<any> {
    throw new Error("Not implemented");
  }

  async pullSettings(lastSync: number): Promise<any> {
    throw new Error("Not implemented");
  }
}

export default NotasAdapter;
