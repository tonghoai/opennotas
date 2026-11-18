import { describe, expect, it } from 'vitest';
import { decryptData, encryptData, looksLikeCiphertext } from '~/utils/encrypt';
import {
  decryptDataAES,
  encryptDataAES,
  exportKey,
  generateKey,
  importKey,
} from '~/utils/encrypt-aes';
import { hashPassword } from '~/utils/password';

describe('password encryption', () => {
  it('round-trips ciphertext and uses random IVs', async () => {
    const first = await encryptData('secret note', 'correct horse');
    const second = await encryptData('secret note', 'correct horse');

    expect(first).not.toBe(second);
    expect(looksLikeCiphertext(first)).toBe(true);
    await expect(decryptData(first, 'correct horse')).resolves.toBe('secret note');
    await expect(decryptData(first, 'wrong')).rejects.toBeTruthy();
  });

  it('recognizes only the hex ciphertext shape', () => {
    expect(looksLikeCiphertext('a'.repeat(56))).toBe(true);
    expect(looksLikeCiphertext('g'.repeat(56))).toBe(false);
    expect(looksLikeCiphertext('a'.repeat(55))).toBe(false);
    expect(looksLikeCiphertext('')).toBe(false);
  });

  it('hashes passwords deterministically', async () => {
    const hash = await hashPassword('password');
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    await expect(hashPassword('password')).resolves.toBe(hash);
    await expect(hashPassword('Password')).resolves.not.toBe(hash);
  });
});

describe('E2EE key encryption', () => {
  it('round-trips AES-GCM content and exports/imports a JWK', async () => {
    const key = await generateKey();
    const ciphertext = await encryptDataAES('private note', key);

    expect(ciphertext).toContain(':');
    await expect(decryptDataAES(ciphertext, key)).resolves.toBe('private note');

    const serialized = await exportKey(key);
    expect(JSON.parse(serialized).kty).toBe('oct');
    const imported = await importKey(serialized);
    await expect(decryptDataAES(ciphertext, imported)).resolves.toBe('private note');
  });
});
