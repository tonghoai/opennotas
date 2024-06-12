<script setup lang="ts">
import { setImportData } from '~/services/main';
const { $i18n } = useNuxtApp();

const emit = defineEmits([
  'confirm',
  'close',
]);
const isValidate = ref<boolean>(false);

const handleChooseFile = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    const data = e.target?.result as string;
    try {
      const notes = JSON.parse(data);
      if (!Array.isArray(notes.data)) {
        showSnackbar($i18n.t('app.modal_import_notes_data_not_invalid'));
        isValidate.value = false;
        target.value = '';
        return;
      }

      await setImportData(notes);
      isValidate.value = true;
    } catch (error) {
      console.error(error);
      showSnackbar($i18n.t('app.modal_import_notes_data_not_invalid'));
      isValidate.value = false;
      target.value = '';
    }
  };
  reader.readAsText(file);
};

const fileImportNotesKey = ref(0);
const handleClickSubmit = () => {
  fileImportNotesKey.value += 1;
  isValidate.value = false;
  emit('confirm');
}

// utils
const showSnackbar = (message: string) => {
  const snackbar = document.createElement('div');
  snackbar.classList.add('fixed', 'bottom-4', 'left-1/2', 'transform', '-translate-x-1/2', 'bg-primary', 'text-primary-content', 'py-2', 'px-4', 'rounded-md', 'shadow-md', 'z-1000');
  snackbar.innerText = message;
  document.getElementById('modal-import-notes')?.appendChild(snackbar);

  setTimeout(() => {
    snackbar.remove();
  }, 5000);
}

const handleClickClose = () => {
  emit('close');
}
</script>

<template>
  <dialog id="modal-import-notes" class="modal">
    <div class="modal-box p-4 lg:p-6 w-5/6 lg:w-96">
      <form method="dialog">
        <button class="btn btn-sm lg:btn-md btn-circle btn-ghost absolute right-2 top-2"
          @click="handleClickClose">✕</button>
      </form>
      <h3 class="font-bold text-lg">
        {{ $t('app.modal_import_notes_title') }}
      </h3>
      <div class="pt-4">
        <div>{{ $t('app.modal_import_notes_content') }}</div>

        <label class="form-control w-full mt-4">
          <input :key="fileImportNotesKey" type="file"
            class="file-input file-input-bordered w-full file-input-sm lg:file-input-md" @change="handleChooseFile"
            autocomplete="off" autofocus />
        </label>

        <div class="modal-action">
          <form method="dialog">
            <button class="btn btn-sm lg:btn-md mr-2">
              {{ $t('app.modal_import_notes_cancel') }}
            </button>
            <button class="btn btn-sm lg:btn-md btn-primary" @click="handleClickSubmit" :disabled="!isValidate">
              {{ $t('app.modal_import_notes_ok') }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </dialog>
</template>
