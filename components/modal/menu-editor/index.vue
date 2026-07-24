<script setup lang="ts">
const emit = defineEmits([
  'copyToClipboard',
  'clickInfo',
]);

const handleClickCopy = () => {
  emit('copyToClipboard');
  (document.getElementById('modal-menu-editor') as any)?.close();
};

const handleClickInfo = () => {
  emit('clickInfo');
  (document.getElementById('modal-menu-editor') as any)?.close();
};
</script>

<template>
  <dialog id="modal-menu-editor" class="modal">
    <div class="modal-box p-0 w-5/6 border border-neutral">
      <ul class="menu bg-base-100 rounded-box w-full animate-fade-down animate-duration-100 gap-1">
        <li class="w-full text-center" @click="handleClickCopy">
          <a class="w-full block text-center">{{ $t('app.menu_note_copy') }}</a>
        </li>

        <li class="w-full text-center" @click="handleClickInfo">
          <a class="w-full block text-center">{{ $t('app.toolbar_form_note_info') }}</a>
        </li>
      </ul>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button>close</button>
    </form>
  </dialog>
</template>
