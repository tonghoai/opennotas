<script setup lang="ts">
import type { ButtonSize, ButtonVariant } from '~/utils/ui/types';

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    variant?: ButtonVariant;
    size?: ButtonSize;
    type?: 'button' | 'submit' | 'reset';
    as?: string;
    block?: boolean;
    square?: boolean;
    circle?: boolean;
    outline?: boolean;
    loading?: boolean;
    disabled?: boolean;
  }>(),
  {
    variant: 'default',
    size: 'md',
    type: 'button',
    as: 'button',
    block: false,
    square: false,
    circle: false,
    outline: false,
    loading: false,
    disabled: false,
  },
);

const classes = computed(() => {
  const value = ['ui-btn'];
  if (props.variant !== 'default') value.push(`ui-btn-${props.variant}`);
  if (props.size !== 'md') value.push(`ui-btn-${props.size}`);
  if (props.block) value.push('ui-btn-block');
  if (props.square) value.push('ui-btn-square');
  if (props.circle) value.push('ui-btn-circle');
  if (props.outline) value.push('ui-btn-outline');
  return value;
});

const isButton = computed(() => props.as === 'button');
const isDisabled = computed(() => props.disabled || props.loading);
</script>

<template>
  <component :is="as" v-bind="$attrs" :class="classes" :type="isButton ? type : undefined"
    :disabled="isButton ? isDisabled : undefined" :aria-disabled="!isButton && isDisabled ? 'true' : undefined"
    :aria-busy="loading ? 'true' : undefined">
    <span v-if="loading" class="ui-loading ui-loading-xs" aria-hidden="true"></span>
    <slot name="icon" />
    <slot />
  </component>
</template>
