<script setup lang="ts">
withDefaults(
  defineProps<{
    size?: 'xs' | 'sm' | 'md' | 'lg';
    label?: string;
  }>(),
  {
    size: 'md',
    label: 'Loading',
  },
);
</script>

<template>
  <span class="ui-loading" :class="size !== 'md' ? `ui-loading-${size}` : undefined" role="status"
    :aria-label="label"></span>
</template>
