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
  isPinned: boolean;
  isLocked: boolean;
  lastSync: number;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
  deleteCompletelyAt: number | null;
}

export type {
  FolderType,
  FolderCreateType,
  FolderUpdateType,

  NoteType,
  NoteCreateType,
  NoteUpdateType,
}
