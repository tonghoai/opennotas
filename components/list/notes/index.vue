<script setup lang="ts">
import { useVirtualizer } from '@tanstack/vue-virtual';
import { Lock } from '~/utils/icons';
import { Pin } from '~/utils/icons';
import { MoreHorizontal } from '~/utils/icons';
import { Notes } from '~/utils/icons';
import { Trash } from '~/utils/icons';
import { Tag } from '~/utils/icons';
import { Search } from '~/utils/icons';

const { locale } = useI18n();
const { $i18n } = useNuxtApp();

const props = defineProps([
  'listNotes',
  'activeNoteId',
  'actionObjectKeys',
  'idPulled',
  'animateEntrance',
  'emptyState',
  'folders',
  'sortType',
  'hideFolderChip',
  'searchQuery',
  'listLabel',
]);

const emit = defineEmits(['clickNote', 'rightClickNote', 'pinNote', 'deleteNote']);

const emptyView = computed(() => {
  if (props.emptyState === 'search' || props.searchQuery) {
    return {
      icon: Search,
      title: $i18n.t('app.list_empty_search_title', { query: props.searchQuery || '' }),
      description: $i18n.t('app.list_empty_search_desc'),
    };
  }

  if (props.emptyState === 'tags') {
    return {
      icon: Tag,
      title: $i18n.t('app.list_empty_tags_title'),
      description: $i18n.t('app.list_empty_tags_desc'),
    };
  }

  if (props.emptyState === 'tag') {
    return {
      title: $i18n.t('app.list_empty_tag_title'),
      description: $i18n.t('app.list_empty_tag_desc'),
      icon: Tag,
    };
  }

  if (props.emptyState === 'trash') {
    return {
      icon: Trash,
      title: $i18n.t('app.list_empty_trash_title'),
      description: $i18n.t('app.list_empty_trash_desc'),
    };
  }

  return {
    icon: Notes,
    title: $i18n.t('app.list_empty_notes_title'),
    description: $i18n.t('app.list_empty_notes_desc'),
  };
});

const dateLocale = computed(() => (locale.value === 'zhtw' ? 'zh-TW' : locale.value));
const shortDate = computed(() =>
  new Intl.DateTimeFormat(dateLocale.value, { month: 'short', day: 'numeric' }),
);

const folderNameById = computed(() => {
  const map = new Map<string, string>();
  for (const folder of props.folders || []) {
    map.set(folder.id, folder.name);
  }
  return map;
});

// Compact relative timestamps keep the trailing column narrow.
const formatNoteTime = (note: any) => {
  const value = props.sortType === 'createdAt' ? note.createdAt : note.updatedAt;
  const timestamp = (value || note.updatedAt || note.createdAt || 0) * 1000;
  if (!timestamp) return '';

  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;

  return shortDate.value.format(new Date(timestamp));
};

const noteFolderName = (note: any) => {
  if (!note.folderId) return '';
  return folderNameById.value.get(note.folderId) || '';
};

let longPressTimer: ReturnType<typeof setTimeout> | null = null;
let longPressStart = { x: 0, y: 0 };
let didLongPress = false;

// Mobile swipe-to-reveal actions; only one row can be open at a time.
const SWIPE_WIDTH = 92;
const swipedNoteId = ref<string | null>(null);
const swipeOffset = ref(0);
const isSwipeDragging = ref(false);
let swipeStart = { x: 0, y: 0 };
let swipeBaseOffset = 0;
let trackingSwipe = false;
let didSwipe = false;

const clearLongPress = () => {
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
};

const closeSwipe = () => {
  swipedNoteId.value = null;
  swipeOffset.value = 0;
  isSwipeDragging.value = false;
};

const handleTouchStart = (event: TouchEvent, note: any) => {
  const touch = event.touches[0];
  longPressStart = { x: touch.clientX, y: touch.clientY };
  swipeStart = { x: touch.clientX, y: touch.clientY };
  swipeBaseOffset = swipedNoteId.value === note.id ? -SWIPE_WIDTH : 0;
  trackingSwipe = false;
  isSwipeDragging.value = false;

  if (swipedNoteId.value && swipedNoteId.value !== note.id) closeSwipe();

  clearLongPress();
  longPressTimer = setTimeout(() => {
    didLongPress = true;
    closeSwipe();
    emit('rightClickNote', { noteId: note.id, x: touch.clientX, y: touch.clientY });
  }, 520);
};

const handleTouchMove = (event: TouchEvent, note: any) => {
  const touch = event.touches[0];
  const deltaX = touch.clientX - swipeStart.x;
  const deltaY = touch.clientY - swipeStart.y;

  if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) clearLongPress();

  if (!trackingSwipe && Math.abs(deltaX) > 12 && Math.abs(deltaX) > Math.abs(deltaY)) {
    trackingSwipe = true;
    isSwipeDragging.value = true;
  }

  if (!trackingSwipe) return;

  const nextOffset = Math.max(-SWIPE_WIDTH, Math.min(0, swipeBaseOffset + deltaX));
  swipedNoteId.value = note.id;
  swipeOffset.value = nextOffset;
};

