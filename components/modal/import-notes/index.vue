<script setup lang="ts">
import { X } from '~/utils/icons';
import { setImportData } from '~/services/main';
const { $i18n } = useNuxtApp();

const props = defineProps(['isLoading', 'progressCurrent', 'progressTotal']);

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
  snackbar.classList.add('fixed', 'bottom-4', 'left-1/2', 'transform', '-translate-x-1/2', 'bg-primary', 'text-primary-foreground', 'py-2', 'px-4', 'rounded-md', 'shadow-md', 'z-1000');
  snackbar.style.bottom = 'calc(1rem + env(safe-area-inset-bottom, 0px))';
  snackbar.innerText = message;
  document.getElementById('modal-import-notes')?.appendChild(snackbar);

  setTimeout(() => {
    snackbar.remove();
  }, 5000);
}

const handleClickClose = () => {
  if (props.isLoading) return;
  emit('close');
}

onMounted(() => {
  document.getElementById('modal-import-notes')?.addEventListener('cancel', (e) => {
    if (props.isLoading) {
      e.preventDefault();
    }
  });
});
</script>

<template>
  <dialog id="modal-import-notes" class="ui-modal">
    <div class="ui-modal-box p-5 lg:p-6 w-5/6 lg:w-96 border border-border">
      <form method="dialog">
        <button class="ui-btn ui-btn-sm ui-btn-circle ui-btn-ghost absolute right-3 top-3" :disabled="props.isLoading"
          @click="handleClickClose"><X class="h-4 w-4" /></button>
      </form>
      <h3 class="text-[14px] font-semibold pr-8">
        {{ $t('app.modal_import_notes_title') }}
      </h3>
      <div class="pt-4">
        <div>{{ $t('app.modal_import_notes_content') }}</div>

        <label class="ui-form-control w-full mt-4">
          <input :key="fileImportNotesKey" type="file" :disabled="props.isLoading"
            class="ui-file-input ui-file-input-bordered w-full ui-file-input-sm ui-file-input-md" @change="handleChooseFile"
            autocomplete="off" autofocus />
        </label>

        <div v-if="props.isLoading" class="text-sm opacity-70 mt-2">
          {{ props.progressTotal
            ? $t('app.modal_import_notes_progress', { current: props.progressCurrent, total: props.progressTotal })
            : $t('app.modal_import_notes_preparing') }}
        </div>

        <div class="ui-modal-action">
          <form method="dialog" class="flex">
            <button class="ui-btn ui-btn-sm mr-2" :disabled="props.isLoading">
              {{ $t('app.modal_import_notes_cancel') }}
            </button>
            <button class="ui-btn ui-btn-sm ui-btn-primary" @click="handleClickSubmit"
              :disabled="!isValidate || props.isLoading">
              <span v-if="props.isLoading" class="ui-loading ui-loading-spinner ui-loading-xs"></span>
              {{ props.isLoading ? $t('app.modal_import_notes_processing') : $t('app.modal_import_notes_ok') }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </dialog>
</template>
