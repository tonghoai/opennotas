<script setup lang="ts">
const emit = defineEmits([
  'clickAddFolder',
  'clickForceSync',
]);

const handleClickAddFolder = () => {
  emit('clickAddFolder');
}

const handleClickForceSync = () => {
  emit('clickForceSync');
}
</script>

<template>
  <dialog id="modal-menu-sidebar" class="modal">
    <div class="modal-box p-0 w-5/6">
      <div class="bg-base-100 shadow-sm rounded">
        <!-- case active notes -->
        <ul class="p-1">
          <li class="flex justify-center px-5 py-2 rounded-sm cursor-pointer" @click="handleClickAddFolder">
            {{ $t('app.modal_menu_sidebar_new_folder') }}
          </li>
          <li>
            <hr class="border-base-300">
          </li>
          <li class="flex justify-center px-5 py-2 text-rose-500 rounded-sm cursor-pointer"
            @click="handleClickForceSync">
            {{ $t('app.modal_menu_sidebar_sync') }}
          </li>
        </ul>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button>close</button>
    </form>
  </dialog>
</template>
