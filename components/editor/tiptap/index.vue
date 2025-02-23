<script setup lang="ts">
import { BubbleMenu, Editor, EditorContent } from '@tiptap/vue-3'
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
import CodeBlock from '@tiptap/extension-code-block'

import H from '../assets/svg/h.svg?component';
import Pilcrow from '../assets/svg/pilcrow.svg?component';
import Bold from '../assets/svg/bold.svg?component';
import ItalicSVG from '../assets/svg/italic.svg?component';
import Strike from '../assets/svg/strikethrough.svg?component';
import BulletList from '../assets/svg/list.svg?component';
import Task from '../assets/svg/square-check.svg?component';
import TableSVG from '../assets/svg/table.svg?component';
import ImageUp from '../assets/svg/image-up.svg?component';
import CodeSVG from '../assets/svg/code.svg?component';

const props = defineProps([
  'value',
  'isDeleted',
  'settings',
]);

const emit = defineEmits([
  'changeContent',
]);

const CustomImage = TipTapImage.configure({
  HTMLAttributes: {
    onError: "this.onerror=null;this.src='/img/no-picture-available.jpg';",
  },
});

let editor: Editor;
onMounted(() => {
  const value = props.value;
  editor = new Editor({
    // content: value.replace(/(\n)(?!\|)/g, '  \n\n'),
    content: value,
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
      CustomImage.configure({
        allowBase64: false,
      }),
      CodeBlock,
    ],
    editorProps: {
      attributes: {
        class: `px-2 lg:px-8 py-6 ${props.settings?.general.editorView === 'compact' ? 'max-w-screen-md' : ''}`,
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

const addImage = () => {
  const url = window.prompt('URL');
  const alt = window.prompt('Alt', "Image");

  if (url) {
    editor.chain().focus().setImage({ src: url, alt: alt! }).run();
  }
}

const focus = (location: 'start' | 'end' = 'start') => {
  // if (!editor.isFocused) {
  //   editor.commands.focus(location);
  // }
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
    <div class="control-group w-full sticky top-0 z-50 bg-base-100">
      <div class="button-group flex gap-2 flex-wrap lg:px-8 lg:py-2 p-2 mx-auto"
        :class="{ 'max-w-screen-md': settings?.general.editorView === 'compact' }">
        <button @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
          :class="{ 'is-active': editor.isActive('heading', { level: 1 }) }" :disabled="!editor.isEditable">
          <span class="flex gap-1">
            <H class="cursor-pointer opacity-80" />
            H1
          </span>

        </button>
        <button @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
          :class="{ 'is-active': editor.isActive('heading', { level: 2 }) }" :disabled="!editor.isEditable">
          <span class="flex gap-1">
            <H class="cursor-pointer opacity-80" />
            H2
          </span>
        </button>
        <button @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
          :class="{ 'is-active': editor.isActive('heading', { level: 3 }) }" :disabled="!editor.isEditable">
          <span class="flex gap-1">
            <H class="cursor-pointer opacity-80" />
            H3
          </span>
        </button>
        <button @click="editor.chain().focus().setParagraph().run()"
          :class="{ 'is-active': editor.isActive('paragraph') }" :disabled="!editor.isEditable">
          <span class="flex gap-1 items-center">
            <Pilcrow class="cursor-pointer opacity-80" />
            Paragraph
          </span>
        </button>
        <button @click="editor.chain().focus().toggleCodeBlock().run()"
          :disabled="editor.isActive('codeBlock') || !editor.isEditable"
          :class="{ 'is-active': editor.isActive('codeBlock') }">
          <span class="flex gap-1 items-center">
            <CodeSVG class="cursor-pointer opacity-80" />
            Code
          </span>
        </button>
        <button @click="editor.chain().focus().toggleBold().run()" :class="{ 'is-active': editor.isActive('bold') }"
          :disabled="!editor.isEditable">
          <span class="flex gap-1 items-center">
            <Bold class="cursor-pointer opacity-80" />
            Bold
          </span>
        </button>
        <button @click="editor.chain().focus().toggleItalic().run()" :class="{ 'is-active': editor.isActive('italic') }"
          :disabled="!editor.isEditable">
          <span class="flex gap-1 items-center">
            <ItalicSVG class="cursor-pointer opacity-80" />
            Italic
          </span>
        </button>
        <button @click="editor.chain().focus().toggleStrike().run()" :class="{ 'is-active': editor.isActive('strike') }"
          :disabled="!editor.isEditable">
          <span class="flex gap-1 items-center">
            <Strike class="cursor-pointer opacity-80" />
            Strike
          </span>
        </button>
        <button @click="editor.chain().focus().toggleBulletList().run()"
          :class="{ 'is-active': editor.isActive('bulletList') }" :disabled="!editor.isEditable">
          <span class="flex gap-1 items-center">
            <BulletList class="cursor-pointer opacity-80" />
            Bullet List
          </span>
        </button>
        <button @click="editor.chain().focus().toggleTaskList().run()"
          :class="{ 'is-active': editor.isActive('taskList') }" :disabled="!editor.isEditable">
          <span class="flex gap-1 items-center">
            <Task class="cursor-pointer opacity-80" />
            Task List
          </span>
        </button>
        <button @click="editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true, }).run()"
          :class="{ 'is-active': editor.isActive('table') }" :disabled="!editor.isEditable">
          <span class="flex gap-1 items-center">
            <TableSVG class="cursor-pointer opacity-80" />
            Table
          </span>
        </button>
      </div>
    </div>

    <bubble-menu :editor="editor" :tippy-options="{ duration: 100 }" v-if="editor && editor.isActive('image')">
      <div class="bubble-menu">
        <button @click="addImage" :disabled="!editor.isEditable">
          <span class="flex gap-1 items-center">
            <ImageUp class="cursor-pointer opacity-80" />
            Change Image
          </span>
        </button>
      </div>
    </bubble-menu>

    <editor-content :editor="editor" />
  </client-only>
</template>

<style>
.tiptap {
  outline: none;
  line-height: 32px;

  /* &:last-child {
    padding-bottom: 64px !important;
  } */

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

button {
  @apply bg-base-300 rounded border-none text-sm font-medium py-1 px-2 transition;
}

button.is-active,
input.is-active,
select.is-active,
textarea.is-active {
  @apply bg-primary text-primary-content;
}
</style>
