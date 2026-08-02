import { createClient } from "@libsql/client/web";
import { LibSQLDatabase, drizzle } from "drizzle-orm/libsql";
import { gt } from "drizzle-orm";

import type NotasAdapter from "../adapter";
import type { FolderType, NoteType, TagType, NoteTagType } from "~/repositories/storage.type";
import { applySchemaMigrations } from "~/migrate/scripts/apply-migrations";

import noteModel from "./models/note";
import folderModel from "./models/folder";
import settingModel from "./models/setting";
import tagModel from "./models/tag";
import noteTagModel from "./models/note-tag";

class TursoAdapter implements NotasAdapter {
  private turso: LibSQLDatabase;
  private ready: Promise<void>;
  constructor(config: string) {
    const configJSON = JSON.parse(config);
    const client = createClient(configJSON);
    this.turso = drizzle(client);
    this.ready = applySchemaMigrations(client);
  }

  async pullFolders(lastSync: number): Promise<FolderType[]> {
    await this.ready;
    const folders = await this.turso
      .select()
      .from(folderModel)
      .where(gt(folderModel.updatedAt, lastSync))
      .all();

    return folders.map((folder: any) => ({
      id: folder.id,
      name: folder.name,
      lastSync: folder.lastSync,
      createdAt: folder.createdAt,
      updatedAt: folder.updatedAt,
      deletedAt: folder.deletedAt || null,
    }));
  }

  async pullNotes(lastSync: number): Promise<NoteType[]> {
    await this.ready;
    const notes = await this.turso
      .select()
      .from(noteModel)
      .where(gt(noteModel.updatedAt, lastSync))
      .all();

    return notes.map((note: any) => ({
      id: note.id,
      folderId: note.folderId,
      content: note.content,
      isLocked: note.isLocked,
      isPinned: note.isPinned,
      lastSync: note.lastSync,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
      deletedAt: note.deletedAt || null,
      deleteCompletelyAt: note.deleteCompletelyAt || null,
    }));
  }

  async pushFolder(folder: any): Promise<any> {
    await this.ready;
    return this.turso
      .insert(folderModel)
      .values({
        id: folder.id,
        name: folder.name,
        lastSync: folder.lastSync,
        createdAt: folder.createdAt,
        updatedAt: folder.updatedAt,
        deletedAt: folder.deletedAt,
      })
      .onConflictDoUpdate({
        target: folderModel.id,
        set: {
          name: folder.name,
          lastSync: folder.lastSync,
          createdAt: folder.createdAt,
          updatedAt: folder.updatedAt,
          deletedAt: folder.deletedAt,
        },
      })
      .returning({
        id: folderModel.id,
        name: folderModel.name,
        lastSync: folderModel.lastSync,
        createdAt: folderModel.createdAt,
        updatedAt: folderModel.updatedAt,
        deletedAt: folderModel.deletedAt,
      })
      .catch((err) => {
        console.log("pushFolder error", err);
      });
  }

  async pushNote(note: any): Promise<any> {
    await this.ready;
    return this.turso
      .insert(noteModel)
      .values({
        id: note.id,
        folderId: note.folderId,
        content: note.content,
        isLocked: note.isLocked,
        isPinned: note.isPinned,
        lastSync: note.lastSync,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
        deletedAt: note.deletedAt,
        deleteCompletelyAt: note.deleteCompletelyAt,
      })
      .onConflictDoUpdate({
        target: noteModel.id,
        set: {
          folderId: note.folderId,
          content: note.content,
          isLocked: note.isLocked,
          isPinned: note.isPinned,
          lastSync: note.lastSync,
          createdAt: note.createdAt,
          updatedAt: note.updatedAt,
          deletedAt: note.deletedAt,
          deleteCompletelyAt: note.deleteCompletelyAt,
        },
      })
      .returning({
        id: noteModel.id,
        folderId: noteModel.folderId,
        content: noteModel.content,
        isLocked: noteModel.isLocked,
        isPinned: noteModel.isPinned,
        lastSync: noteModel.lastSync,
        createdAt: noteModel.createdAt,
        updatedAt: noteModel.updatedAt,
        deletedAt: noteModel.deletedAt,
        deleteCompletelyAt: noteModel.deleteCompletelyAt,
      })
      .catch((err) => {
        console.log("pushNote error", err);
      });
  }

