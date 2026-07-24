<script setup lang="ts">
import Pencil from '~/assets/svg/pencil.svg?component';
import Trash from '~/assets/svg/trash.svg?component';

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
  <ul class="menu bg-base-100 rounded-box w-36 border border-neutral animate-fade-down animate-duration-100">
    <li id="menu-tag-edit" @click="handleClickEditTag">
      <a class="flex flex-row items-center gap-3">
        <Pencil class="w-4 h-4 shrink-0" />
        <span class="flex items-center justify-center">{{ $t('app.menu_tag_edit') }}</span>
      </a>
    </li>

    <li></li>

    <li class="text-rose-500" @click="handleClickDeleteTag">
      <a class="flex flex-row items-center gap-3">
        <Trash class="w-4 h-4 shrink-0" />
        <span class="flex items-center justify-center">{{ $t('app.menu_tag_delete') }}</span>
      </a>
    </li>
  </ul>
</template>
