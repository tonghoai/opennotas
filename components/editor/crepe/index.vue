<script setup lang="ts">
import { Crepe } from "@milkdown/crepe";
import { editorViewCtx } from "@milkdown/core";
import { undoCommand, redoCommand } from "@milkdown/plugin-history";
import { imageBlockConfig } from '@milkdown/kit/component/image-block'
import { replaceAll, getMarkdown } from '@milkdown/utils'
import { TextSelection } from '@milkdown/prose/state'
import * as Diff from 'diff'

import "@milkdown/crepe/theme/common/style.css";
import "../../../assets/css/crepe.css";

const props = defineProps([
  'value',
  'isDeleted',
  'settings',
  'isShowFormatToolbar',
]);

const emit = defineEmits([
  'changeContent',
  'alertMessage',
]);

const isLoading = ref(true);

let editor: Crepe;
onMounted(() => {
  editor = new Crepe({
    root: document.querySelector("#crepe-editor")!,
    features: {
      [Crepe.Feature.Toolbar]: true,
      [Crepe.Feature.Latex]: false,
    },
    featureConfigs: {
      [Crepe.Feature.BlockEdit]: {
        textGroup: {
          label: 'Text Blocks',
          text: {
            label: 'Normal Text',
          },
          h1: {
            label: 'Heading 1',
          },
          h2: {
            label: 'Heading 2',
          },
          h3: {
            label: 'Heading 3',
          },
          h4: null,
          h5: null,
          h6: null,
          quote: null,
          divider: null,
        },
      },
    },
    defaultValue: props.value,
  });

  setTimeout(async () => {
    if (props.isDeleted) {
      editor.setReadonly(true);
    }

    await editor.create();
    setTimeout(() => {
      focus();
    }, 100);
    isLoading.value = false;

    editor.editor.ctx.update(imageBlockConfig.key, (defaultConfig) => ({
      ...defaultConfig,
      onUpload: async (file: File) => {
        emit('alertMessage', 'Hình ảnh tải lên sẽ không được đồng bộ');
        return Promise.resolve(URL.createObjectURL(file));
      },
    }))

    editor.on((listener) => {
      listener.updated(() => {
        if (silent.value) return;

        emit('changeContent', editor.getMarkdown());
      });
    });
  }, 250);
});

const focus = () => {
  try {
    if (editor) {
      editor?.editor?.action((ctx) => {
        const view = ctx?.get(editorViewCtx);
        if (view && !view.hasFocus()) {
          view.focus();
        }
      });
    }
  } catch (_) { }
}
const readonly = () => {
  editor.setReadonly(true);
}
const undo = () => {
  undoCommand.run();
}
const redo = () => {
  redoCommand.run();
}

onUnmounted(() => {
  editor.destroy();
});

const silent = ref<boolean>(false);

// slient update value
// use to update value without trigger change event
// to keep the cursor position
const slientUpdateValue = async (value: string) => {
  if (!editor) return
  silent.value = true

  // try catch to avoid error
  try {
    await editor.editor.action((ctx) => {
      const view = ctx.get(editorViewCtx)

      // 1) Get cursor position by plain text (without block separators)
      const sel = view.state.selection
      const prevPos = sel.empty ? sel.from : sel.to
      const oldPlainBefore = view.state.doc.textBetween(0, prevPos, '', '')
      const oldPlain = view.state.doc.textBetween(0, view.state.doc.content.size, '', '')
      const oldOffset = oldPlainBefore.length

      // 2) Replace all content
      replaceAll(value, true)(ctx)

      // 3) Tính offset mới bằng diff
      const newPlain = view.state.doc.textBetween(0, view.state.doc.content.size, '', '')
      const parts = Diff.diffChars(oldPlain, newPlain)
      let oldPos = 0
      let newPos = 0
      let newOffset = 0
      let found = false
      for (const p of parts) {
        const len = p.value.length
        if (p.added) {
          newPos += len
          continue
        }
        if (p.removed) {
          // nếu caret nằm trong phần bị xoá -> snap về vị trí newPos tại điểm đó
          if (!found && oldOffset <= oldPos + len) {
            newOffset = newPos
            found = true
            break
          }
          oldPos += len
          continue
        }
        // unchanged
        if (!found && oldOffset <= oldPos + len) {
          newOffset = newPos + (oldOffset - oldPos)
          found = true
          break
        }
        oldPos += len
        newPos += len
      }
      if (!found) newOffset = newPos

      // 4) Convert plain-text offset -> ProseMirror position
      const doc = view.state.doc
      const totalPlain = newPlain.length
      const target = Math.max(0, Math.min(newOffset, totalPlain))

      let acc = 0
      let pmPos: number | null = null
      doc.descendants((node, pos) => {
        if (pmPos != null) return false
        if (node.isText && node.text) {
          const len = node.text.length
          if (acc + len >= target) {
            const within = target - acc
            pmPos = pos + within
            return false
          }
          acc += len
        }
        return true
      })

      // 5) Set cursor position
      const finalPos = pmPos == null ? doc.content.size : Math.max(0, Math.min(pmPos, doc.content.size))
      const tr = view.state.tr.setSelection(
        finalPos >= doc.content.size ? TextSelection.atEnd(doc) : TextSelection.create(doc, finalPos)
      )
      view.dispatch(tr)
      view.focus()
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
});
</script>

<template>
  <div v-show="isLoading"
    class="w-full mx-auto outline-none px-2 lg:px-8 py-6 min-h-[calc(100vh_/_2)] animate-fade-right animate-duration-100 flex flex-col items-center justify-end"
    :class="{ 'max-w-screen-md': props.settings?.general.editorView === 'compact' }">
    <div class="loader"></div>
  </div>

  <div v-show="!isLoading" id="crepe-editor"
    class="w-full mx-auto outline-none px-2 lg:px-8 py-6 min-h-[calc(100vh_/_2)] animate-fade-right animate-duration-100"
    :class="{ 'max-w-screen-md': props.settings?.general.editorView === 'compact' }">

  </div>

  <div v-if="props.isShowFormatToolbar" class="sticky bottom-16 left-0 w-fit max-w-screen-md mx-auto">
    <ToolbarFormNotesFormat :editorType="'crepe'" :editor="editor?.editor" />
  </div>
</template>
