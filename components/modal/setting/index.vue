<script setup lang="ts">
import SettingIcon from '../assets/svg/settings.svg?component';
import SecurityIcon from '../assets/svg/fingerprint.svg?component';
import SyncIcon from '../assets/svg/cloud.svg?component';
import ToolIcon from '../assets/svg/tool-case.svg?component';
import InfoIcon from '../assets/svg/info.svg?component';
import SettingRow from './setting-row.vue';
import SettingSelect from './setting-select.vue';
import S3ProxyAdapter from '~/adapter/s3';
import { resetSyncedImages } from '~/services/image';

const { setLocale } = useI18n();
const { $i18n } = useNuxtApp();
const runtimeConfig = useRuntimeConfig();

const props = defineProps([
  'isPasswordExist',
  'settings',
])

const emit = defineEmits([
  'saveSettings',
  'setPassword',
  'changePassword',
  'changeAdapter',
  'saveAdapter',
  'changeDefaultEditor',
  'clickExportNotes',
  'triggerImportNotes',
  'clickExportSettings',
  'triggerImportSettings',
  'clickSetPassword',
  'closeSetPassword',
  'clickImportNotes',
  'closeSetting',
]);

const tabs = computed(() => [
  { key: 'general', label: $i18n.t('app.setting_general_title'), icon: SettingIcon },
  { key: 'security', label: $i18n.t('app.setting_security_title'), icon: SecurityIcon },
  { key: 'sync', label: $i18n.t('app.setting_sync_title'), icon: SyncIcon },
  { key: 'tools', label: $i18n.t('app.setting_tools_title'), icon: ToolIcon },
  { key: 'about', label: $i18n.t('app.setting_about_title'), icon: InfoIcon },
]);

const tabIndex = ref<number>(0);
const tabTitle = computed(() => tabs.value[tabIndex.value]?.label ?? '');
const handleClickTab = (index: number) => {
  tabIndex.value = index;
}

const settings = ref<any>(props.settings);
watch(() => props.settings, (newValue) => {
  const hasPendingAdapterChange = isAdapterChanged.value;
  settings.value = newValue;
  if (!hasPendingAdapterChange) {
    adapterSelect.value = settings.value.sync.adapter;
  }
  // Keep draft in sync when settings are committed externally (e.g., parent reload)
  draftS3Config.value = buildDraft(newValue?.imageSync);
  fontFamilyDraft.value = newValue?.general?.fontFamily || '';
}, { deep: true });

// onMounted(() => {
//   document.getElementById('setting-content') && new (window as any)
//     .SimpleBar(document.getElementById('setting-content'), { autoHide: true, clickOnTrack: false });
// });

const handleSaveSettings = async () => {
  emit('saveSettings', settings.value);
}

// lang
const handleChangeLanguage = () => {
  setLocale(settings.value.general.lang);
  handleSaveSettings();
}

// default editor
const handleChangeDefaultEditor = () => {
  // handleSaveSettings();
  emit('saveSettings', settings.value);
}

// editor view
const handleChangeEditorView = () => {
  // handleSaveSettings();
  emit('saveSettings', settings.value);
}

// set password
const handleClickSetPassword = () => {
  // Show modal set password
  emit('clickSetPassword');
}
const closeSetPasswordModal = () => {
  emit('closeSetPassword');
}
defineExpose({
  closeSetPasswordModal,
});

const adapterSelect = ref<string>('');

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

// Draft font family: only committed to settings.value when user clicks Save.
const fontFamilyDraft = ref<string>('');

onMounted(() => {
  adapterSelect.value = settings.value.sync.adapter;
  draftS3Config.value = buildDraft(props.settings?.imageSync);
  fontFamilyDraft.value = props.settings?.general?.fontFamily || '';
});
// change adapter
const isAdapterChanged = computed(() => adapterSelect.value !== settings.value.sync.adapter);
const handleSaveAdapter = (e: Event) => {
  emit('saveAdapter', adapterSelect.value);
}
const handleCancelAdapterChange = () => {
  adapterSelect.value = settings.value.sync.adapter;
}

// font family
const isFontFamilyDirty = computed(() => (props.settings?.general?.fontFamily || '') !== fontFamilyDraft.value);
const handleSaveFontFamily = () => {
  settings.value = {
    ...settings.value,
    general: {
      ...settings.value.general,
      fontFamily: fontFamilyDraft.value,
    },
  };
  handleSaveSettings();
}
const handleCancelFontFamily = () => {
  fontFamilyDraft.value = props.settings?.general?.fontFamily || '';
}

