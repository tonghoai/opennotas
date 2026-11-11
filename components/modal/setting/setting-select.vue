<script setup lang="ts">
const props = defineProps<{
  modelValue: string;
  options: { label: string; value: string }[];
  gaEvent?: string;
  fullWidth?: boolean;
}>();

const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>();

const handleUpdate = (value: string) => {
  emit('update:modelValue', value);
};
</script>

<template>
  <UiSelect :model-value="props.modelValue" :options="props.options" size="sm" :data-ga-event="props.gaEvent"
    :class="props.fullWidth ? 'w-full min-w-0 sm:w-48' : 'w-40 min-w-0 max-w-full sm:w-48'"
    @update:model-value="handleUpdate" />
</template>
