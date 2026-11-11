<script setup lang="ts">
import { Notes } from '~/utils/icons';
import { Folder } from '~/utils/icons';
import { Tag } from '~/utils/icons';
import { Search } from '~/utils/icons';
import { Plus } from '~/utils/icons';
import { Settings } from '~/utils/icons';

const { $i18n } = useNuxtApp();

type PaletteItem = {
  key: string;
  group: 'notes' | 'folders' | 'tags' | 'actions';
  id: string;
  label: string;
  meta?: string;
};

const props = defineProps([
  'open',
  'notes',
  'folders',
  'tags',
]);

const emit = defineEmits(['update:open', 'selectNote', 'selectFolder', 'selectTag', 'runAction']);

const query = ref('');
const activeIndex = ref(0);
const inputRef = ref<HTMLInputElement | null>(null);
const dialogRef = ref<{ close: (withCancel?: boolean) => void } | null>(null);
const pendingItem = ref<PaletteItem | null>(null);

const normalize = (value: string) => value
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '');

const actions = computed<PaletteItem[]>(() => [
  { key: 'action:new-note', group: 'actions', id: 'new-note', label: $i18n.t('app.command_new_note') },
  { key: 'action:new-folder', group: 'actions', id: 'new-folder', label: $i18n.t('app.command_new_folder') },
  { key: 'action:settings', group: 'actions', id: 'settings', label: $i18n.t('app.command_open_settings') },
]);

const results = computed<PaletteItem[]>(() => {
  const q = normalize(query.value.trim());
  const matches = (value: string | undefined) => !q || normalize(value || '').includes(q);

  const noteItems = (props.notes || [])
    .filter((note: any) => matches(note.title) || matches(note.content))
    .slice(0, 8)
    .map((note: any) => ({
      key: `note:${note.id}`,
      group: 'notes' as const,
      id: note.id,
      label: note.title || $i18n.t('app.list_note_no_title'),
      meta: note.content && note.content !== note.title ? note.content : '',
    }));

  const folderItems = (props.folders || [])
    .filter((folder: any) => folder.id && matches(folder.name))
    .slice(0, 5)
    .map((folder: any) => ({
      key: `folder:${folder.id}`,
      group: 'folders' as const,
      id: folder.id,
      label: folder.name,
    }));

  const tagItems = (props.tags || [])
    .filter((tag: any) => matches(tag.name))
    .slice(0, 5)
    .map((tag: any) => ({
      key: `tag:${tag.id}`,
      group: 'tags' as const,
      id: tag.id,
      label: tag.name,
    }));

  const actionItems = actions.value.filter((action) => matches(action.label));

  return [...noteItems, ...folderItems, ...tagItems, ...actionItems];
});

const runItem = (item: PaletteItem) => {
  pendingItem.value = item;
  if (dialogRef.value) {
    // Apply the result after the dialog's exit transition, while still mounted.
    dialogRef.value.close();
    return;
  }
  finishItem();
};

const finishItem = () => {
  const item = pendingItem.value;
  if (!item) return;
  pendingItem.value = null;
  if (item.group === 'notes') emit('selectNote', item.id);
  else if (item.group === 'folders') emit('selectFolder', item.id);
  else if (item.group === 'tags') emit('selectTag', item.id);
  else emit('runAction', item.id);
};

const move = (delta: number) => {
  if (!results.value.length) return;
  activeIndex.value = (activeIndex.value + delta + results.value.length) % results.value.length;
  nextTick(() => {
    document.getElementById(`command-item-${activeIndex.value}`)?.scrollIntoView({ block: 'nearest' });
  });
};

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    move(1);
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    move(-1);
  } else if (event.key === 'Enter') {
    event.preventDefault();
    const item = results.value[activeIndex.value];
    if (item) runItem(item);
  }
};

watch(query, () => { activeIndex.value = 0; });

watch(() => props.open, async (open) => {
  if (!open) return;
  query.value = '';
  activeIndex.value = 0;
  await nextTick();
  setTimeout(() => inputRef.value?.focus(), 80);
});

onMounted(() => {
  if (props.open) setTimeout(() => inputRef.value?.focus(), 80);
});
</script>

<template>
  <UiDialog ref="dialogRef" :open="props.open" width="34rem" :title="$t('app.command_palette_title')" :show-close="false"
    :show-cancel="false" :show-ok="false" overlay-closable @update:open="emit('update:open', $event)" @after-close="finishItem">
    <div class="-m-5">
      <label class="flex items-center gap-3 border-b border-border px-5 py-3.5">
        <Search class="h-4 w-4 shrink-0 text-muted-foreground" />
        <input ref="inputRef" v-model="query" type="text" autocomplete="off" autofocus
          class="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-muted-foreground"
          :placeholder="$t('app.command_palette_placeholder')" :aria-label="$t('app.command_palette_placeholder')"
          @keydown="handleKeydown" />
        <kbd class="hidden rounded border border-border bg-muted px-1 text-[9px] text-muted-foreground sm:inline">Esc</kbd>
      </label>

      <div class="max-h-[52vh] overflow-y-auto p-2">
        <div v-if="!results.length" class="px-4 py-10 text-center">
          <p class="text-[13px] font-medium">{{ $t('app.command_palette_empty_title') }}</p>
          <p class="mt-1 text-[12px] text-muted-foreground">{{ $t('app.command_palette_empty_desc') }}</p>
        </div>

        <template v-for="(item, index) in results" :key="item.key">
          <p v-if="index === 0 || item.group !== results[index - 1]?.group"
            class="px-3 pb-1.5 pt-3.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {{ item.group === 'notes' ? $t('app.command_group_notes')
              : item.group === 'folders' ? $t('app.command_group_folders')
                : item.group === 'tags' ? $t('app.command_group_tags') : $t('app.command_group_actions') }}
          </p>

          <button :id="`command-item-${index}`" type="button"
            class="flex w-full items-center gap-3 rounded-ui px-3 py-2.5 text-left transition-colors"
            :class="index === activeIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-accent'"
            @mouseenter="activeIndex = index" @click="runItem(item)">
            <Notes v-if="item.group === 'notes'" class="h-4 w-4 shrink-0 opacity-70" />
            <Folder v-else-if="item.group === 'folders'" class="h-4 w-4 shrink-0 opacity-70" />
            <Tag v-else-if="item.group === 'tags'" class="h-4 w-4 shrink-0 opacity-70" />
            <Settings v-else-if="item.id === 'settings'" class="h-4 w-4 shrink-0 opacity-70" />
            <Plus v-else class="h-4 w-4 shrink-0 opacity-70" />

            <span class="min-w-0 flex-1">
              <span class="block truncate text-[13.5px] font-medium">{{ item.label }}</span>
              <span v-if="item.meta" class="mt-1 block truncate text-[11.5px] text-muted-foreground">{{ item.meta }}</span>
            </span>
          </button>
        </template>
      </div>
    </div>
  </UiDialog>
</template>
