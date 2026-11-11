<script setup lang="ts">
import { onMounted } from 'vue';

import S3ProxyAdapter from '~/adapter/s3';
import { resetSyncedImages } from '~/services/image';
import { hasNewVersion } from '~/utils/check-app-version';
import { useMobileBackToggle } from '~/utils/mobile-back';
import SettingRow from '../../modal/setting/setting-row.vue';
import SettingSelect from '../../modal/setting/setting-select.vue';
import { Menu } from '~/utils/icons';
import { Setting } from '~/utils/icons';
import { ArrowLeft } from '~/utils/icons';
import { Sort } from '~/utils/icons';
import { Info } from '~/utils/icons';
import { Clipboard } from '~/utils/icons';
import { Undo } from '~/utils/icons';
import { Redo } from '~/utils/icons';
import { Search } from '~/utils/icons';
import { ToolCase } from '~/utils/icons';
import { MenuVertical } from '~/utils/icons';
import { Type } from '~/utils/icons';
import { Pencil } from '~/utils/icons';
import { toggleModalSortNote } from '~/utils/modal';

const props = defineProps([
  'listFolders',
  'activeFolderId',
  'listTags',
  'activeTagId',
  'formNotes',
  'isInEditor',
  'isSyncing',
  'settings',
  'isPasswordExist',
  'editorName',
  'folderCounts',
  'tagCounts',
  'trashCount',
  'actionObjectKeys',
  'isSearchMode',
  'sortType',
]);

const emit = defineEmits([
  'saveSettings',
  'clickFolderName',
  'rightClickFolderName',
  'renameFolderName',
  'reorderFolderName',
  'clickTagName',
  'rightClickTagName',
  'clickTags',
  'clickAddTag',
  'clickSearch',
  'openSearch',
  'clickCancelSearch',
  'clickSetting',
  'clickBack',
  'clickUpdateData',
  'clickTrash',
  'clickSwitchEditor',
  'copyToClipboard',
  'clickInfo',
  'changeDefaultEditor',
  'changeAdapter',
  'changePassword',
  'setPassword',
  'saveAdapter',
  'clickExportNotes',
  'clickAddFolder',
  'clickUndo',
  'clickRedo',
  'clickSetPassword',
  'clickImportNotes',
  'clickMenuSidebar',
  'clickFormatToolbar',
  'clickPlainText',
  'clickExportSettings',
  'triggerImportSettings',
  'clickSearchInNote',
  'clickMenuNote',
  'clickSort',
]);

const { $i18n } = useNuxtApp();
const { setLocale } = useI18n();
const runtimeConfig = useRuntimeConfig();

const isDrawerOpen = ref<boolean>(false);
useMobileBackToggle(isDrawerOpen);

const activeFolderName = computed(() => {
  if (props.isSearchMode) {
    return $i18n.t('app.search_results_title');
  }
  if (props.activeFolderId === 'bottombar-trash') {
    return $i18n.t('app.navbar_top_trash_title');
  }
  if (props.activeFolderId === 'bottombar-tags') {
    const tag = props.listTags.find((item: any) => item.id === props.activeTagId);
    return tag ? tag.name : $i18n.t('app.tab_tags');
  }

  const folder = props.listFolders.find((item: any) => item.id === props.activeFolderId);
  return folder ? folder.name : $i18n.t('app_name');
});

const sortLabel = computed(() =>
  props.sortType === 'createdAt'
    ? $i18n.t('app.list_sort_created')
    : $i18n.t('app.list_sort_edited'),
);
const showSort = computed(() =>
  !props.isInEditor
  && props.activeFolderId !== 'bottombar-trash'
  && !(props.activeFolderId === 'bottombar-tags' && !props.activeTagId)
);
const isShowSort = ref(false);
const handleOpenSort = () => {
  toggleModalSortNote(true, isShowSort);
};
const handleClickSort = (type: 'createdAt' | 'updatedAt') => {
  emit('clickSort', type);
};

