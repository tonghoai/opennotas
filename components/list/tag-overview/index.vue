<script setup lang="ts">
import { Tag } from '~/utils/icons';
import { Plus } from '~/utils/icons';

const props = defineProps([
  'listTags',
  'tagCounts',
  'actionObjectKeys',
]);

const emit = defineEmits(['clickTagName', 'rightClickTagName', 'clickAddTag']);

const handleClick = (event: Event, tagId: string) => {
  event.preventDefault();
  emit('clickTagName', tagId);
};

const handleKeydown = (event: KeyboardEvent, tagId: string) => {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  emit('clickTagName', tagId);
};

const count = (tagId: string) => props.tagCounts?.[tagId] ?? 0;
</script>

<template>
  <div class="p-4">
    <button v-if="!props.listTags.length" type="button"
      class="flex w-full flex-col items-center justify-center gap-2 rounded-ui border border-dashed border-border px-5 py-12 text-center transition-colors hover:bg-accent"
      @click="emit('clickAddTag')">
      <Tag class="h-8 w-8 text-muted-foreground opacity-40" />
      <span class="text-[13px] font-medium">{{ $t('app.tags_overview_empty') }}</span>
      <span class="max-w-56 text-[12px] leading-5 text-muted-foreground">{{ $t('app.tags_overview_empty_desc') }}</span>
      <span class="mt-1 inline-flex items-center gap-1 text-[12px] font-medium">
        <Plus class="h-3.5 w-3.5" />
        {{ $t('app.sidebar_new') }}
      </span>
    </button>

    <ul v-else class="grid min-w-0 gap-3"
      style="grid-template-columns: repeat(auto-fill, minmax(min(100%, 9rem), 1fr));">
      <li v-for="tag in props.listTags" :key="tag.id" class="min-w-0">
        <div
          class="group flex h-full min-h-16 w-full min-w-0 cursor-pointer items-center gap-3.5 rounded-ui border border-border bg-card px-4 py-3 transition-colors hover:bg-accent active:bg-sidebar-active"
          role="button" tabindex="0" :data-tag-id="tag.id"
          :aria-label="`${tag.name}: ${count(tag.id)}`"
          :class="{ 'text-warning-sync': props.actionObjectKeys?.includes(tag.id) }"
          @click="handleClick($event, tag.id)" @keydown="handleKeydown($event, tag.id)"
          @contextmenu.prevent="emit('rightClickTagName', { tagId: tag.id, x: $event.clientX, y: $event.clientY })">
          <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-ui bg-muted">
            <span class="h-2.5 w-2.5 rounded-full" :style="{ backgroundColor: tag.color || '#94a3b8' }"></span>
          </span>

          <div class="min-w-0 flex-1">
            <p class="line-clamp-2 min-w-0 break-words text-[13px] font-medium leading-4 [overflow-wrap:anywhere]"
              :title="tag.name">{{ tag.name }}</p>
            <p class="mt-0.5 text-[11px] text-muted-foreground">
              {{ count(tag.id) }}
              {{ count(tag.id) === 1 ? $t('app.tags_overview_note_one') : $t('app.tags_overview_note_count') }}
            </p>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>
