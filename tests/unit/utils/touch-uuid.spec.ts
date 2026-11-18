import { afterEach, describe, expect, it, vi } from 'vitest';
import { randomUUID } from '~/utils/uuid';
import { isTouchDevice } from '~/utils/touch';

describe('touch detection', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    Object.defineProperty(navigator, 'maxTouchPoints', { value: 0, configurable: true });
    window.matchMedia = vi.fn().mockReturnValue({ matches: false });
  });

  it('detects touch start, maxTouchPoints and coarse pointers', () => {
    Object.defineProperty(navigator, 'maxTouchPoints', { value: 0, configurable: true });
    window.matchMedia = vi.fn().mockReturnValue({ matches: false });
    expect(isTouchDevice()).toBe(false);

    Object.defineProperty(navigator, 'maxTouchPoints', { value: 2, configurable: true });
    expect(isTouchDevice()).toBe(true);

    Object.defineProperty(navigator, 'maxTouchPoints', { value: 0, configurable: true });
    window.matchMedia = vi.fn().mockReturnValue({ matches: true });
    expect(isTouchDevice()).toBe(true);
  });
});

describe('randomUUID', () => {
  it('uses crypto.randomUUID when available', () => {
    const value = '00000000-0000-4000-8000-000000000000';
    vi.stubGlobal('crypto', { ...globalThis.crypto, randomUUID: () => value });
    expect(randomUUID()).toBe(value);
    vi.unstubAllGlobals();
  });

  it('falls back to a valid v4 UUID without randomUUID', () => {
    vi.stubGlobal('crypto', {
      getRandomValues: (array: Uint8Array) => array.fill(1),
      randomUUID: undefined,
    });
    expect(randomUUID()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    vi.unstubAllGlobals();
  });
});
