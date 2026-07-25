<script setup lang="ts">
const props = defineProps(['adapterName', 'fromImport', 'alsoImageSync']);
const emit = defineEmits([
  'confirm',
  'close',
]);

const handleConfirm = () => {
  emit('confirm', props.adapterName);
};

const handleClickClose = () => {
  emit('close');
}
</script>

<template>
  <dialog id="modal-confirm-change-adapter" class="modal backdrop:bg-black/10 backdrop:backdrop-blur-sm">
    <div class="modal-box p-4 lg:p-6 w-5/6 lg:w-96 border border-base-content/15">
      <form method="dialog">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" @click="handleClickClose">✕</button>
      </form>
      <h3 class="font-bold text-lg">{{ $t('app.modal_confirm_change_adapter_title') }}</h3>
      <div class="pt-4">
        <div v-if="fromImport">
          {{ $t('app.modal_confirm_change_adapter_import_content') }}
          <span v-if="alsoImageSync">{{ $t('app.modal_confirm_change_adapter_import_also_image_sync') }}</span>
        </div>
        <div v-else>{{ $t('app.modal_confirm_change_adapter_content') }}</div>

        <div class="modal-action">
          <form method="dialog">
            <!-- if there is a button in form, it will close the modal -->
            <button class="btn btn-sm mr-2">
              {{ $t('app.modal_confirm_change_adapter_cancel') }}
            </button>
            <button class="btn btn-outline btn-sm btn-error text-error-content" @click="handleConfirm">
              {{ $t('app.modal_confirm_change_adapter_ok') }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </dialog>
</template>
