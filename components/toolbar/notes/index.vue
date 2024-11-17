<script lang="ts" setup>
import PlusCircle from '../assets/svg/plus-circle.svg?component';
import Search from '../assets/svg/search.svg?component';
import X from '../assets/svg/x.svg?component';

const emit = defineEmits([
  'clickAddNote',
  'clickSearch',
  'clickCancelSearch',
]);

const handleClickAddNote = () => {
  emit('clickAddNote');
}

const isShowSearchInput = ref(false);
const handleToggleSearch = () => {
  isShowSearchInput.value = !isShowSearchInput.value;
  if (isShowSearchInput.value) {
    setTimeout(() => {
      searchInputRef.value?.focus();
    }, 100);
  } else {
    searchInput.value = '';
    emit('clickCancelSearch');
  }
}

const searchInputRef = ref<HTMLInputElement | null>(null);
const searchInput = ref<string>('');
const isShowSearchLoading = ref(false);
let searchInputDebounce: any = null;
watch(searchInput, (value) => {
  clearTimeout(searchInputDebounce);
  isShowSearchLoading.value = false;

  searchInputDebounce = setTimeout(() => {
    isShowSearchLoading.value = true;
    emit('clickSearch', value);
  }, 500);
});

const searchLoadingDone = () => {
  isShowSearchLoading.value = false;
}

defineExpose({
  searchLoadingDone,
});
</script>

<template>
  <div v-if="isShowSearchInput" class="p-2 flex items-center h-12 w-full animate-fade-down animate-duration-200">
    <div class="relative flex-1 mr-2">
      <input ref="searchInputRef" type="text" class="grow relative input input-sm input-bordered w-full" placeholder=""
        autocomplete="off" name="hidden" v-model="searchInput" />
      <span v-if="isShowSearchLoading" class="loading loading-spinner loading-sm absolute right-1.5 top-1.5"></span>
    </div>

    <button class="flex-none btn btn-primary btn-sm" @click="handleToggleSearch">
      <X />
    </button>
  </div>

  <div class="p-2 flex justify-between items-center h-12 w-full animate-fade-down animate-duration-200"
    v-if="!isShowSearchInput">
    <div class="font-semibold">{{ $t('app_name') }}</div>
    <div class="flex">
      <span class="tooltip tooltip-right" :data-tip="$t('app.toolbar_note_search_tooltip')" @click="handleToggleSearch">
        <Search class="press mr-4 cursor-pointer opacity-80" />
      </span>

      <span class="tooltip tooltip-right" :data-tip="$t('app.toolbar_note_add_tooltip')">
        <PlusCircle class="press cursor-pointer opacity-80" @click="handleClickAddNote" />
      </span>
    </div>
  </div>
</template>
