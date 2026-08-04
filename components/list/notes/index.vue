<script setup lang="ts">
import { useVirtualizer } from '@tanstack/vue-virtual';
import Lock from '../assets/svg/lock.svg?component';
import Pin from '../assets/svg/pin.svg?component';
import MoreHorizontal from '../assets/svg/more-horizontal.svg?component';

const props = defineProps([
  'listNotes',
  'activeNoteId',
  'actionObjectKeys',
  'idPulled',
  'animateEntrance',
]);

const emit = defineEmits(['clickNote', 'rightClickNote']);
const handleClickNote = (noteId: number) => {
  emit('clickNote', noteId, true);
};
const handleRightClickNote = (e: any, noteId: number) => {
  e.preventDefault();

  const x = e.clientX;
  const y = e.clientY;
  emit('rightClickNote', { noteId, x, y });
};

// The list scrolls inside #notes-instance (owned by the parent page), which also contains a
// header (ToolbarNotesSecondBar) above this <ul> — scrollMargin tells the virtualizer how far
// down its own content starts within that shared scroll container.
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
});

const virtualizer = useVirtualizer(computed(() => ({
  count: props.listNotes.length,
  getScrollElement: () => scrollElement.value,
  estimateSize: () => 93,
  overscan: 8,
  scrollMargin: scrollMargin.value,
  getItemKey: (index: number) => props.listNotes[index]?.id ?? index,
})));

// FlexSearch's highlight() only ever inserts our own "<b>$1</b>" template around the matched
// term; the surrounding boundary text is raw, unescaped note content. Parsing it into segments
// and rendering them as text nodes (instead of v-html) keeps HTML in note content inert.
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
// Pairs each virtual row with its note and drops any row whose index is momentarily out of
// range (e.g. mid-flush right after the note list shrinks), so the template never touches
// `undefined`.
const rows = computed(() => {
  return virtualizer.value.getVirtualItems()
    .map((row) => ({ row, note: props.listNotes[row.index] }))
    .filter((entry) => !!entry.note);
});
</script>

<template>
  <ul ref="listRef" class="relative" :style="{ height: totalSize + 'px' }">
    <li v-for="{ row, note } in rows" :key="row.key" :data-index="row.index"
      :ref="(el) => el && virtualizer.measureElement(el as Element)" class="absolute top-0 left-0 w-full"
      :style="{ transform: `translateY(${row.start - virtualizer.options.scrollMargin}px)` }">
      <!-- animation class lives on this inner wrapper, not the positioned <li>, because a
      running CSS animation on `transform` (fill-mode) overrides the virtualizer's own
      translateY set above, collapsing every row onto the same spot. -->
      <div class="menu-items relative w-full"
        :class="{ 'animate-fade-right animate-duration-100': props.animateEntrance !== false }">
        <div class="w-full lg:p-2 flex justify-between">
          <div class="w-11/12 p-2.5 hover:cursor-pointer lg:bg-base-200 lg:rounded-l-xl"
            :class="{ 'lg:bg-primary lg:text-primary-content lg:rounded-l-xl': activeNoteId === note.id }"
            data-ga-event="note_select" @click="handleClickNote(note.id)"
            @contextmenu="handleRightClickNote($event, note.id)">
            <div class="w-full font-semibold mb-2 select-none truncate overflow-hidden transition-all"
              :class="{ 'italic': note.isLocked, 'text-warning-sync': props.actionObjectKeys?.includes(note.id), 'text-info-sync': props.idPulled?.includes(note.id) }">
              {{ note.title?.trim() || $t('app.list_note_no_title') }}
            </div>
            <div class="w-full flex items-center gap-1 select-none truncate overflow-hidden transition-all"
              :class="{ 'italic': note.isLocked, 'text-warning-sync': props.actionObjectKeys?.includes(note.id), 'text-info-sync': props.idPulled?.includes(note.id) }">
              <Lock v-if="note.isLocked" class="w-3 h-3 shrink-0 text-warning" />
              <span class="search-highlight truncate" v-if="note.highlight">
                <template v-for="(seg, idx) in parseHighlight(note.highlight)" :key="idx">
                  <b v-if="seg.bold">{{ seg.text }}</b>
                  <template v-else>{{ seg.text }}</template>
                </template>
              </span>
              <span :class="{ 'italic': note.isLocked }" v-else class="truncate min-w-0">{{ note.content?.trim() ||
                $t('app.list_note_no_content')
                }}</span>
            </div>
          </div>

          <div class="right-menu w-1/12 p-2.5 flex flex-col justify-between lg:bg-base-200 lg:rounded-r-xl"
            :class="{ 'lg:bg-primary lg:text-primary-content lg:rounded-r-xl': activeNoteId === note.id }">
            <div class="flex justify-end items-end flex-col">
              <Pin class="w-3 h-3 mb-2 text-error" v-if="note.isPinned" />
              <div v-if="note.tags?.length" class="flex flex-row items-center">
                <span v-for="(tag, idx) in note.tags.slice(0, 3)" :key="tag.id"
                  class="w-3 h-3 rounded-full border border-base-content/15" :class="{ '-ml-1.5': +idx > 0 }"
                  :style="{ backgroundColor: tag.color || '#94a3b8', zIndex: 3 - +idx }"></span>
              </div>
            </div>
            <div class="flex justify-end items-end flex-col more-tools cursor-pointer"
              @click.stop="handleRightClickNote($event, note.id)">
              <MoreHorizontal class="press w-3 h-3 opacity-80" />
            </div>
          </div>
        </div>

        <hr class="ml-2 border-neutral/5">
      </div>
    </li>
  </ul>
  <div class="h-28 lg:h-6" aria-hidden="true"></div>
</template>
<style lang="scss" scoped>
.menu-items:hover .more-tools {
  display: flex;
}
</style>
