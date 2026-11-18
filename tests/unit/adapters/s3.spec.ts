import { beforeEach, describe, expect, it, vi } from 'vitest';
import S3ProxyAdapter from '~/adapter/s3';
import type { ImageType } from '~/repositories/image.type';

function makeImage(): ImageType {
  return {
    id: 'image-1',
    noteId: 'note-1',
    blob: new File(['abc'], 'photo.png', { type: 'image/png' }),
    mimeType: 'image/png',
    size: 3,
    syncStatus: 'pending',
    createdAt: 1,
    updatedAt: 1,
  };
}

const config = {
  workerUrl: 'https://worker.test/',
  s3Endpoint: 'https://s3.test',
  s3AccessKey: 'key',
  s3SecretKey: 'secret',
  s3Bucket: 'bucket',
};

function jsonResponse(body: any, init: ResponseInit = {}) {
  return {
    ok: init.status ? init.status >= 200 && init.status < 300 : true,
    status: init.status || 200,
    statusText: init.statusText || 'OK',
    json: async () => body,
    headers: new Headers(init.headers),
    blob: async () => new Blob(['image']),
  } as any;
}

describe('S3ProxyAdapter', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('normalizes worker URLs and accepts string config', () => {
    const adapter = new S3ProxyAdapter(JSON.stringify({ ...config, workerUrl: '' }));
    expect(adapter.isConfigValid()).toBe(true);

    const invalid = new S3ProxyAdapter({ ...config, s3Bucket: '' });
    expect(invalid.isConfigValid()).toBe(false);
  });

  it('uploads a file with the S3 config and returns the remote URL', async () => {
    const fetchMock = vi.mocked(fetch).mockResolvedValue(jsonResponse({ success: true, url: 'https://cdn.test/a.png' }));
    const adapter = new S3ProxyAdapter(config);
    const url = await adapter.uploadImage(makeImage());

    expect(url).toBe('https://cdn.test/a.png');
    const [requestUrl, request] = fetchMock.mock.calls[0];
    expect(requestUrl).toBe('https://worker.test/upload');
    expect(request.method).toBe('POST');
    const form = request.body as FormData;
    expect(form.get('imageId')).toBe('image-1');
    expect(JSON.parse(String(form.get('s3Config')))).toMatchObject({
      endpoint: 'https://s3.test',
      bucket: 'bucket',
    });
  });

  it('continues uploads for non-File blobs and maps the extension', async () => {
    const fetchMock = vi.mocked(fetch).mockResolvedValue(jsonResponse({ success: true, url: 'https://cdn.test/a.webp' }));
    const adapter = new S3ProxyAdapter(config);
    await adapter.uploadImage({
      ...makeImage(),
      blob: new Blob(['x']),
      mimeType: 'image/webp',
    });
    const form = fetchMock.mock.calls[0][1]!.body as FormData;
    expect((form.get('file') as File).name).toBe('image-1.webp');
  });

  it('surfaces upload errors and invalid responses', async () => {
    const adapter = new S3ProxyAdapter(config);
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ error: 'quota' }, { status: 500, statusText: 'Server Error' }));
    await expect(adapter.uploadImage(makeImage())).rejects.toThrow('Upload failed: quota');

    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ success: false }, { status: 200 }));
    await expect(adapter.uploadImage(makeImage())).rejects.toThrow('Upload failed: Invalid response');
  });

  it('deletes an image', async () => {
    const fetchMock = vi.mocked(fetch).mockResolvedValue(jsonResponse({ success: true }));
    const adapter = new S3ProxyAdapter(config);
    await adapter.deleteImage('image-1');

    const [requestUrl, request] = fetchMock.mock.calls[0];
    expect(requestUrl).toBe('https://worker.test/delete');
    expect(request!.method).toBe('POST');
    expect(JSON.parse(String(request!.body))).toEqual({
      imageId: 'image-1',
      s3Config: {
        endpoint: 'https://s3.test',
        accessKey: 'key',
        secretKey: 'secret',
        bucket: 'bucket',
      },
    });
  });

  it('reports delete errors', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ error: 'missing' }, { status: 404, statusText: 'Not Found' }));
    const adapter = new S3ProxyAdapter(config);
    await expect(adapter.deleteImage('image-1')).rejects.toThrow('Delete failed: missing');
  });

  it('fetches image Blobs and object URLs', async () => {
    const objectUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:remote');
    vi.mocked(fetch).mockResolvedValue(jsonResponse({}));
    const adapter = new S3ProxyAdapter(config);
    await expect(adapter.getImage('https://s3.test/a.png')).resolves.toBe('blob:remote');

    vi.mocked(fetch).mockResolvedValue({
      ...jsonResponse({}),
      headers: new Headers({ 'Content-Type': 'image/webp', 'X-Remote-Url': 'https://cdn.test/a.webp' }),
      blob: async () => new Blob(['remote']),
    });
    const result = await adapter.getImageById('image-1');
    expect(result.mimeType).toBe('image/webp');
    expect(result.remoteUrl).toBe('https://cdn.test/a.webp');
    expect(result.blob).toBeInstanceOf(Blob);
    expect(objectUrl).toHaveBeenCalled();
  });

  it('reports get failures', async () => {
    const adapter = new S3ProxyAdapter(config);
    vi.mocked(fetch).mockResolvedValue(jsonResponse({}, { status: 500, statusText: 'Boom' }));
    await expect(adapter.getImage('https://s3.test/a.png')).rejects.toThrow('Failed to get image: Boom');
    await expect(adapter.getImageById('image-1')).rejects.toThrow('Failed to get image by ID: Boom');
  });

  it('checks connection and returns false on failure', async () => {
    const adapter = new S3ProxyAdapter(config);
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ status: 'ok' }));
    await expect(adapter.checkConnection()).resolves.toBe(true);

    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ status: 'bad' }));
    await expect(adapter.checkConnection()).resolves.toBe(false);

    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({}, { status: 500 }));
    await expect(adapter.checkConnection()).resolves.toBe(false);

    vi.mocked(fetch).mockRejectedValueOnce(new Error('offline'));
    await expect(adapter.checkConnection()).resolves.toBe(false);
  });
});
