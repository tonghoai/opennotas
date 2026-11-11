<script setup lang="ts">
import { useToast } from '~/composables/useToast';

const { toasts, dismiss, runToastAction } = useToast();

const toastPopoverEl = ref<HTMLElement | null>(null);
let toastHideTimer: ReturnType<typeof setTimeout> | null = null;

const syncToastPopover = () => {
  const el = toastPopoverEl.value as any;
  if (!el || typeof el.showPopover !== 'function') return;

  if (toasts.value.length > 0) {
    if (toastHideTimer) {
      clearTimeout(toastHideTimer);
      toastHideTimer = null;
    }
    if (!el.matches(':popover-open')) el.showPopover();
    return;
  }

  // Keep the popover open while the last toast finishes its leave transition.
  if (!el.matches(':popover-open') || toastHideTimer) return;
  toastHideTimer = setTimeout(() => {
    toastHideTimer = null;
    if (!toasts.value.length && el.matches(':popover-open')) el.hidePopover();
  }, 220);
};

const handleToastBeforeLeave = () => {
  const stack = toastPopoverEl.value;
  if (!stack) return;

  const activeIds = new Set(toasts.value.map((toast) => String(toast.id)));
  const leaving = [...stack.querySelectorAll<HTMLElement>('.app-toast')].filter((toast) => {
    const id = toast.dataset.toastId;
    return id && !activeIds.has(id) && toast.style.position !== 'absolute';
  });
  if (!leaving.length) return;

  // Measure every leaving toast before moving any of them out of flow. If we
  // do this one by one, the first absolute toast collapses the stack and the
  // remaining toasts measure at the wrong position.
  const stackRect = stack.getBoundingClientRect();
  const rects = leaving.map((toast) => ({ toast, rect: toast.getBoundingClientRect() }));

  for (const { toast, rect } of rects) {
    toast.style.position = 'absolute';
    toast.style.top = 'auto';
    toast.style.bottom = `${Math.max(0, stackRect.bottom - rect.bottom)}px`;
    toast.style.left = '50%';
    toast.style.right = 'auto';
    toast.style.width = `${rect.width}px`;
    toast.style.marginLeft = `${-rect.width / 2}px`;
    toast.style.marginRight = '0';
  }
};

// Only react when the stack becomes empty/non-empty. Re-showing the popover on
// every toast update cancels the TransitionGroup layout animation and makes
// the remaining toasts jump into place.
watch(() => toasts.value.length, syncToastPopover);

onMounted(syncToastPopover);
onBeforeUnmount(() => {
  if (toastHideTimer) clearTimeout(toastHideTimer);
});
</script>

<template>
  <Teleport to="body">
    <div ref="toastPopoverEl" popover="manual"
      class="pointer-events-none fixed left-1/2 right-auto top-auto z-[1000] m-0 flex
        -translate-x-1/2 flex-col-reverse items-center gap-1.5 overflow-visible border-0
        bg-transparent p-0"
      style="bottom: calc(5rem + env(safe-area-inset-bottom, 0px));">
      <TransitionGroup name="toast" @before-leave="handleToastBeforeLeave">
        <UiNotification v-for="toast in toasts" :key="toast.id" :data-toast-id="toast.id" :variant="toast.variant"
          :message="toast.message" :actionLabel="toast.actionLabel" @action="runToastAction(toast.id)"
          @dismiss="dismiss(toast.id)" />
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active {
  transition: opacity 0.24s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.24s cubic-bezier(0.22, 1, 0.36, 1);
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

/* Keep move class before leave-active: when several toasts leave together Vue
   can also add toast-move, and its transform-only transition would otherwise
   override the leave opacity transition. */
.toast-move {
  transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}

.toast-leave-active {
  position: absolute;
  pointer-events: none;
  transform: translateY(0) !important;
  transition: opacity 0.18s ease-in, transform 0.18s ease-in;
}

.toast-leave-active.toast-leave-to {
  transform: translateY(6px) !important;
}
</style>
