<script setup lang="ts">
const emit = defineEmits(['confirm', 'close']);

const handleConfirm = () => {
  emit('confirm');
};

const handleClickClose = () => {
  emit('close');
}
</script>

<template>
  <dialog id="modal-confirm-sample-data" class="modal backdrop:bg-black/10 backdrop:backdrop-blur-sm">
    <div class="modal-box p-4 w-5/6 lg:w-96 lg:p-6 border border-base-content/15">
      <form method="dialog">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" @click="handleClickClose">✕</button>
      </form>
      <h3 class="font-bold text-lg">{{ $t('app.modal_confirm_sample_data_title') }}</h3>
      <div class="pt-4">
        <div>{{ $t('app.modal_confirm_sample_data_content') }}</div>

        <div class="modal-action">
          <form method="dialog">
            <button class="btn btn-sm mr-2" @click="handleClickClose">
              {{ $t('app.modal_confirm_sample_data_cancel') }}
            </button>
            <button class="btn btn-sm btn-primary" @click="handleConfirm">
              {{ $t('app.modal_confirm_sample_data_ok') }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </dialog>
</template>
