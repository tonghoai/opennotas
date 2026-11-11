<script setup lang="ts">
defineProps<{ label: string; description?: string }>();
</script>

<template>
  <div class="setting-row grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-2 lg:flex lg:justify-between lg:gap-8">
    <div class="min-w-0">
      <p class="text-[13.5px] font-medium">{{ label }}</p>
      <p v-if="description" class="mt-1 text-[12px] leading-[1.5] text-muted-foreground">{{ description }}</p>
    </div>
    <div class="flex min-w-0 shrink-0 justify-end">
      <slot />
    </div>
  </div>
</template>

<style scoped>
/* Below 360px a side-by-side label/control pair becomes too tight and wraps
   the label into a tall two-line block. Stack it instead of squeezing both. */
@media (max-width: 359px) {
  .setting-row {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }

  .setting-row > div:last-child {
    justify-content: flex-start;
  }
}
</style>
