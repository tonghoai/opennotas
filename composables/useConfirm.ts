import type { DialogVariant } from '~/utils/ui/types';

type ConfirmOptions = {
  title: string;
  message?: string;
  okText?: string;
  cancelText?: string;
  okVariant?: DialogVariant;
};

type ConfirmItem = ConfirmOptions & {
  resolve: (value: boolean) => void;
};

const current = shallowRef<ConfirmItem | null>(null);

function confirm(options: ConfirmOptions): Promise<boolean> {
  // Only one confirmation can be visible at a time. Returning false avoids
  // silently replacing a pending question (and leaking its promise).
  if (current.value) return Promise.resolve(false);

  return new Promise<boolean>((resolve) => {
    current.value = { ...options, resolve };
  });
}

function settle(value: boolean) {
  const item = current.value;
  if (!item) return;
  current.value = null;
  item.resolve(value);
}

const isOpen = computed({
  get: () => !!current.value,
  set: (value: boolean) => {
    if (!value) settle(false);
  },
});

function approve() {
  settle(true);
}

function cancel() {
  settle(false);
}

function useConfirm() {
  return { confirm };
}

function useConfirmHost() {
  return {
    current: readonly(current),
    isOpen,
    approve,
    cancel,
  };
}

export type { ConfirmOptions };
export { useConfirm, useConfirmHost };
