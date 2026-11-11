<script setup lang="ts">
import type { ButtonSize } from '~/utils/ui/types';

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    size?: Extract<ButtonSize, 'sm' | 'md'>;
    rows?: number | string;
    invalid?: boolean;
    disabled?: boolean;
    readonly?: boolean;
  }>(),
  {
    modelValue: '',
    size: 'md',
    rows: 4,
    invalid: false,
    disabled: false,
    readonly: false,
  },
);

const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>();

const classes = computed(() => {
  const value = ['ui-textarea'];
  if (props.size === 'sm') value.push('ui-textarea-sm');
  if (props.invalid) value.push('ui-input-error');
  return value;
});

const handleInput = (event: Event) => {
  emit('update:modelValue', (event.target as HTMLTextAreaElement).value);
};
</script>

<template>
  <textarea v-bind="$attrs" :class="classes" :value="modelValue" :rows="rows" :disabled="disabled" :readonly="readonly"
    :aria-invalid="invalid ? 'true' : undefined" @input="handleInput"></textarea>
</template>
