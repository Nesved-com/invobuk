import { dbGetAll, dbBulkInsert } from '@/lib/sqliteStorage'

const DRIVE_FILE_NAME = 'renuka-billing-backup.json'

let accessToken: string | null = null

interface GoogleAuthBridge {
  start: (clientId: string, clientSecret: string) => Promise<{ access_token?: string; refresh_token?: string; error?: string; error_description?: string }>
  refresh: (clientId: string, clientSecret: string, refreshToken: string) => Promise<{ access_token?: string; error?: string; error_description?: string }>
}

function getAuthBridge(): GoogleAuthBridge {
  const bridge = (window as any).electronGoogleAuth
  if (!bridge) throw new Error('Google sign-in is only available in the desktop app.')
  return bridge
}

/**
 * Opens the system browser for the user to sign in to Google, since Google
 * blocks OAuth inside embedded browsers like Electron's BrowserWindow. Returns
 * the access token (for immediate use) and a refresh token (to persist, so
 * future sessions/background sync don't need to re-prompt the user).
 */
export async function startGoogleAuth(clientId: string, clientSecret: string): Promise<{ accessToken: string; refreshToken?: string }> {
  const result = await getAuthBridge().start(clientId, clientSecret)
  if (result.error || !result.access_token) {
    throw new Error(result.error_description || result.error || 'Sign-in failed')
  }
  accessToken = result.access_token
  return { accessToken: result.access_token, refreshToken: result.refresh_token }
}

/** Silently gets a fresh access token from a previously-saved refresh token — no browser prompt. */
export async function restoreGoogleSession(clientId: string, clientSecret: string, refreshToken: string): Promise<boolean> {
  if (!clientId || !clientSecret || !refreshToken) return false
  try {
    const result = await getAuthBridge().refresh(clientId, clientSecret, refreshToken)
    if (result.error || !result.access_token) return false
    accessToken = result.access_token
    return true
  } catch {
    return false
  }
}

export async function getConnectedEmail(): Promise<string> {
  if (!accessToken) return ''
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const data = await res.json()
  return data.email ?? ''
}

export function isSignedIn(): boolean {
  return !!accessToken
}

export function signOut() {
  accessToken = null
}

async function findBackupFileId(): Promise<string | null> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=name='${DRIVE_FILE_NAME}' and trashed=false&spaces=drive&fields=files(id,name,modifiedTime)`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  const data = await res.json()
  return data.files?.[0]?.id ?? null
}

const SQLITE_TABLES = ['invoices', 'quotations', 'purchase_orders', 'supplier_pos', 'delivery_challans']

export async function collectAllData(): Promise<Record<string, any>> {
  const keys = [
    'billing-products-v2',
    'billing-customers-v2',
    'billing-company',
    'billing-shipping-addresses-v1',
  ]
  const result: Record<string, any> = {}
  for (const k of keys) {
    const val = localStorage.getItem(k)
    if (val) result[k] = JSON.parse(val)
  }
  // Transactional documents (invoices, quotations, purchase orders, etc.) live in
  // SQLite, not the JSON-file stores above — include each table separately.
  for (const table of SQLITE_TABLES) {
    result[`sqlite-${table}`] = await dbGetAll(table)
  }
  return result
}

async function readDriveError(res: Response): Promise<string> {
  try {
    const body = await res.json()
    return body?.error?.message || body?.error_description || `${res.status} ${res.statusText}`
  } catch {
    return `${res.status} ${res.statusText}`
  }
}

async function uploadOnce(blob: Blob, existingId: string | null): Promise<Response> {
  const metadata = { name: DRIVE_FILE_NAME, mimeType: 'application/json' }
  const form = new FormData()
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
  form.append('file', blob)

  const url = existingId
    ? `https://www.googleapis.com/upload/drive/v3/files/${existingId}?uploadType=multipart`
    : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart'

  return fetch(url, {
    method: existingId ? 'PATCH' : 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  })
}

export async function uploadBackup(): Promise<void> {
  if (!accessToken) throw new Error('Not signed in to Google')

  const payload = {
    exportedAt: new Date().toISOString(),
    appVersion: '1.0.0',
    data: await collectAllData(),
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })

  const existingId = await findBackupFileId()
  let res = await uploadOnce(blob, existingId)

  // The existing backup file may have been created under a different/older OAuth
  // client (e.g. before switching Client IDs) and no longer be accessible to this
  // one under the `drive.file` per-file scope — fall back to creating a fresh file.
  if (!res.ok && existingId && (res.status === 403 || res.status === 404)) {
    res = await uploadOnce(blob, null)
  }

  if (!res.ok) throw new Error(`Upload failed: ${await readDriveError(res)}`)
}

export async function downloadBackup(): Promise<Record<string, any> | null> {
  if (!accessToken) throw new Error('Not signed in to Google')

  const fileId = await findBackupFileId()
  if (!fileId) return null

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  if (!res.ok) throw new Error(`Download failed: ${res.statusText}`)
  return await res.json()
}

export async function restoreFromBackup(backup: Record<string, any>): Promise<void> {
  const data = backup.data ?? backup
  for (const [key, value] of Object.entries(data)) {
    if (key.startsWith('sqlite-')) {
      const table = key.slice('sqlite-'.length)
      if (Array.isArray(value) && value.length > 0) await dbBulkInsert(table, value)
      continue
    }
    localStorage.setItem(key, JSON.stringify(value))
  }
}
