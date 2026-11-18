import { beforeEach, describe, expect, it, vi } from 'vitest';
import localForage from 'localforage';
import {
  IMAGE_PROTOCOL,
  cleanupBlobUrlCache,
  createImageUrl,
  deleteImage,
  deleteImagesByNoteId,
  extractImageUrls,
  getImage,
  getImageMeta,
  getImagesByNoteId,
  getPendingImages,
  getSyncStats,
  isOpenNotasImageUrl,
  markAsFailed,
  markAsSynced,
  parseImageUrl,
  resetFailedImages,
  resetSyncedImages,
  resolveContentImageUrls,
  resolveImageUrl,
  resolveImageUrls,
  saveImage,
} from '~/services/image';

const imageStore = localForage.createInstance({ name: 'opennotas', storeName: 'images' });

function makeFile(name = 'photo.png', type = 'image/png') {
  return new File(['fake image bytes'], name, { type });
}

describe('image URL helpers', () => {
  it('creates, parses and recognizes the opennotas image scheme', () => {
    const url = createImageUrl('abc-123');
    expect(url).toBe(`${IMAGE_PROTOCOL}abc-123`);
    expect(parseImageUrl(url)).toBe('abc-123');
    expect(parseImageUrl('https://example.com/a.png')).toBeNull();
    expect(isOpenNotasImageUrl(url)).toBe(true);
    expect(isOpenNotasImageUrl('https://example.com/a.png')).toBe(false);
  });

  it('extracts unique image references from Markdown/HTML content', () => {
    const a = createImageUrl('aaaaaaaa-1111-4111-8111-111111111111');
    const b = createImageUrl('bbbbbbbb-2222-4222-8222-222222222222');
    expect(extractImageUrls(`![a](${a}) text ![b](${b})`)).toEqual([a, b]);
    expect(extractImageUrls('no images')).toEqual([]);
  });

  it('resolves non-opennotas URLs unchanged', async () => {
    await expect(resolveImageUrl('https://example.com/a.png')).resolves.toBe('https://example.com/a.png');
    const map = await resolveImageUrls(['https://one.test/a', 'https://two.test/b']);
    expect(map.get('https://one.test/a')).toBe('https://one.test/a');
    expect(map.get('https://two.test/b')).toBe('https://two.test/b');
  });
});

describe('image service', () => {
  beforeEach(async () => {
    await localForage.clear();
    await imageStore.clear();
    cleanupBlobUrlCache();
    vi.restoreAllMocks();
  });

  it('saves a local image as pending and resolves it to a blob URL', async () => {
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:local');
    const url = await saveImage('note-1', makeFile());
    const imageId = parseImageUrl(url)!;

    expect(imageId).toBeTruthy();
    expect(await getImageMeta(imageId)).toMatchObject({
      noteId: 'note-1',
      syncStatus: 'pending',
      mimeType: 'image/png',
    });
    expect(await getImage(imageId)).not.toBeNull();
    expect(await getImagesByNoteId('note-1')).toHaveLength(1);

    await expect(resolveImageUrl(url)).resolves.toBe('blob:local');
    expect(createObjectURL).toHaveBeenCalledOnce();
    await expect(resolveImageUrl(url)).resolves.toBe('blob:local');
    expect(createObjectURL).toHaveBeenCalledOnce();
  });

  it('returns the original URL when a local image is missing', async () => {
    const url = createImageUrl('missing-image');
    await expect(resolveImageUrl(url)).resolves.toBe(url);
  });

  it('tracks pending, synced, failed and reset image states', async () => {
    const firstUrl = await saveImage('note-1', makeFile('a.png'));
    const secondUrl = await saveImage('note-1', makeFile('b.png'));
    const firstId = parseImageUrl(firstUrl)!;
    const secondId = parseImageUrl(secondUrl)!;

    expect((await getPendingImages()).length).toBe(2);
    await markAsSynced(firstId, 'https://cdn.test/a.png');
    await markAsFailed(secondId);

    expect(await getSyncStats()).toEqual({ total: 2, pending: 0, synced: 1, failed: 1 });
    expect((await getImagesByNoteId('note-1')).find((image) => image.id === firstId)?.remoteUrl)
      .toBe('https://cdn.test/a.png');

    await resetFailedImages();
    expect(await getSyncStats()).toMatchObject({ pending: 1, failed: 0 });

    await expect(resetSyncedImages()).resolves.toBe(1);
    expect(await getSyncStats()).toMatchObject({ pending: 2, synced: 0 });
  });

  it('deletes images individually and by note', async () => {
    const firstId = parseImageUrl(await saveImage('note-1', makeFile('a.png')))!;
    const secondId = parseImageUrl(await saveImage('note-1', makeFile('b.png')))!;
    const thirdId = parseImageUrl(await saveImage('note-2', makeFile('c.png')))!;

    await expect(deleteImage(firstId)).resolves.toBe(true);
    expect(await getImageMeta(firstId)).toBeNull();
    await expect(deleteImagesByNoteId('note-1')).resolves.toBe(true);
    expect(await getImageMeta(secondId)).toBeNull();
    expect(await getImageMeta(thirdId)).not.toBeNull();
  });

  it('resolves embedded opennotas URLs inside content', async () => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:embedded');
    const url = await saveImage('note-1', makeFile());
    const markdown = `# Photo\n![image](${url})`;

    const resolved = await resolveContentImageUrls(markdown);
    expect(resolved).toContain('blob:embedded');
    expect(resolved).not.toContain(url);
    await expect(resolveContentImageUrls('plain content')).resolves.toBe('plain content');
  });

  it('cleans the blob URL cache', async () => {
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const url = await saveImage('note-1', makeFile());
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:cached');
    await resolveImageUrl(url);
    cleanupBlobUrlCache();
    expect(revoke).toHaveBeenCalledWith('blob:cached');
  });
});
