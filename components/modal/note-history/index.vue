<script setup lang="ts">
import localizedFormat from 'dayjs/plugin/localizedFormat';
import dayjs from 'dayjs';
dayjs.extend(localizedFormat);

import Restore from '~/assets/svg/restore.svg?component';
import Trash from '~/assets/svg/trash-2.svg?component';
import Lock from '~/assets/svg/lock.svg?component';

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
  <dialog id="modal-note-history" class="modal backdrop:bg-black/10 backdrop:backdrop-blur-sm"
    @close="handleClickClose">
    <div class="modal-box w-5/6 lg:w-96 border border-base-content/15">
      <form method="dialog">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" @click="handleClickClose">✕</button>
      </form>
      <h3 class="font-bold text-lg">{{ $t('app.modal_note_history_title') }}</h3>

      <div class="py-4">
        <p v-if="!history.length" class="text-center opacity-65 py-4">
          {{ $t('app.modal_note_history_empty') }}
        </p>

        <ul v-else class="menu bg-base-100 rounded-box w-full gap-1 p-0">
          <li v-for="item in history" :key="item.id" class="w-full">
            <div class="w-full flex items-center justify-between gap-2 rounded-lg lg:bg-base-200 p-2.5"
              :class="isLocked ? 'cursor-default' : 'cursor-pointer'" @click="handleViewDiff(item.id)">
              <div class="flex items-center gap-2 overflow-hidden">
                <Lock v-if="isLocked" class="w-3 h-3 shrink-0 text-warning" />
                <div class="overflow-hidden">
                  <p class="text-sm truncate">{{ dayjs.unix(item.snapshotAt).format('lll') }}</p>
                  <p v-if="!isLocked" class="text-xs opacity-65 truncate">
                    {{ removeSpecialChar(substrTitle(item.content)) || $t('app.list_note_no_title') }}
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-3 shrink-0">
                <Restore v-if="!isLocked" class="w-4 h-4 cursor-pointer opacity-80 hover:opacity-100"
                  @click.stop="handleClickRestore(item.id)" />
                <Trash class="w-4 h-4 cursor-pointer opacity-80 hover:opacity-100 text-rose-500"
                  @click.stop="handleClickDelete(item.id)" />
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button>close</button>
    </form>
  </dialog>
</template>
