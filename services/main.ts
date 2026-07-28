import LocalForageRepository from "~/repositories";

const storage = new LocalForageRepository();

async function getAllFolders() {
  return storage.getAllFolders();
}
async function getFolders(allFolderName: string) {
  const folders = await storage.getFolders();
  const sortFolders = folders.sort((a: any, b: any) => {
    if (a.position && b.position && (a.position !== b.position)) {
      return b.position - a.position; // Sắp xếp theo priority giảm dần
    }
    return a.createdAt - b.createdAt; // Nếu priority bằng nhau, sắp xếp theo createdAt
  });

  sortFolders.unshift({
    id: '',
    name: allFolderName,
    lastSync: 0,
    createdAt: 0,
    updatedAt: 0,
    deletedAt: null,
  });
  return sortFolders;
}
async function getFolderDetail(folderId: string) {
  return storage.getFolderDetail(folderId);
}
async function createFolder(folderData?: any) {
  const folderPayload = folderData || {
    id: randomUUID(),
    name: "New Folder",
    lastSync: 0,
    createdAt: nowUnix(),
    updatedAt: nowUnix(),
    deletedAt: null,
  };
  return storage.createFolder(folderPayload);
}
async function updateFolder(folderId: string, data: any) {
  const folderPayload = {
    ...data,
  };
  return storage.updateFolder(folderId, folderPayload);
}
async function deleteFolder(folderId: string) {
  return storage.deleteFolder(folderId);
}
async function getActiveFolder() {
  return storage.getActiveFolder();
}
async function setActiveFolder(folderId: string) {
  return storage.setActiveFolder(folderId);
}

async function getAllNotes() {
  return storage.getAllNotes();
}
// bulk join note -> tags in one pass, avoids an N+1 lookup per note when reformatting a whole list
async function buildTagsByNoteId() {
  const [noteTags, tags] = await Promise.all([storage.getAllNoteTags(), storage.getAllTags()]);
  const tagById = new Map(tags.filter((tag: any) => !tag.deletedAt).map((tag: any) => [tag.id, tag]));
  const tagsByNoteId = new Map<string, any[]>();
  for (const noteTag of noteTags) {
    if (noteTag.deletedAt) continue;
    const tag = tagById.get(noteTag.tagId);
    if (!tag) continue;
    if (!tagsByNoteId.has(noteTag.noteId)) tagsByNoteId.set(noteTag.noteId, []);
    tagsByNoteId.get(noteTag.noteId)!.push(tag);
  }
  return tagsByNoteId;
}

async function getNotes(folderId: string, sortType: 'createdAt' | 'updatedAt', lockedTitle: string, lockedContent: string) {
  const notes = await storage.getNotes(folderId);
  const tagsByNoteId = await buildTagsByNoteId();
  const reformatNotes = notes.map((note: any) => {
    const title = !note.isLocked ? removeSpecialChar(substrTitle(note.content)) : (note.title || lockedTitle);
    const content = !note.isLocked ? removeSpecialChar(substrContent(note.content)) : lockedContent;
    return {
      ...note,
      title,
      content,
      tags: tagsByNoteId.get(note.id) || [],
    };
  });

  const sortNotes = reformatNotes.sort((a: any, b: any) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    if (sortType === 'createdAt') {
      return b.createdAt - a.createdAt;
    } else {
      return b.updatedAt - a.updatedAt;
    }
  });

  return sortNotes;
}
async function getNotesWithContent(folderId: string) {
  return storage.getNotesWithContent(folderId);
}
async function createNote(folderId: string, noteData?: any) {
  const notePayload = noteData || {
    id: randomUUID(),
    folderId: folderId,
    content: "",
    isLocked: false,
    isPinned: false,
    lastSync: 0,
    createdAt: nowUnix(),
    updatedAt: nowUnix(),
    deletedAt: null,
    deleteCompletelyAt: null,
  };
  return storage.createNote(notePayload);
}
async function updateNote(noteId: string, data: any) {
  const notePayload = {
    ...data,
  };

  return storage.updateNote(noteId, notePayload);
}
async function getActiveNote() {
  return storage.getActiveNote();
}
async function setActiveNote(noteId: string) {
  return storage.setActiveNote(noteId);
}
async function getSortNote() {
  return storage.getSortNote();
}
async function setSortNote(sort: 'createdAt' | 'updatedAt') {
  return storage.setSortNote(sort);
}

