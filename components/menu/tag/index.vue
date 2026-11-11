<script setup lang="ts">
import { Pencil } from '~/utils/icons';
import { Trash } from '~/utils/icons';

const props = defineProps([
  'tagId',
]);

const emit = defineEmits(['editTag', 'deleteTag']);

const handleClickEditTag = () => {
  emit('editTag', props.tagId);
};

const handleClickDeleteTag = () => {
  emit('deleteTag', props.tagId);
};
</script>

<template>
  <ul role="menu" class="ui-menu bg-popover text-popover-foreground rounded-ui w-36 border border-border">
    <li id="menu-tag-edit" @click="handleClickEditTag">
      <a role="menuitem" href="#" class="flex flex-row items-center gap-3" @click.prevent>
        <Pencil class="w-4 h-4 shrink-0" />
        <span class="flex items-center justify-center">{{ $t('app.menu_tag_edit') }}</span>
      </a>
    </li>

    <li></li>

    <li class="text-danger" @click="handleClickDeleteTag">
      <a role="menuitem" href="#" class="flex flex-row items-center gap-3" @click.prevent>
        <Trash class="w-4 h-4 shrink-0" />
        <span class="flex items-center justify-center">{{ $t('app.menu_tag_delete') }}</span>
      </a>
    </li>
  </ul>
</template>
