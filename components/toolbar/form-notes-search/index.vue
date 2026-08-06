<script setup lang="ts">
import Search from '~/assets/svg/search.svg?component';
import ChevronRight from '~/assets/svg/chevron-right.svg?component';
import X from '~/assets/svg/x.svg?component';

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
  <div class="p-2 flex items-center gap-2 bg-base-100 border-b border-base-300">
    <label class="input input-sm flex-1 flex items-center gap-2 rounded-lg border-none bg-base-200">
      <Search class="w-4 h-4 opacity-50 flex-none" />
      <input ref="inputRef" type="text" class="grow bg-transparent"
        :placeholder="$t('app.form_note_search_placeholder')" autocomplete="off" v-model="query"
        @keydown.enter.exact.prevent="emit('next')" @keydown.enter.shift.prevent="emit('prev')"
        @keydown.esc.prevent="emit('close')" />
      <span v-if="modelValue" class="text-xs opacity-50 flex-none">
        {{ matchTotal ? `${matchCurrent}/${matchTotal}` : $t('app.form_note_search_no_results') }}
      </span>
    </label>

    <button class="btn btn-ghost btn-circle btn-sm press" :disabled="!matchTotal"
      :title="$t('app.form_note_search_prev_tooltip')" @click="emit('prev')">
      <ChevronRight class="w-4 h-4 -rotate-90" />
    </button>
    <button class="btn btn-ghost btn-circle btn-sm press" :disabled="!matchTotal"
      :title="$t('app.form_note_search_next_tooltip')" @click="emit('next')">
      <ChevronRight class="w-4 h-4 rotate-90" />
    </button>
    <button class="btn btn-ghost btn-circle btn-sm press" :title="$t('app.form_note_search_close_tooltip')"
      @click="emit('close')">
      <X class="w-4 h-4" />
    </button>
  </div>
</template>
