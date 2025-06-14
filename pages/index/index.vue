<script setup lang="ts">
import { onMounted, ref, toRaw } from 'vue';
const { $i18n } = useNuxtApp();
const { locale } = useI18n();

import {
  createFolder,
  createNote,
  getActiveFolder,
  getActiveNote,
  getDeletedNotes,
  getFolders,
  getNoteDetail,
  getNotes,
  setActiveFolder,
  setActiveNote,
  updateFolder,
  updateNote,
  updateLastPull,
  checkPasswordExist,
  setPassword,
  getSettings,
  getAllNotes,
  setSettings,
  getActionObject,
  saveActionObject,
  getImportData,
  getLastPull,
  cleanData,
  getNotesWithContent,
  getPassword,
  saveE2EEKey,
  getE2EEKey,
  getColsWidth,
  setColsWidth,
  setImportData,
  checkIsFirstInit,
  setFirstInit,
} from '../../services/main';
import Mutex from "~/utils/mutex";

const { setLocale } = useI18n();
const runtimeConfig = useRuntimeConfig();
const colorMode = useColorMode();
const route = useRoute();

const isInEditor = ref<boolean>(false);
watch(() => route.params, () => {
  if (!route.query.noteId) {
    isInEditor.value = false;
    formNotes.value = {};
  }
});

// function for update viewport height
function updateViewportHeight() {
  const viewportHeight = globalThis.innerHeight;
  document.documentElement.style.setProperty(
    "--vh",
    `${viewportHeight * 0.01}px`,
  );
}

// all init for app
const privateKey = ref<CryptoKey>(); // using to decrypt/encrypt sync data
onMounted(async () => {
  if (runtimeConfig.public.env === 'production') {
    registerServiceWorker();
  }

  updateViewportHeight();

  window.history.replaceState({}, '', window.location.pathname); // reset query params
  outsideClickMenu(); // handle outside click for menu

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === 'visible') {
      idleSync(true);
    }
  });

  // document.addEventListener('gesturestart', function (e) {
  //   e.preventDefault();
  // });
  // document.addEventListener('gesturechange', function (e) {
  //   e.preventDefault();
  // });
  // document.addEventListener('gestureend', function (e) {
  //   e.preventDefault();
  // });
  window.addEventListener('resize', handleResizeScreen);
  window.addEventListener('resize', updateViewportHeight);

  const localKey = await getE2EEKey();
  if (localKey) {
    privateKey.value = localKey;
  }

  // if (!isMobile.value) {
  //   setTimeout(() => {
  //     document.getElementById('folders-instance') && new (window as any)
  //       .SimpleBar(document.getElementById('folders-instance'), { autoHide: true, clickOnTrack: false });
  //     document.getElementById('notes-instance') && new (window as any)
  //       .SimpleBar(document.getElementById('notes-instance'), { autoHide: true, clickOnTrack: false });
  //     document.getElementById('form-editors') && new (window as any)
  //       .SimpleBar(document.getElementById('form-editors'), { autoHide: true, clickOnTrack: false });
  //   }, 100);
  // }
});


// init data notes if first time access
onMounted(async () => {
  const isFirstInit = await checkIsFirstInit();
  if (isFirstInit) {
    const notes = await fetch('/opennotas.json').then((res) => res.json());
    await setImportData(notes);
    await handleTriggerImportNotes();
    await setFirstInit();
  }
});

// reloadNotes & reloadFolder using for reload all data display on screen
const listNotesKey = ref<number>(0);
const reloadNotes = async (focus = true, isTrash = false) => {
  await nextTick();
  listNotes.value = isTrash ? await loadTrashNotes() : await loadNotes();
  activeNoteId.value = await loadActiveNote() || "";

  if (!isMobile.value) {
    formNotes.value = await getNoteDetail(activeNoteId.value);
  }

  if (!isMobile.value && listNotes.value.find((note: any) => note.id === activeNoteId.value)) {
    if (focus) {
      formNotesRef.value?.focus();
    }
  } else if (!isMobile.value) {
    formNotes.value = {};
  }
}
const reloadFolder = async (isFirst: boolean = false, focus = true) => {
  await nextTick();
  listFoldersMenu.value = await loadFolder();
  const activeFolder = await loadActiveFolder();
  activeFolderId.value = (isFirst && activeFolder === 'bottombar-trash') ? "" : activeFolder || "";

  await reloadNotes(focus, isFirst ? false : activeFolder === 'bottombar-trash');
}

// initedApp using for app ready to use
const initedApp = ref<boolean>(false);
watch(() => initedApp.value, (newVal) => {
  if (newVal) {
    if (settings.value.sync?.adapter !== 'LocalForage' && navigator.onLine) {
      showInfoSnackbar($i18n.t('app.message_sync_init'));
    }

    idleSync(true, newVal);
    // handle interact cols
    handleInteractCols(isMobile.value, navbarTopRef, colsFoldersWidth, colsNotesWidth, setColsWidthData);
  }
});
const colsFoldersWidth = ref<number>(234);
const colsNotesWidth = ref<number>(400);
const setColsWidthData = async () => {
  await setColsWidth({
    colsFoldersWidth: colsFoldersWidth.value,
    colsNotesWidth: colsNotesWidth.value,
  });
}

// first load app settings
// if settings not exist, use default settings
const settings = ref<any>(getDefaultSettings());
onMounted(async () => {
  const oldSettings = await getSettings();
  const mergeSettings = deepMerge(settings.value, oldSettings);
  if (mergeSettings.general) {
    settings.value = mergeSettings;
    setLocale(settings.value.general.lang);
  }
});

