<script setup lang="ts">
import { EditorState } from "@codemirror/state";
import { EditorView } from "codemirror";
import { redo as _redo, undo as _undo, defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { drawSelection, dropCursor, rectangularSelection, keymap } from "@codemirror/view";
import * as Diff from 'diff';

const props = defineProps([
  'value',
  'isDeleted',
  'settings',
]);

const emit = defineEmits([
  'changeContent',
]);

let editor: EditorView;
const silent = ref<boolean>(false);

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
      if (silent.value) return;
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
const focusState = () => {
}

// slient update value
// use to update value without trigger change event
// to keep the cursor position
const slientUpdateValue = (value: string) => {
  if (!editor) return
  silent.value = true
  try {
    const oldText = editor.state.doc.toString()
    const oldCursor = editor.state.selection.main.head

    const parts = Diff.diffChars(oldText, value)
    let oldPos = 0
    let newPos = 0
    let newCursor = 0
    let found = false
    for (const p of parts) {
      const len = p.value.length
      if (p.added) {
        newPos += len
        continue
      }
      if (p.removed) {
        if (!found && oldCursor <= oldPos + len) {
          newCursor = newPos
          found = true
          break
        }
        oldPos += len
        continue
      }
      // unchanged
      if (!found && oldCursor <= oldPos + len) {
        newCursor = newPos + (oldCursor - oldPos)
        found = true
        break
      }
      oldPos += len
      newPos += len
    }
    if (!found) newCursor = newPos

    const clampedCursor = Math.max(0, Math.min(newCursor, value.length))
    editor.dispatch({
      changes: { from: 0, to: editor.state.doc.length, insert: value },
      selection: { anchor: clampedCursor },
    })
  } catch (_) { }
  silent.value = false
}

defineExpose({
  focus,
  readonly,
  undo,
  redo,
  slientUpdateValue,
  focusState,
});
</script>

<template>
  <div id="cm-editor"
    class="w-full mx-auto outline-none px-2 lg:px-8 py-6 min-h-[calc(100vh_/_2)] animate-fade-right animate-duration-100"
    :class="{ 'max-w-screen-md': props.settings?.general.editorView === 'compact' }" />
</template>

<style lang="postcss">
#cm-editor,
.ͼ1.cm-focused {
  outline: none !important;
}

.ͼ1 .cm-scroller {
  outline: none !important;
  font-family: inherit !important;
}

.cm-content {
  margin-bottom: 100px !important;
}

.cm-focused .cm-cursor {
  @apply !border-base-content;
}

.cm-line {
  line-height: 1.5;
}

.ͼ1 .cm-scroller {
  overflow-x: initial !important;
}

.cm-selectionBackground,
.cm-editor ::selection {
  background-color: oklch(var(--p)) !important;
  color: oklch(var(--pc)) !important;
}

.cm-focused .cm-scroller .cm-selectionLayer .cm-selectionBackground {
  background-color: oklch(var(--p)) !important;
  color: oklch(var(--pc)) !important;
}

.ͼ4 .cm-line {
  color: oklch(var(--bc)) !important;
}
</style>