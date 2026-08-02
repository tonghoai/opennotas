<script setup lang="ts">
const props = defineProps(['isTagsMode']);

const emit = defineEmits([
  'clickAddFolder',
  'clickAddTag',
  'clickForceSync',
]);

const handleClickAdd = () => {
  emit(props.isTagsMode ? 'clickAddTag' : 'clickAddFolder');
}

const handleClickForceSync = () => {
  emit('clickForceSync');
}
</script>

<template>
  <dialog id="modal-menu-sidebar" class="modal backdrop:bg-black/10 backdrop:backdrop-blur-sm">
    <div class="modal-box p-0 w-5/6 border border-base-content/15">
      <ul class="menu bg-base-100 rounded-box w-full animate-fade-down animate-duration-100 gap-1">
        <li class="w-full text-center" @click="handleClickAdd">
          <a class="w-full block text-center">
            {{ props.isTagsMode ? $t('app.modal_menu_sidebar_new_tag') : $t('app.modal_menu_sidebar_new_folder') }}
          </a>
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
