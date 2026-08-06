<script setup lang="ts">
import { EditorState, StateField, StateEffect } from "@codemirror/state";
import { EditorView } from "codemirror";
import { redo as _redo, undo as _undo, defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { drawSelection, dropCursor, rectangularSelection, keymap, Decoration, type DecorationSet } from "@codemirror/view";
import { SearchQuery } from '@codemirror/search';
import * as Diff from 'diff';
import { ensureCursorBottomMargin, scrollFormEditorsIntoView } from '~/utils/editor-scroll';
import type { SearchCounts } from '~/utils/editor-search';

// in-note search
type SearchMatch = { from: number; to: number };
type SearchFieldValue = { matches: SearchMatch[]; activeIndex: number };

const setSearchMatches = StateEffect.define<SearchFieldValue>();

const searchMatchesField = StateField.define<SearchFieldValue>({
  create: (): SearchFieldValue => ({ matches: [], activeIndex: -1 }),
  update(value, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setSearchMatches)) return effect.value;
    }
    return value;
  },
  provide: (field) => EditorView.decorations.from(field, (value): DecorationSet => {
    if (!value.matches.length) return Decoration.none;
    return Decoration.set(
      value.matches.map((m, i) =>
        Decoration.mark({ class: i === value.activeIndex ? 'cm-searchMatch cm-searchMatch-selected' : 'cm-searchMatch' }).range(m.from, m.to)
      )
    );
  }),
});

const findAllMatches = (state: EditorState, query: string): SearchMatch[] => {
  if (!query) return [];
  const cursor = new SearchQuery({ search: query, caseSensitive: false }).getCursor(state);
  const matches: SearchMatch[] = [];
  let result = cursor.next();
  while (!result.done) {
    matches.push({ from: result.value.from, to: result.value.to });
    result = cursor.next();
  }
  return matches;
};

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
    searchMatchesField,
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
      if (v.docChanged || v.selectionSet) {
        ensureCursorBottomMargin(() => v.view.coordsAtPos(v.view.state.selection.main.head));
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

// Scrolls a doc position into view
const scrollPosIntoView = (pos: number) => {
  if (!editor) return;

  const coords = editor.coordsAtPos(pos);
  if (coords) {
    scrollFormEditorsIntoView(coords);
    return;
  }

  // CM6 virtualizes
  const block = editor.lineBlockAt(pos);
  const scrollerTop = editor.scrollDOM.getBoundingClientRect().top - editor.scrollDOM.scrollTop;
  scrollFormEditorsIntoView({ top: scrollerTop + block.top, bottom: scrollerTop + block.bottom });
}

const scrollMatchIntoView = (match: SearchMatch) => {
  requestAnimationFrame(() => {
    scrollPosIntoView(match.from);
    requestAnimationFrame(() => requestAnimationFrame(() => scrollPosIntoView(match.from)));
  });
}

const search = (query: string): SearchCounts => {
  if (!editor) return { current: 0, total: 0 };

  const matches = findAllMatches(editor.state, query);
  const activeIndex = matches.length ? 0 : -1;
  editor.dispatch({ effects: setSearchMatches.of({ matches, activeIndex }) });
  if (activeIndex !== -1) scrollMatchIntoView(matches[activeIndex]);
  return matches.length ? { current: 1, total: matches.length } : { current: 0, total: 0 };
}

const stepMatch = (direction: 1 | -1): SearchCounts => {
  if (!editor) return { current: 0, total: 0 };

  const field = editor.state.field(searchMatchesField);
  if (!field.matches.length) return { current: 0, total: 0 };

  const total = field.matches.length;
  const nextIndex = (field.activeIndex + direction + total) % total;
  editor.dispatch({ effects: setSearchMatches.of({ matches: field.matches, activeIndex: nextIndex }) });
  scrollMatchIntoView(field.matches[nextIndex]);
  return { current: nextIndex + 1, total };
}

const findNext = (): SearchCounts => stepMatch(1);
const findPrev = (): SearchCounts => stepMatch(-1);

const clearSearch = (): void => {
  if (!editor) return;
  editor.dispatch({ effects: setSearchMatches.of({ matches: [], activeIndex: -1 }) });
}

defineExpose({
  focus,
  readonly,
  undo,
  redo,
  slientUpdateValue,
  focusState,
  search,
  findNext,
  findPrev,
  clearSearch,
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
  margin-bottom: 150px !important;
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

/* in-note search — our own searchMatchesField decorations (see <script>), styled to
   match the .search-match/.search-match-active look used by the Tiptap/Crepe editors */
.cm-searchMatch {
  background-color: oklch(var(--wa) / 35%);
  border-radius: 2px;
}

.cm-searchMatch-selected {
  background-color: oklch(var(--wa) / 70%);
  box-shadow: 0 0 0 1px oklch(var(--wa));
}

.cm-focused .cm-scroller .cm-selectionLayer .cm-selectionBackground {
  background-color: oklch(var(--p)) !important;
  color: oklch(var(--pc)) !important;
}

.ͼ4 .cm-line {
  color: oklch(var(--bc)) !important;
}
</style>