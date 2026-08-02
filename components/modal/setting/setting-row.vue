<script setup lang="ts">
defineProps<{ label: string; description?: string }>();
</script>

<template>
  <div class="flex items-center justify-between gap-6 py-4">
    <div class="min-w-0">
      <p class="font-medium">{{ label }}</p>
      <p v-if="description" class="text-xs text-base-content/60 mt-1">{{ description }}</p>
    </div>
    <div class="shrink-0">
      <slot />
    </div>
  </div>
</template>
