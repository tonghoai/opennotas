<script setup lang="ts">
import Folder from '../assets/svg/folder.svg?component';
import MoreHorizontal from '../assets/svg/more-horizontal.svg?component';

const props = defineProps([
  'listFolders',
  'activeFolderId',
  'actionObjectKeys',
]);

const emit = defineEmits(['clickFolderName', 'rightClickFolderName', 'renameFolderName']);
const handleClickFolderName = (folderId: number) => {
  emit('clickFolderName', folderId);
};
const handleRightClickFolderName = (e: any, folderId: number) => {
  e.preventDefault();

  const x = e.clientX;
  const y = e.clientY;
  emit('rightClickFolderName', { folderId, x, y });
};

</script>

<template>
  <div class="lg:hidden mt-4 h-32 w-32 m-auto">
    <img :src="'/logo-icon.png'" width="128" height="128" class="mb-4" alt="OpenNotas Logo" />
  </div>

  <ul
    class="menu block lg:border-r lg:border-base-300 w-full p-0 p-2 transition-all h-[calc(100vh_-_321px)] overflow-auto lg:h-full lg:overflow-auto">
    <li class="menu-items w-full animate-fade-down animate-duration-200"
      v-for="folder in props.listFolders.filter((item: any) => !item.deletedAt)" :key="folder.id"
      @contextmenu="handleRightClickFolderName($event, folder.id)">
      <div class="flex flex-row justify-between rounded w-full "
        :class="{ 'bg-primary text-primary-content hover:bg-primary': activeFolderId === folder.id }"
        :id="'folder-' + folder.id" @click="handleClickFolderName(folder.id)" @touchstart="handleClickFolderName(folder.id)">
        <div class="flex items-baseline w-5/6">
          <div class="w-4 h-4 mr-2">
            <Folder />
          </div>
          <span class="truncate overflow-hidden folder-name transition-all"
            :class="{ 'text-warning': props.actionObjectKeys?.includes(folder.id) }" :folderId="folder.id">
            {{ folder.name }}
          </span>
        </div>
        <div class="more-tools lg:hidden" @click.stop="handleRightClickFolderName($event, folder.id)">
          <MoreHorizontal class="press w-3 h-3 opacity-80" />
        </div>
      </div>
    </li>
  </ul>
</template>
<style lang="scss" scoped>
.menu-items:hover .more-tools {
  display: block;
}
</style>
