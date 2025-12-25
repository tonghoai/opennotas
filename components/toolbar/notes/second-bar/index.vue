<script lang="ts" setup>
import ArrowDown from '../../assets/svg/arrow-down.svg?component';
import CircleCheck from '../../assets/svg/circle-check.svg?component';

const props = defineProps([
  'sortType',
  'isSyncError',
  'syncErrorClass',
  'syncErrorMessage',
  'isSyncToast',
  'syncToastClass',
  'syncToastMessage',
]);

const emit = defineEmits([
  'clickSort',
  'clickRetrySync'
]);

const handleClickSort = async (type: 'createdAt' | 'updatedAt') => {
  emit('clickSort', type);
}
const handleClickRetrySync = async () => {
  emit('clickRetrySync');
}
</script>

<template>
  <div class="min-h-8 lg:h-6 flex justify-between items-center sticky top-0 bg-base-100 lg:bg-base-200 z-[8] py-1">
    <div class="flex-1">
      <div v-show="props.isSyncError" class="h-6 mx-2 rounded-lg text-xs text-center py-1 cursor-pointer"
        :class="{ 'bg-warning': props.syncErrorClass === 'warning', 'text-warning-content': props.syncErrorClass === 'warning', 'bg-error': props.syncErrorClass === 'error', 'text-error-content': props.syncErrorClass === 'error' }"
        @click="handleClickRetrySync">
        {{ props.syncErrorMessage }}
      </div>
      <div v-show="!props.isSyncError && props.isSyncToast"
        class="h-6 mx-2 rounded-lg text-xs text-center py-1 font-semibold text-primary-content"
        :class="{ 'bg-info': props.syncToastClass === 'info', 'bg-success': props.syncToastClass === 'success' }">
        {{ props.syncToastMessage }}
      </div>
    </div>

    <div class="h-6 mx-2 rounded-lg text-xs text-center py-1 flex-none flex items-center">
      <div class="dropdown dropdown-bottom dropdown-end">
        <div tabindex="0" role="button" class="m-1">
          <div class="flex items-center gap-2">
            <span class="text-xs font-semibold">{{ $t('app.toolbar_note_sort_by_title') }}</span>
            <ArrowDown class="w-4 h-4" />
          </div>
        </div>

        <ul tabindex="0"
          class="dropdown-content menu menu-sm bg-base-200 z-[1] w-44 p-2 shadow rounded-xl border border-neutral">
          <li class="" @click="() => handleClickSort('createdAt')">
            <a>
              <CircleCheck v-if="props.sortType === 'createdAt'" class="w-4 h-4" />
              <span class="w-4 h-4" v-else />
              {{ $t('app.menu_note_sort_by_created_at') }}
            </a>
          </li>
          <li class="" @click="() => handleClickSort('updatedAt')">
            <a>
              <CircleCheck v-if="props.sortType === 'updatedAt'" class="w-4 h-4" />
              <span class="w-4 h-4" v-else />
              {{ $t('app.menu_note_sort_by_updated_at') }}
            </a>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>