import { beforeEach, describe, expect, it, vi } from 'vitest';

type ConfirmModule = typeof import('~/composables/useConfirm');
let confirmModule: ConfirmModule;

async function loadConfirm() {
  vi.resetModules();
  confirmModule = await import('~/composables/useConfirm');
}

describe('useConfirm', () => {
  beforeEach(async () => {
    await loadConfirm();
  });

  it('resolves true when approved', async () => {
    const promise = confirmModule.useConfirm().confirm({ title: 'Delete?', message: 'Sure?', okText: 'Yes' });
    expect(confirmModule.useConfirmHost().isOpen.value).toBe(true);
    confirmModule.useConfirmHost().approve();
    await expect(promise).resolves.toBe(true);
    expect(confirmModule.useConfirmHost().isOpen.value).toBe(false);
  });

  it('resolves false when cancelled', async () => {
    const promise = confirmModule.useConfirm().confirm({ title: 'Delete?' });
    confirmModule.useConfirmHost().cancel();
    await expect(promise).resolves.toBe(false);
  });

  it('rejects a second concurrent confirmation without replacing the first', async () => {
    const first = confirmModule.useConfirm().confirm({ title: 'First' });
    const second = confirmModule.useConfirm().confirm({ title: 'Second' });

    await expect(second).resolves.toBe(false);
    confirmModule.useConfirmHost().approve();
    await expect(first).resolves.toBe(true);
  });

  it('cancels through the isOpen setter and ignores extra settle calls', async () => {
    const promise = confirmModule.useConfirm().confirm({ title: 'Question' });
    confirmModule.useConfirmHost().isOpen.value = false;
    await expect(promise).resolves.toBe(false);

    expect(() => {
      confirmModule.useConfirmHost().approve();
      confirmModule.useConfirmHost().cancel();
    }).not.toThrow();
  });

  it('exposes the current options through the host', async () => {
    const promise = confirmModule.useConfirm().confirm({
      title: 'Delete',
      message: 'Cannot undo',
      okText: 'Delete',
      okVariant: 'danger',
    });
    const host = confirmModule.useConfirmHost();
    expect(host.current.value).toMatchObject({
      title: 'Delete',
      message: 'Cannot undo',
      okText: 'Delete',
      okVariant: 'danger',
    });
    host.approve();
    await promise;
    expect(host.current.value).toBeNull();
  });
});
