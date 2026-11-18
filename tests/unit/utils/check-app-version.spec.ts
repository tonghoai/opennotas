import { afterEach, describe, expect, it, vi } from 'vitest';
import { checkAppVersion, hasNewVersion } from '~/utils/check-app-version';

describe('app version check', () => {
  afterEach(() => {
    hasNewVersion.value = false;
    vi.unstubAllGlobals();
  });

  it('marks a newer build as available', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: async () => ({ buildId: 2 }),
    }));
    await checkAppVersion(1);
    expect(hasNewVersion.value).toBe(true);
  });

  it('keeps the current build and ignores network failures', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: async () => ({ buildId: 7 }) }));
    await checkAppVersion(7);
    expect(hasNewVersion.value).toBe(false);

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    await expect(checkAppVersion(1)).resolves.toBeUndefined();
    expect(hasNewVersion.value).toBe(false);
  });
});
