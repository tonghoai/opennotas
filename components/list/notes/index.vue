<script setup lang="ts">
import Lock from '../assets/svg/lock.svg?component';
import Pin from '../assets/svg/pin.svg?component';
import MoreHorizontal from '../assets/svg/more-horizontal.svg?component';

const props = defineProps([
  'listNotes',
  'activeNoteId',
  'actionObjectKeys',
  'idPulled',
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
</script>

<template>
  <ul class="pb-28 lg:pb-3.5">
    <li v-for="note in props.listNotes" :key="note.id"
      class="menu-items relative w-full animate-fade-right animate-duration-100">

      <div class="w-full lg:p-2 flex justify-between">
        <div class="w-11/12 p-2.5 hover:cursor-pointer lg:bg-base-200 lg:rounded-l-md"
          :class="{ 'lg:bg-primary lg:text-primary-content lg:rounded-l-md': activeNoteId === note.id }"
          @click="handleClickNote(note.id)" @contextmenu="handleRightClickNote($event, note.id)">
          <div class="w-full font-semibold mb-2 select-none truncate overflow-hidden transition-all"
            :class="{ 'italic': note.isLocked, 'text-warning-sync': props.actionObjectKeys?.includes(note.id), 'text-info-sync': props.idPulled?.includes(note.id) }">
            {{ note.title?.trim() || $t('app.list_note_no_title') }}
          </div>
          <div class="w-full select-none truncate overflow-hidden transition-all"
            :class="{ 'italic': note.isLocked, 'text-warning-sync': props.actionObjectKeys?.includes(note.id), 'text-info-sync': props.idPulled?.includes(note.id) }">
            <span class="search-highlight" v-if="note.highlight" v-html="note.highlight"></span>
            <span v-else>{{ note.content?.trim() || $t('app.list_note_no_content') }}</span>
          </div>
        </div>

        <div class="right-menu w-1/12 p-2.5 flex flex-col justify-between lg:bg-base-200 lg:rounded-r-md"
          :class="{ 'lg:bg-primary lg:text-primary-content lg:rounded-r-md': activeNoteId === note.id }">
          <div class="flex justify-end items-end flex-col">
            <Pin class="w-3 h-3 mb-2" v-if="note.isPinned" />
            <Lock class="w-3 h-3" v-if="note.isLocked" />
          </div>
          <div class="flex justify-end items-end flex-col more-tools"
            @click.stop="handleRightClickNote($event, note.id)">
            <MoreHorizontal class="press w-3 h-3 opacity-80" />
          </div>
        </div>
      </div>
    </li>
  </ul>
</template>
<style lang="scss" scoped>
.menu-items:hover .more-tools {
  display: flex;
}
</style>
