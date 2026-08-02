<script setup lang="ts">
const { $i18n } = useNuxtApp();

const emit = defineEmits([
  'confirm',
  'close',
]);
const isValidate = ref<boolean>(false);
const parsedSettings = ref<any>(null);
const encryptedFields = ref<string[]>([]);
const needsPassword = computed(() => encryptedFields.value.length > 0);
const password = ref<string>('');
const fileImportSettingsKey = ref(0);
const inputPasswordRef = ref<any>(null);

const resetState = () => {
  fileImportSettingsKey.value += 1;
  isValidate.value = false;
  parsedSettings.value = null;
  encryptedFields.value = [];
  password.value = '';
}

const handleChooseFile = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const data = e.target?.result as string;
    try {
      const json = JSON.parse(data);
      if (!json.settings || typeof json.settings !== 'object') {
        showError($i18n.t('app.modal_import_settings_data_not_invalid'));
        isValidate.value = false;
        target.value = '';
        return;
      }

      parsedSettings.value = json.settings;
      encryptedFields.value = Array.isArray(json.encryptedFields) ? json.encryptedFields : [];
      isValidate.value = true;
    } catch (error) {
      console.error(error);
      showError($i18n.t('app.modal_import_settings_data_not_invalid'));
      isValidate.value = false;
      target.value = '';
    }
  };
  reader.readAsText(file);
};

const shakePasswordInput = () => {
  inputPasswordRef.value?.classList.add('animate-shake', 'animate-duration-100', 'input-error');
  setTimeout(() => {
    inputPasswordRef.value?.classList.remove('animate-shake', 'animate-duration-100', 'input-error');
  }, 1000);
}

const handleClickSubmit = async (e: Event) => {
  e.preventDefault();

  if (!needsPassword.value) {
    const settingsToImport = parsedSettings.value;
    resetState();
    emit('confirm', settingsToImport);
    return;
  }

  if (!password.value) {
    showError($i18n.t('app.modal_import_settings_password_required'));
    shakePasswordInput();
    return;
  }

  const enteredHash = await hashPassword(password.value);
  let settingsToImport: any;
  try {
    settingsToImport = await decryptSensitiveSettings(parsedSettings.value, encryptedFields.value, enteredHash);
  } catch (_) {
    showError($i18n.t('app.modal_import_settings_wrong_password'));
    shakePasswordInput();
    return;
  }

  resetState();
  emit('confirm', settingsToImport);
}

const handleClickSkipSensitive = () => {
  showWarning($i18n.t('app.modal_import_settings_skip_sensitive_success'));
  const settingsToImport = stripEncryptedFields(parsedSettings.value, encryptedFields.value);
  resetState();
  emit('confirm', settingsToImport);
}

const handleClickClose = () => {
  resetState();
  emit('close');
}
</script>

<template>
  <dialog id="modal-import-settings" class="modal backdrop:bg-black/10 backdrop:backdrop-blur-sm">
    <div class="modal-box p-4 lg:p-6 w-5/6 lg:w-96 border border-base-content/15">
      <form method="dialog">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" @click="handleClickClose">✕</button>
      </form>
      <h3 class="font-bold text-lg">
        {{ $t('app.modal_import_settings_title') }}
      </h3>
      <div class="pt-4">
        <div>{{ $t('app.modal_import_settings_content') }}</div>

        <label class="form-control w-full mt-4">
          <input :key="fileImportSettingsKey" type="file"
            class="file-input file-input-bordered w-full file-input-sm lg:file-input-md" @change="handleChooseFile"
            autocomplete="off" autofocus />
        </label>

        <div class="form-control w-full mt-4" v-if="needsPassword">
          <div class="label">
            <span class="label-text">
              {{ $t('app.modal_import_settings_password_title') }}
            </span>
          </div>
          <input ref="inputPasswordRef" v-model="password" type="password"
            :placeholder="$t('app.modal_import_settings_password_title')"
            class="input input-sm lg:input-md input-bordered w-full" @keydown.enter="handleClickSubmit"
            autocomplete="off" />
        </div>

        <div class="modal-action">
          <form method="dialog" class="flex">
            <button class="btn btn-sm mr-2">
              {{ $t('app.modal_import_settings_cancel') }}
            </button>
            <button v-if="needsPassword" type="button" class="btn btn-sm mr-2 flex-1" @click="handleClickSkipSensitive">
              {{ $t('app.modal_import_settings_skip_sensitive') }}
            </button>
            <button class="btn btn-sm btn-primary" @click="handleClickSubmit" :disabled="!isValidate">
              {{ $t('app.modal_import_settings_ok') }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </dialog>
</template>
