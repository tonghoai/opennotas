<script lang="ts" setup>
import Plus from '../assets/svg/plus.svg?component';

const props = defineProps(['isSyncing']);

const emit = defineEmits([
  'clickAddFolder',
  'clickSetting',
  'clickResize',
  'clickUpdateData',
]);

const handleClickAddFolder = () => {
  emit('clickAddFolder');
}

const refreshRef = ref<HTMLElement | null>(null);
watch(() => props.isSyncing, (value) => {
  if (value) {
    refreshRef.value?.classList.add('spin');
  } else {
    refreshRef.value?.classList.remove('spin');
  }
});
</script>

<template>
  <div class="px-4 py-2 flex gap-4 justify-between items-center h-20 overflow-hidden">
    <p class="text-md font-semibold text-base-content mr-4">OpenNotas</p>

    <button class="btn btn-sm bg-primary text-primary-content flex items-center gap-1 hover:bg-primary/90"
      @click="handleClickAddFolder">
      <Plus />
      {{ $t('app.toolbar_folder_add') }}
    </button>
  </div>
</template>
