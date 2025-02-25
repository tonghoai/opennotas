<script setup lang="ts">
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
  <dialog id="modal-insert-link" class="modal modal-top lg:modal-middle">
    <div id="modal-insert-link-content" class="modal-box mx-auto p-4 lg:p-6 w-5/6 lg:w-96">
      <form method="dialog">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" @click="handleClickClose">✕</button>
      </form>

      <h3 class="font-bold text-lg">
        Insert Link
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
          <div class="label"></div>
          <button class="btn btn-sm lg:btn-md btn-primary" :disabled="!isValidate" @click="handleConfirm">
            Confirm
          </button>
        </div>
      </div>
    </div>
  </dialog>
</template>
