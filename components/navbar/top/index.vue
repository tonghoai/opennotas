<script setup lang="ts">
// import { OverlayScrollbarsComponent } from "overlayscrollbars-vue";
import { defineProps, onMounted } from 'vue';

import Menu from '../assets/svg/menu.svg?component';
import Setting from '../assets/svg/settings.svg?component';
import ArrowLeft from '../assets/svg/arrow-left.svg?component';
import Info from '../assets/svg/info.svg?component';
import Clipboard from '../assets/svg/clipboard.svg?component';
import ChevronRight from '../assets/svg/chevron-right.svg?component';
// import PlusCircle from '../assets/svg/plus-circle.svg?component';
import Undo from '../assets/svg/undo.svg?component';
import Redo from '../assets/svg/redo.svg?component';
import Search from '../assets/svg/search.svg?component';

const props = defineProps([
  'listFolders',
  'activeFolderId',
  'formNotes',
  'isInEditor',
  'isSyncing',
  'settings',
  'isPasswordExist',
]);

const emit = defineEmits([
  'saveSettings',
  'clickFolderName',
  'rightClickFolderName',
  'renameFolderName',
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
]);

const { $i18n } = useNuxtApp();
const { setLocale } = useI18n();
// const colorMode = useColorMode();

// const scrollbarOptions: any = computed(() => {
//   return {
//     scrollbars: {
//       theme: colorMode.value === 'dark' ? 'os-theme-light' : 'os-theme-dark',
//       autoHide: 'scroll',
//       visibility: 'auto',
//     }
//   }
// });

const isDrawerOpen = ref<boolean>(false);

const activeFolderName = computed(() => {
  if (props.activeFolderId === 'bottombar-trash') {
    return $i18n.t('app.navbar_top_trash_title');
  }

  const folder = props.listFolders.find((item: any) => item.id === props.activeFolderId);
  return folder ? folder.name : $i18n.t('app_name');
});

