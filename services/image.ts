import ImageRepository from '~/repositories/image';
import type { ImageType, ImageMetaType } from '~/repositories/image.type';
import S3ProxyAdapter from '~/adapter/s3';

import { randomUUID } from '~/utils/uuid';

const imageRepository = new ImageRepository();

const IMAGE_PROTOCOL = 'opennotas://img/';

const blobUrlCache = new Map<string, string>();

function generateImageId(): string {
  return randomUUID();
}

function createImageUrl(imageId: string): string {
  return `${IMAGE_PROTOCOL}${imageId}`;
}

function parseImageUrl(url: string): string | null {
  if (url.startsWith(IMAGE_PROTOCOL)) {
    return url.slice(IMAGE_PROTOCOL.length);
  }
  return null;
}

function isOpenNotasImageUrl(url: string): boolean {
  return url.startsWith(IMAGE_PROTOCOL);
}

async function saveImage(noteId: string, file: File): Promise<string> {
  const imageId = generateImageId();
  const now = Date.now();

  const image: ImageType = {
    id: imageId,
    noteId,
    blob: file,
    mimeType: file.type,
    size: file.size,
    syncStatus: 'pending',
    createdAt: now,
    updatedAt: now,
  };

  await imageRepository.saveImage(image);
  return createImageUrl(imageId);
}

async function getImage(imageId: string): Promise<ImageType | null> {
  return imageRepository.getImage(imageId);
}

async function getImageMeta(imageId: string): Promise<ImageMetaType | null> {
  return imageRepository.getImageMeta(imageId);
}

async function getImagesByNoteId(noteId: string): Promise<ImageMetaType[]> {
  return imageRepository.getImagesByNoteId(noteId);
}

function isS3ConfigValid(settings: any): boolean {
  const cfg = settings?.imageSync;
  return !!(
    cfg?.enabled &&
    cfg?.s3Endpoint &&
    cfg?.s3AccessKey &&
    cfg?.s3SecretKey &&
    cfg?.s3Bucket
  );
}

function createS3Adapter(settings: any): S3ProxyAdapter | null {
  if (!isS3ConfigValid(settings)) {
    return null;
  }

  return new S3ProxyAdapter({
    workerUrl: settings.imageSync.workerUrl || '',
    s3Endpoint: settings.imageSync.s3Endpoint,
    s3AccessKey: settings.imageSync.s3AccessKey,
    s3SecretKey: settings.imageSync.s3SecretKey,
    s3Bucket: settings.imageSync.s3Bucket,
  });
}

/**
 * Resolve an image URL to a displayable URL (blob URL or remote URL via proxy)
 * @param url The OpenNotas image URL (opennotas://img/{id})
 * @param settings Optional settings for proxying remote images through worker
 * Returns blob URL from local storage, or fetches via worker if synced and settings provided
 */
async function resolveImageUrl(url: string, settings?: any): Promise<string> {
  const imageId = parseImageUrl(url);
  if (!imageId) {
    return url;
  }

  // Check cache first
  if (blobUrlCache.has(imageId)) {
    return blobUrlCache.get(imageId)!;
  }

  const meta = await imageRepository.getImageMeta(imageId);

  // If no meta exists, try to fetch from remote S3 storage
  // This handles the case when an image was synced from another device
  if (!meta) {
    if (settings && isS3ConfigValid(settings)) {
      try {
        const adapter = createS3Adapter(settings);
        if (adapter) {
          const { blob, mimeType, remoteUrl } = await adapter.getImageById(imageId);

          // Save to local storage for future use
          await imageRepository.saveImageFromRemote(imageId, blob, mimeType, remoteUrl);

          // Create blob URL and cache it
          const blobUrl = URL.createObjectURL(blob);
          blobUrlCache.set(imageId, blobUrl);
          return blobUrl;
        }
      } catch (error) {
        console.error('Failed to fetch image from remote:', error);
      }
    }
    return url;
  }

  // If synced and has remote URL, fetch via worker proxy
  if (meta.syncStatus === 'synced' && meta.remoteUrl) {
    // Try to fetch via worker if settings are valid
    if (settings && isS3ConfigValid(settings)) {
      try {
        const adapter = createS3Adapter(settings);
        if (adapter) {
          const blobUrl = await adapter.getImage(meta.remoteUrl);
          blobUrlCache.set(imageId, blobUrl);
          return blobUrl;
        }
      } catch (error) {
        console.error('Failed to fetch image via proxy:', error);
      }
    }

    return meta.remoteUrl;
  }

  // Otherwise, create blob URL from local storage
  const image = await imageRepository.getImage(imageId);
  if (!image) {
    // No local image, try remote URL if available
    if (meta.remoteUrl) {
      return meta.remoteUrl;
    }
    return url;
  }

  const blobUrl = URL.createObjectURL(image.blob);
  blobUrlCache.set(imageId, blobUrl);
  return blobUrl;
}

