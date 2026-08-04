<script setup lang="ts">
const props = defineProps([
  'listFolders',
]);

const emit = defineEmits(['selectFolder']);

const handleClickFolder = (folderId: string) => {
  emit('selectFolder', folderId);
};
</script>

<template>
  <dialog id="modal-menu-move-note" class="modal backdrop:bg-black/10 backdrop:backdrop-blur-sm">
    <div class="modal-box p-0 w-5/6 border border-base-content/15">
      <div class="bg-base-100 shadow-sm rounded">
        <div class="text-center text-xs opacity-60 pt-3 pb-1">{{ $t('app.modal_move_note_title') }}</div>

        <ul
          class="menu bg-base-100 rounded-box w-full animate-fade-down animate-duration-100 gap-1 max-h-[60vh] overflow-y-auto">
          <li v-if="!props.listFolders.length" class="w-full text-center py-2 opacity-60">
            {{ $t('app.modal_move_note_empty') }}
          </li>

          <li v-for="folder in props.listFolders" :key="folder.id" class="w-full text-center" data-ga-event="note_move"
            @click="handleClickFolder(folder.id)">
            <a class="w-full block text-center truncate">{{ folder.name }}</a>
          </li>
        </ul>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button>close</button>
    </form>
  </dialog>
</template>
