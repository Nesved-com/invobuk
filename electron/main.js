const { app, BrowserWindow, shell, ipcMain } = require('electron')
const path = require('path')
const os = require('os')
const crypto = require('crypto')

// Stable per-machine identifier (hostname + platform + arch, hashed) used to bind a
// license activation to this PC. Not a hardware fingerprint, just enough to distinguish machines.
function getMachineId() {
  const raw = `${os.hostname()}|${os.platform()}|${os.arch()}|${os.userInfo().username}`
  return crypto.createHash('sha256').update(raw).digest('hex')
}

// electron-store v11+ is ESM-only; use dynamic import
let store

async function initStore() {
  const { default: Store } = await import('electron-store')
  store = new Store({
    name: 'invobuk-data',
    // Stores at: C:\Users\<Name>\AppData\Roaming\Invobuk\invobuk-data.json
  })
}

// IPC handlers — called from renderer via preload.js
ipcMain.handle('store-get', (_event, key) => {
  return store ? store.get(key, null) : null
})

ipcMain.handle('store-set', (_event, key, value) => {
  if (store) store.set(key, value)
})

ipcMain.handle('store-delete', (_event, key) => {
  if (store) store.delete(key)
})

ipcMain.handle('get-machine-id', () => getMachineId())

async function createWindow() {
  await initStore()

  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'Invobuk',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  const devServerUrl = process.env.ELECTRON_START_URL
  if (devServerUrl) {
    win.loadURL(devServerUrl)
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  app.quit()
})
