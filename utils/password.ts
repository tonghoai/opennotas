async function hashPassword(password: string): Promise<string> {
  var encoder = new TextEncoder();
  var data = encoder.encode(password);

  const hash = await crypto.subtle.digest('SHA-256', data)
    .then(function (hash) {
      var hashArray = Array.from(new Uint8Array(hash));
      var hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
      return hashHex;
    });

  return hash;
}

export {
  hashPassword,
}
