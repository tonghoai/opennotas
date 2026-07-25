<script setup lang="ts">
const { $i18n } = useNuxtApp();

const emit = defineEmits([
  'confirm',
  'close',
]);
const isValidate = ref<boolean>(false);
const parsedSettings = ref<any>(null);
const fileImportSettingsKey = ref(0);

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

const handleClickSubmit = () => {
  fileImportSettingsKey.value += 1;
  emit('confirm', parsedSettings.value);
  isValidate.value = false;
  parsedSettings.value = null;
}

const handleClickClose = () => {
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

        <div class="modal-action">
          <form method="dialog">
            <button class="btn btn-sm mr-2">
              {{ $t('app.modal_import_settings_cancel') }}
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
