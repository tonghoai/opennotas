<script setup lang="ts">
import { closeDialogAnimated } from '~/utils/dialog-motion';
import { Plus } from '~/utils/icons';
import { Refresh } from '~/utils/icons';

const props = defineProps(['isTagsMode']);

const emit = defineEmits([
  'clickAddFolder',
  'clickAddTag',
  'clickForceSync',
]);

const close = () => {
  closeDialogAnimated(document.getElementById('modal-menu-sidebar') as HTMLDialogElement | null);
};

const handleClickAdd = () => {
  close();
  emit(props.isTagsMode ? 'clickAddTag' : 'clickAddFolder');
};

const handleClickForceSync = () => {
  close();
  emit('clickForceSync');
};
</script>

<template>
  <dialog id="modal-menu-sidebar" class="ui-modal ui-modal-bottom" @cancel.prevent="close">
    <div class="ui-modal-box p-0">
      <ul class="ui-menu w-full">
        <li @click="handleClickAdd">
          <button type="button">
            <Plus class="h-4 w-4 shrink-0 opacity-80" />
            {{ props.isTagsMode ? $t('app.modal_menu_sidebar_new_tag') : $t('app.modal_menu_sidebar_new_folder') }}
          </button>
        </li>

        <li class="my-1 h-px bg-border" aria-hidden="true"></li>

        <li @click="handleClickForceSync">
          <button type="button">
            <Refresh class="h-4 w-4 shrink-0 opacity-80" />
            {{ $t('app.modal_menu_sidebar_sync') }}
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
