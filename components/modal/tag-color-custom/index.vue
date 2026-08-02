<script setup lang="ts">
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
  <dialog id="modal-tag-color-custom" class="modal modal-top lg:modal-middle backdrop:bg-black/10 backdrop:backdrop-blur-sm">
    <div class="modal-box mx-auto p-4 lg:p-6 w-5/6 lg:w-80 border border-base-content/15">
      <form method="dialog">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" @click="handleClickClose">✕</button>
      </form>
      <h3 class="font-bold text-lg">
        {{ $t('app.modal_tag_color_custom_title') }}
      </h3>
      <div class="pt-4 flex items-center gap-3">
        <span class="w-8 h-8 rounded-full shrink-0 border border-base-content/20"
          :style="{ backgroundColor: isValidHex ? hexInput : 'transparent' }"></span>
        <input v-model="hexInput" type="text" :placeholder="$t('app.modal_tag_color_custom_placeholder')"
          class="input input-sm lg:input-md input-bordered w-full" @keydown.enter="handleConfirm" autocomplete="off"
          autofocus />
      </div>

      <div class="modal-action">
        <form method="dialog">
          <!-- if there is a button in form, it will close the modal -->
          <button class="btn btn-sm mr-2">{{ $t('app.modal_tag_form_cancel') }}</button>
          <button class="btn btn-sm btn-primary" :disabled="!isValidHex" @click="handleConfirm">{{
            $t('app.modal_tag_form_ok') }}</button>
        </form>
      </div>
    </div>
  </dialog>
</template>
