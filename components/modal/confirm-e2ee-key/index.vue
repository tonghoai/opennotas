<script setup lang="ts">
const props = defineProps({
  isLoading: { type: Boolean, default: false },
  // A new database may generate a fresh key; an existing database must be opened
  // with the key that was used to encrypt its notes.
  allowGenerate: { type: Boolean, default: true },
});
const emit = defineEmits(['confirm', 'close']);

const inputE2eeKeyKey = ref(0);
const inputE2eeKey = ref<string>('');
const isKeyValid = ref<boolean>(false);
const isGenerateKey = ref<boolean>(false);

const handleSubmit = () => {
  if (props.isLoading) return;
  inputE2eeKeyKey.value += 1;
  emit('confirm', inputE2eeKey.value);
};

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

const handleClickGenerateKey = async () => {
  const key = await generateKey();
  const keyString = await exportKey(key);
  inputE2eeKey.value = btoa(keyString);
  isGenerateKey.value = true;
};

const handleClickClose = () => {
  if (props.isLoading) return;
  emit('close');
};
</script>

<template>
  <UiDialog id="modal-confirm-e2ee-key" top width="24rem" :loading="props.isLoading" :show-cancel="false" :show-ok="false"
    :title="$t('app.modal_confirm_e2ee_key_title')" @close="emit('close')">
    <p class="text-sm text-foreground/80">{{ $t('app.modal_confirm_e2ee_key_content') }}</p>

    <label class="ui-form-control mt-4 w-full">
      <input :key="inputE2eeKeyKey" v-model="inputE2eeKey" type="text"
        class="ui-input ui-input-bordered ui-input-sm ui-input-md w-full" :disabled="props.isLoading" autocomplete="off"
        autofocus />
      <span v-if="props.allowGenerate" class="ui-link ui-link-danger mt-2" @click="!props.isLoading && handleClickGenerateKey()">
        {{ $t('app.modal_confirm_e2ee_key_generate_key') }}
      </span>
    </label>

    <template #footer>
      <UiButton variant="default" size="sm" :disabled="props.isLoading" @click="handleClickClose">
        {{ $t('app.modal_confirm_e2ee_key_cancel') }}
      </UiButton>
      <UiButton variant="primary" size="sm" :loading="props.isLoading" :disabled="!isKeyValid || props.isLoading"
        @click="handleSubmit">
        {{ props.isLoading ? $t('app.modal_confirm_e2ee_key_processing') : $t('app.modal_confirm_e2ee_key_ok') }}
      </UiButton>
    </template>
  </UiDialog>
</template>
