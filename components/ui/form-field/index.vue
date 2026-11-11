<script setup lang="ts">
defineProps<{
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
}>();
</script>

<template>
  <label class="ui-form-control w-full">
    <span v-if="label || $slots.hint" class="ui-label">
      <span class="ui-label-text">
        {{ label }}
        <span v-if="required" class="text-danger" aria-hidden="true">*</span>
      </span>
      <slot name="hint" />
    </span>

    <slot />

    <span v-if="error" class="text-xs text-danger">{{ error }}</span>
    <span v-else-if="description" class="text-xs text-muted-foreground">{{ description }}</span>
  </label>
</template>