// all logic for folder
const allFolderName = ref<string>($i18n.t('app.list_folder_all'));
watch(locale, () => {
  allFolderName.value = $i18n.t('app.list_folder_all');
  reloadFolder(true);
});
const loadFolder = async () => {
  return getFolders(allFolderName.value);
}
const loadActiveFolder = async () => {
  return getActiveFolder();
}
const listFoldersMenu = ref<any[]>([]);
onMounted(async () => {
  reloadFolder(true);

  setTimeout(() => {
    initedApp.value = true;

    if (isMobile.value) {
      formNotes.value = {};
    }
  }, 100);
});
const isSyncAll = ref<boolean>(false);
const handleClickUpdateData = async () => {
  toggleModalMenuSidebar(false, isShowModalMenuSidebar);

  isSyncAll.value = true;
  lastPull.value = 0;
  await pullPush().catch(() => { });
  isSyncAll.value = false;

  showInfoSnackbar($i18n.t('app.message_sync_all_notes'));
}
const handleClickAddFolder = async () => {
  toggleModalMenuSidebar(false, isShowModalMenuSidebar);

  const newFolder = await createFolder();
  setActionObject('folder', newFolder);
  await updateLastPull(nowUnix());
  listFoldersMenu.value = await loadFolder();
  handleClickFolderName(newFolder.id);
};
const activeFolderId = ref<string>("");
const activeFolderName = computed(() => {
  const folder = listFoldersMenu.value.find((folder: any) => folder.id === activeFolderId.value);
  return folder?.name || "";
});
const handleClickFolderName = async (folderId: string) => {
  navbarTopRef.value?.resetSearchInput();
  toolbarNotesRef.value?.resetSearchInput();
  activeFolderId.value = folderId;
  setActiveFolder(folderId);

  reloadNotes();
};
const isShowModalMenuFolder = ref<boolean>(false);
const menuFolderKey = ref<number>(0);
const handleRightClickFolderName = (data: any) => {
  // ẩn menu note
  hideMenuNote();

  if (isMobile.value) {
    handleClickFolderName(data.folderId);
    menuFolderKey.value += 1;
    toggleModalMenuFolder(true, isShowModalMenuFolder);
  } else {
    menuFolderKey.value += 1;
    handleClickFolderName(data.folderId);
    offsetMenuFolder(data);
  }
};
const listFolderRef = ref<any>(null);
const isShowModalChangeFolderName = ref<boolean>(false);
const handleClickCloseModalChangeFolderName = () => {
  toggleModalChangeFolderName(false, isShowModalChangeFolderName);
}
const handleClickRenameFolder = () => {
  toggleModalMenuFolder(false, isShowModalMenuFolder);
  toggleModalChangeFolderName(true, isShowModalChangeFolderName);
}
const modalChangeFolderNameRef = ref<any>(null);
const handleRenameFolderName = async (data: any) => {
  const updatedFolder = await updateFolder(data.folderId, {
    name: data.folderNewName,
    updatedAt: nowUnix(),
  });
  setActionObject('folder', updatedFolder);
  modalChangeFolderNameRef.value?.reset();
  toggleModalChangeFolderName(false, isShowModalChangeFolderName);

  reloadFolder();
}
const handleReorderFolderName = async (data: any[]) => {
  for (const [index, folder] of data.entries()) {
    if (folder.id !== '') {
      await updateFolder(folder.id, {
        position: data.length - index,
      });
    }
  }

  reloadFolder();
}
const folderWillDelete = ref<string>("");
const isShowModalConfirmDeleteFolder = ref<boolean>(false);
const handleClickCloseModalConfirmDeleteFolder = () => {
  toggleModalConfirmDeleteFolder(false, isShowModalConfirmDeleteFolder);
}
const handleClickDeleteFolder = async (folderId: string) => {
  folderWillDelete.value = folderId;
  toggleModalMenuFolder(false, isShowModalMenuFolder);
  toggleModalConfirmDeleteFolder(true, isShowModalConfirmDeleteFolder);
}
const handleConfirmDeleteFolder = async (folderId: string) => {
  toggleModalMenuFolder(false, isShowModalMenuFolder);
  const updatedFolder = await updateFolder(folderId, {
    deletedAt: nowUnix(),
    updatedAt: nowUnix(),
  });
  setActionObject('folder', updatedFolder);

  const notesInFolder = await getNotes(folderId);
  for (const note of notesInFolder) {
    const updatedNote = await updateNote(note.id, {
      deletedAt: nowUnix(),
      updatedAt: nowUnix(),
    });
    setActionObject('note', updatedNote);
  }

  toggleModalConfirmDeleteFolder(false, isShowModalConfirmDeleteFolder);
  showInfoSnackbar($i18n.t('app.message_folder_deleted'));

  await setActiveFolder('');
  reloadFolder();
}
const handleClickBottombarTrash = async () => {
  activeFolderId.value = 'bottombar-trash';
  setActiveFolder('bottombar-trash');

  listNotes.value = await loadTrashNotes();

  if (listNotes.value.find((note: any) => note.id === activeNoteId.value)) {
    formNotes.value = await getNoteDetail(activeNoteId.value);
  } else {
    formNotes.value = {};
  }
}
const isShowModalMenuSidebar = ref<boolean>(false);
const handleClickMenuSidebar = (e: any) => {
  toggleModalMenuSidebar(true, isShowModalMenuSidebar);
}


// all logic for notes
const loadNotes = async () => {
  return getNotes(activeFolderId.value);
}
const loadActiveNote = async () => {
  return getActiveNote();
}
const loadTrashNotes = async () => {
  return getDeletedNotes();
}

const listNotes = ref<any[]>([]);
const handleClickAddNote = async () => {
  const newNote = await createNote(activeFolderId.value);
  setActionObject('note', newNote);
  listNotes.value = await loadNotes();

  handleClickNote(newNote.id, true);
};
const handleClickSearch = async (value: string) => {
  if (!value) {
    listNotes.value = await loadNotes();
    navbarTopRef.value?.searchLoadingDone();
    toolbarNotesRef.value?.searchLoadingDone();
    return;
  }

  const currentNotes = await loadNotes();
  const result = flexsearch!.search({
    query: value,
    highlight: {
      template: "<b>$1</b>",
      boundary: {
        before: 3,
        after: 3,
      }
    },
  });
  // await reloadNotes(false, activeFolderId.value === 'bottombar-trash');
  // listNotes.value = currentNotes.filter((item: any) => result[0]?.result?.includes(item.id));
  listNotes.value = result[0]?.result.reduce((acc: any[], item: any) => {
    const currentNote = currentNotes.find((note: any) => note.id === item.id);
    currentNote.highlight = item.highlight;
    acc.push(currentNote);

    return acc;
  }, []);
  navbarTopRef.value?.searchLoadingDone();
  toolbarNotesRef.value?.searchLoadingDone();

  if (!listNotes.value.length) {
    showInfoSnackbar($i18n.t('app.message_search_no_result'));
  }
}
const handleClickCancelSearch = async () => {
  listNotes.value = await loadNotes();
}
const activeNoteId = ref<string>("");
const handleClickNote = async (noteId: string, inEditor: boolean = false) => {
  activeNoteId.value = noteId;
  setActiveNote(noteId);
  formNotes.value = await getNoteDetail(activeNoteId.value);
  setTimeout(() => {
    formNotesRef.value?.focusPassword();

    if (!isMobile.value || !formNotes.value.content) {
      formNotesRef.value?.focus();
    }
  }, 100);

  if (inEditor) {
    isInEditor.value = true;

    // if mobile, push state to change url
    if (isMobile.value) {
      window.history.pushState({}, '', `?noteId=${noteId}`);
    }
  }
};
const isShowModalMenuNote = ref<boolean>(false);
const handleRightClickNote = (data: any) => {
  // ẩn menu folder
  hideMenuFolder();

  if (isMobile.value) {
    handleClickNote(data.noteId);
    menuNoteKey.value += 1;
    toggleModalMenuNote(true, isShowModalMenuNote);
  } else {
    menuNoteKey.value += 1;
    handleClickNote(data.noteId, true);
    offsetMenuNote(data);
  }
};

