<script setup lang="ts">
const props = defineProps([
  'folderId',
]);

const emit = defineEmits(['renameFolder', 'deleteFolder']);

const handleClickRenameFolder = () => {
  emit('renameFolder', props.folderId);
};

const handleClickDeleteFolder = () => {
  emit('deleteFolder', props.folderId);
};
</script>

<template>
  <div class="border border-neutral bg-base-100 shadow-sm rounded-lg animate-fade-down animate-duration-100">
    <ul class="px-1.5 py-2">
      <li id="menu-folder-rename" class="px-5 py-1.5 hover:bg-base-300 rounded-lg cursor-pointer"
        @click="handleClickRenameFolder">
        {{ $t('app.menu_folder_rename') }}
      </li>

      <li class="px-5 py-1.5 hover:bg-base-300 rounded-lg cursor-pointer text-rose-500"
        @click="handleClickDeleteFolder">
        {{ $t('app.menu_folder_delete') }}
      </li>
    </ul>
  </div>
</template>
