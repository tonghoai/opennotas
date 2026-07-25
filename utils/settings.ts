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

export { getDefaultSettings, DEFAULT_IMAGE_PROXY_URL, sanitizeSettingsForExport };
