<script lang="ts" setup>
import {
  createCodeBlockCommand,
  toggleEmphasisCommand,
  toggleStrongCommand,
  turnIntoTextCommand,
  wrapInBulletListCommand,
  wrapInHeadingCommand,
  wrapInOrderedListCommand,
} from "@milkdown/kit/preset/commonmark";
import { toggleStrikethroughCommand } from "@milkdown/kit/preset/gfm";
import { callCommand } from "@milkdown/kit/utils";
import { insert } from "@milkdown/kit/utils";

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
  'editorType'
]);

const emit = defineEmits(['insertImage']);

const clickInsertImage = () => {
  emit('insertImage');
};

const handleClickHeading = (level: number) => {
  switch (props.editorType) {
    case 'tiptap':
      props.editor?.chain().focus().toggleHeading({ level }).run();
      break;
    case 'crepe':
      props.editor?.action(callCommand(wrapInHeadingCommand.key, level));
      break;
  }
};

const handleClickParagraph = () => {
  switch (props.editorType) {
    case 'tiptap':
      props.editor?.chain().focus().clearNodes().run();
      break;
    case 'crepe':
      props.editor?.action(callCommand(turnIntoTextCommand.key));
      break;
  }
};

const handleClickTaskList = () => {
  switch (props.editorType) {
    case 'tiptap':
      props.editor?.chain().focus().toggleTaskList().run();
      break;
    case 'crepe':
      props.editor?.action(callCommand(wrapInOrderedListCommand.key));
      break;
  }
};

const handleClickBulletList = () => {
  switch (props.editorType) {
    case 'tiptap':
      props.editor?.chain().focus().toggleBulletList().run();
      break;
    case 'crepe':
      props.editor?.action(callCommand(wrapInBulletListCommand.key));
      break;
  }
};

const handleClickBold = () => {
  switch (props.editorType) {
    case 'tiptap':
      props.editor?.chain().focus().toggleBold().run();
      break;
    case 'crepe':
      props.editor?.action(callCommand(toggleStrongCommand.key));
      break;
  }
};

const handleClickItalic = () => {
  switch (props.editorType) {
    case 'tiptap':
      props.editor?.chain().focus().toggleItalic().run();
      break;
    case 'crepe':
      props.editor?.action(callCommand(toggleEmphasisCommand.key));
      break;
  }
};

const handleClickStrike = () => {
  switch (props.editorType) {
    case 'tiptap':
      props.editor?.chain().focus().toggleStrike().run();
      break;
    case 'crepe':
      props.editor?.action(callCommand(toggleStrikethroughCommand.key));
      break;
  }
};

const handleClickImage = () => {
  switch (props.editorType) {
    case 'tiptap':
      clickInsertImage();
      break;
    case 'crepe':
      props.editor?.action(insert('![]()'));
      break;
  }
};

const handleClickCodeBlock = () => {
  switch (props.editorType) {
    case 'tiptap':
      props.editor?.chain().focus().toggleCodeBlock().run();
      break;
    case 'crepe':
      props.editor?.action(callCommand(createCodeBlockCommand.key));
      break;
  }
};
</script>

<template>
  <div
    class="flex gap-6 flex-row justify-between items-center bg-primary p-1 rounded-lg shadow-lg animate-fade-up animate-duration-300 border border-neutral">
    <div class="flex flex-row gap-2">
      <div class="dropdown dropdown-top dropdown-start">
        <div tabindex="0" role="button"
          class="btn btn-sm btn-square border-none bg-primary-content/20 hover:bg-primary-content/30 text-primary-content"
          :class="{ '!bg-primary-content !text-primary': false }">
          <H class="cursor-pointer" />
        </div>
        <ul tabindex="0" class="dropdown-content menu bg-base-200 border border-neutral rounded-box z-[1] shadow">
          <li @click="() => handleClickHeading(1)"><a>H1</a></li>
          <li @click="() => handleClickHeading(2)"><a>H2</a></li>
          <li @click="() => handleClickHeading(3)"><a>H3</a></li>
        </ul>
      </div>

      <button class="btn btn-sm btn-square bg-primary-content/20 hover:bg-primary-content/30 text-primary-content"
        :class="{ '!bg-primary-content !text-primary': false }" @click="handleClickTaskList()">
        <Task class="cursor-pointer" />
      </button>

      <button class="btn btn-sm btn-square bg-primary-content/20 hover:bg-primary-content/30 text-primary-content"
        :class="{ '!bg-primary-content !text-primary': false }" @click="handleClickBulletList()">
        <BulletList class="cursor-pointer" />
      </button>

      <button class="btn btn-sm btn-square bg-primary-content/20 hover:bg-primary-content/30 text-primary-content"
        :class="{ '!bg-primary-content !text-primary': false }" @click="handleClickParagraph()">
        <Pilcrow class="cursor-pointer" />
      </button>
    </div>
    <div class="flex flex-row gap-2">
      <button class="btn btn-sm btn-square bg-primary-content/20 hover:bg-primary-content/30 text-primary-content"
        :class="{ '!bg-primary-content !text-primary': false }" @click="handleClickBold()">
        <Bold class="cursor-pointer" />
      </button>

      <button class="btn btn-sm btn-square bg-primary-content/20 hover:bg-primary-content/30 text-primary-content"
        :class="{ '!bg-primary-content !text-primary': false }" @click="handleClickItalic()">
        <ItalicSVG class="cursor-pointer" />
      </button>

      <button class="btn btn-sm btn-square bg-primary-content/20 hover:bg-primary-content/30 text-primary-content"
        :class="{ '!bg-primary-content !text-primary': false }" @click="handleClickStrike()">
        <Strike class="cursor-pointer" />
      </button>
    </div>
    <div class="flex flex-row gap-2">
      <button class="btn btn-sm btn-square bg-primary-content/20 hover:bg-primary-content/30 text-primary-content"
        :class="{ '!bg-primary-content !text-primary': false }" @click="handleClickImage()">
        <ImageUp class="cursor-pointer" />
      </button>

      <button class="btn btn-sm btn-square bg-primary-content/20 hover:bg-primary-content/30 text-primary-content"
        :class="{ '!bg-primary-content !text-primary': false }" @click="handleClickCodeBlock()">
        <CodeSVG class="cursor-pointer" />
      </button>
    </div>
  </div>
</template>
