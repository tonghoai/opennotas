<script setup lang="ts">
import { AlertSquareRounded } from '~/utils/icons';
import { Download } from '~/utils/icons';
import { Restore } from '~/utils/icons';

const isRecovering = ref(false);

const handleClickRecoverApp = async () => {
  isRecovering.value = true;
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
  } finally {
    window.location.reload();
  }
}
</script>

<template>
  <div class="h-screen flex flex-col justify-center items-center px-4">
    <div class="flex flex-col items-center max-w-sm w-full text-center">
      <AlertSquareRounded class="w-12 h-12 text-danger mb-4" />
      <h2 class="text-3xl font-semibold mb-2">Oops!</h2>
      <p class="text-sm opacity-70 mb-8">Something went wrong. You can export your notes to be safe, or try to
        recover the app below.</p>

      <div class="flex flex-col sm:flex-row gap-3 w-full justify-center">
        <a href="/sos" class="ui-btn ui-btn-primary">
          <Download class="w-4 h-4" />
          Export notes
        </a>
        <button type="button" class="ui-btn ui-btn-outline ui-btn-danger" :disabled="isRecovering"
          @click="handleClickRecoverApp">
          <Restore class="w-4 h-4" :class="{ 'animate-spin': isRecovering }" />
          {{ isRecovering ? 'Recovering...' : 'Recover App' }}
        </button>
      </div>
      <p class="text-xs opacity-50 mt-3">Your notes are not affected.</p>
    </div>
  </div>
</template>
