<script setup lang="ts">
import { closeDialogAnimated } from '~/utils/dialog-motion';
import { Folder } from '~/utils/icons';

const props = defineProps([
  'listFolders',
]);

const emit = defineEmits(['selectFolder']);

const close = () => {
  closeDialogAnimated(document.getElementById('modal-menu-move-note') as HTMLDialogElement | null);
};

const handleClickFolder = (folderId: string) => {
  close();
  emit('selectFolder', folderId);
};
</script>

<template>
  <dialog id="modal-menu-move-note" class="ui-modal ui-modal-bottom" @cancel.prevent="close">
    <div class="ui-modal-box p-0">
      <div class="px-3.5 pb-2 pt-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {{ $t('app.modal_move_note_title') }}
      </div>

      <ul class="ui-menu max-h-[52vh] w-full overflow-y-auto">
        <li v-if="!props.listFolders.length" class="px-3 py-2 text-[13px] text-muted-foreground">
          {{ $t('app.modal_move_note_empty') }}
        </li>

        <li v-for="folder in props.listFolders" :key="folder.id" data-ga-event="note_move"
          @click="handleClickFolder(folder.id)">
          <button type="button">
            <Folder class="h-4 w-4 shrink-0 opacity-80" />
            <span class="truncate">{{ folder.name }}</span>
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
