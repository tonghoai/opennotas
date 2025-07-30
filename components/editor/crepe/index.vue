<script setup lang="ts">
import { Crepe } from "@milkdown/crepe";
import { editorViewCtx } from "@milkdown/core";
import { undoCommand, redoCommand } from "@milkdown/plugin-history";
import { imageBlockConfig } from '@milkdown/kit/component/image-block'

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
    root: document.querySelector("#cm-editor")!,
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
      listener.markdownUpdated((markdown) => {
        console.log("Markdown updated:");
      });

      listener.updated((doc) => {
        console.log("Document updated");
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

defineExpose({
  focus,
  readonly,
  undo,
  redo,
});
</script>

<template>
  <div v-show="isLoading"
    class="w-full mx-auto outline-none px-2 lg:px-8 py-6 min-h-[calc(100vh_/_2)] animate-fade-right animate-duration-100 flex flex-col items-center justify-end"
    :class="{ 'max-w-screen-md': props.settings?.general.editorView === 'compact' }">
    <div class="loader"></div>
  </div>

  <div v-show="!isLoading" id="cm-editor"
    class="w-full mx-auto outline-none px-2 lg:px-8 py-6 min-h-[calc(100vh_/_2)] animate-fade-right animate-duration-100"
    :class="{ 'max-w-screen-md': props.settings?.general.editorView === 'compact' }">

  </div>

  <div v-if="props.isShowFormatToolbar" class="sticky bottom-16 left-0 w-fit max-w-screen-md mx-auto">
    <ToolbarFormNotesFormat :editorType="'crepe'" :editor="editor?.editor" />
  </div>
</template>
