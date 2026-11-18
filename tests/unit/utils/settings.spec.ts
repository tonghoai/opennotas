import { describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_IMAGE_PROXY_URL,
  decryptSensitiveSettings,
  encryptSensitiveSettings,
  getDefaultSettings,
  sanitizeSettingsForExport,
  stripEncryptedFields,
} from '~/utils/settings';

describe('settings helpers', () => {
  it('provides stable defaults', () => {
    const settings = getDefaultSettings();
    expect(settings.general.defaultEditor).toBe('Crepe');
    expect(settings.general.lang).toBe('en');
    expect(settings.sync.adapter).toBe('LocalForage');
    expect(settings.imageSync.enabled).toBe(false);
    expect(settings).not.toBe(getDefaultSettings());
    expect(DEFAULT_IMAGE_PROXY_URL).toMatch(/^https:\/\//);
  });

  it('sanitizes secrets before export', () => {
    const settings = {
      general: { lang: 'vi' },
      sync: { configuration: '{"token":"secret"}' },
      imageSync: { s3AccessKey: 'key', s3SecretKey: 'secret', s3Bucket: 'bucket' },
    };
    expect(sanitizeSettingsForExport(settings)).toEqual({
      general: { lang: 'vi' },
      sync: {},
      imageSync: { s3Bucket: 'bucket' },
    });
    expect(settings.sync.configuration).toBe('{"token":"secret"}');
  });

  it('encrypts only sensitive fields and remembers their paths', async () => {
    const settings = {
      general: { lang: 'vi' },
      sync: { configuration: '{"token":"secret"}', adapter: 'Turso' },
      imageSync: { s3AccessKey: 'key', s3SecretKey: 'secret', s3Bucket: 'bucket' },
    };
    const { settings: encrypted, encryptedFields } = await encryptSensitiveSettings(settings, 'pw');

    expect(encrypted.general).toEqual({ lang: 'vi' });
    expect(encrypted.sync.adapter).toBe('Turso');
    expect(encrypted.sync.configuration).not.toBe('{"token":"secret"}');
    expect(encrypted.imageSync.s3AccessKey).not.toBe('key');
    expect(encrypted.imageSync.s3SecretKey).not.toBe('secret');
    expect(encrypted.imageSync.s3Bucket).toBe('bucket');
    expect(encryptedFields).toEqual([
      'sync.configuration',
      'imageSync.s3AccessKey',
      'imageSync.s3SecretKey',
    ]);

    const decrypted = await decryptSensitiveSettings(encrypted, encryptedFields, 'pw');
    expect(decrypted).toEqual(settings);
  });

  it('keeps plaintext values with stale encrypted markers', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const decrypted = await decryptSensitiveSettings(
      { sync: { configuration: 'not-ciphertext' } },
      ['sync.configuration'],
      'pw',
    );
    expect(decrypted.sync.configuration).toBe('not-ciphertext');
    expect(warn).toHaveBeenCalled();
  });

  it('drops fields that cannot be decrypted and strips encrypted fields', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const decrypted = await decryptSensitiveSettings(
      { imageSync: { s3AccessKey: 'a'.repeat(56), s3Bucket: 'bucket' } },
      ['imageSync.s3AccessKey'],
      'wrong',
    );
    expect(decrypted.imageSync).toEqual({ s3Bucket: 'bucket' });
    expect(warn).toHaveBeenCalled();

    expect(stripEncryptedFields(
      { sync: { configuration: 'secret' }, imageSync: { s3SecretKey: 'secret', s3Bucket: 'b' } },
      ['sync.configuration', 'imageSync.s3SecretKey'],
    )).toEqual({ sync: {}, imageSync: { s3Bucket: 'b' } });
  });
});
