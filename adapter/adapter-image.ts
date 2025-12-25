import type { ImageType } from '~/repositories/image.type';

class NotasImageAdapter {
  async uploadImage(image: ImageType): Promise<string> {
    throw new Error('Not implemented');
  }

  async deleteImage(imageId: string): Promise<void> {
    throw new Error('Not implemented');
  }

  async checkConnection(): Promise<boolean> {
    throw new Error('Not implemented');
  }
}

export default NotasImageAdapter;
