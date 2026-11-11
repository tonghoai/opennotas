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
      editorFontFamily: '',
      editorFontSize: 14,
      editorLineHeight: 1.5,
      editorBlockSpacing: 0.75,
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

// Secret fields are encrypted individually on export; encryptedFields records them.
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

// Decrypt fields independently; stale markers on plaintext and unreadable ciphertext
// must not take down the rest of the imported settings.
async function decryptSensitiveSettings(settings: any, encryptedFields: string[], password: string) {
  const clone = JSON.parse(JSON.stringify(settings));
  for (const path of encryptedFields || []) {
    const [group, field] = path.split('.');
    const value = clone[group]?.[field];
    if (!value) continue;
    if (!looksLikeCiphertext(value)) {
      console.warn(`Setting "${path}" is flagged encrypted but isn't valid ciphertext — treating it as plaintext`);
      continue;
    }
    try {
      clone[group][field] = await decryptData(value, password);
    } catch (err) {
      console.warn(`Failed to decrypt setting "${path}", dropping it`, err);
      delete clone[group][field];
    }
  }
  return clone;
}

// Strip fields that cannot be decrypted instead of importing raw ciphertext.
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
