<script setup lang="ts">
import ChevronRight from '../assets/svg/chevron-right.svg?component';

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

const tabIndex = ref<number>(0);
const tabTitle = ref<string>($i18n.t('app.setting_general_title'));
const handleClickTab = (index: number) => {
  tabIndex.value = index;
  switch (index) {
    case 0:
      tabTitle.value = $i18n.t('app.setting_general_title');
      break;
    case 1:
      tabTitle.value = $i18n.t('app.setting_sync_title');
      break;
    case 2:
      tabTitle.value = $i18n.t('app.setting_tools_title');
      break;
    case 3:
      tabTitle.value = $i18n.t('app.setting_about_title');
      break;
  }
}

const settings = ref<any>(props.settings);
watch(() => props.settings, (newValue) => {
  settings.value = newValue;
  adapterSelect.value = settings.value.sync.adapter;
});

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
onMounted(() => {
  adapterSelect.value = settings.value.sync.adapter;
});
// change adapter
const isAdapterChanged = computed(() => adapterSelect.value !== settings.value.sync.adapter);
const handleSaveAdapter = (e: Event) => {
  emit('saveAdapter', adapterSelect.value);
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

const handleClickCloseSettings = () => {
  emit('closeSetting');
}
</script>

<template>
  <dialog id="modal-settings" class="modal">
    <div class="modal-box w-full h-3/6 overflow-hidden p-0 border border-neutral shadow-xl">
      <!-- <span class="absolute bottom-2 right-4 text-sm underline">{{ runtimeConfig.public.version }}</span> -->
      <form method="dialog">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          @click="handleClickCloseSettings">✕</button>
      </form>

      <div class="flex flex-row h-full">
        <div class="w-1/3 float-left flex flex-col gap-4 bg-base-300 px-4 py-8">
          <div class="flex flex-col justify-center px-2">
            <p class="text-3xl font-bold">Settings</p>
            <p class="text-normal">Manage your settings</p>
          </div>

          <div class="flex flex-col justify-center items-center">
            <ul class="menu rounded-box w-full">
              <li class="py-0.5" @click="handleClickTab(0)">
                <a :class="{ 'active': tabIndex == 0 }">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  {{ $t('app.setting_general_title') }}
                </a>
              </li>
              <li class="py-0.5" @click="handleClickTab(1)">
                <a :class="{ 'active': tabIndex == 1 }">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {{ $t('app.setting_sync_title') }}
                </a>
              </li>
              <li class="py-0.5" @click="handleClickTab(2)">
                <a :class="{ 'active': tabIndex == 2 }">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  {{ $t('app.setting_tools_title') }}
                </a>
              </li>
              <li class="py-0.5" @click="handleClickTab(3)">
                <a :class="{ 'active': tabIndex == 3 }">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {{ $t('app.setting_about_title') }}
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div class="w-2/3 float-right bg-base-200">
          <!-- <div class="pt-4">
            <div role="tablist" class="tabs tabs-boxed">
              <a role="tab" class="tab transition-all	" :class="{ 'bg-primary text-primary-content': tabIndex == 0 }"
                @click="handleClickTab(0)">{{ $t('app.setting_general_title') }}</a>
              <a role="tab" class="tab transition-all	" :class="{ 'bg-primary text-primary-content': tabIndex == 1 }"
                @click="handleClickTab(1)">{{ $t('app.setting_sync_title') }}</a>
              <a role="tab" class="tab transition-all	" :class="{ 'bg-primary text-primary-content': tabIndex == 2 }"
                @click="handleClickTab(2)">{{ $t('app.setting_tools_title') }}</a>
              <a role="tab" class="tab transition-all	" :class="{ 'bg-primary text-primary-content': tabIndex == 3 }"
                @click="handleClickTab(3)">{{ $t('app.setting_about_title') }}</a>
            </div>
          </div> -->

          <div id="setting-content" class="py-4 px-4 overflow-auto h-full">
            <div class="px-2 h-full">
              <p class="text-2xl font-semibold mb-2">{{ tabTitle }}</p>
              <!-- general settings -->
              <div class="transition-all pb-6" v-if="tabIndex == 0">

                <label class="form-control w-full pt-2">
                  <div class="label">
                    <span class="font-semibold label-text">{{ $t('app.setting_general_language_title') }}</span>
                  </div>
                  <select class="select select-bordered" v-model="settings.general.lang" @change="handleChangeLanguage">
                    <option value="vi">{{ $t('app.setting_general_language_vi') }}</option>
                    <option value="en">{{ $t('app.setting_general_language_en') }}</option>
                    <option value="zhtw">{{ $t('app.setting_general_language_zhtw') }}</option>
                  </select>
                </label>

                <label class="form-control w-full pt-2">
                  <div class="label">
                    <span class="font-semibold label-text">{{ $t('app.setting_general_theme_title') }}</span>
                  </div>
                  <select v-model="$colorMode.preference" class="select select-bordered">
                    <option value="system">{{ $t('app.setting_general_theme_system') }}</option>
                    <option value="light">{{ $t('app.setting_general_theme_light') }}</option>
                    <option value="dark">{{ $t('app.setting_general_theme_dark') }}</option>
                  </select>
                </label>

                <label class="form-control w-full pt-2">
                  <div class="label">
                    <span class="font-semibold label-text">{{ $t('app.setting_general_default_editor_title') }}</span>
                  </div>
                  <select class="select select-bordered" v-model="settings.general.defaultEditor"
                    @change="handleChangeDefaultEditor">
                    <option value="Tiptap">{{ $t('app.setting_general_default_editor_tiptap') }}</option>
                    <option value="CodeMirror">{{ $t('app.setting_general_default_editor_codemirror') }}</option>
                  </select>
                </label>

                <label class="form-control w-full pt-2">
                  <div class="label">
                    <span class="font-semibold label-text">{{ $t('app.setting_general_editor_view_title') }}</span>
                  </div>
                  <select class="select select-bordered" v-model="settings.general.editorView"
                    @change="handleChangeEditorView">
                    <option value="full">{{ $t('app.setting_general_editor_view_full') }}</option>
                    <option value="compact">{{ $t('app.setting_general_editor_view_compact') }}</option>
                  </select>
                </label>

                <label class="form-control w-full pt-2">
                  <div class="label">
                    <span class="font-semibold label-text">{{ $t('app.setting_general_security_title') }}</span>
                  </div>
                  <button class="btn btn-primary" @click="handleClickSetPassword">
                    {{ props.isPasswordExist ? $t('app.setting_general_security_change_password') :
                      $t('app.setting_general_security_set_password') }}
                  </button>
                </label>
              </div>

              <!-- sync settings -->
              <div class="transition-all" v-if="tabIndex == 1">
                <div class="label pt-4">
                  <span class="font-semibold label-text">{{ $t('app.setting_sync_adapter_title') }}</span>
                </div>
                <div class="grid grid-cols-12 gap-4">
                  <div class="col-span-8">
                    <label class="form-control w-full">
                      <select v-model="adapterSelect" class="select select-bordered">
                        <option value="LocalForage">LocalForage (Offline)</option>
                        <option value="Turso">Turso (Online)</option>
                      </select>
                    </label>

                    <a href="https://docs.opennotas.io/started/setup-sync" target="_blank"
                      class="text-xs underline inline-block mt-2">
                      {{ $t('app.setting_sync_adapter_setup_guide') }}
                    </a>
                  </div>
                  <div class="col-span-4">
                    <button class="btn btn-primary w-full" :disabled="!isAdapterChanged" @click="handleSaveAdapter">
                      {{ $t('app.setting_sync_adapter_save') }}
                    </button>
                  </div>
                </div>

                <div v-if="adapterSelect !== 'LocalForage'">
                  <label class="form-control w-full pt-2">
                    <div class="label">
                      <span class="font-semibold label-text">{{ $t('app.setting_sync_sync_frequency_title') }}</span>
                    </div>
                    <select v-model="settings.sync.frequency" class="select select-bordered w-64"
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

              <div class="transition-all" v-if="tabIndex == 2">

                <div class="label pt-4">
                  <span class="font-semibold label-text">{{ $t('app.setting_tools_backup_title') }}</span>
                </div>

                <ul class="menu bg-base-100 border rounded-md border-neutral p-0 [&_li>*]:rounded-none">
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
                  <button class="btn btn-error" @click="handleClickResetServiceWorker">
                    {{ $t('app.setting_tools_reset_service_worker_title') }}
                  </button>
                </label>
              </div>

              <div class="transition-all h-[calc(100%_-_40px)] flex justify-center items-center" v-if="tabIndex == 3">
                <div class="flex flex-col justify-center items-center">
                  <img :src="'/logo-icon.png'" height="96" width="96" alt="OpenNotas Logo" />
                  <a class="underline" href="https://opennotas.io">
                    <h1 class="font-bold text-3xl">{{ $t('app_name') }}</h1>
                  </a>
                  <p class="mt-4 text-center text-sm">{{ $t('app.slogan') }}</p>
                  <!-- <p class="mt-2">{{ $t('app.version') }}: {{ runtimeConfig.public.version }}</p> -->
                  <!-- <p class="mt-6"><a href="#" class="underline">https://opennotas.io</a></p> -->
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- <h3 class="font-bold text-lg">{{ $t('app.setting_title') }}</h3> -->


    </div>
  </dialog>
</template>

<style lang="postcss">
.tab-active {
  @apply !bg-neutral text-white;
}
</style>