  // tags
  async pullTags(lastSync: number): Promise<TagType[]> {
    await this.ready;
    const tags = await this.turso
      .select()
      .from(tagModel)
      .where(gt(tagModel.updatedAt, lastSync))
      .all();

    return tags.map((tag: any) => ({
      id: tag.id,
      name: tag.name,
      color: tag.color,
      lastSync: tag.lastSync,
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt,
      deletedAt: tag.deletedAt || null,
    }));
  }

  async pushTag(tag: any): Promise<any> {
    await this.ready;
    return this.turso
      .insert(tagModel)
      .values({
        id: tag.id,
        name: tag.name,
        color: tag.color,
        lastSync: tag.lastSync,
        createdAt: tag.createdAt,
        updatedAt: tag.updatedAt,
        deletedAt: tag.deletedAt,
      })
      .onConflictDoUpdate({
        target: tagModel.id,
        set: {
          name: tag.name,
          color: tag.color,
          lastSync: tag.lastSync,
          createdAt: tag.createdAt,
          updatedAt: tag.updatedAt,
          deletedAt: tag.deletedAt,
        },
      })
      .returning({
        id: tagModel.id,
        name: tagModel.name,
        color: tagModel.color,
        lastSync: tagModel.lastSync,
        createdAt: tagModel.createdAt,
        updatedAt: tagModel.updatedAt,
        deletedAt: tagModel.deletedAt,
      })
      .catch((err) => {
        console.log("pushTag error", err);
      });
  }

  async pullNoteTags(lastSync: number): Promise<NoteTagType[]> {
    await this.ready;
    const noteTags = await this.turso
      .select()
      .from(noteTagModel)
      .where(gt(noteTagModel.updatedAt, lastSync))
      .all();

    return noteTags.map((noteTag: any) => ({
      id: noteTag.id,
      noteId: noteTag.noteId,
      tagId: noteTag.tagId,
      lastSync: noteTag.lastSync,
      createdAt: noteTag.createdAt,
      updatedAt: noteTag.updatedAt,
      deletedAt: noteTag.deletedAt || null,
    }));
  }

  async pushNoteTag(noteTag: any): Promise<any> {
    await this.ready;
    return this.turso
      .insert(noteTagModel)
      .values({
        id: noteTag.id,
        noteId: noteTag.noteId,
        tagId: noteTag.tagId,
        lastSync: noteTag.lastSync,
        createdAt: noteTag.createdAt,
        updatedAt: noteTag.updatedAt,
        deletedAt: noteTag.deletedAt,
      })
      .onConflictDoUpdate({
        target: noteTagModel.id,
        set: {
          noteId: noteTag.noteId,
          tagId: noteTag.tagId,
          lastSync: noteTag.lastSync,
          createdAt: noteTag.createdAt,
          updatedAt: noteTag.updatedAt,
          deletedAt: noteTag.deletedAt,
        },
      })
      .returning({
        id: noteTagModel.id,
        noteId: noteTagModel.noteId,
        tagId: noteTagModel.tagId,
        lastSync: noteTagModel.lastSync,
        createdAt: noteTagModel.createdAt,
        updatedAt: noteTagModel.updatedAt,
        deletedAt: noteTagModel.deletedAt,
      })
      .catch((err) => {
        console.log("pushNoteTag error", err);
      });
  }

  // settings
  async pushSettings(setting: any): Promise<any> {
    await this.ready;
    return this.turso
      .insert(settingModel)
      .values({
        id: setting.id,
        password: setting.password,
        lastSync: setting.lastSync,
        updatedAt: setting.updatedAt,
      })
      .onConflictDoUpdate({
        target: settingModel.id,
        set: {
          password: setting.password,
          lastSync: setting.lastSync,
          updatedAt: setting.updatedAt,
        },
      })
      .returning({
        id: settingModel.id,
        password: settingModel.password,
        lastSync: settingModel.lastSync,
        updatedAt: settingModel.updatedAt,
      })
      .catch((err) => {
        console.log("pushSetting error", err);
      });
  }
  async pullSettings(lastSync: number): Promise<any> {
    await this.ready;
    const setting = await this.turso
      .select()
      .from(settingModel)
      .where(gt(settingModel.updatedAt, lastSync))
      .all();
    return setting[0];
  }
}

export default TursoAdapter;
