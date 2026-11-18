export const BASE_TIME = 1_700_000_000;

export function makeFolder(overrides: Record<string, any> = {}) {
  return {
    id: 'folder-1',
    name: 'Work',
    lastSync: 0,
    createdAt: BASE_TIME,
    updatedAt: BASE_TIME,
    deletedAt: null,
    ...overrides,
  };
}

export function makeNote(overrides: Record<string, any> = {}) {
  return {
    id: 'note-1',
    folderId: 'folder-1',
    content: '# First note\nSome body copy',
    isPinned: false,
    isLocked: false,
    lastSync: 0,
    createdAt: BASE_TIME,
    updatedAt: BASE_TIME,
    deletedAt: null,
    deleteCompletelyAt: null,
    ...overrides,
  };
}

export function makeTag(overrides: Record<string, any> = {}) {
  return {
    id: 'tag-1',
    name: 'Ideas',
    color: '#ff8800',
    lastSync: 0,
    createdAt: BASE_TIME,
    updatedAt: BASE_TIME,
    deletedAt: null,
    ...overrides,
  };
}

export function makeNoteTag(overrides: Record<string, any> = {}) {
  return {
    id: 'note-1:tag-1',
    noteId: 'note-1',
    tagId: 'tag-1',
    lastSync: 0,
    createdAt: BASE_TIME,
    updatedAt: BASE_TIME,
    deletedAt: null,
    ...overrides,
  };
}
