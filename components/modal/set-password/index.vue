<script setup lang="ts">
import { X } from '~/utils/icons';
const colorMode = useColorMode();
const { $i18n } = useNuxtApp();

const props = defineProps([
  'type',
  'isLoading',
]);

const emit = defineEmits([
  'confirm',
  'close',
]);

const oldPassword = ref<string>('');
const newPassword = ref<string>('');
const confirmPassword = ref<string>('');

const isValidate = computed(() => {
  switch (props.type) {
    case 'set':
      return newPassword.value && confirmPassword.value && newPassword.value === confirmPassword.value;
    case 'change':
      return oldPassword.value && newPassword.value && confirmPassword && newPassword.value === confirmPassword.value;
  }

  return false;
});

const handleConfirmPassword = () => {
  if (!isValidate.value) {
    return;
  }

  switch (props.type) {
    case 'set':
      emit('confirm', { newPassword: newPassword.value });
      break;
    case 'change':
      emit('confirm', {
        oldPassword: oldPassword.value,
        newPassword: newPassword.value,
      });
      break;
  }
};

const inputPasswordRef = ref<any>(null);
const inputOldPasswordRef = ref<any>(null);
const showOldPasswordWrong = () => {
  inputOldPasswordRef.value.classList.add('animate-shake', 'animate-duration-100', 'ui-input-error');
  setTimeout(() => {
    inputOldPasswordRef.value.classList.remove('animate-shake', 'animate-duration-100', 'ui-input-error');
  }, 1000);

  if (!!document.getElementById('modal-set-password')) {
    showErrorSnackbar($i18n.t('app.modal_set_password_old_password_wrong'), document.getElementById('modal-set-password')!);
  }
}

const reset = () => {
  oldPassword.value = '';
  newPassword.value = '';
  confirmPassword.value = '';
}

defineExpose({
  showOldPasswordWrong,
  reset,
});

const handleClickClose = () => {
  if (props.isLoading) {
    return;
  }
  emit('close');
}

onMounted(() => {
  document.getElementById('modal-set-password')?.addEventListener('cancel', (e) => {
    if (props.isLoading) {
      e.preventDefault();
    }
  });
});
</script>

<template>
  <dialog id="modal-set-password"
    class="ui-modal ui-modal-top">
    <div id="modal-set-password-content"
      class="ui-modal-box mx-auto p-5 lg:p-6 w-5/6 lg:w-96 border border-border">
      <form method="dialog">
        <button class="ui-btn ui-btn-sm ui-btn-circle ui-btn-ghost absolute right-3 top-3" :disabled="props.isLoading"
          @click="handleClickClose"><X class="h-4 w-4" /></button>
      </form>
      <h3 class="text-[14px] font-semibold pr-8">
        {{ props.type === 'set' ? $t('app.modal_set_password_title') : $t('app.modal_set_password_change_title') }}
      </h3>
      <div class="py-5">
        <div v-if="props.type !== 'set'" class="ui-form-control w-full">
          <div class="ui-label">
            <span class="font-semibold ui-label-text">{{ $t('app.modal_set_password_old_password_input_title') }}</span>
          </div>
          <input ref="inputOldPasswordRef" v-model="oldPassword" type="password"
            :placeholder="$t('app.modal_set_password_old_password_input_title')"
            class="ui-input ui-input-sm ui-input-md ui-input-bordered w-full" @keydown.enter="handleConfirmPassword"
            autocomplete="off" autofocus />
        </div>

        <div class="ui-form-control w-full pt-2">
          <div class="ui-label">
            <span class="font-semibold ui-label-text">{{ $t('app.modal_set_password_new_password_input_title') }}</span>
          </div>
          <input ref="inputPasswordRef" v-model="newPassword" type="password"
            :placeholder="$t('app.modal_set_password_new_password_input_title')"
            class="ui-input ui-input-sm ui-input-md ui-input-bordered w-full" @keydown.enter="handleConfirmPassword"
            autocomplete="off" autofocus />
        </div>

        <div class="ui-form-control w-full pt-2">
          <div class="ui-label">
            <span class="font-semibold ui-label-text">{{ $t('app.modal_set_password_confirm_password_input_title')
            }}</span>
          </div>
          <input ref="inputPasswordRef" v-model="confirmPassword" type="password"
            :placeholder="$t('app.modal_set_password_confirm_password_input_title')"
            class="ui-input ui-input-sm ui-input-md ui-input-bordered w-full" @keydown.enter="handleConfirmPassword"
            autocomplete="off" autofocus />
        </div>

        <div class="ui-form-control w-full pt-2">
          <div class="ui-label"></div>
          <button class="ui-btn ui-btn-sm ui-btn-primary" :disabled="!isValidate || props.isLoading"
            @click="handleConfirmPassword">
            <span v-if="props.isLoading" class="ui-loading ui-loading-spinner ui-loading-xs"></span>
            {{ props.isLoading ? $t('app.modal_set_password_processing') : $t('app.modal_set_password_ok') }}
          </button>
        </div>
      </div>
    </div>
  </dialog>
</template>
