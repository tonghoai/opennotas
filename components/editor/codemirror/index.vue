<script setup lang="ts">
import { EditorState } from "@codemirror/state";
import { EditorView } from "codemirror";
import { redo as _redo, undo as _undo, defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { drawSelection, dropCursor, rectangularSelection, keymap } from "@codemirror/view";

const props = defineProps([
  'value',
  'isDeleted',
  'settings',
]);

const emit = defineEmits([
  'changeContent',
]);

let editor: EditorView;
const state = EditorState.create({
  doc: props.value,
  extensions: [
    // highlightActiveLineGutter(),
    // highlightSpecialChars(),
    history(),
    drawSelection(),
    dropCursor(),
    EditorState.allowMultipleSelections.of(true),
    rectangularSelection(),
    // highlightActiveLine(),
    keymap.of([
      ...defaultKeymap,
      ...historyKeymap,
    ]),
    EditorView.lineWrapping,
    ...(props.isDeleted && [EditorView.editable.of(false)] || []),
    EditorView.updateListener.of((v: any) => {
      if (v.docChanged) {
        emit('changeContent', v.state.doc.toString());
      }
    }),
    // markdown(),
    // markdownLanguage,
    // html(),
    // htmlLanguage,
    history(),
  ],

});
onMounted(() => {
  editor = new EditorView({
    state,
    parent: document.querySelector("#cm-editor")!,
  });
});

// watch(() => props.value, (newValue) => {
//   // keep the cursor position
//   const cursor = editor.state.selection.main.head;
//   editor.dispatch({
//     selection: {
//       anchor: cursor,
//       head: cursor,
//     },
//     changes: {
//       from: 0,
//       to: editor.state.doc.length,
//       insert: newValue,
//     },
//   });
// });

const focus = () => {
  if (!editor.hasFocus) {
    editor.focus();
  }
}
const readonly = () => {
}
const undo = () => {
  _undo({
    state: editor.state,
    dispatch: editor.dispatch,
  }
  );
}
const redo = () => {
  _redo({
    state: editor.state,
    dispatch: editor.dispatch,
  });
}

defineExpose({
  focus,
  readonly,
  undo,
  redo,
});
</script>

<template>
  <div id="cm-editor" class="w-full mx-auto outline-none px-2 lg:px-8 py-6 min-h-[calc(100vh_/_2)] animate-fade-right animate-duration-100"
    :class="{ 'max-w-screen-md': props.settings?.general.editorView === 'compact' }" />
</template>

<style lang="postcss">
#cm-editor {
  outline: none !important;
}

.ͼ1 .cm-scroller {
  outline: none !important;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}

.cm-content {
  margin-bottom: 100px !important;
}

.cm-focused .cm-cursor {
  @apply !border-base-content;
}

.cm-line {
  line-height: 32px;
}

.ͼ1 .cm-scroller {
  overflow-x: initial !important;
}
</style>