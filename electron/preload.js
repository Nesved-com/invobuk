const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronStore', {
  get:    (key)        => ipcRenderer.invoke('store-get', key),
  set:    (key, value) => ipcRenderer.invoke('store-set', key, value),
  remove: (key)        => ipcRenderer.invoke('store-delete', key),
})

contextBridge.exposeInMainWorld('electronMachine', {
  getId: () => ipcRenderer.invoke('get-machine-id'),
})

contextBridge.exposeInMainWorld('electronDB', {
  getAll:     (table)         => ipcRenderer.invoke('db-get-all', table),
  upsert:     (table, record) => ipcRenderer.invoke('db-upsert', table, record),
  remove:     (table, id)     => ipcRenderer.invoke('db-delete', table, id),
  bulkInsert: (table, rows)   => ipcRenderer.invoke('db-bulk-insert', table, rows),
  count:      (table)         => ipcRenderer.invoke('db-count', table),
})
