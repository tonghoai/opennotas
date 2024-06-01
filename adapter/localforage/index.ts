import type { FolderType, NoteType } from "~/repositories/storage.type";
import type NotasAdapter from "../adapter";

class LocalForageAdapter implements NotasAdapter {
  constructor(config: any) {}

  async pullFolders(lastSync: number): Promise<FolderType[]> {
    return [];
  }

  async pullNotes(lastSync: number): Promise<NoteType[]> {
    return [];
  }

  async pushFolder(folder: any): Promise<any> {
    return {};
  }

  async pushNote(note: any): Promise<any> {
    return {};
  }

  // settings
  async pushSettings(setting: any): Promise<any> {
    return {};
  }

  async pullSettings(lastSync: number): Promise<any> {
    return {};
  }
}

export default LocalForageAdapter;
