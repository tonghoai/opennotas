<script setup lang="ts">
import { useToast } from '~/composables/useToast';

const { toasts, dismiss } = useToast();

const variantAlertClass: Record<string, string> = {
  info: 'alert-info',
  success: 'alert-success',
  warning: 'alert-warning',
  error: 'alert-error',
};

const toastPopoverEl = ref<HTMLElement | null>(null);
watch(toasts, (list) => {
  const el = toastPopoverEl.value as any;
  if (!el || typeof el.showPopover !== 'function') return;
  if (el.matches(':popover-open')) el.hidePopover();
  if (list.length > 0) el.showPopover();
}, { deep: true });
</script>

<template>
  <Teleport to="body">
    <div ref="toastPopoverEl" popover="manual"
      class="fixed bottom-20 left-1/2 -translate-x-1/2 top-auto right-auto flex flex-col-reverse gap-2 z-[1000] m-0 p-0 border-0 bg-transparent overflow-visible pointer-events-none">
      <TransitionGroup name="toast">
        <div v-for="toast in toasts" :key="toast.id"
          class="alert app-toast shadow-lg min-w-64 max-w-xs pointer-events-auto py-3 pr-2 rounded-lg"
          :class="variantAlertClass[toast.variant] ?? 'alert-info'" role="alert">
          <!-- success icon -->
          <svg v-if="toast.variant === 'success'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <!-- error icon -->
          <svg v-else-if="toast.variant === 'error'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <!-- warning icon -->
          <svg v-else-if="toast.variant === 'warning'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <!-- info icon -->
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24"
            stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>

          <span class="text-sm font-medium flex-1">{{ toast.message }}</span>

          <button class="btn btn-ghost btn-xs opacity-60 hover:opacity-100" @click="dismiss(toast.id)"
            aria-label="Dismiss">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24"
              stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.app-toast {
  display: flex !important;
  align-items: center !important;
  justify-items: normal !important;
  text-align: left !important;
}

.toast-enter-active {
  transition: opacity 0.25s ease-out, transform 0.25s ease-out;
}

.toast-leave-active {
  transition: opacity 0.2s ease-in, transform 0.2s ease-in;
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(12px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(8px);
}

.toast-move {
  transition: transform 0.25s ease;
}
</style>
