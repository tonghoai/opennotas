<script setup lang="ts">
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
]);

const handleClickPinNote = (status: number) => {
  emit('pinNote', { noteId: props.noteId, status });
};
const handleClickCopyNote = () => {
  emit('copyNote', props.noteId);
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
        <a>
          {{ props.formNotes.isPinned ? $t('app.menu_note_unpin') : $t('app.menu_note_pin') }}
        </a>
      </li>

      <li class="" @click="handleClickCopyNote">
        <a>
          {{ $t('app.menu_note_copy') }}
        </a>
      </li>

      <li class="" @click="handleClickLockNote(props.formNotes.isLocked)">
        <a>
          {{ props.formNotes.isLocked ? $t('app.menu_note_unlock') : $t('app.menu_note_lock') }}
        </a>
      </li>

      <li class="text-rose-500" @click="handleClickDeleteNote">
        <a>
          {{ $t('app.menu_note_delete') }}
        </a>
      </li>
    </ul>

    <!-- case deleted notes -->
    <ul v-if="formNotes.deletedAt"
      class="menu bg-base-100 rounded-box w-44 border border-neutral animate-fade-down animate-duration-100">
      <li class="" @click="handleClickRestoreNote">
        <a>
          {{ $t('app.menu_note_restore') }}
        </a>
      </li>

      <li class="" @click="handleClickCopyNote">
        <a>
          {{ $t('app.menu_note_copy') }}
        </a>
      </li>

      <li class="text-rose-500" @click="handleClickDeleteNoteForever">
        <a>
          {{ $t('app.menu_note_delete_forever') }}
        </a>
      </li>
    </ul>
  </div>
</template>
