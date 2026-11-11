<script setup lang="ts">
import { X } from '~/utils/icons';
const emit = defineEmits([
  'confirm',
  'close',
]);

const url = ref<string>('');
const isValidate = computed(() => {
  return url.value.length > 0;
});

const handleConfirm = () => {
  if (!isValidate.value) {
    return;
  }

  emit('confirm', { url: url.value });
};

const reset = () => {
  url.value = '';
}

const setURL = (urlStr: string) => {
  url.value = urlStr;
}

defineExpose({
  reset,
  setURL,
});

const handleClickClose = () => {
  emit('close');
}
</script>

<template>
  <dialog id="modal-insert-link" class="ui-modal ui-modal-top">
    <div id="modal-insert-link-content"
      class="ui-modal-box mx-auto p-5 lg:p-6 w-5/6 lg:w-96 border border-border">
      <form method="dialog">
        <button class="ui-btn ui-btn-sm ui-btn-circle ui-btn-ghost absolute right-3 top-3" @click="handleClickClose"><X class="h-4 w-4" /></button>
      </form>

      <h3 class="text-[14px] font-semibold pr-8">
        Insert Link
      </h3>

      <div class="py-5">
        <div class="ui-form-control w-full pt-2">
          <div class="ui-label">
            <span class="font-semibold ui-label-text">URL</span>
          </div>
          <input v-model="url" type="text" placeholder="https://"
            class="ui-input ui-input-sm ui-input-md ui-input-bordered w-full" autocomplete="off" autofocus />
        </div>
        <div class="ui-form-control w-full pt-2">
          <div class="ui-label"></div>
          <button class="ui-btn ui-btn-sm ui-btn-primary" :disabled="!isValidate" @click="handleConfirm">
            Confirm
          </button>
        </div>
      </div>
    </div>
  </dialog>
</template>
