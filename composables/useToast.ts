import { ref, readonly } from 'vue';

export type ToastVariant = 'info' | 'success' | 'warning' | 'error';

export type ToastItem = {
  id: number;
  message: string;
  variant: ToastVariant;
};

const toasts = ref<ToastItem[]>([]);

export function dismiss(id: number) {
  toasts.value = toasts.value.filter((t) => t.id !== id);
}

export function showToast(message: string, variant: ToastVariant = 'info', duration = 5000) {
  const id = Date.now();
  toasts.value.push({ id, message, variant });
  setTimeout(() => dismiss(id), duration);
}

export const showInfo = (msg: string) => showToast(msg, 'info');
export const showSuccess = (msg: string) => showToast(msg, 'success');
export const showWarning = (msg: string) => showToast(msg, 'warning');
export const showError = (msg: string) => showToast(msg, 'error');

export function useToast() {
  return {
    toasts: readonly(toasts),
    dismiss,
    showToast,
    showInfo,
    showSuccess,
    showWarning,
    showError,
  };
}
