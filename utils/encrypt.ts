async function encryptData(data: string, password: string) {
  const textEncoder = new TextEncoder();
  const encodedData = textEncoder.encode(data);

  const passwordBuffer = await crypto.subtle.digest('SHA-256', textEncoder.encode(password));

  const key = await crypto.subtle.importKey('raw', passwordBuffer, 'AES-GCM', true, ['encrypt']);

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encryptedData = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, encodedData);

  const resultBuffer = new Uint8Array(iv.byteLength + encryptedData.byteLength);
  resultBuffer.set(iv, 0);
  resultBuffer.set(new Uint8Array(encryptedData), iv.byteLength);

  return Array.prototype.map.call(resultBuffer, x => ('00' + x.toString(16)).slice(-2)).join('');
}

async function decryptData(encryptedDataHex: string, password: string) {
  const textDecoder = new TextDecoder();

  const encryptedDataBuffer = new Uint8Array((encryptedDataHex.match(/[\da-f]{2}/gi)!).map(h => parseInt(h, 16))).buffer;

  const iv = new Uint8Array(encryptedDataBuffer.slice(0, 12));
  const encryptedData = new Uint8Array(encryptedDataBuffer.slice(12));

  const passwordBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));

  const key = await crypto.subtle.importKey('raw', passwordBuffer, 'AES-GCM', true, ['decrypt']);

  const decryptedData = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv }, key, encryptedData);

  return textDecoder.decode(decryptedData);
}

// encryptData's output is always a pure lowercase-hex string of (12-byte IV + ciphertext +
// 16-byte GCM tag) bytes, hex-encoded — minimum 56 characters, even length, [0-9a-f] only.
// A value that doesn't match this shape was never produced by encryptData, so it can't be
// decrypted and shouldn't be treated as ciphertext (e.g. an older client's plaintext value
// sitting next to a stale "this field is encrypted" marker it doesn't understand).
function looksLikeCiphertext(value: string): boolean {
  return typeof value === 'string' && value.length >= 56 && value.length % 2 === 0 && /^[0-9a-f]+$/i.test(value);
}

export {
  encryptData,
  decryptData,
  looksLikeCiphertext,
}
