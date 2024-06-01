<script lang="ts" setup>
import Info from '../assets/svg/info.svg?component';
import Clipboard from '../assets/svg/clipboard.svg?component';
import Square from '../assets/svg/maximize.svg?component';
import Repeat from '../assets/svg/repeat.svg?component';

const props = defineProps([
  'noteId',
  'editorName',
  'isLocked',
]);

const emit = defineEmits([
  'copyToClipboard',
  'clickInfo',
  'clickResize',
  'clickSwitchEditor',
]);

const handleClickCopyToClipboard = () => {
  emit('copyToClipboard', props.noteId);
}
const handleClickInfo = () => {
  emit('clickInfo', props.noteId);
}
const handleClickResize = () => {
  emit('clickResize');
}
const handleClickSwitchEditor = () => {
  emit('clickSwitchEditor', props.noteId);
}
</script>

<template>
  <div class="hidden lg:flex p-2 flex justify-between items-center h-12">
    <span class="tooltip tooltip-right" :data-tip="$t('app.toolbar_form_note_resize_tooltip')">
      <Square class="press hidden lg:block cursor-pointer opacity-80" @click="handleClickResize" />
    </span>

    <div v-if="!props.isLocked" class="flex">
      <span v-if="props.noteId" class="press badge badge-md badge-neutral mr-4 cursor-pointer select-none"
        @click="handleClickSwitchEditor">
        {{ props.editorName }}
      </span>
      <span class="tooltip tooltip-left" :data-tip="$t('app.toolbar_form_note_swap_editor_tooltip')">
        <Repeat v-if="props.noteId" class="press mr-4 cursor-pointer opacity-80" @click="handleClickSwitchEditor" />
      </span>
      <span class="tooltip tooltip-left" :data-tip="$t('app.toolbar_form_note_copy_tooltip')">
        <Clipboard v-if="props.noteId" class="press mr-4 cursor-pointer opacity-80"
          @click="handleClickCopyToClipboard" />
      </span>
      <span class="tooltip tooltip-left" :data-tip="$t('app.toolbar_form_note_info')">
        <Info v-if="props.noteId" class="press cursor-pointer opacity-80" @click="handleClickInfo" />
      </span>
    </div>
  </div>
</template>