const menuNoteKey = ref<number>(0);
const handleClickDeleteNote = async (noteId: string) => {
  toggleModalMenuNote(false, isShowModalMenuNote);

  const updatedNote = await updateNote(noteId, {
    deletedAt: nowUnix(),
    updatedAt: nowUnix(),
  });
  setActionObject('note', updatedNote);

  listNotes.value = await loadNotes();
  formNotes.value = {};
}
const handleClickDeleteNoteForever = async (noteId: string) => {
  const updatedNote = await updateNote(noteId, {
    deleteCompletelyAt: nowUnix(),
    updatedAt: nowUnix(),
  });
  setActionObject('note', updatedNote);

  listNotes.value = await loadTrashNotes();
  formNotes.value = {};
  toggleModalMenuNote(false, isShowModalMenuNote);
}
const handleClickPinNote = async (data: any) => {
  toggleModalMenuNote(false, isShowModalMenuNote);

  const updatedNote = await updateNote(data.noteId, {
    isPinned: data.status == 1 ? 0 : 1,
    updatedAt: nowUnix(),
  });
  setActionObject('note', updatedNote);

  listNotes.value = await loadNotes();
}
const isShowModalUnlockNotes = ref<boolean>(false);
const handleClickCloseModalUnlockNotes = () => {
  toggleModalUnlockNotes(false, isShowModalUnlockNotes);
}
const isShowModalAlertSetPassword = ref<boolean>(false);
const handleClickCloseModalAlertSetPassword = () => {
  toggleModalAlertSetPassword(false, isShowModalAlertSetPassword);
}
const handleClickLockNote = async (data: any) => {
  if (data.status) {
    toggleModalMenuNote(false, isShowModalMenuNote);
    toggleModalUnlockNotes(true, isShowModalUnlockNotes);
    return;
  }

  const isPasswordExist = await checkPasswordExist();
  if (!isPasswordExist) {
    toggleModalMenuNote(false, isShowModalMenuNote);
    toggleModalAlertSetPassword(true, isShowModalAlertSetPassword);
    return;
  }

  toggleModalMenuNote(false, isShowModalMenuNote);

  const password = await getPassword();
  const note = await getNoteDetail(data.noteId);
  const updatedNote = await updateNote(data.noteId, {
    isLocked: data.status == 1 ? 0 : 1,
    content: data.status == 1 ? await decryptData(note.content, password)
      : await encryptData(note.content, password),
    updatedAt: nowUnix(),
  });

  setActionObject('note', updatedNote);
  listNotes.value = await loadNotes();
}
const modalUnlockNotesRef = ref<any>(null);
const handleUnlockNote = async (data: any) => {
  toggleModalMenuNote(false, isShowModalMenuNote);

  try {
    const password = await getPassword();
    const newHashPassword = await hashPassword(data.password);
    if (password !== newHashPassword) {
      throw new Error('Password is wrong');
    }

    const note = await getNoteDetail(data.noteId);
    const updatedNote = await updateNote(data.noteId, {
      isLocked: 0,
      content: await decryptData(note.content, password),
      updatedAt: nowUnix(),
    });
    setActionObject('note', updatedNote);

    listNotes.value = await loadNotes();
    formNotes.value = await getNoteDetail(activeNoteId.value);

    toggleModalUnlockNotes(false, isShowModalUnlockNotes);
    showInfoSnackbar($i18n.t('app.message_note_unlocked'));
  } catch (error) {
    modalUnlockNotesRef.value?.showFailedPassword();
    showErrorSnackbar($i18n.t('app.message_note_unlocked_failed'));
  }
}
const handleClickRestoreNote = async (noteId: string) => {
  toggleModalMenuNote(false, isShowModalMenuNote);

  await updateNote(noteId, {
    folderId: "",
    deletedAt: null,
    updatedAt: nowUnix(),
  });
  setActionObject('note', { id: noteId });

  listNotes.value = await loadTrashNotes();
  formNotes.value = {};
  showInfoSnackbar($i18n.t('app.message_note_restored'));
}