async function getNoteHistory(noteId: string) {
  return storage.getNoteHistory(noteId);
}
async function addNoteHistorySnapshot(noteId: string, content: string) {
  return storage.addNoteHistorySnapshot(noteId, { id: randomUUID(), content, snapshotAt: nowUnix() });
}
async function deleteNoteHistorySnapshot(noteId: string, snapshotId: string) {
  return storage.deleteNoteHistorySnapshot(noteId, snapshotId);
}

async function getNoteDetail(noteId: string) {
  return storage.getNoteDetail(noteId);
}

async function getDeletedNotes(lockedTitle: string, lockedContent: string) {
  const notes = await storage.getDeletedNotes();
  const tagsByNoteId = await buildTagsByNoteId();
  const reformatNotes = notes.map((note: any) => {
    const title = !note.isLocked ? removeSpecialChar(note.content.split('\n')[0]) : (note.title || lockedTitle);
    const content = !note.isLocked ? removeSpecialChar(note.content.split('\n').slice(1).join('\n').substr(0, 60)) : lockedContent;
    return {
      ...note,
      title,
      content,
      tags: tagsByNoteId.get(note.id) || [],
    };
  });

  const sortNotes = reformatNotes.sort((a: any, b: any) => {
    return new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime();
  });

  return sortNotes;
}

async function getAllTags() {
  return storage.getAllTags();
}
async function getTags() {
  return storage.getTags();
}
async function getTagDetail(tagId: string) {
  return storage.getTagDetail(tagId);
}
async function createTag(tagData?: any) {
  const tagPayload = tagData || {
    id: randomUUID(),
    name: "New Tag",
    lastSync: 0,
    createdAt: nowUnix(),
    updatedAt: nowUnix(),
    deletedAt: null,
  };
  return storage.createTag(tagPayload);
}
async function updateTag(tagId: string, data: any) {
  return storage.updateTag(tagId, { ...data });
}
async function deleteTag(tagId: string) {
  const tag = await storage.getTagDetail(tagId);
  await storage.updateTag(tagId, { ...tag, deletedAt: nowUnix(), updatedAt: nowUnix() });

  const noteTags = await storage.getNoteTagsByTag(tagId);
  for (const noteTag of noteTags) {
    await storage.updateNoteTag(noteTag.id, { deletedAt: nowUnix(), updatedAt: nowUnix() });
  }
  return true;
}

async function getTagsForNote(noteId: string) {
  const noteTags = await storage.getNoteTagsByNote(noteId);
  const tags = await Promise.all(noteTags.map((noteTag: any) => storage.getTagDetail(noteTag.tagId)));
  return tags;
}
async function getNotesForTag(tagId: string, sortType: 'createdAt' | 'updatedAt', lockedTitle: string, lockedContent: string) {
  const noteTags = await storage.getNoteTagsByTag(tagId);
  const notes = await Promise.all(noteTags.map((noteTag: any) => storage.getNoteDetail(noteTag.noteId)));
  const tagsByNoteId = await buildTagsByNoteId();
  const reformatNotes = notes.filter((note: any) => note.id && !note.deletedAt).map((note: any) => {
    const title = !note.isLocked ? removeSpecialChar(substrTitle(note.content)) : (note.title || lockedTitle);
    const content = !note.isLocked ? removeSpecialChar(substrContent(note.content)) : lockedContent;
    return {
      ...note,
      title,
      content,
      tags: tagsByNoteId.get(note.id) || [],
    };
  });

  return reformatNotes.sort((a: any, b: any) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    if (sortType === 'createdAt') {
      return b.createdAt - a.createdAt;
    } else {
      return b.updatedAt - a.updatedAt;
    }
  });
}

// raw passthrough, used both by pull-merge (utils/sync.ts) and the UI-facing helpers below
async function getNoteTagsByNote(noteId: string) {
  return storage.getNoteTagsByNote(noteId);
}
async function getNoteTagsByTag(tagId: string) {
  return storage.getNoteTagsByTag(tagId);
}
async function getNoteTagDetail(noteTagId: string) {
  const noteTags = await storage.getAllNoteTags();
  return noteTags.find((noteTag: any) => noteTag.id === noteTagId) || {};
}
async function createNoteTag(noteTagData: any) {
  return storage.createNoteTag(noteTagData);
}
async function updateNoteTag(noteTagId: string, data: any) {
  return storage.updateNoteTag(noteTagId, { ...data });
}

