<script setup lang="ts">
const props = defineProps([
  'id',
  'value',
  'isLocked',
  'settings',
  'editorName',
  'isDeleted',
]);

const emit = defineEmits([
  'changeContent',
  'confirmPassword',
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
    emit('changeContent', content);
  }
}

const editorRef = ref<any>(null);
const focusPassword = () => {
  passwordUnlockRef.value?.focus();
}
const focus = (location: 'start' | 'end' = 'start') => {
  editorRef.value?.focus(location);
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

const editorName = ref<string>(props.editorName);
watch(() => props.editorName, (newValue) => {
  editorName.value = newValue;
});

// reload editor view when settings changed
const editorTiptapKey = ref<number>(0);
watch(props.settings, () => {
  editorTiptapKey.value++;
});

defineExpose({
  focusPassword,
  focus,
  readonly,
  undo,
  redo,
  wrongPassword,
  resetPassword,
})
</script>

<template>
  <div class="flex justify-center bg-svg h-full transition-all" v-if="!id"></div>

  <div class="markdown-body transition-all relative" v-if="id && !isLocked" @click="() => focus('end')">
    <EditorTiptap v-if="editorName === 'Tiptap'" ref="editorRef" :value="props.value" :isDeleted="props.isDeleted"
      :settings="settings" :key="editorTiptapKey" @changeContent="handleChangeContent" />

    <EditorCodemirror v-if="editorName === 'CodeMirror'" ref="editorRef" :value="props.value"
      :isDeleted="props.isDeleted" :settings="settings" @changeContent="handleChangeContent" />
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
