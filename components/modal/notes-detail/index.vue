<script setup lang="ts">
import { X } from '~/utils/icons';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import dayjs from 'dayjs';
import { countNoteCharacters, countNoteWords } from '~/utils/note-content';
dayjs.extend(localizedFormat);

const props = defineProps([
  'noteId',
  'noteInfo'
]);

const emit = defineEmits(['close']);

const wordsCount = computed(() => {
  return props.noteInfo?.isLocked ? null : countNoteWords(props.noteInfo?.content);
});

const charactersCount = computed(() => {
  return props.noteInfo?.isLocked ? null : countNoteCharacters(props.noteInfo?.content);
});

const handleClickClose = () => {
  emit('close');
}
</script>

<template>
  <dialog id="modal-notes-detail" class="ui-modal">
    <div class="ui-modal-box w-5/6 lg:w-[30rem] lg:max-w-3xl border border-border">
      <form method="dialog">
        <button class="ui-btn ui-btn-sm ui-btn-circle ui-btn-ghost absolute right-3 top-3" @click="handleClickClose"><X class="h-4 w-4" /></button>
      </form>

      <h3 class="text-[14px] font-semibold pr-8">{{ $t('app.modal_notes_detail_title') }}</h3>
      <div class="pt-4 grid grid-cols-3 gap-4">
        <div class="col-span-1 text-left">
          <p class="mb-1.5 truncate overflow-hidden opacity-65">{{ $t('app.modal_notes_detail_last_sync') }}</p>
          <p class="mb-1.5 truncate overflow-hidden opacity-65">{{ $t('app.modal_notes_detail_last_modified') }}</p>
          <p class="mb-1.5 truncate overflow-hidden opacity-65">{{ $t('app.modal_notes_detail_created_at') }}</p>
          <p class="mb-1.5 truncate overflow-hidden opacity-65">{{ $t('app.modal_notes_detail_word_count') }}</p>
          <p class="mb-1.5 truncate overflow-hidden opacity-65">{{ $t('app.modal_notes_detail_character_count') }}</p>
        </div>
        <div class="col-span-2 text-right">
          <p class="mb-1.5 truncate overflow-hidden">{{ noteInfo.lastSync && dayjs.unix(noteInfo.lastSync).format('lll')
            || 'N/A' }}</p>
          <p class="mb-1.5 truncate overflow-hidden">{{ dayjs.unix(noteInfo.updatedAt).format('lll') }}</p>
          <p class="mb-1.5 truncate overflow-hidden">{{ dayjs.unix(noteInfo.createdAt).format('lll') }}</p>
          <p class="mb-1.5 truncate overflow-hidden">{{ wordsCount ?? '—' }}</p>
          <p class="mb-1.5 truncate overflow-hidden">{{ charactersCount ?? '—' }}</p>
        </div>
      </div>
    </div>
  </dialog>
</template>