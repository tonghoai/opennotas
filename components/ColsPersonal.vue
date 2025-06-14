<script setup lang="ts">
import Notes from '../assets/svg/notes.svg?component';
import Trash from '../assets/svg/trash-2.svg?component';
import Settings from '../assets/svg/settings.svg?component';
import Refresh from '../assets/svg/refresh.svg?component';

const props = defineProps(['activeFolderId']);

const emit = defineEmits([
  'clickNotes',
  'clickTrash',
  'clickSetting',
  'clickUpdateData',
]);

const handleClickSetting = () => {
  emit('clickSetting');
}
const handleClickUpdateData = () => {
  emit('clickUpdateData');
}
const handleClickNotes = () => {
  emit('clickNotes');
}
const handleClickTrash = () => {
  emit('clickTrash');
}
</script>

<template>
  <div class="h-screen flex flex-col">
    <!-- Logo -->
    <div class="flex items-center justify-center h-20">
      <img src="/logo.png" alt="Logo" class="w-10 h-10" />
    </div>

    <!-- Menu -->
    <div class="flex-1 flex flex-col items-center gap-4 mt-4">
      <div class="menu-item flex flex-col items-center gap-2 relative !text-base-content"
        :class="{ active: props.activeFolderId !== 'bottombar-trash' }" @click="handleClickNotes">
        <Notes />
        <span class="text-sm">Notes</span>
      </div>

      <div class="menu-item flex flex-col items-center gap-2 relative !text-base-content"
        :class="{ active: props.activeFolderId === 'bottombar-trash' }" @click="handleClickTrash">
        <Trash />
        <span class="text-sm">Trash</span>
      </div>
    </div>

    <!-- Bottom Actions -->
    <div class="p-4 flex flex-col gap-4">
      <button class="btn btn-ghost btn-sm w-full" @click="handleClickUpdateData">
        <Refresh />
      </button>
      <button class="btn btn-ghost btn-sm w-full" @click="handleClickSetting">
        <Settings />
      </button>
      <div class="avatar placeholder flex items-center justify-center">
        <div class="bg-primary text-primary-content rounded-full w-10 h-10 cursor-pointer" @click="handleClickSetting">
          <span>O</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.menu-item {
  position: relative;
  padding: 8px 16px;
  cursor: pointer;
}

.menu-item.active {
  color: white;
}

.menu-item.active::before {
  content: '';
  position: absolute;
  left: -2px;
  top: 50%;
  transform: translateY(-50%);
  width: 5px;
  height: 20px;
  background-color: oklch(var(--p));
  border-radius: 0 4px 4px 0;
}
</style>