const isShowSearchInput = ref(false);
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
let searchInputDebounce: any = null;
watch(searchInput, (value) => {
  clearTimeout(searchInputDebounce);

  searchInputDebounce = setTimeout(() => {
    emit('clickSearch', value);
  }, 300);
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

const handleSaveSettings = () => {
  emit('saveSettings', settings.value);
}
// default editor
const handleChangeDefaultEditor = () => {
  handleSaveSettings();
  emit('changeDefaultEditor', true);
}
// set password
const handleClickSetPassword = () => {
  // Show modal set password
  emit('clickSetPassword');
}
const adapterSelect = ref<string>('');
onMounted(() => {
  adapterSelect.value = settings.value.sync.adapter;
});
// change adapter
const isAdapterChanged = computed(() => adapterSelect.value !== settings.value.sync.adapter);
const handleSaveAdapter = (e: Event) => {
  emit('saveAdapter', adapterSelect.value);
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

const settings = ref<any>(props.settings);
watch(() => props.settings, (newValue) => {
  settings.value = newValue;
});

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

defineExpose({
  closeDrawer,
  openSettingDrawer,
  openHambugerDrawer,
  resetSearchInput,
});
</script>

<template>
  <div class="draw">
    <input v-model="isDrawerOpen" id="my-drawer-3" type="checkbox" class="drawer-toggle" />

    <!-- drawer home -->
    <div v-if="!props.isInEditor" class="drawer-content flex flex-col">
      <div class="navbar bg-base-100 p-0 bg-primary text-primary-content">
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
            <input ref="searchInputRef" type="text" class="input input-sm input-bordered text-base-content w-9/12 mr-2"
              placeholder="" autocomplete="off" name="hidden" v-model="searchInput" />

            <button class="btn bg-base-100 text-base-content btn-sm w-3/12" @click="handleToggleSearch">
              {{ $t('app.toolbar_note_search_cancel') }}
            </button>
          </div>

          <div v-if="!isShowSearchInput" class="flex">
            <Search class="press mr-4 cursor-pointer opacity-80" @click="handleToggleSearch" />
            <Setting class="press cursor-pointer opacity-80" @click="handleClickSetting" />
          </div>
        </div>
      </div>
    </div>

    <!-- drawer in editor -->
    <div v-if="props.isInEditor" class="navbar bg-base-100 p-0 bg-primary text-primary-content">
      <div class="flex-none">
        <div class="px-4" @click="handleClickBack">
          <ArrowLeft class="press cursor-pointer opacity-80" />
        </div>
      </div>
      <div class="flex-1 flex justify-between">
        <div class="font-semibold text-xl ml-1">{{ $t('app.navbar_top_note_title') }}</div>

        <div class="flex">
          <Undo class="press mr-4 cursor-pointer opacity-80" @click="handleClickUndo" />
          <Redo class="press mr-4 cursor-pointer opacity-80" @click="handleClickRedo" />
          <Clipboard class="press mr-4 cursor-pointer opacity-80" @click="handleClickCopyToClipboard" />
          <Info class="press mr-4 cursor-pointer opacity-80" @click="handleClickInfo" />
        </div>
      </div>
    </div>

    <!-- draw hambuger menu -->
    <div class="drawer-side z-1000">
      <label for="my-drawer-3" aria-label="close sidebar" class="drawer-overlay"></label>

      <div class="menu p-0 w-2/3 min-h-full bg-base-100">
        <div class="flex flex-col justify-between items-center w-full" style="height: calc(100vh);">
          <div class="w-full">
            <div>
              <ListFolder ref="listFolderRef" :listFolders="props.listFolders" :activeFolderId="props.activeFolderId"
                @clickFolderName="handleClickFolderName" @rightClickFolderName="handleRightClickFolderName"
                @renameFolderName="handleRenameFolderName" />

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


      <div class="menu p-0 w-10/12 min-h-full bg-base-100">
        <!-- <OverlayScrollbarsComponent :options="scrollbarOptions"> -->

        <div class="w-full">
          <!-- general setting -->
          <div class="p-4">
            <h2 class="text-lg font-semibold mb-2">{{ $t('app.setting_general_title') }}</h2>
            <label class="form-control w-full">
              <div class="label">
                <span class="font-semibold label-text">{{ $t('app.setting_general_language_title') }}</span>
              </div>
              <select class="select select-sm select-bordered" v-model="settings.general.lang"
                @change="handleChangeLanguage">
                <option value="vi">{{ $t('app.setting_general_language_vi') }}</option>
                <option value="en">{{ $t('app.setting_general_language_en') }}</option>
                <option value="zhtw">{{ $t('app.setting_general_language_zhtw') }}</option>
              </select>
            </label>

            <label class="form-control w-full pt-2">
              <div class="label">
                <span class="font-semibold label-text">{{ $t('app.setting_general_theme_title') }}</span>
              </div>
              <select v-model="$colorMode.preference" class="select select-sm select-bordered">
                <option value="system">{{ $t('app.setting_general_theme_system') }}</option>
                <option value="light">{{ $t('app.setting_general_theme_light') }}</option>
                <option value="dark">{{ $t('app.setting_general_theme_dark') }}</option>
              </select>
            </label>

            <label class="form-control w-full pt-2">
              <div class="label">
                <span class="font-semibold label-text">{{ $t('app.setting_general_default_editor_title') }}</span>
              </div>
              <select class="select select-sm select-bordered" v-model="settings.general.defaultEditor"
                @change="handleChangeDefaultEditor">
                <option value="Tiptap">{{ $t('app.setting_general_default_editor_tiptap') }}</option>
                <option value="CodeMirror">{{ $t('app.setting_general_default_editor_codemirror') }}</option>
              </select>
            </label>

            <label class="form-control w-full pt-2">
              <div class="label">
                <span class="font-semibold label-text">{{ $t('app.setting_general_security_title') }}</span>
              </div>
              <button class="btn btn-sm btn-primary" @click="handleClickSetPassword">
                {{ props.isPasswordExist ? $t('app.setting_general_security_change_password') :
                  $t('app.setting_general_security_set_password') }}
              </button>
            </label>
          </div>

          <hr class="mt-6 mb-4 border-base-300">

          <!-- sync setting -->
          <div class="p-4">
            <h2 class="text-lg font-semibold mb-2">{{ $t('app.setting_sync_title') }}</h2>

            <div class="label">
              <span class="font-semibold label-text">{{ $t('app.setting_sync_adapter_title') }}</span>
            </div>
            <div class="grid grid-cols-12 gap-4">
              <div class="col-span-8">
                <label class="form-control w-full">
                  <select v-model="adapterSelect" class="select select-sm select-bordered">
                    <option value="LocalForage">LocalForage (Offline)</option>
                    <option value="Turso">Turso (Online)</option>
                  </select>
                </label>

                <a href="https://docs.opennotas.io/started/setup-sync" class="text-xs underline inline-block mt-2">
                  {{ $t('app.setting_sync_adapter_setup_guide') }}
                </a>
              </div>
              <div class="col-span-4">
                <button class="btn btn-sm btn-primary w-full" :disabled="!isAdapterChanged" @click="handleSaveAdapter">
                  {{ $t('app.setting_sync_adapter_save') }}
                </button>
              </div>
            </div>

            <div v-if="adapterSelect !== 'LocalForage'">
              <label class="form-control w-full pt-2">
                <div class="label">
                  <span class="font-semibold label-text">{{ $t('app.setting_sync_sync_frequency_title') }}</span>
                </div>
                <select v-model="settings.sync.frequency" class="select select-sm select-bordered"
                  @change="handleSaveSettings">
                  <option value="5">5 {{ $t('app.setting_sync_sync_frequency_unit') }}</option>
                  <option value="10">10 {{ $t('app.setting_sync_sync_frequency_unit') }}</option>
                  <option value="15">15 {{ $t('app.setting_sync_sync_frequency_unit') }}</option>
                  <option value="30">30 {{ $t('app.setting_sync_sync_frequency_unit') }}</option>
                  <option value="60">60 {{ $t('app.setting_sync_sync_frequency_unit') }}</option>
                </select>
              </label>

              <label class="form-control pt-2">
                <div class="label">
                  <span class="font-semibold label-text">{{ $t('app.setting_sync_config_title') }}</span>
                </div>
                <input v-model="settings.sync.configuration" type="text"
                  class="input input-sm lg:input-md input-bordered w-full" @change="handleSaveSettings"
                  autocomplete="off" />
              </label>
            </div>
          </div>

          <hr class="mt-6 mb-4 border-base-300">

          <!-- tools setting -->
          <div class="p-4">
            <h2 class="text-lg font-semibold mb-2">{{ $t('app.setting_tools_title') }}</h2>

            <div class="label">
              <span class="font-semibold label-text">{{ $t('app.setting_tools_backup_title') }}</span>
            </div>
            <ul class="menu bg-base-100 border rounded-md border-base-300 p-0 [&_li>*]:rounded-none">
              <li @click="handleClickExportNotes">
                <span class="w-full flex flex-row justify-between">
                  {{ $t('app.setting_tools_backup_export') }}
                  <ChevronRight />
                </span>
              </li>
              <li @click="handleClickImportNotes">
                <span class="w-full flex flex-row justify-between">
                  {{ $t('app.setting_tools_backup_import') }}
                  <ChevronRight />
                </span>
              </li>
            </ul>

            <label class="form-control w-full pt-2">
              <div class="label">
                <span class="font-semibold label-text">Service Worker</span>
              </div>
              <button class="btn btn-outline btn-sm btn-error" @click="handleClickResetServiceWorker">
                {{ $t('app.setting_tools_reset_service_worker_title') }}
              </button>
            </label>
          </div>

          <div class="h-6"></div>

        </div>
        <!-- </OverlayScrollbarsComponent> -->
      </div>

    </div>
  </div>
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
