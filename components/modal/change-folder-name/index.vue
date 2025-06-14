<script setup lang="ts">
const props = defineProps([
  'folderId',
  'folderName',
]);

const emit = defineEmits([
  'confirm',
  'close',
]);

const modalChangeFolderNameKey = ref(0);
const newFolderName = ref<string>(props.folderName);
watch(() => props.folderName, (newVal) => {
  modalChangeFolderNameKey.value++;
  newFolderName.value = newVal;
});
const isValidate = computed(() => {
  return newFolderName.value.length > 0;
});

const handleConfirmNewFolderName = (e: Event) => {
  if (!isValidate.value) {
    e.preventDefault();
    return;
  }

  emit('confirm', {
    folderId: props.folderId,
    folderNewName: newFolderName.value,
  });
};

const reset = () => {
  newFolderName.value = props.folderName;
}

defineExpose({
  reset,
});

const handleClickClose = () => {
  emit('close');
}
</script>

<template>
  <dialog id="modal-change-folder-name" :key="modalChangeFolderNameKey" class="modal modal-top lg:modal-middle">
    <div class="modal-box mx-auto p-4 lg:p-6 w-5/6 lg:w-96 border border-neutral">
      <form method="dialog">
        <button class="btn btn-sm lg:btn-md btn-circle btn-ghost absolute right-2 top-2"
          @click="handleClickClose">✕</button>
      </form>
      <h3 class="font-bold text-lg">
        {{ $t('app.modal_change_folder_name_title') }}
      </h3>
      <div class="pt-4">
        <label class="form-control w-full">
          <div class="label">
            <span class="font-semibold label-text">{{ $t('app.modal_change_folder_name_input_title') }}</span>
          </div>
          <input v-model="newFolderName" type="text" class="input input-sm lg:input-md input-bordered w-full"
            @keydown.enter="handleConfirmNewFolderName" autocomplete="off" autofocus />
        </label>

        <div class="modal-action">
          <form method="dialog">
            <!-- if there is a button in form, it will close the modal -->
            <button class="btn btn-sm lg:btn-md mr-2">{{ $t('app.modal_change_folder_name_cancel') }}</button>
            <button class="btn btn-sm lg:btn-md btn-primary" :disabled="!isValidate"
              @click="handleConfirmNewFolderName">{{ $t('app.modal_change_folder_name_ok') }}</button>
          </form>
        </div>
      </div>
    </div>
  </dialog>
</template>
