type ImageSyncStatus = 'pending' | 'synced' | 'failed';

type ImageType = {
  id: string;
  noteId: string;
  blob: Blob;
  mimeType: string;
  size: number;
  syncStatus: ImageSyncStatus;
  remoteUrl?: string;
  createdAt: number;
  updatedAt: number;
};

type ImageMetaType = {
  id: string;
  noteId: string;
  mimeType: string;
  size: number;
  syncStatus: ImageSyncStatus;
  remoteUrl?: string;
  createdAt: number;
  updatedAt: number;
};

export type { ImageType, ImageMetaType, ImageSyncStatus };