async function addTagToNote(noteId: string, tagId: string) {
  const noteTagPayload = {
    id: `${noteId}:${tagId}`,
    noteId,
    tagId,
    lastSync: 0,
    createdAt: nowUnix(),
    updatedAt: nowUnix(),
    deletedAt: null,
  };
  return storage.createNoteTag(noteTagPayload);
}
async function removeTagFromNote(noteId: string, tagId: string) {
  return storage.updateNoteTag(`${noteId}:${tagId}`, { deletedAt: nowUnix(), updatedAt: nowUnix() });
}

async function getSettings() {
  return storage.getSettings();
}
async function setSettings(data: any) {
  return storage.setSettings(data);
}

// sync
async function getLastPull() {
  const value = await storage.getLastPull();
  return value > 9_999_999_999 ? Math.floor(value / 1000) : value;
}
async function updateLastPull(now: number) {
  return storage.updateLastPull(now > 9_999_999_999 ? Math.floor(now / 1000) : now);
}
async function getActionObject() {
  return storage.getActionObject();
}
async function saveActionObject(data: any) {
  return storage.saveActionObject(data);
}

// settings
async function checkPasswordExist() {
  return storage.checkPasswordExist();
}
async function getPassword() {
  return storage.getPassword();
}
async function setPassword(password: string) {
  return storage.setPassword(password);
}
async function getPasswordChangeBackup() {
  return storage.getPasswordChangeBackup();
}
async function savePasswordChangeBackup(data: any) {
  return storage.savePasswordChangeBackup(data);
}
async function clearPasswordChangeBackup() {
  return storage.clearPasswordChangeBackup();
}

// import
async function getImportData() {
  return storage.getImportData();
}
async function setImportData(data: any) {
  return storage.setImportData(data);
}

// e2ee key
async function getE2EEKey() {
  return storage.getAESKey();
}
async function saveE2EEKey(key: CryptoKey) {
  return storage.saveAESKey(key);
}

// common
async function getColsWidth() {
  const data = await storage.get('colsWidth') || {};
  return {
    colsFoldersWidth: data.colsFoldersWidth || 234,
    colsNotesWidth: data.colsNotesWidth || 400,
  };
}
async function setColsWidth(data: any) {
  return storage.set('colsWidth', data);
}

// utils
async function checkIsFirstInit() {
  return storage.checkIsFirstInit();
}
async function setFirstInit() {
  return storage.set("firstInit", true);
}
async function checkIsInstalledApp() {
  return !!(await storage.get("installedApp"));
}
async function setInstalledApp() {
  return storage.set("installedApp", true);
}

// dangerus
async function cleanData() {
  return storage.cleanData();
}

export {
  getAllFolders,
  getFolders,
  getFolderDetail,
  createFolder,
  updateFolder,
  deleteFolder,

  getActiveFolder,
  setActiveFolder,

  getAllNotes,
  getNotes,
  getNotesWithContent,
  createNote,
  updateNote,
  buildTagsByNoteId,

  getActiveNote,
  setActiveNote,
  getSortNote,
  setSortNote,
  getNoteDetail,

  getNoteHistory,
  addNoteHistorySnapshot,
  deleteNoteHistorySnapshot,

  getDeletedNotes,

  getAllTags,
  getTags,
  getTagDetail,
  createTag,
  updateTag,
  deleteTag,
  getTagsForNote,
  getNotesForTag,
  getNoteTagsByNote,
  getNoteTagsByTag,
  getNoteTagDetail,
  createNoteTag,
  updateNoteTag,
  addTagToNote,
  removeTagFromNote,

  getSettings,
  setSettings,

  getLastPull,
  updateLastPull,
  getActionObject,
  saveActionObject,

  checkPasswordExist,
  getPassword,
  setPassword,
  getPasswordChangeBackup,
  savePasswordChangeBackup,
  clearPasswordChangeBackup,

  getImportData,
  setImportData,

  getE2EEKey,
  saveE2EEKey,

  getColsWidth,
  setColsWidth,

  checkIsFirstInit,
  setFirstInit,
  checkIsInstalledApp,
  setInstalledApp,

  cleanData,
}
