<script setup lang="ts">
const emit = defineEmits([
  'confirm',
  'close',
]);
const isValidate = computed(() => !!inputE2eeKey.value);

const inputE2eeKeyKey = ref(0);
const handleClickSubmit = () => {
  inputE2eeKeyKey.value += 1;
  emit('confirm', inputE2eeKey.value);
}

const inputE2eeKey = ref<string>('');
const isGenerateKey = ref<boolean>(false);
const handleClickGenerateKey = async () => {
  const key = await generateKey();
  const keyString = await exportKey(key);
  const keyBase64 = btoa(keyString);
  inputE2eeKey.value = keyBase64;
  isGenerateKey.value = true;
}

const handleClickClose = () => {
  emit('close');
}
</script>

<template>
  <dialog id="modal-confirm-e2ee-key" class="modal modal-top lg:modal-middle">
    <div class="modal-box mx-auto p-4 lg:p-6 w-5/6 lg:w-96">
      <form method="dialog">
        <button class="btn btn-sm lg:btn-md btn-circle btn-ghost absolute right-2 top-2"
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
            v-model="inputE2eeKey" autocomplete="off" autofocus />
          <span class="link link-error mt-2" @click="handleClickGenerateKey">{{
            $t('app.modal_confirm_e2ee_key_generate_key') }}</span>
        </label>

        <div class="modal-action">
          <form method="dialog">
            <button class="btn btn-sm lg:btn-md mr-2">
              {{ $t('app.modal_confirm_e2ee_key_cancel') }}
            </button>
            <button class="btn btn-sm lg:btn-md btn-primary" @click="handleClickSubmit" :disabled="!isValidate">
              {{ $t('app.modal_confirm_e2ee_key_ok') }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </dialog>
</template>
