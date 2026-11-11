<script setup lang="ts">
defineOptions({ inheritAttrs: false });

withDefaults(
  defineProps<{
    modelValue?: boolean;
    size?: 'sm' | 'md';
    disabled?: boolean;
  }>(),
  {
    modelValue: false,
    size: 'md',
    disabled: false,
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'change', event: Event): void;
}>();

const handleChange = (event: Event) => {
  emit('update:modelValue', (event.target as HTMLInputElement).checked);
  emit('change', event);
};
</script>

<template>
  <input v-bind="$attrs" type="checkbox" class="ui-checkbox" :class="{ 'ui-checkbox-sm': size === 'sm' }"
    :checked="modelValue" :disabled="disabled" @change="handleChange" />
</template>
