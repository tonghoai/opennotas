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
import CodeBlock from '@tiptap/extension-code-block';
import Link from '@tiptap/extension-link';

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

const { $i18n } = useNuxtApp();

const props = defineProps([
  'value',
  'isDeleted',
  'settings',
]);

const emit = defineEmits([
  'changeContent',
  'clickInsertLink',
  'closeInsertLink',
  'clickInsertImage',
  'closeInsertImage',
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
      Link.configure({
        openOnClick: false,
      }),
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
      try {
        const markdownContent = editor.storage.markdown.getMarkdown();
        const content = markdownContent
          .replace(/\\/g, '')
        // .replace(/\n\n/g, '\n')
        // .replace(/&hairsp;/g, '')
        // .replace(/ /g, '')
        emit('changeContent', content);
      } catch (_) {
        showErrorSnackbar($i18n.t('app.message_note_can_not_save'));
      }
    }
  });
});

// watch(() => props.value, (newValue) => {
//   editor.commands.setContent(/\s*\]\s*$/.test(newValue) ? `${newValue}&hairsp;` : newValue);
// });

const clickInsertImage = () => {
  const image = editor.getAttributes('image');

  emit('clickInsertImage', { url: image?.src, alt: image?.alt });
}
const handleInsertImage = ({ url, alt }: { url: string, alt: string }) => {
  editor.chain().focus().setParagraph().setImage({ src: url, alt: alt }).run();

  try {
    const oldValue = editor.storage.markdown.getMarkdown();
    const newValue = oldValue.replace(/(!\[\]\(.*?\))(?!\n\n)/g, "$1\n\n");
    emit('changeContent', newValue);
  } catch (_) {
    showErrorSnackbar($i18n.t('app.message_note_can_not_save'));
  }

  emit('closeInsertImage');
}

