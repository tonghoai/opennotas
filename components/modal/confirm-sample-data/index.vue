<script setup lang="ts">
const emit = defineEmits(['confirm', 'close']);

const handleConfirm = () => {
  emit('confirm');
};
</script>

<template>
  <UiDialog id="modal-confirm-sample-data" width="24rem" :title="$t('app.modal_confirm_sample_data_title')"
    :ok-text="$t('app.modal_confirm_sample_data_ok')" :cancel-text="$t('app.modal_confirm_sample_data_cancel')"
    @ok="handleConfirm" @close="emit('close')">
    <p class="text-sm text-foreground/80">{{ $t('app.modal_confirm_sample_data_content') }}</p>
    <p class="mt-2 text-[12px] leading-5 text-muted-foreground">{{ $t('app.modal_confirm_sample_data_privacy') }}</p>
  </UiDialog>
</template>