const handleTouchEnd = () => {
  clearLongPress();

  if (trackingSwipe) {
    const shouldOpen = swipeOffset.value < -SWIPE_WIDTH / 2;
    swipeOffset.value = shouldOpen ? -SWIPE_WIDTH : 0;
    if (!shouldOpen) swipedNoteId.value = null;
    isSwipeDragging.value = false;
    didSwipe = true;
    setTimeout(() => { didSwipe = false; }, 250);
  }

  trackingSwipe = false;
  setTimeout(() => { didLongPress = false; }, 350);
};

const handleClickNote = (noteId: string) => {
  if (didLongPress || didSwipe) return;
  if (swipedNoteId.value === noteId) {
    closeSwipe();
    return;
  }
  emit('clickNote', noteId, true);
};

const handleSwipePin = (note: any) => {
  closeSwipe();
  emit('pinNote', { noteId: note.id, status: note.isPinned ? 1 : 0 });
};

const handleSwipeDelete = (note: any) => {
  closeSwipe();
  emit('deleteNote', note.id);
};

const handleRightClickNote = (e: any, noteId: string) => {
  e.preventDefault();
  const rect = e?.type === 'contextmenu' ? null : e?.currentTarget?.getBoundingClientRect?.();
  emit('rightClickNote', {
    noteId,
    x: rect ? rect.right : e.clientX,
    y: rect ? rect.top : e.clientY,
    rect,
    trigger: e?.currentTarget || null,
  });
};
const handleKeydownNote = (event: KeyboardEvent, noteId: string) => {
  if (event.key !== 'Enter') return;
  event.preventDefault();
  event.stopPropagation();
  handleClickNote(noteId);
};

// The parent page owns the shared scroller; offset virtual items by its header.
const listRef = ref<HTMLElement | null>(null);
const scrollElement = ref<HTMLElement | null>(null);
const scrollMargin = ref(0);
const measureScrollMargin = () => {
  if (!scrollElement.value || !listRef.value) return;
  const scrollRect = scrollElement.value.getBoundingClientRect();
  const listRect = listRef.value.getBoundingClientRect();
  scrollMargin.value = listRect.top - scrollRect.top + scrollElement.value.scrollTop;
};

let resizeObserver: ResizeObserver | null = null;
onMounted(() => {
  scrollElement.value = document.getElementById('notes-instance');
  measureScrollMargin();

  if (scrollElement.value) {
    resizeObserver = new ResizeObserver(() => measureScrollMargin());
    Array.from(scrollElement.value.children).forEach((child) => {
      if (child !== listRef.value) resizeObserver!.observe(child);
    });
  }
});
onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  clearLongPress();
});

const virtualizer = useVirtualizer(computed(() => ({
  count: props.listNotes.length,
  getScrollElement: () => scrollElement.value,
  estimateSize: () => 60,
  overscan: 10,
  scrollMargin: scrollMargin.value,
  getItemKey: (index: number) => props.listNotes[index]?.id ?? index,
})));

// FlexSearch only injects our own <b> template; render surrounding text as nodes, never v-html.
const parseHighlight = (highlight: string) => {
  return highlight
    .split(/(<b>.*?<\/b>)/g)
    .filter((part) => part !== '')
    .map((part) => {
      if (part.startsWith('<b>') && part.endsWith('</b>')) {
        return { text: part.slice(3, -4), bold: true };
      }
      return { text: part, bold: false };
    });
};

const totalSize = computed(() => virtualizer.value.getTotalSize());
// The list cards are inset 8px from the sides (8px ul padding + 8px row padding).
// Each row also has py-0.5, so 6px here yields an 8px gap above the first card —
// the same inset as the left/right edges.
const listTopPadding = 6;
const listHeight = computed(() => totalSize.value + listTopPadding);
const rows = computed(() => {
  return virtualizer.value.getVirtualItems()
    .map((row) => ({ row, note: props.listNotes[row.index] }))
    .filter((entry) => !!entry.note);
});
</script>

