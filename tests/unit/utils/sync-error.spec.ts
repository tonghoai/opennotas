import { describe, expect, it } from 'vitest';
import { NetworkError, SyncError } from '~/utils/sync-error';

describe('sync errors', () => {
  it('carries UI class names and instanceof semantics', () => {
    const network = new NetworkError('offline');
    const sync = new SyncError('bad config');

    expect(network).toBeInstanceOf(Error);
    expect(network).toBeInstanceOf(NetworkError);
    expect(network.name).toBe('NetworkError');
    expect(network.className).toBe('warning');
    expect(sync.name).toBe('SyncError');
    expect(sync.className).toBe('error');
    expect(network).not.toBeInstanceOf(SyncError);
  });
});