const editorTitle = computed(() => {
  const firstLine = (props.formNotes?.content || '')
    .split('\n')
    .map((line: string) => line.trim())
    .find((line: string) => line.length > 0);

  const clean = firstLine
    ? firstLine.replace(/^#{1,6}\s*/, '').replace(/[*_`>#-]/g, '').trim()
    : '';

  return clean || $i18n.t('app.navbar_top_note_title');
});

const isShowSearchInput = ref(false);
useMobileBackToggle(isShowSearchInput);
const handleOpenSearch = () => {
  isDrawerOpen.value = false;
  isDrawerSettingOpen.value = false;
  emit('openSearch');
};
const handleToggleSearch = () => {
  isShowSearchInput.value = !isShowSearchInput.value;
  if (isShowSearchInput.value) {
    setTimeout(() => {
      searchInputRef.value?.focus();
    }, 100);
  } else {
    searchInput.value = '';
    emit('clickCancelSearch');
  }
}
const searchInputRef = ref<HTMLInputElement | null>(null);
const searchInput = ref<string>('');
const isShowSearchLoading = ref(false);
let searchInputDebounce: any = null;
watch(searchInput, (value) => {
  clearTimeout(searchInputDebounce);
  isShowSearchLoading.value = false;

  searchInputDebounce = setTimeout(() => {
    isShowSearchLoading.value = true;
    emit('clickSearch', value);
  }, 500);
});

const handleClickFolderName = (folderId: string) => {
  emit('clickFolderName', folderId);
  isDrawerOpen.value = false;
};

const handleRightClickFolderName = (folderId: string) => {
  emit('rightClickFolderName', folderId);
};

const handleRenameFolderName = (folderId: string) => {
  emit('renameFolderName', folderId);
};

const handleReorderFolderName = (data: any[]) => {
  emit('reorderFolderName', data);
};

const handleClickTagName = (tagId: string) => {
  emit('clickTagName', tagId);
  isDrawerOpen.value = false;
};
const handleRightClickTagName = (data: any) => {
  emit('rightClickTagName', data);
};
const handleClickAddTag = () => {
  emit('clickAddTag');
};
const handleClickTagsTab = () => {
  emit('clickTags');
  isDrawerOpen.value = false;
};

const handleClickSetting = () => {
  isDrawerSettingOpen.value = true;
};
const handleClickBack = () => {
  emit('clickBack');
};
const handleClickUpdateData = () => {
  emit('clickUpdateData');
};

const isDrawerSettingOpen = ref<boolean>(false);
useMobileBackToggle(isDrawerSettingOpen);

const handleClickTrash = () => {
  emit('clickTrash');
  isDrawerOpen.value = false;
};

const handleClickFormatToolbar = () => {
  emit('clickFormatToolbar', props.formNotes.id);
};
const handleClickSearchInNote = () => {
  emit('clickSearchInNote', props.formNotes.id);
};

const handleOpenMenuEditorModal = () => {
  emit('clickMenuNote');
}

const handleSaveSettings = () => {
  emit('saveSettings', settings.value);
}
const isShowFontDialog = ref(false);
const fontDialogValue = ref('');
const fontDisplayName = computed(() =>
  (settings.value.general?.fontFamily || '').trim() || $i18n.t('app.setting_general_font_system'),
);
const handleOpenFontDialog = () => {
  fontDialogValue.value = settings.value.general?.fontFamily || '';
  isShowFontDialog.value = true;
};
const handleSaveFontDialog = () => {
  settings.value.general.fontFamily = fontDialogValue.value.trim();
  isShowFontDialog.value = false;
  handleSaveSettings();
};

const clampNumber = (value: any, fallback: number, min: number, max: number) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
};
const isShowEditorFontDialog = ref(false);
const editorFontDialogValue = ref('');
const editorFontSizeDraft = ref<number>(14);
const editorLineHeightDraft = ref<number>(1.5);
const editorBlockSpacingDraft = ref<number>(0.75);
const editorFontDisplayName = computed(() => {
  const value = (settings.value.general?.editorFontFamily || '').trim();
  const size = settings.value.general?.editorFontSize ?? 14;
  return !value || value.toLowerCase() === 'system'
    ? `${size}px · ${settings.value.general?.editorLineHeight ?? 1.5}`
    : `${value} · ${size}px`;
});
const handleOpenEditorFontDialog = () => {
  editorFontDialogValue.value = settings.value.general?.editorFontFamily || '';
  editorFontSizeDraft.value = Number(settings.value.general?.editorFontSize ?? 14);
  editorLineHeightDraft.value = Number(settings.value.general?.editorLineHeight ?? 1.5);
  editorBlockSpacingDraft.value = Number(settings.value.general?.editorBlockSpacing ?? 0.75);
  isShowEditorFontDialog.value = true;
};
const handleSaveEditorFontDialog = () => {
  const value = editorFontDialogValue.value.trim();
  settings.value.general.editorFontFamily = value.toLowerCase() === 'system' ? '' : value;
  settings.value.general.editorFontSize = clampNumber(editorFontSizeDraft.value, 14, 12, 32);
  settings.value.general.editorLineHeight = clampNumber(editorLineHeightDraft.value, 1.5, 1.2, 2.4);
  settings.value.general.editorBlockSpacing = clampNumber(editorBlockSpacingDraft.value, 0.75, 0, 3);
  isShowEditorFontDialog.value = false;
  handleSaveSettings();
};
watch(isDrawerSettingOpen, (open) => {
  if (!open) {
    isShowFontDialog.value = false;
    isShowEditorFontDialog.value = false;
  }
});
const handleChangeDefaultEditor = () => {
  handleSaveSettings();
  emit('changeDefaultEditor', true);
}
const handleChangeEditorView = () => {
  handleSaveSettings();
}
const handleClickSetPassword = () => {
  emit('clickSetPassword');
}
const adapterSelect = ref<string>('');
// Track explicit adapter edits separately from async parent settings updates.
const userEditedAdapter = ref(false);

type S3Config = {
  s3Endpoint: string;
  s3AccessKey: string;
  s3SecretKey: string;
  s3Bucket: string;
  workerUrl: string;
};