const clickInsertLink = () => {
  const link = editor.getAttributes('link');

  emit('clickInsertLink', { url: link?.href });
}
const handleInsertLink = (data: any) => {
  editor.chain().focus().setLink({ href: data.url }).run();
  editor.commands.focus(editor.state.selection.to + 1);
  emit('closeInsertLink');
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
  clickInsertLink,
  handleInsertLink,
  clickInsertImage,
  handleInsertImage,
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

const checkIsInLink = () => {
  const { from, to } = editor.state.selection;
  const node = editor.state.doc.nodeAt(from);

  let isEntireLinkSelected = false;

  if (node) {
    const linkMark = node.marks.find(mark => mark.type.name === 'link');
    if (linkMark) {
      const nodeStart = from - editor.state.doc.resolve(from).textOffset;
      const nodeEnd = nodeStart + node.nodeSize;
      if (nodeStart === from && nodeEnd === to) {
        isEntireLinkSelected = true;
      }
    }
  }

  return isEntireLinkSelected;
}

</script>

<template>
  <client-only>
    <div class="control-group w-full sticky top-0 z-50 bg-base-100">
      <div class="flex flex-wrap gap-2 lg:px-8 lg:py-2 p-2 mx-auto"
        :class="{ 'max-w-screen-md': settings?.general.editorView === 'compact' }">
        <div class="flex gap-2 w-full">
          <button @click="editor.chain().focus().toggleHeading({ level: 1 }).run()" class="flex-1"
            :class="{ 'is-active': editor.isActive('heading', { level: 1 }) }" :disabled="!editor.isEditable">
            <span class="flex gap-1 items-center justify-center">
              <H class="cursor-pointer opacity-80" />
              <span class="hidden sm:block">H1</span>
            </span>
          </button>
          <button @click="editor.chain().focus().toggleHeading({ level: 2 }).run()" class="flex-1"
            :class="{ 'is-active': editor.isActive('heading', { level: 2 }) }" :disabled="!editor.isEditable">
            <span class="flex gap-1 items-center justify-center">
              <H class="cursor-pointer opacity-80" />
              <span class="hidden sm:block">H2</span>
            </span>
          </button>
          <button @click="editor.chain().focus().toggleHeading({ level: 3 }).run()" class="flex-1"
            :class="{ 'is-active': editor.isActive('heading', { level: 3 }) }" :disabled="!editor.isEditable">
            <span class="flex gap-1 items-center justify-center">
              <H class="cursor-pointer opacity-80" />
              <span class="hidden sm:block">H3</span>
            </span>
          </button>
          <button @click="editor.chain().focus().setParagraph().run()" class="flex-1"
            :class="{ 'is-active': editor.isActive('paragraph') }" :disabled="!editor.isEditable">
            <span class="flex gap-1 items-center justify-center">
              <Pilcrow class="cursor-pointer opacity-80" />
              <span class="hidden sm:block">Para.</span>
            </span>
          </button>
          <button @click="editor.chain().focus().toggleCodeBlock().run()" class="flex-1"
            :disabled="editor.isActive('codeBlock') || !editor.isEditable"
            :class="{ 'is-active': editor.isActive('codeBlock') }">
            <span class="flex gap-1 items-center justify-center">
              <CodeSVG class="cursor-pointer opacity-80" />
              <span class="hidden sm:block">Code</span>
            </span>
          </button>
          <button @click="editor.chain().focus().toggleBold().run()" class="flex-1"
            :class="{ 'is-active': editor.isActive('bold') }" :disabled="!editor.isEditable">
            <span class="flex gap-1 items-center justify-center">
              <Bold class="cursor-pointer opacity-80" />
              <span class="hidden sm:block">Bold</span>
            </span>
          </button>
        </div>

        <div class="flex gap-2 w-full">
          <button @click="editor.chain().focus().toggleItalic().run()" class="flex-1"
            :class="{ 'is-active': editor.isActive('italic') }" :disabled="!editor.isEditable">
            <span class="flex gap-1 items-center justify-center">
              <ItalicSVG class="cursor-pointer opacity-80" />
              <span class="hidden sm:block">Italic</span>
            </span>
          </button>
          <button @click="editor.chain().focus().toggleStrike().run()" class="flex-1"
            :class="{ 'is-active': editor.isActive('strike') }" :disabled="!editor.isEditable">
            <span class="flex gap-1 items-center justify-center">
              <Strike class="cursor-pointer opacity-80" />
              <span class="hidden sm:block">Strike</span>
            </span>
          </button>
          <button @click="editor.chain().focus().toggleBulletList().run()" class="flex-1"
            :class="{ 'is-active': editor.isActive('bulletList') }" :disabled="!editor.isEditable">
            <span class="flex gap-1 items-center justify-center">
              <BulletList class="cursor-pointer opacity-80" />
              <span class="hidden sm:block">List</span>
            </span>
          </button>
          <button @click="editor.chain().focus().toggleTaskList().run()" class="flex-1"
            :class="{ 'is-active': editor.isActive('taskList') }" :disabled="!editor.isEditable">
            <span class="flex gap-1 items-center justify-center">
              <Task class="cursor-pointer opacity-80" />
              <span class="hidden sm:block">Task</span>
            </span>
          </button>
          <button @click="editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true, }).run()"
            class="flex-1 opacity-50 cursor-not-allowed" :class="{ 'is-active': editor.isActive('table') }"
            :disabled="true">
            <span class="flex gap-1 items-center justify-center">
              <TableSVG class="cursor-pointer opacity-80" />
              <span class="hidden sm:block">Table</span>
            </span>
          </button>
          <button @click="clickInsertImage" class="flex-1" :class="{ 'is-active': editor.isActive('image') }"
            :disabled="!editor.isEditable">
            <span class="flex gap-1 items-center justify-center">
              <ImageUp class="cursor-pointer opacity-80" />
              <span class="hidden sm:block">Image</span>
            </span>
          </button>
        </div>
      </div>
    </div>

    <bubble-menu :editor="editor" :tippy-options="{ duration: 100, hideOnClick: 'toggle' }"
      :should-show="() => editor.isActive('image')">
      <div class="bubble-menu">
        <button class="btn btn-accent btn-xs" @click="clickInsertImage" :disabled="!editor.isEditable">
          <span class="flex gap-1 items-center text-xs font-semibold">
            Change Image
          </span>
        </button>
      </div>
    </bubble-menu>

    <bubble-menu :editor="editor" :tippy-options="{ duration: 100, hideOnClick: 'toggle' }"
      :should-show="checkIsInLink">
      <div class="bubble-menu flex gap-2">
        <button class="btn btn-accent btn-xs" @click="clickInsertLink" :disabled="!editor.isEditable">
          <span class="flex gap-1 items-center text-xs font-semibold">
            Edit
          </span>
        </button>

        <button class="btn btn-accent btn-xs" @click="editor.chain().focus().unsetAllMarks().run()"
          :disabled="!editor.isEditable">
          <span class="flex gap-1 items-center text-xs font-semibold">
            Clear Format
          </span>
        </button>
      </div>
    </bubble-menu>

    <bubble-menu :editor="editor" :tippy-options="{ duration: 100, hideOnClick: 'toggle' }"
      :should-show="() => editor.state.selection.from !== editor.state.selection.to && !editor.isActive('link') && !editor.isActive('image') && !editor.isActive('codeBlock')">
      <div class="bubble-menu flex gap-2">
        <button class="btn btn-accent btn-xs" @click="clickInsertLink" :disabled="!editor.isEditable">
          <span class="flex gap-1 items-center text-xs font-semibold">
            Insert Link
          </span>
        </button>

        <button class="btn btn-accent btn-xs" @click="editor.chain().focus().unsetAllMarks().run()"
          :disabled="!editor.isEditable">
          <span class="flex gap-1 items-center text-xs font-semibold">
            Clear Format
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
