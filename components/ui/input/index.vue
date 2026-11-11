<script setup lang="ts">
import type { ButtonSize } from '~/utils/ui/types';

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    modelValue?: string | number;
    type?: string;
    size?: Extract<ButtonSize, 'sm' | 'md' | 'lg'>;
    invalid?: boolean;
    disabled?: boolean;
    readonly?: boolean;
  }>(),
  {
    modelValue: '',
    type: 'text',
    size: 'md',
    invalid: false,
    disabled: false,
    readonly: false,
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'clear'): void;
  (e: 'focus', event: FocusEvent): void;
  (e: 'blur', event: FocusEvent): void;
}>();

const inputRef = ref<HTMLInputElement | null>(null);

const classes = computed(() => {
  const value = ['ui-input'];
  if (props.size !== 'md') value.push(`ui-input-${props.size}`);
  if (props.invalid) value.push('ui-input-error');
  return value;
});

const handleInput = (event: Event) => {
  emit('update:modelValue', (event.target as HTMLInputElement).value);
};

const focus = () => inputRef.value?.focus();

defineExpose({ focus });
</script>

<template>
  <input ref="inputRef" v-bind="$attrs" :class="classes" :type="type" :value="modelValue" :disabled="disabled"
    :readonly="readonly" :aria-invalid="invalid ? 'true' : undefined" @input="handleInput" @focus="emit('focus', $event)"
    @blur="emit('blur', $event)" />
</template>
