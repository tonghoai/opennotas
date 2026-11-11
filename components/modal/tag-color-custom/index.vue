<script setup lang="ts">
import { X } from '~/utils/icons';
const emit = defineEmits([
  'confirm',
  'close',
]);

const hexInput = ref<string>('#');
const isValidHex = computed(() => /^#([0-9A-Fa-f]{6})$/.test(hexInput.value));

const handleConfirm = (e: Event) => {
  if (!isValidHex.value) {
    e.preventDefault();
    return;
  }

  emit('confirm', hexInput.value);
};

const handleClickClose = () => {
  emit('close');
}
</script>

<template>
  <dialog id="modal-tag-color-custom" class="ui-modal ui-modal-top">
    <div class="ui-modal-box mx-auto p-5 lg:p-6 w-5/6 lg:w-80 border border-border">
      <form method="dialog">
        <button class="ui-btn ui-btn-sm ui-btn-circle ui-btn-ghost absolute right-3 top-3" @click="handleClickClose"><X class="h-4 w-4" /></button>
      </form>
      <h3 class="text-[14px] font-semibold pr-8">
        {{ $t('app.modal_tag_color_custom_title') }}
      </h3>
      <div class="pt-4 flex items-center gap-3">
        <span class="w-8 h-8 rounded-full shrink-0 border border-border"
          :style="{ backgroundColor: isValidHex ? hexInput : 'transparent' }"></span>
        <input v-model="hexInput" type="text" :placeholder="$t('app.modal_tag_color_custom_placeholder')"
          class="ui-input ui-input-sm ui-input-md ui-input-bordered w-full" @keydown.enter="handleConfirm" autocomplete="off"
          autofocus />
      </div>

      <div class="ui-modal-action">
        <form method="dialog">
          <!-- if there is a button in form, it will close the modal -->
          <button class="ui-btn ui-btn-sm mr-2">{{ $t('app.modal_tag_form_cancel') }}</button>
          <button class="ui-btn ui-btn-sm ui-btn-primary" :disabled="!isValidHex" @click="handleConfirm">{{
            $t('app.modal_tag_form_ok') }}</button>
        </form>
      </div>
    </div>
  </dialog>
</template>
