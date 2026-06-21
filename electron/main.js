const { app, BrowserWindow, shell, ipcMain } = require('electron')
const path = require('path')
const os = require('os')
const crypto = require('crypto')
const Database = require('better-sqlite3')

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

// ─── SQLite-backed tables (for data that can grow large, e.g. invoices) ─────
// Each "table" is one row per record: id (PK), data (full record as JSON),
// createdAt (indexed, for fast sorted listing). Unlike the JSON-file stores
// above, a save here only touches the one changed row — no full-file rewrite
// as the table grows, and startup doesn't need to parse the whole dataset.
let db

function getDb() {
  if (!db) {
    const dbPath = path.join(app.getPath('userData'), 'invobuk.db')
    db = new Database(dbPath)
    db.pragma('journal_mode = WAL')
  }
  return db
}

function ensureTable(tableName) {
  const name = tableName.replace(/[^a-zA-Z0-9_]/g, '')
  getDb().exec(`
    CREATE TABLE IF NOT EXISTS tbl_${name} (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      createdAt TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_${name}_createdAt ON tbl_${name} (createdAt);
  `)
  return name
}

ipcMain.handle('db-get-all', (_event, tableName) => {
  const name = ensureTable(tableName)
  const rows = getDb().prepare(`SELECT data FROM tbl_${name} ORDER BY createdAt DESC`).all()
  return rows.map(r => JSON.parse(r.data))
})

ipcMain.handle('db-upsert', (_event, tableName, record) => {
  const name = ensureTable(tableName)
  getDb()
    .prepare(`INSERT OR REPLACE INTO tbl_${name} (id, data, createdAt) VALUES (?, ?, ?)`)
    .run(record.id, JSON.stringify(record), record.createdAt || null)
})

ipcMain.handle('db-delete', (_event, tableName, id) => {
  const name = ensureTable(tableName)
  getDb().prepare(`DELETE FROM tbl_${name} WHERE id = ?`).run(id)
})

ipcMain.handle('db-bulk-insert', (_event, tableName, records) => {
  const name = ensureTable(tableName)
  const insert = getDb().prepare(`INSERT OR REPLACE INTO tbl_${name} (id, data, createdAt) VALUES (?, ?, ?)`)
  const insertMany = getDb().transaction((rows) => {
    for (const r of rows) insert.run(r.id, JSON.stringify(r), r.createdAt || null)
  })
  insertMany(records)
})

ipcMain.handle('db-count', (_event, tableName) => {
  const name = ensureTable(tableName)
  return getDb().prepare(`SELECT COUNT(*) as count FROM tbl_${name}`).get().count
})

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
