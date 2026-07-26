<script setup lang="ts">
import { defineProps, onMounted } from 'vue';

import S3ProxyAdapter from '~/adapter/s3';
import { resetSyncedImages } from '~/services/image';
import { hasNewVersion } from '~/utils/check-app-version';
import { toggleModalMenuEditor } from '~/utils/modal';
import { useMobileBackToggle } from '~/utils/mobile-back';
import SettingRow from '../../modal/setting/setting-row.vue';
import SettingSelect from '../../modal/setting/setting-select.vue';
import Menu from '../assets/svg/menu.svg?component';
import Setting from '../assets/svg/settings.svg?component';
import ArrowLeft from '../assets/svg/arrow-left.svg?component';
import Info from '../assets/svg/info.svg?component';
import Clipboard from '../assets/svg/clipboard.svg?component';
import Undo from '../assets/svg/corner-up-left.svg?component';
import Redo from '../assets/svg/corner-up-right.svg?component';
import Search from '../assets/svg/search.svg?component';
import X from '../assets/svg/x.svg?component';
import ToolCase from '../assets/svg/tool-case.svg?component';
import MenuVertical from '../assets/svg/menu-vertical.svg?component';
import Type from '../assets/svg/type.svg?component';

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
]);

const { $i18n } = useNuxtApp();
const { setLocale } = useI18n();
// const colorMode = useColorMode();

const isDrawerOpen = ref<boolean>(false);
useMobileBackToggle(isDrawerOpen);

const activeFolderName = computed(() => {
  if (props.activeFolderId === 'bottombar-trash') {
    return $i18n.t('app.navbar_top_trash_title');
  }

  const folder = props.listFolders.find((item: any) => item.id === props.activeFolderId);
  return folder ? folder.name : $i18n.t('app_name');
});

const isShowSearchInput = ref(false);
useMobileBackToggle(isShowSearchInput);
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

const isTagsTabActive = computed(() => props.activeFolderId === 'bottombar-tags');
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
const handleClickFoldersTab = () => {
  emit('clickFolderName', '');
};
const handleClickTagsTab = () => {
  emit('clickTags');
};

const handleClickSetting = () => {
  handleClickSettingBtn();
};

const handleClickBack = () => {
  emit('clickBack');
};

const handleClickUpdateData = () => {
  emit('clickUpdateData');
};

const isDrawerSettingOpen = ref<boolean>(false);
useMobileBackToggle(isDrawerSettingOpen);
const handleClickSettingBtn = () => {
  isDrawerSettingOpen.value = true;
};

const handleClickTrash = () => {
  emit('clickTrash');
  isDrawerOpen.value = false;
};

const handleClickMenuSidebar = () => {
  emit('clickMenuSidebar');
};

const handleClickUndo = () => {
  emit('clickUndo', props.formNotes.id);
}
const handleClickRedo = () => {
  emit('clickRedo', props.formNotes.id);
}
const handleClickCopyToClipboard = () => {
  emit('copyToClipboard', props.formNotes.id);
}
const handleClickInfo = () => {
  emit('clickInfo', props.formNotes.id);
}
const handleClickFormatToolbar = () => {
  emit('clickFormatToolbar', props.formNotes.id);
}
const handleClickPlainText = () => {
  emit('clickPlainText', props.formNotes.id);
}

const isModalMenuEditorOpen = ref<boolean>(false);
const handleOpenMenuEditorModal = () => {
  toggleModalMenuEditor(true, isModalMenuEditorOpen);
}

const handleSaveSettings = () => {
  emit('saveSettings', settings.value);
}
// default editor
const handleChangeDefaultEditor = () => {
  handleSaveSettings();
  emit('changeDefaultEditor', true);
}
const handleChangeEditorView = () => {
  handleSaveSettings();
}
// set password
const handleClickSetPassword = () => {
  // Show modal set password
  emit('clickSetPassword');
}
const adapterSelect = ref<string>('');
// Explicit intent flag: only true once the user actually touches the adapter
// dropdown. See components/modal/setting/index.vue for the full race-condition
// explanation this guards against (async settings load racing the drawer mount
// on mobile, which mounts eagerly at page load rather than on-demand).
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

