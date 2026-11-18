<script setup lang="ts">
import { Notes } from '~/utils/icons';
import { Trash } from '~/utils/icons';
import { Tag } from '~/utils/icons';

const props = defineProps([
  'id',
  'value',
  'isLocked',
  'settings',
  'editorName',
  'isDeleted',
  'isShowFormatToolbar',
  'emptyMode',
  'isReadOnly',
]);

const emit = defineEmits([
  'changeContent',
  'confirmPassword',
  'clickInsertLink',
  'closeInsertLink',
  'clickInsertImage',
  'closeInsertImage',
  'alertMessage',
  'requestEdit',
]);

const passwordUnlockValue = ref<string>('');
const passwordUnlockRef = ref<any>(null);
const confirmPassword = () => {
  emit('confirmPassword', passwordUnlockValue.value);
}
const wrongPassword = () => {
  passwordUnlockRef.value.classList.add('animate-shake', 'animate-duration-100', 'ui-input-error');
  setTimeout(() => {
    passwordUnlockRef.value.classList.remove('animate-shake', 'animate-duration-100', 'ui-input-error');
  }, 1000);
}
const resetPassword = () => {
  passwordUnlockValue.value = '';
}

const handleChangeContent = (content: string) => {
  if (props.value !== content) {
    emit('changeContent', { content, id: props.id });
  }
}

const handleClickInsertLink = (data: { url: string }) => {
  emit('clickInsertLink', data);
}
const handleInsertLink = (data: { url: string }) => {
  editorRef.value?.handleInsertLink(data);
}
const handleCloseInsertLink = () => {
  emit('closeInsertLink');
}

const handleClickInsertImage = (data: { url: string, alt: string }) => {
  emit('clickInsertImage', data);
}
const handleInsertImage = (data: { url: string, alt: string }) => {
  editorRef.value?.handleInsertImage(data);
}
const handleCloseInsertImage = () => {
  emit('closeInsertImage');
}

const handleAlertMessage = (message: string) => {
  emit('alertMessage', message);
}

const editorRef = ref<any>(null);
const focusPassword = () => {
  passwordUnlockRef.value?.focus();
}
const focus = (location: 'start' | 'end' = 'start') => {
  editorRef.value?.focus(location);
}
const handleClickMarkdownBody = (e: MouseEvent) => {
  if ((e.target as HTMLElement).closest('input, textarea, .ui-dropdown, .milkdown-toolbar, .milkdown-link-edit, .milkdown-link-preview, .milkdown-slash-menu, .milkdown-block-handle')) return;
  if (props.isReadOnly) {
    emit('requestEdit');
    return;
  }
  focus('end');
}
const readonly = () => {
  editorRef.value?.readonly();
}
const undo = () => {
  editorRef.value?.undo();
}
const redo = () => {
  editorRef.value?.redo();
}
const focusState = () => {
  editorRef.value?.focusState();
}

const editorName = ref<string>(props.editorName);
watch(() => props.editorName, (newValue) => {
  editorName.value = newValue;
});

// reload editor view when settings changed
const editorTiptapKey = ref<number>(0);
watch(props.settings, () => {
  editorTiptapKey.value++;
});

// slient update value
const slientUpdateValue = (value: string) => {
  editorRef.value?.slientUpdateValue(value);
}

// in-note search
const isSearchOpen = ref<boolean>(false);
const searchQuery = ref<string>('');
const matchInfo = ref<{ current: number; total: number }>({ current: 0, total: 0 });
const formNotesSearchRef = ref<any>(null);
let searchDebounce: ReturnType<typeof setTimeout> | null = null;

watch(searchQuery, (value) => {
  if (searchDebounce) clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => {
    matchInfo.value = editorRef.value?.search(value) ?? { current: 0, total: 0 };
  }, 150);
});

const handleSearchNext = () => {
  matchInfo.value = editorRef.value?.findNext() ?? { current: 0, total: 0 };
}
const handleSearchPrev = () => {
  matchInfo.value = editorRef.value?.findPrev() ?? { current: 0, total: 0 };
}
const closeSearch = () => {
  if (!isSearchOpen.value) return;
  isSearchOpen.value = false;
  searchQuery.value = '';
  matchInfo.value = { current: 0, total: 0 };
  editorRef.value?.clearSearch();
}
const openSearch = () => {
  if (isSearchOpen.value) {
    formNotesSearchRef.value?.focusInput();
    return;
  }
  isSearchOpen.value = true;
}
const toggleSearch = () => {
  isSearchOpen.value ? closeSearch() : openSearch();
}
watch(() => [props.editorName, props.id], closeSearch);

defineExpose({
  focusPassword,
  focus,
  readonly,
  undo,
  redo,
  wrongPassword,
  resetPassword,
  handleInsertLink,
  handleInsertImage,
  slientUpdateValue,
  focusState,
  openSearch,
  closeSearch,
  toggleSearch,
})
</script>

