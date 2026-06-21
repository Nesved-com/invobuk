const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronStore', {
  get:    (key)        => ipcRenderer.invoke('store-get', key),
  set:    (key, value) => ipcRenderer.invoke('store-set', key, value),
  remove: (key)        => ipcRenderer.invoke('store-delete', key),
})

contextBridge.exposeInMainWorld('electronMachine', {
  getId: () => ipcRenderer.invoke('get-machine-id'),
})
