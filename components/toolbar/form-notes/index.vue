<script lang="ts" setup>
import Info from '../assets/svg/info.svg?component';
import Menu from '../assets/svg/menu-vertical.svg?component';
import PanelLeft from '../assets/svg/panel-left.svg?component';
import Aa from '../assets/svg/aa.svg?component';

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
</script>

<template>
  <div class="hidden lg:flex px-4 flex justify-between items-center h-20 bg-base-100">
    <div class="flex items-center gap-4 cursor-pointer">
      <PanelLeft v-if="props.noteId" @click="handleClickCollapsePanel" />
    </div>

    <div v-if="!props.isLocked" class="flex items-center gap-4">
      <div class="mr-2" @click="handleClickFormatToolbar">
        <Aa v-if="props.noteId" class="press cursor-pointer" />
      </div>

      <div class="" @click="handleClickInfo">
        <Info v-if="props.noteId" class="press cursor-pointer" />
      </div>

      <div class="flex items-center">
        <div class="dropdown dropdown-bottom dropdown-end">
          <div tabindex="0" role="button" class="m-1">
            <Menu v-if="props.noteId" class="press cursor-pointer" />
          </div>

          <ul tabindex="0"
            class="dropdown-content menu bg-base-200 z-[1] w-44 p-2 shadow rounded-lg border border-neutral">
            <li class="" @click="handleClickCopyNote">
              <a>
                {{ $t('app.menu_note_copy') }}
              </a>
            </li>
            <li class="" @click="handleClickChangeEditor">
              <a>
                {{ $t('app.menu_note_change_editor') }}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div class=""></div>
    </div>
  </div>
</template>
