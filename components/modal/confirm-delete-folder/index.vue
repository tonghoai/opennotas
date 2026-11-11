<script setup lang="ts">
const props = defineProps(['folderId']);

const emit = defineEmits(['confirm', 'close']);

const handleConfirm = () => {
  emit('confirm', props.folderId);
};
</script>

<template>
  <UiDialog id="modal-confirm-delete-folder" width="24rem" :title="$t('app.modal_confirm_delete_folder_title')"
    :ok-text="$t('app.modal_confirm_delete_folder_ok')" :cancel-text="$t('app.modal_confirm_delete_folder_cancel')"
    @ok="handleConfirm" @close="emit('close')">
    <p class="text-sm text-foreground/80">{{ $t('app.modal_confirm_delete_folder_content') }}</p>
  </UiDialog>
</template>
