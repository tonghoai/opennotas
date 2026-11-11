<script setup lang="ts">
import { Pencil } from '~/utils/icons';
import { Trash } from '~/utils/icons';

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
  <ul role="menu" class="ui-menu bg-popover text-popover-foreground rounded-ui w-36 border border-border">
    <li id="menu-folder-rename" @click="handleClickRenameFolder">
      <a role="menuitem" href="#" class="flex flex-row items-center gap-3" @click.prevent>
        <Pencil class="w-4 h-4 shrink-0" />
        <span class="flex items-center justify-center">{{ $t('app.menu_folder_rename') }}</span>
      </a>
    </li>

    <li></li>

    <li class="text-danger" @click="handleClickDeleteFolder">
      <a role="menuitem" href="#" class="flex flex-row items-center gap-3" @click.prevent>
        <Trash class="w-4 h-4 shrink-0" />
        <span class="flex items-center justify-center">{{ $t('app.menu_folder_delete') }}</span>
      </a>
    </li>
  </ul>
</template>
