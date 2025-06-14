<script lang="ts" setup>
import H from '../assets/svg/h.svg?component';
import Task from '../assets/svg/square-check.svg?component';
import BulletList from '../assets/svg/list.svg?component';
import Bold from '../assets/svg/bold.svg?component';
import ItalicSVG from '../assets/svg/italic.svg?component';
import Strike from '../assets/svg/strikethrough.svg?component';
import ImageUp from '../assets/svg/image-up.svg?component';
import CodeSVG from '../assets/svg/code.svg?component';
import Pilcrow from '../assets/svg/pilcrow.svg?component';

const props = defineProps([
  'editor',
]);

const emit = defineEmits(['insertImage']);

const clickInsertImage = () => {
  emit('insertImage');
};

</script>

<template>
  <div
    class="flex gap-6 flex-row justify-between items-center bg-primary p-1 rounded-lg shadow-lg animate-fade-up animate-duration-300">
    <div class="flex flex-row gap-2">
      <div class="dropdown dropdown-top dropdown-start">
        <div tabindex="0" role="button"
          class="btn btn-sm btn-square border-none bg-primary-content/20 hover:bg-primary-content/30 text-primary-content"
          :class="{ '!bg-primary-content !text-primary': props.editor.isActive('heading') }">
          <H class="cursor-pointer" />
        </div>
        <ul tabindex="0" class="dropdown-content menu bg-base-200 border border-neutral rounded-box z-[1] shadow">
          <li @click="props.editor.chain().focus().toggleHeading({ level: 1 }).run()"><a>H1</a></li>
          <li @click="props.editor.chain().focus().toggleHeading({ level: 2 }).run()"><a>H2</a></li>
          <li @click="props.editor.chain().focus().toggleHeading({ level: 3 }).run()"><a>H3</a></li>
          <li @click="props.editor.chain().focus().clearNodes().run()"><a>Paragraph</a></li>
        </ul>
      </div>
      <!-- <button class="btn btn-sm btn-square bg-primary-content/20 hover:bg-primary-content/30 text-primary-content">
        <H class="cursor-pointer" />
      </button> -->

      <button class="btn btn-sm btn-square bg-primary-content/20 hover:bg-primary-content/30 text-primary-content"
        :class="{ '!bg-primary-content !text-primary': props.editor.isActive('taskList') }"
        @click="editor.chain().focus().toggleTaskList().run()">
        <Task class="cursor-pointer" />
      </button>

      <button class="btn btn-sm btn-square bg-primary-content/20 hover:bg-primary-content/30 text-primary-content"
        :class="{ '!bg-primary-content !text-primary': props.editor.isActive('bulletList') }"
        @click="props.editor.chain().focus().toggleBulletList().run()">
        <BulletList class="cursor-pointer" />
      </button>

      <button class="btn btn-sm btn-square bg-primary-content/20 hover:bg-primary-content/30 text-primary-content"
        :class="{ '!bg-primary-content !text-primary': props.editor.isActive('paragraph') }"
        @click="props.editor.chain().focus().toggleParagraph().run()">
        <Pilcrow class="cursor-pointer" />
      </button>
    </div>
    <div class="flex flex-row gap-2">
      <button class="btn btn-sm btn-square bg-primary-content/20 hover:bg-primary-content/30 text-primary-content"
        :class="{ '!bg-primary-content !text-primary': props.editor.isActive('bold') }"
        @click="props.editor.chain().focus().toggleBold().run()">
        <Bold class="cursor-pointer" />
      </button>

      <button class="btn btn-sm btn-square bg-primary-content/20 hover:bg-primary-content/30 text-primary-content"
        :class="{ '!bg-primary-content !text-primary': props.editor.isActive('italic') }"
        @click="props.editor.chain().focus().toggleItalic().run()">
        <ItalicSVG class="cursor-pointer" />
      </button>

      <button class="btn btn-sm btn-square bg-primary-content/20 hover:bg-primary-content/30 text-primary-content"
        :class="{ '!bg-primary-content !text-primary': props.editor.isActive('strike') }"
        @click="props.editor.chain().focus().toggleStrike().run()">
        <Strike class="cursor-pointer" />
      </button>
    </div>
    <div class="flex flex-row gap-2">
      <button class="btn btn-sm btn-square bg-primary-content/20 hover:bg-primary-content/30 text-primary-content"
        :class="{ '!bg-primary-content !text-primary': props.editor.isActive('image') }" @click="clickInsertImage">
        <ImageUp class="cursor-pointer" />
      </button>

      <button class="btn btn-sm btn-square bg-primary-content/20 hover:bg-primary-content/30 text-primary-content"
        :class="{ '!bg-primary-content !text-primary': props.editor.isActive('codeBlock') }"
        @click="editor.chain().focus().toggleCodeBlock().run()">
        <CodeSVG class="cursor-pointer" />
      </button>
    </div>
  </div>
</template>
