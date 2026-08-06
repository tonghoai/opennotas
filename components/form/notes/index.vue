<script setup lang="ts">
const props = defineProps([
  'id',
  'value',
  'isLocked',
  'settings',
  'editorName',
  'isDeleted',
  'isShowFormatToolbar',
]);

const emit = defineEmits([
  'changeContent',
  'confirmPassword',
  'clickInsertLink',
  'closeInsertLink',
  'clickInsertImage',
  'closeInsertImage',
  'alertMessage',
]);

const passwordUnlockValue = ref<string>('');
const passwordUnlockRef = ref<any>(null);
const confirmPassword = () => {
  emit('confirmPassword', passwordUnlockValue.value);
}
const wrongPassword = () => {
  passwordUnlockRef.value.classList.add('animate-shake', 'animate-duration-100', 'input-error');
  setTimeout(() => {
    passwordUnlockRef.value.classList.remove('animate-shake', 'animate-duration-100', 'input-error');
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
  if ((e.target as HTMLElement).closest('input, textarea, .dropdown, .milkdown-toolbar, .milkdown-link-edit, .milkdown-link-preview, .milkdown-slash-menu, .milkdown-block-handle')) return;
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
  <div class="flex justify-center bg-svg h-full transition-all" v-if="!id"></div>

  <div class="markdown-body transition-all relative" v-if="id && !isLocked" @click="handleClickMarkdownBody">
    <ToolbarFormNotesSearch v-if="isSearchOpen" ref="formNotesSearchRef" v-model="searchQuery"
      :matchCurrent="matchInfo.current" :matchTotal="matchInfo.total"
      class="sticky top-0 z-[60] animate-fade-down animate-duration-200 shadow-sm" @next="handleSearchNext"
      @prev="handleSearchPrev" @close="closeSearch" @click.stop />

    <EditorTiptap v-if="editorName === 'Tiptap'" ref="editorRef" :value="props.value" :isDeleted="props.isDeleted"
      :settings="settings" :key="editorTiptapKey" :isShowFormatToolbar="props.isShowFormatToolbar"
      @changeContent="handleChangeContent" @clickInsertLink="handleClickInsertLink"
      @closeInsertLink="handleCloseInsertLink" @clickInsertImage="handleClickInsertImage"
      @closeInsertImage="handleCloseInsertImage" />

    <EditorCodemirror v-if="editorName === 'CodeMirror'" ref="editorRef" :value="props.value"
      :isDeleted="props.isDeleted" :settings="settings" @changeContent="handleChangeContent" />

    <EditorCrepe v-if="editorName === 'Crepe'" ref="editorRef" :value="props.value" :isDeleted="props.isDeleted"
      :settings="settings" :isShowFormatToolbar="props.isShowFormatToolbar" :noteId="props.id"
      @changeContent="handleChangeContent" @alertMessage="handleAlertMessage" />
  </div>

  <div class="flex justify-center pt-8 pb-1 bg-svg h-full transition-all" v-show="id && isLocked">
    <input ref="passwordUnlockRef" type="password" :placeholder="$t('app.form_note_input_password_title')"
      class="input input-bordered max-w-xs" v-model="passwordUnlockValue" @keyup.enter="confirmPassword"
      autocomplete="off" autofocus />
  </div>
</template>

<style lang="scss">
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
