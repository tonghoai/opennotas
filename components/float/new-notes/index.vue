<script setup lang="ts">
import { Plus } from '~/utils/icons';

const emit = defineEmits(['clickNewNote']);
const handleClickNewNote = () => emit('clickNewNote');
</script>

<template>
  <div class="fixed right-4 lg:hidden"
    style="right: calc(1rem + env(safe-area-inset-right, 0px));
      bottom: calc(1.25rem + env(safe-area-inset-bottom, 0px));">
    <button class="press ui-btn ui-btn-primary ui-btn-circle shadow-md" data-ga-event="note_create"
      :aria-label="$t('app.toolbar_note_add_tooltip')" :title="$t('app.toolbar_note_add_tooltip')"
      @click="handleClickNewNote">
      <Plus />
    </button>
  </div>
</template>
