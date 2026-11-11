<script setup lang="ts">
import { PinV2 } from '~/utils/icons';
import { Copy } from '~/utils/icons';
import { CircleKey } from '~/utils/icons';
import { Trash } from '~/utils/icons';
import { Restore } from '~/utils/icons';
import { Info } from '~/utils/icons';
import { History } from '~/utils/icons';
import { FileMove } from '~/utils/icons';
import { Tag } from '~/utils/icons';
import { ChevronRight } from '~/utils/icons';

const props = defineProps([
  'noteId',
  'formNotes',
]);

const emit = defineEmits([
  'pinNote',
  'copyNote',
  'lockNote',
  'deleteNote',
  'restoreNote',
  'deleteNoteForever',
  'clickInfo',
  'clickHistory',
  'clickMove',
  'clickAddToTag',
]);

const handleClickPinNote = (status: number) => {
  emit('pinNote', { noteId: props.noteId, status });
};
const handleClickCopyNote = () => {
  emit('copyNote', props.noteId);
};
const handleClickInfo = () => {
  emit('clickInfo', props.noteId);
};
const handleClickHistory = () => {
  emit('clickHistory', props.noteId);
};
const handleClickMove = (e: MouseEvent) => {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  emit('clickMove', { noteId: props.noteId, rect });
};
const handleClickAddToTag = (e: MouseEvent) => {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  emit('clickAddToTag', { noteId: props.noteId, rect });
};
const handleClickLockNote = (status: number) => {
  emit('lockNote', { noteId: props.noteId, status });
};
const handleClickDeleteNote = () => {
  emit('deleteNote', props.noteId);
};
const handleClickRestoreNote = () => {
  emit('restoreNote', props.noteId);
};
const handleClickDeleteNoteForever = () => {
  emit('deleteNoteForever', props.noteId);
};
</script>

