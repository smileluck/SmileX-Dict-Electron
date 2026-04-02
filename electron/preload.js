const { contextBridge, ipcRenderer } = require('electron')

// Expose protected APIs to the renderer process via contextBridge
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getPlatform: () => ipcRenderer.invoke('get-platform'),

  // Platform detection
  isElectron: true,
})
