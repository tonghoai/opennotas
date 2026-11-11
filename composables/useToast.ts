import { ref, readonly } from 'vue';

export type ToastVariant = 'info' | 'success' | 'warning' | 'error';

export type ToastAction = {
  label: string;
  run: () => void | Promise<void>;
};

export type ToastItem = {
  id: number;
  message: string;
  variant: ToastVariant;
  actionLabel?: string;
};

const toasts = ref<ToastItem[]>([]);
// Keep callbacks out of the reactive toast array; a reactive proxy around a
// function is unnecessary and made action buttons unreliable.
const toastActions = new Map<number, () => void | Promise<void>>();
const MAX_TOASTS = 2;

const trimToasts = (list: ToastItem[]) => {
  if (list.length <= MAX_TOASTS) return list;

  for (const toast of list.slice(0, list.length - MAX_TOASTS)) {
    toastActions.delete(toast.id);
  }
  return list.slice(-MAX_TOASTS);
};

// Date.now() can repeat when two notifications are emitted in the same tick.
// Duplicate keys break TransitionGroup and make leaving toasts render on top
// of each other.
let lastToastId = 0;
const nextToastId = () => {
  const now = Date.now();
  lastToastId = now > lastToastId ? now : lastToastId + 1;
  return lastToastId;
};

function dismiss(id: number) {
  toasts.value = toasts.value.filter((t) => t.id !== id);
  toastActions.delete(id);
}

async function runToastAction(id: number) {
  const action = toastActions.get(id);
  dismiss(id);
  await action?.();
}

function showToast(message: string, variant: ToastVariant = 'info', duration = 5000) {
  const id = nextToastId();
  toasts.value = trimToasts([...toasts.value, { id, message, variant }]);
  setTimeout(() => dismiss(id), duration);
}

// A toast with a single action, e.g. Undo after a non-destructive delete.
function showActionToast(
  message: string,
  actionLabel: string,
  run: () => void | Promise<void>,
  duration = 10000,
) {
  const id = nextToastId();
  toastActions.set(id, run);
  toasts.value = trimToasts([
    ...toasts.value,
    { id, message, variant: 'success', actionLabel },
  ]);
  setTimeout(() => dismiss(id), duration);
}

const showInfo = (msg: string) => showToast(msg, 'info');
const showSuccess = (msg: string) => showToast(msg, 'success');
const showWarning = (msg: string) => showToast(msg, 'warning');
const showError = (msg: string) => showToast(msg, 'error');

function useToast() {
  return {
    toasts: readonly(toasts),
    dismiss,
    showToast,
    showInfo,
    showSuccess,
    showWarning,
    showError,
    showActionToast,
    runToastAction,
  };
}

export type { ToastVariant, ToastAction, ToastItem };
export {
  dismiss,
  runToastAction,
  showToast,
  showActionToast,
  showInfo,
  showSuccess,
  showWarning,
  showError,
  useToast,
};