// Draft S3 config: what the user is currently editing in the form.
// Only committed to settings.value when user clicks Save.
const draftS3Config = ref<S3Config>(buildDraft(null));

onMounted(() => {
  adapterSelect.value = settings.value.sync.adapter;
  draftS3Config.value = buildDraft(props.settings?.imageSync);
});
// change adapter
const isAdapterChanged = computed(() => adapterSelect.value !== settings.value.sync.adapter);
const handleSaveAdapter = (e: Event) => {
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

// export notes
const handleClickExportNotes = () => {
  emit('clickExportNotes', true);
}
// import notes
const handleClickImportNotes = () => {
  emit('clickImportNotes', true);
}

// export settings
const handleClickExportSettings = () => {
  emit('clickExportSettings');
}
// import settings
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

// Enable Save button when draft differs from last saved state
const isS3ConfigDirty = computed(() => {
  const saved = props.settings?.imageSync;
  const draft = draftS3Config.value;
  const fields: (keyof S3Config)[] = ['s3Endpoint', 's3Bucket', 's3AccessKey', 's3SecretKey', 'workerUrl'];
  return fields.some((f) => (saved?.[f] || '') !== (draft[f] || ''));
});

// True only when storage location fields changed (triggers confirmation + image reset)
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

// Apply draft into settings.value before saving
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

// Sync Configuration (JSON) modal
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

// Image Sync S3 config modal
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
  <div class="draw">
    <input v-model="isDrawerOpen" id="my-drawer-3" type="checkbox" class="drawer-toggle" />

    <!-- drawer home -->
    <div v-if="!props.isInEditor" class="drawer-content flex flex-col">
      <div class="navbar p-0">
        <div class="flex-none">
          <div class="px-4">
            <label for="my-drawer-3" aria-label="open sidebar">
              <Menu class="press cursor-pointer opacity-80" />
            </label>
          </div>
        </div>
        <div class="flex-1 flex justify-between pr-4">
          <div v-if="!isShowSearchInput" class="font-semibold text-xl ml-1">
            {{ activeFolderName }}
          </div>

          <div v-if="isShowSearchInput"
            class="p-2 flex items-center h-12 w-full animate-fade-down animate-duration-200">
            <div class="relative flex-1 mr-2">
              <input ref="searchInputRef" type="text" class="input input-sm input-bordered text-base-content w-full"
                placeholder="" autocomplete="off" name="hidden" v-model="searchInput" />
              <span v-if="isShowSearchLoading"
                class="loading loading-spinner loading-sm absolute right-1.5 top-1.5"></span>
            </div>

            <button class="flex-none btn bg-primary text-primary-content btn-sm" @click="handleToggleSearch">
              <!-- {{ $t('app.toolbar_note_search_cancel') }} -->
              <X />
            </button>
          </div>

          <div v-if="!isShowSearchInput" class="flex">
            <Search class="press mr-4 cursor-pointer opacity-80" @click="handleToggleSearch" />
            <span class="relative inline-block">
              <Setting class="press cursor-pointer opacity-80" @click="handleClickSetting" />
              <span v-if="hasNewVersion"
                class="absolute top-0 right-0 w-2 h-2 bg-error rounded-full ring-2 ring-base-100"></span>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- drawer in editor -->
    <div v-if="props.isInEditor" class="navbar p-0">
      <div class="flex-none">
        <div class="px-4" @click="handleClickBack">
          <ArrowLeft class="press cursor-pointer opacity-80" />
        </div>
      </div>
      <div class="flex-1 flex justify-between">
        <div class="font-semibold text-xl ml-1">{{ $t('app.navbar_top_note_title') }}</div>

        <div class="flex" v-if="!props.formNotes.isLocked">
          <!-- <Clipboard class="press mr-4 cursor-pointer opacity-80" @click="handleClickCopyToClipboard" />
          <Info class="press mr-4 cursor-pointer opacity-80" @click="handleClickInfo" /> -->
          <ToolCase v-if="['Tiptap', 'Crepe'].includes(props.editorName)" class="press mr-4 cursor-pointer opacity-80"
            @click="handleClickFormatToolbar" />
          <Type class="press mr-4 cursor-pointer opacity-80" @click="handleClickPlainText" />
          <Undo class="press mr-4 cursor-pointer opacity-80" @click="handleClickUndo" />
          <Redo class="press mr-4 cursor-pointer opacity-80" @click="handleClickRedo" />
          <div class="lg:hidden mr-2" @click="handleOpenMenuEditorModal">
            <MenuVertical class="press cursor-pointer" />
          </div>

          <div class="hidden lg:block dropdown dropdown-bottom dropdown-end mr-2">
            <div tabindex="0" role="button">
              <MenuVertical class="press cursor-pointer" />
            </div>

            <ul tabindex="0"
              class="dropdown-content menu menu-sm bg-base-200 z-[1] w-48 p-2 shadow rounded-xl border border-neutral">
              <li class="" @click="handleClickCopyToClipboard">
                <a>
                  {{ $t('app.menu_note_copy') }}
                </a>
              </li>
              <li class="" @click="handleClickInfo">
                <a>
                  {{ $t('app.toolbar_form_note_info') }}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- draw hambuger menu -->
    <div class="drawer-side z-1000">
      <label for="my-drawer-3" aria-label="close sidebar" class="drawer-overlay"></label>

      <div class="menu p-0 w-2/3 min-h-full bg-base-100">
        <div class="flex flex-col justify-between items-center w-full" style="height: calc(100vh);">
          <div class="w-full">
            <div class="lg:hidden mt-4 h-32 w-32 m-auto">
              <img :src="'/logo-icon.png'" width="128" height="128" class="mb-4" alt="OpenNotas Logo" />
            </div>

            <div class="tabs tabs-bordered w-full">
              <a class="tab flex-1" :class="{ 'tab-active': !isTagsTabActive }" @click="handleClickFoldersTab">
                {{ $t('app.tab_folders') }}
              </a>
              <a class="tab flex-1" :class="{ 'tab-active': isTagsTabActive }" @click="handleClickTagsTab">
                {{ $t('app.tab_tags') }}
              </a>
            </div>

            <div>
              <ListFolder v-if="!isTagsTabActive" ref="listFolderRef" :listFolders="props.listFolders"
                :activeFolderId="props.activeFolderId" @clickFolderName="handleClickFolderName"
                @rightClickFolderName="handleRightClickFolderName" @renameFolderName="handleRenameFolderName"
                @reorderFolderName="handleReorderFolderName" />
              <ListTag v-else :listTags="props.listTags" :activeTagId="props.activeTagId" :isCollapseFolder="false"
                @clickTagName="handleClickTagName" @rightClickTagName="handleRightClickTagName"
                @clickAddTag="handleClickAddTag" />

              <!-- <div class="px-2 pt-2">
                <button class="btn btn-sm btn-block rounded" @click="handleClickAddFolder">
                  <PlusCircle class="press" />
                </button>
              </div> -->
            </div>
          </div>

          <div class="w-full">
            <BottombarFolder :activeFolderId="props.activeFolderId" :isSyncing="isSyncing"
              @clickUpdateData="handleClickUpdateData" @clickTrash="handleClickTrash"
              @clickMenuSidebar="handleClickMenuSidebar" />
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- drawer setting -->
  <div class="draw drawer-end">
    <input v-model="isDrawerSettingOpen" id="my-drawer-4" type="checkbox" class="drawer-toggle" />

    <div class="drawer-side z-1000">
      <label for="my-drawer-4" aria-label="close sidebar" class="drawer-overlay"></label>


      <div class="menu p-0 w-10/12 h-screen bg-base-100 flex flex-col">
        <div class="w-full flex-1 overflow-y-auto overscroll-y-contain">
          <!-- general setting -->
          <div class="p-4">
            <h2 class="text-lg font-semibold mb-2">{{ $t('app.setting_general_title') }}</h2>
            <div class="">
              <SettingRow :label="$t('app.setting_general_language_title')">
                <SettingSelect v-model="settings.general.lang" @update:modelValue="handleChangeLanguage" :options="[
                  { label: $t('app.setting_general_language_vi'), value: 'vi' },
                  { label: $t('app.setting_general_language_en'), value: 'en' },
                  { label: $t('app.setting_general_language_ru'), value: 'ru' },
                  { label: $t('app.setting_general_language_zhtw'), value: 'zhtw' },
                ]" />
              </SettingRow>

              <SettingRow :label="$t('app.setting_general_theme_title')">
                <SettingSelect v-model="$colorMode.preference" :options="[
                  { label: $t('app.setting_general_theme_system'), value: 'system' },
                  { label: $t('app.setting_general_theme_light'), value: 'light' },
                  { label: $t('app.setting_general_theme_dark'), value: 'dark' },
                ]" />
              </SettingRow>

              <SettingRow :label="$t('app.setting_general_default_editor_title')">
                <SettingSelect v-model="settings.general.defaultEditor" @update:modelValue="handleChangeDefaultEditor"
                  :options="[
                    { label: $t('app.setting_general_default_editor_tiptap'), value: 'Tiptap' },
                    { label: $t('app.setting_general_default_editor_codemirror'), value: 'CodeMirror' },
                    { label: 'Crepe', value: 'Crepe' },
                  ]" />
              </SettingRow>

              <SettingRow :label="$t('app.setting_general_editor_view_title')">
                <SettingSelect v-model="settings.general.editorView" @update:modelValue="handleChangeEditorView"
                  :options="[
                    { label: $t('app.setting_general_editor_view_full'), value: 'full' },
                    { label: $t('app.setting_general_editor_view_compact'), value: 'compact' },
                  ]" />
              </SettingRow>

              <SettingRow :label="$t('app.setting_general_font_title')">
                <input v-model="settings.general.fontFamily" type="text"
                  class="input input-sm input-bordered w-full min-w-0" @change="handleSaveSettings"
                  autocomplete="off" />
              </SettingRow>
            </div>
          </div>

          <hr class="border-base-content/20">

          <!-- security setting -->
          <div class="p-4">
            <h2 class="text-lg font-semibold mb-2">{{ $t('app.setting_security_title') }}</h2>
            <div class="">
              <SettingRow :label="$t('app.setting_general_security_title')">
                <button
                  class="btn rounded-md btn-sm font-normal shadow-none border border-base-content/20 truncate max-w-full"
                  @click="handleClickSetPassword">
                  {{ props.isPasswordExist ? $t('app.setting_general_security_change_password') :
                    $t('app.setting_general_security_set_password') }}
                </button>
              </SettingRow>
            </div>
          </div>

          <hr class="border-base-content/20">

          <!-- sync setting -->
          <div class="p-4">
            <h2 class="text-lg font-semibold mb-2">{{ $t('app.setting_sync_title') }}</h2>

            <div class="space-y-6">
              <!-- Note Sync -->
              <div class="">
                <div class="grid grid-cols-[3fr_2fr] items-center gap-3 py-4">
                  <div class="min-w-0">
                    <p class="font-medium">{{ $t('app.setting_sync_adapter_title') }}</p>
                    <p class="text-xs text-base-content/60 mt-1">
                      {{ $t('app.setting_sync_adapter_description') }}
                      <br /><a href="https://docs.opennotas.io/started/setup-sync" target="_blank"
                        rel="noopener noreferrer" class="underline text-xs hover:text-primary">{{
                          $t('app.setting_sync_adapter_setup_guide')
                        }}</a>
                    </p>
                  </div>
                  <div class="min-w-0 flex justify-end items-center gap-2">
                    <SettingSelect v-model="adapterSelect" @update:modelValue="userEditedAdapter = true" :options="[
                      { label: 'LocalForage (Offline)', value: 'LocalForage' },
                      { label: 'Turso (Online)', value: 'Turso' },
                    ]" />
                  </div>
                </div>

                <SettingRow v-if="adapterSelect !== 'LocalForage'" :label="$t('app.setting_sync_sync_frequency_title')">
                  <SettingSelect v-model="settings.sync.frequency" @update:modelValue="handleSaveSettings" :options="[
                    { label: `5 ${$t('app.setting_sync_sync_frequency_unit')}`, value: '5' },
                    { label: `10 ${$t('app.setting_sync_sync_frequency_unit')}`, value: '10' },
                    { label: `15 ${$t('app.setting_sync_sync_frequency_unit')}`, value: '15' },
                    { label: `30 ${$t('app.setting_sync_sync_frequency_unit')}`, value: '30' },
                    { label: `60 ${$t('app.setting_sync_sync_frequency_unit')}`, value: '60' },
                  ]" />
                </SettingRow>

                <SettingRow v-if="adapterSelect !== 'LocalForage'" :label="$t('app.setting_sync_config_title')">
                  <button type="button"
                    class="btn btn-sm rounded-md font-normal shadow-none border border-base-content/20"
                    @click="handleOpenSyncConfigModal">
                    {{ $t('app.setting_configure_button') }}
                  </button>
                </SettingRow>
              </div>

              <!-- Image Sync -->
              <div class="">
                <SettingRow :label="$t('app.setting_image_sync_enable')">
                  <input type="checkbox" v-model="settings.imageSync.enabled" class="toggle"
                    @change="handleSaveSettings" />
                </SettingRow>

                <div v-if="settings.imageSync?.enabled" class="grid grid-cols-[3fr_2fr] items-center gap-3 py-4">
                  <div class="min-w-0">
                    <p class="font-medium">{{ $t('app.setting_image_sync_config_title') }}</p>
                    <p class="text-xs text-base-content/60 mt-1">
                      {{ $t('app.setting_image_sync_description') }}
                      <br /><a href="https://docs.opennotas.io/started/setup-sync/s3-storage" target="_blank"
                        rel="noopener noreferrer" class="underline text-xs hover:text-primary">{{
                          $t('app.setting_image_sync_setup_guide') }}</a>
                    </p>
                  </div>
                  <div class="min-w-0 flex justify-end">
                    <button type="button"
                      class="btn btn-sm rounded-md font-normal shadow-none border border-base-content/20 truncate max-w-full"
                      @click="handleOpenImageSyncConfigModal">
                      {{ $t('app.setting_configure_button') }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <hr class="border-base-content/20">

          <!-- tools setting -->
          <div class="p-4">
            <h2 class="text-lg font-semibold mb-2">{{ $t('app.setting_tools_title') }}</h2>

            <div class="space-y-6">
              <div class="">
                <SettingRow :label="$t('app.setting_tools_backup_export')">
                  <button type="button"
                    class="btn btn-sm rounded-md font-normal shadow-none border border-base-content/20 truncate max-w-full"
                    @click="handleClickExportNotes">
                    {{ $t('app.setting_tools_backup_export_button') }}
                  </button>
                </SettingRow>

                <SettingRow :label="$t('app.setting_tools_backup_import')">
                  <button type="button"
                    class="btn btn-sm rounded-md font-normal shadow-none border border-base-content/20 truncate max-w-full"
                    @click="handleClickImportNotes">
                    {{ $t('app.setting_tools_backup_import_button') }}
                  </button>
                </SettingRow>

                <SettingRow :label="$t('app.setting_tools_settings_export')"
                  :description="$t('app.setting_tools_settings_export_description')">
                  <button type="button"
                    class="btn btn-sm rounded-md font-normal shadow-none border border-base-content/20 truncate max-w-full"
                    @click="handleClickExportSettings">
                    {{ $t('app.setting_tools_settings_export_button') }}
                  </button>
                </SettingRow>

                <SettingRow :label="$t('app.setting_tools_settings_import')">
                  <button type="button"
                    class="btn btn-sm rounded-md font-normal shadow-none border border-base-content/20 truncate max-w-full"
                    @click="handleClickImportSettings">
                    {{ $t('app.setting_tools_settings_import_button') }}
                  </button>
                </SettingRow>
              </div>

              <div class="">
                <SettingRow label="Service Worker">
                  <button class="btn btn-sm btn-outline btn-error truncate max-w-full"
                    @click="handleClickResetServiceWorker">
                    {{ $t('app.setting_tools_reset_service_worker_title') }}
                  </button>
                </SettingRow>

                <SettingRow :label="$t('app.setting_tools_force_update_title')"
                  :description="$t('app.setting_tools_force_update_description')">
                  <div class="relative inline-block max-w-full">
                    <span v-if="hasNewVersion"
                      class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-error rounded-full ring-2 ring-base-100"></span>
                    <button class="btn btn-sm btn-outline btn-error truncate max-w-full"
                      @click="handleClickForceUpdate">
                      {{ $t('app.setting_tools_force_update_button') }}
                    </button>
                  </div>
                </SettingRow>
              </div>
            </div>
          </div>

          <hr class="border-base-content/20">

          <!-- about -->
          <div class="p-4">
            <h2 class="text-lg font-semibold mb-2">{{ $t('app.setting_about_title') }}</h2>
            <div class="flex flex-col items-center py-4">
              <img :src="'/logo-icon.png'" height="96" width="96" alt="OpenNotas Logo" />
              <a class="underline" href="https://opennotas.io">
                <h1 class="font-bold text-2xl mt-2">{{ $t('app_name') }}</h1>
              </a>
              <p class="mt-2 text-center text-sm">{{ $t('app.slogan') }}</p>
            </div>
          </div>

          <div class="h-6"></div>

        </div>

        <div v-if="isAdapterChanged"
          class="shrink-0 border-t border-base-content/15 px-4 py-3 flex items-center justify-end gap-2 bg-base-100">
          <button class="btn btn-sm" @click="handleCancelAdapterChange">
            {{ $t('app.setting_sync_adapter_cancel') }}
          </button>
          <button class="btn btn-sm btn-primary" @click="handleSaveAdapter">
            {{ $t('app.setting_sync_adapter_save') }}
          </button>
        </div>
      </div>

    </div>
  </div>

  <ModalMenuEditor @copyToClipboard="handleClickCopyToClipboard" @clickInfo="handleClickInfo" />

  <ModalConfirmImageSyncChange v-if="isShowModalConfirmImageSyncChange" @confirm="handleConfirmImageSyncChange"
    @close="handleCancelImageSyncChange" />

  <ModalSyncConfig v-if="isShowModalSyncConfig" :value="settings.sync.configuration" @confirm="handleConfirmSyncConfig"
    @close="handleCloseSyncConfigModal" />

  <ModalImageSyncConfig v-if="isShowModalImageSyncConfig" :s3Config="draftS3Config" :isDirty="isS3ConfigDirty"
    :isComplete="isS3ConfigComplete" :testStatus="imageSyncTestStatus" @save="handleSaveImageSyncConfigModal"
    @test="handleTestImageSyncConnection" @close="handleCloseImageSyncConfigModal" />
</template>

<style lang="scss">
html:has(.drawer-toggle:checked) {
  scrollbar-gutter: unset !important;
}

.draw {
  position: fixed;
  width: 100%;
  z-index: 9;
}
</style>
