<script setup lang="ts">
const colorMode = useColorMode();
const { $i18n } = useNuxtApp();

const props = defineProps([
  'type',
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
  inputOldPasswordRef.value.classList.add('animate-shake', 'animate-duration-100', 'input-error');
  setTimeout(() => {
    inputOldPasswordRef.value.classList.remove('animate-shake', 'animate-duration-100', 'input-error');
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
  emit('close');
}
</script>

<template>
  <dialog id="modal-set-password" class="modal modal-top lg:modal-middle">
    <div id="modal-set-password-content" class="modal-box mx-auto p-4 lg:p-6 w-5/6 lg:w-96">
      <form method="dialog">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" @click="handleClickClose">✕</button>
      </form>
      <h3 class="font-bold text-lg">
        {{ props.type === 'set' ? $t('app.modal_set_password_title') : $t('app.modal_set_password_change_title') }}
      </h3>
      <div class="py-4">
        <div v-if="props.type !== 'set'" class="form-control w-full">
          <div class="div">
            <span class="font-semibold label-text">{{ $t('app.modal_set_password_old_password_input_title') }}</span>
          </div>
          <input ref="inputOldPasswordRef" v-model="oldPassword" type="password"
            :placeholder="$t('app.modal_set_password_old_password_input_title')"
            class="input input-sm lg:input-md input-bordered w-full" @keydown.enter="handleConfirmPassword"
            autocomplete="off" autofocus />
        </div>

        <div class="form-control w-full pt-2">
          <div class="label">
            <span class="font-semibold label-text">{{ $t('app.modal_set_password_new_password_input_title') }}</span>
          </div>
          <input ref="inputPasswordRef" v-model="newPassword" type="password"
            :placeholder="$t('app.modal_set_password_new_password_input_title')"
            class="input input-sm lg:input-md input-bordered w-full" @keydown.enter="handleConfirmPassword"
            autocomplete="off" autofocus />
        </div>

        <div class="form-control w-full pt-2">
          <div class="label">
            <span class="font-semibold label-text">{{ $t('app.modal_set_password_confirm_password_input_title')
              }}</span>
          </div>
          <input ref="inputPasswordRef" v-model="confirmPassword" type="password"
            :placeholder="$t('app.modal_set_password_confirm_password_input_title')"
            class="input input-sm lg:input-md input-bordered w-full" @keydown.enter="handleConfirmPassword"
            autocomplete="off" autofocus />
        </div>

        <div class="form-control w-full pt-2">
          <div class="label"></div>
          <button class="btn btn-sm lg:btn-md btn-primary" :disabled="!isValidate" @click="handleConfirmPassword">
            {{ $t('app.modal_set_password_ok') }}
          </button>
        </div>
      </div>
    </div>
  </dialog>
</template>