const buildDraft = (cfg: any): S3Config => ({
  s3Endpoint: cfg?.s3Endpoint || '',
  s3AccessKey: cfg?.s3AccessKey || '',
  s3SecretKey: cfg?.s3SecretKey || '',
  s3Bucket: cfg?.s3Bucket || '',
  workerUrl: cfg?.workerUrl || '',
});

const draftS3Config = ref<S3Config>(buildDraft(null));

onMounted(() => {
  adapterSelect.value = settings.value.sync.adapter;
  draftS3Config.value = buildDraft(props.settings?.imageSync);
});
const isAdapterChanged = computed(() => adapterSelect.value !== settings.value.sync.adapter);
const handleSaveAdapter = () => {
  emit('saveAdapter', adapterSelect.value);
  userEditedAdapter.value = false;
}
const handleCancelAdapterChange = () => {
  adapterSelect.value = settings.value.sync.adapter;
  userEditedAdapter.value = false;
}

const handleChangeLanguage = () => {
  setLocale(settings.value.general.lang);
  handleSaveSettings();
}

const handleClickExportNotes = () => {
  emit('clickExportNotes', true);
}
const handleClickImportNotes = () => {
  emit('clickImportNotes', true);
}

const handleClickExportSettings = () => {
  emit('clickExportSettings');
}
const handleClickImportSettings = () => {
  emit('triggerImportSettings');
}

const handleClickAddFolder = () => {
  emit('clickAddFolder');
}

const handleClickResetServiceWorker = () => {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      registration.unregister();
    });
    window.location.reload();
  });
}
const handleClickForceUpdate = async () => {
  if ('caches' in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  }
  window.location.reload();
}

const imageSyncTestStatus = ref<'idle' | 'testing' | 'success' | 'failed'>('idle');
const isShowModalConfirmImageSyncChange = ref(false);

const isS3ConfigDirty = computed(() => {
  const saved = props.settings?.imageSync;
  const draft = draftS3Config.value;
  const fields: (keyof S3Config)[] = ['s3Endpoint', 's3Bucket', 's3AccessKey', 's3SecretKey', 'workerUrl'];
  return fields.some((f) => (saved?.[f] || '') !== (draft[f] || ''));
});

const hasCriticalS3Changed = (): boolean => {
  const saved = props.settings?.imageSync;
  const draft = draftS3Config.value;
  const critical: (keyof S3Config)[] = ['s3Endpoint', 's3Bucket', 's3AccessKey', 's3SecretKey'];
  return critical.some((f) => (saved?.[f] || '') !== (draft[f] || ''));
};

const isS3ConfigComplete = computed(() => {
  const d = draftS3Config.value;
  return Boolean(d.s3Endpoint && d.s3AccessKey && d.s3SecretKey && d.s3Bucket);
});

const applyDraftToSettings = () => {
  settings.value = {
    ...settings.value,
    imageSync: {
      ...settings.value.imageSync,
      ...draftS3Config.value,
    },
  };
};

const handleTestImageSyncConnection = async () => {
  imageSyncTestStatus.value = 'testing';

  try {
    const adapter = new S3ProxyAdapter({
      workerUrl: draftS3Config.value.workerUrl || '',
      s3Endpoint: draftS3Config.value.s3Endpoint || '',
      s3AccessKey: draftS3Config.value.s3AccessKey || '',
      s3SecretKey: draftS3Config.value.s3SecretKey || '',
      s3Bucket: draftS3Config.value.s3Bucket || '',
    });

    const isConnected = await adapter.checkConnection();
    imageSyncTestStatus.value = isConnected ? 'success' : 'failed';
  } catch {
    imageSyncTestStatus.value = 'failed';
  }

  setTimeout(() => {
    imageSyncTestStatus.value = 'idle';
  }, 3000);
}

const handleSaveImageSyncSettings = () => {
  if (hasCriticalS3Changed()) {
    isShowModalConfirmImageSyncChange.value = true;
    setTimeout(() => {
      (document.getElementById('modal-confirm-image-sync-change') as any)?.showModal();
    }, 100);
    return;
  }
  applyDraftToSettings();
  handleSaveSettings();
};

const handleConfirmImageSyncChange = async () => {
  (document.getElementById('modal-confirm-image-sync-change') as any)?.close();
  isShowModalConfirmImageSyncChange.value = false;
  applyDraftToSettings();
  handleSaveSettings();
  await resetSyncedImages();
};

const handleCancelImageSyncChange = () => {
  (document.getElementById('modal-confirm-image-sync-change') as any)?.close();
  isShowModalConfirmImageSyncChange.value = false;
  draftS3Config.value = buildDraft(props.settings?.imageSync);
};

const isShowModalSyncConfig = ref(false);
const handleOpenSyncConfigModal = () => {
  isShowModalSyncConfig.value = true;
  setTimeout(() => (document.getElementById('modal-sync-config') as any)?.showModal(), 100);
};
const handleConfirmSyncConfig = (value: string) => {
  settings.value.sync.configuration = value;
  (document.getElementById('modal-sync-config') as any)?.close();
  isShowModalSyncConfig.value = false;
  handleSaveSettings();
};
const handleCloseSyncConfigModal = () => {
  (document.getElementById('modal-sync-config') as any)?.close();
  isShowModalSyncConfig.value = false;
};

