import S3ProxyAdapter from '~/adapter/s3';
import {
  getPendingImages,
  markAsSynced,
  markAsFailed,
  getSyncStats,
} from '~/services/image';

// Shared with components/editor/crepe/index.vue so the per-image sync badges can show a
// loading state while syncImages() is actively uploading — not just when the user manually
// clicks a badge (handleManualSync already tracks that locally), but also for the automatic
// background sync path (utils/sync.ts calling this same function during pullPush/idleSync).
export const isImageSyncing = ref(false);

function isS3ConfigValid(settings: any): boolean {
  const cfg = settings?.imageSync;
  return !!(
    cfg?.s3Endpoint &&
    cfg?.s3AccessKey &&
    cfg?.s3SecretKey &&
    cfg?.s3Bucket
  );
}

function createAdapter(settings: any): S3ProxyAdapter {
  return new S3ProxyAdapter({
    workerUrl: settings.imageSync.workerUrl || DEFAULT_IMAGE_PROXY_URL,
    s3Endpoint: settings.imageSync.s3Endpoint,
    s3AccessKey: settings.imageSync.s3AccessKey,
    s3SecretKey: settings.imageSync.s3SecretKey,
    s3Bucket: settings.imageSync.s3Bucket,
  });
}

async function syncImages(settings: any): Promise<{
  success: boolean;
  synced: number;
  failed: number;
  total: number;
}> {
  if (!settings?.imageSync?.enabled) {
    return { success: true, synced: 0, failed: 0, total: 0 };
  }

  if (!isS3ConfigValid(settings)) {
    return { success: false, synced: 0, failed: 0, total: 0 };
  }

  if (!navigator.onLine) {
    return { success: false, synced: 0, failed: 0, total: 0 };
  }

  const pendingImages = await getPendingImages();

  if (pendingImages.length === 0) {
    return { success: true, synced: 0, failed: 0, total: 0 };
  }

  const adapter = createAdapter(settings);

  let synced = 0;
  let failed = 0;

  isImageSyncing.value = true;
  try {
    for (const image of pendingImages) {
      try {
        const remoteUrl = await adapter.uploadImage(image);
        await markAsSynced(image.id, remoteUrl);
        synced++;
      } catch (error) {
        console.error(`Failed to sync image ${image.id}:`, error);
        await markAsFailed(image.id);
        failed++;
      }
    }
  } finally {
    isImageSyncing.value = false;
  }

  return {
    success: failed === 0,
    synced,
    failed,
    total: pendingImages.length,
  };
}

async function deleteRemoteImage(imageId: string, settings: any): Promise<boolean> {
  if (!settings?.imageSync?.enabled) {
    return true;
  }

  if (!isS3ConfigValid(settings)) {
    return false;
  }

  if (!navigator.onLine) {
    return false;
  }

  try {
    const adapter = createAdapter(settings);
    await adapter.deleteImage(imageId);
    return true;
  } catch (error) {
    console.error(`Failed to delete remote image ${imageId}:`, error);
    return false;
  }
}

async function getImageSyncStats() {
  return getSyncStats();
}

export { syncImages, deleteRemoteImage, getImageSyncStats };
