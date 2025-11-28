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

export { getDefaultSettings, DEFAULT_IMAGE_PROXY_URL };
