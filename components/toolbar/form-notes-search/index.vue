<script setup lang="ts">
import { Search } from '~/utils/icons';
import { ChevronRight } from '~/utils/icons';
import { X } from '~/utils/icons';

const props = defineProps([
  'modelValue',
  'matchCurrent',
  'matchTotal',
]);

const emit = defineEmits([
  'update:modelValue',
  'next',
  'prev',
  'close',
]);

const query = computed({
  get: () => props.modelValue,
  set: (value: string) => emit('update:modelValue', value),
});

const inputRef = ref<HTMLInputElement | null>(null);
onMounted(() => {
  setTimeout(() => {
    inputRef.value?.focus();
  }, 100);
});

defineExpose({
  focusInput: () => inputRef.value?.focus(),
});
</script>

<template>
  <div class="flex items-center gap-2 border-b border-border bg-card p-2">
    <label class="ui-input ui-input-sm flex-1 flex items-center gap-2 rounded-lg border-none bg-muted">
      <Search class="w-4 h-4 opacity-50 flex-none" />
      <input ref="inputRef" type="text" class="grow bg-transparent"
        :placeholder="$t('app.form_note_search_placeholder')" autocomplete="off" v-model="query"
        @keydown.enter.exact.prevent="emit('next')" @keydown.enter.shift.prevent="emit('prev')"
        @keydown.esc.prevent="emit('close')" />
      <span v-if="modelValue" class="text-xs opacity-50 flex-none">
        {{ matchTotal ? `${matchCurrent}/${matchTotal}` : $t('app.form_note_search_no_results') }}
      </span>
    </label>

    <button type="button" class="ui-btn ui-btn-ghost ui-btn-circle ui-btn-sm press" :disabled="!matchTotal"
      :aria-label="$t('app.form_note_search_prev_tooltip')" :title="$t('app.form_note_search_prev_tooltip')"
      @click="emit('prev')">
      <ChevronRight class="w-4 h-4 -rotate-90" />
    </button>
    <button type="button" class="ui-btn ui-btn-ghost ui-btn-circle ui-btn-sm press" :disabled="!matchTotal"
      :aria-label="$t('app.form_note_search_next_tooltip')" :title="$t('app.form_note_search_next_tooltip')"
      @click="emit('next')">
      <ChevronRight class="w-4 h-4 rotate-90" />
    </button>
    <button type="button" class="ui-btn ui-btn-ghost ui-btn-circle ui-btn-sm press"
      :aria-label="$t('app.form_note_search_close_tooltip')" :title="$t('app.form_note_search_close_tooltip')"
      @click="emit('close')">
      <X class="w-4 h-4" />
    </button>
  </div>
</template>
