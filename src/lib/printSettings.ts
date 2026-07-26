export interface PrintSettings {
  marginTop: number
  marginRight: number
  marginBottom: number
  marginLeft: number
  scale: number // percent, 50-150 — overall zoom
  fontScale: number // percent, 70-130 — text size, multiplies with scale
  pageSize: 'A4' | 'Letter'
  orientation: 'portrait' | 'landscape'
}

export const DEFAULT_PRINT_SETTINGS: PrintSettings = {
  marginTop: 8,
  marginRight: 10,
  marginBottom: 8,
  marginLeft: 10,
  scale: 100,
  fontScale: 100,
  pageSize: 'A4',
  orientation: 'portrait',
}

const STORAGE_KEY = 'invobuk-print-settings'

export function loadPrintSettings(): PrintSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...DEFAULT_PRINT_SETTINGS, ...JSON.parse(raw) }
  } catch {
    // ignore — fall through to defaults
  }
  return { ...DEFAULT_PRINT_SETTINGS }
}

export function savePrintSettings(settings: PrintSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // localStorage unavailable — setting just won't persist across sessions
  }
}

const PAGE_DIMENSIONS_MM: Record<PrintSettings['pageSize'], { width: number; height: number }> = {
  A4: { width: 210, height: 297 },
  Letter: { width: 215.9, height: 279.4 },
}

export function getPageDimensionsMm(pageSize: PrintSettings['pageSize'], orientation: PrintSettings['orientation']) {
  const base = PAGE_DIMENSIONS_MM[pageSize]
  return orientation === 'landscape' ? { width: base.height, height: base.width } : { width: base.width, height: base.height }
}
