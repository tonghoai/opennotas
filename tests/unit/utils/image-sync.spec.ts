import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getPendingImages: vi.fn(),
  markAsSynced: vi.fn(),
  markAsFailed: vi.fn(),
  getSyncStats: vi.fn(),
  uploaded: vi.fn(),
  deleted: vi.fn(),
  adapterConfig: vi.fn(),
  Adapter: class {
    constructor(config: any) {
      mocks.adapterConfig(config);
    }
    uploadImage(image: any) {
      return mocks.uploaded(image);
    }
    deleteImage(id: string) {
      return mocks.deleted(id);
    }
  },
}));

vi.mock('~/services/image', () => ({
  getPendingImages: mocks.getPendingImages,
  markAsSynced: mocks.markAsSynced,
  markAsFailed: mocks.markAsFailed,
  getSyncStats: mocks.getSyncStats,
}));
vi.mock('~/adapter/s3', () => ({ default: mocks.Adapter }));

const settings = {
  imageSync: {
    enabled: true,
    workerUrl: '',
    s3Endpoint: 'https://s3.test',
    s3AccessKey: 'key',
    s3SecretKey: 'secret',
    s3Bucket: 'bucket',
  },
};

type ImageSyncModule = typeof import('~/utils/image-sync');
let imageSync: ImageSyncModule;

describe('image sync', () => {
  beforeEach(async () => {
    vi.resetModules();
    imageSync = await import('~/utils/image-sync');
    vi.clearAllMocks();
    mocks.getPendingImages.mockResolvedValue([]);
    mocks.markAsSynced.mockResolvedValue({});
    mocks.markAsFailed.mockResolvedValue({});
    mocks.getSyncStats.mockResolvedValue({ total: 3, pending: 1, synced: 1, failed: 1 });
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('skips sync when disabled or invalid', async () => {
    await expect(imageSync.syncImages({ imageSync: { enabled: false } }))
      .resolves.toEqual({ success: true, synced: 0, failed: 0, total: 0 });
    await expect(imageSync.syncImages({ imageSync: { enabled: true } }))
      .resolves.toEqual({ success: false, synced: 0, failed: 0, total: 0 });
    expect(mocks.getPendingImages).not.toHaveBeenCalled();
  });

  it('skips when offline or there is nothing pending', async () => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false });
    await expect(imageSync.syncImages(settings))
      .resolves.toEqual({ success: false, synced: 0, failed: 0, total: 0 });

    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
    mocks.getPendingImages.mockResolvedValue([]);
    await expect(imageSync.syncImages(settings))
      .resolves.toEqual({ success: true, synced: 0, failed: 0, total: 0 });
    expect(mocks.adapterConfig).not.toHaveBeenCalled();
  });

  it('uploads pending images and marks them synced', async () => {
    mocks.getPendingImages.mockResolvedValue([
      { id: 'a', mimeType: 'image/png' },
      { id: 'b', mimeType: 'image/jpeg' },
    ]);
    mocks.uploaded.mockResolvedValueOnce('https://cdn.test/a.png').mockResolvedValueOnce('https://cdn.test/b.jpg');

    await expect(imageSync.syncImages(settings)).resolves.toEqual({
      success: true,
      synced: 2,
      failed: 0,
      total: 2,
    });
    expect(mocks.markAsSynced).toHaveBeenNthCalledWith(1, 'a', 'https://cdn.test/a.png');
    expect(mocks.markAsSynced).toHaveBeenNthCalledWith(2, 'b', 'https://cdn.test/b.jpg');
    expect(mocks.adapterConfig).toHaveBeenCalledWith({
      workerUrl: 'https://image-proxy.opennotas.io',
      s3Endpoint: 'https://s3.test',
      s3AccessKey: 'key',
      s3SecretKey: 'secret',
      s3Bucket: 'bucket',
    });
  });

  it('marks failures without aborting the remaining uploads and toggles syncing state', async () => {
    mocks.getPendingImages.mockResolvedValue([
      { id: 'bad', mimeType: 'image/png' },
      { id: 'good', mimeType: 'image/png' },
    ]);
    let rejectUpload!: (error: Error) => void;
    mocks.uploaded
      .mockImplementationOnce(() => new Promise((_, reject) => { rejectUpload = reject; }))
      .mockResolvedValueOnce('https://cdn.test/good.png');
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    const promise = imageSync.syncImages(settings);
    await Promise.resolve();
    expect(imageSync.isImageSyncing.value).toBe(true);
    rejectUpload(new Error('upload failed'));
    await expect(promise).resolves.toEqual({
      success: false,
      synced: 1,
      failed: 1,
      total: 2,
    });
    expect(mocks.markAsFailed).toHaveBeenCalledWith('bad');
    expect(mocks.markAsSynced).toHaveBeenCalledWith('good', 'https://cdn.test/good.png');
    expect(imageSync.isImageSyncing.value).toBe(false);
    expect(error).toHaveBeenCalled();
  });

  it('deletes remote images only when configured and online', async () => {
    await expect(imageSync.deleteRemoteImage('a', { imageSync: { enabled: false } })).resolves.toBe(true);
    await expect(imageSync.deleteRemoteImage('a', { imageSync: { enabled: true } })).resolves.toBe(false);

    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false });
    await expect(imageSync.deleteRemoteImage('a', settings)).resolves.toBe(false);

    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
    mocks.deleted.mockResolvedValue(undefined);
    await expect(imageSync.deleteRemoteImage('a', settings)).resolves.toBe(true);
    expect(mocks.deleted).toHaveBeenCalledWith('a');

    mocks.deleted.mockRejectedValue(new Error('nope'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(imageSync.deleteRemoteImage('b', settings)).resolves.toBe(false);
  });

  it('passes through sync stats', async () => {
    await expect(imageSync.getImageSyncStats())
      .resolves.toEqual({ total: 3, pending: 1, synced: 1, failed: 1 });
  });
});
