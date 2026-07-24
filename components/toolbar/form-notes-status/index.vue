<script lang="ts" setup>
import localizedFormat from 'dayjs/plugin/localizedFormat';
import dayjs from 'dayjs';

dayjs.extend(localizedFormat);

const props = defineProps([
  'noteId',
  'formNotes',
  'actionObjectKeys',
  'idPulled',
]);

const wordsCount = computed(() => {
  return props.formNotes?.content?.trim() ? props.formNotes.content.trim().split(/\s+/).length : 0;
});

const charactersCount = computed(() => {
  return props.formNotes?.content?.length || 0;
});

const formattedUpdatedAt = computed(() => {
  return props.formNotes?.updatedAt ? dayjs.unix(props.formNotes.updatedAt).format('lll') : '';
});
</script>

<template>
  <div v-if="props.noteId"
    class="flex justify-between items-center gap-4 h-7 px-4 opacity-70 bg-base-100 border-t border-base-300 select-none overflow-hidden">
    <div class="flex items-center gap-3 min-w-0">
      <span class="whitespace-nowrap truncate text-xs font-semibold" :title="formattedUpdatedAt">
        {{ $t('app.status_bar_last_modified') }}: {{ formattedUpdatedAt }}
      </span>
    </div>

    <div class="flex items-center gap-3 min-w-0 shrink-0">
      <span class="whitespace-nowrap text-xs font-semibold">{{ wordsCount }} {{ $t('app.status_bar_words') }}</span>
      <span class="whitespace-nowrap hidden sm:inline text-xs font-semibold">{{ charactersCount }} {{
        $t('app.status_bar_characters')
      }}</span>
    </div>
  </div>
</template>