// all logic for form notes
const formNotesRef = ref<any>(null);
const formNotes = ref<any>({
  id: "",
  title: "",
  content: "",
  isPinned: 0,
  isLocked: 0,
  updatedAt: "",
  createdAt: "",
});
const handleConfirmPassword = async (password: string) => {
  try {
    const currentPassword = await getPassword();
    const newHashPassword = await hashPassword(password);
    if (currentPassword !== newHashPassword) {
      throw new Error($i18n.t('app.message_note_unlocked_failed'));
    }

    formNotes.value.content = await decryptData(formNotes.value.content, currentPassword);
    formNotes.value.isLocked = false;
    formNotesRef.value?.resetPassword();
    showInfoSnackbar($i18n.t('app.message_note_unlocked'));
  } catch (error) {
    formNotesRef.value?.wrongPassword();
    showErrorSnackbar($i18n.t('app.message_note_unlocked_failed'));
  }
};
let debounceChangeContent: any = null;
const handleChangeContent = async ({ content: newVal, id }: { content: string, id: string }) => {
  await mutex.acquire();
  idleKey.value += 1;
  // clearTimeout(debounceChangeContent);
  // debounceChangeContent = setTimeout(async () => {
  const note = await getNoteDetail(id);
  const updatedNote = await updateNote(id, {
    content: note.isLocked ? await encryptData(newVal, await getPassword()) : newVal,
    updatedAt: nowUnix(),
    ...(settings.value.sync?.adapter !== 'LocalForage' && {
      lastSync: nowUnix(),
    }),
  });

  clearTimeout(debounceChangeContent);
  debounceChangeContent = setTimeout(async () => {
    if (!note.isLocked) {
      const findNoteIndex = listNotes.value.findIndex((note: any) => note.id === id);
      listNotes.value[findNoteIndex].title = substrTitle(newVal)
      listNotes.value[findNoteIndex].content = substrContent(newVal);
      reloadFolder(false, false);
    }
  }, 1000);

  setActionObject('note', updatedNote);
  mutex.release();
  // }, 1000);
};
const handleCopyToClipboard = async () => {
  toggleModalMenuNote(false, isShowModalMenuNote);

  if (formNotes.value.isLocked) {
    showErrorSnackbar($i18n.t('app.message_note_copied_clipboard_lock_error'));
    return;
  }

  const note = await getNoteDetail(activeNoteId.value);
  navigator.clipboard.writeText(note.content);
  showInfoSnackbar($i18n.t('app.message_note_copied_clipboard'));
};
const noteInfo = ref<any>({
  lastSync: 0,
  content: "",
  createdAt: "",
  updatedAt: "",
});
const isShowModalNotesDetail = ref<boolean>(false);
const handleClickCloseNotesDetail = () => {
  toggleModalNotesDetail(false, isShowModalNotesDetail);
}
const handleClickFormNotesInfo = async (noteId: string) => {
  const note = await getNoteDetail(noteId);
  noteInfo.value = {
    content: note.content,
    lastSync: note.lastSync,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  };
  toggleModalNotesDetail(true, isShowModalNotesDetail);
}
const handleClickResizeApp = () => {
  colsFoldersWidth.value = 234;
  colsNotesWidth.value = 400;
  setColsWidthData();
  window.resizeTo(1167, 700);
}
const handleClickBack = () => {
  if (window.history.length > 1) {
    window.history.back();
  } else {
    window.location.href = '/';
  }

  isInEditor.value = false;
}
const handleClickUndo = async () => {
  formNotesRef.value?.undo();
}
const handleClickRedo = async () => {
  formNotesRef.value?.redo();
}
const isCollapsePanel = ref<boolean>(false);
const handleClickCollapsePanel = () => {
  isCollapsePanel.value = !isCollapsePanel.value;
}
const isShowToolbarNotes = ref<boolean>(true);
watch(() => isCollapsePanel.value, (newValue) => {
  if (newValue) {
    setTimeout(() => {
      isShowToolbarNotes.value = !newValue;
    }, 290);
  } else {
    isShowToolbarNotes.value = true;
  }
});
const isShowFormatToolbar = ref<boolean>(false);
const handleClickFormatToolbar = () => {
  isShowFormatToolbar.value = !isShowFormatToolbar.value;
}
watch(() => activeNoteId.value, () => {
  isShowFormatToolbar.value = false;
});
watch(() => activeFolderId.value, () => {
  isShowFormatToolbar.value = false;
});

const editorName = ref<string>(settings.value.general.defaultEditor);
watch(() => settings.value.general.defaultEditor, (newValue) => {
  editorName.value = newValue;
});
const changeEditorEvent = ref<any>(null);
const handleClickSwitchEditor = async (nodeId: string) => {
  await handleClickNote(nodeId);
  changeEditorEvent.value = !changeEditorEvent.value;
  // codemirror -> tiptap
  switch (editorName.value) {
    case 'Tiptap':
      editorName.value = 'CodeMirror';
      break;
    case 'CodeMirror':
      editorName.value = 'Tiptap';
      break;
    default:
      break;
  }
}
const isShowModalInsertLink = ref<boolean>(false);
const modalInsertLinkRef = ref<any>(null);
const handleClickInsertLink = (data: { url: string }) => {
  toggleModalInsertLink(true, isShowModalInsertLink);
  if (data.url) {
    setTimeout(() => {
      modalInsertLinkRef.value?.setURL(data.url);
    }, 100);
  }
}
const handleClickCloseModalInsertLink = () => {
  modalInsertLinkRef.value?.reset();
  toggleModalInsertLink(false, isShowModalInsertLink);
}
const handleConfirmInsertLink = (data: any) => {
  formNotesRef.value?.handleInsertLink(data);
}

const isShowModalInsertImage = ref<boolean>(false);
const modalInsertImageRef = ref<any>(null);
const handleClickInsertImage = (data: { url: string, alt: string }) => {
  toggleModalInsertImage(true, isShowModalInsertImage);
  if (data.url) {
    setTimeout(() => {
      modalInsertImageRef.value?.setURL({ url: data.url, alt: data.alt });
    }, 100);
  }
}
const handleClickCloseModalInsertImage = () => {
  modalInsertImageRef.value?.reset();
  toggleModalInsertImage(false, isShowModalInsertImage);
}
const handleConfirmInsertImage = (data: any) => {
  formNotesRef.value?.handleInsertImage(data);
}

// search notes feature
// flow: load notes with content -> create Document instance -> search
const loadNotesWithContent = async (folderId: string) => {
  return getNotesWithContent(folderId);
}
const listNotesToSearch = ref<any[]>([]);
let flexsearch: any | null = null;
onMounted(() => {
  setTimeout(async () => {
    listNotesToSearch.value = await loadNotesWithContent(activeFolderId.value);
    flexsearch = newFlexSearch();

    listNotesToSearch.value.forEach((note: any) => {
      addToFlexSearch(flexsearch, toRaw(note));
    });
  }, 1000);
});
watch(() => activeFolderId.value, async () => {
  await new Promise(resolve => setTimeout(resolve, 500));
  listNotesToSearch.value = await loadNotesWithContent(activeFolderId.value);
  flexsearch = newFlexSearch();

  listNotesToSearch.value.forEach((note: any) => {
    addToFlexSearch(flexsearch, toRaw(note));
  });
});


