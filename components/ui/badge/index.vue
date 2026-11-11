<script setup lang="ts">
type BadgeVariant = 'default' | 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'info';

const props = withDefaults(
  defineProps<{
    variant?: BadgeVariant;
    size?: 'sm' | 'md';
  }>(),
  {
    variant: 'default',
    size: 'md',
  },
);

const classes = computed(() => {
  const value = ['ui-badge'];
  if (props.variant !== 'default') value.push(`ui-badge-${props.variant}`);
  if (props.size === 'sm') value.push('ui-badge-sm');
  return value;
});
</script>

<template>
  <span :class="classes">
    <slot />
  </span>
</template>
