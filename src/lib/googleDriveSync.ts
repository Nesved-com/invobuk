const DRIVE_FILE_NAME = 'renuka-billing-backup.json'
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'
const SCOPES = 'https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/drive.file'

let tokenClient: any = null
let accessToken: string | null = null

declare global {
  interface Window {
    google: any
    gapi: any
  }
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return }
    const s = document.createElement('script')
    s.src = src
    s.onload = () => resolve()
    s.onerror = reject
    document.head.appendChild(s)
  })
}

export async function initGoogleDrive(clientId: string): Promise<void> {
  await Promise.all([
    loadScript('https://accounts.google.com/gsi/client'),
    loadScript('https://apis.google.com/js/api.js'),
  ])

  await new Promise<void>((resolve) => window.gapi.load('client', resolve))
  await window.gapi.client.init({ discoveryDocs: [DISCOVERY_DOC] })

  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: SCOPES,
    callback: (resp: any) => {
      if (resp.access_token) accessToken = resp.access_token
    },
  })
}

export function requestAccessToken(forceAccountSelect = false): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!tokenClient) { reject(new Error('Not initialized')); return }
    tokenClient.callback = (resp: any) => {
      if (resp.error) { reject(new Error(resp.error)); return }
      accessToken = resp.access_token
      resolve(resp.access_token)
    }
    tokenClient.requestAccessToken({ prompt: forceAccountSelect ? 'select_account' : '' })
  })
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
  if (accessToken) {
    window.google?.accounts.oauth2.revoke(accessToken)
  }
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

export function collectAllData(): Record<string, any> {
  const keys = [
    'billing-invoices',
    'billing-quotations',
    'billing-purchase-orders',
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
  return result
}

export async function uploadBackup(): Promise<void> {
  if (!accessToken) throw new Error('Not signed in to Google')

  const payload = {
    exportedAt: new Date().toISOString(),
    appVersion: '1.0.0',
    data: collectAllData(),
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })

  const existingId = await findBackupFileId()

  const metadata = { name: DRIVE_FILE_NAME, mimeType: 'application/json' }
  const form = new FormData()
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
  form.append('file', blob)

  const url = existingId
    ? `https://www.googleapis.com/upload/drive/v3/files/${existingId}?uploadType=multipart`
    : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart'

  const res = await fetch(url, {
    method: existingId ? 'PATCH' : 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  })

  if (!res.ok) throw new Error(`Upload failed: ${res.statusText}`)
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
    localStorage.setItem(key, JSON.stringify(value))
  }
}
