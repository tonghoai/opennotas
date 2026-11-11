<script lang="ts" setup>
import { Info } from '~/utils/icons';
import { Menu } from '~/utils/icons';
import { PanelLeft } from '~/utils/icons';
import { Type } from '~/utils/icons';
import { ToolCase } from '~/utils/icons';
import { Search } from '~/utils/icons';
import { Copy } from '~/utils/icons';
import { Article } from '~/utils/icons';
import { Pin } from '~/utils/icons';
import { Folder } from '~/utils/icons';

const props = defineProps([
  'noteId',
  'editorName',
  'isLocked',
  'formNotes',
  'folderId',
  'folderName',
  'tags',
  'isPinned',
  'title',
  'showTitle',
  'isDeleted',
]);

const emit = defineEmits([
  'clickInfo',
  'clickCollapsePanel',
  'clickFormatToolbar',
  'copyNote',
  'clickSwitchEditor',
  'clickPlainText',
  'clickSearchInNote',
  'clickPin',
  'clickFolder',
  'clickTag',
]);

const handleClickInfo = () => {
  emit('clickInfo', props.noteId);
};
const handleClickCollapsePanel = () => {
  emit('clickCollapsePanel');
};
const handleClickFormatToolbar = () => {
  emit('clickFormatToolbar', props.noteId);
};
const handleClickCopyNote = () => {
  emit('copyNote', props.noteId);
};
const handleClickChangeEditor = () => {
  emit('clickSwitchEditor', props.noteId);
};
const handleClickPlainText = () => {
  emit('clickPlainText', props.noteId);
};
const handleClickSearchInNote = () => {
  emit('clickSearchInNote', props.noteId);
};
const handleClickPinNote = () => {
  emit('clickPin', { noteId: props.noteId, status: props.isPinned ? 1 : 0 });
};

const firstTag = computed(() => (props.tags || [])[0]);
const extraTags = computed(() => (props.tags || []).slice(1));
const extraTagCount = computed(() => extraTags.value.length);
</script>

