<script setup lang="ts">
import { SettingIcon } from '~/utils/icons';
import { SecurityIcon } from '~/utils/icons';
import { SyncIcon } from '~/utils/icons';
import { ToolIcon } from '~/utils/icons';
import { InfoIcon } from '~/utils/icons';
import { ChevronRight, Pencil, X } from '~/utils/icons';
import SettingRow from './setting-row.vue';
import SettingSelect from './setting-select.vue';
import S3ProxyAdapter from '~/adapter/s3';
import { resetSyncedImages } from '~/services/image';
import { hasNewVersion } from '~/utils/check-app-version';
import { isDirectorySyncSupported } from '~/utils/directory-fs';

const { setLocale } = useI18n();
const { $i18n } = useNuxtApp();
const runtimeConfig = useRuntimeConfig();

const props = defineProps([
  'isPasswordExist',
  'settings',
]);

const emit = defineEmits([
  'saveSettings',
  'setPassword',
  'changePassword',
  'changeAdapter',
  'saveAdapter',
  'chooseDirectory',
  'compactDirectory',
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
const tabDescription = computed(() => ({
  general: $i18n.t('app.setting_general_description'),
  security: $i18n.t('app.setting_security_description'),
  sync: $i18n.t('app.setting_sync_description'),
  tools: $i18n.t('app.setting_tools_description'),
  about: $i18n.t('app.setting_about_description'),
}[tabs.value[tabIndex.value]?.key || 'general']));
const handleClickTab = (index: number) => {
  isShowFontDialog.value = false;
  isShowEditorFontDialog.value = false;
  fontDialogValue.value = '';
  editorFontDialogValue.value = '';
  tabIndex.value = index;
}

const settings = ref<any>(props.settings);
// Track explicit adapter edits separately from async parent settings updates.
const userEditedAdapter = ref(false);
watch(() => props.settings, (newValue) => {
  settings.value = newValue;
  if (!userEditedAdapter.value) {
    adapterSelect.value = settings.value.sync.adapter;
  }
  draftS3Config.value = buildDraft(newValue?.imageSync);
  fontFamilyDraft.value = newValue?.general?.fontFamily || '';
  editorFontFamilyDraft.value = newValue?.general?.editorFontFamily || '';
  editorFontSizeDraft.value = newValue?.general?.editorFontSize ?? 14;
  editorLineHeightDraft.value = newValue?.general?.editorLineHeight ?? 1.5;
  editorBlockSpacingDraft.value = newValue?.general?.editorBlockSpacing ?? 0.75;
}, { deep: true });

const handleSaveSettings = async () => {
  emit('saveSettings', settings.value);
}

const handleChangeLanguage = () => {
  setLocale(settings.value.general.lang);
  handleSaveSettings();
}

const handleChangeDefaultEditor = () => {
  emit('saveSettings', settings.value);
}

const handleChangeEditorView = () => {
  emit('saveSettings', settings.value);
}

const handleClickSetPassword = () => {
  emit('clickSetPassword');
}
const closeSetPasswordModal = () => {
  emit('closeSetPassword');
}
defineExpose({
  closeSetPasswordModal,
});

const adapterSelect = ref<string>('');
const directorySyncSupported = isDirectorySyncSupported();
const directoryFolderName = computed(() => {
  try {
    return JSON.parse(settings.value?.sync?.configuration || '{}')?.folderName || '';
  } catch {
    return '';
  }
});
const adapterOptions = computed(() => [
  { label: 'LocalForage (Offline)', value: 'LocalForage' },
  { label: 'Turso (Online)', value: 'Turso' },
  ...(directorySyncSupported
    ? [{ label: $i18n.t('app.setting_sync_adapter_directory'), value: 'SqliteDirectory' }]
    : []),
]);

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

const fontFamilyDraft = ref<string>('');
const editorFontFamilyDraft = ref<string>('');
const editorFontSizeDraft = ref<number>(14);
const editorLineHeightDraft = ref<number>(1.5);
const editorBlockSpacingDraft = ref<number>(0.75);

onMounted(() => {
  adapterSelect.value = settings.value.sync.adapter;
  draftS3Config.value = buildDraft(props.settings?.imageSync);
  fontFamilyDraft.value = props.settings?.general?.fontFamily || '';
  editorFontFamilyDraft.value = props.settings?.general?.editorFontFamily || '';
  editorFontSizeDraft.value = props.settings?.general?.editorFontSize ?? 14;
  editorLineHeightDraft.value = props.settings?.general?.editorLineHeight ?? 1.5;
  editorBlockSpacingDraft.value = props.settings?.general?.editorBlockSpacing ?? 0.75;
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

const isFontFamilyDirty = computed(() => (props.settings?.general?.fontFamily || '') !== fontFamilyDraft.value);
const fontDisplayName = computed(() =>
  fontFamilyDraft.value.trim() || $i18n.t('app.setting_general_font_system'),
);
const isShowFontDialog = ref(false);
const fontDialogValue = ref('');
const handleOpenFontDialog = () => {
  fontDialogValue.value = fontFamilyDraft.value;
  isShowFontDialog.value = true;
};
const handleSaveFontDialog = () => {
  fontFamilyDraft.value = fontDialogValue.value.trim();
  settings.value = {
    ...settings.value,
    general: {
      ...settings.value.general,
      fontFamily: fontFamilyDraft.value,
    },
  };
  isShowFontDialog.value = false;
  handleSaveSettings();
};
const handleCloseFontDialog = () => {
  isShowFontDialog.value = false;
};

const clampNumber = (value: any, fallback: number, min: number, max: number) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
};
const editorFontDisplayName = computed(() => {
  const general = props.settings?.general || {};
  const font = String(general.editorFontFamily || '').trim();
  const size = general.editorFontSize ?? 14;
  return font && font.toLowerCase() !== 'system'
    ? `${font} · ${size}px`
    : `${size}px · ${general.editorLineHeight ?? 1.5}`;
});
const isShowEditorFontDialog = ref(false);
const editorFontDialogValue = ref('');
const handleOpenEditorFontDialog = () => {
  editorFontDialogValue.value = editorFontFamilyDraft.value;
  editorFontSizeDraft.value = Number(props.settings?.general?.editorFontSize ?? 14);
  editorLineHeightDraft.value = Number(props.settings?.general?.editorLineHeight ?? 1.5);
  editorBlockSpacingDraft.value = Number(props.settings?.general?.editorBlockSpacing ?? 0.75);
  isShowEditorFontDialog.value = true;
};
const handleSaveEditorFontDialog = () => {
  const value = editorFontDialogValue.value.trim();
  editorFontFamilyDraft.value = value.toLowerCase() === 'system' ? '' : value;
  editorFontSizeDraft.value = clampNumber(editorFontSizeDraft.value, 14, 12, 32);
  editorLineHeightDraft.value = clampNumber(editorLineHeightDraft.value, 1.5, 1.2, 2.4);
  editorBlockSpacingDraft.value = clampNumber(editorBlockSpacingDraft.value, 0.75, 0, 3);
  settings.value = {
    ...settings.value,
    general: {
      ...settings.value.general,
      editorFontFamily: editorFontFamilyDraft.value,
      editorFontSize: editorFontSizeDraft.value,
      editorLineHeight: editorLineHeightDraft.value,
      editorBlockSpacing: editorBlockSpacingDraft.value,
    },
  };
  isShowEditorFontDialog.value = false;
  handleSaveSettings();
};
const handleCloseEditorFontDialog = () => {
  isShowEditorFontDialog.value = false;
};

const handleClickExportNotes = () => {
  emit('clickExportNotes', true);
}

const handleClickImportNotes = () => {
  emit('clickImportNotes');
}

const handleClickExportSettings = () => {
  emit('clickExportSettings');
}

const handleClickImportSettings = () => {
  emit('triggerImportSettings');
}
const handleClickResetServiceWorker = () => {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      registration.unregister();
    });

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
  isShowFontDialog.value = false;
  isShowEditorFontDialog.value = false;
  emit('closeSetting');
}

const handleSettingsDialogClose = () => {
  isShowFontDialog.value = false;
  isShowEditorFontDialog.value = false;
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
</script>

<template>
  <dialog id="modal-settings" class="ui-modal" @close="handleSettingsDialogClose">
    <div class="ui-modal-box ui-modal-panel setting-window max-h-[88vh] w-full max-w-[54rem]">
      <div class="ui-modal-main">
        <aside class="setting-sidebar">
          <div class="setting-sidebar-head">
            <h2>{{ $t('app.setting_title') }}</h2>
          </div>

          <div role="tablist" aria-orientation="vertical" class="setting-tabs">
            <button v-for="(tab, i) in tabs.slice(0, 4)" :key="tab.key" type="button" role="tab"
              :id="`setting-tab-${tab.key}`" :aria-selected="tabIndex === i" aria-controls="setting-content"
              class="setting-tab" :class="{ 'is-active': tabIndex === i }" @click="handleClickTab(i)">
              <component :is="tab.icon" class="h-4 w-4 shrink-0" />
              {{ tab.label }}
            </button>

            <div class="setting-tabs-bottom">
              <button type="button" role="tab" :id="`setting-tab-${tabs[4]?.key}`" :aria-selected="tabIndex === 4"
                aria-controls="setting-content" class="setting-tab" :class="{ 'is-active': tabIndex === 4 }"
                @click="handleClickTab(4)">
                <component :is="tabs[4]?.icon" class="h-4 w-4 shrink-0" />
                {{ tabs[4]?.label }}
              </button>
            </div>
          </div>
        </aside>

        <section class="setting-pane">
          <header class="setting-page-head">
            <div class="min-w-0">
              <h2 class="setting-page-title">{{ tabTitle }}</h2>
              <p class="setting-page-description">{{ tabDescription }}</p>
            </div>
            <button type="button" class="ui-btn ui-btn-ghost ui-btn-sm ui-btn-square setting-close"
              :aria-label="$t('app.action_close')" :title="$t('app.action_close')" @click="handleClickCloseSettings">
              <X class="h-4 w-4" />
            </button>
          </header>

          <div id="setting-content" role="tabpanel" :aria-labelledby="`setting-tab-${tabs[tabIndex]?.key}`"
            :data-panel="`setting-panel-${tabs[tabIndex]?.key}`" class="setting-scroll">
            <div v-if="tabIndex === 0" class="setting-card">
              <SettingRow :label="$t('app.setting_general_language_title')"
                :description="$t('app.setting_general_language_description')">
                <SettingSelect v-model="settings.general.lang" gaEvent="settings_language_change"
                  @update:modelValue="handleChangeLanguage" :options="[
                    { label: $t('app.setting_general_language_vi'), value: 'vi' },
                    { label: $t('app.setting_general_language_en'), value: 'en' },
                    { label: $t('app.setting_general_language_ru'), value: 'ru' },
                    { label: $t('app.setting_general_language_zhtw'), value: 'zhtw' },
                  ]" />
              </SettingRow>

              <SettingRow :label="$t('app.setting_general_theme_title')"
                :description="$t('app.setting_general_theme_description')">
                <div class="setting-segmented" role="group" :aria-label="$t('app.setting_general_theme_title')">
                  <button v-for="theme in [
                    { label: $t('app.setting_general_theme_system'), value: 'system' },
                    { label: $t('app.setting_general_theme_light_short'), value: 'light' },
                    { label: $t('app.setting_general_theme_dark_short'), value: 'dark' },
                  ]" :key="theme.value" type="button" class="setting-segment"
                    :class="{ 'is-active': $colorMode.preference === theme.value }"
                    :aria-pressed="$colorMode.preference === theme.value" data-ga-event="settings_theme_change"
                    @click="$colorMode.preference = theme.value">
                    {{ theme.label }}
                  </button>
                </div>
              </SettingRow>

              <SettingRow :label="$t('app.setting_general_default_editor_title')"
                :description="$t('app.setting_general_default_editor_description')">
                <SettingSelect v-model="settings.general.defaultEditor" gaEvent="settings_editor_change"
                  @update:modelValue="handleChangeDefaultEditor" :options="[
                    { label: $t('app.setting_general_default_editor_tiptap'), value: 'Tiptap' },
                    { label: $t('app.setting_general_default_editor_codemirror'), value: 'CodeMirror' },
                    { label: 'Crepe', value: 'Crepe' },
                  ]" />
              </SettingRow>

              <SettingRow :label="$t('app.setting_general_editor_view_title')"
                :description="$t('app.setting_general_editor_view_description')">
                <SettingSelect v-model="settings.general.editorView" gaEvent="settings_editor_view_change"
                  @update:modelValue="handleChangeEditorView" :options="[
                    { label: $t('app.setting_general_editor_view_full'), value: 'full' },
                    { label: $t('app.setting_general_editor_view_compact'), value: 'compact' },
                  ]" />
              </SettingRow>

              <SettingRow :label="$t('app.setting_general_editor_typography_title')"
                :description="$t('app.setting_general_editor_typography_description')">
                <button type="button" class="setting-value-button" @click="handleOpenEditorFontDialog">
                  <span class="max-w-44 truncate">{{ editorFontDisplayName }}</span>
                  <Pencil class="h-3.5 w-3.5 shrink-0 opacity-55" />
                </button>
              </SettingRow>

              <SettingRow :label="$t('app.setting_general_font_title')"
                :description="$t('app.setting_general_font_description')">
                <button type="button" class="setting-value-button" @click="handleOpenFontDialog">
                  <span class="max-w-40 truncate">{{ fontDisplayName }}</span>
                  <Pencil class="h-3.5 w-3.5 shrink-0 opacity-55" />
                </button>
              </SettingRow>
            </div>

            <div v-if="tabIndex === 1" class="setting-card">
              <SettingRow :label="$t('app.setting_general_security_title')"
                :description="$t('app.setting_security_description')">
                <button type="button" class="ui-btn ui-btn-sm border border-border bg-card"
                  data-ga-event="settings_password_open" @click="handleClickSetPassword">
                  {{ props.isPasswordExist ? $t('app.setting_general_security_change_password')
                    : $t('app.setting_general_security_set_password') }}
                </button>
              </SettingRow>
            </div>

            <div v-if="tabIndex === 2" class="setting-groups">
              <div class="setting-card">
                <SettingRow :label="$t('app.setting_sync_adapter_title')"
                  :description="$t('app.setting_sync_adapter_description')">
                  <div class="flex items-center gap-2">
                    <SettingSelect v-model="adapterSelect" @update:modelValue="userEditedAdapter = true"
                      :options="adapterOptions" />
                  </div>
                </SettingRow>

                <SettingRow v-if="adapterSelect === 'SqliteDirectory'"
                  :label="$t('app.setting_sync_directory_title')"
                  :description="$t('app.setting_sync_directory_description')">
                  <div class="flex items-center gap-2">
                    <button v-if="directoryFolderName" type="button" class="ui-btn ui-btn-sm border border-border bg-card"
                      @click="emit('compactDirectory')">
                      {{ $t('app.setting_sync_directory_compact') }}
                    </button>
                    <button type="button" class="setting-value-button" @click="emit('chooseDirectory')">
                      <span>{{ directoryFolderName || $t('app.setting_sync_directory_choose') }}</span>
                      <ChevronRight class="h-3.5 w-3.5 shrink-0 opacity-55" />
                    </button>
                  </div>
                </SettingRow>

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

                <SettingRow v-if="adapterSelect !== 'LocalForage' && adapterSelect !== 'SqliteDirectory'" :label="$t('app.setting_sync_config_title')">
                  <button type="button" class="setting-value-button" data-ga-event="settings_sync_config_save"
                    @click="handleOpenSyncConfigModal">
                    <span>{{ $t('app.setting_configure_button') }}</span>
                    <ChevronRight class="h-3.5 w-3.5 shrink-0 opacity-55" />
                  </button>
                </SettingRow>
              </div>

              <div class="setting-card">
                <SettingRow :label="$t('app.setting_image_sync_enable')">
                  <UiSwitch v-model="settings.imageSync.enabled" data-ga-event="settings_image_sync_toggle"
                    @change="handleSaveSettings" />
                </SettingRow>

                <SettingRow v-if="settings.imageSync?.enabled" :label="$t('app.setting_image_sync_config_title')"
                  :description="$t('app.setting_image_sync_description')">
                  <button type="button" class="setting-value-button" data-ga-event="settings_image_sync_save"
                    @click="handleOpenImageSyncConfigModal">
                    <span>{{ $t('app.setting_configure_button') }}</span>
                    <ChevronRight class="h-3.5 w-3.5 shrink-0 opacity-55" />
                  </button>
                </SettingRow>
              </div>
            </div>

            <div v-if="tabIndex === 3" class="setting-groups">
              <div class="setting-card">
                <SettingRow :label="$t('app.setting_tools_backup_export')">
                  <button type="button" class="setting-value-button" data-ga-event="settings_export_notes"
                    @click="handleClickExportNotes">
                    <span>{{ $t('app.setting_tools_backup_export_button') }}</span>
                    <ChevronRight class="h-3.5 w-3.5 shrink-0 opacity-55" />
                  </button>
                </SettingRow>

                <SettingRow :label="$t('app.setting_tools_backup_import')">
                  <button type="button" class="setting-value-button" data-ga-event="settings_import_notes"
                    @click="handleClickImportNotes">
                    <span>{{ $t('app.setting_tools_backup_import_button') }}</span>
                    <ChevronRight class="h-3.5 w-3.5 shrink-0 opacity-55" />
                  </button>
                </SettingRow>

                <SettingRow :label="$t('app.setting_tools_settings_export')"
                  :description="$t('app.setting_tools_settings_export_description')">
                  <button type="button" class="setting-value-button" data-ga-event="settings_export_settings"
                    @click="handleClickExportSettings">
                    <span>{{ $t('app.setting_tools_settings_export_button') }}</span>
                    <ChevronRight class="h-3.5 w-3.5 shrink-0 opacity-55" />
                  </button>
                </SettingRow>

                <SettingRow :label="$t('app.setting_tools_settings_import')">
                  <button type="button" class="setting-value-button" data-ga-event="settings_import_settings"
                    @click="handleClickImportSettings">
                    <span>{{ $t('app.setting_tools_settings_import_button') }}</span>
                    <ChevronRight class="h-3.5 w-3.5 shrink-0 opacity-55" />
                  </button>
                </SettingRow>
              </div>

              <div class="setting-card">
                <SettingRow label="Service Worker">
                  <button type="button" class="setting-value-button" @click="handleClickResetServiceWorker">
                    <span>{{ $t('app.setting_tools_reset_service_worker_title') }}</span>
                    <ChevronRight class="h-3.5 w-3.5 shrink-0 opacity-55" />
                  </button>
                </SettingRow>

                <SettingRow :label="$t('app.setting_tools_force_update_title')"
                  :description="$t('app.setting_tools_force_update_description')">
                  <div class="relative inline-flex">
                    <span v-if="hasNewVersion"
                      class="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-danger ring-2 ring-card"></span>
                    <button type="button" class="ui-btn ui-btn-sm border border-border bg-card"
                      @click="handleClickForceUpdate">
                      {{ $t('app.setting_tools_force_update_button') }}
                    </button>
                  </div>
                </SettingRow>
              </div>
            </div>

            <div v-if="tabIndex === 4" class="setting-about">
              <img :src="'/logo-icon.png'" height="56" width="56" class="h-14 w-14" alt="OpenNotas Logo" />
              <a class="setting-about-name" href="https://opennotas.io" target="_blank" rel="noopener noreferrer">
                {{ $t('app_name') }}
              </a>
              <p class="setting-about-slogan">{{ $t('app.slogan') }}</p>
              <p class="setting-about-version">{{ $t('app.version') }} {{ runtimeConfig.public.version }}</p>
            </div>
          </div>

          <div v-if="tabIndex === 2 && isAdapterChanged" class="ui-modal-footer">
            <button type="button" class="ui-btn ui-btn-sm" @click="handleCancelAdapterChange">
              {{ $t('app.setting_sync_adapter_cancel') }}
            </button>
            <button type="button" class="ui-btn ui-btn-sm ui-btn-primary" data-ga-event="settings_adapter_save"
              @click="handleSaveAdapter">
              {{ $t('app.setting_sync_adapter_save') }}
            </button>
          </div>
        </section>
      </div>
    </div>
  </dialog>

  <UiDialog v-model:open="isShowFontDialog" :title="$t('app.setting_general_edit_font_title')"
    :description="$t('app.setting_general_edit_font_description')" width="26rem" @ok="handleSaveFontDialog"
    @cancel="handleCloseFontDialog">
    <label class="flex flex-col gap-1.5">
      <span class="text-[12px] font-medium">{{ $t('app.setting_general_font_title') }}</span>
      <input v-model="fontDialogValue" type="text" autofocus class="ui-input"
        :placeholder="$t('app.setting_general_font_placeholder')" autocomplete="off"
        @keydown.enter.prevent="handleSaveFontDialog" />
    </label>
  </UiDialog>

  <UiDialog v-model:open="isShowEditorFontDialog" :title="$t('app.setting_general_edit_editor_typography_title')"
    :description="$t('app.setting_general_edit_editor_typography_description')" width="28rem"
    @ok="handleSaveEditorFontDialog" @cancel="handleCloseEditorFontDialog">
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

  <ModalConfirmImageSyncChange v-if="isShowModalConfirmImageSyncChange" @confirm="handleConfirmImageSyncChange"
    @close="handleCancelImageSyncChange" />

  <ModalSyncConfig v-if="isShowModalSyncConfig" :value="settings.sync.configuration" @confirm="handleConfirmSyncConfig"
    @close="handleCloseSyncConfigModal" />

  <ModalImageSyncConfig v-if="isShowModalImageSyncConfig" :s3Config="draftS3Config" :isDirty="isS3ConfigDirty"
    :isComplete="isS3ConfigComplete" :testStatus="imageSyncTestStatus" @save="handleSaveImageSyncConfigModal"
    @test="handleTestImageSyncConnection" @close="handleCloseImageSyncConfigModal" />