const isShowModalImageSyncConfig = ref(false);
const handleOpenImageSyncConfigModal = () => {
  isShowModalImageSyncConfig.value = true;
  setTimeout(() => (document.getElementById('modal-image-sync-config') as any)?.showModal(), 100);
};
const handleCloseImageSyncConfigModal = () => {
  (document.getElementById('modal-image-sync-config') as any)?.close();
  isShowModalImageSyncConfig.value = false;
};
const handleSaveImageSyncConfigModal = () => {
  isShowModalImageSyncConfig.value = false;
  handleSaveImageSyncSettings();
};

const settings = ref<any>(props.settings);
watch(() => props.settings, (newValue) => {
  settings.value = newValue;
  if (!userEditedAdapter.value) {
    adapterSelect.value = settings.value.sync.adapter;
  }
  draftS3Config.value = buildDraft(newValue?.imageSync);
}, { deep: true });

const closeDrawer = () => {
  isDrawerOpen.value = false;
  isDrawerSettingOpen.value = false;
}
const openSettingDrawer = () => {
  isDrawerSettingOpen.value = true;
}
const openHambugerDrawer = () => {
  isDrawerOpen.value = true;
}
const resetSearchInput = () => {
  searchInput.value = '';
  isShowSearchInput.value = false;
}
const searchLoadingDone = () => {
  isShowSearchLoading.value = false;
}

defineExpose({
  closeDrawer,
  openSettingDrawer,
  openHambugerDrawer,
  resetSearchInput,
  searchLoadingDone,
});
</script>

