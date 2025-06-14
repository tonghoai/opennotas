<script setup lang="ts">
import draggable from 'vuedraggable';
import Folder from '../assets/svg/folder.svg?component';
import MoreHorizontal from '../assets/svg/more-horizontal.svg?component';
import Setting from '../assets/svg/settings.svg?component';

const props = defineProps([
  'listFolders',
  'activeFolderId',
  'actionObjectKeys',
]);

const emit = defineEmits(['clickFolderName', 'rightClickFolderName', 'renameFolderName', 'reorderFolderName']);
const handleClickFolderName = (event: Event, folderId: number) => {
  event.preventDefault();
  emit('clickFolderName', folderId);
};
const handleRightClickFolderName = (e: any, folderId: number) => {
  e.preventDefault();

  const x = e.clientX;
  const y = e.clientY;
  emit('rightClickFolderName', { folderId, x, y });
};

const futureIndex = ref<string>('');
const onMoveFolder = ref<string>('');
const onMove = (event: any) => {
  onMoveFolder.value = '';
  futureIndex.value = props.listFolders[event.draggedContext.index].id;

  if (event.draggedContext.futureIndex === 0 || event.draggedContext.index === 0) {
    return false;
  }

  return true;
};

const onEnd = () => {
  onMoveFolder.value = futureIndex.value;
  setTimeout(() => {
    onMoveFolder.value = '';
  }, 500);

  futureIndex.value = '';
  emit('reorderFolderName', props.listFolders);
};
</script>

<template>
  <div class="lg:hidden mt-4 h-32 w-32 m-auto">
    <img :src="'/logo-icon.png'" width="128" height="128" class="mb-4" alt="OpenNotas Logo" />
  </div>

  <ul
    class="menu block w-full p-2 transition-all h-[calc(100vh_-_222px)] overflow-auto lg:h-full lg:overflow-auto">
    <draggable :delay="100" :prevent-on-filter="false" :touch-start-threshold="50" :list="props.listFolders"
      @end="onEnd" :move="onMove" item-key="id">
      <template #item="{ element: folder }">
        <li class="menu-items w-full py-0.5 animate-fade-right animate-duration-100" :key="folder.id" @contextmenu="handleRightClickFolderName($event, folder.id)"
          @click="handleClickFolderName($event, folder.id)">
          <div class="flex flex-row justify-between rounded w-full active:!bg-neutral active:!text-neutral-content"
            :class="{ 'bg-primary text-primary-content hover:bg-primary': activeFolderId === folder.id, 'bg-warning text-warning-content': futureIndex && (futureIndex === folder.id), 'fade-warning-animation': onMoveFolder && (onMoveFolder === folder.id) }"
            :id="'folder-' + folder.id">
            <div class="flex items-baseline w-5/6">
              <div class="w-4 h-4 mr-2">
                <Folder />
              </div>
              <span class="truncate overflow-hidden folder-name"
                :class="{ 'text-warning-sync': props.actionObjectKeys?.includes(folder.id) }" :folderId="folder.id">
                {{ folder.name }}
              </span>
            </div>
            <div class="more-tools" @click.stop="handleRightClickFolderName($event, folder.id)">
              <MoreHorizontal class="press w-3 h-3 opacity-80" />
            </div>
          </div>
        </li>
      </template>
    </draggable>
  </ul>
</template>
<style lang="scss" scoped>
.menu-items:hover .more-tools {
  display: block;
}
</style>
