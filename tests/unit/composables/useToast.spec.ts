import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type ToastModule = typeof import('~/composables/useToast');
let toast: ToastModule;

async function loadToast() {
  vi.resetModules();
  toast = await import('~/composables/useToast');
}

describe('useToast', () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    await loadToast();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows variants and auto-dismisses after the requested duration', async () => {
    const { toasts } = toast.useToast();
    toast.showInfo('info');
    toast.showSuccess('success');
    toast.showWarning('warning', 1000);
    toast.showErrorToast('error', 1000);

    expect(toasts.value).toHaveLength(2);
    expect(toasts.value.map((item) => item.message)).toEqual(['warning', 'error']);
    expect(toasts.value.map((item) => item.variant)).toEqual(['warning', 'error']);

    vi.advanceTimersByTime(5000);
    expect(toasts.value).toHaveLength(0);
  });

  it('keeps at most two toasts and gives each a unique id', async () => {
    toast.showToast('one', 'info', 10_000);
    toast.showToast('two', 'info', 10_000);
    toast.showToast('three', 'info', 10_000);

    const { toasts } = toast.useToast();
    expect(toasts.value).toHaveLength(2);
    expect(toasts.value.map((item) => item.message)).toEqual(['two', 'three']);
    expect(new Set(toasts.value.map((item) => item.id)).size).toBe(2);
    expect(toasts.value[1].id).toBeGreaterThan(toasts.value[0].id);
  });

  it('dismisses by id and runs action toasts once', async () => {
    const run = vi.fn().mockResolvedValue(undefined);
    toast.showActionToast('Deleted', 'Undo', run, 10_000);
    const { toasts } = toast.useToast();
    const item = toasts.value[0];

    expect(item.actionLabel).toBe('Undo');
    await toast.runToastAction(item.id);
    expect(run).toHaveBeenCalledOnce();
    expect(toasts.value).toHaveLength(0);
    await toast.runToastAction(item.id);
    expect(run).toHaveBeenCalledOnce();
  });

  it('dismisses manually and tolerates unknown ids', async () => {
    toast.showInfo('one', 10_000);
    const id = toast.useToast().toasts.value[0].id;
    toast.dismiss(id);
    toast.dismiss(999999);
    expect(toast.useToast().toasts.value).toHaveLength(0);
  });

  it('is a singleton across callers', async () => {
    const first = toast.useToast();
    const second = toast.useToast();
    toast.showInfo('shared', 10_000);
    expect(first.toasts.value).toHaveLength(1);
    expect(second.toasts.value).toHaveLength(1);
  });
});
