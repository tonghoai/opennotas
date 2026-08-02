<script setup lang="ts">
const props = defineProps(['snapshotId']);

const emit = defineEmits(['confirm', 'close']);

const handleConfirm = () => {
  emit('confirm', props.snapshotId);
};

const handleClickClose = () => {
  emit('close');
};
</script>

<template>
  <dialog id="modal-confirm-delete-note-history" class="modal backdrop:bg-black/10 backdrop:backdrop-blur-sm">
    <div class="modal-box p-4 w-5/6 lg:w-96 lg:p-6 border border-base-content/15">
      <form method="dialog">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" @click="handleClickClose">✕</button>
      </form>
      <h3 class="font-bold text-lg">{{ $t('app.modal_confirm_delete_note_history_title') }}</h3>
      <div class="pt-4">
        <div>{{ $t('app.modal_confirm_delete_note_history_content') }}</div>

        <div class="modal-action">
          <form method="dialog">
            <!-- if there is a button in form, it will close the modal -->
            <button class="btn btn-sm mr-2">
              {{ $t('app.modal_confirm_delete_note_history_cancel') }}
            </button>
            <button class="btn btn-sm btn-primary" @click="handleConfirm">
              {{ $t('app.modal_confirm_delete_note_history_ok') }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </dialog>
</template>
