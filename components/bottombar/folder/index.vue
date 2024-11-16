<script setup lang="ts">
import Trash2 from '../assets/svg/trash-2.svg?component';
import Menu2 from '../assets/svg/menu-2.svg?component';

const props = defineProps([
  'activeFolderId',
  'isSyncing',
]);

const emit = defineEmits([
  'clickUpdateData',
  'clickTrash',
  'clickMenuSidebar',
]);

const handleClickUpdateData = () => {
  emit('clickUpdateData');
};
const refreshRef = ref<HTMLElement | null>(null);
watch(() => props.isSyncing, (value) => {
  if (value) {
    refreshRef.value?.classList.add('spin');
  } else {
    refreshRef.value?.classList.remove('spin');
  }
});

const handleClickTrash = () => {
  emit('clickTrash');
};
const handleClickMenuSidebar = () => {
  emit('clickMenuSidebar');
};
</script>

<template>
  <ul class="menu p-0 w-full lg:border-r lg:border-base-300 lg:p-2">
    <!-- <li class="lg:hidden w-full animate-fade-down animate-duration-200 px-2" key="bottombar-trash"
      @click="handleClickUpdateData">
      <div class="hover:bg-inherit">
        <span class="flex" ref="refreshRef">
          <Refresh class="w-4 h-4" />
        </span>
        <span class="truncate overflow-hidden folder-name">{{ $t('app.bottombar_folder_sync') }}</span>
      </div>
    </li> -->

    <hr class="lg:hidden my-2 border-base-300">

    <li class="flex flex-row gap-2 w-full px-2 lg:px-0 animate-fade-down animate-duration-200" key="bottombar-trash">
      <div class="flex-1 rounded hover:bg-inherit"
        :class="{ 'bg-primary text-primary-content hover:bg-primary': props.activeFolderId === 'bottombar-trash' }"
        @click="handleClickTrash">
        <Trash2 class="w-4 h-4" />
        <span class="truncate overflow-hidden folder-name">{{ $t('app.bottombar_folder_trash') }}</span>
      </div>

      <span class="lg:hidden flex-none animate-fade-down animate-duration-200 px-2 flex items-end"
        @click="handleClickMenuSidebar">
        <span class="flex">
          <Menu2 class="w-4 h-4" />
        </span>
      </span>
    </li>

    <div class="lg:hidden h-2"></div>
  </ul>
</template>
