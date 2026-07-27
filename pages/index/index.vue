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
  getPasswordChangeBackup,
  savePasswordChangeBackup,
  clearPasswordChangeBackup,
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
  setSortNote,
  getSortNote,
  getNoteHistory,
  addNoteHistorySnapshot,
  deleteNoteHistorySnapshot,
  getTags,
  createTag,
  updateTag,
  deleteTag,
  getNotesForTag,
  getNoteTagsByNote,
  getNoteTagsByTag,
  addTagToNote,
  removeTagFromNote,
} from '../../services/main';
import Mutex from "~/utils/mutex";
import { removeMarkdownEscape } from "~/utils/string";
import { pushMobileBackState, closeMobileBackState, initMobileBackHandler } from "~/utils/mobile-back";
import { checkAppVersion } from "~/utils/check-app-version";
import { resetSyncedImages } from "~/services/image";
import { usePullToRefresh } from "~/utils/pull-to-refresh";
import Refresh from "~/assets/svg/refresh.svg?component";

const { setLocale } = useI18n();
const runtimeConfig = useRuntimeConfig();
const colorMode = useColorMode();

const isInEditor = ref<boolean>(false);

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
  disableDefaultContextMenu();
  initMobileBackHandler(); // handle back button/gesture on mobile

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === 'visible') {
      idleSync(true);
      checkAppVersion(runtimeConfig.public.buildId);
    }
  });

  checkAppVersion(runtimeConfig.public.buildId);
  setInterval(() => {
    checkAppVersion(runtimeConfig.public.buildId);
  }, 24 * 60 * 60 * 1000);

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

// recover notes left half-migrated if a previous password change was interrupted
onMounted(async () => {
  const backup = await getPasswordChangeBackup();
  if (backup?.notes?.length) {
    for (const item of backup.notes) {
      await updateNote(item.id, { content: item.content }).catch(() => { });
    }
    await clearPasswordChangeBackup();
    showInfo($i18n.t('app.message_change_password_recovered'));
  }
});


// init data notes if first time access
const isShowModalConfirmSampleData = ref<boolean>(false);
onMounted(async () => {
  const isFirstInit = await checkIsFirstInit();
  if (isFirstInit) {
    toggleModalConfirmSampleData(true, isShowModalConfirmSampleData);
  }
});
const handleConfirmSampleData = async () => {
  toggleModalConfirmSampleData(false, isShowModalConfirmSampleData);

  const notes = await fetch('/opennotas.json').then((res) => res.json());
  await setImportData(notes);
  await handleTriggerImportNotes();
  await setFirstInit();
};
const handleCancelSampleData = async () => {
  toggleModalConfirmSampleData(false, isShowModalConfirmSampleData);
  await setFirstInit();
};

// reloadNotes & reloadFolder using for reload all data display on screen
const listNotesKey = ref<number>(0);
const reloadNotes = async (focus = true, isTrash = false) => {
  // scroll to top
  document.getElementById('notes-instance')?.scrollTo({ top: 0, behavior: 'smooth' });

  await nextTick();
  sortType.value = await getSortNote();
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
  activeFolderId.value = (isFirst && (activeFolder === 'bottombar-trash' || activeFolder === 'bottombar-tags')) ? "" : activeFolder || "";

  await reloadNotes(focus, isFirst ? false : activeFolder === 'bottombar-trash');

  // Ensure tags list is loaded after reload (fix tags disappearing after app reload)
  listTagsMenu.value = await loadTags();
}

