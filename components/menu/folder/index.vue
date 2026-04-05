<script setup lang="ts">
import Pencil from '~/assets/svg/pencil.svg?component';
import Trash from '~/assets/svg/trash.svg?component';

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
  <ul class="menu bg-base-100 rounded-box w-36 border border-neutral animate-fade-down animate-duration-100">
    <li id="menu-folder-rename" @click="handleClickRenameFolder">
      <a class="flex flex-row items-center gap-3">
        <Pencil />
        <span class="flex items-center justify-center">{{ $t('app.menu_folder_rename') }}</span>
      </a>
    </li>

    <li class="text-rose-500" @click="handleClickDeleteFolder">
      <a class="flex flex-row items-center gap-3">
        <Trash />
        <span class="flex items-center justify-center">{{ $t('app.menu_folder_delete') }}</span>
      </a>
    </li>
  </ul>
</template>
