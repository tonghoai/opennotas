<script setup lang="ts">
import Folder from '~/assets/svg/folder.svg?component';

const props = defineProps([
  'listFolders',
]);

const emit = defineEmits(['selectFolder']);

const handleClickFolder = (folderId: string) => {
  emit('selectFolder', folderId);
};
</script>

<template>
  <ul class="menu bg-base-100 rounded-box w-48 border border-neutral animate-fade-down animate-duration-100 max-h-72 flex-nowrap overflow-y-auto">
    <li v-if="!props.listFolders.length" class="menu-title">
      <span>{{ $t('app.modal_move_note_empty') }}</span>
    </li>

    <li v-for="folder in props.listFolders" :key="folder.id" @click="handleClickFolder(folder.id)">
      <a class="flex flex-row items-center gap-3">
        <Folder class="w-4 h-4 shrink-0" />
        <span class="flex items-center justify-center truncate">{{ folder.name }}</span>
      </a>
    </li>
  </ul>
</template>
