<script setup lang="ts">
const props = defineProps(['snapshotId']);

const emit = defineEmits(['confirm', 'close']);

const handleConfirm = () => {
  emit('confirm', props.snapshotId);
};
</script>

<template>
  <UiDialog id="modal-confirm-restore-note-history" width="24rem"
    :title="$t('app.modal_confirm_restore_note_history_title')"
    :ok-text="$t('app.modal_confirm_restore_note_history_ok')"
    :cancel-text="$t('app.modal_confirm_restore_note_history_cancel')" @ok="handleConfirm" @close="emit('close')">
    <p class="text-sm text-foreground/80">{{ $t('app.modal_confirm_restore_note_history_content') }}</p>
    <div class="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
      <span class="flex items-center gap-1.5">
        <span class="h-2.5 w-2.5 shrink-0 rounded-sm bg-success/40"></span>
        {{ $t('app.modal_note_history_diff_legend_current') }}
      </span>
      <span class="flex items-center gap-1.5">
        <span class="h-2.5 w-2.5 shrink-0 rounded-sm bg-danger/40"></span>
        {{ $t('app.modal_note_history_diff_legend_backup') }}
      </span>
    </div>
  </UiDialog>
</template>
