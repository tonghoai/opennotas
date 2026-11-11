<script setup lang="ts">
import { closeDialogAnimated } from '~/utils/dialog-motion';
import { Pin } from '~/utils/icons';
import { Copy } from '~/utils/icons';
import { FileMove } from '~/utils/icons';
import { Tag } from '~/utils/icons';
import { Info } from '~/utils/icons';
import { History } from '~/utils/icons';
import { Lock } from '~/utils/icons';
import { Restore } from '~/utils/icons';
import { Trash } from '~/utils/icons';
const props = defineProps([
  'noteId',
  'formNotes',
]);

const emit = defineEmits([
  'pinNote',
  'copyNote',
  'clickInfo',
  'clickHistory',
  'clickMove',
  'clickAddToTag',
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
const handleClickInfo = () => {
  emit('clickInfo', props.noteId);
};
const handleClickHistory = () => {
  emit('clickHistory', props.noteId);
};
const handleClickMove = () => {
  emit('clickMove', props.noteId);
};
const handleClickAddToTag = () => {
  emit('clickAddToTag', props.noteId);
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

const handleCancel = () => {
  closeDialogAnimated(document.getElementById('modal-menu-note') as HTMLDialogElement | null);
};
</script>

<template>
  <dialog id="modal-menu-note" class="ui-modal ui-modal-bottom" @cancel.prevent="handleCancel">
    <div class="ui-modal-box p-0">
      <!-- active notes -->
      <ul v-if="!formNotes.deletedAt" class="ui-menu w-full">
        <li data-ga-event="note_pin_toggle" @click="handleClickPinNote(props.formNotes.isPinned)">
          <button type="button">
            <Pin class="h-4 w-4 shrink-0 opacity-80" />
            {{ props.formNotes.isPinned ? $t('app.modal_menu_note_unpin') : $t('app.modal_menu_note_pin') }}
          </button>
        </li>

        <li data-ga-event="note_copy" @click="handleClickCopyNote">
          <button type="button">
            <Copy class="h-4 w-4 shrink-0 opacity-80" />
            {{ $t('app.modal_menu_note_copy') }}
          </button>
        </li>

        <li @click="handleClickMove">
          <button type="button">
            <FileMove class="h-4 w-4 shrink-0 opacity-80" />
            {{ $t('app.modal_menu_note_move') }}
          </button>
        </li>

        <li @click="handleClickAddToTag">
          <button type="button">
            <Tag class="h-4 w-4 shrink-0 opacity-80" />
            {{ $t('app.menu_note_add_to_tag') }}
          </button>
        </li>

        <li @click="handleClickInfo">
          <button type="button">
            <Info class="h-4 w-4 shrink-0 opacity-80" />
            {{ $t('app.modal_menu_note_info') }}
          </button>
        </li>

        <li data-ga-event="note_history_view" @click="handleClickHistory">
          <button type="button">
            <History class="h-4 w-4 shrink-0 opacity-80" />
            {{ $t('app.modal_menu_note_history') }}
          </button>
        </li>

        <li class="my-1 h-px bg-border" aria-hidden="true"></li>

        <li data-ga-event="note_lock_toggle" @click="handleClickLockNote(props.formNotes.isLocked)">
          <button type="button">
            <Lock class="h-4 w-4 shrink-0 opacity-80" />
            {{ props.formNotes.isLocked ? $t('app.modal_menu_note_unlock') : $t('app.modal_menu_note_lock') }}
          </button>
        </li>

        <li class="my-1 h-px bg-border" aria-hidden="true"></li>

        <li class="text-danger" data-ga-event="note_delete" @click="handleClickDeleteNote">
          <button type="button" class="text-danger">
            <Trash class="h-4 w-4 shrink-0" />
            {{ $t('app.modal_menu_note_delete') }}
          </button>
        </li>
      </ul>

      <!-- deleted notes -->
      <ul v-else class="ui-menu w-full">
        <li data-ga-event="note_restore" @click="handleClickRestoreNote">
          <button type="button">
            <Restore class="h-4 w-4 shrink-0 opacity-80" />
            {{ $t('app.modal_menu_note_restore') }}
          </button>
        </li>

        <li data-ga-event="note_copy" @click="handleClickCopyNote">
          <button type="button">
            <Copy class="h-4 w-4 shrink-0 opacity-80" />
            {{ $t('app.modal_menu_note_copy') }}
          </button>
        </li>

        <li @click="handleClickInfo">
          <button type="button">
            <Info class="h-4 w-4 shrink-0 opacity-80" />
            {{ $t('app.modal_menu_note_info') }}
          </button>
        </li>

        <li class="my-1 h-px bg-border" aria-hidden="true"></li>

        <li class="text-danger" data-ga-event="note_delete_forever" @click="handleClickDeleteNoteForever">
          <button type="button" class="text-danger">
            <Trash class="h-4 w-4 shrink-0" />
            {{ $t('app.modal_menu_note_delete_forever') }}
          </button>
        </li>
      </ul>

      <form class="mt-2">
        <button type="button"
          class="flex min-h-11 w-full items-center justify-center rounded-ui border border-border bg-card text-[13px] font-medium text-foreground"
          @click="handleCancel">
          {{ $t('app.action_cancel') }}
        </button>
      </form>
    </div>
    <form class="ui-modal-backdrop" @click.prevent="handleCancel">
      <button type="button">close</button>
    </form>
  </dialog>
</template>
