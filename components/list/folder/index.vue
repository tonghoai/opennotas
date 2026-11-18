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
  'isReorderMode',
]);

const emit = defineEmits(['clickFolderName', 'rightClickFolderName', 'renameFolderName', 'reorderFolderName']);

const handleClickFolderName = (event: Event, folderId: string) => {
  event.preventDefault();
  event.stopPropagation();
  if (props.isReorderMode) return;
  emit('clickFolderName', folderId);
};

const handleRightClickFolderName = (e: any, folderId: string) => {
  e.preventDefault();
  if (props.isReorderMode) return;
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
  if (props.isReorderMode) return;
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  event.stopPropagation();
  emit('clickFolderName', folderId);
};

const settlingFolderId = ref<string>('');
let settleTimer: ReturnType<typeof setTimeout> | null = null;

const onEnd = (event: any) => {
  const droppedId = (event?.item as HTMLElement | null)?.dataset.folderId || '';
  if (settleTimer) clearTimeout(settleTimer);
  settlingFolderId.value = droppedId;
  settleTimer = setTimeout(() => {
    settlingFolderId.value = '';
    settleTimer = null;
  }, 300);
  emit('reorderFolderName', props.listFolders);
};

onBeforeUnmount(() => {
  if (settleTimer) clearTimeout(settleTimer);
});

const folderCount = (folderId: string) => props.folderCounts?.[folderId] ?? 0;
</script>

<template>
  <draggable tag="ul" class="flex flex-col gap-0.5" :handle="'.folder-drag-handle'" :delay="0"
    :disabled="!props.isReorderMode" :list="props.listFolders" :animation="220"
    easing="cubic-bezier(0.22, 1, 0.36, 1)" ghost-class="folder-sort-ghost"
    chosen-class="folder-sort-chosen" drag-class="folder-sort-drag" @end="onEnd" item-key="id">
    <template #item="{ element: folder }">
      <li :key="folder.id" class="group" :data-folder-id="folder.id"
        :class="{ 'folder-drop-settle': settlingFolderId === folder.id }"
        @contextmenu="handleRightClickFolderName($event, folder.id)">
        <div
          class="flex h-9 w-full min-w-0 items-center gap-2.5 overflow-hidden rounded-ui px-2.5 text-[14.5px] transition-colors active:bg-sidebar-active"
          :class="{
            'bg-sidebar-active font-medium text-sidebar-active-foreground': activeFolderId === folder.id,
            'hover:bg-sidebar-accent': activeFolderId !== folder.id,
            'justify-center !px-0': props.collapsed,
            'cursor-grabbing': props.isReorderMode,
          }">
          <div
            role="button" tabindex="0" :aria-current="activeFolderId === folder.id ? 'page' : undefined"
            class="flex min-w-0 flex-1 items-center gap-2.5 rounded-ui text-left"
            :class="{ 'justify-center': props.collapsed, 'cursor-pointer': !props.isReorderMode }"
            :aria-label="props.collapsed ? folder.name : undefined" :title="folder.name"
            data-ga-event="folder_select" @click="handleClickFolderName($event, folder.id)"
            @keydown="handleKeydownFolder($event, folder.id)">
            <Folder class="h-4 w-4 shrink-0 opacity-70" />
            <span v-if="!props.collapsed" class="min-w-0 flex-1 truncate"
              :class="{ 'text-warning-sync': props.actionObjectKeys?.includes(folder.id) }">
              {{ folder.name }}
            </span>
            <span v-if="!props.collapsed && !props.isReorderMode" class="shrink-0 text-[12px] tabular-nums text-muted-foreground">{{ folderCount(folder.id) }}</span>
          </div>
          <button v-if="!props.collapsed && !props.isReorderMode" type="button"
            class="ui-btn ui-btn-ghost ui-btn-xs ui-btn-square -mr-1 opacity-40 group-hover:opacity-100 lg:opacity-0"
            :aria-label="$t('app.note_more')" aria-haspopup="menu" :title="$t('app.note_more')"
            @click.stop="handleRightClickFolderName($event, folder.id)"
            @keydown.stop>
            <MoreHorizontal class="h-3.5 w-3.5" />
          </button>
          <button v-if="!props.collapsed && props.isReorderMode" type="button"
            class="folder-drag-handle ui-btn ui-btn-ghost ui-btn-xs ui-btn-square -mr-1 touch-none"
            :aria-label="$t('app.sidebar_reorder_folders')" :title="$t('app.sidebar_reorder_folders')"
            @click.stop @keydown.stop>
            <UiReorderIcon class="h-3.5 w-3.5" />
          </button>
        </div>
      </li>
    </template>
  </draggable>
</template>

<style>
/* SortableJS moves the original li; style the moving surface separately from
   the drop placeholder so other rows can visibly make room for it. */
.folder-sort-chosen > div,
.folder-sort-drag > div {
  background-color: rgb(var(--ui-card)) !important;
  color: rgb(var(--ui-foreground)) !important;
  box-shadow: var(--ui-shadow-md);
  outline: 1px solid rgb(var(--ui-border-strong) / 0.5);
  cursor: grabbing;
}

.folder-sort-chosen,
.folder-sort-drag {
  position: relative;
  z-index: 2;
}

.folder-sort-ghost {
  opacity: 0.75;
}

.folder-sort-ghost > div {
  background-color: rgb(var(--ui-sidebar-accent)) !important;
  box-shadow: none !important;
  outline: 1px dashed rgb(var(--ui-border-strong) / 0.65);
}

.folder-sort-ghost > div > * {
  visibility: hidden;
}

.folder-drop-settle > div {
  animation: folder-drop-settle 280ms cubic-bezier(0.22, 1.36, 0.36, 1);
}

@keyframes folder-drop-settle {
  0% {
    transform: scale(1.035);
  }
  55% {
    transform: scale(0.99);
  }
  100% {
    transform: scale(1);
  }
}
</style>
