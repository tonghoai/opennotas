<script setup lang="ts">
const props = defineProps([
  'folderId',
]);

const emit = defineEmits(['renameFolder', 'deleteFolder']);

const handleClickRenameFolder = () => {
  emit('renameFolder', props.folderId);
};

const handleClickDeleteFolder = () => {
  emit('deleteFolder', props.folderId);
};
</script>

<template>
  <dialog id="modal-menu-folder" class="modal">
    <div class="modal-box p-0 w-5/6">
      <div class="bg-base-100 shadow-sm rounded">
        <ul class="p-1">
          <li id="menu-folder-rename" class="flex justify-center px-5 py-2 rounded-sm cursor-pointer"
            @click="handleClickRenameFolder">
            {{ $t('app.modal_menu_folder_rename') }}
          </li>
          <li>
            <hr class="border-base-300">
          </li>
          <li class="flex justify-center px-5 py-2 rounded-sm cursor-pointer text-rose-500"
            @click="handleClickDeleteFolder">
            {{ $t('app.modal_menu_folder_delete') }}
          </li>
        </ul>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button>close</button>
    </form>
  </dialog>
</template>
