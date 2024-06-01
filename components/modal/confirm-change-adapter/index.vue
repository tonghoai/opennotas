<script setup lang="ts">
const props = defineProps(['adapterName']);
const emit = defineEmits(['confirm']);

const handleConfirm = () => {
  emit('confirm', props.adapterName);
};

</script>

<template>
  <dialog id="modal-confirm-change-adapter" class="modal">
    <div class="modal-box p-4 lg:p-6 w-5/6 lg:w-96">
      <form method="dialog">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
      </form>
      <h3 class="font-bold text-lg">{{ $t('app.modal_confirm_change_adapter_title') }}</h3>
      <div class="pt-4">
        <div>{{ $t('app.modal_confirm_change_adapter_content') }}</div>

        <div class="modal-action">
          <form method="dialog">
            <!-- if there is a button in form, it will close the modal -->
            <button class="btn btn-sm lg:btn-md mr-2">
              {{ $t('app.modal_confirm_change_adapter_cancel') }}
            </button>
            <button class="btn btn-outline btn-sm lg:btn-md btn-error text-error-content" @click="handleConfirm">
              {{ $t('app.modal_confirm_change_adapter_ok') }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </dialog>
</template>
