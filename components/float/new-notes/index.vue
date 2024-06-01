<script setup lang="ts">
import Plus from '../assets/svg/plus.svg?component';

const emit = defineEmits(['clickNewNote']);
const handleClickNewNote = () => emit('clickNewNote');
</script>

<template>
  <div class="fixed bottom-6 right-6">
    <button class="press btn btn btn-primary btn-circle shadow-xl" @click="handleClickNewNote">
      <Plus />
    </button>
  </div>
</template>
