import type NotasImageAdapter from '../adapter-image';
import type { ImageType } from '~/repositories/image.type';
import { DEFAULT_IMAGE_PROXY_URL } from '~/utils/settings';

interface S3Config {
  endpoint: string;
  accessKey: string;
  secretKey: string;
  bucket: string;
}

interface S3ProxyConfig {
  workerUrl?: string;
  s3Endpoint: string;
  s3AccessKey: string;
  s3SecretKey: string;
  s3Bucket: string;
}

class S3ProxyAdapter implements NotasImageAdapter {
  private workerUrl: string;
  private s3Config: S3Config;

  constructor(config: S3ProxyConfig | string) {
    let parsed: S3ProxyConfig;

    if (typeof config === 'string') {
      parsed = JSON.parse(config) as S3ProxyConfig;
    } else {
      parsed = config;
    }

    this.workerUrl = (parsed.workerUrl || DEFAULT_IMAGE_PROXY_URL).replace(/\/$/, '');

    this.s3Config = {
      endpoint: parsed.s3Endpoint,
      accessKey: parsed.s3AccessKey,
      secretKey: parsed.s3SecretKey,
      bucket: parsed.s3Bucket,
    };
  }

  async uploadImage(image: ImageType): Promise<string> {
    const formData = new FormData();

    const file = image.blob instanceof File
      ? image.blob
      : new File([image.blob], `${image.id}.${this.getExtension(image.mimeType)}`, {
        type: image.mimeType,
      });

    formData.append('file', file);
    formData.append('imageId', image.id);
    formData.append('s3Config', JSON.stringify(this.s3Config));

    const response = await fetch(`${this.workerUrl}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Upload failed: ${(error as any).error || response.statusText}`);
    }

    const result = await response.json() as { success: boolean; url: string };

    if (!result.success || !result.url) {
      throw new Error('Upload failed: Invalid response');
    }

    return result.url;
  }

  async deleteImage(imageId: string): Promise<void> {
    const response = await fetch(`${this.workerUrl}/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageId,
        s3Config: this.s3Config,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Delete failed: ${(error as any).error || response.statusText}`);
    }
  }

  async getImage(imageUrl: string): Promise<string> {
    const response = await fetch(`${this.workerUrl}/get`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageUrl,
        s3Config: this.s3Config,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get image: ${response.statusText}`);
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  }

  async checkConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.workerUrl}/health`, {
        method: 'GET',
      });

      if (!response.ok) {
        return false;
      }

      const result = await response.json() as { status: string };
      return result.status === 'ok';
    } catch {
      return false;
    }
  }

  isConfigValid(): boolean {
    return !!(
      this.s3Config.endpoint &&
      this.s3Config.accessKey &&
      this.s3Config.secretKey &&
      this.s3Config.bucket
    );
  }

  private getExtension(mimeType: string): string {
    const mimeToExt: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
    };
    return mimeToExt[mimeType] || 'jpg';
  }
}

export default S3ProxyAdapter;
export type { S3ProxyConfig, S3Config };