<template>
  <ul ref="listRef" class="relative px-2" role="listbox" :aria-label="props.listLabel || $t('app.list_folder_all')"
    :style="{ height: listHeight + 'px' }">
    <li v-for="{ row, note } in rows" :key="row.key" :data-index="row.index"
      :ref="(el) => el && virtualizer.measureElement(el as Element)" class="absolute left-0 top-0 w-full px-2 py-0.5"
      role="option" :aria-selected="activeNoteId === note.id" :tabindex="activeNoteId === note.id ? 0 : -1"
      @keydown="handleKeydownNote($event, note.id)"
      :style="{ transform: `translateY(${row.start - virtualizer.options.scrollMargin + listTopPadding}px)` }">
      <div :data-note-id="note.id" class="group relative overflow-hidden rounded-ui">
        <div class="absolute inset-y-0 right-0 flex items-center gap-1 pr-1 lg:hidden">
          <button type="button"
            class="flex h-10 w-10 items-center justify-center rounded-ui bg-warning text-warning-foreground"
            :aria-label="note.isPinned ? $t('app.modal_menu_note_unpin') : $t('app.modal_menu_note_pin')"
            @click.stop="handleSwipePin(note)" @keydown.stop>
            <Pin class="h-4 w-4" />
          </button>
          <button type="button"
            class="flex h-10 w-10 items-center justify-center rounded-ui bg-danger text-danger-foreground"
            :aria-label="$t('app.modal_menu_note_delete')" @click.stop="handleSwipeDelete(note)" @keydown.stop>
            <Trash class="h-4 w-4" />
          </button>
        </div>

        <div
          class="relative flex min-h-[58px] w-full touch-pan-y items-stretch text-foreground transition-colors"
          :class="[
            activeNoteId === note.id ? 'bg-selected text-selected-foreground' : 'bg-card hover:bg-accent',
            isSwipeDragging || swipedNoteId !== note.id ? '' : 'transition-transform duration-200'
          ]"
          :style="{ transform: swipedNoteId === note.id ? `translateX(${swipeOffset}px)` : '' }"
          @touchstart.passive="handleTouchStart($event, note)"
          @touchmove.passive="handleTouchMove($event, note)"
          @touchend.passive="handleTouchEnd" @touchcancel.passive="handleTouchEnd">
        <div class="min-w-0 flex-1 cursor-pointer px-2 py-2" data-ga-event="note_select"
          @click="handleClickNote(note.id)" @contextmenu="handleRightClickNote($event, note.id)">
          <div class="flex min-w-0 items-center gap-1.5">
            <Pin v-if="note.isPinned" class="h-3 w-3 shrink-0 text-warning" />
            <Lock v-if="note.isLocked" class="h-3 w-3 shrink-0 text-warning" />
            <span class="min-w-0 truncate text-[14px] font-medium leading-5 select-none"
              :class="{ 'italic': note.isLocked, 'text-warning-sync': props.actionObjectKeys?.includes(note.id), 'text-info-sync': props.idPulled?.includes(note.id) }">
              {{ note.title?.trim() || $t('app.list_note_no_title') }}
            </span>
          </div>

          <div class="mt-0.5 flex min-w-0 items-center gap-1.5 text-[12px] leading-4 select-none"
            :class="activeNoteId === note.id ? 'text-selected-foreground/65' : 'text-muted-foreground'">
            <span v-if="!props.hideFolderChip && noteFolderName(note)"
              class="max-w-24 shrink-0 truncate rounded border border-border bg-card px-1 py-0 text-[10px] leading-4">
              {{ noteFolderName(note) }}
            </span>
            <span v-if="note.highlight" class="search-highlight min-w-0 truncate">
              <template v-for="(seg, idx) in parseHighlight(note.highlight)" :key="idx">
                <b v-if="seg.bold">{{ seg.text }}</b>
                <template v-else>{{ seg.text }}</template>
              </template>
            </span>
            <span v-else class="min-w-0 truncate">{{ note.content?.trim() || $t('app.list_note_no_content') }}</span>
          </div>
        </div>

        <div class="flex shrink-0 items-center gap-1 pr-1.5">
          <span class="text-[11px] tabular-nums"
            :class="activeNoteId === note.id ? 'text-selected-foreground/75' : 'text-muted-foreground'">{{ formatNoteTime(note) }}</span>
          <button type="button"
            class="ui-btn ui-btn-ghost ui-btn-xs ui-btn-square opacity-40 group-hover:opacity-100 lg:opacity-0"
            :aria-label="$t('app.note_more')" aria-haspopup="menu" :title="$t('app.note_more')"
            @click.stop="handleRightClickNote($event, note.id)">
            <MoreHorizontal class="h-3.5 w-3.5" />
          </button>
        </div>
        </div>
      </div>
    </li>
  </ul>

  <div v-if="!props.listNotes.length" class="flex flex-col items-center justify-center gap-3 px-8 py-20 text-center">
    <component :is="emptyView.icon" class="h-10 w-10 opacity-25" />
    <p class="text-[14px] font-medium text-foreground/85">{{ emptyView.title }}</p>
    <p class="max-w-60 text-[12px] leading-5 text-muted-foreground">{{ emptyView.description }}</p>
  </div>

  <div class="list-bottom-spacer" aria-hidden="true"></div>
</template>

<style scoped>
.list-bottom-spacer {
  height: calc(6rem + env(safe-area-inset-bottom, 0px));
}

@media (min-width: 1024px) {
  /* Completes the 8px bottom inset after the row's existing 2px padding. */
  .list-bottom-spacer {
    height: 0.375rem;
  }
}
</style>
