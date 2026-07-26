// Default worker URL for image proxy
const DEFAULT_IMAGE_PROXY_URL = 'https://image-proxy.opennotas.io';

function getDefaultSettings() {
  return {
    general: {
      lang: 'en',
      theme: 'system',
      defaultEditor: 'Crepe',
      editorView: 'compact',
      fontFamily: 'System',
    },
    sync: {
      frequency: '5',
      adapter: 'LocalForage',
      configuration: '{}',
    },
    imageSync: {
      enabled: false,
      workerUrl: '',
      s3Endpoint: '',
      s3AccessKey: '',
      s3SecretKey: '',
      s3Bucket: '',
    },
  }
}

function sanitizeSettingsForExport(settings: any) {
  const clone = JSON.parse(JSON.stringify(settings));
  if (clone.sync) delete clone.sync.configuration;
  if (clone.imageSync) {
    delete clone.imageSync.s3AccessKey;
    delete clone.imageSync.s3SecretKey;
  }
  return clone;
}

// Settings fields that hold secrets (S3 credentials, sync connection strings). When an export
// includes them, they're individually AES-encrypted rather than shipped as plaintext in the
// downloaded JSON file — encryptedFields records which ones so import can reverse it.
const SENSITIVE_SETTINGS_FIELDS: [string, string][] = [
  ['sync', 'configuration'],
  ['imageSync', 's3AccessKey'],
  ['imageSync', 's3SecretKey'],
];

async function encryptSensitiveSettings(settings: any, password: string) {
  const clone = JSON.parse(JSON.stringify(settings));
  const encryptedFields: string[] = [];
  for (const [group, field] of SENSITIVE_SETTINGS_FIELDS) {
    const value = clone[group]?.[field];
    if (value) {
      clone[group][field] = await encryptData(value, password);
      encryptedFields.push(`${group}.${field}`);
    }
  }
  return { settings: clone, encryptedFields };
}

async function decryptSensitiveSettings(settings: any, encryptedFields: string[], password: string) {
  const clone = JSON.parse(JSON.stringify(settings));
  for (const path of encryptedFields || []) {
    const [group, field] = path.split('.');
    const value = clone[group]?.[field];
    if (value) clone[group][field] = await decryptData(value, password);
  }
  return clone;
}

// Drops sensitive fields that can't be decrypted (no local password to unlock them with)
// instead of importing them as raw ciphertext.
function stripEncryptedFields(settings: any, encryptedFields: string[]) {
  const clone = JSON.parse(JSON.stringify(settings));
  for (const path of encryptedFields || []) {
    const [group, field] = path.split('.');
    if (clone[group]) delete clone[group][field];
  }
  return clone;
}

export {
  getDefaultSettings,
  DEFAULT_IMAGE_PROXY_URL,
  sanitizeSettingsForExport,
  encryptSensitiveSettings,
  decryptSensitiveSettings,
  stripEncryptedFields,
};
