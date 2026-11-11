<script setup lang="ts">
import { closeDialogAnimated } from '~/utils/dialog-motion';
import { Edit } from '~/utils/icons';
import { Trash } from '~/utils/icons';

const props = defineProps([
  'folderId',
]);

const emit = defineEmits(['renameFolder', 'deleteFolder']);

const close = () => {
  closeDialogAnimated(document.getElementById('modal-menu-folder') as HTMLDialogElement | null);
};

const handleClickRenameFolder = () => {
  close();
  emit('renameFolder', props.folderId);
};

const handleClickDeleteFolder = () => {
  close();
  emit('deleteFolder', props.folderId);
};
</script>

<template>
  <dialog id="modal-menu-folder" class="ui-modal ui-modal-bottom" @cancel.prevent="close">
    <div class="ui-modal-box p-0">
      <ul class="ui-menu w-full">
        <li @click="handleClickRenameFolder">
          <button type="button">
            <Edit class="h-4 w-4 shrink-0 opacity-80" />
            {{ $t('app.modal_menu_folder_rename') }}
          </button>
        </li>

        <li class="my-1 h-px bg-border" aria-hidden="true"></li>

        <li class="text-danger" @click="handleClickDeleteFolder">
          <button type="button" class="text-danger">
            <Trash class="h-4 w-4 shrink-0" />
            {{ $t('app.modal_menu_folder_delete') }}
          </button>
        </li>
      </ul>

      <form class="mt-2">
        <button type="button"
          class="flex min-h-11 w-full items-center justify-center rounded-ui border border-border bg-card text-[13px] font-medium"
          @click="close">
          {{ $t('app.action_cancel') }}
        </button>
      </form>
    </div>
    <form class="ui-modal-backdrop" @click.prevent="close">
      <button type="button">close</button>
    </form>
  </dialog>
</template>