// all logic of settings
const handleChangeDefaultEditor = async () => {
  settings.value = await getSettings();

  reloadFolder();
}
const handleSaveSettings = async (data: any) => {
  settings.value = data;
  await setSettings(data);
}
const modalSettingRef = ref<any>(null);
const modalSetPasswordRef = ref<any>(null);
const isPasswordExist = ref<boolean>(false);
onMounted(async () => {
  isPasswordExist.value = await checkPasswordExist();
});
const handleSetPassword = async (data: any) => {
  const hash = await hashPassword(data.newPassword);
  await setPassword(hash);
  setActionObject('settings', { 'id': 'settings' });

  isPasswordExist.value = true;
  modalSettingRef.value?.closeSetPasswordModal();
  modalSetPasswordRef.value?.reset();
}
const handleChangePassword = async (data: any) => {
  try {
    const password = await getPassword();
    const newHashPassword = await hashPassword(data.oldPassword);
    if (password !== newHashPassword) {
      throw new Error($i18n.t('app.message_note_unlocked_failed'));
    }

    // find all notes locked and unlock
    const allNotes = await getAllNotes();
    const notesLocked = allNotes.filter((note: any) => note.isLocked && !note.deleteCompletelyAt);
    const hashNewPassword = await hashPassword(data.newPassword);
    for (const note of notesLocked) {
      const noteDetail = await getNoteDetail(note.id);
      const decryptNoteDetailContent = await decryptData(noteDetail.content, password);

      const updatedNote = await updateNote(note.id, {
        isLocked: 1,
        content: await encryptData(decryptNoteDetailContent, hashNewPassword),
        updatedAt: nowUnix(),
      });
      setActionObject('note', updatedNote);
    }

    await setPassword(await hashPassword(data.newPassword));
    setActionObject('settings', { 'id': 'settings' });

    toggleModalSetPassword(false, isShowModalSetPassword);
    showInfoSnackbar($i18n.t('app.message_change_password_success'), document.getElementById('modal-settings')!);
    modalSetPasswordRef.value?.reset();
  } catch (error) {
    modalSetPasswordRef.value?.showOldPasswordWrong();
    return;
  }
}
const handleConfirmSetPassword = async (data: any) => {
  if (data.oldPassword && data.newPassword) {
    handleChangePassword(data);
  } else {
    handleSetPassword(data);
  }
}
const isShowModalSetPassword = ref<boolean>(false);
const handleClickSetPassword = () => {
  toggleModalSetPassword(true, isShowModalSetPassword);
}
const handleCloseSetPassword = () => {
  toggleModalSetPassword(false, isShowModalSetPassword);
}
const adapterWillChange = ref<string>("");
const handleSaveAdapter = async (adapterName: string) => {
  adapterWillChange.value = adapterName;
  toggleModalConfirmChangeAdapter(true, isShowModalConfirmChangeAdapter);
}
const handleChangeAdapter = async () => {
  await cleanData();
  reloadFolder();
}
const isShowModalConfirmChangeAdapter = ref<boolean>(false);
const handleClickCloseModalConfirmChangeAdapter = () => {
  toggleModalConfirmChangeAdapter(false, isShowModalConfirmChangeAdapter);
}
const handleConfirmChangeAdapter = async (e2eeKey: string) => {
  // automatically export notes if user change adapter
  await handleExportNotes(true);

  settings.value.sync.adapter = adapterWillChange.value;
  await handleChangeAdapter();
  await handleSaveSettings(settings.value);

  if (e2eeKey) {
    const keyString = atob(e2eeKey);
    const key = await importKey(keyString);
    await saveE2EEKey(key);
    privateKey.value = key;

    saveTextFile(e2eeKey, 'opennotas-e2ee-key.txt');
  }

  toggleModalConfirmChangeAdapter(false, isShowModalConfirmChangeAdapter);
  showInfoSnackbar($i18n.t('app.message_setting_sync_adapter_saved'));

  // trigger 1 time sync to push data to new adapter
  handleClickUpdateData();
}
const isShowModalConfirmE2eeKey = ref<boolean>(false);
const handleClickCloseModalConfirmE2eeKey = () => {
  toggleModalConfirmE2eeKey(false, isShowModalConfirmE2eeKey);
}
const handleConfirmChangeAdapterOnline = async () => {
  if (adapterWillChange.value === 'LocalForage') {
    toggleModalConfirmChangeAdapter(false, isShowModalConfirmChangeAdapter);
    return handleConfirmChangeAdapter('');
  }

  toggleModalConfirmChangeAdapter(false, isShowModalConfirmChangeAdapter);
  toggleModalConfirmE2eeKey(true, isShowModalConfirmE2eeKey);
}
const isShowModalExportNotesConfirm = ref<boolean>(false);
const handleClickCloseModalExportNotesConfirm = () => {
  toggleModalExportNotesConfirm(false, isShowModalExportNotesConfirm);
}
const handleClickExportNotes = async () => {
  // if password exist, need to input password to export notes
  // else, only export notes without password
  const password = await getPassword();
  if (password) {
    toggleModalExportNotesConfirm(true, isShowModalExportNotesConfirm);
    return;
  }

  return handleExportNotes(false);
}

