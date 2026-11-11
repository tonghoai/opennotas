<script setup lang="ts">
const props = defineProps<{ value: string }>();
const emit = defineEmits<{ (e: 'confirm', value: string): void; (e: 'close'): void }>();

const draft = ref(props.value);
watch(() => props.value, (v) => { draft.value = v; });

const handleConfirm = () => emit('confirm', draft.value);
const handleClickClose = () => {
  draft.value = props.value;
  emit('close');
};
</script>

<template>
  <UiDialog id="modal-sync-config" top width="24rem" :show-cancel="false" :show-ok="false"
    :title="$t('app.setting_sync_config_title')" @close="handleClickClose">
    <UiTextarea v-model="draft" :rows="8" class="font-mono text-sm" />

    <template #footer>
      <UiButton variant="default" size="sm" @click="handleClickClose">
        {{ $t('app.modal_sync_config_cancel') }}
      </UiButton>
      <UiButton variant="primary" size="sm" @click="handleConfirm">
        {{ $t('app.setting_sync_adapter_save') }}
      </UiButton>
    </template>
  </UiDialog>
</template>
