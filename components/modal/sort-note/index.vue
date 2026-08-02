<script setup lang="ts">
import CircleCheck from '../../../assets/svg/circle-check.svg?component';

const props = defineProps(['sortType']);

const emit = defineEmits(['clickSort']);

const handleClickSort = (type: 'createdAt' | 'updatedAt') => {
  emit('clickSort', type);
  (document.getElementById('modal-sort-note') as any)?.close();
};
</script>

<template>
  <dialog id="modal-sort-note" class="modal backdrop:bg-black/10 backdrop:backdrop-blur-sm">
    <div class="modal-box p-0 w-5/6 border border-base-content/15">
      <ul class="menu bg-base-100 rounded-box w-full animate-fade-down animate-duration-100 gap-1">
        <li class="w-full text-center" @click="() => handleClickSort('createdAt')">
          <a class="w-full flex items-center justify-center gap-2">
            <CircleCheck v-if="props.sortType === 'createdAt'" class="w-4 h-4" />
            <span class="w-4 h-4" v-else />
            {{ $t('app.menu_note_sort_by_created_at') }}
          </a>
        </li>
        <li class="w-full text-center" @click="() => handleClickSort('updatedAt')">
          <a class="w-full flex items-center justify-center gap-2">
            <CircleCheck v-if="props.sortType === 'updatedAt'" class="w-4 h-4" />
            <span class="w-4 h-4" v-else />
            {{ $t('app.menu_note_sort_by_updated_at') }}
          </a>
        </li>
      </ul>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button>close</button>
    </form>
  </dialog>
</template>