<template>
  <div class="">
    <!-- case active notes -->
    <!-- <ul v-if="!formNotes.deletedAt" class="px-1.5 py-2">
      <li class="px-5 py-1.5 hover:bg-subtle rounded-lg cursor-pointer"
        @click="handleClickPinNote(props.formNotes.isPinned)">
        {{ props.formNotes.isPinned ? $t('app.menu_note_unpin') : $t('app.menu_note_pin') }}
      </li>

      <li class="px-5 py-1.5 hover:bg-subtle rounded-lg cursor-pointer" @click="handleClickCopyNote">
        {{ $t('app.menu_note_copy') }}
      </li>

      <li class="px-5 py-1.5 hover:bg-subtle rounded-lg cursor-pointer"
        @click="handleClickLockNote(props.formNotes.isLocked)">
        {{ props.formNotes.isLocked ? $t('app.menu_note_unlock') : $t('app.menu_note_lock') }}
      </li>

      <li class="px-5 py-1.5 hover:bg-subtle rounded-lg cursor-pointer text-danger" @click="handleClickDeleteNote">
        {{ $t('app.menu_note_delete') }}
      </li>
    </ul> -->

    <ul v-if="!formNotes.deletedAt" role="menu"
      class="ui-menu bg-popover text-popover-foreground rounded-ui w-48 border border-border">
      <li class="" data-ga-event="note_pin_toggle" @click="handleClickPinNote(props.formNotes.isPinned)">
        <a role="menuitem" href="#" class="flex flex-row items-center gap-3" @click.prevent>
          <PinV2 class="w-4 h-4 shrink-0" />
          <span class="flex items-center justify-center">{{ props.formNotes.isPinned ? $t('app.menu_note_unpin') :
            $t('app.menu_note_pin') }}</span>
        </a>
      </li>

      <li class="" data-ga-event="note_copy" @click="handleClickCopyNote">
        <a role="menuitem" href="#" class="flex flex-row items-center gap-3" @click.prevent>
          <Copy class="w-4 h-4 shrink-0" />
          <span class="flex items-center justify-center">{{ $t('app.menu_note_copy') }}</span>
        </a>
      </li>

      <li class="" data-menu-keep-open @click.stop="handleClickMove($event)">
        <a role="menuitem" href="#" class="flex flex-row items-center justify-between gap-3" @click.prevent>
          <span class="flex flex-row items-center gap-3">
            <FileMove class="w-4 h-4 shrink-0" />
            <span class="flex items-center justify-center">{{ $t('app.menu_note_move') }}</span>
          </span>
          <ChevronRight class="w-3.5 h-3.5 shrink-0" />
        </a>
      </li>

      <li class="" data-menu-keep-open @click.stop="handleClickAddToTag($event)">
        <a role="menuitem" href="#" class="flex flex-row items-center justify-between gap-3" @click.prevent>
          <span class="flex flex-row items-center gap-3">
            <Tag class="w-4 h-4 shrink-0" />
            <span class="flex items-center justify-center">{{ $t('app.menu_note_add_to_tag') }}</span>
          </span>
          <ChevronRight class="w-3.5 h-3.5 shrink-0" />
        </a>
      </li>

      <li class="" @click="handleClickInfo">
        <a role="menuitem" href="#" class="flex flex-row items-center gap-3" @click.prevent>
          <Info class="w-4 h-4 shrink-0" />
          <span class="flex items-center justify-center">{{ $t('app.menu_note_info') }}</span>
        </a>
      </li>

      <li class="" data-ga-event="note_history_view" @click="handleClickHistory">
        <a role="menuitem" href="#" class="flex flex-row items-center gap-3" @click.prevent>
          <History class="w-4 h-4 shrink-0" />
          <span class="flex items-center justify-center">{{ $t('app.menu_note_history') }}</span>
        </a>
      </li>

      <li></li>

      <li class="" data-ga-event="note_lock_toggle" @click="handleClickLockNote(props.formNotes.isLocked)">
        <a role="menuitem" href="#" class="flex flex-row items-center gap-3" @click.prevent>
          <CircleKey class="w-4 h-4 shrink-0" />
          <span class="flex items-center justify-center">{{ props.formNotes.isLocked ? $t('app.menu_note_unlock') :
            $t('app.menu_note_lock') }}</span>
        </a>
      </li>

      <li></li>

      <li class="text-danger" data-ga-event="note_delete" @click="handleClickDeleteNote">
        <a role="menuitem" href="#" class="flex flex-row items-center gap-3" @click.prevent>
          <Trash class="w-4 h-4 shrink-0" />
          <span class="flex items-center justify-center">{{ $t('app.menu_note_delete') }}</span>
        </a>
      </li>
    </ul>

    <!-- case deleted notes -->
    <ul v-if="formNotes.deletedAt" role="menu"
      class="ui-menu bg-popover text-popover-foreground rounded-ui w-44 border border-border">
      <li class="" data-ga-event="note_restore" @click="handleClickRestoreNote">
        <a role="menuitem" href="#" class="flex flex-row items-center gap-3" @click.prevent>
          <Restore class="w-4 h-4 shrink-0" />
          <span class="flex items-center justify-center">{{ $t('app.menu_note_restore') }}</span>
        </a>
      </li>

      <li class="" data-ga-event="note_copy" @click="handleClickCopyNote">
        <a role="menuitem" href="#" class="flex flex-row items-center gap-3" @click.prevent>
          <Copy class="w-4 h-4 shrink-0" />
          <span class="flex items-center justify-center">{{ $t('app.menu_note_copy') }}</span>
        </a>
      </li>

      <li class="" @click="handleClickInfo">
        <a role="menuitem" href="#" class="flex flex-row items-center gap-3" @click.prevent>
          <Info class="w-4 h-4 shrink-0" />
          <span class="flex items-center justify-center">{{ $t('app.menu_note_info') }}</span>
        </a>
      </li>

      <li></li>

      <li class="text-danger" data-ga-event="note_delete_forever" @click="handleClickDeleteNoteForever">
        <a role="menuitem" href="#" class="flex flex-row items-center gap-3" @click.prevent>
          <Trash class="w-4 h-4 shrink-0" />
          <span class="flex items-center justify-center">{{ $t('app.menu_note_delete_forever') }}</span>
        </a>
      </li>
    </ul>
  </div>
</template>
