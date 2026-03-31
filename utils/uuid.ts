function randomUUID() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  // Fallback for non-secure contexts (e.g. HTTP without localhost)
  return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c: string) => {
    const n = Number(c);
    return (n ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (n / 4)))).toString(16);
  });
}

export {
  randomUUID
}
