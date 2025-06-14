<script lang="ts" setup>
import Search from '../assets/svg/search.svg?component';
import Plus from '../assets/svg/plus.svg?component';

const emit = defineEmits([
  'clickAddNote',
  'clickSearch',
  'clickCancelSearch',
]);

const handleClickAddNote = () => {
  emit('clickAddNote');
}

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

const resetSearchInput = () => {
  searchInput.value = '';
}

defineExpose({
  searchLoadingDone,
  resetSearchInput,
});
</script>

<template>
  <div class="px-4 py-2 flex gap-4 justify-between items-center h-20 overflow-hidden">

    <label class="input input-bordered input-sm w-full flex items-center gap-2">
      <Search />
      <input type="text" class="grow" :placeholder="$t('app.toolbar_note_search_placeholder')" v-model="searchInput" />
    </label>

    <button class="btn btn-sm bg-primary text-primary-content flex items-center gap-1 hover:bg-primary/90"
      @click="handleClickAddNote">
      <Plus />
      {{ $t('app.toolbar_note_add') }}
    </button>
  </div>
</template>
