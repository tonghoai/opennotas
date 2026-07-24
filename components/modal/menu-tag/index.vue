<script setup lang="ts">
const props = defineProps([
  'tagId',
]);

const emit = defineEmits(['editTag', 'deleteTag']);

const handleClickEditTag = () => {
  emit('editTag', props.tagId);
};

const handleClickDeleteTag = () => {
  emit('deleteTag', props.tagId);
};
</script>

<template>
  <dialog id="modal-menu-tag" class="modal backdrop:bg-black/10 backdrop:backdrop-blur-sm">
    <div class="modal-box p-0 w-5/6 border border-base-content/15">
      <ul class="menu bg-base-100 rounded-box w-full animate-fade-down animate-duration-100 gap-1">
        <li class="w-full text-center" @click="handleClickEditTag">
          <a class="w-full block text-center">{{ $t('app.menu_tag_edit') }}</a>
        </li>

        <li></li>

        <li class="text-rose-500 w-full" @click="handleClickDeleteTag">
          <a class="w-full block text-center">{{ $t('app.menu_tag_delete') }}</a>
        </li>
      </ul>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button>close</button>
    </form>
  </dialog>
</template>
