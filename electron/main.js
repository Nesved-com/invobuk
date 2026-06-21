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

// electron-store v11+ is ESM-only; use dynamic import.
// Each Zustand store on the renderer side calls persist() with its own unique
// name (e.g. "billing-invoices-v1", "billing-customers-v2"). We give each of
// those names its own electron-store instance, so each menu/data-domain gets
// its own JSON file instead of one giant combined file:
//   C:\Users\<Name>\AppData\Roaming\Invobuk\billing-invoices-v1.json
//   C:\Users\<Name>\AppData\Roaming\Invobuk\billing-customers-v2.json
//   ...etc, one per store.
const stores = new Map()

async function getStore(name) {
  if (!stores.has(name)) {
    const { default: Store } = await import('electron-store')
    stores.set(name, new Store({ name }))
  }
  return stores.get(name)
}

// IPC handlers — called from renderer via preload.js
ipcMain.handle('store-get', async (_event, key) => {
  const store = await getStore(key)
  return store.get('data', null)
})

ipcMain.handle('store-set', async (_event, key, value) => {
  const store = await getStore(key)
  store.set('data', value)
})

ipcMain.handle('store-delete', async (_event, key) => {
  const store = await getStore(key)
  store.delete('data')
})

ipcMain.handle('get-machine-id', () => getMachineId())

async function createWindow() {
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
