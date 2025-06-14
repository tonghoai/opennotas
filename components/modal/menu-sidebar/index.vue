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
    <div class="modal-box p-0 w-5/6 border border-neutral">
      <ul class="menu bg-base-100 rounded-box w-full animate-fade-down animate-duration-100">
        <li class="w-full text-center" @click="handleClickAddFolder">
          <a class="w-full block text-center">{{ $t('app.modal_menu_sidebar_new_folder') }}</a>
        </li>

        <li class="text-rose-500 w-full" @click="handleClickForceSync">
          <a class="w-full block text-center">{{ $t('app.modal_menu_sidebar_sync') }}</a>
        </li>
      </ul>
      <!-- <div class="bg-base-100 shadow-sm rounded">
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
      </div> -->
    </div>
    <form method="dialog" class="modal-backdrop">
      <button>close</button>
    </form>
  </dialog>
</template>