<template>
  <div class="hidden h-12 shrink-0 items-center gap-1 border-b border-border bg-card px-4 lg:flex">
    <button v-if="props.noteId" type="button" class="ui-btn ui-btn-ghost ui-btn-sm ui-btn-square"
      :aria-label="$t('app.toolbar_form_note_toggle_list')" :title="$t('app.toolbar_form_note_toggle_list')"
      @click="handleClickCollapsePanel">
      <PanelLeft class="h-4 w-4" />
    </button>

    <div v-if="props.noteId" class="form-toolbar-meta-wrap flex min-w-0 flex-1 items-center gap-2 pl-2">
      <span v-if="props.showTitle || (!props.folderName && !(props.tags || []).length)"
        class="truncate text-[13px] font-medium">{{ props.title }}</span>

      <template v-else>
        <div class="form-toolbar-meta flex min-w-0 items-center gap-2 overflow-hidden">
          <button v-if="props.folderName" type="button"
            class="form-toolbar-folder flex min-w-0 max-w-[9rem] shrink items-center gap-1.5 rounded border border-border bg-background px-2 py-1 text-[10.5px] leading-4 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            :title="props.folderName" :aria-label="props.folderName" @click="emit('clickFolder', props.folderId)">
            <Folder class="h-3 w-3 shrink-0" />
            <span class="truncate">{{ props.folderName }}</span>
          </button>

          <button v-if="firstTag" type="button"
            class="flex min-w-0 max-w-[10rem] shrink items-center gap-1.5 rounded border border-border bg-background px-2 py-1 text-[10.5px] leading-4 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            :title="firstTag.name" :aria-label="firstTag.name" @click="emit('clickTag', firstTag.id)">
            <span class="h-1.5 w-1.5 shrink-0 rounded-full" :style="{ backgroundColor: firstTag.color || '#94a3b8' }"></span>
            <span class="truncate">{{ firstTag.name }}</span>
          </button>
        </div>

        <div v-if="extraTagCount" class="ui-dropdown ui-dropdown-bottom ui-dropdown-end shrink-0">
          <button type="button" tabindex="0"
            class="flex h-[22px] items-center rounded border border-border bg-background px-2 text-[10.5px] leading-4 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            :aria-label="`${$t('app.tab_tags')} +${extraTagCount}`" :title="extraTags.map(tag => tag.name).join(', ')"
            aria-haspopup="menu">
            +{{ extraTagCount }}
          </button>

          <ul tabindex="0" class="ui-dropdown-content ui-menu ui-menu-sm z-30 max-h-64 w-56 overflow-y-auto">
            <li v-for="tag in extraTags" :key="tag.id">
              <button type="button" class="flex w-full items-center gap-2" @click="emit('clickTag', tag.id)">
                <span class="h-1.5 w-1.5 shrink-0 rounded-full" :style="{ backgroundColor: tag.color || '#94a3b8' }"></span>
                <span class="min-w-0 flex-1 truncate text-left">{{ tag.name }}</span>
              </button>
            </li>
          </ul>
        </div>
      </template>
    </div>

    <div v-if="props.noteId && !props.isLocked" class="flex shrink-0 items-center gap-1">
      <button v-if="!props.isDeleted" type="button" class="ui-btn ui-btn-ghost ui-btn-sm ui-btn-square"
        :class="{ 'text-warning': props.isPinned }" :aria-label="$t('app.modal_menu_note_pin')"
        :title="$t('app.modal_menu_note_pin')" data-ga-event="note_pin_toggle" @click="handleClickPinNote">
        <Pin class="h-4 w-4" />
      </button>

      <button v-if="!props.isDeleted && ['Tiptap', 'Crepe'].includes(props.editorName)" type="button"
        class="ui-btn ui-btn-ghost ui-btn-sm ui-btn-square" :aria-label="$t('app.note_format')"
        :title="$t('app.note_format')" @click="handleClickFormatToolbar">
        <ToolCase class="h-4 w-4" />
      </button>

      <button type="button" class="ui-btn ui-btn-ghost ui-btn-sm ui-btn-square"
        :aria-label="$t('app.toolbar_note_find_in_note')" :title="$t('app.toolbar_note_find_in_note')"
        @click="handleClickSearchInNote">
        <Search class="h-4 w-4" />
      </button>

      <button type="button" class="ui-btn ui-btn-ghost ui-btn-sm ui-btn-square"
        :aria-label="$t('app.toolbar_form_note_info')" :title="$t('app.toolbar_form_note_info')" @click="handleClickInfo">
        <Info class="h-4 w-4" />
      </button>

      <div class="ui-dropdown ui-dropdown-bottom ui-dropdown-end">
        <button type="button" tabindex="0" class="ui-btn ui-btn-ghost ui-btn-sm ui-btn-square"
          :aria-label="$t('app.note_more')" aria-haspopup="menu" :title="$t('app.note_more')">
          <Menu class="h-4 w-4" />
        </button>

        <ul tabindex="0" class="ui-dropdown-content ui-menu ui-menu-sm z-30 w-44">
          <li @click="handleClickCopyNote">
            <button type="button" class="flex w-full items-center gap-2">
              <Copy class="h-3.5 w-3.5" />
              {{ $t('app.menu_note_copy') }}
            </button>
          </li>
          <li @click="handleClickPlainText">
            <button type="button" class="flex w-full items-center gap-2">
              <Type class="h-3.5 w-3.5" />
              {{ $t('app.note_plain_text') }}
            </button>
          </li>
          <li @click="handleClickChangeEditor">
            <button type="button" class="flex w-full items-center gap-2">
              <Article class="h-3.5 w-3.5" />
              {{ $t('app.menu_note_change_editor') }}
            </button>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Keep breadcrumbs readable when the editor is narrow. The folder is the
   first thing to go; the tag + overflow menu remain reachable. */
.form-toolbar-meta-wrap {
  container-type: inline-size;
}

@container (max-width: 16rem) {
  .form-toolbar-folder {
    display: none;
  }
}
</style>
