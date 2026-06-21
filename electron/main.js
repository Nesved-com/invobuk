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

// Everything is stored in one SQLite file (invobuk.db) — no JSON files at all.
//   C:\Users\<Name>\AppData\Roaming\Invobuk\invobuk.db
//
// Two kinds of tables:
//  - kv_store: one row per Zustand "store name" holding its whole persisted
//    blob (used by Company/Auth/License/User/Customers/Products/etc — small,
//    config-shaped stores where a single blob is simplest).
//  - tbl_<name>: one row PER RECORD (used by Invoices/Quotations/Purchase
//    Orders/etc — data that grows per-transaction and benefits from a save
//    only touching the one changed row instead of rewriting everything).
let db

function getDb() {
  if (!db) {
    const dbPath = path.join(app.getPath('userData'), 'invobuk.db')
    db = new Database(dbPath)
    db.pragma('journal_mode = WAL')
    db.exec(`CREATE TABLE IF NOT EXISTS kv_store (key TEXT PRIMARY KEY, value TEXT)`)
  }
  return db
}

// Migrates a legacy electron-store JSON file (named "<key>.json") into kv_store,
// once, the first time that key is read and kv_store doesn't have it yet.
// Note: the value stored under electron-store's 'data' key is already a JSON
// *string* (electronStorage.ts on the renderer side stringifies before calling
// es.set) — store it as-is, don't re-stringify.
async function migrateLegacyJsonFile(key) {
  try {
    const { default: Store } = await import('electron-store')
    const legacy = new Store({ name: key })
    const value = legacy.get('data', null)
    if (typeof value === 'string') {
      getDb().prepare('INSERT OR REPLACE INTO kv_store (key, value) VALUES (?, ?)').run(key, value)
    }
  } catch {
    // No legacy file for this key (fresh install) — nothing to migrate.
  }
}

// IPC handlers — called from renderer via preload.js.
// value/return here is always the raw JSON *string* electronStorage.ts already
// produced/expects — we just store and return it as-is, no extra (de)serializing.
ipcMain.handle('store-get', async (_event, key) => {
  let row = getDb().prepare('SELECT value FROM kv_store WHERE key = ?').get(key)
  if (!row) {
    await migrateLegacyJsonFile(key)
    row = getDb().prepare('SELECT value FROM kv_store WHERE key = ?').get(key)
  }
  return row ? row.value : null
})

ipcMain.handle('store-set', (_event, key, value) => {
  getDb().prepare('INSERT OR REPLACE INTO kv_store (key, value) VALUES (?, ?)').run(key, value)
})

ipcMain.handle('store-delete', (_event, key) => {
  getDb().prepare('DELETE FROM kv_store WHERE key = ?').run(key)
})

ipcMain.handle('get-machine-id', () => getMachineId())

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
