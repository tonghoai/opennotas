<script setup lang="ts">
const { $i18n } = useNuxtApp();

const emit = defineEmits([
  'confirmPassword',
  'confirmIgnorePassword',
  'close',
]);

const password = ref<string>('');
const handleConfirmPassword = (e: Event) => {
  e.preventDefault();
  emit('confirmPassword', { password: password.value });
};
const handleIgnorePassword = () => {
  emit('confirmIgnorePassword');
};

const inputPasswordRef = ref<any>(null);
const showFailedPassword = () => {
  showError($i18n.t('app.message_note_unlocked_failed'));

  inputPasswordRef.value.classList.add('animate-shake', 'animate-duration-100', 'input-error');
  setTimeout(() => {
    inputPasswordRef.value.classList.remove('animate-shake', 'animate-duration-100', 'input-error');
  }, 1000);
}

defineExpose({
  showFailedPassword,
});

const handleClickClose = () => {
  emit('close');
}
</script>

<template>
  <dialog id="modal-export-settings-confirm"
    class="modal modal-top lg:modal-middle backdrop:bg-black/10 backdrop:backdrop-blur-sm">
    <div class="modal-box mx-auto p-4 lg:p-6 w-5/6 lg:w-96 border border-base-content/15">
      <form method="dialog">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" @click="handleClickClose">✕</button>
      </form>
      <h3 class="font-bold text-lg">{{ $t('app.modal_export_settings_confirm_title') }}</h3>
      <div class="py-4">
        <div class="text-sm opacity-70 mb-2">{{ $t('app.modal_export_settings_confirm_content') }}</div>
        <div class="form-control w-full max-w-xs">
          <div class="label">
            <span class="label-text">
              {{ $t('app.modal_export_settings_confirm_input_password_title') }}
            </span>
          </div>
          <input ref="inputPasswordRef" v-model="password" type="password"
            :placeholder="$t('app.modal_export_settings_confirm_input_password_title')"
            class="input input-sm lg:btn-md input-bordered w-full" @keydown.enter="handleConfirmPassword"
            autocomplete="off" autofocus />
        </div>

        <div class="modal-action">
          <form method="dialog">
            <button class="btn btn-sm mr-2" @click="handleIgnorePassword">
              {{ $t('app.modal_export_settings_confirm_ignore') }}
            </button>
            <button class="btn btn-sm btn-primary" @click="handleConfirmPassword">
              {{ $t('app.modal_export_settings_confirm_ok') }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </dialog>
</template>
