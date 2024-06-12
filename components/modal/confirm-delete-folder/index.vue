<script setup lang="ts">
const props = defineProps(['folderId']);

const emit = defineEmits([
  'confirm',
  'close',
]);

const handleConfirm = () => {
  emit('confirm', props.folderId);
};

const handleClickClose = () => {
  emit('close');
}
</script>

<template>
  <dialog id="modal-confirm-delete-folder" class="modal">
    <div class="modal-box p-4 w-5/6 lg:w-96 lg:p-6">
      <form method="dialog">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" @click="handleClickClose">✕</button>
      </form>
      <h3 class="font-bold text-lg">{{ $t('app.modal_confirm_delete_folder_title') }}</h3>
      <div class="pt-4">
        <div>{{ $t('app.modal_confirm_delete_folder_content') }}</div>

        <div class="modal-action">
          <form method="dialog">
            <!-- if there is a button in form, it will close the modal -->
            <button class="btn btn-sm lg:btn-md mr-2">
              {{ $t('app.modal_confirm_delete_folder_cancel') }}
            </button>
            <button class="btn btn-sm lg:btn-md btn-primary" @click="handleConfirm">
              {{ $t('app.modal_confirm_delete_folder_ok') }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </dialog>
</template>
