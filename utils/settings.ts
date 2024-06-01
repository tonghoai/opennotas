function getDefaultSettings() {
  return {
    general: {
      lang: 'en',
      theme: 'system',
      defaultEditor: 'CodeMirror',
    },
    sync: {
      frequency: '5',
      adapter: 'LocalForage',
      configuration: '{}',
    },
  }
}

export { getDefaultSettings };