</template>

<style scoped>
/* Native settings window: gray rail, paper canvas, one page heading. */
.setting-window {
  height: 42rem;
  overflow: hidden;
  border-color: rgb(var(--ui-border-strong)) !important;
  border-radius: 15px;
  background-color: rgb(var(--ui-background));
}

.setting-sidebar {
  display: flex;
  width: 13.5rem;
  flex-shrink: 0;
  flex-direction: column;
  padding: 1.5rem 0.875rem 0.875rem;
  border-right: 1px solid rgb(var(--ui-border));
  background-color: rgb(var(--ui-sidebar-active));
}

.setting-sidebar-head {
  padding: 0 0.75rem 1.25rem;
}

.setting-sidebar-head h2 {
  font-size: 1.25rem;
  font-weight: 650;
  letter-spacing: -0.015em;
}

.setting-tabs {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
}

.setting-tabs-bottom {
  margin-top: auto;
  padding-top: 0.75rem;
  border-top: 1px solid rgb(var(--ui-border));
}

.setting-tab {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  min-height: 2.375rem;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  color: rgb(var(--ui-muted-foreground));
  font-size: 0.8125rem;
  text-align: left;
  transition: background-color 120ms var(--ui-ease), color 120ms var(--ui-ease);
}

.setting-tab:hover {
  background-color: rgb(var(--ui-sidebar-accent));
  color: rgb(var(--ui-foreground));
}