<template>
  <div class="ui-drawer z-30">
    <input v-model="isDrawerOpen" id="my-drawer-3" type="checkbox" class="ui-drawer-toggle"
      :aria-label="$t('app.open_menu')" />

    <div v-if="!props.isInEditor" class="ui-drawer-content">
      <div class="mobile-safe-top mobile-safe-inline flex items-center gap-1 border-b border-border bg-card px-2">
        <button type="button" class="ui-btn ui-btn-ghost ui-btn-sm ui-btn-square"
          :aria-label="$t('app.open_menu')" @click="isDrawerOpen = true">
          <Menu class="h-4 w-4" />
        </button>

        <div v-if="!isShowSearchInput" class="min-w-0 flex-1 px-2">
          <h1 class="truncate text-[17px] font-semibold tracking-tight">{{ activeFolderName }}</h1>
        </div>

        <div v-else class="flex min-w-0 flex-1 items-center gap-2 px-2">
          <label class="ui-input ui-input-sm flex min-w-0 flex-1 items-center gap-2 border-transparent bg-muted">
            <Search class="h-4 w-4 shrink-0 text-muted-foreground" />
            <input ref="searchInputRef" v-model="searchInput" type="text" autocomplete="off"
              :aria-label="$t('app.toolbar_note_search_tooltip')"
              :placeholder="$t('app.toolbar_note_search_placeholder')" />
            <UiSpinner v-if="isShowSearchLoading" size="xs" class="shrink-0" :label="$t('app.loading')" />
          </label>
          <button type="button" class="ui-btn ui-btn-ghost ui-btn-sm" @click="handleToggleSearch">
            {{ $t('app.toolbar_note_search_cancel') }}
          </button>
        </div>

        <template v-if="!isShowSearchInput">
          <button v-if="showSort" type="button" class="ui-btn ui-btn-ghost ui-btn-sm ui-btn-square"
            :aria-label="`${$t('app.toolbar_note_sort_by_title')}: ${sortLabel}`"
            :title="`${$t('app.toolbar_note_sort_by_title')}: ${sortLabel}`" aria-haspopup="dialog"
            @click="handleOpenSort">
            <Sort class="h-4 w-4" />
          </button>

          <button type="button" class="ui-btn ui-btn-ghost ui-btn-sm ui-btn-square"
            :aria-label="$t('app.toolbar_note_search_tooltip')" :title="$t('app.toolbar_note_search_tooltip')" @click="handleOpenSearch">
            <Search class="h-4 w-4" />
          </button>

          <span class="relative inline-flex">
            <button type="button" class="ui-btn ui-btn-ghost ui-btn-sm ui-btn-square"
              :aria-label="$t('app.setting_title')" :title="$t('app.setting_title')" data-ga-event="settings_open" @click="handleClickSetting">
              <Setting class="h-4 w-4" />
            </button>
            <span v-if="hasNewVersion"
              class="pointer-events-none absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-danger"></span>
          </span>
        </template>
      </div>
    </div>

    <div v-if="props.isInEditor" class="mobile-safe-top mobile-safe-inline flex items-center gap-1 border-b border-border bg-card px-2">
      <button type="button" class="ui-btn ui-btn-ghost ui-btn-sm ui-btn-circle border border-border bg-card"
        :aria-label="$t('app.action_back')" :title="$t('app.action_back')" @click="handleClickBack">
        <ArrowLeft class="h-4 w-4" />
      </button>

      <div class="min-w-0 flex-1 px-2">
        <h1 class="truncate text-[15px] font-medium">{{ editorTitle }}</h1>
      </div>

      <template v-if="!props.formNotes.isLocked">
        <button v-if="['Tiptap', 'Crepe'].includes(props.editorName)" type="button"
          class="ui-btn ui-btn-ghost ui-btn-sm ui-btn-square" :aria-label="$t('app.note_format')"
          :title="$t('app.note_format')" @click="handleClickFormatToolbar">
          <ToolCase class="h-4 w-4" />
        </button>

        <button type="button" class="ui-btn ui-btn-ghost ui-btn-sm ui-btn-square"
          :aria-label="$t('app.toolbar_note_find_in_note')" :title="$t('app.toolbar_note_find_in_note')"
          @click="handleClickSearchInNote">
          <Search class="h-4 w-4" />
        </button>

        <button type="button" class="ui-btn ui-btn-ghost ui-btn-sm ui-btn-square"
          :aria-label="$t('app.note_more')" :title="$t('app.note_more')" @click="handleOpenMenuEditorModal">
          <MenuVertical class="h-4 w-4" />
        </button>
      </template>
    </div>

    <div class="ui-drawer-side z-1000" :inert="!isDrawerOpen || undefined">
      <label for="my-drawer-3" :aria-label="$t('app.action_close')" class="ui-drawer-overlay"></label>

      <AppSidebar :listFolders="props.listFolders" :listTags="props.listTags"
        :activeFolderId="props.isSearchMode ? '__search__' : props.activeFolderId"
        :activeTagId="props.isSearchMode ? '' : props.activeTagId"
        :actionObjectKeys="props.actionObjectKeys" :isSyncing="props.isSyncing"
        :folderCounts="props.folderCounts" :tagCounts="props.tagCounts" :trashCount="props.trashCount"
        @clickFolderName="handleClickFolderName" @clickTags="handleClickTagsTab"
        @rightClickFolderName="handleRightClickFolderName" @renameFolderName="handleRenameFolderName"
        @reorderFolderName="handleReorderFolderName" @clickTagName="handleClickTagName"
        @rightClickTagName="handleRightClickTagName" @clickAddFolder="handleClickAddFolder"
        @clickAddTag="handleClickAddTag" @clickTrash="handleClickTrash"
        @clickSettings="handleClickSetting" @clickSync="handleClickUpdateData"
        @openSearch="handleOpenSearch"
        @close="isDrawerOpen = false" />
    </div>
  </div>

  <div class="ui-drawer ui-drawer-end z-40">
    <input v-model="isDrawerSettingOpen" id="my-drawer-4" type="checkbox" class="ui-drawer-toggle"
      :aria-label="$t('app.setting_title')" />

    <div class="ui-drawer-side z-1000" :inert="!isDrawerSettingOpen || undefined">
      <label for="my-drawer-4" :aria-label="$t('app.action_close')" class="ui-drawer-overlay"></label>

      <div class="settings-drawer-shell ui-menu flex w-full flex-col bg-card p-0">
        <div class="mobile-safe-top flex shrink-0 items-center gap-2 border-b border-border bg-card px-3">
          <button type="button" class="ui-btn ui-btn-sm ui-btn-ghost ui-btn-circle border border-border bg-card"
            :aria-label="$t('app.action_back')" :title="$t('app.action_back')"
            @click="isDrawerSettingOpen = false">
            <ArrowLeft class="h-4 w-4" />
          </button>
          <h2 class="min-w-0 flex-1 truncate text-[16px] font-semibold">{{ $t('app.setting_title') }}</h2>
        </div>
        <div class="settings-drawer w-full flex-1 overflow-y-auto overscroll-y-contain">
          <div class="p-4">
            <h2 class="text-lg font-semibold mb-2">{{ $t('app.setting_general_title') }}</h2>
            <div class="">
              <SettingRow :label="$t('app.setting_general_language_title')">
                <SettingSelect v-model="settings.general.lang" gaEvent="settings_language_change"
                  @update:modelValue="handleChangeLanguage" :options="[
                    { label: $t('app.setting_general_language_vi'), value: 'vi' },
                    { label: $t('app.setting_general_language_en'), value: 'en' },
                    { label: $t('app.setting_general_language_ru'), value: 'ru' },
                    { label: $t('app.setting_general_language_zhtw'), value: 'zhtw' },
                  ]" />
              </SettingRow>

              <SettingRow :label="$t('app.setting_general_theme_title')">
                <SettingSelect v-model="$colorMode.preference" gaEvent="settings_theme_change" :options="[
                  { label: $t('app.setting_general_theme_system'), value: 'system' },
                  { label: $t('app.setting_general_theme_light'), value: 'light' },
                  { label: $t('app.setting_general_theme_dark'), value: 'dark' },
                ]" />
              </SettingRow>

              <SettingRow :label="$t('app.setting_general_default_editor_title')">
                <SettingSelect v-model="settings.general.defaultEditor" gaEvent="settings_editor_change"
                  @update:modelValue="handleChangeDefaultEditor" :options="[
                    { label: $t('app.setting_general_default_editor_tiptap'), value: 'Tiptap' },
                    { label: $t('app.setting_general_default_editor_codemirror'), value: 'CodeMirror' },
                    { label: 'Crepe', value: 'Crepe' },
                  ]" />
              </SettingRow>

              <SettingRow :label="$t('app.setting_general_editor_view_title')">
                <SettingSelect v-model="settings.general.editorView" gaEvent="settings_editor_view_change"
                  @update:modelValue="handleChangeEditorView" :options="[
                    { label: $t('app.setting_general_editor_view_full'), value: 'full' },
                    { label: $t('app.setting_general_editor_view_compact'), value: 'compact' },
                  ]" />
              </SettingRow>

              <SettingRow :label="$t('app.setting_general_editor_typography_title')">
                <button type="button"
                  class="flex min-h-8 max-w-44 items-center gap-2 rounded-md border border-border bg-card px-2.5 text-[12px] font-medium"
                  @click="handleOpenEditorFontDialog">
                  <span class="min-w-0 truncate">{{ editorFontDisplayName }}</span>
                  <Pencil class="h-3.5 w-3.5 shrink-0 opacity-55" />
                </button>
              </SettingRow>

              <SettingRow :label="$t('app.setting_general_font_title')">
                <button type="button"
                  class="flex min-h-8 max-w-44 items-center gap-2 rounded-md border border-border bg-card px-2.5 text-[12px] font-medium"
                  @click="handleOpenFontDialog">
                  <span class="min-w-0 truncate">{{ fontDisplayName }}</span>
                  <Pencil class="h-3.5 w-3.5 shrink-0 opacity-55" />
                </button>
              </SettingRow>
            </div>
          </div>

          <hr class="border-border">

          <div class="p-4">
            <h2 class="text-lg font-semibold mb-2">{{ $t('app.setting_security_title') }}</h2>
            <div class="">
              <SettingRow :label="$t('app.setting_general_security_title')">
                <button
                  class="ui-btn rounded-md ui-btn-sm font-normal shadow-none border border-border truncate max-w-full"
                  data-ga-event="settings_password_open" @click="handleClickSetPassword">
                  {{ props.isPasswordExist ? $t('app.setting_general_security_change_password') :
                    $t('app.setting_general_security_set_password') }}
                </button>
              </SettingRow>
            </div>
          </div>

          <hr class="border-border">

          <div class="p-4">
            <h2 class="text-lg font-semibold mb-2">{{ $t('app.setting_sync_title') }}</h2>

            <div class="space-y-6">
              <div class="">
                <div class="grid grid-cols-1 items-center gap-3 py-4 sm:grid-cols-[3fr_2fr]">
                  <div class="min-w-0">
                    <p class="font-medium">{{ $t('app.setting_sync_adapter_title') }}</p>
                    <p class="text-xs text-muted-foreground mt-1">
                      {{ $t('app.setting_sync_adapter_description') }}
                      <br /><a href="https://docs.opennotas.io/started/setup-sync" target="_blank"
                        rel="noopener noreferrer" class="underline text-xs hover:text-primary">{{
                          $t('app.setting_sync_adapter_setup_guide')
                        }}</a>
                    </p>
                  </div>
                  <div class="flex min-w-0 items-center justify-end gap-2">
                    <SettingSelect v-model="adapterSelect" full-width @update:modelValue="userEditedAdapter = true" :options="[
                      { label: 'LocalForage (Offline)', value: 'LocalForage' },
                      { label: 'Turso (Online)', value: 'Turso' },
                    ]" />
                  </div>
                </div>

                <SettingRow v-if="adapterSelect !== 'LocalForage'" :label="$t('app.setting_sync_sync_frequency_title')">
                  <SettingSelect v-model="settings.sync.frequency" gaEvent="settings_sync_frequency_change"
                    @update:modelValue="handleSaveSettings" :options="[
                      { label: `5 ${$t('app.setting_sync_sync_frequency_unit')}`, value: '5' },
                      { label: `10 ${$t('app.setting_sync_sync_frequency_unit')}`, value: '10' },
                      { label: `15 ${$t('app.setting_sync_sync_frequency_unit')}`, value: '15' },
                      { label: `30 ${$t('app.setting_sync_sync_frequency_unit')}`, value: '30' },
                      { label: `60 ${$t('app.setting_sync_sync_frequency_unit')}`, value: '60' },
                    ]" />
                </SettingRow>

                <SettingRow v-if="adapterSelect !== 'LocalForage'" :label="$t('app.setting_sync_config_title')">
                  <button type="button"
                    class="ui-btn ui-btn-sm rounded-md font-normal shadow-none border border-border"
                    data-ga-event="settings_sync_config_save" @click="handleOpenSyncConfigModal">
                    {{ $t('app.setting_configure_button') }}
                  </button>
                </SettingRow>
              </div>

              <div class="">
                <SettingRow :label="$t('app.setting_image_sync_enable')">
                  <UiSwitch v-model="settings.imageSync.enabled" data-ga-event="settings_image_sync_toggle"
                    @change="handleSaveSettings" />
                </SettingRow>

                <div v-if="settings.imageSync?.enabled" class="grid grid-cols-[3fr_2fr] items-center gap-3 py-4">
                  <div class="min-w-0">
                    <p class="font-medium">{{ $t('app.setting_image_sync_config_title') }}</p>
                    <p class="text-xs text-muted-foreground mt-1">
                      {{ $t('app.setting_image_sync_description') }}
                      <br /><a href="https://docs.opennotas.io/started/setup-sync/s3-storage" target="_blank"
                        rel="noopener noreferrer" class="underline text-xs hover:text-primary">{{
                          $t('app.setting_image_sync_setup_guide') }}</a>
                    </p>
                  </div>
                  <div class="min-w-0 flex justify-end">
                    <button type="button"
                      class="ui-btn ui-btn-sm rounded-md font-normal shadow-none border border-border truncate max-w-full"
                      data-ga-event="settings_image_sync_save" @click="handleOpenImageSyncConfigModal">
                      {{ $t('app.setting_configure_button') }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <hr class="border-border">

          <div class="p-4">
            <h2 class="text-lg font-semibold mb-2">{{ $t('app.setting_tools_title') }}</h2>

            <div class="space-y-6">
              <div class="">
                <SettingRow :label="$t('app.setting_tools_backup_export')">
                  <button type="button"
                    class="ui-btn ui-btn-sm rounded-md font-normal shadow-none border border-border truncate max-w-full"
                    data-ga-event="settings_export_notes" @click="handleClickExportNotes">
                    {{ $t('app.setting_tools_backup_export_button') }}
                  </button>
                </SettingRow>

                <SettingRow :label="$t('app.setting_tools_backup_import')">
                  <button type="button"
                    class="ui-btn ui-btn-sm rounded-md font-normal shadow-none border border-border truncate max-w-full"
                    data-ga-event="settings_import_notes" @click="handleClickImportNotes">
                    {{ $t('app.setting_tools_backup_import_button') }}
                  </button>
                </SettingRow>

                <SettingRow :label="$t('app.setting_tools_settings_export')"
                  :description="$t('app.setting_tools_settings_export_description')">
                  <button type="button"
                    class="ui-btn ui-btn-sm rounded-md font-normal shadow-none border border-border truncate max-w-full"
                    data-ga-event="settings_export_settings" @click="handleClickExportSettings">
                    {{ $t('app.setting_tools_settings_export_button') }}
                  </button>
                </SettingRow>

                <SettingRow :label="$t('app.setting_tools_settings_import')">
                  <button type="button"
                    class="ui-btn ui-btn-sm rounded-md font-normal shadow-none border border-border truncate max-w-full"
                    data-ga-event="settings_import_settings" @click="handleClickImportSettings">
                    {{ $t('app.setting_tools_settings_import_button') }}
                  </button>
                </SettingRow>
              </div>

              <div class="">
                <SettingRow label="Service Worker">
                  <button class="ui-btn ui-btn-sm ui-btn-outline truncate max-w-full"
                    @click="handleClickResetServiceWorker">
                    {{ $t('app.setting_tools_reset_service_worker_title') }}
                  </button>
                </SettingRow>

                <SettingRow :label="$t('app.setting_tools_force_update_title')"
                  :description="$t('app.setting_tools_force_update_description')">
                  <div class="relative inline-block max-w-full">
                    <span v-if="hasNewVersion"
                      class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-danger rounded-full ring-2 ring-card"></span>
                    <button class="ui-btn ui-btn-sm ui-btn-outline truncate max-w-full"
                      @click="handleClickForceUpdate">
                      {{ $t('app.setting_tools_force_update_button') }}
                    </button>
                  </div>
                </SettingRow>
              </div>
            </div>
          </div>

          <hr class="border-border">

          <div class="p-4">
            <h2 class="text-lg font-semibold mb-2">{{ $t('app.setting_about_title') }}</h2>
            <div class="flex flex-col items-center py-4">
              <img :src="'/logo-icon.png'" height="48" width="48" class="h-12 w-12" alt="OpenNotas Logo" />
              <a class="underline" href="https://opennotas.io">
                <h1 class="mt-2 text-[15px] font-semibold">{{ $t('app_name') }}</h1>
              </a>
              <p class="mt-1 max-w-72 text-center text-[12px] leading-5 text-muted-foreground">{{ $t('app.slogan') }}</p>
              <p class="mt-3 text-[11px] tabular-nums text-muted-foreground">
                {{ $t('app.version') }} {{ runtimeConfig.public.version }}
              </p>
            </div>
          </div>

          <div class="h-6"></div>

        </div>

        <div v-if="isAdapterChanged"
          class="shrink-0 border-t border-border px-4 py-3 flex items-center justify-end gap-2 bg-card">
          <button class="ui-btn ui-btn-sm" @click="handleCancelAdapterChange">
            {{ $t('app.setting_sync_adapter_cancel') }}
          </button>
          <button class="ui-btn ui-btn-sm ui-btn-primary" data-ga-event="settings_adapter_save" @click="handleSaveAdapter">
            {{ $t('app.setting_sync_adapter_save') }}
          </button>
        </div>
      </div>

    </div>
  </div>

  <UiDialog v-model:open="isShowFontDialog" :title="$t('app.setting_general_edit_font_title')"
    :description="$t('app.setting_general_edit_font_description')" width="26rem" @ok="handleSaveFontDialog">
    <label class="flex flex-col gap-1.5">
      <span class="text-[12px] font-medium">{{ $t('app.setting_general_font_title') }}</span>
      <input v-model="fontDialogValue" type="text" autofocus class="ui-input"
        :placeholder="$t('app.setting_general_font_placeholder')" autocomplete="off"
        @keydown.enter.prevent="handleSaveFontDialog" />
    </label>
  </UiDialog>

  <UiDialog v-model:open="isShowEditorFontDialog" :title="$t('app.setting_general_edit_editor_typography_title')"
    :description="$t('app.setting_general_edit_editor_typography_description')" width="28rem"
    @ok="handleSaveEditorFontDialog">
    <div class="flex flex-col gap-4">
      <label class="flex flex-col gap-1.5">
        <span class="text-[12px] font-medium">{{ $t('app.setting_general_editor_font_title') }}</span>
        <input v-model="editorFontDialogValue" type="text" autofocus class="ui-input"
          :placeholder="$t('app.setting_general_editor_font_placeholder')" autocomplete="off"
          @keydown.enter.prevent="handleSaveEditorFontDialog" />
      </label>

      <div class="grid grid-cols-2 gap-3">
        <label class="flex flex-col gap-1.5">
          <span class="text-[12px] font-medium">{{ $t('app.setting_general_editor_font_size_title') }}</span>
          <div class="relative">
            <input v-model.number="editorFontSizeDraft" type="number" min="12" max="32" step="1"
              class="ui-input pr-9" @keydown.enter.prevent="handleSaveEditorFontDialog" />
            <span class="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[11px] text-muted-foreground">px</span>
          </div>
        </label>

        <label class="flex flex-col gap-1.5">
          <span class="text-[12px] font-medium">{{ $t('app.setting_general_editor_line_height_title') }}</span>
          <input v-model.number="editorLineHeightDraft" type="number" min="1.2" max="2.4" step="0.05"
            class="ui-input" @keydown.enter.prevent="handleSaveEditorFontDialog" />
        </label>
      </div>

      <label class="flex flex-col gap-1.5">
        <span class="text-[12px] font-medium">{{ $t('app.setting_general_editor_block_spacing_title') }}</span>
        <div class="relative">
          <input v-model.number="editorBlockSpacingDraft" type="number" min="0" max="3" step="0.125"
            class="ui-input pr-10" @keydown.enter.prevent="handleSaveEditorFontDialog" />
          <span class="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[11px] text-muted-foreground">em</span>
        </div>
      </label>
    </div>
  </UiDialog>

  <ModalSortNote :sortType="props.sortType" @clickSort="handleClickSort" />

  <ModalConfirmImageSyncChange v-if="isShowModalConfirmImageSyncChange" @confirm="handleConfirmImageSyncChange"
    @close="handleCancelImageSyncChange" />

  <ModalSyncConfig v-if="isShowModalSyncConfig" :value="settings.sync.configuration" @confirm="handleConfirmSyncConfig"
    @close="handleCloseSyncConfigModal" />

  <ModalImageSyncConfig v-if="isShowModalImageSyncConfig" :s3Config="draftS3Config" :isDirty="isS3ConfigDirty"
    :isComplete="isS3ConfigComplete" :testStatus="imageSyncTestStatus" @save="handleSaveImageSyncConfigModal"
    @test="handleTestImageSyncConnection" @close="handleCloseImageSyncConfigModal" />
</template>

<style lang="scss">
.mobile-safe-top {
  height: calc(3.5rem + env(safe-area-inset-top, 0px));
  padding-top: env(safe-area-inset-top, 0px);
}

html:has(.ui-drawer-toggle:checked) {
  scrollbar-gutter: unset !important;
}

.settings-drawer-shell {
  /* 100vh fallback; bottom inset keeps the save bar above the iOS home indicator. */
  height: 100vh;
  height: 100dvh;
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.settings-drawer {
  background-color: rgb(var(--ui-background));
}

.settings-drawer h2 {
  padding: 0 4px 10px;
  color: rgb(var(--ui-muted-foreground)) !important;
  font-size: 11px !important;
  font-weight: 500 !important;
  line-height: 1.4 !important;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.settings-drawer .p-4 {
  padding: 18px 16px;
}

.settings-drawer .p-4 > div {
  overflow: hidden;
  border: 1px solid rgb(var(--ui-border));
  border-radius: var(--ui-radius);
  background-color: rgb(var(--ui-card));
}

.settings-drawer .p-4 .grid {
  padding-left: 14px;
  padding-right: 14px;
}

.settings-drawer .p-4 .grid + .grid {
  border-top: 1px solid rgb(var(--ui-border));
}

.settings-drawer .p-4 > div.space-y-6 {
  overflow: visible;
  border: 0;
  background-color: transparent;
}

.settings-drawer .p-4 > div.space-y-6 > div {
  overflow: hidden;
  border: 1px solid rgb(var(--ui-border));
  border-radius: var(--ui-radius);
  background-color: rgb(var(--ui-card));
}

.settings-drawer hr {
  margin: 0 16px;
  border-color: rgb(var(--ui-border));
}
</style>
