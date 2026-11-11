<script setup lang="ts">
import { X } from '~/utils/icons';
const { $i18n } = useNuxtApp();
const props = defineProps([
  'folderId',
  'folderName',
  'mode',
]);

const emit = defineEmits([
  'confirm',
  'close',
]);

const modalChangeFolderNameKey = ref(0);
const newFolderName = ref<string>(props.folderName);
const inputRef = ref<HTMLInputElement | null>(null);

const isCreateMode = computed(() => props.mode === 'create' || !props.folderId);
const title = computed(() =>
  isCreateMode.value ? $i18n.t('app.modal_new_folder_title') : $i18n.t('app.modal_change_folder_name_title'),
);

const selectFolderName = () => {
  nextTick(() => {
    inputRef.value?.focus();
    inputRef.value?.select();
  });
};

watch(() => props.folderName, (newVal) => {
  modalChangeFolderNameKey.value++;
  newFolderName.value = newVal;
  selectFolderName();
});

onMounted(selectFolderName);

const isValidate = computed(() => {
  return newFolderName.value.trim().length > 0;
});

const handleConfirmNewFolderName = (e: Event) => {
  if (!isValidate.value) {
    e.preventDefault();
    return;
  }

  emit('confirm', {
    folderId: props.folderId,
    folderNewName: newFolderName.value.trim(),
  });
};

const reset = () => {
  newFolderName.value = props.folderName;
  selectFolderName();
}

defineExpose({
  reset,
});

const handleClickClose = () => {
  emit('close');
}
</script>

<template>
  <dialog id="modal-change-folder-name" :key="modalChangeFolderNameKey" class="ui-modal ui-modal-top">
    <div class="ui-modal-box mx-auto w-5/6 border border-border p-5 lg:w-96 lg:p-6">
      <form method="dialog">
        <button type="button" class="ui-btn ui-btn-sm ui-btn-circle ui-btn-ghost absolute right-3 top-3"
          :aria-label="$t('app.action_close')" :title="$t('app.action_close')" @click="handleClickClose"><X class="h-4 w-4" /></button>
      </form>
      <h3 class="text-[14px] font-semibold pr-8">{{ title }}</h3>
      <div class="pt-4">
        <label class="ui-form-control w-full">
          <div class="ui-label">
            <span class="ui-label-text font-semibold">
              {{ isCreateMode ? $t('app.modal_new_folder_input_title') : $t('app.modal_change_folder_name_input_title') }}
            </span>
          </div>
          <input ref="inputRef" v-model="newFolderName" type="text"
            class="ui-input ui-input-sm ui-input-md ui-input-bordered w-full"
            data-ga-event="folder_rename" @keydown.enter="handleConfirmNewFolderName" autocomplete="off" autofocus />
        </label>

        <div class="ui-modal-action">
          <form method="dialog">
            <button type="button" class="ui-btn ui-btn-sm mr-2" @click="handleClickClose">
              {{ $t('app.modal_change_folder_name_cancel') }}
            </button>
            <button type="button" class="ui-btn ui-btn-sm ui-btn-primary" :disabled="!isValidate"
              @click="handleConfirmNewFolderName">
              {{ isCreateMode ? $t('app.modal_new_folder_ok') : $t('app.modal_change_folder_name_ok') }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </dialog>
</template>
