<script setup lang="ts">
import * as Diff from 'diff';
import { getNoteDetail, getNoteHistory } from '~/services/main';

const props = defineProps(['noteId', 'snapshotId']);
const emit = defineEmits(['close']);

const history = ref<any[]>([]);
const currentContent = ref<string>('');

const load = async () => {
  if (!props.noteId) {
    return;
  }

  history.value = await getNoteHistory(props.noteId);
  const note = await getNoteDetail(props.noteId);
  currentContent.value = note?.content || '';
};

watch(() => props.snapshotId, load, { immediate: true });

const selectedSnapshot = computed(() => history.value.find((item: any) => item.id === props.snapshotId));

const diffLines = computed(() => {
  if (!selectedSnapshot.value) {
    return [];
  }

  const parts = Diff.diffLines(selectedSnapshot.value.content, currentContent.value);
  const lines: { type: 'added' | 'removed' | 'context'; text: string }[] = [];

  parts.forEach((part: any) => {
    const type = part.added ? 'added' : part.removed ? 'removed' : 'context';
    const partLines = part.value.split('\n');
    partLines.forEach((line: string, idx: number) => {
      if (idx === partLines.length - 1 && line === '') {
        return;
      }
      lines.push({ type, text: line });
    });
  });

  return lines;
});

const hasChanges = computed(() => diffLines.value.some((line) => line.type !== 'context'));

const handleClickClose = () => {
  emit('close');
};
</script>

<template>
  <dialog id="modal-note-history-diff" class="modal backdrop:bg-black/10 backdrop:backdrop-blur-sm">
    <div class="modal-box w-5/6 lg:w-[36rem] border border-base-content/15">
      <form method="dialog">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" @click="handleClickClose">✕</button>
      </form>
      <h3 class="font-bold text-lg">{{ $t('app.modal_note_history_diff_title') }}</h3>

      <div class="py-4">
        <p v-if="!hasChanges" class="text-center opacity-65 py-4">
          {{ $t('app.modal_note_history_diff_empty') }}
        </p>

        <div v-else class="text-xs overflow-x-auto max-h-96 overflow-y-auto rounded-lg">
          <div v-for="(line, idx) in diffLines" :key="idx" class="flex items-start gap-2 px-1 py-0.5" :class="{
            'bg-success/15': line.type === 'added',
            'bg-error/15': line.type === 'removed',
            'opacity-70': line.type === 'context',
          }">
            <span class="select-none opacity-60 w-3 shrink-0 text-center">{{ line.type === 'added' ? '+' : line.type === 'removed' ? '-' :
              '' }}</span>
            <span class="flex-1 min-w-0 whitespace-pre-wrap">{{ line.text }}</span>
          </div>
        </div>

        <div v-if="hasChanges" class="flex items-center gap-4 mt-2 text-xs opacity-60">
          <span class="flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-sm bg-success/40 shrink-0"></span>
            {{ $t('app.modal_note_history_diff_legend_current') }}
          </span>
          <span class="flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-sm bg-error/40 shrink-0"></span>
            {{ $t('app.modal_note_history_diff_legend_backup') }}
          </span>
        </div>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button>close</button>
    </form>
  </dialog>
</template>