async function resolveImageUrls(urls: string[]): Promise<Map<string, string>> {
  const result = new Map<string, string>();

  for (const url of urls) {
    const resolved = await resolveImageUrl(url);
    result.set(url, resolved);
  }

  return result;
}

async function getPendingImages(): Promise<ImageType[]> {
  return imageRepository.getPendingImages();
}

async function markAsSynced(imageId: string, remoteUrl: string): Promise<ImageMetaType | null> {
  // Clear blob URL cache since we now have remote URL
  if (blobUrlCache.has(imageId)) {
    URL.revokeObjectURL(blobUrlCache.get(imageId)!);
    blobUrlCache.delete(imageId);
  }

  return imageRepository.updateSyncStatus(imageId, 'synced', remoteUrl);
}

async function markAsFailed(imageId: string): Promise<ImageMetaType | null> {
  return imageRepository.updateSyncStatus(imageId, 'failed');
}

async function resetFailedImages(): Promise<void> {
  const metas = await imageRepository.getAllImagesMeta();
  const failed = metas.filter((m) => m.syncStatus === 'failed');

  for (const meta of failed) {
    await imageRepository.updateSyncStatus(meta.id, 'pending');
  }
}

async function deleteImage(imageId: string): Promise<boolean> {
  if (blobUrlCache.has(imageId)) {
    URL.revokeObjectURL(blobUrlCache.get(imageId)!);
    blobUrlCache.delete(imageId);
  }

  return imageRepository.deleteImage(imageId);
}

async function deleteImagesByNoteId(noteId: string): Promise<boolean> {
  const images = await imageRepository.getImagesByNoteId(noteId);

  for (const image of images) {
    if (blobUrlCache.has(image.id)) {
      URL.revokeObjectURL(blobUrlCache.get(image.id)!);
      blobUrlCache.delete(image.id);
    }
  }

  return imageRepository.deleteImagesByNoteId(noteId);
}

function extractImageUrls(content: string): string[] {
  const regex = new RegExp(`${IMAGE_PROTOCOL}[a-f0-9-]+`, 'g');
  const matches = content.match(regex);
  return matches || [];
}

async function resolveContentImageUrls(content: string): Promise<string> {
  const urls = extractImageUrls(content);
  if (urls.length === 0) return content;

  let resolved = content;
  for (const url of urls) {
    const resolvedUrl = await resolveImageUrl(url);
    resolved = resolved.replace(url, resolvedUrl);
  }

  return resolved;
}

function cleanupBlobUrlCache(): void {
  blobUrlCache.forEach((blobUrl) => {
    URL.revokeObjectURL(blobUrl);
  });
  blobUrlCache.clear();
}

async function resetSyncedImages(): Promise<number> {
  const metas = await imageRepository.getAllImagesMeta();
  const synced = metas.filter((m) => m.syncStatus === 'synced');
  for (const meta of synced) {
    await imageRepository.updateSyncStatus(meta.id, 'pending');
  }
  cleanupBlobUrlCache();
  return synced.length;
}

async function getSyncStats(): Promise<{
  total: number;
  pending: number;
  synced: number;
  failed: number;
}> {
  const metas = await imageRepository.getAllImagesMeta();
  return {
    total: metas.length,
    pending: metas.filter((m) => m.syncStatus === 'pending').length,
    synced: metas.filter((m) => m.syncStatus === 'synced').length,
    failed: metas.filter((m) => m.syncStatus === 'failed').length,
  };
}

export {
  IMAGE_PROTOCOL,
  generateImageId,
  createImageUrl,
  parseImageUrl,
  isOpenNotasImageUrl,
  saveImage,
  getImage,
  getImageMeta,
  getImagesByNoteId,
  resolveImageUrl,
  resolveImageUrls,
  getPendingImages,
  markAsSynced,
  markAsFailed,
  resetFailedImages,
  deleteImage,
  deleteImagesByNoteId,
  extractImageUrls,
  resolveContentImageUrls,
  cleanupBlobUrlCache,
  getSyncStats,
  resetSyncedImages,
};
