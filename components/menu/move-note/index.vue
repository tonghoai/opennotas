<script setup lang="ts">
import { Folder } from '~/utils/icons';

const props = defineProps([
  'listFolders',
]);

const emit = defineEmits(['selectFolder']);

const handleClickFolder = (folderId: string) => {
  emit('selectFolder', folderId);
};
</script>

<template>
  <ul role="menu"
    class="ui-menu bg-popover text-popover-foreground rounded-ui w-48 border border-border max-h-72 flex-nowrap overflow-x-hidden overflow-y-auto">
    <li v-if="!props.listFolders.length" class="ui-menu-title">
      <span>{{ $t('app.modal_move_note_empty') }}</span>
    </li>

    <li v-for="folder in props.listFolders" :key="folder.id" data-ga-event="note_move"
      @click="handleClickFolder(folder.id)">
      <a role="menuitem" href="#" class="flex flex-row items-center gap-3" @click.prevent>
        <Folder class="w-4 h-4 shrink-0" />
        <span class="flex items-center justify-center truncate">{{ folder.name }}</span>
      </a>
    </li>
  </ul>
</template>