const handleExportNotes = async (includeLock: boolean) => {
  const notes = await getAllNotes();
  const folders = await getFolders($i18n.t('app.list_folder_all'));
  const foldersObject = folders.reduce((acc: any, folder: any) => {
    acc[folder.id] = folder.name;
    return acc;
  }, {});

  const notesFiltered = notes.filter((note: any) => !note.deleteCompletelyAt);
  const notesReformated = [];

  for (const note of notesFiltered) {
    if (!includeLock && note.isLocked) {
      continue;
    }

    const password = await getPassword();
    const folderName = note.folderId ? foldersObject[note.folderId] : "";
    notesReformated.push({
      folderName: folderName,
      content: note.isLocked ? await decryptData(note.content, password) : note.content,
      createdAt: note.createdAt,
      deletedAt: note.deletedAt,
    });
  }

  const dataExport = {
    data: notesReformated,
    metadata: {
      version: runtimeConfig.public.version,
      exportedAt: new Date().toISOString(),
    }
  };
  const data = JSON.stringify(dataExport, null, 2);
  saveJsonFile(data, 'opennotas-export-notes.json');
}
const navbarTopRef = ref<any>(null);
const toolbarNotesRef = ref<any>(null);
const isShowModalImportNotes = ref<boolean>(false);
const handleClickCloseModalImportNotes = () => {
  toggleModalImportNotes(false, isShowModalImportNotes);
}
const handleClickImportNotes = () => {
  toggleModalImportNotes(true, isShowModalImportNotes);
}
const handleTriggerImportNotes = async () => {
  const jsonData: any = await getImportData();

  const foldersInJson = jsonData.data.map((note: any) => note.folderName);
  const foldersInJsonUnique = [...new Set(foldersInJson)];
  const localFoldersName = listFoldersMenu.value.map((folder: any) => folder.name);
  for (const folderName of foldersInJsonUnique) {
    if (!folderName) {
      continue;
    }

    if (!localFoldersName.includes(folderName)) {
      const newFolder = await createFolder({
        id: randomUUID(),
        name: folderName,
        lastSync: 0,
        createdAt: nowUnix(),
        updatedAt: nowUnix(),
        deletedAt: null,
      });
      setActionObject('folder', newFolder);
    }
  }
  await reloadFolder();
  const foldersObj = listFoldersMenu.value.reduce((acc: any, folder: any) => {
    if (folder.id) {
      acc[folder.name] = folder.id;
    }

    return acc;
  }, {});

  let i = 0;
  for (const note of jsonData.data) {
    const folderId = foldersObj[note.folderName];
    const newNote = await createNote(folderId, {
      id: randomUUID(),
      folderId: folderId || "",
      content: note.content,
      isLocked: false,
      isPinned: false,
      lastSync: 0,
      createdAt: nowUnix(),
      updatedAt: nowUnix(),
      deletedAt: note.deletedAt,
      deleteCompletelyAt: null,
    });
    setActionObject('note', newNote);
    i++;
  }

  await reloadFolder();

  toggleModalImportNotes(false, isShowModalImportNotes);
  showInfoSnackbar($i18n.t('app.message_import_notes'));
  navbarTopRef.value?.closeDrawer();
}
const modalExportNotesConfirm = ref<any>(null);
const handleExportNotesConfirm = async (data: any) => {
  const password = await getPassword();
  const newHashPassword = await hashPassword(data.password);
  if (password !== newHashPassword) {
    modalExportNotesConfirm.value?.showFailedPassword();
    return;
  }

  toggleModalExportNotesConfirm(false, isShowModalExportNotesConfirm);
  return handleExportNotes(true);
}
const handleExportNotesIgnorePassword = async () => {
  return handleExportNotes(false);
}


// when screen resize, if from desktop to mobile or mobile to desktop
// => reload app to change layout
const isMobile = ref<boolean>(false);
const isMobileChange = ref<boolean>(false);
onMounted(async () => {
  if (window.innerWidth < 1024) {
    isMobile.value = true;
  }

  const colsWidthData = await getColsWidth();
  if (colsWidthData) {
    colsFoldersWidth.value = colsWidthData.colsFoldersWidth;
    colsNotesWidth.value = colsWidthData.colsNotesWidth;
  }
});
watch(() => isMobile.value, () => {
  if (isMobileChange.value) {
    isMobileChange.value = false;
    window.location.reload();
  }
});
const handleResizeScreen = () => {
  if (window.innerWidth <= 1024) {
    isMobile.value = true;
    isMobileChange.value = true;
  } else {
    isMobile.value = false;
    isMobileChange.value = true;
  }
}

// settings modal
const isShowModalSettings = ref<boolean>(false);
const handleClickSetting = () => {
  toggleModalSettings(true, isShowModalSettings);
}
const handleClickCloseSettings = () => {
  toggleModalSettings(false, isShowModalSettings);
}
// actionObject using for sync data
// flow:
// each action (eg: create, update, delete folder/note) will push to actionObject
// then, each n seconds, will check actionObject, if have any action, will push to sync adapter
// docs: https://docs.opennotas.io/advanced/sync-flow
const actionObject = ref<any>({});
onMounted(async () => {
  const actionQueue: any = await getActionObject();
  actionObject.value = actionQueue;
});

const mutex = new Mutex();
const setActionObject = async (obj: string, data: any) => {
  if (settings.value.sync?.adapter === 'LocalForage') {
    return;
  }

  await mutex.acquire();
  try {
    actionObject.value = {
      ...actionObject.value,
      [data.id]: obj,
    }
  } finally {
    mutex.release();
  }
}

watch(() => actionObject.value, async (newVal) => {
  await saveActionObject(newVal);
}, { deep: true });
const actionObjectKeys = computed(() => {
  return Object.keys(actionObject.value);
});

// if isSyncing = true, next sync will be skip to wait for this sync finish
let isSyncing = ref<boolean>(false);
// get sync frequency in settings to auto sync
let setIntervalSync: any = null;
onMounted(() => {
  setIntervalSync = setInterval(() => {
    idleKey.value += 1;
  }, +settings.value.sync.frequency * 1000);
});
watch(() => settings.value.sync.frequency, (newVal) => {
  if (+newVal > 0) {
    if (setIntervalSync) {
      clearInterval(setIntervalSync);
    }

    setIntervalSync = setInterval(() => {
      idleKey.value += 1;
    }, +newVal * 1000);
  }
});
// by default, if actionObject has data, it will be sync continuously
// so when user do nothing, idleKey will auto increase to trigger auto sync
const idleKey = ref<number>(0);
watch(() => idleKey.value, () => {
  idleSync();
});
let setTimeoutSync: any = null;
const idleSync = async (immediate = false, initedApp = false) => {
  if (setTimeoutSync) {
    clearTimeout(setTimeoutSync);
  }

  setTimeoutSync = setTimeout(async () => {
    if (isSyncing.value) {
      return;
    }

    await mutex.acquire();
    isSyncing.value = true;
    await pullPush()
      .then(() => {
        if (immediate && initedApp && settings.value?.sync.adapter !== 'LocalForage') {
          showInfoSnackbar($i18n.t('app.message_sync_success'));
        }

        isSyncError.value = false;
        syncErrorMessage.value = "";
        syncErrorClass.value = "";
      })
      .catch((err) => {
        if (err instanceof NetworkError) {
          isSyncError.value = true;
          syncErrorMessage.value = $i18n.t('app.message_sync_network_offline_error');
          syncErrorClass.value = 'warning';
        } else if (err instanceof SyncError) {
          isSyncError.value = true;
          syncErrorMessage.value = $i18n.t('app.message_sync_internal_error');
          syncErrorClass.value = 'error';
        } else {
          isSyncError.value = true;
          syncErrorMessage.value = $i18n.t('app.message_sync_internal_error');
          syncErrorClass.value = 'error';
        }
      });
    isSyncing.value = false;
    mutex.release();
  }, immediate ? 0 : 3000);
}
// idPulled save all id has been pulled in last pull to mark change
const idPulled = ref<string[]>([]);
// lastPushData save last time push data to skip actionObject has been pushed
const lastPushData = ref<number>(0);
const pullPush = async () => {
  const pull = await pullData(
    settings.value,
    privateKey.value,
    lastPushData.value,
    lastPull,
    idPulled,
    actionObject,
    isPasswordExist,
  );
  await pushData(
    settings.value,
    privateKey.value,
    actionObject,
    lastPull,
    pull.now!,
  );
  if (pull.ok) {
    reloadFolder(false, false);
  }
}
const lastPull = ref<number>(0);
onMounted(async () => {
  lastPull.value = await getLastPull();
});
watch(() => lastPull.value, async (newVal: number) => {
  await updateLastPull(newVal);
});
const isSyncError = ref<boolean>(false);
const syncErrorMessage = ref<string>("");
const syncErrorClass = ref<string>("");
</script>

