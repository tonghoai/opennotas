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
  <dialog id="modal-menu-note" class="modal">
    <div class="modal-box p-0 w-5/6">
      <div class="bg-base-100 shadow-sm rounded">
        <!-- case active notes -->
        <ul v-if="!formNotes.deletedAt" class="p-1">
          <li class="flex justify-center px-5 py-2 rounded-sm cursor-pointer"
            @click="handleClickPinNote(props.formNotes.isPinned)">
            {{ props.formNotes.isPinned ? $t('app.modal_menu_note_unpin') : $t('app.modal_menu_note_pin') }}
          </li>
          <li>
            <hr class="border-base-300">
          </li>
          <li class="flex justify-center px-5 py-2 rounded-sm cursor-pointer" @click="handleClickCopyNote">
            {{ $t('app.modal_menu_note_copy') }}
          </li>
          <li>
            <hr class="border-base-300">
          </li>
          <li class="flex justify-center px-5 py-2 rounded-sm cursor-pointer"
            @click="handleClickLockNote(props.formNotes.isLocked)">
            {{ props.formNotes.isLocked ? $t('app.modal_menu_note_unlock') : $t('app.modal_menu_note_lock') }}
          </li>
          <li>
            <hr class="border-base-300">
          </li>
          <li class="flex justify-center px-5 py-2 rounded-sm cursor-pointer text-rose-500"
            @click="handleClickDeleteNote">
            {{ $t('app.modal_menu_note_delete') }}
          </li>
        </ul>

        <!-- case deleted notes -->
        <ul v-if="formNotes.deletedAt" class="p-1">
          <li class="flex justify-center px-5 py-2 rounded-sm cursor-pointer" @click="handleClickRestoreNote">
            {{ $t('app.modal_menu_note_restore') }}
          </li>
          <li>
            <hr class="border-base-300">
          </li>
          <li class="flex justify-center px-5 py-2 rounded-sm cursor-pointer" @click="handleClickCopyNote">
            {{ $t('app.modal_menu_note_copy') }}
          </li>
          <li>
            <hr class="border-base-300">
          </li>
          <li class="flex justify-center px-5 py-2 rounded-sm cursor-pointer text-rose-500"
            @click="handleClickDeleteNoteForever">
            {{ $t('app.modal_menu_note_delete_forever') }}
          </li>
        </ul>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button>close</button>
    </form>
  </dialog>
</template>
