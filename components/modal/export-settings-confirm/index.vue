<script setup lang="ts">
import { X } from '~/utils/icons';
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

  inputPasswordRef.value.classList.add('animate-shake', 'animate-duration-100', 'ui-input-error');
  setTimeout(() => {
    inputPasswordRef.value.classList.remove('animate-shake', 'animate-duration-100', 'ui-input-error');
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
    class="ui-modal ui-modal-top">
    <div class="ui-modal-box mx-auto p-5 lg:p-6 w-5/6 lg:w-96 border border-border">
      <form method="dialog">
        <button class="ui-btn ui-btn-sm ui-btn-circle ui-btn-ghost absolute right-3 top-3" @click="handleClickClose"><X class="h-4 w-4" /></button>
      </form>
      <h3 class="text-[14px] font-semibold pr-8">{{ $t('app.modal_export_settings_confirm_title') }}</h3>
      <div class="py-5">
        <div class="text-sm opacity-70 mb-2">{{ $t('app.modal_export_settings_confirm_content') }}</div>
        <div class="ui-form-control w-full max-w-xs">
          <div class="ui-label">
            <span class="ui-label-text">
              {{ $t('app.modal_export_settings_confirm_input_password_title') }}
            </span>
          </div>
          <input ref="inputPasswordRef" v-model="password" type="password"
            :placeholder="$t('app.modal_export_settings_confirm_input_password_title')"
            class="ui-input ui-input-sm ui-btn-md ui-input-bordered w-full" @keydown.enter="handleConfirmPassword"
            autocomplete="off" autofocus />
        </div>

        <div class="ui-modal-action">
          <form method="dialog">
            <button class="ui-btn ui-btn-sm mr-2" @click="handleIgnorePassword">
              {{ $t('app.modal_export_settings_confirm_ignore') }}
            </button>
            <button class="ui-btn ui-btn-sm ui-btn-primary" @click="handleConfirmPassword">
              {{ $t('app.modal_export_settings_confirm_ok') }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </dialog>
</template>
