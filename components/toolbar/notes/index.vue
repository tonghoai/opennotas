<script lang="ts" setup>
import { Sort } from '~/utils/icons';
import { Check } from '~/utils/icons';
import { Plus } from '~/utils/icons';

const props = defineProps([
  'title',
  'count',
  'sortType',
  'hideAddButton',
  'searchQuery',
  'hideSort',
]);

const emit = defineEmits([
  'clickAddNote',
  'clickSort',
]);

const { $i18n } = useNuxtApp();
const sortLabel = computed(() =>
  props.sortType === 'createdAt'
    ? $i18n.t('app.list_sort_created')
    : $i18n.t('app.list_sort_edited'),
);

const handleClickAddNote = () => {
  emit('clickAddNote');
};

const handleClickSort = (type: 'createdAt' | 'updatedAt') => {
  emit('clickSort', type);
  (document.activeElement as HTMLElement)?.blur();
};

defineExpose({ sortLabel });
</script>

<template>
  <div class="flex h-12 shrink-0 items-center gap-3 border-b border-border bg-card px-4">
    <div class="flex min-w-0 flex-1 items-baseline gap-2">
      <h1 class="truncate text-[15px] font-semibold leading-5 tracking-tight">{{ props.title }}</h1>
      <span class="shrink-0 text-[11px] tabular-nums text-muted-foreground">{{ props.count }}</span>
      <span v-if="props.searchQuery"
        class="min-w-0 truncate rounded border border-border bg-background px-2 py-0.5 text-[10px] leading-4 text-muted-foreground">
        “{{ props.searchQuery }}”
      </span>
    </div>

    <div v-if="!props.hideSort" class="ui-dropdown ui-dropdown-bottom ui-dropdown-end hidden shrink-0 lg:block">
      <button type="button" tabindex="0"
        class="ui-btn ui-btn-ghost ui-btn-sm text-[12px] text-muted-foreground">
        {{ sortLabel }}
        <Sort class="h-3.5 w-3.5" />
      </button>

      <ul tabindex="0" class="ui-dropdown-content ui-menu ui-menu-sm z-30 w-44">
        <li @click="handleClickSort('updatedAt')">
          <button type="button" class="flex w-full items-center gap-2">
            <Check v-if="props.sortType === 'updatedAt'" class="h-3.5 w-3.5 text-foreground" />
            <span v-else class="h-3.5 w-3.5"></span>
            {{ $t('app.list_sort_edited') }}
          </button>
        </li>
        <li @click="handleClickSort('createdAt')">
          <button type="button" class="flex w-full items-center gap-2">
            <Check v-if="props.sortType === 'createdAt'" class="h-3.5 w-3.5 text-foreground" />
            <span v-else class="h-3.5 w-3.5"></span>
            {{ $t('app.list_sort_created') }}
          </button>
        </li>
      </ul>
    </div>

    <button v-if="!props.hideAddButton" type="button"
      class="ui-btn ui-btn-primary ui-btn-sm ui-btn-square shrink-0"
      :aria-label="$t('app.toolbar_note_add_tooltip')" :title="$t('app.toolbar_note_add_tooltip')"
      data-ga-event="note_create" @click="handleClickAddNote">
      <Plus class="h-4 w-4" />
    </button>
  </div>
</template>
