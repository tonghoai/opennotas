<script setup lang="ts">
const emit = defineEmits(['confirm', 'close']);

const handleConfirm = () => {
  emit('confirm');
};
</script>

<template>
  <UiDialog id="modal-confirm-image-sync-change" top width="24rem" ok-variant="warning"
    :title="$t('app.confirm_image_sync_change_title')" :ok-text="$t('app.confirm_image_sync_change_confirm')"
    :cancel-text="$t('app.confirm_image_sync_change_cancel')" @ok="handleConfirm" @close="emit('close')">
    <p class="text-sm text-foreground/70">{{ $t('app.confirm_image_sync_change_message') }}</p>
  </UiDialog>
</template>
