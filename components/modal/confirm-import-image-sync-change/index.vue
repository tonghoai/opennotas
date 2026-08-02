<script setup lang="ts">
const props = defineProps(['missingCredentials']);
const emit = defineEmits(['confirm', 'close']);

const handleConfirm = () => {
  emit('confirm');
};

const handleClickClose = () => {
  emit('close');
};
</script>

<template>
  <dialog id="modal-confirm-import-image-sync-change"
    class="modal modal-top lg:modal-middle backdrop:bg-black/10 backdrop:backdrop-blur-sm">
    <div class="modal-box p-4 lg:p-6 w-5/6 lg:w-96 border border-base-content/15">
      <form method="dialog">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" @click="handleClickClose">✕</button>
      </form>
      <h3 class="font-bold text-lg">{{ $t('app.confirm_import_image_sync_change_title') }}</h3>
      <div class="pt-4">
        <p class="text-sm text-base-content/70">{{ $t('app.confirm_import_image_sync_change_message') }}</p>
        <p v-if="missingCredentials" class="text-sm text-warning mt-2">
          {{ $t('app.confirm_import_image_sync_change_missing_keys_note') }}
        </p>
        <div class="modal-action">
          <form method="dialog">
            <button class="btn btn-sm mr-2" @click="handleClickClose">
              {{ $t('app.confirm_image_sync_change_cancel') }}
            </button>
            <button class="btn btn-sm btn-warning" @click="handleConfirm">
              {{ $t('app.confirm_image_sync_change_confirm') }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </dialog>
</template>
