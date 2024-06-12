<script setup lang="ts">
const props = defineProps([
  'noteId',
  'formNotes',
]);

const emit = defineEmits([
  'confirmPassword',
  'close',
]);

const password = ref<string>('');
const handleConfirmPassword = () => {
  emit('confirmPassword', { noteId: props.noteId, password: password.value });
};

const inputPasswordRef = ref<any>(null);
const showFailedPassword = () => {
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
};
</script>

<template>
  <dialog id="modal-unlock-notes" class="modal modal-top lg:modal-middle">
    <div class="modal-box mx-auto p-4 lg:p-6 w-5/6 lg:w-96">
      <form method="dialog">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" @click="handleClickClose">✕</button>
      </form>
      <h3 class="font-bold text-lg">{{ $t('app.modal_unlock_notes_title') }}</h3>
      <div class="py-4">
        <div class="form-control w-full max-w-xs">
          <div class="label">
            <span class="label-text">
              {{ $t('app.modal_unlock_notes_input_password_title') }}
            </span>
          </div>
          <input ref="inputPasswordRef" v-model="password" type="password"
            :placeholder="$t('app.modal_unlock_notes_input_password_title')"
            class="input input-sm lg:btn-md input-bordered w-full" @keydown.enter="handleConfirmPassword"
            autocomplete="off" autofocus />
        </div>
      </div>
    </div>
  </dialog>
</template>