// export notes
const handleClickExportNotes = () => {
  emit('clickExportNotes', true);
}

// import notes
const handleClickImportNotes = () => {
  emit('clickImportNotes');
}
const handleClickResetServiceWorker = () => {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      registration.unregister();
    });

    // force reload
    window.location.href = window.location.href;
  });
}
const handleClickForceUpdate = async () => {
  if ('caches' in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  }
  window.location.reload();
}

const handleClickCloseSettings = () => {
  emit('closeSetting');
}

// Image sync settings
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

// Check if S3 config draft is complete enough to test
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
};

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
</script>

<template>
  <dialog id="modal-settings" class="modal backdrop:bg-black/10 backdrop:backdrop-blur-sm">
    <div
      class="modal-box w-full max-w-3xl h-[38rem] max-h-[85vh] overflow-hidden p-0 rounded-2xl border border-base-content/15 shadow-2xl">
      <div class="flex flex-row h-full">
        <!-- sidebar -->
        <div class="w-60 shrink-0 flex flex-col gap-1 bg-base-100 border-r border-base-content/15 px-3 py-5 overflow-y-auto">
          <form method="dialog" class="px-1 pb-3">
            <button class="btn btn-sm btn-ghost btn-square" @click="handleClickCloseSettings">✕</button>
          </form>

          <button v-for="(tab, i) in tabs" :key="tab.key" type="button"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg !text-base text-left transition-colors"
            :class="tabIndex === i ? 'bg-base-200 font-medium' : 'bg-transparent hover:bg-base-200 text-base-content/80'"
            @click="handleClickTab(i)">
            <component :is="tab.icon" class="h-5 w-5 shrink-0" />
            {{ tab.label }}
          </button>
        </div>

        <!-- content -->
        <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div id="setting-content" class="flex-1 overflow-auto px-8 py-6">
            <p class="text-xl font-semibold pb-4 mb-2 border-b border-base-content/15">{{ tabTitle }}</p>

          <!-- general settings -->
          <div v-if="tabIndex === 0" class="divide-y divide-base-content/10">
            <SettingRow :label="$t('app.setting_general_language_title')">
              <SettingSelect v-model="settings.general.lang" @update:modelValue="handleChangeLanguage" :options="[
                { label: $t('app.setting_general_language_vi'), value: 'vi' },
                { label: $t('app.setting_general_language_en'), value: 'en' },
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
              <SettingSelect v-model="settings.general.editorView" @update:modelValue="handleChangeEditorView" :options="[
                { label: $t('app.setting_general_editor_view_full'), value: 'full' },
                { label: $t('app.setting_general_editor_view_compact'), value: 'compact' },
              ]" />
            </SettingRow>

            <SettingRow :label="$t('app.setting_general_font_title')">
              <input v-model="fontFamilyDraft" type="text" class="input input-sm input-bordered w-40"
                autocomplete="off" />
            </SettingRow>
          </div>

          <!-- security settings -->
          <div v-if="tabIndex === 1" class="divide-y divide-base-content/10">
            <SettingRow :label="$t('app.setting_general_security_title')">
              <button class="btn rounded-md btn-sm font-normal shadow-none border border-base-content/20"
                @click="handleClickSetPassword">
                {{ props.isPasswordExist ? $t('app.setting_general_security_change_password') :
                  $t('app.setting_general_security_set_password') }}
              </button>
            </SettingRow>
          </div>

          <!-- sync settings -->
          <div v-if="tabIndex === 2" class="space-y-6">
            <!-- Note Sync -->
            <div class="divide-y divide-base-content/10">
              <div class="flex items-center justify-between gap-6 py-4">
                <div class="min-w-0">
                  <p class="font-medium">{{ $t('app.setting_sync_adapter_title') }}</p>
                  <p class="text-xs text-base-content/60 mt-1">
                    {{ $t('app.setting_sync_adapter_description') }}
                    <br /><a href="https://docs.opennotas.io/started/setup-sync" target="_blank"
                      class="underline text-xs hover:text-primary">{{ $t('app.setting_sync_adapter_setup_guide') }}</a>
                  </p>
                </div>
                <div class="shrink-0 flex items-center gap-2">
                  <SettingSelect v-model="adapterSelect" :options="[
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
            <div class="divide-y divide-base-content/10">
              <SettingRow :label="$t('app.setting_image_sync_enable')">
                <input type="checkbox" v-model="settings.imageSync.enabled" class="toggle"
                  @change="handleSaveSettings" />
              </SettingRow>

              <div v-if="settings.imageSync?.enabled" class="flex items-center justify-between gap-6 py-4">
                <div class="min-w-0">
                  <p class="font-medium">{{ $t('app.setting_image_sync_config_title') }}</p>
                  <p class="text-xs text-base-content/60 mt-1">
                    {{ $t('app.setting_image_sync_description') }}
                    <br /><a href="https://docs.opennotas.io/started/setup-sync/s3-storage" target="_blank"
                      class="underline text-xs hover:text-primary">{{ $t('app.setting_image_sync_setup_guide') }}</a>
                  </p>
                </div>
                <button type="button"
                  class="btn btn-sm rounded-md font-normal shadow-none border border-base-content/20 shrink-0"
                  @click="handleOpenImageSyncConfigModal">
                  {{ $t('app.setting_configure_button') }}
                </button>
              </div>
            </div>
          </div>

          <!-- tools -->
          <div v-if="tabIndex === 3" class="space-y-6">
            <div class="divide-y divide-base-content/10">
              <SettingRow :label="$t('app.setting_tools_backup_export')">
                <button type="button"
                  class="btn btn-sm rounded-md font-normal shadow-none border border-base-content/20"
                  @click="handleClickExportNotes">
                  {{ $t('app.setting_tools_backup_export_button') }}
                </button>
              </SettingRow>

              <SettingRow :label="$t('app.setting_tools_backup_import')">
                <button type="button"
                  class="btn btn-sm rounded-md font-normal shadow-none border border-base-content/20"
                  @click="handleClickImportNotes">
                  {{ $t('app.setting_tools_backup_import_button') }}
                </button>
              </SettingRow>
            </div>

            <div class="divide-y divide-base-content/10">
              <SettingRow label="Service Worker">
                <button class="btn btn-sm btn-outline btn-error" @click="handleClickResetServiceWorker">
                  {{ $t('app.setting_tools_reset_service_worker_title') }}
                </button>
              </SettingRow>

              <SettingRow :label="$t('app.setting_tools_force_update_title')"
                :description="$t('app.setting_tools_force_update_description')">
                <button class="btn btn-sm btn-outline btn-error" @click="handleClickForceUpdate">
                  {{ $t('app.setting_tools_force_update_button') }}
                </button>
              </SettingRow>
            </div>
          </div>

          <!-- about -->
          <div v-if="tabIndex === 4" class="h-[calc(100%_-_60px)] flex justify-center items-center">
            <div class="flex flex-col justify-center items-center">
              <img :src="'/logo-icon.png'" height="96" width="96" alt="OpenNotas Logo" />
              <a class="underline" href="https://opennotas.io">
                <h1 class="font-bold text-3xl">{{ $t('app_name') }}</h1>
              </a>
              <p class="mt-4 text-center text-sm">{{ $t('app.slogan') }}</p>
            </div>
          </div>
        </div>

        <div v-if="(tabIndex === 0 && isFontFamilyDirty) || (tabIndex === 2 && isAdapterChanged)"
          class="shrink-0 border-t border-base-content/15 px-8 py-4 flex items-center justify-end gap-2">
          <template v-if="tabIndex === 0">
            <button class="btn btn-sm" @click="handleCancelFontFamily">
              {{ $t('app.setting_general_font_cancel') }}
            </button>
            <button class="btn btn-sm btn-primary" @click="handleSaveFontFamily">
              {{ $t('app.setting_general_font_save') }}
            </button>
          </template>
          <template v-if="tabIndex === 2">
            <button class="btn btn-sm" @click="handleCancelAdapterChange">
              {{ $t('app.setting_sync_adapter_cancel') }}
            </button>
            <button class="btn btn-sm btn-primary" @click="handleSaveAdapter">
              {{ $t('app.setting_sync_adapter_save') }}
            </button>
          </template>
        </div>
        </div>
      </div>
    </div>
  </dialog>

  <ModalConfirmImageSyncChange v-if="isShowModalConfirmImageSyncChange" @confirm="handleConfirmImageSyncChange"
    @close="handleCancelImageSyncChange" />

  <ModalSyncConfig v-if="isShowModalSyncConfig" :value="settings.sync.configuration" @confirm="handleConfirmSyncConfig"
    @close="handleCloseSyncConfigModal" />

  <ModalImageSyncConfig v-if="isShowModalImageSyncConfig" :s3Config="draftS3Config" :isDirty="isS3ConfigDirty"
    :isComplete="isS3ConfigComplete" :testStatus="imageSyncTestStatus" @save="handleSaveImageSyncConfigModal"
    @test="handleTestImageSyncConnection" @close="handleCloseImageSyncConfigModal" />
</template>