.setting-tab.is-active {
  background-color: rgb(var(--ui-border));
  color: rgb(var(--ui-foreground));
  font-weight: 600;
}

.setting-pane {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  background-color: rgb(var(--ui-background));
}

.setting-page-head {
  display: flex;
  flex-shrink: 0;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.875rem 2.25rem 1.25rem;
}

.setting-page-title {
  font-size: 1.75rem;
  font-weight: 650;
  letter-spacing: -0.025em;
  line-height: 1.15;
}

.setting-page-description {
  margin-top: 0.35rem;
  color: rgb(var(--ui-muted-foreground));
  font-size: 0.8125rem;
  line-height: 1.45;
}

.setting-close {
  margin-left: auto;
  margin-top: -0.15rem;
  color: rgb(var(--ui-muted-foreground));
}

.setting-scroll {
  min-height: 0;
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem 2.25rem 2.25rem;
}

.setting-groups {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.setting-card {
  overflow: hidden;
  border: 1px solid rgb(var(--ui-border));
  border-radius: 13px;
  background-color: rgb(var(--ui-card));
}

.setting-card > :deep(*) + * {
  border-top: 1px solid rgb(var(--ui-border));
}

.setting-card :deep(.setting-row) {
  min-height: 3.75rem;
  padding: 1rem 1.25rem;
}

.setting-card :deep(.setting-row p:first-child) {
  font-size: 0.84375rem;
  line-height: 1.4;
}

.setting-card :deep(.setting-row p + p) {
  margin-top: 0.25rem;
  font-size: 0.75rem;
  line-height: 1.5;
}

.setting-segmented {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px;
  border: 1px solid rgb(var(--ui-border));
  border-radius: 7px;
  background-color: rgb(var(--ui-muted));
}

.setting-segment {
  min-height: 1.65rem;
  padding: 0 0.6rem;
  border-radius: 5px;
  color: rgb(var(--ui-muted-foreground));
  font-size: 0.75rem;
  font-weight: 500;
  transition: background-color 120ms var(--ui-ease), color 120ms var(--ui-ease),
    box-shadow 120ms var(--ui-ease);
}

.setting-segment:hover {
  color: rgb(var(--ui-foreground));
}

.setting-segment.is-active {
  background-color: rgb(var(--ui-card));
  color: rgb(var(--ui-foreground));
  box-shadow: 0 1px 2px rgb(40 35 25 / 0.08);
}

.setting-value-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 2.125rem;
  max-width: 13.5rem;
  padding: 0 0.75rem;
  border: 1px solid rgb(var(--ui-border));
  border-radius: 6px;
  background-color: rgb(var(--ui-card));
  color: rgb(var(--ui-foreground));
  font-size: 0.75rem;
  font-weight: 500;
  transition: background-color 120ms var(--ui-ease), border-color 120ms var(--ui-ease);
}

.setting-value-button:hover {
  border-color: rgb(var(--ui-input));
  background-color: rgb(var(--ui-accent));
}

.setting-about {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 24rem;
  padding: 3rem 1rem;
  text-align: center;
}

.setting-about-name {
  margin-top: 0.85rem;
  color: rgb(var(--ui-foreground));
  font-size: 1rem;
  font-weight: 650;
  text-decoration: none;
}

.setting-about-slogan {
  max-width: 18rem;
  margin-top: 0.35rem;
  color: rgb(var(--ui-muted-foreground));
  font-size: 0.75rem;
  line-height: 1.55;
}

.setting-about-version {
  margin-top: 0.9rem;
  color: rgb(var(--ui-muted-foreground));
  font-size: 0.6875rem;
  font-variant-numeric: tabular-nums;
}

@media (max-width: 767px) {
  .setting-sidebar {
    width: 10.5rem;
    padding: 1.125rem 0.5rem 0.5rem;
  }

  .setting-page-head {
    padding: 1.5rem 1.25rem 1rem;
  }

  .setting-page-title {
    font-size: 1.4rem;
  }

  .setting-scroll {
    padding: 0.375rem 1.25rem 1.75rem;
  }
}
</style>
