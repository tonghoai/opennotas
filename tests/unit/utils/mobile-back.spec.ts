import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick, ref } from 'vue';

type MobileBackModule = typeof import('~/utils/mobile-back');
let mobileBack: MobileBackModule;

async function loadModule() {
  vi.resetModules();
  mobileBack = await import('~/utils/mobile-back');
}

describe('mobile back handling', () => {
  beforeEach(async () => {
    window.history.replaceState({}, '', '/app');
    await loadModule();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('pushes state and invokes the newest back handler on popstate', () => {
    mobileBack.initMobileBackHandler();
    const first = vi.fn();
    const second = vi.fn();
    mobileBack.pushMobileBackState(first);
    mobileBack.pushMobileBackState(second);

    window.dispatchEvent(new PopStateEvent('popstate'));
    expect(second).toHaveBeenCalledOnce();
    expect(first).not.toHaveBeenCalled();

    window.dispatchEvent(new PopStateEvent('popstate'));
    expect(first).toHaveBeenCalledOnce();
  });

  it('does not fail when popping an empty stack', () => {
    mobileBack.initMobileBackHandler();
    expect(() => window.dispatchEvent(new PopStateEvent('popstate'))).not.toThrow();
    expect(() => mobileBack.closeMobileBackState()).not.toThrow();
  });

  it('closes a state-driven layer when the hardware back button is used', async () => {
    mobileBack.initMobileBackHandler();
    const isOpen = ref(false);
    mobileBack.useMobileBackToggle(isOpen);

    isOpen.value = true;
    await nextTick();
    window.dispatchEvent(new PopStateEvent('popstate'));
    await nextTick();
    expect(isOpen.value).toBe(false);
  });

  it('closes history state when a layer is closed programmatically', async () => {
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => {});
    mobileBack.initMobileBackHandler();
    const isOpen = ref(false);
    mobileBack.useMobileBackToggle(isOpen);

    isOpen.value = true;
    await nextTick();
    isOpen.value = false;
    await nextTick();
    expect(back).toHaveBeenCalledOnce();
  });
});
