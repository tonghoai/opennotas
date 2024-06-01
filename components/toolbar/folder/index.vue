<script lang="ts" setup>
import PlusCircle from '../assets/svg/plus-circle.svg?component';
import Setting from '../assets/svg/settings.svg?component';
import Refresh from '../assets/svg/refresh.svg?component';

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

const handleClickSetting = () => {
  emit('clickSetting');
}

const handleClickUpdateData = () => {
  emit('clickUpdateData');
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
  <div class="p-2 flex justify-between items-center h-12">
    <span class="tooltip tooltip-right" :data-tip="$t('app.toolbar_folder_setting_tooltip')">
      <Setting class="press cursor-pointer opacity-80" @click="handleClickSetting" />
    </span>

    <div class="flex">
      <span class="tooltip tooltip-right" :data-tip="$t('app.toolbar_folder_sync_tooltip')">
        <span class="mr-4 flex" ref="refreshRef">
          <Refresh class="press cursor-pointer opacity-80" @click="handleClickUpdateData" />
        </span>
      </span>

      <span class="tooltip tooltip-right" :data-tip="$t('app.toolbar_folder_add_tooltip')">
        <PlusCircle class="press cursor-pointer opacity-80" @click="handleClickAddFolder" />
      </span>
    </div>
  </div>
</template>
