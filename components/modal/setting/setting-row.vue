<script setup lang="ts">
defineProps<{ label: string; description?: string }>();
</script>

<template>
  <div class="grid grid-cols-[3fr_2fr] items-center gap-3 py-4 lg:flex lg:justify-between lg:gap-6">
    <div class="min-w-0">
      <p class="font-medium">{{ label }}</p>
      <p v-if="description" class="text-xs text-base-content/60 mt-1">{{ description }}</p>
    </div>
    <div class="min-w-0 flex justify-end lg:shrink-0">
      <slot />
    </div>
  </div>
</template>
