const REPO = 'Nesved-com/invobuk'

export interface LatestRelease {
  version: string
  url: string
}

function parseVersion(v: string): number[] {
  return v.replace(/^v/i, '').split('.').map(n => parseInt(n, 10) || 0)
}

export function isNewerVersion(latest: string, current: string): boolean {
  const a = parseVersion(latest)
  const b = parseVersion(current)
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const x = a[i] || 0
    const y = b[i] || 0
    if (x > y) return true
    if (x < y) return false
  }
  return false
}

export async function fetchLatestRelease(): Promise<LatestRelease | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`)
    if (!res.ok) return null
    const data = await res.json()
    if (!data.tag_name) return null
    return { version: data.tag_name.replace(/^v/i, ''), url: data.html_url }
  } catch {
    return null
  }
}

export const CURRENT_APP_VERSION = __APP_VERSION__
