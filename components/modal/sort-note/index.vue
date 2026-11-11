<script setup lang="ts">
import { closeDialogAnimated } from '~/utils/dialog-motion';
import { Check } from '~/utils/icons';

const props = defineProps(['sortType']);
const emit = defineEmits(['clickSort']);

const close = () => {
  closeDialogAnimated(document.getElementById('modal-sort-note') as HTMLDialogElement | null);
};

const handleClickSort = (type: 'createdAt' | 'updatedAt') => {
  close();
  emit('clickSort', type);
};
</script>

<template>
  <dialog id="modal-sort-note" class="ui-modal ui-modal-bottom" @cancel.prevent="close">
    <div class="ui-modal-box p-0">
      <div class="px-3.5 pb-2 pt-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {{ $t('app.toolbar_note_sort_by_title') }}
      </div>

      <ul class="ui-menu w-full">
        <li @click="handleClickSort('updatedAt')">
          <button type="button">
            <Check v-if="props.sortType === 'updatedAt'" class="h-4 w-4 shrink-0 text-primary" />
            <span v-else class="h-4 w-4 shrink-0"></span>
            {{ $t('app.menu_note_sort_by_updated_at') }}
          </button>
        </li>
        <li @click="handleClickSort('createdAt')">
          <button type="button">
            <Check v-if="props.sortType === 'createdAt'" class="h-4 w-4 shrink-0 text-primary" />
            <span v-else class="h-4 w-4 shrink-0"></span>
            {{ $t('app.menu_note_sort_by_created_at') }}
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