<template>
  <div v-if="!id" class="flex h-full flex-col items-center justify-center gap-3.5 px-8 text-center">
    <Trash v-if="props.emptyMode === 'trash'" class="h-10 w-10 opacity-20" />
    <Tag v-else-if="props.emptyMode === 'tags'" class="h-10 w-10 opacity-20" />
    <Notes v-else class="h-10 w-10 opacity-20" />
    <p class="text-[15px] font-medium text-foreground/80">
      {{ props.emptyMode === 'trash' ? $t('app.list_empty_trash_title')
        : props.emptyMode === 'tags' ? $t('app.tags_overview_title') : $t('app.editor_empty_title') }}
    </p>
    <p class="max-w-64 text-[13.5px] leading-5 text-muted-foreground">
      {{ props.emptyMode === 'trash' ? $t('app.list_empty_trash_desc')
        : props.emptyMode === 'tags' ? $t('app.tags_overview_desc') : $t('app.editor_empty_desc') }}
    </p>
  </div>

  <div class="markdown-body transition-all relative" :class="{ 'is-readonly': props.isReadOnly }" v-if="id && !isLocked"
    @click="handleClickMarkdownBody">
    <Transition name="note-search">
      <div v-if="isSearchOpen" class="note-search-shell sticky top-0 z-[60] shadow-sm"
        @click.stop>
        <ToolbarFormNotesSearch ref="formNotesSearchRef" v-model="searchQuery"
          :matchCurrent="matchInfo.current" :matchTotal="matchInfo.total"
          @next="handleSearchNext" @prev="handleSearchPrev" @close="closeSearch" />
      </div>
    </Transition>

    <EditorTiptap v-if="editorName === 'Tiptap'" ref="editorRef" :value="props.value" :isDeleted="props.isDeleted"
      :settings="settings" :key="editorTiptapKey" :isShowFormatToolbar="props.isShowFormatToolbar"
      :isReadOnly="props.isReadOnly" :content-label="$t('app.editor_content_label')"
      @changeContent="handleChangeContent" @clickInsertLink="handleClickInsertLink"
      @closeInsertLink="handleCloseInsertLink" @clickInsertImage="handleClickInsertImage"
      @closeInsertImage="handleCloseInsertImage" />

    <EditorCodemirror v-if="editorName === 'CodeMirror'" ref="editorRef" :value="props.value"
      :isDeleted="props.isDeleted" :settings="settings" :isReadOnly="props.isReadOnly"
      :content-label="$t('app.editor_content_label')"
      @changeContent="handleChangeContent" />

    <EditorCrepe v-if="editorName === 'Crepe'" ref="editorRef" :value="props.value" :isDeleted="props.isDeleted"
      :settings="settings" :isShowFormatToolbar="props.isShowFormatToolbar" :noteId="props.id"
      :isReadOnly="props.isReadOnly" :content-label="$t('app.editor_content_label')"
      @changeContent="handleChangeContent" @alertMessage="handleAlertMessage"
      @insertImage="emit('clickInsertImage', { url: '', alt: '' })" />
  </div>

  <div class="flex justify-center pt-8 pb-1 bg-svg h-full transition-all" v-show="id && isLocked">
    <input ref="passwordUnlockRef" type="password" :placeholder="$t('app.form_note_input_password_title')"
      class="ui-input ui-input-bordered max-w-xs" v-model="passwordUnlockValue" @keyup.enter="confirmPassword"
      autocomplete="off" autofocus />
  </div>
</template>

<style lang="scss">
.markdown-body.is-readonly {
  cursor: default;
}

/* In-note search slides open instead of reflowing the document in one frame. */
.note-search-shell {
  max-height: 4rem;
  overflow: hidden;
  will-change: max-height, opacity, transform;
}

.note-search-enter-active,
.note-search-leave-active {
  transition: max-height 240ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 180ms ease-out, transform 240ms cubic-bezier(0.22, 1, 0.36, 1);
}

.note-search-enter-from,
.note-search-leave-to {
  max-height: 0;
  opacity: 0;
  transform: translateY(-8px);
}

/* Read-only mode must not focus/caret the document. The wrapper still catches
   the tap so mobile can promote the note to edit mode on first interaction. */
.markdown-body.is-readonly :deep(.ProseMirror),
.markdown-body.is-readonly :deep(.cm-editor),
.markdown-body.is-readonly :deep(#crepe-editor) {
  pointer-events: none;
  caret-color: transparent;
}

.content {
  padding: 1rem 0 0;

  pre {
    border-radius: 5px;
    color: #333;
  }

  code {
    display: block;
    white-space: pre-wrap;
    font-size: 0.8rem;
    padding: 0.75rem 1rem;
    background-color: #e9ecef;
    color: #495057;
  }
}
</style>
