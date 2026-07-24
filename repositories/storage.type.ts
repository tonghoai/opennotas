type FolderType = {
  id: string;
  name: string;
  lastSync: number;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
}

type FolderCreateType = {
  id: string;
  name: string;
  lastSync: number;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
}

type FolderUpdateType = {
  name: string;
  position: number;
  lastSync: number;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
}

type NoteType = {
  id: string;
  folderId: string;
  content: string;
  title?: string;
  isPinned: boolean;
  isLocked: boolean;
  lastSync: number;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
  deleteCompletelyAt: number | null;
}
type NoteCreateType = {
  id: string;
  folderId: string;
  content: string;
  title?: string;
  isPinned: boolean;
  isLocked: boolean;
  lastSync: number;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
  deleteCompletelyAt: number | null;
}

type NoteUpdateType = {
  folderId: string;
  content: string;
  title?: string;
  isPinned: boolean;
  isLocked: boolean;
  lastSync: number;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
  deleteCompletelyAt: number | null;
}

type NoteSortType = 'createdAt' | 'updatedAt';

type TagType = {
  id: string;
  name: string;
  color?: string;
  lastSync: number;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
}

type TagCreateType = TagType;

type TagUpdateType = {
  name: string;
  color?: string;
  lastSync: number;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
}

type NoteTagType = {
  id: string;
  noteId: string;
  tagId: string;
  lastSync: number;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
}

type NoteTagCreateType = NoteTagType;

export type {
  FolderType,
  FolderCreateType,
  FolderUpdateType,

  NoteType,
  NoteCreateType,
  NoteUpdateType,
  NoteSortType,

  TagType,
  TagCreateType,
  TagUpdateType,

  NoteTagType,
  NoteTagCreateType,
}