<template>
  <div v-if="!initedApp" class="fixed inset-0 flex items-center justify-center">
    <LoaderLogo />
    <p class="absolute bottom-4">{{ runtimeConfig.public.version }}</p>
  </div>

  <div class="w-screen overflow-hidden bg-background"
    style="height: calc(var(--vh, 1vh) * 100);-webkit-overflow-scrolling: touch; overscroll-behavior-y: contain;"
    v-else>
    <!-- mobile nav top -->
    <div class="lg:hidden">
      <NavbarTop ref="navbarTopRef" :isInEditor="isInEditor" :listFolders="listFoldersMenu"
        :activeFolderId="activeFolderId" :formNotes="formNotes" :isSyncing="isSyncAll" :settings="settings"
        :isPasswordExist="isPasswordExist" @clickFolderName="handleClickFolderName"
        @rightClickFolderName="handleRightClickFolderName" @renameFolderName="handleRenameFolderName"
        @reorderFolderName="handleReorderFolderName" @clickSetting="handleClickSetting" @clickBack="handleClickBack"
        @clickUpdateData="handleClickUpdateData" @clickTrash="handleClickBottombarTrash"
        @copyToClipboard="handleCopyToClipboard" @clickInfo="handleClickFormNotesInfo"
        @saveSettings="handleSaveSettings" @saveAdapter="handleSaveAdapter" @clickExportNotes="handleClickExportNotes"
        @clickAddFolder="handleClickAddFolder" @clickSwitchEditor="handleClickSwitchEditor" @clickUndo="handleClickUndo"
        @clickRedo="handleClickRedo" @clickSearch="handleClickSearch" @clickCancelSearch="handleClickCancelSearch"
        @clickSetPassword="handleClickSetPassword" @clickImportNotes="handleClickImportNotes"
        @clickMenuSidebar="handleClickMenuSidebar" />
    </div>

    <!-- cols personal -->
    <div class="hidden lg:block lg:float-left cols-personal w-20">
      <ColsPersonal :activeFolderId="activeFolderId" @clickNotes="handleClickFolderName('')"
        @clickTrash="handleClickBottombarTrash" @clickSetting="handleClickSetting"
        @clickUpdateData="handleClickUpdateData" />
    </div>

    <!-- cols folders -->
    <div class="hidden lg:block lg:float-left cols-folders transition-all duration-300"
      :class="{ '!w-0': activeFolderId === 'bottombar-trash' || isCollapsePanel }"
      :style="{ width: colsFoldersWidth + 'px' }">
      <div>
        <ToolbarFolder v-if="isShowToolbarNotes" :isSyncing="isSyncAll" @clickAddFolder="handleClickAddFolder"
          @clickSetting="handleClickSetting" @clickUpdateData="handleClickUpdateData" />
      </div>
      <!-- <hr class="hidden lg:block border-base-300"> -->

      <div id="folders-instance" class="relative overflow-auto" style="height: calc(100vh - 41px)">
        <ListFolder ref="listFolderRef" :listFolders="listFoldersMenu" :activeFolderId="activeFolderId"
          :actionObjectKeys="actionObjectKeys" @clickFolderName="handleClickFolderName"
          @rightClickFolderName="handleRightClickFolderName" @renameFolderName="handleRenameFolderName"
          @reorderFolderName="handleReorderFolderName" />
      </div>
      <!-- <hr class="border-base-300"> -->
      <!-- <BottombarFolder :activeFolderId="activeFolderId" @clickTrash="handleClickBottombarTrash" /> -->
    </div>


    <!-- cols notes -->
    <div class="cols-notes transition-all duration-300" :style="{ width: colsNotesWidth + 'px' }"
      :class="{ 'hidden': isMobile && isInEditor, '!w-full pt-[72px] absolute': isMobile, 'lg:w-3/12 lg:float-left bg-base-200 h-full': !isMobile, '!w-0': isCollapsePanel }">
      <div class="hidden lg:block">
        <ToolbarNotes v-if="isShowToolbarNotes" ref="toolbarNotesRef" @clickAddNote="handleClickAddNote"
          @clickSearch="handleClickSearch" @clickCancelSearch="handleClickCancelSearch" />
      </div>
      <!-- <hr class="hidden lg:block border-base-300"> -->

      <div id="notes-instance" class="overflow-auto" style="height: calc(100vh - 55px)">
        <div v-if="isSyncError" class="m-2 rounded text-xs text-center py-1"
          :class="{ 'bg-warning': syncErrorClass === 'warning', 'text-warning-content': syncErrorClass === 'warning', 'bg-error': syncErrorClass === 'error', 'text-error-content': syncErrorClass === 'error' }">
          {{ syncErrorMessage }}
        </div>
        <ListNotes :key="listNotesKey" :listNotes="listNotes" :activeNoteId="activeNoteId"
          :actionObjectKeys="actionObjectKeys" :idPulled="idPulled" @clickNote="handleClickNote"
          @rightClickNote="handleRightClickNote" />
      </div>
    </div>


    <!-- cols editor -->
    <div
      :class="{ 'block w-full pt-[64px]': isMobile && isInEditor, 'hidden': isMobile && !isInEditor, 'lg:block lg:w-[inherit]': !isMobile }">
      <div>
        <ToolbarFormNotes :noteId="formNotes.id" :editorName="editorName" :isLocked="formNotes.isLocked"
          :formNotes="formNotes" @pinNote="handleClickPinNote" @copyNote="handleCopyToClipboard"
          @lockNote="handleClickLockNote" @deleteNote="handleClickDeleteNote" @copyToClipboard="handleCopyToClipboard"
          @clickInfo="handleClickFormNotesInfo" @clickResize="handleClickResizeApp"
          @clickSwitchEditor="handleClickSwitchEditor" @clickCollapsePanel="handleClickCollapsePanel"
          @clickFormatToolbar="handleClickFormatToolbar" />
      </div>
      <!-- <hr class="hidden lg:block border-base-300"> -->

      <div id="form-editors" class="cursor-text overflow-auto bg-base-100" :class="{ 'overflow-x-hidden': isMobile }"
        style="height: calc(100vh - 55px)">
        <FormNotes ref="formNotesRef" :id="formNotes.id" :key="formNotes.id" :value="formNotes.content"
          :isLocked="formNotes.isLocked" :settings="settings" :editorName="editorName"
          :isShowFormatToolbar="isShowFormatToolbar" :isDeleted="!!formNotes.deletedAt"
          @confirmPassword="handleConfirmPassword" @changeContent="handleChangeContent"
          @clickInsertLink="handleClickInsertLink" @closeInsertLink="handleClickCloseModalInsertLink"
          @clickInsertImage="handleClickInsertImage" @closeInsertImage="handleClickCloseModalInsertImage" />
      </div>
    </div>
  </div>

  <!-- menu folder & note -->
  <div id="menu-folder" class="hidden absolute">
    <MenuFolder :key="menuFolderKey" :folderId="activeFolderId" @renameFolder="handleClickRenameFolder"
      @deleteFolder="handleClickDeleteFolder" />
  </div>
  <div id="menu-note" class="hidden absolute">
    <MenuNote :key="menuNoteKey" :noteId="activeNoteId" :formNotes="formNotes" @deleteNote="handleClickDeleteNote"
      @pinNote="handleClickPinNote" @lockNote="handleClickLockNote" @copyNote="handleCopyToClipboard"
      @restoreNote="handleClickRestoreNote" @deleteNoteForever="handleClickDeleteNoteForever" />
  </div>

  <!-- modal -->
  <ModalNotesDetail v-if="isShowModalNotesDetail" :noteInfo="noteInfo" @close="handleClickCloseNotesDetail" />
  <ModalSetting v-if="isShowModalSettings" ref="modalSettingRef" :settings="settings" :isPasswordExist="isPasswordExist"
    @setPassword="handleSetPassword" @changePassword="handleChangePassword" @changeAdapter="handleChangeAdapter"
    @changeDefaultEditor="handleChangeDefaultEditor" @clickExportNotes="handleClickExportNotes"
    @triggerImportNotes="handleTriggerImportNotes" @saveSettings="handleSaveSettings" @saveAdapter="handleSaveAdapter"
    @clickSetPassword="handleClickSetPassword" @closeSetPassword="handleCloseSetPassword"
    @clickImportNotes="handleClickImportNotes" @closeSetting="handleClickCloseSettings" />
  <ModalAlertSetPassword v-if="isShowModalAlertSetPassword" @close="handleClickCloseModalAlertSetPassword" />
  <ModalSetPassword v-if="isShowModalSetPassword" ref="modalSetPasswordRef" :type="isPasswordExist ? 'change' : 'set'"
    @confirm="handleConfirmSetPassword" @close="handleCloseSetPassword" />
  <ModalConfirmChangeAdapter v-if="isShowModalConfirmChangeAdapter" :adapterName="''"
    :isShowModalConfirmChangeAdapter="isShowModalConfirmChangeAdapter" @confirm="handleConfirmChangeAdapterOnline"
    @close="handleClickCloseModalConfirmChangeAdapter" />
  <ModalConfirmE2eeKey v-if="isShowModalConfirmE2eeKey" @confirm="handleConfirmChangeAdapter"
    @close="handleClickCloseModalConfirmE2eeKey" />
  <ModalImportNotes v-if="isShowModalImportNotes" @confirm="handleTriggerImportNotes"
    @close="handleClickCloseModalImportNotes" />
  <ModalExportNotesConfirm v-if="isShowModalExportNotesConfirm" ref="modalExportNotesConfirm"
    @confirmPassword="handleExportNotesConfirm" @confirmIgnorePassword="handleExportNotesIgnorePassword"
    @close="handleClickCloseModalExportNotesConfirm" />
  <ModalUnlockNotes v-if="isShowModalUnlockNotes" ref="modalUnlockNotesRef" :noteId="activeNoteId"
    :formNotes="formNotes" @confirmPassword="handleUnlockNote" @close="handleClickCloseModalUnlockNotes" />
  <ModalChangeFolderName v-if="isShowModalChangeFolderName" ref="modalChangeFolderNameRef" :folderId="activeFolderId"
    :folderName="activeFolderName" @confirm="handleRenameFolderName" @close="handleClickCloseModalChangeFolderName" />
  <ModalConfirmDeleteFolder v-if="isShowModalConfirmDeleteFolder" :folderId="folderWillDelete"
    @confirm="handleConfirmDeleteFolder" @close="handleClickCloseModalConfirmDeleteFolder" />
  <ModalMenuFolder v-if="isShowModalMenuFolder" :folderId="activeFolderId" @renameFolder="handleClickRenameFolder"
    @deleteFolder="handleClickDeleteFolder" />
  <ModalMenuNote v-if="isShowModalMenuNote" :noteId="activeNoteId" :formNotes="formNotes"
    @deleteNote="handleClickDeleteNote" @pinNote="handleClickPinNote" @lockNote="handleClickLockNote"
    @copyNote="handleCopyToClipboard" @restoreNote="handleClickRestoreNote"
    @deleteNoteForever="handleClickDeleteNoteForever" />
  <ModalMenuSidebar v-if="isShowModalMenuSidebar" @clickAddFolder="handleClickAddFolder"
    @clickForceSync="handleClickUpdateData" />
  <ModalInsertLink v-if="isShowModalInsertLink" ref="modalInsertLinkRef" @confirm="handleConfirmInsertLink"
    @close="handleClickCloseModalInsertLink" />
  <ModalInsertImage v-if="isShowModalInsertImage" ref="modalInsertImageRef" @confirm="handleConfirmInsertImage"
    @close="handleClickCloseModalInsertImage" />

  <!-- float button create new note -->
  <FloatNewNotes v-if="!formNotes.id && initedApp && activeFolderId !== 'bottombar-trash'"
    @clickNewNote="handleClickAddNote" />
</template>
