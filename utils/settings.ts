function getDefaultSettings() {
  return {
    general: {
      lang: 'en',
      theme: 'system',
      defaultEditor: 'Crepe',
      editorView: 'compact',
    },
    sync: {
      frequency: '5',
      adapter: 'LocalForage',
      configuration: '{}',
    },
  }
}

export { getDefaultSettings };
