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
  <div class="border border-base-300 bg-base-100 shadow-sm rounded">
    <ul class="p-1">
      <li id="menu-folder-rename" class="flex px-5 py-1 hover:bg-base-300 rounded-sm cursor-pointer"
        @click="handleClickRenameFolder">
        {{ $t('app.menu_folder_rename') }}
      </li>
      <li>
        <hr class="border-base-300">
      </li>
      <li class="flex px-5 py-1 hover:bg-base-300 rounded-sm cursor-pointer text-rose-500"
        @click="handleClickDeleteFolder">
        {{ $t('app.menu_folder_delete') }}
      </li>
    </ul>
  </div>
</template>
