<script setup lang="ts">
import draggable from 'vuedraggable';
import { Folder } from '~/utils/icons';
import { MoreHorizontal } from '~/utils/icons';

const props = defineProps([
  'listFolders',
  'activeFolderId',
  'actionObjectKeys',
  'folderCounts',
  'collapsed',
]);

const emit = defineEmits(['clickFolderName', 'rightClickFolderName', 'renameFolderName', 'reorderFolderName']);

const handleClickFolderName = (event: Event, folderId: string) => {
  event.preventDefault();
  event.stopPropagation();
  emit('clickFolderName', folderId);
};

const handleRightClickFolderName = (e: any, folderId: string) => {
  e.preventDefault();
  // A keyboard activation of the More button produces a click at 0,0. Pass the
  // trigger rect so desktop menus can anchor correctly in both cases.
  const rect = e?.type === 'contextmenu' ? null : e?.currentTarget?.getBoundingClientRect?.();
  emit('rightClickFolderName', {
    folderId,
    x: rect ? rect.right : e.clientX,
    y: rect ? rect.top : e.clientY,
    rect,
    trigger: e?.currentTarget || null,
  });
};
const handleKeydownFolder = (event: KeyboardEvent, folderId: string) => {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  event.stopPropagation();
  emit('clickFolderName', folderId);
};

const futureIndex = ref<string>('');
const onMoveFolder = ref<string>('');
const onMove = (event: any) => {
  onMoveFolder.value = '';
  futureIndex.value = props.listFolders[event.draggedContext.index]?.id ?? '';

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

const folderCount = (folderId: string) => props.folderCounts?.[folderId] ?? 0;
</script>

<template>
  <draggable tag="ul" class="flex flex-col gap-0.5" :delay="300" :prevent-on-filter="false"
    :touch-start-threshold="50" :list="props.listFolders" @end="onEnd" :move="onMove" item-key="id">
    <template #item="{ element: folder }">
      <li :key="folder.id" class="group" @contextmenu="handleRightClickFolderName($event, folder.id)">
        <div
          role="button" tabindex="0" :aria-current="activeFolderId === folder.id ? 'page' : undefined"
          class="flex h-9 w-full min-w-0 cursor-pointer items-center gap-2.5 overflow-hidden rounded-ui px-2.5 text-[13.5px] transition-colors active:bg-sidebar-active"
          :class="{
            'bg-sidebar-active font-medium text-sidebar-active-foreground': activeFolderId === folder.id,
            'hover:bg-sidebar-accent': activeFolderId !== folder.id,
            'bg-warning text-warning-foreground': futureIndex && (futureIndex === folder.id),
            'fade-warning-animation': onMoveFolder && (onMoveFolder === folder.id),
            'justify-center !px-0': props.collapsed,
          }"
          :aria-label="props.collapsed ? folder.name : undefined" :title="folder.name"
          data-ga-event="folder_select" @click="handleClickFolderName($event, folder.id)"
          @keydown="handleKeydownFolder($event, folder.id)">
          <Folder class="h-4 w-4 shrink-0 opacity-70" />
          <span v-if="!props.collapsed" class="min-w-0 flex-1 truncate"
            :class="{ 'text-warning-sync': props.actionObjectKeys?.includes(folder.id) }">
            {{ folder.name }}
          </span>
          <span v-if="!props.collapsed" class="shrink-0 text-[11px] tabular-nums text-muted-foreground">{{ folderCount(folder.id) }}</span>
          <button v-if="!props.collapsed" type="button"
            class="ui-btn ui-btn-ghost ui-btn-xs ui-btn-square -mr-1 opacity-40 group-hover:opacity-100 lg:opacity-0"
            :aria-label="$t('app.note_more')" aria-haspopup="menu" :title="$t('app.note_more')"
            @click.stop="handleRightClickFolderName($event, folder.id)"
            @keydown.stop>
            <MoreHorizontal class="h-3.5 w-3.5" />
          </button>
        </div>
      </li>
    </template>
  </draggable>
</template>
