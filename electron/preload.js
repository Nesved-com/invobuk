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

contextBridge.exposeInMainWorld('electronGoogleAuth', {
  start:   (clientId, clientSecret) => ipcRenderer.invoke('google-oauth-start', clientId, clientSecret),
  refresh: (clientId, clientSecret, refreshToken) => ipcRenderer.invoke('google-oauth-refresh', clientId, clientSecret, refreshToken),
})

contextBridge.exposeInMainWorld('electronExport', {
  saveIncomingPoPdf: (fileId, bytes)      => ipcRenderer.invoke('save-incoming-po-pdf', fileId, bytes),
  selectFolder:      ()                   => ipcRenderer.invoke('select-export-folder'),
  ensureDir:         (dirPath)            => ipcRenderer.invoke('ensure-dir', dirPath),
  writeFile:         (filePath, bytes)    => ipcRenderer.invoke('export-write-file', filePath, bytes),
  copyIncomingPdf:   (fileId, destPath)   => ipcRenderer.invoke('export-copy-incoming-pdf', fileId, destPath),
  openPath:          (targetPath)         => ipcRenderer.invoke('open-path', targetPath),
})
