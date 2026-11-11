<script setup lang="ts">
type AlertVariant = 'default' | 'primary' | 'info' | 'success' | 'warning' | 'danger';

const props = withDefaults(
  defineProps<{
    variant?: AlertVariant;
    title?: string;
  }>(),
  {
    variant: 'default',
    title: '',
  },
);

const classes = computed(() => {
  const value = ['ui-alert'];
  if (props.variant !== 'default') value.push(`ui-alert-${props.variant}`);
  return value;
});
</script>

<template>
  <div :class="classes" role="alert">
    <slot name="icon" />
    <div class="min-w-0 flex-1">
      <p v-if="title" class="font-medium">{{ title }}</p>
      <div :class="title ? 'mt-0.5 text-sm' : 'text-sm'">
        <slot />
      </div>
    </div>
    <slot name="actions" />
  </div>
</template>
