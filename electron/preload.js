const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getPlatform: () => ipcRenderer.invoke('get-platform'),

  storeToken: (token, expiry) => ipcRenderer.invoke('store-token', token, expiry),
  getToken: () => ipcRenderer.invoke('get-token'),
  removeToken: () => ipcRenderer.invoke('remove-token'),

  isElectron: true,
})
