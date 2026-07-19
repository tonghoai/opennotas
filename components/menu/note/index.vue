<script setup lang="ts">
import PinV2 from '~/assets/svg/pin-v2.svg?component';
import Copy from '~/assets/svg/copy.svg?component';
import CircleKey from '~/assets/svg/circle-key.svg?component';
import Trash from '~/assets/svg/trash.svg?component';
import Restore from '~/assets/svg/restore.svg?component';
import Info from '~/assets/svg/info.svg?component';
import History from '~/assets/svg/history.svg?component';
import FileMove from '~/assets/svg/file-arrow-right.svg?component';

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
const handleClickMove = () => {
  emit('clickMove', props.noteId);
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
      <li class="px-5 py-1.5 hover:bg-base-300 rounded-lg cursor-pointer"
        @click="handleClickPinNote(props.formNotes.isPinned)">
        {{ props.formNotes.isPinned ? $t('app.menu_note_unpin') : $t('app.menu_note_pin') }}
      </li>

      <li class="px-5 py-1.5 hover:bg-base-300 rounded-lg cursor-pointer" @click="handleClickCopyNote">
        {{ $t('app.menu_note_copy') }}
      </li>

      <li class="px-5 py-1.5 hover:bg-base-300 rounded-lg cursor-pointer"
        @click="handleClickLockNote(props.formNotes.isLocked)">
        {{ props.formNotes.isLocked ? $t('app.menu_note_unlock') : $t('app.menu_note_lock') }}
      </li>

      <li class="px-5 py-1.5 hover:bg-base-300 rounded-lg cursor-pointer text-rose-500" @click="handleClickDeleteNote">
        {{ $t('app.menu_note_delete') }}
      </li>
    </ul> -->

    <ul v-if="!formNotes.deletedAt"
      class="menu bg-base-100 rounded-box w-44 border border-neutral animate-fade-down animate-duration-100">
      <li class="" @click="handleClickPinNote(props.formNotes.isPinned)">
        <a class="flex flex-row items-center gap-3">
          <PinV2 class="w-4 h-4 shrink-0" />
          <span class="flex items-center justify-center">{{ props.formNotes.isPinned ? $t('app.menu_note_unpin') :
            $t('app.menu_note_pin') }}</span>
        </a>
      </li>

      <li class="" @click="handleClickCopyNote">
        <a class="flex flex-row items-center gap-3">
          <Copy class="w-4 h-4 shrink-0" />
          <span class="flex items-center justify-center">{{ $t('app.menu_note_copy') }}</span>
        </a>
      </li>

      <li class="" @click.stop="handleClickMove">
        <a class="flex flex-row items-center gap-3">
          <FileMove class="w-4 h-4 shrink-0" />
          <span class="flex items-center justify-center">{{ $t('app.menu_note_move') }}</span>
        </a>
      </li>

      <li class="" @click="handleClickInfo">
        <a class="flex flex-row items-center gap-3">
          <Info class="w-4 h-4 shrink-0" />
          <span class="flex items-center justify-center">{{ $t('app.menu_note_info') }}</span>
        </a>
      </li>

      <li class="" @click="handleClickHistory">
        <a class="flex flex-row items-center gap-3">
          <History class="w-4 h-4 shrink-0" />
          <span class="flex items-center justify-center">{{ $t('app.menu_note_history') }}</span>
        </a>
      </li>

      <li></li>

      <li class="" @click="handleClickLockNote(props.formNotes.isLocked)">
        <a class="flex flex-row items-center gap-3">
          <CircleKey class="w-4 h-4 shrink-0" />
          <span class="flex items-center justify-center">{{ props.formNotes.isLocked ? $t('app.menu_note_unlock') :
            $t('app.menu_note_lock') }}</span>
        </a>
      </li>

      <li></li>

      <li class="text-rose-500" @click="handleClickDeleteNote">
        <a class="flex flex-row items-center gap-3">
          <Trash class="w-4 h-4 shrink-0" />
          <span class="flex items-center justify-center">{{ $t('app.menu_note_delete') }}</span>
        </a>
      </li>
    </ul>

    <!-- case deleted notes -->
    <ul v-if="formNotes.deletedAt"
      class="menu bg-base-100 rounded-box w-44 border border-neutral animate-fade-down animate-duration-100">
      <li class="" @click="handleClickRestoreNote">
        <a class="flex flex-row items-center gap-3">
          <Restore class="w-4 h-4 shrink-0" />
          <span class="flex items-center justify-center">{{ $t('app.menu_note_restore') }}</span>
        </a>
      </li>

      <li class="" @click="handleClickCopyNote">
        <a class="flex flex-row items-center gap-3">
          <Copy class="w-4 h-4 shrink-0" />
          <span class="flex items-center justify-center">{{ $t('app.menu_note_copy') }}</span>
        </a>
      </li>

      <li class="" @click="handleClickInfo">
        <a class="flex flex-row items-center gap-3">
          <Info class="w-4 h-4 shrink-0" />
          <span class="flex items-center justify-center">{{ $t('app.menu_note_info') }}</span>
        </a>
      </li>

      <li></li>

      <li class="text-rose-500" @click="handleClickDeleteNoteForever">
        <a class="flex flex-row items-center gap-3">
          <Trash class="w-4 h-4 shrink-0" />
          <span class="flex items-center justify-center">{{ $t('app.menu_note_delete_forever') }}</span>
        </a>
      </li>
    </ul>
  </div>
</template>
