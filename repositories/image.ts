import localForage from 'localforage';
import type { ImageType, ImageMetaType, ImageSyncStatus } from './image.type';

const imageStore = localForage.createInstance({
  name: 'opennotas',
  storeName: 'images',
});

class ImageRepository {
  async getAllImagesMeta(): Promise<ImageMetaType[]> {
    const metas = JSON.parse(await localForage.getItem('imagesMeta') || '[]');
    return metas as ImageMetaType[];
  }

  async getImagesByNoteId(noteId: string): Promise<ImageMetaType[]> {
    const metas = await this.getAllImagesMeta();
    return metas.filter((meta) => meta.noteId === noteId);
  }

  async getImage(imageId: string): Promise<ImageType | null> {
    const meta = await this.getImageMeta(imageId);
    if (!meta) return null;

    const blob = await imageStore.getItem<Blob>(`image-blob-${imageId}`);
    if (!blob) return null;

    return { ...meta, blob };
  }

  async getImageMeta(imageId: string): Promise<ImageMetaType | null> {
    const metas = await this.getAllImagesMeta();
    return metas.find((meta) => meta.id === imageId) || null;
  }

  async saveImage(image: ImageType): Promise<ImageType> {
    await imageStore.setItem(`image-blob-${image.id}`, image.blob);

    const metas = await this.getAllImagesMeta();
    const existingIndex = metas.findIndex((m) => m.id === image.id);

    const meta: ImageMetaType = {
      id: image.id,
      noteId: image.noteId,
      mimeType: image.mimeType,
      size: image.size,
      syncStatus: image.syncStatus,
      remoteUrl: image.remoteUrl,
      createdAt: image.createdAt,
      updatedAt: image.updatedAt,
    };

    if (existingIndex >= 0) {
      metas[existingIndex] = meta;
    } else {
      metas.push(meta);
    }

    await localForage.setItem('imagesMeta', JSON.stringify(metas));
    return image;
  }

  async updateSyncStatus(
    imageId: string,
    syncStatus: ImageSyncStatus,
    remoteUrl?: string
  ): Promise<ImageMetaType | null> {
    const metas = await this.getAllImagesMeta();
    const index = metas.findIndex((m) => m.id === imageId);

    if (index < 0) return null;

    metas[index] = {
      ...metas[index],
      syncStatus,
      remoteUrl: remoteUrl || metas[index].remoteUrl,
      updatedAt: Date.now(),
    };

    await localForage.setItem('imagesMeta', JSON.stringify(metas));
    return metas[index];
  }

  async getPendingImages(): Promise<ImageType[]> {
    const metas = await this.getAllImagesMeta();
    const pendingMetas = metas.filter((m) => m.syncStatus === 'pending');

    const images: ImageType[] = [];
    for (const meta of pendingMetas) {
      const blob = await imageStore.getItem<Blob>(`image-blob-${meta.id}`);
      if (blob) {
        images.push({ ...meta, blob });
      }
    }

    return images;
  }

  async deleteImage(imageId: string): Promise<boolean> {
    await imageStore.removeItem(`image-blob-${imageId}`);

    const metas = await this.getAllImagesMeta();
    const newMetas = metas.filter((m) => m.id !== imageId);
    await localForage.setItem('imagesMeta', JSON.stringify(newMetas));

    return true;
  }

  async deleteImagesByNoteId(noteId: string): Promise<boolean> {
    const metas = await this.getAllImagesMeta();
    const toDelete = metas.filter((m) => m.noteId === noteId);

    for (const meta of toDelete) {
      await imageStore.removeItem(`image-blob-${meta.id}`);
    }

    const newMetas = metas.filter((m) => m.noteId !== noteId);
    await localForage.setItem('imagesMeta', JSON.stringify(newMetas));

    return true;
  }

  async cleanupOrphanedBlobs(): Promise<void> {
    const metas = await this.getAllImagesMeta();
    const validIds = new Set(metas.map((m) => m.id));

    const keys = await imageStore.keys();
    for (const key of keys) {
      if (key.startsWith('image-blob-')) {
        const id = key.replace('image-blob-', '');
        if (!validIds.has(id)) {
          await imageStore.removeItem(key);
        }
      }
    }
  }

  async saveImageFromRemote(
    imageId: string,
    blob: Blob,
    mimeType: string,
    remoteUrl: string
  ): Promise<ImageMetaType> {
    await imageStore.setItem(`image-blob-${imageId}`, blob);

    const now = Date.now();
    const meta: ImageMetaType = {
      id: imageId,
      noteId: '', // We don't know the noteId when fetching from remote
      mimeType,
      size: blob.size,
      syncStatus: 'synced',
      remoteUrl,
      createdAt: now,
      updatedAt: now,
    };

    const metas = await this.getAllImagesMeta();
    const existingIndex = metas.findIndex((m) => m.id === imageId);

    if (existingIndex >= 0) {
      metas[existingIndex] = meta;
    } else {
      metas.push(meta);
    }

    await localForage.setItem('imagesMeta', JSON.stringify(metas));
    return meta;
  }
}

export default ImageRepository;
