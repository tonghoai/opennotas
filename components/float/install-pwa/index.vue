<script lang="ts" setup>
const emits = defineEmits([
  'clickInstall',
  'installed',
]);

const handleClickInstall = () => {
  emits('clickInstall');
}
</script>

<template>
  <div class="fixed"
    style="right: calc(1.5rem + env(safe-area-inset-right, 0px));
      bottom: calc(1.5rem + env(safe-area-inset-bottom, 0px));">
    <div role="alert"
      class="ui-alert bg-primary text-primary-foreground w-96 shadow animate-fade animate-once animate-duration-300">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
      <div>
        <p class="semibold">Install</p>
        <p class="text-xs pt-1">Install this app on your device for quick and easy access</p>
      </div>
      <button id="install-btn" class="ui-btn ui-btn-sm" @click="handleClickInstall">Install</button>
    </div>
  </div>
</template>
