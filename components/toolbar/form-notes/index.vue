<script lang="ts" setup>
import Info from '../assets/svg/info.svg?component';
import Menu from '../assets/svg/menu-vertical.svg?component';
import PanelLeft from '../assets/svg/panel-left.svg?component';
import Type from '../assets/svg/type.svg?component';
import ToolCase from '../assets/svg/tool-case.svg?component';
import Search from '~/assets/svg/search.svg?component';
import Copy from '~/assets/svg/copy.svg?component';
import Article from '~/assets/svg/article.svg?component';

const props = defineProps([
  'noteId',
  'editorName',
  'isLocked',
  'formNotes',
]);

const emit = defineEmits([
  'clickInfo',
  'clickCollapsePanel',
  'clickFormatToolbar',
  'copyNote',
  'clickSwitchEditor',
  'clickPlainText',
  'handleClickPlainText',
  'clickSearchInNote',
]);

const handleClickInfo = () => {
  emit('clickInfo', props.noteId);
}
const handleClickCollapsePanel = () => {
  emit('clickCollapsePanel');
}
const handleClickFormatToolbar = () => {
  emit('clickFormatToolbar', props.noteId);
}
const handleClickCopyNote = () => {
  emit('copyNote', props.noteId);
}
const handleClickChangeEditor = () => {
  emit('clickSwitchEditor', props.noteId);
}
const handleClickPlainText = () => {
  emit('clickPlainText', props.noteId);
}
const handleClickSearchInNote = () => {
  emit('clickSearchInNote', props.noteId);
}
</script>

<template>
  <div class="hidden lg:flex px-4 flex justify-between items-center h-20 bg-base-100">
    <div v-if="props.noteId" class="flex items-center gap-4 cursor-pointer p-2 rounded-full bg-base-300">
      <PanelLeft @click="handleClickCollapsePanel" />
    </div>

    <div v-if="!props.isLocked" class="flex items-center gap-3">
      <div v-if="['Tiptap', 'Crepe'].includes(props.editorName) && props.noteId" class="p-2 rounded-full bg-base-300"
        @click="handleClickFormatToolbar">
        <ToolCase class="press cursor-pointer" />
      </div>

      <div v-if="props.noteId" class="p-2 rounded-full bg-base-300" @click="handleClickPlainText">
        <Type class="press cursor-pointer" />
      </div>

      <div v-if="props.noteId" class="p-2 rounded-full bg-base-300" @click="handleClickSearchInNote">
        <Search class="press cursor-pointer" />
      </div>

      <div v-if="props.noteId" class="p-2 rounded-full bg-base-300" @click="handleClickInfo">
        <Info class="press cursor-pointer" />
      </div>

      <div class="flex items-center">
        <div class="dropdown dropdown-bottom dropdown-end">
          <div v-if="props.noteId" tabindex="0" role="button" class="m-1 p-2 rounded-full bg-base-300">
            <Menu class="press cursor-pointer" />
          </div>

          <ul tabindex="0"
            class="dropdown-content menu rounded-box bg-base-200 z-[1] w-48 shadow border border-neutral">
            <li class="" @click="handleClickCopyNote">
              <a class="flex flex-row items-center gap-3">
                <Copy />
                <span class="flex items-center justify-center">{{ $t('app.menu_note_copy') }}</span>
              </a>
            </li>
            <li class="" @click="handleClickChangeEditor">
              <a class="flex flex-row items-center gap-3">
                <Article />
                <span class="flex items-center justify-center">{{ $t('app.menu_note_change_editor') }}</span>
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div class=""></div>
    </div>
  </div>
</template>
