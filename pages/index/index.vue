<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, toRaw } from 'vue';

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
  getNoteCountsByTag,
  buildTagsByNoteId,
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
import { Refresh } from '~/utils/icons';

const { $i18n } = useNuxtApp();
const { locale, setLocale } = useI18n();
const runtimeConfig = useRuntimeConfig();

const isInEditor = ref<boolean>(false);

function updateViewportHeight() {
  const viewportHeight = globalThis.innerHeight;
  document.documentElement.style.setProperty(
    "--vh",
    `${viewportHeight * 0.01}px`,
  );
}

const privateKey = ref<CryptoKey>(); // using to decrypt/encrypt sync data
onMounted(async () => {
  if (runtimeConfig.public.env === 'production') {
    registerServiceWorker();
  }

  updateViewportHeight();

  nextTick(() => {
    setTimeout(attachEditorScroll, 150);
  });
  document.addEventListener('keydown', handleWorkspaceKeydown);

  window.history.replaceState({}, '', window.location.pathname);
  outsideClickMenu();
  disableDefaultContextMenu();
  initMobileBackHandler();

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

  window.addEventListener('resize', handleResizeScreen);
  window.addEventListener('resize', updateViewportHeight);

  const localKey = await getE2EEKey();
  if (localKey) {
    privateKey.value = localKey;
  }

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

const isShowModalConfirmSampleData = ref<boolean>(false);
onMounted(async () => {
  const isFirstInit = await checkIsFirstInit();
  if (isFirstInit) {
    toggleModalConfirmSampleData(true, isShowModalConfirmSampleData);
  }
});
const isVietnameseSample = (text: string) => /[ăâđêôơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i.test(text);
const handleConfirmSampleData = async () => {
  toggleModalConfirmSampleData(false, isShowModalConfirmSampleData);

  const notes = await fetch('/opennotas.json').then((res) => res.json());
  // Demo data contains both English and Vietnamese copies; show only one locale.
  if (Array.isArray(notes?.data)) {
    notes.data = notes.data.filter((note: any) => {
      const vietnamese = isVietnameseSample(note.content || '');
      return locale.value === 'vi' ? vietnamese : !vietnamese;
    });
  }
  await setImportData(notes);
  await handleTriggerImportNotes();
  await setFirstInit();
};
const handleCancelSampleData = async () => {
  toggleModalConfirmSampleData(false, isShowModalConfirmSampleData);
  await setFirstInit();
};

// Reset the shared scroller when switching views (the short tag grid can look empty).
const scrollNotesToTop = () => {
  document.getElementById('notes-instance')?.scrollTo({ top: 0, behavior: 'auto' });
}

const listNotesKey = ref<number>(0);
const reloadNotes = async (focus = true, isTrash = false) => {
  document.getElementById('notes-instance')?.scrollTo({ top: 0, behavior: 'smooth' });

  await nextTick();
  sortType.value = await getSortNote();
  const preferredNoteId = await loadActiveNote() || activeNoteId.value;
  listNotes.value = isTrash ? await loadTrashNotes() : await loadNotes();
  await refreshFolderCounts();
  await syncActiveNoteSelection(preferredNoteId, focus);
}
const reloadFolder = async (isFirst: boolean = false, focus = true) => {
  await nextTick();
  listFoldersMenu.value = await loadFolder();
  const activeFolder = await loadActiveFolder();
  activeFolderId.value = (isFirst && (activeFolder === 'bottombar-trash' || activeFolder === 'bottombar-tags')) ? "" : activeFolder || "";

  await reloadNotes(focus, isFirst ? false : activeFolder === 'bottombar-trash');

  listTagsMenu.value = await loadTags();
}

const initedApp = ref<boolean>(false);
watch(() => initedApp.value, (newVal) => {
  if (newVal) {
    // Let the app settle before triggering the first background sync.
    setTimeout(() => {
      if (settings.value.sync?.adapter !== 'LocalForage' && navigator.onLine) {
        showInfo($i18n.t('app.message_sync_init'));
      }

      idleSync(true, newVal);
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

const settings = ref<any>(getDefaultSettings());
onMounted(async () => {
  const oldSettings = await getSettings();
  const mergeSettings = deepMerge(settings.value, oldSettings);
  if (mergeSettings.general) {
    settings.value = mergeSettings;
    setLocale(settings.value.general.lang);
  }
});

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

// One pass over all notes keeps sidebar counters free of N+1 queries.
const folderNoteCounts = ref<Record<string, number>>({});
const tagNoteCounts = ref<Record<string, number>>({});
const trashCount = ref<number>(0);
const refreshFolderCounts = async () => {
  const [notes, tagCounts] = await Promise.all([getAllNotes(), getNoteCountsByTag()]);
  tagNoteCounts.value = tagCounts;
  const counts: Record<string, number> = { '': 0 };
  let deleted = 0;

  for (const note of notes) {
    if (note.deleteCompletelyAt) continue;
    if (note.deletedAt) {
      deleted += 1;
      continue;
    }
    counts[''] = (counts[''] || 0) + 1;
    // Unfiled notes are already counted above.
    if (note.folderId) {
      counts[note.folderId] = (counts[note.folderId] || 0) + 1;
    }
  }

  folderNoteCounts.value = counts;
  trashCount.value = deleted;
};

const activeNoteTags = computed(() => {
  const note = listNotes.value.find((item: any) => item.id === activeNoteId.value);
  return note?.tags || [];
});

const activeNoteFolderName = computed(() => {
  const note = listNotes.value.find((item: any) => item.id === activeNoteId.value);
  if (!note?.folderId) return '';
  return listFoldersMenu.value.find((folder: any) => folder.id === note.folderId)?.name || '';
});

const editorTitle = computed(() => {
  return substrTitle(formNotes.value?.content) || $i18n.t('app.navbar_top_note_title');
});

// Swap the header to the note title once the document title scrolls away.
const isEditorScrolled = ref(false);
const editorScrollElement = ref<HTMLElement | null>(null);
const updateEditorScrollState = () => {
  isEditorScrolled.value = (editorScrollElement.value?.scrollTop || 0) > 32;
};
const attachEditorScroll = () => {
  const element = document.getElementById('form-editors');
  if (!element || element === editorScrollElement.value) return;
  editorScrollElement.value?.removeEventListener('scroll', updateEditorScrollState);
  editorScrollElement.value = element;
  element.addEventListener('scroll', updateEditorScrollState, { passive: true });
  updateEditorScrollState();
};

const isTypingTarget = (target: EventTarget | null) => {
  const element = target as HTMLElement | null;
  if (!element?.closest) return false;
  return !!element.closest(
    'input, textarea, select, [contenteditable="true"], .ProseMirror, .cm-editor, .milkdown, button, [role="button"], dialog',
  );
};

const handleWorkspaceKeydown = (event: KeyboardEvent) => {
  if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
  if (document.querySelector('dialog[open]')) return;
  if (isTypingTarget(event.target)) return;
  if (!listNotes.value.length) return;

  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    const delta = event.key === 'ArrowDown' ? 1 : -1;
    const currentIndex = listNotes.value.findIndex((note: any) => note.id === activeNoteId.value);
    const nextIndex = currentIndex === -1
      ? 0
      : Math.max(0, Math.min(listNotes.value.length - 1, currentIndex + delta));
    const nextNote = listNotes.value[nextIndex];
    if (!nextNote) return;

    if (nextNote.id !== activeNoteId.value) {
      handleClickNote(nextNote.id, false);
    }
    nextTick(() => {
      document
        .querySelector(`[data-note-id="${nextNote.id}"]`)
        ?.scrollIntoView({ block: 'nearest' });
    });
    return;
  }

  if (event.key === 'Enter' && activeNoteId.value) {
    event.preventDefault();
    if (isMobile.value) {
      handleClickNote(activeNoteId.value, true);
    } else {
      formNotesRef.value?.focus();
    }
  }
};

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
    if (!showDirectorySyncError(error)) {
      showError($i18n.t(error instanceof NetworkError
        ? 'app.message_sync_network_offline_error'
        : 'app.message_sync_internal_error'));
    }
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
  navbarTopRef.value?.closeDrawer?.();

  // Create in the rename dialog so the name is confirmed before commit.
  folderFormMode.value = 'create';
  folderFormId.value = '';
  folderFormName.value = $i18n.t('app.modal_new_folder_title');
  toggleModalChangeFolderName(true, isShowModalChangeFolderName);
};
const activeFolderId = ref<string>("");
const activeFolderName = computed(() => {
  const folder = listFoldersMenu.value.find((folder: any) => folder.id === activeFolderId.value);
  return folder?.name || "";
});

// Resolve titles for trash/tag views, which have no folder row.
const activeListTitle = computed(() => {
  if (isSearchMode.value) return $i18n.t('app.search_results_title');
  if (activeFolderId.value === 'bottombar-trash') return $i18n.t('app.bottombar_folder_trash');
  if (activeFolderId.value === 'bottombar-tags') {
    const tag = listTagsMenu.value.find((item: any) => item.id === activeTagId.value);
    return tag?.name || $i18n.t('app.tab_tags');
  }
  return activeFolderName.value || $i18n.t('app.list_folder_all');
});
const activeListCount = computed(() => {
  if (isSearchMode.value) return listNotes.value.length;
  if (isTagsMode.value && !activeTagId.value) return listTagsMenu.value.length;
  return listNotes.value.length;
});
// Skip entrance animation when a folder switch remounts the whole list.
const isSwitchingFolder = ref<boolean>(false);
const handleClickFolderName = async (folderId: string) => {
  await discardPendingDraft();
  navbarTopRef.value?.resetSearchInput();
  toolbarNotesRef.value?.resetSearchInput?.();
  isSearchMode.value = false;
  searchQuery.value = '';
  activeFolderId.value = folderId;
  activeTagId.value = '';
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
const folderFormMode = ref<'create' | 'rename'>('rename');
const folderFormId = ref<string>('');
const folderFormName = ref<string>('');
const handleClickCloseModalChangeFolderName = () => {
  toggleModalChangeFolderName(false, isShowModalChangeFolderName);
}
const handleClickRenameFolder = () => {
  toggleModalMenuFolder(false, isShowModalMenuFolder);
  folderFormMode.value = 'rename';
  folderFormId.value = activeFolderId.value;
  folderFormName.value = activeFolderName.value;
  toggleModalChangeFolderName(true, isShowModalChangeFolderName);
}
const modalChangeFolderNameRef = ref<any>(null);
const handleRenameFolderName = async (data: any) => {
  if (!data.folderId) {
    const newFolder = await createFolder({
      id: randomUUID(),
      name: data.folderNewName,
      lastSync: 0,
      createdAt: nowUnix(),
      updatedAt: nowUnix(),
      deletedAt: null,
    });
    setActionObject('folder', newFolder);
    toggleModalChangeFolderName(false, isShowModalChangeFolderName);
    listFoldersMenu.value = await loadFolder();
    showSuccess($i18n.t('app.message_folder_created'));
    await handleClickFolderName(newFolder.id);
    return;
  }

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
    const fullNote = await getNoteDetail(note.id);
    const updatedNote = await updateNote(note.id, {
      previousFolderId: fullNote.folderId || folderId,
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
  await discardPendingDraft();
  navbarTopRef.value?.resetSearchInput();
  isSearchMode.value = false;
  searchQuery.value = '';
  activeFolderId.value = 'bottombar-trash';
  activeTagId.value = '';
  isCollapsePanel.value = false;
  setActiveFolder('bottombar-trash');

  isSwitchingFolder.value = true;
  listNotes.value = await loadTrashNotes();
  await refreshFolderCounts();
  await syncActiveNoteSelection(activeNoteId.value);
  await nextTick();
  scrollNotesToTop();
  isSwitchingFolder.value = false;
}

const activeTagId = ref<string>("");
const listTagsMenu = ref<any[]>([]);
const isTagsMode = computed(() => activeFolderId.value === 'bottombar-tags');
const loadTags = async () => {
  return getTags();
}
const loadNotesForActiveTag = async () => {
  const notes = await getNotesForTag(activeTagId.value, sortType.value, $i18n.t('app.list_note_locked_title'), $i18n.t('app.list_note_locked_content'));
  await refreshFolderCounts();
  return notes;
}
const handleClickTags = async () => {
  await discardPendingDraft();
  navbarTopRef.value?.resetSearchInput();
  isSearchMode.value = false;
  searchQuery.value = '';
  activeFolderId.value = 'bottombar-tags';
  isCollapsePanel.value = false;
  setActiveFolder('bottombar-tags');

  activeTagId.value = '';
  listNotes.value = [];
  activeNoteId.value = '';
  setActiveNote('');
  formNotes.value = {};
  listTagsMenu.value = await loadTags();
  await nextTick();
  scrollNotesToTop();
}
const handleClickTagName = async (tagId: string) => {
  navbarTopRef.value?.resetSearchInput();
  isSearchMode.value = false;
  searchQuery.value = '';
  activeFolderId.value = 'bottombar-tags';
  setActiveFolder('bottombar-tags');
  activeTagId.value = tagId;
  listNotes.value = await loadNotesForActiveTag();
  await refreshFolderCounts();
  await nextTick();
  scrollNotesToTop();
  await syncActiveNoteSelection(activeNoteId.value, true);
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

const { confirm } = useConfirm();
const handleClickDeleteTag = async (tagId: string) => {
  toggleModalMenuTag(false, isShowModalMenuTag);

  const ok = await confirm({
    title: $i18n.t('app.modal_confirm_delete_tag_title'),
    message: $i18n.t('app.modal_confirm_delete_tag_content'),
    okText: $i18n.t('app.modal_confirm_delete_tag_ok'),
    cancelText: $i18n.t('app.modal_confirm_delete_tag_cancel'),
    okVariant: 'danger',
  });
  if (!ok) return;

  const noteTagsOfTag = await getNoteTagsByTag(tagId);
  await deleteTag(tagId);
  setActionObject('tag', { id: tagId, deletedAt: nowUnix() });
  for (const noteTag of noteTagsOfTag) {
    setActionObject('noteTag', { id: noteTag.id, deletedAt: nowUnix() });
  }

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
    listNotes.value = await loadActiveList();
  }
};

const isShowModalMenuSidebar = ref<boolean>(false);
const handleClickMenuSidebar = (e: any) => {
  toggleModalMenuSidebar(true, isShowModalMenuSidebar);
}
const isSearchMode = ref(false);
const searchQuery = ref('');

const sortType = ref<'createdAt' | 'updatedAt'>('createdAt');
const handleClickSort = async (type: 'createdAt' | 'updatedAt') => {
  sortType.value = type as 'createdAt' | 'updatedAt';
  await setSortNote(type);

  listNotes.value = await loadActiveList();
}
const handleClickRetrySync = async () => {
  isSyncError.value = false;
  syncErrorMessage.value = "";
  syncErrorClass.value = "";

  showInfo($i18n.t('app.message_sync_init'));

  await new Promise(resolve => setTimeout(resolve, 3000));

  idleSync(true, true);
}

const loadNotes = async () => {
  const notes = await getNotes(activeFolderId.value, sortType.value, $i18n.t('app.list_note_locked_title'), $i18n.t('app.list_note_locked_content'));
  await refreshFolderCounts();
  return notes;
}
const loadActiveNote = async () => {
  return getActiveNote();
}
const loadTrashNotes = async () => {
  const notes = await getDeletedNotes($i18n.t('app.list_note_locked_title'), $i18n.t('app.list_note_locked_content'));
  await refreshFolderCounts();
  return notes;
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
// Drop an untouched draft when the user navigates away.
const pendingDraftNoteId = ref<string | null>(null);
const discardPendingDraft = async () => {
  const noteId = pendingDraftNoteId.value;
  if (!noteId) return;
  const draft = await getNoteDetail(noteId);
  if (draft?.content && getNotePlainText(draft.content)) {
    pendingDraftNoteId.value = null;
    return;
  }
  pendingDraftNoteId.value = null;
  const removedDraft = await updateNote(noteId, {
    deletedAt: nowUnix(),
    deleteCompletelyAt: nowUnix(),
    updatedAt: nowUnix(),
  });
  setActionObject('note', removedDraft);
  listNotes.value = listNotes.value.filter((item: any) => item.id !== noteId);
  if (activeNoteId.value === noteId) {
    activeNoteId.value = '';
    formNotes.value = {};
  }
  await refreshFolderCounts();
};

// Keep list-to-detail continuity; select the first note when the old one disappears.
const syncActiveNoteSelection = async (preferredNoteId = activeNoteId.value, focus = false) => {
  const candidate = listNotes.value.find((note: any) => note.id === preferredNoteId)
    || listNotes.value[0]
    || null;

  activeNoteId.value = candidate?.id || '';
  setActiveNote(activeNoteId.value);

  if (!isMobile.value) {
    formNotes.value = candidate ? await getNoteDetail(candidate.id) : {};
    if (candidate && focus) {
      nextTick(() => formNotesRef.value?.focus());
    }
  } else if (!candidate) {
    formNotes.value = {};
  }

  return candidate;
};
const selectNoteById = async (noteId: string, focus = false) => {
  if (!noteId) return;
  await handleClickNote(noteId, false, focus);
};
const handleClickAddNote = async () => {
  await discardPendingDraft();
  const newNote = await createNote(activeFolderId.value);
  pendingDraftNoteId.value = newNote.id;
  setActionObject('note', newNote);
  listNotes.value = await loadNotes();
  showSuccess($i18n.t('app.message_note_created'));

  handleClickNote(newNote.id, true, true);
};
const handleOpenNoteMenu = () => {
  if (!formNotes.value?.id) return;
  menuNoteKey.value += 1;
  toggleModalMenuNote(true, isShowModalMenuNote);
};
const handleClickSearch = async (value: string) => {
  const query = value.trim();
  searchQuery.value = query;
  isSearchMode.value = !!query;

  if (!query) {
    listNotes.value = await loadActiveList();
    await syncActiveNoteSelection(activeNoteId.value);
    navbarTopRef.value?.searchLoadingDone();
    toolbarNotesRef.value?.searchLoadingDone?.();
    return;
  }

  // Search is global, not scoped to the open folder.
  const allNotes = await getNotes('', sortType.value, $i18n.t('app.list_note_locked_title'), $i18n.t('app.list_note_locked_content'));
  const rawNotes = (await getNotesWithContent('')).filter((note: any) => !note.isLocked);
  await ensureFlexSearchReady(rawNotes);
  const result = flexsearch!.search({
    query,
    highlight: {
      template: "<b>$1</b>",
      boundary: {
        before: 5,
        after: 5,
      }
    },
  });
  listNotes.value = (result[0]?.result || []).reduce((acc: any[], item: any) => {
    const currentNote = allNotes.find((note: any) => note.id === item.id);
    if (!currentNote) return acc;
    currentNote.highlight = item.highlight;
    acc.push(currentNote);

    return acc;
  }, []);
  await syncActiveNoteSelection(activeNoteId.value);
  navbarTopRef.value?.searchLoadingDone();
  toolbarNotesRef.value?.searchLoadingDone?.();
}
const handleClickCancelSearch = async () => {
  isSearchMode.value = false;
  searchQuery.value = '';
  listNotes.value = await loadActiveList();
  await syncActiveNoteSelection(activeNoteId.value);
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
  if (pendingDraftNoteId.value && pendingDraftNoteId.value !== noteId) {
    await discardPendingDraft();
  }
  if (activeNoteId.value && activeNoteId.value !== noteId) {
    await snapshotNoteBeforeLeaving(activeNoteId.value);
  }
  activeNoteId.value = noteId;
  setActiveNote(noteId);
  formNotes.value = await getNoteDetail(activeNoteId.value);
  if (!isMobile.value) {
    const editorElement = document.getElementById('form-editors');
    if (editorElement) editorElement.scrollTop = 0;
    isEditorScrolled.value = false;
  }
  setTimeout(() => {
    formNotesRef.value?.focusPassword();

    if (shouldFocus && (!isMobile.value || !formNotes.value.content)) {
      formNotesRef.value?.focus();
    }
  }, 100);

  if (inEditor) {
    isInEditor.value = true;

    // Mobile back closes the editor instead of leaving the app.
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

  if (pendingDraftNoteId.value === noteId) pendingDraftNoteId.value = null;
  const note = await getNoteDetail(noteId);
  const previousFolderId = note.folderId || '';
  const removedIndex = listNotes.value.findIndex((item: any) => item.id === noteId);
  const fallbackNextId = listNotes.value[removedIndex + 1]?.id
    || listNotes.value[removedIndex - 1]?.id
    || '';

  await updateNote(noteId, {
    previousFolderId,
    deletedAt: nowUnix(),
    updatedAt: nowUnix(),
  });
  setActionObject('note', { id: noteId });

  listNotes.value = await loadActiveList();
  await refreshFolderCounts();
  activeNoteId.value = '';
  await syncActiveNoteSelection(fallbackNextId);

  showActionToast(
    $i18n.t('app.message_note_deleted'),
    $i18n.t('app.action_undo'),
    async () => {
      await updateNote(noteId, {
        deletedAt: null,
        previousFolderId: null,
        folderId: previousFolderId,
        updatedAt: nowUnix(),
      });
      listNotes.value = await loadActiveList();
      await refreshFolderCounts();
      await syncActiveNoteSelection(noteId);
      showSuccess($i18n.t('app.message_note_restored'));
    },
  );
}
const handleClickDeleteNoteForever = async (noteId: string) => {
  toggleModalMenuNote(false, isShowModalMenuNote);

  const note = await getNoteDetail(noteId);
  const removedIndex = listNotes.value.findIndex((item: any) => item.id === noteId);
  const fallbackNextId = listNotes.value[removedIndex + 1]?.id
    || listNotes.value[removedIndex - 1]?.id
    || '';

  const ok = await confirm({
    title: $i18n.t('app.modal_confirm_delete_note_forever_title'),
    message: $i18n.t('app.modal_confirm_delete_note_forever_content', {
      title: substrTitle(note.content) || $i18n.t('app.list_note_no_title'),
    }),
    okText: $i18n.t('app.menu_note_delete_forever'),
    cancelText: $i18n.t('app.action_cancel'),
    okVariant: 'danger',
  });
  if (!ok) return;

  await updateNote(noteId, {
    deleteCompletelyAt: nowUnix(),
    updatedAt: nowUnix(),
  });
  setActionObject('note', { id: noteId });

  listNotes.value = await loadTrashNotes();
  await refreshFolderCounts();
  activeNoteId.value = '';
  await syncActiveNoteSelection(fallbackNextId);
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

  listNotes.value = await loadActiveList();
  formNotes.value = { ...formNotes.value, isPinned: updatedNote.isPinned };
  showSuccess($i18n.t(isPinning ? 'app.message_note_pinned' : 'app.message_note_unpinned'));

  const notesInstance = document.getElementById('notes-instance');
  if (notesInstance) {
    notesInstance.scrollTo({ top: 0, behavior: 'auto' });
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
    title: substrTitle(note.content),
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
      title: substrTitle(decryptedContent),
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

  const note = await getNoteDetail(noteId);
  const folders = await getFolders(allFolderName.value);
  const originalFolderId = note.previousFolderId || note.folderId || '';
  const folderStillExists = !!originalFolderId
    && folders.some((folder: any) => folder.id === originalFolderId && !folder.deletedAt);
  const targetFolderId = folderStillExists ? originalFolderId : '';
  const wasLastTrashNote = listNotes.value.length <= 1;

  await updateNote(noteId, {
    folderId: targetFolderId,
    previousFolderId: null,
    deletedAt: null,
    updatedAt: nowUnix(),
  });
  setActionObject('note', { id: noteId });

  if (wasLastTrashNote) {
    // Keep the user out of an empty Trash pane.
    activeFolderId.value = targetFolderId;
    setActiveFolder(targetFolderId);
    await reloadNotes(false, false);
    await handleClickNote(noteId, false);
  } else {
    listNotes.value = await loadTrashNotes();
    await refreshFolderCounts();
    activeNoteId.value = '';
    await syncActiveNoteSelection(listNotes.value[0]?.id || '');
  }

  showSuccess($i18n.t('app.message_note_restored'));
}

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
  const note = await getNoteDetail(id);
  const updatedNote = await updateNote(id, {
    content: note.isLocked ? await encryptData(newVal, await getPassword()) : newVal,
    updatedAt: nowUnix(),
    ...(settings.value.sync?.adapter !== 'LocalForage' && {
      lastSync: nowUnix(),
    }),
  });
  formNotes.value.content = newVal;
  if (pendingDraftNoteId.value === id && getNotePlainText(newVal)) {
    pendingDraftNoteId.value = null;
  }
  invalidateSearchIndex();

  if (!note.isLocked) {
    const findNoteIndex = listNotes.value.findIndex((item: any) => item.id === id);
    if (findNoteIndex >= 0) {
      listNotes.value[findNoteIndex].title = substrTitle(newVal);
      listNotes.value[findNoteIndex].content = substrContent(newVal);
    }
  }

  clearTimeout(debounceChangeContent);
  debounceChangeContent = setTimeout(async () => {
    if (sortType.value === 'updatedAt') {
      reloadFolder(false, false);
    }
  }, 1000);

  setActionObject('note', updatedNote);
  mutex.release();
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
  isLocked: false,
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
    isLocked: !!note.isLocked,
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

  listNotes.value = await loadActiveList();
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
  await discardPendingDraft();
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

// Cmd/Ctrl+K: global note/folder/tag search plus quick actions.
const isCommandPaletteOpen = ref(false);
const commandPaletteNotes = ref<any[]>([]);
const openCommandPalette = async () => {
  if (document.querySelector('dialog[open]')) return;
  isCommandPaletteOpen.value = true;
  commandPaletteNotes.value = await getNotes('', sortType.value,
    $i18n.t('app.list_note_locked_title'), $i18n.t('app.list_note_locked_content'));
};
const handleCommandSelectNote = async (noteId: string) => {
  const note = commandPaletteNotes.value.find((item: any) => item.id === noteId)
    || await getNoteDetail(noteId);
  const folderId = note?.folderId || '';
  activeFolderId.value = folderId;
  setActiveFolder(folderId);
  isSearchMode.value = false;
  searchQuery.value = '';
  await reloadNotes(false, false);
  await handleClickNote(noteId, isMobile.value);
};
const handleCommandSelectFolder = async (folderId: string) => {
  await handleClickFolderName(folderId);
};
const handleCommandSelectTag = async (tagId: string) => {
  activeFolderId.value = 'bottombar-tags';
  setActiveFolder('bottombar-tags');
  listTagsMenu.value = await loadTags();
  await handleClickTagName(tagId);
};
const handleCommandRunAction = async (action: string) => {
  if (action === 'new-note') {
    // Notes cannot live in the synthetic tags/trash folder ids.
    if (isTagsMode.value || activeFolderId.value === 'bottombar-trash') {
      await handleClickFolderName('');
    }
    await handleClickAddNote();
  } else if (action === 'new-folder') {
    await handleClickAddFolder();
  } else if (action === 'settings') {
    handleClickSetting();
  }
};
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

const handleClickSearchInNote = () => {
  formNotesRef.value?.toggleSearch();
}
const handleClickNoteFolder = async (folderId: string) => {
  if (!folderId) return;
  await handleClickFolderName(folderId);
};
const handleClickNoteTag = async (tagId: string) => {
  activeFolderId.value = 'bottombar-tags';
  setActiveFolder('bottombar-tags');
  listTagsMenu.value = await loadTags();
  await handleClickTagName(tagId);
};
// Ctrl/Cmd+F opens in-note search only while an unlocked note is open.
const handleGlobalKeydown = (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    openCommandPalette();
    return;
  }
  if (!((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f')) return;
  if (!formNotes.value?.id || formNotes.value.isLocked) return;

  e.preventDefault();
  formNotesRef.value?.openSearch();
}
onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown);
});
onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleGlobalKeydown);
  document.removeEventListener('keydown', handleWorkspaceKeydown);
  editorScrollElement.value?.removeEventListener('scroll', updateEditorScrollState);
});

const editorName = ref<string>(settings.value.general.defaultEditor);
watch(() => settings.value.general.defaultEditor, (newValue) => {
  editorName.value = newValue;
});
const changeEditorEvent = ref<any>(null);
const handleClickSwitchEditor = async (nodeId: string) => {
  await handleClickNote(nodeId);
  changeEditorEvent.value = !changeEditorEvent.value;
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

// Search notes: load content -> build FlexSearch document -> query.
const listNotesToSearch = ref<any[]>([]);
let flexsearch: any | null = null;
let flexsearchSignature: string | null = null;
const ensureFlexSearchReady = async (allNotes: any[]) => {
  // Index plain-text bodies, not excerpts or raw Markdown.
  const indexedNotes = allNotes.map((note: any) => ({
    id: note.id,
    updatedAt: note.updatedAt,
    content: getNotePlainText(note.content),
  }));
  const signature = indexedNotes.map((note: any) => `${note.id}:${note.updatedAt}`).join('|');
  if (flexsearch && flexsearchSignature === signature) return;

  listNotesToSearch.value = indexedNotes;
  flexsearch = newFlexSearch();
  await Promise.all(indexedNotes.map((note: any) => addToFlexSearch(flexsearch, toRaw(note))));
  flexsearchSignature = signature;
};
const invalidateSearchIndex = () => {
  flexsearch = null;
  flexsearchSignature = null;
};

const handleChangeDefaultEditor = async () => {
  settings.value = await getSettings();

  reloadFolder();
}
const handleSaveSettings = async (data: any, options: { silent?: boolean } = {}) => {
  settings.value = data;
  await setSettings(data);

  changeFontFamily(data.general?.fontFamily);
  changeEditorFontFamily(data.general?.editorFontFamily);

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
// Selecting a directory is non-destructive until the user picks a source.
const isShowDirectorySetup = ref(false);
const directorySetupMode = ref<'seed' | 'restore'>('seed');
const directorySetupInfo = ref<any>(null);
const pendingDirectoryHandle = ref<FileSystemDirectoryHandle | null>(null);
const allowE2eeGenerate = ref(true);

const prepareDirectorySelection = async () => {
  try {
    adapterWillChange.value = 'SqliteDirectory';
    const parent = await pickParentDirectory();
    if (!parent) {
      if (settings.value.sync?.adapter !== 'SqliteDirectory') adapterWillChange.value = '';
      return;
    }
    const dataDirectory = await resolveDataDirectory(parent);
    // Persist the handle only after source choice and key confirmation.
    const info = await inspectDataDirectory(dataDirectory);
    pendingDirectoryHandle.value = dataDirectory;
    directorySetupInfo.value = { folderName: dataDirectory.name, ...info };
    isShowDirectorySetup.value = true;
  } catch (error: any) {
    if (error?.name === 'AbortError') return;
    showError($i18n.t('app.message_directory_folder_error'));
  }
};

const handleDirectoryChooseAgain = async () => {
  isShowDirectorySetup.value = false;
  await prepareDirectorySelection();
};

const handleCompactDirectory = async () => {
  try {
    const adapter = await getSyncAdapterInstance();
    await adapter.beginSync?.();
    await adapter.commitSync?.();
    await adapter.compact?.();
    showSuccess($i18n.t('app.message_directory_compacted'));
  } catch (error) {
    if (!showDirectorySyncError(error)) {
      showError($i18n.t('app.message_sync_internal_error'));
    }
  }
};

const handleDirectorySetupClose = () => {
  isShowDirectorySetup.value = false;
  directorySetupInfo.value = null;
  pendingDirectoryHandle.value = null;
};

const handleDirectorySetupSeed = () => {
  directorySetupMode.value = 'seed';
  allowE2eeGenerate.value = true;
  isShowDirectorySetup.value = false;
  toggleModalConfirmE2eeKey(true, isShowModalConfirmE2eeKey);
};

const handleDirectorySetupRestore = () => {
  directorySetupMode.value = 'restore';
  allowE2eeGenerate.value = false;
  isShowDirectorySetup.value = false;
  toggleModalConfirmE2eeKey(true, isShowModalConfirmE2eeKey);
};

const finishDirectorySetup = async (e2eeKey: string) => {
  const folderHandle = pendingDirectoryHandle.value;
  if (!folderHandle) throw new Error('DIRECTORY_MISSING');

  let key = privateKey.value;
  if (e2eeKey) {
    key = await importKey(atob(e2eeKey));
    privateKey.value = key;
    saveTextFile(e2eeKey, 'opennotas-e2ee-key.txt');
  }
  if (!key) throw new Error('E2EE_KEY_MISSING');

  await saveDirectoryHandle(folderHandle);
  const configuration = JSON.stringify({ folderName: folderHandle.name });
  const isRestore = directorySetupMode.value === 'restore';

  if (isRestore) {
    // Replacing local data is destructive: preserve the existing export first.
    await handleExportNotes(true, true);
    await cleanData();
  }

  settings.value = {
    ...settings.value,
    sync: {
      ...(settings.value.sync || {}),
      adapter: 'SqliteDirectory',
      configuration,
    },
  };
  await setSettings(settings.value);
  // cleanData() wipes the local key store, so persist the key only after the
  // destructive restore step has completed.
  await saveE2EEKey(key);
  await resetSyncAdapterInstance();

  if (isRestore) {
    lastPull.value = 0;
    lastPushData.value = 0;
    await updateLastPull(0);
    await handleClickUpdateData(SYNC_LEVELS.length - 1);
  } else {
    const adapter = await createSyncAdapter('SqliteDirectory', configuration, true);
    await adapter.beginSync?.();

    // Clear an existing target before writing the replacement; the wrapped key
    // must be queued after that clear so it survives the seed transaction.
    if (directorySetupInfo.value?.hasExistingData && typeof adapter.clearData === 'function') {
      await adapter.clearData();
    }
    if (typeof adapter.setWrappedE2EEKey === 'function') {
      const keyString = e2eeKey ? atob(e2eeKey) : await exportKey(key);
      await adapter.setWrappedE2EEKey(keyString);
    }

    const seededAt = await seedAdapterFromLocal(adapter, key);
    await adapter.close();
    await resetSyncAdapterInstance();
    lastPull.value = seededAt;
    lastPushData.value = seededAt;
    await updateLastPull(seededAt);
    await reloadFolder(false, false);
  }

  handleDirectorySetupClose();
  toggleModalConfirmE2eeKey(false, isShowModalConfirmE2eeKey);
  showSuccess($i18n.t('app.message_setting_sync_adapter_saved'));
};

// Full imported settings for an import-triggered adapter confirmation.
const pendingImportedSettings = ref<any>(null);
const isApplyingSyncChange = ref<boolean>(false);
const handleSaveAdapter = async (adapterName: string) => {
  if (adapterName === 'SqliteDirectory') {
    adapterWillChange.value = adapterName;
    await prepareDirectorySelection();
    return;
  }
  adapterWillChange.value = adapterName;
  toggleModalConfirmChangeAdapter(true, isShowModalConfirmChangeAdapter);
}
const handleChangeAdapter = async () => {
  await resetSyncAdapterInstance();
  await cleanData();
  reloadFolder();
}
const isShowModalConfirmChangeAdapter = ref<boolean>(false);
const handleClickCloseModalConfirmChangeAdapter = () => {
  pendingImportedSettings.value = null;
  toggleModalConfirmChangeAdapter(false, isShowModalConfirmChangeAdapter);
}
const handleConfirmChangeAdapter = async (e2eeKey: string) => {
  // The connected-folder row can open the picker too; the handle is the signal.
  if (pendingDirectoryHandle.value || adapterWillChange.value === 'SqliteDirectory') {
    isApplyingSyncChange.value = true;
    try {
      await finishDirectorySetup(e2eeKey);
    } catch (error: any) {
      showError($i18n.t(error?.message === 'E2EE_KEY_MISSING'
        ? 'app.message_directory_key_required'
        : 'app.message_directory_setup_error'));
    } finally {
      isApplyingSyncChange.value = false;
    }
    return;
  }

  isApplyingSyncChange.value = true;
  try {
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

    // Keep the modal's spinner visible through the actual pull/push.
    await handleClickUpdateData(SYNC_LEVELS.length - 1);

    toggleModalConfirmChangeAdapter(false, isShowModalConfirmChangeAdapter);
    toggleModalConfirmE2eeKey(false, isShowModalConfirmE2eeKey);
    showSuccess($i18n.t(wasImport ? 'app.message_import_settings' : 'app.message_setting_sync_adapter_saved'));
  } finally {
    isApplyingSyncChange.value = false;
  }
}
const isShowModalConfirmE2eeKey = ref<boolean>(false);
const handleClickCloseModalConfirmE2eeKey = () => {
  pendingImportedSettings.value = null;
  directorySetupInfo.value = null;
  pendingDirectoryHandle.value = null;
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
  const tagsByNoteId = await buildTagsByNoteId();
  const allTags = await getTags();

  const notesFiltered = notes.filter((note: any) => !note.deleteCompletelyAt);
  const notesReformated = [];

  for (const note of notesFiltered) {
    if (!includeLock && note.isLocked) {
      continue;
    }

    const password = await getPassword();
    const folderName = note.folderId ? foldersObject[note.folderId] : "";
    const noteTags = tagsByNoteId.get(note.id) || [];
    notesReformated.push({
      folderName: folderName,
      content: note.isLocked ? await decryptData(note.content, password) : note.content,
      createdAt: note.createdAt,
      deletedAt: note.deletedAt,
      tags: noteTags.map((tag: any) => ({ name: tag.name, color: tag.color })),
    });
  }

  const dataExport = {
    data: notesReformated,
    folders: folders.filter((folder: any) => folder.id).map((folder: any) => folder.name),
    tags: allTags.map((tag: any) => ({ name: tag.name, color: tag.color })),
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
const isImportingNotes = ref<boolean>(false);
const importNotesProgressCurrent = ref<number>(0);
const importNotesProgressTotal = ref<number>(0);
const handleClickCloseModalImportNotes = () => {
  toggleModalImportNotes(false, isShowModalImportNotes);
}
const handleClickImportNotes = () => {
  toggleModalImportNotes(true, isShowModalImportNotes);
}
const handleTriggerImportNotes = async () => {
  isImportingNotes.value = true;
  importNotesProgressCurrent.value = 0;
  importNotesProgressTotal.value = 0;
  try {
    const jsonData: any = await getImportData();
    importNotesProgressTotal.value = jsonData.data.length;

    const foldersInJson = jsonData.data.map((note: any) => note.folderName);
    const foldersInJsonUnique = [...new Set([...foldersInJson, ...(jsonData.folders || [])])];
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

    const tagsInJson = [...(jsonData.tags || []), ...jsonData.data.flatMap((note: any) => note.tags || [])];
    const tagNameToColor = new Map<string, string | undefined>();
    for (const tag of tagsInJson) {
      if (!tag?.name) continue;
      if (!tagNameToColor.has(tag.name)) tagNameToColor.set(tag.name, tag.color);
    }

    const localTags = await getTags();
    const tagNameToId = new Map<string, string>(localTags.map((tag: any) => [tag.name, tag.id]));
    for (const [tagName, tagColor] of tagNameToColor) {
      if (!tagNameToId.has(tagName)) {
        const newTag = await createTag({
          id: randomUUID(),
          name: tagName,
          color: tagColor,
          lastSync: 0,
          createdAt: nowUnix(),
          updatedAt: nowUnix(),
          deletedAt: null,
        });
        setActionObject('tag', newTag);
        tagNameToId.set(tagName, newTag.id);
      }
    }
    listTagsMenu.value = await loadTags();

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

      for (const tag of (note.tags || [])) {
        if (!tag?.name) continue;
        const tagId = tagNameToId.get(tag.name);
        if (!tagId) continue;
        const createdNoteTag = await addTagToNote(newNote.id, tagId);
        setActionObject('noteTag', createdNoteTag);
      }

      i++;
      importNotesProgressCurrent.value = i;
    }

    await reloadFolder();

    toggleModalImportNotes(false, isShowModalImportNotes);
    showSuccess($i18n.t('app.message_import_notes'));
    navbarTopRef.value?.closeDrawer();
  } finally {
    isImportingNotes.value = false;
  }
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
// Warn on any imported sync configuration, even if values happen to match.
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

  // Never import a Turso adapter with no usable connection config.
  const prospectiveAdapter = importedSettings.sync?.adapter ?? settings.value.sync.adapter;
  const prospectiveConfig = importedSettings.sync?.configuration ?? settings.value.sync.configuration;
  if (prospectiveAdapter === 'Turso' && !isValidTursoConfig(prospectiveConfig)) {
    delete importedSettings.sync;
    showError($i18n.t('app.message_import_settings_sync_skipped_invalid_config'));
  }
  if (prospectiveAdapter === 'SqliteDirectory') {
    // Folder handles are device-local; reconnect instead of importing a broken target.
    delete importedSettings.sync;
    showError($i18n.t('app.message_directory_import_needs_folder'));
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

const isShowModalSettings = ref<boolean>(false);
const handleClickSetting = () => {
  if (isMobile.value) {
    navbarTopRef.value?.openSettingDrawer();
    return;
  }
  toggleModalSettings(true, isShowModalSettings);
}
const handleClickCloseSettings = () => {
  toggleModalSettings(false, isShowModalSettings);
}
// Queued mutations are persisted and flushed periodically; see docs/sync-flow.
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

let isSyncing = ref<boolean>(false);
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

// Pull-to-refresh on mobile mirrors the sidebar's sync action.
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

// Idle ticks trigger continuous sync while queued mutations exist.
const idleKey = ref<number>(0);
watch(() => idleKey.value, () => {
  idleSync();
});
let setTimeoutSync: any = null;
const directoryErrorMessageKey = (error: any) => {
  switch (error?.code) {
    case 'DIRECTORY_BUSY': return 'app.message_directory_busy';
    case 'DIRECTORY_PERMISSION': return 'app.message_directory_permission';
    case 'DIRECTORY_MISSING': return 'app.message_directory_missing';
    case 'DIRECTORY_CHANGED': return 'app.message_directory_changed';
    case 'OPLOG_CORRUPT':
    case 'OPLOG_AHEAD':
    case 'BASE_CORRUPT': return 'app.message_directory_corrupt';
    default: return '';
  }
};
const showDirectorySyncError = (error: any) => {
  const key = directoryErrorMessageKey(error);
  if (key) {
    showError($i18n.t(key));
    return true;
  }
  return false;
};
const idleSync = async (immediate = false, initedApp = false) => {
  if (setTimeoutSync) {
    clearTimeout(setTimeoutSync);
  }

  setTimeoutSync = setTimeout(async () => {
    if (isSyncing.value || isApplyingSyncChange.value) {
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

            isSyncError.value = false;
        syncErrorMessage.value = "";
        syncErrorClass.value = "";
      })
      .catch((err) => {
        if (showDirectorySyncError(err)) {
          isSyncError.value = true;
          syncErrorMessage.value = $i18n.t(directoryErrorMessageKey(err));
          syncErrorClass.value = 'error';
        } else if (err instanceof NetworkError) {
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
// IDs pulled in the last run, used to mark changes.
const idPulled = ref<string[]>([]);
// Last push timestamp, used to skip already-pushed queue entries.
const lastPushData = ref<number>(0);
// Reuse one adapter instance so directory syncs keep their SQLite session.
let syncAdapterInstance: any = null;
let syncAdapterInstanceKey = '';
const getSyncAdapterInstance = async () => {
  const key = adapterCacheKey(settings.value.sync?.adapter, settings.value.sync?.configuration);
  if (syncAdapterInstance && syncAdapterInstanceKey === key) {
    return syncAdapterInstance;
  }
  await syncAdapterInstance?.close?.();
  syncAdapterInstance = await createSyncAdapter(
    settings.value.sync?.adapter,
    settings.value.sync?.configuration,
    window.navigator.onLine,
  );
  syncAdapterInstanceKey = key;
  return syncAdapterInstance;
}
const resetSyncAdapterInstance = async () => {
  const instance = syncAdapterInstance;
  syncAdapterInstance = null;
  syncAdapterInstanceKey = '';
  await instance?.close?.();
}
onBeforeUnmount(() => {
  resetSyncAdapterInstance();
});
const pullPush = async () => {
  const syncAdapter = await getSyncAdapterInstance();
  await syncAdapter.beginSync?.();

  try {
    const pull = await pullData(
      settings.value,
      privateKey.value,
      lastPushData.value || lastPull.value,
      lastPull,
      idPulled,
      actionObject,
      isPasswordExist,
      activeNoteId,
      syncAdapter,
    );

    if (pull.needReloadActiveNote) {
      formNotes.value = await getNoteDetail(activeNoteId.value);
      formNotesRef.value?.slientUpdateValue(formNotes.value.content);
      activeNoteBaseline.value = { noteId: activeNoteId.value, content: formNotes.value.content };
    }

    const pushedKeys = await pushData(
      settings.value,
      privateKey.value,
      actionObject,
      lastPushData,
      pull.now || nowUnix(),
      syncAdapter,
    );
    await syncAdapter.commitSync?.();

    // Remove queued mutations only after the adapter has made them durable.
    for (const key of pushedKeys || []) {
      delete actionObject.value[key];
    }
    if (settings.value.sync?.adapter !== 'LocalForage') {
      lastPushData.value = pull.now || nowUnix();
    }

    if (pull.ok) {
      reloadFolder(false, false);
    }
  } catch (error) {
    console.error('OpenNotas sync failed', error);
    await syncAdapter.abortSync?.();
    throw error;
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

const normalizeEditorFont = (value?: string) => {
  const font = (value || '').trim();
  return font && font.toLowerCase() !== 'system' ? font : '';
}

const clampSetting = (value: any, fallback: number, min: number, max: number) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}

const editorTypographyStyle = computed(() => {
  const general = settings.value.general || {};
  const font = normalizeEditorFont(general.editorFontFamily);
  const style: Record<string, string> = {
    '--ui-editor-font-size': `${clampSetting(general.editorFontSize, 14, 12, 32)}px`,
    '--ui-editor-line-height': `${clampSetting(general.editorLineHeight, 1.5, 1.2, 2.4)}`,
    '--ui-editor-block-spacing': `${clampSetting(general.editorBlockSpacing, 0.75, 0, 3)}em`,
  };
  if (font) {
    style['--ui-editor-font-family'] = font.includes(',') ? font : `${font}, var(--ui-font-sans)`;
  }
  return style;
});

const loadedFontLinks = new Set<string>();
const ensureFontLoaded = (fontFamilyName?: string) => {
  const fontFamily = (fontFamilyName || '').trim();
  if (!fontFamily || fontFamily.toLowerCase() === 'system' || fontFamily.includes(',')) return;
  if (loadedFontLinks.has(fontFamily)) return;

  const fontName = fontFamily.replace(/ /g, '+');
  const link = document.createElement('link');
  link.id = `ui-font-${fontName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  link.href = `https://fonts.googleapis.com/css2?family=${fontName}&display=swap`;
  link.rel = 'stylesheet';
  if (!document.getElementById(link.id)) document.head.appendChild(link);
  loadedFontLinks.add(fontFamily);
}

const changeFontFamily = (fontFamilyName: string) => {
  // Clearing the setting must also remove a previously applied custom font.
  if (!fontFamilyName || fontFamilyName.toLowerCase() === 'system') {
    document.body.style.fontFamily = '';
    return;
  }

  ensureFontLoaded(fontFamilyName);
  document.body.style.fontFamily = `${fontFamilyName}, sans-serif`;
}

const changeEditorFontFamily = (fontFamilyName?: string) => {
  ensureFontLoaded(normalizeEditorFont(fontFamilyName));
}

watch(() => settings.value.general.fontFamily, (newVal) => {
  changeFontFamily(newVal);
});
watch(() => settings.value.general.editorFontFamily, (newVal) => {
  changeEditorFontFamily(newVal);
});
</script>

<template>
  <div v-if="!initedApp" class="fixed inset-0 flex items-center justify-center">
    <LoaderLogo />
    <p class="absolute bottom-4" style="bottom: calc(1rem + env(safe-area-inset-bottom, 0px));">{{ runtimeConfig.public.version }}</p>
  </div>

  <div class="flex w-screen flex-col overflow-hidden bg-background"
    style="height: calc(var(--vh, 1vh) * 100);-webkit-overflow-scrolling: touch; overscroll-behavior-y: contain;"
    v-else>
    <div class="lg:hidden">
      <NavbarTop ref="navbarTopRef" :isInEditor="isInEditor" :listFolders="listFoldersMenu"
        :activeFolderId="activeFolderId" :listTags="listTagsMenu" :activeTagId="activeTagId" :isSearchMode="isSearchMode" :formNotes="formNotes"
        :isSyncing="isSyncAll" :settings="settings" :isPasswordExist="isPasswordExist" :editorName="editorName"
        :folderCounts="folderNoteCounts" :tagCounts="tagNoteCounts" :trashCount="trashCount" :actionObjectKeys="actionObjectKeys" :sortType="sortType"
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
        @clickPlainText="handleClickPlainText" @clickSearchInNote="handleClickSearchInNote"
        @clickMenuNote="handleOpenNoteMenu" @openSearch="openCommandPalette" @clickSort="handleClickSort" />
    </div>

    <div class="relative flex min-h-0 flex-1">
      <AppSidebar class="hidden lg:flex" :listFolders="listFoldersMenu" :listTags="listTagsMenu"
        :activeFolderId="isSearchMode ? '__search__' : activeFolderId" :activeTagId="isSearchMode ? '' : activeTagId" :actionObjectKeys="actionObjectKeys"
        :isSyncing="isSyncAll" :folderCounts="folderNoteCounts" :tagCounts="tagNoteCounts" :trashCount="trashCount"
        @clickFolderName="handleClickFolderName" @clickTags="handleClickTags"
        @rightClickFolderName="handleRightClickFolderName" @renameFolderName="handleRenameFolderName"
        @reorderFolderName="handleReorderFolderName" @clickTagName="handleClickTagName"
        @rightClickTagName="handleRightClickTagName" @clickAddFolder="handleClickAddFolder"
        @clickAddTag="handleClickAddTag" @clickTrash="handleClickBottombarTrash"
        @clickSettings="handleClickSetting" @clickSync="handleClickUpdateData"
        @openSearch="openCommandPalette" />

      <div class="cols-notes flex flex-col overflow-hidden bg-card transition-[width,opacity] duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] lg:h-full lg:shrink-0 lg:border-r lg:border-border"
         :class="[isMobile ? 'absolute inset-0 w-full mobile-under-nav' : '', isMobile && isInEditor ? 'hidden' : '', !isMobile && isCollapsePanel ? 'pointer-events-none !w-0 !border-r-0 opacity-0' : 'opacity-100']"
        :style="!isMobile ? { width: colsNotesWidth + 'px' } : {}">
        <div class="hidden lg:block">
          <ToolbarNotes v-if="isShowToolbarNotes" ref="toolbarNotesRef" :title="activeListTitle"
            :count="activeListCount" :sortType="sortType" :searchQuery="isSearchMode ? searchQuery : ''" :listLabel="activeListTitle"
            :hideAddButton="isTagsMode || activeFolderId === 'bottombar-trash'"
            :hideSort="isTagsMode && !activeTagId"
            @clickAddNote="handleClickAddNote" @clickSort="handleClickSort" />
        </div>

        <div id="notes-instance" class="relative min-h-0 flex-1 overflow-auto" style="overscroll-behavior-y: contain;">
          <div ref="ptrIndicatorRef"
            class="pointer-events-none absolute left-1/2 -ml-7 top-3 z-20 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-popover text-popover-foreground opacity-0 shadow-md"
            style="transform: translateY(-160%);">
            <span ref="ptrIconRef" class="block">
              <Refresh class="w-5 h-5" />
            </span>
          </div>

          <ListTagOverview v-if="isTagsMode && !activeTagId" :listTags="listTagsMenu"
            :tagCounts="tagNoteCounts" :actionObjectKeys="actionObjectKeys"
            @clickTagName="handleClickTagName" @rightClickTagName="handleRightClickTagName"
            @clickAddTag="handleClickAddTag" />

          <template v-else>
            <div v-if="isSyncError">
              <ToolbarNotesSecondBar :isSyncError="isSyncError" :syncErrorClass="syncErrorClass"
                :syncErrorMessage="syncErrorMessage" @clickRetrySync="handleClickRetrySync" />
            </div>

            <ListNotes :key="listNotesKey" :listNotes="listNotes" :activeNoteId="activeNoteId"
              :actionObjectKeys="actionObjectKeys" :idPulled="idPulled" :animateEntrance="!isSwitchingFolder"
              :folders="listFoldersMenu" :sortType="sortType"
              :hideFolderChip="!isSearchMode && !!activeFolderId && activeFolderId !== 'bottombar-tags'"
              :searchQuery="isSearchMode ? searchQuery : ''" :listLabel="activeListTitle"
              :emptyState="isSearchMode ? 'search' : (activeFolderId === 'bottombar-trash' ? 'trash' : (isTagsMode && activeTagId ? 'tag' : 'notes'))"
              @clickNote="handleClickNote" @rightClickNote="handleRightClickNote"
              @pinNote="handleClickPinNote" @deleteNote="handleClickDeleteNote" />
          </template>
        </div>
      </div>

      <div class="flex min-h-0 min-w-0 flex-1 flex-col bg-card"
         :class="isMobile ? (isInEditor ? 'absolute inset-0 z-20 flex mobile-under-nav' : 'hidden') : ''">
        <ToolbarFormNotes :noteId="formNotes.id" :editorName="editorName" :isLocked="formNotes.isLocked"
          :formNotes="formNotes" :folderId="formNotes.folderId" :folderName="activeNoteFolderName" :tags="activeNoteTags"
          :isPinned="!!formNotes.isPinned" :isDeleted="!!formNotes.deletedAt" :title="editorTitle"
          :showTitle="isEditorScrolled" @clickInfo="handleClickFormNotesInfo"
          @copyNote="handleCopyToClipboard" @clickSwitchEditor="handleClickSwitchEditor"
          @clickCollapsePanel="handleClickCollapsePanel" @clickFormatToolbar="handleClickFormatToolbar"
          @clickPlainText="handleClickPlainText" @clickSearchInNote="handleClickSearchInNote"
          @clickPin="handleClickPinNote" @clickFolder="handleClickNoteFolder"
          @clickTag="handleClickNoteTag" />

        <div id="form-editors" class="min-h-0 flex-1 cursor-text overflow-auto bg-card" :style="editorTypographyStyle"
          :class="{ 'overflow-x-hidden': isMobile }">
          <div v-if="formNotes.id && formNotes.deletedAt"
            class="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b border-border bg-muted px-4 py-2.5 sm:px-6">
            <div class="flex min-w-0 flex-1 items-center gap-2">
              <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-danger/10 text-danger">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </span>
              <div class="min-w-0">
                <p class="truncate text-[12px] font-medium">{{ $t('app.trash_banner_title') }}</p>
                <p class="truncate text-[11px] text-muted-foreground">{{ $t('app.trash_banner_desc') }}</p>
              </div>
            </div>
            <div class="flex shrink-0 items-center gap-2">
              <button type="button" class="ui-btn ui-btn-sm" @click="handleClickRestoreNote(formNotes.id)">
                {{ $t('app.trash_banner_restore') }}
              </button>
              <button type="button" class="ui-btn ui-btn-sm ui-btn-danger" @click="handleClickDeleteNoteForever(formNotes.id)">
                {{ $t('app.trash_banner_delete_forever') }}
              </button>
            </div>
          </div>

          <FormNotes ref="formNotesRef" :id="formNotes.id" :key="formNotes.id" :value="formNotes.content"
            :emptyMode="isTagsMode ? (activeTagId ? 'note' : 'tags') : activeFolderId === 'bottombar-trash' ? 'trash' : 'note'"
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
  </div>

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

  <CommandPalette v-if="isCommandPaletteOpen" :open="isCommandPaletteOpen" :notes="commandPaletteNotes"
    :folders="listFoldersMenu" :tags="listTagsMenu" @update:open="isCommandPaletteOpen = $event"
    @selectNote="handleCommandSelectNote" @selectFolder="handleCommandSelectFolder"
    @selectTag="handleCommandSelectTag" @runAction="handleCommandRunAction" />

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
    @triggerImportSettings="handleClickImportSettings" @closeSetting="handleClickCloseSettings"
    @chooseDirectory="prepareDirectorySelection" @compactDirectory="handleCompactDirectory" />
  <ModalAlertSetPassword v-if="isShowModalAlertSetPassword" @close="handleClickCloseModalAlertSetPassword" />
  <ModalSetPassword v-if="isShowModalSetPassword" ref="modalSetPasswordRef" :type="isPasswordExist ? 'change' : 'set'"
    :isLoading="isChangingPassword" @confirm="handleConfirmSetPassword" @close="handleCloseSetPassword" />
  <ModalConfirmChangeAdapter v-if="isShowModalConfirmChangeAdapter" :adapterName="''" :isLoading="isApplyingSyncChange"
    :isShowModalConfirmChangeAdapter="isShowModalConfirmChangeAdapter" :fromImport="!!pendingImportedSettings"
    :alsoImageSync="importAlsoChangesImageSync" @confirm="handleConfirmChangeAdapterOnline"
    @close="handleClickCloseModalConfirmChangeAdapter" />
  <ModalConfirmE2eeKey v-if="isShowModalConfirmE2eeKey" :isLoading="isApplyingSyncChange"
    :allowGenerate="allowE2eeGenerate" @confirm="handleConfirmChangeAdapter"
    @close="handleClickCloseModalConfirmE2eeKey" />
  <ModalDirectorySyncSetup v-if="isShowDirectorySetup" :isLoading="isApplyingSyncChange"
    :folderName="directorySetupInfo?.folderName || ''" :hasExistingData="!!directorySetupInfo?.hasExistingData"
    :baseSize="directorySetupInfo?.baseSize || 0" :oplogSize="directorySetupInfo?.oplogSize || 0"
    @chooseFolder="handleDirectoryChooseAgain" @seed="handleDirectorySetupSeed"
    @useFolder="handleDirectorySetupRestore" @close="handleDirectorySetupClose" />
  <ModalConfirmImportImageSyncChange v-if="isShowModalConfirmImportImageSyncChange"
    :missingCredentials="importMissingImageSyncCredentials" @confirm="handleConfirmImportImageSyncChange"
    @close="handleCancelImportImageSyncChange" />
  <ModalImportNotes v-if="isShowModalImportNotes" @confirm="handleTriggerImportNotes"
    @close="handleClickCloseModalImportNotes" :isLoading="isImportingNotes"
    :progressCurrent="importNotesProgressCurrent" :progressTotal="importNotesProgressTotal" />
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
  <ModalChangeFolderName v-if="isShowModalChangeFolderName" ref="modalChangeFolderNameRef" :folderId="folderFormId"
    :folderName="folderFormName" :mode="folderFormMode" @confirm="handleRenameFolderName"
    @close="handleClickCloseModalChangeFolderName" />
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
  <ModalMenuSidebar v-if="isShowModalMenuSidebar" :isTagsMode="isTagsMode" @clickAddFolder="handleClickAddFolder"
    @clickAddTag="handleClickAddTag" @clickForceSync="handleClickUpdateData" />
  <ModalInsertLink v-if="isShowModalInsertLink" ref="modalInsertLinkRef" @confirm="handleConfirmInsertLink"
    @close="handleClickCloseModalInsertLink" />
  <ModalInsertImage v-if="isShowModalInsertImage" ref="modalInsertImageRef" @confirm="handleConfirmInsertImage"
    @close="handleClickCloseModalInsertImage" />

  <FloatNewNotes v-if="!isInEditor && initedApp && !isTagsMode && activeFolderId !== 'bottombar-trash'"
    @clickNewNote="handleClickAddNote" />
</template>
