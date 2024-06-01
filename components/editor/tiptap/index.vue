<script setup lang="ts">
import { Editor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';
import { Image as TipTapImage } from "@tiptap/extension-image";
import Table from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';
import Italic from '@tiptap/extension-italic';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';

const props = defineProps([
  'value',
  'isDeleted',
]);

const emit = defineEmits([
  'changeContent',
]);

let editor: Editor;
onMounted(() => {
  const value = /\s*\]\s*$/.test(props.value) ? `${props.value}&hairsp;` : props.value;
  editor = new Editor({
    content: value.replace(/(\n)(?!\|)/g, '  \n\n'),
    editable: !props.isDeleted,
    extensions: [
      StarterKit,
      Italic,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList.configure({
        HTMLAttributes: {
          class: 'task-list',
        },
      }),
      CustomTaskItem.configure({
        HTMLAttributes: {
          class: 'task-list-item',
        },
      }),
      Markdown.configure({
        tightLists: false,
        breaks: true,
        linkify: true,
        transformPastedText: true,
        transformCopiedText: true,
      }),
      TipTapImage.configure({
        allowBase64: false,
      }),
    ],
    editorProps: {
      attributes: {
        class: 'bg-svg px-2 lg:px-8 py-6',
      },
      handleClickOn(view, pos, node, nodePos, event) {
        editor.commands.focus(pos, { scrollIntoView: true });

        setTimeout(() => {
          if ((event.target as any).type === 'checkbox')
            editor.commands.blur();

          editor.commands.scrollIntoView();
        }, 0);
      },
    },
    onUpdate: ({ editor }) => {
      const markdownContent = editor.storage.markdown.getMarkdown();
      const content = markdownContent
        .replace(/\\/g, '')
        // .replace(/\n\n/g, '\n')
        .replace(/&hairsp;/g, '')
        .replace(/ /g, '')
      emit('changeContent', content);
    }
  });
});

// watch(() => props.value, (newValue) => {
//   editor.commands.setContent(/\s*\]\s*$/.test(newValue) ? `${newValue}&hairsp;` : newValue);
// });

const focus = () => {
  editor.commands.focus('start');
}

const readonly = () => {
  editor.setEditable(false);
}

const undo = () => {
  editor.commands.undo();
}
const redo = () => {
  editor.commands.redo();
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

const CustomTaskItem = TaskItem.extend({
  addNodeView() {
    return ({ node, HTMLAttributes, getPos, editor, }) => {
      const listItem = document.createElement('li');
      const checkboxWrapper = document.createElement('label');
      const checkboxStyler = document.createElement('span');
      const checkbox = document.createElement('input');
      const content = document.createElement('div');
      checkboxWrapper.contentEditable = 'false';
      checkbox.type = 'checkbox';
      checkbox.classList.add('checkbox', 'checkbox-sm');
      checkbox.addEventListener('change', event => {
        // if the editor isn’t editable and we don't have a handler for
        // readonly checks we have to undo the latest change
        if (!editor.isEditable && !this.options.onReadOnlyChecked) {
          checkbox.checked = !checkbox.checked;
          return;
        }
        const { checked }: any = event.target;
        if (editor.isEditable && typeof getPos === 'function') {
          editor
            .chain()
            .focus(undefined, { scrollIntoView: false })
            .command(({ tr }) => {
              const position = getPos();
              const currentNode = tr.doc.nodeAt(position);
              tr.setNodeMarkup(position, undefined, {
                ...currentNode === null || currentNode === void 0 ? void 0 : currentNode.attrs,
                checked,
              });
              return true;
            })
            .run();
        }
        if (!editor.isEditable && this.options.onReadOnlyChecked) {
          // Reset state if onReadOnlyChecked returns false
          if (!this.options.onReadOnlyChecked(node, checked)) {
            checkbox.checked = !checkbox.checked;
          }
        }
      });
      Object.entries(this.options.HTMLAttributes).forEach(([key, value]) => {
        listItem.setAttribute(key, value);
      });
      listItem.dataset.checked = node.attrs.checked;
      if (node.attrs.checked) {
        checkbox.setAttribute('checked', 'checked');
      }
      checkboxWrapper.append(checkbox, checkboxStyler);
      listItem.append(checkboxWrapper, content);
      Object.entries(HTMLAttributes).forEach(([key, value]) => {
        listItem.setAttribute(key, value);
      });
      return {
        dom: listItem,
        contentDOM: content,
        update: updatedNode => {
          if (updatedNode.type !== this.type) {
            return false;
          }
          listItem.dataset.checked = updatedNode.attrs.checked;
          if (updatedNode.attrs.checked) {
            checkbox.setAttribute('checked', 'checked');
          }
          else {
            checkbox.removeAttribute('checked');
          }
          return true;
        },
      };
    };
  },
})

</script>

<template>
  <client-only>
    <editor-content :editor="editor" />
  </client-only>
</template>

<style lang="postcss">
.tiptap {
  outline: none;
  line-height: 32px;

  &:last-child {
    padding-bottom: 64px !important;
  }

  >*+* {
    margin-top: 0.75em;
  }
}

.markdown-body {

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    @apply border-b border-base-300;
  }
}
</style>
