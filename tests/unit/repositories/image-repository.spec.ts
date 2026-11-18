import { beforeEach, describe, expect, it } from 'vitest';
import localForage from 'localforage';
import ImageRepository from '~/repositories/image';
import type { ImageType } from '~/repositories/image.type';

const imageStore = localForage.createInstance({ name: 'opennotas', storeName: 'images' });

function makeImage(overrides: Partial<ImageType> = {}): ImageType {
  return {
    id: 'image-1',
    noteId: 'note-1',
    blob: new Blob(['image'], { type: 'image/png' }),
    mimeType: 'image/png',
    size: 5,
    syncStatus: 'pending',
    createdAt: 1000,
    updatedAt: 1000,
    ...overrides,
  };
}

describe('ImageRepository', () => {
  let repo: ImageRepository;

  beforeEach(async () => {
    await localForage.clear();
    await imageStore.clear();
    repo = new ImageRepository();
  });

  it('saves and reads image blobs and metadata', async () => {
    const image = makeImage();
    await repo.saveImage(image);

    expect(await repo.getAllImagesMeta()).toHaveLength(1);
    expect(await repo.getImageMeta(image.id)).toMatchObject({
      id: image.id,
      noteId: image.noteId,
      syncStatus: 'pending',
    });
    const stored = await repo.getImage(image.id);
    expect(stored?.blob).toBeTruthy();
    expect(stored?.blob.type).toBe('image/png');
  });

  it('updates instead of duplicating the same image id', async () => {
    await repo.saveImage(makeImage());
    await repo.saveImage(makeImage({ mimeType: 'image/webp', size: 99 }));
    expect(await repo.getAllImagesMeta()).toHaveLength(1);
    expect(await repo.getImageMeta('image-1')).toMatchObject({ mimeType: 'image/webp', size: 99 });
  });

  it('filters by note and returns only pending images with blobs', async () => {
    await repo.saveImage(makeImage({ id: 'pending', noteId: 'note-1' }));
    await repo.saveImage(makeImage({ id: 'synced', noteId: 'note-1', syncStatus: 'synced' }));
    await repo.saveImage(makeImage({ id: 'other', noteId: 'note-2' }));

    expect(await repo.getImagesByNoteId('note-1')).toHaveLength(2);
    const pending = await repo.getPendingImages();
    expect(pending.map((image) => image.id)).toEqual(['pending', 'other']);
  });

  it('updates sync status and remote URL', async () => {
    await repo.saveImage(makeImage());
    const updated = await repo.updateSyncStatus('image-1', 'synced', 'https://cdn.test/a.png');
    expect(updated).toMatchObject({ syncStatus: 'synced', remoteUrl: 'https://cdn.test/a.png' });
    expect(await repo.updateSyncStatus('missing', 'failed')).toBeNull();
  });

  it('deletes one image or all images for a note', async () => {
    await repo.saveImage(makeImage({ id: 'a', noteId: 'note-1' }));
    await repo.saveImage(makeImage({ id: 'b', noteId: 'note-1' }));
    await repo.saveImage(makeImage({ id: 'c', noteId: 'note-2' }));

    expect(await repo.deleteImage('a')).toBe(true);
    expect(await repo.getImageMeta('a')).toBeNull();
    expect(await repo.deleteImagesByNoteId('note-1')).toBe(true);
    expect(await repo.getAllImagesMeta()).toHaveLength(1);
  });

  it('cleans orphaned blobs but keeps known ones', async () => {
    await repo.saveImage(makeImage({ id: 'known' }));
    await imageStore.setItem('image-blob-orphan', new Blob(['orphan']));
    await repo.cleanupOrphanedBlobs();
    expect(await imageStore.getItem('image-blob-known')).toBeTruthy();
    expect(await imageStore.getItem('image-blob-orphan')).toBeNull();
  });

  it('stores remote images as synced with unknown note id', async () => {
    const meta = await repo.saveImageFromRemote('remote-1', new Blob(['remote']), 'image/jpeg', 'https://cdn.test/r.jpg');
    expect(meta).toMatchObject({
      id: 'remote-1',
      noteId: '',
      mimeType: 'image/jpeg',
      syncStatus: 'synced',
      remoteUrl: 'https://cdn.test/r.jpg',
    });
    const stored = await repo.getImage('remote-1');
    expect(stored?.blob).toBeTruthy();
  });
});
