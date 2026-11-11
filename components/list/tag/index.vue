<script setup lang="ts">
import { MoreHorizontal } from '~/utils/icons';
import { Plus } from '~/utils/icons';

const props = defineProps([
  'listTags',
  'activeTagId',
  'actionObjectKeys',
  'tagCounts',
  'collapsed',
]);

const emit = defineEmits(['clickTagName', 'rightClickTagName', 'clickAddTag']);

const handleClickTagName = (event: Event, tagId: string) => {
  event.preventDefault();
  event.stopPropagation();
  emit('clickTagName', tagId);
};

const handleRightClickTagName = (e: any, tagId: string) => {
  e.preventDefault();
  const rect = e?.type === 'contextmenu' ? null : e?.currentTarget?.getBoundingClientRect?.();
  emit('rightClickTagName', {
    tagId,
    x: rect ? rect.right : e.clientX,
    y: rect ? rect.top : e.clientY,
    rect,
    trigger: e?.currentTarget || null,
  });
};
const handleKeydownTag = (event: KeyboardEvent, tagId: string) => {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  event.stopPropagation();
  emit('clickTagName', tagId);
};
</script>

<template>
  <ul class="flex flex-col gap-0.5">
    <li v-if="!props.listTags.length" class="group">
      <button type="button"
        class="flex h-9 w-full items-center gap-2.5 rounded-ui px-2.5 text-[13.5px] text-muted-foreground hover:bg-sidebar-accent"
        @click="emit('clickAddTag')">
        <span
          class="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-dashed border-input">
          <Plus class="h-2.5 w-2.5" />
        </span>
        <span class="truncate">{{ $t('app.list_tag_empty') }}</span>
      </button>
    </li>

    <li v-for="tag in props.listTags" :key="tag.id" class="group"
      @contextmenu="handleRightClickTagName($event, tag.id)">
      <div
        role="button" tabindex="0" :aria-current="activeTagId === tag.id ? 'page' : undefined"
        class="flex h-9 w-full min-w-0 cursor-pointer items-center gap-2.5 overflow-hidden rounded-ui px-2.5 text-[13.5px] transition-colors active:bg-sidebar-active"
        :class="{
          'bg-sidebar-active font-medium text-sidebar-active-foreground': activeTagId === tag.id,
          'hover:bg-sidebar-accent': activeTagId !== tag.id,
          'justify-center !px-0': props.collapsed,
        }"
        :aria-label="props.collapsed ? tag.name : undefined" :title="tag.name"
        :id="'tag-' + tag.id" data-ga-event="tag_select" @click="handleClickTagName($event, tag.id)"
        @keydown="handleKeydownTag($event, tag.id)">
        <span class="h-2.5 w-2.5 shrink-0 rounded-full" :style="{ backgroundColor: tag.color || '#94a3b8' }"></span>
        <span v-if="!props.collapsed" class="min-w-0 flex-1 truncate"
          :class="{ 'text-warning-sync': props.actionObjectKeys?.includes(tag.id) }">
          {{ tag.name }}
        </span>
        <span v-if="!props.collapsed" class="shrink-0 text-[11px] tabular-nums text-muted-foreground">
          {{ props.tagCounts?.[tag.id] ?? 0 }}
        </span>
        <button v-if="!props.collapsed" type="button"
          class="ui-btn ui-btn-ghost ui-btn-xs ui-btn-square -mr-1 opacity-40 group-hover:opacity-100 lg:opacity-0"
          :aria-label="$t('app.note_more')" aria-haspopup="menu" :title="$t('app.note_more')"
          @click.stop="handleRightClickTagName($event, tag.id)"
          @keydown.stop>
          <MoreHorizontal class="h-3.5 w-3.5" />
        </button>
      </div>
    </li>
  </ul>
</template>