// initedApp using for app ready to use
const initedApp = ref<boolean>(false);
watch(() => initedApp.value, (newVal) => {
  if (newVal) {
    // delay 1000ms before sync to avoid sync when app is not ready
    setTimeout(() => {
      if (settings.value.sync?.adapter !== 'LocalForage' && navigator.onLine) {
        showInfo($i18n.t('app.message_sync_init'));
      }

      idleSync(true, newVal);
      // handle interact cols
      handleInteractCols(isMobile.value, navbarTopRef, colsFoldersWidth, colsNotesWidth, setColsWidthData);
    }, 1000);
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
const isSyncingAll = ref<boolean>(false);
const SYNC_LEVELS = [
  { seconds: 300, labelKey: 'app.sync_5_minutes' },
  { seconds: 3600, labelKey: 'app.sync_1_hour' },
  { seconds: 21600, labelKey: 'app.sync_6_hours' },
  { seconds: 86400, labelKey: 'app.sync_1_day' },
  { seconds: 604800, labelKey: 'app.sync_1_week' },
  { seconds: 2592000, labelKey: 'app.sync_1_month' },
  { seconds: 0, labelKey: 'app.message_sync_all_notes' },
];
const syncLevel = ref<number>(0);
let syncLevelResetTimer: ReturnType<typeof setTimeout> | null = null;
const handleClickUpdateData = async (forcedLevelIndex?: number) => {
  toggleModalMenuSidebar(false, isShowModalMenuSidebar);
  navbarTopRef.value?.closeDrawer();

  isSyncingAll.value = true;
  const levelIndex = forcedLevelIndex ?? syncLevel.value;
  const level = SYNC_LEVELS[levelIndex];
  isSyncAll.value = levelIndex === SYNC_LEVELS.length - 1;
  lastPull.value = level.seconds === 0 ? 0 : nowUnix() - level.seconds;

  try {
    await pullPush();
    showSuccess($i18n.t(level.labelKey));
  } catch (error) {
    showError($i18n.t(error instanceof NetworkError
      ? 'app.message_sync_network_offline_error'
      : 'app.message_sync_internal_error'));
  } finally {
    isSyncAll.value = false;
    isSyncingAll.value = false;
  }

  syncLevel.value = (levelIndex + 1) % SYNC_LEVELS.length;

  if (syncLevelResetTimer) clearTimeout(syncLevelResetTimer);
  syncLevelResetTimer = setTimeout(() => {
    syncLevel.value = 0;
  }, 10000);
}
const handleClickAddFolder = async () => {
  toggleModalMenuSidebar(false, isShowModalMenuSidebar);

  const newFolder = await createFolder();
  setActionObject('folder', newFolder);
  await updateLastPull(nowUnix());
  listFoldersMenu.value = await loadFolder();
  showSuccess($i18n.t('app.message_folder_created'));
  handleClickFolderName(newFolder.id);
};
const activeFolderId = ref<string>("");
const activeFolderName = computed(() => {
  const folder = listFoldersMenu.value.find((folder: any) => folder.id === activeFolderId.value);
  return folder?.name || "";
});
// Suppresses the notes list entrance animation while the whole list is being replaced by a
// folder switch (hundreds of <li> mounting/unmounting at once is the main remaining jank source
// after the data-layer caching fix) — normal single-note inserts (add note) are unaffected.
const isSwitchingFolder = ref<boolean>(false);
const handleClickFolderName = async (folderId: string) => {
  navbarTopRef.value?.resetSearchInput();
  toolbarNotesRef.value?.resetSearchInput();
  activeFolderId.value = folderId;
  isCollapsePanel.value = false;
  setActiveFolder(folderId);

  isSwitchingFolder.value = true;
  await reloadNotes();
  await nextTick();
  isSwitchingFolder.value = false;
};
const isShowModalMenuFolder = ref<boolean>(false);
const menuFolderKey = ref<number>(0);
const handleRightClickFolderName = (data: any) => {
  // ẩn menu note
  hideMenuNote();
  hideMenuMoveNote();
  hideMenuNoteTags();

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
  showSuccess($i18n.t('app.message_folder_renamed'));

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

  showSuccess($i18n.t('app.message_folder_reordered'));
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

  const notesInFolder = await getNotes(folderId, sortType.value, $i18n.t('app.list_note_locked_title'), $i18n.t('app.list_note_locked_content'));
  for (const note of notesInFolder) {
    const updatedNote = await updateNote(note.id, {
      deletedAt: nowUnix(),
      updatedAt: nowUnix(),
    });
    setActionObject('note', updatedNote);
  }

  toggleModalConfirmDeleteFolder(false, isShowModalConfirmDeleteFolder);
  showSuccess($i18n.t('app.message_folder_deleted'));

  await setActiveFolder('');
  reloadFolder();
}
const handleClickBottombarTrash = async () => {
  activeFolderId.value = 'bottombar-trash';
  isCollapsePanel.value = false;
  setActiveFolder('bottombar-trash');

  isSwitchingFolder.value = true;
  listNotes.value = await loadTrashNotes();
  await nextTick();
  isSwitchingFolder.value = false;

  if (listNotes.value.find((note: any) => note.id === activeNoteId.value)) {
    formNotes.value = await getNoteDetail(activeNoteId.value);
  } else {
    formNotes.value = {};
  }
}

// all logic for tags
const activeTagId = ref<string>("");
const listTagsMenu = ref<any[]>([]);
const isTagsMode = computed(() => activeFolderId.value === 'bottombar-tags');
const loadTags = async () => {
  return getTags();
}
const loadNotesForActiveTag = async () => {
  return getNotesForTag(activeTagId.value, sortType.value, $i18n.t('app.list_note_locked_title'), $i18n.t('app.list_note_locked_content'));
}
const handleClickTags = async () => {
  activeFolderId.value = 'bottombar-tags';
  isCollapsePanel.value = false;
  setActiveFolder('bottombar-tags');

  listTagsMenu.value = await loadTags();
  activeTagId.value = '';
  listNotes.value = [];
  formNotes.value = {};
}
const handleClickTagName = async (tagId: string) => {
  activeTagId.value = tagId;
  listNotes.value = await loadNotesForActiveTag();
  activeNoteId.value = await loadActiveNote() || "";

  if (!isMobile.value) {
    formNotes.value = await getNoteDetail(activeNoteId.value);
  }
  if (!isMobile.value && listNotes.value.find((note: any) => note.id === activeNoteId.value)) {
    formNotesRef.value?.focus();
  } else if (!isMobile.value) {
    formNotes.value = {};
  }
}

const isShowModalMenuTag = ref<boolean>(false);
const menuTagKey = ref<number>(0);
const handleRightClickTagName = (data: any) => {
  hideMenuNote();
  hideMenuMoveNote();
  hideMenuNoteTags();

  if (isMobile.value) {
    activeTagId.value = data.tagId;
    menuTagKey.value += 1;
    toggleModalMenuTag(true, isShowModalMenuTag);
  } else {
    activeTagId.value = data.tagId;
    menuTagKey.value += 1;
    offsetMenuTag(data);
  }
};

const isShowModalTagForm = ref<boolean>(false);
const tagIdToEdit = ref<string>('');
const tagFormInitial = computed(() => {
  const tag = listTagsMenu.value.find((tag: any) => tag.id === tagIdToEdit.value);
  return { name: tag?.name || '', color: tag?.color || '' };
});
const handleClickAddTag = () => {
  toggleModalMenuSidebar(false, isShowModalMenuSidebar);
  tagIdToEdit.value = '';
  toggleModalTagForm(true, isShowModalTagForm);
}
const handleClickEditTag = (tagId: string) => {
  toggleModalMenuTag(false, isShowModalMenuTag);
  tagIdToEdit.value = tagId;
  toggleModalTagForm(true, isShowModalTagForm);
}
const handleClickCloseModalTagForm = () => {
  toggleModalTagForm(false, isShowModalTagForm);
}
const handleConfirmTagForm = async (data: { tagId: string; name: string; color: string }) => {
  try {
    if (!data.tagId) {
      const newTag = await createTag({
        id: randomUUID(),
        name: data.name,
        color: data.color,
        lastSync: 0,
        createdAt: nowUnix(),
        updatedAt: nowUnix(),
        deletedAt: null,
      });
      setActionObject('tag', newTag);
      showSuccess($i18n.t('app.message_tag_created'));
    } else {
      const updatedTag = await updateTag(data.tagId, {
        name: data.name,
        color: data.color,
        updatedAt: nowUnix(),
      });
      setActionObject('tag', updatedTag);
      showSuccess($i18n.t('app.message_tag_updated'));
    }
  } catch (err) {
    console.error(err);
    showErrorSnackbar(err instanceof Error ? err.message : String(err));
  } finally {
    toggleModalTagForm(false, isShowModalTagForm);
    listTagsMenu.value = await loadTags();
  }
}

const tagWillDelete = ref<string>("");
const isShowModalConfirmDeleteTag = ref<boolean>(false);
const handleClickCloseModalConfirmDeleteTag = () => {
  toggleModalConfirmDeleteTag(false, isShowModalConfirmDeleteTag);
}
const handleClickDeleteTag = (tagId: string) => {
  tagWillDelete.value = tagId;
  toggleModalMenuTag(false, isShowModalMenuTag);
  toggleModalConfirmDeleteTag(true, isShowModalConfirmDeleteTag);
}
const handleConfirmDeleteTag = async (tagId: string) => {
  toggleModalMenuTag(false, isShowModalMenuTag);

  const noteTagsOfTag = await getNoteTagsByTag(tagId);
  await deleteTag(tagId);
  setActionObject('tag', { id: tagId, deletedAt: nowUnix() });
  for (const noteTag of noteTagsOfTag) {
    setActionObject('noteTag', { id: noteTag.id, deletedAt: nowUnix() });
  }

  toggleModalConfirmDeleteTag(false, isShowModalConfirmDeleteTag);
  showSuccess($i18n.t('app.message_tag_deleted'));

  listTagsMenu.value = await loadTags();
  if (activeTagId.value === tagId) {
    activeTagId.value = '';
    listNotes.value = [];
    formNotes.value = {};
  }
}

const noteIdForTags = ref<string>('');
const activeNoteTagIds = ref<string[]>([]);
const handleClickAddNoteToTag = async (payload: any) => {
  const noteId = typeof payload === 'object' ? payload.noteId : payload;
  noteIdForTags.value = noteId;
  activeNoteTagIds.value = (await getNoteTagsByNote(noteId)).map((noteTag: any) => noteTag.tagId);

  // Ensure tags list is loaded (fix race condition on mobile)
  listTagsMenu.value = await loadTags();

  if (isMobile.value) {
    toggleModalMenuNote(false, isShowModalMenuNote);
    toggleModalMenuNoteTags(true, isShowModalMenuNoteTags);
    return;
  }

  hideMenuMoveNote();
  const rect = payload?.rect;
  if (rect) {
    offsetMenuNoteTags({ left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom });
  }
};
const handleToggleNoteTag = async (tagId: string) => {
  const isTagged = activeNoteTagIds.value.includes(tagId);

  if (isTagged) {
    const updated = await removeTagFromNote(noteIdForTags.value, tagId);
    setActionObject('noteTag', updated);
    activeNoteTagIds.value = activeNoteTagIds.value.filter((id: string) => id !== tagId);
    showSuccess($i18n.t('app.message_tag_removed_from_note'));
  } else {
    const created = await addTagToNote(noteIdForTags.value, tagId);
    setActionObject('noteTag', created);
    activeNoteTagIds.value = [...activeNoteTagIds.value, tagId];
    showSuccess($i18n.t('app.message_tag_added_to_note'));
  }

  if (isTagsMode.value && activeTagId.value) {
    listNotes.value = await loadNotesForActiveTag();
  } else {
    listNotes.value = await loadNotes();
  }
};

const isShowModalMenuSidebar = ref<boolean>(false);
const handleClickMenuSidebar = (e: any) => {
  toggleModalMenuSidebar(true, isShowModalMenuSidebar);
}
// sort notes
const sortType = ref<'createdAt' | 'updatedAt'>('createdAt');
const handleClickSort = async (type: 'createdAt' | 'updatedAt') => {
  sortType.value = type as 'createdAt' | 'updatedAt';
  await setSortNote(type);

  listNotes.value = await loadNotes();
}
const handleClickRetrySync = async () => {
  isSyncError.value = false;
  syncErrorMessage.value = "";
  syncErrorClass.value = "";

  showInfo($i18n.t('app.message_sync_init'));

  await new Promise(resolve => setTimeout(resolve, 3000));

  idleSync(true, true);
}

// all logic for notes
const loadNotes = async () => {
  return getNotes(activeFolderId.value, sortType.value, $i18n.t('app.list_note_locked_title'), $i18n.t('app.list_note_locked_content'));
}
const loadActiveNote = async () => {
  return getActiveNote();
}
const loadTrashNotes = async () => {
  return getDeletedNotes($i18n.t('app.list_note_locked_title'), $i18n.t('app.list_note_locked_content'));
}
const loadActiveList = async () => {
  if (activeFolderId.value === 'bottombar-trash') {
    return loadTrashNotes();
  }
  if (isTagsMode.value && activeTagId.value) {
    return loadNotesForActiveTag();
  }
  return loadNotes();
}

const listNotes = ref<any[]>([]);
const handleClickAddNote = async () => {
  const newNote = await createNote(activeFolderId.value);
  setActionObject('note', newNote);
  listNotes.value = await loadNotes();
  showSuccess($i18n.t('app.message_note_created'));

  handleClickNote(newNote.id, true, true);
};
const handleClickSearch = async (value: string) => {
  if (!value) {
    listNotes.value = await loadActiveList();
    navbarTopRef.value?.searchLoadingDone();
    toolbarNotesRef.value?.searchLoadingDone();
    return;
  }

  const currentNotes = await loadActiveList();
  await ensureFlexSearchReady();
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
  listNotes.value = (result[0]?.result || []).reduce((acc: any[], item: any) => {
    const currentNote = currentNotes.find((note: any) => note.id === item.id);
    if (!currentNote) return acc;
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
  listNotes.value = await loadActiveList();
}
const activeNoteId = ref<string>("");
const activeNoteBaseline = ref<{ noteId: string, content: string }>({ noteId: '', content: '' });
watch(activeNoteId, async (newId) => {
  if (!newId) {
    activeNoteBaseline.value = { noteId: '', content: '' };
    return;
  }
  const note = await getNoteDetail(newId);
  activeNoteBaseline.value = { noteId: newId, content: note?.content ?? '' };
});
const snapshotNoteBeforeLeaving = async (noteId: string) => {
  if (activeNoteBaseline.value.noteId !== noteId) {
    return;
  }
  const current = await getNoteDetail(noteId);
  if (current?.content === undefined) {
    return;
  }
  if (current.content === activeNoteBaseline.value.content) {
    return;
  }
  await saveNoteHistorySnapshot(noteId, activeNoteBaseline.value.content);
};
const handleClickNote = async (noteId: string, inEditor: boolean = false, shouldFocus: boolean = false) => {
  if (activeNoteId.value && activeNoteId.value !== noteId) {
    await snapshotNoteBeforeLeaving(activeNoteId.value);
  }
  activeNoteId.value = noteId;
  setActiveNote(noteId);
  formNotes.value = await getNoteDetail(activeNoteId.value);
  setTimeout(() => {
    formNotesRef.value?.focusPassword();

    if (shouldFocus && (!isMobile.value || !formNotes.value.content)) {
      formNotesRef.value?.focus();
    }
  }, 100);

  if (inEditor) {
    isInEditor.value = true;

    // if mobile, push a back-stack entry so hardware/gesture back closes the editor
    if (isMobile.value) {
      pushMobileBackState(() => {
        isInEditor.value = false;
        snapshotNoteBeforeLeaving(noteId);
      });
    }
  }
};
const isShowModalMenuNote = ref<boolean>(false);
const handleRightClickNote = (data: any) => {
  // ẩn menu folder
  hideMenuFolder();
  hideMenuMoveNote();
  hideMenuTag();
  hideMenuNoteTags();

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
  showSuccess($i18n.t('app.message_note_deleted'));
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
  showWarning($i18n.t('app.message_note_deleted_forever'));
}
const handleClickPinNote = async (data: any) => {
  toggleModalMenuNote(false, isShowModalMenuNote);

  const isPinning = data.status != 1;
  const updatedNote = await updateNote(data.noteId, {
    isPinned: isPinning ? 1 : 0,
    updatedAt: nowUnix(),
  });
  setActionObject('note', updatedNote);

  listNotes.value = await loadNotes();
  showSuccess($i18n.t(isPinning ? 'app.message_note_pinned' : 'app.message_note_unpinned'));

  // scroll to top id notes-instance
  const notesInstance = document.getElementById('notes-instance');
  if (notesInstance) {
    notesInstance.scrollTo({ top: 0, behavior: 'smooth' });
  }
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
    title: removeSpecialChar(substrTitle(note.content)),
    updatedAt: nowUnix(),
  });

  setActionObject('note', updatedNote);
  listNotes.value = await loadNotes();
  showSuccess($i18n.t('app.message_note_locked'));
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
    const decryptedContent = await decryptData(note.content, password);
    const updatedNote = await updateNote(data.noteId, {
      isLocked: 0,
      content: decryptedContent,
      title: removeSpecialChar(substrTitle(decryptedContent)),
      updatedAt: nowUnix(),
    });
    setActionObject('note', updatedNote);

    listNotes.value = await loadNotes();
    formNotes.value = await getNoteDetail(activeNoteId.value);
    activeNoteBaseline.value = { noteId: activeNoteId.value, content: formNotes.value.content };

    toggleModalUnlockNotes(false, isShowModalUnlockNotes);
    showSuccess($i18n.t('app.message_note_unlocked'));
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
  showSuccess($i18n.t('app.message_note_restored'));
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
    showSuccess($i18n.t('app.message_note_unlocked'));
  } catch (error) {
    formNotesRef.value?.wrongPassword();
    showErrorSnackbar($i18n.t('app.message_note_unlocked_failed'));
  }
};
const saveNoteHistorySnapshot = async (noteId: string, content: string) => {
  if (!noteId || content === undefined) return;
  const history = await getNoteHistory(noteId);
  const lastSnapshot = history[0];
  if (lastSnapshot?.content === content) return;
  await addNoteHistorySnapshot(noteId, content);
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
  formNotes.value.content = newVal;

  clearTimeout(debounceChangeContent);
  debounceChangeContent = setTimeout(async () => {
    if (!note.isLocked) {
      const findNoteIndex = listNotes.value.findIndex((note: any) => note.id === id);
      listNotes.value[findNoteIndex].title = removeSpecialChar(substrTitle(newVal))
      listNotes.value[findNoteIndex].content = removeSpecialChar(substrContent(newVal));
    }

    // only reload folder to sort notes again when sort type is updatedAt
    if (sortType.value === 'updatedAt') {
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
  navigator.clipboard.writeText(removeMarkdownEscape(note.content));
  showSuccess($i18n.t('app.message_note_copied_clipboard'));
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
const isShowModalNoteHistory = ref<boolean>(false);
const historyNoteId = ref<string>('');
const historyList = ref<any[]>([]);
const historyIsLocked = ref<boolean>(false);
const loadNoteHistory = async (noteId: string) => {
  const note = await getNoteDetail(noteId);
  historyIsLocked.value = !!note?.isLocked;
  historyList.value = await getNoteHistory(noteId);
};
const handleClickFormNotesHistory = async (noteId: string) => {
  historyNoteId.value = noteId;
  await loadNoteHistory(noteId);
  toggleModalNoteHistory(true, isShowModalNoteHistory);
};
const isShowModalMenuMoveNote = ref<boolean>(false);
const noteIdToMove = ref<string>('');
const moveNoteFolders = computed(() => {
  const note = listNotes.value.find((note: any) => note.id === noteIdToMove.value);
  return listFoldersMenu.value.filter((folder: any) => folder.id !== '' && folder.id !== note?.folderId);
});
const isShowModalMenuNoteTags = ref<boolean>(false);
const handleClickMoveNote = (payload: any) => {
  const noteId = typeof payload === 'object' ? payload.noteId : payload;
  noteIdToMove.value = noteId;

  if (isMobile.value) {
    toggleModalMenuNote(false, isShowModalMenuNote);
    toggleModalMenuMoveNote(true, isShowModalMenuMoveNote);
    return;
  }

  hideMenuNoteTags();
  const rect = payload?.rect;
  if (rect) {
    offsetMenuMoveNote({ left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom });
  }
};
const handleSelectMoveFolder = async (folderId: string) => {
  toggleModalMenuMoveNote(false, isShowModalMenuMoveNote);

  const updatedNote = await updateNote(noteIdToMove.value, {
    folderId,
    updatedAt: nowUnix(),
  });
  setActionObject('note', updatedNote);

  listNotes.value = await loadNotes();
  showSuccess($i18n.t('app.message_note_moved'));
};
const handleNoteHistoryRestored = async (noteId: string) => {
  listNotes.value = await loadNotes();
  if (activeNoteId.value === noteId) {
    formNotes.value = await getNoteDetail(noteId);
    formNotesRef.value?.slientUpdateValue(formNotes.value.content);
    activeNoteBaseline.value = { noteId, content: formNotes.value.content };
  }
};
const isShowModalNoteHistoryDiff = ref<boolean>(false);
const diffSnapshotId = ref<string>('');
const handleClickViewHistoryDiff = (snapshotId: string) => {
  diffSnapshotId.value = snapshotId;
  toggleModalNoteHistoryDiff(true, isShowModalNoteHistoryDiff);
};
const restoreSnapshotId = ref<string>('');
const isShowModalConfirmRestoreNoteHistory = ref<boolean>(false);
const handleRequestRestoreNoteHistory = (snapshotId: string) => {
  restoreSnapshotId.value = snapshotId;
  toggleModalConfirmRestoreNoteHistory(true, isShowModalConfirmRestoreNoteHistory);
};
const handleConfirmRestoreNoteHistory = async (snapshotId: string) => {
  toggleModalConfirmRestoreNoteHistory(false, isShowModalConfirmRestoreNoteHistory);
  const noteId = historyNoteId.value;
  const snapshot = historyList.value.find((item: any) => item.id === snapshotId);
  if (!snapshot) {
    return;
  }

  const current = await getNoteDetail(noteId);
  await deleteNoteHistorySnapshot(noteId, snapshotId);
  if (current?.content !== undefined) {
    await saveNoteHistorySnapshot(noteId, current.content);
  }
  await updateNote(noteId, {
    content: snapshot.content,
    updatedAt: nowUnix(),
  });

  toggleModalNoteHistory(false, isShowModalNoteHistory);
  await handleNoteHistoryRestored(noteId);
  showSuccess($i18n.t('app.message_note_history_restored'));
};
const deleteSnapshotId = ref<string>('');
const isShowModalConfirmDeleteNoteHistory = ref<boolean>(false);
const handleRequestDeleteNoteHistory = (snapshotId: string) => {
  deleteSnapshotId.value = snapshotId;
  toggleModalConfirmDeleteNoteHistory(true, isShowModalConfirmDeleteNoteHistory);
};
const handleConfirmDeleteNoteHistory = async (snapshotId: string) => {
  toggleModalConfirmDeleteNoteHistory(false, isShowModalConfirmDeleteNoteHistory);
  const noteId = historyNoteId.value;
  historyList.value = await deleteNoteHistorySnapshot(noteId, snapshotId);
  showSuccess($i18n.t('app.message_note_history_deleted'));
};
const handleClickCloseModalNoteHistory = () => {
  toggleModalNoteHistory(false, isShowModalNoteHistory);
};
const handleClickCloseModalNoteHistoryDiff = () => {
  toggleModalNoteHistoryDiff(false, isShowModalNoteHistoryDiff);
};
const handleClickCloseModalConfirmRestoreNoteHistory = () => {
  toggleModalConfirmRestoreNoteHistory(false, isShowModalConfirmRestoreNoteHistory);
};
const handleClickCloseModalConfirmDeleteNoteHistory = () => {
  toggleModalConfirmDeleteNoteHistory(false, isShowModalConfirmDeleteNoteHistory);
};
const handleClickResizeApp = () => {
  colsFoldersWidth.value = 234;
  colsNotesWidth.value = 400;
  setColsWidthData();
  window.resizeTo(1167, 700);
}
const handleClickBack = async () => {
  if (activeNoteId.value) {
    await snapshotNoteBeforeLeaving(activeNoteId.value);
  }

  if (window.history.length > 1) {
    closeMobileBackState();
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
watch(() => activeFolderId.value, () => {
  if (activeFolderId.value === 'bottombar-trash') {
    isCollapsePanel.value = true;
    isCollapsePanel.value = false;
  }
});
watch(() => isCollapsePanel.value, (newValue) => {
  if (newValue) {
    setTimeout(() => {
      isShowToolbarNotes.value = !newValue;
    }, 290);
  } else {
    isShowToolbarNotes.value = true;
  }
});
const isCollapseFolder = ref<boolean>(false);
const handleClickCollapseFolder = () => {
  if (activeFolderId.value === 'bottombar-trash') {
    return;
  }

  isCollapseFolder.value = !isCollapseFolder.value;
}
const isShowFormatToolbar = ref<boolean>(false);
const handleClickFormatToolbar = () => {
  isShowFormatToolbar.value = !isShowFormatToolbar.value;
  formNotesRef.value?.focusState();
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
      editorName.value = 'Crepe';
      break;
    case 'Crepe':
      editorName.value = 'Tiptap';
      break;
    default:
      break;
  }
}
const beforeChangeEditorName = ref<string>('Crepe');
const handleClickPlainText = () => {
  if (editorName.value === 'CodeMirror' && beforeChangeEditorName.value === 'CodeMirror') {
    return;
  }

  if (editorName.value !== 'CodeMirror') {
    beforeChangeEditorName.value = editorName.value;
    editorName.value = 'CodeMirror';
  } else {
    editorName.value = beforeChangeEditorName.value;
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
const handleAlertMessage = (message: string) => {
  showInfo(message);
}

// search notes feature
// flow: load notes with content -> create Document instance -> search
const loadNotesWithContent = async (folderId: string) => {
  return getNotesWithContent(folderId);
}
const listNotesToSearch = ref<any[]>([]);
let flexsearch: any | null = null;
let flexsearchFolderId: string | null = null;
const ensureFlexSearchReady = async () => {
  if (flexsearch && flexsearchFolderId === activeFolderId.value) return;
  listNotesToSearch.value = await loadNotesWithContent(activeFolderId.value);
  flexsearch = newFlexSearch();

  await Promise.all(listNotesToSearch.value.map((note: any) => addToFlexSearch(flexsearch, toRaw(note))));
  flexsearchFolderId = activeFolderId.value;
};


// all logic of settings
const handleChangeDefaultEditor = async () => {
  settings.value = await getSettings();

  reloadFolder();
}
const handleSaveSettings = async (data: any, options: { silent?: boolean } = {}) => {
  settings.value = data;
  await setSettings(data);

  changeFontFamily(data.general?.fontFamily);

  if (!options.silent) {
    showSuccess($i18n.t('app.message_settings_saved'));
  }
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
  showSuccess($i18n.t('app.message_password_set'));
}
const isChangingPassword = ref<boolean>(false);
const handleBeforeUnloadWarning = (e: BeforeUnloadEvent) => {
  e.preventDefault();
  e.returnValue = '';
};
const handleChangePassword = async (data: any) => {
  if (isChangingPassword.value) {
    return;
  }
  isChangingPassword.value = true;

  try {
    const password = await getPassword();
    const newHashPassword = await hashPassword(data.oldPassword);
    if (password !== newHashPassword) {
      throw new Error('WRONG_OLD_PASSWORD');
    }

    // Phase 1 - verify: decrypt every locked note with the old password first, no writes yet
    const allNotes = await getAllNotes();
    const notesLocked = allNotes.filter((note: any) => note.isLocked && !note.deleteCompletelyAt);
    const decryptedNotes: { id: string; plainContent: string; oldContent: string }[] = [];
    for (const note of notesLocked) {
      const noteDetail = await getNoteDetail(note.id);
      let plainContent: string;
      try {
        plainContent = await decryptData(noteDetail.content, password);
      } catch (decryptError) {
        throw new Error('DECRYPT_FAILED');
      }
      decryptedNotes.push({ id: note.id, plainContent, oldContent: noteDetail.content });
    }

    // Phase 2 - prepare: re-encrypt everything with the new password, still only in memory
    const hashNewPassword = await hashPassword(data.newPassword);
    const preparedNotes = await Promise.all(decryptedNotes.map(async (item) => ({
      id: item.id,
      newContent: await encryptData(item.plainContent, hashNewPassword),
      oldContent: item.oldContent,
    })));

    // Phase 3 - commit: persist a recovery backup, then write, rolling back on failure
    await savePasswordChangeBackup({
      notes: preparedNotes.map((item) => ({ id: item.id, content: item.oldContent })),
      createdAt: nowUnix(),
    });
    window.addEventListener('beforeunload', handleBeforeUnloadWarning);

    const writtenNotes: typeof preparedNotes = [];
    try {
      for (const item of preparedNotes) {
        const updatedNote = await updateNote(item.id, {
          isLocked: 1,
          content: item.newContent,
          updatedAt: nowUnix(),
        });
        writtenNotes.push(item);
        setActionObject('note', updatedNote);
      }
    } catch (writeError) {
      for (const item of writtenNotes) {
        await updateNote(item.id, { content: item.oldContent, updatedAt: nowUnix() }).catch(() => { });
      }
      throw new Error('WRITE_FAILED');
    }

    await setPassword(hashNewPassword);
    setActionObject('settings', { 'id': 'settings' });
    await clearPasswordChangeBackup();

    toggleModalSetPassword(false, isShowModalSetPassword);
    showSuccess($i18n.t('app.message_change_password_success'));
    modalSetPasswordRef.value?.reset();
  } catch (error: any) {
    if (error?.message === 'DECRYPT_FAILED') {
      showErrorSnackbar($i18n.t('app.message_change_password_note_corrupted'));
    } else if (error?.message === 'WRITE_FAILED') {
      showErrorSnackbar($i18n.t('app.message_change_password_failed'));
    } else {
      modalSetPasswordRef.value?.showOldPasswordWrong();
    }
    return;
  } finally {
    window.removeEventListener('beforeunload', handleBeforeUnloadWarning);
    isChangingPassword.value = false;
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
// non-null when the pending adapter-change confirmation was triggered by an Import Settings
// conflict (rather than the manual adapter dropdown) — holds the full imported settings object
// so handleConfirmChangeAdapter can apply all of it, not just the adapter name
const pendingImportedSettings = ref<any>(null);
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
  pendingImportedSettings.value = null;
  toggleModalConfirmChangeAdapter(false, isShowModalConfirmChangeAdapter);
}
const handleConfirmChangeAdapter = async (e2eeKey: string) => {
  // automatically export notes if user change adapter
  await handleExportNotes(true, true);

  if (pendingImportedSettings.value) {
    settings.value = deepMerge(settings.value, pendingImportedSettings.value);
  } else {
    settings.value.sync.adapter = adapterWillChange.value;
  }
  await handleChangeAdapter();
  await handleSaveSettings(settings.value, { silent: true });

  if (e2eeKey) {
    const keyString = atob(e2eeKey);
    const key = await importKey(keyString);
    await saveE2EEKey(key);
    privateKey.value = key;

    saveTextFile(e2eeKey, 'opennotas-e2ee-key.txt');
  }

  const wasImport = !!pendingImportedSettings.value;
  pendingImportedSettings.value = null;

  toggleModalConfirmChangeAdapter(false, isShowModalConfirmChangeAdapter);
  showSuccess($i18n.t(wasImport ? 'app.message_import_settings' : 'app.message_setting_sync_adapter_saved'));

  // trigger 1 time full sync to pull/push all data with the new adapter
  handleClickUpdateData(SYNC_LEVELS.length - 1);
}
const isShowModalConfirmE2eeKey = ref<boolean>(false);
const handleClickCloseModalConfirmE2eeKey = () => {
  pendingImportedSettings.value = null;
  toggleModalConfirmE2eeKey(false, isShowModalConfirmE2eeKey);
}
const handleConfirmChangeAdapterOnline = async () => {
  const targetAdapter = pendingImportedSettings.value?.sync?.adapter ?? adapterWillChange.value;
  if (targetAdapter === 'LocalForage') {
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

const handleExportNotes = async (includeLock: boolean, silent = false) => {
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

  if (!silent) {
    showSuccess($i18n.t('app.message_export_notes_success'));
  }
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
  showSuccess($i18n.t('app.message_import_notes'));
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

const isShowModalExportSettingsConfirm = ref<boolean>(false);
const modalExportSettingsConfirm = ref<any>(null);
const isShowModalImportSettings = ref<boolean>(false);

const handleExportSettings = async (includeSensitive: boolean) => {
  let exportedSettings: any;
  let encryptedFields: string[] = [];
  if (includeSensitive) {
    const password = await getPassword();
    const encrypted = await encryptSensitiveSettings(settings.value, password);
    exportedSettings = encrypted.settings;
    encryptedFields = encrypted.encryptedFields;
  } else {
    exportedSettings = sanitizeSettingsForExport(settings.value);
  }
  const dataExport = {
    settings: exportedSettings,
    encryptedFields,
    metadata: {
      version: runtimeConfig.public.version,
      exportedAt: new Date().toISOString(),
    }
  };
  saveJsonFile(JSON.stringify(dataExport, null, 2), 'opennotas-export-settings.json');
  showSuccess($i18n.t('app.message_export_settings_success'));
}
const handleClickExportSettings = async () => {
  // if password exist, need to input password to export sensitive connection settings
  // else, only export settings without connection secrets
  const password = await getPassword();
  if (password) {
    toggleModalExportSettingsConfirm(true, isShowModalExportSettingsConfirm);
    return;
  }

  return handleExportSettings(false);
}
const handleClickCloseModalExportSettingsConfirm = () => {
  toggleModalExportSettingsConfirm(false, isShowModalExportSettingsConfirm);
}
const handleExportSettingsConfirm = async (data: any) => {
  const password = await getPassword();
  const newHashPassword = await hashPassword(data.password);
  if (password !== newHashPassword) {
    modalExportSettingsConfirm.value?.showFailedPassword();
    return;
  }

  toggleModalExportSettingsConfirm(false, isShowModalExportSettingsConfirm);
  return handleExportSettings(true);
}
const handleExportSettingsIgnorePassword = () => {
  return handleExportSettings(false);
}

const handleClickImportSettings = () => {
  toggleModalImportSettings(true, isShowModalImportSettings);
}
const handleClickCloseModalImportSettings = () => {
  toggleModalImportSettings(false, isShowModalImportSettings);
}
const isValidTursoConfig = (configStr: string) => {
  try {
    const cfg = JSON.parse(configStr || '{}');
    return !!cfg.url;
  } catch {
    return false;
  }
}
// Warn whenever the imported file touches sync/imageSync at all, regardless of whether the
// values actually differ from what's currently configured — predictable over clever.
const detectSyncConflict = (imported: any) => {
  return !!imported?.sync;
}
const detectImageSyncConflict = (imported: any) => {
  return !!imported?.imageSync;
}

const isShowModalConfirmImportImageSyncChange = ref<boolean>(false);
const handleConfirmImportImageSyncChange = async () => {
  const merged = deepMerge(settings.value, pendingImportedSettings.value);
  settings.value = merged;
  await setSettings(merged);
  changeFontFamily(merged.general?.fontFamily);
  pendingImportedSettings.value = null;
  toggleModalConfirmImportImageSyncChange(false, isShowModalConfirmImportImageSyncChange);
  showSuccess($i18n.t('app.message_import_settings'));
  await resetSyncedImages();
}
const handleCancelImportImageSyncChange = async () => {
  // drop only the imageSync portion of the import; the rest (general/sync) still applies
  const { imageSync, ...rest } = pendingImportedSettings.value;
  const merged = deepMerge(settings.value, rest);
  settings.value = merged;
  await setSettings(merged);
  changeFontFamily(merged.general?.fontFamily);
  pendingImportedSettings.value = null;
  toggleModalConfirmImportImageSyncChange(false, isShowModalConfirmImportImageSyncChange);
}

const handleConfirmImportSettings = async (importedSettings: any) => {
  toggleModalImportSettings(false, isShowModalImportSettings);

  // if the import would end up pointing at Turso with no usable connection config,
  // skip the sync portion rather than saving the app into a broken sync state
  const prospectiveAdapter = importedSettings.sync?.adapter ?? settings.value.sync.adapter;
  const prospectiveConfig = importedSettings.sync?.configuration ?? settings.value.sync.configuration;
  if (prospectiveAdapter === 'Turso' && !isValidTursoConfig(prospectiveConfig)) {
    delete importedSettings.sync;
    showError($i18n.t('app.message_import_settings_sync_skipped_invalid_config'));
  }

  const syncConflict = detectSyncConflict(importedSettings);
  const imageSyncConflict = detectImageSyncConflict(importedSettings);

  if (syncConflict) {
    pendingImportedSettings.value = importedSettings;
    adapterWillChange.value = importedSettings.sync?.adapter ?? settings.value.sync.adapter;
    toggleModalConfirmChangeAdapter(true, isShowModalConfirmChangeAdapter);
    return;
  }

  if (imageSyncConflict) {
    pendingImportedSettings.value = importedSettings;
    toggleModalConfirmImportImageSyncChange(true, isShowModalConfirmImportImageSyncChange);
    return;
  }

  const merged = deepMerge(settings.value, importedSettings);
  settings.value = merged;
  await setSettings(merged);
  changeFontFamily(merged.general?.fontFamily);
  showSuccess($i18n.t('app.message_import_settings'));
}

const importAlsoChangesImageSync = computed(() => {
  return !!pendingImportedSettings.value && detectImageSyncConflict(pendingImportedSettings.value);
});
const importMissingImageSyncCredentials = computed(() => {
  const img = pendingImportedSettings.value?.imageSync;
  if (!img) return false;
  const locationChanged = ('s3Endpoint' in img && img.s3Endpoint !== settings.value.imageSync.s3Endpoint) ||
    ('s3Bucket' in img && img.s3Bucket !== settings.value.imageSync.s3Bucket);
  const hasNewCredentials = ('s3AccessKey' in img) || ('s3SecretKey' in img);
  return locationChanged && !hasNewCredentials;
});


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

// pull-to-refresh on the mobile notes list — mirrors the sidebar "Sync data"
// action (handleClickUpdateData, rotating sync level). The indicator's icon
// spins while isSyncingAll is true, just like the desktop sidebar sync icon.
const ptrIndicatorRef = ref<HTMLElement | null>(null);
const ptrIconRef = ref<HTMLElement | null>(null);
watch(() => isSyncingAll.value, (value) => {
  if (value) {
    ptrIconRef.value?.classList.add('spin');
  } else {
    ptrIconRef.value?.classList.remove('spin');
  }
});
usePullToRefresh({
  target: () => document.getElementById('notes-instance'),
  indicator: () => ptrIndicatorRef.value,
  iconEl: () => ptrIconRef.value,
  onRefresh: async () => { await handleClickUpdateData(); },
  isRefreshing: () => isSyncingAll.value || isSyncing.value,
  enabled: () => isMobile.value,
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
        if (
          (immediate && initedApp && settings.value?.sync.adapter !== 'LocalForage') ||
          isSyncError.value
        ) {
          showSuccess($i18n.t('app.message_sync_success'));
        }

        // reset message
        isSyncError.value = false;
        syncErrorMessage.value = "";
        syncErrorClass.value = "";
      })
      .catch((err) => {
        if (err instanceof NetworkError) {
          isSyncError.value = true;
          syncErrorMessage.value = $i18n.t('app.message_sync_network_offline_error');
          syncErrorClass.value = 'warning';
          showWarning(syncErrorMessage.value);
        } else if (err instanceof SyncError) {
          isSyncError.value = true;
          syncErrorMessage.value = $i18n.t('app.message_sync_internal_error');
          syncErrorClass.value = 'error';
          showError(syncErrorMessage.value);
        } else {
          isSyncError.value = true;
          syncErrorMessage.value = $i18n.t('app.message_sync_internal_error');
          syncErrorClass.value = 'error';
          showError(syncErrorMessage.value);
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
    lastPushData.value || lastPull.value,
    lastPull,
    idPulled,
    actionObject,
    isPasswordExist,
    activeNoteId,
  );

  // if need reload active note, update form notes and slient update value
  if (pull.needReloadActiveNote) {
    formNotes.value = await getNoteDetail(activeNoteId.value);
    formNotesRef.value?.slientUpdateValue(formNotes.value.content);
    activeNoteBaseline.value = { noteId: activeNoteId.value, content: formNotes.value.content };
  }

  await pushData(
    settings.value,
    privateKey.value,
    actionObject,
    lastPushData,
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

const changeThemeColor = () => {
  const metaThemeColor = document.querySelector("meta[name=theme-color]");

  setTimeout(() => {
    if (colorMode.preference === "dark") {
      if (isMobile.value) {
        // metaThemeColor?.setAttribute("content", "oklch(27% 0 0)");
      } else {
        metaThemeColor?.setAttribute("content", "oklch(0.14 0 0)");
      }
    } else {
      if (isMobile.value) {
        // metaThemeColor?.setAttribute("content", "oklch(0.99 0 0)");
      } else {
        metaThemeColor?.setAttribute("content", "oklch(0.92 0 0)");
      }
    }
  }, 1000);
}
onMounted(() => {
  changeThemeColor();
});
watch(() => colorMode.preference, () => {
  changeThemeColor();
});

const changeFontFamily = (fontFamilyName: string) => {
  if (!fontFamilyName || (fontFamilyName && fontFamilyName.toLowerCase() === 'system')) return;

  const fontName = fontFamilyName.replace(/ /g, '+');
  const fontFamily = fontName.replace(/\+/g, ' ');

  const font = document.createElement('link');
  font.href = `https://fonts.googleapis.com/css2?family=${fontName}&display=swap`;
  font.rel = 'stylesheet';
  document.head.appendChild(font);
  document.body.style.fontFamily = `${fontFamily}, sans-serif`;
}
watch(() => settings.value.general.fontFamily, (newVal) => {
  changeFontFamily(newVal);
});
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
        :activeFolderId="activeFolderId" :listTags="listTagsMenu" :activeTagId="activeTagId" :formNotes="formNotes"
        :isSyncing="isSyncAll" :settings="settings" :isPasswordExist="isPasswordExist" :editorName="editorName"
        @clickFolderName="handleClickFolderName" @rightClickFolderName="handleRightClickFolderName"
        @renameFolderName="handleRenameFolderName" @reorderFolderName="handleReorderFolderName"
        @clickTagName="handleClickTagName" @rightClickTagName="handleRightClickTagName" @clickTags="handleClickTags"
        @clickAddTag="handleClickAddTag" @clickSetting="handleClickSetting" @clickBack="handleClickBack"
        @clickUpdateData="handleClickUpdateData" @clickTrash="handleClickBottombarTrash"
        @copyToClipboard="handleCopyToClipboard" @clickInfo="handleClickFormNotesInfo"
        @saveSettings="handleSaveSettings" @saveAdapter="handleSaveAdapter" @clickExportNotes="handleClickExportNotes"
        @clickAddFolder="handleClickAddFolder" @clickSwitchEditor="handleClickSwitchEditor" @clickUndo="handleClickUndo"
        @clickRedo="handleClickRedo" @clickSearch="handleClickSearch" @clickCancelSearch="handleClickCancelSearch"
        @clickSetPassword="handleClickSetPassword" @clickImportNotes="handleClickImportNotes"
        @clickExportSettings="handleClickExportSettings" @triggerImportSettings="handleClickImportSettings"
        @clickMenuSidebar="handleClickMenuSidebar" @clickFormatToolbar="handleClickFormatToolbar"
        @clickPlainText="handleClickPlainText" />
    </div>

    <!-- cols personal -->
    <div class="hidden lg:block lg:float-left cols-personal w-20 bg-base-300">
      <ColsPersonal :activeFolderId="activeFolderId" :isCollapseFolder="isCollapseFolder" :isSyncing="isSyncingAll"
        @clickNotes="handleClickFolderName('')" @clickTags="handleClickTags" @clickTrash="handleClickBottombarTrash"
        @clickSetting="handleClickSetting" @clickUpdateData="handleClickUpdateData"
        @clickCollapseFolder="handleClickCollapseFolder" />
    </div>

    <!-- cols folders -->
    <div class="hidden lg:block lg:float-left cols-folders transition-all duration-300 bg-base-300/80"
      :class="{ '!w-0': activeFolderId === 'bottombar-trash' || isCollapsePanel, '!w-[4.5rem]': isCollapseFolder && activeFolderId !== 'bottombar-trash' }"
      :style="{ width: colsFoldersWidth + 'px' }">
      <template v-if="!isTagsMode">
        <div>
          <ToolbarFolder :isSyncing="isSyncAll" :isCollapseFolder="isCollapseFolder"
            :isShowToolbarFolder="isShowToolbarNotes" @clickAddFolder="handleClickAddFolder"
            @clickSetting="handleClickSetting" @clickUpdateData="handleClickUpdateData" />
        </div>
        <!-- <hr class="hidden lg:block border-base-300"> -->

        <div id="folders-instance" class="relative overflow-auto" style="height: calc(100vh - 77px)">
          <ListFolder ref="listFolderRef" :listFolders="listFoldersMenu" :activeFolderId="activeFolderId"
            :actionObjectKeys="actionObjectKeys" :isCollapseFolder="isCollapseFolder"
            @clickFolderName="handleClickFolderName" @rightClickFolderName="handleRightClickFolderName"
            @renameFolderName="handleRenameFolderName" @reorderFolderName="handleReorderFolderName" />
        </div>
        <!-- <hr class="border-base-300"> -->
        <!-- <BottombarFolder :activeFolderId="activeFolderId" @clickTrash="handleClickBottombarTrash" /> -->
      </template>
      <template v-else>
        <div>
          <ToolbarTag :isSyncing="isSyncAll" :isCollapseFolder="isCollapseFolder"
            :isShowToolbarFolder="isShowToolbarNotes" @clickAddTag="handleClickAddTag" />
        </div>

        <div id="tags-instance" class="relative overflow-auto" style="height: calc(100vh - 77px)">
          <ListTag :listTags="listTagsMenu" :activeTagId="activeTagId" :actionObjectKeys="actionObjectKeys"
            :isCollapseFolder="isCollapseFolder" @clickTagName="handleClickTagName"
            @rightClickTagName="handleRightClickTagName" @clickAddTag="handleClickAddTag" />
        </div>
      </template>
    </div>


    <!-- cols notes -->
    <div class="cols-notes transition-all duration-300" :style="{ width: colsNotesWidth + 'px' }"
      :class="{ 'hidden': isMobile && isInEditor, '!w-full pt-[64px] absolute': isMobile, 'lg:w-3/12 lg:float-left bg-base-200 h-full': !isMobile, '!w-0': isCollapsePanel }">
      <div class="hidden lg:block">
        <ToolbarNotes v-if="isShowToolbarNotes" ref="toolbarNotesRef" :hideAddButton="isTagsMode"
          @clickAddNote="handleClickAddNote" @clickSearch="handleClickSearch"
          @clickCancelSearch="handleClickCancelSearch" />
      </div>
      <!-- <hr class="hidden lg:block border-base-300"> -->

      <div id="notes-instance" class="overflow-auto relative"
        style="height: calc(100vh - 55px); overscroll-behavior-y: contain;">
        <!-- Pull-to-refresh indicator (mobile only) -->
        <div ref="ptrIndicatorRef"
          class="absolute left-1/2 -ml-7 w-12 h-12 flex items-center justify-center rounded-full bg-neutral text-neutral-content border border-neutral-content/10 shadow-md pointer-events-none opacity-0 z-1"
          style="transform: translateY(-160%);">
          <span ref="ptrIconRef" class="block">
            <Refresh class="w-6 h-6" />
          </span>
        </div>
        <ToolbarNotesSecondBar :sortType="sortType" :isSyncError="isSyncError" :syncErrorClass="syncErrorClass"
          :syncErrorMessage="syncErrorMessage" @clickSort="handleClickSort" @clickRetrySync="handleClickRetrySync" />

        <ListNotes :key="listNotesKey" :listNotes="listNotes" :activeNoteId="activeNoteId"
          :actionObjectKeys="actionObjectKeys" :idPulled="idPulled" :animateEntrance="!isSwitchingFolder"
          @clickNote="handleClickNote" @rightClickNote="handleRightClickNote" />
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
          @clickFormatToolbar="handleClickFormatToolbar" @clickPlainText="handleClickPlainText" />
      </div>
      <!-- <hr class="hidden lg:block border-base-300"> -->

      <div id="form-editors"
        class="cursor-text overflow-auto bg-base-100 h-[calc(100vh_-_64px_-_28px)] lg:h-[calc(100vh_-_80px_-_28px)]"
        :class="{ 'overflow-x-hidden': isMobile }">
        <FormNotes ref="formNotesRef" :id="formNotes.id" :key="formNotes.id" :value="formNotes.content"
          :isLocked="formNotes.isLocked" :settings="settings" :editorName="editorName"
          :isShowFormatToolbar="isShowFormatToolbar" :isDeleted="!!formNotes.deletedAt"
          @confirmPassword="handleConfirmPassword" @changeContent="handleChangeContent"
          @clickInsertLink="handleClickInsertLink" @closeInsertLink="handleClickCloseModalInsertLink"
          @clickInsertImage="handleClickInsertImage" @closeInsertImage="handleClickCloseModalInsertImage"
          @alertMessage="handleAlertMessage" />
      </div>
      <ToolbarFormNotesStatus v-if="!formNotes.isLocked" :noteId="formNotes.id" :formNotes="formNotes"
        :actionObjectKeys="actionObjectKeys" :idPulled="idPulled" />
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
      @restoreNote="handleClickRestoreNote" @deleteNoteForever="handleClickDeleteNoteForever"
      @clickInfo="handleClickFormNotesInfo" @clickHistory="handleClickFormNotesHistory" @clickMove="handleClickMoveNote"
      @clickAddToTag="handleClickAddNoteToTag" />
  </div>
  <div id="menu-move-note" class="hidden absolute">
    <MenuMoveNote :listFolders="moveNoteFolders" @selectFolder="handleSelectMoveFolder" />
  </div>
  <div id="menu-tag" class="hidden absolute">
    <MenuTag :key="menuTagKey" :tagId="activeTagId" @editTag="handleClickEditTag" @deleteTag="handleClickDeleteTag" />
  </div>
  <div id="menu-note-tags" class="hidden absolute">
    <MenuNoteTags :listTags="listTagsMenu" :noteTagIds="activeNoteTagIds" @toggleTag="handleToggleNoteTag" />
  </div>

  <!-- modal -->
  <ModalConfirmSampleData v-if="isShowModalConfirmSampleData" @confirm="handleConfirmSampleData"
    @close="handleCancelSampleData" />
  <ModalNotesDetail v-if="isShowModalNotesDetail" :noteInfo="noteInfo" @close="handleClickCloseNotesDetail" />
  <ModalNoteHistory v-if="isShowModalNoteHistory" :history="historyList" :isLocked="historyIsLocked"
    @close="handleClickCloseModalNoteHistory" @viewDiff="handleClickViewHistoryDiff"
    @restoreRequested="handleRequestRestoreNoteHistory" @deleteRequested="handleRequestDeleteNoteHistory" />
  <ModalNoteHistoryDiff v-if="isShowModalNoteHistoryDiff" :noteId="historyNoteId" :snapshotId="diffSnapshotId"
    @close="handleClickCloseModalNoteHistoryDiff" />
  <ModalConfirmRestoreNoteHistory v-if="isShowModalConfirmRestoreNoteHistory" :snapshotId="restoreSnapshotId"
    @confirm="handleConfirmRestoreNoteHistory" @close="handleClickCloseModalConfirmRestoreNoteHistory" />
  <ModalConfirmDeleteNoteHistory v-if="isShowModalConfirmDeleteNoteHistory" :snapshotId="deleteSnapshotId"
    @confirm="handleConfirmDeleteNoteHistory" @close="handleClickCloseModalConfirmDeleteNoteHistory" />
  <ModalSetting v-if="isShowModalSettings" ref="modalSettingRef" :settings="settings" :isPasswordExist="isPasswordExist"
    @setPassword="handleSetPassword" @changePassword="handleChangePassword" @changeAdapter="handleChangeAdapter"
    @changeDefaultEditor="handleChangeDefaultEditor" @clickExportNotes="handleClickExportNotes"
    @triggerImportNotes="handleTriggerImportNotes" @saveSettings="handleSaveSettings" @saveAdapter="handleSaveAdapter"
    @clickSetPassword="handleClickSetPassword" @closeSetPassword="handleCloseSetPassword"
    @clickImportNotes="handleClickImportNotes" @clickExportSettings="handleClickExportSettings"
    @triggerImportSettings="handleClickImportSettings" @closeSetting="handleClickCloseSettings" />
  <ModalAlertSetPassword v-if="isShowModalAlertSetPassword" @close="handleClickCloseModalAlertSetPassword" />
  <ModalSetPassword v-if="isShowModalSetPassword" ref="modalSetPasswordRef" :type="isPasswordExist ? 'change' : 'set'"
    :isLoading="isChangingPassword" @confirm="handleConfirmSetPassword" @close="handleCloseSetPassword" />
  <ModalConfirmChangeAdapter v-if="isShowModalConfirmChangeAdapter" :adapterName="''"
    :isShowModalConfirmChangeAdapter="isShowModalConfirmChangeAdapter" :fromImport="!!pendingImportedSettings"
    :alsoImageSync="importAlsoChangesImageSync" @confirm="handleConfirmChangeAdapterOnline"
    @close="handleClickCloseModalConfirmChangeAdapter" />
  <ModalConfirmE2eeKey v-if="isShowModalConfirmE2eeKey" @confirm="handleConfirmChangeAdapter"
    @close="handleClickCloseModalConfirmE2eeKey" />
  <ModalConfirmImportImageSyncChange v-if="isShowModalConfirmImportImageSyncChange"
    :missingCredentials="importMissingImageSyncCredentials" @confirm="handleConfirmImportImageSyncChange"
    @close="handleCancelImportImageSyncChange" />
  <ModalImportNotes v-if="isShowModalImportNotes" @confirm="handleTriggerImportNotes"
    @close="handleClickCloseModalImportNotes" />
  <ModalExportNotesConfirm v-if="isShowModalExportNotesConfirm" ref="modalExportNotesConfirm"
    @confirmPassword="handleExportNotesConfirm" @confirmIgnorePassword="handleExportNotesIgnorePassword"
    @close="handleClickCloseModalExportNotesConfirm" />
  <ModalImportSettings v-if="isShowModalImportSettings" @confirm="handleConfirmImportSettings"
    @close="handleClickCloseModalImportSettings" />
  <ModalExportSettingsConfirm v-if="isShowModalExportSettingsConfirm" ref="modalExportSettingsConfirm"
    @confirmPassword="handleExportSettingsConfirm" @confirmIgnorePassword="handleExportSettingsIgnorePassword"
    @close="handleClickCloseModalExportSettingsConfirm" />
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
    @deleteNoteForever="handleClickDeleteNoteForever" @clickInfo="handleClickFormNotesInfo"
    @clickHistory="handleClickFormNotesHistory" @clickMove="handleClickMoveNote"
    @clickAddToTag="handleClickAddNoteToTag" />
  <ModalMenuMoveNote v-if="isShowModalMenuMoveNote" :listFolders="moveNoteFolders"
    @selectFolder="handleSelectMoveFolder" />
  <ModalMenuTag v-if="isShowModalMenuTag" :tagId="activeTagId" @editTag="handleClickEditTag"
    @deleteTag="handleClickDeleteTag" />
  <ModalMenuNoteTags v-if="isShowModalMenuNoteTags" :listTags="listTagsMenu" :noteTagIds="activeNoteTagIds"
    @toggleTag="handleToggleNoteTag" />
  <ModalTagForm v-if="isShowModalTagForm" :tagId="tagIdToEdit" :tagName="tagFormInitial.name"
    :tagColor="tagFormInitial.color" @confirm="handleConfirmTagForm" @close="handleClickCloseModalTagForm" />
  <ModalConfirmDeleteTag v-if="isShowModalConfirmDeleteTag" :tagId="tagWillDelete" @confirm="handleConfirmDeleteTag"
    @close="handleClickCloseModalConfirmDeleteTag" />
  <ModalMenuSidebar v-if="isShowModalMenuSidebar" :isTagsMode="isTagsMode" @clickAddFolder="handleClickAddFolder"
    @clickAddTag="handleClickAddTag" @clickForceSync="handleClickUpdateData" />
  <ModalInsertLink v-if="isShowModalInsertLink" ref="modalInsertLinkRef" @confirm="handleConfirmInsertLink"
    @close="handleClickCloseModalInsertLink" />
  <ModalInsertImage v-if="isShowModalInsertImage" ref="modalInsertImageRef" @confirm="handleConfirmInsertImage"
    @close="handleClickCloseModalInsertImage" />

  <!-- float button create new note -->
  <FloatNewNotes v-if="!isInEditor && initedApp && !isTagsMode && activeFolderId !== 'bottombar-trash'"
    @clickNewNote="handleClickAddNote" />
</template>
