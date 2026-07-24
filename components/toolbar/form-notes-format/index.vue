<script lang="ts" setup>
import {
  createCodeBlockCommand,
  toggleEmphasisCommand,
  toggleStrongCommand,
  turnIntoTextCommand,
  wrapInBulletListCommand,
  wrapInHeadingCommand,
  wrapInBlockTypeCommand,
  listItemSchema,
} from "@milkdown/kit/preset/commonmark";
import { commandsCtx, editorViewCtx } from "@milkdown/kit/core";
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

// helper to focus the crepe editor after executing a command
const focusCrepeEditor = () => {
  props.editor?.action((ctx: any) => {
    const view = ctx.get(editorViewCtx);
    view.focus();
  });
};

const handleClickHeading = (level: number) => {
  switch (props.editorType) {
    case 'tiptap':
      props.editor?.chain().focus().toggleHeading({ level }).run();
      break;
    case 'crepe':
      props.editor?.action(callCommand(wrapInHeadingCommand.key, level));
      focusCrepeEditor();
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
      focusCrepeEditor();
      break;
  }
};

const handleClickTaskList = () => {
  switch (props.editorType) {
    case 'tiptap':
      props.editor?.chain().focus().toggleTaskList().run();
      break;
    case 'crepe':
      props.editor?.action((ctx: any) => {
        const commands = ctx.get(commandsCtx);
        const listItem = listItemSchema.type(ctx);
        commands.call(wrapInBlockTypeCommand.key, {
          nodeType: listItem,
          attrs: { checked: false },
        });
        const view = ctx.get(editorViewCtx);
        view.focus();
      });
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
      focusCrepeEditor();
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
      focusCrepeEditor();
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
      focusCrepeEditor();
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
      focusCrepeEditor();
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
      focusCrepeEditor();
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
      focusCrepeEditor();
      break;
  }
};
</script>

<template>
  <div
    class="flex gap-6 flex-row justify-between items-center bg-primary p-1 rounded-lg shadow-lg animate-fade-up animate-duration-300 border border-neutral">
    <div class="flex flex-row gap-2 items-center">
      <div class="dropdown dropdown-top dropdown-start flex items-center">
        <div tabindex="0" role="button"
          class="btn btn-xs lg:btn-sm btn-square border-none bg-primary-content/20 hover:bg-primary-content/30 text-primary-content"
          :class="{ '!bg-primary-content !text-primary': false }">
          <H class="size-4 lg:size-5 cursor-pointer" />
        </div>
        <ul tabindex="0" class="dropdown-content menu bg-base-200 border border-neutral rounded-box z-[1] shadow">
          <li @click="() => handleClickHeading(1)"><a>H1</a></li>
          <li @click="() => handleClickHeading(2)"><a>H2</a></li>
          <li @click="() => handleClickHeading(3)"><a>H3</a></li>
        </ul>
      </div>

      <button class="btn btn-xs lg:btn-sm btn-square bg-primary-content/20 hover:bg-primary-content/30 text-primary-content"
        :class="{ '!bg-primary-content !text-primary': false }" @click="handleClickTaskList()">
        <Task class="size-4 lg:size-5 cursor-pointer" />
      </button>

      <button class="btn btn-xs lg:btn-sm btn-square bg-primary-content/20 hover:bg-primary-content/30 text-primary-content"
        :class="{ '!bg-primary-content !text-primary': false }" @click="handleClickBulletList()">
        <BulletList class="size-4 lg:size-5 cursor-pointer" />
      </button>

      <button class="btn btn-xs lg:btn-sm btn-square bg-primary-content/20 hover:bg-primary-content/30 text-primary-content"
        :class="{ '!bg-primary-content !text-primary': false }" @click="handleClickParagraph()">
        <Pilcrow class="size-4 lg:size-5 cursor-pointer" />
      </button>
    </div>
    <div class="flex flex-row gap-2">
      <button class="btn btn-xs lg:btn-sm btn-square bg-primary-content/20 hover:bg-primary-content/30 text-primary-content"
        :class="{ '!bg-primary-content !text-primary': false }" @click="handleClickBold()">
        <Bold class="size-4 lg:size-5 cursor-pointer" />
      </button>

      <button class="btn btn-xs lg:btn-sm btn-square bg-primary-content/20 hover:bg-primary-content/30 text-primary-content"
        :class="{ '!bg-primary-content !text-primary': false }" @click="handleClickItalic()">
        <ItalicSVG class="size-4 lg:size-5 cursor-pointer" />
      </button>

      <button class="btn btn-xs lg:btn-sm btn-square bg-primary-content/20 hover:bg-primary-content/30 text-primary-content"
        :class="{ '!bg-primary-content !text-primary': false }" @click="handleClickStrike()">
        <Strike class="size-4 lg:size-5 cursor-pointer" />
      </button>
    </div>
    <div class="flex flex-row gap-2">
      <button class="btn btn-xs lg:btn-sm btn-square bg-primary-content/20 hover:bg-primary-content/30 text-primary-content"
        :class="{ '!bg-primary-content !text-primary': false }" @click="handleClickImage()">
        <ImageUp class="size-4 lg:size-5 cursor-pointer" />
      </button>

      <button class="btn btn-xs lg:btn-sm btn-square bg-primary-content/20 hover:bg-primary-content/30 text-primary-content"
        :class="{ '!bg-primary-content !text-primary': false }" @click="handleClickCodeBlock()">
        <CodeSVG class="size-4 lg:size-5 cursor-pointer" />
      </button>
    </div>
  </div>
</template>
