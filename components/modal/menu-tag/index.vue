<script setup lang="ts">
import { closeDialogAnimated } from '~/utils/dialog-motion';
import { Edit } from '~/utils/icons';
import { Trash } from '~/utils/icons';

const props = defineProps([
  'tagId',
]);

const emit = defineEmits(['editTag', 'deleteTag']);

const close = () => {
  closeDialogAnimated(document.getElementById('modal-menu-tag') as HTMLDialogElement | null);
};

const handleClickEditTag = () => {
  close();
  emit('editTag', props.tagId);
};

const handleClickDeleteTag = () => {
  close();
  emit('deleteTag', props.tagId);
};
</script>

<template>
  <dialog id="modal-menu-tag" class="ui-modal ui-modal-bottom" @cancel.prevent="close">
    <div class="ui-modal-box p-0">
      <ul class="ui-menu w-full">
        <li @click="handleClickEditTag">
          <button type="button">
            <Edit class="h-4 w-4 shrink-0 opacity-80" />
            {{ $t('app.menu_tag_edit') }}
          </button>
        </li>

        <li class="my-1 h-px bg-border" aria-hidden="true"></li>

        <li class="text-danger" @click="handleClickDeleteTag">
          <button type="button" class="text-danger">
            <Trash class="h-4 w-4 shrink-0" />
            {{ $t('app.menu_tag_delete') }}
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
