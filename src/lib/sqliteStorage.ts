// Renderer-side bridge to the SQLite-backed tables exposed by electron/main.js
// (via preload.js's window.electronDB). Falls back to a single localStorage
// blob per table when running in a plain browser (no Electron) — fine for
// dev, since that environment was never meant to hold real production data.
const isElectron = typeof window !== 'undefined' && !!(window as any).electronDB
const db = isElectron ? (window as any).electronDB : null

interface Identifiable {
  id: string
  createdAt: string
}

function fallbackKey(table: string) {
  return `sqlite-fallback-${table}`
}

async function fallbackGetAll<T>(table: string): Promise<T[]> {
  const raw = localStorage.getItem(fallbackKey(table))
  return raw ? JSON.parse(raw) : []
}

async function fallbackSaveAll<T>(table: string, records: T[]) {
  localStorage.setItem(fallbackKey(table), JSON.stringify(records))
}

export async function dbGetAll<T extends Identifiable>(table: string): Promise<T[]> {
  if (db) return db.getAll(table)
  return fallbackGetAll<T>(table)
}

export async function dbUpsert<T extends Identifiable>(table: string, record: T): Promise<void> {
  if (db) { await db.upsert(table, record); return }
  const all = await fallbackGetAll<T>(table)
  const idx = all.findIndex(r => r.id === record.id)
  if (idx >= 0) all[idx] = record
  else all.unshift(record)
  await fallbackSaveAll(table, all)
}

export async function dbDelete(table: string, id: string): Promise<void> {
  if (db) { await db.remove(table, id); return }
  const all = await fallbackGetAll<any>(table)
  await fallbackSaveAll(table, all.filter((r: any) => r.id !== id))
}

export async function dbBulkInsert<T>(table: string, records: T[]): Promise<void> {
  if (db) { await db.bulkInsert(table, records); return }
  await fallbackSaveAll(table, records)
}

export async function dbCount(table: string): Promise<number> {
  if (db) return db.count(table)
  const all = await fallbackGetAll(table)
  return all.length
}

/**
 * One-time migration: if the SQLite table is empty, pull any existing data out
 * of the old Zustand-persisted JSON store (electron-store / localStorage) and
 * bulk-insert it. Safe to call on every app start — it's a no-op once the
 * table already has rows.
 */
export async function migrateLegacyArrayIfNeeded<T>(
  legacyStoreName: string,
  table: string,
  extractArray: (parsedLegacyBlob: any) => T[] | undefined
): Promise<void> {
  const existingCount = await dbCount(table)
  if (existingCount > 0) return

  const es = isElectron ? (window as any).electronStore : null
  const rawStr = es ? await es.get(legacyStoreName) : localStorage.getItem(legacyStoreName)
  if (!rawStr) return

  try {
    const parsed = JSON.parse(rawStr)
    const arr = extractArray(parsed)
    if (arr && arr.length > 0) {
      await dbBulkInsert(table, arr)
    }
  } catch {
    // Corrupt or unreadable legacy data — nothing to migrate, start fresh.
  }
}
