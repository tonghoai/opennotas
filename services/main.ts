import LocalForageRepository from "~/repositories";

const storage = new LocalForageRepository();

async function getAllFolders() {
  return storage.getAllFolders();
}
async function getFolders(allFolderName: string) {
  const folders = await storage.getFolders();
  const sortFolders = folders.sort((a: any, b: any) => {
    return a.createdAt - b.createdAt;
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
async function getNotes(folderId: string) {
  const notes = await storage.getNotes(folderId);
  const reformatNotes = notes.map((note: any) => {
    const title = !note.isLocked ? note.content.split('\n')[0] : 'Tiêu đề đã khóa';
    const content = !note.isLocked ? note.content.split('\n').slice(1).join('\n').substr(0, 60)?.replace(/(?:\r\n|\r|\n)/g, '')?.trim() : 'Nội dung đã khóa';
    return {
      ...note,
      title,
      content,
    };
  });

  const sortNotes = reformatNotes.sort((a: any, b: any) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return b.updatedAt - a.updatedAt;
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

async function getNoteDetail(noteId: string) {
  return storage.getNoteDetail(noteId);
}

async function getDeletedNotes() {
  const notes = await storage.getDeletedNotes();
  const reformatNotes = notes.map((note: any) => {
    const title = !note.isLocked ? note.content.split('\n')[0] : 'Tiêu đề đã khóa';
    const content = !note.isLocked ? note.content.split('\n').slice(1).join('\n').substr(0, 60) : 'Nội dung đã khóa';
    return {
      ...note,
      title,
      content,
    };
  });

  const sortNotes = reformatNotes.sort((a: any, b: any) => {
    return new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime();
  });

  return sortNotes;
}

async function getSettings() {
  return storage.getSettings();
}
async function setSettings(data: any) {
  return storage.setSettings(data);
}

// sync
async function getLastPull() {
  return storage.getLastPull();
}
async function updateLastPull(now: number) {
  return storage.updateLastPull(now);
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

  getActiveNote,
  setActiveNote,

  getNoteDetail,

  getDeletedNotes,

  getSettings,
  setSettings,

  getLastPull,
  updateLastPull,
  getActionObject,
  saveActionObject,

  checkPasswordExist,
  getPassword,
  setPassword,

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
