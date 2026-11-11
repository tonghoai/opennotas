<script setup lang="ts">
import localizedFormat from 'dayjs/plugin/localizedFormat';
import dayjs from 'dayjs';

import { Restore } from '~/utils/icons';
import { X } from '~/utils/icons';
import { Trash } from '~/utils/icons';
import { Lock } from '~/utils/icons';

dayjs.extend(localizedFormat);

const props = defineProps(['history', 'isLocked']);
const emit = defineEmits(['close', 'viewDiff', 'restoreRequested', 'deleteRequested']);

const handleClickClose = () => {
  emit('close');
};

const handleViewDiff = (snapshotId: string) => {
  if (props.isLocked) {
    return;
  }
  emit('viewDiff', snapshotId);
};

const handleClickRestore = (snapshotId: string) => {
  if (props.isLocked) {
    return;
  }
  emit('restoreRequested', snapshotId);
};

const handleClickDelete = (snapshotId: string) => {
  emit('deleteRequested', snapshotId);
};
</script>

<template>
  <dialog id="modal-note-history" class="ui-modal"
    @close="handleClickClose">
    <div class="ui-modal-box w-5/6 lg:w-96 border border-border">
      <form method="dialog">
        <button class="ui-btn ui-btn-sm ui-btn-circle ui-btn-ghost absolute right-3 top-3" @click="handleClickClose"><X class="h-4 w-4" /></button>
      </form>
      <h3 class="text-[14px] font-semibold pr-8">{{ $t('app.modal_note_history_title') }}</h3>

      <div class="py-5">
        <p v-if="!history.length" class="text-center opacity-65 py-4">
          {{ $t('app.modal_note_history_empty') }}
        </p>

        <ul v-else class="ui-menu bg-card rounded-ui-lg w-full gap-1 p-0">
          <li v-for="item in history" :key="item.id" class="w-full">
            <div class="w-full flex items-center justify-between gap-2 rounded-lg lg:bg-muted p-2.5"
              :class="isLocked ? 'cursor-default' : 'cursor-pointer'" @click="handleViewDiff(item.id)">
              <div class="flex items-center gap-2 overflow-hidden">
                <Lock v-if="isLocked" class="w-3 h-3 shrink-0 text-warning" />
                <div class="overflow-hidden">
                  <p class="text-sm truncate">{{ dayjs.unix(item.snapshotAt).format('lll') }}</p>
                  <p v-if="!isLocked" class="text-xs opacity-65 truncate">
                    {{ substrTitle(item.content) || $t('app.list_note_no_title') }}
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-3 shrink-0">
                <Restore v-if="!isLocked" class="w-4 h-4 cursor-pointer opacity-80 hover:opacity-100"
                  @click.stop="handleClickRestore(item.id)" />
                <Trash class="w-4 h-4 cursor-pointer opacity-80 hover:opacity-100 text-danger"
                  @click.stop="handleClickDelete(item.id)" />
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
    <form method="dialog" class="ui-modal-backdrop">
      <button>close</button>
    </form>
  </dialog>
</template>
