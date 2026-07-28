<script setup lang="ts">
const props = defineProps(['isLoading']);
const emit = defineEmits([
  'confirm',
  'close',
]);
const inputE2eeKeyKey = ref(0);
const handleClickSubmit = (e: Event) => {
  e.preventDefault();
  if (props.isLoading) return;
  inputE2eeKeyKey.value += 1;
  emit('confirm', inputE2eeKey.value);
}

const inputE2eeKey = ref<string>('');
const isKeyValid = ref<boolean>(false);
watch(inputE2eeKey, async (val) => {
  if (!val) {
    isKeyValid.value = false;
    return;
  }
  try {
    await importKey(atob(val));
    isKeyValid.value = true;
  } catch {
    isKeyValid.value = false;
  }
}, { immediate: true });

const isGenerateKey = ref<boolean>(false);
const handleClickGenerateKey = async () => {
  const key = await generateKey();
  const keyString = await exportKey(key);
  const keyBase64 = btoa(keyString);
  inputE2eeKey.value = keyBase64;
  isGenerateKey.value = true;
}

const handleClickClose = () => {
  if (props.isLoading) return;
  emit('close');
}

onMounted(() => {
  document.getElementById('modal-confirm-e2ee-key')?.addEventListener('cancel', (e) => {
    if (props.isLoading) {
      e.preventDefault();
    }
  });
});
</script>

<template>
  <dialog id="modal-confirm-e2ee-key"
    class="modal modal-top lg:modal-middle backdrop:bg-black/10 backdrop:backdrop-blur-sm">
    <div class="modal-box mx-auto p-4 lg:p-6 w-5/6 lg:w-96 border border-base-content/15">
      <form method="dialog">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" :disabled="props.isLoading"
          @click="handleClickClose">✕</button>
      </form>
      <h3 class="font-bold text-lg">
        {{ $t('app.modal_confirm_e2ee_key_title') }}
      </h3>
      <div class="pt-4">
        <div>
          {{ $t('app.modal_confirm_e2ee_key_content') }}
        </div>

        <label class="form-control w-full mt-4">
          <input :key="inputE2eeKeyKey" type="text" class="input input-bordered input-sm lg:input-md w-full"
            v-model="inputE2eeKey" :disabled="props.isLoading" autocomplete="off" autofocus />
          <span class="link link-error mt-2" @click="!props.isLoading && handleClickGenerateKey()">{{
            $t('app.modal_confirm_e2ee_key_generate_key') }}</span>
        </label>

        <div class="modal-action">
          <form method="dialog" class="flex">
            <button class="btn btn-sm mr-2" :disabled="props.isLoading">
              {{ $t('app.modal_confirm_e2ee_key_cancel') }}
            </button>
            <button class="btn btn-sm btn-primary" @click="handleClickSubmit"
              :disabled="!isKeyValid || props.isLoading">
              <span v-if="props.isLoading" class="loading loading-spinner loading-xs"></span>
              {{ props.isLoading ? $t('app.modal_confirm_e2ee_key_processing') : $t('app.modal_confirm_e2ee_key_ok') }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </dialog>
</template>
