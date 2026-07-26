const { app, BrowserWindow, shell, ipcMain, dialog } = require('electron')
const path = require('path')
const os = require('os')
const crypto = require('crypto')
const http = require('http')
const fs = require('fs')
const Database = require('better-sqlite3')

// Logo for the OAuth callback page, inlined as base64 so the page works with
// no other asset requests (it's served by our own tiny loopback HTTP server).
function getLogoDataUri() {
  try {
    const logoPath = path.join(__dirname, '../dist/icon-512.png')
    const buf = fs.readFileSync(logoPath)
    return `data:image/png;base64,${buf.toString('base64')}`
  } catch {
    return ''
  }
}

function renderOAuthCallbackPage({ success, message }) {
  const logo = getLogoDataUri()
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>Invobuk</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, 'Inter', system-ui, sans-serif;
    background: #f5f7fa;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .card {
    background: #fff;
    border-radius: 24px;
    box-shadow: 0 20px 60px rgba(15, 81, 50, 0.12);
    padding: 48px 40px;
    text-align: center;
    max-width: 380px;
  }
  .logo {
    width: 72px;
    height: 72px;
    border-radius: 16px;
    margin-bottom: 20px;
  }
  .icon-circle {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    margin: 0 auto 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${success ? '#ecfdf5' : '#fef2f2'};
  }
  h1 {
    font-size: 19px;
    font-weight: 700;
    color: #111827;
    margin-bottom: 8px;
  }
  p {
    font-size: 14px;
    color: #6b7280;
    line-height: 1.5;
  }
  .brand {
    margin-top: 28px;
    font-size: 12px;
    color: #9ca3af;
  }
  .brand b { color: #15803d; }
</style>
</head>
<body>
  <div class="card">
    ${logo ? `<img src="${logo}" class="logo" alt="Invobuk" />` : ''}
    <div class="icon-circle">
      ${success
        ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>'
        : '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>'}
    </div>
    <h1>${success ? 'Sign-in complete' : 'Sign-in failed'}</h1>
    <p>${message}</p>
    <div class="brand">Invo<b>buk</b> — Smart Billing, Simple Business</div>
  </div>
  <script>setTimeout(() => { try { window.close() } catch (e) {} }, 2500)</script>
</body>
</html>`
}

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

// ─── Google OAuth (desktop-app loopback flow) ───────────────────────────────
// Google blocks sign-in inside embedded browsers like Electron's BrowserWindow
// ("Access blocked" errors), so this opens the user's real system browser via
// shell.openExternal and catches the redirect with a temporary local HTTP
// server on 127.0.0.1, per Google's documented flow for installed/desktop apps.
function base64url(buf) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const GOOGLE_SCOPES = 'https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email'

function googleOAuthFlow(clientId, clientSecret) {
  const codeVerifier = base64url(crypto.randomBytes(32))
  const codeChallenge = base64url(crypto.createHash('sha256').update(codeVerifier).digest())
  let port // captured once from listen()'s callback — server.address() returns null after .close(), so don't rely on reading it again later

  return new Promise((resolve, reject) => {
    let settled = false
    const timeout = setTimeout(() => {
      if (settled) return
      settled = true
      try { server.close() } catch {}
      reject(new Error('Sign-in timed out — please try again'))
    }, 5 * 60 * 1000)

    const server = http.createServer(async (req, res) => {
      const url = new URL(req.url, 'http://127.0.0.1')
      if (url.pathname !== '/callback') { res.end(); return }

      const code = url.searchParams.get('code')
      const error = url.searchParams.get('error')
      res.writeHead(200, { 'Content-Type': 'text/html' })
      res.end(renderOAuthCallbackPage(
        error || !code
          ? { success: false, message: 'Something went wrong during sign-in. Please close this tab and try again from Invobuk.' }
          : { success: true, message: 'You can close this tab and return to the app — Invobuk is finishing up the connection.' }
      ))

      if (settled) return
      clearTimeout(timeout)
      server.close()

      if (error) { settled = true; reject(new Error(error)); return }
      if (!code) { settled = true; reject(new Error('No authorization code received')); return }

      try {
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: `http://127.0.0.1:${port}/callback`,
            grant_type: 'authorization_code',
            code_verifier: codeVerifier,
          }),
        })
        const tokenData = await tokenRes.json()
        settled = true
        if (tokenData.error) { reject(new Error(tokenData.error_description || tokenData.error)); return }
        resolve(tokenData)
      } catch (e) {
        settled = true
        reject(e)
      }
    })

    server.listen(0, '127.0.0.1', () => {
      port = server.address().port
      const redirectUri = `http://127.0.0.1:${port}/callback`
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
      authUrl.searchParams.set('client_id', clientId)
      authUrl.searchParams.set('redirect_uri', redirectUri)
      authUrl.searchParams.set('response_type', 'code')
      authUrl.searchParams.set('scope', GOOGLE_SCOPES)
      authUrl.searchParams.set('access_type', 'offline')
      authUrl.searchParams.set('prompt', 'consent select_account')
      authUrl.searchParams.set('code_challenge', codeChallenge)
      authUrl.searchParams.set('code_challenge_method', 'S256')
      shell.openExternal(authUrl.toString())
    })
  })
}

ipcMain.handle('google-oauth-start', (_event, clientId, clientSecret) => googleOAuthFlow(clientId, clientSecret))

ipcMain.handle('google-oauth-refresh', async (_event, clientId, clientSecret, refreshToken) => {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  return res.json()
})

// ─── File export (monthly CA folder, incoming PO PDFs) ──────────────────────
// Incoming Purchase Orders parsed from an uploaded PDF keep a copy of the original
// file here, keyed by the id we hand back to the renderer — so a later "export this
// month's documents" pass can copy the real original instead of re-generating one.
function incomingPoDir() {
  const dir = path.join(app.getPath('userData'), 'incoming-po-pdfs')
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

ipcMain.handle('save-incoming-po-pdf', (_event, fileId, bytes) => {
  const filePath = path.join(incomingPoDir(), `${fileId}.pdf`)
  fs.writeFileSync(filePath, Buffer.from(bytes))
  return filePath
})

ipcMain.handle('select-export-folder', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory', 'createDirectory'] })
  if (result.canceled || !result.filePaths.length) return null
  return result.filePaths[0]
})

ipcMain.handle('ensure-dir', (_event, dirPath) => {
  fs.mkdirSync(dirPath, { recursive: true })
})

ipcMain.handle('export-write-file', (_event, filePath, bytes) => {
  fs.writeFileSync(filePath, Buffer.from(bytes))
})

ipcMain.handle('export-copy-incoming-pdf', (_event, fileId, destPath) => {
  const src = path.join(incomingPoDir(), `${fileId}.pdf`)
  if (!fs.existsSync(src)) return false
  fs.copyFileSync(src, destPath)
  return true
})

ipcMain.handle('open-path', (_event, targetPath) => shell.openPath(targetPath))

async function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'Invobuk',
    icon: path.join(__dirname, '../dist/icon-512.png'),
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
