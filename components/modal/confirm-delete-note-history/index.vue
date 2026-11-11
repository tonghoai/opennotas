<script setup lang="ts">
const props = defineProps(['snapshotId']);

const emit = defineEmits(['confirm', 'close']);

const handleConfirm = () => {
  emit('confirm', props.snapshotId);
};
</script>

<template>
  <UiDialog id="modal-confirm-delete-note-history" width="24rem"
    :title="$t('app.modal_confirm_delete_note_history_title')"
    :ok-text="$t('app.modal_confirm_delete_note_history_ok')"
    :cancel-text="$t('app.modal_confirm_delete_note_history_cancel')" @ok="handleConfirm" @close="emit('close')">
    <p class="text-sm text-foreground/80">{{ $t('app.modal_confirm_delete_note_history_content') }}</p>
  </UiDialog>
</template>
