<script setup lang="ts">
const props = defineProps(['adapterName', 'fromImport', 'alsoImageSync', 'isLoading']);
const emit = defineEmits(['confirm', 'close']);

const handleConfirm = () => {
  if (props.isLoading) return;
  emit('confirm', props.adapterName);
};
</script>

<template>
  <UiDialog id="modal-confirm-change-adapter" width="24rem" ok-variant="danger" :ok-outline="true"
    :loading="props.isLoading" :title="$t('app.modal_confirm_change_adapter_title')"
    :ok-text="props.isLoading ? $t('app.modal_confirm_change_adapter_processing') : $t('app.modal_confirm_change_adapter_ok')"
    :cancel-text="$t('app.modal_confirm_change_adapter_cancel')" @ok="handleConfirm" @close="emit('close')">
    <div class="text-sm text-foreground/80">
      <template v-if="fromImport">
        {{ $t('app.modal_confirm_change_adapter_import_content') }}
        <span v-if="alsoImageSync">{{ $t('app.modal_confirm_change_adapter_import_also_image_sync') }}</span>
      </template>
      <template v-else>{{ $t('app.modal_confirm_change_adapter_content') }}</template>
    </div>
  </UiDialog>
</template>
