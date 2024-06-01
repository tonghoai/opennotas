async function encryptDataAES(plainText: string, key: CryptoKey) {
  let iv = window.crypto.getRandomValues(new Uint8Array(12));
  let encoder = new TextEncoder();
  let encoded = encoder.encode(plainText);

  return window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv
    },
    key,
    encoded
  ).then(function (ciphertext) {
    // Convert IV and ciphertext to base64
    let ivBase64 = btoa(String.fromCharCode.apply(null, Array.from(iv)));
    let ciphertextBase64 = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(ciphertext))));

    // Concatenate IV and ciphertext
    return ivBase64 + ":" + ciphertextBase64;
  });
}

async function decryptDataAES(ciphertext: string, key: CryptoKey) {
  // Split IV and ciphertext
  let parts = ciphertext.split(":");
  let ivBase64 = parts[0];
  let ciphertextBase64 = parts[1];

  // Convert IV and ciphertext from base64
  let iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
  let ciphertextBytes = Uint8Array.from(atob(ciphertextBase64), c => c.charCodeAt(0));

  return window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv
    },
    key,
    ciphertextBytes
  ).then(function (plaintext) {
    let decoder = new TextDecoder();
    return decoder.decode(new Uint8Array(plaintext));
  });
}

async function generateKey(): Promise<CryptoKey> {
  const key = await window.crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );

  return key;
}

async function exportKey(key: CryptoKey) {
  return window.crypto.subtle.exportKey(
    "jwk",
    key
  ).then(function (keyData) {
    return JSON.stringify(keyData);
  });
}

async function importKey(keyString: string) {
  let keyData = JSON.parse(keyString);

  return window.crypto.subtle.importKey(
    "jwk",
    keyData,
    {
      name: "AES-GCM",
      length: 256
    },
    true,
    ["encrypt", "decrypt"]
  );
}

export {
  encryptDataAES,
  decryptDataAES,
  generateKey,
  exportKey,
  importKey,
}
