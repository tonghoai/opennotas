<script setup lang="ts">
const emit = defineEmits([
  'confirm',
  'close',
]);

const { $i18n } = useNuxtApp();

const url = ref<string>('');
const alt = ref<string>('');
const isValidate = computed(() => {
  return url.value.length > 0;
});

const handleConfirm = () => {
  if (!isValidate.value) {
    return;
  }

  emit('confirm', { url: url.value, alt: alt.value });
};

const reset = () => {
  url.value = '';
  alt.value = '';
}

const setURL = ({ url: urlStr, alt: altStr }: { url: string, alt: string }) => {
  url.value = urlStr;
  alt.value = altStr;
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
  <dialog id="modal-insert-image" class="modal modal-top lg:modal-middle">
    <div id="modal-insert-image-content" class="modal-box mx-auto p-4 lg:p-6 w-5/6 lg:w-96 border border-neutral">
      <form method="dialog">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" @click="handleClickClose">✕</button>
      </form>

      <h3 class="font-bold text-lg">
        {{ $i18n.t('app.modal_insert_image_title') }}
      </h3>

      <div class="py-4">
        <div class="form-control w-full pt-2">
          <div class="label">
            <span class="font-semibold label-text">URL</span>
          </div>
          <input v-model="url" type="text" placeholder="https://"
            class="input input-sm lg:input-md input-bordered w-full" autocomplete="off" autofocus />
        </div>
        <div class="form-control w-full pt-2">
          <div class="label">
            <span class="font-semibold label-text">Alt</span>
          </div>
          <input v-model="alt" type="text" placeholder="" class="input input-sm lg:input-md input-bordered w-full"
            autocomplete="off" autofocus />
        </div>
        <div class="form-control w-full pt-2">
          <div class="label"></div>
          <button class="btn btn-sm lg:btn-md btn-primary" :disabled="!isValidate" @click="handleConfirm">
            {{ $i18n.t('app.modal_insert_image_ok') }}
          </button>
        </div>
      </div>
    </div>
  </dialog>
</template>
