<script lang="ts" setup>
import localizedFormat from 'dayjs/plugin/localizedFormat';
import dayjs from 'dayjs';
import { countNoteCharacters, countNoteWords } from '~/utils/note-content';

dayjs.extend(localizedFormat);

const props = defineProps([
  'noteId',
  'formNotes',
  'actionObjectKeys',
  'idPulled',
]);

const wordsCount = computed(() => countNoteWords(props.formNotes?.content));
const charactersCount = computed(() => countNoteCharacters(props.formNotes?.content));

const formattedUpdatedAt = computed(() => {
  return props.formNotes?.updatedAt ? dayjs.unix(props.formNotes.updatedAt).format('lll') : '';
});
</script>

<template>
  <div v-if="props.noteId"
    class="ui-status-bar flex min-h-7 shrink-0 select-none items-center justify-between gap-5
      overflow-hidden border-t border-border bg-card px-4 text-[10.5px] text-muted-foreground">
    <div class="flex min-w-0 items-center gap-2.5">
      <span class="truncate whitespace-nowrap" :title="formattedUpdatedAt">
        {{ $t('app.status_bar_last_modified') }} {{ formattedUpdatedAt }}
      </span>
    </div>

    <div class="flex shrink-0 items-center gap-2.5 tabular-nums">
      <span class="whitespace-nowrap">{{ wordsCount }} {{ $t('app.status_bar_words') }}</span>
      <span class="hidden text-border sm:inline" aria-hidden="true">·</span>
      <span class="hidden whitespace-nowrap sm:inline">{{ charactersCount }} {{ $t('app.status_bar_characters') }}</span>
    </div>
  </div>
</template>

<style scoped>
.ui-status-bar {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
</style>
