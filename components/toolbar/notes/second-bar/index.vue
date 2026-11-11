<script setup lang="ts">
const props = defineProps([
  'isSyncError',
  'syncErrorClass',
  'syncErrorMessage',
]);

const emit = defineEmits([
  'clickRetrySync'
]);

const handleClickRetrySync = () => {
  emit('clickRetrySync');
}
</script>

<template>
  <div v-if="props.isSyncError" class="flex min-h-11 items-center border-b border-border bg-card px-3">
    <button type="button"
      class="flex min-h-8 w-full items-center justify-center rounded-ui px-3 text-center text-[12px]"
      :class="{ 'bg-warning text-warning-foreground': props.syncErrorClass === 'warning', 'bg-danger text-danger-foreground': props.syncErrorClass === 'error' }"
      @click="handleClickRetrySync">
      {{ props.syncErrorMessage }}
    </button>
  </div>
</template>
