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

import { H } from '~/utils/icons';
import { Task } from '~/utils/icons';
import { BulletList } from '~/utils/icons';
import { Bold } from '~/utils/icons';
import { ItalicSVG } from '~/utils/icons';
import { Strike } from '~/utils/icons';
import { ImageUp } from '~/utils/icons';
import { CodeSVG } from '~/utils/icons';
import { Pilcrow } from '~/utils/icons';

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
  clickInsertImage();
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
    class="ui-format-toolbar flex max-w-[calc(100vw-1rem)] flex-wrap items-center gap-1 rounded-ui border border-border bg-popover p-1.5 text-popover-foreground shadow-md">
    <div class="flex items-center gap-0.5">
      <div class="ui-dropdown ui-dropdown-top ui-dropdown-start flex items-center">
        <button type="button" class="ui-format-btn" :aria-label="$t('app.format_heading')"
          :title="$t('app.format_heading')">
          <H class="h-4 w-4" />
        </button>
        <ul tabindex="0" class="ui-dropdown-content ui-menu border border-border bg-popover text-popover-foreground">
          <li @click="handleClickHeading(1)"><button type="button">H1</button></li>
          <li @click="handleClickHeading(2)"><button type="button">H2</button></li>
          <li @click="handleClickHeading(3)"><button type="button">H3</button></li>
        </ul>
      </div>

      <button type="button" class="ui-format-btn" :aria-label="$t('app.format_task')"
        :title="$t('app.format_task')" @click="handleClickTaskList">
        <Task class="h-4 w-4" />
      </button>

      <button type="button" class="ui-format-btn" :aria-label="$t('app.format_bullet')"
        :title="$t('app.format_bullet')" @click="handleClickBulletList">
        <BulletList class="h-4 w-4" />
      </button>

      <button type="button" class="ui-format-btn" :aria-label="$t('app.format_paragraph')"
        :title="$t('app.format_paragraph')" @click="handleClickParagraph">
        <Pilcrow class="h-4 w-4" />
      </button>
    </div>

    <span class="mx-1.5 hidden h-5 w-px bg-border sm:block" aria-hidden="true"></span>

    <div class="flex items-center gap-0.5">
      <button type="button" class="ui-format-btn" :aria-label="$t('app.format_bold')"
        :title="$t('app.format_bold')" @click="handleClickBold">
        <Bold class="h-4 w-4" />
      </button>

      <button type="button" class="ui-format-btn" :aria-label="$t('app.format_italic')"
        :title="$t('app.format_italic')" @click="handleClickItalic">
        <ItalicSVG class="h-4 w-4" />
      </button>

      <button type="button" class="ui-format-btn" :aria-label="$t('app.format_strike')"
        :title="$t('app.format_strike')" @click="handleClickStrike">
        <Strike class="h-4 w-4" />
      </button>
    </div>

    <span class="mx-1.5 hidden h-5 w-px bg-border sm:block" aria-hidden="true"></span>

    <div class="flex items-center gap-0.5">
      <button type="button" class="ui-format-btn" :aria-label="$t('app.format_image')"
        :title="$t('app.format_image')" @click="handleClickImage">
        <ImageUp class="h-4 w-4" />
      </button>

      <button type="button" class="ui-format-btn" :aria-label="$t('app.format_code')"
        :title="$t('app.format_code')" @click="handleClickCodeBlock">
        <CodeSVG class="h-4 w-4" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.ui-format-toolbar {
  border-color: rgb(var(--ui-border-strong));
}

.ui-format-btn {
  display: inline-flex;
  height: 2rem;
  width: 2rem;
  flex: none;
  align-items: center;
  justify-content: center;
  border-radius: calc(var(--ui-radius) - 2px);
  color: rgb(var(--ui-popover-foreground));
  transition: background-color var(--ui-duration-fast) var(--ui-ease);
}

.ui-format-btn:hover,
.ui-format-btn:focus-visible {
  background-color: rgb(var(--ui-accent));
  color: rgb(var(--ui-accent-foreground));
  outline: none;
}

@media (max-width: 1023.98px) {
  .ui-format-btn {
    height: 2.5rem;
    width: 2.5rem;
  }
}
</style>
