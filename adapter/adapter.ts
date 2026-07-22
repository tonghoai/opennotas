import type { FolderType, NoteType, TagType, NoteTagType } from "~/repositories/storage.type";

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

  // tags
  async pullTags(lastSync: number): Promise<TagType[]> {
    throw new Error("Not implemented");
  }

  async pushTag(tag: any): Promise<any> {
    throw new Error("Not implemented");
  }

  async pullNoteTags(lastSync: number): Promise<NoteTagType[]> {
    throw new Error("Not implemented");
  }

  async pushNoteTag(noteTag: any): Promise<any> {
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
